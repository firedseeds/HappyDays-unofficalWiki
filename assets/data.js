/* =========================================================
   HappyDays非官方文档 — content model
   该文件由 build.py 根据 article/ 自动生成，请勿直接编辑。
   ========================================================= */

window.HAPPYDAYS_WIKI = (function () {
  "use strict";

  var categories = [
    {
      id: "intro",
      name: "简介",
      description: "HappyDays 服务器与知识库概览。",
      parentId: null,
      order: 1,
      docs: ["intro"]
    },
    {
      id: "beginner",
      name: "新手教程",
      description: "进入服务器前的准备、初来乍到与基础玩法。",
      parentId: null,
      order: 2,
      docs: ["before-joining", "first-arrival", "shop-plugin", "build-town", "about-nations", "first-money"]
    },
    {
      id: "advanced",
      name: "进阶教程",
      description: "资源、经济、载具与城镇发展。",
      parentId: null,
      order: 3,
      docs: ["resource-world-nether", "senluo-kitchen", "senluo-tavern", "money-making-guide", "lottery", "immersive-vehicles", "town-resources"]
    },
    {
      id: "rules",
      name: "服务器规则",
      description: "服务器行为规范、作弊处理与地图规则。",
      parentId: null,
      order: 4,
      docs: ["cheating-response", "behavior-chat", "world-map"]
    },
    {
      id: "history",
      name: "happyday历史",
      description: "服务器的人物、国家与历史记录。",
      parentId: null,
      order: 5,
      docs: []
    },
    {
      id: "people",
      name: "人物志",
      description: "服务器玩家与人物记录。",
      parentId: "history",
      order: 1,
      docs: ["matopiraphai", "233-2233", "zzx", "1"]
    },
    {
      id: "nations",
      name: "国家/城镇",
      description: "服务器中的国家、城镇与编年记录。",
      parentId: "history",
      order: 2,
      docs: ["northeast-economic-alliance", "harbin-chronicle", "rhodes-island", "freedom-union", "dprk"]
    },
    {
      id: "godman",
      name: "神人堂",
      description: "服务器里各种神人",
      parentId: "history",
      order: 3,
      docs: ["ok", "qwertyuiop", "alex", "666"]
    },
    {
      id: "gallery",
      name: "妙妙图片集",
      description: "服务器截图与图片记录。",
      parentId: null,
      order: 6,
      docs: ["gallery-1", "gallery-2"]
    }
  ];

  var docs = {
    "intro": {
      title: "简介",
      emoji: "🚇",
      category: "intro",
      excerpt: "happydays是在1:326的欧亚地图上以...",
      icon: "/icon.png",
      updated: "2026-10-25",
      reading: 1,
      tags: [],
      signatures: [{"author": "smillfox", "at": "2026-10-26T11:50:49+08:00", "action": "update", "title": "简介", "topic": "简介"}, {"author": "zeyu_1150", "at": "2026-10-27T21:30:13+08:00", "action": "update", "title": "简介", "topic": "简介"}],
      content: `<h2>HappyDays轨道交通服务器</h2>
<p><strong>happydays是在1:326的欧亚地图上以建立发展城市、轨道交通及铁路建设为基础的Minecraft服务器</strong></p>
<p><strong>游戏版本：Java 1.20.1</strong></p>
<p><strong>服务器地址：n3-22.yxsjmc.cn:20999</strong></p>
<p><strong>在线地图网址：</strong><a href="http://n3-22.yxsjmc.cn:20675/"><strong>n3-22.yxsjmc.cn:20675</strong></a></p>
<p><strong>qq群：498750087</strong></p>
<p>服务器管理一览</p>
<p><strong>腐竹：HAPPYAAAAA</strong></p>
<p><strong>管理员：Crazytudou、Burnkey、smillfox、fish</strong></p>`
    },
    "before-joining": {
      title: "进入游戏前",
      emoji: "🌱",
      category: "beginner",
      excerpt: "配置推荐使用强劲的电脑、笔记本或手...",
      icon: "/icon.png",
      updated: "2026-10-25",
      reading: 3,
      tags: [],
      signatures: [{"author": "smillfox", "at": "2026-10-26T13:27:55+08:00", "action": "update", "title": "进入游戏前", "topic": "新手教程"}],
      content: `<h2>1 - 准备</h2>
<p><strong>1.1 配置</strong></p>
<p><strong>推荐使用强劲的电脑、笔记本或手机游玩</strong></p>
<p>根据Minecraft的性能需求，不建议使用过于古老的机器进行游玩，否则会造成加载时间过长，游玩掉帧等令人不适的问题。</p>
<p><strong>1.2 系统</strong></p>
<p><strong>⭕推荐使用系统：Windows7以上</strong></p>
<p>❌不支持的系统：未越狱的iOS、HarmonyOS Next 等</p>
<p><strong>1.3 版本与账号</strong></p>
<p><strong>推荐版本（原生版本）：1.20.1仅支持Java版</strong></p>
<p><strong>不支持和基岩版互通无需正版账号</strong>，离线与皮肤站登录皆🉑</p>
<h2>2 - 进入Minecraft注：非小白请跳过此章节</h2>
<p><strong>2.1 启动器</strong></p>
<p>可以使用任何启动器进入Minecraft并不强制要求，以下列出的均为推荐，没广子嗷</p>
<p><strong>Windows 平台</strong>推荐启动器：Plain Craft Launcher II（PCL2）PCL2下载地址：</p>
<p><a href="https://afdian.com/p/0164034c016c11ebafcb52540025c377">https://afdian.com/p/0164034c016c11ebafcb52540025c377</a></p>
<p><strong>Windows/MacOS/Linux 平台</strong>推荐启动器：Hello Minecraft! Launcher（HMCL）HMCL下载地址：</p>
<p><a href="https://hmcl.huangyuhui.net/download/">https://hmcl.huangyuhui.net/download/</a></p>
<p><strong>Android 平台</strong>推荐启动器：Fold Craft Launcher（FCL）FCL下载地址：</p>
<p><a href="https://pan.quark.cn/s/511dfe826953#/list/share">https://pan.quark.cn/s/511dfe826953#/list/share</a></p>
<p><strong>越狱的 iOS 平台此方法不推荐小白使用</strong>推荐启动器：PojavLauncher_iOSPojav_iOS下载地址：</p>
<p><a href="https://github.com/PojavLauncherTeam/PojavLauncher_iOS/releases">https://github.com/PojavLauncherTeam/PojavLauncher_iOS/releases</a></p>
<p>注：需要良好的网络环境才可下载，连不上github的请自行解决话说你都越狱了，不可能不会连github吧</p>
<p><strong>❌极力不推荐</strong>启动器：官方启动器</p>
<p><strong>2.2 下载游戏</strong></p>
<p>启动游戏前须下载群内整合包，可以在整合包上加载优化，辅助等类型Mod</p>
<p><strong>注：电脑须下载电脑的整合包，手机须下载手机的整合包</strong></p>
<p><strong>2.3 连接服务器</strong></p>
<p>在启动器点击启动游戏后，将会弹出游戏窗口请遵循以下步骤：</p>
<p>①在游戏界面中点击<strong>多人游戏</strong>，然后点击第一个服务器</p>
<p><strong>至此，你学会了怎么进入服务器👏🏻</strong></p>`
    },
    "first-arrival": {
      title: "初来乍到",
      emoji: "🌱",
      category: "beginner",
      excerpt: "1-最基本的1.1逃出出生点！！！（bushi）进入服...",
      icon: "/icon.png",
      updated: "2026-10-25",
      reading: 2,
      tags: [],
      signatures: [],
      content: `<h2>1-最基本的</h2>
<p><strong>1.1逃出出生点！！！（bushi）</strong></p>
<p>进入服务器后，<strong>请根据聊天栏的提示</strong>进行账号注册：/reg &lt;密码&gt; &lt;重复密码&gt;</p>
<p>请在注册成功后，左键点击告示牌，以购买钟、手机</p>
<p>完成购买后可以在群中<strong>@HAPPYAAAA</strong>以离开出生点</p>
<p><strong>1.2查看在线地图</strong></p>
<p>进入服务器后，您需要做的第一件事是知道自己在什么地方。</p>
<p>您可以通过浏览器来访问默认地图。</p>
<p><strong>在线地图网址：n3-22.yxsjmc.cn:20675</strong></p>
<p>地图显示：</p>
<ul><li>所有在线玩家</li></ul>
<ul><li>地形变化</li></ul>
<ul><li>现有的国家和城镇</li></ul>
<ul><li>首都（用国王符号表示）</li></ul>
<ul><li>前哨战（用前哨站符号表示）</li></ul>
<ul><li>蓝/绿旗（国家成员/非国家成员）</li></ul>
<p><strong>1.3轨道&amp;交通（基础）</strong></p>
<p>服务器以轨道交通和建造城镇为主要玩法</p>
<p>可以在<strong>手机</strong>上看到时刻表</p>
<p><strong>主要铁路线路：</strong></p>
<ol class="steps"><li>哈鲁线： 哈尔滨 - 长春 - 沈阳 - 秦皇岛 - 北京 - 济南</li><li>中央环线: 连云港 - 南京 - 武汉 - 重庆 - 西安 - 三门峡 - 郑州 - 济南 - 连云港</li><li>西南环线：广州 - 南宁 - 昆明 - 成都 - 重庆 - 长沙 - 广州</li><li>西连线： 大连 - 秦皇岛 - 北京 - 呼和浩特 - 西安</li><li>沪广线： 上海 - 南京 - 武汉 - 长沙 - 广州</li><li>川藏线： 成都 - 拉萨 - 纳木错</li></ol>
<p><strong>至此，你初步了解了这个世界👏🏻</strong></p>`
    },
    "shop-plugin": {
      title: "商店插件",
      emoji: "🌱",
      category: "beginner",
      excerpt: "本服务器使用QuickShop插件，如何使用请看下文：...",
      icon: "/icon.png",
      updated: "2026-10-25",
      reading: 3,
      tags: [],
      signatures: [],
      content: `<p>本服务器使用QuickShop插件，如何使用请看下文：</p>
<h2>认识商店</h2>
<h3>商店由什么组成?</h3>
<p>商店一般由箱子（单格）组成，上面常挂着告示牌，内容如下：</p>
<p>（收购）</p>
<p><strong>[玩家名]</strong>或者系统商店</p>
<p><strong> 收购　[数量]</strong>通常为1~1728，系统商店为无限，或空间不足</p>
<p><strong>[物品名称]</strong></p>
<p><strong>单价 ：$[金额]</strong></p>
<p>（出售）</p>
<p><strong>[玩家名]</strong>或者系统商店</p>
<p><strong>出售　[数量]</strong>通常为1~1728，系统商店为无限，或缺货</p>
<p><strong> [物品名称]</strong></p>
<p><strong>单价 ：$[金额]</strong></p>
<p>附图片：</p>
<p><img src="assets/image/shop-plugin/1791685253432-31a89a9d-3435-4d36-ba14-7ca91e0d21f5.png" alt="图片" loading="lazy" decoding="async"></p>
<p><img src="assets/image/shop-plugin/1791685270659-4d84db2c-2a8b-48db-b00d-01135a6a5d2a.png" alt="图片" loading="lazy" decoding="async"></p>
<p><img src="assets/image/shop-plugin/1791650194339-5f0c5587-87a3-411c-ba8c-b1ef869acb63.png" alt="图片" loading="lazy" decoding="async"></p>
<p><strong>注:模组物品只会显示其命名空间，如图二</strong></p>
<h2>店主操作</h2>
<h3>设置商店</h3>
<p>首先，放置一个箱子，并保持<strong>可以开启的状态</strong>。</p>
<blockquote>
<p>箱子在上方置有<a href="https://zh.minecraft.wiki/w/%E7%BA%A2%E7%9F%B3%E5%AF%BC%E4%BD%93">红石导体</a>或<a href="https://zh.minecraft.wiki/w/%E5%9B%BA%E4%BD%93%E6%96%B9%E5%9D%97">固体方块</a>或下半<a href="https://zh.minecraft.wiki/w/%E5%8F%B0%E9%98%B6">台阶</a>时，或猫坐在其上方时，不能开启。</p>
</blockquote>
<p>然后，拿出你要售卖/收购的东西，左键点击箱子。这时，聊天栏会弹出一行字：</p>
<p><code>请在聊天中输入交易1个[物品名称]所需的价格。</code></p>
<p>之后，在聊天栏输入单价即可。</p>
<h3>更改商店设置</h3>
<p>首先，保证你是店主。右键<strong>告示牌</strong>，聊天栏中会跳出商店控制面板，显示所有者、商店模式、价格。</p>
<p>商店模式、价格后有一个<code>[更改]</code>按钮<strong>（保持视角不动！！！）</strong>，点击后模式直接更改；点击后价格需输入(不超过<strong>1.0×10246</strong>)，输入完后按下Enter键，价格更改成功。</p>
<p>如果你想删除商店，点击最下面的<code>[删除商店]</code>即可。</p>
<h3>商店账单</h3>
<p>当有人在你的商店购买/出售物品时，聊天栏会显示：</p>
<p>（购买）<code>[玩家名] 从你的商店购买了 [数量] [物品名称] ，你因此赚得了 $[金额] 。</code></p>
<p>（出售）<code>[玩家名] 在你的商店出售了 [数量] [物品名称] 。</code></p>
<p>当缺货/库存满了，聊天栏会显示：</p>
<p>（缺货）<code>你位于 X,Y,Z, 的商店的 [物品名称] 脱销了 。</code></p>
<p>（库存满了）<code>你位于 X,Y,Z, 的商店库存已经满了 。</code></p>
<p>当店主不在线，上线后会显示出来。</p>
<h2>顾客操作</h2>
<h3>购买&amp;卖出</h3>
<p>左键<strong>商店的告示牌/箱子</strong>，聊天栏中会弹出窗口，显示所有者、物品、库存/空间、价格、出售/收购模式。</p>
<p>然后，在聊天框里输入要购买/卖出的数量，全部购买/卖出可以输入all。</p>
<p>最后，聊天栏里出现这几行字时：</p>
<p><code>支付成功/出售成功：</code></p>
<p><code>[数量] [物品名称] 共 $[金额]</code></p>
<p>你就成功购买/卖出了！</p>
<p>当聊天栏里出现这几行字时：</p>
<p>（没钱）<code>余额不足！购买该商店物品需要 $[金额] ，但是你只有 $[金额]。</code></p>
<p>（店主没钱）<code>这件商品标价 $[金额] ，但是店主只剩 $[金额] 了。</code></p>
<p>恭喜你失败了！</p>
<h2>须知</h2>
<ol class="steps"><li>买东西时一定要看物品预览，当心被骗！</li></ol>
<p>zzx买的”钻石"（）——zzx</p>`
    },
    "build-town": {
      title: "建立城邦",
      emoji: "🌱",
      category: "beginner",
      excerpt: "首先坐火车到你想创建/加入城镇的地方：/t join ...",
      icon: "/icon.png",
      updated: "2026-10-25",
      reading: 1,
      tags: [],
      signatures: [],
      content: `<p>首先坐火车到你想<strong>创建/加入</strong>城镇的地方：</p>
<p><code>/t join [城镇名]</code>加入城镇（如果加入的城镇<strong>未设置为开放</strong>状态，则<strong>无法加入</strong>）</p>
<p><code>/t leave</code>退出城镇（有二次确认）</p>
<p><code>/t new [城镇名]</code>在当前位置创建一个新的城镇（无消耗）</p>
<p><strong>注意</strong>：必须与现有领地相连，且不能跨世界</p>
<p><code>/t deposit [金额]</code> 向城镇银行<strong>存钱</strong>，<strong>可用于扩地，建立哨站</strong>等</p>
<p><code>/t claim</code> 可声明脚下土地区块（<strong>需要200块钱</strong>）</p>
<p><code>/t withdraw [金额]</code>从城镇银行<strong>取钱</strong></p>
<p><code>/t delete</code> 可删除已生成的城镇</p>`
    },
    "about-nations": {
      title: "关于国家",
      emoji: "🌱",
      category: "beginner",
      excerpt: "此文档在语雀中暂无正文。",
      icon: "/icon.png",
      updated: "2026-10-25",
      reading: 1,
      tags: [],
      signatures: [{"author": "zzx", "at": "2026-10-25T03:28:29+08:00", "action": "update", "title": "关于国家", "topic": "新手教程"}, {"author": "zzx", "at": "2026-10-25T03:29:06+08:00", "action": "update", "title": "关于国家", "topic": "新手教程"}, {"author": "zzx", "at": "2026-10-25T03:30:06+08:00", "action": "update", "title": "关于国家", "topic": "新手教程"}, {"author": "zzx", "at": "2026-10-25T03:32:31+08:00", "action": "update", "title": "关于国家", "topic": "新手教程"}, {"author": "zzx", "at": "2026-10-25T03:32:37+08:00", "action": "update", "title": "关于国家", "topic": "新手教程"}, {"author": "zzx", "at": "2026-10-25T03:32:42+08:00", "action": "update", "title": "关于国家", "topic": "新手教程"}, {"author": "zzx_1145", "at": "2026-10-25T03:34:54+08:00", "action": "update", "title": "关于国家", "topic": "新手教程"}, {"author": "qwertyuiop", "at": "2026-10-25T04:34:32+08:00", "action": "update", "title": "关于国家", "topic": "新手教程"}, {"author": "↓绝版人物——233", "at": "2026-10-25T20:31:24+08:00", "action": "update", "title": "关于国家", "topic": "新手教程"}, {"author": "233", "at": "2026-10-25T21:18:59+08:00", "action": "update", "title": "关于国家", "topic": "新手教程"}],
      content: `<p>/n join 泛东北经济联盟11451919191919</p>
<h1>不要加入千万不要加入 避免上当受骗（</h1>`
    },
    "first-money": {
      title: "第一桶金",
      emoji: "🌱",
      category: "beginner",
      excerpt: "服务器主要的赚钱方式有以下几种类型：1.修路（注意：此...",
      icon: "/icon.png",
      updated: "2026-10-25",
      reading: 1,
      tags: [],
      signatures: [{"author": "233", "at": "2026-10-25T21:19:25+08:00", "action": "update", "title": "第一桶金", "topic": "新手教程"}],
      content: `<p>服务器主要的赚钱方式有以下几种类型：</p>
<ol class="steps"><li>修路（注意：此选项后续<strong>可能会被废止</strong>，且用且珍惜）由管理员向账户打钱</li><li>通过卖农作物（如小麦，马铃薯等<strong>原版作物</strong>，森罗物语的菜系不会列入收购名单！）、成品矿物（金锭、钻石等）来获得游戏币，主要收购商城在<strong>南京</strong>、<strong>秦皇岛</strong>。</li><li>在城市建立<strong>初期</strong>，腐竹HAPPYAAAA会在各个城市设置初始简单商店，可以通过卖泥土、圆石、小麦等获得初始游戏币。</li><li>当然如果你进来时zzx在线的话，你也可以找zzx索要启动资金，一般一次给5000，要求是加入zzx所在国家，并在zzx换国家时跟随。</li><li>通过帮别人打工来获得游戏币（招工栏在<strong>南京</strong>）</li></ol>`
    },
    "resource-world-nether": {
      title: "资源世界/下界",
      emoji: "🧭",
      category: "advanced",
      excerpt: "暂无摘要",
      icon: "/icon.png",
      updated: "2026-10-25",
      reading: 1,
      tags: [],
      signatures: [{"author": "233", "at": "2026-10-25T21:13:12+08:00", "action": "update", "title": "资源世界/下界", "topic": "进阶教程"}, {"author": "233", "at": "2026-10-25T21:14:26+08:00", "action": "update", "title": "资源世界/下界", "topic": "进阶教程"}, {"author": "苹果居士", "at": "2026-10-25T21:29:50+08:00", "action": "update", "title": "资源世界/下界", "topic": "进阶教程"}, {"author": "苹果居士", "at": "2026-10-25T21:29:54+08:00", "action": "update", "title": "资源世界/下界", "topic": "进阶教程"}],
      content: `<h2>使用维度模组创建的维度，所以：资源世界不是原版主世界，地狱世界也不是真的地狱世界！</h2>
<p><strong>资源世界与地狱世界可以刷怪，所以请注意您的安全。</strong></p>
<p><strong>如果你想前往资源/地狱请前往南京（的厕所）。如果您的城市很偏远，不方便到达南京，可以向管理员申请命令方块传送。</strong></p>
<p><strong>事实上，和钟表菜单上所说的不一样，地狱世界不会死亡掉落。</strong></p>
<p><strong>吓人这一块——233</strong></p>
<p>你知道吗：在资源世界有通往原版地狱世界的传送门哦（</p>`
    },
    "senluo-kitchen": {
      title: "森罗物语：厨房",
      emoji: "🧭",
      category: "advanced",
      excerpt: "引言做饭是一门高深的艺术一、食材的获取及储存1.1植物...",
      icon: "/icon.png",
      updated: "2026-10-25",
      reading: 1,
      tags: [],
      signatures: [],
      content: `<h2>引言</h2>
<p>做饭是一门高深的艺术</p>
<h2>一、食材的获取及储存</h2>
<p><strong>1.1植物及种子的 获取/种植</strong></p>
<p>1.1.1打草(获取种子)</p>
<p>森罗厨房加入了<strong>番茄种子、辣椒种子、生菜种子、稻米和野生稻米</strong>五种可播种物品。</p>
<p>与获取小麦种子类似，玩家穿戴<strong>草帽或缀花草帽</strong>破坏草时，有机会获得这些种子（除了稻米）</p>
<p>1.1.2分解作物(获取种子)</p>
<p>可以将<strong>番茄</strong>、<strong>辣椒，在合成界面</strong>分解成对应的种子（青/红辣椒都可以）</p>
<p>1.1.3破坏成熟植株(获取种子)</p>
<p>作物成熟后破坏番茄、辣椒、生菜、水稻植株会掉落对应种子</p>
<p>1.1.4使用工具加工(获取种子)</p>
<p>将稻穗放入<strong>石磨</strong>即可得到稻米</p>
<p>1.1.5种植与收获</p>
<p>除了水稻外其他三种作物皆可在成熟后右键收获，水稻只能连根拔起</p>
<p><strong>1.2肉类的获取/处理</strong></p>
<p><strong>1.3杂项获取方法</strong></p>
<h2>二、烹饪食物</h2>
<p><strong>2.1炒菜</strong></p>
<p><strong>2.2蒸食</strong></p>
<p><strong>2.3炖菜/汤</strong></p>
<p><strong>2.4烤肉塔</strong></p>
<p><strong>2.5煮茶</strong></p>
<h2>三、家具/工具/装备</h2>
<p><strong>3.1家具</strong></p>
<p><strong>3.2工具</strong></p>
<p><strong>3.3装备</strong></p>`
    },
    "senluo-tavern": {
      title: "森罗物语：酒馆",
      emoji: "🧭",
      category: "advanced",
      excerpt: "此文档在语雀中暂无正文。",
      icon: "/icon.png",
      updated: "2026-10-25",
      reading: 1,
      tags: [],
      signatures: [],
      content: `<p>此文档在语雀中暂无正文。</p>`
    },
    "money-making-guide": {
      title: "一些杂七杂八的赚钱野路子",
      emoji: "🧭",
      category: "advanced",
      excerpt: "1.钻石在南京收购价为50元/颗，但在上海港坐海洋光谱...",
      icon: "/icon.png",
      updated: "2026-10-25",
      reading: 1,
      tags: [],
      signatures: [],
      content: `<ol class="steps"><li>钻石在南京收购价为50元/颗，但在上海港坐海洋光谱号去日本东京可卖100元/颗</li><li>买东西不一定全都要在南京买，记住以下小诀窍：</li></ol>
<p>a.武汉机铁站旁边的灯具店，比南京的便宜</p>
<p>b.济南的木材商店卖的比南京便宜</p>
<p>c.连云港机铁站旁边的HAPPY杂货铺和染料店，售价比南京便宜</p>
<ol class="steps"><li>除了挖钻石，也别忘了黄金（南京价30元/个）</li></ol>`
    },
    "lottery": {
      title: "彩票",
      emoji: "🧭",
      category: "advanced",
      excerpt: "此文档在语雀中暂无正文。",
      icon: "/icon.png",
      updated: "2026-10-25",
      reading: 1,
      tags: [],
      signatures: [{"author": "233", "at": "2026-10-25T21:22:00+08:00", "action": "update", "title": "彩票", "topic": "进阶教程"}],
      content: `<p><strong>输入：/lt</strong></p>
<p><strong>查看详情</strong></p>`
    },
    "immersive-vehicles": {
      title: "沉浸车辆",
      emoji: "🧭",
      category: "advanced",
      excerpt: "当然，服务器是有载具的，不能合成",
      icon: "/icon.png",
      updated: "2026-10-25",
      reading: 1,
      tags: [],
      signatures: [],
      content: `<p>当然，服务器是有载具的，不能合成</p>`
    },
    "town-resources": {
      title: "城镇资源",
      emoji: "🧭",
      category: "advanced",
      excerpt: "可以使用/t或/town查看城镇资源（没有则未勘探）资...",
      icon: "/icon.png",
      updated: "2026-10-25",
      reading: 1,
      tags: [],
      signatures: [{"author": "233", "at": "2026-10-25T21:29:53+08:00", "action": "update", "title": "城镇资源", "topic": "进阶教程"}, {"author": "233", "at": "2026-10-25T21:32:50+08:00", "action": "update", "title": "城镇资源", "topic": "进阶教程"}],
      content: `<p>可以使用<code>/t</code>或<code>/town</code>查看城镇资源（没有则<strong>未勘探</strong>）</p>
<h3>资源机制</h3>
<p>每当到<strong>中午的12点* </strong>，资源就会产出。</p>
<h3>勘探资源</h3>
<p><strong>勘探资源分为4个等级：一1块领地、5块领地、10块领地和20块领地，每个等级可增加一种资源。</strong></p>
<ol class="steps"><li>首先站在<strong>你城镇的土地</strong>里，执行<code>/t resources survey</code>。</li><li>会弹出一个窗口，<code>[/confirm]</code>表示<strong>同意</strong>，<code>[/cancel]</code>表示<strong>取消</strong></li><li>点击<code>[/confirm]</code>或执行 <code>/confirm</code><strong>（需要25块）</strong></li><li>点击后，会有<strong>蓝色字体</strong>告诉你的城镇勘探到的资源（看不懂可以用翻译软件）</li></ol>
<h3>领取资源</h3>
<ol class="steps"><li>首先站在<strong>你城镇的土地</strong>里，执行<code>/t resources collect</code></li><li>资源会放置在你的<strong>背包</strong>中，位置不够时则放置一部分，重新领取请重新执行</li><li>需要注意：在上一个<strong>城镇日* </strong>中勘探的资源才能领取，所以建议北京时间上午12点前勘探资源。</li></ol>
<p><strong>*：城镇日详见城镇插件wiki，在本服务器中约为北京时间上午12：00</strong></p>`
    },
    "cheating-response": {
      title: "作弊与应对",
      emoji: "📜",
      category: "rules",
      excerpt: "作弊与应对1.1 作弊客户端和其他修改可以在原本的整合...",
      icon: "/icon.png",
      updated: "2026-10-25",
      reading: 2,
      tags: [],
      signatures: [],
      content: `<p>1.1 作弊客户端和其他修改</p>
<p><strong>可以在原本的整合包上安装以下mod（暂时）：</strong></p>
<blockquote>
<p>tweakerge（tweakeroo移植）</p>
<p>xaero的大/小地图</p>
<p>JEI/极简血量显示等显示mod</p>
<p>聊天动画/头像等视觉优化mod</p>
<p>铁氧体磁芯/内存泄漏修复等性能优化mod</p>
<p>全息蓝图/投影+信雅互联（不建议使用投影打印机）</p>
</blockquote>
<p>1.2 协助他人违反服务器规则</p>
<p>被发现<strong>故意协助某人</strong>、故意参与违反了所列出的任何规则可能会被视为他们自己实施了该行为。</p>
<p>注：还没有发生过大型团伙作案，不希望你（们）成为第一个实例</p>
<p>1.3 技术和服务器漏洞玩家<strong>不得利用明显的服务器漏洞</strong>或以其他方式<strong>利用技术疏忽</strong>。被发现在未通知工作人员的情况下利用漏洞或技术疏忽的玩家可能会被<strong>永久封禁IP</strong>。</p>
<p>1.4 多账号不推荐使用小号。每个玩家最多<strong>只能注册2个帐户</strong>。如果你<strong>使用妙妙方法（加速器，vpn等）</strong>绕过了2个账户的限制，<strong>腐竹大概率也发现不了（bushi），但还是建议不要使用，附赠图片：</strong></p>
<p>1.5 故意影响服务器管理以<strong>刷屏、撒泼、辱骂</strong>等方式在任何媒体、游戏内骚扰服务器管理团队的情况。 将视其严重情况进行<strong>禁言、警告以及封禁</strong>的处罚。</p>`
    },
    "behavior-chat": {
      title: "行为与聊天",
      emoji: "📜",
      category: "rules",
      excerpt: "2.1 命名国家名称：可以是虚构的，尽量不要与当前的国...",
      icon: "/icon.png",
      updated: "2026-10-25",
      reading: 3,
      tags: [],
      signatures: [],
      content: `<p><code>2.1 命名</code></p>
<blockquote>
<p>国家名称：<strong>可以是虚构的</strong>，尽量不要与当前的国家同名，可以使用不敏感的朝代命名，可以以非敏感地区、省或其他具有明确边界的大地理区域命名。 城镇名称：<strong>不能不恰当、包含粗俗用语或令人反感</strong>。 国家、城镇名称应由<strong>汉字（简体/繁体/新字体）或英文字母</strong>组成，禁止其他符号的使用。 玩家的用户名、昵称、皮肤和 Towny 头衔称号等<strong>不得露骨、色情或包含其他不恰当内容</strong>。</p>
<p>请注意，服务器<strong>严肃禁止任何摄政，反对统一，法西斯等违反公序良俗</strong>的文本内容，国家名字方面亦如此，如若发现，管理将依据程度高低给予处罚</p>
</blockquote>
<p><code>2.2 偷窃、诈骗和袭击玩家/城镇/国家</code></p>
<blockquote>
<p>游戏内任何世界都遵循以下条例友好发展： <strong>不允许</strong>从其他玩家那里<strong>偷窃</strong>：会对偷窃者进行处罚，对被偷的人进行赔偿（大部分时候）</p>
</blockquote>
<p><code>2.3 垃圾信息</code></p>
<blockquote>
<p>不允许以扰乱聊天的方式发送垃圾邮件或发送垃圾消息，通常是通过重复发送类似的消息。</p>
</blockquote>
<p><code>2.4 不良行为</code></p>
<blockquote>
<p>服务器上不允许的恶劣行径。 其恶劣程度根据具体情况进行评估，工作人员对什么是恶劣行为有最终决定权。重复的恶劣行为可能会导致<strong>警告、禁言，并最终被永久封禁</strong>。</p>
<p><strong>#不良行为包括： ①霸凌。 ②重复使用贬义词。 ③鼓励自残的内容。 ④煽动针对种族和社会少数群体的暴力或明确形式的仇恨言论。 ⑤露骨地谈论性。 ⑥涉及现实政治。</strong></p>
</blockquote>
<p><code>2.5 冒充其他玩家、城镇和国家</code></p>
<blockquote>
<p><strong>不允许</strong>利用但不限于用户名、昵称、城镇/国家名称进行<strong>冒充</strong>。 违规者将被要求恢复其原有的用户名。如果造成任何损害，工作人员可以封禁违规玩家。</p>
</blockquote>
<p><code>2.6 传播、调查个人信息</code></p>
<blockquote>
<p><strong>严禁分享、调查任何个人信息和身份。</strong>个人信息可能包括但不限于<strong>玩家的全名、“现实生活”照片、电话号码、家庭住址、社交网络、学校/工作地点、家庭关系和 IP 地址。</strong>也<strong>不允许以威胁或操纵的方式</strong>利用他人的个人信息。 同样<strong>禁止自我公布个人信息</strong>，危害服务器秩序。</p>
</blockquote>
<p><code>2.7 分享链接</code></p>
<blockquote>
<p><strong>不允许发布恶意链接</strong>，例如病毒或 IP 记录器。 <strong>不允许发布色情或极端暴力/令人不安的内容的链接</strong>。 <strong>不允许发布违反本页列出的任何规则的链接</strong>。 包括向 QQ等社交媒体中的其他玩家发送这类链接。</p>
<p>除了以上这些情况外的其他链接是允许的。</p>
</blockquote>
<p><code>2.8 广告</code></p>
<blockquote>
<p>除非与happydays服务器相关，否则<strong>不允许投放任何其他广告</strong>。</p>
<p>当然，<strong>公益广告除外</strong></p>
<p>详见神人糖:(qwertyuiop未经允许在服务器投放其他服务器广告被ban了(喜)）</p>
</blockquote>
<p><code>2.9 以真钱出售内容和服务</code></p>
<blockquote>
<p>您<strong>不得出售游戏内物品或服务</strong>以换取现实生活中的金钱，反之亦然。</p>
</blockquote>`
    },
    "world-map": {
      title: "世界与地图",
      emoji: "📜",
      category: "rules",
      excerpt: "3.1 在城镇周围破坏土地玩家不得在城镇周围破坏土地。...",
      icon: "/icon.png",
      updated: "2026-10-25",
      reading: 1,
      tags: [],
      signatures: [],
      content: `<p><code>3.1 在城镇周围破坏土地</code></p>
<blockquote>
<p>玩家<strong>不得在城镇周围破坏土地</strong>。 违反此规则的玩家将会受到<strong>道德的谴责</strong></p>
</blockquote>
<p><code>3.2 在旷野中破坏</code></p>
<blockquote>
<p>Towny 将荒野（Wilderness）定义为目前未有人认领的任何土地。</p>
<p>即使在荒野中，也<strong>不允许破坏玩家修建的铁路</strong>，<strong>不允许破坏玩家修建的建筑</strong></p>
</blockquote>
<p><code>3.3 主要地形改造</code></p>
<blockquote>
<p><strong>不允许对自然地形进行大且丑陋的地形改造。（容易被骂）</strong>这方面的例子包括但不限于：建造大型圆石平台，但实际上无实际功用。</p>
<p><strong>允许进行垂直地形改造。</strong></p>
</blockquote>
<p><code>3.4 地图画</code></p>
<blockquote>
<p><strong>只要不干扰其他城镇，就可以创建地图画。</strong></p>
<p>建议将地图画<strong>放置在无人区</strong>，如果你把它放在无人区之外，你将不得不将地图画放入你的城镇范围，因为如果你周围的其他城镇不喜欢它，它有可能被破坏。</p>
<p>您的地图画<strong>不得包含裸露、色情内容、种族主义图像或任何违反其他规则的内容</strong>。</p>
<p>现在还没有人做地图画，欢迎制作，<strong>如建筑/项目资金不足，可以找zzx对其进行投资</strong></p>
</blockquote>`
    },
    "matopiraphai": {
      title: "Matopiraphai",
      emoji: "📖",
      category: "people",
      excerpt: "人物简介：入服时间：2026年8月8日担任职务：",
      icon: "/icon.png",
      updated: "2026-10-25",
      reading: 1,
      tags: [],
      signatures: [],
      content: `<h2>人物简介：</h2>
<p><strong>入服时间：</strong></p>
<p><strong>2026年8月8日</strong></p>
<p><strong>担任职务：</strong></p>
<p><strong>瑞士联邦委员会（现今自由联邦共同体欧洲大区总代理）主席</strong></p>
<p><strong>人物评价：</strong></p>
<p><strong>欧洲第一财阀，创建了欧洲最大城市，广募建筑师，使欧洲曾经之荒芜之地，发展至今的勃勃生机万物竟发，也曾助力了东北的发展。——zzx</strong></p>
<h2>人物履历</h2>
<p><strong>早期（2026年8月8日~）</strong></p>
<p><strong>中期（）</strong></p>
<p><strong>巅峰（）</strong></p>
<p><strong>末期（）</strong></p>`
    },
    "233-2233": {
      title: "233&2233",
      emoji: "📖",
      category: "people",
      excerpt: "人物简介入服时间2233：2026年5月19日 233...",
      icon: "/icon.png",
      updated: "2026-10-25",
      reading: 1,
      tags: [],
      signatures: [],
      content: `<h2>人物简介</h2>
<p><strong>入服时间</strong></p>
<p><strong>2233：2026年5月19日</strong></p>
<p><strong> 233 ：2026年5月22日</strong></p>
<p><strong>担任职务</strong></p>
<p>2233:曾担任青岛市长、新加坡现任总统</p>
<p>233：朝鲜半岛开拓第一人，担任了，朝鲜人民共和国的首任（现任）主席</p>
<p>曾经还被aba拉去当黑奴 但是给领地权限只给了好友 所以失败了</p>
<p><strong>人物评价</strong></p>
<p>著名的社会活动家、政治家。人民所敬爱的将军\\o/\\o/\\o/—— zzx</p>
<p>柳京饭店缔造者、日内瓦前期交通事业重大贡献者——Matopiraphai</p>
<h2>人物履历</h2>
<p><strong>早期（5月19~）</strong></p>
<p><strong>中期（）</strong></p>
<p><strong>巅峰（）</strong></p>
<p><strong>末期（）</strong></p>`
    },
    "zzx": {
      title: "zzx",
      emoji: "📖",
      category: "people",
      excerpt: "主要事迹：把Alex带进服务器（详见神人堂）连续发展了...",
      icon: "/icon.png",
      updated: "2026-10-25",
      reading: 1,
      tags: [],
      signatures: [],
      content: `<h2>主要事迹：</h2>
<ol class="steps"><li>把Alex带进服务器 （详见神人堂）</li><li>连续发展了哈尔滨长达2.5月(截至26/9/27)</li><li>在日内瓦承建了朝鲜，日本大使馆</li></ol>
<h2>人物简介</h2>
<p><strong>入服时间</strong></p>
<p><strong>2026年7月12日</strong></p>
<p><strong>担任职务</strong></p>
<p><strong>哈尔滨城设计师，振兴东北的领导先锋</strong></p>
<p><strong>人物评价</strong></p>
<h2>东北局局长，服务器最帅之人，想建建筑但是没钱？群里@zzx投资—— zzx</h2>
<p><strong>日内瓦全天候战略合作伙伴，日内瓦中期80%建筑由zzx建设——Matopiraphai</strong></p>
<p><strong>蟠桃快乐——233</strong></p>
<h2>人物履历</h2>
<p><strong>早期（2026.7.12~2026.8.12）</strong></p>
<p><strong>在全服多地流窜，购买材料，修路，在7.13日把Alex带进服务器（详见神人堂）</strong></p>
<p><strong> （2026.8.13~2026.9.25）</strong></p>
<p><strong>在全服务器到处接手建筑订单，拉到大量金额投资，赚得盆满钵满，还开了自己的地下商城</strong></p>
<p><strong>中期（2026.9.25~至今）</strong></p>
<p><strong>于2026/10/7从DPRK叛逃至FU，建设哈尔滨城</strong></p>
<p><strong>于2026/10/18从FU叛逃至泛东北经济同盟</strong></p>
<p><strong>巅峰（）</strong></p>
<p><strong>末期（）</strong></p>`
    },
    "northeast-economic-alliance": {
      title: "泛东北经济同盟",
      emoji: "📖",
      category: "nations",
      excerpt: "此文档在语雀中暂无正文。",
      icon: "/icon.png",
      updated: "2026-10-25",
      reading: 1,
      tags: [],
      signatures: [{"author": "233", "at": "2026-10-25T20:39:34+08:00", "action": "update", "title": "泛东北经济同盟", "topic": "国家/城镇"}, {"author": "233", "at": "2026-10-25T20:43:35+08:00", "action": "update", "title": "泛东北经济同盟", "topic": "国家/城镇"}],
      content: `<h2>zzx成立的国家 以哈尔滨为首府</h2>
<p>据zzx所述：“其实泛东北可以表示地图上的所有国家。</p>
<p>比如朝鲜在威海东北，</p>
<p>所以朝鲜也是泛东北的一员（</p>
<p>新加坡在印尼的东北，</p>
<p>所以新加坡也可以进来。</p>
<p>对了，还有北京。</p>
<p>北京在太原东北，</p>
<p>所以也可以加入。”</p>
<p><strong>震撼首发——233</strong></p>
<p>注：标点符号为编者所加</p>
<h2>你知道吗？这其实是zzx的第2次蟠桃</h2>
<p><strong>由自由联邦共同体（FU）独立而来，详见zzx人物志</strong></p>`
    },
    "harbin-chronicle": {
      title: "哈尔滨地方志",
      emoji: "📖",
      category: "nations",
      excerpt: "详见zzx人物志",
      icon: "/icon.png",
      updated: "2026-10-25",
      reading: 1,
      tags: [],
      signatures: [{"author": "233", "at": "2026-10-25T20:47:38+08:00", "action": "update", "title": "哈尔滨地方志", "topic": "国家/城镇"}],
      content: `<h2>详见zzx人物志</h2>
<p><strong>你知道吗 这个文档原本在朝鲜民主主义人民共和国，后来又改到了自由联邦共同体，现在变成了泛东北经济联盟。</strong></p>`
    },
    "rhodes-island": {
      title: "罗德岛",
      emoji: "📖",
      category: "nations",
      excerpt: "此文档在语雀中暂无正文。",
      icon: "/icon.png",
      updated: "2026-10-25",
      reading: 1,
      tags: [],
      signatures: [{"author": "233", "at": "2026-10-25T20:56:49+08:00", "action": "update", "title": "罗德岛", "topic": "国家/城镇"}],
      content: `<h2>截至撰稿日期（2026.10.25）罗德岛为第二大国家</h2>
<p><strong>其对服务器的影响是巨大的——233</strong></p>
<p>让我们有请罗德岛成员来编辑（</p>`
    },
    "freedom-union": {
      title: "自由联邦共同体 Freedom Union",
      emoji: "📖",
      category: "nations",
      excerpt: "此国家由 瑞士联邦 和 CALIFORNIA 合并而成...",
      icon: "/icon.png",
      updated: "2026-10-25",
      reading: 1,
      tags: [],
      signatures: [],
      content: `<p>此国家由 瑞士联邦 和 CALIFORNIA 合并而成，目前是由盐城的LICE_K担任国家元首，各个成员城市组成联邦委员会，为目前HAPPYDAYS第一大国，共有26人（人员名称太多了，我懒得写awa）</p>
<p>国家发展：以盐城和日内瓦为中心发展</p>
<p>国家成就：1.开创了登山旅行行业，开辟了欧洲荒地，是瑞士成为欧洲与亚洲往来唯一枢纽</p>
<ol class="steps"><li>是亚欧大铁路欧洲段终点，并以此为跳板前往北欧西欧等地区</li><li>开创了服务器房地产行业</li><li>拥有欧洲唯一一个国际机场，以及欧洲唯一前往中国大陆交通方式</li><li>开创了服务器最早的快递物流行业</li><li>拥有全服务器最庞大的经济组织以及中央银行（自联中央银行）</li></ol>`
    },
    "dprk": {
      title: "朝鲜民主主义人民共和国DPRK",
      emoji: "📖",
      category: "nations",
      excerpt: "国家成员：233，zzx(已经叛逃)国家发展：233原...",
      icon: "/icon.png",
      updated: "2026-10-25",
      reading: 1,
      tags: [],
      signatures: [],
      content: `<p>国家成员：233，zzx(已经叛逃)</p>
<p>国家发展：</p>
<p>233原话：当时第1条轨道其实是从日本进口的 从大连接过来的 现在大连到平壤那么绕就是因为这个 然后被4a拆了 还帮忙换成矿车轨道了</p>
<p>国家成就：发展到了300w元，建筑居然是零！</p>
<p><img src="assets/image/dprk/1790489592276-56c0efb6-087d-4d5a-9028-397eb757b968.png" alt="图片" loading="lazy" decoding="async"></p>
<p>26年10月7日更新：</p>
<ol class="steps"><li>zzx蟠桃了</li><li>新建巨型建筑柳京饭店，共51层</li><li>不要叛逃（——zzx</li></ol>
<p>26年10月8日更新：</p>
<ol class="steps"><li>将军指正柳京饭店为55层\\o/\\o/\\o/</li></ol>`
    },
    "ok": {
      title: "OK",
      emoji: "📄",
      category: "godman",
      excerpt: "OK：多次破坏服务器",
      icon: "/icon.png",
      updated: "2026-10-26",
      reading: 5,
      tags: [],
      signatures: [{"author": "233", "at": "2026-10-26T22:28:21+08:00", "action": "create", "title": "OK", "topic": "简介"}, {"author": "233", "at": "2026-10-26T22:28:28+08:00", "action": "update", "title": "OK", "topic": "intro"}, {"author": "233", "at": "2026-10-26T22:28:30+08:00", "action": "update", "title": "OK", "topic": "intro"}, {"author": "233", "at": "2026-10-26T22:28:43+08:00", "action": "move", "title": "OK", "topic": "神人堂", "fromTopic": "简介"}, {"author": "233", "at": "2026-10-26T22:28:50+08:00", "action": "update", "title": "OK", "topic": "godman"}, {"author": "233", "at": "2026-10-26T22:28:51+08:00", "action": "update", "title": "OK", "topic": "godman"}, {"author": "233", "at": "2026-10-26T22:28:53+08:00", "action": "update", "title": "OK", "topic": "godman"}],
      content: `<h2>OK：多次破坏服务器，与南宁的dfdf私下交易(10rmb)，盗取他人账号。曾占据南通和秦皇岛，疯狂挖取主世界钻石。</h2>`
    },
    "qwertyuiop": {
      title: "qwertyuiop",
      emoji: "📖",
      category: "godman",
      excerpt: "神人简介入服时间（魔童降世）2026年8月14日神人评...",
      icon: "/icon.png",
      updated: "2026-10-25",
      reading: 2,
      tags: [],
      signatures: [],
      content: `<h2>神人简介</h2>
<p><strong>入服时间（魔童降世）</strong></p>
<p><strong>2026年8月14日</strong></p>
<p><strong>神人评价</strong></p>
<p><em>亲日的“ ”</em>——zzx</p>
<p>附JINFANBO讨贼檄文：</p>
<h2>神人履历</h2>
<p>进入服务器后加入了张家界，因张家界城主xiaom_m长时间不上线，qwert就顶替xiaom_m成为临时城主，在群内发无用信息，被骂后死性不改，仍旧招摇过市，aba在不知情情况下安慰qwerty，导致aba被骂</p>
<p>整日发布活动，在张家界，武汉，重庆，长沙建矿车站，建的太丑被嫌弃了（</p>
<p>据群内热心市民zzx回忆：有一天起来后，看了眼群有400多条消息，以为群里举办了什么活动，没想到有100条是qwert发的，150多条是骂qwert的<strong>,就此有了这个文档的人物评价</strong></p>
<p>多个账号流窜于 <strong>洛桑，长白山</strong>之间，对多地发展造成影响，且超出了服务器规定的账号数量 ,在26年10月3日，在公屏中发布自己密码，大号被ban（10月4号恢复）国庆前，偷取了联合行省4万余元，被踢出后独立，<strong>欲在桦太立国（库页岛日占时曾用名）称自己为桦太主席，</strong>与联合行省建立敌对关系，在群内骂人，公然挑衅JINFANBO</p>
<p>在q群发表亲日言论，被骂后仍称自己喜爱日本文化，</p>
<p>26年10月6日晚，未经服主允许在群内宣传其他服务器，fox在晚22点16分发起投票，以10:2截止，，后在7号凌晨1点15分4a宣布踢出qwert，其在同日早约八点建立国家，早8点54分其4个qq号和三个游戏号 分别被提出被提出群聊、服务器，创下了存在时间最短国家的记录（</p>`
    },
    "gallery-1": {
      title: "请输入文本（1）",
      emoji: "🖼️",
      category: "gallery",
      excerpt: "妙妙图片集图片记录。",
      icon: "/icon.png",
      updated: "2026-10-25",
      reading: 1,
      tags: [],
      signatures: [],
      content: `<p><img src="assets/image/gallery-1/1790487129758-2ff84a0b-2112-447e-8ab4-6956cd113527.jpeg" alt="图片" loading="lazy" decoding="async"></p>`
    },
    "gallery-2": {
      title: "请输入文本（2）",
      emoji: "🖼️",
      category: "gallery",
      excerpt: "妙妙图片集图片记录。",
      icon: "/icon.png",
      updated: "2026-10-25",
      reading: 1,
      tags: [],
      signatures: [],
      content: `<p><img src="assets/image/gallery-2/1791127683915-48391af4-0c07-4bb6-b1a3-b051fbaef2d9.png" alt="图片" loading="lazy" decoding="async"></p>`
    },
    "1": {
      title: "pingguojushi",
      emoji: "📄",
      category: "people",
      excerpt: "棍木",
      icon: "/icon.png",
      updated: "2026-10-25",
      reading: 5,
      tags: [],
      signatures: [{"author": "苹果居士", "at": "2026-10-25T21:32:05+08:00", "action": "create", "title": "pingguojushi", "topic": "人物志"}, {"author": "苹果居士", "at": "2026-10-25T21:32:35+08:00", "action": "update", "title": "pingguojushi", "topic": "人物志"}],
      content: `<p>##介绍 上海金山镇长</p>`
    },
    "alex": {
      title: "Alex",
      emoji: "📖",
      category: "godman",
      excerpt: "被zzx带进来的神人，进来不到两天就把火车给实体化了，...",
      icon: "/icon.png",
      updated: "2026-10-25",
      reading: 1,
      tags: [],
      signatures: [],
      content: `<p>被zzx带进来的神人，进来不到两天就把火车给实体化了，那个中午是人类史上最黑暗的一个中午。</p>
<p>他凭借一己之力就让服务器的哈鲁线，停运了2~3小时，后面约45天被拆的火车不会停留在长春。</p>
<p>在拆火车的前一天，他在秦皇岛拆车站的金属梁、活板门、砖楼梯等材料，后向土豆解释为缺少建筑材料</p>
<p><strong>望大家引以为戒，不要拆哈尔滨火车，保护铁路人人有责</strong></p>
<p><strong>fish评价：大拆除时代</strong></p>
<p><strong>获得称号：服务器拆火车第一人。</strong></p>`
    },
    "666": {
      title: "666",
      emoji: "🐭",
      category: "godman",
      excerpt: "此人掏走了钻石信标，被土豆审判后ban IP",
      icon: "/icon.png",
      updated: "2026-10-25",
      reading: 5,
      tags: [],
      signatures: [],
      content: `<h3>此人掏走了钻石信标，被土豆审判后ban IP</h3>
<p><em>由于群内消息已被自动删除，而编者的记忆力与鱼相当，所以只记得上面了</em></p>`
    }
  };

  var allIds = [
    "intro", "before-joining", "first-arrival", "shop-plugin", "build-town", "about-nations", "first-money", "resource-world-nether", "senluo-kitchen", "senluo-tavern", "money-making-guide", "lottery", "immersive-vehicles", "town-resources", "cheating-response", "behavior-chat", "world-map", "matopiraphai", "233-2233", "zzx", "northeast-economic-alliance", "harbin-chronicle", "rhodes-island", "freedom-union", "dprk", "ok", "qwertyuiop", "gallery-1", "gallery-2", "1", "alex", "666"
  ];

  return {
    site: {
      name: "HappyDays非官方文档",
      team: "HappyDays 团队",
      tagline: "团队知识库",
      domain: "114.55.99.2:8000",
      language: "zh-CN"
    },
    categories: categories,
    docs: docs,
    allIds: allIds
  };
})();
