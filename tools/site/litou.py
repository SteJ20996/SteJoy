"""《力透紙背》（Through the Page）的介紹頁：「寫意」系列第二部，還在做（頁上寫「敬請期待」）。
四語四頁：litouzhibei/（繁中）、zh-hans/litouzhibei/、en/litouzhibei/、ja/litouzhibei/（日文 2026-11-06 加；筆畫名、性質、音讀訓讀照遊戲的日文版）。由 tools/site/build-site.py 一起產生，文字改這個檔案的 TEXT。
風格刻意跟首頁《墨畫蒼生》不同：墨重、斜、快；紅印「敬請期待」；一卷五章用一個會展開的超正方體（點→線→面→體→四維）；
可以直接按 1–0 寫字（跟遊戲同一套筆順與字形）。遊戲的資料（筆形、字形、標誌）由 tools/litou/data.mjs 從遊戲庫抄出來，
預告與場景由 tools/litou/ 錄、剪（見 README）。
"""
import json, html
import sys, os; sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from head import HEAD_JS   # iPhone Duo 用電腦版排、頁面大小（tools/site/head.py）
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
SLUG = 'litouzhibei/'
DATA = json.loads((ROOT / 'assets/litou/data.js').read_text(encoding='utf-8').split('window.LITOU = ', 1)[1].rstrip().rstrip(';'))
# 「寫意」朱印（2026-11-10，使用者：力透紙背的遊戲、網頁、預告都沒標上寫意，要像《墨畫蒼生》一樣）：
# 跟《墨畫蒼生》字標裡那方印同一份（朱底、霞鶩文楷粗體「寫意」轉外框，38×56），蓋在標題右下；遊戲起始頁、預告片頭片尾同一個位置
XIEYI_SEAL = '''<svg class="lt-xieyi" viewBox="0 0 38 56" aria-hidden="true" focusable="false"><g fill="#b4392a"><path d="M0 3Q1 0 4 1L34 0Q38 .4 37 4L38 52Q37 56 33 55L2 56Q0 56 .6 52Z" /><g fill="#fff6e4" data-typeface="LXGWWenKaiTC-Bold" data-weight="700"><path d="M177 -3Q177 -18 194.5 -31.0Q212 -44 223.0 -44.0Q234 -44 246.5 -27.5Q259 -11 271.5 12.0Q284 35 295.5 59.5Q307 84 314.0 102.5Q321 121 321 127Q321 143 299 151Q286 158 278 158Q265 158 257 137Q245 105 227.0 75.5Q209 46 185 17Q177 6 177 -3ZM459 11Q459 21 453.5 44.0Q448 67 440.5 93.0Q433 119 425 138Q415 163 399 163Q392 163 382 160Q359 152 359 137Q359 133 360.5 128.5Q362 124 363 119Q371 97 377.0 68.0Q383 39 386 10Q390 -17 411 -17Q414 -17 425.0 -16.0Q436 -15 447.5 -9.0Q459 -3 459 11ZM599 48Q599 56 590.5 77.5Q582 99 569.5 122.0Q557 145 543.5 163.0Q530 181 518.5 181.0Q507 181 493.0 172.0Q479 163 479 152Q479 143 486 133Q500 111 510.0 87.5Q520 64 527 41Q536 15 552 15Q555 15 563 17Q563 15 563 14Q563 2 577.5 -12.0Q592 -26 613.0 -42.0Q634 -58 657.0 -72.0Q680 -86 701.0 -96.0Q722 -106 734 -106Q741 -106 752.5 -101.5Q764 -97 777.5 -80.5Q791 -64 806.0 -29.5Q821 5 835.5 64.5Q850 124 863 215Q864 220 868.0 226.5Q872 233 872 242Q872 261 852.0 272.0Q832 283 818 283H807L411 263L425 275Q432 280 432 290Q432 303 413 322L422 314L736 328Q748 329 759.5 331.5Q771 334 771 346Q771 360 746 388L769 536Q770 540 773.0 546.5Q776 553 776 561Q776 576 765.0 585.5Q754 595 742.0 600.0Q730 605 723 605H715L565 595H552Q540 595 529.5 596.0Q519 597 508 600Q507 601 504 601Q493 601 493 589Q493 584 494 581Q506 547 524.5 540.0Q543 533 556 533Q559 533 563.0 533.5Q567 534 571 534L696 543L691 497L568 489H555Q545 489 536.5 490.0Q528 491 517 494Q516 494 515.0 494.5Q514 495 512 495Q501 495 501 484Q501 479 508.0 463.5Q515 448 527 438Q534 434 542.0 432.0Q550 430 562 430Q566 430 570.5 430.5Q575 431 579 431L683 437L678 388L311 371L306 420L465 429Q487 432 487.0 448.0Q487 464 468 480Q448 493 436 493Q434 493 430.0 493.0Q426 493 422 490Q414 487 404.5 484.5Q395 482 384 481L301 476L298 516Q378 532 471 575Q484 581 484 594Q484 603 477.5 617.5Q471 632 462 644Q459 649 456 652L841 673Q831 648 819.0 621.5Q807 595 789 565Q777 546 777 532Q777 517 790 517Q800 517 821.0 536.5Q842 556 868.5 590.0Q895 624 921 668Q926 675 933.0 682.5Q940 690 940 699Q940 713 922.5 726.0Q905 739 885 739H878L536 720L537 793Q537 809 521.0 817.0Q505 825 488.0 828.0Q471 831 461 831Q440 831 440 817Q440 812 446 804Q460 783 460 767V716L231 702L235 716Q239 732 239 737Q239 756 213 765Q203 768 196 768Q184 768 178.5 761.0Q173 754 169 742Q158 700 136.5 643.5Q115 587 88 539Q87 536 85.5 532.5Q84 529 84 525Q84 511 100.5 500.5Q117 490 132 490Q139 490 146.0 495.0Q153 500 161.0 514.0Q169 528 181.5 559.0Q194 590 210 638L431 650Q429 647 427 643Q425 639 414.0 628.0Q403 617 373.0 601.5Q343 586 282 569Q264 576 251.0 578.5Q238 581 229 581Q212 581 212 568Q212 563 216 555Q228 528 231 495L241 384Q242 377 242.0 370.5Q242 364 242 359Q242 352 242.0 346.5Q242 341 241 335V331Q241 318 247.5 309.0Q254 300 272 292Q286 285 296 285Q316 285 316 307V309L351 311Q350 305 339 294Q277 234 211.5 188.5Q146 143 72 110Q46 99 46.0 84.0Q46 69 68 69Q78 69 115.0 81.0Q152 93 207.5 121.0Q263 149 326 194L787 215Q779 143 763.5 84.0Q748 25 723 -21Q722 -23 721 -24H720Q720 -24 718 -24Q691 -16 661.5 -5.0Q632 6 602 18Q591 24 583 25Q585 26 588 28Q599 35 599 48ZM726 84Q726 92 715.0 110.5Q704 129 689.5 150.0Q675 171 660.0 187.0Q645 203 635.0 203.0Q625 203 612.0 193.0Q599 183 599.0 174.5Q599 166 608 153Q639 114 660 67Q669 46 682.0 46.0Q695 46 710.5 58.5Q726 71 726 84Z" data-char="寫" transform="translate(7.000 22.000) scale(0.023000 -0.023000)" /><path d="M587 703Q621 703 621 746Q617 786 405 812Q374 810 374 772Q375 757 401 751Q488 734 554 710Q565 707 572.5 705.0Q580 703 587 703ZM615 -75Q730 -75 760 -62Q799 -46 799 -21Q799 -7 777.5 14.5Q756 36 733.0 63.0Q710 90 693.0 113.5Q676 137 664.0 137.0Q652 137 652 119Q652 95 677 45L698 -1Q698 -2 612 -2Q503 -2 436.0 24.5Q369 51 345 122Q339 136 331 142Q352 145 352 172V178Q703 192 727 194Q740 194 740 207Q740 221 718 244Q743 390 745.5 394.5Q748 399 748.0 406.0Q748 413 735.5 429.5Q723 446 690 446L328 426Q274 444 259 444Q245 444 245 431Q245 427 248 421Q256 402 259.5 392.0Q263 382 270 303Q277 235 277 223Q277 203 274 188Q274 174 280.0 165.5Q286 157 302 150Q306 148 309 147Q278 144 278 116Q278 112 280 103Q315 4 411 -43Q476 -75 615 -75ZM71 -17Q71 -34 87.5 -45.5Q104 -57 116.0 -57.0Q128 -57 143.0 -37.0Q158 -17 174.5 10.0Q191 37 205.5 65.5Q220 94 229.5 116.0Q239 138 239 143Q239 158 215 170Q209 172 204.5 173.5Q200 175 195 175Q182 175 173 154Q136 71 80 6Q71 -7 71 -17ZM558 26Q567 26 582.0 40.0Q597 54 597 70Q597 91 540.5 134.0Q484 177 467 177Q454 177 443.5 163.0Q433 149 433 142Q433 132 446 122Q503 78 531 42Q545 26 558 26ZM907 -17Q915 -17 925.0 -8.5Q935 0 941.5 11.0Q948 22 948 30Q948 49 894 98Q801 186 779 186Q767 186 755.5 171.0Q744 156 744 148Q744 136 759 124Q821 72 881 0Q895 -17 907 -17ZM346 236 343 275 656 290 652 249ZM337 331 334 367 666 383 663 347ZM124 450 914 495Q940 498 940 513Q940 519 931.5 530.0Q923 541 911.0 551.0Q899 561 886 561Q851 554 844 554L628 542Q667 584 667 597Q667 608 654.0 618.0Q641 628 627 634L787 644Q815 645 815 665Q815 675 805.5 685.5Q796 696 783.5 703.5Q771 711 759 711Q754 711 751 710Q742 707 733.0 705.5Q724 704 483.5 689.5Q243 675 240.0 674.5Q237 674 233 674Q218 674 203 678Q199 679 194 679Q183 679 183.0 667.0Q183 655 191.5 641.5Q200 628 208.5 620.0Q217 612 242 612H258L344 617Q342 616 340 614Q326 601 326 588Q326 580 337 569Q364 544 381 521L375 527Q129 512 118 512Q99 512 79 516Q66 516 66 505Q66 488 86 465Q101 450 124 450ZM378 619 593 632Q591 629 591 626Q589 610 585.5 599.5Q582 589 572.5 574.0Q563 559 546 537L447 531V540Q447 556 411 591Q391 611 378 619Z" data-char="意" transform="translate(7.000 45.000) scale(0.023000 -0.023000)" /></g></g></svg>'''
DIM_CLIPS = ['point', 'line', 'mobius', 'tess', 'hyper']   # 一卷五章，各配一段實機畫面（assets/media/litou/scenes/）
H2_STROKES = {'trailer': 'H', 'story': 'S', 'dims': 'P', 'write': 'D', 'features': 'N', 'contact': 'T'}   # 每一節的標題前是一筆
# 遊戲起始頁的四個濾鏡，另加 #f-seal：大一點的紅印用的（空洞少、塊大，不然整片都是白點）
FXDEFS = '<svg class="fxdefs" width="0" height="0" aria-hidden="true" focusable="false">\n  <filter id="f-ink" x="-8%" y="-8%" width="116%" height="116%" color-interpolation-filters="sRGB">\n    <feTurbulence type="fractalNoise" baseFrequency="0.62" numOctaves="2" seed="3" result="n"/>\n    <feDisplacementMap in="SourceGraphic" in2="n" scale="2" xChannelSelector="R" yChannelSelector="G"/>\n  </filter>\n  <filter id="f-bleed" x="-30%" y="-30%" width="160%" height="160%" color-interpolation-filters="sRGB">\n    <feMorphology in="SourceGraphic" operator="dilate" radius="1" result="d"/>\n    <feGaussianBlur in="d" stdDeviation="0.9" result="b"/>\n    <feTurbulence type="fractalNoise" baseFrequency="1.3" numOctaves="3" seed="7" result="n"/>\n    <feDisplacementMap in="b" in2="n" scale="4.5" xChannelSelector="R" yChannelSelector="G" result="w"/>\n    <feComponentTransfer in="w"><feFuncA type="table" tableValues="0 0.5 0.85 1"/></feComponentTransfer>\n  </filter>\n  <filter id="f-dry" x="-2%" y="-30%" width="104%" height="160%" color-interpolation-filters="sRGB">\n    <feTurbulence type="fractalNoise" baseFrequency="0.003 0.2" numOctaves="2" seed="9" result="s"/>\n    <feColorMatrix in="s" type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  -10 0 0 0 5.7" result="m"/>\n    <feComposite in="SourceGraphic" in2="m" operator="in" result="c"/>\n    <feTurbulence type="fractalNoise" baseFrequency="0.7" numOctaves="2" seed="4" result="n"/>\n    <feDisplacementMap in="c" in2="n" scale="5" xChannelSelector="R" yChannelSelector="G"/>\n  </filter>\n  <filter id="f-stamp" x="-6%" y="-6%" width="112%" height="112%" color-interpolation-filters="sRGB">\n    <feTurbulence type="fractalNoise" baseFrequency="0.8" numOctaves="2" seed="11" result="n"/>\n    <feDisplacementMap in="SourceGraphic" in2="n" scale="1.4" xChannelSelector="R" yChannelSelector="G" result="r"/>\n    <feTurbulence type="fractalNoise" baseFrequency="0.16" numOctaves="3" seed="5" result="m"/>\n    <feColorMatrix in="m" type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  -20 0 0 0 13.6" result="mask"/>\n    <feComposite in="r" in2="mask" operator="in"/>\n  </filter>\n  <filter id="f-seal" x="-6%" y="-10%" width="112%" height="120%" color-interpolation-filters="sRGB">\n    <feTurbulence type="fractalNoise" baseFrequency="0.7" numOctaves="2" seed="11" result="n"/>\n    <feDisplacementMap in="SourceGraphic" in2="n" scale="2.2" xChannelSelector="R" yChannelSelector="G" result="r"/>\n    <feTurbulence type="fractalNoise" baseFrequency="0.07" numOctaves="3" seed="5" result="m"/>\n    <feColorMatrix in="m" type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  -30 0 0 0 22.6" result="mask"/>\n    <feComposite in="r" in2="mask" operator="in"/>\n  </filter>\n</svg>'

TEXT = {
    'zh-Hant': {
        "title": "力透紙背 Through the Page｜長風",
        "desc": "以筆順為招式的漢字戰鬥遊戲。你是紙上剩下的一個「人」：鍵盤 1 到 0 是十種筆畫，照筆順寫對，錯字就正了。由點及線、由線及面、由面及體，一路寫進超正方體的裡面。",
        "nav": [
                "預告",
                "故事",
                "一卷",
                "試寫",
                "特色",
                "聯絡"
        ],
        "kicker": "「寫意」系列 · 第二部",
        "tagline": "紙為陣 · 筆為兵 · 墨為甲",
        "motto": "由點及線 · 由線及面 · 由面及體",
        "soon": "敬請期待",
        "watch": "觀看預告",
        "trywrite": "試寫一個字",
        "trailer_h": "預告",
        "trailer_note": "遊戲實機畫面。還在做，畫面與內容都會再變；配樂是暫用的合成樂。",
        "story_h": "故事",
        "quote": "夫紙者陣也，筆者刀槊也，墨者鍪甲也。",
        "cite": "王羲之〈題衛夫人筆陣圖後〉",
        "story": [
                "字本是平的。塗來了：一團不成字的墨，所過之處，字被抹回散亂的筆畫與墨點。你是紙上剩下的一個「人」。",
                "鍵盤 1 到 0 是十種筆畫。照筆順寫對一個字，眼前的錯字就正了；寫成識得的字，筆畫化成招式。筆要寫得快，也要寫得對。",
                "從一個點學會十種筆畫，寫下「一」。點會拉成線，線會圍成紙，紙會摺成……再往下，要你自己寫進去。"
        ],
        "dims_h": "一卷",
        "dims_intro": "每一章多一個維度，規則跟著變；每一章的結尾，都替下一章鋪好了路。",
        "dims": [
                [
                        "序章",
                        "零維 · 點",
                        "世界只有一個點。十種筆畫都從這一點落下；寫下「一」，點就拉成了線。"
                ],
                [
                        "第一章",
                        "一維 · 線",
                        "敵從左右兩頭來，照面前那個字的筆順寫，它就正了。線寫到後來首尾相接，圈出一張紙。"
                ],
                [
                        "第二章",
                        "二維 · 面",
                        "每一筆都打得到敵，寫成字就出招。寫穿紙背，字都反了；紙條扭成莫比烏斯環，沒有左右的邊。"
                ],
                [
                        "第三章",
                        "三維 · 體",
                        "紙沿著摺痕摺成正方體。前後左右上下，遠處敵身上的字寫出來，字就飛過去。這個正方體只是超正方體的一個胞：照先天八卦，一胞一象。"
                ],
                [
                        "第四章",
                        "四維",
                        "八胞合一，你走進超正方體的裡面。多一個看不見的方向 w，別的 w 上的敵只剩影子。"
                ]
        ],
        "loop": "九九歸一",
        "write_h": "試寫",
        "write_intro": "按鍵盤 1 到 0（或點下面的鍵）寫一筆。照筆順寫成一個字就成字；寫不成字，筆就散了。",
        "write_try": "試試：9 3 寫「力」，1 3 5 寫「大」，4 9 0 3 5 寫「永」。",
        "write_cands": "還能寫成",
        "write_none": "不成字",
        "write_got": "成字",
        "write_reset": "重寫",
        "write_count": "寫成了 {n} 個字，共 {N} 個",
        "write_idle": "按一個鍵，寫第一筆。",
        "feat_h": "特色",
        "feat_intro": "寫得快，也要寫得對。",
        "strokes_h": "十筆，十招",
        "strokes_intro": "每一筆有自己的脾氣：橫伸得最遠，點砸得最重，捺推得開敵，鉤拉得回來。",
        "strokes_more": "漢字的筆畫不只這十種：我的斜鉤，心的臥鉤，九的橫折彎鉤，乃的橫折折折鉤……分法不同，數起來二三十種都有。這裡用最常見的十種，一鍵一筆；遊戲裡的八十九個字，都是只用這十種就寫得出、繁簡一樣、兩岸筆順相同的字。到了深造、爐火純青的三維與四維，還有三筆在等你。",
        "features": [
                [
                        "繁簡一體，兩岸同筆順",
                        "寫來禦敵的字，繁體、簡體同一個字形，台灣與大陸的筆順也一樣；筆順照教育部《常用國字標準字體筆順》。只有一個字兩岸筆順不同，照台灣的寫，遊戲裡註明了。"
                ],
                [
                        "以字為招",
                        "寫成「大」，墨化成一圈推開身邊的敵；「火」燒、「口」困、「寸」刺。每個字有次數，不能一個字打到底。"
                ],
                [
                        "習字",
                        "不打仗也行：主頁有習字模式，八十九個字照筆數排好，一筆一筆寫進米字格。"
                ],
                [
                        "四種語言",
                        "介面有繁體中文、简体中文、English、日本語；英文版附拼音與字義，日文版附音讀訓讀。"
                ]
        ],
        "facts": [
                "單人、離線",
                "鍵盤：1 到 0 寫十種筆畫",
                "介面：繁體中文、简体中文、English、日本語",
                "四種難度：故事、入門、深造、爐火純青",
                "敬請期待"
        ],
        "contact_h": "聯絡",
        "contact": "《力透紙背》是長風「寫意」系列的第二部，還在做。想說什麼，寫信給我們：",
        "series": "系列第一部《墨畫蒼生》",
        "video_off": "你的瀏覽器放不了這段影片。",
        "bio": [
                "教數學、做研究，也用互動遊戲探索文字與文學。",
                "《力透紙背》把筆順寫成招式、把維度寫成關卡：由點及線，由線及面，由面及體。"
        ]
    },
    'zh-Hans': {
        "title": "力透纸背 Through the Page｜长风",
        "desc": "以笔顺为招式的汉字战斗游戏。你是纸上剩下的一个“人”：键盘 1 到 0 是十种笔画，照笔顺写对，错字就正了。由点及线、由线及面、由面及体，一路写进超正方体的里面。",
        "nav": [
                "预告",
                "故事",
                "一卷",
                "试写",
                "特色",
                "联系"
        ],
        "kicker": "“写意”系列 · 第二部",
        "tagline": "纸为阵 · 笔为兵 · 墨为甲",
        "motto": "由点及线 · 由线及面 · 由面及体",
        "soon": "敬请期待",
        "watch": "观看预告",
        "trywrite": "试写一个字",
        "trailer_h": "预告",
        "trailer_note": "游戏实机画面。还在做，画面与内容都会再变；配乐是暂用的合成乐。",
        "story_h": "故事",
        "quote": "夫纸者阵也，笔者刀槊也，墨者鍪甲也。",
        "cite": "王羲之〈题卫夫人笔阵图后〉",
        "story": [
                "字本是平的。涂来了：一团不成字的墨，所过之处，字被抹回散乱的笔画与墨点。你是纸上剩下的一个“人”。",
                "键盘 1 到 0 是十种笔画。照笔顺写对一个字，眼前的错字就正了；写成识得的字，笔画化成招式。笔要写得快，也要写得对。",
                "从一个点学会十种笔画，写下“一”。点会拉成线，线会围成纸，纸会折成……再往下，要你自己写进去。"
        ],
        "dims_h": "一卷",
        "dims_intro": "每一章多一个维度，规则跟着变；每一章的结尾，都替下一章铺好了路。",
        "dims": [
                [
                        "序章",
                        "零维 · 点",
                        "世界只有一个点。十种笔画都从这一点落下；写下“一”，点就拉成了线。"
                ],
                [
                        "第一章",
                        "一维 · 线",
                        "敌从左右两头来，照面前那个字的笔顺写，它就正了。线写到后来首尾相接，圈出一张纸。"
                ],
                [
                        "第二章",
                        "二维 · 面",
                        "每一笔都打得到敌，写成字就出招。写穿纸背，字都反了；纸条扭成莫比乌斯环，没有左右的边。"
                ],
                [
                        "第三章",
                        "三维 · 体",
                        "纸沿着折痕折成正方体。前后左右上下，远处敌身上的字写出来，字就飞过去。这个正方体只是超正方体的一个胞：照先天八卦，一胞一象。"
                ],
                [
                        "第四章",
                        "四维",
                        "八胞合一，你走进超正方体的里面。多一个看不见的方向 w，别的 w 上的敌只剩影子。"
                ]
        ],
        "loop": "九九归一",
        "write_h": "试写",
        "write_intro": "按键盘 1 到 0（或点下面的键）写一笔。照笔顺写成一个字就成字；写不成字，笔就散了。",
        "write_try": "试试：9 3 写“力”，1 3 5 写“大”，4 9 0 3 5 写“永”。",
        "write_cands": "还能写成",
        "write_none": "不成字",
        "write_got": "成字",
        "write_reset": "重写",
        "write_count": "写成了 {n} 个字，共 {N} 个",
        "write_idle": "按一个键，写第一笔。",
        "feat_h": "特色",
        "feat_intro": "写得快，也要写得对。",
        "strokes_h": "十笔，十招",
        "strokes_intro": "每一笔有自己的脾气：横伸得最远，点砸得最重，捺推得开敌，钩拉得回来。",
        "strokes_more": "汉字的笔画不只这十种：我的斜钩，心的卧钩，九的横折弯钩，乃的横折折折钩……分法不同，数起来二三十种都有。这里用最常见的十种，一键一笔；游戏里的八十九个字，都是只用这十种就写得出、繁简一样、两岸笔顺相同的字。到了深造、炉火纯青的三维与四维，还有三笔在等你。",
        "features": [
                [
                        "繁简一体，两岸同笔顺",
                        "写来御敌的字，繁体、简体同一个字形，台湾与大陆的笔顺也一样；笔顺照台湾教育部《常用国字标准字体笔顺》。只有一个字两岸笔顺不同，照台湾的写，游戏里注明了。"
                ],
                [
                        "以字为招",
                        "写成“大”，墨化成一圈推开身边的敌；“火”烧、“口”困、“寸”刺。每个字有次数，不能一个字打到底。"
                ],
                [
                        "习字",
                        "不打仗也行：主页有习字模式，八十九个字照笔数排好，一笔一笔写进米字格。"
                ],
                [
                        "四种语言",
                        "界面有繁體中文、简体中文、English、日本語；英文版附拼音与字义，日文版附音读训读。"
                ]
        ],
        "facts": [
                "单人、离线",
                "键盘：1 到 0 写十种笔画",
                "界面：繁體中文、简体中文、English、日本語",
                "四种难度：故事、入门、深造、炉火纯青",
                "敬请期待"
        ],
        "contact_h": "联系",
        "contact": "《力透纸背》是长风“写意”系列的第二部，还在做。想说什么，写信给我们：",
        "series": "系列第一部《墨画苍生》",
        "video_off": "你的浏览器放不了这段视频。",
        "bio": [
                "教数学、做研究，也用互动游戏探索文字与文学。",
                "《力透纸背》把笔顺写成招式、把维度写成关卡：由点及线，由线及面，由面及体。"
        ]
    },
    'en': {
        "title": "Through the Page 力透紙背 | SteJoy",
        "desc": "A battle game where stroke order is your weapon. You are 人, the last “person” left on the page: keys 1–0 are the ten brush strokes, and writing a character in the right order sets the broken one in front of you right. From point to line, line to plane, plane to solid, and on into the inside of a tesseract.",
        "nav": [
                "Trailer",
                "Story",
                "The scroll",
                "Try it",
                "Features",
                "Contact"
        ],
        "kicker": "The Xieyi series · Part 2",
        "tagline": "Paper is the battlefield · the brush the soldier · ink the armor",
        "motto": "From point to line · line to plane · plane to solid",
        "soon": "Coming soon",
        "watch": "Watch the trailer",
        "trywrite": "Write a character",
        "trailer_h": "Trailer",
        "trailer_note": "In-game footage. The game is still in the making, so what you see will change; the music is a temporary synthesized track.",
        "story_h": "Story",
        "quote": "Paper is the battlefield, the brush is the spear, ink is the armor.",
        "cite": "Wang Xizhi, postscript to Lady Wei’s Battle Formation of the Brush",
        "story": [
                "Characters used to lie flat. Then came 塗, the Smudge: a mass of ink that is no character at all. Wherever it passes, characters are wiped back into loose strokes and blots. You are 人, the one “person” left on the page.",
                "Keys 1 to 0 are the ten brush strokes. Write a character in the right stroke order and the broken one in front of you is set right; write one you have learned, and its strokes become a spell. Be quick, and be right.",
                "From a single point you learn the ten strokes and write 一, “one”. The point will stretch into a line, the line will enclose a page, the page will fold into… Beyond that, you have to write your own way in."
        ],
        "dims_h": "The scroll",
        "dims_intro": "Each chapter adds a dimension, and the rules change with it. Each chapter’s ending lays the road for the next.",
        "dims": [
                [
                        "Prologue",
                        "0D · The point",
                        "There is only a point. All ten strokes fall from it; write 一 and the point stretches into a line."
                ],
                [
                        "Chapter 1",
                        "1D · The line",
                        "Enemies come from both ends. Write the character in front of you in stroke order and it is set right. In the end the line meets itself and encloses a page."
                ],
                [
                        "Chapter 2",
                        "2D · The page",
                        "Every stroke can hit, and finished characters become spells. Write through to the back of the page, where every character is mirrored; twist the strip into a Möbius band, which has no left or right edge."
                ],
                [
                        "Chapter 3",
                        "3D · The solid",
                        "The page folds along its creases into a cube. Forward and back, up and down: write the character on a distant enemy and it flies to them. The cube is only one cell of a tesseract; walk the others by the Early Heaven trigrams, one image to each cell."
                ],
                [
                        "Chapter 4",
                        "4D",
                        "The eight cells become one, and you step inside the tesseract. There is one more direction, w, that you cannot see; enemies on other w are only shadows."
                ]
        ],
        "loop": "Nine nines return to one",
        "write_h": "Try it",
        "write_intro": "Press keys 1 to 0 (or tap the keys below) to write a stroke. Strokes in the right order become a character; strokes that make no character scatter.",
        "write_try": "Try 9 3 for 力 (strength), 1 3 5 for 大 (big), 4 9 0 3 5 for 永 (eternal).",
        "write_cands": "Could still become",
        "write_none": "No character",
        "write_got": "Written",
        "write_reset": "Clear",
        "write_count": "{n} of {N} characters written",
        "write_idle": "Press a key to write the first stroke.",
        "feat_h": "Features",
        "feat_intro": "Write fast, and write right.",
        "strokes_h": "Ten strokes, ten moves",
        "strokes_intro": "Each stroke has its own temper: the horizontal reaches farthest, the dot hits hardest, the right-falling stroke pushes, the hooks pull back.",
        "strokes_more": "These ten are not all the strokes Chinese has: there is the slanting hook of 我, the lying hook of 心, the turn-and-bend hook of 九, the zigzag of 乃 — some twenty to thirty shapes, depending on how you count. The game starts with the ten most common, one key each; each of its 89 characters was chosen because it needs nothing beyond them, looks the same in Traditional and Simplified, and has the same stroke order in Taiwan and mainland China. On Advanced and Mastery, three more strokes wait for you in the third and fourth dimensions.",
        "features": [
                [
                        "One form, one stroke order",
                        "Every character you fight with looks the same in Traditional and Simplified Chinese, and is written in the same order in Taiwan and mainland China (following Taiwan’s Ministry of Education standard). Just one character is written in a different order on the two sides; the game follows Taiwan’s and says so."
                ],
                [
                        "Characters as spells",
                        "Write 大 (big) and ink rings out to push enemies away; 火 burns, 口 traps, 寸 pierces. Each character has limited uses, so no single one wins the whole scroll."
                ],
                [
                        "Practice mode",
                        "No fighting needed: the home screen has a practice mode with 89 characters, sorted by stroke count, to write stroke by stroke into a practice grid."
                ],
                [
                        "Four languages",
                        "Traditional Chinese, Simplified Chinese, English and Japanese. The English version adds pinyin and meanings; the Japanese version adds on and kun readings."
                ]
        ],
        "facts": [
                "Single-player, offline",
                "Keyboard: keys 1–0 are the ten strokes",
                "Interface: Traditional Chinese, Simplified Chinese, English, Japanese",
                "Four difficulties: Story, Beginner, Advanced, Mastery",
                "Coming soon"
        ],
        "contact_h": "Contact",
        "contact": "Through the Page is the second game in SteJoy’s 寫意 (Xieyi) series, and still in the making. Write to us:",
        "series": "Part 1 of the series: InkWild",
        "video_off": "Your browser cannot play this video.",
        "bio": [
                "Math teacher and researcher who explores writing and literature through interactive games.",
                "Through the Page turns stroke order into combat and dimensions into levels: from point to line, line to plane, plane to solid."
        ]
    },
    'ja': {   # 遊戲本身有日文版：副標、標語、章名、難度、筆畫名照遊戲（src/rules.js、index.html 的 data-ja）
        "title": "力透紙背 Through the Page｜長風",
        "desc": "筆順が技になる、漢字のバトルゲーム。あなたは紙に残った一字「人」。キーボードの 1 から 0 が十種の画で、筆順どおりに書けば崩れた字が正される。点から線へ、線から面へ、面から立体へ、そして超立方体の内側へと書き進む。",
        "nav": ["予告編", "物語", "一巻", "試し書き", "特徴", "お問い合わせ"],
        "kicker": "「写意」シリーズ · 第二部",   # 照遊戲日文版的標題畫面
        "tagline": "紙は陣 · 筆は兵 · 墨は甲",
        "motto": "点から線へ · 線から面へ · 面から立体へ",
        "soon": "乞うご期待",
        "watch": "予告編を見る",
        "trywrite": "一字書いてみる",
        "trailer_h": "予告編",
        "trailer_note": "ゲームの実機映像です。開発中のため、画面も内容もまだ変わります。音楽は仮の合成音源です。",
        "story_h": "物語",
        "quote": "夫れ紙は陣なり、筆は刀槊なり、墨は鍪甲なり。",
        "cite": "王羲之「題衛夫人筆陣図後」",
        "story": [
                "字はもともと平らだった。そこへ塗がやって来た。字にならない墨のかたまりで、通ったあとの字は、ばらばらの画と墨の点に戻されてしまう。あなたは紙に残った一字、「人」。",
                "キーボードの 1 から 0 が十種の画。目の前の字を筆順どおりに書けば、崩れた字が正される。覚えた字を書き上げれば、画が技に変わる。速く書き、しかも正しく書くこと。",
                "一つの点から十種の画を覚え、「一」を書く。点は線に伸び、線は紙を囲み、紙は折られて……その先へは、あなた自身の筆で書き進むしかない。"
        ],
        "dims_h": "一巻",
        "dims_intro": "章ごとに次元が一つ増え、ルールも変わる。どの章の結末も、次の章への道を敷いている。",
        "dims": [
                ["序章", "零次元 · 点", "点が一つあるだけ。十種の画は、すべてこの一点から落ちる。「一」を書けば、点が線に伸びる。"],
                ["第一章", "一次元 · 線", "敵は左右の両端から来る。目の前の字を筆順どおりに書けば、字は正される。線はやがて端と端がつながり、一枚の紙を囲む。"],
                ["第二章", "二次元 · 面", "どの画も敵に当たり、字を書き上げれば技が出る。紙の裏まで書き抜けると字はみな裏返り、紙の帯はねじれてメビウスの帯になる。左右の端は、もうない。"],
                ["第三章", "三次元 · 立体", "紙が折り目に沿って立方体に折れる。前後左右上下、遠くの敵の字を書けば、字がそこへ飛んでいく。この立方体は超立方体の胞の一つにすぎない。先天八卦に従い、胞ごとに一つの象。"],
                ["第四章", "四次元", "八つの胞が一つになり、あなたは超立方体の内側へ入る。目に見えない方向 w がもう一つ増え、別の w にいる敵は影しか見えない。"]
        ],
        "loop": "九九帰一",
        "write_h": "試し書き",
        "write_intro": "キーボードの 1 から 0（または下のキー）で一画ずつ書く。筆順どおりに書けば字になり、字にならなければ画は散ってしまう。",
        "write_try": "試してみよう：9 3 で「力」、1 3 5 で「大」、4 9 0 3 5 で「永」。",
        "write_cands": "ほかに書ける字",
        "write_none": "字にならない",
        "write_got": "書けた",
        "write_reset": "書き直す",
        "write_count": "{N} 字のうち {n} 字を書いた",
        "write_idle": "キーを押して、最初の一画を書こう。",
        "feat_h": "特徴",
        "feat_intro": "速く書き、しかも正しく書く。",
        "strokes_h": "十画、十の技",
        "strokes_intro": "画にはそれぞれ気性がある。横画はいちばん遠くまで届き、点はいちばん重く打ち、右払いは敵を押しのけ、はねのある画は敵を引き寄せる。",
        "strokes_more": "漢字の画はこの十種だけではない。我の斜めにはねる画、心の寝かせたはね、九の横から折れて曲がりはねる画、乃のつづら折りの画……分け方によって二十から三十種にもなる。ここではいちばんよく使う十種を、一つのキーに一画ずつ割り当てた。ゲームの八十九字は、どれもこの十種だけで書け、繁体字と簡体字で字形が同じで、台湾と中国大陸で筆順も同じ字だ。上級・達人の三次元と四次元では、さらに三つの画が待っている。",
        "features": [
                ["字形も筆順も一つ", "敵を防ぐために書く字は、繁体字でも簡体字でも字形が同じで、台湾と中国大陸の筆順も同じものを選んだ。筆順は台湾教育部の「常用国字標準字体筆順」に従う。両岸で筆順が異なる字が一つだけあり、それは台湾の筆順で書く（ゲーム内に注記あり）。王・玉・主の三字は日本の筆順と異なり、日本語版では序章と習字の説明でそのことを断っている。"],
                ["字を技に", "「大」を書けば墨が輪になって周りの敵を押しのけ、「火」は焼き、「口」は閉じ込め、「寸」は刺す。字ごとに使える回数があり、一字だけで最後まで戦い抜くことはできない。"],
                ["習字", "戦わなくてもいい。ホーム画面の習字モードでは八十九字が画数順に並び、米字の補助線が入ったマスに一画ずつ書いていける。"],
                ["四つの言語", "表示は繁体字中国語・簡体字中国語・英語・日本語。英語版はピンインと字義、日本語版は音読み・訓読みと字義つき。"]
        ],
        "facts": [
                "シングルプレイ・オフライン",
                "キーボード：1 から 0 で十種の画",
                "表示言語：繁体字中国語・簡体字中国語・英語・日本語",
                "難易度は四段階（物語・入門・上級・達人）",
                "乞うご期待"
        ],
        "contact_h": "お問い合わせ",
        "contact": "『力透紙背』は長風の「写意」シリーズ第二部で、まだ開発中です。ご意見・ご感想はメールでどうぞ：",
        "series": "シリーズ第一部『墨畫蒼生』",
        "video_off": "お使いのブラウザではこの動画を再生できません。",
        "bio": [
                "数学を教え、研究をしながら、インタラクティブなゲームで文字と文学を探っています。",
                "『力透紙背』は、筆順を技に、次元をステージにした作品です。点から線へ、線から面へ、面から立体へ。"
        ]
    },
}



def esc(s):
    return html.escape(s, quote=True)

def stroke_svg(code, cls=''):
    s = next(x for x in DATA['strokes'] if x['c'] == code)
    return f'<svg class="st{(" " + cls) if cls else ""}" viewBox="0 0 240 240" aria-hidden="true"><path d="{s["icon"]}"/></svg>'

def page(code, LANGS, SITE, AUTHOR, AUTHOR_URL, MAIL, HOME):
    """HOME：首頁那一份的 studio、author、copy 等共用字（從 build-site.py 的 TEXT 傳進來）。"""
    L, T = LANGS[code], TEXT[code]
    up = '../' + L['up']
    a = up + 'assets/'
    here = L['dir'] + SLUG
    title_chars = list('力透纸背' if code == 'zh-Hans' else '力透紙背')
    alts = '\n'.join(f'<link rel="alternate" hreflang="{c}" href="{SITE}{LANGS[c]["dir"]}{SLUG}">' for c in LANGS) + f'\n<link rel="alternate" hreflang="x-default" href="{SITE}{SLUG}">'
    langnav = ''.join(f'<a href="{up}{LANGS[c]["dir"]}{SLUG}" lang="{c}"{" aria-current=\"page\"" if c == code else ""}>{LANGS[c]["short"]}</a>' for c in LANGS)
    nav = ''.join(f'<a href="#{h}">{esc(n)}</a>' for h, n in zip(['trailer', 'story', 'dims', 'write', 'features', 'contact'], T['nav']))
    h2 = lambda key, text: f'<h2>{stroke_svg(H2_STROKES[key], "h2s")}<span>{esc(text)}</span></h2>'
    tracks = ''.join(f'<track kind="subtitles" srclang="{c}" label="{LANGS[c]["name"]}" src="{a}media/litou/trailer.{c}.vtt"{" default" if c == code else ""}>' for c in LANGS)
    story = ''.join(f'<p>{esc(p)}</p>' for p in T['story'])
    steps = ''.join(f'''
      <li class="lt-step" data-d="{i}">
        <p class="lt-step-k"><b>{i}</b>{esc(k)}</p>
        <h3>{esc(n)}</h3>
        <p>{esc(t)}</p>
        <video muted loop playsinline preload="none" poster="{a}media/litou/scenes/{DIM_CLIPS[i]}.jpg" data-src="{a}media/litou/scenes/{DIM_CLIPS[i]}.mp4" data-webm="{a}media/litou/scenes/{DIM_CLIPS[i]}.webm" aria-label="{esc(n)}"></video>
      </li>''' for i, (k, n, t) in enumerate(T['dims']))
    sname = {'zh-Hant': 'zh', 'zh-Hans': 'hans', 'en': 'en', 'ja': 'ja'}[code]
    short = {'en': 'short', 'ja': 'shortJa'}.get(code, sname)   # 鍵上的短名
    trait = {'zh-Hant': 'trait', 'zh-Hans': 'traitHans', 'en': 'traitEn', 'ja': 'traitJa'}[code]
    keys = ''.join(f'<button class="lt-key" type="button" data-code="{s["c"]}"><b>{s["key"]}</b>{stroke_svg(s["c"])}<span>{esc(s[short])}</span></button>' for s in DATA['strokes'])
    strokes = ''.join(f'<li><span class="lt-kc"><b>{s["key"]}</b>{stroke_svg(s["c"])}</span><div><b>{esc(s[sname])}</b>{" <small>" + esc(s["zh"]) + "</small>" if code in ("en", "ja") else ""}<p>{esc(s[trait])}</p></div></li>' for s in DATA['strokes'])
    feats = ''.join(f'<article class="lt-feat"><h3>{esc(h)}</h3><p>{esc(p)}</p></article>' for h, p in T['features'])
    facts = ''.join(f'<li>{esc(x)}</li>' for x in T['facts'])
    strings = json.dumps({k: T[k] for k in ('write_cands', 'write_none', 'write_got', 'write_count', 'write_idle')} | {'lang': code}, ensure_ascii=False)
    banner = json.dumps({c: [t, up + LANGS[c]['dir'] + SLUG] for c, t in HOME['banner'].items()}, ensure_ascii=False)
    mark_data = json.dumps({'w': 760, 'h': 514, 'turns': [0.2285, 0.5021], 'ribbon': a + 'litou/mark-ribbon.png', 'ren': a + 'litou/mark-ren.png', 'time': a + 'litou/mark-time.png'})
    return f'''<!doctype html>
<html lang="{code}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
{HEAD_JS}
<title>{esc(T['title'])}</title>
<meta name="description" content="{esc(T['desc'])}">
<meta name="author" content="{AUTHOR}">
<link rel="canonical" href="{SITE}{here}">
{alts}
<meta property="og:type" content="website">
<meta property="og:site_name" content="{esc(HOME['studio'])}">
<meta property="og:title" content="{esc(T['title'])}">
<meta property="og:description" content="{esc(T['desc'])}">
<meta property="og:image" content="{SITE}assets/media/litou/trailer.jpg">
<meta property="og:url" content="{SITE}{here}">
<meta name="twitter:card" content="summary_large_image">
<meta name="theme-color" content="#efe5cf">
<link rel="icon" href="{up}favicon.ico" sizes="any">
<link rel="icon" href="{a}img/icon.svg" type="image/svg+xml">
<link rel="apple-touch-icon" href="{a}img/icon-180.png">
<link rel="stylesheet" href="{a}fonts/fonts.css">
<link rel="stylesheet" href="{a}css/site.css">
<link rel="stylesheet" href="{a}css/litou.css">
<script defer src="{a}js/site.js"></script>
<script defer src="{a}litou/data.js"></script>
<script>window.MARK_DATA = {mark_data};</script>
<script defer src="{a}litou/mark.js"></script>
<script defer src="{a}js/litou.js"></script>
</head>
<body class="lang-{code} litou" data-banner='{esc(banner)}'>
{FXDEFS}
<header class="top">
  <a class="studio" href="{up}{L['dir']}"><img src="{a}img/icon.svg" alt="" width="34" height="34"><span>{esc(HOME['studio'])}</span></a>
  <nav class="sections" aria-label="sections">{nav}</nav>
  <nav class="langs" aria-label="language">{langnav}</nav>
</header>
<div id="lang-banner" hidden></div>

<main>
<section class="lt-hero">
  <div class="lt-hero-text">
    <p class="lt-kicker">{esc(T['kicker'])}</p>
    <div class="lt-logo-row"><h1 class="lt-logo" aria-label="{esc(''.join(title_chars))} Through the Page">{''.join(f'<span aria-hidden="true">{c}</span>' for c in title_chars)}</h1>{XIEYI_SEAL}</div>
    <p class="lt-entitle" aria-hidden="true">Through the Page</p>
    <p class="lt-tagline">{esc(T['tagline'])}</p>
    <p class="lt-motto">{esc(T['motto'])}</p>
    <div class="lt-cta"><span class="lt-seal">{esc(T['soon'])}</span><a class="lt-btn" href="#trailer">{esc(T['watch'])}</a><a class="lt-btn ghost" href="#write">{esc(T['trywrite'])}</a></div>
  </div>
  <div class="lt-mark" aria-hidden="true"></div>
</section>

<section id="trailer" class="lt-sec lt-trailer">
  {h2('trailer', T['trailer_h'])}
  <div class="lt-frame">
    <video controls preload="metadata" playsinline poster="{a}media/litou/trailer.jpg">
      <source src="{a}media/litou/trailer.mp4" type="video/mp4">
      <source src="{a}media/litou/trailer.webm" type="video/webm">{tracks}
      {esc(T['video_off'])}
    </video>
  </div>
  <p class="lt-note">{esc(T['trailer_note'])}</p>
</section>

<section id="story" class="lt-sec lt-story">
  {h2('story', T['story_h'])}
  <blockquote class="lt-quote"><p>{esc(T['quote'])}</p><cite>{esc(T['cite'])}</cite></blockquote>
  <div class="lt-story-text">{story}</div>
</section>

<section id="dims" class="lt-dims">
  <div class="lt-dims-in">
    {h2('dims', T['dims_h'])}
    <p class="lt-lead">{esc(T['dims_intro'])}</p>
    <div class="lt-dims-body">
      <div class="lt-hc" aria-hidden="true"><canvas id="lt-hypercube"></canvas><span class="lt-hc-n">0</span></div>
      <ol class="lt-steps">{steps}
      </ol>
    </div>
    <p class="lt-loop">{esc(T['loop'])}</p>
  </div>
</section>

<section id="write" class="lt-sec lt-write" data-t='{esc(strings)}'>
  {h2('write', T['write_h'])}
  <p class="lt-lead">{esc(T['write_intro'])}</p>
  <div class="lt-pad">
    <svg class="lt-grid" viewBox="0 0 1000 1000" aria-hidden="true"><rect class="g" x="8" y="8" width="984" height="984"/><path class="g d" d="M8 8L992 992M992 8L8 992M500 8V992M8 500H992"/><g id="lt-ink"></g></svg>
    <div class="lt-info" aria-live="polite">
      <div class="lt-big" id="lt-big"></div>
      <p class="lt-read" id="lt-read">{esc(T['write_idle'])}</p>
      <div class="lt-seq" id="lt-seq"></div>
      <p class="lt-cands" id="lt-cands"></p>
      <p class="lt-count" id="lt-count"></p>
      <button class="lt-btn ghost small" type="button" id="lt-reset">{esc(T['write_reset'])}</button>
    </div>
  </div>
  <div class="lt-keys" id="lt-keys">{keys}</div>
  <p class="lt-try">{esc(T['write_try'])}</p>
</section>

<section id="features" class="lt-sec lt-features">
  {h2('features', T['feat_h'])}
  <p class="lt-lead">{esc(T['feat_intro'])}</p>
  <h3 class="lt-sub">{esc(T['strokes_h'])}</h3>
  <p class="lt-sub-intro">{esc(T['strokes_intro'])}</p>
  <ol class="lt-strokes">{strokes}</ol>
  <p class="lt-sub-intro lt-more">{esc(T['strokes_more'])}</p>
  <div class="lt-feats">{feats}</div>
  <ul class="lt-facts">{facts}</ul>
</section>

<section id="contact" class="lt-sec lt-contact">
  {h2('contact', T['contact_h'])}
  <p>{esc(T['contact'])} <a href="mailto:{MAIL}">{MAIL}</a></p>
  <p class="lt-series"><a href="{up}{L['dir']}mohuacangsheng/">{esc(T['series'])} →</a></p>
</section>
</main>

<footer>
  <div class="author">
    <p class="author-name"><span>{esc(HOME['author'][0])}</span> {AUTHOR}</p>
    <p class="author-bio">{' '.join(f'<span>{esc(x)}</span>' for x in T['bio'])}</p>
    <p class="author-meta">{esc(HOME['author'][3])} <a href="{AUTHOR_URL}" rel="me">stephenjia.com</a> · {esc(HOME['author'][1])} · {esc(HOME['author'][2])} <a href="mailto:{MAIL}">{MAIL}</a></p>
  </div>
  <p class="copy">{esc(HOME['copy'])}</p>
</footer>
</body>
</html>
'''

def build(LANGS, TEXTS, SITE, AUTHOR, AUTHOR_URL, MAIL):
    """寫出四語各一頁；回傳要放進 sitemap 的網址（相對於網站根目錄）。"""
    for code, L in LANGS.items():
        out = ROOT / L['dir'] / SLUG / 'index.html'
        out.parent.mkdir(parents=True, exist_ok=True)
        out.write_text(page(code, LANGS, SITE, AUTHOR, AUTHOR_URL, MAIL, TEXTS[code]), encoding='utf-8')
        print(out.relative_to(ROOT), out.stat().st_size)
    return [L['dir'] + SLUG for L in LANGS.values()]
