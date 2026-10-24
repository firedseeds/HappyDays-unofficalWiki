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
    saveBtn: document.getElementById("saveBtn"),
    saveLabel: document.getElementById("saveLabel"),
    deleteArticleBtn: document.getElementById("deleteArticleBtn"),
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

  var AUTHOR_KEY = "happydays-editor-author";

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
