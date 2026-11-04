"""預告的配樂：用 numpy 合成，不用任何外來音檔（版權乾淨）。
羽調五聲（A C D E G），撥弦像琴、低音持續、雷聲與鼓點跟著 edit.json 的段落走。
用法：python3 music.py edit.json out.wav
"""
import json, sys, wave
import numpy as np

SR = 44100
edit = json.load(open(sys.argv[1], encoding='utf-8'))
fade = edit['fade']
starts, t = {}, 0.0
for i, c in enumerate(edit['clips']):
    starts[c['shot']] = (t, c['dur'], c['from'])
    t += c['dur'] - (fade if i < len(edit['clips']) - 1 else 0)
TOTAL = t
N = int(TOTAL * SR) + SR
L = np.zeros(N); R = np.zeros(N)
rng = np.random.default_rng(7)

def note(n):   # 以 A4 = 440 為 0 的半音數
    return 440.0 * 2 ** (n / 12)
PENTA = [0, 3, 5, 7, 10]   # A C D E G
def deg(k, octave=0):   # 第 k 級（可以超過 5），octave 以 A4 為 0
    return note(PENTA[k % 5] + 12 * (k // 5 + octave))

def add(sig, at, pan=0.0, gain=1.0):
    i = int(at * SR)
    if i >= N: return
    sig = sig[: N - i] * gain
    L[i:i + len(sig)] += sig * np.sqrt(0.5 * (1 - pan))
    R[i:i + len(sig)] += sig * np.sqrt(0.5 * (1 + pan))

def pluck(f, dur=3.0, bright=1.0):   # 撥弦：泛音各自衰減，起音帶一點雜音
    tt = np.arange(int(dur * SR)) / SR
    s = np.zeros_like(tt)
    for n in range(1, 10):
        if f * n > 9000: break
        s += (1 / n ** (1.3 / bright)) * np.sin(2 * np.pi * f * n * tt * (1 + 0.0004 * n)) * np.exp(-tt * (1.2 + 0.9 * n))
    att = np.minimum(1, tt / 0.004)
    noise = rng.standard_normal(len(tt)) * np.exp(-tt * 60) * 0.15
    return (s * att + noise) * 0.35

def bell(f, dur=4.0):   # 鈴：不諧和的泛音，長尾
    tt = np.arange(int(dur * SR)) / SR
    s = sum(a * np.sin(2 * np.pi * f * r * tt) * np.exp(-tt * d) for r, a, d in [(1, 1, 0.9), (2.76, 0.5, 1.6), (5.4, 0.25, 2.6), (8.9, 0.1, 4)])
    return s * np.minimum(1, tt / 0.002) * 0.18

def drone(f, dur, swell=2.0):
    tt = np.arange(int(dur * SR)) / SR
    env = np.minimum(1, tt / swell) * np.minimum(1, (dur - tt) / swell)
    s = np.sin(2 * np.pi * f * tt) + 0.35 * np.sin(2 * np.pi * 2 * f * tt + 0.3) + 0.12 * np.sin(2 * np.pi * 3.01 * f * tt)
    return s * env * (1 + 0.15 * np.sin(2 * np.pi * 0.21 * tt)) * 0.12

def drum(dur=1.2, low=48, high=110):   # 大鼓：音高往下掉
    tt = np.arange(int(dur * SR)) / SR
    f = low + (high - low) * np.exp(-tt * 18)
    ph = 2 * np.pi * np.cumsum(f) / SR
    body = np.sin(ph) * np.exp(-tt * 5)
    hit = rng.standard_normal(len(tt)) * np.exp(-tt * 40) * 0.3
    return (body + hit) * 0.55

def rumble(dur=3.5):   # 雷：棕色雜訊，先炸後滾
    n = int(dur * SR); tt = np.arange(n) / SR
    w = np.cumsum(rng.standard_normal(n)); w -= np.convolve(w, np.ones(2000) / 2000, mode='same'); w /= np.abs(w).max() + 1e-9
    crack = rng.standard_normal(n) * np.exp(-tt * 25) * 0.6
    env = np.minimum(1, tt / 0.02) * np.exp(-tt * 1.1) * (1 + 0.4 * np.sin(2 * np.pi * 3 * tt) * np.exp(-tt))
    return (w * env + crack) * 0.7

def wind(dur):
    n = int(dur * SR); tt = np.arange(n) / SR
    w = rng.standard_normal(n); w = np.convolve(w, np.ones(60) / 60, mode='same')
    env = np.minimum(1, tt / 1.5) * np.minimum(1, (dur - tt) / 1.5) * (0.6 + 0.4 * np.sin(2 * np.pi * 0.17 * tt))
    return w * env * 0.25

def at(shot, rel=0.0):
    s, d, frm = starts[shot]; return s + rel

# 底：整段 A 的低音持續，入夜與共工時加一個 E
add(drone(note(-24), TOTAL, 3.0), 0, 0, 1.0)
add(drone(note(-17), starts['night'][1] + 1, 1.5), at('night', -0.3), -0.2, 0.8)
add(drone(note(-17), starts['gong'][1] + 2, 1.0), at('gong', -0.5), 0.2, 1.0)
add(wind(starts['snow'][1] + 1), at('snow', -0.2), 0.3, 0.9)
add(wind(starts['gaze'][1]), at('gaze'), -0.3, 0.5)

# 開頭：三下撥弦，跟著水的三筆
for k, (rel, d, o) in enumerate([(0.25, 2, 1), (0.85, 4, 0), (2.45, 3, 0)]):
    add(pluck(deg(d, o), 4.0), at('title', rel), [-0.3, 0.3, 0][k], 0.9)
add(bell(deg(4, 1)), at('title', 1.75), 0.2, 0.7)   # 帆出來

# 取木、砌屋：慢慢走的旋律
mel = [0, 2, 3, 4, 3, 2, 4, 5, 7, 5, 4, 2, 3, 4, 2, 0]
t0 = at('gather', 0.1); step = (starts['build'][0] + starts['build'][1] - t0) / len(mel)
for i, k in enumerate(mel):
    add(pluck(deg(k, -1 if k < 5 else -1), 2.5), t0 + i * step, 0.25 * np.sin(i), 0.8)
    if i % 4 == 0: add(pluck(deg(k, -2), 3.0, 0.7), t0 + i * step, -0.2, 0.6)

# 入夜：低、慢，魄出來時三下低的撥弦
for i, k in enumerate([4, 3, 0, 2, 0]):
    add(pluck(deg(k, -2), 4.0, 0.6), at('night', 0.4 + i * 1.4), 0.3 * (-1) ** i, 0.85)
for rel in (70, 110, 150):
    add(bell(deg(1, 0) * 0.5), at('night', rel / 30), 0.4, 0.5)

# 雪：高處稀疏的鈴
for i, k in enumerate([7, 9, 6, 8, 5]):
    add(bell(deg(k, 0)), at('snow', 0.3 + i * 0.85), 0.5 * np.sin(i * 2), 0.6)

# 雷雨：照落雷的那幾幀（shots.mjs：10/70/120 預警、+30 幀落下）
s, d, frm = starts['thunder']
for fr in (40, 100, 150):
    rel = fr / 30 - frm
    if 0 <= rel < d: add(rumble(3.5), s + rel, 0.2 * np.sign(fr - 100), 1.0); add(drum(1.4, 40, 90), s + rel, 0, 0.8)

# 五穀：輕快
mel = [5, 7, 8, 9, 8, 7, 9, 10, 9, 7, 8, 5]
t0 = at('crops', 0.2); step = (starts['crops'][1] - 0.4) / len(mel)
for i, k in enumerate(mel):
    add(pluck(deg(k, -1), 2.0, 1.3), t0 + i * step, 0.3 * np.cos(i), 0.75)

# 觀星：長鈴、慢
for i, k in enumerate([10, 12, 9, 11, 13, 10]):
    add(bell(deg(k, -1)), at('gaze', 0.6 + i * 1.1), 0.6 * np.sin(i * 1.7), 0.55)

# 渡海：鼓點起來
for i in range(8):
    add(drum(0.9, 55, 120), at('sail', 0.2 + i * 0.6), 0, 0.45 if i % 2 else 0.7)
for i, k in enumerate([2, 4, 5, 7, 5, 4, 7, 9]):
    add(pluck(deg(k, -1), 2.2), at('sail', 0.2 + i * 0.6), 0.3 * (-1) ** i, 0.7)

# 共工：鼓越來越密
s, d, _ = starts['gong']; tt = 0.0; gap = 0.6
while tt < d - 0.3:
    add(drum(1.0, 42, 100), s + tt, 0.15 * np.sin(tt * 3), 0.9); tt += gap; gap = max(0.25, gap * 0.9)
for i, k in enumerate([0, 0, 3, 2, 0]):
    add(pluck(deg(k, -2), 3.0, 0.6), s + i * 1.2, 0, 0.8)

# 結尾：收在 A
e = at('end', 0.1)
for k, o in [(0, -2), (2, -1), (3, -1), (0, 0)]:
    add(pluck(deg(k, o), 5.0, 0.8), e, 0.2 * o, 0.8)
add(bell(deg(0, 1)), e + 0.6, 0, 0.6)

# 殘響：指數衰減的雜音當脈衝響應（FFT 摺積）
ir_n = int(1.8 * SR); tt = np.arange(ir_n) / SR
irL = rng.standard_normal(ir_n) * np.exp(-tt * 3.2); irR = rng.standard_normal(ir_n) * np.exp(-tt * 3.2)
irL[0] = irR[0] = 0
def conv(x, ir):
    n = len(x) + len(ir); m = 1 << (n - 1).bit_length()
    return np.fft.irfft(np.fft.rfft(x, m) * np.fft.rfft(ir, m), m)[: len(x)]
wetL = conv(L, irL); wetR = conv(R, irR)
k = 0.035
outL = L + wetL * k; outR = R + wetR * k
# 收尾淡出、整體音量
n_end = int(TOTAL * SR); fade_n = int(1.5 * SR)
env = np.ones(N); env[n_end - fade_n:n_end] = np.linspace(1, 0, fade_n); env[n_end:] = 0
outL *= env; outR *= env
peak = max(np.abs(outL).max(), np.abs(outR).max())
outL = outL / peak * 0.85; outR = outR / peak * 0.85
pcm = (np.stack([outL[:n_end], outR[:n_end]], 1) * 32767).astype('<i2')
with wave.open(sys.argv[2], 'wb') as w:
    w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR); w.writeframes(pcm.tobytes())
print('music', round(TOTAL, 2), 's')
