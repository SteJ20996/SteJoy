// mark.js —— 標誌照「力」的筆順寫出來（v0.8.3，使用者要的：兩筆各自寫全，不畫回頭筆）。
// 第一筆橫折鉤：起筆一按，往右（橫），右肩一頓轉下（折），底部再頓一下、往左越甩越快（鉤）。筆離紙一下。
// 第二筆撇：頂尖一按，往左下越掃越快，到尾巴出鋒。寫完「人」落在帶子翹起的地方。
// 每個墨點屬於哪一筆、在那一筆的第幾成出現，是 scripts/mark-strokes.py 算好的時間圖（src/mark-data.js）；這裡只照時間把墨顯出來，
// 同一筆只往前走，所以沒有回頭筆。少動（prefers-reduced-motion）時直接是寫好的樣子。
(function () {
  const D = window.MARK_DATA;
  const INK = (D && D.ink) || [28, 26, 23];   // 網站的首頁把帶子畫成紙色（墨黑的底上）：MARK_DATA.ink
  // 時間（秒）：等標題的「力」落下再起筆
  const T = { delay: 0.45, s1: 1.0, gap: 0.16, s2: 0.62 };
  T.end1 = T.delay + T.s1; T.start2 = T.end1 + T.gap; T.end2 = T.start2 + T.s2; T.land = T.end2 + 0.05;
  const W1 = 0.025, W2 = 0.035;   // 筆鋒的濕邊：這一筆全長的幾成
  // 一段一段的緩急：[到第幾成時間, 寫到第幾成, 緩急]（in 越來越快、out 越來越慢、io 先快後慢）
  const ease = { in: (x) => x * x, out: (x) => 1 - (1 - x) * (1 - x), io: (x) => x < 0.5 ? 2 * x * x : 1 - 2 * (1 - x) * (1 - x), lin: (x) => x };
  const [fz, fg] = D ? D.turns : [0.3, 0.6];
  const PLAN1 = [[0.06, 0.012, 'in'], [0.30, fz, 'out'], [0.40, fz + 0.015, 'io'], [0.62, fg, 'io'], [0.70, fg + 0.02, 'io'], [1, 1, 'in']];
  const PLAN2 = [[0.14, 0.03, 'io'], [1, 1, 'in']];
  function along(plan, u) {
    if (u <= 0) return 0; if (u >= 1) return 1;
    let u0 = 0, p0 = 0;
    for (const [u1, p1, e] of plan) { if (u <= u1) return p0 + (p1 - p0) * ease[e]((u - u0) / (u1 - u0)); u0 = u1; p0 = p1; }
    return 1;
  }
  const M = { T, mounted: false, t: 0, raf: 0 };
  // 四個著地的時刻（遊戲 v0.11.8，給標題對拍）：畫面上「力」是三筆——上面那一小段（第一筆寫到右肩，PLAN1 的 0.30）、
  // 右邊的大弧連底下一鉤（第一筆寫完）、撇（第二筆寫完）——再加「人」落下著地（.ren.land 那 .34 息的動畫在六成處著地）
  M.hits = () => [T.delay + PLAN1[1][0] * T.s1, T.end1, T.end2, T.land + 0.34 * 0.6];
  let cv, ctx, img, idx, al, st, tt, ren, box, sum1 = 0, sum2 = 0;
  const loadImg = (src) => new Promise((ok, no) => { const i = new Image(); i.onload = () => ok(i); i.onerror = no; i.src = src; });
  function pixels(i) { const c = document.createElement('canvas'); c.width = D.w; c.height = D.h; const x = c.getContext('2d'); x.drawImage(i, 0, 0); return x.getImageData(0, 0, D.w, D.h).data; }
  M.ready = !D ? Promise.reject(new Error('no MARK_DATA')) : Promise.resolve();
  M.mount = function (el) {
    box = el; if (!D || !el) return;
    ren = new Image(); ren.className = 'ren'; ren.alt = ''; ren.src = D.ren; ren.width = D.w; ren.height = D.h;
    M.ready = Promise.all([loadImg(D.ribbon), loadImg(D.time)]).then(([ri, ti]) => {
      const a = pixels(ri), m = pixels(ti), n = D.w * D.h;
      let c = 0; for (let i = 0; i < n; i++) if (a[i * 4 + 3] > 0) c++;
      idx = new Uint32Array(c); al = new Uint8Array(c); st = new Uint8Array(c); tt = new Float32Array(c);
      c = 0;
      for (let i = 0; i < n; i++) {
        const A = a[i * 4 + 3]; if (!A) continue;
        idx[c] = i; al[c] = A; st[c] = m[i * 4] === 2 ? 2 : 1; tt[c] = ((m[i * 4 + 1] << 8) | m[i * 4 + 2]) / 65535;
        if (st[c] === 1) sum1 += A; else sum2 += A; c++;
      }
      cv = document.createElement('canvas'); cv.className = 'rib'; cv.width = D.w; cv.height = D.h;
      ctx = cv.getContext('2d'); img = ctx.createImageData(D.w, D.h);
      for (let k = 0; k < idx.length; k++) { const o = idx[k] * 4; img.data[o] = INK[0]; img.data[o + 1] = INK[1]; img.data[o + 2] = INK[2]; }
      box.textContent = ''; box.appendChild(cv); box.appendChild(ren); box.classList.add('cv');
      M.mounted = true;
    }).catch(() => {   // 畫不了（舊瀏覽器）：直接放寫好的圖
      const r = new Image(); r.className = 'rib'; r.alt = ''; r.src = D.ribbon; box.textContent = ''; box.appendChild(r); box.appendChild(ren); ren.classList.add('still');
    });
    return M.ready;
  };
  // 畫某一刻（秒）
  M.at = function (sec) {
    if (!M.mounted) return;
    M.t = sec;
    const p1 = along(PLAN1, (sec - T.delay) / T.s1) * (1 + W1), p2 = along(PLAN2, (sec - T.start2) / T.s2) * (1 + W2);
    const d = img.data;
    for (let k = 0; k < idx.length; k++) {
      let f = st[k] === 1 ? (p1 - tt[k]) / W1 : (p2 - tt[k]) / W2;
      f = f <= 0 ? 0 : f >= 1 ? 1 : f;
      d[idx[k] * 4 + 3] = al[k] * f;
    }
    ctx.putImageData(img, 0, 0);
    ren.classList.toggle('land', sec >= T.land);
  };
  M.stop = function () { if (M.raf) cancelAnimationFrame(M.raf); M.raf = 0; };
  M.play = function () {
    M.ready.then(() => {
      if (!M.mounted) return;
      M.stop(); ren.classList.remove('land', 'still');
      if (window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches) { M.at(T.land + 1); ren.classList.add('still'); return; }
      void ren.offsetWidth;   // 讓「人」的落下重新播
      const t0 = performance.now();
      const step = (now) => { const s = (now - t0) / 1000; M.at(s); M.raf = s < T.land + 0.1 ? requestAnimationFrame(step) : 0; };
      M.at(0); M.raf = requestAnimationFrame(step);
    }, () => {});
  };
  // 給測試：每一筆現在顯出了幾成、顯出的墨的重心在哪
  M.coverage = function () { let v1 = 0, v2 = 0; const d = img.data; for (let k = 0; k < idx.length; k++) { const v = d[idx[k] * 4 + 3]; if (st[k] === 1) v1 += v; else v2 += v; } return { s1: v1 / sum1, s2: v2 / sum2 }; };
  M.centroid = function (s, lo, hi) {
    // 給了 lo、hi：這一筆寫到 lo–hi 成時出現的那些墨在哪；沒給：現在顯出來的墨的重心（0–1，以圖寬高為準）
    let x = 0, y = 0, n = 0; const d = img.data;
    for (let k = 0; k < idx.length; k++) {
      if (st[k] !== s) continue;
      if (lo !== undefined ? tt[k] < lo || tt[k] > hi : d[idx[k] * 4 + 3] < 128) continue;
      x += idx[k] % D.w; y += Math.floor(idx[k] / D.w); n++;
    }
    return n ? [x / n / D.w, y / n / D.h] : null;
  };
  window.MARK = M;
})();
