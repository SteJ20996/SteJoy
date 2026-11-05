// 切 Range 的那幾支（worker/index.js 用；主模組只留 export default，免得 Workers 把多的具名匯出當成進入點）

export async function ranged(req, res) {
  if (res.status !== 200 || res.headers.get('Content-Encoding') || res.headers.get('Content-Range')) return res;
  const head = new Headers(res.headers);
  head.set('Accept-Ranges', 'bytes');
  const want = req.headers.get('Range');
  const ifRange = req.headers.get('If-Range');
  const fresh = !ifRange || ifRange === res.headers.get('ETag') || ifRange === res.headers.get('Last-Modified');
  if (!want || !fresh || !(req.method === 'GET' || req.method === 'HEAD')) return new Response(res.body, { status: 200, statusText: res.statusText, headers: head });   // 沒問、檔換過了：整個檔
  // 檔有多大：Workers 的 ASSETS 給的回應常不帶 Content-Length（串流），那就整個讀進來量（最大的預告約 17 MB，記憶體夠）
  let size = Number(res.headers.get('Content-Length')), buf = null;
  if (!Number.isSafeInteger(size) || size <= 0) { if (!res.body) return res; buf = new Uint8Array(await res.arrayBuffer()); size = buf.byteLength; if (!size) return res; }
  const r = span(want, size);
  if (!r) return new Response(buf || res.body, { status: 200, statusText: res.statusText, headers: head });   // 問不懂（例如多段）：整個檔
  if (r === 'bad') {
    if (!buf && res.body) res.body.cancel().catch(() => {});
    head.set('Content-Range', `bytes */${size}`); head.set('Content-Length', '0');
    return new Response(null, { status: 416, headers: head });
  }
  const [start, end] = r, len = end - start + 1;
  head.set('Content-Range', `bytes ${start}-${end}/${size}`);
  head.set('Content-Length', String(len));
  if (req.method === 'HEAD' || !(buf || res.body)) return new Response(null, { status: 206, headers: head });
  if (buf) return new Response(buf.slice(start, end + 1), { status: 206, headers: head });
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
