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
    readingProgress: document.getElementById("readingProgress"),
    readingPercent: document.getElementById("readingPercent"),
    backToTop: document.getElementById("backToTop"),
    editBtn: document.getElementById("editBtn"),
    shareBtn: document.getElementById("shareBtn"),
    themeBtn: document.getElementById("themeBtn"),
    moreBtn: document.getElementById("moreBtn"),
    moreMenu: document.getElementById("moreMenu"),
    wideState: document.getElementById("wideState"),
    searchOverlay: document.getElementById("searchOverlay"),
    searchInput: document.getElementById("searchInput"),
    searchResults: document.getElementById("searchResults"),
    toastRegion: document.getElementById("toastRegion"),
    pageAnnouncement: document.getElementById("pageAnnouncement"),
    mainContent: document.getElementById("mainContent")
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
    if (category && category.parentId) {
      var parent = CATEGORY_BY_ID[category.parentId];
      if (parent) {
        return parent.name + " / " + category.name;
      }
    }
    return category ? category.name : "未分类";
  }

  function subtreeDocCount(category) {
    return category.docs.length + childCategories(category.id).reduce(function (total, child) {
      return total + child.docs.length;
    }, 0);
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
    copyText(window.location.href).then(function (success) {
      if (success) {
        showToast("页面链接已复制");
      } else {
        window.prompt("复制页面链接", window.location.href);
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

  function renderCategory(category, isChild) {
    var isCollapsed = collapsedCategories.has(category.id);
    var docItems = renderDocItems(category);
    var children = childCategories(category.id);
    var count = isChild ? category.docs.length : subtreeDocCount(category);
    var toggleId = "tree-" + (isChild ? "list-" : "body-") + category.id;
    var className = "tree-group" + (isChild ? " tree-group--child" : "") +
      (isCollapsed ? " is-collapsed" : "");

    if (isChild) {
      return '<div class="' + className + '" data-category="' + category.id + '">' +
        '<button class="tree-group-head tree-group-head--child" type="button" data-category-toggle="' + category.id +
        '" aria-expanded="' + (!isCollapsed) + '" aria-controls="' + toggleId + '">' +
        icon("chevron-down", "tree-chevron") +
        '<span class="tree-group-label">' + escapeHTML(category.name) + "</span>" +
        '<span class="tree-group-count">' + count + "</span>" +
        "</button>" +
        '<ul class="tree-list tree-list--nested" id="' + toggleId + '">' + docItems + "</ul>" +
        "</div>";
    }

    return '<div class="' + className + '" data-category="' + category.id + '">' +
      '<button class="tree-group-head" type="button" data-category-toggle="' + category.id +
      '" aria-expanded="' + (!isCollapsed) + '" aria-controls="' + toggleId + '">' +
      icon("chevron-down", "tree-chevron") +
      '<span class="tree-group-label">' + escapeHTML(category.name) + "</span>" +
      '<span class="tree-group-count">' + count + "</span>" +
      "</button>" +
      '<div class="tree-group-body" id="' + toggleId + '">' +
      '<ul class="tree-list">' + docItems + "</ul>" +
      children.map(function (child) {
        return renderCategory(child, true);
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
      return renderCategory(category, false);
    }).join("");

    setActiveTree();
  }

  function setActiveTree() {
    if (!els.docTree || !state.currentId) {
      return;
    }

    var current = docs[state.currentId];
    var currentCategory = CATEGORY_BY_ID[current.category];
    var categoryIds = [];
    if (currentCategory && currentCategory.parentId) {
      categoryIds.push(currentCategory.parentId);
    }
    if (currentCategory) {
      categoryIds.push(currentCategory.id);
    }

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

  function renderDocument(id, initial) {
    var doc = docs[id];
    if (!doc) {
      return;
    }

    document.body.classList.remove("is-empty-library");
    var category = categoryFor(id);
    var previousId = state.currentId;
    var shouldMoveFocus = !initial && previousId !== null;
    state.currentId = id;
    state.activeHeading = "";

    document.title = doc.title + " · HappyDays非官方文档";
    els.crumbCategory.textContent = categoryLabel(category);
    els.crumbTitle.textContent = doc.title;
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

    els.crumbCategory.textContent = "知识库";
    els.crumbTitle.textContent = "等待迁移";
    els.docCategory.textContent = "准备中";
    els.docEmoji.textContent = "🌱";
    els.docTitle.textContent = "知识库正在准备中";
    els.docExcerpt.textContent = "所有文章与主题已清空。创建第一个主题，或迁移新的文档。";
    els.docUpdated.textContent = "等待内容";
    els.docReading.textContent = "0 篇文章";
    els.docTags.innerHTML = "";
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
        var base = window.location.href.split("#")[0];
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

    fetch("api/health", { cache: "no-store" }).then(function (response) {
      return response.ok ? response.json() : null;
    }).then(function (data) {
      if (data && data.ok) {
        els.editBtn.hidden = false;
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
