// 試寫的字形（2026-11-21，使用者：「網頁上的試寫，需要優化一下字形，參考網路上優秀字形」）：
// 從 AnimCJK（https://github.com/parsimonhi/animCJK）抽出介紹頁試寫用得到的字，寫成 tools/litou/animcjk.json。
// AnimCJK 的 svgsZhHant／graphicsZhHant.txt 是台灣用字（字形、筆順照教育部《常用國字標準字體筆順學習網》核過），
// 衍生自文鼎 AR PL KaitiM Big5／GB 楷書與 Make Me a Hanzi，每個字一筆一個輪廓（strokes）與一條中線（medians），
// 授權是 Arphic Public License（全文 assets/litou/ARPHICPL.TXT，要原樣附著）。
// 台灣那一份沒有的字（目前只有單獨一捺「乀」）從簡體那一份 graphicsZhHans.txt 拿（一筆的字兩岸一樣）。
// 用法：先下載兩個檔
//   curl -O https://raw.githubusercontent.com/parsimonhi/animCJK/master/graphicsZhHant.txt
//   curl -O https://raw.githubusercontent.com/parsimonhi/animCJK/master/graphicsZhHans.txt
// 再 node tools/litou/animcjk.mjs graphicsZhHant.txt graphicsZhHans.txt <遊戲庫>
// 座標照原檔（Make Me a Hanzi 的寫法：1024 見方、y 朝上、基線在 900，畫的時候 scale(1,-1) translate(0,-900)），
// 換到介紹頁的格子是 tools/litou/data.mjs 的事；這裡只挑字、不改數字。
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';

const [hantFile, hansFile, gameDir] = process.argv.slice(2);
if (!hantFile || !hansFile) { console.error('用法：node tools/litou/animcjk.mjs graphicsZhHant.txt graphicsZhHans.txt <遊戲庫>'); process.exit(1); }
const GAME = path.resolve(gameDir || '../litouzhibei-game');
const ctx = { console, Math, JSON, Map, Set, Array, Object, String, Number };
ctx.window = ctx; ctx.document = { addEventListener() {}, documentElement: { classList: { toggle() {}, add() {}, remove() {} } } };
ctx.EN = { tr: (a) => a, on: false, ja: false };
vm.createContext(ctx);
for (const f of ['util.js', 'rules.js']) vm.runInContext(fs.readFileSync(path.join(GAME, 'src', f), 'utf8'), ctx, { filename: f });
const { R } = ctx;

const read = (f) => { const m = new Map(); for (const line of fs.readFileSync(f, 'utf8').split('\n')) { if (!line.trim()) continue; const o = JSON.parse(line); m.set(o.character, o); } return m; };
const hant = read(hantFile), hans = read(hansFile);
// 介紹頁試寫只收十筆寫得出的字（data.mjs 一樣的規矩），外加「力」
const TEN = new Set(R.STROKE_ORDER), SEQ = Object.assign({ '力': 'JP' }, R.SEQ);
const chars = {}, from = {};
for (const ch of Object.keys(SEQ)) {
  if ([...SEQ[ch]].some(k => !TEN.has(k))) continue;
  const g = hant.get(ch) || hans.get(ch); if (!g) { console.warn('AnimCJK 沒有：' + ch); continue; }
  if (g.strokes.length !== SEQ[ch].length) throw new Error('筆數不合：' + ch + ' ' + g.strokes.length + '／' + SEQ[ch].length);
  chars[ch] = { strokes: g.strokes, medians: g.medians };
  from[ch] = hant.has(ch) ? 'zhHant' : 'zhHans';
}
const out = {
  note: 'Subset of AnimCJK graphicsZhHant.txt (graphicsZhHans.txt where zhHant lacks the character), https://github.com/parsimonhi/animCJK, ' +
    'derived from AR PL KaitiM Big5/GB (Arphic Technology) and Make Me a Hanzi. Redistributed under the Arphic Public License, see assets/litou/ARPHICPL.TXT. ' +
    'Extracted unchanged (characters selected, no glyph edited) on ' + new Date().toISOString().slice(0, 10) + ' by tools/litou/animcjk.mjs.',
  from, chars,
};
fs.writeFileSync('tools/litou/animcjk.json', JSON.stringify(out) + '\n');
console.log('tools/litou/animcjk.json', Object.keys(chars).length, 'chars', Object.entries(from).filter(([, v]) => v !== 'zhHant').map(([k]) => k).join('') || '');
