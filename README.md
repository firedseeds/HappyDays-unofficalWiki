# HappyDays非官方文档

一个类似语雀文档体验的 **纯静态团队知识库**。没有前端框架和第三方依赖，文章通过 `build.py` 生成 `assets/data.js`；同时提供一个基于 Python 标准库的本地编辑服务，可以在浏览器中编辑文章、创建主题和预览 Markdown。

页面以「左侧知识树 + 中间长文阅读 + 右侧页面目录」为核心，内置 8 篇可切换的示例文档、全文搜索、主题切换和响应式布局。

---

## 快速预览

直接打开：

```text
index.html
```

如果浏览器对本地文件限制较严格，可以启动一个静态服务器：

```bash
# Python 3
python -m http.server 8080

# 或 Node.js（任选其一）
npx serve .
```

然后访问 `http://localhost:8080`。

如需在网页中编辑文章和添加主题，请运行编辑服务：

```bash
python server.py
```

然后访问 `http://127.0.0.1:8000/editor.html`。

---

## 网页端编辑

`server.py` 使用 Python 标准库实现，不需要 Flask、Django 或其他后端依赖。

```bash
python server.py
```

默认地址：

- 阅读站点：`http://127.0.0.1:8000/`
- 内容管理：`http://127.0.0.1:8000/editor.html`

编辑服务运行时，阅读页顶栏会出现「编辑」入口。

### 支持的操作

- 选择并编辑已有文章
- 修改标题、摘要、Emoji、更新时间、阅读时长、标签和 Markdown 正文
- 实时预览 Markdown
- 新建文章并选择目标主题
- 添加新主题（同时创建对应的 `article/<topic-id>/` 文件夹）
- 保存时同步更新 Markdown front matter、`article/article.json`，并自动运行 `build.py` 生成 `assets/data.js`
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
| GET | `/api/articles/<slug>` | 读取文章元数据与 Markdown 正文 |
| PUT | `/api/articles/<slug>` | 保存已有文章 |
| POST | `/api/articles` | 新建文章 |
| POST | `/api/topics` | 新建主题 |
| POST | `/api/preview` | 将 Markdown 渲染为预览 HTML |

---

## 已实现的功能

### 阅读与导航

- 知识库目录树，按「开始使用 / 产品手册 / 团队协作 / 开发者」分组，可折叠并记住状态
- 基于 URL hash 的文档路由，例如 `#/doc/api-guide`，可直接分享、刷新和前进后退
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
- 保存后自动构建 `data.js`，失败自动回滚

---

## 目录结构

```text
.
├─ index.html            # 页面骨架、图标 sprite、阅读器 UI
├─ editor.html           # 本地内容管理界面
├─ build.py              # 从 article/ 生成 assets/data.js
├─ server.py             # 本地编辑服务与 JSON API
├─ assets/
│  ├─ styles.css         # 设计系统、布局、组件、响应式与打印样式
│  ├─ editor.css         # 内容管理界面样式
│  ├─ data.js            # 由 build.py 生成的文章数据（请勿直接编辑）
│  ├─ app.js             # 路由、搜索、目录、主题与交互
│  └─ editor.js          # 内容管理界面逻辑
├─ article/
│  ├─ article.json       # 主题、文章索引与元数据的机器可读清单
│  ├─ start/             # 开始使用
│  │  ├─ welcome.md
│  │  └─ quickstart.md
│  ├─ product/           # 产品手册
│  │  ├─ product-guide.md
│  │  ├─ faq.md
│  │  └─ changelog.md
│  ├─ team/              # 团队协作
│  │  ├─ team-handbook.md
│  │  └─ design-system.md
│  └─ developer/         # 开发者
│     └─ api-guide.md
└─ README.md
```

---

## 文章 JSON 清单

`article/article.json` 是文章目录的机器可读清单，用于脚本、静态站点生成器或其他工具读取**主题**和文章元数据。它只保存索引和元数据，不重复正文；正文按主题分组存放在同名子目录中。

- **格式标识**：`happydays-article-manifest`
- **当前版本**：`1`
- **当前主题数**：4
- **当前文章数**：8
- **最近更新**：`2026-10-22`
- **文件路径**：`article/article.json`

主题文件夹名使用稳定的主题 ID，而不是中文显示名：

| 主题 ID | 显示名称 | 目录 |
| --- | --- | --- |
| `start` | 开始使用 | `article/start/` |
| `product` | 产品手册 | `article/product/` |
| `team` | 团队协作 | `article/team/` |
| `developer` | 开发者 | `article/developer/` |

### 格式示例

以下为节选示例，实际文件包含全部 4 个主题和 8 篇文章：

```jsonc
{
  "format": "happydays-article-manifest",
  "version": 1,
  "site": {
    "name": "HappyDays非官方文档",
    "team": "HappyDays 团队",
    "tagline": "团队知识库",
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
      "order": 1,
      "articleCount": 2
    },
    {
      "id": "product",
      "name": "产品手册",
      "description": "关于 HappyDays非官方文档的一切使用说明。",
      "directory": "product",
      "order": 2,
      "articleCount": 3
    },
    {
      "id": "team",
      "name": "团队协作",
      "description": "我们如何沟通、开会和共同写作。",
      "directory": "team",
      "order": 3,
      "articleCount": 2
    },
    {
      "id": "developer",
      "name": "开发者",
      "description": "把知识库接入你的工作流。",
      "directory": "developer",
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
      "source": "../index.html#/doc/welcome"
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
| `site` | object | 站点信息，包含 `name`、`team`、`tagline`、`language` |
| `topicCount` | integer | 主题总数，必须等于 `topics.length` |
| `articleCount` | integer | 文章总数，必须等于 `articles.length` |
| `lastUpdated` | string | 所有文章 `updated` 中的最大日期，格式 `YYYY-MM-DD` |
| `topics` | array | 主题对象列表，按 `order` 升序排列 |
| `articles` | array | 文章对象列表，按 `order` 升序排列 |

### 主题字段

| 字段 | 类型 | 说明 |
| --- | --- | --- |
| `id` | string | 主题唯一标识，也是文章 `topic` 的引用值 |
| `name` | string | 主题显示名称，例如 `开始使用` |
| `description` | string | 主题说明 |
| `directory` | string | 主题在 `article/` 下的文件夹名 |
| `order` | integer | 主题展示顺序，从 `1` 开始 |
| `articleCount` | integer | 该主题下文章数量 |

### 文章字段

| 字段 | 类型 | 说明 |
| --- | --- | --- |
| `slug` | string | 唯一标识，与 Markdown 文件名去扩展名后一致 |
| `order` | integer | 全站阅读顺序，从 `1` 开始 |
| `topic` | string | 所属主题的 `topics[].id` |
| `title` | string | 文章标题 |
| `description` | string | 文章摘要 |
| `emoji` | string | 文章图标 |
| `updated` | string | 最后更新日期，格式 `YYYY-MM-DD` |
| `readingTime` | integer | 预计阅读时间，单位为分钟 |
| `tags` | string[] | 文章标签，可为空数组 |
| `file` | string | Markdown 文件路径，相对于 `article/` 目录 |
| `source` | string | 在线页面地址，相对于 `article/article.json` |

每篇 Markdown 的 front matter 同时包含 `topic`（显示名称）和 `topic_id`（主题 ID），与 JSON 中文章的 `topic` 字段对应。Markdown 的 `source` 相对于文章文件所在目录，JSON 的 `source` 则相对于 `article/article.json`。

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
- 扫描 `article/<topic>/<slug>.md`，解析 YAML front matter
- 校验主题目录、slug、order、标题、摘要、标签等是否与清单一致
- 将 Markdown 转换为站点使用的 HTML
- 生成 `assets/data.js`，包含 `categories`、`docs`、`allIds` 和 `site`

构建失败时会输出具体文件和字段，修复后重新运行即可；校验失败时不会改写 `assets/data.js`。

---

## 新增或修改文章

### 1. 确认主题目录

每篇文章必须位于 `article/<topic-id>/` 下。主题 ID 与目录名必须一致，例如：

```text
article/start/quickstart.md
article/product/faq.md
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
source: "../../index.html#/doc/onboarding"
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
  "source": "../index.html#/doc/onboarding"
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

这是一个运行时无框架依赖的静态项目。修改 `article/` 后先运行 `python build.py` 更新 `assets/data.js`，再把整个目录上传到任意静态托管即可。

**GitHub Pages**：把文件推到仓库 → Settings → Pages → 选择分支根目录。

**Netlify / Vercel**：导入仓库，构建命令留空，发布目录填 `.`（也可将构建命令设为 `python build.py`）。

**Nginx / Apache**：直接把目录作为站点根目录。由于使用 hash 路由，不需要额外的 `try_files` 或 rewrite 规则。

静态部署时不会包含可用的编辑 API，阅读页的「编辑」入口会自动隐藏；如需编辑，请在本地运行 `python server.py`。不要在公网静态服务器上直接部署 `server.py`。

---

## 说明

- 搜索、主题、目录折叠等状态保存在浏览器 `localStorage` 中，不会上传到服务器。
- 编辑服务默认只监听本机，没有账号与权限系统；不要将其暴露到公网。
- 邀请链接、评论、在线多人协作等需要完整后端的能力未包含在这个版本中。
- 全部示例文案与人物均为虚构，可自由替换。
