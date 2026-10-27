(function () {
  "use strict";

  var mount = document.getElementById("bgmMount");
  if (!mount) {
    return;
  }

  mount.innerHTML = [
    '<aside class="bgm-player" id="bgmPlayer" aria-label="背景音乐" hidden>',
    '  <div class="bgm-now">',
    '    <span class="bgm-label">BGM</span>',
    '    <span class="bgm-title" id="bgmTitle">暂无音乐</span>',
    '  </div>',
    '  <div class="bgm-actions">',
    '    <button class="bgm-button" id="bgmToggle" type="button" aria-label="播放背景音乐" title="播放">▶</button>',
    '    <button class="bgm-button" id="bgmNext" type="button" aria-label="下一首背景音乐" title="下一首">⏭</button>',
    '    <button class="bgm-button" id="bgmUpload" type="button" aria-label="上传背景音乐" title="上传 BGM" hidden>＋</button>',
    '  </div>',
    '  <audio id="bgmAudio" preload="none"></audio>',
    '</aside>',
    '<dialog class="bgm-dialog" id="bgmDialog" aria-labelledby="bgmDialogTitle">',
    '  <form class="bgm-form" id="bgmForm">',
    '    <header class="bgm-dialog-head">',
    '      <div><p class="bgm-eyebrow">Background music</p><h2 id="bgmDialogTitle">上传 BGM</h2></div>',
    '      <button class="bgm-close" id="bgmCancelX" type="button" aria-label="关闭">×</button>',
    '    </header>',
    '    <div class="bgm-dialog-body">',
    '      <label class="bgm-field"><span>音频文件</span><input id="bgmFile" type="file" accept=".mp3,.wav,audio/mpeg,audio/wav" required><small>仅支持 .mp3 和 .wav，最大 50MB</small></label>',
    '      <label class="bgm-field"><span>歌名</span><input id="bgmFormTitle" type="text" maxlength="120" autocomplete="off" required placeholder="显示在播放器中的歌名"></label>',
    '      <label class="bgm-field"><span>权重</span><input id="bgmFormWeight" type="number" min="0.1" max="1000000" step="0.1" value="1" required></label>',
    '      <p class="bgm-form-status" id="bgmFormStatus"></p>',
    '    </div>',
    '    <footer class="bgm-dialog-actions"><button class="bgm-secondary" id="bgmCancel" type="button">取消</button><button class="bgm-primary" id="bgmSubmit" type="submit">上传</button></footer>',
    '  </form>',
    '</dialog>'
  ].join("\n");

  var els = {
    player: document.getElementById("bgmPlayer"),
    title: document.getElementById("bgmTitle"),
    toggle: document.getElementById("bgmToggle"),
    next: document.getElementById("bgmNext"),
    upload: document.getElementById("bgmUpload"),
    audio: document.getElementById("bgmAudio"),
    dialog: document.getElementById("bgmDialog"),
    form: document.getElementById("bgmForm"),
    file: document.getElementById("bgmFile"),
    formTitle: document.getElementById("bgmFormTitle"),
    formWeight: document.getElementById("bgmFormWeight"),
    status: document.getElementById("bgmFormStatus"),
    submit: document.getElementById("bgmSubmit"),
    cancel: document.getElementById("bgmCancel"),
    cancelX: document.getElementById("bgmCancelX")
  };

  var state = {
    tracks: [],
    current: null,
    backend: false,
    resumeOnVisible: false
  };

  function normalizeTracks(data) {
    var tracks = Array.isArray(data && data.tracks) ? data.tracks : [];
    return tracks.map(function (track) {
      var weight = Number(track && track.weight);
      if (!track || typeof track.file !== "string" || !track.file || !Number.isFinite(weight) || weight <= 0) {
        return null;
      }
      return {
        file: track.file,
        title: typeof track.title === "string" && track.title ? track.title : track.file,
        weight: weight
      };
    }).filter(Boolean);
  }

  function pickWeighted(tracks, currentFile) {
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
    var roll = Math.random() * total;
    for (var index = 0; index < candidates.length; index += 1) {
      roll -= candidates[index].weight;
      if (roll < 0) {
        return candidates[index];
      }
    }
    return candidates[candidates.length - 1];
  }

  function syncButton() {
    var playing = !!state.current && !els.audio.paused;
    els.toggle.textContent = playing ? "Ⅱ" : "▶";
    els.toggle.classList.toggle("is-playing", playing);
    els.toggle.setAttribute("aria-label", playing ? "暂停背景音乐" : "播放背景音乐");
    els.toggle.title = playing ? "暂停" : "播放";
  }

  function play() {
    if (!state.current) {
      return;
    }
    var promise = els.audio.play();
    if (promise && typeof promise.catch === "function") {
      promise.catch(syncButton);
    }
  }

  function setTrack(track, autoplay) {
    if (!track) {
      return;
    }
    state.current = track;
    state.resumeOnVisible = false;
    els.player.hidden = false;
    els.title.textContent = track.title;
    els.title.title = track.title;
    els.audio.loop = state.tracks.length === 1;
    els.audio.src = "/BGM/" + encodeURIComponent(track.file);
    els.audio.load();
    syncButton();
    if (autoplay) {
      play();
    }
  }

  function applyTracks(tracks) {
    state.tracks = tracks;
    if (!tracks.length) {
      state.current = null;
      els.audio.pause();
      els.audio.removeAttribute("src");
      els.audio.load();
      els.title.textContent = "暂无音乐";
      els.title.title = "";
      els.player.hidden = !state.backend;
      syncButton();
      return;
    }
    els.player.hidden = false;
    var existing = state.current
      ? tracks.filter(function (track) { return track.file === state.current.file; })[0]
      : null;
    if (existing) {
      state.current = existing;
      els.audio.loop = tracks.length === 1;
      els.title.textContent = existing.title;
      els.title.title = existing.title;
      syncButton();
      return;
    }
    setTrack(pickWeighted(tracks, null), false);
  }

  function loadTracks() {
    fetch("/BGM/BGM.json", { cache: "no-store" })
      .then(function (response) {
        return response.ok ? response.json() : { tracks: [] };
      })
      .then(function (data) {
        applyTracks(normalizeTracks(data));
      })
      .catch(function () {
        applyTracks([]);
      });
  }

  function setStatus(message, error) {
    els.status.textContent = message || "";
    els.status.classList.toggle("is-error", !!error);
  }

  function openDialog() {
    if (!state.backend) {
      return;
    }
    els.form.reset();
    els.formWeight.value = "1";
    setStatus("");
    els.dialog.showModal();
  }

  function closeDialog() {
    els.dialog.close();
  }

  function upload(event) {
    event.preventDefault();
    var file = els.file.files && els.file.files[0];
    var title = els.formTitle.value.trim();
    var weight = Number(els.formWeight.value);
    if (!file) {
      setStatus("请选择音频文件", true);
      return;
    }
    if (!/\.(mp3|wav)$/i.test(file.name)) {
      setStatus("只支持 .mp3 和 .wav 文件", true);
      return;
    }
    if (file.size > 50 * 1024 * 1024) {
      setStatus("音频文件不能超过 50MB", true);
      return;
    }
    if (!title) {
      setStatus("请填写歌名", true);
      return;
    }
    if (!Number.isFinite(weight) || weight <= 0) {
      setStatus("权重必须大于 0", true);
      return;
    }
    els.submit.disabled = true;
    setStatus("上传中…");
    file.arrayBuffer().then(function (buffer) {
      return fetch(
        "/api/bgm?title=" + encodeURIComponent(title) +
        "&weight=" + encodeURIComponent(String(weight)) +
        "&filename=" + encodeURIComponent(file.name),
        {
          method: "POST",
          headers: { "Content-Type": file.type || "application/octet-stream" },
          body: buffer
        }
      );
    }).then(function (response) {
      return response.json().catch(function () { return {}; }).then(function (data) {
        if (!response.ok) {
          throw new Error(data.error || "BGM 上传失败");
        }
        return data;
      });
    }).then(function (data) {
      applyTracks(normalizeTracks(data));
      setTrack(data.track, true);
      setStatus("BGM 已上传");
      window.setTimeout(closeDialog, 450);
    }).catch(function (error) {
      setStatus(error.message, true);
    }).finally(function () {
      els.submit.disabled = false;
    });
  }

  function next() {
    if (!state.tracks.length) {
      return;
    }
    setTrack(pickWeighted(state.tracks, state.current && state.current.file), true);
  }

  els.toggle.addEventListener("click", function () {
    if (els.audio.paused) {
      play();
    } else {
      els.audio.pause();
    }
  });
  els.next.addEventListener("click", next);
  els.upload.addEventListener("click", openDialog);
  els.form.addEventListener("submit", upload);
  els.cancel.addEventListener("click", closeDialog);
  els.cancelX.addEventListener("click", closeDialog);
  els.dialog.addEventListener("click", function (event) {
    if (event.target === els.dialog) {
      closeDialog();
    }
  });
  els.audio.addEventListener("play", syncButton);
  els.audio.addEventListener("pause", syncButton);
  els.audio.addEventListener("ended", function () {
    if (state.tracks.length <= 1) {
      els.audio.currentTime = 0;
      play();
      return;
    }
    next();
  });
  document.addEventListener("visibilitychange", function () {
    if (document.hidden) {
      if (!els.audio.paused) {
        state.resumeOnVisible = true;
        els.audio.pause();
      }
      return;
    }
    if (state.resumeOnVisible) {
      state.resumeOnVisible = false;
      play();
    }
  });

  loadTracks();
  fetch("/api/health", { cache: "no-store" }).then(function (response) {
    return response.ok ? response.json() : null;
  }).then(function (data) {
    if (data && data.ok) {
      state.backend = true;
      els.upload.hidden = false;
      if (!state.tracks.length) {
        els.player.hidden = false;
      }
    }
  }).catch(function () {
    /* 静态部署没有上传 API */
  });
})();
