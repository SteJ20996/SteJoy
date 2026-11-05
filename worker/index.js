// stejoy.com 是 Cloudflare Workers 的靜態檔（Workers Static Assets）。它不理 Range：瀏覽器問「從第幾個位元組起」照樣整個檔回 200，
// 影片就拖不了進度（只能從頭看到尾；workers-sdk #8967）。wrangler.jsonc 的 run_worker_first 只讓 /assets/media/* 先經過這支：
// 照常從 ASSETS 拿到靜態檔，有 Range 就切出那一段回 206，沒有就原樣回、加上 Accept-Ranges 讓瀏覽器知道拖得了。
// 出了任何差錯都退回原本的回應，最差就是跟以前一樣拖不了。其他網址不經過這支，照舊直接給靜態檔。

import { ranged } from './range.js';

export default {
  async fetch(request, env) {
    const res = await env.ASSETS.fetch(request);
    try { return await ranged(request, res); } catch (e) { return res; }
  },
};

