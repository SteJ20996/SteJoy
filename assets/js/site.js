// stejoy.com：字標寫完拿掉遮罩、試玩場景捲到才載入、照瀏覽器語言提示有別的語言版本
(() => {
  // 字標：墨鋪滿以後拿掉遮罩（套著遮罩時邊緣的反鋸齒會差一點；跟遊戲起始頁同一個做法）
  const ink = document.querySelector('#title-logo .shui'), bleed = document.querySelector('#title-logo .shui-bleed');
  if (ink && bleed) bleed.addEventListener('animationend', () => ink.classList.add('inked'));

  // 試玩場景：看得到才載入、才播；看不到就停。偏好減少動態的不自動播，點一下才播
  const reduce = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
  const clips = [...document.querySelectorAll('video[data-src]')];
  const h264 = document.createElement('video').canPlayType('video/mp4; codecs="avc1.640028"');   // 有的瀏覽器（例如沒裝解碼器的 Linux）放不了 H.264，就換 WebM
  const load = (v) => { if (!v.getAttribute('src')) v.src = h264 || !v.dataset.webm ? v.dataset.src : v.dataset.webm; };
  if ('IntersectionObserver' in window) {
    const io = new IntersectionObserver((list) => {
      for (const e of list) {
        const v = e.target;
        if (e.isIntersecting) { load(v); if (!reduce) v.play().catch(() => {}); } else if (!v.paused) v.pause();
      }
    }, { rootMargin: '160px 0px', threshold: 0.25 });
    clips.forEach((v) => io.observe(v));
  } else clips.forEach(load);
  clips.forEach((v) => v.addEventListener('click', () => { load(v); if (v.paused) v.play().catch(() => {}); else v.pause(); }));

  // 頁面大小：左下角「− 100% ＋」（使用者要的：有人看到大圖會不舒服）。整頁用根元素的 CSS zoom，倍率另寫進 --z
  // 給要撐滿畫面高度的地方換算；記在這台瀏覽器（stejoy.zoom），<head> 裡那一行在畫面出來以前先套上。
  // 放大只放到內容還有 880 寬（電腦版的版面），窄過 880 就最多 100%（vw 寫的寬度放大了會超出畫面）；跟 tools/site/head.py 同一條。
  // 按鈕自己反縮放，永遠一樣大
  (() => {
    const Z = [0.7, 0.8, 0.9, 1, 1.1, 1.2], KEY = 'stejoy.zoom', root = document.documentElement;
    const lang = document.body.classList.contains('lang-en') ? 'en' : document.body.classList.contains('lang-zh-Hans') ? 'hans' : 'hant';
    const T = { hant: ['頁面大小', '縮小', '放大', '回到 100%'], hans: ['页面大小', '缩小', '放大', '回到 100%'], en: ['Page size', 'Smaller', 'Larger', 'Back to 100%'] }[lang];
    let want = 1; try { want = +localStorage.getItem(KEY) || 1; } catch (e) {}
    if (!Z.includes(want)) want = 1;
    const cap = () => innerWidth < 880 ? 1 : Math.min(Z[Z.length - 1], Math.floor(innerWidth / 88) / 10);
    const box = document.createElement('div'); box.className = 'zoom'; box.setAttribute('role', 'group'); box.setAttribute('aria-label', T[0]);
    const btn = (txt, label) => { const b = document.createElement('button'); b.type = 'button'; b.textContent = txt; b.title = label; b.setAttribute('aria-label', label); return b; };
    const minus = btn('−', T[1]), val = btn('100%', T[3]), plus = btn('+', T[2]); val.className = 'zv';
    box.append(minus, val, plus); document.body.appendChild(box);
    let cur = 1;
    const apply = (keep) => {
      const z = Math.min(want, cap()), y = keep && document.documentElement.scrollHeight > innerHeight ? scrollY / (document.documentElement.scrollHeight - innerHeight) : null;
      root.style.zoom = z === 1 ? '' : z; root.style.setProperty('--z', z); box.style.zoom = z === 1 ? '' : 1 / z;
      val.textContent = Math.round(z * 100) + '%'; val.setAttribute('aria-label', T[0] + ' ' + val.textContent + '，' + T[3]);
      minus.disabled = z <= Z[0]; plus.disabled = z >= cap();
      if (z !== cur) {
        cur = z;
        if (y !== null) scrollTo(0, y * (document.documentElement.scrollHeight - innerHeight));   // 停在原來讀到的地方
        dispatchEvent(new Event('resize')); dispatchEvent(new Event('scroll'));   // 讓量尺寸的（超正方體的畫布、捲到哪一章）重算
      }
    };
    const step = (d) => { const i = Z.indexOf(Math.min(want, cap())); want = Z[Math.max(0, Math.min(Z.length - 1, i + d))]; if (want > cap()) want = cap(); try { localStorage.setItem(KEY, String(want)); } catch (e) {} apply(true); };
    minus.addEventListener('click', () => step(-1)); plus.addEventListener('click', () => step(1));
    val.addEventListener('click', () => { want = 1; try { localStorage.removeItem(KEY); } catch (e) {} apply(true); });
    addEventListener('resize', (e) => { if (e.isTrusted) apply(false); });
    cur = parseFloat(root.style.zoom) || 1; apply(false);
  })();

  // 語言提示：瀏覽器是簡中、繁中、英文，而這一頁不是，就在下面提一句（不自動跳轉；關掉了就不再提）
  try {
    const box = document.getElementById('lang-banner'), offers = JSON.parse(document.body.dataset.banner || '{}');
    const prefs = (navigator.languages && navigator.languages.length ? navigator.languages : [navigator.language || '']).map((x) => x.toLowerCase());
    const top = prefs[0] || '';
    const want = /^zh-(cn|sg|hans)/.test(top) || top === 'zh' ? 'zh-Hans' : /^zh/.test(top) ? 'zh-Hant' : 'en';
    let off = null; try { off = localStorage.getItem('stejoy.lang.off'); } catch (e) {}
    if (box && offers[want] && !off) {
      const [label, href] = offers[want];
      const a = document.createElement('a'); a.href = href; a.textContent = label + ' →'; a.lang = want;
      const x = document.createElement('button'); x.type = 'button'; x.setAttribute('aria-label', 'close'); x.textContent = '×';
      x.addEventListener('click', () => { box.hidden = true; try { localStorage.setItem('stejoy.lang.off', '1'); } catch (e) {} });
      box.append(a, x); box.hidden = false;
    }
  } catch (e) {}
})();
