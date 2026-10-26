/* =========================================================
   HappyDays Wiki — local content editor
   Talks to server.py; every save rebuilds assets/data.js.
   ========================================================= */

(function () {
  "use strict";

  var els = {
    connection: document.getElementById("connection"),
    connectionText: document.getElementById("connectionText"),
    articleCount: document.getElementById("articleCount"),
    topicList: document.getElementById("topicList"),
    newArticleBtn: document.getElementById("newArticleBtn"),
    newTopicBtn: document.getElementById("newTopicBtn"),
    importArticleBtn: document.getElementById("importArticleBtn"),
    importFileInput: document.getElementById("importFileInput"),
    offlineState: document.getElementById("offlineState"),
    retryConnection: document.getElementById("retryConnection"),
    emptyState: document.getElementById("emptyState"),
    emptyTitle: document.getElementById("emptyTitle"),
    emptyDescription: document.getElementById("emptyDescription"),
    form: document.getElementById("articleForm"),
    formMode: document.getElementById("formMode"),
    formHeading: document.getElementById("formHeading"),
    formAlert: document.getElementById("formAlert"),
    previewBtn: document.getElementById("previewBtn"),
    historyBtn: document.getElementById("historyBtn"),
    historyDialog: document.getElementById("historyDialog"),
    historyClose: document.getElementById("historyClose"),
    historyList: document.getElementById("historyList"),
    historyMeta: document.getElementById("historyMeta"),
    historyContent: document.getElementById("historyContent"),
    historyCutoff: document.getElementById("historyCutoff"),
    historyLoad: document.getElementById("historyLoad"),
    historySetCutoff: document.getElementById("historySetCutoff"),
    historyClearCutoff: document.getElementById("historyClearCutoff"),
    historyStatus: document.getElementById("historyStatus"),
    saveBtn: document.getElementById("saveBtn"),
    saveLabel: document.getElementById("saveLabel"),
    deleteArticleBtn: document.getElementById("deleteArticleBtn"),
    moveArticleUp: document.getElementById("moveArticleUp"),
    moveArticleDown: document.getElementById("moveArticleDown"),
    title: document.getElementById("fieldTitle"),
    topic: document.getElementById("fieldTopic"),
    topicHint: document.getElementById("topicHint"),
    emoji: document.getElementById("fieldEmoji"),
    slug: document.getElementById("fieldSlug"),
    updated: document.getElementById("fieldUpdated"),
    reading: document.getElementById("fieldReading"),
    tags: document.getElementById("fieldTags"),
    description: document.getElementById("fieldDescription"),
    author: document.getElementById("fieldAuthor"),
    signatureCount: document.getElementById("signatureCount"),
    signatureList: document.getElementById("signatureList"),
    body: document.getElementById("fieldBody"),
    previewBody: document.getElementById("previewBody"),
    previewStatus: document.getElementById("previewStatus"),
    topicDialog: document.getElementById("topicDialog"),
    topicDialogTitle: document.getElementById("topicDialogTitle"),
    topicForm: document.getElementById("topicForm"),
    topicParent: document.getElementById("topicParent"),
    topicId: document.getElementById("topicId"),
    topicName: document.getElementById("topicName"),
    topicDescription: document.getElementById("topicDescription"),
    topicAlert: document.getElementById("topicAlert"),
    createTopicBtn: document.getElementById("createTopicBtn"),
    closeTopicDialog: document.getElementById("closeTopicDialog"),
    cancelTopic: document.getElementById("cancelTopic"),
    editTitlesBtn: document.getElementById("editTitlesBtn"),
    titleDialog: document.getElementById("titleDialog"),
    titleForm: document.getElementById("titleForm"),
    titleEditorList: document.getElementById("titleEditorList"),
    editorTitleToolbar: document.getElementById("editorTitleToolbar"),
    editorTitleColor: document.getElementById("editorTitleColor"),
    editorTitleSize: document.getElementById("editorTitleSize"),
    titleInterval: document.getElementById("titleInterval"),
    addTitleItem: document.getElementById("addTitleItem"),
    titleTotal: document.getElementById("titleTotal"),
    titleAlert: document.getElementById("titleAlert"),
    closeTitleDialog: document.getElementById("closeTitleDialog"),
    cancelTitle: document.getElementById("cancelTitle"),
    saveTitlesBtn: document.getElementById("saveTitlesBtn"),
    toast: document.getElementById("editorToast")
  };

  var state = {
    topics: [],
    articles: [],
    currentSlug: null,
    currentArticle: null,
    mode: null,
    dirty: false,
    saving: false,
    loading: false,
    previewController: null,
    previewTimer: null,
    toastTimer: null
  };

  var historyState = {
    versions: [],
    detail: null,
    selectedHash: null
  };

  var AUTHOR_KEY = "happydays-editor-author";
  var activeEditorTitle = null;
  var savedEditorTitleRange = null;
  var editorTitleBaseFontSize = 18.5;

  function rememberedAuthor() {
    try {
      return window.localStorage.getItem(AUTHOR_KEY) || "";
    } catch (error) {
      return "";
    }
  }

  function rememberAuthor(name) {
    try {
      window.localStorage.setItem(AUTHOR_KEY, name);
    } catch (error) {
      /* 本地存储不可用时仍可在当前会话署名 */
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

  function renderSignatures(signatures) {
    var records = (signatures || []).slice().reverse();
    els.signatureCount.textContent = records.length + " 条";
    els.signatureList.innerHTML = "";
    if (!records.length) {
      var empty = document.createElement("li");
      empty.className = "signature-empty";
      empty.textContent = "暂无署名记录；保存后会记录作者与时间。";
      els.signatureList.appendChild(empty);
      return;
    }
    records.forEach(function (record) {
      var item = document.createElement("li");
      item.className = "signature-item";
      var head = document.createElement("div");
      head.className = "signature-item-head";
      var author = document.createElement("strong");
      author.textContent = record.author || "匿名";
      var time = document.createElement("time");
      time.textContent = formatSignatureTime(record.at);
      time.dateTime = record.at || "";
      head.appendChild(author);
      head.appendChild(time);
      var meta = document.createElement("div");
      meta.className = "signature-item-meta";
      meta.textContent = signatureActionLabel(record);
      item.appendChild(head);
      item.appendChild(meta);
      els.signatureList.appendChild(item);
    });
  }

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

  function request(path, options) {
    options = options || {};
    var headers = { Accept: "application/json" };
    if (options.body) {
      headers["Content-Type"] = "application/json";
    }
    return fetch(path, {
      method: options.method || "GET",
      headers: headers,
      body: options.body,
      signal: options.signal
    }).catch(function (error) {
      if (error && error.name === "AbortError") {
        throw error;
      }
      throw new Error("无法连接编辑服务，请先运行 python server.py");
    }).then(function (response) {
      return response.text().then(function (text) {
        var payload = null;
        if (text) {
          try {
            payload = JSON.parse(text);
          } catch (error) {
            payload = null;
          }
        }
        if (!response.ok) {
          throw new Error((payload && payload.error) || ("请求失败（" + response.status + "）"));
        }
        return payload || {};
      });
    });
  }

  function jsonRequest(method, path, payload) {
    return request(path, {
      method: method,
      body: JSON.stringify(payload)
    });
  }

  function localToday() {
    var now = new Date();
    var month = String(now.getMonth() + 1).padStart(2, "0");
    var day = String(now.getDate()).padStart(2, "0");
    return now.getFullYear() + "-" + month + "-" + day;
  }

  function setConnection(mode, text) {
    els.connection.classList.remove("is-online", "is-offline");
    if (mode === "on") {
      els.connection.classList.add("is-online");
    } else if (mode === "off") {
      els.connection.classList.add("is-offline");
    }
    els.connectionText.textContent = text;
  }

  function showToast(message, type) {
    window.clearTimeout(state.toastTimer);
    els.toast.textContent = message;
    els.toast.classList.remove("is-error", "is-success");
    if (type) {
      els.toast.classList.add("is-" + type);
    }
    els.toast.hidden = false;
    state.toastTimer = window.setTimeout(function () {
      els.toast.hidden = true;
    }, 3400);
  }

  function resultMessage(result, fallback) {
    var message = result.message || fallback;
    if (result.commit && result.commit.committed) {
      message += result.commit.hash
        ? " · 已本地提交 " + result.commit.hash
        : " · 已本地提交";
    } else if (result.commit && result.commit.error) {
      var detail = String(result.commit.error).split("\n")[0];
      message += " · 本地提交失败：" + detail;
    }
    return message;
  }

  function setFormAlert(message) {
    els.formAlert.textContent = message || "";
    els.formAlert.hidden = !message;
  }

  function setTopicAlert(message) {
    els.topicAlert.textContent = message || "";
    els.topicAlert.hidden = !message;
  }

  function topTopics() {
    return state.topics.filter(function (topic) {
      return !topic.parentId;
    }).sort(function (left, right) {
      return (left.order || 0) - (right.order || 0);
    });
  }

  function childTopics(parentId) {
    return state.topics.filter(function (topic) {
      return topic.parentId === parentId;
    }).sort(function (left, right) {
      return (left.order || 0) - (right.order || 0);
    });
  }

  function subtreeArticleCount(topic) {
    return state.articles.filter(function (article) {
      return article.topic === topic.id;
    }).length + childTopics(topic.id).reduce(function (total, child) {
      return total + subtreeArticleCount(child);
    }, 0);
  }

  function orderedTopicEntries() {
    var entries = [];

    function append(topic, depth) {
      entries.push({ topic: topic, depth: depth });
      childTopics(topic.id).forEach(function (child) {
        append(child, depth + 1);
      });
    }

    topTopics().forEach(function (topic) {
      append(topic, 0);
    });
    return entries;
  }

  function topicOptionLabel(entry) {
    return "　".repeat(entry.depth) + (entry.depth ? "↳ " : "") + entry.topic.name;
  }

  function currentTopicOptions(selectedId) {
    els.topic.innerHTML = "";
    if (!state.topics.length) {
      var empty = document.createElement("option");
      empty.value = "";
      empty.textContent = "请先添加主题";
      els.topic.appendChild(empty);
      els.topic.disabled = true;
      return;
    }
    orderedTopicEntries().forEach(function (entry) {
      var option = document.createElement("option");
      option.value = entry.topic.id;
      option.textContent = topicOptionLabel(entry);
      option.selected = entry.topic.id === selectedId;
      els.topic.appendChild(option);
    });
  }

  function renderTopicArticles(articles, emptyText) {
    var list = document.createElement("ul");
    list.className = "topic-articles";
    if (!articles.length && emptyText) {
      var empty = document.createElement("li");
      empty.className = "topic-empty";
      empty.textContent = emptyText;
      list.appendChild(empty);
      return list;
    }
    articles.forEach(function (article) {
      var item = document.createElement("li");
      var button = document.createElement("button");
      button.type = "button";
      button.className = "topic-article";
      button.dataset.slug = article.slug;
      button.textContent = article.title;
      button.title = article.title;
      if (article.slug === state.currentSlug) {
        button.classList.add("is-active");
      }
      item.appendChild(button);
      list.appendChild(item);
    });
    return list;
  }

  function renderTopicNode(topic, depth) {
    var children = childTopics(topic.id);
    var articles = state.articles.filter(function (article) {
      return article.topic === topic.id;
    });
    var group = document.createElement("section");
    group.className = depth === 0 ? "topic-group" : "topic-subgroup";

    var head = document.createElement("div");
    head.className = depth === 0 ? "topic-group-head" : "topic-subgroup-head";
    var name = document.createElement("span");
    name.className = depth === 0 ? "topic-group-name" : "topic-subgroup-name";
    name.textContent = topic.name;
    name.title = topic.name;
    var count = document.createElement("span");
    count.className = depth === 0 ? "topic-group-count" : "topic-subgroup-count";
    count.textContent = subtreeArticleCount(topic);
    var addChild = document.createElement("button");
    addChild.type = "button";
    addChild.className = "topic-add-child";
    addChild.dataset.parentId = topic.id;
    addChild.title = "添加下级主题";
    addChild.setAttribute("aria-label", "在「" + topic.name + "」下添加下级主题");
    addChild.textContent = "+";
    head.appendChild(name);
    head.appendChild(count);
    head.appendChild(addChild);
    if (!articles.length && !children.length) {
      head.appendChild(createTopicDeleteButton(topic));
    }

    group.appendChild(head);
    if (articles.length) {
      group.appendChild(renderTopicArticles(articles, ""));
    }
    children.forEach(function (child) {
      group.appendChild(renderTopicNode(child, depth + 1));
    });
    if (!articles.length && !children.length) {
      group.appendChild(renderTopicArticles([], "暂无文章"));
    }
    return group;
  }

  function renderSidebar() {
    els.articleCount.textContent = state.articles.length + " 篇";
    els.topicList.innerHTML = "";
    if (!state.topics.length) {
      var emptyTopics = document.createElement("div");
      emptyTopics.className = "editor-topic-empty";
      emptyTopics.innerHTML = "<strong>还没有主题</strong><span>点击「添加主题」开始整理内容。</span>";
      els.topicList.appendChild(emptyTopics);
      return;
    }
    topTopics().forEach(function (topic) {
      els.topicList.appendChild(renderTopicNode(topic, 0));
    });
  }

  function setActiveArticle() {
    var buttons = els.topicList.querySelectorAll(".topic-article");
    for (var index = 0; index < buttons.length; index += 1) {
      buttons[index].classList.toggle("is-active", buttons[index].dataset.slug === state.currentSlug);
    }
  }

  function setBusy(busy) {
    state.saving = busy;
    els.saveBtn.disabled = busy;
    els.previewBtn.disabled = busy;
    els.deleteArticleBtn.disabled = busy;
    els.moveArticleUp.disabled = busy;
    els.moveArticleDown.disabled = busy;
    els.importArticleBtn.disabled = busy || state.topics.length === 0;
    els.saveLabel.textContent = busy
      ? "保存中…"
      : (state.mode === "new" ? "创建并构建" : "保存并构建");
  }

  function showEmptyState() {
    state.mode = null;
    state.currentSlug = null;
    state.currentArticle = null;
    state.dirty = false;
    els.emptyTitle.textContent = "还没有文章";
    els.emptyDescription.textContent = state.topics.length
      ? "选择左侧主题下的文章，或点击「新建文章」开始写作。"
      : "先在左侧点击「添加主题」，再创建第一篇文章。";
    els.emptyState.hidden = false;
    els.form.hidden = true;
    els.offlineState.hidden = true;
    els.deleteArticleBtn.hidden = true;
    els.moveArticleUp.hidden = true;
    els.moveArticleDown.hidden = true;
    setActiveArticle();
    history.replaceState(null, "", "#new");
  }

  function createTopicDeleteButton(topic) {
    var button = document.createElement("button");
    button.type = "button";
    button.className = "topic-delete";
    button.dataset.topicId = topic.id;
    button.title = "删除主题";
    button.setAttribute("aria-label", "删除主题「" + topic.name + "」");
    button.innerHTML = '<svg class="icon" aria-hidden="true"><use href="#i-trash"></use></svg>';
    return button;
  }

  function confirmDiscard() {
    return !state.dirty || window.confirm("当前修改尚未保存，确定离开吗？");
  }

  function showEditor() {
    els.offlineState.hidden = true;
    els.emptyState.hidden = true;
    els.form.hidden = false;
  }

  function showOffline() {
    setConnection("off", "服务未连接");
    els.offlineState.hidden = false;
    els.emptyState.hidden = true;
    els.form.hidden = true;
    els.newArticleBtn.disabled = true;
    els.newTopicBtn.disabled = true;
    els.importArticleBtn.disabled = true;
  }

  function updateHeadingFromTitle() {
    els.formHeading.textContent = els.title.value.trim() || "未命名文章";
    document.title = (els.title.value.trim() || "新建文章") + " · 内容管理";
  }

  function parseImportedValue(raw) {
    var value = raw.trim();
    if ((value.charAt(0) === '"' && value.charAt(value.length - 1) === '"') ||
        (value.charAt(0) === "'" && value.charAt(value.length - 1) === "'")) {
      try {
        return JSON.parse(value);
      } catch (error) {
        return value.slice(1, -1);
      }
    }
    if (/^-?\d+$/.test(value)) {
      return Number(value);
    }
    if (value === "true" || value === "false") {
      return value === "true";
    }
    return value;
  }

  function parseImportedMarkdown(text) {
    var source = text.replace(/^\uFEFF/, "").replace(/\r\n/g, "\n").replace(/\r/g, "\n");
    var meta = {};
    var body = source;
    if (source.indexOf("---\n") === 0) {
      var end = source.indexOf("\n---\n", 4);
      if (end !== -1) {
        var header = source.slice(4, end);
        body = source.slice(end + 5);
        var listKey = null;
        header.split("\n").forEach(function (line) {
          if (!line.trim() || line.trim().charAt(0) === "#") {
            return;
          }
          if (/^\s*-\s+/.test(line)) {
            if (listKey && Array.isArray(meta[listKey])) {
              meta[listKey].push(parseImportedValue(line.replace(/^\s*-\s+/, "")));
            }
            return;
          }
          var colon = line.indexOf(":");
          if (colon === -1) {
            return;
          }
          var key = line.slice(0, colon).trim();
          var value = line.slice(colon + 1).trim();
          if (!key) {
            return;
          }
          if (!value) {
            meta[key] = [];
            listKey = key;
          } else {
            meta[key] = parseImportedValue(value);
            listKey = null;
          }
        });
      }
    }

    var lines = body.split("\n");
    var firstIndex = -1;
    for (var index = 0; index < lines.length; index += 1) {
      if (lines[index].trim()) {
        firstIndex = index;
        break;
      }
    }
    var heading = "";
    if (firstIndex !== -1 && /^#\s+/.test(lines[firstIndex])) {
      heading = lines[firstIndex].replace(/^#\s+/, "").trim();
      lines.splice(firstIndex, 1);
    }
    body = lines.join("\n").trim();
    var title = String(meta.title || heading || "").trim();
    var description = String(meta.description || "").trim();
    if (!description) {
      var paragraph = [];
      body.split("\n").some(function (line) {
        var value = line.trim();
        if (!value) {
          return paragraph.length > 0;
        }
        if (value.charAt(0) === "#" || value.indexOf("```") === 0 || value.indexOf("- ") === 0 || value.indexOf(">") === 0) {
          return paragraph.length > 0;
        }
        paragraph.push(value);
        return false;
      });
      description = paragraph.join(" ")
        .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
        .replace(/[*_`]/g, "")
        .replace(/\s+/g, " ")
        .trim();
    }
    var tags = [];
    if (Array.isArray(meta.tags)) {
      tags = meta.tags;
    } else if (typeof meta.tags === "string" && meta.tags) {
      tags = meta.tags.split(/[,，]/);
    }
    var updated = /^\d{4}-\d{2}-\d{2}$/.test(String(meta.updated || ""))
      ? String(meta.updated)
      : localToday();
    var reading = Number(meta.reading_time);
    if (!Number.isFinite(reading) || reading < 1) {
      reading = Math.max(1, Math.min(240, Math.ceil(body.replace(/\s+/g, "").length / 500)));
    } else {
      reading = Math.min(240, Math.round(reading));
    }
    return {
      title: title.slice(0, 200),
      description: description.slice(0, 500),
      emoji: String(meta.emoji || "📄").slice(0, 8),
      updated: updated,
      reading: reading,
      tags: tags.join(", "),
      body: body
    };
  }

  function validateImportFilename(filename) {
    var match = /^(.+)\.md$/i.exec(filename);
    if (!match) {
      return { error: "只支持 .md 文件" };
    }
    var stem = match[1];
    if (!/^[A-Za-z0-9][A-Za-z0-9-]*$/.test(stem)) {
      return { error: "导入失败：文件名只能包含英文字母、数字和连字符，不能包含中文、空格或下划线" };
    }
    var slug = stem.toLowerCase();
    if (slug.length > 64) {
      return { error: "导入失败：文件名不能超过 64 个字符" };
    }
    if (state.articles.some(function (article) {
      return article.slug === slug;
    })) {
      return { error: "导入失败：已存在 slug 为「" + slug + "」的文章" };
    }
    return { slug: slug };
  }

  function importMarkdownFile(file) {
    var validation = validateImportFilename(file.name);
    if (validation.error) {
      showToast(validation.error, "error");
      return;
    }
    if (!state.topics.length) {
      showToast("请先添加一个主题", "error");
      return;
    }
    if (!confirmDiscard()) {
      return;
    }
    var reader = new FileReader();
    reader.onerror = function () {
      showToast("读取文件失败，请重试", "error");
    };
    reader.onload = function () {
      var imported = parseImportedMarkdown(String(reader.result || ""));
      var topicId = state.mode === "edit" && state.currentArticle
        ? state.currentArticle.topic
        : null;
      startNewArticle(topicId, true);
      els.title.value = imported.title || validation.slug;
      els.description.value = imported.description || "从 Markdown 文件导入。";
      els.emoji.value = imported.emoji;
      els.updated.value = imported.updated;
      els.reading.value = imported.reading;
      els.tags.value = imported.tags;
      els.slug.value = validation.slug;
      els.body.value = imported.body || "## 内容\n\n";
      state.dirty = true;
      updateHeadingFromTitle();
      refreshPreview();
      showToast("已导入 " + file.name + "，请确认主题和内容后保存", "success");
    };
    reader.readAsText(file, "UTF-8");
  }


  function fillForm(article) {
    if (els.historyDialog.open) {
      closeHistory();
    }
    state.loading = true;
    state.mode = "edit";
    state.currentSlug = article.slug;
    state.currentArticle = article;
    state.dirty = false;

    currentTopicOptions(article.topic);
    els.topic.value = article.topic;
    els.topic.disabled = false;
    els.topicHint.textContent = "保存后会移动文章文件，并自动调整本地图片路径";

    els.title.value = article.title || "";
    els.description.value = article.description || "";
    els.emoji.value = article.emoji || "📄";
    els.updated.value = article.updated || localToday();
    els.reading.value = article.readingTime || 5;
    els.tags.value = (article.tags || []).join(", ");
    els.slug.value = article.slug;
    els.slug.readOnly = true;
    els.body.value = article.body || "";
    var signatures = article.signatures || [];
    var latestAuthor = signatures.length ? signatures[signatures.length - 1].author : "";
    els.author.value = rememberedAuthor() || latestAuthor || "";
    renderSignatures(signatures);

    els.formMode.textContent = "编辑文章 · #" + article.order;
    updateHeadingFromTitle();
    setFormAlert("");
    showEditor();
    els.deleteArticleBtn.hidden = false;
    els.moveArticleUp.hidden = false;
    els.moveArticleDown.hidden = false;
    setBusy(false);
    setActiveArticle();
    history.replaceState(null, "", "#" + encodeURIComponent(article.slug));
    els.previewStatus.textContent = "等待预览";
    state.loading = false;
    refreshPreview();
  }

  function startNewArticle(topicId, skipConfirm) {
    if (!skipConfirm && !confirmDiscard()) {
      return;
    }
    if (els.historyDialog.open) {
      closeHistory();
    }
    if (!state.topics.length) {
      showToast("请先添加一个主题", "error");
      return;
    }
    state.loading = true;
    els.form.reset();
    state.mode = "new";
    state.currentSlug = null;
    state.currentArticle = null;
    state.dirty = false;

    currentTopicOptions(topicId || (state.topics[0] && state.topics[0].id));
    els.topic.disabled = false;
    els.topicHint.textContent = "保存后文章会放入此主题目录";
    els.slug.readOnly = false;

    els.title.value = "";
    els.description.value = "";
    els.emoji.value = "📄";
    els.updated.value = localToday();
    els.reading.value = "5";
    els.tags.value = "";
    els.slug.value = "";
    els.body.value = "## 小节标题\n\n在这里写正文。\n";
    els.author.value = rememberedAuthor();
    renderSignatures([]);

    els.formMode.textContent = "新建文章";
    els.formHeading.textContent = "新建文章";
    document.title = "新建文章 · 内容管理";
    setFormAlert("");
    showEditor();
    els.deleteArticleBtn.hidden = true;
    els.moveArticleUp.hidden = true;
    els.moveArticleDown.hidden = true;
    setBusy(false);
    setActiveArticle();
    history.replaceState(null, "", "#new");
    els.previewStatus.textContent = "等待预览";
    state.loading = false;
    els.title.focus();
    refreshPreview();
  }

  function openArticle(slug, force) {
    if (!force && !confirmDiscard()) {
      return Promise.resolve(false);
    }
    return request("/api/articles/" + encodeURIComponent(slug)).then(function (article) {
      fillForm(article);
      return true;
    }).catch(function (error) {
      showToast(error.message, "error");
      return false;
    });
  }

  function moveArticle(direction) {
    if (!state.currentSlug || state.mode !== "edit" || state.saving) {
      return;
    }
    if (state.dirty && !window.confirm("当前修改尚未保存，调整顺序会重新加载文章，继续吗？")) {
      return;
    }
    var slug = state.currentSlug;
    var author = (els.author.value || "").trim() || rememberedAuthor() || "HappyDays 团队";
    setBusy(true);
    jsonRequest("POST", "/api/articles/" + encodeURIComponent(slug) + "/move", {
      direction: direction,
      author: author
    }).then(function (result) {
      if (!result.moved) {
        showToast(direction === "up" ? "已经是当前主题的第一篇" : "已经是当前主题的最后一篇");
        return null;
      }
      return fetchState().then(function () {
        return openArticle(slug, true);
      }).then(function () {
        showToast("文章顺序已调整", "success");
      });
    }).catch(function (error) {
      showToast(error.message, "error");
    }).finally(function () {
      setBusy(false);
    });
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

  function editorHistoryAuthor() {
    return (els.author.value || "").trim() || rememberedAuthor() || "HappyDays 团队";
  }

  function renderEditorHistory(data) {
    var versions = Array.isArray(data && data.versions) ? data.versions : [];
    historyState.versions = versions;
    els.historyCutoff.textContent = data && data.earliest
      ? "最早可见版本已限制；更早版本在阅读页隐藏。"
      : "阅读页会显示全部历史版本。";
    els.historyList.innerHTML = "";
    if (!versions.length) {
      els.historyList.innerHTML = '<p class="history-empty">还没有可查看的版本。</p>';
      els.historyContent.innerHTML = "";
      els.historyMeta.textContent = "";
      els.historyLoad.disabled = true;
      els.historySetCutoff.disabled = true;
      return;
    }
    versions.forEach(function (version) {
      var button = document.createElement("button");
      button.type = "button";
      button.className = "history-version" + (version.visible === false ? " is-hidden" : "");
      button.dataset.hash = version.hash;
      button.innerHTML =
        '<span class="history-version-date">' + escapeHTML(formatHistoryDate(version.date)) + "</span>" +
        '<span class="history-version-subject">' + escapeHTML(version.subject || "更新文章") + "</span>" +
        '<span class="history-version-author">' +
        escapeHTML(version.author || "未知") +
        (version.current ? " · 当前" : "") +
        (version.visible === false ? " · 已隐藏" : "") +
        "</span>";
      button.addEventListener("click", function () {
        loadEditorHistoryVersion(version.hash);
      });
      els.historyList.appendChild(button);
    });
    var initial = versions.filter(function (version) {
      return version.hash === historyState.selectedHash;
    })[0] || versions[0];
    loadEditorHistoryVersion(initial.hash);
  }

  function loadEditorHistoryVersion(hash) {
    if (!state.currentSlug) {
      return;
    }
    historyState.selectedHash = hash;
    Array.prototype.forEach.call(
      els.historyList.querySelectorAll(".history-version"),
      function (button) {
        button.classList.toggle("is-active", button.dataset.hash === hash);
      }
    );
    els.historyMeta.textContent = "加载版本…";
    fetch(
      "/api/articles/" + encodeURIComponent(state.currentSlug) + "/history/" + encodeURIComponent(hash),
      { cache: "no-store", headers: { Accept: "application/json" } }
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
      historyState.detail = detail;
      els.historyMeta.innerHTML =
        "<strong>" + escapeHTML(detail.title || hash) + "</strong>" +
        "<span>" + escapeHTML(formatHistoryDate(detail.date)) + " · " +
        escapeHTML(detail.author || "未知") + "</span>" +
        "<code>" + escapeHTML(detail.shortHash || hash) + "</code>";
      els.historyLoad.disabled = false;
      els.historySetCutoff.disabled = false;
      var topicId = state.currentArticle ? state.currentArticle.topic : "";
      return fetch("/api/preview", {
        method: "POST",
        cache: "no-store",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          slug: state.currentSlug,
          topicId: topicId,
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
      });
    }).catch(function (error) {
      historyState.detail = null;
      els.historyLoad.disabled = true;
      els.historySetCutoff.disabled = true;
      els.historyMeta.textContent = error.message;
      els.historyContent.innerHTML = "";
    });
  }

  function openHistory() {
    if (state.mode !== "edit" || !state.currentSlug) {
      showToast("请先打开一篇文章", "error");
      return;
    }
    historyState.versions = [];
    historyState.detail = null;
    historyState.selectedHash = null;
    els.historyDialog.showModal();
    els.historyList.innerHTML = '<p class="history-empty">加载版本列表…</p>';
    els.historyMeta.textContent = "";
    els.historyContent.innerHTML = "";
    els.historyLoad.disabled = true;
    els.historySetCutoff.disabled = true;
    els.historyStatus.textContent = "";
    fetch("/api/articles/" + encodeURIComponent(state.currentSlug) + "/history", {
      cache: "no-store",
      headers: { Accept: "application/json" }
    }).then(function (response) {
      return response.json().catch(function () {
        return {};
      }).then(function (data) {
        if (!response.ok) {
          throw new Error(data.error || "版本列表加载失败");
        }
        return data;
      });
    }).then(renderEditorHistory).catch(function (error) {
      els.historyList.innerHTML = '<p class="history-empty">' + escapeHTML(error.message) + "</p>";
    });
  }

  function closeHistory() {
    els.historyDialog.close();
  }

  function loadHistoryIntoEditor() {
    var detail = historyState.detail;
    if (!detail || !state.currentSlug) {
      return;
    }
    if (!window.confirm("载入这个版本会替换当前编辑内容，但不会立即保存。继续吗？")) {
      return;
    }
    els.title.value = detail.title || "";
    els.description.value = detail.description || "";
    els.emoji.value = detail.emoji || "📄";
    els.updated.value = detail.updated || localToday();
    els.reading.value = detail.readingTime || 5;
    els.tags.value = (detail.tags || []).join(", ");
    els.body.value = detail.body || "";
    state.dirty = true;
    updateHeadingFromTitle();
    refreshPreview();
    setFormAlert("已载入版本 " + (detail.shortHash || "") + "，尚未保存");
    closeHistory();
    showToast("历史版本已载入编辑器，请确认后保存", "success");
  }

  function updateHistoryCutoff(hash) {
    if (!state.currentSlug) {
      return;
    }
    els.historySetCutoff.disabled = true;
    els.historyClearCutoff.disabled = true;
    jsonRequest(
      "PUT",
      "/api/articles/" + encodeURIComponent(state.currentSlug) + "/history/earliest",
      { hash: hash, author: editorHistoryAuthor() }
    ).then(function (result) {
      els.historyStatus.textContent = result.commit && result.commit.committed
        ? "已记录并本地提交 " + (result.commit.hash || "")
        : "最早可见版本已更新";
      return fetch("/api/articles/" + encodeURIComponent(state.currentSlug) + "/history", {
        cache: "no-store",
        headers: { Accept: "application/json" }
      }).then(function (response) {
        return response.json();
      }).then(renderEditorHistory);
    }).catch(function (error) {
      els.historyStatus.textContent = error.message;
      showToast(error.message, "error");
    }).finally(function () {
      els.historySetCutoff.disabled = false;
      els.historyClearCutoff.disabled = false;
    });
  }

  function fetchState() {
    return request("/api/state").then(function (data) {
      state.topics = Array.isArray(data.topics) ? data.topics : [];
      state.articles = Array.isArray(data.articles) ? data.articles : [];
      renderSidebar();
      els.newArticleBtn.disabled = state.topics.length === 0;
      els.newTopicBtn.disabled = false;
      els.importArticleBtn.disabled = state.topics.length === 0;
      setConnection("on", "本地编辑服务已连接");
      if (!els.form.hidden && state.mode === "new") {
        var selected = els.topic.value;
        currentTopicOptions(selected || (state.topics[0] && state.topics[0].id));
        els.topic.disabled = false;
      }
      return data;
    });
  }

  function splitTags(value) {
    var seen = {};
    return value.split(/[,，]/).map(function (tag) {
      return tag.trim();
    }).filter(function (tag) {
      if (!tag || seen[tag]) {
        return false;
      }
      seen[tag] = true;
      return true;
    });
  }

  function collectPayload() {
    var title = els.title.value.trim();
    var description = els.description.value.trim();
    var slug = els.slug.value.trim();
    var body = els.body.value.trim();
    var author = els.author.value.trim();
    var readingTime = Number(els.reading.value);
    var updated = els.updated.value;

    if (!author) {
      throw new Error("请填写本次署名");
    }
    if (!title) {
      throw new Error("请填写标题");
    }
    if (!description) {
      throw new Error("请填写摘要");
    }
    if (!els.emoji.value.trim()) {
      throw new Error("请填写图标");
    }
    if (!updated || !/^\d{4}-\d{2}-\d{2}$/.test(updated)) {
      throw new Error("请选择有效的更新时间");
    }
    if (!Number.isInteger(readingTime) || readingTime < 1 || readingTime > 240) {
      throw new Error("阅读时间必须是 1–240 的整数");
    }
    if (!body) {
      throw new Error("正文不能为空");
    }
    if (!els.topic.value) {
      throw new Error("请选择主题");
    }
    if (state.mode === "new") {
      if (!slug) {
        throw new Error("请填写 slug");
      }
      if (!/^[a-z0-9][a-z0-9-]{0,63}$/.test(slug)) {
        throw new Error("slug 只能包含小写字母、数字和连字符");
      }
    }

    var payload = {
      title: title,
      description: description,
      emoji: els.emoji.value.trim(),
      updated: updated,
      readingTime: readingTime,
      tags: splitTags(els.tags.value),
      body: body,
      author: author,
      topicId: els.topic.value
    };
    rememberAuthor(author);
    if (state.mode === "new") {
      payload.slug = slug;
    }
    return payload;
  }

  function saveArticle(event) {
    if (event) {
      event.preventDefault();
    }
    if (state.saving) {
      return;
    }
    var payload;
    try {
      payload = collectPayload();
    } catch (error) {
      setFormAlert(error.message);
      return;
    }
    setFormAlert("");
    setBusy(true);

    var operation;
    if (state.mode === "new") {
      operation = jsonRequest("POST", "/api/articles", payload);
    } else {
      operation = jsonRequest("PUT", "/api/articles/" + encodeURIComponent(state.currentSlug), payload);
    }

    operation.then(function (result) {
      state.dirty = false;
      return fetchState().then(function () {
        if (result.article && result.article.slug) {
          return openArticle(result.article.slug, true).then(function () {
            showToast(resultMessage(result, "已保存并重新构建"), "success");
          });
        }
        showToast(resultMessage(result, "已保存并重新构建"), "success");
      });
    }).catch(function (error) {
      setFormAlert(error.message);
      showToast(error.message, "error");
    }).finally(function () {
      setBusy(false);
    });
  }

  function deleteCurrentArticle() {
    if (!state.currentSlug || !state.currentArticle || state.saving) {
      return;
    }
    var title = state.currentArticle.title;
    if (!window.confirm("确定删除文章「" + title + "」吗？\n\nMarkdown 文件和本地图片会被删除，此操作不可撤销。")) {
      return;
    }
    els.deleteArticleBtn.disabled = true;
    request("/api/articles/" + encodeURIComponent(state.currentSlug), {
      method: "DELETE"
    }).then(function (result) {
      state.dirty = false;
      return fetchState().then(function () {
        showToast(resultMessage(result, "文章已删除"), "success");
        if (state.articles.length) {
          return openArticle(state.articles[0].slug, true);
        }
        showEmptyState();
      });
    }).catch(function (error) {
      showToast(error.message, "error");
    }).finally(function () {
      els.deleteArticleBtn.disabled = false;
    });
  }

  function deleteTopic(topicId, trigger) {
    var topic = state.topics.filter(function (item) {
      return item.id === topicId;
    })[0];
    if (!topic || state.saving) {
      return;
    }
    if (!window.confirm("确定删除主题「" + topic.name + "」吗？\n\n只有空主题可以删除，此操作不可撤销。")) {
      return;
    }
    if (trigger) {
      trigger.disabled = true;
    }
    request("/api/topics/" + encodeURIComponent(topicId), {
      method: "DELETE"
    }).then(function (result) {
      return fetchState().then(function () {
        showToast(result.message || "主题已删除", "success");
        if (!state.topics.length) {
          showEmptyState();
        }
      });
    }).catch(function (error) {
      showToast(error.message, "error");
    }).finally(function () {
      if (trigger) {
        trigger.disabled = false;
      }
    });
  }

  function schedulePreview() {
    window.clearTimeout(state.previewTimer);
    state.previewTimer = window.setTimeout(refreshPreview, 450);
  }

  function refreshPreview() {
    if (els.form.hidden) {
      return;
    }
    var body = els.body.value;
    if (!body.trim()) {
      els.previewBody.innerHTML = '<p class="preview-placeholder">正文为空，开始输入后会显示预览。</p>';
      els.previewStatus.textContent = "无内容";
      return;
    }

    if (state.previewController) {
      state.previewController.abort();
    }
    state.previewController = new AbortController();
    els.previewStatus.textContent = "渲染中…";

    var payload = {
      body: body,
      slug: state.currentSlug || undefined,
      topicId: els.topic.value || undefined
    };
    request("/api/preview", {
      method: "POST",
      body: JSON.stringify(payload),
      signal: state.previewController.signal
    }).then(function (result) {
      els.previewBody.innerHTML = result.html || '<p class="preview-placeholder">预览为空。</p>';
      els.previewStatus.textContent = "刚刚更新";
    }).catch(function (error) {
      if (error.name === "AbortError") {
        return;
      }
      els.previewBody.innerHTML = "";
      var message = document.createElement("p");
      message.className = "preview-error";
      message.textContent = "预览失败：" + error.message;
      els.previewBody.appendChild(message);
      els.previewStatus.textContent = "预览失败";
    });
  }

  function populateTopicParents(selectedId) {
    els.topicParent.innerHTML = '<option value="">作为顶级主题</option>';
    orderedTopicEntries().forEach(function (entry) {
      var option = document.createElement("option");
      option.value = entry.topic.id;
      option.textContent = topicOptionLabel(entry);
      els.topicParent.appendChild(option);
    });
    els.topicParent.value = selectedId || "";
  }

  function updateTopicDialogMode() {
    els.topicDialogTitle.textContent = els.topicParent.value ? "创建下级主题" : "创建主题";
  }

  function openTopicDialog(parentId) {
    els.topicForm.reset();
    populateTopicParents(typeof parentId === "string" ? parentId : "");
    updateTopicDialogMode();
    setTopicAlert("");
    els.topicDialog.showModal();
    window.setTimeout(function () {
      els.topicId.focus();
    }, 30);
  }

  function closeTopicDialog() {
    els.topicDialog.close();
  }

  function createTopic(event) {
    event.preventDefault();
    var payload = {
      id: els.topicId.value.trim(),
      name: els.topicName.value.trim(),
      description: els.topicDescription.value.trim(),
      parentId: els.topicParent.value || null
    };
    if (!payload.id || !/^[a-z0-9][a-z0-9-]{0,63}$/.test(payload.id)) {
      setTopicAlert("主题 ID 只能包含小写字母、数字和连字符");
      return;
    }
    if (!payload.name) {
      setTopicAlert("请填写主题名称");
      return;
    }
    if (!payload.description) {
      setTopicAlert("请填写主题说明");
      return;
    }
    els.createTopicBtn.disabled = true;
    setTopicAlert("");
    jsonRequest("POST", "/api/topics", payload).then(function (result) {
      closeTopicDialog();
      return fetchState().then(function () {
        showToast(result.message || "主题已创建", "success");
      });
    }).catch(function (error) {
      setTopicAlert(error.message);
      showToast(error.message, "error");
    }).finally(function () {
      els.createTopicBtn.disabled = false;
    });
  }

  function setTitleAlert(message) {
    els.titleAlert.textContent = message || "";
    els.titleAlert.hidden = !message;
  }

  function updateTitleTotal() {
    var rows = Array.prototype.slice.call(els.titleEditorList.querySelectorAll(".title-editor-row"));
    var weights = rows.map(function (row) {
      return Number(row.querySelector(".title-weight-input").value);
    });
    var total = weights.reduce(function (sum, weight) {
      return sum + (Number.isFinite(weight) && weight > 0 ? weight : 0);
    }, 0);
    rows.forEach(function (row, index) {
      var probability = row.querySelector(".title-editor-prob");
      if (total > 0 && Number.isFinite(weights[index]) && weights[index] > 0) {
        probability.textContent = (weights[index] / total * 100).toFixed(1) + "%";
      } else {
        probability.textContent = "—";
      }
    });
    els.titleTotal.textContent = "总权重 " + (total > 0 ? total.toFixed(1) : "0");
  }

  function currentEditorTitle() {
    if (activeEditorTitle && activeEditorTitle.isConnected) {
      return activeEditorTitle;
    }
    var focused = document.activeElement;
    if (focused && focused.classList && focused.classList.contains("title-text-input")) {
      activeEditorTitle = focused;
      return focused;
    }
    return null;
  }

  function saveEditorTitleSelection() {
    var editor = currentEditorTitle();
    var selection = window.getSelection();
    if (!editor || !selection || !selection.rangeCount) {
      return;
    }
    var range = selection.getRangeAt(0);
    if (editor.contains(range.commonAncestorContainer)) {
      savedEditorTitleRange = range.cloneRange();
    }
  }

  function restoreEditorTitleRange() {
    if (!activeEditorTitle || !savedEditorTitleRange) {
      return;
    }
    if (!activeEditorTitle.contains(savedEditorTitleRange.commonAncestorContainer)) {
      return;
    }
    var selection = window.getSelection();
    selection.removeAllRanges();
    selection.addRange(savedEditorTitleRange);
  }

  function applyEditorTitleFormat(command, value) {
    activeEditorTitle = currentEditorTitle();
    if (!activeEditorTitle || !activeEditorTitle.isConnected) {
      setTitleAlert("请先点击一条标题，再选择要修改的文字");
      return;
    }
    activeEditorTitle.focus();
    restoreEditorTitleRange();
    document.execCommand("styleWithCSS", false, true);
    document.execCommand(command, false, value || null);
    saveEditorTitleSelection();
  }

  function applyEditorTitleFontSize(value) {
    activeEditorTitle = currentEditorTitle();
    var size = Number(value);
    if (!activeEditorTitle || !activeEditorTitle.isConnected) {
      setTitleAlert("请先点击一条标题，再选择要修改的文字");
      return;
    }
    if (!Number.isFinite(size) || size < 8 || size > 80) {
      setTitleAlert("单字字号必须在 8–80px 之间");
      return;
    }
    activeEditorTitle.focus();
    restoreEditorTitleRange();
    var selection = window.getSelection();
    if (!selection || !selection.rangeCount) {
      setTitleAlert("请先选中要修改字号的文字");
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
      savedEditorTitleRange = range.cloneRange();
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
    savedEditorTitleRange = range.cloneRange();
  }

  function createTitleRow(item) {
    var row = document.createElement("div");
    row.className = "title-editor-row";

    var text = document.createElement("div");
    text.className = "title-rich title-text-input";
    text.contentEditable = "true";
    text.spellcheck = false;
    text.style.fontSize = editorTitleBaseFontSize + "px";
    text.setAttribute("role", "textbox");
    text.setAttribute("aria-label", "标题内容");
    text.setAttribute("data-placeholder", "标题内容");
    window.HappyDaysTitleFormat.render(text, item || { text: "" });
    text.addEventListener("focus", function () {
      activeEditorTitle = text;
    });
    text.addEventListener("mousedown", function () {
      activeEditorTitle = text;
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
    text.addEventListener("input", updateTitleTotal);

    var weight = document.createElement("input");
    weight.type = "number";
    weight.className = "title-weight-input";
    weight.min = "0.1";
    weight.max = "1000000";
    weight.step = "0.1";
    weight.value = item && item.weight ? item.weight : 1;
    weight.setAttribute("aria-label", "标题权重");

    var probability = document.createElement("span");
    probability.className = "title-editor-prob";
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
      moveTitleRow(row, -1);
    });
    var down = document.createElement("button");
    down.type = "button";
    down.className = "title-move-button";
    down.textContent = "↓";
    down.title = "下移标题";
    down.setAttribute("aria-label", "下移标题");
    down.addEventListener("click", function () {
      moveTitleRow(row, 1);
    });
    move.appendChild(up);
    move.appendChild(down);

    var remove = document.createElement("button");
    remove.type = "button";
    remove.className = "title-remove";
    remove.title = "删除这条标题";
    remove.setAttribute("aria-label", "删除标题");
    remove.innerHTML = '<svg class="icon" aria-hidden="true"><use href="#i-trash"></use></svg>';

    weight.addEventListener("input", updateTitleTotal);
    remove.addEventListener("click", function () {
      var rows = els.titleEditorList.querySelectorAll(".title-editor-row");
      if (rows.length <= 1) {
        setTitleAlert("至少保留一条标题");
        return;
      }
      if (activeEditorTitle === text) {
        activeEditorTitle = null;
      }
      row.remove();
      updateTitleTotal();
      updateTitleMoveButtons();
    });

    row.appendChild(text);
    row.appendChild(weight);
    row.appendChild(probability);
    row.appendChild(move);
    row.appendChild(remove);
    els.titleEditorList.appendChild(row);
    updateTitleMoveButtons();
    return row;
  }

  function updateTitleMoveButtons() {
    var rows = Array.prototype.slice.call(els.titleEditorList.querySelectorAll(".title-editor-row"));
    rows.forEach(function (row, index) {
      var buttons = row.querySelectorAll(".title-move-button");
      if (buttons.length === 2) {
        buttons[0].disabled = index === 0;
        buttons[1].disabled = index === rows.length - 1;
      }
    });
  }

  function moveTitleRow(row, direction) {
    var sibling = direction < 0 ? row.previousElementSibling : row.nextElementSibling;
    if (!sibling) {
      return;
    }
    if (direction < 0) {
      els.titleEditorList.insertBefore(row, sibling);
    } else {
      els.titleEditorList.insertBefore(sibling, row);
    }
    updateTitleMoveButtons();
    updateTitleTotal();
  }

  function renderTitleRows(titles) {
    els.titleEditorList.innerHTML = "";
    var items = Array.isArray(titles) && titles.length
      ? titles
      : [{ text: "HappyDays 非官方文档", weight: 1 }];
    items.forEach(function (item) {
      createTitleRow({
        text: typeof item.text === "string" ? item.text : "",
        runs: item.runs,
        weight: Number(item.weight) > 0 ? Number(item.weight) : 1
      });
    });
    updateTitleTotal();
  }

  function openTitleDialog() {
    setTitleAlert("");
    els.saveTitlesBtn.disabled = true;
    request("/api/titles").then(function (data) {
      var fontSize = Number(data && data.fontSize);
      var interval = Number(data && data.intervalSeconds);
      if (!Number.isFinite(fontSize)) {
        fontSize = 18.5;
      }
      fontSize = Math.max(8, Math.min(40, fontSize));
      editorTitleBaseFontSize = fontSize;
      renderTitleRows(data && data.titles);
      els.titleInterval.value = Number.isFinite(interval) && interval >= 3 ? interval : 10;
      els.editorTitleSize.value = String(editorTitleBaseFontSize);
      els.saveTitlesBtn.disabled = false;
      els.titleDialog.showModal();
      window.setTimeout(function () {
        var first = els.titleEditorList.querySelector(".title-text-input");
        if (first) {
          activeEditorTitle = first;
          first.focus();
        }
      }, 30);
    }).catch(function (error) {
      showToast(error.message, "error");
      els.saveTitlesBtn.disabled = false;
    });
  }

  function closeTitleDialog() {
    activeEditorTitle = null;
    savedEditorTitleRange = null;
    els.titleDialog.close();
  }

  function collectTitleRows() {
    var rows = Array.prototype.slice.call(els.titleEditorList.querySelectorAll(".title-editor-row"));
    var titles = [];
    rows.forEach(function (row) {
      var editor = row.querySelector(".title-text-input");
      var text = editor.textContent.replace(/\u200b/g, "");
      var weight = Number(row.querySelector(".title-weight-input").value);
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
    return titles;
  }

  function saveTitles(event) {
    event.preventDefault();
    var titles;
    try {
      titles = collectTitleRows();
    } catch (error) {
      setTitleAlert(error.message);
      return;
    }
    var fontSize = editorTitleBaseFontSize;
    var intervalSeconds = Number(els.titleInterval.value);
    if (!Number.isFinite(fontSize) || fontSize < 8 || fontSize > 40) {
      setTitleAlert("字号必须在 8 到 40 之间");
      return;
    }
    if (!Number.isFinite(intervalSeconds) || intervalSeconds < 3 || intervalSeconds > 3600) {
      setTitleAlert("轮换间隔必须在 3 到 3600 秒之间");
      return;
    }
    var author = els.author.value.trim() || "HappyDays 团队";
    els.saveTitlesBtn.disabled = true;
    setTitleAlert("");
    jsonRequest("PUT", "/api/titles", {
      titles: titles,
      fontSize: fontSize,
      intervalSeconds: intervalSeconds,
      author: author
    }).then(function (result) {
      closeTitleDialog();
      showToast(resultMessage(result, "页眉标题已保存"), "success");
    }).catch(function (error) {
      setTitleAlert(error.message);
      showToast(error.message, "error");
    }).finally(function () {
      els.saveTitlesBtn.disabled = false;
    });
  }

  function bindEvents() {
    els.topicList.addEventListener("click", function (event) {
      var deleteButton = event.target.closest(".topic-delete");
      if (deleteButton) {
        deleteTopic(deleteButton.dataset.topicId, deleteButton);
        return;
      }
      var addChild = event.target.closest(".topic-add-child");
      if (addChild) {
        openTopicDialog(addChild.dataset.parentId);
        return;
      }
      var button = event.target.closest(".topic-article");
      if (button) {
        openArticle(button.dataset.slug, false);
      }
    });

    els.newArticleBtn.addEventListener("click", function () {
      startNewArticle();
    });
    els.newTopicBtn.addEventListener("click", function () {
      openTopicDialog();
    });
    els.editTitlesBtn.addEventListener("click", openTitleDialog);
    els.addTitleItem.addEventListener("click", function () {
      var rows = els.titleEditorList.querySelectorAll(".title-editor-row");
      if (rows.length >= 30) {
        setTitleAlert("标题最多 30 条");
        return;
      }
      setTitleAlert("");
      var row = createTitleRow({ text: "", weight: 1 });
      updateTitleTotal();
      row.querySelector(".title-text-input").focus();
    });
    els.titleForm.addEventListener("submit", saveTitles);
    els.closeTitleDialog.addEventListener("click", closeTitleDialog);
    els.cancelTitle.addEventListener("click", closeTitleDialog);
    document.addEventListener("selectionchange", saveEditorTitleSelection);
    els.editorTitleToolbar.addEventListener("mousedown", function (event) {
      saveEditorTitleSelection();
      if (event.target.closest(".title-format-button")) {
        event.preventDefault();
      }
    });
    els.editorTitleToolbar.addEventListener("click", function (event) {
      var button = event.target.closest(".title-format-button");
      if (!button) {
        return;
      }
      var command = button.dataset.format;
      applyEditorTitleFormat(command === "strike" ? "strikeThrough" : command);
    });
    els.editorTitleColor.addEventListener("mousedown", saveEditorTitleSelection);
    els.editorTitleColor.addEventListener("input", function () {
      applyEditorTitleFormat("foreColor", els.editorTitleColor.value);
    });
    els.editorTitleSize.addEventListener("mousedown", saveEditorTitleSelection);
    els.editorTitleSize.addEventListener("change", function () {
      applyEditorTitleFontSize(els.editorTitleSize.value);
    });
    els.importArticleBtn.addEventListener("click", function () {
      els.importFileInput.click();
    });
    els.importFileInput.addEventListener("change", function () {
      var file = els.importFileInput.files && els.importFileInput.files[0];
      els.importFileInput.value = "";
      if (file) {
        importMarkdownFile(file);
      }
    });
    els.deleteArticleBtn.addEventListener("click", deleteCurrentArticle);
    els.moveArticleUp.addEventListener("click", function () {
      moveArticle("up");
    });
    els.moveArticleDown.addEventListener("click", function () {
      moveArticle("down");
    });
    els.retryConnection.addEventListener("click", function () {
      boot();
    });
    els.topicParent.addEventListener("change", updateTopicDialogMode);

    els.form.addEventListener("submit", saveArticle);
    els.form.addEventListener("input", function (event) {
      if (state.loading) {
        return;
      }
      state.dirty = true;
      if (event.target === els.title) {
        updateHeadingFromTitle();
      }
      if (event.target === els.author) {
        rememberAuthor(els.author.value.trim());
      }
      if (event.target === els.body) {
        schedulePreview();
      }
    });
    els.form.addEventListener("change", function (event) {
      if (!state.loading) {
        state.dirty = true;
      }
    });
    els.historyBtn.addEventListener("click", openHistory);
    els.historyClose.addEventListener("click", closeHistory);
    els.historyDialog.addEventListener("click", function (event) {
      if (event.target === els.historyDialog) {
        closeHistory();
      }
    });
    els.historyLoad.addEventListener("click", loadHistoryIntoEditor);
    els.historySetCutoff.addEventListener("click", function () {
      if (historyState.selectedHash) {
        updateHistoryCutoff(historyState.selectedHash);
      }
    });
    els.historyClearCutoff.addEventListener("click", function () {
      updateHistoryCutoff(null);
    });
    els.previewBtn.addEventListener("click", refreshPreview);

    els.previewBody.addEventListener("click", function (event) {
      var link = event.target.closest('a[href^="#/doc/"]');
      if (!link) {
        return;
      }
      event.preventDefault();
      var slug = link.getAttribute("href").replace("#/doc/", "");
      openArticle(slug, false);
    });

    els.topicForm.addEventListener("submit", createTopic);
    els.closeTopicDialog.addEventListener("click", closeTopicDialog);
    els.cancelTopic.addEventListener("click", closeTopicDialog);
    els.topicDialog.addEventListener("click", function (event) {
      if (event.target === els.topicDialog) {
        closeTopicDialog();
      }
    });

    document.addEventListener("keydown", function (event) {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "s") {
        if (!els.form.hidden && !els.topicDialog.open) {
          event.preventDefault();
          els.form.requestSubmit();
        }
      }
    });

    window.addEventListener("beforeunload", function (event) {
      if (state.dirty) {
        event.preventDefault();
        event.returnValue = "";
      }
    });
  }

  function boot() {
    setConnection("idle", "连接中…");
    els.newArticleBtn.disabled = true;
    els.newTopicBtn.disabled = true;
    els.importArticleBtn.disabled = true;
    setFormAlert("");
    fetchState().then(function () {
      var rawHash = decodeURIComponent(window.location.hash.replace(/^#/, ""));
      var slug = rawHash.replace(/^\/?doc\//, "");
      var article = state.articles.filter(function (item) {
        return item.slug === slug;
      })[0];
      if (article) {
        return openArticle(article.slug, true);
      }
      if (state.articles.length) {
        return openArticle(state.articles[0].slug, true);
      }
      showEmptyState();
      return null;
    }).catch(function (error) {
      showOffline();
      showToast(error.message, "error");
    });
  }

  bindEvents();
  boot();
})();
