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
    title: document.getElementById("fieldTitle"),
    topic: document.getElementById("fieldTopic"),
    topicHint: document.getElementById("topicHint"),
    emoji: document.getElementById("fieldEmoji"),
    slug: document.getElementById("fieldSlug"),
    updated: document.getElementById("fieldUpdated"),
    reading: document.getElementById("fieldReading"),
    tags: document.getElementById("fieldTags"),
    description: document.getElementById("fieldDescription"),
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
      return total + state.articles.filter(function (article) {
        return article.topic === child.id;
      }).length;
    }, 0);
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
    topTopics().forEach(function (topic) {
      var option = document.createElement("option");
      option.value = topic.id;
      option.textContent = topic.name;
      option.selected = topic.id === selectedId;
      els.topic.appendChild(option);
      childTopics(topic.id).forEach(function (child) {
        var childOption = document.createElement("option");
        childOption.value = child.id;
        childOption.textContent = "　↳ " + child.name;
        childOption.selected = child.id === selectedId;
        els.topic.appendChild(childOption);
      });
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
      var children = childTopics(topic.id);
      var articles = state.articles.filter(function (article) {
        return article.topic === topic.id;
      });
      var group = document.createElement("section");
      group.className = "topic-group";

      var head = document.createElement("div");
      head.className = "topic-group-head";
      var name = document.createElement("span");
      name.className = "topic-group-name";
      name.textContent = topic.name;
      name.title = topic.name;
      var count = document.createElement("span");
      count.className = "topic-group-count";
      count.textContent = subtreeArticleCount(topic);
      var addChild = document.createElement("button");
      addChild.type = "button";
      addChild.className = "topic-add-child";
      addChild.dataset.parentId = topic.id;
      addChild.title = "添加二级主题";
      addChild.setAttribute("aria-label", "在「" + topic.name + "」下添加二级主题");
      addChild.textContent = "+";
      head.appendChild(name);
      head.appendChild(count);
      head.appendChild(addChild);

      group.appendChild(head);
      if (articles.length) {
        group.appendChild(renderTopicArticles(articles, ""));
      }
      children.forEach(function (child) {
        var childGroup = document.createElement("section");
        childGroup.className = "topic-subgroup";
        var childHead = document.createElement("div");
        childHead.className = "topic-subgroup-head";
        var childName = document.createElement("span");
        childName.className = "topic-subgroup-name";
        childName.textContent = child.name;
        childName.title = child.name;
        var childCount = document.createElement("span");
        childCount.className = "topic-subgroup-count";
        childCount.textContent = state.articles.filter(function (article) {
          return article.topic === child.id;
        }).length;
        childHead.appendChild(childName);
        childHead.appendChild(childCount);
        childGroup.appendChild(childHead);
        childGroup.appendChild(renderTopicArticles(
          state.articles.filter(function (article) {
            return article.topic === child.id;
          }),
          "暂无文章"
        ));
        group.appendChild(childGroup);
      });
      if (!articles.length && !children.length) {
        group.appendChild(renderTopicArticles([], "暂无文章"));
      }
      els.topicList.appendChild(group);
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
    els.saveLabel.textContent = busy
      ? "保存中…"
      : (state.mode === "new" ? "创建并构建" : "保存并构建");
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
  }

  function updateHeadingFromTitle() {
    els.formHeading.textContent = els.title.value.trim() || "未命名文章";
    document.title = (els.title.value.trim() || "新建文章") + " · 内容管理";
  }

  function fillForm(article) {
    state.loading = true;
    state.mode = "edit";
    state.currentSlug = article.slug;
    state.currentArticle = article;
    state.dirty = false;

    currentTopicOptions(article.topic);
    els.topic.value = article.topic;
    els.topic.disabled = true;
    els.topicHint.textContent = "主题创建后不能在这里更换";

    els.title.value = article.title || "";
    els.description.value = article.description || "";
    els.emoji.value = article.emoji || "📄";
    els.updated.value = article.updated || localToday();
    els.reading.value = article.readingTime || 5;
    els.tags.value = (article.tags || []).join(", ");
    els.slug.value = article.slug;
    els.slug.readOnly = true;
    els.body.value = article.body || "";

    els.formMode.textContent = "编辑文章 · #" + article.order;
    updateHeadingFromTitle();
    setFormAlert("");
    showEditor();
    setBusy(false);
    setActiveArticle();
    history.replaceState(null, "", "#" + encodeURIComponent(article.slug));
    els.previewStatus.textContent = "等待预览";
    state.loading = false;
    refreshPreview();
  }

  function startNewArticle(topicId) {
    if (!confirmDiscard()) {
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

    els.formMode.textContent = "新建文章";
    els.formHeading.textContent = "新建文章";
    document.title = "新建文章 · 内容管理";
    setFormAlert("");
    showEditor();
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
    var readingTime = Number(els.reading.value);
    var updated = els.updated.value;

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
    if (state.mode === "new") {
      if (!slug) {
        throw new Error("请填写 slug");
      }
      if (!/^[a-z0-9][a-z0-9-]{0,63}$/.test(slug)) {
        throw new Error("slug 只能包含小写字母、数字和连字符");
      }
      if (!els.topic.value) {
        throw new Error("请选择主题");
      }
    }

    var payload = {
      title: title,
      description: description,
      emoji: els.emoji.value.trim(),
      updated: updated,
      readingTime: readingTime,
      tags: splitTags(els.tags.value),
      body: body
    };
    if (state.mode === "new") {
      payload.slug = slug;
      payload.topicId = els.topic.value;
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
            showToast(result.message || "已保存并重新构建", "success");
          });
        }
        showToast(result.message || "已保存并重新构建", "success");
      });
    }).catch(function (error) {
      setFormAlert(error.message);
      showToast(error.message, "error");
    }).finally(function () {
      setBusy(false);
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
    topTopics().forEach(function (topic) {
      var option = document.createElement("option");
      option.value = topic.id;
      option.textContent = topic.name;
      els.topicParent.appendChild(option);
    });
    els.topicParent.value = selectedId || "";
  }

  function updateTopicDialogMode() {
    els.topicDialogTitle.textContent = els.topicParent.value ? "创建二级主题" : "创建主题";
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
      els.emptyTitle.textContent = "还没有文章";
      els.emptyDescription.textContent = state.topics.length
        ? "选择左侧主题下的文章，或点击「新建文章」开始写作。"
        : "先在左侧点击「添加主题」，再创建第一篇文章。";
      els.emptyState.hidden = false;
      els.form.hidden = true;
      els.offlineState.hidden = true;
      return null;
    }).catch(function (error) {
      showOffline();
      showToast(error.message, "error");
    });
  }

  bindEvents();
  boot();
})();
