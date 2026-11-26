#!/usr/bin/env python3
"""《力透紙背》試玩頁 litouzhibei/play/index.html（2026-11-24，使用者：「單獨做一個試玩版，放到網頁上去。目前設想的就是到二維第一關結束」；遊戲 v0.13.6）。

    python3 tools/litou/play.py <遊戲庫>

遊戲庫先在 claude/xieyi-zhan 分支跑 `python3 scripts/build-single.py --demo`，出 dist/xieyi-zhan-demo.html：
那是給 claude.ai Artifact 的片段（沒有 doctype、charset，一開頭是 <title> 與 claude: 的 meta），旗子 window.ZHAN_DEMO 已經插在所有程式之前。
這裡只包上網站的 <head>（charset、viewport、標題、說明、canonical、圖示、og），片段的 <title> 與 claude: meta 拿掉、字型的 <link> 挪進 head；
遊戲本身一個字不改。五語共用這一頁：介紹頁的「免費試玩」帶 ?lang=hant／hans／en／ja／vi，遊戲的 src/demo.js 照它開、再從網址拿掉。
遊戲改版就重跑一次，跟著介紹頁一起等使用者說「上線」才合。
"""
import re, sys, html
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
GAME = Path(sys.argv[1] if len(sys.argv) > 1 else '../litouzhibei-game').resolve()
src = GAME / 'dist' / 'xieyi-zhan-demo.html'
if not src.exists(): sys.exit('找不到 ' + str(src) + '：先在遊戲庫跑 python3 scripts/build-single.py --demo')
frag = src.read_text(encoding='utf-8')
assert 'window.ZHAN_DEMO = true;</script>' in frag, '這不是試玩版（少了 window.ZHAN_DEMO）'
ver = re.search(r"R\.VERSION = '([\d.]+)'", frag).group(1)

# 片段開頭：<title>、claude: meta、字型的 <link>；之後是 <style> 與整個遊戲
head_links, rest = [], frag
while True:
    line, _, tail = rest.partition('\n')
    t = line.strip()
    if t.startswith('<title>') or t.startswith('<meta name="claude:'): rest = tail; continue
    if t.startswith('<link '): head_links.append(t); rest = tail; continue
    break
assert rest.lstrip().startswith('<style>'), '片段的開頭變了：' + rest[:80]

SITE = 'https://stejoy.com/'
title = '力透紙背 · 試玩｜Through the Page · Demo'
desc = ('《力透紙背》免費試玩：序章、第一章與第二章的正面。以筆順為招式的漢字戰鬥遊戲——鍵盤 1 到 0 是十種筆畫，照筆順寫對，錯字就正了。'
        ' Free demo of Through the Page: the prologue, chapter 1 and the front of chapter 2.')
page = f'''<!doctype html>
<html lang="zh-Hant">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>{html.escape(title)}</title>
<meta name="description" content="{html.escape(desc)}">
<meta name="author" content="Stephen Jia">
<link rel="canonical" href="{SITE}litouzhibei/play/">
<meta property="og:type" content="website">
<meta property="og:site_name" content="SteJoy">
<meta property="og:title" content="{html.escape(title)}">
<meta property="og:description" content="{html.escape(desc)}">
<meta property="og:image" content="{SITE}assets/media/litou/trailer.jpg">
<meta property="og:url" content="{SITE}litouzhibei/play/">
<meta name="twitter:card" content="summary_large_image">
<meta name="theme-color" content="#efe5cf">
<meta name="generator" content="力透紙背 v{ver} demo (tools/litou/play.py)">
<link rel="icon" href="../../favicon.ico" sizes="any">
<link rel="icon" href="../../assets/img/icon.svg" type="image/svg+xml">
<link rel="apple-touch-icon" href="../../assets/img/icon-180.png">
{chr(10).join(head_links)}
</head>
<body>
{rest.strip()}
</body>
</html>
'''
out = ROOT / 'litouzhibei' / 'play' / 'index.html'
out.parent.mkdir(parents=True, exist_ok=True)
out.write_text(page, encoding='utf-8')
print(out.relative_to(ROOT), len(page.encode()), 'bytes · 遊戲 v' + ver)
