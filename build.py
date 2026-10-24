#!/usr/bin/env python3
"""Build assets/data.js from the Markdown articles in article/.

Usage:
    python build.py

The article/ directory is the source of truth:
  - article/article.json defines topics and article ordering/metadata.
  - article/<topic>/<slug>.md contains the article body and front matter.

This script has no third-party dependencies.
"""

from __future__ import annotations

import html as html_lib
import json
import re
import sys
from pathlib import Path


ROOT = Path(__file__).resolve().parent
ARTICLE_DIR = ROOT / "article"
MANIFEST_PATH = ARTICLE_DIR / "article.json"
OUTPUT_PATH = ROOT / "assets" / "data.js"

REQUIRED_FRONT_MATTER = (
    "title",
    "description",
    "topic_id",
    "updated",
    "reading_time",
    "emoji",
    "order",
    "slug",
    "tags",
)

ALERT_TYPES = {
    "TIP": ("tip", "i-bulb"),
    "NOTE": ("note", "i-info"),
    "WARNING": ("warning", "i-alert"),
    "CAUTION": ("warning", "i-alert"),
    "IMPORTANT": ("note", "i-info"),
}

LANGUAGE_LABELS = {
    "bash": "Bash",
    "shell": "Shell",
    "javascript": "JavaScript",
    "js": "JavaScript",
    "json": "JSON",
    "html": "HTML",
    "css": "CSS",
    "markdown": "Markdown",
    "md": "Markdown",
    "http": "HTTP",
    "text": "Text",
    "plaintext": "Text",
}


class BuildError(Exception):
    """A user-facing build error."""


def fail(message: str) -> None:
    raise BuildError(message)


def escape_text(value: str) -> str:
    return html_lib.escape(value, quote=False)


def js_string(value: object) -> str:
    return json.dumps(value, ensure_ascii=False)


def js_template(value: str) -> str:
    """Return a JavaScript template literal that evaluates to exactly value."""
    escaped = value.replace("\\", "\\\\").replace("`", "\\`").replace("${", "\\${")
    return "`" + escaped + "`"


def parse_scalar(value: str) -> object:
    value = value.strip()
    if value.startswith('"') and value.endswith('"'):
        try:
            return json.loads(value)
        except json.JSONDecodeError as exc:
            fail(f"无法解析 front matter 字符串: {value!r} ({exc})")
    if re.fullmatch(r"-?\d+", value):
        return int(value)
    if value in ("true", "false"):
        return value == "true"
    if value in ("null", "~"):
        return None
    return value


def split_front_matter(text: str, relative_path: str) -> tuple[dict, str]:
    text = text.replace("\r\n", "\n").replace("\r", "\n")
    if not text.startswith("---\n"):
        fail(f"{relative_path}: 缺少 YAML front matter")
    end = text.find("\n---\n", 4)
    if end == -1:
        fail(f"{relative_path}: front matter 未闭合")
    header = text[4:end]
    body = text[end + 5 :]

    data: dict[str, object] = {}
    list_key = None
    for line_number, raw_line in enumerate(header.splitlines(), start=2):
        if not raw_line.strip() or raw_line.lstrip().startswith("#"):
            continue
        if raw_line.startswith("  - "):
            if list_key is None or not isinstance(data.get(list_key), list):
                fail(f"{relative_path}:{line_number}: 列表项没有对应的键")
            data[list_key].append(parse_scalar(raw_line[4:]))
            continue
        if ":" not in raw_line:
            fail(f"{relative_path}:{line_number}: 无法解析 front matter 行: {raw_line!r}")
        key, value = raw_line.split(":", 1)
        key = key.strip()
        value = value.strip()
        if not key:
            fail(f"{relative_path}:{line_number}: 空字段名")
        if value == "":
            data[key] = []
            list_key = key
        else:
            data[key] = parse_scalar(value)
            list_key = None
    return data, body


class MarkdownRenderer:
    """Small Markdown renderer for the subset used by article/*.md."""

    def __init__(self, articles_by_file: dict[Path, dict], current_file: Path):
        self.articles_by_file = articles_by_file
        self.current_file = current_file

    def render(self, markdown: str) -> str:
        lines = markdown.split("\n")
        return "\n".join(self.render_blocks(lines)).strip()

    def inline(self, text: str) -> str:
        code_spans: list[str] = []
        image_spans: list[str] = []

        def stash_code(match: re.Match) -> str:
            code_spans.append("<code>" + escape_text(match.group(1)) + "</code>")
            return f"\x00{len(code_spans) - 1}\x00"

        def stash_image(match: re.Match) -> str:
            alt = match.group(1)
            src = html_lib.unescape(match.group(2).strip())
            title = match.group(3)
            source = self.resolve_image_src(src)
            alt_text = html_lib.escape(html_lib.unescape(alt), quote=True)
            attributes = (
                f' src="{html_lib.escape(source, quote=True)}"'
                f' alt="{alt_text}"'
                ' loading="lazy" decoding="async"'
            )
            if title:
                attributes += f' title="{html_lib.escape(title, quote=True)}"'
            image_spans.append(f"<img{attributes}>")
            return f"\x00img{len(image_spans) - 1}\x00"

        text = re.sub(r"`([^`\n]+)`", stash_code, text)
        text = escape_text(text)
        text = re.sub(
            r"!\[([^\]]*)\]\(([^)\s]+)(?:\s+[\"']([^\"']*)[\"'])?\)",
            stash_image,
            text,
        )
        text = re.sub(r"\*\*(.+?)\*\*", r"<strong>\1</strong>", text, flags=re.S)
        text = re.sub(r"(?<!\*)\*(?!\*)(.+?)(?<!\*)\*(?!\*)", r"<em>\1</em>", text, flags=re.S)

        def replace_link(match: re.Match) -> str:
            label = match.group(1)
            href = html_lib.unescape(match.group(2))
            href = self.resolve_href(href)
            return f'<a href="{html_lib.escape(href, quote=True)}">{label}</a>'

        text = re.sub(r"\[([^\]]+)\]\(([^)]+)\)", replace_link, text)
        for index, fragment in enumerate(code_spans):
            text = text.replace(f"\x00{index}\x00", fragment)
        for index, fragment in enumerate(image_spans):
            text = text.replace(f"\x00img{index}\x00", fragment)
        return text

    def resolve_image_src(self, src: str) -> str:
        src = src.strip()
        if not src:
            fail(f"{self.relative(self.current_file)}: 图片缺少地址")
        if src.startswith(("http://", "https://", "data:", "//")):
            return src
        target = (self.current_file.parent / src).resolve()
        try:
            target.relative_to(ROOT.resolve())
        except ValueError:
            fail(f"{self.relative(self.current_file)}: 图片指向项目之外: {src}")
        if not target.is_file():
            fail(f"{self.relative(self.current_file)}: 图片文件不存在: {src}")
        return target.relative_to(ROOT.resolve()).as_posix()

    def resolve_href(self, href: str) -> str:
        href = href.strip()
        if not href:
            return href
        if href.startswith(("http://", "https://", "mailto:", "#")):
            return href
        if not href.lower().endswith(".md"):
            return href

        clean = href.split("#", 1)[0]
        target = (self.current_file.parent / clean).resolve()
        try:
            target.relative_to(ARTICLE_DIR.resolve())
        except ValueError:
            fail(f"{self.relative(self.current_file)}: 链接指向 article/ 之外: {href}")
        if not target.is_file():
            fail(f"{self.relative(self.current_file)}: 链接目标不存在: {href}")
        article = self.articles_by_file.get(target)
        if article is None:
            fail(f"{self.relative(self.current_file)}: 链接目标没有对应的文章清单: {href}")
        return "#/doc/" + article["slug"]

    @staticmethod
    def relative(path: Path) -> str:
        return path.relative_to(ROOT).as_posix()

    def is_table_separator(self, line: str) -> bool:
        if "|" not in line:
            return False
        cells = self.split_table_row(line)
        return bool(cells) and all(re.fullmatch(r":?-{3,}:?", cell.strip()) for cell in cells)

    @staticmethod
    def split_table_row(line: str) -> list[str]:
        value = line.strip()
        if value.startswith("|"):
            value = value[1:]
        if value.endswith("|"):
            value = value[:-1]
        cells = re.split(r"(?<!\\)\|", value)
        return [cell.replace("\\|", "|").strip() for cell in cells]

    def render_table(self, lines: list[str], start: int) -> tuple[str, int]:
        header = self.split_table_row(lines[start])
        index = start + 2
        rows: list[list[str]] = []
        while index < len(lines) and lines[index].strip():
            line = lines[index].strip()
            if not line.startswith("|"):
                break
            row = self.split_table_row(line)
            row = (row + [""] * len(header))[: len(header)]
            rows.append(row)
            index += 1

        header_html = "".join(f"<th>{self.inline(cell)}</th>" for cell in header)
        rows_html = []
        for row in rows:
            cells = "".join(f"<td>{self.inline(cell)}</td>" for cell in row)
            rows_html.append(f"<tr>{cells}</tr>")
        table = (
            '<div class="table-wrap"><table><thead><tr>'
            + header_html
            + "</tr></thead><tbody>"
            + "".join(rows_html)
            + "</tbody></table></div>"
        )
        return table, index

    def render_code(self, language: str, code: str) -> str:
        language = language.strip().lower()
        label = LANGUAGE_LABELS.get(language, language.capitalize() if language else "Code")
        return (
            f'<div class="code-block" data-lang="{html_lib.escape(language, quote=True)}">\n'
            '<div class="code-head">\n'
            '<span class="code-language"><span class="code-dots" aria-hidden="true">'
            "<i></i><i></i><i></i></span>"
            + html_lib.escape(label)
            + "</span>\n"
            '<button class="code-copy" type="button">'
            '<svg class="icon" aria-hidden="true"><use href="#i-copy"></use></svg>复制'
            "</button>\n"
            "</div>\n"
            "<pre><code>"
            + escape_text(code)
            + "</code></pre>\n"
            "</div>"
        )

    def render_callout(self, kind: str, content: list[str]) -> str:
        content = list(content)
        while content and not content[0].strip():
            content.pop(0)
        while content and not content[-1].strip():
            content.pop()
        if not content:
            return ""

        title_html = ""
        first = content[0].strip()
        if first.startswith("**") and first.endswith("**") and len(first) > 4:
            title_html = (
                '<p class="callout-title">'
                + self.inline(first[2:-2].strip())
                + "</p>"
            )
            content = content[1:]
            while content and not content[0].strip():
                content.pop(0)

        body = "\n".join(self.render_blocks(content))
        return (
            f'<div class="callout callout--{kind}">\n'
            f'<span class="callout-icon"><svg class="icon" aria-hidden="true">'
            f'<use href="#{ALERT_TYPES_ICONS.get(kind, "i-info")}"></use></svg></span>\n'
            '<div class="callout-content">\n'
            + title_html
            + body
            + "\n</div>\n</div>"
        )

    def render_blockquote(self, lines: list[str], start: int) -> tuple[str, int]:
        content: list[str] = []
        index = start
        while index < len(lines) and lines[index].startswith(">"):
            line = lines[index][1:]
            if line.startswith(" "):
                line = line[1:]
            content.append(line.rstrip())
            index += 1

        marker = next((line.strip() for line in content if line.strip()), "")
        alert_match = re.fullmatch(r"\[!(TIP|NOTE|WARNING|CAUTION|IMPORTANT)\]", marker)
        if alert_match:
            alert_type = alert_match.group(1)
            content = [line for line in content if line.strip() != marker]
            while content and not content[0].strip():
                content.pop(0)
            kind = ALERT_TYPES[alert_type][0]
            return self.render_callout(kind, content), index

        inner = "\n".join(self.render_blocks(content))
        return f"<blockquote>\n{inner}\n</blockquote>", index

    def render_steps(self, lines: list[str], start: int) -> tuple[str, int]:
        index = start
        items: list[str] = []
        ordered = re.compile(r"^\d+\.\s+(.*)$")

        while index < len(lines):
            match = ordered.match(lines[index])
            if not match:
                break
            title_markdown = match.group(1).strip()
            index += 1
            paragraphs: list[str] = []
            current: list[str] = []

            while index < len(lines):
                line = lines[index]
                if not line.strip():
                    lookahead = index
                    while lookahead < len(lines) and not lines[lookahead].strip():
                        lookahead += 1
                    if (
                        lookahead < len(lines)
                        and lines[lookahead].startswith(("   ", "\t"))
                        and not ordered.match(lines[lookahead].strip())
                    ):
                        if current:
                            paragraphs.append(" ".join(current))
                            current = []
                        index = lookahead
                        continue
                    break
                if ordered.match(line):
                    break
                if line.startswith(("   ", "\t")):
                    current.append(line.strip())
                    index += 1
                    continue
                break

            if current:
                paragraphs.append(" ".join(current))

            while index < len(lines) and not lines[index].strip():
                lookahead = index
                while lookahead < len(lines) and not lines[lookahead].strip():
                    lookahead += 1
                if lookahead < len(lines) and ordered.match(lines[lookahead]):
                    index = lookahead
                    break
                break

            if title_markdown.startswith("**") and title_markdown.endswith("**") and len(title_markdown) > 4:
                title_html = "<strong>" + self.inline(title_markdown[2:-2]) + "</strong>"
            else:
                title_html = self.inline(title_markdown)
            paragraphs_html = "".join(f"<p>{self.inline(p)}</p>" for p in paragraphs)
            items.append(f"<li>{title_html}{paragraphs_html}</li>")

        return '<ol class="steps">' + "".join(items) + "</ol>", index

    def render_unordered_list(self, lines: list[str], start: int) -> tuple[str, int]:
        index = start
        items: list[str] = []
        pattern = re.compile(r"^[-*+]\s+(.*)$")
        while index < len(lines):
            match = pattern.match(lines[index])
            if not match:
                break
            items.append("<li>" + self.inline(match.group(1).strip()) + "</li>")
            index += 1
        return "<ul>" + "".join(items) + "</ul>", index

    def render_blocks(self, lines: list[str]) -> list[str]:
        blocks: list[str] = []
        index = 0
        while index < len(lines):
            line = lines[index]
            if not line.strip():
                index += 1
                continue

            fence = re.match(r"^```([A-Za-z0-9_+#.-]*)\s*$", line)
            if fence:
                language = fence.group(1)
                index += 1
                code_lines = []
                while index < len(lines) and not re.match(r"^```\s*$", lines[index]):
                    code_lines.append(lines[index])
                    index += 1
                if index >= len(lines):
                    fail(f"{self.relative(self.current_file)}: 代码块未闭合")
                index += 1
                blocks.append(self.render_code(language, "\n".join(code_lines)))
                continue

            heading = re.match(r"^(#{1,6})\s+(.*)$", line)
            if heading:
                level = len(heading.group(1))
                blocks.append(f"<h{level}>{self.inline(heading.group(2).strip())}</h{level}>")
                index += 1
                continue

            if line.startswith(">"):
                rendered, index = self.render_blockquote(lines, index)
                blocks.append(rendered)
                continue

            if line.strip().startswith("|") and index + 1 < len(lines) and self.is_table_separator(lines[index + 1]):
                rendered, index = self.render_table(lines, index)
                blocks.append(rendered)
                continue

            if re.fullmatch(r"\s*([-*_])\1{2,}\s*", line):
                blocks.append("<hr>")
                index += 1
                continue

            if re.match(r"^\d+\.\s+", line):
                rendered, index = self.render_steps(lines, index)
                blocks.append(rendered)
                continue

            if re.match(r"^[-*+]\s+", line):
                rendered, index = self.render_unordered_list(lines, index)
                blocks.append(rendered)
                continue

            paragraph: list[str] = []
            while index < len(lines):
                current = lines[index]
                if not current.strip():
                    break
                if (
                    current.startswith(("```", ">", "|"))
                    or re.match(r"^#{1,6}\s+", current)
                    or re.match(r"^\d+\.\s+", current)
                    or re.match(r"^[-*+]\s+", current)
                    or re.fullmatch(r"\s*([-*_])\1{2,}\s*", current)
                ):
                    break
                paragraph.append(current.strip())
                index += 1
            if paragraph:
                blocks.append("<p>" + self.inline(" ".join(paragraph)) + "</p>")
        return blocks


ALERT_TYPES_ICONS = {
    "tip": "i-bulb",
    "note": "i-info",
    "warning": "i-alert",
}


def discover_articles() -> tuple[dict, list[dict], dict[Path, dict]]:
    if not MANIFEST_PATH.is_file():
        fail(f"找不到清单文件: {MANIFEST_PATH.relative_to(ROOT)}")
    try:
        manifest = json.loads(MANIFEST_PATH.read_text(encoding="utf-8"))
    except json.JSONDecodeError as exc:
        fail(f"article/article.json 不是合法 JSON: {exc}")

    if manifest.get("format") != "happydays-article-manifest":
        fail("article/article.json 的 format 不是 happydays-article-manifest")
    topics = manifest.get("topics")
    articles = manifest.get("articles")
    if not isinstance(topics, list):
        fail("article/article.json 缺少 topics 数组")
    if not isinstance(articles, list):
        fail("article/article.json 缺少 articles 数组")
    if manifest.get("topicCount") != len(topics):
        fail("article/article.json: topicCount 与 topics.length 不一致")
    if manifest.get("articleCount") != len(articles):
        fail("article/article.json: articleCount 与 articles.length 不一致")

    topic_by_id = {}
    for topic in topics:
        for field in ("id", "name", "description", "directory", "order", "articleCount"):
            if field not in topic:
                fail(f"主题缺少字段 {field}: {topic!r}")
        if topic["id"] in topic_by_id:
            fail(f"主题 ID 重复: {topic['id']}")
        topic_by_id[topic["id"]] = topic

    article_by_file: dict[Path, dict] = {}
    seen_slugs = set()
    for article in articles:
        for field in ("slug", "order", "topic", "file"):
            if field not in article:
                fail(f"文章缺少字段 {field}: {article!r}")
        slug = article["slug"]
        if slug in seen_slugs:
            fail(f"文章 slug 重复: {slug}")
        seen_slugs.add(slug)
        if article["topic"] not in topic_by_id:
            fail(f"{slug}: topic {article['topic']} 不存在")
        file_path = (ARTICLE_DIR / article["file"]).resolve()
        if not file_path.is_file():
            fail(f"{slug}: Markdown 文件不存在: article/{article['file']}")
        if file_path in article_by_file:
            fail(f"多个文章指向同一文件: article/{article['file']}")
        article_by_file[file_path] = article

    found_markdown = {
        path.resolve()
        for path in ARTICLE_DIR.glob("*/*.md")
        if path.is_file()
    }
    expected_markdown = set(article_by_file)
    if found_markdown != expected_markdown:
        missing = expected_markdown - found_markdown
        extra = found_markdown - expected_markdown
        details = []
        if missing:
            details.append("缺少 " + ", ".join(sorted(str(p.relative_to(ROOT)) for p in missing)))
        if extra:
            details.append("未登记 " + ", ".join(sorted(str(p.relative_to(ROOT)) for p in extra)))
        fail("Markdown 文件与 article.json 不一致: " + "; ".join(details))

    return manifest, topics, article_by_file


def strip_title_and_excerpt(body: str, title: str, excerpt: str, relative_path: str) -> str:
    lines = body.split("\n")
    index = 0
    while index < len(lines) and not lines[index].strip():
        index += 1
    if index >= len(lines) or not lines[index].startswith("# "):
        fail(f"{relative_path}: 正文必须以一级标题开头")
    heading = lines[index][2:].strip()
    if heading != title:
        fail(f"{relative_path}: 一级标题与 front matter title 不一致")
    index += 1

    while index < len(lines) and not lines[index].strip():
        index += 1
    if index < len(lines):
        intro = lines[index].strip()
        if intro.startswith("*") and intro.endswith("*") and not intro.startswith("**"):
            intro_text = intro[1:-1].replace("\\*", "*").strip()
            if intro_text == excerpt:
                index += 1
    while index < len(lines) and not lines[index].strip():
        index += 1
    return "\n".join(lines[index:])


def parse_article(path: Path, manifest_article: dict, topics: dict, articles_by_file: dict) -> dict:
    relative_path = path.relative_to(ROOT).as_posix()
    raw = path.read_text(encoding="utf-8")
    front, body = split_front_matter(raw, relative_path)
    for field in REQUIRED_FRONT_MATTER:
        if field not in front:
            fail(f"{relative_path}: front matter 缺少 {field}")

    topic_id = front["topic_id"]
    if topic_id not in topics:
        fail(f"{relative_path}: topic_id {topic_id!r} 不在 article.json 的 topics 中")
    topic = topics[topic_id]
    if path.parent.name != topic["directory"]:
        fail(f"{relative_path}: 文件必须位于 article/{topic['directory']}/")

    if front["slug"] != path.stem:
        fail(f"{relative_path}: slug 与文件名不一致")
    if front["slug"] != manifest_article["slug"]:
        fail(f"{relative_path}: slug 与 article.json 不一致")
    if topic_id != manifest_article["topic"]:
        fail(f"{relative_path}: topic_id 与 article.json 不一致")
    if front["order"] != manifest_article["order"]:
        fail(f"{relative_path}: order 与 article.json 不一致")
    if "topic" in front and front["topic"] != topic["name"]:
        fail(f"{relative_path}: topic 显示名称与 article.json 不一致")

    for left, right, label in (
        (front["title"], manifest_article.get("title"), "title"),
        (front["description"], manifest_article.get("description"), "description"),
        (front["emoji"], manifest_article.get("emoji"), "emoji"),
        (front["updated"], manifest_article.get("updated"), "updated"),
        (front["reading_time"], manifest_article.get("readingTime"), "reading_time"),
        (front["tags"], manifest_article.get("tags"), "tags"),
    ):
        if left != right:
            fail(f"{relative_path}: front matter {label} 与 article.json 不一致")

    if not isinstance(front["order"], int) or front["order"] < 1:
        fail(f"{relative_path}: order 必须是正整数")
    if not isinstance(front["reading_time"], int) or front["reading_time"] <= 0:
        fail(f"{relative_path}: reading_time 必须是正整数")
    if not isinstance(front["tags"], list) or not all(isinstance(tag, str) for tag in front["tags"]):
        fail(f"{relative_path}: tags 必须是字符串数组")
    if not re.fullmatch(r"\d{4}-\d{2}-\d{2}", str(front["updated"])):
        fail(f"{relative_path}: updated 必须为 YYYY-MM-DD")

    body = strip_title_and_excerpt(body, front["title"], front["description"], relative_path)
    renderer = MarkdownRenderer(articles_by_file, path)
    content = renderer.render(body)
    if not content:
        fail(f"{relative_path}: 正文为空")

    return {
        "slug": front["slug"],
        "order": front["order"],
        "topic": topic_id,
        "title": front["title"],
        "excerpt": front["description"],
        "emoji": front["emoji"],
        "updated": str(front["updated"]),
        "reading": front["reading_time"],
        "tags": front["tags"],
        "content": content,
    }


def build_manifest(articles: list[dict], topics: list[dict], site: dict) -> str:
    by_topic: dict[str, list[dict]] = {topic["id"]: [] for topic in topics}
    for article in articles:
        by_topic[article["topic"]].append(article)

    for topic in topics:
        count = len(by_topic[topic["id"]])
        if topic.get("articleCount") != count:
            fail(
                f"主题 {topic['id']} 的 articleCount={topic.get('articleCount')}，"
                f"实际为 {count}"
            )

    lines: list[str] = [
        "/* =========================================================",
        "   HappyDays非官方文档 — content model",
        "   该文件由 build.py 根据 article/ 自动生成，请勿直接编辑。",
        "   ========================================================= */",
        "",
        "window.HAPPYDAYS_WIKI = (function () {",
        '  "use strict";',
        "",
        "  var categories = [",
    ]
    for index, topic in enumerate(topics):
        docs = [article["slug"] for article in by_topic[topic["id"]]]
        lines.extend(
            [
                "    {",
                f"      id: {js_string(topic['id'])},",
                f"      name: {js_string(topic['name'])},",
                f"      description: {js_string(topic['description'])},",
                f"      docs: [{', '.join(js_string(slug) for slug in docs)}]",
                "    }" + ("," if index < len(topics) - 1 else ""),
            ]
        )
    lines.extend(["  ];", "", "  var docs = {"])

    for article_index, article in enumerate(articles):
        lines.extend(
            [
                f"    {js_string(article['slug'])}: {{",
                f"      title: {js_string(article['title'])},",
                f"      emoji: {js_string(article['emoji'])},",
                f"      category: {js_string(article['topic'])},",
                f"      excerpt: {js_string(article['excerpt'])},",
                f"      updated: {js_string(article['updated'])},",
                f"      reading: {article['reading']},",
                f"      tags: {js_string(article['tags'])},",
                f"      content: {js_template(article['content'])}",
                "    }" + ("," if article_index < len(articles) - 1 else ""),
            ]
        )
    lines.extend(
        [
            "  };",
            "",
            "  var allIds = [",
        ]
    )
    if articles:
        lines.append("    " + ", ".join(js_string(article["slug"]) for article in articles))
    lines.extend(
        [
            "  ];",
            "",
            "  return {",
            "    site: {",
            "      name: " + js_string(site["name"]) + ",",
            "      team: " + js_string(site["team"]) + ",",
            "      tagline: " + js_string(site["tagline"]),
            "    },",
            "    categories: categories,",
            "    docs: docs,",
            "    allIds: allIds",
            "  };",
            "})();",
            "",
        ]
    )
    return "\n".join(lines)


def main() -> int:
    try:
        manifest, topics, article_by_file = discover_articles()
        site = manifest.get("site")
        if not isinstance(site, dict):
            fail("article/article.json 缺少 site 对象")
        for field in ("name", "team", "tagline"):
            if not isinstance(site.get(field), str) or not site[field]:
                fail(f"article/article.json 的 site.{field} 必须是非空字符串")
        topic_by_id = {t["id"]: t for t in topics}
        articles = []
        for manifest_article in manifest["articles"]:
            path = (ARTICLE_DIR / manifest_article["file"]).resolve()
            articles.append(parse_article(path, manifest_article, topic_by_id, article_by_file))
        articles.sort(key=lambda article: article["order"])
        if [article["order"] for article in articles] != list(range(1, len(articles) + 1)):
            fail("article.json 的 order 必须从 1 开始且连续")
        content = build_manifest(
            articles,
            sorted(topics, key=lambda topic: topic["order"]),
            site,
        )
        with OUTPUT_PATH.open("w", encoding="utf-8", newline="\n") as handle:
            handle.write(content)
        print(
            f"Built {OUTPUT_PATH.relative_to(ROOT)}: "
            f"{len(topics)} topics, {len(articles)} articles"
        )
        return 0
    except BuildError as exc:
        print(f"build.py: error: {exc}", file=sys.stderr)
        return 1
    except OSError as exc:
        print(f"build.py: error: {exc}", file=sys.stderr)
        return 1


if __name__ == "__main__":
    sys.exit(main())
