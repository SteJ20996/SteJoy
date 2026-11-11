"""stejoy.com 的四語靜態頁：一份範本、四份文字，產出 index.html（繁中）、zh-hans/、en/、ja/（日文，2026-11-06 加）底下的各頁。
用法（在庫的根目錄）：python3 tools/site/build-site.py
字標與寫字動畫從遊戲正式庫抄來（tools/site/logo.html，見 README）；文字改這個檔案的 TEXT。
"""
import json, os, html, sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).resolve().parent))
import litou   # 《力透紙背》的介紹頁（tools/site/litou.py）
from head import HEAD_JS   # iPhone Duo 用電腦版排、頁面大小（tools/site/head.py）
import home    # 首頁：長風的「寫意」系列，選一部遊戲（tools/site/home.py）
INK = 'mohuacangsheng/'   # 《墨畫蒼生》的介紹頁搬到這裡（首頁改成選遊戲；四語各一份：mohuacangsheng/、zh-hans/、en/、ja/ 底下的 mohuacangsheng/）

ROOT = Path(__file__).resolve().parents[2]
SITE = 'https://stejoy.com/'
STEAM_URL = None   # 有了商店頁就填網址，頁上的「即將登上 Steam」會換成「加入願望清單」
MAIL = 'hello@stejoy.com'
AUTHOR = 'Stephen Jia'   # 作者（使用者定：名字用 Stephen Jia；三種語言都寫這個名字，寫在頁尾）
AUTHOR_URL = 'https://stephenjia.com/'   # 作者的個人主頁（使用者給的）
LOGO = (ROOT / 'tools/site/logo.html').read_text(encoding='utf-8')

LANGS = {
    'zh-Hant': {'dir': '', 'up': '', 'name': '繁體中文', 'short': '繁'},
    'zh-Hans': {'dir': 'zh-hans/', 'up': '../', 'name': '简体中文', 'short': '简'},
    'en': {'dir': 'en/', 'up': '../', 'name': 'English', 'short': 'EN'},
    'ja': {'dir': 'ja/', 'up': '../', 'name': '日本語', 'short': '日本語'},   # 2026-11-06 使用者：整個網頁增加日文版
}

SCENES = ['gather', 'build', 'snow', 'night', 'gaze', 'zi']   # 造字（遊戲 v0.9.69，2026-11-09 加）排最後、佔整排，底下一排拆字
CHAI = [('人', '木', '休'), ('月', '囧', '明'), ('子', '宀', '字')]   # 拆字：照《說文》（休「从人依木」、明「从月从囧」囧是窗、字「从子在宀下」）
FEATURES = ['thunder', 'crops', 'sail', 'gong']

TEXT = {
    'zh-Hant': {
        'studio': '長風',   # 工作室的中文名（使用者定）；中文兩頁都寫它，英文頁照舊 SteJoy
        'title': '墨畫蒼生 InkWild｜長風',
        'desc': '一張紙落在海上，紙上的字活了。你是其中一個「人」字：取木、砌磚、點燈，撐過入夜後穿磚而來的魄；照節氣種五穀、垂釣、觀星。膽氣夠了就造船渡海，去找撞歪天地的共工。',
        'nav': ['預告', '故事', '試玩場景', '特色', '聯絡'],
        'kicker': '字裡行間 · 一紙之島',
        'tagline': '寫木為舟 · 寫水成淵',
        'soon': '即將登上 Steam', 'wish': '加入 Steam 願望清單', 'watch': '觀看預告',
        'trailer_h': '預告', 'trailer_note': '遊戲實機畫面。配樂是暫用的合成樂。',
        'story_h': '故事',
        'story': [
            '鳥棲於山，是為島。一張紙落在海上，紙上的字活了。你是其中的一個「人」，赤手空拳。紙上每一格都是一個字：木是樹，山是山，水是水，虎就是虎。取下來的字是材料，寫下去的字是你的家。島上有一座廢村，碑上寫著：村裡沒有人，人都在字典裡。',
            '這張紙在歪。共工「怒而觸不周之山」，天柱折，地維絕；紙角翹起來，跑出了修蛇、封豨、大風。青龍、白虎、朱雀、玄武，是壓住四角的鎮紙。撐過一夜，再撐過一夜；膽氣夠了，就造一艘船離開。',
        ],
        'scenes_h': '試玩裡的場景',
        'scenes_intro': '試玩版在本島上，玩到魄來的頭一夜過完（看難度：逍遙第十八、初履第十五、人間第十二、宗師第九夜），下面這幾段都在試玩裡。',
        'chai': (['从人依木', '从月从囧', '从子在宀下'], '《說文解字》的說法；囧是窗。'),
        'scenes': {
            'gather': ('取木', '林子裡的每一格都是字，取下來就是材料。'),
            'build': ('砌屋', '一塊磚一塊磚砌起來，再擺床、灶、櫃、燈。'),
            'snow': ('雪', '開春頭幾天常下雪；燈點在屋外也點在屋裡。'),
            'night': ('魄來的夜', '天一黑，燈照著的磚慢慢透出暗光；怕光的魄從暗處飄來，地上的燈燒得滅它們。'),
            'gaze': ('觀星', '晴夜抬頭，認星官，也認星座；歲星、熒惑、太白在星間慢慢走。'),
            'zi': ('造字', '人靠著木就是「休」，月照進窗就是「明」。從村井撈起偏旁「子」，擺進屋裡——子在宀下，第一個字民「字」走出字典。'),
        },
        'feat_h': '完整版',
        'feat_intro': '試玩之後，紙還很大。',
        'features': {
            'thunder': ('照著節氣過日子', '一年三百六十日，照二十四節氣、七十二候走。雨、雪、雷雨、狂風、冰雹；大漠與火山只打乾雷。'),
            'crops': ('五穀一筆一筆長', '種稻、黍、稷、麥、菽，防雀、防鼠、防蝗；用釜甑做五穀的菜，配著吃有增益。'),
            'sail': ('造船渡海', '膽氣夠了就造孤帆、方舟出海。紙上有大陸、群島、大漠、火山、雪原，海上有蜃。'),
            'gong': ('上不周山', '先斃修蛇、封豨、大風，向北方玄武取經，再上不周山，去找撞歪天地的共工。'),
        },
        'facts': ['單人、離線', '鍵盤與滑鼠', '介面：繁體中文（預設）、簡體中文', '四種難度：逍遙、初履、人間、宗師'],
        'contact_h': '聯絡',
        'contact': '《墨畫蒼生》是長風「寫意」系列的第一部。想說什麼，寫信給我們：',
        'next': ('「寫意」系列第二部《力透紙背》', '敬請期待'),   # 首頁「聯絡」底下連到第二部的介紹頁（原本的第二部《人間塵世》暫停開發，使用者改定）
        'banner': {'zh-Hans': '有简体中文页面', 'en': 'This page is also in English', 'ja': '日本語のページもあります'},
        'video_off': '你的瀏覽器放不了這段影片。',
        'author': ('作者', '長風工作室', '聯絡', '個人主頁'),
        'bio': ('教數學、做研究，也用互動遊戲探索文字與文學。', '《墨畫蒼生》把《山海經》的山海與二十四節氣，寫成一座用漢字搭起來的島。'),
        'copy': '© 2026 長風。字型：霞鶩文楷、思源宋體（SIL Open Font License 1.1）。',
    },
    'zh-Hans': {
        'studio': '长风',
        'title': '墨画苍生 InkWild｜长风',
        'desc': '一张纸落在海上，纸上的字活了。你是其中一个“人”字：取木、砌砖、点灯，撑过入夜后穿砖而来的魄；照节气种五谷、垂钓、观星。胆气够了就造船渡海，去找撞歪天地的共工。',
        'nav': ['预告', '故事', '试玩场景', '特色', '联系'],
        'kicker': '字里行间 · 一纸之岛',
        'tagline': '写木为舟 · 写水成渊',
        'soon': '即将登陆 Steam', 'wish': '加入 Steam 愿望单', 'watch': '观看预告',
        'trailer_h': '预告', 'trailer_note': '游戏实机画面。配乐是暂用的合成乐。',
        'story_h': '故事',
        'story': [
            '鸟栖于山，是为岛。一张纸落在海上，纸上的字活了。你是其中的一个“人”，赤手空拳。纸上每一格都是一个字：木是树，山是山，水是水，虎就是虎。取下来的字是材料，写下去的字是你的家。岛上有一座废村，碑上写着：村里没有人，人都在字典里。',
            '这张纸在歪。共工“怒而触不周之山”，天柱折，地维绝；纸角翘起来，跑出了修蛇、封豨、大风。青龙、白虎、朱雀、玄武，是压住四角的镇纸。撑过一夜，再撑过一夜；胆气够了，就造一艘船离开。',
        ],
        'scenes_h': '试玩里的场景',
        'scenes_intro': '试玩版在本岛上，玩到魄来的头一夜过完（看难度：逍遥第十八、初履第十五、人间第十二、宗师第九夜），下面这几段都在试玩里。',
        'chai': (['从人依木', '从月从囧', '从子在宀下'], '《说文解字》的说法；囧是窗。'),
        'scenes': {
            'gather': ('取木', '林子里的每一格都是字，取下来就是材料。'),
            'build': ('砌屋', '一块砖一块砖砌起来，再摆床、灶、柜、灯。'),
            'snow': ('雪', '开春头几天常下雪；灯点在屋外也点在屋里。'),
            'night': ('魄来的夜', '天一黑，灯照着的砖慢慢透出暗光；怕光的魄从暗处飘来，地上的灯烧得灭它们。'),
            'gaze': ('观星', '晴夜抬头，认星官，也认星座；岁星、荧惑、太白在星间慢慢走。'),
            'zi': ('造字', '人靠着木就是“休”，月照进窗就是“明”。从村井捞起偏旁“子”，摆进屋里——子在宀下，第一个字民“字”走出字典。'),
        },
        'feat_h': '完整版',
        'feat_intro': '试玩之后，纸还很大。',
        'features': {
            'thunder': ('照着节气过日子', '一年三百六十日，照二十四节气、七十二候走。雨、雪、雷雨、狂风、冰雹；大漠与火山只打干雷。'),
            'crops': ('五谷一笔一笔长', '种稻、黍、稷、麦、菽，防雀、防鼠、防蝗；用釜甑做五谷的菜，搭配着吃有增益。'),
            'sail': ('造船渡海', '胆气够了就造孤帆、方舟出海。纸上有大陆、群岛、大漠、火山、雪原，海上有蜃。'),
            'gong': ('上不周山', '先毙修蛇、封豨、大风，向北方玄武取经，再上不周山，去找撞歪天地的共工。'),
        },
        'facts': ['单人、离线', '键盘与鼠标', '界面：繁体中文（默认）、简体中文', '四种难度：逍遥、初履、人间、宗师'],
        'contact_h': '联系',
        'contact': '《墨画苍生》是长风“写意”系列的第一部。想说什么，写信给我们：',
        'next': ('“写意”系列第二部《力透纸背》', '敬请期待'),
        'banner': {'zh-Hant': '這一頁也有繁體中文', 'en': 'This page is also in English', 'ja': '日本語のページもあります'},
        'video_off': '你的浏览器播放不了这段视频。',
        'author': ('作者', '长风工作室', '联系', '个人主页'),
        'bio': ('教数学、做研究，也用互动游戏探索文字与文学。', '《墨画苍生》把《山海经》的山海与二十四节气，写成一座用汉字搭起来的岛。'),
        'copy': '© 2026 长风。字体：霞鹜文楷、思源宋体（SIL Open Font License 1.1）。',
    },
    'en': {
        'studio': 'SteJoy',
        'title': 'InkWild (墨畫蒼生) | SteJoy',
        'desc': 'A sheet of paper falls on the sea, and the characters on it come alive. You are one of them: 人, "person". Gather wood, lay bricks and light lamps against the spirits that come through walls once the nights draw on. Farm by the solar terms, fish, read the stars, then set sail.',
        'nav': ['Trailer', 'Story', 'Demo', 'Features', 'Contact'],
        'kicker': 'Between the lines · an island on paper',
        'tagline': 'Write wood into a boat · write water into the deep',
        'soon': 'Coming to Steam', 'wish': 'Wishlist on Steam', 'watch': 'Watch the trailer',
        'trailer_h': 'Trailer', 'trailer_note': 'In-game footage. The music is a placeholder synthesized track.',
        'lang_note': 'InkWild is in Traditional and Simplified Chinese only. There is no English version.',
        'story_h': 'Story',
        'story': [
            'In Chinese, 島 (island) is written as a bird, 鳥, perched on a mountain, 山. A sheet of paper falls on the sea, and the characters written on it come alive. You are one of them: 人, a person, empty-handed. Every tile on the paper is a character. 木 is a tree, 山 is a mountain, 水 is water, 虎 is a tiger. The characters you take become materials; the characters you set down become your home. On the island stands a ruined village. Its stone reads: "No one lives here. The people are all in the dictionary."',
            'The paper is tilting. Gonggong, in his fury, rammed Mount Buzhou, as the Huainanzi tells it, and the pillar of heaven broke. The corners curled up and let loose the giant serpent Xiushe, the great boar Fengxi and the Great Wind. The Azure Dragon, White Tiger, Vermilion Bird and Black Tortoise are the paperweights holding the four corners. Survive one night, then the next; when your courage is enough, build a boat and leave.',
        ],
        'scenes_h': 'Scenes from the demo',
        'scenes_intro': 'The demo runs on the home island until the dawn after the first night the spirits walk (night 18, 15, 12 or 9, by difficulty). Every clip below is in it.',
        'chai': (['person by a tree: rest', 'moon and window: bright', 'child under a roof: character'], 'As the Shuowen Jiezi, a dictionary from about 100 CE, explains them; 囧 is a window.'),
        'scenes': {
            'gather': ('Gathering', 'Every tile in the woods is a character. Take it, and it becomes material.'),
            'build': ('Building', 'Lay the bricks one by one, then a bed, a stove, a chest and a lamp.'),
            'snow': ('Snow', 'Snow often falls in the first days of spring. Lamps burn outside and in.'),
            'night': ('The spirits come', 'As dark falls, the bricks your lamps reach begin to glow. Spirits that fear light drift in; lamps on the ground burn them away.'),
            'gaze': ('Stargazing', 'On a clear night, look up and learn the Chinese asterisms or the Western constellations; the planets wander slowly among them.'),
            'zi': ('Making characters', 'A person (人) leaning on a tree (木) writes 休, "rest"; moonlight through a window writes 明, "bright". Fish the part 子, "child", out of the village well and set it under a roof (宀): the first character-folk, 字, steps out of the dictionary.'),
        },
        'feat_h': 'The full game',
        'feat_intro': 'After the demo, the paper is still large.',
        'features': {
            'thunder': ('Live by the solar terms', 'A 360-day year follows the 24 solar terms and 72 pentads. Rain, snow, thunderstorms, gales and hail; deserts and volcanoes get only dry thunder.'),
            'crops': ('Five grains, stroke by stroke', 'Grow rice, broomcorn millet, foxtail millet, wheat and soybeans. Guard them from sparrows, mice and locusts, and cook them for meal bonuses.'),
            'sail': ('Cross the sea', 'With enough courage, build a sailboat or an ark. The paper holds continents, archipelagos, deserts, volcanoes and snowfields, and the 蜃 haunts the sea.'),
            'gong': ('Climb Mount Buzhou', 'Defeat Xiushe, Fengxi and the Great Wind, take scrolls from the Black Tortoise, then climb Mount Buzhou to find Gonggong.'),
        },
        'facts': ['Single-player, offline', 'Keyboard and mouse', 'Text: Traditional Chinese (default) and Simplified Chinese', 'Four difficulties'],
        'contact_h': 'Contact',
        'contact': 'InkWild is the first game in SteJoy\'s 寫意 (Xieyi) series. Write to us:',
        'next': ('Part 2 of the Xieyi series: Through the Page', 'coming soon'),
        'banner': {'zh-Hant': '這一頁也有繁體中文', 'zh-Hans': '有简体中文页面', 'ja': '日本語のページもあります'},
        'video_off': 'Your browser cannot play this video.',
        'author': ('Created by', 'SteJoy', 'Contact', 'Homepage'),
        'bio': ('Math teacher and researcher who explores writing and literature through interactive games.', 'InkWild turns the mountains and seas of the Shanhaijing and the 24 solar terms into an island built from Chinese characters.'),
        'copy': '© 2026 SteJoy. Fonts: LXGW WenKai, Noto Serif (SIL Open Font License 1.1).',
    },
    'ja': {
        # 2026-11-07 使用者：膽氣用「胆力」（原本寫胆気，日文少見）；日文頁在「第十三夜」那段解釋魄是什麼（魂升天、魄留在地上的那一半），頁面說明第一次出現標讀音
        'studio': '長風',   # 日文頁也寫「長風」（日本人讀得出：ちょうふう）；英文名 SteJoy 寫在「長風について」與頁尾
        'title': '墨畫蒼生 InkWild｜長風',
        'desc': '一枚の紙が海に落ち、紙の上の漢字が生きはじめた。あなたはその中の一字「人」。木を取り、煉瓦を積み、灯をともして、夜ごとに煉瓦を抜けてくる魄（はく）をしのぐ。節気に合わせて五穀を育て、釣りをし、星を見る。胆力が十分についたら舟を造って海を渡り、天地を傾けた共工を探しに行く。',
        'nav': ['予告編', '物語', '体験版', '特徴', 'お問い合わせ'],
        'kicker': '字と字のあいだ · 紙一枚の島',
        'tagline': '木を書けば舟となり · 水を書けば淵となる',
        'soon': '近日 Steam で配信', 'wish': 'Steam でウィッシュリストに追加', 'watch': '予告編を見る',
        'trailer_h': '予告編', 'trailer_note': 'ゲームの実機映像です。音楽は仮の合成音源です。',
        'lang_note': '『墨畫蒼生』の表示言語は繁体字中国語と簡体字中国語だけで、日本語版はありません。',   # 遊戲沒有日文版（跟英文頁一樣先說清楚）
        'story_h': '物語',
        'story': [
            '鳥が山に棲む、それを島という。一枚の紙が海に落ち、紙の上の字が生きはじめた。あなたはその中の一字、素手の「人」。紙の一マス一マスが、どれも一つの字だ。木は木、山は山、水は水、虎はそのまま虎。取った字は材料になり、書き入れた字はあなたの家になる。島には廃村があり、碑にこうある。「村には誰もいない。人はみな字典の中にいる。」',
            'この紙は傾いている。共工が「怒りて不周の山に触れ」、天柱は折れ、地維は絶えた。紙の角はめくれ上がり、修蛇、封豨、大風が放たれた。青龍・白虎・朱雀・玄武は、四隅を押さえる文鎮だ。一夜をしのぎ、また一夜をしのぐ。胆力が十分についたら、舟を一艘造ってこの島を離れる。',
        ],
        'scenes_h': '体験版の場面',
        'scenes_intro': '体験版は本島で、魄が初めて現れる夜が明けるまで（難易度により第十八・十五・十二・九夜）。下の場面は、どれも体験版で遊べます。',
        'chai': (['人が木に依る', '月と窓（囧）', '子が屋根（宀）の下に'], '『説文解字』の説明による。囧は窓のこと。'),
        'scenes': {
            'gather': ('木を取る', '林の一マス一マスが字。取れば材料になる。'),
            'build': ('家を建てる', '煉瓦を一つずつ積み、寝床、竈、櫃、灯を置く。'),
            'snow': ('雪', '春先の数日はよく雪が降る。灯は屋外にも屋内にもともす。'),
            'night': ('魄の来る夜', '日が暮れると、灯に照らされた煉瓦がゆっくりとほの明るく光りだす。人が死ぬと魂は天へ昇り、魄（はく）は地に残るという。その魄が暗がりから漂ってくる。光を嫌い、煉瓦も抜けて近づいては心をむしばむが、地に置いた灯がそれを焼き消す。'),
            'gaze': ('星を見る', '晴れた夜に空を見上げ、中国の星官も西洋の星座も覚えられる。惑星も星々の間をゆっくり動く。'),
            'zi': ('字をつくる', '人が木に寄りかかれば「休」、月が窓から差し込めば「明」。村の井戸から部品「子」をすくい上げ、屋根（宀）の下に置くと、最初の字民「字」が字典から歩み出る。'),
        },
        'feat_h': '製品版',
        'feat_intro': '体験版のあとも、紙はまだ広い。',
        'features': {
            'thunder': ('節気とともに暮らす', '一年は三百六十日、二十四節気と七十二候のとおりに巡る。雨、雪、雷雨、強風、雹。砂漠と火山には乾いた雷だけが落ちる。'),
            'crops': ('五穀は一画ずつ育つ', '稲・黍・稷・麦・菽を育て、雀や鼠や蝗から守る。釜と甑で五穀を料理し、取り合わせて食べれば効き目が増す。'),
            'sail': ('舟を造って海を渡る', '胆力が十分についたら孤帆や方舟を造って海へ。紙の上には大陸、群島、砂漠、火山、雪原があり、海には蜃が潜む。'),
            'gong': ('不周山へ', '修蛇・封豨・大風を倒し、北の玄武から経を授かり、不周山に登って、天地を傾けた共工を探しに行く。'),
        },
        'facts': ['シングルプレイ・オフライン', 'キーボードとマウス', '表示言語：繁体字中国語（既定）・簡体字中国語', '難易度は四段階（逍遙・初履・人間・宗師）'],
        'contact_h': 'お問い合わせ',
        'contact': '『墨畫蒼生』は長風の「写意」シリーズ第一部です。ご意見・ご感想はメールでどうぞ：',
        'next': ('「写意」シリーズ第二部『力透紙背』', '乞うご期待'),   # 「第○部」照《力透紙背》日文版標題畫面的寫法
        'banner': {'zh-Hant': '這一頁也有繁體中文', 'zh-Hans': '有简体中文页面', 'en': 'This page is also in English'},
        'video_off': 'お使いのブラウザではこの動画を再生できません。',
        'author': ('作者', '長風（SteJoy）', '連絡先', 'ホームページ'),
        'bio': ('数学を教え、研究をしながら、インタラクティブなゲームで文字と文学を探っています。', '『墨畫蒼生』は、『山海経』の山と海、そして二十四節気を、漢字で組み上げた一つの島に描いた作品です。'),
        'copy': '© 2026 長風。フォント：Klee One、霞鶩文楷（いずれも SIL Open Font License 1.1）。',
    },
}



def esc(s):
    return html.escape(s, quote=True)

def page(code):
    L, T, up = LANGS[code], TEXT[code], '../' + LANGS[code]['up']   # 比首頁深一層
    a = up + 'assets/'
    alts = '\n'.join(f'<link rel="alternate" hreflang="{c}" href="{SITE}{LANGS[c]["dir"]}{INK}">' for c in LANGS) + f'\n<link rel="alternate" hreflang="x-default" href="{SITE}{INK}">'
    langnav = ''.join(f'<a href="{up}{LANGS[c]["dir"]}{INK}" lang="{c}"{" aria-current=\"page\"" if c == code else ""}>{LANGS[c]["short"]}</a>' for c in LANGS)
    nav = ''.join(f'<a href="#{h}">{esc(n)}</a>' for h, n in zip(['trailer', 'story', 'demo', 'features', 'contact'], T['nav']))
    cta = f'<a class="btn primary" href="{STEAM_URL}">{esc(T["wish"])}</a>' if STEAM_URL else f'<span class="badge">{esc(T["soon"])}</span>'
    tracks = ''.join(f'<track kind="subtitles" srclang="{c}" label="{LANGS[c]["name"]}" src="{a}media/trailer.{c}.vtt"{" default" if c == code else ""}>' for c in LANGS)
    gl, cn = T['chai']
    chai = '<div class="chai">' + ''.join(f'<p class="eq"><span class="g" lang="zh-Hant">{p}<i>＋</i>{q}<i>＝</i><b>{r}</b></span><small>{esc(gl[k])}</small></p>' for k, (p, q, r) in enumerate(CHAI)) + f'</div><p class="chai-note">{esc(cn)}</p>'
    scenes = ''.join(f'''
      <figure class="clip{' wide' if s == 'zi' else ''}">
        <video muted loop playsinline preload="none" poster="{a}media/scenes/{s}.jpg" data-src="{a}media/scenes/{s}.mp4" data-webm="{a}media/scenes/{s}.webm" aria-label="{esc(T['scenes'][s][0])}"></video>
        <figcaption><b>{esc(T['scenes'][s][0])}</b>{esc(T['scenes'][s][1])}{chai if s == 'zi' else ''}</figcaption>
      </figure>''' for s in SCENES)
    feats = ''.join(f'''
      <article class="feat">
        <img src="{a}media/stills/{s}.jpg" alt="" loading="lazy" width="960" height="540">
        <h3>{esc(T['features'][s][0])}</h3>
        <p>{esc(T['features'][s][1])}</p>
      </article>''' for s in FEATURES)
    facts = ''.join(f'<li>{esc(x)}</li>' for x in T['facts'])
    story = ''.join(f'<p>{esc(p)}</p>' for p in T['story'])
    lang_note = f'<p class="lang-note">{esc(T["lang_note"])}</p>' if T.get('lang_note') else ''
    banner = json.dumps({c: [t, up + LANGS[c]['dir'] + INK] for c, t in T['banner'].items()}, ensure_ascii=False)
    return f'''<!doctype html>
<html lang="{code}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
{HEAD_JS}
<title>{esc(T['title'])}</title>
<meta name="description" content="{esc(T['desc'])}">
<meta name="author" content="{AUTHOR}">
<link rel="canonical" href="{SITE}{L['dir']}{INK}">
{alts}
<meta property="og:type" content="website">
<meta property="og:site_name" content="{esc(T['studio'])}">
<meta property="og:title" content="{esc(T['title'])}">
<meta property="og:description" content="{esc(T['desc'])}">
<meta property="og:image" content="{SITE}assets/img/og.jpg">
<meta property="og:url" content="{SITE}{L['dir']}{INK}">
<meta name="twitter:card" content="summary_large_image">
<meta name="theme-color" content="#f4eee2">
<link rel="icon" href="{up}favicon.ico" sizes="any">
<link rel="icon" href="{a}img/icon.svg" type="image/svg+xml">
<link rel="apple-touch-icon" href="{a}img/icon-180.png">
<link rel="stylesheet" href="{a}fonts/fonts.css">
<link rel="stylesheet" href="{a}css/site.css">
<script defer src="{a}js/site.js"></script>
</head>
<body class="lang-{code} mohua" data-banner='{esc(banner)}'>
<header class="top">
  <a class="studio" href="{up}{L['dir']}"><img src="{a}img/icon.svg" alt="" width="34" height="34"><span>{esc(T['studio'])}</span></a>
  <nav class="sections" aria-label="sections">{nav}</nav>
  <nav class="langs" aria-label="language">{langnav}</nav>
</header>
<div id="lang-banner" hidden></div>

<main>
<section class="hero">
  <p class="kicker">{esc(T['kicker'])}</p>
  <h1><span class="sr-only">{esc('墨畫蒼生 InkWild')}</span>{LOGO}</h1>
  <p class="tagline">{' · '.join(f'<span>{esc(x)}</span>' for x in T['tagline'].split(' · '))}</p>
  <div class="cta">{cta}<a class="btn" href="#trailer">{esc(T['watch'])}</a></div>
  {lang_note}
</section>

<section id="trailer" class="trailer">
  <h2>{esc(T['trailer_h'])}</h2>
  <div class="frame">
    <video controls preload="metadata" playsinline poster="{a}media/trailer.jpg">
      <source src="{a}media/trailer.mp4" type="video/mp4">
      <source src="{a}media/trailer.webm" type="video/webm">{tracks}
      {esc(T['video_off'])}
    </video>
  </div>
  <p class="note">{esc(T['trailer_note'])}</p>
</section>

<section id="story" class="story">
  <h2>{esc(T['story_h'])}</h2>
  {story}
</section>

<section id="demo" class="scenes">
  <h2>{esc(T['scenes_h'])}</h2>
  <p class="lead">{esc(T['scenes_intro'])}</p>
  <div class="grid">{scenes}
  </div>
</section>

<section id="features" class="features">
  <h2>{esc(T['feat_h'])}</h2>
  <p class="lead">{esc(T['feat_intro'])}</p>
  <div class="feats">{feats}
  </div>
  <ul class="facts">{facts}</ul>
</section>

<section id="contact" class="contact">
  <h2>{esc(T['contact_h'])}</h2>
  <p>{esc(T['contact'])} <a href="mailto:{MAIL}">{MAIL}</a></p>
  <p class="next-game"><a href="{up}{L['dir']}litouzhibei/">{esc(T['next'][0])} →</a><span>{esc(T['next'][1])}</span></p>
</section>
</main>

<footer>
  <div class="author">
    <p class="author-name"><span>{esc(T['author'][0])}</span> {AUTHOR}</p>
    <p class="author-bio">{' '.join(f'<span>{esc(x)}</span>' for x in T['bio'])}</p>
    <p class="author-meta">{esc(T['author'][3])} <a href="{AUTHOR_URL}" rel="me">stephenjia.com</a> · {esc(T['author'][1])} · {esc(T['author'][2])} <a href="mailto:{MAIL}">{MAIL}</a></p>
  </div>
  <p class="copy">{esc(T['copy'])}</p>
</footer>
</body>
</html>
'''

for code, L in LANGS.items():
    out = ROOT / L['dir'] / INK / 'index.html'   # 《墨畫蒼生》
    out.parent.mkdir(parents=True, exist_ok=True)
    out.write_text(page(code), encoding='utf-8')
    print(out.relative_to(ROOT), out.stat().st_size)

home.build(LANGS, TEXT, SITE, AUTHOR, AUTHOR_URL, MAIL, LOGO)   # 首頁：選一部遊戲（index.html、zh-hans/index.html、en/index.html）

litou.build(LANGS, TEXT, SITE, AUTHOR, AUTHOR_URL, MAIL)   # 《力透紙背》：litouzhibei/、zh-hans/litouzhibei/、en/litouzhibei/、ja/litouzhibei/、vi/litouzhibei/（越南文只有這一頁）

# sitemap：首頁、《墨畫蒼生》、《力透紙背》各四語，各組互相標成同一頁的不同語言
groups = [('', LANGS), (INK, LANGS), (litou.SLUG, litou.langs(LANGS))]   # 《力透紙背》多一個越南文（2026-11-10）
(ROOT / 'sitemap.xml').write_text('<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">\n' + ''.join(
    f'  <url><loc>{SITE}{L["dir"]}{g}</loc>' + ''.join(f'<xhtml:link rel="alternate" hreflang="{c}" href="{SITE}{LL[c]["dir"]}{g}"/>' for c in LL) + '</url>\n' for g, LL in groups for L in LL.values()) + '</urlset>\n', encoding='utf-8')
(ROOT / 'robots.txt').write_text(f'User-agent: *\nAllow: /\nSitemap: {SITE}sitemap.xml\n', encoding='utf-8')
