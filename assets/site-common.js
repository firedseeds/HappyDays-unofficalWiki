(function () {
  "use strict";

  var STORAGE_KEY = "happydays-theme";

  function readTheme() {
    try {
      var saved = localStorage.getItem(STORAGE_KEY);
      return saved === "dark" || saved === "light" ? saved : null;
    } catch (error) {
      return null;
    }
  }

  function applyTheme(theme) {
    document.documentElement.setAttribute("data-theme", theme);
    document.querySelectorAll(".js-theme-toggle").forEach(function (button) {
      button.setAttribute("aria-label", theme === "dark" ? "切换到日间模式" : "切换到夜间模式");
      button.setAttribute("aria-pressed", theme === "dark" ? "true" : "false");
    });
  }

  function currentTheme() {
    return document.documentElement.getAttribute("data-theme") === "dark" ? "dark" : "light";
  }

  applyTheme(currentTheme());

  document.addEventListener("DOMContentLoaded", function () {
    applyTheme(currentTheme());
    document.querySelectorAll(".js-theme-toggle").forEach(function (button) {
      button.addEventListener("click", function () {
        var next = currentTheme() === "dark" ? "light" : "dark";
        applyTheme(next);
        try {
          localStorage.setItem(STORAGE_KEY, next);
        } catch (error) {
          /* 忽略隐私模式下的 localStorage 错误 */
        }
      });
    });
    window.addEventListener("storage", function (event) {
      if (event.key === STORAGE_KEY && (event.newValue === "dark" || event.newValue === "light")) {
        applyTheme(event.newValue);
      }
    });
  });
})();
