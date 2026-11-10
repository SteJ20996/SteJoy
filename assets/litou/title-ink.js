// title-ink.js —— 標題「力透紙背」照筆順一筆一筆寫出來（v0.11.7）
// 使用者：「『力透紙背』這四個字做得和 logo 一樣，分成四個階段展現出來，最後再來一個橫著的一筆毛筆字，有節奏感一些，預告片也一樣」。
// 標誌（src/mark.js）是照「力」的筆順把墨一筆一筆顯出來；標題照同一個意思：一個字一拍，四拍寫完四個字，橫掃那一筆放到最後。
// 做法：每個字的 span 裡疊一張 SVG，用跟 HTML 一樣的霞鶩文楷粗體畫這個字，再用遮罩沿每一筆的中線描出來（stroke-dashoffset，CSS 動畫，
// 預告錄影時可以照時間撥）；寫完那一刻補一塊滿的遮罩，中線沒蓋到的邊角一起補上。HTML 裡原本的字照舊在（透明），給讀屏、簡體轉換、
// 墨暈與紙背反字（::after／::before）用，SVG 的字與它疊在同一個位置（一行高 1 時基線在字框 0.83 處，量過）。
// 中線是照霞鶩文楷粗體的字形自己描的（0–100，字框左上角為原點）：筆順照教育部《常用國字標準字體筆順》，用 Make Me a Hanzi 的資料核對過順序，
// 但不用它的資料（專案的規矩：別人的筆順資料只拿來核對）。這套字型「透」的辶是兩點（十一筆）；簡體版的「纸」另描一份。
// 網站（SteJoy 庫 assets/litou/title-ink.js）與預告片頭（tools/litou/title.html 從遊戲網址載入）用的是這一份。
(function () {
  'use strict';
  const DATA = {
    "力": [
      [[16,33],[34,32],[52,31],[70,30],[84,30],[85,38],[84,52],[82,66],[79,80],[76,91],[66,86],[56,79],[50,74]],
      [[51,3],[54,10],[54,22],[51,36],[46,50],[39,62],[29,75],[17,85],[7,92]]],
    "透": [
      [[80,3],[70,7],[55,11],[40,15]],
      [[34,21],[50,20],[65,19],[80,18],[89,18]],
      [[63,13],[63,25],[63,35],[62,41]],
      [[57,25],[50,32],[42,38],[33,44]],
      [[67,25],[75,31],[84,37],[92,43]],
      [[41,44],[55,43],[69,42],[74,44],[70,51],[66,57],[72,56],[83,55],[86,57],[83,68],[78,78],[74,78],[68,73],[61,69]],
      [[54,48],[51,56],[46,64],[38,72],[33,74]],
      [[15,8],[22,13],[30,20]],
      [[10,21],[18,27],[27,33]],
      [[6,41],[18,41],[30,41],[25,48],[18,56],[24,61],[29,65],[22,71],[14,75]],
      [[5,79],[18,77],[30,77],[45,80],[65,84],[85,86],[98,87]]],
    "紙": [
      [[25,6],[22,15],[17,23],[13,27],[20,32],[26,37]],
      [[33,19],[30,27],[24,37],[17,45],[12,51],[22,50],[35,48]],
      [[32,42],[36,48],[40,55],[42,58]],
      [[22,56],[22,70],[22,85],[23,92]],
      [[11,62],[10,72],[7,80],[4,86]],
      [[33,63],[37,70],[40,77],[42,80]],
      [[84,6],[73,10],[62,14],[53,17]],
      [[47,17],[50,25],[50,45],[50,65],[50,80],[42,85],[55,81],[71,73]],
      [[54,46],[65,45],[78,44],[91,43]],
      [[66,18],[68,32],[70,45],[74,62],[79,76],[86,88],[89,91],[92,82],[96,66]]],
    "背": [
      [[37,4],[38,12],[38,24],[38,34]],
      [[13,19],[24,18],[37,17]],
      [[8,40],[20,38],[35,35],[50,31]],
      [[83,8],[76,13],[68,18],[62,21]],
      [[57,4],[58,15],[57,28],[59,36],[68,38],[80,37],[88,35],[92,25],[91,16]],
      [[28,45],[30,55],[29,70],[29,85],[27,93]],
      [[30,46],[50,45],[70,44],[77,47],[77,60],[77,75],[77,90],[73,93],[65,88],[56,81]],
      [[31,58],[50,57],[70,56]],
      [[31,70],[50,69],[70,68]]],
    "纸": [
      [[26,5],[25,15],[20,24],[13,32],[22,37],[30,41]],
      [[36,21],[33,30],[27,40],[20,50],[15,56],[27,54],[42,51]],
      [[8,80],[20,77],[33,71],[43,66]],
      [[84,6],[73,10],[62,14],[52,17]],
      [[46,17],[49,25],[49,45],[49,65],[49,80],[41,85],[55,81],[70,73]],
      [[53,46],[65,45],[78,44],[91,43]],
      [[65,18],[67,32],[69,45],[73,62],[79,76],[86,88],[89,91],[92,82],[96,66]]]
  };
  const BASE = 83;     // 一行高 1 時，霞鶩文楷的基線離字框頂幾成（×100）
  const PEN = 12;      // 遮罩的筆寬（字框的百分之幾）：比字的筆畫粗一點，描得到筆畫兩邊
  const LIFT = 0.16;   // 筆與筆之間提筆停多久：佔一個字的時間的幾成（平均分給每個空檔）
  const EASE = 'cubic-bezier(.35, .05, .4, 1)';
  const len = (s) => { let l = 0; for (let i = 1; i < s.length; i++) l += Math.hypot(s[i][0] - s[i - 1][0], s[i][1] - s[i - 1][1]); return l; };
  const esc = (c) => c.replace(/&/g, '&amp;').replace(/</g, '&lt;');
  let uid = 0;
  // 一個字的 SVG：start 起筆的時刻、dur 寫多久（息）
  function svg(ch, start, dur) {
    const S = DATA[ch], id = 'ti-m' + (++uid);
    let body = '';
    if (S) {
      const L = S.map(len), sum = L.reduce((a, b) => a + b, 0), n = S.length;
      const gap = n > 1 ? dur * LIFT / (n - 1) : 0, write = dur - gap * (n - 1);
      let t = start;
      S.forEach((s, k) => {
        const d = Math.max(0.03, write * L[k] / sum);
        body += '<path class="ti-s" pathLength="1" d="M' + s.map(p => p[0] + ' ' + p[1]).join(' L') + '" style="animation-delay:' + t.toFixed(3) + 's;animation-duration:' + d.toFixed(3) + 's"/>';
        t += d + gap;
      });
    }
    // 寫完補滿（中線沒蓋到的邊角）；沒有中線的字（不在表裡）就整個字在這一拍淡進來
    body += '<rect class="ti-fill" x="-20" y="-20" width="140" height="140" style="animation-delay:' + (start + (S ? dur - 0.02 : 0)).toFixed(3) + 's;animation-duration:' + (S ? 0.1 : dur).toFixed(3) + 's"/>';
    return '<svg class="ti" data-ch="' + esc(ch) + '" viewBox="0 0 100 100" aria-hidden="true" focusable="false"><defs><mask id="' + id + '" maskUnits="userSpaceOnUse" x="-20" y="-20" width="140" height="140">' + body + '</mask></defs>' +
      '<text x="0" y="' + BASE + '" mask="url(#' + id + ')">' + esc(ch) + '</text></svg>';
  }
  // 把標題裡每個字的 span 換成照筆順寫出來的樣子。opt.starts：每個字起筆的時刻；opt.dur：每個字寫多久。
  // 每個 span 帶 --d（起筆）與 --e（寫完）兩個變數，給墨暈、反字、濺點等其他動畫對時間
  function mount(h1, opt) {
    const spans = [...h1.querySelectorAll(':scope > span')];
    spans.forEach((s, i) => {
      const old = s.querySelector(':scope > svg.ti'); if (old) old.remove();
      const ch = (s.firstChild && s.firstChild.nodeType === 3 ? s.firstChild.nodeValue : s.textContent).trim();
      const start = opt.starts[i] !== undefined ? opt.starts[i] : opt.starts[opt.starts.length - 1] + (i - opt.starts.length + 1) * 0.5;
      s.classList.add('ti-c'); s.style.setProperty('--d', start + 's'); s.style.setProperty('--e', (start + opt.dur) + 's');
      s.insertAdjacentHTML('beforeend', svg(ch, start, opt.dur));
    });
    return spans;
  }
  // 簡體轉換改了字（紙 → 纸）：那一個字的 SVG 換成新字的筆（時間照舊）
  function swap(span, ch) {
    const old = span.querySelector(':scope > svg.ti'); if (!old) return;
    if (old.getAttribute('data-ch') === ch) return;   // 看遮罩是照哪個字描的（SVG 裡的字簡體轉換會自己改，遮罩不會）
    const d = parseFloat(span.style.getPropertyValue('--d')) || 0, e = parseFloat(span.style.getPropertyValue('--e')) || d + 0.5;
    old.remove(); span.insertAdjacentHTML('beforeend', svg(ch, d, e - d));
  }
  window.TITLEINK = { DATA, BASE, PEN, mount, swap, svg };
})();
