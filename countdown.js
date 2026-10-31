/* Monarch & Mark — launch countdown + gold dust (runs before the page paints) */
(function () {
  var root = document.documentElement;
  var calm = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ---- gold dust, shared with the hero ---- */
  window.MMDust = function (canvas, opts) {
    if (!canvas || !canvas.getContext) return { stop: function () {} };
    opts = opts || {};
    var ctx = canvas.getContext("2d"), dpr = Math.min(window.devicePixelRatio || 1, 2);
    var W = 0, H = 0, parts = [], running = false, raf = 0, visible = true, mouse = null;
    function size() {
      var r = canvas.getBoundingClientRect();
      W = Math.max(1, r.width); H = Math.max(1, r.height);
      canvas.width = W * dpr; canvas.height = H * dpr; ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      var n = Math.min(opts.max || 90, Math.round(W * H / (opts.density || 14000)));
      parts = []; for (var i = 0; i < n; i++) parts.push(spawn(true));
    }
    function spawn(any) {
      var big = Math.random() < 0.12;
      return { x: Math.random() * W, y: any ? Math.random() * H : H + 10, r: big ? 2 + Math.random() * 2.6 : 0.5 + Math.random() * 1.5,
        vy: 0.12 + Math.random() * 0.42, ph: Math.random() * 6.28, sp: 0.004 + Math.random() * 0.012, a: 0.25 + Math.random() * 0.6, big: big };
    }
    function draw(t) {
      ctx.clearRect(0, 0, W, H);
      for (var i = 0; i < parts.length; i++) {
        var p = parts[i];
        if (running) { p.y -= p.vy; p.ph += p.sp; p.x += Math.sin(p.ph) * 0.25; if (p.y < -10) parts[i] = p = spawn(false); }
        var tw = 0.55 + 0.45 * Math.sin(p.ph * 3);
        var a = p.a * tw * Math.min(1, (H - Math.abs(p.y - H * 0.5) * 0.9) / H + 0.3);
        if (mouse) { var dx = p.x - mouse.x, dy = p.y - mouse.y, d = Math.sqrt(dx * dx + dy * dy); if (d < 140) a = Math.min(1, a + (1 - d / 140) * 0.6); }
        if (p.big) {
          var g = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.r * 3);
          g.addColorStop(0, "rgba(228,202,146," + (a * 0.55).toFixed(3) + ")"); g.addColorStop(1, "rgba(196,161,98,0)");
          ctx.fillStyle = g; ctx.beginPath(); ctx.arc(p.x, p.y, p.r * 3, 0, 6.283); ctx.fill();
        } else {
          ctx.fillStyle = "rgba(228,202,146," + a.toFixed(3) + ")"; ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, 6.283); ctx.fill();
        }
      }
    }
    function loop(t) { draw(t); if (running) raf = requestAnimationFrame(loop); }
    function start() { if (running || calm || !visible || document.hidden) return; running = true; raf = requestAnimationFrame(loop); }
    function pause() { running = false; cancelAnimationFrame(raf); }
    size(); draw(0);
    window.addEventListener("resize", function () { size(); if (!running) draw(0); });
    document.addEventListener("visibilitychange", function () { document.hidden ? pause() : start(); });
    if ("IntersectionObserver" in window) new IntersectionObserver(function (e) { visible = e[0].isIntersecting; visible ? start() : pause(); }).observe(canvas);
    if (opts.mouseTarget && window.matchMedia("(pointer:fine)").matches) {
      opts.mouseTarget.addEventListener("pointermove", function (e) { var r = canvas.getBoundingClientRect(); mouse = { x: e.clientX - r.left, y: e.clientY - r.top }; });
      opts.mouseTarget.addEventListener("pointerleave", function () { mouse = null; });
    }
    start();
    return { stop: pause, start: start };
  };

  /* ---- countdown ---- */
  var C = window.MM_CONFIG || {};
  var q; try { q = new URLSearchParams(location.search); } catch (e) { q = { get: function () { return null; } }; }
  var force = q.get("countdown") === "1";
  var preview = q.get("preview") === "1";
  try {
    if (preview) sessionStorage.setItem("mm_preview", "1");
    else if (!force && sessionStorage.getItem("mm_preview") === "1") preview = true;
  } catch (e) {}
  window.MM_PREVIEW = preview || force;
  var target = Date.parse(q.get("launch") || C.LAUNCH_AT);
  if (isNaN(target) || (!force && (preview || Date.now() >= target))) return;

  root.classList.add("cd-on");
  window.MM_COUNTDOWN = true;

  function pad(n) { return n < 10 ? "0" + n : String(n); }

  document.addEventListener("DOMContentLoaded", function () {
    var el = document.getElementById("launch");
    if (!el) { root.classList.remove("cd-on"); return; }
    el.hidden = false;
    var cells = {}; el.querySelectorAll(".tv").forEach(function (c) { cells[c.getAttribute("data-u")] = c; });
    var dateEl = document.getElementById("launch-date");
    try {
      dateEl.textContent = new Intl.DateTimeFormat("en-IN", { timeZone: "Asia/Kolkata", weekday: "long", day: "numeric", month: "long", year: "numeric", hour: "numeric", minute: "2-digit", hour12: true }).format(new Date(target)).replace(/\b(am|pm)\b/, function (m) { return m.toUpperCase(); }) + " IST";
    } catch (e) {}
    var noteEl = document.getElementById("launch-note");
    if (noteEl && C.LAUNCH_NOTE) { noteEl.textContent = C.LAUNCH_NOTE; noteEl.hidden = false; }
    var dust = window.MMDust(el.querySelector(".launch-dust"), { max: 110, density: 11000, mouseTarget: el });
    var done = false, timer = 0;

    function set(u, v) {
      var c = cells[u]; if (!c || c.textContent === v) return;
      c.textContent = v;
      if (!calm) { c.classList.remove("tick"); void c.offsetWidth; c.classList.add("tick"); }
    }
    function tick() {
      var left = Math.max(0, target - Date.now());
      var s = Math.floor(left / 1000);
      set("d", pad(Math.floor(s / 86400))); set("h", pad(Math.floor(s % 86400 / 3600)));
      set("m", pad(Math.floor(s % 3600 / 60))); set("s", pad(s % 60));
      if (left <= 0 && !done) { done = true; clearInterval(timer); open(); }
    }
    function open() {
      el.classList.add("opening");
      setTimeout(function () {
        el.classList.add("open"); root.classList.add("cd-reveal");
        setTimeout(function () {
          dust.stop(); el.remove(); root.classList.remove("cd-on", "cd-reveal");
          window.MM_COUNTDOWN = false;
          document.dispatchEvent(new CustomEvent("mm:launched"));
        }, calm ? 50 : 1700);
      }, calm ? 50 : 1100);
    }
    tick(); timer = setInterval(tick, 250);
  });
})();
