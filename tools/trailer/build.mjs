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
const burn = process.argv.includes('--burn'), capsOnly = process.argv.includes('--captions');
// EDIT、CAPTIONS 環境變數可以換成別的剪接表與字幕（《力透紙背》的在 tools/litou/）
const edit = JSON.parse(fs.readFileSync(process.env.EDIT || path.join(here, 'edit.json'), 'utf8'));
const caps = JSON.parse(fs.readFileSync(process.env.CAPTIONS || path.join(here, 'captions.json'), 'utf8'));
const LANGS = ['zh-Hant', 'zh-Hans', 'en', 'ja', 'vi'].filter(L => Object.values(caps).every(c => c[L]));   // 越南文：《力透紙背》2026-11-10、《墨畫蒼生》2026-11-12
fs.mkdirSync(OUT, { recursive: true });

// 每段在成片裡從幾秒開始
const F = edit.fade; let t = 0; const at = [];
edit.clips.forEach((c, i) => { at.push(t); t += c.dur - (i < edit.clips.length - 1 ? F : 0); });
const TOTAL = t;

const clean = path.join(OUT, 'trailer.mp4');
// 一、畫面：trim 每段、依序 xfade（--captions 時跳過）
if (!capsOnly) {
const args = ['-y', '-loglevel', 'error'];
edit.clips.forEach(c => args.push('-i', path.join(SHOTS, c.shot + '.mp4')));
args.push('-i', MUSIC);
let fc = edit.clips.map((c, i) => `[${i}:v]trim=start=${c.from}:duration=${c.dur},setpts=PTS-STARTPTS,fps=30,format=yuv420p[v${i}]`).join(';');
let prev = 'v0';
for (let i = 1; i < edit.clips.length; i++) {
  const off = (at[i]).toFixed(3), lab = i === edit.clips.length - 1 ? 'vx' : 'x' + i;
  fc += `;[${prev}][v${i}]xfade=transition=fade:duration=${F}:offset=${off}[${lab}]`; prev = lab;
}
fc += `;[vx]fade=t=in:st=0:d=0.6,fade=t=out:st=${(TOTAL - 0.8).toFixed(3)}:d=0.8[vout]`;
execFileSync('ffmpeg', [...args, '-filter_complex', fc, '-map', '[vout]', '-map', `${edit.clips.length}:a`, '-c:v', 'libx264', '-preset', 'slow', '-crf', '20', '-pix_fmt', 'yuv420p', '-profile:v', 'high', '-movflags', '+faststart', '-c:a', 'aac', '-b:a', '160k', '-shortest', clean]);
console.log('trailer.mp4', TOTAL.toFixed(2) + 's', (fs.statSync(clean).size / 1e6).toFixed(1) + 'MB');
}

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
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1920, height: 1080 } });
  for (const L of LANGS) {
    const dir = path.join(OUT, 'caps-' + L); fs.mkdirSync(dir, { recursive: true });
    const pngs = [];
    for (let k = 0; k < cues.length; k++) {
      const text = cues[k].cap[L];
      await page.setContent(`<!doctype html><html><head><meta charset="utf-8"><link rel="stylesheet" href="${fonts}">
        <style>html,body{margin:0;width:1920px;height:1080px;background:transparent}
        p{position:absolute;left:0;right:0;bottom:92px;margin:0;text-align:center;font:${L === 'en' ? '44px/1.3 Georgia, serif' : L === 'zh-Hans' ? '50px/1.3 "Noto Serif SC", serif' : '52px/1.3 "LXGW WenKai TC", serif'};
          color:#f6efdf;letter-spacing:${L === 'en' ? '.02em' : '.12em'};text-shadow:0 0 2px #1c1a17,0 0 10px rgba(28,26,23,.85),0 2px 18px rgba(28,26,23,.7)}</style></head>
        <body><p>${text.replace(/&/g, '&amp;').replace(/</g, '&lt;')}</p></body></html>`, { waitUntil: 'networkidle' });
      await page.evaluate(() => document.fonts.ready);
      const f = path.join(dir, `c${k}.png`); await page.screenshot({ path: f, omitBackground: true }); pngs.push(f);
    }
    let g = '', last = '0:v';
    cues.forEach((q, k) => { const lab = k === cues.length - 1 ? 'vo' : 'o' + k; g += `${g ? ';' : ''}[${k + 1}:v]format=rgba,fade=t=in:st=${q.a.toFixed(2)}:d=0.25:alpha=1,fade=t=out:st=${(q.b - 0.25).toFixed(2)}:d=0.25:alpha=1[c${k}];[${last}][c${k}]overlay=enable='between(t,${q.a.toFixed(2)},${q.b.toFixed(2)})'[${lab}]`; last = lab; });
    // 疊上去的圖要跟著片子的時間走：每張圖用 -loop 1 變成影片
    const a3 = ['-y', '-loglevel', 'error', '-i', clean]; pngs.forEach(f => a3.push('-loop', '1', '-t', TOTAL.toFixed(2), '-i', f));
    const outF = path.join(OUT, `trailer-${L}.mp4`);
    execFileSync('ffmpeg', [...a3, '-filter_complex', g, '-map', '[vo]', '-map', '0:a', '-c:v', 'libx264', '-preset', 'slow', '-crf', '20', '-pix_fmt', 'yuv420p', '-movflags', '+faststart', '-c:a', 'copy', outF]);
    console.log(path.basename(outF), (fs.statSync(outF).size / 1e6).toFixed(1) + 'MB');
  }
  await browser.close();
}
