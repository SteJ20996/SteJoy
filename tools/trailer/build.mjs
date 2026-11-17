// 剪預告：照 edit.json 把錄好的鏡頭接起來（每段之間交疊淡入淡出），配上 music.wav；
// 另出三種語言的字幕（WebVTT 給網站；燒進畫面的版本給 Steam 與社群，字是用 Playwright 照網站的字型畫成透明圖再疊上去）。
// 用法：node build.mjs <鏡頭資料夾> <music.wav> <輸出資料夾> [--burn]
//       node build.mjs - - <輸出資料夾> --captions   只照剪接表重寫字幕（WebVTT），不剪畫面（加語言、改字幕時用；2026-11-06 加日文時加的）
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const here = path.dirname(new URL(import.meta.url).pathname);
const [SHOTS, MUSIC, OUT] = process.argv.slice(2);
const burn = process.argv.includes('--burn'), capsOnly = process.argv.includes('--captions'), reuse = process.argv.includes('--reuse');   // --reuse：已經剪好的 trailer.mp4 照用，只重燒字幕
// EDIT、CAPTIONS 環境變數可以換成別的剪接表與字幕（《力透紙背》的在 tools/litou/）
const edit = JSON.parse(fs.readFileSync(process.env.EDIT || path.join(here, 'edit.json'), 'utf8'));
const caps = JSON.parse(fs.readFileSync(process.env.CAPTIONS || path.join(here, 'captions.json'), 'utf8'));
const LANGS = ['zh-Hant', 'zh-Hans', 'en', 'ja', 'vi', 'ko'].filter(L => Object.values(caps).every(c => c[L]));   // 越南文：《力透紙背》2026-11-10、《墨畫蒼生》2026-11-12；韓文：《墨畫蒼生》第二支預告 2026-11-17（字幕表沒有 ko 的就照舊五種）
// VARIANTS（第二支預告 2026-11-17）：某幾種語言用另一份鏡頭與配樂，各剪一支沒字幕的 trailer-clean-<名>.mp4、燒在它上面。
// 例：{"en":{"shots":"rec-en","music":"music-en.wav","langs":["en","ja","vi","ko"]},"hans":{"shots":"rec-hans","music":"music-hans.wav","langs":["zh-Hans"]}}
// 用來讓英、日、越、韓用英文介面錄的那份（命條、方框、飄的字都是英文），簡中用簡體介面錄的那份；各份照自己錄的重擊對拍配樂。
const VARIANTS = JSON.parse(process.env.VARIANTS || '{}');
const baseOf = (L) => { for (const k in VARIANTS) if (VARIANTS[k].langs.includes(L)) return path.join(OUT, `trailer-clean-${k}.mp4`); return path.join(OUT, 'trailer.mp4'); };
fs.mkdirSync(OUT, { recursive: true });

// 每段在成片裡從幾秒開始
const F = edit.fade; let t = 0; const at = [];
edit.clips.forEach((c, i) => { at.push(t); t += c.dur - (i < edit.clips.length - 1 ? F : 0); });
const TOTAL = t;

const clean = path.join(OUT, 'trailer.mp4');
// 一、畫面：trim 每段、依序 xfade（--captions 時跳過）
const cut = (outF, shots, music) => {
const args = ['-y', '-loglevel', 'error'];
edit.clips.forEach(c => args.push('-i', path.join(shots, c.shot + '.mp4')));
args.push('-i', music);
let fc = edit.clips.map((c, i) => `[${i}:v]trim=start=${c.from}:duration=${c.dur},setpts=PTS-STARTPTS,fps=30,format=yuv420p[v${i}]`).join(';');
let prev = 'v0';
for (let i = 1; i < edit.clips.length; i++) {
  const off = (at[i]).toFixed(3), lab = i === edit.clips.length - 1 ? 'vx' : 'x' + i;
  fc += `;[${prev}][v${i}]xfade=transition=${edit.clips[i].tr || 'fade'}:duration=${F}:offset=${off}[${lab}]`; prev = lab;   // tr：這一段怎麼接進來（第二支預告用 fadeblack、fadewhite 等；不給就淡入淡出）
}
fc += `;[vx]fade=t=in:st=0:d=0.6,fade=t=out:st=${(TOTAL - 0.8).toFixed(3)}:d=0.8[vout]`;
execFileSync('ffmpeg', [...args, '-filter_complex', fc, '-map', '[vout]', '-map', `${edit.clips.length}:a`, '-c:v', 'libx264', '-preset', 'slow', '-crf', '20', '-pix_fmt', 'yuv420p', '-profile:v', 'high', '-movflags', '+faststart', '-c:a', 'aac', '-b:a', '160k', '-shortest', outF]);
console.log(path.basename(outF), TOTAL.toFixed(2) + 's', (fs.statSync(outF).size / 1e6).toFixed(1) + 'MB');
};
if (!capsOnly && !(reuse && fs.existsSync(clean))) cut(clean, SHOTS, MUSIC);
for (const k in VARIANTS) { const f = path.join(OUT, `trailer-clean-${k}.mp4`); if (!capsOnly && !(reuse && fs.existsSync(f))) cut(f, VARIANTS[k].shots, VARIANTS[k].music); }

// 二、字幕：每段淡入後 0.3 息出字，下一段淡入前收
const cues = [];
edit.clips.forEach((c, i) => { const cap = caps[c.shot]; if (cap) cues.push({ a: at[i] + 0.35, b: at[i] + c.dur - (i < edit.clips.length - 1 ? F + 0.1 : 0.5), cap }); });
const ts = (s) => { const h = Math.floor(s / 3600), m = Math.floor(s / 60) % 60, x = (s % 60).toFixed(3).padStart(6, '0'); return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${x}`; };
for (const L of LANGS) {
  const vtt = 'WEBVTT\n\n' + cues.map((q, k) => `${k + 1}\n${ts(q.a)} --> ${ts(q.b)}\n${q.cap[L]}\n`).join('\n');
  fs.writeFileSync(path.join(OUT, `trailer.${L}.vtt`), vtt);
}
fs.writeFileSync(path.join(OUT, 'cues.json'), JSON.stringify(cues.map(q => ({ a: +q.a.toFixed(2), b: +q.b.toFixed(2), t: q.cap })), null, 1));
console.log('captions', cues.length, 'cues');

// 三、燒字幕的版本（--burn）：字畫成 1920×1080 的透明圖，再照時間疊上去
if (burn) {
  const { chromium } = require(process.env.PLAYWRIGHT || '/opt/node-tools/node_modules/playwright');
  const fonts = process.env.FONTS_CSS || 'http://127.0.0.1:8125/fonts/fonts.css';
  const fontsExtra = (process.env.FONTS_EXTRA_CSS || '').split(',').filter(Boolean);   // 另外的字型表（2026-11-17）：韓文的 Gowun Batang、英文的 Gelasio（Georgia 的開源同款，沒裝 Georgia 的機器用），見 README
  const FONT = { en: '44px/1.3 Georgia, Gelasio, serif', 'zh-Hans': '50px/1.3 "Noto Serif SC", serif', ko: '700 48px/1.35 "Gowun Batang", "LXGW WenKai TC", serif' };
  const SPACING = { en: '.02em', ko: '.03em', vi: '.02em' };   // 越南文：霞鶩文楷載到了以後字寬了，字距照英文
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1920, height: 1080 } });
  // 2026-11-17 才發現：setContent 的頁面是 null 來源，字型檔跨來源要 CORS，本機的 http.server 不給——字一直沒載到，燒出來的是系統的備用字。
  // 字型表與字型檔都經這裡補上 Access-Control-Allow-Origin；載不到的照樣記下來，燒完報出來
  const fontFail = [];
  await page.route(/\.(css|woff2?|ttf|otf)(\?.*)?$/, async (route) => { try { const r = await route.fetch(); await route.fulfill({ response: r, headers: { ...r.headers(), 'access-control-allow-origin': '*' } }); } catch (e) { fontFail.push(route.request().url()); await route.abort(); } });
  const ONLY = (process.env.ONLY_LANGS || '').split(',').filter(Boolean);   // 只燒這幾種（試字型時用）
  for (const L of LANGS) {
    if (ONLY.length && !ONLY.includes(L)) continue;
    const dir = path.join(OUT, 'caps-' + L); fs.mkdirSync(dir, { recursive: true });
    const pngs = [];
    for (let k = 0; k < cues.length; k++) {
      const text = cues[k].cap[L];
      await page.setContent(`<!doctype html><html><head><meta charset="utf-8"><link rel="stylesheet" href="${fonts}">${fontsExtra.map(u => `<link rel="stylesheet" href="${u}">`).join('')}
        <style>html,body{margin:0;width:1920px;height:1080px;background:transparent}
        .band{position:absolute;left:0;right:0;bottom:0;height:300px;background:linear-gradient(to top,rgba(18,14,10,.6),rgba(18,14,10,.32) 45%,rgba(18,14,10,0))}
        p{position:absolute;left:0;right:0;bottom:92px;margin:0;text-align:center;white-space:nowrap;font:${FONT[L] || '52px/1.3 "LXGW WenKai TC", serif'};
          color:#f6efdf;letter-spacing:${SPACING[L] || '.12em'};text-shadow:0 0 2px #1c1a17,0 0 10px rgba(28,26,23,.85),0 2px 18px rgba(28,26,23,.7)}</style></head>
        <body>${edit.capBand ? '<div class="band"></div>' : ''}<p>${text.replace(/&/g, '&amp;').replace(/</g, '&lt;')}</p></body></html>`, { waitUntil: 'networkidle' });   // capBand（第二支預告）：字幕底下墊一條由下往上淡的暗帶，淺色的紙上也讀得清楚
      const got = await page.evaluate(async () => { const p = document.querySelector('p'), f = getComputedStyle(p).font; await document.fonts.load(f, p.textContent); await document.fonts.ready; return document.fonts.check(f, p.textContent); });   // 有 unicode-range 的字要照這句話的字去載
      if (!got) fontFail.push(L + ' 第' + (k + 1) + '句');
      await page.evaluate(() => { const p = document.querySelector('p'); let px = parseFloat(getComputedStyle(p).fontSize); const r = () => { const g = document.createRange(); g.selectNodeContents(p); return g.getBoundingClientRect().width; }; while (r() > 1760 && px > 30) { px -= 1; p.style.fontSize = px + 'px'; } });   // 一行放不下（左右各留八十點）就一點一點縮字，不換行
      const f = path.join(dir, `c${k}.png`); await page.screenshot({ path: f, omitBackground: true }); pngs.push(f);
    }
    let g = '', last = '0:v';
    cues.forEach((q, k) => { const lab = k === cues.length - 1 ? 'vo' : 'o' + k; g += `${g ? ';' : ''}[${k + 1}:v]format=rgba,fade=t=in:st=${q.a.toFixed(2)}:d=0.25:alpha=1,fade=t=out:st=${(q.b - 0.25).toFixed(2)}:d=0.25:alpha=1[c${k}];[${last}][c${k}]overlay=enable='between(t,${q.a.toFixed(2)},${q.b.toFixed(2)})'[${lab}]`; last = lab; });
    // 疊上去的圖要跟著片子的時間走：每張圖用 -loop 1 變成影片
    const a3 = ['-y', '-loglevel', 'error', '-i', baseOf(L)]; pngs.forEach(f => a3.push('-loop', '1', '-t', TOTAL.toFixed(2), '-i', f));
    const outF = path.join(OUT, `trailer-${L}.mp4`);
    if (process.env.PNG_ONLY) continue;   // 只畫字幕圖，不燒（試字型時用）
    execFileSync('ffmpeg', [...a3, '-filter_complex', g, '-map', '[vo]', '-map', '0:a', '-c:v', 'libx264', '-preset', 'slow', '-crf', '20', '-pix_fmt', 'yuv420p', '-movflags', '+faststart', '-c:a', 'copy', outF]);
    console.log(path.basename(outF), (fs.statSync(outF).size / 1e6).toFixed(1) + 'MB');
  }
  await browser.close();
  if (fontFail.length) console.log('字型沒載全（燒的是備用字）：', [...new Set(fontFail)].join('、'));
}
