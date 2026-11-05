"""把《力透紙背》錄好的鏡頭與剪好的預告壓成網站用的檔（做法同 tools/site/media.py）：
  assets/media/litou/scenes/<鏡頭>.mp4、.webm、.jpg（一卷五章旁邊的實機片段，1280×720、無聲、循環）
  assets/media/litou/trailer.mp4、.webm、.jpg、trailer.<語言>.vtt
用法（在庫的根目錄）：python3 tools/litou/media.py <鏡頭資料夾> <預告資料夾> [--trailer]
"""
import shutil, subprocess, sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
SHOTS, TRAILER = Path(sys.argv[1]), Path(sys.argv[2])
ONLY_TRAILER = '--trailer' in sys.argv
M = ROOT / 'assets/media/litou'
(M / 'scenes').mkdir(parents=True, exist_ok=True)

def ff(*a):
    subprocess.run(['ffmpeg', '-y', '-loglevel', 'error', *a], check=True)

# 一卷五章：從哪一息起、多長、海報取第幾息（序章、一維、二維莫比烏斯、三維超正方體、四維）
SCENES = {'point': (0.3, 6.4, 2.0), 'line': (0.5, 4.8, 3.2), 'mobius': (0.0, 5.4, 2.0), 'tess': (0.0, 5.4, 1.6), 'hyper': (0.0, 5.0, 1.0)}
for s, (a, d, p) in ({} if ONLY_TRAILER else SCENES).items():
    src = SHOTS / f'{s}.mp4'
    ff('-ss', str(a), '-t', str(d), '-i', str(src), '-an', '-vf', 'scale=1280:720:flags=lanczos,format=yuv420p',
       '-c:v', 'libx264', '-preset', 'slow', '-crf', '27', '-profile:v', 'high', '-movflags', '+faststart', str(M / 'scenes' / f'{s}.mp4'))
    ff('-i', str(M / 'scenes' / f'{s}.mp4'), '-c:v', 'libvpx-vp9', '-crf', '40', '-b:v', '0', '-row-mt', '1', '-deadline', 'good', '-cpu-used', '2', '-an', str(M / 'scenes' / f'{s}.webm'))
    ff('-ss', str(p), '-i', str(src), '-frames:v', '1', '-vf', 'scale=1280:720:flags=lanczos', '-q:v', '4', str(M / 'scenes' / f'{s}.jpg'))

ff('-i', str(TRAILER / 'trailer.mp4'), '-c:v', 'libx264', '-preset', 'slow', '-crf', '27', '-profile:v', 'high', '-pix_fmt', 'yuv420p',
   '-movflags', '+faststart', '-c:a', 'aac', '-b:a', '128k', str(M / 'trailer.mp4'))
ff('-i', str(TRAILER / 'trailer.mp4'), '-c:v', 'libvpx-vp9', '-crf', '42', '-b:v', '0', '-row-mt', '1', '-deadline', 'good', '-cpu-used', '2',
   '-c:a', 'libopus', '-b:a', '112k', str(M / 'trailer.webm'))
for lang in ('zh-Hant', 'zh-Hans', 'en'):
    shutil.copy(TRAILER / f'trailer.{lang}.vtt', M / f'trailer.{lang}.vtt')
ff('-ss', '3.2', '-i', str(TRAILER / 'trailer.mp4'), '-frames:v', '1', '-vf', 'scale=1280:720:flags=lanczos', '-q:v', '3', str(M / 'trailer.jpg'))   # 海報：片頭寫好的字標

for f in sorted(M.rglob('*')):
    if f.is_file(): print(f'{f.relative_to(ROOT)}  {f.stat().st_size / 1e6:.2f} MB')
