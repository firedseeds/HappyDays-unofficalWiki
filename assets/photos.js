(function () {
  "use strict";

  var state = {
    data: { galleries: [] },
    gallery: "",
    album: "",
    backend: false,
    lightboxImages: [],
    lightboxIndex: 0,
    lightboxAlbum: null,
    title: {
      items: [],
      intervalMs: 8000,
      timer: null,
      paused: false,
      currentText: ""
    }
  };

  var els = {
    galleries: document.getElementById("photosGalleries"),
    galleryCount: document.getElementById("photosGalleryCount"),
    content: document.getElementById("photosContent"),
    addAlbum: document.getElementById("photosAddAlbum"),
    crumbGallery: document.getElementById("photosCrumbGallery"),
    crumbDivider: document.getElementById("photosCrumbDivider"),
    crumbAlbum: document.getElementById("photosCrumbAlbum"),
    menu: document.getElementById("photosMenu"),
    sidebar: document.getElementById("photosSidebar"),
    albumDialog: document.getElementById("photosAlbumDialog"),
    albumForm: document.getElementById("photosAlbumForm"),
    albumName: document.getElementById("photosAlbumName"),
    albumFolder: document.getElementById("photosAlbumFolder"),
    albumGallery: document.getElementById("photosAlbumGallery"),
    albumGalleryOptions: document.getElementById("photosGalleryOptions"),
    albumStatus: document.getElementById("photosAlbumStatus"),
    albumSubmit: document.getElementById("photosAlbumSubmit"),
    albumCancel: document.getElementById("photosAlbumCancel"),
    albumCancelX: document.getElementById("photosAlbumCancelX"),
    imageInput: document.getElementById("photosImageInput"),
    lightbox: document.getElementById("photosLightbox"),
    lightboxImage: document.getElementById("photosLightboxImage"),
    lightboxPrev: document.getElementById("photosLightboxPrev"),
    lightboxNext: document.getElementById("photosLightboxNext"),
    lightboxClose: document.getElementById("photosLightboxClose"),
    lightboxCaption: document.getElementById("photosLightboxCaption"),
    toast: document.getElementById("photosToast"),
    titleRoll: document.getElementById("photosTitleRoll"),
    titleText: document.getElementById("photosTitleText")
  };

  var toastTimer = null;

  function escapeHtml(value) {
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

  function imageUrl(folder, file) {
    return "/photos/" + encodeURIComponent(folder) + "/" + encodeURIComponent(file);
  }

  function showToast(message, isError) {
    if (!els.toast) {
      return;
    }
    window.clearTimeout(toastTimer);
    els.toast.textContent = message;
    els.toast.classList.toggle("is-error", !!isError);
    els.toast.hidden = false;
    toastTimer = window.setTimeout(function () {
      els.toast.hidden = true;
    }, 3200);
  }

  function normalizeData(raw) {
    var galleries = raw && Array.isArray(raw.galleries) ? raw.galleries : [];
    return {
      version: 1,
      galleries: galleries.map(function (gallery) {
        var albums = Array.isArray(gallery.albums) ? gallery.albums : [];
        return {
          name: String(gallery.name || "默认图库"),
          albums: albums.map(function (album) {
            var images = Array.isArray(album.images) ? album.images : [];
            return {
              name: String(album.name || album.folder || "未命名相册"),
              folder: String(album.folder || ""),
              order: Number(album.order) || 0,
              images: images.map(function (image) {
                return {
                  file: String(image.file || ""),
                  order: Number(image.order) || 0
                };
              }).filter(function (image) {
                return !!image.file;
              }).sort(function (a, b) {
                return a.order - b.order || a.file.localeCompare(b.file);
              })
            };
          }).sort(function (a, b) {
            return a.order - b.order || a.folder.localeCompare(b.folder);
          })
        };
      })
    };
  }

  function currentGallery() {
    return state.data.galleries.filter(function (gallery) {
      return gallery.name === state.gallery;
    })[0] || null;
  }

  function currentAlbum() {
    var gallery = currentGallery();
    if (!gallery) {
      return null;
    }
    return gallery.albums.filter(function (album) {
      return album.folder === state.album;
    })[0] || null;
  }

  function chooseGallery() {
    if (currentGallery()) {
      return;
    }
    var first = state.data.galleries[0];
    state.gallery = first ? first.name : "";
    state.album = "";
  }

  function renderGalleries() {
    if (!els.galleries) {
      return;
    }
    chooseGallery();
    els.galleries.innerHTML = "";
    state.data.galleries.forEach(function (gallery) {
      var button = document.createElement("button");
      button.type = "button";
      button.className = "photos-gallery";
      if (gallery.name === state.gallery) {
        button.classList.add("is-active");
      }
      button.innerHTML =
        '<span class="photos-gallery-name">' + escapeHtml(gallery.name) + "</span>" +
        '<span class="photos-gallery-count">' + gallery.albums.length + "</span>";
      button.addEventListener("click", function () {
        state.gallery = gallery.name;
        state.album = "";
        document.body.classList.remove("photos-nav-open");
        render();
      });
      els.galleries.appendChild(button);
    });
    if (els.galleryCount) {
      els.galleryCount.textContent = state.data.galleries.length + " 个";
    }
  }

  function updateBreadcrumbs() {
    var gallery = currentGallery();
    var album = currentAlbum();
    if (els.crumbGallery) {
      els.crumbGallery.textContent = gallery ? gallery.name : "相册";
      els.crumbGallery.href = "/photos";
    }
    if (els.crumbDivider) {
      els.crumbDivider.hidden = !album;
    }
    if (els.crumbAlbum) {
      els.crumbAlbum.hidden = !album;
      els.crumbAlbum.textContent = album ? album.name : "";
    }
  }

  function renderGalleryView(gallery) {
    var albums = gallery.albums;
    var cards = albums.map(function (album) {
      var cover = album.images[0];
      var coverHtml;
      if (cover) {
        coverHtml = '<img class="photos-album-cover" src="' + escapeHtml(imageUrl(album.folder, cover.file)) +
          '" alt="" loading="lazy" data-fallback="1">';
      } else {
        coverHtml = '<span class="photos-album-cover photos-album-cover--empty">暂无图片</span>';
      }
      return '<button class="photos-album-card" type="button" data-album="' + escapeHtml(album.folder) + '">' +
        coverHtml +
        '<span class="photos-album-body">' +
        '<span class="photos-album-name">' + escapeHtml(album.name) + "</span>" +
        '<span class="photos-album-meta">' + album.images.length + " 张图片</span>" +
        "</span></button>";
    }).join("");
    els.content.innerHTML =
      '<div class="photos-view-head"><div class="photos-title-block">' +
      "<h1>" + escapeHtml(gallery.name) + "</h1>" +
      "<p>" + albums.length + " 个相册 · 按上传顺序排列</p>" +
      "</div></div>" +
      (albums.length
        ? '<div class="photos-album-grid">' + cards + "</div>"
        : '<p class="photos-empty">这个图库还没有相册，点击左下角 + 添加。</p>');
    Array.from(els.content.querySelectorAll(".photos-album-card")).forEach(function (card) {
      card.addEventListener("click", function () {
        state.album = card.getAttribute("data-album");
        render();
      });
    });
    Array.from(els.content.querySelectorAll("[data-fallback]")).forEach(function (image) {
      image.addEventListener("error", function () {
        image.src = "/icon.png";
      }, { once: true });
    });
  }

  function renderAlbumView(gallery, album) {
    var photos = album.images.map(function (image, index) {
      return '<div class="photos-photo" data-index="' + index + '" tabindex="0" role="button" aria-label="打开第 ' +
        (index + 1) + ' 张图片">' +
        '<img src="' + escapeHtml(imageUrl(album.folder, image.file)) + '" alt="' + escapeHtml(album.name + " " + (index + 1)) +
        '" loading="lazy" data-fallback="1">' +
        (state.backend
          ? '<button class="photos-photo-delete" type="button" data-delete="' + escapeHtml(image.file) + '" aria-label="删除图片">×</button>'
          : "") +
        "</div>";
    }).join("");
    els.content.innerHTML =
      '<div class="photos-view-head"><div class="photos-title-block">' +
      '<button class="photos-back" type="button" id="photosBack">← 返回 ' + escapeHtml(gallery.name) + "</button>" +
      "<h1>" + escapeHtml(album.name) + "</h1>" +
      "<p>" + photosCountLabel(album.images.length) + " · " + escapeHtml(album.folder) + "</p>" +
      "</div>" +
      (state.backend ? '<button class="photos-add-images" id="photosAddImages" type="button">上传图片</button>' : "") +
      "</div>" +
      (album.images.length
        ? '<div class="photos-photo-grid">' + photos + "</div>"
        : '<p class="photos-empty">这个相册还没有图片。' + (state.backend ? "点击右上角上传图片。" : "") + "</p>");

    var back = document.getElementById("photosBack");
    if (back) {
      back.addEventListener("click", function () {
        state.album = "";
        render();
      });
    }
    var addImages = document.getElementById("photosAddImages");
    if (addImages) {
      addImages.addEventListener("click", function () {
        els.imageInput.click();
      });
    }
    Array.from(els.content.querySelectorAll(".photos-photo")).forEach(function (tile) {
      var index = Number(tile.getAttribute("data-index"));
      tile.addEventListener("click", function (event) {
        if (event.target.closest(".photos-photo-delete")) {
          return;
        }
        openLightbox(album, index);
      });
      tile.addEventListener("keydown", function (event) {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          openLightbox(album, index);
        }
      });
    });
    Array.from(els.content.querySelectorAll("[data-delete]")).forEach(function (button) {
      button.addEventListener("click", function (event) {
        event.stopPropagation();
        deleteImage(album, button.getAttribute("data-delete"));
      });
    });
    Array.from(els.content.querySelectorAll("[data-fallback]")).forEach(function (image) {
      image.addEventListener("error", function () {
        image.src = "/icon.png";
      }, { once: true });
    });
  }

  function photosCountLabel(count) {
    return count + " 张图片";
  }

  function render() {
    chooseGallery();
    var gallery = currentGallery();
    var album = currentAlbum();
    if (state.album && !album) {
      state.album = "";
    }
    renderGalleries();
    updateBreadcrumbs();
    if (els.addAlbum) {
      els.addAlbum.hidden = !state.backend;
    }
    if (!gallery) {
      els.content.innerHTML = '<p class="photos-empty">暂无图库数据。</p>';
      return;
    }
    if (album) {
      renderAlbumView(gallery, album);
    } else {
      renderGalleryView(gallery);
    }
  }

  function loadPhotos() {
    return fetch("/photos/photos.json", { cache: "no-store" }).then(function (response) {
      if (!response.ok) {
        throw new Error("相册数据加载失败");
      }
      return response.json();
    }).then(function (data) {
      state.data = normalizeData(data);
      chooseGallery();
      render();
    }).catch(function (error) {
      els.content.innerHTML = '<p class="photos-empty">' + escapeHtml(error.message) + "</p>";
    });
  }

  function openAlbumDialog() {
    if (!state.backend) {
      return;
    }
    els.albumForm.reset();
    els.albumStatus.textContent = "";
    els.albumStatus.classList.remove("is-error");
    els.albumGallery.innerHTML = "";
    els.albumGalleryOptions.innerHTML = "";
    state.data.galleries.forEach(function (gallery) {
      var option = document.createElement("option");
      option.value = gallery.name;
      els.albumGalleryOptions.appendChild(option);
    });
    els.albumGallery.value = currentGallery() ? currentGallery().name : "默认图库";
    els.albumDialog.showModal();
    els.albumName.focus();
  }

  function closeAlbumDialog() {
    els.albumDialog.close();
  }

  function submitAlbum(event) {
    event.preventDefault();
    var name = els.albumName.value.trim();
    var folder = els.albumFolder.value.trim();
    var gallery = els.albumGallery.value;
    if (!name || !folder) {
      els.albumStatus.textContent = "请填写相册名称和文件夹名";
      els.albumStatus.classList.add("is-error");
      return;
    }
    els.albumSubmit.disabled = true;
    els.albumStatus.textContent = "创建中…";
    els.albumStatus.classList.remove("is-error");
    fetch("/api/photos/albums", {
      method: "POST",
      cache: "no-store",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: name, folder: folder, gallery: gallery })
    }).then(function (response) {
      return response.json().catch(function () { return {}; }).then(function (data) {
        if (!response.ok) {
          throw new Error(data.error || "创建失败");
        }
        return data;
      });
    }).then(function (data) {
      closeAlbumDialog();
      state.gallery = data.gallery || gallery;
      state.album = "";
      return loadPhotos().then(function () {
        showToast("相册「" + name + "」已创建");
      });
    }).catch(function (error) {
      els.albumStatus.textContent = error.message;
      els.albumStatus.classList.add("is-error");
    }).finally(function () {
      els.albumSubmit.disabled = false;
    });
  }

  function deleteImage(album, filename) {
    if (!window.confirm("确定删除这张图片吗？")) {
      return;
    }
    fetch("/api/photos/albums/" + encodeURIComponent(album.folder) + "/images/" + encodeURIComponent(filename), {
      method: "DELETE",
      cache: "no-store"
    }).then(function (response) {
      return response.json().catch(function () { return {}; }).then(function (data) {
        if (!response.ok) {
          throw new Error(data.error || "删除失败");
        }
        return data;
      });
    }).then(function () {
      return loadPhotos().then(function () {
        showToast("图片已删除");
      });
    }).catch(function (error) {
      showToast(error.message, true);
    });
  }

  function uploadImages(files) {
    var album = currentAlbum();
    if (!album || !files.length) {
      return;
    }
    var button = document.getElementById("photosAddImages");
    if (button) {
      button.disabled = true;
      button.textContent = "上传中…";
    }
    var uploaded = 0;
    var chain = Promise.resolve();
    Array.from(files).forEach(function (file) {
      chain = chain.then(function () {
        if (!/\.(png|jpe?g|webp|gif)$/i.test(file.name)) {
          throw new Error("跳过不支持的文件：" + file.name);
        }
        if (file.size > 25 * 1024 * 1024) {
          throw new Error("图片不能超过 25MB：" + file.name);
        }
        return file.arrayBuffer().then(function (buffer) {
          return fetch(
            "/api/photos/albums/" + encodeURIComponent(album.folder) +
            "/images?filename=" + encodeURIComponent(file.name),
            {
              method: "POST",
              cache: "no-store",
              headers: { "Content-Type": file.type || "application/octet-stream" },
              body: buffer
            }
          );
        }).then(function (response) {
          return response.json().catch(function () { return {}; }).then(function (data) {
            if (!response.ok) {
              throw new Error(data.error || ("上传失败：" + file.name));
            }
            uploaded += 1;
          });
        });
      });
    });
    chain.then(function () {
      return loadPhotos().then(function () {
        showToast("已上传 " + uploaded + " 张图片");
      });
    }).catch(function (error) {
      showToast(error.message, true);
      return loadPhotos();
    }).finally(function () {
      els.imageInput.value = "";
    });
  }

  function openLightbox(album, index) {
    state.lightboxAlbum = album;
    state.lightboxImages = album.images;
    state.lightboxIndex = index;
    updateLightbox();
    if (!els.lightbox.open) {
      els.lightbox.showModal();
    }
  }

  function updateLightbox() {
    var images = state.lightboxImages;
    var index = state.lightboxIndex;
    var image = images[index];
    if (!image) {
      return;
    }
    var album = state.lightboxAlbum;
    els.lightboxImage.src = imageUrl(album.folder, image.file);
    els.lightboxImage.alt = album.name + " " + (index + 1);
    els.lightboxCaption.textContent = album.name + " · " + (index + 1) + " / " + images.length + " · " + image.file;
    els.lightboxPrev.hidden = index <= 0;
    els.lightboxNext.hidden = index >= images.length - 1;
  }

  function lightboxStep(delta) {
    var next = state.lightboxIndex + delta;
    if (next < 0 || next >= state.lightboxImages.length) {
      return;
    }
    state.lightboxIndex = next;
    updateLightbox();
  }

  function setTitle(item, animate) {
    if (!els.titleText || !window.HappyDaysTitleFormat) {
      return;
    }
    var normalized = window.HappyDaysTitleFormat.normalize(item);
    if (!normalized.text) {
      return;
    }
    var reduced = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    els.titleText.classList.remove("is-rolling");
    if (animate && !reduced) {
      void els.titleText.offsetWidth;
      window.HappyDaysTitleFormat.render(els.titleText, normalized);
      els.titleText.classList.add("is-rolling");
    } else {
      window.HappyDaysTitleFormat.render(els.titleText, normalized);
    }
    els.titleText.title = normalized.text;
    state.title.currentText = normalized.text;
  }

  function pickTitle() {
    var items = state.title.items;
    if (!items.length) {
      return null;
    }
    var candidates = items.filter(function (item) {
      return item.text !== state.title.currentText || items.length === 1;
    });
    if (!candidates.length) {
      candidates = items;
    }
    var total = candidates.reduce(function (sum, item) {
      return sum + item.weight;
    }, 0);
    var cursor = Math.random() * total;
    for (var i = 0; i < candidates.length; i += 1) {
      cursor -= candidates[i].weight;
      if (cursor <= 0) {
        return candidates[i];
      }
    }
    return candidates[candidates.length - 1];
  }

  function stopTitleRotation() {
    if (state.title.timer) {
      window.clearInterval(state.title.timer);
      state.title.timer = null;
    }
  }

  function startTitleRotation() {
    stopTitleRotation();
    if (
      state.title.timer ||
      state.title.paused ||
      state.title.items.length < 2 ||
      (window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches)
    ) {
      return;
    }
    state.title.timer = window.setInterval(function () {
      setTitle(pickTitle(), true);
    }, state.title.intervalMs);
  }

  function initTitleRoll() {
    if (!els.titleText) {
      return;
    }
    els.titleRoll.addEventListener("mouseenter", function () {
      state.title.paused = true;
      stopTitleRotation();
    });
    els.titleRoll.addEventListener("mouseleave", function () {
      state.title.paused = false;
      startTitleRotation();
    });
    fetch("/title.json", { cache: "no-store" }).then(function (response) {
      if (!response.ok) {
        throw new Error("no title");
      }
      return response.json();
    }).then(function (data) {
      var settings = data || {};
      var raw = Array.isArray(data) ? data : settings.titles;
      if (!Array.isArray(raw)) {
        return;
      }
      state.title.items = raw.map(function (item) {
        var normalized = window.HappyDaysTitleFormat.normalize(item);
        var weight = Number(item && item.weight);
        if (!normalized.text.trim() || !Number.isFinite(weight) || weight <= 0) {
          return null;
        }
        return { text: normalized.text, weight: weight, runs: normalized.runs };
      }).filter(Boolean);
      var interval = Number(settings.intervalSeconds);
      state.title.intervalMs = Math.max(3, Math.min(3600, Number.isFinite(interval) ? interval : 8)) * 1000;
      var fontSize = Number(settings.fontSize);
      if (Number.isFinite(fontSize) && fontSize > 0) {
        els.titleText.style.fontSize = Math.max(10, Math.min(40, fontSize)) + "px";
      }
      setTitle(pickTitle(), false);
      startTitleRotation();
    }).catch(function () {
      /* 保留静态标题 */
    });
  }

  function initMenu() {
    if (!els.menu) {
      return;
    }
    els.menu.addEventListener("click", function () {
      var open = document.body.classList.toggle("photos-nav-open");
      els.menu.setAttribute("aria-expanded", open ? "true" : "false");
    });
    document.addEventListener("click", function (event) {
      if (
        document.body.classList.contains("photos-nav-open") &&
        !event.target.closest("#photosSidebar") &&
        !event.target.closest("#photosMenu")
      ) {
        document.body.classList.remove("photos-nav-open");
        els.menu.setAttribute("aria-expanded", "false");
      }
    });
  }

  els.addAlbum.addEventListener("click", openAlbumDialog);
  els.albumForm.addEventListener("submit", submitAlbum);
  els.albumCancel.addEventListener("click", closeAlbumDialog);
  els.albumCancelX.addEventListener("click", closeAlbumDialog);
  els.albumDialog.addEventListener("click", function (event) {
    if (event.target === els.albumDialog) {
      closeAlbumDialog();
    }
  });
  els.imageInput.addEventListener("change", function () {
    uploadImages(els.imageInput.files || []);
  });
  els.lightboxPrev.addEventListener("click", function () {
    lightboxStep(-1);
  });
  els.lightboxNext.addEventListener("click", function () {
    lightboxStep(1);
  });
  els.lightboxClose.addEventListener("click", function () {
    els.lightbox.close();
  });
  els.lightbox.addEventListener("close", function () {
    els.lightboxImage.removeAttribute("src");
  });
  els.lightbox.addEventListener("click", function (event) {
    if (event.target === els.lightbox) {
      els.lightbox.close();
    }
  });
  els.lightbox.addEventListener("keydown", function (event) {
    if (event.key === "ArrowLeft") {
      event.preventDefault();
      lightboxStep(-1);
    } else if (event.key === "ArrowRight") {
      event.preventDefault();
      lightboxStep(1);
    }
  });

  initTitleRoll();
  initMenu();
  loadPhotos();

  fetch("/api/health", { cache: "no-store" }).then(function (response) {
    return response.ok ? response.json() : null;
  }).then(function (data) {
    if (data && data.ok) {
      state.backend = true;
      render();
    }
  }).catch(function () {
    /* 静态浏览时隐藏编辑按钮 */
  });
})();
