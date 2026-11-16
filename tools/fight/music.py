"""第二支預告的配樂（2026-11-16 使用者定：先用合成的、恢宏一些、節奏比第一支快）：numpy 合成，不用任何外來音檔。
跟第一支同一個調（羽調五聲 A C D E G，和聲走 Am F C G），但拍子快（每分鐘一百二十拍）、鼓重：
開場低鳴、九閽鳴雷落下一記重擊；片頭撥弦寫水；小魔王一段太鼓八分音符、弦樂斷奏、銅管在每一記重擊上；
大魔王前一段上揚的音牆，接著鼓加倍、銅管和弦、人聲般的長音；共工一段鼓越來越密、弦樂顫音；片尾一個大和弦。
重擊對齊錄鏡頭時記下的那一幀（<鏡頭資料夾>/<鏡頭>.events.json 的 hits，遊戲畫面震動突然變大的那一幀）。
用法：python3 tools/fight/music.py tools/fight/edit.json out.wav <鏡頭資料夾>
"""
import json, os, sys, wave
import numpy as np

SR = 44100
FPS = 30
edit = json.load(open(sys.argv[1], encoding='utf-8'))
fade = edit['fade']
starts, t = {}, 0.0
order = []
for i, c in enumerate(edit['clips']):
    key = c.get('as') or c['shot']
    starts[key] = (t, c['dur'], c['from'], c['shot'])
    order.append(key)
    t += c['dur'] - (fade if i < len(edit['clips']) - 1 else 0)
TOTAL = t
N = int(TOTAL * SR) + 2 * SR
L = np.zeros(N); R = np.zeros(N)
rng = np.random.default_rng(16)
SHOTS = sys.argv[3] if len(sys.argv) > 3 else None
BPM = 120.0; BEAT = 60.0 / BPM

def events(shot):
    if not SHOTS: return None
    f = os.path.join(SHOTS, shot + '.events.json')
    return json.load(open(f, encoding='utf-8')) if os.path.exists(f) else None

def note(n): return 440.0 * 2 ** (n / 12)   # A4 = 0
PENTA = [0, 3, 5, 7, 10]
def deg(k, octave=0): return note(PENTA[k % 5] + 12 * (k // 5 + octave))

def add(sig, at, pan=0.0, gain=1.0):
    i = int(at * SR)
    if i >= N or i + len(sig) <= 0: return
    if i < 0: sig = sig[-i:]; i = 0
    sig = sig[: N - i] * gain
    L[i:i + len(sig)] += sig * np.sqrt(0.5 * (1 - pan))
    R[i:i + len(sig)] += sig * np.sqrt(0.5 * (1 + pan))

def tt(dur): return np.arange(int(dur * SR)) / SR

def lowpass(x, fc):
    a = np.exp(-2 * np.pi * fc / SR)
    ir = (1 - a) * a ** np.arange(int(np.ceil(np.log(1e-5) / np.log(a))) + 1)
    return np.convolve(x, ir)[: len(x)]

def sweep_lp(x, f0, f1, open_t=0.35):   # 銅管「開口」：暗的與亮的兩份低通，起音後 open_t 息內由暗交叉到亮
    n = len(x); w = np.minimum(1, np.arange(n) / SR / open_t) ** 0.7
    return lowpass(x, f0) * (1 - w) + lowpass(x, f1) * w

def saw(f, t):
    ph = (f * t) % 1.0
    return 2 * ph - 1

def pluck(f, dur=2.0, bright=1.0):
    t = tt(dur); s = np.zeros_like(t)
    for n in range(1, 10):
        if f * n > 9000: break
        s += (1 / n ** (1.3 / bright)) * np.sin(2 * np.pi * f * n * t * (1 + 0.0004 * n)) * np.exp(-t * (1.2 + 0.9 * n))
    return (s * np.minimum(1, t / 0.004) + rng.standard_normal(len(t)) * np.exp(-t * 60) * 0.15) * 0.35

def bell(f, dur=3.0):
    t = tt(dur)
    s = sum(a * np.sin(2 * np.pi * f * r * t) * np.exp(-t * d) for r, a, d in [(1, 1, 0.9), (2.76, 0.5, 1.6), (5.4, 0.25, 2.6), (8.9, 0.1, 4)])
    return s * np.minimum(1, t / 0.002) * 0.18

def taiko(dur=1.0, low=46, high=120, gain=1.0):   # 太鼓：音高往下掉的鼓身＋敲擊的雜音
    t = tt(dur); f = low + (high - low) * np.exp(-t * 22)
    body = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t * 6)
    hit = lowpass(rng.standard_normal(len(t)), 2500) * np.exp(-t * 45) * 0.9
    return (body + hit) * 0.6 * gain

def rim(dur=0.25):   # 鼓邊：短而乾
    t = tt(dur); x = rng.standard_normal(len(t)); x = x - lowpass(x, 1800)
    return (x * np.exp(-t * 70) * 0.5 + np.sin(2 * np.pi * 410 * t) * np.exp(-t * 50) * 0.3) * 0.5

def brass(freqs, dur, att=0.08, rel=0.4, open_=(500, 3200)):   # 銅管：三個稍微走音的鋸齒波，低通由暗打開
    t = tt(dur); x = np.zeros_like(t)
    for f in freqs:
        for d in (-0.006, 0, 0.007): x += saw(f * (1 + d), t)
    x /= 3 * len(freqs)
    env = np.minimum(1, t / att) * np.minimum(1, np.maximum(0, (dur - t) / rel))
    y = sweep_lp(x * env, open_[0], open_[1])
    return y * 0.55

def strings(freqs, dur, trem=0.0):   # 弦樂長音（可加顫音）：鋸齒波、柔一點的低通、慢起
    t = tt(dur); x = np.zeros_like(t)
    for f in freqs:
        vib = 1 + 0.004 * np.sin(2 * np.pi * 5.2 * t + f)
        for d in (-0.004, 0.004): x += saw(f * (1 + d) * vib, t)
    x /= 2 * len(freqs)
    if trem: x *= 0.6 + 0.4 * np.sign(np.sin(2 * np.pi * trem * t))
    env = np.minimum(1, t / 0.25) * np.minimum(1, (dur - t) / 0.3)
    return lowpass(x * env, 2200) * 0.5

def stacc(f, dur=0.18):   # 弦樂斷奏
    t = tt(dur); x = saw(f, t) + saw(f * 1.004, t)
    return lowpass(x * np.exp(-t * 14) * np.minimum(1, t / 0.006), 1800) * 0.32

def choir(freqs, dur):   # 人聲般的長音：正弦疊幾個泛音、慢顫
    t = tt(dur); x = np.zeros_like(t)
    for f in freqs:
        vib = 1 + 0.006 * np.sin(2 * np.pi * 4.6 * t + f * 0.01)
        for h, a in ((1, 1), (2, 0.45), (3, 0.25), (4, 0.12)): x += a * np.sin(2 * np.pi * f * h * vib * t)
    env = np.minimum(1, t / 0.6) * np.minimum(1, (dur - t) / 0.6)
    return x / len(freqs) * env * 0.14

def boom(dur=2.4):   # 重擊：次低頻往下掉＋爆裂＋長尾
    t = tt(dur); f = 30 + 70 * np.exp(-t * 7)
    sub = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t * 2.2)
    x = rng.standard_normal(len(t)); crack = (x - lowpass(x, 1500)) * np.exp(-t * 28) * 0.5
    tail = lowpass(rng.standard_normal(len(t)), 300) * np.exp(-t * 1.6) * 0.8
    return (sub * 1.1 + crack + tail * 0.6) * 0.75

def riser(dur):   # 上揚的音牆：雜音的頻帶與一個正弦一起往上爬
    t = tt(dur); u = t / dur
    x = rng.standard_normal(len(t)); lo = lowpass(x, 600) - lowpass(x, 150); hi = lowpass(x, 6000) - lowpass(x, 1200); band = lo * (1 - u ** 1.5) + hi * u ** 1.5   # 頻帶由低往高爬
    f = 110 * 2 ** (u * 2.5); tone = np.sin(2 * np.pi * np.cumsum(f) / SR) * 0.25
    return (band * 0.5 + tone) * u ** 1.6 * 0.6

def drone(f, dur, swell=1.5):
    t = tt(dur); env = np.minimum(1, t / swell) * np.minimum(1, (dur - t) / swell)
    return (np.sin(2 * np.pi * f * t) + 0.4 * np.sin(2 * np.pi * 2 * f * t + 0.3) + 0.15 * np.sin(2 * np.pi * 3.01 * f * t)) * env * 0.16

def at(key, rel=0.0): return starts[key][0] + rel

def hits(key):   # 這一段裡的重擊落在成片的第幾秒（只算畫面裡看得到的）
    s, d, frm, shot = starts[key]; ev = events(shot); out = []
    for h in (ev or {}).get('hits', []):
        rel = h[0] / FPS - frm
        if 0 <= rel < d: out.append((s + rel, h[1]))
    return out

A, F, C, G, E = -24, -28, -21, -26, -17   # 和弦的根音（A2 以下）
CHORD = {A: [0, 3, 7], F: [0, 4, 7], C: [0, 4, 7], G: [0, 4, 7], E: [0, 3, 7]}
def chord(root, octv=1): return [note(root + 12 * octv + i) for i in CHORD[root]]

# ---- 開場：低鳴，九閽鳴雷落下的那一記 ----
s0 = at('hammer'); dH = starts['hammer'][1]
add(drone(note(-36), dH + 0.6, 1.0), s0, 0, 1.0)
add(riser(min(1.6, dH)), s0 + 0.1, 0, 0.5)
for tm, k in hits('hammer'):
    if k >= 0.58: add(boom(2.6), tm, 0, 1.2); add(taiko(1.2, 40, 110, 1.3), tm, 0, 1.0)

# ---- 片頭：撥弦寫水（片頭放快 1.4 倍），尾巴一記太鼓 ----
SP = 1.4
for k, (tm, d, o, g) in enumerate([(0.10, 2, 1, 0.9), (0.76, 4, 0, 0.9), (1.32, 3, 0, 0.9), (2.12, 1, 0, 0.55), (3.22, 0, 0, 0.95)]):
    add(pluck(deg(d, o), 3.0), at('title', tm / SP), [-0.3, 0.3, 0, 0.15, 0][k], g)
add(bell(deg(4, 1)), at('title', 2.68 / SP), 0.2, 0.6)
add(strings(chord(A, 1), starts['title'][1] + 0.4), at('title'), 0, 0.5)

# ---- 小魔王一段：太鼓八分音符、弦樂斷奏、銅管落在重擊上 ----
mini = [k for k in order if k in ('tiger', 'ge', 'harpy', 'tooth', 'bifang', 'shen')]
m0 = at(mini[0]); m1 = at(mini[-1]) + starts[mini[-1]][1]
prog = [A, F, C, G]
b = 0; tm = m0
while tm < m1 - 0.05:
    bar = int(b // 8); root = prog[bar % 4]
    pat = b % 8
    if pat in (0, 3, 6): add(taiko(0.9, 50, 120, 0.9 if pat == 0 else 0.6), tm, 0.1 * np.sin(b), 1.0)
    if pat in (2, 5, 7): add(rim(), tm, 0.35 * ((-1) ** b), 0.7)
    add(stacc(note(root + 12 + CHORD[root][[0, 2, 1, 2][b % 4]])), tm, 0.25 * np.sin(b * 1.7), 0.9)
    if pat == 0: add(strings([note(root + 12)], BEAT * 8 + 0.2), tm, -0.2, 0.55); add(brass(chord(root, 1), BEAT * 1.6, 0.04, 0.5, (400, 1600)), tm, 0.2, 0.35)
    b += 1; tm += BEAT / 2
for k in mini:   # 出手（0.3）：鼓一記加銅管短奏；神兵的重擊（≥0.58）：再加一記低沉的重擊
    for th, kk in hits(k):
        add(taiko(1.0, 44, 115, 1.1), th, 0, 0.8); add(brass(chord(A, 1) + [note(-12)], 0.5 if kk < 0.58 else 0.9, 0.02, 0.4, (900, 4200)), th, 0, 0.35 if kk < 0.58 else 0.55)
        if kk >= 0.58: add(boom(1.8), th, 0, 0.8)

# ---- 大魔王前：上揚的音牆 ----
boss = [k for k in order if k in ('hog', 'snake', 'wind')]
b0 = at(boss[0]); b1 = at(boss[-1]) + starts[boss[-1]][1]
add(riser(1.6), b0 - 1.6, 0, 0.9)
add(boom(2.2), b0, 0, 0.9)

# ---- 大魔王一段：鼓加倍、銅管和弦、人聲長音 ----
b = 0; tm = b0
prog2 = [A, F, G, E]
while tm < b1 - 0.05:
    bar = int(b // 8); root = prog2[bar % 4]; pat = b % 8
    if pat in (0, 2, 3, 4, 6): add(taiko(0.9, 44, 118, 1.0 if pat in (0, 4) else 0.7), tm, 0.12 * np.sin(b), 1.0)
    if pat in (1, 5, 7): add(rim(), tm, 0.3 * ((-1) ** b), 0.8)
    add(stacc(note(root + 12 + CHORD[root][b % 3]), 0.16), tm, 0.3 * np.sin(b * 1.3), 0.95)
    if pat == 0:
        add(brass(chord(root, 1) + [note(root + 24)], BEAT * 3.6, 0.12, 0.6, (500, 3000)), tm, 0, 0.6)
        add(choir(chord(root, 2), BEAT * 8 + 0.4), tm, 0, 1.0)
    b += 1; tm += BEAT / 2
for k in boss:
    for th, kk in hits(k):
        if kk >= 0.58: add(boom(1.8), th, 0, 0.8); add(brass(chord(A, 1) + [note(-12)], 1.0, 0.02, 0.6, (900, 4500)), th, 0, 0.6)
        else: add(taiko(0.9, 46, 118, 1.0), th, 0, 0.7)

# ---- 共工：鼓越來越密、弦樂顫音、最後一記 ----
gong = [k for k in order if k.startswith('gong')]
g0 = at(gong[0]); g1 = at(gong[-1]) + starts[gong[-1]][1]
add(boom(2.4), g0, 0, 1.0)
add(strings(chord(A, 2), g1 - g0, trem=12), g0, 0, 0.55)
add(choir(chord(A, 2) + [note(-5)], g1 - g0), g0, 0, 1.1)
tm = g0; gap = BEAT; i = 0
while tm < g1 - 0.1:
    add(taiko(0.8, 44, 120, 1.0), tm, 0.15 * np.sin(i), 1.0); i += 1; tm += gap; gap = max(BEAT / 4, gap * 0.94)
for k, root in zip(gong, [A, F, G]):
    add(brass(chord(root, 1) + [note(root + 24)], starts[k][1], 0.1, 0.5, (500, 3600)), at(k), 0, 0.6)
    for th, kk in hits(k):
        if kk >= 0.58: add(boom(1.8), th, 0, 0.9)
        else: add(taiko(0.8, 46, 118, 1.0), th, 0, 0.6)

# ---- 片尾：一個大和弦、鈴、收在 A ----
e = at('end')
add(boom(3.0), e, 0, 1.2)
add(brass(chord(A, 1) + [note(-12), note(0)], starts['end'][1] + 0.5, 0.05, 1.8, (900, 3800)), e, 0, 0.9)
add(choir(chord(A, 2), starts['end'][1] + 0.5), e, 0, 1.2)
add(strings(chord(A, 1) + [note(0)], starts['end'][1] + 0.5), e, 0, 0.6)
for k, o in [(0, -1), (2, 0), (3, 0), (0, 1)]: add(pluck(deg(k, o), 4.0, 0.8), e + 0.05, 0.2 * o, 0.8)
add(bell(deg(0, 1)), e + 0.7, 0, 0.6)

# 殘響、整體音量、收尾淡出
ir_n = int(2.2 * SR); t = np.arange(ir_n) / SR
irL = rng.standard_normal(ir_n) * np.exp(-t * 2.6); irR = rng.standard_normal(ir_n) * np.exp(-t * 2.6); irL[0] = irR[0] = 0
def conv(x, ir):
    n = len(x) + len(ir); m = 1 << (n - 1).bit_length()
    return np.fft.irfft(np.fft.rfft(x, m) * np.fft.rfft(ir, m), m)[: len(x)]
outL = L + conv(L, irL) * 0.03; outR = R + conv(R, irR) * 0.03
n_end = int(TOTAL * SR); fn = int(1.5 * SR)
env = np.ones(N); env[n_end - fn:n_end] = np.linspace(1, 0, fn); env[n_end:] = 0
outL *= env; outR *= env
peak = max(np.abs(outL).max(), np.abs(outR).max())
DRIVE = 2.6; outL = np.tanh(outL / peak * DRIVE) / np.tanh(DRIVE) * 0.9; outR = np.tanh(outR / peak * DRIVE) / np.tanh(DRIVE) * 0.9   # 壓峰值、整體推響（預告的音量要夠），鼓與銅管更厚
pcm = (np.stack([outL[:n_end], outR[:n_end]], 1) * 32767).astype('<i2')
with wave.open(sys.argv[2], 'wb') as w:
    w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR); w.writeframes(pcm.tobytes())
print('music', round(TOTAL, 2), 's; hits', {k: [round(x[0], 2) for x in hits(k)] for k in order if hits(k)})
