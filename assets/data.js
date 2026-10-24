/* =========================================================
   HappyDays非官方文档 — content model
   该文件由 build.py 根据 article/ 自动生成，请勿直接编辑。
   ========================================================= */

window.HAPPYDAYS_WIKI = (function () {
  "use strict";

  var categories = [
    {
      id: "start",
      name: "开始使用",
      description: "第一次来到 HappyDays，从这里开始。",
      docs: ["welcome", "quickstart"]
    },
    {
      id: "product",
      name: "产品手册",
      description: "关于 HappyDays非官方文档的一切使用说明。",
      docs: ["product-guide", "faq", "changelog"]
    },
    {
      id: "team",
      name: "团队协作",
      description: "我们如何沟通、开会和共同写作。",
      docs: ["team-handbook", "design-system"]
    },
    {
      id: "developer",
      name: "开发者",
      description: "把知识库接入你的工作流。",
      docs: ["api-guide"]
    }
  ];

  var docs = {
    "welcome": {
      title: "欢迎来到 HappyDays非官方文档",
      emoji: "🌱",
      category: "start",
      excerpt: "把散落在聊天、会议与脑海里的经验，种成一片随时可以查阅的森林。",
      updated: "2026-10-21",
      reading: 6,
      tags: ["必读", "新成员", "团队文化"],
      content: `<blockquote>
<p><em>HappyDays Handbook · 2026</em></p>
<p><strong>让知识像植物一样生长。</strong></p>
<p>这里收录了 HappyDays 团队的产品方法、协作约定与工程实践。先读这一页，再按你的角色去往对应的知识空间。</p>
<p><a href="#/doc/quickstart">开始探索</a></p>
</blockquote>
<p><strong>8 篇</strong> 核心文档 · <strong>4 个</strong> 知识空间 · <strong>每周</strong> 持续更新</p>
<h2>一座会生长的知识库</h2>
<p>HappyDays 是一支相信「好产品来自好协作」的小团队。我们把产品决策、设计原则、工程约定和踩过的坑都留在这里，不是为了归档，而是为了让下一个人少走一点弯路。</p>
<p>这座知识库有三个简单的目标：让新成员<strong>第一天就能自助</strong>，让协作中的共识<strong>有迹可循</strong>，让每个人都能把自己的经验<strong>变成团队资产</strong>。</p>
<div class="callout callout--tip">
<span class="callout-icon"><svg class="icon" aria-hidden="true"><use href="#i-bulb"></use></svg></span>
<div class="callout-content">
<p class="callout-title">第一次来？先花 5 分钟</p><p>阅读<a href="#/doc/quickstart">《快速开始》</a>，完成登录、找到自己的团队空间，并写下第一篇文档。其余的，可以在需要时再查。</p>
</div>
</div>
<h2>选择你的起点</h2>
<p>无论你是产品、设计、研发还是运营，都可以从下面三条路径之一进入。不必按顺序读完，按你手头的问题去找答案。</p>
<ul><li>🚀 <a href="#/doc/quickstart">我是新成员</a> — 用 5 分钟完成设置，认识编辑器，写下第一篇文档。</li><li>🤝 <a href="#/doc/team-handbook">我刚加入团队</a> — 了解我们的沟通方式、会议原则，以及如何给反馈。</li><li>📘 <a href="#/doc/product-guide">我想用得更熟练</a> — 掌握文档组织、权限设置和让知识保持鲜活的技巧。</li></ul>
<h2>知识地图</h2>
<p>四个空间各司其职。找不到某篇文档时，先判断它回答的是「怎么用」「怎么做」还是「为什么」，通常就能定位到正确的空间。</p>
<div class="table-wrap"><table><thead><tr><th>知识空间</th><th>适合谁</th><th>你会在这里找到</th></tr></thead><tbody><tr><td><strong>开始使用</strong></td><td>新成员、访客</td><td>账号设置、第一篇文档、核心概念</td></tr><tr><td><strong>产品手册</strong></td><td>所有使用者</td><td>功能说明、权限模型、常见问题、更新日志</td></tr><tr><td><strong>团队协作</strong></td><td>HappyDays 成员</td><td>协作约定、会议规范、设计语言与写作风格</td></tr><tr><td><strong>开发者</strong></td><td>工程与自动化同学</td><td>API 认证、资源接口、Webhook 与错误处理</td></tr></tbody></table></div>
<h2>我们的写作约定</h2>
<p>好的文档不追求长，而追求<strong>下一次被找到时仍然有效</strong>。写之前，请记住这四条约定。</p>
<h3>用问题做标题</h3>
<p><em>01 / PROBLEM</em></p>
<p>「如何申请新知识库」比「知识库管理」更容易被搜索，也更容易判断是否相关。</p>
<h3>先结论，后展开</h3>
<p><em>02 / ANSWER</em></p>
<p>开头三行给出答案或操作路径，细节、背景和例外情况放在后面。</p>
<h3>用例子代替形容词</h3>
<p><em>03 / EXAMPLE</em></p>
<p>与其说「配置很简单」，不如贴一段真实示例，让读者自己判断。</p>
<h3>留下维护者</h3>
<p><em>04 / OWNER</em></p>
<p>每篇文档至少有一位维护者。内容过期时，知道该找谁，比「最新更新」更有用。</p>
<blockquote>
<p>知识不是写出来的，是在被使用、被质疑、被更新的过程中长出来的。</p>
</blockquote>
<h2>需要帮助</h2>
<p>如果这篇文档没有回答你的问题，可以先在<a href="#/doc/faq">常见问题</a>中找找；仍然卡住，就到 <code>#wiki-help</code> 频道提问，并附上你所在的页面与操作步骤。</p>
<h3>发现内容过期？</h3>
<p>在页面底部选择「需改进」，或直接在评论区 @ 文档维护者。我们会在一周内确认并更新。</p>
<h3>想补充一篇？</h3>
<p>任何成员都可以创建草稿。先在对应空间写清楚，再邀请一位相关同学做第一次评审。</p>
<p><em>最后更新：2026 年 10 月 21 日</em></p>`
    },
    "quickstart": {
      title: "快速开始",
      emoji: "🚀",
      category: "start",
      excerpt: "5 分钟完成账号设置、加入空间，并写下你的第一篇团队文档。",
      updated: "2026-10-18",
      reading: 4,
      tags: ["新手指南", "5 分钟"],
      content: `<p>欢迎加入 HappyDays。这篇指南不介绍所有功能，只带你完成三件最重要的事：<strong>进来、写下、分享出去</strong>。</p>
<div class="callout callout--note">
<span class="callout-icon"><svg class="icon" aria-hidden="true"><use href="#i-info"></use></svg></span>
<div class="callout-content">
<p class="callout-title">预计用时 5 分钟</p><p>建议在桌面端浏览器中完成。你需要一个团队邮箱，以及管理员发出的邀请链接。</p>
</div>
</div>
<h2>1. 登录并加入空间</h2>
<ol class="steps"><li><strong>打开邀请链接</strong><p>点击邮件或群聊中的邀请链接，使用团队邮箱登录。首次登录会自动创建账号，无需单独注册。</p></li><li><strong>确认你的角色</strong><p>默认加入「HappyDays 团队」空间，角色为成员。角色决定你能否邀请他人和管理知识库，可随时由管理员调整。</p></li><li><strong>完善个人资料</strong><p>在左下角头像处设置昵称和职位。写清楚「你是谁、在做什么」，能帮助同事在评论中更快找到你。</p></li></ol>
<h2>2. 写下第一篇文档</h2>
<p>进入「开始使用」空间，点击右上角的<strong>新建文档</strong>。不要从空白页开始纠结格式，先把你知道的写下来。</p>
<h3>一个够用的文档骨架</h3>
<p>标题写清楚问题 → 开头三行给结论 → 中间展开步骤 → 结尾留下维护者和更新时间。</p>
<h3>先让它存在，再让它好看</h3>
<p>标题、列表和代码块足以表达大部分内容。排版和配图可以在内容被验证之后再补。</p>
<p>试着用这个结构写一篇真实的文档，例如「本周发布流程」或「如何申请测试账号」：</p>
<div class="code-block" data-lang="markdown">
<div class="code-head">
<span class="code-language"><span class="code-dots" aria-hidden="true"><i></i><i></i><i></i></span>Markdown</span>
<button class="code-copy" type="button"><svg class="icon" aria-hidden="true"><use href="#i-copy"></use></svg>复制</button>
</div>
<pre><code># 如何申请测试账号

结论：在「研发支持」知识库填写申请表，通常 1 个工作日内开通。

## 申请步骤
1. 打开申请表
2. 填写项目、环境与使用周期
3. 提交后在群里 @ 值班同学

## 维护者
- 最近更新：2026-10-18</code></pre>
</div>
<h2>3. 用快捷键提速</h2>
<p>编辑器支持 Markdown 快捷输入和斜杠命令。记住下面这几个，就足够覆盖大部分写作场景。</p>
<div class="table-wrap"><table><thead><tr><th>操作</th><th>快捷键</th><th>说明</th></tr></thead><tbody><tr><td>搜索知识库</td><td><code>Ctrl / ⌘ + K</code></td><td>从任意页面唤起全局搜索</td></tr><tr><td>加粗选中文字</td><td><code>Ctrl / ⌘ + B</code></td><td>也可以输入 <code>**文本**</code></td></tr><tr><td>插入内容块</td><td><code>/</code></td><td>输入 / 后选择标题、表格、代码块等</td></tr><tr><td>保存草稿</td><td><code>Ctrl / ⌘ + S</code></td><td>自动保存已开启，手动保存更安心</td></tr><tr><td>发布文档</td><td><code>Ctrl / ⌘ + Enter</code></td><td>发布前可以设置可见范围</td></tr></tbody></table></div>
<div class="callout callout--warning">
<span class="callout-icon"><svg class="icon" aria-hidden="true"><use href="#i-alert"></use></svg></span>
<div class="callout-content">
<p class="callout-title">发布前检查可见范围</p><p>草稿仅自己可见；发布到空间后，空间成员可以查看。选择「互联网可见」前，请确认文档不含内部链接、客户信息或未公开数据。</p>
</div>
</div>
<h2>4. 发布与分享</h2>
<p>点击右上角的<strong>发布</strong>，选择目标知识库和可见范围。发布后，你可以复制页面链接，或使用「分享」生成带权限的有效链接。</p>
<ul><li>标题能让同事一眼判断内容是否相关</li><li>开头写清结论和适用对象</li><li>至少添加一个标签，方便横向检索</li><li>指定一位维护者，并写明如何联系</li></ul>
<p>发布不是结束。被引用、被评论、被更新，才是一篇文档真正开始工作的时候。</p>
<h2>接下来</h2>
<ul><li>📘 <a href="#/doc/product-guide">产品使用指南</a> — 深入了解文档组织、权限模型与协作能力。</li><li>🤝 <a href="#/doc/team-handbook">团队协作手册</a> — 了解我们如何沟通、开会和给彼此反馈。</li></ul>`
    },
    "product-guide": {
      title: "产品使用指南",
      emoji: "📘",
      category: "product",
      excerpt: "从编辑、组织到发布，系统掌握 HappyDays非官方文档的核心工作流。",
      updated: "2026-10-19",
      reading: 12,
      tags: ["产品", "使用指南", "权限"],
      content: `<p>HappyDays非官方文档的核心只有一件事：<strong>让团队知识在被需要的时候，出现在正确的人面前</strong>。这篇指南覆盖从写下一段文字，到让它持续被使用的完整路径。</p>
<h2>文档的生命周期</h2>
<p>每篇文档都会经历草稿、发布和归档三个阶段。理解它们，可以避免「写了没人看」和「过期内容被误用」。</p>
<div class="table-wrap"><table><thead><tr><th>状态</th><th>谁可以查看</th><th>适合放什么</th></tr></thead><tbody><tr><td><strong>草稿</strong></td><td>创建者与协作者</td><td>尚未验证的想法、半成品、个人笔记</td></tr><tr><td><strong>已发布</strong></td><td>按可见范围决定</td><td>可被依赖的流程、说明、决策记录</td></tr><tr><td><strong>已归档</strong></td><td>保留可查，默认不展示</td><td>已被替代的方案、阶段性项目材料</td></tr></tbody></table></div>
<p>当一篇文档被新版本取代时，优先<strong>归档旧文档并在开头加上指向新版本的链接</strong>，而不是直接删除。历史链接不应该变成死路。</p>
<h2>编辑器：像搭积木一样写作</h2>
<p>编辑器以「块」为基本单位。一段文字、一个标题、一张表格、一段代码，都是可以独立移动和变换的块。</p>
<h3>斜杠命令</h3>
<p>在空行输入 <code>/</code>，即可打开内容块菜单。常用命令包括 <code>/h2</code>、<code>/table</code>、<code>/code</code>、<code>/callout</code> 和 <code>/divider</code>。继续输入关键词可以快速筛选。</p>
<h3>拖拽与分栏</h3>
<p>将鼠标移到块左侧，拖动六点手柄即可调整顺序；把一张图片拖到另一张图片旁边，会自动形成分栏。分栏适合对比方案，不建议用来做复杂页面排版。</p>
<h3>粘贴与导入</h3>
<p>从 Word、Notion 或网页粘贴内容时，编辑器会尽量保留标题、列表和表格结构。复杂样式会被清理，这通常是一件好事：<strong>内容应该适应阅读，而不是适应来源。</strong></p>
<div class="callout callout--tip">
<span class="callout-icon"><svg class="icon" aria-hidden="true"><use href="#i-bulb"></use></svg></span>
<div class="callout-content">
<p class="callout-title">写作时先关闭「排版模式」</p><p>先把信息写完整，再统一调整标题层级和强调。过早纠结样式，通常会让内容变得空泛。</p>
</div>
</div>
<h2>组织你的知识库</h2>
<h3>用目录树建立骨架</h3>
<p>目录树回答「我在哪、接下来该读什么」。一个知识库建议不超过三层，每层使用一致的命名方式。避免按部门建目录，优先按<strong>读者要解决的问题</strong>组织。</p>
<h3>用标签做横向连接</h3>
<p>目录是纵向的，标签是横向的。给文档添加「新手指南」「API」「SOP」等稳定标签，可以把分散在不同目录中的相关内容聚合起来。标签不要超过 3 个，也不要创造同义标签。</p>
<h3>建立双向链接</h3>
<p>在正文中输入 <code>@</code> 并选择另一篇文档，就能建立引用。当文档被引用时，原文的「反向链接」区域会显示来源。这比复制链接更有生命力，因为读者可以看见上下文。</p>
<h2>权限与分享</h2>
<p>HappyDays 使用「空间角色 + 文档可见范围」两层权限模型。先由空间角色决定基础能力，再由每篇文档控制更细的可见性。</p>
<div class="table-wrap"><table><thead><tr><th>角色</th><th>查看</th><th>评论</th><th>编辑</th><th>管理</th></tr></thead><tbody><tr><td><strong>访客</strong></td><td>仅被分享的文档</td><td>可选</td><td>—</td><td>—</td></tr><tr><td><strong>成员</strong></td><td>空间内文档</td><td>✓</td><td>✓</td><td>—</td></tr><tr><td><strong>管理员</strong></td><td>全部文档</td><td>✓</td><td>✓</td><td>✓</td></tr></tbody></table></div>
<h3>链接分享的三种范围</h3>
<ul><li><strong>空间内可见：</strong>默认选项，适合绝大多数内部文档。</li><li><strong>获得链接的人可见：</strong>适合外部合作伙伴，建议同时设置有效期。</li><li><strong>互联网公开：</strong>仅用于帮助中心、公开规范等确定可以公开的内容。</li></ul>
<div class="callout callout--warning">
<span class="callout-icon"><svg class="icon" aria-hidden="true"><use href="#i-alert"></use></svg></span>
<div class="callout-content">
<p class="callout-title">导出不会带走权限</p><p>拥有编辑权限的成员可以导出 PDF 或 Markdown。导出前请确认接收方可信，尤其是包含客户信息、价格策略或未发布计划的内容。</p>
</div>
</div>
<h2>让文档保持可维护</h2>
<p>知识库最大的成本不是写作，而是<strong>维护</strong>。下面这些习惯能显著延长一篇文档的保质期：</p>
<ul><li>开头注明适用对象、前置条件和最后更新时间</li><li>把易变的信息（价格、人员、链接）集中放在一处</li><li>为每篇文档指定唯一维护者，而不是「产品组」</li><li>用评论和「需改进」反馈建立定期清理机制</li><li>每季度抽查访问量高但长期未更新的文档</li></ul>
<h2>快捷键速查</h2>
<div class="table-wrap"><table><thead><tr><th>动作</th><th>Windows / Linux</th><th>macOS</th></tr></thead><tbody><tr><td>全局搜索</td><td><code>Ctrl + K</code></td><td><code>⌘ + K</code></td></tr><tr><td>保存</td><td><code>Ctrl + S</code></td><td><code>⌘ + S</code></td></tr><tr><td>加粗 / 斜体</td><td><code>Ctrl + B / I</code></td><td><code>⌘ + B / I</code></td></tr><tr><td>插入链接</td><td><code>Ctrl + K（选中文本）</code></td><td><code>⌘ + K（选中文本）</code></td></tr><tr><td>撤销 / 重做</td><td><code>Ctrl + Z / Shift + Z</code></td><td><code>⌘ + Z / Shift + Z</code></td></tr><tr><td>发布</td><td><code>Ctrl + Enter</code></td><td><code>⌘ + Enter</code></td></tr></tbody></table></div>
<p><em>遇到这里没有覆盖的问题？查看<a href="#/doc/faq">常见问题</a>，或在页面底部提交反馈。</em></p>`
    },
    "faq": {
      title: "常见问题",
      emoji: "💡",
      category: "product",
      excerpt: "关于账号、权限、导入导出与协作的常见疑问，先在这里找找答案。",
      updated: "2026-10-16",
      reading: 5,
      tags: ["FAQ", "支持"],
      content: `<p>我们整理了团队最常遇到的问题。如果答案没有覆盖你的情况，请在 <code>#wiki-help</code> 频道留言，附上页面链接和操作步骤。</p>
<h2>账号与登录</h2>
<h3>忘记密码怎么办？</h3>
<p>在登录页点击「使用邮箱登录」，输入账号邮箱后选择「忘记密码」。系统会发送一封重置邮件，链接 30 分钟内有效。</p>
<p>如果邮件没有到达，请检查垃圾邮件箱，或联系空间管理员在成员管理中重新发送邀请。</p>
<h3>可以用个人邮箱加入团队吗？</h3>
<p>可以。邀请链接不限制邮箱域名，但出于安全考虑，管理员可以开启「仅允许团队域名加入」。开启后，个人邮箱需要通过管理员手动审批。</p>
<h3>如何切换或退出当前空间？</h3>
<p>点击左下角头像，在空间列表中选择其他团队。退出空间入口位于「账号设置 → 空间与权限」，退出后需要新的邀请才能重新加入。</p>
<h2>文档与权限</h2>
<h3>为什么我看不到同事分享的文档？</h3>
<p>请依次确认：链接是否完整、你是否已加入对应空间、文档是否仍处于发布状态。若链接设置了有效期或访问密码，需要向分享者获取。</p>
<p>仍然无法访问时，请让文档所有者检查「分享 → 链接权限」中的设置。</p>
<h3>访客和成员有什么区别？</h3>
<p>成员可以浏览空间内所有文档并参与编辑；访客只能查看被明确分享的页面，通常无法进入空间目录。外部合作伙伴一般使用访客角色。</p>
<h3>文档历史版本能保留多久？</h3>
<p>发布版文档的自动历史保留 90 天，每次手动保存会生成一个可命名版本。归档文档的历史会随文档一起保留，删除文档后历史进入回收站，保留 30 天。</p>
<h2>迁移与导出</h2>
<h3>如何把 Word 或 Notion 内容迁入？</h3>
<p>单篇文档可以直接复制粘贴，标题、列表和表格会尽量保留。批量迁移请使用「设置 → 导入」上传 .docx 或 Markdown 压缩包，导入任务完成后会生成一份迁移报告。</p>
<p>图片会自动上传到空间附件库；复杂排版可能需要手动整理。</p>
<h3>能否把整个知识库导出？</h3>
<p>空间管理员可以在「空间设置 → 数据与导出」中申请全量导出，格式为 Markdown + 附件。导出任务通常在 10 分钟内完成，下载链接有效期为 24 小时。</p>
<p>请遵守团队的数据安全约定，不要将内部知识库导出到未授权设备。</p>
<h3>是否支持离线阅读？</h3>
<p>桌面客户端会缓存最近打开的文档，断网时仍可阅读，但编辑内容需要恢复网络后才能同步。浏览器端暂不支持完整离线模式。</p>
<h2>还有别的问题？</h2>
<p>你可以在 <code>#wiki-help</code> 频道提问，或直接联系空间管理员。提问时请提供：<strong>所在页面链接、你期望发生什么、实际发生了什么</strong>。这三项信息能帮我们更快定位问题。</p>
<div class="callout callout--tip">
<span class="callout-icon"><svg class="icon" aria-hidden="true"><use href="#i-bulb"></use></svg></span>
<div class="callout-content">
<p class="callout-title">一个提问的小技巧</p><p>不要只写「文档打不开」。附上截图、浏览器版本和最近一次成功访问的时间，能减少一半的来回沟通。</p>
</div>
</div>`
    },
    "changelog": {
      title: "更新日志",
      emoji: "🧭",
      category: "product",
      excerpt: "记录每一次值得被看见的改进，以及我们为什么这样改。",
      updated: "2026-10-22",
      reading: 3,
      tags: ["更新", "产品动态"],
      content: `<p>HappyDays 每两周发布一次功能更新。这里记录新增能力、体验改进和重要修复。我们也会说明改动背后的判断，方便你决定是否采用。</p>
<h2>2026 年 10 月</h2>
<h3>文档关系图，看见知识之间的连接</h3>
<p><code>2026.10.22</code> · <strong>最新</strong></p>
<p>在知识库右上角打开「关系图」，可以查看文档之间的引用与反向链接。点击节点快速跳转，悬停可预览摘要。关系图默认只展示当前空间，适合在整理知识库时发现孤岛文档。</p>
<p><code>新功能</code> · <code>知识组织</code></p>
<h3>分享链接支持有效期与访问密码</h3>
<p><code>2026.10.09</code></p>
<p>对外分享时，可以为链接设置 1 天、7 天或 30 天的有效期，并添加访问密码。密码只保存在创建者处，管理员可在审计日志中查看链接状态。</p>
<p><code>改进</code> · <code>权限</code></p>
<h2>2026 年 9 月</h2>
<h3>编辑器支持 Markdown 双向同步</h3>
<p><code>2026.09.24</code></p>
<p>在设置中开启后，可以用任意 Markdown 编辑器打开本地文件，保存时自动同步回 HappyDays。冲突时以最后保存的版本为准，并保留历史快照。</p>
<p><code>新功能</code> · <code>编辑器</code></p>
<h3>图片附件按空间统一管理</h3>
<p><code>2026.09.11</code></p>
<p>所有粘贴、上传的图片现在都存放在空间附件库中，支持按文档筛选和批量清理未引用文件。删除文档时，图片不会立即删除，避免误伤其他引用。</p>
<p><code>改进</code> · <code>附件</code></p>
<h2>2026 年 8 月</h2>
<h3>修复搜索结果排序异常</h3>
<p><code>2026.08.28</code></p>
<p>修复了标题完全匹配的文档未排在前列的问题，并降低已归档文档的搜索权重。现在搜索「权限」时，权限模型说明会稳定出现在前三条。</p>
<p><code>修复</code> · <code>搜索</code></p>
<h3>更安静的自动保存提示</h3>
<p><code>2026.08.07</code></p>
<p>保存状态从顶部常驻提示改为按需出现，并缩短了成功提示的停留时间。编辑长文时，界面不会再频繁闪动。</p>
<p><code>体验</code> · <code>编辑器</code></p>
<h2>反馈与建议</h2>
<p>更新日志没有覆盖你关心的能力？在 <code>#product-feedback</code> 频道告诉我们你正在解决的问题，而不只是功能名称。我们会每周整理一次，并在月度路线图评审中讨论。</p>
<div class="callout callout--note">
<span class="callout-icon"><svg class="icon" aria-hidden="true"><use href="#i-info"></use></svg></span>
<div class="callout-content">
<p class="callout-title">关于版本号</p><p>HappyDays 采用日期版本，不对外发布语义化版本号。这样能减少「版本号很大但变化很小」带来的沟通成本。</p>
</div>
</div>`
    },
    "team-handbook": {
      title: "团队协作手册",
      emoji: "🤝",
      category: "team",
      excerpt: "我们的沟通方式、会议原则、文档文化与反馈习惯。",
      updated: "2026-10-12",
      reading: 9,
      tags: ["团队文化", "协作", "必读"],
      content: `<p>协作不是多开会，而是让信息在对的时候到达对的人。这份手册描述的是 HappyDays <strong>默认的工作方式</strong>，它不是规则手册，而是帮助我们减少重复解释的共同语言。</p>
<blockquote>
<p>「把话说清楚，是成本最低的善意。」</p>
<p>— HappyDays 团队协作原则第一条</p>
</blockquote>
<h2>沟通的四个默认</h2>
<p>遇到不确定时，按下面的默认选项行动。默认值不是永远正确，但它能减少大量「这个要不要同步」的犹豫。</p>
<h3>默认公开</h3>
<p><em>DEFAULT 01</em></p>
<p>除非涉及隐私、安全或未公开信息，讨论和文档默认对团队可见。公开不是打扰，是给未来的人留下上下文。</p>
<h3>默认书面</h3>
<p><em>DEFAULT 02</em></p>
<p>重要结论、决策原因和待办事项落在文档里。聊天适合讨论，文档负责记住。</p>
<h3>默认给上下文</h3>
<p><em>DEFAULT 03</em></p>
<p>请求别人帮忙时，说明背景、你已经尝试过什么、期望得到什么。不要只发一个「在吗」。</p>
<h3>默认说结论</h3>
<p><em>DEFAULT 04</em></p>
<p>先给判断和建议，再解释过程。读者可以自行决定深入哪一部分，而不是陪你把整条路再走一遍。</p>
<h2>会议：异步优先</h2>
<p>在预约会议之前，先问自己：<strong>这件事能不能用一篇文档或一条结构化消息解决？</strong>如果信息只是单向传递，异步通常更高效；只有当需要实时碰撞、做出取舍或处理分歧时，才值得占用所有人的时间。</p>
<div class="table-wrap"><table><thead><tr><th>会议类型</th><th>目标</th><th>建议时长</th><th>必须产出</th></tr></thead><tbody><tr><td><strong>周会</strong></td><td>同步进展与阻塞</td><td>30 分钟</td><td>三个风险 + 本周优先级</td></tr><tr><td><strong>方案评审</strong></td><td>做取舍，而不是展示</td><td>45 分钟</td><td>明确决定、负责人、截止时间</td></tr><tr><td><strong>复盘</strong></td><td>理解系统性问题</td><td>60 分钟</td><td>可验证的改进项</td></tr><tr><td><strong>一对一</strong></td><td>反馈、成长与状态</td><td>30 分钟</td><td>双方各一个行动项</td></tr></tbody></table></div>
<h3>开会前的三件事</h3>
<ul><li>提前 24 小时发出议程，写明需要谁做什么决定</li><li>把背景材料放进文档，会上不再逐页朗读</li><li>指定记录人，会议结束前确认行动项和负责人</li></ul>
<h2>文档文化</h2>
<p>文档是 HappyDays 的默认记忆载体。我们不用文档数量衡量产出，而是看它是否<strong>减少了重复沟通、支持了决策或帮助了新成员</strong>。</p>
<h3>三种常用文档</h3>
<div class="table-wrap"><table><thead><tr><th>类型</th><th>回答的问题</th><th>典型例子</th></tr></thead><tbody><tr><td><strong>决策记录</strong></td><td>我们决定了什么，为什么？</td><td>为什么暂时不做移动端</td></tr><tr><td><strong>操作指南</strong></td><td>这件事具体怎么做？</td><td>发布流程、故障排查手册</td></tr><tr><td><strong>方案 RFC</strong></td><td>有哪些选项，建议选哪个？</td><td>权限模型重构方案</td></tr></tbody></table></div>
<h3>评审与反馈</h3>
<p>文档评审关注三件事：结论是否清楚、假设是否成立、维护成本是否可接受。不要从错别字开始，也不要把个人偏好包装成「最佳实践」。</p>
<p>给出反馈时，可以用 SBI 结构，让讨论聚焦在具体行为上：</p>
<div class="table-wrap"><table><thead><tr><th>要素</th><th>含义</th><th>示例</th></tr></thead><tbody><tr><td><strong>S · Situation</strong></td><td>在什么场景下</td><td>昨天评审新权限方案时</td></tr><tr><td><strong>B · Behavior</strong></td><td>你观察到了什么</td><td>文档只列了方案，没有写被否掉的选项</td></tr><tr><td><strong>I · Impact</strong></td><td>带来了什么影响</td><td>新同学无法判断为什么选这个方向</td></tr></tbody></table></div>
<h2>新同学的前 30 天</h2>
<ol class="steps"><li><strong>第 1 周：理解问题，而不是背答案</strong><p>读完本手册与所在空间的核心文档，约三位同事各聊 30 分钟。把听不懂的名词记下来，它们通常是知识库最该补的地方。</p></li><li><strong>第 2–3 周：完成一个真实的小任务</strong><p>从需求到交付完整走一遍流程。遇到卡点时先查文档，再把缺失的部分补回文档。这是对新成员最友好的贡献方式。</p></li><li><strong>第 4 周：做一次反向分享</strong><p>以新成员视角做一次 15 分钟分享：哪里让你困惑、哪篇文档帮助最大、哪些流程可以更简单。没有批评，只有观察。</p></li></ol>
<h2>一页团队约定</h2>
<ul><li>重要决定写进文档，并在相关频道留下链接</li><li>会议不超过 5 人，超过时考虑拆分或改为异步</li><li>在 24 小时内回复需要你做决定的消息</li><li>不同意时直接说，并给出你担心的具体风险</li><li>发现文档过期，顺手修一行，或 @ 维护者</li><li>不把「我以为」当作共识，重要假设要写下来</li></ul>
<p><em>这份手册由团队共同维护。如果你觉得某条约定已经不再适用，请发起一次讨论，而不是默默绕过它。</em></p>`
    },
    "design-system": {
      title: "设计规范",
      emoji: "🎨",
      category: "team",
      excerpt: "HappyDays 产品的色彩、字体、间距与组件使用准则，让界面保持安静而清晰。",
      updated: "2026-10-15",
      reading: 11,
      tags: ["设计", "Design System", "规范"],
      content: `<p>HappyDays 的设计不追求第一眼的惊艳，而追求<strong>长时间的安静</strong>。我们希望用户把注意力放在内容上，而不是界面上。这份规范记录了我们做取舍时依据的原则。</p>
<h2>设计原则</h2>
<h3>内容优先</h3>
<p><em>PRINCIPLE 01</em></p>
<p>界面元素应让位于内容。能删掉的装饰就删掉，能降低的对比度就不要抢标题的注意力。</p>
<h3>清晰胜过聪明</h3>
<p><em>PRINCIPLE 02</em></p>
<p>不要用隐藏手势或模糊文案制造「高级感」。用户第一次使用就能理解，才是真正的效率。</p>
<h3>一致但不僵化</h3>
<p><em>PRINCIPLE 03</em></p>
<p>相同含义使用相同样式；当场景确实不同，允许有理由的例外，并记录在案。</p>
<h3>留白也是信息</h3>
<p><em>PRINCIPLE 04</em></p>
<p>空间让关系变得可读。不要把屏幕填满，给阅读和思考留下呼吸的位置。</p>
<h2>色彩</h2>
<p>主色是「HappyDays 绿」，来自植物抽芽的颜色，用于主要操作、选中状态和品牌识别。中性色承担绝大多数界面，避免整页被绿色淹没。</p>
<div class="table-wrap"><table><thead><tr><th>色彩</th><th>色值</th></tr></thead><tbody><tr><td>HappyDays 绿 / Primary</td><td><code>#0A9B69</code></td></tr><tr><td>深绿 / Strong</td><td><code>#06764F</code></td></tr><tr><td>浅绿 / Soft</td><td><code>#EAF7F1</code></td></tr><tr><td>墨色 / Ink</td><td><code>#1C2822</code></td></tr><tr><td>次级文字 / Muted</td><td><code>#5C6B62</code></td></tr><tr><td>纸白 / Paper</td><td><code>#FFFFFF</code></td></tr><tr><td>雾白 / Mist</td><td><code>#F8FAF8</code></td></tr><tr><td>边界 / Border</td><td><code>#E8EDE9</code></td></tr><tr><td>麦穗 / Accent</td><td><code>#CF9214</code></td></tr><tr><td>警示 / Danger</td><td><code>#C2554D</code></td></tr></tbody></table></div>
<div class="callout callout--note">
<span class="callout-icon"><svg class="icon" aria-hidden="true"><use href="#i-info"></use></svg></span>
<div class="callout-content">
<p class="callout-title">对比度是底线</p><p>正文文本与背景的对比度不低于 4.5:1，大号标题不低于 3:1。绿色只用于点缀和操作，不要用浅绿色承载关键信息文本。</p>
</div>
</div>
<h2>字体</h2>
<p>界面使用系统无衬线字体，保证中文在不同设备上的一致性。标题通过字重和字距建立层级，不依赖大字号或彩色。</p>
<div class="table-wrap"><table><thead><tr><th>示例</th><th>规格</th></tr></thead><tbody><tr><td>HappyDays</td><td><code>40 / 750 / -0.045em</code></td></tr><tr><td>让知识自然生长</td><td><code>24 / 700 / -0.03em</code></td></tr><tr><td>正文保持 1.8 倍行高，适合中文长文阅读。</td><td><code>15.5 / 400 / 1.86</code></td></tr><tr><td>辅助说明使用 11px，保持克制，不抢正文。</td><td><code>11 / 400 / 1.6</code></td></tr></tbody></table></div>
<p>引语与长段落可以偶尔使用衬线字体（宋体）增加节奏变化，但不要用于操作界面或短标签。</p>
<h2>间距与圆角</h2>
<p>我们以 4px 为基本单位，常用间距为 4、8、12、16、24、32、48。不要出现 7px、13px 这样的任意值，除非是光学对齐。</p>
<div class="table-wrap"><table><thead><tr><th>Token</th><th>值</th><th>使用场景</th></tr></thead><tbody><tr><td><code>space-1</code></td><td>4px</td><td>图标与文字、紧凑元素之间</td></tr><tr><td><code>space-3</code></td><td>12px</td><td>卡片内边距、按钮组间距</td></tr><tr><td><code>space-4</code></td><td>16px</td><td>常规卡片内边距、段落间距</td></tr><tr><td><code>space-6</code></td><td>24px</td><td>区块内边距、标题上方间距</td></tr><tr><td><code>radius-sm</code></td><td>7px</td><td>按钮、标签、输入框</td></tr><tr><td><code>radius-md</code></td><td>11px</td><td>卡片、提示框、代码块</td></tr><tr><td><code>radius-lg</code></td><td>16px</td><td>弹窗、大型容器</td></tr></tbody></table></div>
<h2>组件</h2>
<p>组件首先服务于清晰，其次才是美观。一个按钮只能有一个主要动作，次要动作用描边或低饱和背景表达。</p>
<blockquote>
<p>组件示例：<strong>主要操作</strong> · <strong>次要操作</strong> · <strong>轻量操作</strong></p>
</blockquote>
<h3>状态必须可感知</h3>
<p>悬停、聚焦、禁用、加载中，都要有明确且不突兀的视觉反馈。尤其是键盘聚焦，必须保留可见的焦点环，不能为了「干净」而移除。</p>
<h3>动效服务于理解</h3>
<p>动效用于解释元素从哪里来、到哪里去，时长控制在 150–300ms。不要让页面在每次切换时整体飞入，也不要让用户等待动画结束。</p>
<h2>可访问性</h2>
<ul><li>所有操作都可以通过键盘完成，焦点顺序符合视觉顺序</li><li>图标按钮必须提供可读的 aria-label</li><li>不仅用颜色表达状态，同时提供文字或图形线索</li><li>支持系统「减少动态效果」偏好</li><li>在 200% 缩放下，内容仍然完整可读</li></ul>
<p><em>规范不是限制创造力的围墙，而是让不同的人做出协调选择的共同坐标系。有例外时，请说明理由，并更新这份文档。</em></p>`
    },
    "api-guide": {
      title: "API 接入指南",
      emoji: "⌘",
      category: "developer",
      excerpt: "通过 REST API 读取文档、同步内容，并把 HappyDays非官方文档接入你的工作流。",
      updated: "2026-10-20",
      reading: 10,
      tags: ["API", "开发", "Webhook"],
      content: `<p>HappyDays 公开 API 采用 REST 风格，请求与响应均为 JSON。你可以读取知识库目录、创建草稿、同步外部内容，或通过 Webhook 接收文档变更事件。</p>
<div class="callout callout--note">
<span class="callout-icon"><svg class="icon" aria-hidden="true"><use href="#i-info"></use></svg></span>
<div class="callout-content">
<p class="callout-title">基础地址</p><p>所有接口以 <code>https://api.happydays.wiki/v1</code> 为前缀。示例中的令牌仅作演示，请勿把真实密钥写入代码仓库。</p>
</div>
</div>
<h2>认证</h2>
<p>在「空间设置 → 开发者 → API 令牌」中创建令牌，并通过 <code>Authorization</code> 请求头传递。令牌继承创建者的权限，建议为每个集成单独创建，并遵循最小权限原则。</p>
<div class="code-block" data-lang="bash">
<div class="code-head">
<span class="code-language"><span class="code-dots" aria-hidden="true"><i></i><i></i><i></i></span>Bash</span>
<button class="code-copy" type="button"><svg class="icon" aria-hidden="true"><use href="#i-copy"></use></svg>复制</button>
</div>
<pre><code>curl https://api.happydays.wiki/v1/docs \\
  -H "Authorization: Bearer $HAPPYDAYS_API_TOKEN" \\
  -H "Accept: application/json"</code></pre>
</div>
<h2>发起第一个请求</h2>
<p>下面这个例子列出当前空间最近更新的 10 篇文档。响应中的 <code>cursor</code> 用于获取下一页。</p>
<div class="code-block" data-lang="javascript">
<div class="code-head">
<span class="code-language"><span class="code-dots" aria-hidden="true"><i></i><i></i><i></i></span>JavaScript</span>
<button class="code-copy" type="button"><svg class="icon" aria-hidden="true"><use href="#i-copy"></use></svg>复制</button>
</div>
<pre><code>const response = await fetch(
  "https://api.happydays.wiki/v1/docs?limit=10&amp;sort=updated_at",
  {
    headers: {
      Authorization: "Bearer " + process.env.HAPPYDAYS_API_TOKEN,
      Accept: "application/json"
    }
  }
);

if (!response.ok) {
  throw new Error("Request failed: " + response.status);
}

const { data, next_cursor } = await response.json();
console.log(data.map(doc =&gt; doc.title));</code></pre>
</div>
<div class="code-block" data-lang="json">
<div class="code-head">
<span class="code-language"><span class="code-dots" aria-hidden="true"><i></i><i></i><i></i></span>JSON</span>
<button class="code-copy" type="button"><svg class="icon" aria-hidden="true"><use href="#i-copy"></use></svg>复制</button>
</div>
<pre><code>{
  "data": [
    {
      "id": "doc_8f3k2m",
      "title": "欢迎来到 HappyDays非官方文档",
      "slug": "welcome",
      "space_id": "space_happydays",
      "status": "published",
      "updated_at": "2026-10-21T09:30:00Z"
    }
  ],
  "next_cursor": "eyJvZmZzZXQiOjEwfQ",
  "has_more": true
}</code></pre>
</div>
<h2>核心资源</h2>
<div class="table-wrap"><table><thead><tr><th>资源</th><th>方法</th><th>路径</th><th>说明</th></tr></thead><tbody><tr><td><strong>文档</strong></td><td><code>GET</code></td><td><code>/docs</code></td><td>分页列出文档</td></tr><tr><td><strong>文档</strong></td><td><code>GET</code></td><td><code>/docs/:id</code></td><td>读取文档正文与元数据</td></tr><tr><td><strong>文档</strong></td><td><code>POST</code></td><td><code>/docs</code></td><td>创建草稿</td></tr><tr><td><strong>文档</strong></td><td><code>PATCH</code></td><td><code>/docs/:id</code></td><td>更新标题或正文</td></tr><tr><td><strong>知识库</strong></td><td><code>GET</code></td><td><code>/spaces/:id/tree</code></td><td>读取目录树</td></tr><tr><td><strong>评论</strong></td><td><code>GET</code></td><td><code>/docs/:id/comments</code></td><td>读取文档评论</td></tr></tbody></table></div>
<h2>分页与过滤</h2>
<p>列表接口统一使用游标分页，不接受页码。首次请求不传 <code>cursor</code>，之后把响应中的 <code>next_cursor</code> 原样带回即可。</p>
<div class="code-block" data-lang="http">
<div class="code-head">
<span class="code-language"><span class="code-dots" aria-hidden="true"><i></i><i></i><i></i></span>HTTP</span>
<button class="code-copy" type="button"><svg class="icon" aria-hidden="true"><use href="#i-copy"></use></svg>复制</button>
</div>
<pre><code>GET /v1/docs?limit=20&amp;cursor=eyJvZmZzZXQiOjIwfQ&amp;status=published&amp;tag=api</code></pre>
</div>
<p>支持的过滤参数包括 <code>status</code>、<code>tag</code>、<code>updated_since</code>。多个过滤条件之间是「与」关系，<code>limit</code> 最大为 100。</p>
<h2>错误处理</h2>
<p>所有错误都返回稳定的 JSON 结构和可追踪的 <code>request_id</code>。不要根据错误文案做逻辑判断，请使用状态码与 <code>code</code> 字段。</p>
<div class="table-wrap"><table><thead><tr><th>状态码</th><th>code</th><th>含义与处理方式</th></tr></thead><tbody><tr><td><code>400</code></td><td><code>invalid_request</code></td><td>参数缺失或格式错误，检查请求体</td></tr><tr><td><code>401</code></td><td><code>unauthorized</code></td><td>令牌无效或已过期，重新生成</td></tr><tr><td><code>403</code></td><td><code>forbidden</code></td><td>权限不足，确认令牌所属角色</td></tr><tr><td><code>404</code></td><td><code>not_found</code></td><td>资源不存在或对当前令牌不可见</td></tr><tr><td><code>409</code></td><td><code>conflict</code></td><td>并发修改冲突，重新拉取最新版本</td></tr><tr><td><code>429</code></td><td><code>rate_limited</code></td><td>请求过于频繁，按 Retry-After 退避</td></tr></tbody></table></div>
<div class="callout callout--warning">
<span class="callout-icon"><svg class="icon" aria-hidden="true"><use href="#i-alert"></use></svg></span>
<div class="callout-content">
<p class="callout-title">重试策略</p><p>仅对 429 与 5xx 响应进行重试，建议采用指数退避并加入随机抖动。不要自动重试 409，应该重新读取资源后由业务逻辑决定如何合并。</p>
</div>
</div>
<h2>速率限制</h2>
<p>每个令牌默认限制为每分钟 120 次请求，突发上限 30 次。响应头会返回当前窗口的使用情况：</p>
<div class="code-block" data-lang="http">
<div class="code-head">
<span class="code-language"><span class="code-dots" aria-hidden="true"><i></i><i></i><i></i></span>HTTP</span>
<button class="code-copy" type="button"><svg class="icon" aria-hidden="true"><use href="#i-copy"></use></svg>复制</button>
</div>
<pre><code>X-RateLimit-Limit: 120
X-RateLimit-Remaining: 87
X-RateLimit-Reset: 1761110400
Retry-After: 12</code></pre>
</div>
<h2>Webhook 签名验证</h2>
<p>事件推送使用 <code>X-HappyDays-Signature</code> 头，值为 <code>sha256=</code> 加 HMAC 摘要。请务必使用原始请求体计算签名，不要先解析再序列化。</p>
<div class="code-block" data-lang="javascript">
<div class="code-head">
<span class="code-language"><span class="code-dots" aria-hidden="true"><i></i><i></i><i></i></span>JavaScript</span>
<button class="code-copy" type="button"><svg class="icon" aria-hidden="true"><use href="#i-copy"></use></svg>复制</button>
</div>
<pre><code>const crypto = require("crypto");

function verifySignature(rawBody, signature) {
  const expected = "sha256=" + crypto
    .createHmac("sha256", process.env.HAPPYDAYS_WEBHOOK_SECRET)
    .update(rawBody)
    .digest("hex");

  return crypto.timingSafeEqual(
    Buffer.from(expected),
    Buffer.from(signature)
  );
}</code></pre>
</div>
<p>验证失败时返回 <code>401</code> 并记录请求 ID；成功处理后返回 <code>2xx</code>。HappyDays 会在 24 小时内对失败事件重试 5 次，之后进入死信队列。</p>`
    }
  };

  var allIds = [
    "welcome", "quickstart", "product-guide", "faq", "changelog", "team-handbook", "design-system", "api-guide"
  ];

  return {
    site: {
      name: "HappyDays非官方文档",
      team: "HappyDays 团队",
      tagline: "团队知识库"
    },
    categories: categories,
    docs: docs,
    allIds: allIds
  };
})();
