// 網頁版試玩（2026-11-24，使用者：「把試玩版放到 stejoy 裡，玩家點擊就能體驗網頁版試玩」）
//   node tools/site/play.mjs <遊戲庫>/dist/xieyi-demo.html <裝了 @fontsource 的 node_modules>
// 把遊戲打包好的試玩（遊戲庫 python3 scripts/build-single.py --demo：已剪掉後面的內容、掃過黑名單）包成完整頁面，
// 寫成 mohuacangsheng/play/index.html。不改遊戲的一個字，只在外面包一層：
//   - doctype、<meta charset>、viewport（單檔是給 Artifact 的片段，沒有這些）、跟 Artifact 一樣的那幾行底樣式
//   - 字型照網站的規矩不連 Google Fonts：用 assets/fonts/ 的 Fontsource 分片（缺的從套件抄進去，已經有的要一模一樣），
//     另寫 mohuacangsheng/play/fonts.css；<link data-local-fonts> 讓遊戲換簡體時也不去網路載思源宋體 SC
//   - 從哪一種語言的介紹頁點進來（?lang=），第一次開就是那種語言（越南文沒有，給英文）；玩家在遊戲裡選過語言的照舊
// 字型照桌面版（遊戲庫 desktop/copy-game.mjs）：霞鶩文楷 TC 400，思源宋體 TC、SC 400 與 700。套件版本照遊戲庫 desktop/package.json：
//   npm install --no-save --prefix <暫存> @fontsource/lxgw-wenkai-tc@5.3.1 @fontsource/noto-serif-tc@5.3.1 @fontsource/noto-serif-sc@5.3.1
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const [demoFile, modules] = process.argv.slice(2);
if (!demoFile || !modules) { console.error('用法：node tools/site/play.mjs <遊戲庫>/dist/xieyi-demo.html <node_modules>'); process.exit(1); }
const stop = (why) => { console.error('不寫網頁版試玩：' + why); process.exit(2); };

const frag = fs.readFileSync(demoFile, 'utf8');
// 一定要是剪好的試玩：試玩服、沒有測試格；剪過的檔沒有 <script data-src>、沒有後面的名字（只認幾個最明顯的，詳細的掃描在遊戲庫的 smoke-demo.mjs）
if (!/XIEYI_SERVER = \{ name: '試玩', test: \[\], demo: \{\} \}/.test(frag)) stop(demoFile + ' 不是試玩版（XIEYI_SERVER 不是試玩服，或帶著測試格）');
if (/<script data-src=/.test(frag)) stop(demoFile + ' 是沒剪的試玩（xieyi-demo.raw.html？）');
for (const w of ['共工', '燭龍', '神兵', 'Gonggong', '第二章']) if (frag.includes(w)) stop(demoFile + ' 裡還有「' + w + '」：不是剪好的試玩');
const ver = (/const GAME_VER = '(v[0-9.]+)'/.exec(frag) || [])[1] || '';

// 字型
const FONTS = [['lxgw-wenkai-tc', [400]], ['noto-serif-tc', [400, 700]], ['noto-serif-sc', [400, 700]]];
const FONT_DIR = path.join(ROOT, 'assets', 'fonts'), sha = (f) => crypto.createHash('sha1').update(fs.readFileSync(f)).digest('hex');
let css = '/* 網頁版試玩的字型（tools/site/play.mjs 產生）：Fontsource 5.3.1 的 woff2 分片，原檔未改，放在 assets/fonts/ 跟網站共用；SIL OFL 1.1，授權全文在 assets/fonts/。\n   照遊戲桌面版：霞鶩文楷 TC 400，思源宋體 TC、SC 400 與 700。照 unicode-range 只下載用得到的那幾片。 */\n';
let added = 0, shared = 0, addedBytes = 0;
for (const [pkg, weights] of FONTS) {
  const dir = path.join(modules, '@fontsource', pkg);
  if (!fs.existsSync(dir)) stop('缺字型套件 @fontsource/' + pkg + '（見檔頭的 npm install）');
  const lic = path.join(FONT_DIR, pkg + '-LICENSE.txt');
  if (!fs.existsSync(lic)) fs.copyFileSync(path.join(dir, 'LICENSE'), lic);
  for (const w of weights) {
    const one = fs.readFileSync(path.join(dir, w + '.css'), 'utf8').replace(/src:\s*url\(\.\/files\/([^)]+\.woff2)\)\s*format\('woff2'\)(?:\s*,\s*url\([^)]*\)\s*format\('woff'\))?/g, (m, f) => {
      const from = path.join(dir, 'files', f), to = path.join(FONT_DIR, f);
      if (fs.existsSync(to)) { if (sha(to) !== sha(from)) stop('assets/fonts/' + f + ' 跟套件裡的不一樣（版本對不上？）'); shared++; }
      else { fs.copyFileSync(from, to); added++; addedBytes += fs.statSync(to).size; }
      return "src: url(../../assets/fonts/" + f + ") format('woff2')";
    });
    if (/\.\/files\//.test(one)) stop('@fontsource/' + pkg + ' 的 ' + w + '.css 有沒認得的寫法');
    css += one;
  }
}

// 頁面
const LANG_PICK = "<script>/* 從介紹頁點進來帶著 ?lang=：第一次開就是那種語言；玩家在遊戲裡選過的照舊（遊戲把選擇存在 xieyi.lang） */try{var q=new URLSearchParams(location.search).get('lang'),m={'zh-Hant':'hant','zh-Hans':'hans',en:'en',ja:'ja',vi:'en'};if(q&&m[q]&&!localStorage.getItem('xieyi.lang'))localStorage.setItem('xieyi.lang',m[q]);}catch(e){}</script>";
const title = (/<title>([^<]*)<\/title>/.exec(frag) || [])[1] || '墨畫蒼生 · 試玩';
let body = frag.replace(/<title>[^<]*<\/title>\s*/, '').replace(/<meta name="claude:[^>]*>\s*/g, '').replace(/<link[^>]*fonts\.(googleapis|gstatic)\.com[^>]*>\s*/g, '');
if (/fonts\.(googleapis|gstatic)\.com/.test(body.replace(/<script[\s\S]*?<\/script>/g, ''))) stop('頁面裡還有 Google Fonts 的連結沒換掉');
const page = '<!DOCTYPE html>\n<html lang="zh-Hant">\n<head>\n<meta charset="utf-8">\n'
  + '<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">\n'
  + '<title>' + title + '</title>\n'
  + '<meta name="description" content="《墨畫蒼生》（InkWild）網頁版試玩：本島與一座近島，玩到魄來的頭一夜過完。在瀏覽器裡直接玩，不用安裝。">\n'
  + '<link rel="icon" href="../../favicon.ico" sizes="any">\n'
  + LANG_PICK + '\n'
  + '<link rel="stylesheet" href="fonts.css" data-local-fonts>\n'
  + '<style>:root{color-scheme:light;padding-top:env(safe-area-inset-top);padding-bottom:env(safe-area-inset-bottom)}body{margin:0;font:14px system-ui}img{max-width:100%}[hidden]{display:none!important}</style>\n'
  + '</head>\n<body>\n' + body.trim() + '\n</body>\n</html>\n';
const out = path.join(ROOT, 'mohuacangsheng', 'play');
fs.mkdirSync(out, { recursive: true });
fs.writeFileSync(path.join(out, 'index.html'), page, 'utf8');
fs.writeFileSync(path.join(out, 'fonts.css'), css, 'utf8');
console.log('mohuacangsheng/play/index.html ← ' + path.basename(demoFile) + '（遊戲 ' + ver + '，' + Buffer.byteLength(page) + ' 位元組）');
console.log('字型：新抄進 assets/fonts/ ' + added + ' 個分片（' + (addedBytes / 1048576).toFixed(1) + ' MB），跟網站共用 ' + shared + ' 個');
