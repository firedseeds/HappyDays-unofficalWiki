/* =========================================================
   HappyDays非官方文档 — static application logic
   Hash routing, search palette, outline, theme and reading UI.
   ========================================================= */

(function () {
  "use strict";

  var wiki = window.HAPPYDAYS_WIKI;
  if (!wiki) {
    return;
  }

  var categories = wiki.categories;
  var docs = wiki.docs;
  var allIds = wiki.allIds;
  var site = wiki.site || {};

  var SITE_BASE_PATH = "/wiki";

  function siteRoot() {
    var domain = String(site.domain || "").trim().replace(/\/+$/, "");
    if (!domain) {
      var path = window.location.pathname.replace(/\/+$/, "");
      var base = path.replace(/\/(?:index|editor)\.html$/i, "");
      if (!/\/wiki$/.test(base)) {
        base = SITE_BASE_PATH;
      }
      return window.location.origin + base;
    }
    if (!/^https?:\/\//i.test(domain)) {
      var protocol = window.location.protocol === "https:" ? "https:" : "http:";
      domain = protocol + "//" + domain;
    }
    if (!/\/wiki$/i.test(domain)) {
      domain += SITE_BASE_PATH;
    }
    return domain;
  }

  function externalDocUrl(id) {
    return siteRoot() + "/#/doc/" + encodeURIComponent(id);
  }

  function setExternalUrl(id) {
    var url = id ? externalDocUrl(id) : siteRoot() + "/";
    if (els.ogUrl) {
      els.ogUrl.setAttribute("content", url);
    }
    if (els.canonicalLink) {
      els.canonicalLink.setAttribute("href", url);
    }
  }

  function formatSignatureTime(value) {
    var parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) {
      return value || "";
    }
    return parsed.toLocaleString("zh-CN", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit"
    });
  }

  function signatureActionLabel(record) {
    if (record.action === "create") {
      return "创建文章";
    }
    if (record.action === "move") {
      if (record.fromTopic && record.topic) {
        return "从「" + record.fromTopic + "」移动到「" + record.topic + "」";
      }
      return "移动文章";
    }
    return "更新文章";
  }

  function renderDocSignatures(signatures) {
    var records = (signatures || []).slice().reverse();
    var latest = records[0];
    els.docAuthorMeta.hidden = false;
    if (latest) {
      els.docAuthor.textContent = "最后编辑：" + (latest.author || "匿名");
      els.docAuthor.title = formatSignatureTime(latest.at) + " · " + signatureActionLabel(latest);
      els.colophonAuthor.textContent = latest.author || "匿名";
    } else {
      els.docAuthor.textContent = "最后编辑：" + (site.team || "HappyDays 团队");
      els.docAuthor.title = "尚无个人署名记录";
      els.colophonAuthor.textContent = site.team || "HappyDays 团队";
    }
    els.docSignatures.hidden = !records.length;
    els.docSignatureCount.textContent = records.length ? records.length + " 次编辑" : "";
    els.docSignatureList.innerHTML = "";
    if (!records.length) {
      return;
    }
    records.forEach(function (record) {
      var item = document.createElement("li");
      item.className = "doc-signature-item";
      var head = document.createElement("div");
      head.className = "doc-signature-item-head";
      var author = document.createElement("strong");
      author.textContent = record.author || "匿名";
      var time = document.createElement("time");
      time.textContent = formatSignatureTime(record.at);
      time.dateTime = record.at || "";
      head.appendChild(author);
      head.appendChild(time);
      var meta = document.createElement("div");
      meta.className = "doc-signature-item-meta";
      meta.textContent = signatureActionLabel(record);
      item.appendChild(head);
      item.appendChild(meta);
      els.docSignatureList.appendChild(item);
    });
  }

  function renderCommentMarkdown(source) {
    var text = String(source || "").replace(/\r\n?/g, "\n");
    var codeBlocks = [];
    text = text.replace(/```([^\n`]*)\n([\s\S]*?)```/g, function (match, language, code) {
      var index = codeBlocks.length;
      codeBlocks.push("<pre><code>" + escapeHTML(code.replace(/\n$/, "")) + "</code></pre>");
      return "\u0000CODE" + index + "\u0000";
    });
    text = escapeHTML(text);

    function safeUrl(value) {
      var url = String(value || "").replace(/&amp;/g, "&").trim();
      if (!/^(https?:\/\/|mailto:|\/|#)/i.test(url)) {
        return "";
      }
      return escapeHTML(url);
    }

    function inlineMarkdown(value) {
      var inlineCodes = [];
      value = value.replace(/`([^`]+)`/g, function (match, code) {
        var index = inlineCodes.length;
        inlineCodes.push("<code>" + code + "</code>");
        return "\u0000INLINE" + index + "\u0000";
      });
      value = value.replace(/\[([^\]]+)\]\(([^)\s]+)\)/g, function (match, label, url) {
        var href = safeUrl(url);
        if (!href) {
          return label;
        }
        var external = /^https?:/i.test(href) ? ' target="_blank" rel="noopener noreferrer"' : "";
        return '<a href="' + href + '"' + external + ">" + label + "</a>";
      });
      value = value.replace(/\*\*([^*\n]+)\*\*/g, "<strong>$1</strong>");
      value = value.replace(/__([^_\n]+)__/g, "<strong>$1</strong>");
      value = value.replace(/(^|[^*])\*([^*\n]+)\*/g, "$1<em>$2</em>");
      value = value.replace(/(^|[^_])_([^_\n]+)_/g, "$1<em>$2</em>");
      value = value.replace(/~~([^~\n]+)~~/g, "<del>$1</del>");
      inlineCodes.forEach(function (html, index) {
        value = value.replace("\u0000INLINE" + index + "\u0000", html);
      });
      return value;
    }

    var lines = text.split("\n");
    var html = [];
    var index = 0;
    while (index < lines.length) {
      var line = lines[index];
      if (!line.trim()) {
        index += 1;
        continue;
      }
      var codeMatch = /^\u0000CODE(\d+)\u0000$/.exec(line.trim());
      if (codeMatch) {
        html.push(codeBlocks[Number(codeMatch[1])] || "");
        index += 1;
        continue;
      }
      var heading = /^(#{1,6})\s+(.*)$/.exec(line);
      if (heading) {
        var level = heading[1].length;
        html.push("<h" + level + ">" + inlineMarkdown(heading[2]) + "</h" + level + ">");
        index += 1;
        continue;
      }
      if (/^---+$/.test(line.trim())) {
        html.push("<hr>");
        index += 1;
        continue;
      }
      if (/^>\s?/.test(line)) {
        var quoted = [];
        while (index < lines.length && /^>\s?/.test(lines[index])) {
          quoted.push(inlineMarkdown(lines[index].replace(/^>\s?/, "")));
          index += 1;
        }
        html.push("<blockquote>" + quoted.join("<br>") + "</blockquote>");
        continue;
      }
      var unordered = /^[-+*]\s+(.*)$/.exec(line);
      var ordered = /^\d+\.\s+(.*)$/.exec(line);
      if (unordered || ordered) {
        var listType = unordered ? "ul" : "ol";
        var items = [];
        while (index < lines.length) {
          var item = unordered
            ? /^[-+*]\s+(.*)$/.exec(lines[index])
            : /^\d+\.\s+(.*)$/.exec(lines[index]);
          if (!item) {
            break;
          }
          items.push("<li>" + inlineMarkdown(item[1]) + "</li>");
          index += 1;
        }
        html.push("<" + listType + ">" + items.join("") + "</" + listType + ">");
        continue;
      }
      var paragraph = [];
      while (index < lines.length && lines[index].trim()) {
        if (
          /^(#{1,6})\s+/.test(lines[index]) ||
          /^>\s?/.test(lines[index]) ||
          /^[-+*]\s+/.test(lines[index]) ||
          /^\d+\.\s+/.test(lines[index]) ||
          /^---+$/.test(lines[index].trim()) ||
          /^\u0000CODE\d+\u0000$/.test(lines[index].trim())
        ) {
          break;
        }
        paragraph.push(inlineMarkdown(lines[index]));
        index += 1;
      }
      if (paragraph.length) {
        html.push("<p>" + paragraph.join("<br>") + "</p>");
      } else {
        index += 1;
      }
    }
    return html.join("");
  }

  function renderDocComments(comments) {
    var items = Array.isArray(comments) ? comments.slice().reverse() : [];
    els.docCommentCount.textContent = items.length + " 条";
    els.docCommentList.innerHTML = "";
    els.docCommentEmpty.hidden = items.length > 0;
    items.forEach(function (comment) {
      var item = document.createElement("div");
      item.className = "doc-comment-item";

      var avatar = document.createElement("span");
      avatar.className = "doc-comment-avatar";
      avatar.setAttribute("aria-hidden", "true");
      avatar.textContent = Array.from(String(comment.author || "匿"))[0] || "匿";

      var main = document.createElement("div");
      main.className = "doc-comment-main";

      var meta = document.createElement("div");
      meta.className = "doc-comment-meta";
      var author = document.createElement("strong");
      author.textContent = comment.author || "匿名";
      var time = document.createElement("time");
      time.dateTime = comment.at || "";
      time.textContent = formatSignatureTime(comment.at);
      meta.appendChild(author);
      meta.appendChild(time);

      var body = document.createElement("div");
      body.className = "doc-comment-body";
      body.innerHTML = renderCommentMarkdown(comment.body || "");

      main.appendChild(meta);
      main.appendChild(body);
      item.appendChild(avatar);
      item.appendChild(main);
      els.docCommentList.appendChild(item);
    });
  }

  var commentLoadToken = 0;

  function loadDocComments(slug) {
    var token = ++commentLoadToken;
    els.docCommentStatus.textContent = "";
    els.docCommentStatus.classList.remove("is-error");
    els.docCommentBody.value = "";
    if (!slug) {
      renderDocComments([]);
      return;
    }
    fetch("comment/comment.json", { cache: "no-store" }).then(function (response) {
      if (!response.ok) {
        throw new Error("评论加载失败");
      }
      return response.json();
    }).then(function (data) {
      if (token !== commentLoadToken || state.currentId !== slug) {
        return;
      }
      var comments = data && data.articles && data.articles[slug];
      renderDocComments(Array.isArray(comments) ? comments : []);
    }).catch(function () {
      if (token === commentLoadToken && state.currentId === slug) {
        renderDocComments([]);
      }
    });
  }

  function commentAuthorStorageKey() {
    return "happydays-comment-author";
  }

  function submitDocComment(event) {
    event.preventDefault();
    if (!state.currentId || els.docCommentSubmit.disabled) {
      return;
    }
    var author = els.docCommentAuthor.value.trim();
    var body = els.docCommentBody.value.trim();
    if (!author) {
      els.docCommentStatus.textContent = "请填写署名";
      els.docCommentStatus.classList.add("is-error");
      els.docCommentAuthor.focus();
      return;
    }
    if (!body) {
      els.docCommentStatus.textContent = "请填写评论";
      els.docCommentStatus.classList.add("is-error");
      els.docCommentBody.focus();
      return;
    }
    els.docCommentSubmit.disabled = true;
    els.docCommentStatus.classList.remove("is-error");
    els.docCommentStatus.textContent = "发表中…";
    fetch("api/articles/" + encodeURIComponent(state.currentId) + "/comments", {
      method: "POST",
      cache: "no-store",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ author: author, body: body })
    }).then(function (response) {
      return response.json().catch(function () {
        return {};
      }).then(function (data) {
        if (!response.ok) {
          throw new Error(data.error || "评论发表失败");
        }
        return data;
      });
    }).then(function (data) {
      try {
        localStorage.setItem(commentAuthorStorageKey(), author);
      } catch (error) {
        /* 忽略隐私模式下的 localStorage 错误 */
      }
      renderDocComments(data.comments || []);
      els.docCommentBody.value = "";
      els.docCommentStatus.textContent = "已发表";
      showToast("评论已发表");
    }).catch(function (error) {
      els.docCommentStatus.textContent = error.message;
      els.docCommentStatus.classList.add("is-error");
    }).finally(function () {
      els.docCommentSubmit.disabled = false;
    });
  }

  function pickWeightedTitle(items, excludeText) {
    var candidates = items;
    if (excludeText) {
      var filtered = items.filter(function (item) {
        return item.text !== excludeText;
      });
      if (filtered.length) {
        candidates = filtered;
      }
    }
    var total = candidates.reduce(function (sum, item) {
      return sum + item.weight;
    }, 0);
    if (!total) {
      return candidates[0];
    }
    var roll = Math.random() * total;
    for (var index = 0; index < candidates.length; index += 1) {
      roll -= candidates[index].weight;
      if (roll < 0) {
        return candidates[index];
      }
    }
    return candidates[candidates.length - 1];
  }

  var titleRollState = {
    items: [],
    intervalMs: 10000,
    timer: null,
    paused: false,
    currentText: ""
  };

  var activeSiteTitleEditor = null;
  var siteTitleBaseFontSize = 18.5;

  function stopTitleRotation() {
    if (titleRollState.timer) {
      window.clearInterval(titleRollState.timer);
      titleRollState.timer = null;
    }
  }

  function rotatableTitleCount(items) {
    var seen = {};
    items.forEach(function (item) {
      seen[item.text] = true;
    });
    return Object.keys(seen).length;
  }

  function startTitleRotation() {
    if (
      titleRollState.timer ||
      titleRollState.paused ||
      titleRollState.items.length < 2 ||
      rotatableTitleCount(titleRollState.items) < 2
    ) {
      return;
    }
    if (window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      return;
    }
    titleRollState.timer = window.setInterval(function () {
      applyRollingTitle(
        pickWeightedTitle(titleRollState.items, titleRollState.currentText),
        true
      );
    }, titleRollState.intervalMs);
  }

  function applyRollingTitle(title, animate) {
    if (!els.titleRollText || !title) {
      return;
    }
    var normalized = window.HappyDaysTitleFormat.normalize(title);
    if (!normalized.text) {
      return;
    }
    var reduced = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    els.titleRollText.classList.remove("is-rolling");
    if (animate && !reduced) {
      void els.titleRollText.offsetWidth;
      window.HappyDaysTitleFormat.render(els.titleRollText, normalized);
      els.titleRollText.classList.add("is-rolling");
    } else {
      window.HappyDaysTitleFormat.render(els.titleRollText, normalized);
    }
    els.titleRollText.title = normalized.text;
    titleRollState.currentText = normalized.text;
  }

  function applyTitleRollConfig(data) {
    var settings = Array.isArray(data) || !data ? {} : data;
    var raw = Array.isArray(data) ? data : (data && data.titles);
    if (!Array.isArray(raw)) {
      return false;
    }
    var items = raw.map(function (item) {
      var normalized = window.HappyDaysTitleFormat.normalize(item);
      var weight = Number(item && item.weight);
      if (!normalized.text.trim() || !Number.isFinite(weight) || weight <= 0) {
        return null;
      }
      return { text: normalized.text, weight: weight, runs: normalized.runs };
    }).filter(Boolean);
    if (!items.length) {
      return false;
    }

    var fontSize = Number(settings.fontSize);
    if (!Number.isFinite(fontSize)) {
      fontSize = 18.5;
    }
    fontSize = Math.max(8, Math.min(40, fontSize));
    els.titleRollText.style.fontSize = fontSize + "px";

    var intervalSeconds = Number(settings.intervalSeconds);
    if (!Number.isFinite(intervalSeconds)) {
      intervalSeconds = 10;
    }
    intervalSeconds = Math.max(3, Math.min(3600, intervalSeconds));

    titleRollState.items = items;
    titleRollState.intervalMs = intervalSeconds * 1000;
    stopTitleRotation();
    applyRollingTitle(
      pickWeightedTitle(items, titleRollState.currentText),
      false
    );
    startTitleRotation();
    return true;
  }

  function initTitleRoll() {
    if (!els.titleRollText) {
      return;
    }
    els.titleRoll.addEventListener("mouseenter", function () {
      titleRollState.paused = true;
      stopTitleRotation();
    });
    els.titleRoll.addEventListener("mouseleave", function () {
      titleRollState.paused = false;
      startTitleRotation();
    });
    fetch("title.json", { cache: "no-store" }).then(function (response) {
      if (!response.ok) {
        throw new Error("title.json unavailable");
      }
      return response.json();
    }).then(function (data) {
      applyTitleRollConfig(data);
    }).catch(function () {
      /* 保留静态回退标题 */
    });
  }

  function setSiteTitleAlert(message) {
    els.siteTitleAlert.textContent = message || "";
    els.siteTitleAlert.hidden = !message;
  }

  function updateSiteTitleTotals() {
    var rows = Array.prototype.slice.call(els.siteTitleRows.querySelectorAll(".site-title-row"));
    var weights = rows.map(function (row) {
      return Number(row.querySelector(".site-title-weight").value);
    });
    var total = weights.reduce(function (sum, weight) {
      return sum + (Number.isFinite(weight) && weight > 0 ? weight : 0);
    }, 0);
    rows.forEach(function (row, index) {
      var probability = row.querySelector(".site-title-prob");
      if (total > 0 && Number.isFinite(weights[index]) && weights[index] > 0) {
        probability.textContent = (weights[index] / total * 100).toFixed(1) + "%";
      } else {
        probability.textContent = "—";
      }
    });
    els.siteTitleTotal.textContent = "总权重 " + (total > 0 ? total.toFixed(1) : "0");
  }

  var savedSiteTitleRange = null;

  function currentSiteTitleEditor() {
    if (activeSiteTitleEditor && activeSiteTitleEditor.isConnected) {
      return activeSiteTitleEditor;
    }
    var focused = document.activeElement;
    if (focused && focused.classList && focused.classList.contains("site-title-text")) {
      activeSiteTitleEditor = focused;
      return focused;
    }
    return null;
  }

  function saveSiteTitleSelection() {
    var editor = currentSiteTitleEditor();
    var selection = window.getSelection();
    if (!editor || !selection || !selection.rangeCount) {
      return;
    }
    var range = selection.getRangeAt(0);
    if (editor.contains(range.commonAncestorContainer)) {
      savedSiteTitleRange = range.cloneRange();
    }
  }

  function restoreSiteTitleRange() {
    if (!activeSiteTitleEditor || !savedSiteTitleRange) {
      return;
    }
    if (!activeSiteTitleEditor.contains(savedSiteTitleRange.commonAncestorContainer)) {
      return;
    }
    var selection = window.getSelection();
    selection.removeAllRanges();
    selection.addRange(savedSiteTitleRange);
  }

  function applySiteTitleFormat(command, value) {
    activeSiteTitleEditor = currentSiteTitleEditor();
    if (!activeSiteTitleEditor || !activeSiteTitleEditor.isConnected) {
      setSiteTitleAlert("请先点击一条标题，再选择要修改的文字");
      return;
    }
    activeSiteTitleEditor.focus();
    restoreSiteTitleRange();
    document.execCommand("styleWithCSS", false, true);
    document.execCommand(command, false, value || null);
    saveSiteTitleSelection();
  }

  function applySiteTitleFontSize(value) {
    activeSiteTitleEditor = currentSiteTitleEditor();
    var size = Number(value);
    if (!activeSiteTitleEditor || !activeSiteTitleEditor.isConnected) {
      setSiteTitleAlert("请先点击一条标题，再选择要修改的文字");
      return;
    }
    if (!Number.isFinite(size) || size < 8 || size > 80) {
      setSiteTitleAlert("单字字号必须在 8–80px 之间");
      return;
    }
    activeSiteTitleEditor.focus();
    restoreSiteTitleRange();
    var selection = window.getSelection();
    if (!selection || !selection.rangeCount) {
      setSiteTitleAlert("请先选中要修改字号的文字");
      return;
    }
    var range = selection.getRangeAt(0);
    if (range.collapsed) {
      var pending = document.createElement("span");
      pending.style.fontSize = size + "px";
      pending.textContent = "\u200b";
      range.insertNode(pending);
      range.setStart(pending.firstChild, 1);
      range.collapse(true);
      selection.removeAllRanges();
      selection.addRange(range);
      savedSiteTitleRange = range.cloneRange();
      return;
    }
    var span = document.createElement("span");
    span.style.fontSize = size + "px";
    span.appendChild(range.extractContents());
    Array.prototype.forEach.call(span.querySelectorAll("[style]"), function (node) {
      node.style.fontSize = "";
    });
    range.insertNode(span);
    range.selectNodeContents(span);
    selection.removeAllRanges();
    selection.addRange(range);
    savedSiteTitleRange = range.cloneRange();
  }

  function createSiteTitleRow(item) {
    var row = document.createElement("div");
    row.className = "site-title-row";

    var text = document.createElement("div");
    text.className = "title-rich site-title-text";
    text.contentEditable = "true";
    text.spellcheck = false;
    text.style.fontSize = siteTitleBaseFontSize + "px";
    text.setAttribute("role", "textbox");
    text.setAttribute("aria-label", "标题内容");
    text.setAttribute("data-placeholder", "标题内容");
    window.HappyDaysTitleFormat.render(text, item || { text: "" });
    text.addEventListener("focus", function () {
      activeSiteTitleEditor = text;
    });
    text.addEventListener("mousedown", function () {
      activeSiteTitleEditor = text;
    });
    text.addEventListener("keydown", function (event) {
      if (event.key === "Enter") {
        event.preventDefault();
      }
    });
    text.addEventListener("paste", function (event) {
      event.preventDefault();
      var paste = (event.clipboardData || window.clipboardData).getData("text/plain");
      document.execCommand("insertText", false, String(paste || "").replace(/[\r\n]+/g, " "));
    });
    text.addEventListener("input", updateSiteTitleTotals);

    var weight = document.createElement("input");
    weight.type = "number";
    weight.className = "site-title-weight";
    weight.min = "0.1";
    weight.max = "1000000";
    weight.step = "0.1";
    weight.value = item && item.weight ? item.weight : 1;
    weight.setAttribute("aria-label", "标题权重");

    var probability = document.createElement("span");
    probability.className = "site-title-prob";
    probability.textContent = "—";

    var move = document.createElement("div");
    move.className = "title-move";
    var up = document.createElement("button");
    up.type = "button";
    up.className = "title-move-button";
    up.textContent = "↑";
    up.title = "上移标题";
    up.setAttribute("aria-label", "上移标题");
    up.addEventListener("click", function () {
      moveSiteTitleRow(row, -1);
    });
    var down = document.createElement("button");
    down.type = "button";
    down.className = "title-move-button";
    down.textContent = "↓";
    down.title = "下移标题";
    down.setAttribute("aria-label", "下移标题");
    down.addEventListener("click", function () {
      moveSiteTitleRow(row, 1);
    });
    move.appendChild(up);
    move.appendChild(down);

    var remove = document.createElement("button");
    remove.type = "button";
    remove.className = "site-title-remove";
    remove.textContent = "×";
    remove.title = "删除这条标题";
    remove.setAttribute("aria-label", "删除标题");
    remove.addEventListener("click", function () {
      if (els.siteTitleRows.querySelectorAll(".site-title-row").length <= 1) {
        setSiteTitleAlert("至少保留一条标题");
        return;
      }
      if (activeSiteTitleEditor === text) {
        activeSiteTitleEditor = null;
      }
      row.remove();
      updateSiteTitleTotals();
      updateSiteTitleMoveButtons();
    });

    weight.addEventListener("input", updateSiteTitleTotals);
    row.appendChild(text);
    row.appendChild(weight);
    row.appendChild(probability);
    row.appendChild(move);
    row.appendChild(remove);
    els.siteTitleRows.appendChild(row);
    updateSiteTitleMoveButtons();
    return row;
  }

  function updateSiteTitleMoveButtons() {
    var rows = Array.prototype.slice.call(els.siteTitleRows.querySelectorAll(".site-title-row"));
    rows.forEach(function (row, index) {
      var buttons = row.querySelectorAll(".title-move-button");
      if (buttons.length === 2) {
        buttons[0].disabled = index === 0;
        buttons[1].disabled = index === rows.length - 1;
      }
    });
  }

  function moveSiteTitleRow(row, direction) {
    var sibling = direction < 0 ? row.previousElementSibling : row.nextElementSibling;
    if (!sibling) {
      return;
    }
    if (direction < 0) {
      els.siteTitleRows.insertBefore(row, sibling);
    } else {
      els.siteTitleRows.insertBefore(sibling, row);
    }
    updateSiteTitleMoveButtons();
    updateSiteTitleTotals();
  }

  function renderSiteTitleRows(titles) {
    els.siteTitleRows.innerHTML = "";
    var items = Array.isArray(titles) && titles.length
      ? titles
      : [{ text: "HappyDays 非官方文档", weight: 1 }];
    items.forEach(function (item) {
      createSiteTitleRow({
        text: typeof item.text === "string" ? item.text : "",
        runs: item.runs,
        weight: Number(item.weight) > 0 ? Number(item.weight) : 1
      });
    });
    updateSiteTitleTotals();
  }

  function titleApiRequest(method, payload) {
    var options = { method: method, cache: "no-store" };
    if (payload) {
      options.headers = { "Content-Type": "application/json" };
      options.body = JSON.stringify(payload);
    }
    return fetch("api/titles", options).then(function (response) {
      return response.json().catch(function () {
        return {};
      }).then(function (data) {
        if (!response.ok) {
          throw new Error(data.error || "标题保存失败");
        }
        return data;
      });
    });
  }

  function openSiteTitleEditor() {
    setSiteTitleAlert("");
    els.siteTitleSave.disabled = true;
    titleApiRequest("GET").then(function (data) {
      var fontSize = Number(data && data.fontSize);
      var interval = Number(data && data.intervalSeconds);
      if (!Number.isFinite(fontSize)) {
        fontSize = 18.5;
      }
      fontSize = Math.max(8, Math.min(40, fontSize));
      siteTitleBaseFontSize = fontSize;
      renderSiteTitleRows(data && data.titles);
      els.siteTitleInterval.value = Number.isFinite(interval) && interval >= 3 ? interval : 10;
      els.siteTitleSize.value = String(siteTitleBaseFontSize);
      els.siteTitleSave.disabled = false;
      els.titleEditDialog.showModal();
      window.setTimeout(function () {
        var first = els.siteTitleRows.querySelector(".site-title-text");
        if (first) {
          activeSiteTitleEditor = first;
          first.focus();
        }
      }, 30);
    }).catch(function (error) {
      showToast(error.message, "error");
      els.siteTitleSave.disabled = false;
    });
  }

  function closeSiteTitleEditor() {
    activeSiteTitleEditor = null;
    savedSiteTitleRange = null;
    els.titleEditDialog.close();
  }

  function formatHistoryDate(value) {
    var parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) {
      return value || "";
    }
    return parsed.toLocaleString("zh-CN", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit"
    });
  }

  function renderHistoryVersions(data) {
    var versions = Array.isArray(data && data.versions) ? data.versions : [];
    var visible = versions.filter(function (version) {
      return version.visible !== false;
    });
    if (!visible.length) {
      visible = versions;
    }
    els.historyCutoff.textContent = data && data.earliest
      ? "只显示最早可见版本及之后的内容"
      : "显示全部历史版本";
    els.historyList.innerHTML = "";
    if (!visible.length) {
      els.historyList.innerHTML = '<p class="history-empty">还没有可查看的版本。</p>';
      els.historyContent.innerHTML = "";
      els.historyMeta.textContent = "";
      return;
    }
    visible.forEach(function (version) {
      var button = document.createElement("button");
      button.type = "button";
      button.className = "history-version";
      button.dataset.hash = version.hash;
      button.innerHTML =
        '<span class="history-version-date">' + escapeHTML(formatHistoryDate(version.date)) + "</span>" +
        '<span class="history-version-subject">' + escapeHTML(version.subject || "更新文章") + "</span>" +
        '<span class="history-version-author">' +
        escapeHTML(version.author || "未知") +
        (version.current ? " · 当前" : "") +
        "</span>";
      button.addEventListener("click", function () {
        loadHistoryVersion(version.hash);
      });
      els.historyList.appendChild(button);
    });
    loadHistoryVersion(visible[0].hash);
  }

  function loadHistoryVersion(hash) {
    var slug = state.currentId;
    if (!slug) {
      return;
    }
    Array.prototype.forEach.call(
      els.historyList.querySelectorAll(".history-version"),
      function (button) {
        button.classList.toggle("is-active", button.dataset.hash === hash);
      }
    );
    els.historyMeta.textContent = "加载版本…";
    var doc = docs[slug];
    fetch(
      "api/articles/" + encodeURIComponent(slug) + "/history/" + encodeURIComponent(hash),
      { cache: "no-store" }
    ).then(function (response) {
      return response.json().catch(function () {
        return {};
      }).then(function (data) {
        if (!response.ok) {
          throw new Error(data.error || "版本加载失败");
        }
        return data;
      });
    }).then(function (detail) {
      els.historyMeta.innerHTML =
        "<strong>" + escapeHTML(detail.title || hash) + "</strong>" +
        "<span>" + escapeHTML(formatHistoryDate(detail.date)) + " · " +
        escapeHTML(detail.author || "未知") + "</span>" +
        "<code>" + escapeHTML(detail.shortHash || hash) + "</code>";
      return fetch("api/preview", {
        method: "POST",
        cache: "no-store",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          slug: slug,
          topicId: doc && doc.topic,
          body: detail.body || ""
        })
      }).then(function (response) {
        return response.json().catch(function () {
          return {};
        }).then(function (preview) {
          if (response.ok && typeof preview.html === "string") {
            els.historyContent.innerHTML = preview.html;
          } else {
            var pre = document.createElement("pre");
            pre.textContent = detail.body || "";
            els.historyContent.innerHTML = "";
            els.historyContent.appendChild(pre);
          }
        });
      }).catch(function () {
        var pre = document.createElement("pre");
        pre.textContent = detail.body || "";
        els.historyContent.innerHTML = "";
        els.historyContent.appendChild(pre);
      });
    }).catch(function (error) {
      els.historyMeta.textContent = error.message;
      els.historyContent.innerHTML = "";
    });
  }

  function openHistory() {
    if (!state.currentId) {
      return;
    }
    els.historyDialog.showModal();
    els.historyList.innerHTML = '<p class="history-empty">加载版本列表…</p>';
    els.historyMeta.textContent = "";
    els.historyContent.innerHTML = "";
    fetch(
      "api/articles/" + encodeURIComponent(state.currentId) + "/history",
      { cache: "no-store" }
    ).then(function (response) {
      return response.json().catch(function () {
        return {};
      }).then(function (data) {
        if (!response.ok) {
          throw new Error(data.error || "版本列表加载失败");
        }
        return data;
      });
    }).then(renderHistoryVersions).catch(function (error) {
      els.historyList.innerHTML = '<p class="history-empty">' + escapeHTML(error.message) + "</p>";
      els.historyMeta.textContent = "";
    });
  }

  function closeHistory() {
    els.historyDialog.close();
  }

  function collectSiteTitleRows() {
    var rows = Array.prototype.slice.call(els.siteTitleRows.querySelectorAll(".site-title-row"));
    var titles = [];
    rows.forEach(function (row) {
      var editor = row.querySelector(".site-title-text");
      var text = editor.textContent.replace(/\u200b/g, "");
      var weight = Number(row.querySelector(".site-title-weight").value);
      if (!text.trim()) {
        throw new Error("标题内容不能为空");
      }
      if (!Number.isFinite(weight) || weight <= 0) {
        throw new Error("标题权重必须大于 0");
      }
      titles.push({
        text: text,
        weight: weight,
        runs: window.HappyDaysTitleFormat.extract(editor)
      });
    });
    if (!titles.length) {
      throw new Error("至少保留一条标题");
    }
    if (titles.length > 30) {
      throw new Error("标题最多 30 条");
    }
    var fontSize = siteTitleBaseFontSize;
    var intervalSeconds = Number(els.siteTitleInterval.value);
    if (!Number.isFinite(fontSize) || fontSize < 8 || fontSize > 40) {
      throw new Error("字号必须在 8 到 40 之间");
    }
    if (!Number.isFinite(intervalSeconds) || intervalSeconds < 3 || intervalSeconds > 3600) {
      throw new Error("轮换间隔必须在 3 到 3600 秒之间");
    }
    return {
      titles: titles,
      fontSize: fontSize,
      intervalSeconds: intervalSeconds
    };
  }

  function saveSiteTitles(event) {
    event.preventDefault();
    var payload;
    try {
      payload = collectSiteTitleRows();
    } catch (error) {
      setSiteTitleAlert(error.message);
      return;
    }
    payload.author = site.team || "HappyDays 团队";
    els.siteTitleSave.disabled = true;
    setSiteTitleAlert("");
    titleApiRequest("PUT", payload).then(function (result) {
      applyTitleRollConfig(result);
      closeSiteTitleEditor();
      var message = "滚动标题已保存";
      if (result.commit && result.commit.committed) {
        message += result.commit.hash
          ? " · 已本地提交 " + result.commit.hash
          : " · 已本地提交";
      } else if (result.commit && result.commit.error) {
        message += " · 本地提交失败：" + String(result.commit.error).split("\n")[0];
      }
      showToast(message, "success");
    }).catch(function (error) {
      setSiteTitleAlert(error.message);
      showToast(error.message, "error");
    }).finally(function () {
      els.siteTitleSave.disabled = false;
    });
  }

  var CATEGORY_BY_ID = {};
  categories.forEach(function (category) {
    CATEGORY_BY_ID[category.id] = category;
  });

  var STORAGE = {
    theme: "happydays-theme",
    recent: "happydays-recent",
    collapsed: "happydays-collapsed-categories",
    sidebar: "happydays-sidebar-collapsed",
    wide: "happydays-wide-reading"
  };

  var els = {
    docTree: document.getElementById("docTree"),
    docCount: document.getElementById("docCount"),
    sidebar: document.getElementById("sidebar"),
    sidebarToggle: document.getElementById("sidebarToggle"),
    sidebarClose: document.getElementById("sidebarClose"),
    sidebarSearch: document.getElementById("sidebarSearch"),
    crumbHome: document.getElementById("crumbHome"),
    crumbCategory: document.getElementById("crumbCategory"),
    crumbTitle: document.getElementById("crumbTitle"),
    docRoot: document.getElementById("docRoot"),
    docCategory: document.getElementById("docCategory"),
    docEmoji: document.getElementById("docEmoji"),
    docTitle: document.getElementById("docTitle"),
    docExcerpt: document.getElementById("docExcerpt"),
    docUpdated: document.getElementById("docUpdated"),
    docReading: document.getElementById("docReading"),
    docTags: document.getElementById("docTags"),
    docAuthorMeta: document.getElementById("docAuthorMeta"),
    docAuthor: document.getElementById("docAuthor"),
    docSignatures: document.getElementById("docSignatures"),
    docSignatureCount: document.getElementById("docSignatureCount"),
    docSignatureList: document.getElementById("docSignatureList"),
    docComments: document.getElementById("docComments"),
    docCommentCount: document.getElementById("docCommentCount"),
    docCommentList: document.getElementById("docCommentList"),
    docCommentEmpty: document.getElementById("docCommentEmpty"),
    docCommentForm: document.getElementById("docCommentForm"),
    docCommentAuthor: document.getElementById("docCommentAuthor"),
    docCommentBody: document.getElementById("docCommentBody"),
    docCommentStatus: document.getElementById("docCommentStatus"),
    docCommentSubmit: document.getElementById("docCommentSubmit"),
    colophonAuthor: document.getElementById("colophonAuthor"),
    docBody: document.getElementById("docBody"),
    prevDoc: document.getElementById("prevDoc"),
    prevDocTitle: document.getElementById("prevDocTitle"),
    nextDoc: document.getElementById("nextDoc"),
    nextDocTitle: document.getElementById("nextDocTitle"),
    colophonUpdated: document.getElementById("colophonUpdated"),
    tocPanel: document.getElementById("tocPanel"),
    tocNav: document.getElementById("tocNav"),
    tocClose: document.getElementById("tocClose"),
    tocTop: document.getElementById("tocTop"),
    outlineBtn: document.getElementById("outlineBtn"),
    docTreeToggle: document.getElementById("docTreeToggle"),
    docTreeToggleLabel: document.getElementById("docTreeToggleLabel"),
    readingProgress: document.getElementById("readingProgress"),
    readingPercent: document.getElementById("readingPercent"),
    backToTop: document.getElementById("backToTop"),
    titleRoll: document.getElementById("titleRoll"),
    titleRollText: document.getElementById("titleRollText"),
    titleRollEdit: document.getElementById("titleRollEdit"),
    titleEditDialog: document.getElementById("titleEditDialog"),
    titleEditForm: document.getElementById("titleEditForm"),
    siteTitleRows: document.getElementById("siteTitleRows"),
    siteTitleToolbar: document.getElementById("siteTitleToolbar"),
    siteTitleColor: document.getElementById("siteTitleColor"),
    siteTitleSize: document.getElementById("siteTitleSize"),
    siteTitleInterval: document.getElementById("siteTitleInterval"),
    siteTitleTotal: document.getElementById("siteTitleTotal"),
    siteTitleAlert: document.getElementById("siteTitleAlert"),
    siteTitleAdd: document.getElementById("siteTitleAdd"),
    siteTitleClose: document.getElementById("siteTitleClose"),
    siteTitleCancel: document.getElementById("siteTitleCancel"),
    siteTitleSave: document.getElementById("siteTitleSave"),
    editBtn: document.getElementById("editBtn"),
    historyBtn: document.getElementById("historyBtn"),
    historyDialog: document.getElementById("historyDialog"),
    historyClose: document.getElementById("historyClose"),
    historyList: document.getElementById("historyList"),
    historyMeta: document.getElementById("historyMeta"),
    historyContent: document.getElementById("historyContent"),
    historyCutoff: document.getElementById("historyCutoff"),
    shareBtn: document.getElementById("shareBtn"),
    ogUrl: document.getElementById("ogUrl"),
    canonicalLink: document.getElementById("canonicalLink"),
    themeBtn: document.getElementById("themeBtn"),
    moreBtn: document.getElementById("moreBtn"),
    moreMenu: document.getElementById("moreMenu"),
    wideState: document.getElementById("wideState"),
    searchOverlay: document.getElementById("searchOverlay"),
    searchInput: document.getElementById("searchInput"),
    searchResults: document.getElementById("searchResults"),
    toastRegion: document.getElementById("toastRegion"),
    pageAnnouncement: document.getElementById("pageAnnouncement"),
    mainContent: document.getElementById("mainContent"),
    bgmPlayer: document.getElementById("bgmPlayer"),
    bgmTitle: document.getElementById("bgmTitle"),
    bgmToggle: document.getElementById("bgmToggle"),
    bgmNext: document.getElementById("bgmNext"),
    bgmUpload: document.getElementById("bgmUpload"),
    bgmAudio: document.getElementById("bgmAudio"),
    bgmDialog: document.getElementById("bgmDialog"),
    bgmForm: document.getElementById("bgmForm"),
    bgmFile: document.getElementById("bgmFile"),
    bgmFormTitle: document.getElementById("bgmFormTitle"),
    bgmFormWeight: document.getElementById("bgmFormWeight"),
    bgmFormStatus: document.getElementById("bgmFormStatus"),
    bgmSubmit: document.getElementById("bgmSubmit"),
    bgmCancel: document.getElementById("bgmCancel"),
    bgmCancelX: document.getElementById("bgmCancelX")
  };

  var state = {
    currentId: null,
    searchIndex: [],
    activeResult: 0,
    searchTrigger: null,
    tocHeadings: [],
    activeHeading: "",
    scrollTicking: false,
    lastSidebarTrigger: null
  };

  var bgmState = {
    tracks: [],
    current: null,
    backend: false,
    resumeOnVisible: false
  };

  function normalizeBgmTracks(data) {
    var tracks = Array.isArray(data && data.tracks) ? data.tracks : [];
    return tracks.map(function (track) {
      if (!track || typeof track.file !== "string" || !track.file) {
        return null;
      }
      var weight = Number(track.weight);
      if (!Number.isFinite(weight) || weight <= 0) {
        return null;
      }
      return {
        file: track.file,
        title: typeof track.title === "string" && track.title ? track.title : track.file,
        weight: weight
      };
    }).filter(Boolean);
  }

  function pickWeightedBgm(tracks, currentFile) {
    if (!tracks.length) {
      return null;
    }
    var candidates = tracks;
    if (tracks.length > 1 && currentFile) {
      var filtered = tracks.filter(function (track) {
        return track.file !== currentFile;
      });
      if (filtered.length) {
        candidates = filtered;
      }
    }
    var total = candidates.reduce(function (sum, track) {
      return sum + track.weight;
    }, 0);
    if (!total) {
      return candidates[0];
    }
    var roll = Math.random() * total;
    for (var index = 0; index < candidates.length; index += 1) {
      roll -= candidates[index].weight;
      if (roll < 0) {
        return candidates[index];
      }
    }
    return candidates[candidates.length - 1];
  }

  function bgmUrl(file) {
    return "BGM/" + encodeURIComponent(file);
  }

  function syncBgmButton() {
    var playing = !!bgmState.current && !els.bgmAudio.paused;
    els.bgmToggle.textContent = playing ? "Ⅱ" : "▶";
    els.bgmToggle.classList.toggle("is-playing", playing);
    els.bgmToggle.setAttribute("aria-label", playing ? "暂停背景音乐" : "播放背景音乐");
    els.bgmToggle.title = playing ? "暂停" : "播放";
  }

  function playBgm() {
    if (!bgmState.current) {
      return;
    }
    var promise = els.bgmAudio.play();
    if (promise && typeof promise.catch === "function") {
      promise.catch(function () {
        syncBgmButton();
      });
    }
  }

  function setBgmTrack(track, autoplay) {
    if (!track) {
      return;
    }
    bgmState.current = track;
    bgmState.resumeOnVisible = false;
    els.bgmPlayer.hidden = false;
    els.bgmTitle.textContent = track.title;
    els.bgmTitle.title = track.title;
    els.bgmAudio.loop = bgmState.tracks.length === 1;
    els.bgmAudio.src = bgmUrl(track.file);
    els.bgmAudio.load();
    syncBgmButton();
    if (autoplay) {
      playBgm();
    }
  }

  function applyBgmTracks(tracks) {
    bgmState.tracks = tracks;
    if (!tracks.length) {
      bgmState.current = null;
      els.bgmAudio.pause();
      els.bgmAudio.removeAttribute("src");
      els.bgmAudio.load();
      els.bgmTitle.textContent = "暂无音乐";
      els.bgmTitle.title = "";
      els.bgmPlayer.hidden = !bgmState.backend;
      syncBgmButton();
      return;
    }
    els.bgmPlayer.hidden = false;
    var existing = bgmState.current
      ? tracks.filter(function (track) { return track.file === bgmState.current.file; })[0]
      : null;
    if (existing) {
      bgmState.current = existing;
      els.bgmAudio.loop = tracks.length === 1;
      els.bgmTitle.textContent = existing.title;
      els.bgmTitle.title = existing.title;
      syncBgmButton();
      return;
    }
    setBgmTrack(pickWeightedBgm(tracks, null), false);
  }

  function loadBgmTracks() {
    fetch("BGM/BGM.json", { cache: "no-store" }).then(function (response) {
      if (!response.ok) {
        throw new Error("BGM 加载失败");
      }
      return response.json();
    }).then(function (data) {
      applyBgmTracks(normalizeBgmTracks(data));
    }).catch(function () {
      applyBgmTracks([]);
    });
  }

  function openBgmDialog() {
    if (!bgmState.backend) {
      showToast("上传 BGM 需要启动本地服务", "error");
      return;
    }
    els.bgmForm.reset();
    els.bgmFormWeight.value = "1";
    els.bgmFormStatus.textContent = "";
    els.bgmFormStatus.classList.remove("is-error");
    els.bgmSubmit.disabled = false;
    els.bgmDialog.showModal();
  }

  function closeBgmDialog() {
    els.bgmDialog.close();
  }

  function uploadBgm(event) {
    event.preventDefault();
    var file = els.bgmFile.files && els.bgmFile.files[0];
    var title = els.bgmFormTitle.value.trim();
    var weight = Number(els.bgmFormWeight.value);
    if (!file) {
      els.bgmFormStatus.textContent = "请选择音频文件";
      els.bgmFormStatus.classList.add("is-error");
      return;
    }
    if (!/\.(mp3|wav)$/i.test(file.name)) {
      els.bgmFormStatus.textContent = "只支持 .mp3 和 .wav 文件";
      els.bgmFormStatus.classList.add("is-error");
      return;
    }
    if (file.size > 50 * 1024 * 1024) {
      els.bgmFormStatus.textContent = "音频文件不能超过 50MB";
      els.bgmFormStatus.classList.add("is-error");
      return;
    }
    if (!title) {
      els.bgmFormStatus.textContent = "请填写歌名";
      els.bgmFormStatus.classList.add("is-error");
      return;
    }
    if (!Number.isFinite(weight) || weight <= 0) {
      els.bgmFormStatus.textContent = "权重必须大于 0";
      els.bgmFormStatus.classList.add("is-error");
      return;
    }
    els.bgmSubmit.disabled = true;
    els.bgmFormStatus.classList.remove("is-error");
    els.bgmFormStatus.textContent = "上传中…";
    file.arrayBuffer().then(function (buffer) {
      return fetch(
        "api/bgm?title=" + encodeURIComponent(title) +
        "&weight=" + encodeURIComponent(String(weight)) +
        "&filename=" + encodeURIComponent(file.name),
        {
          method: "POST",
          cache: "no-store",
          headers: { "Content-Type": file.type || "application/octet-stream" },
          body: buffer
        }
      );
    }).then(function (response) {
      return response.json().catch(function () {
        return {};
      }).then(function (data) {
        if (!response.ok) {
          throw new Error(data.error || "BGM 上传失败");
        }
        return data;
      });
    }).then(function (data) {
      applyBgmTracks(normalizeBgmTracks(data));
      setBgmTrack(data.track, true);
      closeBgmDialog();
      showToast("BGM 已上传");
    }).catch(function (error) {
      els.bgmFormStatus.textContent = error.message;
      els.bgmFormStatus.classList.add("is-error");
    }).finally(function () {
      els.bgmSubmit.disabled = false;
    });
  }

  function nextBgm() {
    if (!bgmState.tracks.length) {
      return;
    }
    var next = pickWeightedBgm(bgmState.tracks, bgmState.current && bgmState.current.file);
    setBgmTrack(next, true);
  }

  var collapsedCategories = new Set(readJSON(STORAGE.collapsed, []));
  var platformMod = /Mac|iPhone|iPad|iPod/i.test(navigator.platform || "") ? "⌘" : "Ctrl";

  /* -------------------------------------------------------
     Small utilities
     ------------------------------------------------------- */

  function escapeHTML(value) {
    return String(value == null ? "" : value).replace(/[&<>"']/g, function (character) {
      return {
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;"
      }[character];
    });
  }

  function readJSON(key, fallback) {
    try {
      var raw = window.localStorage.getItem(key);
      return raw ? JSON.parse(raw) : fallback;
    } catch (error) {
      return fallback;
    }
  }

  function writeJSON(key, value) {
    try {
      window.localStorage.setItem(key, JSON.stringify(value));
    } catch (error) {
      /* 本地存储不可用时，交互仍然可用 */
    }
  }

  function readString(key, fallback) {
    try {
      return window.localStorage.getItem(key) || fallback;
    } catch (error) {
      return fallback;
    }
  }

  function writeString(key, value) {
    try {
      window.localStorage.setItem(key, value);
    } catch (error) {
      /* 忽略无痕模式下的写入失败 */
    }
  }

  function icon(name, className) {
    return '<svg class="icon ' + (className || "") + '" aria-hidden="true"><use href="#i-' +
      name + '"></use></svg>';
  }

  function pad(value) {
    return value < 10 ? "0" + value : String(value);
  }

  function formatDate(iso) {
    var parts = iso.split("-").map(Number);
    return parts[0] + " 年 " + parts[1] + " 月 " + parts[2] + " 日";
  }

  function formatShortDate(iso) {
    var parts = iso.split("-").map(Number);
    return parts[0] + "." + pad(parts[1]) + "." + pad(parts[2]);
  }

  function categoryFor(id) {
    var category = CATEGORY_BY_ID[docs[id].category];
    return category || { name: "未分类", id: "", parentId: null };
  }

  function topCategories() {
    return categories.filter(function (category) {
      return !category.parentId;
    }).sort(function (left, right) {
      return (left.order || 0) - (right.order || 0);
    });
  }

  function childCategories(parentId) {
    return categories.filter(function (category) {
      return category.parentId === parentId;
    }).sort(function (left, right) {
      return (left.order || 0) - (right.order || 0);
    });
  }

  function categoryLabel(category) {
    if (!category) {
      return "未分类";
    }
    var names = [];
    var current = category;
    var seen = {};
    while (current) {
      if (seen[current.id]) {
        break;
      }
      seen[current.id] = true;
      names.unshift(current.name);
      current = current.parentId ? CATEGORY_BY_ID[current.parentId] : null;
    }
    return names.join(" / ");
  }

  function subtreeDocCount(category) {
    return category.docs.length + childCategories(category.id).reduce(function (total, child) {
      return total + subtreeDocCount(child);
    }, 0);
  }

  function categoryChain(category) {
    var chain = [];
    var current = category;
    var seen = {};
    while (current) {
      if (seen[current.id]) {
        break;
      }
      seen[current.id] = true;
      chain.unshift(current.id);
      current = current.parentId ? CATEGORY_BY_ID[current.parentId] : null;
    }
    return chain;
  }

  function clamp(number, min, max) {
    return Math.min(Math.max(number, min), max);
  }

  function isMobileNav() {
    return window.matchMedia("(max-width: 960px)").matches;
  }

  function isTocOverlay() {
    return window.matchMedia("(max-width: 1360px)").matches;
  }

  function prefersReducedMotion() {
    return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  }

  /* -------------------------------------------------------
     Toasts & clipboard
     ------------------------------------------------------- */

  function showToast(message) {
    var toast = document.createElement("div");
    toast.className = "toast";
    toast.innerHTML = '<span class="toast-icon">' + icon("check") + "</span><span>" +
      escapeHTML(message) + "</span>";
    els.toastRegion.appendChild(toast);

    while (els.toastRegion.children.length > 3) {
      els.toastRegion.removeChild(els.toastRegion.firstElementChild);
    }

    window.setTimeout(function () {
      toast.classList.add("is-leaving");
      window.setTimeout(function () {
        if (toast.parentNode) {
          toast.parentNode.removeChild(toast);
        }
      }, 190);
    }, 2400);
  }

  function copyText(text) {
    if (navigator.clipboard && window.isSecureContext) {
      return navigator.clipboard.writeText(text).then(function () {
        return true;
      }).catch(function () {
        return legacyCopy(text);
      });
    }
    return Promise.resolve(legacyCopy(text));
  }

  function legacyCopy(text) {
    var textarea = document.createElement("textarea");
    textarea.value = text;
    textarea.setAttribute("readonly", "");
    textarea.style.position = "fixed";
    textarea.style.left = "-9999px";
    textarea.style.top = "0";
    document.body.appendChild(textarea);
    textarea.select();
    textarea.setSelectionRange(0, textarea.value.length);
    var succeeded = false;
    try {
      succeeded = document.execCommand("copy");
    } catch (error) {
      succeeded = false;
    }
    document.body.removeChild(textarea);
    return succeeded;
  }

  function copyPageLink() {
    var url = state.currentId ? externalDocUrl(state.currentId) : siteRoot() + "/";
    copyText(url).then(function (success) {
      if (success) {
        showToast("页面链接已复制");
      } else {
        window.prompt("复制页面链接", url);
      }
    });
  }

  /* -------------------------------------------------------
     Sidebar tree
     ------------------------------------------------------- */

  function renderDocItems(category) {
    return category.docs.map(function (id) {
      var doc = docs[id];
      return '<li class="tree-item">' +
        '<a class="tree-link" href="#/doc/' + id + '" data-doc="' + id + '">' +
        '<span class="tree-emoji" aria-hidden="true">' + doc.emoji + "</span>" +
        '<span class="tree-link-title">' + escapeHTML(doc.title) + "</span>" +
        "</a></li>";
    }).join("");
  }

  function renderCategory(category, depth) {
    var isCollapsed = collapsedCategories.has(category.id);
    var docItems = renderDocItems(category);
    var children = childCategories(category.id);
    var count = subtreeDocCount(category);
    var toggleId = "tree-body-" + category.id;
    var className = "tree-group" + (depth > 0 ? " tree-group--child" : "") +
      (isCollapsed ? " is-collapsed" : "");
    var headClass = "tree-group-head" + (depth > 0 ? " tree-group-head--child" : "");

    return '<div class="' + className + '" data-category="' + category.id + '">' +
      '<button class="' + headClass + '" type="button" data-category-toggle="' + category.id +
      '" aria-expanded="' + (!isCollapsed) + '" aria-controls="' + toggleId + '">' +
      icon("chevron-down", "tree-chevron") +
      '<span class="tree-group-label">' + escapeHTML(category.name) + "</span>" +
      '<span class="tree-group-count">' + count + "</span>" +
      "</button>" +
      '<div class="tree-group-body" id="' + toggleId + '">' +
      '<ul class="tree-list">' + docItems + "</ul>" +
      children.map(function (child) {
        return renderCategory(child, depth + 1);
      }).join("") +
      "</div></div>";
  }

  function renderSidebar() {
    els.docCount.textContent = allIds.length + " 篇";

    if (!categories.length) {
      els.docTree.innerHTML =
        '<div class="tree-empty">' +
        "<strong>还没有主题</strong>" +
        "<span>通过内容管理添加第一个主题。</span>" +
        "</div>";
      setActiveTree();
      return;
    }

    els.docTree.innerHTML = topCategories().map(function (category) {
      return renderCategory(category, 0);
    }).join("");

    setActiveTree();
  }

  function setActiveTree() {
    if (!els.docTree || !state.currentId) {
      return;
    }

    var current = docs[state.currentId];
    var currentCategory = CATEGORY_BY_ID[current.category];
    var categoryIds = categoryChain(currentCategory);

    categoryIds.forEach(function (categoryId) {
      var group = els.docTree.querySelector('[data-category="' + categoryId + '"]');
      if (!group) {
        return;
      }
      if (group.classList.contains("is-collapsed")) {
        group.classList.remove("is-collapsed");
        var toggle = group.querySelector("[data-category-toggle]");
        if (toggle) {
          toggle.setAttribute("aria-expanded", "true");
        }
        collapsedCategories.delete(categoryId);
      }
    });
    if (categoryIds.length) {
      writeJSON(STORAGE.collapsed, Array.from(collapsedCategories));
    }

    var links = els.docTree.querySelectorAll(".tree-link");
    for (var index = 0; index < links.length; index += 1) {
      var link = links[index];
      var isActive = link.getAttribute("data-doc") === state.currentId;
      link.classList.toggle("is-active", isActive);
      if (isActive) {
        link.setAttribute("aria-current", "page");
      } else {
        link.removeAttribute("aria-current");
      }
    }
  }

  function toggleCategory(categoryId) {
    var group = els.docTree.querySelector('[data-category="' + categoryId + '"]');
    if (!group) {
      return;
    }
    var toggle = group.querySelector("[data-category-toggle]");
    var nowCollapsed = !group.classList.contains("is-collapsed");
    group.classList.toggle("is-collapsed", nowCollapsed);
    if (toggle) {
      toggle.setAttribute("aria-expanded", String(!nowCollapsed));
    }
    if (nowCollapsed) {
      collapsedCategories.add(categoryId);
    } else {
      collapsedCategories.delete(categoryId);
    }
    writeJSON(STORAGE.collapsed, Array.from(collapsedCategories));
  }

  /* -------------------------------------------------------
     Sidebar visibility
     ------------------------------------------------------- */

  function sidebarIsVisible() {
    if (isMobileNav()) {
      return document.body.classList.contains("sidebar-open");
    }
    return !document.body.classList.contains("sidebar-collapsed");
  }

  function syncSidebarState() {
    var visible = sidebarIsVisible();
    els.sidebar.toggleAttribute("inert", !visible);
    els.sidebarToggle.setAttribute("aria-expanded", String(visible));
    els.sidebarToggle.setAttribute("aria-label", visible ? "收起侧边栏" : "展开侧边栏");

    if (isMobileNav()) {
      document.body.classList.remove("sidebar-collapsed");
    }
    setActiveTree();
  }

  function openSidebar() {
    state.lastSidebarTrigger = document.activeElement;
    document.body.classList.add("sidebar-open");
    syncSidebarState();
    window.setTimeout(function () {
      els.sidebarClose.focus();
    }, 220);
  }

  function closeSidebar(restoreFocus) {
    var wasOpen = document.body.classList.contains("sidebar-open");
    document.body.classList.remove("sidebar-open");
    syncSidebarState();

    if (restoreFocus && wasOpen && state.lastSidebarTrigger &&
        typeof state.lastSidebarTrigger.focus === "function") {
      state.lastSidebarTrigger.focus();
    }
  }

  function toggleSidebar() {
    if (isMobileNav()) {
      if (document.body.classList.contains("sidebar-open")) {
        closeSidebar(true);
      } else {
        openSidebar();
      }
      return;
    }

    var collapsed = document.body.classList.toggle("sidebar-collapsed");
    writeString(STORAGE.sidebar, collapsed ? "1" : "0");
    syncSidebarState();
  }

  /* -------------------------------------------------------
     Document rendering
     ------------------------------------------------------- */

  function currentRouteId() {
    var match = window.location.hash.match(/^#\/doc\/([a-z0-9-]+)/i);
    return match ? match[1].toLowerCase() : null;
  }

  function isSingleView() {
    return /#single$/.test(window.location.hash);
  }

  function applySingleView() {
    var enabled = isSingleView();
    document.body.classList.toggle("single-view", enabled);
    if (els.docTreeToggle) {
      els.docTreeToggle.setAttribute("aria-pressed", enabled ? "true" : "false");
      els.docTreeToggle.setAttribute("aria-label", enabled ? "显示页面目录" : "隐藏页面目录");
      if (els.docTreeToggleLabel) {
        els.docTreeToggleLabel.textContent = enabled ? "显示目录" : "隐藏目录";
      }
    }
    if (!enabled) {
      if (els.sidebar) {
        els.sidebar.removeAttribute("inert");
      }
      return;
    }
    document.body.classList.remove("sidebar-open");
    if (els.sidebar) {
      els.sidebar.setAttribute("inert", "");
    }
  }

  function renderDocument(id, initial) {
    var doc = docs[id];
    if (!doc) {
      return;
    }
    if (els.historyDialog.open) {
      closeHistory();
    }

    document.body.classList.remove("is-empty-library");
    var category = categoryFor(id);
    var previousId = state.currentId;
    var shouldMoveFocus = !initial && previousId !== null;
    state.currentId = id;
    state.activeHeading = "";

    document.title = doc.title + " · HappyDays非官方文档";
    setExternalUrl(id);
    els.crumbCategory.textContent = categoryLabel(category);
    els.crumbTitle.textContent = doc.title;
    var bankHref = category && category.id ? "/bank/" + encodeURIComponent(category.id) : "/home";
    if (els.crumbCategory) {
      els.crumbCategory.href = bankHref;
    }
    if (els.crumbTitle) {
      els.crumbTitle.href = bankHref;
    }
    els.docCategory.textContent = categoryLabel(category);
    els.docEmoji.textContent = doc.emoji;
    els.docTitle.textContent = doc.title;
    els.docExcerpt.textContent = doc.excerpt;
    els.docUpdated.textContent = formatDate(doc.updated) + "更新";
    els.docReading.textContent = "约 " + doc.reading + " 分钟阅读";
    els.colophonUpdated.textContent = "最后更新于 " + formatShortDate(doc.updated);
    els.docTags.innerHTML = doc.tags.map(function (tag) {
      return '<span class="doc-tag">' + escapeHTML(tag) + "</span>";
    }).join("");
    renderDocSignatures(doc.signatures || []);
    loadDocComments(id);
    els.editBtn.href = "editor.html#" + encodeURIComponent(id);

    els.docBody.innerHTML = doc.content;
    els.docBody.querySelectorAll("thead th").forEach(function (headingCell) {
      headingCell.setAttribute("scope", "col");
    });
    els.docRoot.classList.remove("is-entering");
    void els.docRoot.offsetWidth;
    els.docRoot.classList.add("is-entering");

    buildOutline();
    updatePageNavigation();
    setActiveTree();
    rememberRecent(id);

    if (!initial) {
      window.scrollTo({ top: 0, behavior: "auto" });
      closeSidebar(false);
      closeToc(false);
    }

    if (shouldMoveFocus) {
      els.docTitle.setAttribute("tabindex", "-1");
      try {
        els.docTitle.focus({ preventScroll: true });
      } catch (error) {
        /* 旧浏览器忽略 preventScroll */
      }
      els.pageAnnouncement.textContent = "已打开文档：" + doc.title;
    }

    window.requestAnimationFrame(function () {
      updateReadingPosition();
      updateTocActive();
    });
  }

  function renderEmptyLibrary() {
    state.currentId = null;
    state.activeHeading = "";
    state.tocHeadings = [];
    document.body.classList.add("is-empty-library");
    document.title = "知识库准备中 · HappyDays非官方文档";
    setExternalUrl(null);

    els.crumbCategory.textContent = "知识库";
    els.crumbTitle.textContent = "等待迁移";
    if (els.crumbCategory) {
      els.crumbCategory.href = "/home";
    }
    if (els.crumbTitle) {
      els.crumbTitle.href = "/home";
    }
    els.docCategory.textContent = "准备中";
    els.docEmoji.textContent = "🌱";
    els.docTitle.textContent = "知识库正在准备中";
    els.docExcerpt.textContent = "所有文章与主题已清空。创建第一个主题，或迁移新的文档。";
    els.docUpdated.textContent = "等待内容";
    els.docReading.textContent = "0 篇文章";
    els.docTags.innerHTML = "";
    renderDocSignatures([]);
    renderDocComments([]);
    els.docAuthorMeta.hidden = true;
    els.docSignatures.hidden = true;
    els.editBtn.href = "editor.html";

    els.docBody.innerHTML =
      '<div class="empty-library">' +
      '<span class="empty-library-eyebrow">EMPTY LIBRARY</span>' +
      '<div class="empty-library-mark" aria-hidden="true">🌱</div>' +
      '<p class="empty-library-title">从第一个主题开始</p>' +
      '<p>目前还没有文章或主题。打开内容管理，先创建一个主题，再添加第一篇文档。</p>' +
      '<div class="empty-library-actions">' +
      '<a class="doc-button" href="editor.html">打开内容管理' +
      icon("arrow-right") +
      "</a>" +
      "</div>" +
      '<p class="empty-library-note">编辑功能需要通过 <code>python server.py</code> 启动本地服务。</p>' +
      "</div>";

    els.tocNav.innerHTML = '<p class="toc-empty">本页暂无小节</p>';
    els.readingProgress.style.width = "0%";
    els.readingPercent.textContent = "0%";
    els.colophonUpdated.textContent = "等待内容迁移";
    els.prevDoc.removeAttribute("href");
    els.prevDocTitle.textContent = "";
    els.prevDoc.setAttribute("aria-disabled", "true");
    els.nextDoc.removeAttribute("href");
    els.nextDocTitle.textContent = "";
    els.nextDoc.setAttribute("aria-disabled", "true");
    els.pageAnnouncement.textContent = "知识库当前为空";
    window.scrollTo({ top: 0, behavior: "auto" });
  }

  function route(initial) {
    applySingleView();
    if (!allIds.length) {
      var cleanUrl = window.location.pathname + window.location.search;
      try {
        window.history.replaceState(null, "", cleanUrl);
      } catch (error) {
        /* 某些 file:// 环境不支持 replaceState */
      }
      renderEmptyLibrary();
      return;
    }

    var id = currentRouteId();
    var valid = id && docs[id];

    if (!valid) {
      var fallbackId = allIds[0];
      var replacement = "#/doc/" + fallbackId;
      try {
        window.history.replaceState(null, "", replacement);
      } catch (error) {
        /* 某些 file:// 环境不支持 replaceState */
        window.location.hash = replacement;
      }
      id = fallbackId;
      if (initial !== true && currentRouteId() !== fallbackId) {
        renderDocument(fallbackId, false);
        return;
      }
    }

    if (state.currentId === id && !initial) {
      return;
    }
    renderDocument(id, initial);
  }
  function updatePageNavigation() {
    var index = allIds.indexOf(state.currentId);
    var prevId = index > 0 ? allIds[index - 1] : null;
    var nextId = index < allIds.length - 1 ? allIds[index + 1] : null;

    if (prevId) {
      els.prevDoc.href = "#/doc/" + prevId;
      els.prevDocTitle.textContent = docs[prevId].title;
      els.prevDoc.removeAttribute("aria-disabled");
    } else {
      els.prevDoc.removeAttribute("href");
      els.prevDocTitle.textContent = "";
      els.prevDoc.setAttribute("aria-disabled", "true");
    }

    if (nextId) {
      els.nextDoc.href = "#/doc/" + nextId;
      els.nextDocTitle.textContent = docs[nextId].title;
      els.nextDoc.removeAttribute("aria-disabled");
    } else {
      els.nextDoc.removeAttribute("href");
      els.nextDocTitle.textContent = "";
      els.nextDoc.setAttribute("aria-disabled", "true");
    }
  }

  function recentDocs() {
    var stored = readJSON(STORAGE.recent, []);
    return Array.isArray(stored) ? stored.filter(function (id) { return Boolean(docs[id]); }) : [];
  }

  function rememberRecent(id) {
    var recent = recentDocs().filter(function (existing) { return existing !== id; });
    recent.unshift(id);
    writeJSON(STORAGE.recent, recent.slice(0, 6));
  }

  /* -------------------------------------------------------
     Outline / table of contents
     ------------------------------------------------------- */

  function buildOutline() {
    var headingNodes = els.docBody.querySelectorAll("h2, h3");
    state.tocHeadings = [];

    for (var index = 0; index < headingNodes.length; index += 1) {
      var heading = headingNodes[index];
      var headingId = "section-" + (index + 1);
      heading.id = headingId;
      state.tocHeadings.push({
        id: headingId,
        text: heading.textContent.trim(),
        level: heading.tagName === "H2" ? 2 : 3
      });
    }

    if (!state.tocHeadings.length) {
      els.tocNav.innerHTML = '<p class="toc-empty">本页暂无小节</p>';
      return;
    }

    els.tocNav.innerHTML = state.tocHeadings.map(function (item) {
      return '<button class="toc-link toc-level-' + item.level + '" type="button" data-target="' +
        item.id + '">' + escapeHTML(item.text) + "</button>";
    }).join("");

    updateTocActive();
  }

  function updateTocActive() {
    if (!state.tocHeadings.length) {
      return;
    }

    var activeId = state.tocHeadings[0].id;
    for (var index = 0; index < state.tocHeadings.length; index += 1) {
      var heading = document.getElementById(state.tocHeadings[index].id);
      if (!heading) {
        continue;
      }
      if (heading.getBoundingClientRect().top <= 145) {
        activeId = state.tocHeadings[index].id;
      } else {
        break;
      }
    }

    var atBottom = window.innerHeight + window.scrollY >=
      document.documentElement.scrollHeight - 12;
    if (atBottom) {
      activeId = state.tocHeadings[state.tocHeadings.length - 1].id;
    }

    if (activeId === state.activeHeading) {
      return;
    }
    state.activeHeading = activeId;

    var links = els.tocNav.querySelectorAll(".toc-link");
    for (var linkIndex = 0; linkIndex < links.length; linkIndex += 1) {
      var isActive = links[linkIndex].getAttribute("data-target") === activeId;
      links[linkIndex].classList.toggle("is-active", isActive);
      if (isActive) {
        links[linkIndex].setAttribute("aria-current", "location");
      } else {
        links[linkIndex].removeAttribute("aria-current");
      }
    }
  }

  function openToc() {
    if (!isTocOverlay()) {
      return;
    }
    document.body.classList.add("toc-open");
    els.tocPanel.removeAttribute("inert");
    els.outlineBtn.setAttribute("aria-expanded", "true");
    els.outlineBtn.setAttribute("aria-label", "关闭页面目录");
    window.setTimeout(function () {
      els.tocClose.focus();
    }, 200);
  }

  function closeToc(restoreFocus) {
    var wasOpen = document.body.classList.contains("toc-open");
    document.body.classList.remove("toc-open");
    if (isTocOverlay()) {
      els.tocPanel.setAttribute("inert", "");
    } else {
      els.tocPanel.removeAttribute("inert");
    }
    els.outlineBtn.setAttribute("aria-expanded", "false");
    els.outlineBtn.setAttribute("aria-label", "打开页面目录");
    if (restoreFocus !== false && wasOpen) {
      els.outlineBtn.focus();
    }
  }

  /* -------------------------------------------------------
     Reading progress & scroll UI
     ------------------------------------------------------- */

  function updateReadingPosition() {
    var rect = els.docBody.getBoundingClientRect();
    var bodyTop = window.scrollY + rect.top;
    var travel = Math.max(1, els.docBody.offsetHeight - window.innerHeight * 0.55);
    var percent = Math.round(clamp((window.scrollY - bodyTop + 120) / travel, 0, 1) * 100);

    els.readingProgress.style.width = percent + "%";
    els.readingPercent.textContent = percent + "%";
  }

  function toggleBackToTop() {
    els.backToTop.classList.toggle("is-visible", window.scrollY > 560);
  }

  function handleScroll() {
    if (state.scrollTicking) {
      return;
    }
    state.scrollTicking = true;
    window.requestAnimationFrame(function () {
      updateReadingPosition();
      updateTocActive();
      toggleBackToTop();
      state.scrollTicking = false;
    });
  }

  function scrollToTop() {
    window.scrollTo({ top: 0, behavior: prefersReducedMotion() ? "auto" : "smooth" });
  }

  /* -------------------------------------------------------
     Theme and wide reading
     ------------------------------------------------------- */

  function activeTheme() {
    return document.documentElement.getAttribute("data-theme") === "dark" ? "dark" : "light";
  }

  function syncThemeButton() {
    var dark = activeTheme() === "dark";
    els.themeBtn.setAttribute("aria-label", dark ? "切换到浅色模式" : "切换到深色模式");
  }

  function toggleTheme() {
    var next = activeTheme() === "dark" ? "light" : "dark";
    document.documentElement.setAttribute("data-theme", next);
    writeString(STORAGE.theme, next);
    syncThemeButton();
    showToast(next === "dark" ? "已切换到深色模式" : "已切换到浅色模式");
  }

  function applyWideReading(enabled) {
    document.body.classList.toggle("doc-wide", enabled);
    writeString(STORAGE.wide, enabled ? "1" : "0");
    var item = els.moreMenu.querySelector('[data-action="wide"]');
    if (els.wideState) {
      els.wideState.textContent = enabled ? "开" : "关";
    }
    if (item) {
      item.classList.toggle("is-on", enabled);
      item.setAttribute("aria-pressed", String(enabled));
    }
  }

  function toggleWideReading() {
    var next = !document.body.classList.contains("doc-wide");
    applyWideReading(next);
    showToast(next ? "已开启宽屏阅读" : "已恢复标准阅读宽度");
  }

  /* -------------------------------------------------------
     More menu
     ------------------------------------------------------- */

  function openMoreMenu() {
    els.moreMenu.hidden = false;
    els.moreBtn.setAttribute("aria-expanded", "true");
  }

  function closeMoreMenu(restoreFocus) {
    if (els.moreMenu.hidden) {
      return;
    }
    els.moreMenu.hidden = true;
    els.moreBtn.setAttribute("aria-expanded", "false");
    if (restoreFocus) {
      els.moreBtn.focus();
    }
  }

  function toggleMoreMenu() {
    if (els.moreMenu.hidden) {
      openMoreMenu();
    } else {
      closeMoreMenu(true);
    }
  }

  /* -------------------------------------------------------
     Search
     ------------------------------------------------------- */

  function plainText(html) {
    var container = document.createElement("div");
    container.innerHTML = html;
    return (container.textContent || "").replace(/\s+/g, " ").trim();
  }

  function buildSearchIndex() {
    state.searchIndex = allIds.map(function (id) {
      var doc = docs[id];
      return {
        id: id,
        title: doc.title,
        emoji: doc.emoji,
        excerpt: doc.excerpt,
        tags: doc.tags,
        category: categoryLabel(categoryFor(id)),
        text: plainText(doc.content)
      };
    });
  }

  function scoreResult(item, query, tokens) {
    var title = item.title.toLowerCase();
    var excerpt = item.excerpt.toLowerCase();
    var tags = item.tags.join(" ").toLowerCase();
    var haystack = item.text.toLowerCase();
    var combined = title + " " + excerpt + " " + tags + " " + haystack;

    for (var index = 0; index < tokens.length; index += 1) {
      if (combined.indexOf(tokens[index]) === -1) {
        return -1;
      }
    }

    var score = 0;
    if (title === query) {
      score += 220;
    } else if (title.indexOf(query) === 0) {
      score += 140;
    } else if (title.indexOf(query) !== -1) {
      score += 90;
    }
    if (excerpt.indexOf(query) !== -1) {
      score += 30;
    }
    if (tags.indexOf(query) !== -1) {
      score += 24;
    }
    if (haystack.indexOf(query) !== -1) {
      score += 12;
    }
    tokens.forEach(function (token) {
      if (title.indexOf(token) !== -1) {
        score += 18;
      }
    });
    return score;
  }

  function highlightText(text, query) {
    if (!query) {
      return escapeHTML(text);
    }
    var lower = text.toLowerCase();
    var index = lower.indexOf(query.toLowerCase());
    if (index === -1) {
      return escapeHTML(text);
    }
    return escapeHTML(text.slice(0, index)) + "<mark>" +
      escapeHTML(text.slice(index, index + query.length)) + "</mark>" +
      escapeHTML(text.slice(index + query.length));
  }

  function makeSnippet(item, query) {
    if (!query) {
      return item.excerpt;
    }
    var source = item.text;
    var index = source.toLowerCase().indexOf(query.toLowerCase());
    if (index === -1) {
      return item.excerpt;
    }
    var start = Math.max(0, index - 30);
    var end = Math.min(source.length, index + query.length + 68);
    return (start > 0 ? "…" : "") + source.slice(start, end) + (end < source.length ? "…" : "");
  }

  function resultMarkup(item, query, index) {
    return '<button class="search-result' + (index === state.activeResult ? " is-active" : "") +
      '" type="button" id="search-result-' + index + '" data-result-id="' + item.id +
      '" role="option" aria-selected="' + (index === state.activeResult) + '">' +
      '<span class="search-result-emoji" aria-hidden="true">' + item.emoji + "</span>" +
      '<span class="search-result-copy">' +
      '<span class="search-result-top">' +
      '<span class="search-result-title">' + highlightText(item.title, query) + "</span>" +
      '<span class="search-result-category">' + escapeHTML(item.category) + "</span>" +
      "</span>" +
      '<span class="search-result-snippet">' + highlightText(makeSnippet(item, query), query) + "</span>" +
      "</span></button>";
  }

  function renderSearchResults(query) {
    var normalized = query.trim().toLowerCase();
    state.activeResult = 0;

    if (!state.searchIndex.length) {
      els.searchResults.innerHTML =
        '<div class="search-empty"><strong>知识库还是空的</strong>' +
        "添加文章后就可以在这里搜索标题、标签和正文。</div>";
      els.searchInput.removeAttribute("aria-activedescendant");
      return;
    }

    if (!normalized) {
      var recent = recentDocs().slice(0, 4);
      var items = recent.map(function (id) {
        return state.searchIndex.filter(function (item) { return item.id === id; })[0];
      }).filter(Boolean);

      if (items.length < 4) {
        state.searchIndex.forEach(function (item) {
          var exists = items.some(function (existing) { return existing.id === item.id; });
          if (!exists && items.length < 4) {
            items.push(item);
          }
        });
      }

      els.searchResults.innerHTML =
        '<p class="search-group-label" role="presentation">' + (recent.length ? "最近浏览与推荐" : "推荐阅读") + "</p>" +
        items.map(function (item, index) {
          return resultMarkup(item, "", index);
        }).join("");
    } else {
      var tokens = normalized.split(/\s+/).filter(Boolean);
      var results = state.searchIndex.map(function (item) {
        return { item: item, score: scoreResult(item, normalized, tokens) };
      }).filter(function (result) {
        return result.score >= 0;
      }).sort(function (a, b) {
        return b.score - a.score;
      }).slice(0, 8);

      if (!results.length) {
        els.searchResults.innerHTML =
          '<div class="search-empty" role="presentation"><strong>没有找到“' + escapeHTML(query.trim()) + '”</strong>' +
          '试试更短的关键词，或搜索「权限」「API」「会议」。</div>';
        els.searchInput.removeAttribute("aria-activedescendant");
        return;
      }

      els.searchResults.innerHTML =
        '<p class="search-group-label" role="presentation">搜索结果 · ' + results.length + " 篇</p>" +
        results.map(function (result, index) {
          return resultMarkup(result.item, query.trim(), index);
        }).join("");
    }

    syncActiveResult(false);
  }

  function syncActiveResult(scrollIntoView) {
    var results = els.searchResults.querySelectorAll(".search-result");
    if (!results.length) {
      els.searchInput.removeAttribute("aria-activedescendant");
      return;
    }

    if (state.activeResult >= results.length) {
      state.activeResult = 0;
    }
    if (state.activeResult < 0) {
      state.activeResult = results.length - 1;
    }

    for (var index = 0; index < results.length; index += 1) {
      var isActive = index === state.activeResult;
      results[index].classList.toggle("is-active", isActive);
      results[index].setAttribute("aria-selected", String(isActive));
    }

    var active = results[state.activeResult];
    if (active) {
      els.searchInput.setAttribute("aria-activedescendant", active.id);
      if (scrollIntoView) {
        active.scrollIntoView({ block: "nearest" });
      }
    }
  }

  function openSearch(trigger) {
    if (!els.searchOverlay.hidden) {
      els.searchInput.focus();
      return;
    }
    state.searchTrigger = trigger || document.activeElement;
    els.searchOverlay.hidden = false;
    document.body.classList.add("search-open");
    els.searchInput.value = "";
    renderSearchResults("");
    window.setTimeout(function () {
      els.searchInput.focus();
    }, 20);
  }

  function closeSearch(restoreFocus) {
    if (els.searchOverlay.hidden) {
      return;
    }
    els.searchOverlay.hidden = true;
    document.body.classList.remove("search-open");
    if (restoreFocus !== false && state.searchTrigger &&
        typeof state.searchTrigger.focus === "function" &&
        document.contains(state.searchTrigger)) {
      state.searchTrigger.focus();
    }
  }

  function activateSearchResult(index) {
    var results = els.searchResults.querySelectorAll(".search-result");
    var result = results[index];
    if (!result) {
      return;
    }
    var id = result.getAttribute("data-result-id");
    closeSearch(true);
    if (window.location.hash === "#/doc/" + id) {
      scrollToTop();
      return;
    }
    window.location.hash = "#/doc/" + id;
  }

  /* -------------------------------------------------------
     Global interactions
     ------------------------------------------------------- */

  function onDocumentClick(event) {
    var actionTrigger = event.target.closest("[data-action]");
    if (actionTrigger) {
      var action = actionTrigger.getAttribute("data-action");
      if (action === "close-search") {
        closeSearch(true);
      } else if (action === "close-sidebar") {
        closeSidebar(true);
      } else if (action === "close-toc") {
        closeToc(true);
      } else if (action === "invite") {
        var base = siteRoot() + "/";
        copyText(base).then(function (success) {
          showToast(success ? "邀请链接已复制，发给伙伴即可加入" : "复制失败，请手动复制页面链接");
        });
      } else if (action === "copy-link") {
        closeMoreMenu(true);
        copyPageLink();
      } else if (action === "print") {
        closeMoreMenu(true);
        window.setTimeout(function () {
          window.print();
        }, 80);
      } else if (action === "wide") {
        toggleWideReading();
      }
    }

    var searchOpener = event.target.closest("[data-open-search]");
    if (searchOpener) {
      openSearch(searchOpener);
    }

    var categoryToggle = event.target.closest("[data-category-toggle]");
    if (categoryToggle) {
      toggleCategory(categoryToggle.getAttribute("data-category-toggle"));
    }

    if (!event.target.closest("#moreMenu") && !event.target.closest("#moreBtn")) {
      closeMoreMenu(false);
    }

    var docLink = event.target.closest("a[data-doc]");
    if (docLink && isMobileNav()) {
      var targetsCurrentDoc = docLink.getAttribute("data-doc") === state.currentId;
      closeSidebar(false);
      if (targetsCurrentDoc) {
        els.docTitle.setAttribute("tabindex", "-1");
        els.docTitle.focus({ preventScroll: true });
        scrollToTop();
      }
    }

    var tocLink = event.target.closest(".toc-link");
    if (tocLink) {
      var target = document.getElementById(tocLink.getAttribute("data-target"));
      if (target) {
        if (isTocOverlay()) {
          target.setAttribute("tabindex", "-1");
          try {
            target.focus({ preventScroll: true });
          } catch (error) {
            /* 旧浏览器忽略 preventScroll */
          }
        }
        target.scrollIntoView({ behavior: prefersReducedMotion() ? "auto" : "smooth", block: "start" });
        closeToc(false);
      }
    }
  }

  function onDocumentKeydown(event) {
    var key = event.key;
    var target = event.target;
    var isTyping = target && (
      target.tagName === "INPUT" ||
      target.tagName === "TEXTAREA" ||
      target.tagName === "SELECT" ||
      target.isContentEditable
    );

    if ((event.metaKey || event.ctrlKey) && key.toLowerCase() === "k") {
      event.preventDefault();
      if (els.searchOverlay.hidden) {
        openSearch(document.activeElement);
      } else {
        closeSearch(true);
      }
      return;
    }

    if (key === "/" && !isTyping && !event.metaKey && !event.ctrlKey && !event.altKey) {
      event.preventDefault();
      openSearch(document.activeElement);
      return;
    }

    if (key !== "Escape") {
      return;
    }

    if (!els.searchOverlay.hidden) {
      closeSearch(true);
      return;
    }
    if (!els.moreMenu.hidden) {
      closeMoreMenu(true);
      return;
    }
    if (document.body.classList.contains("toc-open")) {
      closeToc(true);
      return;
    }
    if (isMobileNav() && document.body.classList.contains("sidebar-open")) {
      closeSidebar(true);
      return;
    }
  }

  function onSearchKeydown(event) {
    var key = event.key;
    if (key === "ArrowDown") {
      event.preventDefault();
      state.activeResult += 1;
      syncActiveResult(true);
    } else if (key === "ArrowUp") {
      event.preventDefault();
      state.activeResult -= 1;
      syncActiveResult(true);
    } else if (key === "Enter") {
      event.preventDefault();
      activateSearchResult(state.activeResult);
    } else if (key === "Escape") {
      event.preventDefault();
      closeSearch(true);
    }
  }

  function trapSearchFocus(event) {
    if (event.key !== "Tab") {
      return;
    }
    var focusable = Array.prototype.slice.call(
      els.searchOverlay.querySelectorAll('input, button:not([disabled])')
    ).filter(function (element) {
      return element.offsetParent !== null;
    });
    if (!focusable.length) {
      return;
    }
    var first = focusable[0];
    var last = focusable[focusable.length - 1];
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  }

  function bindEvents() {
    window.addEventListener("hashchange", function () {
      route(false);
    });

    document.addEventListener("click", onDocumentClick);
    document.addEventListener("keydown", onDocumentKeydown);

    els.sidebarToggle.addEventListener("click", toggleSidebar);
    document.getElementById("skipToContent").addEventListener("click", function () {
      els.docTitle.setAttribute("tabindex", "-1");
      els.docTitle.focus();
      els.docTitle.scrollIntoView({ behavior: prefersReducedMotion() ? "auto" : "smooth", block: "start" });
    });
    els.sidebarClose.addEventListener("click", function () {
      if (isMobileNav()) {
        closeSidebar(true);
      } else {
        document.body.classList.add("sidebar-collapsed");
        writeString(STORAGE.sidebar, "1");
        syncSidebarState();
        els.sidebarToggle.focus();
      }
    });

    els.sidebarSearch.addEventListener("click", function () {
      openSearch(els.sidebarSearch);
    });

    els.shareBtn.addEventListener("click", copyPageLink);
    els.bgmToggle.addEventListener("click", function () {
      if (els.bgmAudio.paused) {
        playBgm();
      } else {
        els.bgmAudio.pause();
      }
    });
    els.bgmNext.addEventListener("click", nextBgm);
    els.bgmUpload.addEventListener("click", openBgmDialog);
    els.bgmForm.addEventListener("submit", uploadBgm);
    els.bgmCancel.addEventListener("click", closeBgmDialog);
    els.bgmCancelX.addEventListener("click", closeBgmDialog);
    els.bgmDialog.addEventListener("click", function (event) {
      if (event.target === els.bgmDialog) {
        closeBgmDialog();
      }
    });
    els.bgmAudio.addEventListener("play", syncBgmButton);
    els.bgmAudio.addEventListener("pause", syncBgmButton);
    els.bgmAudio.addEventListener("ended", function () {
      if (bgmState.tracks.length <= 1) {
        els.bgmAudio.currentTime = 0;
        playBgm();
        return;
      }
      nextBgm();
    });
    document.addEventListener("visibilitychange", function () {
      if (document.hidden) {
        if (!els.bgmAudio.paused) {
          bgmState.resumeOnVisible = true;
          els.bgmAudio.pause();
        }
        return;
      }
      if (bgmState.resumeOnVisible) {
        bgmState.resumeOnVisible = false;
        playBgm();
      }
    });
    els.docCommentForm.addEventListener("submit", submitDocComment);
    els.historyBtn.addEventListener("click", openHistory);
    els.historyClose.addEventListener("click", closeHistory);
    els.historyDialog.addEventListener("click", function (event) {
      if (event.target === els.historyDialog) {
        closeHistory();
      }
    });
    els.titleRollEdit.addEventListener("click", openSiteTitleEditor);
    els.titleEditForm.addEventListener("submit", saveSiteTitles);
    document.addEventListener("selectionchange", saveSiteTitleSelection);
    els.siteTitleToolbar.addEventListener("mousedown", function (event) {
      saveSiteTitleSelection();
      if (event.target.closest(".title-format-button")) {
        event.preventDefault();
      }
    });
    els.siteTitleToolbar.addEventListener("click", function (event) {
      var button = event.target.closest(".title-format-button");
      if (!button) {
        return;
      }
      var command = button.dataset.format;
      applySiteTitleFormat(command === "strike" ? "strikeThrough" : command);
    });
    els.siteTitleColor.addEventListener("mousedown", saveSiteTitleSelection);
    els.siteTitleColor.addEventListener("input", function () {
      applySiteTitleFormat("foreColor", els.siteTitleColor.value);
    });
    els.siteTitleSize.addEventListener("mousedown", saveSiteTitleSelection);
    els.siteTitleSize.addEventListener("change", function () {
      applySiteTitleFontSize(els.siteTitleSize.value);
    });
    els.siteTitleAdd.addEventListener("click", function () {
      if (els.siteTitleRows.querySelectorAll(".site-title-row").length >= 30) {
        setSiteTitleAlert("标题最多 30 条");
        return;
      }
      setSiteTitleAlert("");
      var row = createSiteTitleRow({ text: "", weight: 1 });
      updateSiteTitleTotals();
      row.querySelector(".site-title-text").focus();
    });
    els.siteTitleClose.addEventListener("click", closeSiteTitleEditor);
    els.siteTitleCancel.addEventListener("click", closeSiteTitleEditor);
    els.docTreeToggle.addEventListener("click", function () {
      var id = state.currentId || currentRouteId();
      if (!id) {
        return;
      }
      window.location.hash = "#/doc/" + encodeURIComponent(id) + (isSingleView() ? "" : "#single");
    });
    els.themeBtn.addEventListener("click", toggleTheme);
    els.moreBtn.addEventListener("click", function (event) {
      event.stopPropagation();
      toggleMoreMenu();
    });

    els.outlineBtn.addEventListener("click", function () {
      if (document.body.classList.contains("toc-open")) {
        closeToc(true);
      } else {
        openToc();
      }
    });
    els.tocClose.addEventListener("click", function () {
      closeToc(true);
    });
    els.tocTop.addEventListener("click", scrollToTop);
    els.backToTop.addEventListener("click", scrollToTop);

    els.searchInput.addEventListener("input", function () {
      renderSearchResults(els.searchInput.value);
    });
    els.searchInput.addEventListener("keydown", onSearchKeydown);
    els.searchOverlay.addEventListener("keydown", trapSearchFocus);

    els.searchResults.addEventListener("click", function (event) {
      var result = event.target.closest(".search-result");
      if (result) {
        var results = Array.prototype.slice.call(els.searchResults.querySelectorAll(".search-result"));
        activateSearchResult(results.indexOf(result));
      }
    });

    els.searchResults.addEventListener("mouseover", function (event) {
      var result = event.target.closest(".search-result");
      if (!result) {
        return;
      }
      var results = Array.prototype.slice.call(els.searchResults.querySelectorAll(".search-result"));
      var index = results.indexOf(result);
      if (index !== -1 && index !== state.activeResult) {
        state.activeResult = index;
        syncActiveResult(false);
      }
    });

    els.docBody.addEventListener("click", function (event) {
      var copyButton = event.target.closest(".code-copy");
      if (!copyButton) {
        return;
      }
      var block = copyButton.closest(".code-block");
      var code = block ? block.querySelector("code") : null;
      if (!code) {
        return;
      }
      copyText(code.innerText).then(function (success) {
        if (!success) {
          showToast("复制失败，请手动选择代码");
          return;
        }
        copyButton.innerHTML = icon("check") + "已复制";
        window.setTimeout(function () {
          copyButton.innerHTML = icon("copy") + "复制";
        }, 1700);
      });
    });

    window.addEventListener("scroll", handleScroll, { passive: true });

    var resizeTimer = null;
    window.addEventListener("resize", function () {
      window.clearTimeout(resizeTimer);
      resizeTimer = window.setTimeout(function () {
        if (!isMobileNav()) {
          document.body.classList.remove("sidebar-open");
        }
        if (!isTocOverlay()) {
          document.body.classList.remove("toc-open");
          els.tocPanel.removeAttribute("inert");
          els.outlineBtn.setAttribute("aria-expanded", "false");
        } else if (!document.body.classList.contains("toc-open")) {
          els.tocPanel.setAttribute("inert", "");
        }
        syncSidebarState();
        updateReadingPosition();
      }, 140);
    });
  }

  /* -------------------------------------------------------
     Boot
     ------------------------------------------------------- */

  function boot() {
    document.querySelectorAll(".mod-key").forEach(function (element) {
      element.textContent = platformMod;
    });

    renderSidebar();
    buildSearchIndex();
    bindEvents();
    initTitleRoll();
    loadBgmTracks();

    fetch("api/health", { cache: "no-store" }).then(function (response) {
      return response.ok ? response.json() : null;
    }).then(function (data) {
      if (data && data.ok) {
        bgmState.backend = true;
        els.bgmUpload.hidden = false;
        if (!bgmState.tracks.length) {
          els.bgmPlayer.hidden = false;
        }
        els.editBtn.hidden = false;
        els.titleRollEdit.hidden = false;
        els.historyBtn.hidden = false;
        els.docCommentForm.hidden = false;
        if (!els.docCommentAuthor.value) {
          try {
            els.docCommentAuthor.value = localStorage.getItem(commentAuthorStorageKey()) || "";
          } catch (error) {
            /* 忽略隐私模式下的 localStorage 错误 */
          }
        }
      }
    }).catch(function () {
      /* 静态托管或 file:// 下没有编辑服务，保持入口隐藏 */
    });

    var storedCollapsed = readString(STORAGE.sidebar, "0") === "1";
    if (storedCollapsed && !isMobileNav()) {
      document.body.classList.add("sidebar-collapsed");
    }
    if (isMobileNav()) {
      els.sidebar.setAttribute("inert", "");
    }

    applyWideReading(readString(STORAGE.wide, "0") === "1");
    syncThemeButton();
    syncSidebarState();

    if (isTocOverlay()) {
      els.tocPanel.setAttribute("inert", "");
    } else {
      els.tocPanel.removeAttribute("inert");
    }

    route(true);
    toggleBackToTop();
  }

  boot();
})();
