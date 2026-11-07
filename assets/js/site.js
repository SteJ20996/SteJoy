// stejoy.com：字標寫完拿掉遮罩、試玩場景捲到才載入、記住選的語言（換語言停在原本那一節）、提示有別的語言版本
(() => {
  // 字標：墨鋪滿以後拿掉遮罩（套著遮罩時邊緣的反鋸齒會差一點；跟遊戲起始頁同一個做法）
  const ink = document.querySelector('#title-logo .shui'), bleed = document.querySelector('#title-logo .shui-bleed');
  if (ink && bleed) bleed.addEventListener('animationend', () => ink.classList.add('inked'));

  // 試玩場景：看得到才載入、才播；看不到就停。偏好減少動態的不自動播，點一下才播
  const reduce = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
  const clips = [...document.querySelectorAll('video[data-src]')];
  const h264 = document.createElement('video').canPlayType('video/mp4; codecs="avc1.640028"');   // 有的瀏覽器（例如沒裝解碼器的 Linux）放不了 H.264，就換 WebM
  const load = (v) => { if (!v.getAttribute('src')) v.src = h264 || !v.dataset.webm ? v.dataset.src : v.dataset.webm; };
  // 捲遠了就卸下（拿掉 src 再 load()，解碼器與緩衝才放掉；封面圖照樣在）：使用者在 iPhone 上捲完力透紙背頁，五支短片一直掛著，
  // 加上預告與動畫，Safari 記憶體不夠把整頁關掉（「Webpage Crashed」）。捲回來再載，從頭播
  const unload = (v) => { if (!v.getAttribute('src')) return; v.pause(); v.removeAttribute('src'); v.load(); };
  if ('IntersectionObserver' in window) {
    const io = new IntersectionObserver((list) => {
      for (const e of list) {
        const v = e.target;
        if (e.isIntersecting) { load(v); if (!reduce) v.play().catch(() => {}); } else if (!v.paused) v.pause();
      }
    }, { rootMargin: '160px 0px', threshold: 0.25 });
    const far = new IntersectionObserver((list) => { for (const e of list) if (!e.isIntersecting) unload(e.target); }, { rootMargin: '60% 0px' });   // 上下各多六成屏以外
    clips.forEach((v) => { io.observe(v); far.observe(v); });
  } else clips.forEach(load);
  clips.forEach((v) => v.addEventListener('click', () => { load(v); if (v.paused) v.play().catch(() => {}); else v.pause(); }));

  // 頁面大小：左下角「− 100% ＋」（使用者要的：有人看到大圖會不舒服）。整頁用根元素的 CSS zoom，倍率另寫進 --z
  // 給要撐滿畫面高度的地方換算；記在這台瀏覽器（stejoy.zoom），<head> 裡那一行在畫面出來以前先套上。
  // 放大只放到內容還有 880 寬（電腦版的版面），窄過 880 就最多 100%（vw 寫的寬度放大了會超出畫面）；跟 tools/site/head.py 同一條。
  // 按鈕自己反縮放，永遠一樣大
  (() => {
    const Z = [0.7, 0.8, 0.9, 1, 1.1, 1.2], KEY = 'stejoy.zoom', root = document.documentElement;
    const cl = document.body.classList, lang = cl.contains('lang-en') ? 'en' : cl.contains('lang-ja') ? 'ja' : cl.contains('lang-zh-Hans') ? 'hans' : 'hant';
    const T = { hant: ['頁面大小', '縮小', '放大', '回到 100%'], hans: ['页面大小', '缩小', '放大', '回到 100%'], en: ['Page size', 'Smaller', 'Larger', 'Back to 100%'], ja: ['ページの大きさ', '縮小', '拡大', '100% に戻す'] }[lang];
    let want = 1; try { want = +localStorage.getItem(KEY) || 1; } catch (e) {}
    if (!Z.includes(want)) want = 1;
    const cap = () => innerWidth < 880 ? 1 : Math.min(Z[Z.length - 1], Math.floor(innerWidth / 88) / 10);
    const box = document.createElement('div'); box.className = 'zoom'; box.setAttribute('role', 'group'); box.setAttribute('aria-label', T[0]);
    const btn = (txt, label) => { const b = document.createElement('button'); b.type = 'button'; b.textContent = txt; b.title = label; b.setAttribute('aria-label', label); return b; };
    const minus = btn('−', T[1]), val = btn('100%', T[3]), plus = btn('+', T[2]); val.className = 'zv';
    box.append(minus, val, plus); document.body.appendChild(box);
    let cur = 1;
    let shownZ = null, shownCap = null;
    const apply = (keep) => {
      const z = Math.min(want, cap()), y = keep && document.documentElement.scrollHeight > innerHeight ? scrollY / (document.documentElement.scrollHeight - innerHeight) : null;
      // 值沒變就什麼都不寫：iPhone 的 Safari 捲動時網址列一收一放就連發 resize，每次都重寫整頁的 zoom 與 --z 會一直重算樣式
      if (z === shownZ && cap() === shownCap) return;
      shownZ = z; shownCap = cap();
      root.style.zoom = z === 1 ? '' : z; root.style.setProperty('--z', z); box.style.zoom = z === 1 ? '' : 1 / z;
      val.textContent = Math.round(z * 100) + '%'; val.setAttribute('aria-label', T[0] + ' ' + val.textContent + ({ en: ', ', ja: '、' }[lang] || '，') + T[3]);
      minus.disabled = z <= Z[0]; plus.disabled = z >= cap();
      if (z !== cur) {
        cur = z;
        if (y !== null) scrollTo(0, y * (document.documentElement.scrollHeight - innerHeight));   // 停在原來讀到的地方
        dispatchEvent(new Event('resize')); dispatchEvent(new Event('scroll'));   // 讓量尺寸的（超正方體的畫布、捲到哪一章）重算
      }
    };
    const step = (d) => { const i = Z.indexOf(Math.min(want, cap())); want = Z[Math.max(0, Math.min(Z.length - 1, i + d))]; if (want > cap()) want = cap(); try { localStorage.setItem(KEY, String(want)); } catch (e) {} apply(true); };
    // 平常是淡的（site.css）；點了以後清楚幾秒，再淡回去
    let lit = 0; const wake = () => { box.classList.add('on'); clearTimeout(lit); lit = setTimeout(() => box.classList.remove('on'), 2500); };
    box.addEventListener('pointerdown', wake);
    minus.addEventListener('click', () => step(-1)); plus.addEventListener('click', () => step(1));
    val.addEventListener('click', () => { want = 1; try { localStorage.removeItem(KEY); } catch (e) {} apply(true); });
    addEventListener('resize', (e) => { if (e.isTrusted) apply(false); });
    cur = parseFloat(root.style.zoom) || 1; apply(false);
  })();

  // 語言：右上角（或下面那條提示）選了哪一種，就記在這台瀏覽器（stejoy.lang），整個網站照它，之後不再跳提示叫你換回去。
  // 換語言是在同一個分頁換頁；換過去以後停在原本讀到的那一節的同一個位置（sessionStorage 的 stejoy.lang.at，十秒內有效）。
  // 使用者：右上角選了語言，下面又跳出「這一頁也有繁體中文 →」（照瀏覽器語言提示的），像是開了另一個分頁
  const LANG = 'stejoy.lang', AT = 'stejoy.lang.at';
  const here = document.documentElement.lang;
  const get = (st, k) => { try { return st.getItem(k); } catch (e) { return null; } };
  const put = (st, k, v) => { try { if (v === null) st.removeItem(k); else st.setItem(k, v); } catch (e) {} };
  const bar = () => { const t = document.querySelector('header.top'); return t ? t.getBoundingClientRect().bottom : 0; };
  // 記「畫面頂上那一段」：四種語言的頁面是同一個模子產生的，段落一一對得上；段落長短不同，所以對齊段落而不是照比例
  const PARTS = 'h1, h2, h3, p, li, article, blockquote, video, figure';
  const parts = (sec) => [...sec.querySelectorAll(PARTS)].filter((e) => e.getClientRects().length);
  const pick = (a, ev) => {
    if (ev.button || ev.ctrlKey || ev.metaKey || ev.shiftKey || ev.altKey) return;   // 自己要開新分頁的照舊
    put(localStorage, LANG, a.lang);
    if (scrollY < 4) return;
    const top = bar();
    let at = null;
    for (const sec of document.querySelectorAll('main section[id]')) {
      const r = sec.getBoundingClientRect(); if (r.bottom <= top || r.height <= 0) continue;
      // 頂上那條線穿過的段落裡挑最裡面的那一段（top 最大的）；線剛好落在段落之間就取下面那一段
      const ps = parts(sec); let i = -1, best = -Infinity;
      ps.forEach((e, k) => { const q = e.getBoundingClientRect(); if (q.bottom > top && q.top <= top + 1 && q.top > best) { best = q.top; i = k; } });
      if (i < 0) i = ps.findIndex((e) => e.getBoundingClientRect().bottom > top);
      at = { id: sec.id, f: Math.max(0, (top - r.top) / r.height), n: ps.length, i };
      if (i >= 0) { const q = ps[i].getBoundingClientRect(); if (q.top <= top && q.height > 0) at.fy = (top - q.top) / q.height; else at.dy = q.top - top; }   // 線穿過那一段：記穿過它的幾成（各語言段落高矮不同）
      break;
    }
    if (at) put(sessionStorage, AT, JSON.stringify(Object.assign(at, { path: new URL(a.href, location.href).pathname, t: Date.now() })));
  };
  document.querySelectorAll('nav.langs a[lang]').forEach((a) => { if (!a.hasAttribute('aria-current')) a.addEventListener('click', (ev) => pick(a, ev)); });
  // 換過來的：照記下的那一節捲回去（等圖與字型排好再捲，免得位置又被撐開）
  try {
    const at = JSON.parse(get(sessionStorage, AT) || 'null');
    put(sessionStorage, AT, null);
    const sec = at && at.path === location.pathname && Date.now() - at.t < 10000 && !location.hash && document.getElementById(at.id);
    if (sec) {
      const go = () => {
        const ps = parts(sec), el = at.i >= 0 && ps.length === at.n ? ps[at.i] : null, r = sec.getBoundingClientRect();
        let y = r.top + at.f * r.height;   // 段落對不上（不該發生）就照那一節的比例
        if (el) { const q = el.getBoundingClientRect(); y = at.fy != null ? q.top + at.fy * q.height : q.top - (at.dy || 0); }
        scrollTo({ top: Math.max(0, scrollY + y - bar()), behavior: 'instant' });   // 不要 html 的 smooth：直接停在那裡，不從頂上滑下去
      };
      go(); addEventListener('load', go, { once: true });
      if (document.fonts && document.fonts.ready) document.fonts.ready.then(go);
    }
  } catch (e) {}

  // 語言提示：選過語言的照選的；沒選過的照瀏覽器語言（簡中、繁中、日文，其餘當英文）。這一頁不是那種語言，就在下面提一句
  // （不自動跳轉；關掉了就不再提）
  try {
    const box = document.getElementById('lang-banner'), offers = JSON.parse(document.body.dataset.banner || '{}');
    const prefs = (navigator.languages && navigator.languages.length ? navigator.languages : [navigator.language || '']).map((x) => x.toLowerCase());
    const top = prefs[0] || '';
    const chosen = get(localStorage, LANG);
    const want = chosen || (/^zh-(cn|sg|hans)/.test(top) || top === 'zh' ? 'zh-Hans' : /^zh/.test(top) ? 'zh-Hant' : /^ja/.test(top) ? 'ja' : 'en');
    const off = get(localStorage, 'stejoy.lang.off');
    if (box && want !== here && offers[want] && !off) {
      const [label, href] = offers[want];
      const a = document.createElement('a'); a.href = href; a.textContent = label + ' →'; a.lang = want;
      a.addEventListener('click', (ev) => pick(a, ev));
      const x = document.createElement('button'); x.type = 'button'; x.setAttribute('aria-label', 'close'); x.textContent = '×';
      x.addEventListener('click', () => { box.hidden = true; put(localStorage, 'stejoy.lang.off', '1'); });
      box.append(a, x); box.hidden = false;
    }
  } catch (e) {}
})();
