// Cloudflare Pages 的靜態檔不回 206：瀏覽器問「從第幾個位元組起」（Range）它照樣整個檔回 200，
// 影片就拖不了進度（只能從頭看到尾）。這支只接手 /assets/media/*：照常拿到靜態檔，
// 有 Range 就切出那一段回 206，沒有就原樣回、加上 Accept-Ranges 讓瀏覽器知道拖得了。
// 出了任何差錯都退回原本的回應，最差就是跟以前一樣拖不了。

export async function onRequest(ctx) {
  const res = await ctx.next();
  try { return ranged(ctx.request, res); } catch (e) { return res; }
}

export function ranged(req, res) {
  if (res.status !== 200 || res.headers.get('Content-Encoding') || res.headers.get('Content-Range')) return res;
  const size = Number(res.headers.get('Content-Length'));
  if (!Number.isSafeInteger(size) || size <= 0) return res;
  const head = new Headers(res.headers);
  head.set('Accept-Ranges', 'bytes');
  const want = req.headers.get('Range');
  const ifRange = req.headers.get('If-Range');
  const fresh = !ifRange || ifRange === res.headers.get('ETag') || ifRange === res.headers.get('Last-Modified');
  const r = want && fresh && (req.method === 'GET' || req.method === 'HEAD') ? span(want, size) : null;
  if (!r) return new Response(res.body, { status: 200, statusText: res.statusText, headers: head });   // 沒問、問不懂、檔換過了：整個檔
  if (r === 'bad') {
    if (res.body) res.body.cancel().catch(() => {});
    head.set('Content-Range', `bytes */${size}`); head.set('Content-Length', '0');
    return new Response(null, { status: 416, headers: head });
  }
  const [start, end] = r, len = end - start + 1;
  head.set('Content-Range', `bytes ${start}-${end}/${size}`);
  head.set('Content-Length', String(len));
  if (req.method === 'HEAD' || !res.body) return new Response(null, { status: 206, headers: head });
  let body = slice(res.body, start, end);
  if (typeof FixedLengthStream === 'function') {   // Workers 裡要這樣才會帶 Content-Length（不然變成分塊傳）
    const fl = new FixedLengthStream(len); body.pipeTo(fl.writable).catch(() => {}); body = fl.readable;
  }
  return new Response(body, { status: 206, headers: head });
}

// 「bytes=a-b」「bytes=a-」「bytes=-n」；多段（逗號）不理、回整個檔；超出檔尾回 'bad'（416）
export function span(h, size) {
  const m = /^\s*bytes\s*=\s*(\d*)\s*-\s*(\d*)\s*$/i.exec(h);
  if (!m || (m[1] === '' && m[2] === '')) return null;
  let start, end;
  if (m[1] === '') { const n = Number(m[2]); if (n === 0) return 'bad'; start = Math.max(0, size - n); end = size - 1; }
  else { start = Number(m[1]); end = m[2] === '' ? size - 1 : Math.min(Number(m[2]), size - 1); }
  if (start >= size || start > end) return 'bad';
  return [start, end];
}

// 照著讀過去，只把 [start, end] 那一段交出去；讀到 end 就停，後面的不再讀
function slice(src, start, end) {
  const reader = src.getReader(); let pos = 0;
  return new ReadableStream({
    async pull(ctl) {
      for (;;) {
        const { done, value } = await reader.read();
        if (done) { ctl.close(); return; }
        const a = pos, b = pos + value.byteLength; pos = b;
        if (b <= start) continue;
        ctl.enqueue(value.subarray(Math.max(0, start - a), Math.min(value.byteLength, end + 1 - a)));
        if (b > end) { ctl.close(); reader.cancel().catch(() => {}); }
        return;
      }
    },
    cancel(why) { return reader.cancel(why); },
  });
}
