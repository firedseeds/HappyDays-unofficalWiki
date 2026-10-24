# HappyDays非官方文档

一个类似语雀文档体验的 **纯静态团队知识库**。没有构建步骤、没有第三方依赖，双击 `index.html` 即可离线阅读，也可以直接部署到 GitHub Pages、Vercel、Netlify 或任意静态服务器。

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

---

## 已实现的功能

### 阅读与导航

- 知识库目录树，按「开始使用 / 产品手册 / 团队协作 / 开发者」分组，可折叠并记住状态
- 基于 URL hash 的文档路由，例如 `#/doc/api-guide`，可直接分享、刷新和前进后退
- 自动生成右侧页面目录（TOC），滚动时高亮当前章节
- 顶部阅读进度、百分比、回到顶部
- 上一篇 / 下一篇、当前目录、面包屑与收藏状态
- 宽屏阅读模式、打印 / 导出 PDF 排版
- 移动端侧边栏抽屉和独立目录抽屉

### 搜索

- `Ctrl / ⌘ + K` 或 `/` 唤起全局搜索
- 同时检索标题、摘要、标签与正文
- 标题匹配加权，最近浏览记录，结果关键词高亮
- 支持 `↑` `↓` `Enter` `Esc` 键盘操作

### 阅读体验

- 亮色 / 深色主题，跟随系统偏好并记住选择
- 文档收藏、页面反馈（有帮助 / 需改进）持久化到本地
- 代码块一键复制、FAQ 折叠、时间线、色板、表格等文档组件
- 无障碍语义、键盘焦点管理、`prefers-reduced-motion` 支持
- 无外部字体、图片或 CDN 请求，完全离线可用

---

## 目录结构

```text
.
├─ index.html            # 页面骨架、图标 sprite、阅读器 UI
├─ assets/
│  ├─ styles.css         # 设计系统、布局、组件、响应式与打印样式
│  ├─ data.js            # 分类、文档元数据与全部正文
│  └─ app.js             # 路由、搜索、目录、主题与交互
├─ article/
│  ├─ article.json       # 文章索引与元数据的机器可读清单
│  └─ *.md               # 按 slug 命名的 Markdown 文章正文
└─ README.md
```

---

## 文章 JSON 清单

`article/article.json` 是文章目录的机器可读清单，用于脚本、静态站点生成器或其他工具读取文章元数据。它只保存索引和元数据，不重复正文；正文以同目录下的 Markdown 文件为准。

- **格式标识**：`happydays-article-manifest`
- **当前版本**：`1`
- **当前文章数**：8
- **最近更新**：`2026-10-22`
- **文件路径**：`article/article.json`

### 格式示例

以下为节选示例，实际文件包含全部 8 篇文章：

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
  "articleCount": 8,
  "lastUpdated": "2026-10-22",
  "articles": [
    {
      "slug": "welcome",
      "order": 1,
      "title": "欢迎来到 HappyDays非官方文档",
      "description": "把散落在聊天、会议与脑海里的经验，种成一片随时可以查阅的森林。",
      "emoji": "🌱",
      "category": {
        "id": "start",
        "name": "开始使用"
      },
      "author": {
        "name": "林知夏",
        "role": "知识运营"
      },
      "updated": "2026-10-21",
      "readingTime": 6,
      "tags": ["必读", "新成员", "团队文化"],
      "file": "welcome.md",
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
| `articleCount` | integer | 文章总数，必须等于 `articles.length` |
| `lastUpdated` | string | 所有文章 `updated` 中的最大日期，格式 `YYYY-MM-DD` |
| `articles` | array | 文章对象列表，按 `order` 升序排列 |

### 文章字段

| 字段 | 类型 | 说明 |
| --- | --- | --- |
| `slug` | string | 唯一标识，与 Markdown 文件名去扩展名后一致 |
| `order` | integer | 全站阅读顺序，从 `1` 开始 |
| `title` | string | 文章标题 |
| `description` | string | 文章摘要 |
| `emoji` | string | 文章图标 |
| `category.id` | string | 分类 ID |
| `category.name` | string | 分类显示名称 |
| `author.name` | string | 作者显示名称 |
| `author.role` | string | 作者角色 |
| `updated` | string | 最后更新日期，格式 `YYYY-MM-DD` |
| `readingTime` | integer | 预计阅读时间，单位为分钟 |
| `tags` | string[] | 文章标签，可为空数组 |
| `file` | string | Markdown 文件名，相对于 `article/` 目录 |
| `source` | string | 在线页面地址，相对于 `article/` 目录 |

### 维护规则

1. 所有字段均为必填，不使用 `null`。
2. `file` 指向的文章必须存在；`slug` 必须与文件名主体一致。
3. `articleCount` 必须等于 `articles.length`，`lastUpdated` 必须等于最新文章的 `updated`。
4. 新增或删除文章时，同时更新 Markdown 文件和本清单。
5. `order` 决定 JSON 中的阅读顺序，建议与站点目录顺序保持一致。

---

## 添加你自己的文档

所有内容都在 `assets/data.js` 中。

### 1. 添加分类

```js
var categories = [
  // ...
  {
    id: "handbook",
    name: "员工手册",
    description: "入职、假期与日常制度。",
    docs: ["onboarding"]
  }
];
```

### 2. 添加文档

```js
var docs = {
  // ...
  onboarding: {
    title: "入职第一周",
    emoji: "🌿",
    category: "handbook",
    excerpt: "账号、设备与第一周日程，一页说清楚。",
    author: { name: "林知夏", role: "知识运营", initial: "知" },
    updated: "2026-11-01",
    reading: 5,
    tags: ["入职", "新成员"],
    content: `
      <p>这是一个普通段落。</p>

      <h2>第一天</h2>
      <p>领取设备，加入群组，认识你的伙伴。</p>

      <div class="callout callout--tip">
        <span class="callout-icon">
          <svg class="icon" aria-hidden="true"><use href="#i-bulb"></use></svg>
        </span>
        <div class="callout-content">
          <p class="callout-title">小提示</p>
          <p>有任何问题，随时在群里提问。</p>
        </div>
      </div>
    `
  }
};
```

> `category` 必须对应 `categories` 中的某个 `id`，并确保该分类的 `docs` 数组包含新文档 ID。文档顺序即上一篇 / 下一篇的顺序。

---

## 可复用的内容组件

正文支持以下 HTML 组件，样式均已内置：

| 组件 | 用法 |
| --- | --- |
| 提示框 | `.callout.callout--tip` / `--note` / `--warning` |
| 链接卡片 | `.card-grid` + `.link-card` |
| 步骤条 | `ol.steps` |
| 检查清单 | `ul.checklist` |
| 表格 | `.table-wrap > table` |
| 代码块 | `.code-block` + `.code-head` + `pre > code` |
| FAQ 折叠 | `details.faq-item` + `summary.faq-question` |
| 时间线 | `ul.timeline` + `.timeline-item` |
| 色板 | `.swatch-grid` + `.swatch` |
| 按钮预览 | `.button-demo` + `.demo-btn` |

代码块中的 `<`、`>`、`&` 需要写成 `&lt;`、`&gt;`、`&amp;`，避免被浏览器解析为标签。

---

## 修改品牌与主题

品牌名分布在：

- `index.html` 的标题、`brand-name`、侧边栏账号信息
- `assets/data.js` 末尾的 `site` 配置
- `assets/styles.css` 顶部的 CSS 变量

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

这是一个无构建项目，将整个目录上传到任意静态托管即可。

**GitHub Pages**：把文件推到仓库 → Settings → Pages → 选择分支根目录。

**Netlify / Vercel**：导入仓库，构建命令留空，发布目录填 `.`。

**Nginx / Apache**：直接把目录作为站点根目录。由于使用 hash 路由，不需要额外的 `try_files` 或 rewrite 规则。

---

## 说明

- 搜索、收藏、反馈、主题、目录折叠等状态保存在浏览器 `localStorage` 中，不会上传到服务器。
- 邀请链接、评论、在线编辑等需要后端的能力未包含在这个静态版本中。
- 全部示例文案与人物均为虚构，可自由替换。
