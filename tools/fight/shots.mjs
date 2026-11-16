// 第二支預告（2026-11-16 使用者定：本體商店頁用；最多 75 秒、配樂恢宏一些、主要是打鬥、節奏比第一支快；配樂先用合成的）的鏡頭。
// 用法：SHOTS=tools/fight/shots.mjs node tools/capture/capture.mjs <輸出資料夾> [鏡頭名,…] [--stills]（STILL_EVERY=15 每半息截一張對構圖）
// 跟第一支一樣在遊戲本體裡錄：COMMON 照抄第一支（關掉真隨機的事件、關 HUD、人不會死），EXTRA 再加打鬥要的：
// 隨機數定下來（同一個鏡頭每次錄都一樣）、膽氣卅一重以上、具欄換成要用的兵器、介面寫繁體、要命條的鏡頭只留命條（擺在上面，下面留給字幕）。
// 招式都是遊戲自己的：鏡頭只把冷卻歸零、在第幾幀按 E 或走一步，讓該出的招在這幾息裡出來。
// 每個函式都在遊戲頁面裡跑（page.evaluate），只能用頁面裡的東西：XIEYI、World、G、U、EN。
export { COMMON } from '../capture/shots.mjs';
export const PAUSE = true;   // 假時鐘停住、只照幀推（capture.mjs）

export const EXTRA = ({ seed2, bossbar, fx: fxIn, tile }) => {
  const g = XIEYI.game, w = g.world, p = g.player;
  let s = (seed2 * 2654435761) >>> 0;   // mulberry32：獸的走位、招式的落點每次錄都一樣
  Math.random = () => { s = (s + 0x6D2B79F5) >>> 0; let t = s; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
  if (window.EN && EN.on) { EN.set(''); if (g.langChanged) g.langChanged(); }   // 命條的名字寫漢字（各語言的字幕另外燒）
  p.cour = g.levelAt(36); p.ctrl = true;
  g.ents.dashT = 1e9; g.ents.snuffP = 0;
  const DUR = { '鎢鋼刀': 112, '鎢鋼劍': 112, '鎢鋼戈': 112, '鎢鋼斧': 112, '九閽鳴雷': 199, '燭龍焚溟': 199, '青冥落羽': 199, '彈弓': 80 };
  if (bossbar) {
    document.getElementById('cine').textContent = 'body > *:not(#world):not(#sky):not(#hud){display:none!important} #hud > *:not(#bossbar){display:none!important}'
      + ' #bossbar{top:46px!important;bottom:auto!important;transform:translateX(-50%) scale(1.5)!important;transform-origin:50% 0} #bossbar-note{display:none!important}';
  }
  // ---- 光影（2026-11-16 使用者：短片裡加一些特效，比如更宏觀的光影；好多 Steam 遊戲這麼安排）----
  // 只在錄影時疊在畫面上，遊戲本身不動：雲影（乘）、斜照的光束與閃光（濾色）、四角壓暗（乘）、照時段調色（柔光）；
  // 推鏡照 fx.zoom 慢慢放大格子；重擊（遊戲自己的畫面震動突然變大）時閃一下白。
  const FX = Object.assign({ grade: 'day', shadows: 0.2, rays: 0.13, vig: 0.42, zoom: null, flash: 0.6, flashC: [255, 246, 228] }, fxIn || {});
  const cine = document.getElementById('cine'); cine.textContent = cine.textContent.replace(/body > \*:not\(#world\)/g, 'body > *:not(.cinefx):not(#world)') + ' #hud{z-index:50!important}';
  const W = innerWidth, H = innerHeight;
  const layer = (blend, z) => { const c = document.createElement('canvas'); c.className = 'cinefx'; c.width = W; c.height = H; Object.assign(c.style, { position: 'fixed', left: '0', top: '0', width: W + 'px', height: H + 'px', pointerEvents: 'none', mixBlendMode: blend, zIndex: String(z) }); document.body.appendChild(c); return c.getContext('2d'); };
  const mul = layer('multiply', 20), scr = layer('screen', 21), soft = layer('soft-light', 22);
  const GEL = { day: [255, 243, 224], dusk: [255, 228, 204], night: [168, 184, 228], gong: [246, 226, 216], sea: [226, 238, 248] };   // 調色像打燈加一片色紙（乘）：不會把暗處洗灰
  const GRADE = { day: [255, 205, 130, 0.12], dusk: [255, 130, 70, 0.08], night: [0, 0, 0, 0], gong: [150, 30, 20, 0.08], sea: [120, 170, 200, 0.08] };   // 柔光只再加一點點
  let flashA = 0, flashC = [255, 246, 228], lastShake = 0, slowN = 0, slowR = 1, curF = 0;
  window.__slow = (frames, r) => { slowN = frames; slowR = r; };   // 接下來幾幀遊戲走慢一些（重擊前後的慢動作）
  window.__events = { hits: [] };
  window.__flash = (a, c) => { flashA = Math.max(flashA, a); if (c) flashC = c; };
  // ---- 第二層（2026-11-16 使用者：稍微浮誇一點，再加上一些外部光影因素，增加一點戲劇性）----
  // 雲縫裡的陽光一道掃過（sweep）、光束裡的浮塵（motes）、暴風雲與天邊的電光（storm，配遊戲自己的雨）、火堆揚起的火星（embers）；
  // 重擊：鏡頭猛地一推（punch）、衝擊波一圈圈散開（rings，紅青兩色錯開一點）、閃光照神兵上色（flashC）；衝撞、俯衝時的速度線（__speed）。
  const rnd2 = (k) => { const x = Math.sin(k * 12.9898 + seed2 * 78.233) * 43758.5453; return x - Math.floor(x); };
  const motes = Array.from({ length: 80 }, (_, k) => ({ x: rnd2(k), y: rnd2(k + 100), r: 1.2 + 2.6 * rnd2(k + 200), v: 0.2 + 0.8 * rnd2(k + 300), ph: rnd2(k + 400) * 6.28 }));
  const embers = Array.from({ length: 110 }, (_, k) => ({ x: rnd2(k + 500), y: rnd2(k + 600), r: 1.4 + 3.2 * rnd2(k + 700), v: 0.5 + 1.7 * rnd2(k + 800), ph: rnd2(k + 900) * 6.28 }));
  let punchA = 0, rings = [], speedN = 0, stormA = 0, bolt = null, nextBolt = FX.storm ? (FX.stormAt || 0.7) : 1e9;
  window.__speed = (n) => { speedN = Math.max(speedN, n); };
  window.__hit = (a, c) => { window.__flash(a, c); punchA = Math.max(punchA, a); rings.push({ k: 0, a }); window.__events.hits.push([curF + 1, a >= 0.58 ? 0.7 : 0.45]); };   // 自己喊的重擊（刀斃了虎、射下蠱雕……）
  if (FX.storm && FX.rain !== false) { w.wx = 'rain'; w.rainUntil = w.time + XIEYI.DAY; }   // 暴風雨：雨絲照遊戲自己的畫法
  window.__post = (f, n) => {
    const t = f / 30, u = n > 1 ? f / (n - 1) : 0, ease = u * u * (3 - 2 * u);
    const zk = FX.zoom ? FX.zoom[0] + (FX.zoom[1] - FX.zoom[0]) * ease : 1;
    g.renderer.tile = tile * zk * (1 + 0.13 * punchA); punchA *= 0.8;   // 推鏡＋重擊時猛地一推再慢慢退回
    curF = f; const sh = g.renderer.shake || 0;
    if (sh >= 0.58 && sh > lastShake + 0.3) { window.__flash(Math.min(0.8, FX.flash * sh / 0.7), FX.flashC); punchA = 1; rings.push({ k: 0, a: 1 }); window.__events.hits.push([f, +sh.toFixed(2)]); }   // 只有重擊（神兵、魔王的大招）閃光、推鏡、衝擊波；獸咬人那點震動不算
    lastShake = sh;
    mul.clearRect(0, 0, W, H); scr.clearRect(0, 0, W, H); soft.clearRect(0, 0, W, H);
    if (FX.shadows) for (let k = 0; k < 5; k++) {   // 雲影：五團大而淡的影子，斜斜地飄過地面
      const x = (((k * 0.37 + t * 0.022 + seed2 * 0.13) % 1.5) - 0.25) * W, y = (((k * 0.61 + t * 0.011 + seed2 * 0.07) % 1.5) - 0.25) * H, r = (0.28 + 0.08 * Math.sin(k * 2.1)) * W;
      const gr = mul.createRadialGradient(x, y, r * 0.1, x, y, r); gr.addColorStop(0, `rgba(96,80,62,${FX.shadows})`); gr.addColorStop(1, 'rgba(96,80,62,0)');
      mul.fillStyle = gr; mul.fillRect(0, 0, W, H);
    }
    const gel = GEL[FX.grade]; if (gel) { mul.fillStyle = `rgb(${gel.join(',')})`; mul.fillRect(0, 0, W, H); }
    if (FX.storm) {   // 暴風雲：整片壓暗壓冷，上緣更暗（雲底）
      const sc = FX.stormC || [60, 62, 80]; mul.fillStyle = FX.stormC ? 'rgb(232,214,210)' : 'rgb(214,214,226)'; mul.fillRect(0, 0, W, H);
      const gr = mul.createLinearGradient(0, 0, 0, H * 0.6); gr.addColorStop(0, `rgba(${sc.join(',')},0.6)`); gr.addColorStop(1, `rgba(${sc.join(',')},0)`); mul.fillStyle = gr; mul.fillRect(0, 0, W, H);   // 雲底的顏色（共工是暗赤）
    }
    if (speedN > 0) {   // 速度線：從畫面中間往外的墨線
      mul.save(); mul.translate(W / 2, H / 2); mul.strokeStyle = 'rgba(30,24,18,0.42)'; mul.lineCap = 'round';
      for (let k = 0; k < 46; k++) { const a = k / 46 * 6.283 + rnd2(k + f) * 0.12, r0 = H * (0.36 + 0.2 * rnd2(k + 31 + f)), r1 = r0 + H * (0.25 + 0.35 * rnd2(k + 77 + f)); mul.lineWidth = 2 + 6 * rnd2(k + 13); mul.beginPath(); mul.moveTo(Math.cos(a) * r0, Math.sin(a) * r0); mul.lineTo(Math.cos(a) * r1, Math.sin(a) * r1); mul.stroke(); }
      mul.restore(); speedN--;
    }
    if (FX.vig) { const gr = mul.createRadialGradient(W / 2, H / 2, Math.min(W, H) * 0.42, W / 2, H / 2, Math.hypot(W, H) * 0.6); gr.addColorStop(0, 'rgba(40,30,20,0)'); gr.addColorStop(1, `rgba(40,30,20,${FX.vig})`); mul.fillStyle = gr; mul.fillRect(0, 0, W, H); }
    if (FX.rays) {   // 光束：從左上方畫面外斜照下來，寬窄、明暗慢慢起伏
      scr.save(); scr.translate(-0.12 * W, -0.35 * H); scr.rotate(0.62);
      for (let k = 0; k < 6; k++) {
        const off = (k - 1) * 0.16 * W + Math.sin(t * 0.35 + k * 1.7) * 0.03 * W, wd = (0.05 + 0.035 * Math.sin(t * 0.5 + k * 2.3) + 0.03) * W;
        const a = FX.rays * (0.55 + 0.45 * Math.sin(t * 0.8 + k * 1.3)) * (k % 2 ? 0.7 : 1);
        const gr = scr.createLinearGradient(0, off - wd, 0, off + wd); gr.addColorStop(0, 'rgba(255,236,196,0)'); gr.addColorStop(0.5, `rgba(255,236,196,${a})`); gr.addColorStop(1, 'rgba(255,236,196,0)');
        const fade = scr.createLinearGradient(0, 0, 2.2 * W, 0);   // 光束越往遠處越淡
        scr.globalCompositeOperation = 'lighter'; scr.fillStyle = gr; scr.fillRect(0, off - wd, 2.4 * W, wd * 2);
        scr.globalCompositeOperation = 'destination-out'; fade.addColorStop(0, 'rgba(0,0,0,0)'); fade.addColorStop(1, 'rgba(0,0,0,0.9)'); scr.fillStyle = fade; scr.fillRect(0, off - wd, 2.4 * W, wd * 2);
      }
      scr.restore(); scr.globalCompositeOperation = 'source-over';
    }
    if (FX.sweep !== undefined) {   // 雲縫裡的陽光：一道寬光由左上往右下掃過整個畫面
      const st = t - FX.sweep, dur = 2.6; if (st > 0 && st < dur) {
        const u2 = st / dur, a = Math.sin(u2 * Math.PI) * 0.34, cx = (-0.3 + 1.6 * u2) * W;
        scr.save(); scr.translate(cx, H / 2); scr.rotate(0.5); const gr = scr.createLinearGradient(-0.22 * W, 0, 0.22 * W, 0);
        gr.addColorStop(0, 'rgba(255,238,200,0)'); gr.addColorStop(0.5, `rgba(255,238,200,${a})`); gr.addColorStop(1, 'rgba(255,238,200,0)'); scr.fillStyle = gr; scr.fillRect(-0.22 * W, -H * 1.2, 0.44 * W, H * 2.4); scr.restore();
      }
    }
    if (FX.motes) {   // 光束裡的浮塵：慢慢往右上飄、一明一滅
      scr.globalCompositeOperation = 'lighter';
      for (const m of motes) { const x = ((m.x + t * 0.012 * m.v) % 1) * W, y = ((m.y - t * 0.02 * m.v + 2) % 1) * H, a = FX.motes * (0.5 + 0.5 * Math.sin(t * 1.6 + m.ph)); const gr = scr.createRadialGradient(x, y, 0, x, y, m.r * 3); gr.addColorStop(0, `rgba(255,240,205,${a})`); gr.addColorStop(1, 'rgba(255,240,205,0)'); scr.fillStyle = gr; scr.fillRect(x - m.r * 3, y - m.r * 3, m.r * 6, m.r * 6); }
      scr.globalCompositeOperation = 'source-over';
    }
    if (FX.embers) {   // 火星：從下面揚起來，左右飄、一閃一閃；底下一片暖光
      const gl = scr.createRadialGradient(W / 2, H * 1.1, 0, W / 2, H * 1.1, H * 0.9); gl.addColorStop(0, `rgba(255,120,40,${0.22 * FX.embers})`); gl.addColorStop(1, 'rgba(255,120,40,0)'); scr.fillStyle = gl; scr.fillRect(0, 0, W, H);
      scr.globalCompositeOperation = 'lighter';
      for (const m of embers) { const yy = (m.y - t * 0.09 * m.v + 3) % 1, x = (m.x + 0.03 * Math.sin(t * 2 + m.ph)) * W, y = yy * H, a = FX.embers * (0.4 + 0.6 * Math.abs(Math.sin(t * 5 + m.ph))) * (0.3 + 0.7 * yy); const gr = scr.createRadialGradient(x, y, 0, x, y, m.r * 2.6); gr.addColorStop(0, `rgba(255,190,90,${a})`); gr.addColorStop(0.4, `rgba(255,110,40,${a * 0.6})`); gr.addColorStop(1, 'rgba(255,90,30,0)'); scr.fillStyle = gr; scr.fillRect(x - m.r * 3, y - m.r * 3, m.r * 6, m.r * 6); }
      scr.globalCompositeOperation = 'source-over';
    }
    if (FX.storm) {   // 天邊的電光：一陣陣亮（閃兩下），雲縫裡劈下一道細的
      if (t >= nextBolt) { stormA = 1; bolt = { x: (0.15 + 0.7 * rnd2(f * 3)) * W, sd: f, n: 0 }; nextBolt = t + 1.3 + 1.4 * rnd2(f + 9); }
      if (bolt && bolt.n === 4) stormA = Math.max(stormA, 0.8);
      if (stormA > 0.02) {
        scr.fillStyle = `rgba(214,224,255,${0.42 * stormA})`; scr.fillRect(0, 0, W, H);
        if (bolt && bolt.n < 8) { scr.save(); scr.strokeStyle = `rgba(245,248,255,${stormA})`; scr.shadowColor = 'rgba(190,210,255,0.9)'; scr.shadowBlur = 18; scr.lineWidth = 3;
          let x = bolt.x, y = 0; scr.beginPath(); scr.moveTo(x, y); for (let k = 0; k < 9; k++) { x += (rnd2(bolt.sd + k) - 0.5) * 90; y += H * 0.045; scr.lineTo(x, y); } scr.stroke(); scr.restore(); }
        stormA *= bolt && bolt.n < 3 ? 0.55 : 0.75; if (bolt) bolt.n++;
      }
    }
    if (rings.length) {   // 衝擊波：從人那裡一圈圈散開，紅青兩色錯開一點（像鏡頭的色散）
      for (const r of rings) { const u3 = r.k / 20, rad = H * (0.08 + 0.7 * u3), a = (1 - u3) * 0.55 * r.a;
        for (const [dx, col] of [[-5, '255,90,70'], [5, '90,220,255'], [0, '255,250,235']]) { scr.strokeStyle = `rgba(${col},${a * (dx ? 0.6 : 1)})`; scr.lineWidth = 10 * (1 - u3) + 2; scr.beginPath(); scr.arc(W / 2 + dx, H / 2, rad, 0, 6.283); scr.stroke(); }
        r.k++; }
      rings = rings.filter(r => r.k <= 20);
    }
    if (flashA > 0.01) {   // 閃光：整片亮一下，人四周更亮
      scr.fillStyle = `rgba(${flashC.join(',')},${flashA * 0.35})`; scr.fillRect(0, 0, W, H);
      const gr = scr.createRadialGradient(W / 2, H / 2, 0, W / 2, H / 2, H * 0.6); gr.addColorStop(0, `rgba(${flashC.join(',')},${flashA})`); gr.addColorStop(1, `rgba(${flashC.join(',')},0)`); scr.fillStyle = gr; scr.fillRect(0, 0, W, H);
      flashA *= 0.72;
    }
    const gc = GRADE[FX.grade]; if (gc) { soft.fillStyle = `rgba(${gc[0]},${gc[1]},${gc[2]},${gc[3]})`; soft.fillRect(0, 0, W, H); }
    if (slowN > 0) { slowN--; return slowR; }
    return 1;
  };
  window.__f = {
    arm(names, held) {   // 具欄換成這幾件、手上拿 held
      p.tools = names.map(n => ({ n, c: 1, dur: DUR[n] || 100 })); p.tool = Math.max(0, names.indexOf(held)); g.prevTool = null; g.barSig = '';
    },
    hold(n) { const i = p.tools.findIndex(t => t.n === n); if (i >= 0) { p.tool = i; g.barSig = ''; } },
    face(dx, dy) { p.fx = dx; p.fy = dy; },
    faceTo(e) { p.fx = Math.sign(e.x - p.x); p.fy = Math.sign(e.y - p.y); },
    E() { g.action = null; p.atkT = 0; p.sta = 100; g.pressGather(true); window.__events.hits.push([curF + 1, 0.3]); },   // 出手也記一筆（配樂照這個打）   // 按一下 E（冷卻歸零，錄影要準時出手）
    step(dx, dy) { p.moveT = 0; return g.tryStep(dx, dy); },
    near1(e) { return U.cheb(e.x, e.y, p.x, p.y) <= 1; },
    toward(e) {   // 往牠走一步（斜的走不了就橫的或直的；不踩到牠身上）
      const dx = Math.sign(e.x - p.x), dy = Math.sign(e.y - p.y);
      for (const [a, b] of [[dx, dy], [dx, 0], [0, dy]]) if ((a || b) && !(p.x + a === e.x && p.y + b === e.y) && this.step(a, b)) return true;
      return false;
    },
    away(x, y, pref) {   // 往遠離 (x, y) 的方向走一步（正好站在上面就照 pref）
      const dx = Math.sign(p.x - x) || (pref ? pref[0] : -1), dy = Math.sign(p.y - y) || (pref ? pref[1] : 0);
      for (const [a, b] of [[dx, dy], [dx, 0], [0, dy], [-dy, dx], [dy, -dx]]) if ((a || b) && this.step(a, b)) return true;
      return false;
    },
    boat(dx, dy) { p.moveT = 0; return g.shipStep(dx, dy, dx ? 'h' : 'v'); },   // 開船一格
    clear(cx, cy, r, ch) { for (let y = cy - r; y <= cy + r; y++) for (let x = cx - r; x <= cx + r; x++) w.set(x, y, ch || '草'); },   // 清出一塊地（ch 預設草）
    near(x, y, type, r) { return g.nearestTile(x, y, (a, b) => g.ents.canStand(type || '人', a, b, true) && !g.ents.at(a, b), r || 20) || [x, y]; },
    only() { g.ents.list = g.ents.list.filter(e => e.tame || e.type === '魚'); },   // 清掉旁邊的獸
    sea(x0, y0, re) {   // 找一片開闊的水：方圓三格都是（re 預設海）
      const wet = (x, y) => (re || /[淼水]/).test(w.base(x, y));
      const clear = (x, y) => { for (let j = -3; j <= 3; j++) for (let i = -4; i <= 4; i++) if (!wet(x + i, y + j)) return false; return true; };
      for (let r = 0; r < 200; r += 3) for (let y = y0 - r; y <= y0 + r; y += 3) for (let x = x0 - r; x <= x0 + r; x += 3) if ((Math.abs(x - x0) === r || Math.abs(y - y0) === r) && clear(x, y)) return [x, y];
      return [x0, y0];
    },
    coast(x0, y0, re) {   // 找看得見岸的水：方圓兩格是水（re 預設海），十二格內陸地最多、但不到一半
      const wet = (x, y) => (re || /[淼水]/).test(w.base(x, y));
      let best = null, bn = 0;
      for (let y = y0 - 60; y <= y0 + 60; y += 2) for (let x = x0 - 60; x <= x0 + 60; x += 2) {
        let ok = true; for (let j = -2; j <= 2 && ok; j++) for (let i = -3; i <= 3; i++) if (!wet(x + i, y + j)) { ok = false; break; }
        if (!ok) continue; let n = 0; for (let j = -8; j <= 8; j++) for (let i = -12; i <= 12; i++) if (!/[淼水湖]/.test(w.base(x + i, y + j))) n++;
        if (n > bn && n < 180) { bn = n; best = [x, y]; }
      }
      return best || this.sea(x0, y0);
    },
    noGhosts() { g.ents.list = g.ents.list.filter(e => e.type !== '魄'); },
    sail(x, y, kind) { p.x = p.rx = x; p.y = p.ry = y; p.sailing = true; p.ship = World.newShip(kind || '孤帆'); g.shipNow(); g.renderer.camInit = false; },
    // 開一場大魔王的仗：人放在地界中心偏 (dx, dy) 的地方，魔王挪到人旁邊 (bx, by)
    fight(id, dx, dy, bx, by, extra) {
      const z = g.bossZone(id), at = this.near(z.x + dx, z.y + dy);
      p.x = p.rx = at[0]; p.y = p.ry = at[1];
      g.startFight(id, 'none');
      const e = g.bossEnt();
      if (e && bx !== undefined) { const b = g.nearestTile(at[0] + bx, at[1] + by, (a, c) => (e.type === '共工' ? g.ents.gongFits(e, a, c, e.mode) : g.ents.canStand(e.type, a, c, true)) && !(a === p.x && c === p.y), 8) || [at[0] + bx, at[1] + by]; e.x = e.rx = b[0]; e.y = e.ry = b[1]; }
      if (e && extra) Object.assign(e, extra);
      g.renderer.camInit = false;
      return e;
    },
  };
};


export const SHOTS = [
  {   // 開場、夜：九閽鳴雷——獸群從暗處圍上來，一鎚落地，雷紋擴散、閃電劈到每一頭身上
    name: 'hammer', sec: 3.6, seed: 7, tile: 84, rand: 5, fx: { grade: 'night', shadows: 0, rays: 0, vig: 0.55, zoom: [1, 1.12], flash: 0.8, storm: true, rain: false, stormAt: 0.35, flashC: [255, 232, 170] },
    setup() {
      const c = window.__c, f = window.__f, g = XIEYI.game, p = g.player; c.at(31, 0.8);
      f.clear(p.x, p.y, 5); f.arm(['九閽鳴雷', '鎢鋼刀'], '九閽鳴雷'); f.only();
      for (const [dx, dy, ty] of [[5, -1, '狼'], [-5, 1, '狼'], [1, 5, '豬'], [-3, -5, '狼'], [5, 3, '豹'], [-5, -2, '虎']]) { const e = g.ents.add(ty, p.x + dx, p.y + dy, { hp: 40 }); e.angry = true; e.provoked = 30; }
      f.face(1, 0);
    },
    frame({ f }) {
      const F = window.__f; F.noGhosts();
      if (f === 12) F.step(-1, 0); if (f === 20) F.step(-1, 1); if (f === 30) F.step(1, 0); if (f === 38) F.step(1, -1);   // 獸從暗處圍上來，左右挪步、站回正中
      if (f === 50) { window.__slow(20, 0.35); F.E(); }
    },
  },
  {   // 虎撲：虎貼上來先縮一下發紅（預警），人往旁邊一閃、撲空，回身一刀斃了牠
    name: 'tiger', sec: 3.2, seed: 7, tile: 92, rand: 3, fx: { zoom: [1, 1.08], sweep: 0.2, motes: 0.5 },
    setup() {
      const c = window.__c, f = window.__f, g = XIEYI.game, p = g.player; c.at(30, 0.4);
      f.clear(p.x, p.y, 4); f.arm(['鎢鋼刀', '鎢鋼劍'], '鎢鋼刀'); f.only();
      const t = g.ents.add('虎', p.x + 5, p.y, { hp: 60 }); t.angry = true; t.provoked = 30;
      f.face(1, 0); window.__t = t;
    },
    frame({ f }) {
      const F = window.__f, t = window.__t;
      if (!window.__dodged && (f === 6 || f === 12)) F.step(1, f === 6 ? -1 : 0);   // 先迎上去
      if (t && t.warnT > 0 && !window.__dodged) { window.__dodged = f; F.step(-1, 1); window.__slow(16, 0.4); }   // 一發紅就往左下一閃（慢動作）
      const d0 = window.__dodged; if (d0 && t.hp > 0) {
        if ((f === d0 + 6 || f === d0 + 18) && !F.near1(t)) F.toward(t);   // 撲空了，欺身上去
        if ((f === d0 + 11 || f === d0 + 24) && F.near1(t)) { F.faceTo(t); F.E(); if (t.hp <= 0) { window.__hit(0.5); window.__kill = f; } }   // 一刀；斃了牠那一下推鏡、閃光
      }
      if (window.__kill && (f === window.__kill + 10 || f === window.__kill + 16)) F.step(1, 0);   // 收刀往前走兩步
    },
  },
  {   // 戈：野豬一頭頭排著衝上來，戈往前突刺三格
    name: 'ge', sec: 3.4, seed: 7, tile: 92, rand: 4, fx: { zoom: [1.04, 1], sweep: 0.6, motes: 0.4 },
    setup() {
      const c = window.__c, f = window.__f, g = XIEYI.game, p = g.player; c.at(31, 0.45);
      f.clear(p.x, p.y, 4); f.arm(['鎢鋼戈', '鎢鋼刀'], '鎢鋼戈'); f.only();
      for (const [dx, dy] of [[5, 0], [7, 0], [9, 0]]) { const e = g.ents.add('豬', p.x + dx, p.y + dy, { hp: 45, moveT: dx * 0.06 }); e.angry = true; e.provoked = 30; }
      f.face(1, 0);
    },
    frame({ f }) {
      const F = window.__f, g = XIEYI.game, p = g.player;
      if (f % 16 === 8) { const o = g.geTarget() || g.ents.at(p.x + 1, p.y); if (o) { F.face(1, 0); if (!window.__geSlow) { window.__geSlow = 1; window.__slow(10, 0.4); } F.E(); if (o.hp <= 0) window.__hit(0.42); } }
      if (f % 16 === 14 && f < 70) F.step(-1, 0);   // 刺一下退一步，讓下一頭再落進戈的三格裡
      if (f === 76) F.step(-1, -1); if (f === 82) F.step(0, -1);   // 最後斜著撤開
    },
  },
  {   // 蜃：海上，蜃浮上來撞船、吐海霧；燭龍焚溟一揮，熔痕落在水上冒白汽
    name: 'shen', sec: 4.4, seed: 7, tile: 76, rand: 6, fx: { grade: 'sea', shadows: 0.16, rays: 0.1, zoom: [1, 1.08], storm: true, stormAt: 0.5, flashC: [255, 160, 80] },
    setup() {
      const c = window.__c, f = window.__f, g = XIEYI.game; c.at(41, 0.5);
      const [x, y] = f.coast(150, 20); f.sail(x, y); f.only(); f.face(1, 0);
      f.arm(['燭龍焚溟', '鎢鋼劍'], '燭龍焚溟');
      window.__e = g.ents.add('蜃', x + 4, y + 2, { moveT: 0.2, atk: 0, fogT: 1.2 });
    },
    frame({ f }) {
      const F = window.__f, e = window.__e;
      if (f === 10 || f === 17) F.boat(-1, 0); if (f === 26 || f === 34) F.boat(0, -1); if (f === 92) F.boat(1, 0);   // 掉頭、轉舵閃開蜃
      if ((f === 70 || f === 110) && e && e.hp > 0) { F.faceTo(e); if (f === 70) window.__slow(14, 0.4); F.E(); }
    },
  },
  {   // 鑿齒：正面是盾，打上去只一成；繞到牠身側，一劍穿過去
    name: 'tooth', sec: 3.8, seed: 7, tile: 92, rand: 7, fx: { zoom: [1, 1.06], sweep: 1.0, motes: 0.4 },
    setup() {
      const c = window.__c, f = window.__f, g = XIEYI.game, p = g.player; c.at(42, 0.45);
      f.clear(p.x, p.y, 5, '土'); f.arm(['鎢鋼劍', '鎢鋼刀'], '鎢鋼劍'); f.only();
      const e = g.ents.add('齒', p.x + 3, p.y, { atk: 1e9, moveT: 0.4 }); g.ents.faceTo(e, p.x, p.y); e.turnT = 99;
      f.face(1, 0); window.__e = e;
    },
    frame({ f }) {
      const F = window.__f, e = window.__e, g = XIEYI.game, p = g.player;
      if (f === 8) F.step(-1, 0); if (f === 15) F.step(1, 0);   // 前後試探
      if (f === 26 || f === 40) { F.faceTo(e); F.E(); }   // 打在盾上
      if (f >= 44) e.moveT = 99;   // 錄影時讓牠站定，人繞著牠走
      if (f === 46) { const ux = Math.sign(e.x - p.x), uy = Math.sign(e.y - p.y); window.__arc = [[-uy || 0, ux || 0], [ux, uy], [ux, uy], [uy || 0, -ux || 0]]; }   // 繞弧：側一步、往前兩步、再拐進牠背後
      if (window.__arc && f >= 48 && f <= 66 && (f - 48) % 6 === 0) { const st = window.__arc[(f - 48) / 6]; if (st) F.step(st[0], st[1]); }
      if (f === 74 || f === 88) { F.faceTo(e); F.E(); }   // 背後
      if (f === 96) { const ux = Math.sign(e.x - p.x), uy = Math.sign(e.y - p.y); F.step(-uy || 1, ux || 0); }
      if (f === 104) { F.faceTo(e); F.E(); }
    },
  },
  {   // 蠱雕：在天上盤旋，青冥落羽一箭，絲纏住牠（繳）落到地上，近身補兩刀
    name: 'harpy', sec: 3.4, seed: 7, tile: 84, rand: 8, fx: { rays: 0.16, zoom: [1, 1.06], motes: 0.6 },
    setup() {
      const c = window.__c, f = window.__f, g = XIEYI.game, p = g.player; c.at(43, 0.5);
      f.clear(p.x, p.y, 5); f.arm(['青冥落羽', '鎢鋼刀'], '青冥落羽'); f.only();
      const e = g.ents.add('雕', p.x + 2, p.y - 1, { mode: 'circle', diveT: 99, cryT: 99, hp: 230, moveT: 99 });   // 盤在兩格外（錄影時先不讓牠飛走）
      f.face(1, -1); window.__e = e;
    },
    frame({ f }) {
      const F = window.__f, e = window.__e, g = XIEYI.game, p = g.player;
      if (f === 18) { F.faceTo(e); g.action = null; p.atkT = 0; const t = g.skyTarget(); if (t) { window.__slow(12, 0.4); g.bowShot(t); window.__hit(0.55, [170, 230, 255]); } if (e.hp > 0) e.hp = Math.min(e.hp, 40); }   // 射下來以後一刀斃得了
      if (f === 2) F.step(-1, 0); if (f === 8) F.step(-1, 1);   // 先退開兩步，拉出射界
      if (f === 24) F.hold('鎢鋼刀');
      if (f >= 26 && f % 5 === 1 && e.hp > 0 && !F.near1(e)) F.toward(e);   // 繳下來了，衝上去
      if (f >= 36 && f % 6 === 0 && e.hp > 0 && F.near1(e)) { F.faceTo(e); F.E(); if (e.hp <= 0) window.__hit(0.48); }
      if (e.hp <= 0) g.ents.list = g.ents.list.filter(o => o.type !== '雕');   // 斃了以後別再飛來一隻
    },
  },
  {   // 畢方：一聲鳴，你身邊三處起訛火；一跳兩格，落腳處也燒起來
    name: 'bifang', sec: 4, seed: 7, tile: 84, rand: 9, fx: { grade: 'dusk', shadows: 0, rays: 0, vig: 0.36, zoom: [1, 1.08], embers: 0.9 },
    setup() {
      const c = window.__c, f = window.__f, g = XIEYI.game, p = g.player; const d = c.dusk(44); c.at(44, d + 0.02);
      f.clear(p.x, p.y, 5, '土'); f.arm(['鎢鋼劍', '鎢鋼刀'], '鎢鋼劍'); f.only();
      const e = g.ents.add('畢', p.x + 3, p.y - 1, { cryT: 0.4, moveT: 0.8 });
      f.face(1, 0); window.__e = e;
    },
    frame({ f }) {
      const F = window.__f, e = window.__e, p = XIEYI.game.player; F.noGhosts();
      if (f === 20) F.step(-1, 0); if (f === 26) F.step(-1, 1); if (f === 32) F.step(0, 1); if (f === 40) F.step(1, 1);   // 訛火圈一冒，之字跳開
      if (f >= 52 && f % 6 === 4 && e.hp > 0 && !F.near1(e)) F.toward(e);   // 再欺身上去
      if (f >= 58 && f % 10 === 8 && e.hp > 0 && F.near1(e)) { F.faceTo(e); F.E(); }
    },
  },
  {   // 封豨：桑林裡蓄力、直衝過來，人閃開；牠拱地，震一圈圈往外傳；九閽鳴雷還一記
    name: 'hog', sec: 5.6, seed: 7, tile: 72, rand: 11, bossbar: true, fx: { shadows: 0.24, zoom: [1, 1.1], sweep: 0.5, motes: 0.5, flashC: [255, 232, 170] },
    setup() {
      const c = window.__c, f = window.__f, g = XIEYI.game; c.at(33, 0.45);
      f.arm(['九閽鳴雷', '鎢鋼劍'], '九閽鳴雷');
      const e = f.fight('封豨', 0, 0, 6, 0, { chargeCD: 0, quakeCD: 99, callCD: 99, eatCD: 99, moveT: 0.15 });
      f.face(1, 0); window.__e = e;
    },
    frame({ f }) {
      const F = window.__f, e = window.__e, g = XIEYI.game, p = g.player;
      if (e && (e.state === 'charge' || e.state === 'wind')) window.__speed(2);   // 蓄力、直衝：速度線
      if (e && e.state === 'charge' && !window.__dodged) { window.__dodged = f; F.step(0, -1); window.__slow(20, 0.45); }
      if (window.__dodged && f === window.__dodged + 5) F.step(0, -1);
      if (window.__dodged && (f === window.__dodged + 12 || f === window.__dodged + 18)) F.step(-1, 0);   // 閃開以後往旁邊跑兩步
      if (window.__dodged && (f === window.__dodged + 50 || f === window.__dodged + 58)) F.away(e.x + 1, e.y + 1, [0, 1]);   // 震圈之後再拉開
      if (f === 140 && e && U.cheb(e.x + 0.5, e.y + 0.5, p.x, p.y) > 3) F.toward({ x: e.x, y: e.y });
      if (window.__dodged && f === window.__dodged + 30) { e.quakeCD = 0; e.chargeCD = 99; e.moveT = 0; }
      if (f === 150) { F.faceTo(e); window.__slow(14, 0.4); F.E(); }
    },
  },
  {   // 修蛇：洞庭湖上，修蛇纏住船，頭露在外面——打頭多吃五成
    name: 'snake', sec: 5, seed: 7, tile: 84, rand: 12, bossbar: true, fx: { grade: 'sea', shadows: 0.18, rays: 0.1, zoom: [1, 1.08], storm: true, stormAt: 0.9, flashC: [255, 160, 80] },
    setup() {
      const c = window.__c, f = window.__f, g = XIEYI.game; c.at(34, 0.5);
      f.arm(['鎢鋼劍', '燭龍焚溟'], '鎢鋼劍');
      const z = g.bossZone('修蛇'), [x, y] = f.sea(z.x + 4, z.y + 2, /[湖]/); f.sail(x, y);
      g.startFight('修蛇', 'none');
      const e = g.bossEnt(); if (e) { const b = f.near(x + 4, y + 1, '修蛇', 6); e.x = e.rx = b[0]; e.y = e.ry = b[1]; Object.assign(e, { diveCD: 99, gapeCD: 99, coilCD: 0.6, under: false, moveT: 0.1 }); }
      f.face(1, 0); window.__e = e;
    },
    frame({ f }) {
      const F = window.__f, e = window.__e;
      if (f === 3 || f === 10) F.boat(0, -1); if (f === 17) F.boat(-1, 0);   // 先轉舵想甩開牠
      if (e && e.state === 'coil' && (f % 18 === 0)) { F.faceTo(e); F.E(); }
      if (f === 120) F.hold('燭龍焚溟');
      if (f === 130) { F.faceTo(e); window.__slow(14, 0.4); F.E(); }
    },
  },
  {   // 大風：青丘，摧屋拔木——九格長的狂風捲過，樹拔成土、磚吹壞；接著俯衝下來抓人
    name: 'wind', sec: 5.6, seed: 7, tile: 72, rand: 13, bossbar: true, fx: { shadows: 0.3, rays: 0.08, zoom: [1, 1.06], storm: true, stormAt: 0.6, flashC: [170, 230, 255] },
    setup() {
      const c = window.__c, f = window.__f, g = XIEYI.game, w = g.world; c.at(35, 0.5);
      f.arm(['青冥落羽', '鎢鋼刀'], '青冥落羽');
      const e = f.fight('大風', 0, 0, -7, 0, { state: 'sky', galeCD: 99, diveCD: 99, whirlCD: 99, sandCD: 99, moveT: 0.3 });
      const p = g.player;
      for (let x = p.x - 5; x <= p.x - 2; x++) for (let y = p.y - 1; y <= p.y + 1; y++) w.set(x, y, (x + y) % 2 ? '木' : '林');
      for (const [x, y] of [[p.x - 1, p.y - 2], [p.x - 1, p.y + 2]]) w.set(x, y, '磚');
      f.face(-1, 0); window.__e = e;
    },
    frame({ f }) {
      const F = window.__f, e = window.__e, p = XIEYI.game.player;
      if (f === 6) { e.galeCD = 0; e.moveT = 0; }
      if (e && e.gale && !window.__galeDodge) window.__galeDodge = f;   // 狂風的路一畫出來就側步閃開
      if (window.__galeDodge && (f === window.__galeDodge + 4 || f === window.__galeDodge + 9)) F.step(0, -1);
      if (e && e.state === 'dive' && U.cheb(e.x, e.y, p.x, p.y) <= 3 && !window.__diveDodge) { window.__diveDodge = f; F.step(1, 1); }   // 俯衝下來，往旁一閃
      if (window.__diveDodge && f === window.__diveDodge + 6) F.step(1, 0);
      if (f === 70) { e.galeCD = 99; e.diveCD = 0; e.moveT = 0; }
      if (e && e.state === 'dive') window.__speed(2);   // 俯衝下來：速度線
      if (f === 140) { F.faceTo(e); window.__f.E(); window.__hit(0.55, [170, 230, 255]); }
    },
  },
  {   // 共工・海：在地裡游，身後留下兩格寬的淖；貼到你腳下，鑽出來
    name: 'gongsea', sec: 4.2, seed: 7, tile: 76, rand: 14, bossbar: true, fx: { grade: 'gong', shadows: 0.2, rays: 0.06, vig: 0.52, zoom: [1, 1.08], storm: true, stormC: [96, 34, 30], stormAt: 0.8, embers: 0.35, flashC: [255, 160, 80] },
    setup() {
      const c = window.__c, f = window.__f, g = XIEYI.game; c.at(60, 0.5);
      g.player.bosses = { '修蛇': { day: 1 }, '封豨': { day: 1 }, '大風': { day: 1 } }; f.arm(['燭龍焚溟', '九閽鳴雷', '青冥落羽'], '燭龍焚溟');
      const e = f.fight('共工', 6, 4, 6, 1, Object.assign(g.ents.gongFresh('sea'), { modeT: 999, digCD: 0 }));
      f.face(1, 0); window.__e = e;
    },
    frame({ f }) {
      const F = window.__f, e = window.__e;
      const p = XIEYI.game.player;
      if (f === 18) F.step(0, -1); if (f === 26) F.step(-1, -1); if (f === 36) F.step(-1, 0);   // 人遊走，牠在地裡追，淖拖成一道彎
      if (e && e.dig && !window.__digDodge) window.__digDodge = f;   // 腳下一冒泡，跳開
      if (window.__digDodge && (f === window.__digDodge + 3 || f === window.__digDodge + 8)) F.away(e.dig ? e.dig.x : e.x, e.dig ? e.dig.y : e.y, [-1, 1]);
      if (f === 100) { F.faceTo(e); window.__slow(14, 0.4); F.E(); }
    },
  },
  {   // 共工・陸：三格高，天上落三顆隕石「◎」，接著頭觸；九閽鳴雷劈回去
    name: 'gongland', sec: 4.2, seed: 7, tile: 76, rand: 15, bossbar: true, fx: { grade: 'gong', shadows: 0.2, rays: 0.06, vig: 0.52, zoom: [1, 1.08], storm: true, stormC: [96, 34, 30], stormAt: 0.5, embers: 0.6, flashC: [255, 232, 170] },
    setup() {
      const c = window.__c, f = window.__f, g = XIEYI.game; c.at(60, 0.5);
      g.player.bosses = { '修蛇': { day: 1 }, '封豨': { day: 1 }, '大風': { day: 1 } }; f.arm(['九閽鳴雷', '燭龍焚溟', '青冥落羽'], '九閽鳴雷');
      const e = f.fight('共工', 6, 4, 4, 0, Object.assign(g.ents.gongFresh('land'), { modeT: 999, meteorCD: 0.1, buttCD: 2 }));
      f.face(1, 0); window.__e = e;
    },
    frame({ f }) {
      const F = window.__f, e = window.__e;
      const p = XIEYI.game.player;
      if (e && e.meteor && !window.__metDodge) { window.__metDodge = f; const cs = e.meteor.cells; window.__metC = [cs.reduce((a, c) => a + c[0], 0) / cs.length, cs.reduce((a, c) => a + c[1], 0) / cs.length]; }   // 三顆隕石的圈一畫出來
      if (window.__metDodge && [4, 9, 14].includes(f - window.__metDodge)) F.away(window.__metC[0], window.__metC[1], [-1, -1]);   // 連跳三步出圈
      if (f === 74 || f === 81) F.toward(e);   // 隕石落完，回身逼近
      if (f === 96) { F.faceTo(e); window.__slow(14, 0.4); F.E(); }
    },
  },
  {   // 共工・空：浮在天上，星移斗轉、畫面斜了；力壓千鈞落在你腳下；青冥落羽射上去
    name: 'gongsky', sec: 4.2, seed: 7, tile: 76, rand: 16, bossbar: true, fx: { grade: 'gong', shadows: 0.24, rays: 0.1, vig: 0.52, zoom: [1.08, 1], storm: true, stormC: [96, 34, 30], stormAt: 0.4, flashC: [170, 230, 255] },
    setup() {
      const c = window.__c, f = window.__f, g = XIEYI.game; c.at(60, 0.5);
      g.player.bosses = { '修蛇': { day: 1 }, '封豨': { day: 1 }, '大風': { day: 1 } }; f.arm(['青冥落羽', '九閽鳴雷', '燭龍焚溟'], '青冥落羽');
      const e = f.fight('共工', 6, 4, 4, -1, Object.assign(g.ents.gongFresh('sky'), { modeT: 999, starCD: 0.2, pressCD: 0.8 }));
      f.face(1, -1); window.__e = e;
    },
    frame({ f }) {
      const F = window.__f, e = window.__e, g = XIEYI.game, p = g.player;
      if (e && e.press && !window.__pressDodge) window.__pressDodge = f;   // 腳下一圈「壓」，跑出去
      if (window.__pressDodge && [3, 8, 13].includes(f - window.__pressDodge)) F.away(e.press ? e.press.x : p.x + 1, e.press ? e.press.y : p.y, [-1, 1]);
      if (f === 64) F.step(1, 0);
      if (f === 80 || f === 112) { F.faceTo(e); g.action = null; p.atkT = 0; const t = g.skyTarget(); if (t) { g.bowShot(t); window.__hit(0.6, [170, 230, 255]); if (f === 80) window.__slow(12, 0.4); } }
    },
  },
];

// 片頭、片尾跟第一支同一份字標（tools/capture/title.html）：片頭放快一些（節奏比第一支快）
const TITLE_SPEED = 1.4;
const SEEK = ({ f, fps, arg }) => { for (const a of document.getAnimations()) a.currentTime = f * 1000 / fps * (arg || 1); };
SHOTS.splice(1, 0, { name: 'title', sec: 3.4, page: 'title.html', arg: TITLE_SPEED, setup() { for (const a of document.getAnimations()) a.pause(); }, frame: SEEK });
SHOTS.push({ name: 'end', sec: 4, page: 'title.html', setup() { document.body.classList.add('end'); document.getElementById('url').style.display = 'none'; for (const a of document.getAnimations()) { a.pause(); a.currentTime = 9000; } } });
