// 從遊戲本體錄預告與場景：Playwright 裝假時鐘，一幀一幀推進、一幀一幀截圖，再用 ffmpeg 接成影片。
// 用法：先在遊戲正式庫打好桌面版的頁面（desktop/ 跑 `node copy-game.mjs`，字型是本機的），
//   python3 -m http.server 8125 --directory <遊戲庫>/desktop/app
//   node capture.mjs <輸出資料夾> [鏡頭名,鏡頭名…] [--stills]
// --stills 只截每個鏡頭頭、中、尾三張，用來對構圖。
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { createRequire } from 'node:module';
import { SHOTS, COMMON } from './shots.mjs';
const require = createRequire(import.meta.url);
const { chromium } = require(process.env.PLAYWRIGHT || '/opt/node-tools/node_modules/playwright');

const OUT = process.argv[2] || 'out';
const only = (process.argv[3] && !process.argv[3].startsWith('--')) ? process.argv[3].split(',') : null;
const stills = process.argv.includes('--stills');
const FPS = 30, W = 1920, H = 1080;
const BASE = process.env.GAME_URL || 'http://127.0.0.1:8125/index.html';
fs.mkdirSync(OUT, { recursive: true });

const browser = await chromium.launch({ env: { ...process.env, LANG: 'C.UTF-8' } });
for (const shot of SHOTS) {
  if (only && !only.includes(shot.name)) continue;
  const t0 = Date.now();
  const page = await browser.newPage({ viewport: { width: W, height: H } });
  page.on('pageerror', e => console.log('  pageerror', shot.name, e.message));
  if (process.env.CAP_LOG) page.on('console', m => console.log('  [' + shot.name + ']', m.text()));
  await page.clock.install({ time: new Date('2026-11-04T10:00:00Z') });
  const url = shot.page ? 'file://' + path.resolve(path.dirname(new URL(import.meta.url).pathname), shot.page) : BASE + '?autostart=1&seed=' + (shot.seed || 7);
  await page.goto(url, { waitUntil: 'load' });
  if (!shot.page) {
    for (let i = 0; i < 200; i++) { await page.clock.runFor(100); if (await page.evaluate(() => !!(window.XIEYI && XIEYI.game && XIEYI.game.player))) break; }
    await page.evaluate(COMMON, { tile: shot.tile || 64 });
  }
  if (shot.setup) await page.evaluate(shot.setup, shot.arg || null);
  if (shot.warm) await page.clock.runFor(shot.warm * 1000);
  const n = Math.round(shot.sec * FPS), dir = path.join(OUT, shot.name);
  fs.rmSync(dir, { recursive: true, force: true }); fs.mkdirSync(dir, { recursive: true });
  const want = stills ? new Set([0, Math.floor(n / 2), n - 1]) : null;
  let prev = null, retried = 0, stale = 0;
  for (let f = 0; f < n; f++) {
    if (shot.frame) await page.evaluate(shot.frame, { f, n, fps: FPS, arg: shot.arg || null });
    await page.clock.runFor(1000 / FPS);
    if (want && !want.has(f)) continue;
    const opt = { type: stills ? 'png' : 'jpeg', quality: stills ? undefined : 95 };
    if (shot.paint) await page.evaluate(shot.paint);   // 截圖前照這一刻的狀態再畫一次（時間差 0，不推動遊戲）：假時鐘下遊戲那一步有時一次也沒畫，截到的是上一步的畫面
    let buf = await page.screenshot(opt);
    // 2026-11-06：觀星那段偶爾截到上一幀還沒換掉的畫面（同一張圖連兩幀，下一幀再跳兩步，看起來一頓一頓）。
    // 跟上一幀一模一樣就等一下再截；畫面本來就停著的（例如一段靜止）重截幾回也一樣，照收
    if (shot.fresh) for (let r = 0; r < 4 && prev && buf.equals(prev); r++) { await page.waitForTimeout(40); buf = await page.screenshot(opt); retried++; if (r === 3 && buf.equals(prev)) stale++; }
    fs.writeFileSync(path.join(dir, (stills ? 's' : '') + String(f).padStart(4, '0') + (stills ? '.png' : '.jpg')), buf); prev = buf;
  }
  if (retried) console.log('  ' + shot.name + ': 重截 ' + retried + ' 回，仍同上一幀 ' + stale + ' 幀');
  const events = await page.evaluate(() => window.__events || null);   // 鏡頭裡記下的事（落雷、腳步落在哪一幀），配樂照這個對齊
  if (events && !stills) fs.writeFileSync(path.join(OUT, shot.name + '.events.json'), JSON.stringify(events));
  await page.close();
  if (!stills) execFileSync('ffmpeg', ['-y', '-loglevel', 'error', '-framerate', String(FPS), '-i', path.join(dir, '%04d.jpg'), '-c:v', 'libx264', '-preset', 'slow', '-crf', '16', '-pix_fmt', 'yuv420p', path.join(OUT, shot.name + '.mp4')]);
  console.log(shot.name, n + ' frames', ((Date.now() - t0) / 1000).toFixed(0) + 's');
}
await browser.close();
