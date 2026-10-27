# HappyDays非官方文档

### **本项目大部分由deepseek V4.1 flash所构建**

一个 **纯静态团队知识库**。没有前端框架和第三方依赖，文章通过 `build.py` 生成 `assets/data.js`；同时提供一个基于 Python 标准库的本地编辑服务，可以在浏览器中编辑文章、创建主题和预览 Markdown。

页面以「左侧知识树 + 中间长文阅读 + 右侧页面目录」为核心，支持多主题文档、全文搜索、主题切换和响应式布局。

---

## 快速预览

推荐直接启动服务。访问网站根地址会进入首页 `/home`，知识库仍然使用 `/wiki/`：

```bash
python server.py
```

然后访问：

```text
http://127.0.0.1:8000/          -> 自动跳转 /home
http://127.0.0.1:8000/home      -> 首页
http://127.0.0.1:8000/wiki/     -> 非官方文档
```

如果只需要静态预览，必须把首页映射到 `/home`，并把整个项目部署到 `/wiki/` 路径下，而不是直接打开根目录或 `index.html`。例如在项目父目录创建一个 `wiki` 子目录指向本项目，再从父目录启动 `python -m http.server 8080`；首页需要单独通过反向代理或 rewrite 把 `/home` 指向 `home/home.html`。

如需在网页中编辑文章和添加主题，请运行编辑服务：

```bash
python server.py
```

然后访问 `http://127.0.0.1:8000/wiki/editor.html`。

---

## 网页端编辑

`server.py` 使用 Python 标准库实现，不需要 Flask、Django 或其他后端依赖。

```bash
python server.py
```

默认地址：

- 首页：`http://127.0.0.1:8000/home`
- 阅读站点：`http://127.0.0.1:8000/wiki/`
- 内容管理：`http://127.0.0.1:8000/wiki/editor.html`

编辑服务运行时，阅读页顶栏会出现「编辑」入口。每次启动 `server.py` 都会先自动运行 `build.py`；如果构建失败，服务不会启动并会输出具体错误。

`python server.py` 是前台进程，启动后不会返回命令提示符，这是正常现象；按 `Ctrl+C` 停止。默认只监听 `127.0.0.1`，如果要从其他机器访问：

```bash
python server.py --host 0.0.0.0 --port 8000
```

`server.sh -run` 会后台启动，并在启动前尝试 pull。启动 pull 最长等待 15 秒，超时或失败会记录警告但不会阻止服务启动。详细原因可查看：

```bash
./server.sh -logs
tail -n 100 logs/sync.log
```

如果启动前 `build.py` 超时，可以临时提高构建超时时间：

```bash
BUILD_TIMEOUT=300 ./server.sh -run
```

仅用于排查时可以跳过启动前构建，直接使用现有 `assets/data.js`：

```bash
SKIP_STARTUP_BUILD=1 ./server.sh -run
```

跳过构建不会更新静态文章数据；编辑保存仍会正常触发构建。正常情况下建议先手动运行 `python3 build.py` 确认构建是否能完成。


### 服务器脚本

Linux 服务器可以使用根目录的 `server.sh` 管理进程：

```bash
chmod +x server.sh run.sh
./server.sh -run      # 后台启动，成功输出 Successful
./server.sh -stop     # 停止服务，成功输出 Successful
./server.sh -restart  # 重启服务，成功输出 Successful
./server.sh -logs     # 查看最近 200 行日志
./server.sh -logs -f  # 持续跟踪日志
```

`server.sh` 同时提供 `run.sh` 兼容入口，参数完全一致：

```bash
./run.sh -restart
```

默认监听 `0.0.0.0:8000`，可以通过环境变量覆盖：

```bash
HOST=127.0.0.1 PORT=8080 ./server.sh -run
```

Windows 使用 `run.bat`，参数和输出一致：

```bat
run.bat -run
run.bat -stop
run.bat -restart
run.bat -logs
run.bat -logs -f
```

Windows 环境变量示例：

```bat
set HOST=127.0.0.1
set PORT=8080
run.bat -run
```

运行状态和日志保存在：

```text
.run/server.pid
.run/sync.pid
logs/server.log
logs/sync.log
```

启动和停止时会自动同步 Git：

- 启动前执行 `git pull --rebase --autostash`
- 停止时执行 `git pull --rebase --autostash` 后再 `git push`
- 服务运行期间，每天 **12:00（Asia/Shanghai）自动 push**
- **00:00 定时 pull 已移除**
- 启动时仍会 pull；停止时仍会 pull 后 push；12:00 push 前会先 rebase
- 定时任务只在服务运行期间生效
- Git 同步日志写入 `logs/sync.log`，`-logs` 会同时显示服务日志和同步日志
- 当前目录不是 Git 仓库时自动跳过
- 同步失败不会阻止服务启动或停止，错误会记录到日志

Windows 下对应路径为 `.run\server.pid` 和 `logs\server.log`。

当文章被创建、更新、移动或删除时，日志会输出类似：

```text
[2026-10-25T12:00:00+08:00] 文章更新：简介（slug=intro，作者=zeyu_1145，主题=简介，本地提交=是）
```

服务启动失败或停止失败时，脚本会输出 `fail: ...` 和对应错误。`server.py` 没有登录认证，公网部署时建议限制访问来源或使用反向代理认证。

### 页眉滚动标题

根目录的 `title.json` 控制阅读页页眉标题：

```json
{
  "fontSize": 18.5,
  "intervalSeconds": 10,
  "titles": [
    { "text": "HappyDays 非官方文档", "weight": 50 },
    { "text": "铁路、城镇与冒险", "weight": 25 }
  ]
}
```

标题还可以使用逐字样式。`runs` 是可选的，每个 run 包含文本和样式：

```json
{
  "text": "粗斜下删大",
  "weight": 50,
  "runs": [
    { "text": "粗", "bold": true, "color": "#ff0000" },
    { "text": "斜", "italic": true, "color": "#00ff00" },
    { "text": "下", "underline": true },
    { "text": "删", "strike": true, "color": "#0000ff" },
    { "text": "大", "size": 30 }
  ]
}
```

`size` 是该字单独使用的字号，单位 px，范围 8–80；省略时继承标题的全局 `fontSize`。`build.py` 会拒绝超出 8–80px 的单字字号。

阅读页标题编辑器和内容管理页标题编辑器都支持选中任意文字后设置粗体、斜体、下划线、删除线、颜色和字号；每个字符都可以单独设置。标题行右侧的 `↑` / `↓` 可以调整标题在列表中的顺序。

标题的显示顺序只影响编辑器中的列表；页眉轮换仍按权重随机抽取。

`fontSize` 是全局默认字号，固定在 `title.json` 中（当前为 `18.5`），网站不提供全局字号修改入口。单字 `size` 可覆盖默认字号；选定单字字号后继续输入的文字会沿用该字号。`intervalSeconds` 控制轮换间隔（3–3600 秒）。标题在顶部栏中居中显示。

权重为 `c_x` 的标题出现概率为：

```text
P(x) = c_x / (c_1 + c_2 + ... + c_n)
```

页面加载时会按权重抽取一次，之后按 `intervalSeconds` 重新抽取并滚动切换；鼠标悬停时暂停。每次抽取会自动排除当前标题，因此同一个标题不会连续出现两次。只有一个不同标题时不会启动轮换。权重小于等于 0 的条目会被忽略。`title.json` 读取失败时保留静态回退标题。

编辑服务可用时，阅读页滚动标题右侧会显示一个铅笔按钮；点击即可在当前页面打开标题编辑弹窗，修改文本、权重和轮换间隔，保存后立即应用。

也可以在编辑器顶部点击「页面标题」进入同一套配置；保存后会同步写入 `title.json`，并按站点团队或本次署名创建本地 Git commit（不会 push）。

### 支持的操作

- 选择并编辑已有文章
- 修改标题、摘要、Emoji、更新时间、阅读时长、标签和 Markdown 正文
- 保存前填写「本次署名」，每次新建或更新都会写入署名记录
- 在编辑器内查看当前文章的署名历史（作者、时间、创建/更新/移动）
- 实时预览 Markdown
- 新建文章并选择任意层级的主题
- 导入 `.md` 文件：解析 front matter、标题、摘要、Emoji、标签和正文，填入新建文章表单
- 导入文件名（去掉 `.md`）只能包含英文字母、数字和连字符；包含中文、空格、下划线等字符会直接导入失败
- 添加顶级主题，或在任意主题下继续添加下级主题
- 在编辑器侧边栏的主题标题旁点击 `+`，可快速添加该主题的下级主题
- 阅读页标题右侧铅笔可直接编辑滚动标题、权重与轮换间隔
- 标题编辑器支持逐字设置粗体、斜体、下划线、删除线、颜色和字号（8–80px）
- 标题可通过 `↑` / `↓` 调整列表顺序
- 文章可通过编辑表单顶部的 `↑` / `↓` 在当前主题内调整阅读顺序
- 在编辑器顶部点击「页面标题」，编辑页眉滚动标题、权重、轮换间隔和概率
- 修改文章所属主题；保存时自动移动 Markdown 文件，并更新 `topic`、`topic_id`、`source` 和本地图片相对路径
- 删除文章及其本地图片
- 删除空主题（没有直属文章和下级主题）
- 保存时同步更新 Markdown front matter、`article/article.json`，并自动运行 `build.py` 生成 `assets/data.js`
- 保存或删除成功后自动在本地创建 Git commit；不会自动 push
- 启动 `server.py` 时自动执行一次构建
- 构建失败时返回具体错误，并回滚 Markdown、清单和 `data.js`

### 安全说明

编辑服务没有用户认证，默认只绑定 `127.0.0.1`，适合本地使用。不要把 `server.py` 直接暴露到公网，也不要在公共服务器上长期运行。

停止服务：在终端按 `Ctrl+C`。

可选参数：

```bash
python server.py --host 127.0.0.1 --port 8765
```

### API

| 方法 | 路径 | 用途 |
| --- | --- | --- |
| GET | `/api/health` | 检查编辑服务是否可用 |
| GET | `/api/state` | 获取主题和文章索引 |
| GET | `/api/articles/<slug>/history` | 读取文章 Git 版本列表与最早可见版本 |
| GET | `/api/articles/<slug>/history/<hash>` | 读取指定版本内容 |
| PUT | `/api/articles/<slug>/history/earliest` | 设置或清除最早可见版本 |
| GET | `/api/articles/<slug>` | 读取文章元数据、Markdown 正文与署名记录 |
| PUT | `/api/articles/<slug>` | 保存已有文章，必须传 `author`；传 `topicId` 可移动主题 |
| POST | `/api/articles/<slug>/comments` | 发表评论，必须传 `author` 与 `body` |
| POST | `/api/articles/<slug>/move` | 在当前主题内上移或下移文章，传 `direction` 与 `author` |
| POST | `/api/articles/<slug>/icon` | 上传文章 Bank 封面，查询参数 `filename`；支持 PNG/JPG |
| POST | `/api/bgm` | 上传 MP3/WAV 背景音乐，查询参数 `title`、`weight`、`filename` |
| GET | `/api/home` | 读取首页图片配置 |
| PUT | `/api/home` | 保存首页图片权重和轮换间隔 |
| POST | `/api/home/images` | 上传首页 PNG/JPG 图片，查询参数 `filename`、`weight` |
| POST | `/api/articles` | 新建文章，必须传 `author` |
| GET | `/api/titles` | 读取页眉标题配置 |
| PUT | `/api/titles` | 保存页眉标题与权重 |
| DELETE | `/api/articles/<slug>` | 删除文章及其本地图片 |
| POST | `/api/topics` | 新建主题 |
| DELETE | `/api/topics/<id>` | 删除空主题 |
| POST | `/api/preview` | 将 Markdown 渲染为预览 HTML |

删除文章会同时清理 `assets/image/<slug>/` 和该文章的署名记录；删除主题要求该主题没有直属文章、没有下级主题，且目录为空。删除文章后 `order` 可以出现空号，但仍必须唯一。

### 自动 Git 提交

文章新建、更新、移动或删除成功后，`server.py` 会自动对本次变更的文件执行本地 `git commit`，包括文章 Markdown、`article/article.json`、`assets/data.js`、`article/edits.json`、`comment/comment.json` 和本次生成的评论 Markdown 文件。

- **只提交本地，不会执行 `git push`**
- 只提交本次操作涉及的路径，不会提交工作区中其他未暂存改动
- 提交信息包含操作类型、文章标题和署名，例如 `docs: 更新「简介」（zeyu_1145）`
- 自动提交使用本次署名作为 Git 作者；如果 Git 未配置 `user.name` / `user.email`，会使用署名和 `happydays@localhost` 作为兜底，不会修改仓库的 Git 配置
- 当前目录不是 Git 仓库、没有 Git 命令或提交失败时，文章仍会保存，编辑器会提示提交失败
- 自动提交不会推送到 GitHub，需要时请手动执行 `git push`

### 署名记录

署名保存在独立的 `article/edits.json`，不写入文章正文或 front matter：

```json
{
  "version": 1,
  "articles": {
    "intro": [
      {
        "author": "维护者",
        "at": "2026-10-25T02:15:42+08:00",
        "action": "update",
        "title": "简介",
        "topic": "简介"
      }
    ]
  }
}
```

每次保存文章都会追加一条记录，`action` 为 `create`、`update` 或 `move`；移动文章时额外包含 `fromTopic`。编辑器和阅读页都会显示署名历史：阅读页头部显示最后编辑者，正文末尾显示完整记录。

### 文章版本历史

后端开启时，每篇文章都可以从本地 Git 提交中查看历史版本：

- 阅读页顶部「历史」按钮打开版本列表并预览旧版本
- 编辑器「版本历史」可预览任意版本，并载入到编辑表单
- 编辑器中可以把某个版本设为「最早可见版本」，阅读页将隐藏更早版本
- 「显示全部版本」可清除限制
- 版本限制保存在 `article/history.json`，设置时会自动创建本地 Git commit
- 纯静态部署没有历史按钮；版本历史依赖 `server.py`

载入旧版本只替换编辑内容，不会立即保存；确认后仍需点击「保存并构建」。

### Bank 模式

首页和 Bank 页面都由 `build.py` 生成的 `assets/data.js` 渲染：

- 首页按 `article.json` 的顶级标题分区
- 每个标题最多显示 3 篇直属文章
- 超过 3 篇或存在下级标题时显示「查看更多」
- 「查看更多」进入 `/bank/<标题ID>`
- Bank 页面先列出直属文章，再把每个下级标题按同样规则展示
- Bank 页面支持任意层级，通过继续进入 `/bank/<下级标题ID>` 浏览
- 首页和 Bank 顶部导航直接进入对应的 `/bank/<标题ID>` 目录页

每篇文章卡片会使用：

```text
article/icon/<slug>.png
article/icon/<slug>.jpg
article/icon/<slug>.jpeg
```

找不到时回退到根目录的 `icon.png`。

文章编辑页提供「上传封面」按钮，支持 PNG/JPG/JPEG，单文件最大 10MB。上传后会重新构建 `assets/data.js` 并创建本地 Git commit。

Bank 文章卡片右上角有「显示目录 / 隐藏目录」切换，用于控制打开文章时是否带 `#single`。阅读页顶栏也提供同样的目录切换按钮。

文章顶部的面包屑：

- 「HappyDays非官方文档」链接到 `/home`
- 分类和文章标题链接到对应的 `/bank/<标题ID>`

### 首页图片

首页 `/home` 的主视觉上覆盖一张可轮换图片：

- 图片文件保存在 `home/`
- 配置保存在 `home/home.json`
- 无图片时显示 `NO IMAGE`
- 首页支持日间/夜间模式，主题与知识库共用 `happydays-theme`
- 首页右下角 BGM 播放器与知识库一致
- 图片右下方有「编辑图片」按钮，后端开启时可见
- 支持上传 `.png`、`.jpg`、`.jpeg`，单文件最大 20MB
- 图片按权重随机轮换，并排除当前图片
- 图片切换使用 450ms 淡入淡出动画
- 只有一张图片时不启动轮换
- 主视觉仍链接到简介页
- 首页的导航、主视觉、教程卡片和“浏览更多”等文章入口默认进入 `#single` 单篇阅读模式
- 图片下方提供「更喜欢wiki式的操作方式？跳转至传统页面」链接到 `/wiki/`

`home/home.json` 格式：

```json
{
  "version": 1,
  "intervalSeconds": 5,
  "images": [
    {
      "file": "example.png",
      "weight": 1
    }
  ]
}
```

点击「编辑图片」可以修改轮换间隔、各图片权重，并上传新图片。保存和上传会创建本地 Git commit，不会 push；图片上传先返回结果，本地提交在后台执行，避免 Git 卡住页面。

### 背景音乐

页面右下角提供固定位置的 BGM 播放器，不会随文章滚动或切换移动：

- 显示当前歌名
- 播放 / 暂停
- 下一首
- 后端开启时显示上传按钮

音乐文件放在：

```text
BGM/
```

配置保存在：

```text
BGM/BGM.json
```

格式：

```json
{
  "version": 1,
  "tracks": [
    {
      "file": "example.mp3",
      "title": "Example Song",
      "weight": 1
    }
  ]
}
```

规则：

- 只支持 `.mp3` 和 `.wav`，单文件最大 50MB
- 上传时必须填写歌名和权重
- 切歌规则与滚动标题一致：按权重随机，并排除当前歌曲
- 只在用户点击下一首或当前歌曲播放结束时切歌
- 只有一首音乐时循环播放
- 页面不可见时暂停，回到页面后仅在之前正在播放时恢复
- 上传成功后自动创建本地 Git commit（不会 push）
- 纯静态部署可以读取 `BGM/BGM.json` 并播放已有音乐，但不能上传

### 文章评论

每篇文章底部都有评论区：

- 评论必须填写署名和正文
- 署名不超过 80 个字符，评论不超过 2000 个字符
- 评论正文支持 Markdown
- 评论元数据保存在 `comment/comment.json`
- 每条评论同时生成独立 Markdown 文件：`comment/<slug>/<评论ID>.md`
- 后端开启时显示发表表单；纯静态部署只读显示已有评论
- 发表评论后会创建本地 Git commit，不会自动 push

```json
{
  "version": 2,
  "articles": {
    "intro": [
      {
        "id": "评论 ID",
        "author": "署名",
        "at": "2026-10-25T21:00:00+08:00",
        "file": "intro/评论 ID.md",
        "body": "**Markdown** 评论正文"
      }
    ]
  }
}
```

---

## 已实现的功能

### 阅读与导航

- 文章头部显示最后编辑署名，文末显示完整署名记录
- 文章底部支持带署名的 Markdown 评论，评论保存在 `comment/`
- 右下角固定 BGM 播放器，支持加权随机切歌、单曲循环和标签页隐藏暂停
- 页眉按权重随机滚动显示站点标题，鼠标悬停时暂停
- 知识库目录树，按主题分组，支持任意层级、可折叠并记住状态
- 基于 URL hash 的文档路由，例如 `#/doc/<slug>`，可直接分享、刷新和前进后退
- 在文章地址后追加 `#single`（如 `/wiki/#/doc/intro#single`）可隐藏左侧导航栏，进入单篇阅读模式；移除 `#single` 恢复导航。单篇模式不播放页面入场和侧栏位移动画；#single 模式下上一篇/下一篇也会保持单篇模式，进入编辑页再点击「返回阅读」仍会回到单篇模式
- 自动生成右侧页面目录（TOC），滚动时高亮当前章节
- 顶部阅读进度、百分比、回到顶部
- 上一篇 / 下一篇、当前目录与面包屑
- 宽屏阅读模式、打印 / 导出 PDF 排版
- 移动端侧边栏抽屉和独立目录抽屉

### 搜索

- `Ctrl / ⌘ + K` 或 `/` 唤起全局搜索
- 同时检索标题、摘要、标签与正文
- 标题匹配加权，最近浏览记录，结果关键词高亮
- 支持 `↑` `↓` `Enter` `Esc` 键盘操作

### 阅读体验

- 亮色 / 深色主题，跟随系统偏好并记住选择
- 代码块一键复制、FAQ 折叠、时间线、色板、表格等文档组件
- 无障碍语义、键盘焦点管理、`prefers-reduced-motion` 支持
- 无外部字体、图片或 CDN 请求，完全离线可用

### 网页端编辑

- 本地 Python 编辑服务，无需数据库
- 文章元数据与 Markdown 正文编辑
- 实时 Markdown 预览
- 新建文章与添加主题
- 导入 Markdown 文件并生成新建文章草稿；文件名必须为英文 slug
- 每次保存填写署名，并查看署名历史
- 查看文章历史版本、载入旧版本，并设置阅读页最早可见版本
- 保存后自动构建 `data.js` 并创建本地 Git commit，失败自动回滚

---

## 目录结构

```text
.
├─ home/
│  ├─ home.html          # 网站首页，映射到 /home
│  ├─ home.json          # 首页图片文件名、权重与轮换间隔
│  └─ 图片文件            # 首页轮换图片
├─ bank.html             # Bank 目录页模板，/bank/<id> 复用
├─ index.html            # 页面骨架、图标 sprite、阅读器 UI
├─ editor.html           # 本地内容管理界面
├─ build.py              # 从 article/ 生成 assets/data.js
├─ server.py             # 本地编辑服务与 JSON API
├─ server.sh             # Linux 启动、停止、重启与日志脚本
├─ run.sh                # server.sh 的兼容入口
├─ run.bat               # Windows 启动、停止、重启与日志脚本
├─ sync.sh               # Linux 启动/停止同步与每日 push
├─ sync.ps1              # Windows 启动/停止同步与每日 push
├─ title.json            # 页眉滚动标题、权重、默认字号与轮换间隔
├─ BGM/                  # 背景音乐文件目录
│  ├─ BGM.json           # 背景音乐文件名、歌名与权重
│  └─ 音乐文件            # mp3 / wav
├─ comment/              # 评论元数据与每条评论的 Markdown 文件
│  ├─ comment.json       # 各文章的评论索引
│  └─ <slug>/<id>.md     # 单条评论正文
├─ assets/
│  ├─ styles.css         # 设计系统、布局、组件、响应式与打印样式
│  ├─ editor.css         # 内容管理界面样式
│  ├─ data.js            # 由 build.py 生成的文章数据（请勿直接编辑）
│  ├─ app.js             # 路由、搜索、目录、主题与交互
│  ├─ editor.js          # 内容管理界面逻辑
│  ├─ home.css           # 首页图片、编辑弹窗与入口链接样式
│  ├─ home-base.css      # 首页/Bank 共用的基础视觉样式
│  ├─ home.js            # 首页图片轮换、首页标题分区渲染
│  ├─ bank.js            # Bank 层级目录与文章卡片
│  ├─ site-common.js     # 首页/Bank 与知识库共用的主题同步
│  ├─ bgm-player.js      # 首页/Bank 共用的 BGM 播放器
│  └─ image/             # 迁移文章的本地图片
├─ article/
│  ├─ article.json       # 9 个主题、32 篇文章的清单
│  ├─ edits.json         # 各文章的署名记录
│  ├─ icon/              # 文章 Bank 封面（文件名为 <slug>.png/jpg）
│  ├─ history.json       # 各文章的最早可见版本设置（可选）
│  ├─ intro/             # 简介（1 篇）
│  ├─ beginner/          # 新手教程（6 篇）
│  ├─ advanced/          # 进阶教程（7 篇）
│  ├─ rules/             # 服务器规则（3 篇）
│  ├─ history/           # happyday历史（直属 0 篇）
│  │  ├─ people/         # 人物志（3 篇）
│  │  ├─ nations/        # 国家/城镇（5 篇）
│  │  └─ godman/         # 神人堂（2 篇）
│  └─ gallery/           # 妙妙图片集（2 篇）
└─ README.md
```

迁移文章时，图片统一放入 `assets/image/<slug>/`，Markdown 中使用相对路径引用。主题可以多层嵌套，文章放在对应主题的目录下，例如 `article/history/people/`。

## 语雀迁移

当前内容迁自 [HappyDays [非官方文档]](https://www.yuque.com/u70546288/1145)，保留原书主题顺序与文章顺序。原书中的嵌套分组「人物志」「国家/城镇」现已作为 `happyday历史` 的二级主题保留；语雀中的空文档也会保留占位说明，方便后续补充。

文章文件名使用与内容对应的英文语义 slug，例如 `before-joining.md`、`shop-plugin.md`、`cheating-response.md`、`dprk.md` 和 `gallery-1.md`。

---

## 文章 JSON 清单

`article/article.json` 是文章目录的机器可读清单，用于脚本、静态站点生成器或其他工具读取**主题**和文章元数据。它只保存索引和元数据，不重复正文；正文按主题分组存放在同名子目录中。

- **格式标识**：`happydays-article-manifest`
- **文件路径**：`article/article.json`

主题文件夹名使用稳定的主题 ID，而不是中文显示名；每个主题的 `directory` 字段决定 Markdown 子目录。

### 格式示例

以下为格式示例，使用示例主题和文章展示字段结构；不是当前清单的实际内容：

```jsonc
{
  "format": "happydays-article-manifest",
  "version": 1,
  "site": {
    "name": "HappyDays非官方文档",
    "team": "HappyDays 团队",
    "tagline": "团队知识库",
    "domain": "example.con",
    "language": "zh-CN"
  },
  "topicCount": 4,
  "articleCount": 8,
  "lastUpdated": "2026-10-22",
  "topics": [
    {
      "id": "start",
      "name": "开始使用",
      "description": "第一次来到 HappyDays，从这里开始。",
      "directory": "start",
      "parentId": null,
      "order": 1,
      "articleCount": 2
    },
    {
      "id": "product",
      "name": "产品手册",
      "description": "关于 HappyDays非官方文档的一切使用说明。",
      "directory": "product",
      "parentId": null,
      "order": 2,
      "articleCount": 3
    },
    {
      "id": "team",
      "name": "团队协作",
      "description": "我们如何沟通、开会和共同写作。",
      "directory": "team",
      "parentId": null,
      "order": 3,
      "articleCount": 2
    },
    {
      "id": "developer",
      "name": "开发者",
      "description": "把知识库接入你的工作流。",
      "directory": "developer",
      "parentId": null,
      "order": 4,
      "articleCount": 1
    }
  ],
  "articles": [
    {
      "slug": "welcome",
      "order": 1,
      "topic": "start",
      "title": "欢迎来到 HappyDays非官方文档",
      "description": "把散落在聊天、会议与脑海里的经验，种成一片随时可以查阅的森林。",
      "emoji": "🌱",
      "updated": "2026-10-21",
      "readingTime": 6,
      "tags": ["必读", "新成员", "团队文化"],
      "file": "start/welcome.md",
      "source": "/wiki/#/doc/welcome"
    }
    // 其余文章结构相同，按 order 升序排列
  ]
}
```

### 顶层字段

| 字段 | 类型 | 说明 |
| --- | --- | --- |
| `format` | string | 固定值 `happydays-article-manifest` |
| `version` | integer | 清单格式版本，当前为 `1` |
| `site` | object | 站点信息，包含 `name`、`team`、`tagline`、`domain`、`language` |
| `topicCount` | integer | 主题总数，必须等于 `topics.length` |
| `articleCount` | integer | 文章总数，必须等于 `articles.length` |
| `lastUpdated` | string | 所有文章 `updated` 中的最大日期，格式 `YYYY-MM-DD` |
| `topics` | array | 主题对象列表，按树形顺序排列：顶级主题后紧跟其所有下级主题 |
| `articles` | array | 文章对象列表，按 `order` 升序排列 |

### 主题字段

| 字段 | 类型 | 说明 |
| --- | --- | --- |
| `id` | string | 主题唯一标识，也是文章 `topic` 的引用值 |
| `name` | string | 主题显示名称，例如 `开始使用` |
| `description` | string | 主题说明 |
| `directory` | string | 主题在 `article/` 下的相对路径，可多层嵌套，例如 `history/people` |
| `parentId` | string \| null | 父主题 ID；`null` 表示顶级主题，可继续嵌套任意层级 |
| `order` | integer | 同一父级下的展示顺序，从 `1` 开始 |
| `articleCount` | integer | 该主题下的直接文章数，不包含下级主题文章 |

主题的 `directory` 必须为 `父主题目录/主题ID`；`topicCount` 和文章总数都包含所有层级主题。构建时会校验父主题存在且不存在循环引用。

### 文章字段

| 字段 | 类型 | 说明 |
| --- | --- | --- |
| `slug` | string | 唯一标识，与 Markdown 文件名去扩展名后一致 |
| `order` | integer | 全站阅读顺序，必须为正整数且唯一；删除文章后允许空号 |
| `topic` | string | 所属主题的 `topics[].id` |
| `title` | string | 文章标题 |
| `description` | string | 文章摘要 |
| `emoji` | string | 文章图标 |
| `updated` | string | 最后更新日期，格式 `YYYY-MM-DD` |
| `readingTime` | integer | 预计阅读时间，单位为分钟 |
| `tags` | string[] | 文章标签，可为空数组 |
| `file` | string | Markdown 文件路径，相对于 `article/` 目录 |
| `source` | string | 站点根相对地址，格式为 `/wiki/#/doc/<slug>` |

每篇 Markdown 的 front matter 同时包含 `topic`（显示名称）和 `topic_id`（主题 ID），与 JSON 中文章的 `topic` 字段对应。Markdown 与 JSON 的 `source` 都使用 `/wiki/#/doc/<slug>` 形式的站点根相对地址，访问时由浏览器或调用方补全域名。

### 外链域名

`site.domain` 是站点唯一的外部域名配置，当前值见 `article/article.json`。它用于页面 canonical / Open Graph URL，以及“分享/复制链接”和邀请链接；如果只填写域名，程序会自动补上 `https://`。

文章 `source` 不包含域名，统一保存为 `/wiki/#/doc/<slug>`；部署到任意域名都不需要修改文章。修改 `site.domain` 后重新运行 `python build.py`（或重启 `server.py`），canonical、分享链接和邀请链接会使用新域名和 `/wiki` 入口。

文章正文中的第三方外链（例如 Minecraft Wiki、GitHub、爱发电等）属于内容本身，不会被改写为该域名。

### 维护规则

1. 所有字段均为必填，不使用 `null`。
2. `topics[].id` 唯一，`topics[].directory` 必须与主题文件夹名一致。
3. 每篇文章的 `topic` 必须存在于 `topics[].id` 中。
4. `file` 必须存在，且必须等于 `topics[].directory + "/" + slug + ".md"`。
5. `articleCount` 必须等于 `articles.length`，`topicCount` 必须等于 `topics.length`，每个主题的 `articleCount` 必须等于该主题下的实际文章数。
6. `lastUpdated` 必须等于所有文章 `updated` 的最大值。
7. 新增或删除文章时，同时移动/创建 Markdown 文件、更新 front matter，并更新本清单。
8. `order` 分别决定主题和文章的展示顺序，建议与站点目录顺序保持一致。

---

## 构建 data.js

`article/` 是文章源目录，`assets/data.js` 是构建产物，请不要直接编辑生成文件。

```bash
python build.py
```

要求 Python 3.10+，无第三方依赖。脚本会：

- 读取 `article/article.json` 中的主题、站点信息和文章顺序
- 将文章 JSON 与 front matter 的 `source` 统一为 `/wiki/#/doc/<slug>` 相对地址
- 扫描 `article/<topic>/<slug>.md`，解析 YAML front matter
- 校验主题目录、slug、order、标题、摘要、标签等是否与清单一致
- 将 Markdown 转换为站点使用的 HTML
- 生成 `assets/data.js`，包含 `categories`、`docs`、`allIds` 和 `site`；每篇文档同时带有 `signatures` 署名历史

构建失败时会输出具体文件和字段，修复后重新运行即可；校验失败时不会改写 `assets/data.js`。

---

## 新增或修改文章

### 1. 确认主题目录

每篇文章必须位于 `article/<topic-id>/` 下。主题 ID 与目录名必须一致，例如：

```text
article/handbook/onboarding.md
```

新增主题时，同时在 `article/article.json` 的 `topics` 中添加记录，并设置 `id`、`name`、`description`、`directory`、`order` 和 `articleCount`。

### 2. 编写 Markdown 文件

文件名为 `<slug>.md`，开头必须包含 front matter：

```md
---
title: "入职第一周"
description: "账号、设备与第一周日程，一页说清楚。"
topic: "员工手册"
topic_id: "handbook"
updated: "2026-11-01"
reading_time: 5
emoji: "🌿"
order: 9
slug: "onboarding"
source: "/wiki/#/doc/onboarding"
tags:
  - "入职"
  - "新成员"
---

# 入职第一周

*账号、设备与第一周日程，一页说清楚。*

## 第一天

领取设备，加入群组，认识你的伙伴。
```

说明：

- 一级标题必须与 front matter 的 `title` 一致
- 一级标题后的斜体摘要行可选；与 `description` 相同时会被构建脚本移除，避免与页面头部重复
- `topic_id` 必须对应 `article.json` 中的主题
- `order` 为全站阅读顺序，必须从 `1` 开始连续递增
- Markdown 中的相对 `.md` 链接会自动转换为 `#/doc/<slug>` 站内路由

### 3. 更新 article.json

在 `articles` 中新增或修改文章记录，并同步更新 `articleCount`、`topics[].articleCount` 和 `lastUpdated`。文章记录至少包含：

```json
{
  "slug": "onboarding",
  "order": 9,
  "topic": "handbook",
  "title": "入职第一周",
  "description": "账号、设备与第一周日程，一页说清楚。",
  "emoji": "🌿",
  "updated": "2026-11-01",
  "readingTime": 5,
  "tags": ["入职", "新成员"],
  "file": "handbook/onboarding.md",
  "source": "/wiki/#/doc/onboarding"
}
```

front matter 与 `article.json` 中的重复字段必须一致；不一致时构建会失败。

### 4. 生成并检查

```bash
python build.py
```

构建成功后会更新 `assets/data.js`。随后打开 `index.html` 检查标题、目录、站内链接、代码块和表格的显示效果。

---

## Markdown 转换规则

构建脚本会把以下 Markdown 转换为站点组件：

| Markdown | 生成结果 |
| --- | --- |
| `# 标题` | 文章 H1；构建时移除，由页面头部展示 |
| `##` / `###` | 正文标题，并进入右侧目录 |
| `**粗体**` / `*斜体*` | `<strong>` / `<em>` |
| `` `行内代码` `` | `<code>` |
| `- 项目` | 无序列表 |
| `1. 项目` | 步骤列表（`ol.steps`） |
| 管道表格 | `.table-wrap` 表格 |
| 围栏代码块（三反引号） | 带复制按钮的代码块 |
| `> [!TIP]` / `[!NOTE]` / `[!WARNING]` | 提示框 |
| `[文字](./other.md)` | `#/doc/other` 站内链接 |

正文按 Markdown 解析，原始 HTML 会被转义显示；自定义 HTML 组件请改用标准 Markdown 表达。

---

## 修改品牌与主题

品牌名分布在：

- `index.html` 的标题、`brand-name` 和侧边栏信息
- `article/article.json` 的 `site` 配置
- Markdown 文章正文与 README
- `assets/styles.css` 顶部的 CSS 变量

`assets/data.js` 中的 `site` 由 `article.json` 生成，修改后需要重新运行 `python build.py`。

主色只需改这几项：

```css
:root {
  --accent: #0a9b69;
  --accent-strong: #06764f;
  --accent-soft: #eaf7f1;
  --accent-softer: #f4fbf8;
}
```

深色主题的对应变量在 `[data-theme="dark"]` 中。

---

## 部署

网站入口分为三层：`/home` 是首页，`/bank/<标题ID>` 是层级目录，`/wiki/` 是非官方文档。`server.py` 会自动把 `/`、`/index.html`、`/home.html`、`/home/` 重定向到 `/home`，把 `/bank`、`/bank/` 重定向到 `/home`，把 `/wiki` 重定向到 `/wiki/`，并在内部把 `/wiki/...` 映射到项目文件。

这是一个运行时无框架依赖的静态项目。修改 `article/` 后先运行 `python build.py` 更新 `assets/data.js`，再把整个目录部署到 `/wiki/` 路径下，同时把 `/home` 映射到 `home/home.html`，把 `/bank/<id>` 重写到 `bank.html`。

**GitHub Pages**：如果仓库名为 `wiki`，项目地址就是 `https://<user>.github.io/wiki/`，与知识库入口路径一致；首页 `/home` 需要平台 rewrite 或反向代理支持。

**Netlify / Vercel**：构建命令可设为 `python build.py`，发布目录为 `.`，并通过平台的 rewrite/redirect 功能把 `/wiki/*` 映射到站点文件、把 `/home` 映射到 `home/home.html`。

**Nginx / Apache**：首页和知识库需要同时映射，例如 Nginx：

```nginx
root /path/to/HappyDays-wiki;

location = / {
    return 302 /home;
}

location = /favicon.ico {
    return 302 /icon.png?v=2;
}

location = /home {
    try_files /home/home.html =404;
}

location = /home/ {
    return 302 /home;
}

location = /home.html {
    return 302 /home;
}

location /home/ {
    alias /path/to/HappyDays-wiki/home/;
}

location = /bank {
    return 302 /home;
}

location = /bank/ {
    return 302 /home;
}

location /bank/ {
    try_files /bank.html =404;
}

location = /wiki {
    return 302 /wiki/;
}

location /wiki/ {
    alias /path/to/HappyDays-wiki/;
    index index.html;
}
```

由于知识库使用 hash 路由，文章内部不需要额外的 `try_files` 规则；但 `/wiki/` 前缀必须保留。

静态部署时不会包含可用的编辑 API，阅读页的「编辑」入口会自动隐藏；如需编辑，请在本地运行 `python server.py`。不要在公网静态服务器上直接部署 `server.py`。

---

## 说明

- 搜索、主题、目录折叠等状态保存在浏览器 `localStorage` 中，不会上传到服务器。
- 编辑服务默认只监听本机，没有账号与权限系统；不要将其暴露到公网。
- 邀请链接、评论、在线多人协作等需要完整后端的能力未包含在这个版本中。
- 全部示例文案与人物均为虚构，可自由替换。
