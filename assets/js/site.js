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
