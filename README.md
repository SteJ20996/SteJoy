# SteJoy

stejoy.com 的網站：工作室**長風**的首頁（「寫意」系列，選一部遊戲）、《墨畫蒼生》（InkWild）與《力透紙背》（Through the Page）的介紹頁，繁體中文、简体中文、English、日本語四種語言（日文 2026-11-06 加，使用者要的：整個網頁增加日文版）。

工作室的中文名是**長風**（李白〈行路難〉「長風破浪會有時，直掛雲帆濟滄海」；使用者定）：繁中頁寫「長風」（霞鶩文楷）、簡中頁寫「长风」（思源宋體），英文頁照舊寫 SteJoy；日文頁也寫「長風」（Klee One；「長風について」說英語名是 SteJoy）。「寫意」是遊戲系列的名字，不是工作室的。

| 網址 | 檔案 | 產生它的 |
|---|---|---|
| `/`、`/zh-hans/`、`/en/`、`/ja/` | `index.html`、`zh-hans/index.html`、`en/index.html`、`ja/index.html` | 首頁：選一部（`tools/site/home.py`） |
| `/mohuacangsheng/`（四語同上加前綴） | `mohuacangsheng/index.html` 等 | 《墨畫蒼生》（`tools/site/build-site.py`） |
| `/litouzhibei/`（四語同上加前綴） | `litouzhibei/index.html` 等 | 《力透紙背》，敬請期待（`tools/site/litou.py`） |

《墨畫蒼生》的介紹頁原本就是首頁 `/`，有了選遊戲的首頁之後搬到 `/mohuacangsheng/`（拼音，跟 `/litouzhibei/` 一樣）。純靜態頁，沒有建置步驟也能直接放上任何靜態主機。全部頁面由 `python3 tools/site/build-site.py` 一起產生，**改文字請改那幾個 `.py` 再重新產生**，不要直接改 HTML。

## 首頁：選一部

使用者要的：在主頁加一個選不同遊戲的介面，先放兩部。標題「落筆成局」（使用者嫌原本的「用漢字寫成的遊戲」平；局是棋局、戰局、布局），底下一句說明（`TEXT` 的 `deck`，`SUB` 裡有 `'deck'` 才放）：「用漢字組成的各式各樣的遊戲。下面每一張紙，都是一部。」——2026-11-06 使用者：有人測試網頁，不知道這是兩個遊戲。英文那句寫成 “made from Chinese characters (Hanzi/Kanji)”（同一天使用者要的：英文版加（Hanzi/Kanji））；日文「漢字で組み上げた、さまざまなゲーム。」。李白那兩句原本在這裡，跟「關於長風」重複，使用者要刪掉，只留在「關於長風」；「寫意」每一部拿漢字當什麼材料照舊寫在「關於長風」第二段（`about2`）。另做過一筆「一」（手畫的楷書長橫，後半段乾筆飛白，進場時從左到右寫出來，`home.py` 的 `HENG`），留在程式裡沒開；要開就在 `SUB` 加 `'stroke'`。

- 每一部是一張紙：《墨畫蒼生》淺紙、字標與實機片段（取木）；《力透紙背》墨黑、照「力」的筆順寫出來的標誌（`MARK_DATA.ink` 給紙色）、實機片段反相來看（莫比烏斯環那段，像從紙背看）。滑過或聚焦的那張展開、片段才開始播；手機上直排。
- 上面一排「種類」（全部／生存 · 建造／筆順 · 戰鬥）可以篩，數字是每類幾部；← → 換一部、Enter 進入。
- 加一部遊戲：在 `tools/site/home.py` 的 `GAMES` 加一行（`id`、`slug`、`kind`、片段），`KINDS` 與四語 `TEXT` 補上它的種類與文案，`assets/css/home.css` 給它一張紙的樣子。
- 樣式與互動：`assets/css/home.css`、`assets/js/home.js`。

## 檔案

- `assets/css/site.css`、`assets/js/site.js`：樣式；試玩場景捲到才載入；照瀏覽器語言（繁中、簡中、日文，其餘當英文）提示有這一頁的別種語言（不自動跳轉）。
- 每一頁左下角有「− 100% ＋」調整頁面大小（使用者要的：有人看到大圖會不舒服）：整頁用根元素的 CSS `zoom`，70%–120%，放大只放到內容還有 880 寬（窄螢幕最多 100%），記在這台瀏覽器的 `localStorage`（`stejoy.zoom`），點百分比回 100%。倍率另寫進 `--z`：`vh`、`vw` 不跟著 `zoom` 變，要撐滿畫面高度的地方寫成 `calc(100vh / var(--z, 1) …)`。
- iPhone Duo 打開時照電腦版排（使用者要的）：Duo 打開直拿 Safari 給約 669×825（實機量的），落在手機版的範圍；`tools/site/head.py` 認出「iPhone、寬 600–859、高也有 600」（一般 iPhone 直拿最寬 440，只有 Duo 打開會這樣），把 viewport 設成 900 寬，整頁縮到螢幕上；摺起來或轉向就回到 device-width 重新判斷。`screen.width` 開合都讀 466，分不出開合，只能看畫面寬高。這一段跟頁面大小的那一行都在 `head.py`，三個產生器共用，放在 `<head>` 最前面，畫面出來以前就套上。
- 《墨畫蒼生》頁（`body.mohua`）的寬度照《力透紙背》（使用者定）：版面 1350、開頭 1550、兩邊留 20，頂欄與頁尾跟著寬，字標撐滿開頭（矮的螢幕照高收，按鈕留在第一屏）；故事的行寬照舊 760。手機一樣。
- `assets/media/trailer.mp4`、`trailer.webm`：預告（1920×1080，54 秒；H.264 約 17 MB、VP9 約 14 MB，瀏覽器挑放得了的那一種），字幕是同資料夾的 `trailer.<語言>.vtt`，每一頁預設開自己語言的那一條。
- `assets/media/scenes/`：試玩裡的五段場景（取木、砌屋、雪、第十三夜、觀星），1280×720、無聲、循環，各有 mp4 與 webm。
- `assets/media/stills/`：完整版的四張圖（雷雨、五穀、渡海、共工）。
- `assets/fonts/`：霞鶩文楷 TC 與思源宋體 SC 的 woff2 分片（瀏覽器只下載用得到的字），SIL OFL 1.1，授權全文在同一資料夾。網站不連 Google Fonts。
- 日文頁的字型是 **Klee One** 400（Fontworks；霞鶩文楷就是從它改出來的，筆調一樣、漢字照日本的寫法，`--ja`）：Fontsource `@fontsource/klee-one` 5.3.1 的日文與拉丁分片，原檔未改（`klee-one-*.woff2`、`klee-one-LICENSE.txt`，在 `fonts.css` 最後）。日文頁字距比中文收、段首空一字、標題照文節換行（`word-break: auto-phrase`），規則在三個 css 檔最後的「日文頁」那段。
- 字幕燒進畫面的預告（每種語言各約 45 MB）不放進這個庫：Cloudflare Pages 一個檔最多 25 MiB，庫也會變肥。要的時候照下面第 3 步加 `--burn` 重新出。
- `tools/`：錄影、剪預告、轉檔、產生頁面的腳本，見下。
- `wrangler.jsonc`、`worker/index.js`、`.assetsignore`：網站放在 Cloudflare **Workers**（靜態檔，Workers Builds 接這個庫）。Workers 的靜態檔不理 `Range`（問一段也整個檔回 200；workers-sdk #8967），影片就拖不了進度；`run_worker_first` 只讓 `/assets/media/*` 先經過 `worker/index.js`：有 `Range` 就切出那一段回 206（檔案不帶長度時整個讀進來量）、沒有就加 `Accept-Ranges: bytes`，出差錯退回原本的回應。其他網址照舊直接給靜態檔。`.assetsignore` 讓 `.git`、`worker/`、`wrangler.jsonc` 不被當成網頁放出去。**不要放 `functions/` 資料夾**：Wrangler 看到它會當成 Pages 專案、整個部署失敗。

## 重新產生

全部在這個庫的根目錄跑；錄影要遊戲正式庫（`SteJ20996/Qidofun_Xieyi_MoHuaCangSheng`）在旁邊。現在的鏡頭是遊戲 v0.9.57 錄的（2026-11-06；那時正式庫還在 v0.9.53，是從測試庫 `SteJ20996/MoHuaCangSheng_test` 打的頁面錄，遊戲本身的程式一樣，只差測試服的設定，鏡頭裡看不出來）。

觀星那一段（`gaze`，九息六）在 v0.9.58 單獨重錄（2026-11-06，使用者：預告第 35 秒抬頭太快）：第一息二才抬頭、抬四息（遊戲裡是一息六，抬頭的緩進緩出照遊戲自己的，錄影只把進度線性推慢），抬完了天才慢慢轉；其餘鏡頭照舊是 v0.9.57 錄的，預告長五十六息半。

第十三夜那一段（`night`，九息）先縮時：從日落前約三十分快轉到日落後九十多分，看燈照著的磚甓一起由墨色慢慢變成暗光、照不到的照舊是墨字（遊戲 v0.9.55–v0.9.57 的夜裡擋光字），天黑透了魄才飄來。網站那段循環從第一息起、長七息八，含魄撲上來被燈燒滅那一下。

1. **錄鏡頭**：在遊戲庫的 `desktop/` 跑 `node copy-game.mjs`（打出帶本機字型的頁面），再
   `python3 -m http.server 8125 --directory <遊戲庫>/desktop/app`，然後
   `node tools/capture/capture.mjs <輸出資料夾>`。Playwright 裝假時鐘，一幀一幀推進、一幀一幀截圖，畫面跟遊戲裡一模一樣；鏡頭寫在 `tools/capture/shots.mjs`。加 `--stills` 只截頭中尾三張對構圖。
2. **配樂**：`python3 tools/trailer/music.py tools/trailer/edit.json music.wav <鏡頭資料夾>`。numpy 合成的撥弦、鈴、鼓、雷、雨與雪，沒有用任何外來的音檔；**是暫用的**，有正式配樂就換掉。雨是沙沙的雨聲加雨點、雪是悶悶的低風加踩雪聲，各是各的；雷聲與踩雪聲對齊錄鏡頭時記下的那一幀（第 1 步在鏡頭資料夾寫 `thunder.events.json`、`snow.events.json`），不給鏡頭資料夾就照估計的幀。
3. **剪預告**：`node tools/trailer/build.mjs <鏡頭資料夾> music.wav <輸出資料夾> --burn`。剪接順序與長度在 `tools/trailer/edit.json`，字幕在 `tools/trailer/captions.json`（繁、簡、英、日）；`--burn` 另出每種語言燒字幕的版本。只改字幕或加語言時不必重剪：`node tools/trailer/build.mjs - - <輸出資料夾> --captions` 只照剪接表寫 `trailer.<語言>.vtt`，抄進 `assets/media/`（《力透紙背》前面加 `EDIT=tools/litou/edit.json CAPTIONS=tools/litou/captions.json`，抄進 `assets/media/litou/`）。
4. **轉成網站用的檔**：`python3 tools/site/media.py <鏡頭資料夾> <預告資料夾>`。只換了片頭（場景沒動）時加 `--trailer`，只重壓預告。
5. **產生頁面**：`python3 tools/site/build-site.py`。

開頭的字標與寫字動畫跟遊戲起始頁同一份：`tools/site/logo.html` 是遊戲 `index.html` 裡的 `#title-logo`，寫字的遮罩用遊戲庫的 `scripts/make-shui-mask.py` 產生（`python3 <遊戲庫>/scripts/make-shui-mask.py tools/site/logo.html`），時間在 `assets/css/site.css`（照抄遊戲 `style.css` 那一段）；預告的片頭 `tools/capture/title.html` 也是同一份字標，錄的時候放快 1.15 倍（`shots.mjs` 的 `TITLE_SPEED`）。v0.9.50 起照使用者手畫的七步筆順：蜃身、浪頂、浪身、船底、桅杆、掛帆、蜃頭；v0.9.51 起第一筆蜃身從右上寫到左下。

## 《力透紙背》

風格刻意跟《墨畫蒼生》不同：紙色照遊戲（黃一點）、墨重、斜、快；紅印「敬請期待」；按鈕與預告框是硬邊的紅影；一卷五章放在墨黑的底上，左邊一個會跟著捲動展開的超正方體（一個點 → 線 → 正方形 → 正方體 → 四維；讀到第幾章就是幾維，兩章交界經過讀的地方才長出下一個方向——寬螢幕是畫面正中，手機是黏在頂上的超正方體底下那一塊的正中；十六個頂點的字固定、不重複，哪一章分出來的頂點就寫那一章的字：人、十、大口、天水火木、永玉石古本生正立）。這一頁在寬螢幕上比首頁寬 25%（版面 1350、開頭 1550、一卷 1500；手機一樣；《墨畫蒼生》頁跟它一樣寬），超正方體的畫布往左伸進頁邊，透視照最早那版（近處的頂點放得大），照每個展開程度轉得到的最遠處定比例，不會被框切掉；「試寫」可以直接按 1–0（或點鍵）照筆順寫字，用的是遊戲同一套筆順與米字格字形。《墨畫蒼生》頁「聯絡」底下多一行連過來。

- 文字：`tools/site/litou.py` 的 `TEXT`（四語；遊戲本身有日文版，日文頁的副標、標語、章名、難度、筆畫名照遊戲的 `data-ja` 與 `src/rules.js`）；`python3 tools/site/build-site.py` 會連首頁、《墨畫蒼生》一起產生、一起寫進 sitemap。
- 樣式與互動：`assets/css/litou.css`、`assets/js/litou.js`（標題的墨、標誌、超正方體、試寫）。標題五個字的粗體是 `assets/fonts/lxgw-wenkai-tc-700-litou.woff2`（霞鶩文楷 TC 700，只取力透紙纸背；SIL OFL 1.1，同資料夾的授權全文）。
- 遊戲的資料：`assets/litou/data.js`（十筆的圖示與性質、八十九個字的筆順、讀音字義與米字格字形、標題身後那一筆）由 `node tools/litou/data.mjs <遊戲庫>` 產生（遊戲庫要在 `claude/xieyi-zhan` 分支：`main` 還是 v0.8.3、只有五十七個字）；日文頁用的筆畫名、性質（`ja`、`shortJa`、`traitJa`）與音讀訓讀（`chars[字].ja`，遊戲的 `R.MEAN_JA`；「力」不在遊戲的字表裡，`data.mjs` 自己補）也從這裡來；簡體用遊戲的繁轉簡表。標誌 `assets/litou/mark.js` 與 `mark-ribbon.png`、`mark-ren.png`、`mark-time.png` 抄自遊戲庫的 `src/mark.js` 與 `src/mark-data.js`（照「力」的筆順寫出來：橫折鉤、撇）。
- 預告與一卷五章的片段：`assets/media/litou/`（預告 1920×1080、63 秒，H.264 約 8.6 MB、VP9 約 4.3 MB；字幕 `trailer.<語言>.vtt`；五段場景 1280×720）。重新做（遊戲庫 `SteJ20996/Qidofun_Xieyi_LiTouZhiBei` 在它的根目錄 `python3 -m http.server 8123`）：
  莫比烏斯環那一段（遊戲 v0.8.4 起）：紙條扭成環以後，鏡頭降到「人」站的環面、攤成這一關的紙，再接打「塗」（使用者看了舊片段說環與打鬥的紙面接不上）。v0.8.5 起前面多了紙背拉長成紙條，預告整段從紙背開始（0–7.6 秒）。後面接的「摺成正方體」也改了：環剪開、分六格、撕兩格當頂與底、排成展開圖再摺（使用者要的）。這兩個鏡頭用 `pace(rate)` 錄：轉場每一幀走 rate/30 息，跟瀏覽器幾時給 requestAnimationFrame 無關（`slow(k)` 的快慢會跟著機器忙不忙變，同一個 k 量過 3.7 秒也量過 9 秒）；莫比烏斯環 `pace(1)` 是實際速度，摺正方體 `pace(1.1)`。遊戲 v0.9.2 起環上的人從紙條正中起、接縫在環的正後方，鏡頭降下去時看不到環被剪開（使用者看了說「剛接上的莫比烏斯環怎麼還斷開了」）；摺正方體那段人先浮出紙面、鏡頭推近看它（「人浮出紙面的效果不明顯」），預告裡這段 6.9 秒。第一章的鏡頭打三秒以後把線的進度快轉、一秒內捲成圈（使用者說預告裡線捲起來那段沒出來），下一個鏡頭從圈開始。
  1. `node tools/litou/capture.mjs <鏡頭資料夾>`：假時鐘逐幀錄十四個鏡頭（片頭片尾是 `tools/litou/title.html`），鏡頭寫在 `tools/litou/shots.mjs`；轉場在錄的時候放慢（`slow`），遊戲裡轉場前段就做完了。每個鏡頭記下落筆、成字、正字的那一幀（`<鏡頭>.events.json`）。
  2. `python3 tools/litou/music.py tools/litou/edit.json music.wav <鏡頭資料夾>`：numpy 合成的暫用配樂——每一刀一記鼓、遊戲裡每一筆一聲筆刷、撥弦每進一維高一層、升維的轉場底下一道永遠升不完的 Shepard 音。
     不刺耳（使用者說「背景樂有點刺耳」；量過是撥弦，原本每進一維高一個八度、三四維落在 1.8–10 kHz，2–6 kHz 的能量九成四是它）：撥弦從 A2 起、每進一維只高兩個五聲音級（最高約 1 kHz），鼓、鼓邊、筆刷的雜音先濾掉高頻，整首再過一道 8 kHz 的柔和低通；2–6 kHz 比改之前低 14 dB，整首響度照舊（約 −21 LUFS）。撥弦後來放到最高約 1.3 kHz（使用者說 1 kHz 有點低、可以到 1400）；升維底下原本的 Shepard 滑音像急救車，換成一顆一顆往上走的五聲鈴（兩層錯開半圈，還是升不完）與一陣風聲。
  3. `EDIT=tools/litou/edit.json CAPTIONS=tools/litou/captions.json node tools/trailer/build.mjs <鏡頭資料夾> music.wav <預告資料夾>`。
  4. `python3 tools/litou/media.py <鏡頭資料夾> <預告資料夾>`。

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
