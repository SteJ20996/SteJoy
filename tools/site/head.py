"""每一頁 <head> 裡最先跑的那一小段（home.py、litou.py、build-site.py 共用）：

1. iPhone Duo 打開時用電腦版排（使用者要的）。Duo 打開直拿，Safari 給的畫面約 669×825（實機量的；橫拿約 951 寬，
   本來就是電腦版），落在本站手機版的範圍（760、860 以下）。iPhone 的直拿寬度最多 440，所以「iPhone、寬 600–859、
   高也有 600」只會是 Duo 打開直拿：把 viewport 設成 900 寬，照電腦版排、整頁縮到螢幕上。screen.width 開合都讀 466，
   分不出開合，只能看畫面的寬高。
   捲動時 Safari 的網址列一收一放，畫面高度會變 7–12%，這不算開合（v0.9.3 那版把它當成開合，每收放一次就把 viewport 改回
   device-width 再改成 900，整頁在手機版與電腦版之間來回重排；使用者在 Duo 上看到 Safari「Webpage Crashed」）。所以：
   (a) 只在 iPhone 上掛；(b) 還是 device-width 時，畫面寬就是真的寬，直接判斷，不碰 viewport；
   (c) 已經設成 900 時，看螢幕的實際寬度（visualViewport 的寬 × 縮放，以點計，網址列收放、手指縮放都不變；摺起來變 381、
       轉橫變 951）變了一成五以上，才回到 device-width 重量。切成 900 之後先驗一次這個數（應該還是剛才量的寬）：不對，
       就改看長寬比，變了 0.12 以上才算（摺起來約 0.15、轉向更多；網址列收放最多約 0.09）；
   (d) 結果跟現在一樣就不寫 viewport；五秒內最多改六次（摺、開、轉向都只改一次；判斷萬一來回，一秒幾十次也會被擋住；
       擋下的那次等下一個 resize 再補）。
2. 頁面大小（左下角的「− 100% ＋」，assets/js/site.js）：在畫面出來以前先套上次選的大小，免得先大後小閃一下。
   2026-11-13 使用者（在 MacBook 的 Safari 上看）：100% 太寬，把原本的 80% 當新的 100%、預設就是它，電腦、iPad、Windows 上可調 80%–120%。
   所以分兩種：
   - 大螢幕（電腦、平板：不是 iPhone、螢幕短邊 600 點以上、畫面寬過 760 用電腦版排）：實際縮放 = 0.8 × 選的大小，
     選 80%–120%（實際 0.64–0.96），記在 stejoy.zoom2；都小於 1，不會超出畫面，不用限。
   - 其他（手機、iPhone Duo、平板分割畫面窄到手機版）：照舊，實際縮放就是選的大小 70%–120%，記在 stejoy.zoom；
     放大只放到內容還有 880 寬（電腦版的版面），窄過 880 就最多 100%（vw 寫的寬度放大了會超出畫面）。
   跟 site.js 的 mode()／cap() 同一條。
"""

DUO_JS = (
    "(function(){if(!/iPhone/.test(navigator.userAgent))return;"
    "var m=document.querySelector('meta[name=viewport]'),D='width=device-width, initial-scale=1',vv=window.visualViewport,"
    "on=false,chk=false,vok=false,w0=0,r0=0,n=0,t0=Date.now();"
    "function set(d){var t=Date.now();if(t-t0>5e3){t0=t;n=0}if(++n>6)return false;"
    "on=d;chk=d;m.setAttribute('content',d?'width=900':D);document.documentElement.classList.toggle('duo',d);return true}"
    "function fit(){var w=innerWidth,h=innerHeight;w0=w;r0=w/h;if(!on&&w>=600&&w<860&&h>=600)set(true)}"
    "fit();addEventListener('resize',function(){if(!on){fit();return}"
    "var dw=vv?vv.width*vv.scale:0;"
    "if(chk){chk=false;vok=dw>0&&Math.abs(dw-w0)<w0*.15;return}"
    "if(vok?Math.abs(dw-w0)<w0*.15:Math.abs(innerWidth/innerHeight-r0)<.12)return;"
    "if(set(false))requestAnimationFrame(function(){requestAnimationFrame(fit)})})})();"
)

ZOOM_JS = (
    "try{var big=!/iPhone/.test(navigator.userAgent)&&Math.min(screen.width,screen.height)>=600&&innerWidth>760,z=1;"
    "try{z=+localStorage.getItem(big?'stejoy.zoom2':'stejoy.zoom')}catch(e){}"
    "if(big){if(!(z>=.8&&z<=1.2))z=1;z*=.8}"
    "else{if(!(z>=.7&&z<=1.2))z=1;z=Math.min(z,innerWidth<880?1:Math.min(1.2,Math.floor(innerWidth/88)/10))}"
    "z=Math.round(z*1000)/1000;"
    "if(z!==1){document.documentElement.style.zoom=z;document.documentElement.style.setProperty('--z',z)}}catch(e){}"
)

HEAD_JS = '<script>' + DUO_JS + ZOOM_JS + '</script>'
