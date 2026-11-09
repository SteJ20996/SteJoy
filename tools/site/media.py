"""把錄好的鏡頭與剪好的預告壓成網站用的檔：
  assets/media/scenes/<鏡頭>.mp4 與 .jpg（試玩場景，1280×720、無聲、循環）
  assets/media/stills/<鏡頭>.jpg（完整版的四張圖，960×540）
  assets/media/trailer.mp4、trailer.jpg、trailer.<語言>.vtt（網站上的預告與字幕）
用法（在庫的根目錄）：python3 tools/site/media.py <鏡頭資料夾> <預告資料夾> [--trailer]
  --trailer 只重壓預告（片頭換了、場景沒動的時候用，試玩場景與四張圖照舊）
"""
import shutil, subprocess, sys, json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
SHOTS, TRAILER = Path(sys.argv[1]), Path(sys.argv[2])
ONLY_TRAILER = '--trailer' in sys.argv
M = ROOT / 'assets/media'
(M / 'scenes').mkdir(parents=True, exist_ok=True); (M / 'stills').mkdir(parents=True, exist_ok=True)

def ff(*a):
    subprocess.run(['ffmpeg', '-y', '-loglevel', 'error', *a], check=True)

# 試玩場景：從哪一息起、多長、海報取第幾息
SCENES = {'gather': (0.5, 5.0, 2.6), 'build': (0.2, 5.4, 5.0), 'snow': (0.4, 5.2, 3.0), 'night': (1.0, 7.8, 6.6), 'gaze': (0.8, 8.6, 8.8), 'zi': (0.6, 5.3, 1.7)}   # 觀星：2026-11-06 抬頭放慢，從抬頭前一點起、抬完再看幾息星；造字：2026-11-09 加，海報取字民剛走出字典、粟飄起來那一格
for s, (a, d, p) in ({} if ONLY_TRAILER else SCENES).items():
    src = SHOTS / f'{s}.mp4'
    ff('-ss', str(a), '-t', str(d), '-i', str(src), '-an', '-vf', 'scale=1280:720:flags=lanczos,format=yuv420p',
       '-c:v', 'libx264', '-preset', 'slow', '-crf', '27', '-profile:v', 'high', '-movflags', '+faststart', str(M / 'scenes' / f'{s}.mp4'))
    ff('-i', str(M / 'scenes' / f'{s}.mp4'), '-c:v', 'libvpx-vp9', '-crf', '40', '-b:v', '0', '-row-mt', '1', '-deadline', 'good', '-cpu-used', '2', '-an', str(M / 'scenes' / f'{s}.webm'))   # 放不了 H.264 的瀏覽器用
    ff('-ss', str(p), '-i', str(src), '-frames:v', '1', '-vf', 'scale=1280:720:flags=lanczos', '-q:v', '4', str(M / 'scenes' / f'{s}.jpg'))

# 完整版：一張圖
STILLS = {'thunder': 0.5, 'crops': 5.6, 'sail': 4.0, 'gong': 5.5}
_ev = SHOTS / 'thunder.events.json'   # 雷雨那張取第一道雷劈到地上的下一格（落下那一格是整片白光）；錄鏡頭時記下的幀
if _ev.exists():
    import json
    _st = json.loads(_ev.read_text(encoding='utf-8')).get('strikes') or []
    if _st: STILLS['thunder'] = round((_st[0] + 1) / 30 + 0.01, 3)
for s, t in ({} if ONLY_TRAILER else STILLS).items():
    ff('-ss', str(t), '-i', str(SHOTS / f'{s}.mp4'), '-frames:v', '1', '-vf', 'scale=960:540:flags=lanczos', '-q:v', '4', str(M / 'stills' / f'{s}.jpg'))

# 預告：海報用結尾那一格（字標）
# 網站放的預告再壓一次（CRF 27，約 17 MB；Cloudflare Pages 一個檔最多 25 MiB），放大看跟原檔幾乎一樣
ff('-i', str(TRAILER / 'trailer.mp4'), '-c:v', 'libx264', '-preset', 'slow', '-crf', '27', '-profile:v', 'high', '-pix_fmt', 'yuv420p',
   '-movflags', '+faststart', '-c:a', 'aac', '-b:a', '128k', str(M / 'trailer.mp4'))
ff('-i', str(TRAILER / 'trailer.mp4'), '-c:v', 'libvpx-vp9', '-crf', '42', '-b:v', '0', '-row-mt', '1', '-deadline', 'good', '-cpu-used', '2',
   '-c:a', 'libopus', '-b:a', '112k', str(M / 'trailer.webm'))   # 同一支的 WebM（約 14 MB）
for lang in ('zh-Hant', 'zh-Hans', 'en', 'ja'):
    shutil.copy(TRAILER / f'trailer.{lang}.vtt', M / f'trailer.{lang}.vtt')
ff('-sseof', '-1.5', '-i', str(TRAILER / 'trailer.mp4'), '-frames:v', '1', '-vf', 'scale=1280:720:flags=lanczos', '-q:v', '3', str(M / 'trailer.jpg'))

for f in sorted(M.rglob('*')):
    if f.is_file(): print(f'{f.relative_to(ROOT)}  {f.stat().st_size / 1e6:.2f} MB')
