(function () {
  "use strict";

  var els = {
    hero: document.querySelector(".hero"),
    image: document.getElementById("homeHeroImage"),
    imageNext: document.getElementById("homeHeroImageNext"),
    placeholder: document.getElementById("homeHeroPlaceholder"),
    edit: document.getElementById("homeImageEdit"),
    dialog: document.getElementById("homeImageDialog"),
    form: document.getElementById("homeImageForm"),
    interval: document.getElementById("homeImageInterval"),
    list: document.getElementById("homeImageList"),
    file: document.getElementById("homeImageFile"),
    uploadWeight: document.getElementById("homeImageUploadWeight"),
    upload: document.getElementById("homeImageUpload"),
    status: document.getElementById("homeImageStatus"),
    submit: document.getElementById("homeImageSubmit"),
    cancel: document.getElementById("homeImageCancel"),
    cancelX: document.getElementById("homeImageCancelX")
  };

  if (!els.hero || !els.image || !els.dialog) {
    return;
  }

  var state = {
    config: { intervalSeconds: 5, images: [] },
    current: null,
    timer: null,
    backend: false,
    imageToken: 0,
    activeLayer: "primary",
    imageSize: null,
    heroWidth: 0,
    heroHeight: 0,
    viewportHeight: 0,
    heroLocked: false
  };

  function normalizeConfig(raw) {
    var data = raw && raw.config ? raw.config : raw;
    var images = Array.isArray(data && data.images) ? data.images : [];
    var normalizedImages = images.map(function (item) {
      if (!item || typeof item.file !== "string" || !item.file) {
        return null;
      }
      var weight = Number(item.weight);
      if (!Number.isFinite(weight) || weight <= 0) {
        return null;
      }
      return { file: item.file, weight: weight };
    }).filter(Boolean);
    var interval = Number(data && data.intervalSeconds);
    if (!Number.isFinite(interval) || interval < 3 || interval > 3600) {
      interval = 5;
    }
    return { intervalSeconds: interval, images: normalizedImages };
  }

  function imageUrl(file) {
    return "/home/" + encodeURIComponent(file);
  }

  function lockHeroSize() {
    if (state.heroLocked) {
      return;
    }
    var rect = els.hero.getBoundingClientRect();
    if (!rect.width || !rect.height) {
      return;
    }
    state.heroWidth = rect.width;
    state.heroHeight = rect.height;
    state.viewportHeight = window.innerHeight;
    els.hero.style.setProperty("--hero-base-height", Math.round(rect.height) + "px");
    els.hero.style.setProperty("--hero-image-w", Math.round(rect.width) + "px");
    els.hero.style.setProperty("--hero-image-h", Math.round(rect.height) + "px");
    state.heroLocked = true;
  }

  function updateHeroHoverHeight() {
    if (!state.imageSize || !state.heroLocked) {
      els.hero.style.removeProperty("--hero-hover-height");
      return;
    }
    var ideal = state.heroWidth * (state.imageSize.height / state.imageSize.width);
    var maxHeight = Math.max(320, state.viewportHeight * 0.92);
    var height = Math.min(Math.max(ideal, 320), maxHeight);
    els.hero.style.setProperty("--hero-hover-height", Math.round(height) + "px");
  }

  function pickWeighted(images, currentFile) {
    if (!images.length) {
      return null;
    }
    var candidates = images;
    if (images.length > 1 && currentFile) {
      var filtered = images.filter(function (image) {
        return image.file !== currentFile;
      });
      if (filtered.length) {
        candidates = filtered;
      }
    }
    var total = candidates.reduce(function (sum, image) {
      return sum + image.weight;
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

  function stopRotation() {
    if (state.timer) {
      window.clearInterval(state.timer);
      state.timer = null;
    }
  }

  function showPlaceholder() {
    state.imageToken += 1;
    state.current = null;
    state.activeLayer = "primary";
    state.imageSize = null;
    state.heroLocked = false;
    [els.image, els.imageNext].forEach(function (layer) {
      layer.classList.remove("is-visible");
      layer.hidden = true;
      layer.removeAttribute("src");
    });
    els.hero.classList.remove("has-image");
    els.hero.style.removeProperty("--hero-hover-height");
    els.hero.style.removeProperty("--hero-base-height");
    els.hero.style.removeProperty("--hero-image-w");
    els.hero.style.removeProperty("--hero-image-h");
    els.placeholder.hidden = false;
  }

  function applyImage(image) {
    if (!image) {
      showPlaceholder();
      return;
    }
    if (state.current && state.current.file === image.file) {
      return;
    }
    var token = ++state.imageToken;
    var loader = new Image();
    loader.onload = function () {
      if (token !== state.imageToken) {
        return;
      }
      var primary = els.image;
      var secondary = els.imageNext;
      var previous = state.current
        ? (state.activeLayer === "primary" ? primary : secondary)
        : null;
      var target = state.current
        ? (state.activeLayer === "primary" ? secondary : primary)
        : primary;

      lockHeroSize();
      target.hidden = false;
      target.src = loader.src;
      target.alt = image.file;
      target.classList.remove("is-visible");
      void target.offsetWidth;
      target.classList.add("is-visible");

      state.current = image;
      state.activeLayer = target === primary ? "primary" : "secondary";
      state.imageSize = {
        width: loader.naturalWidth || 1,
        height: loader.naturalHeight || 1
      };
      updateHeroHoverHeight();
      els.hero.classList.add("has-image");
      els.placeholder.hidden = true;

      if (previous) {
        previous.classList.remove("is-visible");
        window.setTimeout(function () {
          if (token !== state.imageToken) {
            return;
          }
          previous.hidden = true;
          previous.removeAttribute("src");
        }, 520);
      }
    };
    loader.onerror = function () {
      if (token !== state.imageToken) {
        return;
      }
      if (!state.current) {
        showPlaceholder();
      }
    };
    loader.src = imageUrl(image.file);
  }

  function startRotation() {
    stopRotation();
    if (
      state.config.images.length < 2 ||
      (window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches)
    ) {
      return;
    }
    state.timer = window.setInterval(function () {
      applyImage(pickWeighted(state.config.images, state.current && state.current.file));
    }, state.config.intervalSeconds * 1000);
  }

  function applyConfig(config, preferredFile) {
    state.config = config;
    stopRotation();
    if (!config.images.length) {
      showPlaceholder();
      return;
    }
    var current = preferredFile
      ? config.images.filter(function (image) { return image.file === preferredFile; })[0]
      : null;
    if (!current && state.current) {
      current = config.images.filter(function (image) {
        return image.file === state.current.file;
      })[0];
    }
    applyImage(current || pickWeighted(config.images, null));
    startRotation();
  }

  function loadConfig() {
    fetch("/home/home.json", { cache: "no-store" }).then(function (response) {
      if (!response.ok) {
        throw new Error("home.json 加载失败");
      }
      return response.json();
    }).then(function (data) {
      applyConfig(normalizeConfig(data));
    }).catch(function () {
      applyConfig({ intervalSeconds: 5, images: [] });
    });
  }

  function setStatus(message, error) {
    els.status.textContent = message || "";
    els.status.classList.toggle("is-error", !!error);
  }

  function renderEditorRows() {
    els.list.innerHTML = "";
    els.interval.value = String(state.config.intervalSeconds);
    if (!state.config.images.length) {
      var empty = document.createElement("p");
      empty.className = "home-image-empty";
      empty.textContent = "暂无图片，上传后显示。";
      els.list.appendChild(empty);
      return;
    }
    state.config.images.forEach(function (image) {
      var row = document.createElement("div");
      row.className = "home-image-row";
      var thumb = document.createElement("img");
      thumb.className = "home-image-thumb";
      thumb.src = imageUrl(image.file);
      thumb.alt = "";
      thumb.loading = "lazy";
      thumb.onerror = function () {
        thumb.onerror = null;
        thumb.src = "/icon.png";
      };
      var info = document.createElement("div");
      info.className = "home-image-info";
      var name = document.createElement("span");
      name.className = "home-image-name";
      name.textContent = image.file;
      name.title = image.file;
      info.appendChild(name);
      var weight = document.createElement("input");
      weight.type = "number";
      weight.min = "0.1";
      weight.max = "1000000";
      weight.step = "0.1";
      weight.value = String(image.weight);
      weight.dataset.file = image.file;
      weight.setAttribute("aria-label", image.file + " 的权重");
      var remove = document.createElement("button");
      remove.type = "button";
      remove.className = "home-image-remove";
      remove.textContent = "×";
      remove.title = "删除这张图片";
      remove.setAttribute("aria-label", "删除 " + image.file);
      remove.addEventListener("click", function () {
        deleteHomeImage(image.file);
      });
      row.appendChild(thumb);
      row.appendChild(info);
      row.appendChild(weight);
      row.appendChild(remove);
      els.list.appendChild(row);
    });
  }

  function deleteHomeImage(file) {
    if (!window.confirm("确定删除图片「" + file + "」吗？")) {
      return;
    }
    setStatus("删除中…");
    fetch("/api/home/images/" + encodeURIComponent(file), {
      method: "DELETE"
    }).then(function (response) {
      return response.json().catch(function () { return {}; }).then(function (data) {
        if (!response.ok) {
          throw new Error(data.error || "删除失败");
        }
        return data;
      });
    }).then(function (data) {
      applyConfig(normalizeConfig(data));
      renderEditorRows();
      setStatus("图片已删除");
    }).catch(function (error) {
      setStatus(error.message, true);
    });
  }

  function openDialog() {
    if (!state.backend) {
      return;
    }
    renderEditorRows();
    setStatus("");
    els.file.value = "";
    els.uploadWeight.value = "1";
    els.dialog.showModal();
  }

  function closeDialog() {
    els.dialog.close();
  }

  function saveConfig(event) {
    event.preventDefault();
    var interval = Number(els.interval.value);
    if (!Number.isFinite(interval) || interval < 3 || interval > 3600) {
      setStatus("轮换间隔必须在 3–3600 秒之间", true);
      return;
    }
    var images = [];
    var weights = els.list.querySelectorAll("input[data-file]");
    for (var index = 0; index < weights.length; index += 1) {
      var weight = Number(weights[index].value);
      if (!Number.isFinite(weight) || weight <= 0) {
        setStatus("图片权重必须大于 0", true);
        return;
      }
      images.push({ file: weights[index].dataset.file, weight: weight });
    }
    els.submit.disabled = true;
    setStatus("保存中…");
    fetch("/api/home", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ intervalSeconds: interval, images: images })
    }).then(function (response) {
      return response.json().catch(function () { return {}; }).then(function (data) {
        if (!response.ok) {
          throw new Error(data.error || "保存失败");
        }
        return data;
      });
    }).then(function (data) {
      applyConfig(normalizeConfig(data));
      closeDialog();
    }).catch(function (error) {
      setStatus(error.message, true);
    }).finally(function () {
      els.submit.disabled = false;
    });
  }

  function uploadImage() {
    var file = els.file.files && els.file.files[0];
    var weight = Number(els.uploadWeight.value);
    if (!file) {
      setStatus("请选择图片文件", true);
      return;
    }
    if (!/\.(png|jpe?g)$/i.test(file.name)) {
      setStatus("只支持 .png、.jpg、.jpeg 图片", true);
      return;
    }
    if (file.size > 20 * 1024 * 1024) {
      setStatus("图片不能超过 20MB", true);
      return;
    }
    if (!Number.isFinite(weight) || weight <= 0) {
      setStatus("图片权重必须大于 0", true);
      return;
    }
    els.upload.disabled = true;
    setStatus("上传中…");
    var controller = new AbortController();
    var timeout = window.setTimeout(function () {
      controller.abort();
    }, 90000);
    file.arrayBuffer().then(function (buffer) {
      return fetch(
        "/api/home/images?filename=" + encodeURIComponent(file.name) +
        "&weight=" + encodeURIComponent(String(weight)),
        {
          method: "POST",
          headers: { "Content-Type": file.type || "application/octet-stream" },
          body: buffer,
          signal: controller.signal
        }
      );
    }).then(function (response) {
      return response.json().catch(function () { return {}; }).then(function (data) {
        if (!response.ok) {
          throw new Error(data.error || "上传失败");
        }
        return data;
      });
    }).then(function (data) {
      var config = normalizeConfig(data);
      applyConfig(config, data.image && data.image.file);
      renderEditorRows();
      els.file.value = "";
      els.uploadWeight.value = "1";
      setStatus("图片已上传");
    }).catch(function (error) {
      setStatus(
        error && error.name === "AbortError"
          ? "上传超时，请查看服务日志"
          : error.message,
        true
      );
    }).finally(function () {
      window.clearTimeout(timeout);
      els.upload.disabled = false;
    });
  }

  function articleCard(doc) {
    var link = document.createElement("a");
    link.className = "card";
    link.href = "/wiki/#/doc/" + encodeURIComponent(doc.slug || doc.id) + "#single";
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
    return link;
  }

  function renderHomeSections() {
    var container = document.getElementById("homeTopicSections");
    var data = window.HAPPYDAYS_WIKI;
    if (!container || !data || !Array.isArray(data.categories) || !data.docs) {
      return;
    }
    var categories = data.categories.slice().sort(function (left, right) {
      return (left.order || 0) - (right.order || 0);
    });
    container.innerHTML = "";
    categories.filter(function (topic) {
      return !topic.parentId;
    }).forEach(function (topic) {
      var children = categories.filter(function (child) {
        return child.parentId === topic.id;
      });
      var docs = (topic.docs || []).map(function (slug) {
        return data.docs[slug] ? Object.assign({ slug: slug }, data.docs[slug]) : null;
      }).filter(Boolean);
      if (!docs.length && !children.length) {
        return;
      }
      var section = document.createElement("section");
      section.className = "section";
      var header = document.createElement("div");
      header.className = "section-header";
      var title = document.createElement("h2");
      title.className = "section-title";
      title.textContent = topic.name;
      header.appendChild(title);
      if (docs.length > 3 || children.length) {
        var more = document.createElement("a");
        more.className = "section-more";
        more.href = "/bank/" + encodeURIComponent(topic.id);
        more.textContent = "查看更多 →";
        header.appendChild(more);
      }
      section.appendChild(header);
      if (docs.length) {
        var grid = document.createElement("div");
        grid.className = "card-grid";
        docs.slice(0, 3).forEach(function (doc) {
          grid.appendChild(articleCard(doc));
        });
        section.appendChild(grid);
      } else {
        var empty = document.createElement("p");
        empty.className = "bank-empty";
        empty.textContent = "此标题下暂无直接文章，点击查看下级目录。";
        section.appendChild(empty);
      }
      container.appendChild(section);
    });
  }

  renderHomeSections();

  var siteHeader = document.querySelector(".site-header");
  if (siteHeader) {
    els.hero.addEventListener("mouseenter", function () {
      if (state.current) {
        document.body.classList.add("hero-focus");
      }
    });
    els.hero.addEventListener("mouseleave", function () {
      document.body.classList.remove("hero-focus");
    });
  }

  els.edit.addEventListener("click", openDialog);
  els.form.addEventListener("submit", saveConfig);
  els.upload.addEventListener("click", uploadImage);
  els.cancel.addEventListener("click", closeDialog);
  els.cancelX.addEventListener("click", closeDialog);
  els.dialog.addEventListener("click", function (event) {
    if (event.target === els.dialog) {
      closeDialog();
    }
  });

  loadConfig();

  fetch("/api/health", { cache: "no-store" }).then(function (response) {
    return response.ok ? response.json() : null;
  }).then(function (data) {
    if (data && data.ok) {
      state.backend = true;
      els.edit.hidden = false;
    }
  }).catch(function () {
    /* 静态部署没有编辑 API */
  });
})();
