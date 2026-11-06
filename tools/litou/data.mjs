// 介紹頁要的遊戲資料：十筆（鍵、名、性質、圖示）、寫得出的字（筆順、讀音、字義、米字格裡每一筆的毛筆輪廓），從遊戲庫抄出來。
// 用法：node tools/litou/data.mjs <遊戲庫>   → assets/litou/data.js（window.LITOU）
// 筆形用遊戲的 BRUSH（src/brush.js）、字形用序章與習字的米字格（PROLOGUE.GLYPHS）；簡體用遊戲的繁轉簡表（src/hans.js，OpenCC）。
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';

const GAME = path.resolve(process.argv[2] || '../Qidofun_Xieyi_LiTouZhiBei');
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
  return { c, key: s.key, zh: s.name, hans: hans(s.name), en: s.en, short: s.short, trait: s.trait, traitHans: hans(s.trait), traitEn: s.traitEn, icon: pack(icon, 10) };   // 圖示：viewBox 0 0 240 240
});
// 「力」v0.9 起也在遊戲的字表裡；這裡保留，舊版遊戲庫也產得出（橫折鉤、撇；繁簡一體、兩岸同筆順）
const GLYPHS = Object.assign({}, PROLOGUE.GLYPHS, { '力': [['J', [0.18, 0.3], [0.8, 0.27], [0.75, 0.86], [0.6, 0.77]], ['P', [0.53, 0.08], [0.47, 0.5], [0.12, 0.9]]] });
const SEQ = Object.assign({}, R.SEQ, { '力': 'JP' }), MEAN = Object.assign({}, R.MEAN, { '力': ['lì', 'strength, force'] });
const chars = {};
for (const ch of Object.keys(SEQ)) {
  const G = GLYPHS[ch]; if (!G) continue;
  chars[ch] = { seq: SEQ[ch], py: MEAN[ch][0], en: MEAN[ch][1], d: G.map((sk, i) => pack(BRUSH.svg(sk[0], sk.slice(1).map(([a, b]) => [a * 100, b * 100]), sk[0] === 'D' ? 10 : 9.5, 7 + i * 13).d, 10)) };   // 字形：viewBox 0 0 1000 1000
  if (G.map(s => s[0]).join('') !== SEQ[ch]) throw new Error('glyph strokes differ from stroke order: ' + ch);
}
// 標題身後橫掃的一筆（跟遊戲起始頁同一筆：BRUSH 的橫，頭實尾虛）
const sw = BRUSH.shape('H', [[40, 132], [968, 92]], 96, 1, 2024), one = (v) => +v.toFixed(1);
const sweep = { d: sw.polys.map(P => 'M' + P.map(q => one(q[0]) + ' ' + one(q[1])).join(' ') + 'Z').join(' '), dry: sw.dry.map(S => 'M' + S.map(q => one(q[0]) + ' ' + one(q[1])).join(' ')).join(' ') };
const out = '// 由 tools/litou/data.mjs 從《力透紙背》遊戲庫產生，不要手改\nwindow.LITOU = ' + JSON.stringify({ strokes, chars, sweep }) + ';\n';
fs.mkdirSync('assets/litou', { recursive: true });
fs.writeFileSync('assets/litou/data.js', out);
console.log('assets/litou/data.js', Object.keys(chars).length, 'chars', (out.length / 1024).toFixed(1) + ' KB');
