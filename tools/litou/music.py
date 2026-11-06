"""《力透紙背》預告的配樂：用 numpy 合成，不用任何外來音檔（版權乾淨；跟 tools/trailer/music.py 同一個做法，是暫用的）。
要的是力道：每一刀剪接一記鼓；遊戲裡寫下的每一筆一聲筆刷（錄鏡頭時記下的那一幀，<鏡頭資料夾>/<鏡頭>.events.json）；
撥弦照五聲往上走，每進一維高一層；升維的轉場底下是一道一直往上、卻永遠升不完的 Shepard 音（無窮）。
用法：python3 tools/litou/music.py tools/litou/edit.json out.wav <鏡頭資料夾>
不刺耳（使用者聽了說「背景樂有點刺耳」，量過是撥弦：原本每進一維高一個八度，三、四維的音落在 1.8–10 kHz，2–6 kHz 的能量九成四是它）：撥弦從 A2 起、每進一維高兩到三個五聲音級，最高約 1.3 kHz（使用者聽了說 1 kHz 有點低、可以到 1400 Hz），泛音只到 5 kHz；鼓、鼓邊、筆刷的雜音都先濾掉高頻；整首最後再過一道柔和的低通。
升維的轉場底下原本是 Shepard 音（一直往上滑），使用者說聽起來像急救車：滑音就是警笛，改成一顆一顆的五聲音往上走（兩層錯開半圈，一層淡出時另一層接上，還是「升不完」，但是一個一個音，不是滑的），底下一陣風聲。
"""
import json, os, sys, wave
import numpy as np

SR = 44100
edit = json.load(open(sys.argv[1], encoding='utf-8'))
SHOTS = sys.argv[3] if len(sys.argv) > 3 else None
fade = edit['fade']
clips, t = [], 0.0
for i, c in enumerate(edit['clips']):
    clips.append((c['shot'], t, c['dur'], c['from']))
    t += c['dur'] - (fade if i < len(edit['clips']) - 1 else 0)
TOTAL = t
N = int(TOTAL * SR) + SR
L = np.zeros(N); R = np.zeros(N)
rng = np.random.default_rng(3)

def add(sig, at, pan=0.0, gain=1.0):
    i = int(max(0, at) * SR)
    if i >= N: return
    sig = sig[: N - i] * gain
    L[i:i + len(sig)] += sig * np.sqrt(0.5 * (1 - pan)); R[i:i + len(sig)] += sig * np.sqrt(0.5 * (1 + pan))

def env_t(dur): return np.arange(int(dur * SR)) / SR
def lp(x, fc):   # 高斯低通（約在 fc 以上滾降），雜音用：白雜訊直接聽是嘶嘶的
    sg = SR / (2 * np.pi * fc); r = int(4 * sg) + 1
    k = np.exp(-np.arange(-r, r + 1) ** 2 / (2 * sg * sg)); return np.convolve(x, k / k.sum(), 'same')
def noise(n, fc): return lp(rng.standard_normal(n), fc) * np.sqrt(SR / (2.5 * fc))   # 濾過還保留差不多的響度
def note(n): return 440.0 * 2 ** (n / 12)
PENTA = [0, 3, 5, 7, 10]   # 羽調：A C D E G
def deg(k, octave=0): return note(PENTA[k % 5] + 12 * (k // 5 + octave))

def drum(big=1.0):   # 大鼓：低音往下掉、皮面的雜音
    tt = env_t(1.2)
    f = 46 + 70 * np.exp(-tt * 18)
    body = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-tt * (4.2 / big))
    skin = noise(len(tt), 2200) * np.exp(-tt * 45) * 0.3
    return (body + skin) * 0.55 * big

def rim():   # 鼓邊：短而硬
    tt = env_t(0.12)
    return (np.sin(2 * np.pi * 620 * tt) * 0.5 + noise(len(tt), 3000) * 0.5) * np.exp(-tt * 60) * 0.15

def brush(pan=0.0):   # 一筆：帶通的沙沙聲，先重後輕（像筆鋒掃過紙）
    tt = env_t(0.22)
    n = rng.standard_normal(len(tt))
    n = lp(n - lp(n, 500), 3200) * 1.8            # 只留 0.5–3.2 kHz：紙上的沙沙聲，不是嘶嘶聲
    e = np.minimum(1, tt / 0.012) * np.exp(-tt * 16)
    return n * e * 0.13

def pluck(f, dur=2.6, bright=1.0):
    tt = env_t(dur); s = np.zeros_like(tt)
    for n in range(1, 9):
        if f * n > 5000: break                    # 泛音只到 5 kHz
        s += (1 / n ** (1.7 / bright)) * np.sin(2 * np.pi * f * n * tt * (1 + 0.0004 * n)) * np.exp(-tt * (1.2 + 1.5 * n))
    return (s * np.minimum(1, tt / 0.006) + noise(len(tt), 1800) * np.exp(-tt * 60) * 0.08) * 0.42

def drone(f, dur, swell=1.2):
    tt = env_t(dur); e = np.minimum(1, tt / swell) * np.minimum(1, (dur - tt) / swell)
    s = np.sin(2 * np.pi * f * tt) + 0.4 * np.sin(2 * np.pi * 1.5 * f * tt) + 0.2 * np.sin(2 * np.pi * 2 * f * tt + .4)
    return s * e * (1 + 0.12 * np.sin(2 * np.pi * 0.3 * tt)) * 0.08

def bell(f, dur=0.9):   # 一顆軟的鈴：基音加一點二倍音，敲下去就慢慢散
    tt = env_t(dur)
    return (np.sin(2 * np.pi * f * tt) + 0.25 * np.sin(2 * np.pi * 2 * f * tt)) * np.minimum(1, tt / 0.01) * np.exp(-tt * 4.5)

def rise(dur):   # 升不完：五聲音一顆一顆往上走（0.18 息一顆、十顆兩個八度、A3–A5），兩層錯開半圈，照在圈裡的位置淡入淡出；不滑音，聽起來不是警笛
    out = np.zeros(int(dur * SR) + SR); step = 0.18
    for j in range(int(dur / step)):
        for off in (0, 5):
            pos = ((j + off) % 10) / 10
            amp = np.exp(-((pos - 0.5) ** 2) / 0.06)
            b = bell(deg((j + off) % 10, -1)) * amp
            i = int(j * step * SR); out[i:i + len(b)] += b[: len(out) - i]
    tt = np.arange(len(out)) / SR
    wind = noise(len(out), 900) * np.minimum(1, tt / 1.0) * np.clip((dur + 0.6 - tt) / 1.2, 0, 1) * 0.05   # 底下一陣風
    e = np.minimum(1, tt / 0.4) * np.clip((dur + 0.4 - tt) / 0.6, 0, 1)
    return (out * 0.03 + wind) * e

def gong(f=98, dur=6.0):
    tt = env_t(dur)
    s = sum(a * np.sin(2 * np.pi * f * r * tt + r) * np.exp(-tt * d) for r, a, d in [(1, 1, .5), (1.48, .6, .7), (2.02, .4, .9), (2.74, .3, 1.3), (3.9, .15, 2)])
    return s * np.minimum(1, tt / 0.01) * 0.16

def events(shot):
    if not SHOTS: return None
    f = os.path.join(SHOTS, shot + '.events.json')
    return json.load(open(f, encoding='utf-8')) if os.path.exists(f) else None

# 每一段在第幾維：零維（點）到四維；決定撥弦的音高與鼓的密度
DIM = {'title': 0, 'point': 0, 'line': 1, 'ring': 1, 'page': 2, 'flip': 2, 'mobius': 2, 'fold': 2, 'cube': 3, 'tess': 3, 'thunder': 3, 'hyper': 3, 'four': 4, 'end': 4}
SHIFTS = {'ring', 'fold', 'hyper', 'tess', 'mobius', 'flip'}
BEAT = 60 / 96

for i, (shot, at, dur, frm) in enumerate(clips):
    d = DIM.get(shot, 0)
    # 剪接：一記大鼓（片頭片尾更大）
    if shot == 'title': add(drum(1.6), at + 0.42, 0, 1.2); add(gong(73), at + 0.5, 0, 0.8)
    elif shot == 'end': add(drum(1.8), at + 0.2, 0, 1.2); add(gong(73, 7), at + 0.25, 0, 1.0)
    else: add(drum(1.0 + 0.1 * d), at + 0.02, 0, 0.9)
    # 底下的持續音：每一維換一個根音、往上走
    add(drone(note(-36 + [0, 3, 5, 7, 12][d]), dur + 0.8), at, 0, 1.0)
    if shot in SHIFTS: add(rise(dur + 0.3), at, 0, 1.0)
    # 鼓點：維度越高越密
    nb = int(dur / BEAT)
    for b in range(1, nb + 1):
        tb = at + b * BEAT
        if d >= 2 and b % 2 == 0: add(drum(0.7), tb, -0.1, 0.45)
        if d >= 1 and b % 2 == 1: add(rim(), tb + BEAT / 2, 0.3, 0.9)
        if d >= 3: add(rim(), tb + BEAT * 0.75, -0.3, 0.6)
    # 撥弦：每段四個音，越往後越高——從 A2（110 Hz）起，每進一維高兩到三個五聲音級（0、3、5、8、10），最高約 1.3 kHz（原本一維高一個八度，四維就到 10 kHz）
    for k in range(4):
        add(pluck(deg(2 * k + (i % 3) + int(2.5 * d + 0.5), -2)), at + 0.3 + k * BEAT * 1.5, (k % 2) * 0.6 - 0.3, 0.8)
    # 遊戲裡寫下的每一筆：一聲筆刷；成字、正字再加一記鼓邊
    ev = events(shot)
    if ev:
        for f in ev.get('strokes', []):
            ts = f / 30 - frm
            if 0 <= ts <= dur: add(brush(rng.uniform(-0.5, 0.5)), at + ts, 0, 1.0)
        for f in ev.get('casts', []) + ev.get('zheng', []):
            ts = f / 30 - frm
            if 0 <= ts <= dur: add(rim(), at + ts, 0, 1.2); add(pluck(deg(8 + 2 * d, -2)), at + ts, 0.2, 0.5)   # 成字一聲：0.6–1 kHz

mix = np.stack([L, R], 1)[: int((TOTAL + 0.2) * SR)]
# 整首過一道柔和的低通（零相位，約 8 kHz 起、每八度降 12 dB）：合成的東西高頻乾而硬，留著就刺耳
F = np.fft.rfftfreq(len(mix), 1 / SR)[:, None]
mix = np.fft.irfft(np.fft.rfft(mix, axis=0) / np.sqrt(1 + (F / 8000) ** 4), n=len(mix), axis=0)
tail = np.minimum(1, (len(mix) / SR - np.arange(len(mix)) / SR) / 1.2)[:, None]
mix *= tail
mix /= max(1e-9, np.abs(mix).max()) / 0.72   # 峰值約 −2.9 dBFS，整首約 −21 LUFS：跟改之前一樣大聲，只是不刺耳
with wave.open(sys.argv[2], 'wb') as w:
    w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR)
    w.writeframes((mix * 32767).astype('<i2').tobytes())
print(sys.argv[2], f'{TOTAL:.2f}s')
