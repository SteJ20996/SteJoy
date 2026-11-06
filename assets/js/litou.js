// 《力透紙背》介紹頁：標題的墨、標誌照「力」的筆順寫出來、節標題捲到才寫、一卷五章的超正方體、試寫（按 1–0 照筆順寫成字）。
// 遊戲的資料在 assets/litou/data.js（window.LITOU，由 tools/litou/data.mjs 從遊戲庫產生），標誌是 assets/litou/mark.js（遊戲的 src/mark.js）。
(() => {
  const D = window.LITOU, reduce = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
  const NS = 'http://www.w3.org/2000/svg', $ = (id) => document.getElementById(id);

  // ---------- 標題：墨暈與紙背反字用 data-g；身後橫掃一筆、「力」濺出硃砂 ----------
  const logo = document.querySelector('.lt-logo');
  if (logo && D) {
    const spans = [...logo.querySelectorAll(':scope > span')]; spans.forEach(s => s.dataset.g = s.textContent);
    const sw = document.createElementNS(NS, 'svg');
    sw.setAttribute('class', 'sweep'); sw.setAttribute('viewBox', '0 0 1000 200'); sw.setAttribute('preserveAspectRatio', 'none'); sw.setAttribute('aria-hidden', 'true');
    sw.innerHTML = '<defs><linearGradient id="lt-sg" x1="0" x2="1"><stop offset="0" stop-color="#fff"/><stop offset=".45" stop-color="#fff"/><stop offset=".8" stop-color="#fff" stop-opacity="0"/></linearGradient><mask id="lt-sm" maskUnits="userSpaceOnUse" x="0" y="0" width="1000" height="200"><rect width="1000" height="200" fill="url(#lt-sg)"/></mask></defs>' +
      '<g fill="rgba(28,26,23,.15)"><path d="' + D.sweep.d + '" filter="url(#f-dry)"/><path d="' + D.sweep.d + '" mask="url(#lt-sm)"/></g><path d="' + D.sweep.dry + '" fill="none" stroke="rgba(239,229,207,.9)" stroke-width="3.2" stroke-linecap="round"/>';
    logo.appendChild(sw);
    const DROPS = [[-8, 96, 5.2], [-21, 86, 2.6], [-2, 112, 2], [-26, 104, 1.4], [-14, 70, 1.1], [112, 30, 3.4], [124, 18, 1.5], [104, 100, 2.2], [118, 92, 1.1]], C = [48, 54], f = (v) => v.toFixed(1);
    const sp = document.createElementNS(NS, 'svg'); sp.setAttribute('class', 'splat'); sp.setAttribute('viewBox', '-38 -38 176 176'); sp.setAttribute('aria-hidden', 'true');
    sp.innerHTML = DROPS.map(([x, y, r], i) => { const a = Math.atan2(y - C[1], x - C[0]) * 180 / Math.PI; return '<g style="--i:' + i + '" fill="#b4392a" opacity="' + (r > 2 ? .85 : .7) + '"><circle cx="' + x + '" cy="' + y + '" r="' + r + '"/>' + (r > 1.5 ? '<path d="M' + f(x) + ' ' + f(y - r * .55) + ' L' + f(x - r * 3.4) + ' ' + f(y) + ' L' + f(x) + ' ' + f(y + r * .55) + 'Z" transform="rotate(' + f(a + 180) + ' ' + f(x) + ' ' + f(y) + ')"/>' : '') + '</g>'; }).join('');
    spans[0].appendChild(sp);
  }

  // ---------- 標誌：這個環是一個「力」，橫折鉤、撇，照筆順寫出來 ----------
  const mark = document.querySelector('.lt-mark');
  if (mark && window.MARK) { MARK.mount(mark); MARK.play(); }

  // ---------- 節標題：捲到才寫出那一筆 ----------
  const secs = [...document.querySelectorAll('.lt-sec, .lt-dims')];
  secs.forEach(s => s.classList.add('lt-reveal'));
  if ('IntersectionObserver' in window && !reduce) {
    const io = new IntersectionObserver((list) => { for (const e of list) if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } }, { threshold: 0.12 });
    secs.forEach(s => io.observe(s));
  } else secs.forEach(s => s.classList.add('in'));

  // ---------- 一卷：超正方體從一個點展開——點 → 線 → 面 → 體 → 四維 ----------
  const cv = $('lt-hypercube'), steps = [...document.querySelectorAll('.lt-step')], num = document.querySelector('.lt-hc-n');
  if (cv && steps.length) {
    const ctx = cv.getContext('2d'), V = [], E = [];
    for (let i = 0; i < 16; i++) V.push([i & 1 ? 1 : -1, i & 2 ? 1 : -1, i & 4 ? 1 : -1, i & 8 ? 1 : -1]);
    for (let i = 0; i < 16; i++) for (let k = 0; k < 4; k++) { const j = i ^ (1 << k); if (j > i) E.push([i, j, k]); }
    // 頂點上的字固定、不重複（使用者看到兩個頂點都叫「人」）：頂點 i 的四個位元是 x y z w，第幾個方向展開時分出來，就寫那一章的字，
    // 筆數跟著維度長：人（起點）、十（一維，兩筆）、大口（二維的招，三筆）、天水火木（三維的浮字，四筆）、永玉石古本生正立（射墨字與字盾，五筆）
    const LABELS = [...'人十大口天水火木永玉石古本生正立'], labels = LABELS.map((c, i) => D && D.chars[c] ? c : Object.keys(D ? D.chars : {}).filter(x => D.chars[x].seq.length >= 2 && !LABELS.includes(x))[i] || '');
    let s = 0, target = 0, t0 = performance.now(), W = 0, H = 0, dpr = 1;
    const size = () => { const r = cv.getBoundingClientRect(); dpr = Math.min(2, window.devicePixelRatio || 1); W = r.width; H = r.height; cv.width = Math.round(W * dpr); cv.height = Math.round(H * dpr); };
    size(); addEventListener('resize', size);   // 頁面縮放時 site.js 也會發一次 resize
    // 捲到哪一章：第 i 章的內容在讀的地方時，超正方體停在 i 維；兩章交界經過讀的地方，才長出下一個方向
    // （以前是「這一章讀了幾成就長幾成」，讀第二章時已經長出三維，使用者說動畫比文字早）。
    // 讀的地方：寬螢幕是畫面正中；手機上超正方體黏在頂上，是它底下那一塊的正中
    // 畫面多高：量一個釘滿畫面的空元素，跟其他元素的位置同一套座標（左下角把頁面縮放了也對得上）
    const vp = document.createElement('div'); vp.setAttribute('aria-hidden', 'true'); vp.style.cssText = 'position:fixed;left:0;top:0;width:1px;height:100%;visibility:hidden;pointer-events:none';
    document.body.appendChild(vp);
    const hcBox = cv.parentElement, ease = (v) => v <= 0 ? 0 : v >= 1 ? 1 : v * v * (3 - 2 * v);
    const measure = () => {
      const hb = hcBox.getBoundingClientRect(), sr = steps[0].getBoundingClientRect(), vh = vp.getBoundingClientRect().height || innerHeight, top = hb.right > sr.left + 1 ? Math.max(0, hb.bottom) : 0;
      const mid = (top + vh) / 2, half = (vh - top) * 0.12;
      const c = steps.map(el => { const r = el.getBoundingClientRect(); el.classList.toggle('on', r.top < mid + half && r.bottom > mid - half); return r.top + r.height / 2; });
      let v = mid >= c[c.length - 1] ? c.length - 1 : 0;
      for (let i = 0; i < c.length - 1; i++) if (mid >= c[i] && mid < c[i + 1]) { const u = (mid - c[i]) / (c[i + 1] - c[i]); v = i + ease((u - 0.3) / 0.4); }   // 前三成停在 i、中間四成換、後三成停在 i+1
      target = Math.max(0, Math.min(4, v));
    };
    addEventListener('scroll', measure, { passive: true }); measure();
    // 四維 → 二維：xw、yw、xz、yz 四個平面轉，再兩次透視（這是加寬以前的透視，近處的頂點放得大）
    const project = (v, a, t) => {
      const A1 = t * 0.35 * a[2], A2 = t * 0.27 * a[3], A3 = 0.5 + t * 0.12 * a[2];
      let [x, y, z, w] = v.map((c, k) => c * a[k]);
      let c = Math.cos(A2), q = Math.sin(A2); [x, w] = [x * c - w * q, x * q + w * c];            // xw 平面轉
      c = Math.cos(A1 * 0.7); q = Math.sin(A1 * 0.7); [y, w] = [y * c - w * q, y * q + w * c];    // yw
      c = Math.cos(A3); q = Math.sin(A3); [x, z] = [x * c - z * q, x * q + z * c];                // xz
      c = Math.cos(0.42 * a[2]); q = Math.sin(0.42 * a[2]); [y, z] = [y * c - z * q, y * q + z * c];
      const k4 = 2.6 / (2.6 - w * 0.9), k3 = 4.2 / (4.2 - z * k4 * 0.9);   // 一路轉下去分母最小約 1.0 與 1.7（量過），不會翻過去
      return [x * k4 * k3, y * k4 * k3, z * k4, w, k4 * k3];
    };
    // 展開到 s 時，頂點一路轉下去最遠到哪（x、y 各自）：每 0.05 算一格（三千個時刻、一格約十毫秒，捲到才算），兩格之間內插
    const EXT = [], ext = (sv) => {
      const cell = (b) => {
        if (EXT[b]) return EXT[b];
        const a = [0, 1, 2, 3].map(k => Math.max(0, Math.min(1, b / 20 - k))); let mx = 0.01, my = 0.01;
        for (let n = 0; n < 3000; n++) { const t = n * 0.42; for (const v of V) { const p = project(v, a, t); mx = Math.max(mx, Math.abs(p[0])); my = Math.max(my, Math.abs(p[1])); } }
        return (EXT[b] = [mx * 1.02, my * 1.02]);
      };
      const b = Math.max(0, Math.min(80, sv * 20)), b0 = Math.floor(b), b1 = Math.min(80, b0 + 1), f = b - b0, e0 = cell(b0), e1 = cell(b1);
      return [e0[0] + (e1[0] - e0[0]) * f, e0[1] + (e1[1] - e0[1]) * f];
    };
    const draw = (now) => {
      const t = (now - t0) / 1000;
      s += (target - s) * (reduce ? 1 : 0.08);
      if (num) { const n = Math.min(4, Math.round(s)); if (num.textContent !== String(n)) num.textContent = n; }
      const a = [0, 1, 2, 3].map(k => Math.max(0, Math.min(1, s - k + 0.0)));   // 第 k 個方向展開了幾成
      const P = V.map(v => project(v, a, t));
      // 大圖（使用者要回到加寬以前那種透視），但整個要放得進畫布：每個展開程度先算過頂點會轉到多遠（ext），照最遠的定比例，
      // 不會被框切掉，也不會一陣一陣縮放
      const base = Math.min(W, H) * 0.2, pad = W < 520 ? 18 : 34, [ex, ey] = ext(s), sc = Math.min(base, (W / 2 - pad) / ex, (H / 2 - pad) / ey);
      for (const p of P) { p[0] = W / 2 + p[0] * sc; p[1] = H / 2 + p[1] * sc; }
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0); ctx.clearRect(0, 0, W, H);
      ctx.lineCap = 'round';
      for (const [i, j, k] of E) {
        const len = a[k]; if (len <= 0.001) continue;
        const p = P[i], q2 = P[j], depth = (p[4] + q2[4]) / 2, fresh = k === Math.min(3, Math.floor(s)) && s < 4 && s % 1 > 0.02;
        ctx.strokeStyle = fresh ? 'rgba(224, 90, 69, .95)' : `rgba(239, 229, 207, ${Math.min(.9, .25 + depth * .38)})`;
        ctx.lineWidth = (fresh ? 2.6 : 1.2 + depth * 0.9);
        ctx.beginPath(); ctx.moveTo(p[0], p[1]); ctx.lineTo(q2[0], q2[1]); ctx.stroke();
      }
      // 頂點：一開始只有一個點；展開以後每個頂點是一個字（固定，見 LABELS）
      if (s < 0.15) {
        const g = ctx.createRadialGradient(W / 2, H / 2, 0, W / 2, H / 2, 40); g.addColorStop(0, 'rgba(239,229,207,.9)'); g.addColorStop(.18, 'rgba(239,229,207,.9)'); g.addColorStop(.2, 'rgba(239,229,207,.18)'); g.addColorStop(1, 'rgba(239,229,207,0)');
        ctx.fillStyle = g; ctx.beginPath(); ctx.arc(W / 2, H / 2, 40, 0, Math.PI * 2); ctx.fill();
      }
      if (s > 0.6) {
        const vis = Math.min(1, (s - 0.6) * 1.5);
        // 還沒展開的方向上，頂點疊在同一點（一維時十六個頂點只有兩個位置）：那個方向展開了，分出來的頂點的字才淡進來，疊著的只畫一個
        P.map((p, i) => [p, i]).sort((m, n) => m[0][4] - n[0][4]).forEach(([p, i]) => {
          let al = vis; for (let k = 0; k < 4; k++) if (i >> k & 1) al *= ease((a[k] - 0.04) / 0.26);   // 一離開重疊就全亮（展開三成時已分開幾個字寬）
          if (al < 0.02) return;
          const fs = Math.max(11, 13 * p[4] + 4);
          ctx.font = fs + 'px "LXGW WenKai TC", serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
          ctx.fillStyle = `rgba(21, 19, 15, ${.85 * al})`; ctx.beginPath(); ctx.arc(p[0], p[1], fs * 0.72, 0, Math.PI * 2); ctx.fill();
          ctx.fillStyle = i === 0 ? `rgba(224, 90, 69, ${al})` : `rgba(239, 229, 207, ${0.95 * al})`;   // 每個頂點的字一樣亮（遠近只看線）
          ctx.fillText(labels[i], p[0], p[1] + 1);
        });
      }
      requestAnimationFrame(draw);
    };
    requestAnimationFrame(draw);
  }

  // ---------- 試寫：按 1–0 寫一筆，照筆順寫成字就成字，寫不成字筆就散 ----------
  const sec = $('write');
  if (sec && D) {
    const T = JSON.parse(sec.dataset.t), lang = T.lang, ink = $('lt-ink'), grid = document.querySelector('.lt-grid');
    const big = $('lt-big'), read = $('lt-read'), seqBox = $('lt-seq'), cands = $('lt-cands'), count = $('lt-count');
    const keys = [...document.querySelectorAll('.lt-key')], byCode = {}, byKey = {};
    D.strokes.forEach(s => { byCode[s.c] = s; byKey[s.key] = s.c; });
    const CH = D.chars, ALL = Object.keys(CH), done = new Set();
    let buf = '', timer = 0, demo = true, demoT = 0, missing = false;
    const icon = (c) => '<svg viewBox="0 0 240 240" aria-hidden="true"><path d="' + byCode[c].icon + '"/></svg>';
    const sname = (c) => lang === 'en' ? byCode[c].en : lang === 'zh-Hans' ? byCode[c].hans : byCode[c].zh;
    const readOf = (ch) => CH[ch].py + (lang === 'en' ? ' · ' + CH[ch].en : '');
    const order = (a, b) => CH[a].seq.length - CH[b].seq.length || ALL.indexOf(a) - ALL.indexOf(b);
    function show(state, ch, fresh) {
      grid.classList.remove('got', 'miss'); big.classList.remove('got', 'miss');
      const lead = ch || ALL.filter(c => CH[c].seq.startsWith(buf)).sort(order)[0];
      ink.innerHTML = lead ? CH[lead].d.map((d, i) => '<path class="' + (i < buf.length ? 'ink' + (fresh && i === buf.length - 1 ? ' fresh' : '') : i === buf.length && state !== 'got' ? 'next' : 'todo') + '" d="' + d + '"/>').join('') : '';
      seqBox.innerHTML = buf.split('').map(icon).join('');
      const more = ALL.filter(c => CH[c].seq.startsWith(buf) && CH[c].seq !== buf).sort(order).slice(0, 8);
      cands.innerHTML = buf && more.length ? T.write_cands + '：' + more.map(c => '<b>' + c + '</b>').join(' ') : '';
      if (state === 'got') { big.textContent = ch; big.classList.add('got'); grid.classList.add('got'); read.textContent = readOf(ch) + ' — ' + T.write_got; void big.offsetWidth; }
      else if (buf) { big.textContent = ''; read.textContent = buf.split('').map(sname).join(lang === 'en' ? ', ' : '、'); }
      else { big.textContent = ''; read.textContent = T.write_idle; }
      const nx = lead && state !== 'got' ? CH[lead].seq[buf.length] : null;
      keys.forEach(k => k.classList.toggle('next', k.dataset.code === nx));
      count.textContent = done.size ? T.write_count.replace('{n}', done.size).replace('{N}', ALL.length) : '';
    }
    function miss(code) {
      // 寫不成字：筆散掉（每一筆往外飛），再從這一筆重新開始
      const paths = [...ink.querySelectorAll('path')];
      ink.innerHTML = buf.split('').map((c, i) => { const lead = ALL.find(x => CH[x].seq.startsWith(buf.slice(0, i + 1))); return lead ? '<path class="ink" d="' + CH[lead].d[i] + '" style="--sx:' + ((Math.random() - .5) * 160).toFixed(0) + 'px;--sy:' + (40 + Math.random() * 80).toFixed(0) + 'px;--sr:' + ((Math.random() - .5) * 60).toFixed(0) + 'deg"/>' : ''; }).join('');
      grid.classList.remove('miss', 'got'); void grid.getBoundingClientRect(); grid.classList.add('miss'); missing = true;
      big.textContent = T.write_none; big.classList.add('miss'); read.textContent = ''; cands.innerHTML = '';
      clearTimeout(timer); timer = setTimeout(() => { missing = false; buf = ''; if (code && ALL.some(c => CH[c].seq.startsWith(code))) { buf = code; } show('', null, true); }, 520);
    }
    function stroke(code, fromUser) {
      if (fromUser) { demo = false; }
      const kb = keys.find(k => k.dataset.code === code); if (kb) { kb.classList.add('hit'); setTimeout(() => kb.classList.remove('hit'), 110); }
      clearTimeout(timer);
      if (missing) { missing = false; buf = ''; }   // 筆還在散：直接從這一筆重新開始
      // 剛寫成一個字、這一筆又接不下去：提筆成字，這一筆是下一個字的第一筆（跟遊戲一樣）。
      // 只有一筆的「字」（一丨丿丶乀）不算：點了一點再接豎鉤，是想寫別的字寫錯了，要散給人看（使用者試出來的）
      if (buf.length >= 2 && ALL.some(c => CH[c].seq === buf) && !ALL.some(c => CH[c].seq.startsWith(buf + code))) buf = '';
      const next = buf + code;
      if (!ALL.some(c => CH[c].seq.startsWith(next))) { buf = next; miss(code); return; }
      buf = next;
      const exact = ALL.find(c => CH[c].seq === buf);
      if (exact) { done.add(exact); show('got', exact, true); }
      else show('', null, true);
    }
    function reset() { clearTimeout(timer); buf = ''; show(''); }
    keys.forEach(k => k.addEventListener('click', () => { stroke(k.dataset.code, true); k.blur(); }));
    $('lt-reset').addEventListener('click', () => { demo = false; reset(); });
    addEventListener('keydown', (e) => {
      if (e.ctrlKey || e.metaKey || e.altKey || (e.target && /^(INPUT|TEXTAREA|SELECT)$/.test(e.target.tagName))) return;
      const m = /^(?:Digit|Numpad)([0-9])$/.exec(e.code);
      if (m && !e.repeat) { stroke(byKey[m[1] === '0' ? '0' : m[1]], true); return; }
      if (e.key === 'Backspace' || e.key === 'Escape') { if (buf) { demo = false; reset(); } }
    });
    show('');
    // 沒人動的時候自己寫：力、大、永、人、木……（一有人按鍵就停）
    const DEMO = ['力', '大', '永', '火', '中', '木', '天'].filter(c => CH[c]);
    if (!reduce && 'IntersectionObserver' in window) {
      let seen = false, di = 0;
      new IntersectionObserver((l) => { seen = l[0].isIntersecting; }, { threshold: 0.4 }).observe(sec);
      const tick = () => {
        if (!demo) return;
        if (seen) {
          const ch = DEMO[di % DEMO.length], seq = CH[ch].seq;
          if (buf.length < seq.length && seq.startsWith(buf)) stroke(seq[buf.length], false);
          else { reset(); di++; }
          demoT = setTimeout(tick, buf.length === seq.length && seq.startsWith(buf) && buf ? 1700 : 480);
        } else demoT = setTimeout(tick, 600);
      };
      demoT = setTimeout(tick, 900);
    }
  }
})();
