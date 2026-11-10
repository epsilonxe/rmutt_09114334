/* Course homepage script; everything here is a convenience and the page reads fine without it.
   - theme switch in the top nav: the label shows the CURRENT mode (โหมดสว่าง / โหมดมืด); light by
     default, the choice is shared with the workshop pages (localStorage "workshop-theme") and the
     page <head> applies it before first paint
   - course info tabs (schedule / assessment / references): click, arrow keys, and nav links or
     hashes to #schedule etc. open the matching tab; without JS the panels show stacked
   - nav highlight: marks the link of the section (or active tab) in view with aria-current
   - hero animation: see heroStage() below                                                        */
(function () {
  "use strict";
  var KEY = "workshop-theme", root = document.documentElement;

  /* ---------- theme switch ---------- */
  var slot = document.getElementById("theme-slot");
  if (slot) {
    var btn = document.createElement("button");
    btn.type = "button"; btn.className = "theme-switch";
    btn.innerHTML = '<span class="dot" aria-hidden="true"></span><span class="label"></span>';
    var render = function () {
      var dark = root.getAttribute("data-theme") === "dark";
      btn.querySelector(".label").textContent = dark ? "โหมดมืด" : "โหมดสว่าง";
      btn.setAttribute("aria-pressed", dark ? "true" : "false");
      btn.setAttribute("aria-label", dark ? "โหมดมืด เปลี่ยนเป็นโหมดสว่าง" : "โหมดสว่าง เปลี่ยนเป็นโหมดมืด");
    };
    btn.addEventListener("click", function () {
      var dark = root.getAttribute("data-theme") !== "dark";
      if (dark) root.setAttribute("data-theme", "dark"); else root.removeAttribute("data-theme");
      try { localStorage.setItem(KEY, dark ? "dark" : "light"); } catch (e) {}
      render();
    });
    render();
    slot.appendChild(btn);
  }

  /* ---------- hero: source -> compile -> page ---------- */
  heroStage();

  /* nav links by target id, and which observed sections are in view (used by updateNav below) */
  var links = {}, visible = {};
  document.querySelectorAll(".navlinks a[href^='#']").forEach(function (a) { links[a.getAttribute("href").slice(1)] = a; });

  /* ---------- course info tabs ---------- */
  var tabs = [].slice.call(document.querySelectorAll('.tabs [role="tab"]'));
  var tabbox = tabs.length ? tabs[0].closest(".tabs") : null, info = document.getElementById("info");
  var activeTab = tabs.length ? tabs[0].getAttribute("aria-controls") : null;
  var isTab = function (id) { return tabs.some(function (t) { return t.getAttribute("aria-controls") === id; }); };
  function activate(id, focus) {
    if (!isTab(id)) return;
    activeTab = id;
    tabs.forEach(function (t) {
      var on = t.getAttribute("aria-controls") === id;
      t.setAttribute("aria-selected", on ? "true" : "false");
      t.tabIndex = on ? 0 : -1;
      if (on && focus) t.focus();
      document.getElementById(t.getAttribute("aria-controls")).hidden = !on;
    });
    updateNav();
  }
  if (tabbox) {
    tabbox.querySelector(".tablist").hidden = false;
    tabbox.classList.add("js-tabs");
    tabs.forEach(function (t, i) {
      t.addEventListener("click", function () { activate(t.getAttribute("aria-controls")); });
      t.addEventListener("keydown", function (e) {
        var j = e.key === "ArrowRight" ? (i + 1) % tabs.length : e.key === "ArrowLeft" ? (i - 1 + tabs.length) % tabs.length
              : e.key === "Home" ? 0 : e.key === "End" ? tabs.length - 1 : -1;
        if (j < 0) return;
        e.preventDefault(); activate(tabs[j].getAttribute("aria-controls"), true);
      });
    });
    /* a link or hash to #schedule / #assessment / #references opens that tab and scrolls to the card */
    var openHash = function (smooth) {
      var id = location.hash.slice(1);
      if (!isTab(id)) return false;
      activate(id);
      if (!info) return true;
      var go = function () { info.scrollIntoView({ behavior: smooth ? "smooth" : "auto" }); };
      /* on first load, scroll after the browser's own fragment scroll (which targets the panel) */
      if (document.readyState === "complete") go();
      else window.addEventListener("load", function () { setTimeout(go, 0); });
      return true;
    };
    document.addEventListener("click", function (e) {
      var a = e.target.closest && e.target.closest('a[href^="#"]');
      if (!a) return;
      var id = a.getAttribute("href").slice(1);
      if (!isTab(id)) return;
      e.preventDefault();
      activate(id);
      if (info) info.scrollIntoView({ behavior: "smooth" });
      try { history.replaceState(null, "", "#" + id); } catch (err) {}
    });
    window.addEventListener("hashchange", function () { openHash(true); });
    if (!openHash(false)) activate(activeTab);
  }

  /* ---------- nav highlight ---------- */
  /* #topics highlights its link; while #info is in view, the link of the active tab is highlighted */
  function updateNav() {
    var current = visible.topics ? "topics" : visible.info ? activeTab : null;
    Object.keys(links).forEach(function (id) {
      if (id === current) links[id].setAttribute("aria-current", "true"); else links[id].removeAttribute("aria-current");
    });
  }
  if (!("IntersectionObserver" in window)) return;
  var io = new IntersectionObserver(function (entries) {
    entries.forEach(function (e) { visible[e.target.id] = e.isIntersecting; });
    updateNav();
  }, { rootMargin: "-80px 0px -55% 0px" });
  ["topics", "info"].forEach(function (id) { var el = document.getElementById(id); if (el) io.observe(el); });

  /* The hero stage types a LaTeX snippet, "compiles" it, builds the typeset page, holds, fades and
     moves to the next snippet. The HTML ships the final frame of snippet 1, which is what no-JS,
     narrow screens (stage hidden) and prefers-reduced-motion see. Pauses while the hero is
     off-screen or the tab is hidden. Edit SNIPPETS to change what is typed and shown. */
  function heroStage() {
    var stage = document.getElementById("hero-stage"), hero = document.querySelector(".hero");
    if (!stage || !hero || !window.requestAnimationFrame) return;
    if (window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    var bars = function (spec) {   /* "LLs" -> two full lines and a short one, with stagger index */
      return spec.split("").map(function (c) { return '<div class="pe pg-line' + (c === "s" ? " s" : "") + '" style="--i:%"></div>'; }).join("");
    };
    var idx = function (html) { var i = 0; return html.replace(/--i:%/g, function () { return "--i:" + (4 + (i++ >> 1)); }); };
    var SNIPPETS = [
      { file: "article.tex",
        code: "\\documentclass{article}\n\\title{Professional Documents}\n\\author{RMUTT 09114334}\n\\begin{document}\n\\maketitle\n\\section{Introduction}\nTypesetting is an art.\n\\end{document}",
        cls: "page",
        page: '<div class="pe pg-title" style="--i:0">Professional Documents</div><div class="pe pg-author" style="--i:1">RMUTT 09114334</div>' +
              '<div class="pe pg-sec" style="--i:2"><b>1</b>Introduction</div><div class="pe" style="--i:3">Typesetting is an art.</div>' +
              idx(bars("LLLsLLs")) + '<div class="pe pg-num" style="--i:8">1</div>' },
      { file: "math.tex",
        code: "\\documentclass{article}\n\\usepackage{amsmath}\n\\begin{document}\n\\section{Grading}\n% t-score of a total x\n\\begin{equation}\n  t = 50 + 10\\,\\frac{x-u}{s}\n\\end{equation}\n\\end{document}",
        cls: "page",
        page: '<div class="pe pg-sec" style="--i:0"><b>1</b>Grading</div>' +
              '<div class="pe pg-line" style="--i:1"></div><div class="pe pg-line s" style="--i:1"></div>' +
              '<div class="pe pg-eq" style="--i:2"><i>t</i>&nbsp;=&nbsp;50&nbsp;+&nbsp;10<span class="frac"><span class="numer"><i>x</i> − <i>u</i></span><span class="denom"><i>s</i></span></span><span class="no">(1)</span></div>' +
              '<div class="pe pg-line" style="--i:3"></div><div class="pe pg-line" style="--i:3"></div><div class="pe pg-line s" style="--i:4"></div>' +
              '<div class="pe pg-line" style="--i:5"></div><div class="pe pg-line" style="--i:5"></div><div class="pe pg-line s" style="--i:6"></div>' +
              '<div class="pe pg-num" style="--i:6">1</div>' },
      { file: "slides.tex",
        code: "\\documentclass{beamer}\n\\begin{document}\n\\begin{frame}{Why LaTeX?}\n  \\begin{itemize}\n    \\item Beautiful mathematics\n    \\item Consistent style\n    \\item Reproducible documents\n  \\end{itemize}\n\\end{frame}\n\\end{document}",
        cls: "page slide",
        page: '<div class="pg-slide"><div class="pe pg-slide-title" style="--i:0">Why LaTeX?</div><ul>' +
              '<li class="pe" style="--i:1">Beautiful mathematics</li><li class="pe" style="--i:2">Consistent style</li>' +
              '<li class="pe" style="--i:3">Reproducible documents</li></ul></div><div class="pe pg-num" style="--i:4">1 / 1</div>' }
    ];
    var T = { char: 36, space: 10, line: 200, compile: 2000, finish: 650, build: 1300, hold: 5000, fade: 650, gap: 350 };
    /* uneven compile progress: [time fraction, progress] knots (a stall, like loading packages) */
    var KNOTS = [[0, 0], [.22, .38], [.40, .44], [.68, .81], [.80, .86], [1, 1]];
    var progress = function (f) {
      for (var i = 1; i < KNOTS.length; i++) if (f <= KNOTS[i][0]) {
        var a = KNOTS[i - 1], b = KNOTS[i]; return a[1] + (b[1] - a[1]) * (f - a[0]) / (b[0] - a[0]);
      }
      return 1;
    };

    var text = stage.querySelector(".ed-text"), gutter = stage.querySelector(".ed-gutter"),
        file = stage.querySelector(".ed-file"), status = stage.querySelector(".ed-status"),
        stText = stage.querySelector(".st-text"), stPct = stage.querySelector(".st-pct"),
        stBar = stage.querySelector(".st-bar"), stOut = stage.querySelector(".st-out"),
        page = stage.querySelector(".page"), pulse = stage.querySelector(".page-pulse");
    var setP = function (f) { stBar.style.setProperty("--p", (f * 100).toFixed(1) + "%"); stPct.textContent = Math.round(f * 100) + "%"; };

    var esc = function (s) { return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;"); };
    var highlight = function (s) {
      return esc(s).replace(/(%[^\n]*)|(\\[A-Za-z]+)|([{}\[\]])/g, function (m, com, cmd, br) {
        return com ? '<span class="tk-com">' + com + "</span>" : cmd ? '<span class="tk-cmd">' + cmd + "</span>" : '<span class="tk-br">' + br + "</span>";
      });
    };
    var lines = function (n) { var a = []; for (var i = 1; i <= n; i++) a.push(i); return a.join("\n"); };

    /* per-snippet schedule: the time (ms from snippet start) at which each character appears */
    var cur, at, typed, phase, t, pos, shown;
    function load(k) {
      cur = SNIPPETS[k]; at = []; var acc = 0, code = cur.code;
      for (var i = 0; i < code.length; i++) {
        var prev = code[i - 1];
        acc += prev === "\n" ? T.line : (code[i] === " " && (prev === " " || prev === "\n")) ? T.space : T.char;
        at.push(acc);
      }
      typed = acc; t = 0; pos = -1; phase = "type"; shown = "";
      file.textContent = cur.file;
      page.className = cur.cls + " empty"; page.innerHTML = cur.page;
      status.className = "ed-status"; stText.textContent = "● editing " + cur.file; setP(0);
      stOut.textContent = cur.file.replace(".tex", ".pdf");
      pulse.className = "page-pulse" + (cur.cls.indexOf("slide") >= 0 ? " slide" : "");
      render(0);
      stage.classList.remove("fading");
    }
    function render(n) {
      if (n === pos) return; pos = n;
      var s = cur.code.slice(0, n);
      text.innerHTML = highlight(s) + '<span class="caret"></span>';
      gutter.textContent = lines(s.split("\n").length);
    }

    var k = 0, running = false, last = 0, onScreen = true;
    function step(now) {
      if (!running) return;
      var dt = Math.min(now - last, 100); last = now; t += dt;   /* clamp so a pause never skips ahead */
      if (phase === "type") {
        var n = 0; while (n < at.length && at[n] <= t) n++;
        render(n);
        if (n >= at.length) { phase = "compile"; t = 0; stText.textContent = "$ pdflatex " + cur.file; status.className = "ed-status compiling"; }
      } else if (phase === "compile") {
        setP(progress(Math.min(1, t / T.compile)));
        if (t >= T.compile) { phase = "finish"; t = 0; setP(1); status.className = "ed-status done"; }
      } else if (phase === "finish") {          /* green flash, then collapse into the badge + pulse */
        if (t >= T.finish) {
          phase = "build"; t = 0; status.className = "ed-status ok";
          pulse.classList.remove("go"); void pulse.offsetWidth; pulse.classList.add("go");
          page.className = cur.cls; void page.offsetWidth; page.className = cur.cls + " built";
        }
      } else if (phase === "build") {
        if (t >= T.build + T.hold) { phase = "fade"; t = 0; stage.classList.add("fading"); }
      } else if (phase === "fade") {
        if (t >= T.fade + T.gap) { k = (k + 1) % SNIPPETS.length; load(k); }
      }
      requestAnimationFrame(step);
    }
    function setRunning(on) {
      var visible = onScreen && !document.hidden;
      hero.classList.toggle("paused", !visible);   /* orbs + caret */
      on = on && visible && getComputedStyle(stage).display !== "none";
      if (on === running) return;
      running = on;
      if (on) { last = performance.now(); requestAnimationFrame(step); }
    }

    /* start from the shipped final frame of snippet 1: hold it, then fade into snippet 2 */
    load(0); render(cur.code.length); phase = "build"; t = T.build;
    setP(1); stText.textContent = "$ pdflatex " + cur.file; status.className = "ed-status ok"; page.className = cur.cls + " built";

    if ("IntersectionObserver" in window) {
      new IntersectionObserver(function (e) { onScreen = e[0].isIntersecting; setRunning(true); }).observe(hero);
    }
    document.addEventListener("visibilitychange", function () { setRunning(true); });
    window.addEventListener("resize", function () { setRunning(true); });
    setRunning(true);
  }
})();
