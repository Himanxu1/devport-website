// DevPort site: theme toggle, live launch-slot counter, sticky-nav border.
(function () {
  var root = document.documentElement;

  // Theme: follows the Mac's setting until the visitor picks one.
  function effective() {
    return root.dataset.theme || (matchMedia("(prefers-color-scheme: light)").matches ? "light" : "dark");
  }
  document.querySelectorAll(".theme-toggle").forEach(function (btn) {
    btn.addEventListener("click", function () {
      var next = effective() === "dark" ? "light" : "dark";
      root.dataset.theme = next;
      try { localStorage.setItem("theme", next); } catch (e) {}
      btn.setAttribute("aria-label", next === "dark" ? "Switch to light mode" : "Switch to dark mode");
    });
  });

  var nav = document.querySelector("nav");
  if (nav && !nav.classList.contains("scrolled")) {
    addEventListener("scroll", function () { nav.classList.toggle("scrolled", scrollY > 8); }, { passive: true });
  }

  // Live counter. Real numbers from /api/slots, or nothing: if the endpoint
  // fails the counter stays hidden rather than showing an invented number.
  var slots = document.querySelectorAll("[data-slots]");
  if (!slots.length) return;
  fetch("/api/slots", { cache: "no-store" }).then(function (r) { return r.ok ? r.json() : null; }).then(function (d) {
    if (!d) return;
    var text;
    if (d.launch && d.left > 0) {
      text = "<b>" + d.left + "</b> of " + d.limit + " left at this price";
    } else if (d.launch) {
      text = "Launch price almost gone. It goes up to " + d.regularPrice + " next";
    } else {
      text = "Launch price sold out. All " + d.limit + " went";
    }
    slots.forEach(function (el) { el.querySelector("span").innerHTML = text; el.hidden = false; });
    document.querySelectorAll("[data-price]").forEach(function (el) { el.textContent = d.price; });
    document.querySelectorAll("[data-was]").forEach(function (el) { el.hidden = d.launch; });
  }).catch(function () {});
})();
