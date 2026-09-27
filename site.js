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

  // Recent-purchase toast. Real orders only (from /api/recent): a country and a
  // time, never a name. Each purchase is shown once per visit, 30 s apart. With
  // no recent sales nothing appears. Not shown on the thank-you page.
  if (!/^\/thanks/.test(location.pathname)) {
    fetch("/api/recent").then(function (r) { return r.ok ? r.json() : null; }).then(function (d) {
      var events = (d && d.events) || [];
      if (!events.length) return;
      var names = window.Intl && Intl.DisplayNames ? new Intl.DisplayNames([navigator.language || "en"], { type: "region" }) : null;
      var rtf = window.Intl && Intl.RelativeTimeFormat ? new Intl.RelativeTimeFormat(navigator.language || "en", { numeric: "auto" }) : null;
      function ago(iso) {
        var s = (Date.now() - Date.parse(iso)) / 1000, units = [["day", 86400], ["hour", 3600], ["minute", 60]];
        for (var i = 0; i < units.length; i++) if (s >= units[i][1]) {
          var n = Math.floor(s / units[i][1]);
          return rtf ? rtf.format(-n, units[i][0]) : n + " " + units[i][0] + (n > 1 ? "s" : "") + " ago";
        }
        return "just now";
      }
      var toast = document.createElement("div");
      toast.className = "toast"; toast.setAttribute("role", "status"); toast.hidden = true;
      toast.innerHTML = '<img src="/assets/icon.png" alt=""><div><strong></strong><small></small></div><button type="button" aria-label="Dismiss">×</button>';
      document.body.appendChild(toast);
      var stopped = false, i = 0, hideTimer;
      toast.querySelector("button").addEventListener("click", function () { stopped = true; toast.classList.remove("show"); });
      function next() {
        if (stopped || i >= events.length) return;
        var e = events[i++], where = "";
        try { where = e.country && names ? " in " + names.of(e.country) : ""; } catch (x) {}
        toast.querySelector("strong").textContent = "Someone" + where + " bought DevPort";
        toast.querySelector("small").textContent = ago(e.at);
        toast.hidden = false;
        requestAnimationFrame(function () { toast.classList.add("show"); });
        clearTimeout(hideTimer);
        hideTimer = setTimeout(function () { toast.classList.remove("show"); }, 6000);
        setTimeout(next, 30000);
      }
      setTimeout(next, 8000);
    }).catch(function () {});
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
