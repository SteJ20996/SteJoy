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

  // 頂欄放不下一行（越南文、日文的章節名長；iPad 直拿、頁面放大時）：收起章節連結，只留工作室名與語言，跟手機版一樣（2026-11-12）。
  // 先拿掉 tight 量一次「全放」要多寬，比頂欄寬就收；字型載好、換大小（site.js 縮放後會發 resize）都重量
  (() => {
    const top = document.querySelector('header.top'), sec = top && top.querySelector('.sections');
    if (!sec) return;
    const fit = () => {
      top.classList.remove('tight');
      if (getComputedStyle(sec).display === 'none') return;   // 手機版本來就收著
      // 照子元素的寬加上間距，跟扣掉左右留白的寬比（擠進右邊留白時 scrollWidth 量不出來）
      const cs = getComputedStyle(top), kids = [...top.children].filter((e) => getComputedStyle(e).display !== 'none');
      // getBoundingClientRect 在頁面縮放（根元素的 zoom）下各家瀏覽器給的單位不一樣：用頂欄自己的比例換回 CSS 點，跟 clientWidth、留白同一種單位
      const k = (top.getBoundingClientRect().width / top.offsetWidth) || 1;
      const need = kids.reduce((n, e) => n + e.getBoundingClientRect().width, 0) / k + (parseFloat(cs.columnGap) || 0) * (kids.length - 1);
      const room = top.clientWidth - parseFloat(cs.paddingLeft) - parseFloat(cs.paddingRight);
      top.classList.toggle('tight', need > room + 0.5);
    };
    fit(); addEventListener('resize', fit);
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(fit);
  })();

  // 頁面大小：左下角「− 100% ＋」（使用者要的：有人看到大圖會不舒服）。整頁用根元素的 CSS zoom，實際倍率另寫進 --z
  // 給要撐滿畫面高度的地方換算；記在這台瀏覽器，<head> 裡那一行（tools/site/head.py）在畫面出來以前先套上。按鈕自己反縮放，永遠一樣大。
  // 2026-11-13 使用者：100% 太寬，原本的 80% 當新的 100%、預設就是它；電腦、iPad、Windows 上可調 80%–120%。所以分兩種（mode()）：
  //   大螢幕（不是 iPhone、螢幕短邊 600 點以上、畫面寬過 760 用電腦版排）：實際 = 0.8 × 選的，選 80%–120%，記在 stejoy.zoom2；
  //   其他（手機、iPhone Duo、平板分割畫面窄到手機版）：照舊，實際 = 選的 70%–120%，記在 stejoy.zoom，放大只放到內容還有 880 寬
  //   （窄過 880 就最多 100%；vw 寫的寬度放大了會超出畫面）。畫面寬窄變了（拉視窗、分割畫面）就換過去，各記各的
  (() => {
    const root = document.documentElement, IPHONE = /iPhone/.test(navigator.userAgent);
    const bigScreen = !IPHONE && Math.min(screen.width, screen.height) >= 600;
    const MODES = {
      big: { base: 0.8, Z: [0.8, 0.9, 1, 1.1, 1.2], key: 'stejoy.zoom2', cap: () => 1.2 },
      small: { base: 1, Z: [0.7, 0.8, 0.9, 1, 1.1, 1.2], key: 'stejoy.zoom', cap: () => innerWidth < 880 ? 1 : Math.min(1.2, Math.floor(innerWidth / 88) / 10) },
    };
    const mode = () => MODES[bigScreen && innerWidth > 760 ? 'big' : 'small'];
    const cl = document.body.classList, lang = cl.contains('lang-en') ? 'en' : cl.contains('lang-ja') ? 'ja' : cl.contains('lang-vi') ? 'vi' : cl.contains('lang-zh-Hans') ? 'hans' : 'hant';
    const T = { hant: ['頁面大小', '縮小', '放大', '回到 100%'], hans: ['页面大小', '缩小', '放大', '回到 100%'], en: ['Page size', 'Smaller', 'Larger', 'Back to 100%'], ja: ['ページの大きさ', '縮小', '拡大', '100% に戻す'], vi: ['Cỡ trang', 'Thu nhỏ', 'Phóng to', 'Trở về 100%'] }[lang];
    let M = null, want = 1;
    const load = () => { M = mode(); want = 1; try { want = +localStorage.getItem(M.key) || 1; } catch (e) {} if (!M.Z.includes(want)) want = 1; };
    const actual = (z) => Math.round(M.base * z * 1000) / 1000;
    const box = document.createElement('div'); box.className = 'zoom'; box.setAttribute('role', 'group'); box.setAttribute('aria-label', T[0]);
    const btn = (txt, label) => { const b = document.createElement('button'); b.type = 'button'; b.textContent = txt; b.title = label; b.setAttribute('aria-label', label); return b; };
    const minus = btn('−', T[1]), val = btn('100%', T[3]), plus = btn('+', T[2]); val.className = 'zv';
    box.append(minus, val, plus); document.body.appendChild(box);
    let cur = parseFloat(root.style.zoom) || 1;   // 實際倍率（<head> 那一行可能已經套上了）
    let shown = null;
    const apply = (keep) => {
      if (mode() !== M) load();
      const z = Math.min(want, M.cap()), a = actual(z), y = keep && document.documentElement.scrollHeight > innerHeight ? scrollY / (document.documentElement.scrollHeight - innerHeight) : null;
      // 值沒變就什麼都不寫：iPhone 的 Safari 捲動時網址列一收一放就連發 resize，每次都重寫整頁的 zoom 與 --z 會一直重算樣式
      const key = a + '|' + z + '|' + M.cap();
      if (key === shown) return;
      shown = key;
      root.style.zoom = a === 1 ? '' : a; root.style.setProperty('--z', a); box.style.zoom = a === 1 ? '' : 1 / a;
      val.textContent = Math.round(z * 100) + '%'; val.setAttribute('aria-label', T[0] + ' ' + val.textContent + ({ en: ', ', vi: ', ', ja: '、' }[lang] || '，') + T[3]);
      minus.disabled = z <= M.Z[0]; plus.disabled = z >= M.cap();
      if (a !== cur) {
        cur = a;
        if (y !== null) scrollTo(0, y * (document.documentElement.scrollHeight - innerHeight));   // 停在原來讀到的地方
        dispatchEvent(new Event('resize')); dispatchEvent(new Event('scroll'));   // 讓量尺寸的（超正方體的畫布、捲到哪一章、頂欄放不放得下）重算
      }
    };
    const step = (d) => { const i = M.Z.indexOf(Math.min(want, M.cap())); want = M.Z[Math.max(0, Math.min(M.Z.length - 1, i + d))]; if (want > M.cap()) want = M.cap(); try { localStorage.setItem(M.key, String(want)); } catch (e) {} apply(true); };
    // 平常是淡的（site.css）；點了以後清楚幾秒，再淡回去
    let lit = 0; const wake = () => { box.classList.add('on'); clearTimeout(lit); lit = setTimeout(() => box.classList.remove('on'), 2500); };
    box.addEventListener('pointerdown', wake);
    minus.addEventListener('click', () => step(-1)); plus.addEventListener('click', () => step(1));
    val.addEventListener('click', () => { want = 1; try { localStorage.removeItem(M.key); } catch (e) {} apply(true); });
    addEventListener('resize', (e) => { if (e.isTrusted) apply(false); });
    load(); apply(false);
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

  // 語言提示：選過語言的照選的；沒選過的照瀏覽器語言（簡中、繁中、日文、越南文，其餘當英文）。這一頁不是那種語言，就在下面提一句
  // （2026-11-12 起每一頁都有越南文；萬一哪一頁沒有，就改提英文）
  // （不自動跳轉；關掉了就不再提）
  try {
    const box = document.getElementById('lang-banner'), offers = JSON.parse(document.body.dataset.banner || '{}');
    const prefs = (navigator.languages && navigator.languages.length ? navigator.languages : [navigator.language || '']).map((x) => x.toLowerCase());
    const top = prefs[0] || '';
    const chosen = get(localStorage, LANG);
    let want = chosen || (/^zh-(cn|sg|hans)/.test(top) || top === 'zh' ? 'zh-Hans' : /^zh/.test(top) ? 'zh-Hant' : /^ja/.test(top) ? 'ja' : /^vi/.test(top) ? 'vi' : 'en');
    if (want === 'vi' && !offers.vi && here !== 'vi') want = 'en';
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
