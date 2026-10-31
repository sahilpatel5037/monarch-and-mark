/* Monarch & Mark — studio hub */
(function () {
  var root = document.documentElement;
  root.classList.remove("no-js");
  root.classList.add("js");
  var C = window.MM_CONFIG || {};
  var calm = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var fine = window.matchMedia && window.matchMedia("(pointer:fine)").matches;

  var nav = document.querySelector(".nav");
  var toggle = document.querySelector(".nav-toggle");
  var links = document.getElementById("nav-links");
  var bar = document.querySelector(".progress span");

  function onScroll() {
    if (nav) nav.classList.toggle("scrolled", window.scrollY > 24);
    if (bar) { var h = document.documentElement.scrollHeight - window.innerHeight; bar.style.transform = "scaleX(" + (h > 0 ? Math.min(1, window.scrollY / h) : 0) + ")"; }
  }
  onScroll();
  window.addEventListener("scroll", onScroll, { passive: true });

  function setOpen(open) {
    document.body.classList.toggle("nav-open", open);
    if (toggle) { toggle.setAttribute("aria-expanded", String(open)); toggle.setAttribute("aria-label", open ? "Close menu" : "Open menu"); }
  }
  if (toggle) toggle.addEventListener("click", function () { setOpen(!document.body.classList.contains("nav-open")); });
  if (links) links.addEventListener("click", function (e) { if (e.target.closest("a")) setOpen(false); });
  document.addEventListener("keydown", function (e) { if (e.key === "Escape") setOpen(false); });

  /* stagger children of grids */
  document.querySelectorAll(".cards,.svc-grid,.steps,.stat-grid,.plans,.faq-list").forEach(function (g) {
    var kids = g.querySelectorAll(":scope > .reveal");
    kids.forEach(function (k, i) { k.style.transitionDelay = (i % 3) * 110 + "ms"; });
  });

  /* counters */
  function count(el) {
    var n = parseInt(el.getAttribute("data-count"), 10); if (isNaN(n)) return;
    if (calm) { el.textContent = n; return; }
    var t0 = null, dur = 1500;
    function step(t) { if (!t0) t0 = t; var p = Math.min(1, (t - t0) / dur), e = 1 - Math.pow(1 - p, 3); el.textContent = Math.round(n * e); if (p < 1) requestAnimationFrame(step); }
    requestAnimationFrame(step);
  }
  var counters = document.querySelectorAll("[data-count]");

  var items = document.querySelectorAll(".reveal");
  if ("IntersectionObserver" in window) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) { if (en.isIntersecting) { en.target.classList.add("in"); io.unobserve(en.target); } });
    }, { rootMargin: "0px 0px -8% 0px", threshold: 0.08 });
    items.forEach(function (el) { io.observe(el); });
    if (!calm) counters.forEach(function (c) { c.textContent = "0"; });
    var co = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) { if (en.isIntersecting) { count(en.target); co.unobserve(en.target); } });
    }, { threshold: 0.4 });
    counters.forEach(function (c) { co.observe(c); });
  } else {
    items.forEach(function (el) { el.classList.add("in"); });
  }

  /* hero: intro, dust, parallax */
  var hero = document.querySelector(".hero");
  function intro() { root.classList.add("ready"); }
  if (window.MM_COUNTDOWN) document.addEventListener("mm:launched", function () { setTimeout(intro, 60); });
  else requestAnimationFrame(function () { requestAnimationFrame(intro); });
  /* hero background film: starts once the countdown is gone (no download while the countdown covers it) */
  var heroFilmBox = hero && hero.querySelector(".hero-film");
  if (window.MMFilm && heroFilmBox) {
    if (window.MM_COUNTDOWN) document.addEventListener("mm:launched", function () { window.MMFilm(heroFilmBox); });
    else window.MMFilm(heroFilmBox);
  }
  if (window.MMDust && hero) window.MMDust(hero.querySelector(".hero-dust"), { max: fine ? 80 : 40, density: 16000, mouseTarget: hero });

  var stage = document.querySelector(".hero-stage");
  if (stage && fine && !calm) {
    hero.addEventListener("pointermove", function (e) {
      var r = hero.getBoundingClientRect();
      var x = (e.clientX - r.left) / r.width - 0.5, y = (e.clientY - r.top) / r.height - 0.5;
      stage.style.transform = "rotateY(" + (x * 6).toFixed(2) + "deg) rotateX(" + (-y * 6).toFixed(2) + "deg)";
    });
    hero.addEventListener("pointerleave", function () { stage.style.transform = ""; });
  }

  /* card glare + tilt */
  if (fine && !calm) {
    document.querySelectorAll(".card,.plan,.svc,.stat").forEach(function (c) {
      c.addEventListener("pointermove", function (e) {
        var r = c.getBoundingClientRect(), x = (e.clientX - r.left) / r.width, y = (e.clientY - r.top) / r.height;
        c.style.setProperty("--mx", (x * 100).toFixed(1) + "%"); c.style.setProperty("--my", (y * 100).toFixed(1) + "%");
        if (c.classList.contains("card") || c.classList.contains("plan")) c.style.transform = "translateY(-6px) perspective(900px) rotateX(" + ((0.5 - y) * 4).toFixed(2) + "deg) rotateY(" + ((x - 0.5) * 4).toFixed(2) + "deg)";
      });
      c.addEventListener("pointerleave", function () { c.style.transform = ""; });
    });
  }

  /* WhatsApp */
  var wa = String(C.WHATSAPP_NUMBER || "").replace(/\D/g, "");
  document.querySelectorAll("[data-wa]").forEach(function (a) {
    if (wa) {
      a.href = "https://wa.me/" + wa + "?text=" + encodeURIComponent(C.WHATSAPP_TEXT || "Hi Monarch & Mark");
      a.target = "_blank"; a.rel = "noopener"; a.hidden = false;
    } else if (window.MM_PREVIEW) {
      a.hidden = false; a.title = "WhatsApp number to be added before launch"; a.classList.add("wa-pending");
    }
  });

  /* package buttons preselect the form */
  var planSel = document.getElementById("f-plan");
  document.querySelectorAll("[data-plan]").forEach(function (b) {
    b.addEventListener("click", function () { if (planSel) planSel.value = b.getAttribute("data-plan"); });
  });

  /* brief form -> email */
  var form = document.getElementById("brief");
  if (form) form.addEventListener("submit", function (e) {
    e.preventDefault();
    var bad = null;
    form.querySelectorAll("[required]").forEach(function (f) { var ok = f.value.trim() && (f.type !== "email" || /.+@.+\..+/.test(f.value)); f.classList.toggle("err", !ok); if (!ok && !bad) bad = f; });
    var note = form.querySelector(".brief-note");
    if (bad) { bad.focus(); if (note) note.textContent = "Please fill in your name, a valid email and a few words about the project."; return; }
    var v = function (n) { return form.elements[n].value.trim(); };
    var subject = "Project brief: " + v("service") + " (" + v("name") + ")";
    var body = "Name: " + v("name") + "\nEmail: " + v("email") + "\nService: " + v("service") + "\nPackage: " + v("plan") + "\n\n" + v("message");
    window.location.href = "mailto:sahilpatel5037@gmail.com?subject=" + encodeURIComponent(subject) + "&body=" + encodeURIComponent(body);
    if (note) note.textContent = "Your email app should open with the brief ready to send. If it doesn't, write to sahilpatel5037@gmail.com.";
  });

  document.querySelectorAll("[data-copy]").forEach(function (b) {
    b.addEventListener("click", function () {
      var t = b.getAttribute("data-copy");
      var done = function () { b.textContent = "Copied"; setTimeout(function () { b.textContent = "Copy"; }, 1800); };
      if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(t).then(done, function () {});
    });
  });

  var yr = document.getElementById("yr");
  if (yr) yr.textContent = String(new Date().getFullYear());
})();
