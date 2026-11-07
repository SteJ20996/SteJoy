// 《力透紙背》預告與網站的鏡頭。每個函式都在遊戲頁面裡跑（page.evaluate），只能用頁面裡的東西：ZHAN、R、PROLOGUE、LINE、SPACE、U。
// setup(arg) 擺場面；frame({ f, n, fps }) 每一幀先跑，再推進 1/30 息、截圖。
// 遊戲庫：SteJ20996/Qidofun_Xieyi_LiTouZhiBei（在它的根目錄 `python3 -m http.server 8123`）。

// 每個鏡頭都先跑：只留畫布（介面、提示、面板都藏起來）、靜音、人不會死；掛一個照規則打的機器人（抄自遊戲庫 scripts/autoplay.mjs）
export const COMMON = () => {
  const g = ZHAN.game, Rr = ZHAN.R;
  const st = document.createElement('style'); st.id = 'cine';
  st.textContent = 'body > *:not(#world){display:none!important}';
  document.head.appendChild(st);
  SFX.muted = true;
  window.__events = { strokes: [], casts: [], zheng: [], shifts: [] };
  const s0 = g.stroke.bind(g);
  g.stroke = (code) => { window.__events.strokes.push(window.__f || 0); return s0(code); };
  g.on('cast', () => window.__events.casts.push(window.__f || 0));
  g.on('zheng', () => window.__events.zheng.push(window.__f || 0));
  g.on('shift', () => window.__events.shifts.push(window.__f || 0));
  const near = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);
  const B = { plan: [], wait: 0, gap: 0.2 };
  function write(code) { g.stroke(code); B.wait = B.gap * U.rand(0.85, 1.2); }
  function hits(code) {
    const p = g.p, s = Rr.STROKES[code]; let n = 0;
    const pts = s.dot ? null : ZHAN_INPUT.strokePts(code, p.x, p.y, g.strokeLen(code));
    for (const e of g.hostiles()) {
      if (e.spawnT > 0) continue;
      if (s.dot) { if (near(e, { x: p.x + p.fx * s.reach, y: p.y + p.fy * s.reach }) <= s.r + e.r) n++; }
      else if (ZHAN_INPUT.polyDist(e.x, e.y, pts) <= Rr.STROKE_W / 2 + e.r) n++;
    }
    return n;
  }
  function keys(dx, dy) {
    for (const k of ['KeyA', 'KeyD', 'KeyW', 'KeyS']) g.keys.delete(k);
    if (dx > 0.3) g.keys.add('KeyD'); else if (dx < -0.3) g.keys.add('KeyA');
    if (dy > 0.3) g.keys.add('KeyS'); else if (dy < -0.3) g.keys.add('KeyW');
  }
  function bot1() {
    const p = g.p, L = g.line, l = LINE.front(g, -1), r = LINE.front(g, 1);
    const t = [l, r].filter(Boolean).sort((a, b) => Math.abs(a.x - p.x) - Math.abs(b.x - p.x))[0];
    if (!t) return;
    if (Math.sign(t.x - p.x) !== L.face && !L.k) LINE.turn(g, Math.sign(t.x - p.x));
    if (B.wait > 0 || L.stall > 0 || p.strokeCd > 0) return;
    const tgt = L.target; if (tgt) write(tgt.seq[L.k]);
  }
  function bot2(cast) {
    const p = g.p, foes = g.hostiles().filter(e => e.spawnT <= 0);
    let nearest = null, nd = 1e9, dx = 0, dy = 0;
    for (const e of foes) { const d = near(p, e); if (d < nd) { nd = d; nearest = e; } }
    if (nearest) { const ux = (nearest.x - p.x) / (nd || 1), uy = (nearest.y - p.y) / (nd || 1); if (nd < 1.2) { dx -= ux; dy -= uy; } else if (nd > 3) { dx += ux * 0.7; dy += uy * 0.7; } }
    if (!g.mob) { if (p.x < 2) dx += 0.8; if (p.x > Rr.W - 2) dx -= 0.8; }
    if (p.y < 2) dy += 0.8; if (p.y > Rr.H - 2) dy -= 0.8;
    keys(dx, dy);
    if (B.wait > 0 || p.strokeCd > 0) return;
    if (B.plan.length) { write(B.plan.shift()); return; }
    if (cast && !g.buf.length) { p.ink = p.inkMax; g.run.uses[cast] = Rr.USE.max; B.plan = Rr.SEQ[cast].split(''); write(B.plan.shift()); return true; }
    const wrong = foes.filter(e => e.d.dim === 2 && Rr.SEQ[e.t] && near(e, p) <= 7).sort((a, b) => near(a, p) - near(b, p))[0];
    if (wrong && !g.buf.length) { B.plan = Rr.SEQ[wrong.t].split(''); write(B.plan.shift()); return; }
    let best = null, bs = 0;
    for (const c of ['H', 'S', 'P', 'N', 'D', 'Z', 'W']) { const s = hits(c); if (s > bs) { bs = s; best = c; } }
    if (best) { g.stroke(best); B.wait = B.gap * 0.7; }
  }
  // 三維、四維裡人照一條路線走（使用者要的：預告裡人要往各個方向動起來）：→ ↑ 前 ← ↓ 後，四維再加 U（w 大）、Y（w 小）；
  // 一段約半秒，走一圈回到原處；靠牆就反過來走。邊走邊寫字
  const PAT3 = [[1, 0, 0, 0], [0, -1, 0, 0], [0, 0, 1, 0], [-1, 0, 0, 0], [0, 1, 0, 0], [0, 0, -1, 0]];
  const PAT4 = [[1, 0, 0, 0], [0, 0, 0, 1], [0, -1, 0, 0], [0, 0, 1, 0], [0, 0, 0, -1], [-1, 0, 0, 0], [0, 1, 0, 0], [0, 0, -1, 0]];
  function move3() {
    const p = g.p, S = Rr.SPACE, four = g.dim === 4, pat = four ? PAT4 : PAT3, seg = Math.floor((window.__f || 0) / 14) % pat.length;
    let [dx, dy, dz, dw] = pat[seg];
    if (p.x < 2.5) dx = 1; else if (p.x > S.X - 2.5) dx = -1;
    if (p.y < 2.5) dy = 1; else if (p.y > S.Y - 2.5) dy = -1;
    if (p.z < 0.8) dz = Math.max(dz, 0); else if (p.z > S.Z - 4) dz = Math.min(dz, 0);
    if (four) { if (p.w < 1) dw = 1; else if (p.w > Rr.HYPER.N - 1) dw = -1; }
    keys(dx, dy);
    for (const k of ['Space', 'KeyB', 'KeyU', 'KeyY']) g.keys.delete(k);
    if (dz > 0) g.keys.add('Space'); else if (dz < 0) g.keys.add('KeyB');
    if (four) { if (dw > 0) g.keys.add('KeyU'); else if (dw < 0) g.keys.add('KeyY'); }
  }
  function bot3() {
    const p = g.p, live = g.foes.filter(e => e.live && e.spawnT <= 0 && !e.doomed);
    move3();
    if (B.wait > 0 || p.strokeCd > 0) return;
    if (B.plan.length) { write(B.plan.shift()); return; }
    const ts = SPACE.targets(g).sort((a, b) => Math.hypot(a.x - p.x, a.y - p.y, a.z - p.z) - Math.hypot(b.x - p.x, b.y - p.y, b.z - p.z));
    if (ts.length && !g.buf.length) { B.plan = ts[0].seq.split(''); write(B.plan.shift()); return; }
    if (live.some(e => SPACE.hittable(g, e))) { g.stroke(['H', 'S', 'Z', 'W'][Math.floor(Math.random() * 4)]); B.wait = B.gap * 0.7; }
  }
  window.__c = {
    B,
    // 每一幀：人不會死、面板關掉（升維後的說明卡會讓遊戲停住）、機器人走一步
    tick(kind, arg) {
      const p = g.p; if (p) { p.hp = p.hpMax; if (p.ink < 20) p.ink = p.inkMax; }
      if (ZHAN.ui.closePanel && document.querySelector('#dimcard:not(.hidden)')) ZHAN.ui.closePanel();
      g.tutor = null; B.wait -= 1 / 30;
      if (g.state !== 'play' || g.paused) return;
      if (kind === 1) bot1(); else if (kind === 2) return bot2(arg); else if (kind === 3) bot3();
    },
    // 轉場放慢（只在轉場那幾息）：遊戲裡的轉場前段就做完了，預告裡要看得清楚
    slow(k) { const u0 = g.update.bind(g); g.update = (dt) => u0(g.state === 'shift' ? dt * k : dt); },
    // 轉場照片子的幀走、跟瀏覽器幾時給 requestAnimationFrame 無關：每一幀轉場走 rate/30 息（rate 1 就是遊戲的實際速度）。
    // slow(k) 的快慢會跟著機器忙不忙變（同一個 k 量過 3.7 秒、也量過 9 秒），要準就用這個
    pace(rate) { const u0 = g.update.bind(g); let last = -1; g.update = (dt) => { if (g.state !== 'shift') return u0(dt); if (window.__f === last) return u0(0); last = window.__f; return u0(rate / 30); }; },
    run(opts) { localStorage.clear(); g.newRun('easy', Object.assign({ prologue: false, tutorial: false }, opts || {})); g.run.learned = Object.keys(Rr.CHARS); },
  };
};

export const SHOTS = [
  {   // 片頭：力透紙背四字落下，標誌照「力」的筆順寫出來
    name: 'title', sec: 4.6, page: 'title.html',
  },
  {   // 零維：一個點；十筆一筆一筆從這個點長出來，最後點拉成線
    name: 'point', sec: 7.0,
    setup() { window.__c.run({ prologue: true }); window.__c.slow(0.5); },
    frame({ f }) {
      const g = ZHAN.game, keys = 'HSPDNTGZJW';
      window.__c.tick(0);
      if (f >= 12 && f < 12 + 10 * 11 && (f - 12) % 11 === 0) g.stroke(keys[(f - 12) / 11]);
      if (f === 129) { PROLOGUE.finish(g); }
    },
  },
  {   // 一維：一條線，敵從左右來，照面前那個字的筆順寫
    // 打幾息以後線很快捲成一個圈（使用者要的：預告裡原本只看得到線微微彎，捲成圈那一段沒有）——遊戲裡線照進度慢慢捲，這裡把進度快轉
    name: 'line', sec: 5.4, warm: 2.2,
    setup() { window.__c.run(); ZHAN.game.enterDim(1, { tutorial: false }); window.__c.B.gap = 0.22; },
    frame({ f }) {
      window.__c.tick(1); const r = ZHAN.render;
      if (f === 84) { const c0 = r.curl || 0; r.curlStep = function () { const k = Math.min(1, (window.__f - 84) / 36); return (this.curl = c0 + (1 - c0) * k * k * (3 - 2 * k)); }; }
    },
  },
  {   // 一維寫完：線首尾相接成圈，圈圍出一張紙
    name: 'ring', sec: 4.6, warm: 1.2,
    setup() { window.__c.run(); ZHAN.game.enterDim(1, { tutorial: false }); window.__c.slow(0.35); const r = ZHAN.render; r.curlStep = function () { return (this.curl = 1); }; },   // 接上一個鏡頭：已經捲成圈
    frame({ f }) { const g = ZHAN.game; window.__c.tick(0); if (f === 6) { g.dimClear(); g.ascendGo(); } },
  },
  {   // 二維正面：筆打得到的就打，眼前的錯字寫它的字就正了，墨多時寫大、寫火
    name: 'page', sec: 6.4, warm: 1.0,
    setup() {
      const g = ZHAN.game; window.__c.run(); g.enterDim(2, { page: 0, tutorial: false }); window.__c.B.gap = 0.18;
      // 擺一圈錯字：照它的筆順寫出來就正了（這一作的核心）
      const p = g.p, ring = ['大', '口', '十', '子', '寸', '夕', '土', '巾'];
      ring.forEach((t, i) => { const a = i / ring.length * Math.PI * 2 + 0.3, r = 4.2 + (i % 3) * 1.3; const e = FOES.spawn(g, t, U.clamp(p.x + Math.cos(a) * r * 1.5, 1.2, ZHAN.R.W - 1.2), U.clamp(p.y + Math.sin(a) * r * 0.8, 1.2, ZHAN.R.H - 1.2)); if (e) e.spawnT = Math.min(e.spawnT || 0, 0.3 + i * 0.15); });
    },
    frame({ f }) { window.__c.tick(2, f === 36 || f === 39 ? '大' : f === 108 || f === 111 ? '火' : null); },
  },
  {   // 力透紙背：翻到紙背，字都反了
    name: 'flip', sec: 5.4, warm: 1.6,
    setup() { window.__c.run(); ZHAN.game.enterDim(2, { page: 0, tutorial: false }); window.__c.slow(0.5); },
    frame({ f }) { const g = ZHAN.game; window.__c.tick(f === 3 ? 0 : 2); if (f === 3) g.levelShift('flip', 1); },
  },
  {   // 莫比烏斯環：紙條扭成環，鏡頭降到「人」站的環面、攤成這一關的紙，接著打塗（遊戲 v0.8.4 的轉場）
    // 轉場照遊戲的實際速度錄（pace(1)：5.8 息 = 片子 5.8 秒）
    name: 'mobius', sec: 9.4, warm: 1.4,   // v0.8.5 起轉場 5.8 息：紙背先拉長成紙條
    setup() { window.__c.run(); ZHAN.game.enterDim(2, { page: 1, tutorial: false }); window.__c.pace(1); },
    frame({ f }) {
      const g = ZHAN.game; window.__c.tick(2); if (f === 3) g.levelShift('mobius', 2);
      if (g.state === 'play' && g.mob && !window.__landed) { window.__landed = true; g.introT = Math.min(g.introT || 0, 0.4); }   // 落地後不等關名那一段，塗早點來
    },
  },
  {   // 二維寫完：紙沿展開圖的摺痕摺成正方體
    // v0.8.5：環打完 → 升起看到環 → 從接縫剪開 → 六格、撕兩格 → 展開圖 → 摺成正方體（7 息；v0.9.2 人先浮出紙面；pace 1.1 是遊戲的 1.1 倍快）
    name: 'fold', sec: 7.6, warm: 1.0,
    setup() { window.__c.run(); ZHAN.game.enterDim(2, { page: 2, tutorial: false }); window.__c.pace(1.1); },
    frame({ f }) { const g = ZHAN.game; window.__c.tick(0); if (f === 6) { g.dimClear(); g.ascendGo(); } },
  },
  {   // 三維：前後左右上下；遠處敵身上的字寫出來，字就飛過去
    name: 'cube', sec: 5.6, warm: 2.4,
    setup() { window.__c.run(); ZHAN.game.enterDim(3, { page: 0, tutorial: false }); window.__c.B.gap = 0.2; },
    frame() { window.__c.tick(3); },
  },
  {   // 看出正方體是超正方體的一個胞
    name: 'tess', sec: 5.6, warm: 1.2,
    setup() { window.__c.run(); ZHAN.game.enterDim(3, { page: 0, tutorial: false }); window.__c.slow(0.45); },
    frame({ f }) { const g = ZHAN.game; window.__c.tick(0); if (f === 3) g.levelShift('tess', 1); },
  },
  {   // 震：雷。一息後鏡頭升到「高處」（遊戲 v0.9.4 的視角），那一柱落在哪、地上那條紅帶，從上往下看得清楚
    name: 'thunder', sec: 4.6, warm: 2.0,
    setup() { window.__c.run(); ZHAN.game.enterDim(3, { page: 1, tutorial: false }); ZHAN.game.view = 0; },
    frame({ f }) { window.__c.tick(3); if (f === 33) ZHAN.game.view = 1; },
  },
  {   // 換視角（遊戲 v0.9.4，使用者要預告裡也有）：離（火）燒起一段深度時，身後 → 高處 → 斜側，各一息多
    name: 'views', sec: 5.0, warm: 2.4,
    setup() { window.__c.run(); const g = ZHAN.game; g.enterDim(3, { page: 5, tutorial: false }); g.view = 0; g.space.fireT = 2.7; },
    frame({ f }) { window.__c.tick(3); const g = ZHAN.game; if (f === 40) g.view = 1; if (f === 86) g.view = 2; },
  },
  {   // 八胞合一，走進超正方體裡面
    name: 'hyper', sec: 5.0, warm: 1.0,
    setup() { window.__c.run(); ZHAN.game.enterDim(3, { page: 7, tutorial: false }); window.__c.slow(0.4); },
    frame({ f }) { const g = ZHAN.game; window.__c.tick(0); if (f === 6) { g.dimClear(); g.ascendGo(); } },
  },
  {   // 四維：看不見的方向 w，別的 w 上的敵只剩影子。鏡頭慢慢繞開一點（遊戲 v0.9.5 的偷看），影子的前後層次看得出來
    name: 'four', sec: 5.4, warm: 2.4,
    setup() { window.__c.run(); ZHAN.game.enterDim(4, { tutorial: false }); ZHAN.game.view = 0; },
    frame({ f, n }) { window.__c.tick(3); const k = Math.min(1, f / n), e = k * k * (3 - 2 * k); SPACE.orbitTo(ZHAN.render, ZHAN.game, 0.55 * e, 0.24 * e); },
  },
  {   // 片尾：寫好的字標
    name: 'end', sec: 4.2, page: 'title.html?end=1',
  },
];
