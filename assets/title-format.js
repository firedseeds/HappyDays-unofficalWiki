(function () {
  function colorToHex(value) {
    var color = String(value || "").trim();
    if (/^#[0-9a-f]{6}$/i.test(color)) {
      return color.toLowerCase();
    }
    var match = /^rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)/i.exec(color);
    if (!match) {
      return "";
    }
    return "#" + [match[1], match[2], match[3]].map(function (part) {
      var value = Math.max(0, Math.min(255, parseInt(part, 10)));
      return value.toString(16).padStart(2, "0");
    }).join("");
  }

  function emptyRun(text) {
    return {
      text: text,
      bold: false,
      italic: false,
      underline: false,
      strike: false,
      color: "",
      size: 0
    };
  }

  function normalize(item) {
    var rawRuns = Array.isArray(item && item.runs) ? item.runs : [];
    var runs = [];
    rawRuns.forEach(function (run) {
      if (!run || typeof run.text !== "string" || !run.text) {
        return;
      }
      var size = Number(run.size);
      if (!Number.isFinite(size) || size <= 0) {
        size = 0;
      }
      runs.push({
        text: run.text,
        bold: !!run.bold,
        italic: !!run.italic,
        underline: !!run.underline,
        strike: !!run.strike,
        color: colorToHex(run.color),
        size: size
      });
    });
    if (!runs.length) {
      var text = item && typeof item.text === "string" ? item.text : "";
      if (text) {
        runs.push(emptyRun(text));
      }
    }
    return {
      text: runs.map(function (run) { return run.text; }).join(""),
      runs: runs
    };
  }

  function applyRunStyle(element, run) {
    element.style.whiteSpace = "pre";
    element.style.fontWeight = run.bold ? "700" : "400";
    element.style.fontStyle = run.italic ? "italic" : "normal";
    if (run.size) {
      element.style.fontSize = run.size + "px";
    }
    var decoration = [];
    if (run.underline) {
      decoration.push("underline");
    }
    if (run.strike) {
      decoration.push("line-through");
    }
    if (decoration.length) {
      element.style.textDecoration = decoration.join(" ");
    }
    if (run.color) {
      element.style.color = run.color;
    }
  }

  function render(element, item) {
    var normalized = normalize(item);
    element.textContent = "";
    normalized.runs.forEach(function (run) {
      var span = document.createElement("span");
      span.textContent = run.text;
      applyRunStyle(span, run);
      element.appendChild(span);
    });
    element.title = normalized.text;
    return normalized;
  }

  function extract(element) {
    var baseColor = colorToHex(window.getComputedStyle(element).color);
    var baseSize = parseFloat(window.getComputedStyle(element).fontSize) || 0;
    var runs = [];

    function walk(node) {
      if (node.nodeType === 3) {
        var style = window.getComputedStyle(node.parentElement);
        var decoration = style.textDecorationLine || style.textDecoration || "";
        var bold = style.fontWeight === "bold" || parseInt(style.fontWeight, 10) >= 600;
        var color = colorToHex(style.color);
        var size = parseFloat(style.fontSize) || 0;
        Array.from(node.nodeValue || "").forEach(function (character) {
          if (character === "\n" || character === "\r") {
            return;
          }
          runs.push({
            text: character,
            bold: bold,
            italic: style.fontStyle === "italic",
            underline: decoration.indexOf("underline") !== -1,
            strike: decoration.indexOf("line-through") !== -1,
            color: color && color !== baseColor ? color : "",
            size: size && Math.abs(size - baseSize) > 0.1 ? size : 0
          });
        });
        return;
      }
      if (node.nodeType !== 1) {
        return;
      }
      if (node.tagName === "BR") {
        runs.push(emptyRun(" "));
        return;
      }
      Array.from(node.childNodes).forEach(walk);
    }

    Array.from(element.childNodes).forEach(walk);
    return runs;
  }

  window.HappyDaysTitleFormat = {
    normalize: normalize,
    render: render,
    extract: extract,
    colorToHex: colorToHex
  };
})();
