"""stejoy.com 的首頁：長風的「寫意」系列，選一部遊戲（使用者要的：在主頁加一個選不同遊戲的介面，先放兩部）。
五語：index.html、zh-hans/index.html、en/index.html、ja/index.html（日文 2026-11-06 加）、vi/index.html（越南文 2026-11-12 加）。由 tools/site/build-site.py 一起產生，文字改這個檔案的 TEXT。
每一部是一張紙：《墨畫蒼生》淺紙、會寫出來的「水」字標、實機片段；《力透紙背》墨黑、照「力」的筆順寫出來的標誌（紙色）、
實機片段反過來看（紙背）。上面一排「種類」可以篩；← → 換一部、Enter 進入。遊戲多了就多幾張紙、多幾個種類。
《墨畫蒼生》原本的介紹頁搬到 mohuacangsheng/，《力透紙背》在 litouzhibei/。
"""
import json, html, re
import sys, os; sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from head import HEAD_JS   # iPhone Duo 用電腦版排、頁面大小（tools/site/head.py）
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
GAMES = [   # 首頁上的順序；kind 是「種類」那一排的鍵
    {'id': 'inkwild', 'slug': 'mohuacangsheng/', 'kind': 'survival', 'clip': 'scenes/gather'},
    {'id': 'litou', 'slug': 'litouzhibei/', 'kind': 'battle', 'clip': 'litou/scenes/mobius'},
]
KINDS = ['all', 'survival', 'battle']

# 標題「落筆成局」底下放什麼：'stroke' 一筆「一」、'deck' 一句話。原本什麼都不放（李白那兩句跟「關於長風」重複，刪了）；
# 2026-11-06 使用者：有人測試網頁，不知道這是兩個遊戲——標題底下寫一句「用漢字組成的各式各樣的遊戲」，並指明下面每一張紙是一部。
# 「寫意」每一部拿漢字當什麼材料，照舊寫在「關於長風」第二段（about2）。
SUB = {'deck'}

# 標題「落筆成局」底下落的那一筆：楷書的長橫（一），起筆斜切、中段略細、往右微微上揚；後半段乾筆飛白（#hm-dry 把筆身切成橫絲，
# 前半段再疊一層實墨，遮罩是漸層加橫絲雜訊取門檻）。外形是手畫的 Bézier（viewBox 0 0 1000 120），進場時從左到右寫出來（home.css 的 hm-fall）。
HENG_D = ('M 26 50 C 34 44, 52 42, 70 46 C 300 44, 640 34, 896 30 C 918 27, 944 28, 960 38 C 976 48, 974 64, 958 70 '
          'C 936 76, 908 70, 880 66 C 640 62, 320 70, 112 86 C 92 90, 76 96, 62 94 C 50 90, 42 76, 26 50 Z')
HENG = ('<svg class="hm-stroke" viewBox="0 0 1000 120" aria-hidden="true" focusable="false"><defs>'
        '<filter id="hm-dry" x="-2%" y="-30%" width="104%" height="160%" color-interpolation-filters="sRGB">'
        '<feTurbulence type="fractalNoise" baseFrequency="0.004 0.16" numOctaves="2" seed="9" result="s"/>'
        '<feColorMatrix in="s" type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  -10 0 0 0 5.8" result="m"/>'
        '<feComposite in="SourceGraphic" in2="m" operator="in" result="c"/>'
        '<feTurbulence type="fractalNoise" baseFrequency="0.7" numOctaves="2" seed="4" result="n"/>'
        '<feDisplacementMap in="c" in2="n" scale="4" xChannelSelector="R" yChannelSelector="G"/></filter>'
        '<filter id="hm-thr" x="0" y="0" width="1" height="1" color-interpolation-filters="sRGB">'   # 實墨的遮罩：漸層加橫絲雜訊再取門檻，實墨一絲一絲斷成飛白，不會出現灰的一段
        '<feTurbulence type="fractalNoise" baseFrequency="0.003 0.2" numOctaves="2" seed="21" result="n"/>'
        '<feColorMatrix in="n" type="matrix" values="1 0 0 0 0  1 0 0 0 0  1 0 0 0 0  0 0 0 0 1" result="g"/>'
        '<feComposite in="SourceGraphic" in2="g" operator="arithmetic" k1="0" k2="1" k3="2.2" k4="-1.1" result="t"/>'
        '<feComponentTransfer in="t"><feFuncR type="linear" slope="14" intercept="-6.5"/><feFuncG type="linear" slope="14" intercept="-6.5"/>'
        '<feFuncB type="linear" slope="14" intercept="-6.5"/><feFuncA type="linear" slope="0" intercept="1"/></feComponentTransfer></filter>'
        '<linearGradient id="hm-sg" x1="0" x2="1"><stop offset="0" stop-color="#fff"/><stop offset=".42" stop-color="#fff"/><stop offset=".8" stop-color="#000"/></linearGradient>'
        '<mask id="hm-sm" maskUnits="userSpaceOnUse" x="0" y="0" width="1000" height="120"><rect width="1000" height="120" fill="url(#hm-sg)" filter="url(#hm-thr)"/></mask></defs>'
        f'<g fill="currentColor" filter="url(#hm-rough)"><path d="{HENG_D}" filter="url(#hm-dry)"/><path d="{HENG_D}" mask="url(#hm-sm)"/></g></svg>')

TEXT = {
    'zh-Hant': {
        'title': '長風｜寫意系列',
        'desc': '長風的「寫意」系列：拿漢字當材料的遊戲。《墨畫蒼生》即將登上 Steam，《力透紙背》敬請期待。',
        'nav': ['遊戲', '關於', '聯絡'],
        'kicker': '「寫意」系列',
        'headline': '落筆成局',   # 使用者嫌「用漢字寫成的遊戲」平；局＝棋局、戰局、布局，一落筆就開局
        'deck': '用漢字組成的各式各樣的遊戲。下面每一張紙，都是一部。',
        'poem': '長風破浪會有時，直掛雲帆濟滄海。', 'cite': '李白〈行路難〉',   # 只在「關於長風」引一次
        'choose': '選一部', 'hint': '← → 換一部　Enter 進入',
        'kinds': {'all': '全部', 'survival': '生存 · 建造', 'battle': '筆順 · 戰鬥'},
        'games': {
            'inkwild': {'name': '墨畫蒼生', 'en': 'InkWild', 'genre': '生存 · 建造', 'tag': '寫木為舟 · 寫水成淵',
                        'pitch': '一張紙落在海上，紙上的字活了。取木、砌磚、點燈，撐過一夜又一夜；膽氣夠了，就造船渡海。', 'status': '即將登上 Steam', 'go': '進入'},
            'litou': {'name': '力透紙背', 'en': 'Through the Page', 'genre': '筆順 · 戰鬥', 'tag': '由點及線 · 由線及面 · 由面及體',
                      'pitch': '鍵盤 1 到 0 是十種筆畫，照筆順寫對，錯字就正了。從一個點寫起，一路寫進超正方體的裡面。', 'status': '敬請期待', 'go': '進入'},
        },
        'about_h': '關於長風',
        'about': ['長風是做「寫意」系列的小工作室，名字取自李白〈行路難〉。'],
        'about2': '「寫意」的每一部都拿漢字當材料：在《墨畫蒼生》裡，字是一塊塊可以拆、可以砌的地；在《力透紙背》裡，筆畫是招式，字寫對了就是一擊。',
        'contact_h': '聯絡', 'contact': '想說什麼，寫信給我們：',
    },
    'zh-Hans': {
        'title': '长风｜写意系列',
        'desc': '长风的“写意”系列：拿汉字当材料的游戏。《墨画苍生》即将登陆 Steam，《力透纸背》敬请期待。',
        'nav': ['游戏', '关于', '联系'],
        'kicker': '“写意”系列',
        'headline': '落笔成局',
        'deck': '用汉字组成的各式各样的游戏。下面每一张纸，都是一部。',
        'poem': '长风破浪会有时，直挂云帆济沧海。', 'cite': '李白〈行路难〉',
        'choose': '选一部', 'hint': '← → 换一部　Enter 进入',
        'kinds': {'all': '全部', 'survival': '生存 · 建造', 'battle': '笔顺 · 战斗'},
        'games': {
            'inkwild': {'name': '墨画苍生', 'en': 'InkWild', 'genre': '生存 · 建造', 'tag': '写木为舟 · 写水成渊',
                        'pitch': '一张纸落在海上，纸上的字活了。取木、砌砖、点灯，撑过一夜又一夜；胆气够了，就造船渡海。', 'status': '即将登陆 Steam', 'go': '进入'},
            'litou': {'name': '力透纸背', 'en': 'Through the Page', 'genre': '笔顺 · 战斗', 'tag': '由点及线 · 由线及面 · 由面及体',
                      'pitch': '键盘 1 到 0 是十种笔画，照笔顺写对，错字就正了。从一个点写起，一路写进超正方体的里面。', 'status': '敬请期待', 'go': '进入'},
        },
        'about_h': '关于长风',
        'about': ['长风是做“写意”系列的小工作室，名字取自李白〈行路难〉。'],
        'about2': '“写意”的每一部都拿汉字当材料：在《墨画苍生》里，字是一块块可以拆、可以砌的地；在《力透纸背》里，笔画是招式，字写对了就是一击。',
        'contact_h': '联系', 'contact': '想说什么，写信给我们：',
    },
    'en': {
        'title': 'SteJoy | The Xieyi series',
        'desc': 'SteJoy’s Xieyi series: games that take Chinese characters as their material. InkWild is coming to Steam; Through the Page is coming soon.',
        'nav': ['Games', 'About', 'Contact'],
        'kicker': 'The 寫意 (Xieyi) series',
        'headline': 'Set brush to paper, and the game begins',
        'deck': 'Games of every kind, made from Chinese characters (Hanzi/Kanji). Each sheet below is a separate game.',   # 2026-11-06 使用者：英文版加（Hanzi/Kanji）
        'poem': '“A time will come to ride the long wind and cleave the waves; then I’ll hoist my cloud-white sail and cross the sea.”', 'cite': 'Li Bai, The Hard Road',
        'choose': 'Pick a game', 'hint': '← → to switch · Enter to open',
        'kinds': {'all': 'All', 'survival': 'Survival · Building', 'battle': 'Stroke order · Battle'},
        'games': {
            'inkwild': {'name': '墨畫蒼生', 'en': 'InkWild', 'genre': 'Survival · Building', 'tag': 'Write wood into a boat · write water into the deep',
                        'pitch': 'A sheet of paper falls on the sea, and the characters on it come alive. Gather wood, lay bricks, light lamps and last night after night; when your courage is enough, build a boat and cross the sea.', 'status': 'Coming to Steam', 'go': 'Open'},
            'litou': {'name': '力透紙背', 'en': 'Through the Page', 'genre': 'Stroke order · Battle', 'tag': 'From point to line · line to plane · plane to solid',
                      'pitch': 'Keys 1 to 0 are the ten brush strokes; write a character in the right order and the broken one in front of you is set right. Start from a single point and write your way into a tesseract.', 'status': 'Coming soon', 'go': 'Open'},
        },
        'about_h': 'About SteJoy',
        'about': ['SteJoy (長風, “the long wind”) is a small studio making the 寫意 (Xieyi) series. The Chinese name comes from Li Bai’s poem The Hard Road.'],
        'about2': 'Each Xieyi game takes Chinese characters as its material. In InkWild, characters are ground you can take apart and build with; in Through the Page, strokes are moves, and a character written right is a blow.',
        'contact_h': 'Contact', 'contact': 'Write to us:',
    },
    'ja': {
        'title': '長風｜「写意」シリーズ',
        'desc': '長風の「写意」シリーズ：漢字を素材にしたゲーム。『墨畫蒼生』は近日 Steam で配信、『力透紙背』は開発中です。',
        'nav': ['ゲーム', '長風について', 'お問い合わせ'],
        'kicker': '「写意」シリーズ',   # 系列名照《力透紙背》日文版的寫法（写意，新字體）
        'headline': '筆を下ろせば、一局が始まる',   # 落筆成局；《力透紙背》日文版的「落筆」鈕就是「筆を下ろす」
        'deck': '漢字で組み上げた、さまざまなゲーム。下に並ぶ紙の一枚一枚が、それぞれ一本のゲームです。',
        'poem': '長風浪を破る　会ず時有り、直ちに雲帆を挂けて　滄海を済らん。', 'cite': '李白「行路難」',
        'choose': 'ゲームを選ぶ', 'hint': '← → で切り替え　Enter で開く',
        'kinds': {'all': 'すべて', 'survival': 'サバイバル · 建築', 'battle': '筆順 · バトル'},
        'games': {
            'inkwild': {'name': '墨畫蒼生', 'en': 'InkWild', 'genre': 'サバイバル · 建築', 'tag': '木を書けば舟となり · 水を書けば淵となる',
                        'pitch': '一枚の紙が海に落ち、紙の上の字が生きはじめた。木を取り、煉瓦を積み、灯をともして、幾夜も生き延びる。胆力が十分についたら、舟を造って海を渡る。', 'status': '近日 Steam で配信', 'go': '開く'},
            'litou': {'name': '力透紙背', 'en': 'Through the Page', 'genre': '筆順 · バトル', 'tag': '点から線へ · 線から面へ · 面から立体へ',
                      'pitch': 'キーボードの 1 から 0 が十種の画。筆順どおりに書けば、崩れた字が正される。一つの点から書きはじめ、超立方体の内側まで書き進む。', 'status': '乞うご期待', 'go': '開く'},
        },
        'about_h': '長風について',
        'about': ['長風（ちょうふう）は「写意」シリーズを作る小さなスタジオです。名前は李白の「行路難」から取りました。英語名は SteJoy です。'],
        'about2': '「写意」の作品は、どれも漢字を素材にしています。『墨畫蒼生』では、字は崩しては積み直せる一マス一マスの大地。『力透紙背』では、画が技になり、正しく書けた字が一撃になります。',
        'contact_h': 'お問い合わせ', 'contact': 'ご意見・ご感想はメールでどうぞ：',
    },
    'vi': {   # 2026-11-12 使用者：整個網站加越南文；遊戲名寫漢越音（Mặc Họa Thương Sinh、Lực Thấu Chỉ Bối），系列名照《力透紙背》越南文頁寫 «Tả ý»
        'title': 'SteJoy | Loạt «Tả ý»',
        'desc': 'Loạt «Tả ý» (寫意) của SteJoy: những trò chơi lấy chữ Hán làm chất liệu. InkWild (Mặc Họa Thương Sinh) sắp ra mắt trên Steam; Lực Thấu Chỉ Bối – hãy đón chờ.',
        'nav': ['Trò chơi', 'Giới thiệu', 'Liên hệ'],
        'kicker': 'Loạt «Tả ý» (寫意)',
        'headline': 'Hạ bút, cuộc chơi bắt đầu',   # 落筆成局：局是一盤棋、一場仗，一落筆就開局
        'deck': 'Đủ loại trò chơi dựng nên từ chữ Hán. Mỗi trang giấy bên dưới là một trò chơi riêng.',
        'poem': '«Trường phong phá lãng hội hữu thì, trực quải vân phàm tế thương hải.» Rồi sẽ có ngày cưỡi gió lớn rẽ sóng, giương thẳng cánh buồm mây vượt biển xanh.',   # 先漢越音、再譯意（越南讀唐詩的習慣）
        'cite': 'Lý Bạch, «Hành lộ nan»',
        'choose': 'Chọn trò chơi', 'hint': '← → để chuyển · Enter để mở',
        'kinds': {'all': 'Tất cả', 'survival': 'Sinh tồn · Xây dựng', 'battle': 'Thứ tự nét · Chiến đấu'},
        'games': {
            'inkwild': {'name': '墨畫蒼生', 'en': 'InkWild', 'genre': 'Sinh tồn · Xây dựng', 'tag': 'Viết gỗ thành thuyền · Viết nước thành vực',
                        'pitch': 'Một trang giấy rơi xuống biển, và những chữ trên đó sống dậy. Lấy gỗ, xây gạch, thắp đèn, gắng qua hết đêm này đến đêm khác; khi đã đủ can đảm, hãy đóng thuyền vượt biển.', 'status': 'Sắp ra mắt trên Steam', 'go': 'Vào'},
            'litou': {'name': '力透紙背', 'en': 'Lực Thấu Chỉ Bối', 'genre': 'Thứ tự nét · Chiến đấu', 'tag': 'Từ điểm thành đường · từ đường thành mặt · từ mặt thành khối',
                      'pitch': 'Phím 1 đến 0 là mười nét bút; viết đúng thứ tự nét, chữ sai trước mặt liền được sửa đúng. Bắt đầu từ một điểm, viết mãi cho tới bên trong siêu lập phương.', 'status': 'Hãy đón chờ', 'go': 'Vào'},
        },
        'about_h': 'Về SteJoy',
        'about': ['SteJoy (長風 Trường Phong – «ngọn gió dài») là một studio nhỏ làm loạt trò chơi «Tả ý». Tên chữ Hán lấy từ bài «Hành lộ nan» của Lý Bạch.'],
        'about2': 'Mỗi trò chơi trong loạt «Tả ý» đều lấy chữ Hán làm chất liệu. Trong InkWild, chữ là từng ô đất có thể tháo ra rồi xây lại; trong Lực Thấu Chỉ Bối, nét bút là chiêu thức, viết đúng một chữ là tung ra một đòn.',
        'contact_h': 'Liên hệ', 'contact': 'Có điều gì muốn nói, hãy viết thư cho chúng tôi:',
    },
}



def esc(s):
    return html.escape(s, quote=True)

def page(code, LANGS, SITE, AUTHOR, AUTHOR_URL, MAIL, HOME, LOGO):
    L, T, up = LANGS[code], TEXT[code], LANGS[code]['up']
    a = up + 'assets/'
    alts = '\n'.join(f'<link rel="alternate" hreflang="{c}" href="{SITE}{LANGS[c]["dir"]}">' for c in LANGS) + f'\n<link rel="alternate" hreflang="x-default" href="{SITE}">'
    langnav = ''.join(f'<a href="{up}{LANGS[c]["dir"]}" lang="{c}"{" aria-current=\"page\"" if c == code else ""}>{LANGS[c]["short"]}</a>' for c in LANGS)
    nav = ''.join(f'<a href="#{h}">{esc(n)}</a>' for h, n in zip(['games', 'about', 'contact'], T['nav']))
    n_of = lambda k: len(GAMES) if k == 'all' else sum(g['kind'] == k for g in GAMES)
    kinds = ''.join(f'<button type="button" class="hm-kind" data-kind="{k}" aria-pressed="{"true" if k == "all" else "false"}">{esc(T["kinds"][k])}<span>{n_of(k)}</span></button>' for k in KINDS)
    title_chars = '力透纸背' if code == 'zh-Hans' else '力透紙背'
    cards = []
    for i, g in enumerate(GAMES):
        G = T['games'][g['id']]
        emblem = (f'<div class="hm-logo">{LOGO}</div>' if g['id'] == 'inkwild'
                  else '<div class="hm-mark" aria-hidden="true"></div>')
        name = (f'<h3 class="hm-name sr-only">{esc(G["name"])} {esc(G["en"])}</h3>' if g['id'] == 'inkwild'
                else f'<h3 class="hm-name"><span class="hm-zh">{"".join(f"<i>{c}</i>" for c in title_chars)}</span><span class="hm-en">{esc(G["en"])}</span></h3>')
        cards.append(f'''
    <a class="hm-card {g['id']}" href="{g['slug']}" data-kind="{g['kind']}" data-i="{i}">
      <div class="hm-stage" aria-hidden="true"><video muted loop playsinline preload="none" poster="{a}media/{g['clip']}.jpg" data-src="{a}media/{g['clip']}.mp4" data-webm="{a}media/{g['clip']}.webm"></video></div>
      {emblem}
      <div class="hm-body">
        <p class="hm-genre">{esc(G['genre'])}</p>
        {name}
        <p class="hm-tag">{' · '.join(f'<span>{esc(x)}</span>' for x in G['tag'].split(' · '))}</p>
        <p class="hm-pitch">{esc(G['pitch'])}</p>
        <p class="hm-meta"><span class="hm-status">{esc(G['status'])}</span><span class="hm-go">{esc(G['go'])} <b aria-hidden="true">→</b></span></p>
      </div>
    </a>''')
    about = ''.join(f'<p>{esc(p)}</p>' for p in T['about'] + [T['about2']])   # 標題下那句只說「有好幾部」，每一部拿漢字當什麼材料照舊在這裡說
    deck = ''.join(f'<span>{esc(x)}</span>' for x in re.findall(r'[^：，、。]+[：，、。]?', T['deck']))   # 一段一段換行（日文的讀點「、」也斷得開）
    sub = (f'  {HENG}\n' if 'stroke' in SUB else '') + (f'  <p class="hm-deck">{deck}</p>\n' if 'deck' in SUB else '')
    banner = json.dumps({c: [t, up + LANGS[c]['dir']] for c, t in HOME['banner'].items()}, ensure_ascii=False)
    mark = json.dumps({'w': 760, 'h': 514, 'turns': [0.2285, 0.5021], 'ink': [239, 229, 207], 'ribbon': a + 'litou/mark-ribbon.png', 'ren': a + 'litou/mark-ren.png', 'time': a + 'litou/mark-time.png'})
    return f'''<!doctype html>
<html lang="{code}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
{HEAD_JS}
<title>{esc(T['title'])}</title>
<meta name="description" content="{esc(T['desc'])}">
<meta name="author" content="{AUTHOR}">
<link rel="canonical" href="{SITE}{L['dir']}">
{alts}
<meta property="og:type" content="website">
<meta property="og:site_name" content="{esc(HOME['studio'])}">
<meta property="og:title" content="{esc(T['title'])}">
<meta property="og:description" content="{esc(T['desc'])}">
<meta property="og:image" content="{SITE}assets/img/og.jpg">
<meta property="og:url" content="{SITE}{L['dir']}">
<meta name="twitter:card" content="summary_large_image">
<meta name="theme-color" content="#f4eee2">
<link rel="icon" href="{up}favicon.ico" sizes="any">
<link rel="icon" href="{a}img/icon.svg" type="image/svg+xml">
<link rel="apple-touch-icon" href="{a}img/icon-180.png">
<link rel="stylesheet" href="{a}fonts/fonts.css">
<link rel="stylesheet" href="{a}css/site.css">
<link rel="stylesheet" href="{a}css/home.css">
<script defer src="{a}js/site.js"></script>
<script>window.MARK_DATA = {mark};</script>
<script defer src="{a}litou/mark.js"></script>
<script defer src="{a}js/home.js"></script>
</head>
<body class="lang-{code} home" data-banner='{esc(banner)}'>
<svg width="0" height="0" style="position:absolute" aria-hidden="true" focusable="false"><filter id="hm-rough" x="-8%" y="-8%" width="116%" height="116%"><feTurbulence type="fractalNoise" baseFrequency="0.62" numOctaves="2" seed="3" result="n"/><feDisplacementMap in="SourceGraphic" in2="n" scale="2" xChannelSelector="R" yChannelSelector="G"/></filter></svg>
<header class="top">
  <a class="studio" href="{up}{L['dir']}"><img src="{a}img/icon.svg" alt="" width="34" height="34"><span>{esc(HOME['studio'])}</span></a>
  <nav class="sections" aria-label="sections">{nav}</nav>
  <nav class="langs" aria-label="language">{langnav}</nav>
</header>
<div id="lang-banner" hidden></div>

<main>
<section class="hm-hero">
  <p class="hm-kicker">{esc(T['kicker'])}</p>
  <h1 class="hm-title">{esc(T['headline'])}</h1>
{sub}</section>

<section id="games" class="hm-games" aria-label="{esc(T['choose'])}">
  <div class="hm-bar">
    <h2>{esc(T['choose'])}</h2>
    <div class="hm-kinds" role="group" aria-label="{esc(T['choose'])}">{kinds}</div>
    <p class="hm-hint">{esc(T['hint'])}</p>
  </div>
  <div class="hm-row">{''.join(cards)}
  </div>
</section>

<section id="about" class="hm-about">
  <h2>{esc(T['about_h'])}</h2>
  <blockquote class="hm-quote"><p>{esc(T['poem'])}</p><cite>{esc(T['cite'])}</cite></blockquote>
  {about}
</section>

<section id="contact" class="contact">
  <h2>{esc(T['contact_h'])}</h2>
  <p>{esc(T['contact'])} <a href="mailto:{MAIL}">{MAIL}</a></p>
</section>
</main>

<footer>
  <div class="author">
    <p class="author-name"><span>{esc(HOME['author'][0])}</span> {AUTHOR}</p>
    <p class="author-bio"><span>{esc(HOME['bio'][0])}</span></p>
    <p class="author-meta">{esc(HOME['author'][3])} <a href="{AUTHOR_URL}" rel="me">stephenjia.com</a> · {esc(HOME['author'][1])} · {esc(HOME['author'][2])} <a href="mailto:{MAIL}">{MAIL}</a></p>
  </div>
  <p class="copy">{esc(HOME['copy'])}</p>
</footer>
</body>
</html>
'''

def build(LANGS, TEXTS, SITE, AUTHOR, AUTHOR_URL, MAIL, LOGO):
    for code, L in LANGS.items():
        out = ROOT / L['dir'] / 'index.html'
        out.parent.mkdir(parents=True, exist_ok=True)
        out.write_text(page(code, LANGS, SITE, AUTHOR, AUTHOR_URL, MAIL, TEXTS[code], LOGO), encoding='utf-8')
        print(out.relative_to(ROOT), out.stat().st_size)
