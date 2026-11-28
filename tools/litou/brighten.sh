#!/bin/sh
# 《力透紙背》預告的聲音再亮一點（2026-11-26，使用者：「宣傳片裡的聲音稍微清脆一些，音調高5%」）。
# 用法：sh tools/litou/brighten.sh <原本的 trailer.mp4> <原本的 trailer.webm> <輸出資料夾>
# 畫面一格不動（直接抄），只改聲音：
#   音高 +5%（rubberband，長度不變：鼓點照樣踩在剪接上，量過偏差 2–12 毫秒），
#   2 kHz 以上 +4 dB（high shelf；之前嫌刺耳整首過了低通，量下來重心只有 330 Hz、2–6 kHz 只佔 0.9%），
#   限幅 −1 dBFS，尾巴補靜音補到原本的長度。
# 量過：重心 330 → 378 Hz，2–6 kHz 0.9% → 1.7%，響度 −19.7 → −19.8 LUFS。
# 之後重剪預告（music.py → build.mjs）也要再過這一道，不然會回到原本的音高與音色。
set -e
mp4=${1:?原本的 trailer.mp4}; webm=${2:?原本的 trailer.webm}; out=${3:?輸出資料夾}; mkdir -p "$out"
dur=$(ffprobe -v error -show_entries format=duration -of csv=p=0 "$mp4")
AF="rubberband=pitch=1.05:pitchq=quality:formant=shifted,highshelf=f=2000:g=4:t=q:w=0.7,alimiter=limit=0.89:level=false,apad,atrim=end=$dur"
ffmpeg -loglevel error -y -i "$mp4" -map 0:v -map 0:a -c:v copy -af "$AF" -c:a aac -b:a 128k -movflags +faststart "$out/trailer.mp4.tmp.mp4"
ffmpeg -loglevel error -y -i "$webm" -map 0:v -map 0:a -c:v copy -af "$AF" -c:a libopus -b:a 128k "$out/trailer.webm.tmp.webm"
mv "$out/trailer.mp4.tmp.mp4" "$out/trailer.mp4"; mv "$out/trailer.webm.tmp.webm" "$out/trailer.webm"
ls -la "$out/trailer.mp4" "$out/trailer.webm"
