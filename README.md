# SteJoy

stejoy.com 的網站：《墨畫蒼生》（InkWild）的介紹頁，繁體中文、简体中文、English 三種語言。

| 網址 | 檔案 |
|---|---|
| `/` | `index.html`（繁體中文） |
| `/zh-hans/` | `zh-hans/index.html` |
| `/en/` | `en/index.html` |

純靜態頁，沒有建置步驟也能直接放上任何靜態主機。三頁由同一份範本產生，**改文字請改 `tools/site/build-site.py` 再重新產生**，不要直接改 HTML。

## 檔案

- `assets/css/site.css`、`assets/js/site.js`：樣式；試玩場景捲到才載入；照瀏覽器語言提示另外兩種語言（不自動跳轉）。
- `assets/media/trailer.mp4`、`trailer.webm`：預告（1920×1080，54 秒；H.264 約 17 MB、VP9 約 14 MB，瀏覽器挑放得了的那一種），字幕是同資料夾的 `trailer.<語言>.vtt`，每一頁預設開自己語言的那一條。
- `assets/media/scenes/`：試玩裡的五段場景（取木、砌屋、雪、第十三夜、觀星），1280×720、無聲、循環，各有 mp4 與 webm。
- `assets/media/stills/`：完整版的四張圖（雷雨、五穀、渡海、共工）。
- `assets/fonts/`：霞鶩文楷 TC 與思源宋體 SC 的 woff2 分片（瀏覽器只下載用得到的字），SIL OFL 1.1，授權全文在同一資料夾。網站不連 Google Fonts。
- 字幕燒進畫面的預告（三種語言，各約 45 MB）不放進這個庫：Cloudflare Pages 一個檔最多 25 MiB，庫也會變肥。要的時候照下面第 3 步加 `--burn` 重新出。
- `tools/`：錄影、剪預告、轉檔、產生頁面的腳本，見下。

## 重新產生

全部在這個庫的根目錄跑；錄影要遊戲正式庫（`SteJ20996/Qidofun_Xieyi_MoHuaCangSheng`）在旁邊。

1. **錄鏡頭**：在遊戲庫的 `desktop/` 跑 `node copy-game.mjs`（打出帶本機字型的頁面），再
   `python3 -m http.server 8125 --directory <遊戲庫>/desktop/app`，然後
   `node tools/capture/capture.mjs <輸出資料夾>`。Playwright 裝假時鐘，一幀一幀推進、一幀一幀截圖，畫面跟遊戲裡一模一樣；鏡頭寫在 `tools/capture/shots.mjs`。加 `--stills` 只截頭中尾三張對構圖。
2. **配樂**：`python3 tools/trailer/music.py tools/trailer/edit.json music.wav`。numpy 合成的撥弦、鈴、鼓與雷，沒有用任何外來的音檔；**是暫用的**，有正式配樂就換掉。
3. **剪預告**：`node tools/trailer/build.mjs <鏡頭資料夾> music.wav <輸出資料夾> --burn`。剪接順序與長度在 `tools/trailer/edit.json`，字幕在 `tools/trailer/captions.json`；`--burn` 另出三種語言燒字幕的版本。
4. **轉成網站用的檔**：`python3 tools/site/media.py <鏡頭資料夾> <預告資料夾>`。
5. **產生頁面**：`python3 tools/site/build-site.py`。

## 上線

靜態檔，GitHub Pages 或 Cloudflare Pages 都放得了。

- `stejoy.com` 的 DNS 已經在 Cloudflare，用 **Cloudflare Pages** 接這個庫最省事：Build command 留空、Output directory 填 `/`，再到 Custom domains 加上 `stejoy.com`。
- 用 GitHub Pages 的話，私有庫要付費方案才開得了 Pages。

## 還沒定的

- Steam 商店頁還沒開：頁上寫「即將登上 Steam」。有了網址，填進 `tools/site/build-site.py` 的 `STEAM_URL` 再重新產生，就會換成「加入願望清單」的按鈕。
- 配樂是合成的暫用版。
