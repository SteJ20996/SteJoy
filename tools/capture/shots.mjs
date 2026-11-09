// 預告與網站的鏡頭。每個函式都在遊戲頁面裡跑（page.evaluate），所以只能用頁面裡的東西：XIEYI、World、G、U。
// setup(arg) 擺場面；frame({ f, n, fps, arg }) 每一幀先跑，再推進 1/30 息、截圖。

// 每個鏡頭都先跑：關掉真隨機的事件、關 HUD、字放大、人不會死
export const COMMON = ({ tile }) => {
  const g = XIEYI.game, w = g.world, p = g.player;
  g.ents.seaP = 0; g.ents.toothP = 0; g.ents.harpyP = 0; g.ents.birdP = 0; g.ents.snuffP = 0;
  w.fogP = 0; w.fogStep = 1e9; g.warnEnabled = false; g.visitsOn = false; w.hailP = 0;
  w.snowP = 0; w.thunderP = 0; w.galeP = 0; w.breezeP = 0; w.galeRuinP = 0; w.galeScareP = 0; g.galePushP = 0;
  w.rainUntil = 0; w.nextRainAt = 1e12;
  p.tut = Object.assign(p.tut || {}, { farm: 1, mouse: 1, pounce: 1, sparrowLocust: 1, roomFit: 1 });
  g.renderer.tile = tile;
  const st = document.createElement('style'); st.id = 'cine';
  st.textContent = 'body > *:not(#world):not(#sky){display:none!important}';
  document.head.appendChild(st);
  setInterval(() => { p.hp = p.maxHp || 100; p.san = 100; p.food = 95; p.warm = 95; p.sta = 100; p.insane = false; p.knock = 0; }, 100);
  const DAY = XIEYI.DAY;
  window.__c = {
    DAY,
    at(day, frac) { w.time = DAY * day + DAY * frac; g.sunC = null; },
    dusk(day) { w.time = DAY * day; g.sunC = null; return g.duskT(); },
    key(code, down) { window.dispatchEvent(new KeyboardEvent(down ? 'keydown' : 'keyup', { code, bubbles: true })); },
    put(x, y) { p.x = p.rx = x; p.y = p.ry = y; },
    fill(x0, y0, x1, y1, ch) { for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) w.set(x, y, ch); },
    // 一間屋的格子：外框是磚，下面中間一扇門，左右各一扇窗；回傳照砌的順序排好的 [x, y, 字]
    house(cx, cy, hw, hh) {
      const out = [];
      for (let x = cx - hw; x <= cx + hw; x++) out.push([x, cy - hh]);
      for (let y = cy - hh + 1; y <= cy + hh; y++) out.push([cx + hw, y]);
      for (let x = cx + hw - 1; x >= cx - hw; x--) out.push([x, cy + hh]);
      for (let y = cy + hh - 1; y > cy - hh; y--) out.push([cx - hw, y]);
      return out.map(([x, y]) => [x, y, (y === cy + hh && x === cx) ? '門' : (y === cy - hh && Math.abs(x - cx) === Math.ceil(hw / 2)) ? '窗' : (x === cx - hw && y === cy) ? '窗' : '磚']);
    },
    home() {   // 出生點東南方清出一塊地，蓋好屋（各鏡頭共用）
      const cx = p.x + 1, cy = p.y + 1;
      this.fill(cx - 9, cy - 6, cx + 9, cy + 7, '草');
      for (const [x, y, ch] of this.house(cx, cy, 3, 2)) w.set(x, y, ch);
      w.set(cx - 2, cy - 1, '床'); w.set(cx + 2, cy - 1, '灶'); w.set(cx + 2, cy + 1, '櫃'); w.set(cx - 2, cy + 1, '燈');
      w.set(cx + 1, cy + 3, '燈'); w.set(cx - 5, cy + 4, '田'); w.set(cx - 4, cy + 4, '田'); w.set(cx - 3, cy + 4, '田');
      return { cx, cy };
    },
  };
};

export const SHOTS = [
  {   // 一、取木：人在林子裡往右走，一路採
    name: 'gather', sec: 6, seed: 7,
    setup() {
      const c = window.__c, g = XIEYI.game, p = g.player; c.at(2, 0.42);
      p.fx = 1; p.fy = 0;
    },
    frame({ f }) {
      const c = window.__c, g = XIEYI.game, p = g.player;
      const beat = f % 45;
      if (beat === 0) c.key('KeyD', true);
      if (beat === 8) c.key('KeyD', false);
      if (beat === 12) { p.fx = 0; p.fy = 1; const t = g.world.get(p.x, p.y + 1); if (!/[木林]/.test(t)) g.world.set(p.x, p.y + 1, '木'); g.action = null; g.pressGather(); }
    },
  },
  {   // 二、砌屋：一塊一塊砌起來，再擺床灶櫃燈
    name: 'build', sec: 6, seed: 7,
    setup() {
      const c = window.__c, g = XIEYI.game, p = g.player; c.at(2, 0.47);
      const cx = p.x + 1, cy = p.y + 1; c.fill(cx - 9, cy - 6, cx + 9, cy + 7, '草');
      c.put(cx, cy + 4); p.fx = 0; p.fy = -1;
      window.__plan = c.house(cx, cy, 3, 2).concat([[cx - 2, cy - 1, '床'], [cx + 2, cy - 1, '灶'], [cx + 2, cy + 1, '櫃'], [cx - 2, cy + 1, '燈'], [cx + 1, cy + 3, '燈']]);
    },
    frame({ f }) {
      const plan = window.__plan, i = Math.floor((f - 6) / 4);
      if (f >= 6 && (f - 6) % 4 === 0 && plan[i]) XIEYI.game.world.set(plan[i][0], plan[i][1], plan[i][2]);
    },
  },
  {   // 三、入夜：縮時從日落前快轉到天黑——燈照著的磚甓一起慢慢由墨色變成暗光（遊戲 v0.9.57），照不到的照舊是墨字；天黑透了魄從暗處飄來、在燈外徘徊，最後一隻撲上來被燈燒滅
    name: 'night', sec: 9, seed: 7,
    setup() {
      const c = window.__c, g = XIEYI.game, p = g.player; const dusk = c.dusk(12); c.at(12, dusk - 0.025);   // 第十三夜（試玩裡就有）；從日落前約三十分起
      const { cx, cy } = c.home(); c.put(cx - 1, cy); p.fx = 1; p.fy = 0;
      g.ents.dashT = 1e9; g.ents.list = g.ents.list.filter(e => e.type !== '狼' && e.type !== '虎');
      // 遊戲裡魄本來就穿得過磚（怕光穿磚），可是鏡頭裡停在磚上看起來像卡在牆裡：錄的時候不讓牠站上人造的東西
      const ents = g.ents, stand = ents.canStand.bind(ents), built = /[磚甓門窗墟扉籬燈灶櫃床鼎甕缸]/;
      ents.canStand = (type, x, y, night) => stand(type, x, y, night) && !(type === '魄' && built.test(g.world.get(x, y)));
      window.__home = { cx, cy, dusk };
    },
    frame({ f }) {
      const c = window.__c, g = XIEYI.game, w = g.world, h = window.__home;
      if (f < 135) w.time += c.DAY * 0.09 / 135;   // 前四息半：日落前三十分快轉到日落後九十多分（燈照著的字在日落後五刻亮足，約第一百一十幀）
      const spots = { 150: [h.cx + 8, h.cy - 3], 168: [h.cx - 8, h.cy + 4], 186: [h.cx + 7, h.cy + 6], 204: [h.cx - 6, h.cy - 5] };
      if (spots[f]) g.ents.add('魄', spots[f][0], spots[f][1], {});
      if (f === 240) g.ents.dashT = 0;
      if (f === 250) g.ents.dashT = 1e9;
    },
  },
  {   // 四、雪：開春的傍晚，屋裡屋外點著燈
    name: 'snow', sec: 6, seed: 7, warm: 1,
    setup() {
      const c = window.__c, g = XIEYI.game, p = g.player, w = g.world; const d = c.dusk(6); c.at(6, d + 0.01);   // 開春頭十天常下雪（試玩裡就有）
      const { cx, cy } = c.home(); c.put(cx + 3, cy + 4); p.fx = -1; p.fy = 0;
      w.set(cx + 5, cy - 3, '燈'); w.set(cx - 6, cy + 5, '燈');
      w.wx = 'snow'; w.rainUntil = w.time + c.DAY;
    },
    frame({ f }) {
      const c = window.__c, p = XIEYI.game.player, ev = window.__events = window.__events || { steps: [] };
      if (ev.at !== undefined && (p.x !== ev.px || p.y !== ev.py)) ev.steps.push(f - 1);   // 上一幀推進時走了一步（配樂的踩雪聲照這個）
      ev.at = f; ev.px = p.x; ev.py = p.y;
      if (f === 60) c.key('KeyA', true); if (f === 66) c.key('KeyA', false);
      if (f === 120) c.key('KeyA', true); if (f === 126) c.key('KeyA', false);
    },
  },
  {   // 五、雷雨：傍晚，雷落在屋外
    name: 'thunder', sec: 6, seed: 7,
    setup() {
      const c = window.__c, g = XIEYI.game, p = g.player, w = g.world; c.at(150, 0.66);
      const { cx, cy } = c.home(); c.put(cx, cy); p.fx = 0; p.fy = 1;
      w.wx = 'thunder'; w.rainUntil = w.time + c.DAY; window.__home = { cx, cy };
      g.boltT = 1e9;   // 不要遊戲自己隨機落的雷，只要下面排好的三道
      // 雷先亮一圈（boltWarn），一息後遊戲自己落下來（boltStrike：閃光、劈痕）；記下落在哪一幀，配樂的雷聲照這個對齊
      const ev = window.__events = { strikes: [] }, strike = g.boltStrike.bind(g);
      g.boltStrike = (x, y) => { ev.strikes.push(window.__frame); return strike(x, y); };
    },
    frame({ f }) {
      const g = XIEYI.game, h = window.__home;
      window.__frame = f; g.boltT = 1e9;
      const plan = { 10: [h.cx + 6, h.cy + 4], 70: [h.cx - 7, h.cy - 3], 120: [h.cx + 2, h.cy + 6] };
      if (plan[f]) g.boltWarn(plan[f][0], plan[f][1]);
    },
  },
  {   // 六、五穀：一塊田，字一筆一筆長出來
    name: 'crops', sec: 6, seed: 7,
    setup() {
      const c = window.__c, g = XIEYI.game, p = g.player, w = g.world; c.at(80, 0.45);
      const cx = p.x, cy = p.y; c.fill(cx - 9, cy - 6, cx + 9, cy + 6, '草');
      const kinds = ['黍', '稷', '菽', '黍', '稷'];
      w.onCrop = null; w.catNear = () => true; w.scared = () => true;
      window.__field = [];
      for (let j = -2; j <= 2; j++) for (let i = -6; i <= 6; i++) { const x = cx + i, y = cy + j; w.set(x, y, '田'); w.plant(x, y, kinds[(i + 6) % 5]); const r = w.crops.get(U.key(x, y)); r.pk = 2; r.ms = 2; window.__field.push(U.key(x, y)); }
      c.put(cx, cy + 4); p.fx = 0; p.fy = -1;
      g.ents.list = g.ents.list.filter(e => e.type !== '雀' && e.type !== '鼠');
    },
    frame({ f, n }) {
      const w = XIEYI.game.world, DAY = window.__c.DAY, step = 30 / (n - 30);
      if (f < 15 || f > n - 15) return;
      for (const k of window.__field) { const r = w.crops.get(k); if (r) r.t -= DAY * step; }
      w.cropDay = w.dayIdx() - 1; w.cropTick();
    },
  },
  {   // 六之二、造字（遊戲 v0.9.69 錄）：月夜，廢村井邊二十格內的一間屋，人把偏旁「子」擺進屋裡——「从子在宀下」，第一個字民「字」走出字典；
      // 那一刻天雨粟（身邊飄起「粟」），那一夜鬼夜哭（屋外的魄一隻隻散掉）。全是遊戲自己的 placeZi()，鏡頭只擺場面
    name: 'zi', sec: 6, seed: 7, warm: 0.5,
    setup() {
      const c = window.__c, g = XIEYI.game, p = g.player, w = g.world; const d = c.dusk(12); c.at(12, d + 0.07);   // 第十三夜（試玩裡就有），天黑透、月亮在天上
      const well = g.cunWell(), cx = well.x - 10, cy = well.y - 3;   // seed 7 的廢村東邊是海、西南有寺：屋蓋在村的西北邊，村井與一圈墟留在畫面右邊
      c.fill(cx - 6, cy - 6, well.x - 5, well.y, '草');
      for (const [x, y, ch] of c.house(cx, cy, 3, 2)) w.set(x, y, ch);
      w.set(cx - 2, cy - 1, '燈'); w.set(cx + 2, cy - 1, '櫃'); w.chests.set(U.key(cx + 2, cy - 1), [{ n: '稷', c: 4 }]);   // 屋裡一盞燈、一口櫃裝著穀（字民一天吃一份）
      w.set(well.x + 1, well.y + 2, '燈');
      c.put(cx + 1, cy + 1); p.fx = 0; p.fy = -1;
      p.cun = { wrote: { '休': 1, '明': 1, '囷': 1 } }; g.mingNow = true;   // 只錄「字」這一下：休明囷當作寫過了，屋裡有窗也不再跳「明」
      p.bag = [{ n: '子', c: 1 }]; p.sel = 0; g.barSig = '';
      g.ents.dashT = 1e9; g.ents.list = g.ents.list.filter(e => e.tame || e.type === '魚');
      const ents = g.ents, stand = ents.canStand.bind(ents), built = /[磚甓門窗墟扉籬燈灶櫃床鼎甕缸]/;   // 跟第十三夜那段一樣：錄的時候魄不站上人造的東西
      ents.canStand = (type, x, y, night) => stand(type, x, y, night) && !(type === '魄' && built.test(w.get(x, y)));
      for (const [x, y] of [[cx + 6, cy - 5], [cx - 7, cy + 3], [cx + 4, cy + 5], [cx - 5, cy - 6]]) g.ents.add('魄', x, y, {});
    },
    frame({ f }) {
      if (f === 45) XIEYI.game.placeZi();   // 一息半：擺下子
    },
  },
  {   // 七、觀星：晴夜抬頭，天慢慢轉。抬頭放慢（2026-11-06 使用者：預告第 35 秒抬頭太快）：第 36 幀才抬、走 4 息（遊戲裡是 1.6 息；遊戲自己會照 smoothstep 緩進緩出，這裡只把進度線性推慢），抬完了天才開始轉
    name: 'gaze', sec: 9.6, seed: 7, fresh: true,   // fresh：截到跟上一幀一樣的畫面就重截（capture.mjs）
    setup() {
      const c = window.__c, g = XIEYI.game, p = g.player; const d = c.dusk(11); c.at(11, Math.min(0.98, d + 0.12));   // 第十一夜，晴（試玩裡就有）
      const { cx, cy } = c.home(); c.put(cx, cy + 5); p.fx = 0; p.fy = -1;
      g.gazeCulture = 0;
    },
    frame({ f }) {
      const g = XIEYI.game, F0 = 36, RAISE = 120;   // 30 幀一息：1.2 息時抬頭、5.2 息抬完
      if (f === F0) g.toggleGaze();
      if (!g.gaze || f < F0) return;
      g.gaze.hit = g.hitN || 0;   // 2026-11-06 使用者：預告第 40 秒觀星有一陣抖動。錄影時命一直補滿，夜裡野獸咬了一口看不出來，可是遊戲記著「挨了打就回過神來低頭」，下面又每幀把頭拉回去，兩邊拉扯、天就上下跳（低多少看那一幀遊戲畫了幾回）。每幀把挨打的數對齊，不讓它低頭
      const u = Math.min(1, (f - F0) / RAISE);
      g.gaze.dir = u < 1 ? 0 : 1; g.gaze.s = u;   // 自己推抬頭的進度，不讓遊戲照 1.6 息走（畫的時候遊戲再照 smoothstep 緩進緩出）
      if (u >= 1) { const k = Math.min(1, (f - F0 - RAISE) / 30); g.gaze.az += 0.0035 * k; g.gaze.alt = Math.min(1.05, g.gaze.alt + 0.0012 * k); }   // 抬完了天才慢慢轉起來
      if (g.sky) g.sky.mwKey = null;   // 銀河每幀都重畫：遊戲為了省力，天在轉時銀河那層每 0.12 息才重畫一次，星每幀動、銀河一格一格跳
    },
    paint() { const g = XIEYI.game; g.renderer.draw(g, 0, g.animT || 0); if (g.gaze) g.gazeTick(0, false); },   // capture.mjs 截圖前叫：照這一幀的視角畫好（dt 0，live false 不判挨打）
  },
  {   // 八、渡海（完整版）：孤帆沿著海岸往東開，海上浮著蜃
    name: 'sail', sec: 6, seed: 7, full: true, warm: 1.5, tile: 56,
    setup() {
      const c = window.__c, g = XIEYI.game, p = g.player, w = g.world; c.at(40, 0.42);
      const wet = (x, y) => /[淼水]/.test(w.base(x, y));
      const clear = (x, y, r) => { for (let j = -r; j <= r; j++) for (let i = -r - 2; i <= r + 14; i++) if (!wet(x + i, y + j)) return false; return true; };
      const landNear = (x, y) => { let n = 0; for (let j = -9; j <= 9; j++) for (let i = 0; i <= 14; i++) if (!wet(x + i, y + j)) n++; return n; };
      let at = null, best = 0;
      for (let y = -170; y <= 170 && !at; y += 3) for (let x = 110; x <= 200; x += 3) if (clear(x, y, 2)) { const n = landNear(x, y); if (n > best && n < 120) { best = n; at = [x, y]; } }
      at = at || [180, 0];
      c.put(at[0], at[1]); p.sailing = true; p.ship = World.newShip('孤帆'); g.shipNow(); p.fx = 1; p.fy = 0;
      g.ents.add('蜃', at[0] - 2, at[1] + 4, { moveT: 0, atk: 1e9, fogT: 1e9 });   // 蜃在船後面跟著
      window.__sea = at;
    },
    frame({ f }) {
      const g = XIEYI.game;
      if (f >= 3 && f % 6 === 0) g.shipStep(1, 0, 'h');
    },
  },
  {   // 九、共工（完整版）：不周山
    name: 'gong', sec: 7, seed: 7, full: true, warm: 1.5, tile: 56, bossbar: true,
    setup() {
      const c = window.__c, g = XIEYI.game, p = g.player; c.at(60, 0.5);
      p.bosses = { '修蛇': { day: 1 }, '封豨': { day: 1 }, '大風': { day: 1 } };
      const z = g.bossZone('共工'); const at = g.nearestTile(z.x + 6, z.y + 4, (x, y) => g.ents.canStand('人', x, y), 20) || [z.x + 6, z.y + 4];
      c.put(at[0], at[1]); p.fx = -1; p.fy = 0;
      g.startFight('共工', 'none');
      const e = g.bossEnt(); if (e) { Object.assign(e, g.ents.gongFresh('land'), { modeT: 999 }); e.x = e.rx = at[0] - 5; e.y = e.ry = at[1] - 1; g.ents.gongSettle && g.ents.gongSettle(e); }
      document.getElementById('cine').textContent = 'body > *:not(#world):not(#sky):not(#hud){display:none!important} #hud > *:not(#bossbar){display:none!important}';
    },
  },
];

// 開頭：起始頁的字標一筆一筆寫出水（v0.9.50 照使用者手畫的七步：蜃身、浪頂、浪身、船底、桅杆、掛帆、蜃頭）；結尾：字標停住，下面寫網址
// 動畫約 4.1 息、這一段 4.6 息又要淡入下一段，預告裡放快 1.15 倍（3.4 息寫完），寫好的字標停得住
const TITLE_SPEED = 1.15;
const SEEK = ({ f, fps, arg }) => { for (const a of document.getAnimations()) a.currentTime = f * 1000 / fps * (arg || 1); };
SHOTS.unshift({ name: 'title', sec: 4.6, page: 'title.html', arg: TITLE_SPEED, setup() { for (const a of document.getAnimations()) a.pause(); }, frame: SEEK });
SHOTS.push({ name: 'end', sec: 4, page: 'title.html', setup() { document.body.classList.add('end'); for (const a of document.getAnimations()) { a.pause(); a.currentTime = 9000; } } });
