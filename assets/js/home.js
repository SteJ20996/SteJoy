// 首頁：選一部。滑過或用 ← → 選到的那一張展開；「種類」可以篩；Enter 進入（卡片本身是連結）。
// 《力透紙背》那一張的標誌照「力」的筆順寫出來（assets/litou/mark.js，帶子畫成紙色）。
(() => {
  const row = document.querySelector('.hm-row'); if (!row) return;
  const cards = [...row.querySelectorAll('.hm-card')], kinds = [...document.querySelectorAll('.hm-kind')];
  const visible = () => cards.filter(c => !c.hidden);
  function activate(card) {
    cards.forEach(c => c.classList.toggle('active', c === card));
    row.classList.toggle('has-active', !!card && visible().length > 1);
  }
  cards.forEach(c => {
    c.addEventListener('mouseenter', () => activate(c));
    c.addEventListener('focus', () => activate(c));
  });
  row.addEventListener('mouseleave', () => { if (!row.contains(document.activeElement)) activate(null); });
  // 種類：只留那一種
  kinds.forEach(b => b.addEventListener('click', () => {
    const k = b.dataset.kind;
    kinds.forEach(x => x.setAttribute('aria-pressed', String(x === b)));
    cards.forEach(c => { c.hidden = k !== 'all' && c.dataset.kind !== k; });
    row.classList.toggle('single', visible().length === 1);
    activate(visible().length === 1 ? visible()[0] : null);
  }));
  // ← → 換一部（游標在輸入框或按著修飾鍵時不管）
  addEventListener('keydown', (e) => {
    if (e.altKey || e.ctrlKey || e.metaKey || (e.target && /^(INPUT|TEXTAREA|SELECT)$/.test(e.target.tagName))) return;
    if (e.key !== 'ArrowLeft' && e.key !== 'ArrowRight') return;
    const v = visible(); if (!v.length) return;
    const cur = v.indexOf(cards.find(c => c.classList.contains('active')));
    const next = v[cur < 0 ? (e.key === 'ArrowRight' ? 0 : v.length - 1) : (cur + (e.key === 'ArrowRight' ? 1 : -1) + v.length) % v.length];
    e.preventDefault(); next.focus({ preventScroll: false }); activate(next);
  });
  // 標誌
  const mark = document.querySelector('.hm-mark');
  if (mark && window.MARK) { MARK.mount(mark); MARK.play(); }
})();
