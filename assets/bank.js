(function () {
  "use strict";

  var data = window.HAPPYDAYS_WIKI;
  var titleEl = document.getElementById("bankTitle");
  var descriptionEl = document.getElementById("bankDescription");
  var breadcrumbEl = document.getElementById("bankBreadcrumb");
  var sectionsEl = document.getElementById("bankSections");

  if (!data || !titleEl || !sectionsEl) {
    return;
  }

  var categories = (data.categories || []).slice().sort(function (left, right) {
    return (left.order || 0) - (right.order || 0);
  });
  var byId = {};
  categories.forEach(function (topic) {
    byId[topic.id] = topic;
  });

  function pathTopicId() {
    var match = window.location.pathname.match(/\/bank\/([a-z0-9-]+)\/?$/i);
    return match ? match[1].toLowerCase() : "";
  }

  function docsFor(topic) {
    return (topic.docs || []).map(function (slug) {
      return data.docs[slug] ? Object.assign({ slug: slug }, data.docs[slug]) : null;
    }).filter(Boolean);
  }

  function childrenOf(topic) {
    return categories.filter(function (child) {
      return child.parentId === topic.id;
    });
  }

  function articleCard(doc) {
    var wrapper = document.createElement("div");
    wrapper.className = "bank-card";
    var link = document.createElement("a");
    link.className = "card";
    var single = true;

    function applyMode() {
      link.href = "/wiki/#/doc/" + encodeURIComponent(doc.slug) + (single ? "#single" : "");
      toggle.textContent = single ? "显示目录" : "隐藏目录";
      toggle.title = single ? "打开时显示左侧目录" : "打开时隐藏左侧目录";
      toggle.setAttribute("aria-label", toggle.title);
    }

    var media = document.createElement("div");
    media.className = "card-media";
    var image = document.createElement("img");
    image.className = "card-cover";
    image.loading = "lazy";
    image.alt = "";
    image.src = doc.icon || "/icon.png";
    image.onerror = function () {
      image.onerror = null;
      image.src = "/icon.png";
    };
    media.appendChild(image);

    var body = document.createElement("div");
    body.className = "card-body";
    var title = document.createElement("h3");
    title.textContent = doc.title;
    var meta = document.createElement("p");
    meta.className = "meta";
    meta.textContent = doc.excerpt || "";
    body.appendChild(title);
    body.appendChild(meta);
    link.appendChild(media);
    link.appendChild(body);

    var toggle = document.createElement("button");
    toggle.type = "button";
    toggle.className = "bank-card-toggle";
    toggle.addEventListener("click", function () {
      single = !single;
      applyMode();
    });
    applyMode();

    wrapper.appendChild(link);
    wrapper.appendChild(toggle);
    return wrapper;
  }

  function section(topic, showMore) {
    var sectionEl = document.createElement("section");
    sectionEl.className = "section";
    var header = document.createElement("div");
    header.className = "section-header";
    var title = document.createElement("h2");
    title.className = "section-title";
    title.textContent = topic.name;
    header.appendChild(title);
    if (showMore) {
      var more = document.createElement("a");
      more.className = "section-more";
      more.href = "/bank/" + encodeURIComponent(topic.id);
      more.textContent = "查看更多 →";
      header.appendChild(more);
    }
    sectionEl.appendChild(header);
    var docs = docsFor(topic);
    if (docs.length) {
      var grid = document.createElement("div");
      grid.className = "card-grid";
      docs.slice(0, 3).forEach(function (doc) {
        grid.appendChild(articleCard(doc));
      });
      sectionEl.appendChild(grid);
    }
    return sectionEl;
  }

  function renderBreadcrumb(topic) {
    breadcrumbEl.innerHTML = "";
    var home = document.createElement("a");
    home.href = "/home";
    home.textContent = "HappyDays非官方文档";
    breadcrumbEl.appendChild(home);
    var ancestors = [];
    var current = topic;
    while (current && current.parentId) {
      current = byId[current.parentId];
      if (!current) {
        break;
      }
      ancestors.unshift(current);
    }
    ancestors.forEach(function (ancestor) {
      var separator = document.createElement("span");
      separator.textContent = "/";
      breadcrumbEl.appendChild(separator);
      var link = document.createElement("a");
      link.href = "/bank/" + encodeURIComponent(ancestor.id);
      link.textContent = ancestor.name;
      breadcrumbEl.appendChild(link);
    });
    var separator = document.createElement("span");
    separator.textContent = "/";
    breadcrumbEl.appendChild(separator);
    var currentLabel = document.createElement("span");
    currentLabel.textContent = topic.name;
    breadcrumbEl.appendChild(currentLabel);
  }

  var topicId = pathTopicId();
  var topic = byId[topicId];
  if (!topic) {
    titleEl.textContent = "目录不存在";
    descriptionEl.textContent = "没有找到对应的 Bank 目录。";
    var back = document.createElement("p");
    back.className = "bank-empty";
    back.innerHTML = '<a href="/home">返回首页</a>';
    sectionsEl.appendChild(back);
    return;
  }

  document.title = topic.name + " · Bank · HappyDays轨道交通服务器";
  titleEl.textContent = topic.name;
  descriptionEl.textContent = topic.description || "";
  document.querySelectorAll(".nav-links a").forEach(function (link) {
    link.classList.toggle("active", link.getAttribute("href") === "/bank/" + topic.id);
  });
  renderBreadcrumb(topic);

  var directDocs = docsFor(topic);
  if (directDocs.length) {
    var directSection = document.createElement("section");
    directSection.className = "section";
    var directHeader = document.createElement("div");
    directHeader.className = "section-header";
    var directTitle = document.createElement("h2");
    directTitle.className = "section-title";
    directTitle.textContent = "文章";
    directHeader.appendChild(directTitle);
    directSection.appendChild(directHeader);
    var directGrid = document.createElement("div");
    directGrid.className = "card-grid";
    directDocs.forEach(function (doc) {
      directGrid.appendChild(articleCard(doc));
    });
    directSection.appendChild(directGrid);
    sectionsEl.appendChild(directSection);
  }

  var children = childrenOf(topic);
  children.forEach(function (child) {
    var childDocs = docsFor(child);
    var grandchildren = childrenOf(child);
    sectionsEl.appendChild(section(child, childDocs.length > 3 || grandchildren.length > 0));
  });

  if (!directDocs.length && !children.length) {
    var empty = document.createElement("p");
    empty.className = "bank-empty";
    empty.textContent = "此目录下暂无文章。";
    sectionsEl.appendChild(empty);
  }
})();
