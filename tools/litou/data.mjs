// 介紹頁要的遊戲資料：十筆（鍵、名、性質、圖示）、寫得出的字（筆順、讀音、字義、米字格裡每一筆的毛筆輪廓），從遊戲庫抄出來。
// 用法：node tools/litou/data.mjs <遊戲庫>   → assets/litou/data.js（window.LITOU）
// 筆形用遊戲的 BRUSH（src/brush.js）、字形用序章與習字的米字格（PROLOGUE.GLYPHS）；簡體用遊戲的繁轉簡表（src/hans.js，OpenCC）。
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';

const GAME = path.resolve(process.argv[2] || '../litouzhibei-game');   // 遊戲庫的資料夾：照本機的放法給第一個參數
const ctx = { console, Math, JSON, Map, Set, Array, Object, String, Number };
ctx.window = ctx; ctx.document = { addEventListener() {}, documentElement: { classList: { toggle() {}, add() {}, remove() {} } } };
ctx.EN = { tr: (a) => a, on: false, ja: false };
vm.createContext(ctx);
for (const f of ['util.js', 'rules.js', 'brush.js', 'prologue.js', 'hans.js']) vm.runInContext(fs.readFileSync(path.join(GAME, 'src', f), 'utf8'), ctx, { filename: f });
const { R, BRUSH, PROLOGUE, HANS_DATA } = ctx;

// 繁轉簡：跟遊戲 i18n.js 同一個做法（先試整詞，再逐字）
const CH = new Map(); for (let i = 0; i + 1 < HANS_DATA.CH.length; i += 2) CH.set(HANS_DATA.CH[i], HANS_DATA.CH[i + 1]);
const FIRST = new Map(); for (const kv of HANS_DATA.PH) { if (!FIRST.has(kv[0][0])) FIRST.set(kv[0][0], []); FIRST.get(kv[0][0]).push(kv); }
export function hans(s) {
  let out = '', i = 0;
  while (i < s.length) { const c = s[i], cands = FIRST.get(c); if (cands) { const m = cands.find(kv => s.startsWith(kv[0], i)); if (m) { out += m[1]; i += m[0].length; continue; } } out += CH.get(c) || c; i++; }
  return out.replace(/「/g, '“').replace(/」/g, '”').replace(/『/g, '‘').replace(/』/g, '’');
}
if (process.argv[3] === '--hans') { process.stdout.write(hans(fs.readFileSync(0, 'utf8'))); process.exit(0); }

// 路徑壓小：座標放大十倍取整數（在 0–1000 的格子裡），省掉小數點與 L
const pack = (d, k) => d.replace(/-?\d+(\.\d+)?/g, (n) => String(Math.round(parseFloat(n) * k))).replace(/ L/g, ' ');
const strokes = R.STROKE_ORDER.map(c => {
  const s = R.STROKES[c];
  const icon = s.dot ? 'M8.5 6.5 Q 16 8.5 17 15.5 Q 13.5 19 10.5 15 Q 9 11 8.5 6.5 Z' : BRUSH.svg(c, s.path.map(([a, b]) => [12 + a * 17, 12 + b * 17]), 4.6, 11).d;
  return { c, key: s.key, zh: s.name, hans: hans(s.name), en: s.en, short: s.short, ja: s.ja, shortJa: s.shortJa, vi: s.vi, shortVi: s.shortVi, trait: s.trait, traitHans: hans(s.trait), traitEn: s.traitEn, traitJa: s.traitJa, traitVi: s.traitVi, icon: pack(icon, 10) };   // 日文名與性質（ja、shortJa、traitJa）給網站的日文頁；越南文（vi、shortVi、traitVi）給越南文頁（遊戲 v0.12）   // 圖示：viewBox 0 0 240 240
});
// 「力」v0.9 起也在遊戲的字表裡；這裡保留，舊版遊戲庫也產得出（橫折鉤、撇；繁簡一體、兩岸同筆順）
// 「力」：遊戲 v0.9 起收進字表，v0.12.1 起米字格照教育部標準字體重量；遊戲有就用遊戲的，舊版遊戲庫沒有才用這裡補的
const GLYPHS = Object.assign({}, { '力': [['J', [0.18, 0.3], [0.8, 0.27], [0.75, 0.86], [0.6, 0.77]], ['P', [0.53, 0.08], [0.47, 0.5], [0.12, 0.9]]] }, PROLOGUE.GLYPHS);
const SEQ = Object.assign({}, { '力': 'JP' }, R.SEQ), MEAN = Object.assign({}, { '力': ['lì', 'strength, force'] }, R.MEAN);
const MEAN_JA = Object.assign({}, R.MEAN_JA, { '力': ['リョク・リキ・ちから', '力'] });   // 日文頁：音讀・訓讀與字義（遊戲的 R.MEAN_JA）
const MEAN_VI = Object.assign({ '力': ['lực', 'sức', 'nỗ lực'] }, R.MEAN_VI || {});   // 越南文頁：[漢越音, 意思, 常用漢越詞]（遊戲 v0.12 的 R.MEAN_VI）
const chars = {};
// 只收十筆寫得出的字：遊戲 v0.11 起深造、爐火純青的三維、四維多三筆（豎彎鉤、撇折、豎折）與十三個字，
// 遊戲裡也要教過才列出來；介紹頁只說「還有三筆在等你」、不攤開（使用者定，留懸念），試寫也就只有 1–0 十個鍵
const TEN = new Set(R.STROKE_ORDER);
for (const ch of Object.keys(SEQ)) {
  const G = GLYPHS[ch]; if (!G) continue;
  if ([...SEQ[ch]].some(k => !TEN.has(k))) continue;
  chars[ch] = { seq: SEQ[ch], py: MEAN[ch][0], en: MEAN[ch][1], ja: MEAN_JA[ch], vi: MEAN_VI[ch], d: G.map((sk, i) => pack(BRUSH.svg(sk[0], sk.slice(1).map(([a, b]) => [a * 100, b * 100]), sk[0] === 'D' ? 10 : 9.5, 7 + i * 13).d, 10)) };   // 字形：viewBox 0 0 1000 1000
  if (G.map(s => s[0]).join('') !== SEQ[ch]) throw new Error('glyph strokes differ from stroke order: ' + ch);
}
// 標題身後橫掃的一筆（跟遊戲起始頁同一筆：BRUSH 的橫，頭實尾虛）
const sw = BRUSH.shape('H', [[40, 132], [968, 92]], 96, 1, 2024), one = (v) => +v.toFixed(1);
const sweep = { d: sw.polys.map(P => 'M' + P.map(q => one(q[0]) + ' ' + one(q[1])).join(' ') + 'Z').join(' '), dry: sw.dry.map(S => 'M' + S.map(q => one(q[0]) + ' ' + one(q[1])).join(' ')).join(' ') };
const out = '// 由 tools/litou/data.mjs 從《力透紙背》遊戲庫產生，不要手改\nwindow.LITOU = ' + JSON.stringify({ strokes, chars, sweep }) + ';\n';
fs.mkdirSync('assets/litou', { recursive: true });
fs.writeFileSync('assets/litou/data.js', out);
console.log('assets/litou/data.js', Object.keys(chars).length, 'chars', (out.length / 1024).toFixed(1) + ' KB');
