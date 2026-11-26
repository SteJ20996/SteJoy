#!/bin/sh
# 「畫」那一段的圖（2026-11-26）：使用者交的原檔轉成網站用的檔，寫進 assets/media/art/。
# 用法：sh tools/site/art.sh <原檔資料夾>，資料夾裡放 night.png fengxi.png wind.png xiushe.png tiger.png dragon.png（1672×941）與 sail.gif gong.gif（960×540、每格 50 毫秒）
# 靜圖：原寸一張（放大看用）、960 寬一張（格子裡用），JPEG。動圖：H.264 與 VP9 各一份循環短片（瀏覽器挑放得了的），第一格當封面。
set -e
src=${1:?原檔資料夾}; out=assets/media/art; mkdir -p "$out"
for k in night fengxi wind xiushe tiger dragon; do
  python3 -c "import sys; from PIL import Image; im=Image.open(sys.argv[1]).convert('RGB'); im.save(sys.argv[2]+'.jpg',quality=86,optimize=True,progressive=True); im.resize((960,540),Image.LANCZOS).save(sys.argv[2]+'-960.jpg',quality=84,optimize=True,progressive=True)" "$src/$k.png" "$out/$k"
done
for k in sail gong; do
  ffmpeg -loglevel error -y -i "$src/$k.gif" -movflags +faststart -c:v libx264 -preset slow -crf 20 -pix_fmt yuv420p -r 20 -an "$out/$k.mp4"
  ffmpeg -loglevel error -y -i "$src/$k.gif" -c:v libvpx-vp9 -b:v 0 -crf 33 -row-mt 1 -pix_fmt yuv420p -r 20 -an "$out/$k.webm"
  ffmpeg -loglevel error -y -i "$src/$k.gif" -vframes 1 -q:v 3 "$out/$k.jpg"
done
ls -la "$out"
