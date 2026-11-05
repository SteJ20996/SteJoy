# SteJoy

stejoy.com 的網站：《墨畫蒼生》（InkWild）的介紹頁，繁體中文、简体中文、English 三種語言。

工作室的中文名是**長風**（李白〈行路難〉「長風破浪會有時，直掛雲帆濟滄海」；使用者定）：繁中頁寫「長風」（霞鶩文楷）、簡中頁寫「长风」（思源宋體），英文頁照舊寫 SteJoy。「寫意」是遊戲系列的名字，不是工作室的。

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
- `wrangler.jsonc`、`worker/index.js`、`.assetsignore`：網站放在 Cloudflare **Workers**（靜態檔，Workers Builds 接這個庫）。Workers 的靜態檔不理 `Range`（問一段也整個檔回 200；workers-sdk #8967），影片就拖不了進度；`run_worker_first` 只讓 `/assets/media/*` 先經過 `worker/index.js`：有 `Range` 就切出那一段回 206（檔案不帶長度時整個讀進來量）、沒有就加 `Accept-Ranges: bytes`，出差錯退回原本的回應。其他網址照舊直接給靜態檔。`.assetsignore` 讓 `.git`、`worker/`、`wrangler.jsonc` 不被當成網頁放出去。**不要放 `functions/` 資料夾**：Wrangler 看到它會當成 Pages 專案、整個部署失敗。

## 重新產生

全部在這個庫的根目錄跑；錄影要遊戲正式庫（`SteJ20996/Qidofun_Xieyi_MoHuaCangSheng`）在旁邊。

1. **錄鏡頭**：在遊戲庫的 `desktop/` 跑 `node copy-game.mjs`（打出帶本機字型的頁面），再
   `python3 -m http.server 8125 --directory <遊戲庫>/desktop/app`，然後
   `node tools/capture/capture.mjs <輸出資料夾>`。Playwright 裝假時鐘，一幀一幀推進、一幀一幀截圖，畫面跟遊戲裡一模一樣；鏡頭寫在 `tools/capture/shots.mjs`。加 `--stills` 只截頭中尾三張對構圖。
2. **配樂**：`python3 tools/trailer/music.py tools/trailer/edit.json music.wav <鏡頭資料夾>`。numpy 合成的撥弦、鈴、鼓、雷、雨與雪，沒有用任何外來的音檔；**是暫用的**，有正式配樂就換掉。雨是沙沙的雨聲加雨點、雪是悶悶的低風加踩雪聲，各是各的；雷聲與踩雪聲對齊錄鏡頭時記下的那一幀（第 1 步在鏡頭資料夾寫 `thunder.events.json`、`snow.events.json`），不給鏡頭資料夾就照估計的幀。
3. **剪預告**：`node tools/trailer/build.mjs <鏡頭資料夾> music.wav <輸出資料夾> --burn`。剪接順序與長度在 `tools/trailer/edit.json`，字幕在 `tools/trailer/captions.json`；`--burn` 另出三種語言燒字幕的版本。
4. **轉成網站用的檔**：`python3 tools/site/media.py <鏡頭資料夾> <預告資料夾>`。只換了片頭（場景沒動）時加 `--trailer`，只重壓預告。
5. **產生頁面**：`python3 tools/site/build-site.py`。

開頭的字標與寫字動畫跟遊戲起始頁同一份：`tools/site/logo.html` 是遊戲 `index.html` 裡的 `#title-logo`，寫字的遮罩用遊戲庫的 `scripts/make-shui-mask.py` 產生（`python3 <遊戲庫>/scripts/make-shui-mask.py tools/site/logo.html`），時間在 `assets/css/site.css`（照抄遊戲 `style.css` 那一段）；預告的片頭 `tools/capture/title.html` 也是同一份字標，錄的時候放快 1.15 倍（`shots.mjs` 的 `TITLE_SPEED`）。v0.9.50 起照使用者手畫的七步筆順：蜃身、浪頂、浪身、船底、桅杆、掛帆、蜃頭；v0.9.51 起第一筆蜃身從右上寫到左下。

## 上線

靜態檔加一支只管影片的 Worker（見上面「檔案」）。現在放在 Cloudflare Workers（Workers Builds 接這個庫，推到 `main` 就部署）；下面是當初的 Pages 做法，留著參考。原本就是：`stejoy.com` 的 DNS 已經在 Cloudflare，**建議用 Cloudflare Pages**，DNS 與 HTTPS 都由它自動設好：

1. Cloudflare 後台 → **Workers & Pages** → **Create application** → **Pages** → **Import an existing Git repository**，授權 GitHub 後選 `SteJ20996/SteJoy`。
2. Production branch：`main`；Framework preset：**None**；Build command：`exit 0`（官方建議；留空也行）；Build output directory：`/`。按 **Save and Deploy**，先會拿到一個 `*.pages.dev` 網址。
3. 那個 Pages 專案 → **Custom domains** → **Set up a custom domain** → `stejoy.com`（再加一個 `www.stejoy.com`）。DNS 在同一個 Cloudflare 帳號裡，紀錄會自動加上；根網域用的是 CNAME flattening，**收信用的 MX、SPF、DKIM、DMARC 照舊不動**，`hello@stejoy.com` 不受影響。
4. 之後每次推到 `main` 就自動重新部署。

Cloudflare Pages 一個檔最多 25 MiB，這裡最大的是 `trailer.mp4`（約 17 MB）。

改用 GitHub Pages 的話（這個庫是公開的，免費）：Settings → Pages → Deploy from a branch → `main`、`/ (root)`，Custom domain 填 `stejoy.com`；Cloudflare 的 DNS 另外手動加根網域指向 `stej20996.github.io` 的 CNAME，第一次要設成 DNS only（灰雲）讓 GitHub 簽憑證。

## 還沒定的

- Steam 商店頁還沒開：頁上寫「即將登上 Steam」。有了網址，填進 `tools/site/build-site.py` 的 `STEAM_URL` 再重新產生，就會換成「加入願望清單」的按鈕。
- 配樂是合成的暫用版。
