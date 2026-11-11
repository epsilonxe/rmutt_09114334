/* Shared script for the workshop direction pages (labs/NN/index.html).
   Single source: labs/assets/ (pages link ../assets/). Everything here is a convenience; the page
   reads fine without it.
   - theme switch in the header band: shows the CURRENT mode (โหมดสว่าง / โหมดมืด); light by default,
     the choice is remembered (the page <head> applies it before first paint)
   - table of contents: highlights the section in view; below 1024px it collapses into a top bar
   - copy buttons on <pre> blocks (terminal prompts and output lines are not copied)
   - Windows / macOS / Linux segmented tabs for .os-tabs blocks; the choice is shared and remembered
   - checklist ticks (ul.checklist) remembered per page                                            */
(function () {
  "use strict";

  function store(key, value) {
    try {
      if (value === undefined) return window.localStorage.getItem(key);
      window.localStorage.setItem(key, value);
    } catch (e) { return null; }
  }

  /* ---------- theme switch ---------- */
  var THEME_KEY = "workshop-theme";
  var root = document.documentElement;
  var bandTop = document.querySelector(".band-top");
  if (bandTop) {
    var sw = document.createElement("button");
    sw.type = "button";
    sw.className = "theme-switch";
    sw.setAttribute("role", "switch");
    sw.setAttribute("title", "สลับโหมดสว่าง/มืด");
    sw.innerHTML = '<span class="track"><span class="knob" aria-hidden="true"></span></span><span class="state"></span>';
    var knob = sw.querySelector(".knob"), state = sw.querySelector(".state");
    var paint = function () {
      var dark = root.getAttribute("data-theme") === "dark";
      sw.setAttribute("aria-checked", String(dark));
      sw.setAttribute("aria-label", "โหมดมืด");
      state.textContent = dark ? "โหมดมืด" : "โหมดสว่าง";
      knob.textContent = dark ? "☾" : "☀";
    };
    sw.addEventListener("click", function () {
      var dark = root.getAttribute("data-theme") !== "dark";
      if (dark) root.setAttribute("data-theme", "dark"); else root.removeAttribute("data-theme");
      store(THEME_KEY, dark ? "dark" : "light");
      paint();
    });
    paint();
    bandTop.appendChild(sw);
  }

  /* ---------- table of contents ---------- */
  var toc = document.querySelector("nav.toc");
  if (toc) {
    var tbtn = document.createElement("button");
    tbtn.type = "button";
    tbtn.className = "toc-toggle";
    tbtn.setAttribute("aria-expanded", "false");
    tbtn.textContent = "สารบัญ";
    tbtn.addEventListener("click", function () {
      var open = !toc.classList.contains("open");
      toc.classList.toggle("open", open);
      tbtn.setAttribute("aria-expanded", String(open));
    });
    toc.insertBefore(tbtn, toc.firstChild);
    toc.classList.add("js");

    var links = {};
    toc.querySelectorAll('a[href^="#"]').forEach(function (a) {
      links[a.getAttribute("href").slice(1)] = a;
      a.addEventListener("click", function () {
        toc.classList.remove("open");
        tbtn.setAttribute("aria-expanded", "false");
      });
    });
    if ("IntersectionObserver" in window) {
      var current = null;
      var io = new IntersectionObserver(function (entries) {
        entries.forEach(function (e) {
          if (!e.isIntersecting || !links[e.target.id]) return;
          if (current) current.classList.remove("active");
          current = links[e.target.id];
          current.classList.add("active");
          tbtn.textContent = "สารบัญ · " + current.querySelector("span").textContent;
        });
      }, { rootMargin: "-20% 0px -70% 0px" });
      document.querySelectorAll("main section[id]").forEach(function (s) { io.observe(s); });
    }
  }

  /* ---------- copy buttons ---------- */
  function codeText(pre) {
    var code = pre.querySelector("code") || pre;
    var clone = code.cloneNode(true);
    clone.querySelectorAll(".prompt, .out, .err").forEach(function (n) { n.remove(); });
    return clone.textContent.replace(/^\n+|\s+$/g, "").replace(/\n{2,}/g, "\n");
  }
  document.querySelectorAll("pre").forEach(function (pre) {
    if (pre.classList.contains("nocopy")) return;
    var btn = document.createElement("button");
    btn.type = "button";
    btn.className = "copy-btn";
    btn.textContent = "คัดลอก";
    btn.addEventListener("click", function () {
      var text = codeText(pre);
      var done = function () { btn.textContent = "คัดลอกแล้ว"; setTimeout(function () { btn.textContent = "คัดลอก"; }, 1500); };
      if (navigator.clipboard && window.isSecureContext) {
        navigator.clipboard.writeText(text).then(done, function () {});
      } else {
        var ta = document.createElement("textarea");
        ta.value = text; document.body.appendChild(ta); ta.select();
        try { document.execCommand("copy"); done(); } catch (e) {}
        ta.remove();
      }
    });
    pre.appendChild(btn);
  });

  /* ---------- OS tabs ---------- */
  var OS_KEY = "workshop-os";
  var groups = document.querySelectorAll(".os-tabs");
  function guessOS() {
    var p = (navigator.userAgent || "").toLowerCase();
    if (p.indexOf("win") >= 0) return "windows";
    if (p.indexOf("mac") >= 0) return "macos";
    return "linux";
  }
  function selectOS(os) {
    groups.forEach(function (g) {
      var has = g.querySelector('.os-panel[data-os="' + os + '"]');
      var target = has ? os : g.querySelector(".os-panel").getAttribute("data-os");
      g.querySelectorAll(".os-panel").forEach(function (p) { p.classList.toggle("active", p.getAttribute("data-os") === target); });
      g.querySelectorAll(".os-bar button").forEach(function (b) { b.setAttribute("aria-selected", String(b.getAttribute("data-os") === target)); });
    });
  }
  groups.forEach(function (g) {
    var bar = document.createElement("div");
    bar.className = "os-bar";
    bar.setAttribute("role", "tablist");
    var cap = document.createElement("span");
    cap.className = "os-caption";
    cap.textContent = "ระบบปฏิบัติการ";
    bar.appendChild(cap);
    g.querySelectorAll(".os-panel").forEach(function (p) {
      var b = document.createElement("button");
      b.type = "button";
      b.setAttribute("role", "tab");
      b.setAttribute("data-os", p.getAttribute("data-os"));
      var label = p.querySelector(".os-label");
      b.textContent = label ? label.textContent : p.getAttribute("data-os");
      b.addEventListener("click", function () { store(OS_KEY, b.getAttribute("data-os")); selectOS(b.getAttribute("data-os")); });
      bar.appendChild(b);
    });
    g.insertBefore(bar, g.firstChild);
    g.classList.add("js");
  });
  if (groups.length) selectOS(store(OS_KEY) || guessOS());

  /* ---------- checklist ---------- */
  var pageKey = "workshop-check:" + location.pathname;
  var saved = {};
  try { saved = JSON.parse(store(pageKey) || "{}") || {}; } catch (e) { saved = {}; }
  document.querySelectorAll("ul.checklist input[type=checkbox]").forEach(function (box, i) {
    var id = box.id || "c" + i;
    box.checked = !!saved[id];
    box.addEventListener("change", function () { saved[id] = box.checked; store(pageKey, JSON.stringify(saved)); });
  });
})();
