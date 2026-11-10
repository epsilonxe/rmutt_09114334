/* Course homepage: light/dark switch only; the page reads fine without it.
   The choice is shared with the workshop pages (localStorage "workshop-theme"); the page <head>
   applies a stored dark choice before first paint. The label shows the CURRENT mode. */
(function () {
  "use strict";
  var KEY = "workshop-theme", root = document.documentElement;
  var slot = document.getElementById("theme-slot");
  if (!slot) return;
  var btn = document.createElement("button");
  btn.type = "button"; btn.className = "theme-switch";
  btn.innerHTML = '<span class="dot" aria-hidden="true"></span><span class="label"></span>';
  function render() {
    var dark = root.getAttribute("data-theme") === "dark";
    btn.querySelector(".label").textContent = dark ? "โหมดมืด" : "โหมดสว่าง";
    btn.setAttribute("aria-pressed", dark ? "true" : "false");
    btn.title = dark ? "เปลี่ยนเป็นโหมดสว่าง" : "เปลี่ยนเป็นโหมดมืด";
  }
  btn.addEventListener("click", function () {
    var dark = root.getAttribute("data-theme") !== "dark";
    if (dark) root.setAttribute("data-theme", "dark"); else root.removeAttribute("data-theme");
    try { localStorage.setItem(KEY, dark ? "dark" : "light"); } catch (e) {}
    render();
  });
  render();
  slot.appendChild(btn);
})();
