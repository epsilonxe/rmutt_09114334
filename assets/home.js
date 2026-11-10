/* Course homepage script; everything here is a convenience and the page reads fine without it.
   - theme switch in the top nav: the label shows the CURRENT mode (โหมดสว่าง / โหมดมืด); light by
     default, the choice is shared with the workshop pages (localStorage "workshop-theme") and the
     page <head> applies it before first paint
   - nav highlight: marks the link of the section in view with aria-current                        */
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

  /* ---------- nav highlight ---------- */
  if (!("IntersectionObserver" in window)) return;
  var links = {};
  document.querySelectorAll(".navlinks a[href^='#']").forEach(function (a) { links[a.getAttribute("href").slice(1)] = a; });
  var visible = {};
  var io = new IntersectionObserver(function (entries) {
    entries.forEach(function (e) { visible[e.target.id] = e.isIntersecting; });
    var current = null;
    Object.keys(links).forEach(function (id) { if (!current && visible[id]) current = id; });
    Object.keys(links).forEach(function (id) {
      if (id === current) links[id].setAttribute("aria-current", "true"); else links[id].removeAttribute("aria-current");
    });
  }, { rootMargin: "-80px 0px -55% 0px" });
  Object.keys(links).forEach(function (id) { var el = document.getElementById(id); if (el) io.observe(el); });
})();
