"""每一頁 <head> 裡最先跑的那一小段（home.py、litou.py、build-site.py 共用）：

1. iPhone Duo 打開時用電腦版排（使用者要的）。Duo 打開直拿，Safari 給的畫面約 669×825（實機量的；橫拿約 951 寬，
   本來就是電腦版），落在本站手機版的範圍（760、860 以下）。iPhone 的直拿寬度最多 440，所以「iPhone、寬 600–859、
   高也有 600」只會是 Duo 打開直拿：把 viewport 設成 900 寬，照電腦版排、整頁縮到螢幕上。screen.width 開合都讀 466，
   分不出開合，只能看畫面的寬高；摺起來或轉向時畫面的長寬比會變，先回到 device-width 量一次再決定。
2. 頁面大小（左下角的「− 100% ＋」，assets/js/site.js）：在畫面出來以前先套上次選的大小，免得先大後小閃一下。
   放大只放到內容還有 880 寬（電腦版的版面）；窄過 880 就最多 100%（vw 寫的寬度放大了會超出畫面）。跟 site.js 的 cap() 同一條。
"""

DUO_JS = (
    "(function(){var m=document.querySelector('meta[name=viewport]'),D='width=device-width, initial-scale=1',r0=0;"
    "function fit(){var w=innerWidth,h=innerHeight;r0=w/h;"
    "if(/iPhone/.test(navigator.userAgent)&&w>=600&&w<860&&h>=600){m.setAttribute('content','width=900');document.documentElement.classList.add('duo')}}"
    "fit();addEventListener('resize',function(){if(Math.abs(innerWidth/innerHeight-r0)<.05)return;"
    "m.setAttribute('content',D);document.documentElement.classList.remove('duo');"
    "requestAnimationFrame(function(){requestAnimationFrame(fit)})})})();"
)

ZOOM_JS = (
    "try{var z=+localStorage.getItem('stejoy.zoom');if(z>=.7&&z<=1.2){"
    "z=Math.min(z,innerWidth<880?1:Math.min(1.2,Math.floor(innerWidth/88)/10));"
    "if(z!==1){document.documentElement.style.zoom=z;document.documentElement.style.setProperty('--z',z)}}}catch(e){}"
)

HEAD_JS = '<script>' + DUO_JS + ZOOM_JS + '</script>'
