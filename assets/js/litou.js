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
    // 頂點上的字：不用單筆的「一丨丿丶乀」（看起來像一條線，蓋在別的字上像被一筆劃掉）
    const pool = Object.keys(D ? D.chars : {}).filter(c => D.chars[c].seq.length >= 2), labels = V.map((_, i) => pool[(i * 7 + 3) % pool.length] || '人');
    let s = 0, target = 0, t0 = performance.now(), W = 0, H = 0, dpr = 1, swap = 0, fit = 1;
    const size = () => { const r = cv.getBoundingClientRect(); dpr = Math.min(2, window.devicePixelRatio || 1); W = r.width; H = r.height; cv.width = Math.round(W * dpr); cv.height = Math.round(H * dpr); };
    size(); addEventListener('resize', size);
    const measure = () => {   // 捲到哪一章：那一章的中線過了畫面中間多少
      const mid = innerHeight * 0.5; let v = 0;
      steps.forEach((el, i) => { const r = el.getBoundingClientRect(); const p = (mid - r.top) / r.height; if (i === 0) v = Math.max(0, p); else if (p > 0) v = i + Math.min(1, p); el.classList.toggle('on', r.top < innerHeight * 0.62 && r.bottom > innerHeight * 0.38); });
      target = Math.max(0, Math.min(4, v - 0.35));
    };
    addEventListener('scroll', measure, { passive: true }); measure();
    const draw = (now) => {
      const t = (now - t0) / 1000;
      s += (target - s) * (reduce ? 1 : 0.08);
      if (num) { const n = Math.min(4, Math.round(s)); if (num.textContent !== String(n)) num.textContent = n; }
      const a = [0, 1, 2, 3].map(k => Math.max(0, Math.min(1, s - k + 0.0)));   // 第 k 個方向展開了幾成
      const A1 = t * 0.35 * a[2], A2 = t * 0.27 * a[3], A3 = 0.5 + t * 0.12 * a[2];
      const P = V.map(v => {
        let [x, y, z, w] = v.map((c, k) => c * a[k]);
        let c = Math.cos(A2), q = Math.sin(A2); [x, w] = [x * c - w * q, x * q + w * c];            // xw 平面轉
        c = Math.cos(A1 * 0.7); q = Math.sin(A1 * 0.7); [y, w] = [y * c - w * q, y * q + w * c];    // yw
        c = Math.cos(A3); q = Math.sin(A3); [x, z] = [x * c - z * q, x * q + z * c];                // xz
        c = Math.cos(0.42 * a[2]); q = Math.sin(0.42 * a[2]); [y, z] = [y * c - z * q, y * q + z * c];
        // 透視收斂一點：以前 k3 的分母乘上 k4，頂點轉到近處時分母趨近零、整個衝出畫面（使用者看到「左邊衝出去了」）
        const k4 = 3 / (3 - w * 0.6), k3 = 5 / (5 - z * 0.7);
        return [x * k4 * k3, y * k4 * k3, z * k4, w, k4 * k3];
      });
      // 放得進畫框：量這一格所有頂點的範圍，超出就整個縮小（平滑地縮，不會一跳一跳）；字的圓留一點邊
      let mx = 0.01, my = 0.01; for (const p of P) { mx = Math.max(mx, Math.abs(p[0])); my = Math.max(my, Math.abs(p[1])); }
      const base = Math.min(W, H) * 0.2, pad = 26, want = Math.min(base, (W / 2 - pad) / mx, (H / 2 - pad) / my);
      fit = want < fit * base ? want / base : fit + (want / base - fit) * 0.05;   // 要縮就立刻縮，要放大就慢慢放
      const sc = base * fit;
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
      // 頂點：一開始只有一個點；展開以後每個頂點是一個字，字隔一陣子換一個
      if (s < 0.15) {
        const g = ctx.createRadialGradient(W / 2, H / 2, 0, W / 2, H / 2, 40); g.addColorStop(0, 'rgba(239,229,207,.9)'); g.addColorStop(.18, 'rgba(239,229,207,.9)'); g.addColorStop(.2, 'rgba(239,229,207,.18)'); g.addColorStop(1, 'rgba(239,229,207,0)');
        ctx.fillStyle = g; ctx.beginPath(); ctx.arc(W / 2, H / 2, 40, 0, Math.PI * 2); ctx.fill();
      }
      if (t > swap) { swap = t + 1.1; const i = Math.floor(Math.random() * 16); labels[i] = pool[Math.floor(Math.random() * pool.length)] || '人'; }
      if (s > 0.6) {
        const vis = Math.min(1, (s - 0.6) * 1.5);
        // 還沒展開的方向上，頂點疊在同一點（一維時十六個頂點只有兩個位置）：那個方向展開了，分出來的頂點的字才淡進來，疊著的只畫一個
        const sm = (v) => v <= 0 ? 0 : v >= 1 ? 1 : v * v * (3 - 2 * v);
        P.map((p, i) => [p, i]).sort((m, n) => m[0][4] - n[0][4]).forEach(([p, i]) => {
          let al = vis; for (let k = 0; k < 4; k++) if (i >> k & 1) al *= sm((a[k] - 0.2) / 0.6);
          if (al < 0.02) return;
          const fs = Math.max(11, 13 * p[4] + 4);
          ctx.font = fs + 'px "LXGW WenKai TC", serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
          ctx.fillStyle = `rgba(21, 19, 15, ${.85 * al})`; ctx.beginPath(); ctx.arc(p[0], p[1], fs * 0.72, 0, Math.PI * 2); ctx.fill();
          ctx.fillStyle = i === 0 ? `rgba(224, 90, 69, ${al})` : `rgba(239, 229, 207, ${Math.min(1, .45 + p[4] * .3) * al})`;
          ctx.fillText(i === 0 ? '人' : labels[i], p[0], p[1] + 1);
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
