// 《力透紙背》的預告與網站鏡頭：Playwright 裝假時鐘，一幀一幀推進、一幀一幀截圖，再用 ffmpeg 接成影片（做法同 tools/capture/）。
// 用法：在遊戲庫（SteJ20996/Qidofun_Xieyi_LiTouZhiBei）的根目錄 `python3 -m http.server 8123`，再
//   node tools/litou/capture.mjs <輸出資料夾> [鏡頭名,鏡頭名…] [--stills]
// 片頭片尾是 tools/litou/title.html（用遊戲的字型與標誌）；CSS 動畫不跟假時鐘走，每一幀照時間撥到那一刻。
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { createRequire } from 'node:module';
import { SHOTS, COMMON } from './shots.mjs';
const require = createRequire(import.meta.url);
let pw; try { pw = require('playwright'); } catch { pw = require((process.env.NODE_PATH || '/opt/node-tools/node_modules') + '/playwright'); }

const OUT = process.argv[2] || 'out';
const only = (process.argv[3] && !process.argv[3].startsWith('--')) ? process.argv[3].split(',') : null;
const stills = process.argv.includes('--stills');
const FPS = 30, W = 1920, H = 1080;
const BASE = process.env.GAME_URL || 'http://127.0.0.1:8123/';
const here = path.dirname(new URL(import.meta.url).pathname);
fs.mkdirSync(OUT, { recursive: true });

const browser = await pw.chromium.launch();
for (const shot of SHOTS) {
  if (only && !only.includes(shot.name)) continue;
  const t0 = Date.now();
  const page = await browser.newPage({ viewport: { width: W, height: H } });
  page.on('pageerror', e => console.log('  pageerror', shot.name, e.message));
  // 亂數固定：每次錄出來一樣
  await page.addInitScript((seed) => { let a = seed >>> 0; Math.random = () => { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; try { localStorage.clear(); } catch (e) {} }, shot.seed || 11);
  await page.clock.install({ time: new Date('2026-11-05T10:00:00Z') });
  const url = shot.page ? 'file://' + path.join(here, shot.page.split('?')[0]) + (shot.page.includes('?') ? '?' + shot.page.split('?')[1] + '&' : '?') + 'game=' + encodeURIComponent(BASE) : BASE + 'index.html';
  await page.goto(url, { waitUntil: 'load' });
  await page.evaluate(() => document.fonts && document.fonts.ready);
  if (!shot.page) {
    for (let i = 0; i < 100; i++) { await page.clock.runFor(100); if (await page.evaluate(() => !!(window.ZHAN && ZHAN.game))) break; }
    await page.evaluate(COMMON);
  } else {
    for (let i = 0; i < 100; i++) { await page.clock.runFor(50); if (await page.evaluate(() => window.__ready === true)) break; }
  }
  if (shot.setup) await page.evaluate(shot.setup, shot.arg || null);
  if (shot.warm) { for (let i = 0; i < shot.warm * 30; i++) { if (shot.frame) await page.evaluate(() => window.__c && window.__c.tick(ZHAN.game.dim >= 3 ? 3 : ZHAN.game.dim)); await page.clock.runFor(1000 / 30); } }
  const n = Math.round(shot.sec * FPS), dir = path.join(OUT, shot.name);
  fs.rmSync(dir, { recursive: true, force: true }); fs.mkdirSync(dir, { recursive: true });
  const want = stills ? new Set([0, Math.floor(n / 2), n - 1]) : null;
  for (let f = 0; f < n; f++) {
    await page.evaluate((f) => { window.__f = f; }, f);
    if (shot.frame) await page.evaluate(shot.frame, { f, n, fps: FPS });
    if (shot.page) await page.evaluate((ms) => window.__seek && window.__seek(ms), f * 1000 / FPS);
    await page.clock.runFor(1000 / FPS);
    if (!want || want.has(f)) await page.screenshot({ path: path.join(dir, (stills ? 's' : '') + String(f).padStart(4, '0') + (stills ? '.png' : '.jpg')), type: stills ? 'png' : 'jpeg', quality: stills ? undefined : 94 });
  }
  const events = await page.evaluate(() => window.__events || null);   // 落筆、成字、正字、轉場在哪一幀：配樂照這個對齊
  if (events && !stills) fs.writeFileSync(path.join(OUT, shot.name + '.events.json'), JSON.stringify(events));
  await page.close();
  if (!stills) execFileSync('ffmpeg', ['-y', '-loglevel', 'error', '-framerate', String(FPS), '-i', path.join(dir, '%04d.jpg'), '-c:v', 'libx264', '-preset', 'slow', '-crf', '16', '-pix_fmt', 'yuv420p', path.join(OUT, shot.name + '.mp4')]);
  console.log(shot.name, n + ' frames', ((Date.now() - t0) / 1000).toFixed(0) + 's');
}
await browser.close();
