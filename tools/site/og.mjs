// 分享縮圖 assets/img/og.jpg（1200×630）：開頭那張字標卡停在最後一格
import { createRequire } from 'node:module';
import path from 'node:path';
const require = createRequire(import.meta.url);
const { chromium } = require(process.env.PLAYWRIGHT || '/opt/node-tools/node_modules/playwright');
const here = path.dirname(new URL(import.meta.url).pathname);
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1200, height: 630 } });
await page.goto('file://' + path.resolve(here, '../capture/title.html'));
await page.addStyleTag({ content: '#title-logo{width:900px} #url{font-size:22px;margin-top:26px}' });
await page.evaluate(() => { document.body.classList.add('end'); for (const a of document.getAnimations()) a.finish(); });
await page.screenshot({ path: path.resolve(here, '../../assets/img/og.jpg'), type: 'jpeg', quality: 88 });
await browser.close();
