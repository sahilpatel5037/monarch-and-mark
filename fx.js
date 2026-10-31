/* Monarch & Mark — background extras (live).
   ?fx=          default: icons + cursor glow + countdown shimmer
   ?fx=map       dotted world map with gold arcs from India
   ?fx=monogram  M&M monogram line-draw reveal
   ?fx=all       everything · ?fx=none  plain background video */
(function () {
  "use strict";
  var q = new URLSearchParams(location.search);
  var mode = (q.get("fx") || "default").toLowerCase();
  var SETS = {
    "default": ["icons", "cursor", "shimmer"],
    map: ["map"], monogram: ["monogram"],
    all: ["icons", "cursor", "shimmer", "map", "monogram"], none: []
  };
  var on = {};
  (SETS[mode] || mode.split(",")).forEach(function (k) { on[k] = true; });
  var root = document.documentElement;
  var calm = window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches;
  var fine = window.matchMedia && matchMedia("(hover: hover) and (pointer: fine)").matches;
  var small = Math.min(innerWidth, innerHeight) < 600;
  var NS = "http://www.w3.org/2000/svg";
  if (on.shimmer) root.classList.add("fx-shimmer");

  function hosts() {
    var out = [];
    var l = document.getElementById("launch");
    if (l) out.push(l);
    var h = document.querySelector(".hero");
    if (h) out.push(h);
    return out;
  }
  function layer(host, cls) {
    var d = document.createElement("div");
    d.className = "fx-layer " + cls;
    d.setAttribute("aria-hidden", "true");
    var film = host.querySelector(".mm-film");
    if (host.classList.contains("hero")) {
      var glow = host.querySelector(".hero-glow");
      host.insertBefore(d, glow ? glow.nextSibling : host.firstChild);
    } else if (film && film.nextSibling) host.insertBefore(d, film.nextSibling);
    else host.appendChild(d);
    return d;
  }
  // visible-only rAF helper (pauses offscreen / hidden tab)
  function loopWhileVisible(el, frame) {
    var vis = true, raf = 0, last = 0;
    function tick(t) {
      raf = 0;
      if (!el.isConnected) return;
      frame(t, t - (last || t)); last = t;
      if (vis && !document.hidden) raf = requestAnimationFrame(tick);
    }
    function go() { if (!raf && vis && !document.hidden && el.isConnected) { last = 0; raf = requestAnimationFrame(tick); } }
    if ("IntersectionObserver" in window) new IntersectionObserver(function (e) { vis = e[0].isIntersecting; go(); }).observe(el);
    document.addEventListener("visibilitychange", go);
    go();
    return go;
  }

  /* ---------- 1 · floating line icons ---------- */
  var ICONS = [
    '<rect x="3" y="4.5" width="18" height="15" rx="2"/><path d="M3 8.5h18"/><circle cx="6" cy="6.5" r=".5"/><circle cx="8" cy="6.5" r=".5"/><path d="M7 12h6M7 15h9"/>',
    '<rect x="2.5" y="5" width="19" height="14" rx="2.5"/><path d="M10 9.2v5.6l4.8-2.8z"/>',
    '<path d="M12 3l5 6-5 12-5-12z"/><path d="M12 9v5"/><circle cx="12" cy="15.3" r="1.2"/><path d="M7 9h10"/>',
    '<path d="M8.5 7.5L3.5 12l5 4.5M15.5 7.5l5 4.5-5 4.5M13.5 5.5l-3 13"/>',
    '<path d="M3.5 10v4h3l7 4V6l-7 4z"/><path d="M6.5 14l1.5 5h2.5l-1.3-4.3"/><path d="M17 9.5a3.5 3.5 0 010 5"/><path d="M19 7.5a6.5 6.5 0 010 9"/>',
    '<path d="M3.5 20.5h17"/><path d="M6 17v-4M10 17v-7M14 17v-5M18 17V7"/><path d="M5 10l5-4 4 3 5-5"/>',
    '<rect x="4" y="3" width="10" height="18" rx="2"/><path d="M8 18h2"/><path d="M17 7.5l3-1.5v12l-3-1.5"/>',
    '<path d="M4 20l3.5-1 11-11-2.5-2.5-11 11z"/><path d="M14.5 6.5l2.5 2.5"/><path d="M14 20h6"/>'
  ];
  function iconField(host) {
    var L = layer(host, "fx-icons");
    var isLaunch = host.id === "launch";
    var W = host.clientWidth || innerWidth, H = host.clientHeight || innerHeight;
    var cols = small ? 3 : 5, rows = small ? 4 : 3;
    var items = [], k = 0;
    for (var r = 0; r < rows; r++) for (var c = 0; c < cols; c++) {
      var cx = (c + .5) / cols, cy = (r + .5) / rows;
      // keep the very centre of the countdown clear of icons
      if (isLaunch && !small && c > 0 && c < cols - 1 && r === 1) continue;
      if (isLaunch && small && c === 1 && (r === 1 || r === 2)) continue;
      var x = (cx + (Math.random() - .5) * .6 / cols) * W;
      var y = (cy + (Math.random() - .5) * .6 / rows) * H;
      var s = (small ? 30 : 38) + Math.random() * (small ? 18 : 30);
      var depth = .3 + Math.random() * .9;
      var wrap = document.createElement("div");
      wrap.className = "fx-ic";
      wrap.style.cssText = "--s:" + s.toFixed(0) + "px;--o:" + (.11 + depth * .08).toFixed(2) +
        ";--d:" + (18 + Math.random() * 16).toFixed(1) + "s;--dl:" + (-Math.random() * 20).toFixed(1) +
        "s;--dx:" + ((Math.random() < .5 ? -1 : 1) * (14 + Math.random() * 26)).toFixed(0) +
        "px;--dy:" + (-(16 + Math.random() * 30)).toFixed(0) + "px;--r:" + (3 + Math.random() * 8).toFixed(1) + "deg";
      wrap.innerHTML = '<svg viewBox="0 0 24 24">' + ICONS[k++ % ICONS.length] + "</svg>";
      L.appendChild(wrap);
      items.push({ el: wrap, x: x - s / 2, y: y - s / 2, d: depth });
    }
    var tx = 0, ty = 0, px = 0, py = 0;
    function place() {
      for (var i = 0; i < items.length; i++) {
        var it = items[i];
        it.el.style.transform = "translate3d(" + (it.x + px * it.d * 26).toFixed(1) + "px," + (it.y + py * it.d * 20).toFixed(1) + "px,0)";
      }
    }
    place();
    if (calm) return;
    // slow parallax: pointer on desktop, scroll on everything
    if (fine) addEventListener("pointermove", function (e) { tx = e.clientX / innerWidth - .5; ty = e.clientY / innerHeight - .5; }, { passive: true });
    var go = loopWhileVisible(L, function () {
      var sy = isLaunch ? 0 : Math.min(scrollY / innerHeight, 1.5) * -1.6;
      var nx = px + (tx - px) * .04, ny = py + ((ty + sy) - py) * .04;
      if (Math.abs(nx - px) + Math.abs(ny - py) > .0004) { px = nx; py = ny; place(); }
    });
  }

  /* ---------- 3 · cursor glow + trail / touch auto glow ---------- */
  function cursorFx() {
    if (!fine) {
      hosts().forEach(function (h) { var L = layer(h, "fx-touch"); var g = document.createElement("div"); g.className = "fx-auto"; L.appendChild(g); });
      return;
    }
    var glow = document.createElement("div"); glow.className = "fx-glow"; glow.setAttribute("aria-hidden", "true");
    document.body.appendChild(glow);
    var cv = null, ctx = null, dpr = Math.min(devicePixelRatio || 1, 2), parts = [];
    if (!calm) {
      cv = document.createElement("canvas"); cv.className = "fx-trail"; cv.setAttribute("aria-hidden", "true");
      document.body.appendChild(cv); ctx = cv.getContext("2d");
      var size = function () { cv.width = innerWidth * dpr; cv.height = innerHeight * dpr; };
      size(); addEventListener("resize", size);
    }
    var mx = innerWidth / 2, my = innerHeight / 2, gx = mx, gy = my, lx = -1, ly = -1, raf = 0, idle = 0;
    function frame() {
      raf = 0;
      gx += (mx - gx) * .14; gy += (my - gy) * .14;
      glow.style.transform = "translate3d(" + gx.toFixed(1) + "px," + gy.toFixed(1) + "px,0)";
      if (ctx) {
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        ctx.clearRect(0, 0, innerWidth, innerHeight);
        for (var i = parts.length - 1; i >= 0; i--) {
          var p = parts[i]; p.life -= .022;
          if (p.life <= 0) { parts.splice(i, 1); continue; }
          p.x += p.vx; p.y += p.vy; p.vy -= .012;
          ctx.globalAlpha = p.life * p.life * .85;
          ctx.fillStyle = p.c;
          ctx.beginPath(); ctx.arc(p.x, p.y, p.r * (.4 + p.life * .6), 0, 6.283); ctx.fill();
        }
        ctx.globalAlpha = 1;
      }
      var settling = Math.abs(mx - gx) + Math.abs(my - gy) > .5;
      if (parts.length || settling) raf = requestAnimationFrame(frame);
    }
    addEventListener("pointermove", function (e) {
      if (e.pointerType && e.pointerType !== "mouse" && e.pointerType !== "pen") return;
      mx = e.clientX; my = e.clientY; glow.classList.add("on");
      if (ctx) {
        var dx = mx - lx, dy = my - ly, dist = lx < 0 ? 0 : Math.sqrt(dx * dx + dy * dy);
        var n = Math.min(3, Math.floor(dist / 14));
        for (var i = 0; i < n && parts.length < 70; i++) {
          parts.push({ x: mx - dx * Math.random(), y: my - dy * Math.random(), vx: (Math.random() - .5) * .5, vy: (Math.random() - .5) * .5 - .15,
            r: .8 + Math.random() * 1.6, life: .7 + Math.random() * .3, c: Math.random() < .3 ? "#F7E7C2" : "#D4B26E" });
        }
        if (dist > 14 || lx < 0) { lx = mx; ly = my; }
      }
      if (!raf) raf = requestAnimationFrame(frame);
    }, { passive: true });
    document.addEventListener("pointerleave", function () { glow.classList.remove("on"); });
    document.documentElement.addEventListener("mouseleave", function () { glow.classList.remove("on"); });
  }

  /* ---------- 2 · dotted world map + gold arcs ---------- */
  var MASK = "00001f3fcffffc004000e01fc0200000003fbfc07ff800000301fff6300083c03ffbf87ff8000c063fffffff8087ffffffbc3ff0007f8fffffffffffefffffffbe3f0e00ffffffffffffff07fffffdbc1c0403ffffffffffffff07fffff83a0c0003dfffffffffff7c0183fffc3f000023dfffffffffe0e00000ffffbf800073ffffffffffc0c000007fffffc0007ffffffffffff08000007fffffc0003ffffffffffff00000003fffff40001fffffffffffd00000003ffffe00007ffcf7ffffff900000003ffff8000079fff3ffffff300000001fffe0000070d7fbfffffe200000001fffe000003f03fffffff2e00000000fffc000007f91fffffff98000000007ff800000fffffffffff80000000003f0c00001fffffffffff80000000003f0000001fffffffffff80000000000f0c00003ffff7f1fffe0000000000076380003fffffe0f9f8000000000003e000003ffffbe0f1f08000000000007800003fffff8060f880000000000011c0003fffff8060784000000000000ff0001fffff80604040000000000003fc000fffff80004340000000000003fe00001fff0000e700000000000007ff00001ffe00006fe0000000000007ffe0001ffc00006f9e000000000007fff0000ff800003087a00000000007fff8000ff800001c03800000000003fff0000ffc00000000400000000003ffe0000ffc8000001d000000000001ffe0000ffd8000007d800000000000ffe0000ff3800000ff800000000000ffe0000ff3000003ffc10000000000ff800007f3000003ffe00000000000ff000007e0000003ffe00000000000ff000007e0000003ffe00000000000fe000003c0000003ffe00000000000fc0000020000000307c00000000001f80000000000000001c02000000001e00000000000000000006000000001e0000000000000000080c000000001c00000000000000000008000000001c00000000000000000000000000001880000000000000000000000000001c00000000000000000000000000000000000000000000000000", MW = 120, MH = 50, LAT0 = 78, LAT1 = -58;
  var HUB = [72.57, 23.03]; // Ahmedabad, India
  var CITIES = [[-74.0, 40.7], [-0.13, 51.5], [55.3, 25.2], [103.8, 1.35], [151.2, -33.9], [-79.4, 43.7], [13.4, 52.5], [-46.6, -23.5], [139.7, 35.7], [-118.2, 34.05]];
  function landAt(cx, cy) {
    var row = MASK.substr(cy * (MW / 4), MW / 4);
    var nib = parseInt(row.charAt(cx >> 2), 16);
    return (nib >> (3 - (cx & 3))) & 1;
  }
  function mapFx(host) {
    var L = layer(host, "fx-mapwrap");
    var cv = document.createElement("canvas"); cv.className = "fx-map"; L.appendChild(cv);
    var ctx = cv.getContext("2d"), dpr = Math.min(devicePixelRatio || 1, 2);
    var base = document.createElement("canvas"), bctx = base.getContext("2d");
    var W, H, sx, sy, ox, oy, arcs = [], t0 = performance.now(), isHero = host.classList.contains("hero");
    function proj(lon, lat) {
      return [ox + (lon + 180) / 360 * MW * sx, oy + (LAT0 - lat) / (LAT0 - LAT1) * MH * sy];
    }
    function build() {
      W = L.clientWidth || innerWidth; H = L.clientHeight || innerHeight;
      cv.width = base.width = Math.round(W * dpr); cv.height = base.height = Math.round(H * dpr);
      var portrait = H > W * 1.1;
      sx = portrait ? Math.max(W / 62, H * .62 / (MH * .91)) : Math.max(W / MW, H * .8 / (MH * .91));
      if (!portrait) sx = Math.min(sx, W * 1.05 / MW);
      sy = sx * .91;
      var mapW = MW * sx, mapH = MH * sy;
      // centre India-ish on narrow screens, the whole world on wide ones
      var focus = portrait ? (HUB[0] - 8 + 180) / 360 * mapW : mapW / 2;
      ox = W / 2 - focus; oy = (H - mapH) / 2 + (isHero ? H * .04 : -H * .02);
      bctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      bctx.clearRect(0, 0, W, H);
      var r = Math.max(.9, Math.min(1.6, sx * .12));
      for (var y = 0; y < MH; y++) for (var x = 0; x < MW; x++) {
        if (!landAt(x, y)) continue;
        var px = ox + (x + .5) * sx, py = oy + (y + .5) * sy;
        if (px < -4 || px > W + 4) continue;
        var dxh = px - proj(HUB[0], HUB[1])[0], dyh = py - proj(HUB[0], HUB[1])[1];
        var near = Math.max(0, 1 - Math.sqrt(dxh * dxh + dyh * dyh) / (sx * 18));
        bctx.globalAlpha = .28 + near * .25;
        bctx.fillStyle = near > .05 ? "#D9BC80" : "#B39558";
        bctx.beginPath(); bctx.arc(px, py, r, 0, 6.283); bctx.fill();
      }
      bctx.globalAlpha = 1;
      var h = proj(HUB[0], HUB[1]);
      arcs = CITIES.map(function (c, i) {
        var e = proj(c[0], c[1]);
        var mx = (h[0] + e[0]) / 2, my = (h[1] + e[1]) / 2;
        var d = Math.sqrt((e[0] - h[0]) * (e[0] - h[0]) + (e[1] - h[1]) * (e[1] - h[1]));
        return { a: h, b: e, c: [mx, my - d * .32], delay: i * 1.15, on: e[0] > -20 && e[0] < W + 20 && e[1] > -20 && e[1] < H + 20 };
      });
    }
    function qb(a, c, b, t) {
      var u = 1 - t;
      return [u * u * a[0] + 2 * u * t * c[0] + t * t * b[0], u * u * a[1] + 2 * u * t * c[1] + t * t * b[1]];
    }
    function drawArc(ar, from, to, alpha) {
      ctx.globalAlpha = alpha;
      ctx.beginPath();
      var p = qb(ar.a, ar.c, ar.b, from); ctx.moveTo(p[0], p[1]);
      for (var s = 1; s <= 28; s++) { p = qb(ar.a, ar.c, ar.b, from + (to - from) * s / 28); ctx.lineTo(p[0], p[1]); }
      ctx.stroke();
    }
    build();
    var rt = 0; addEventListener("resize", function () { clearTimeout(rt); rt = setTimeout(build, 200); });
    var CYCLE = CITIES.length * 1.15 + 3.5;
    function draw(now) {
      var t = (now - t0) / 1000;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, W, H);
      ctx.drawImage(base, 0, 0, W, H);
      ctx.lineCap = "round";
      var h = proj(HUB[0], HUB[1]);
      for (var i = 0; i < arcs.length; i++) {
        var ar = arcs[i]; if (!ar.on) continue;
        var lt = calm ? 3 : ((t - ar.delay) % CYCLE + CYCLE) % CYCLE; // seconds into this arc's cycle
        var grow = Math.min(1, lt / 2.2), fade = lt < 6.5 ? 1 : Math.max(0, 1 - (lt - 6.5) / 1.6);
        if (fade <= 0) continue;
        var e = grow * grow * (3 - 2 * grow);
        ctx.strokeStyle = "#C4A162"; ctx.lineWidth = 1.1;
        drawArc(ar, 0, e, .5 * fade);
        if (!calm && grow < 1) { // bright travelling head
          ctx.strokeStyle = "#F7E7C2"; ctx.lineWidth = 1.8;
          drawArc(ar, Math.max(0, e - .12), e, .9 * fade);
        }
        if (grow >= 1) { // destination ping
          var pr = calm ? 0 : (lt - 2.2) % 2.4;
          ctx.globalAlpha = .85 * fade; ctx.fillStyle = "#E4CA92";
          ctx.beginPath(); ctx.arc(ar.b[0], ar.b[1], 2.4, 0, 6.283); ctx.fill();
          if (!calm) {
            ctx.globalAlpha = Math.max(0, .55 * (1 - pr / 2.4)) * fade; ctx.strokeStyle = "#E4CA92"; ctx.lineWidth = 1;
            ctx.beginPath(); ctx.arc(ar.b[0], ar.b[1], 3 + pr * 7, 0, 6.283); ctx.stroke();
          }
        }
      }
      // India hub: steady glow + pulse
      var pulse = calm ? .5 : (Math.sin(t * 1.8) + 1) / 2;
      var g = ctx.createRadialGradient(h[0], h[1], 0, h[0], h[1], 26 + pulse * 10);
      g.addColorStop(0, "rgba(247,231,194,.55)"); g.addColorStop(1, "rgba(196,161,98,0)");
      ctx.globalAlpha = 1; ctx.fillStyle = g;
      ctx.beginPath(); ctx.arc(h[0], h[1], 36, 0, 6.283); ctx.fill();
      ctx.fillStyle = "#F7E7C2"; ctx.beginPath(); ctx.arc(h[0], h[1], 3.2, 0, 6.283); ctx.fill();
      ctx.globalAlpha = 1;
    }
    if (calm) { draw(performance.now()); addEventListener("resize", function () { setTimeout(function () { draw(performance.now()); }, 260); }); return; }
    var lastDraw = 0;
    loopWhileVisible(L, function (now) { if (now - lastDraw > 32) { lastDraw = now; draw(now); } }); // ~30 fps is plenty for slow arcs
  }

  /* ---------- 5 · monogram reveal ---------- */
  function monoFx(host) {
    var L = layer(host, "fx-monowrap");
    var m = document.createElement("div"); m.className = "fx-mono";
    m.innerHTML = '<svg viewBox="2 0 60 64" aria-hidden="true"><defs><radialGradient id="fxmg' + (host.id || "h") + '"><stop offset="0" stop-color="#E4CA92" stop-opacity=".42"/><stop offset="1" stop-color="#C4A162" stop-opacity="0"/></radialGradient></defs>' +
      '<circle class="mg" cx="32" cy="33" r="30" fill="url(#fxmg' + (host.id || "h") + ')"/>' +
      '<path class="mp" pathLength="1" d="M12 50 V21 L22.5 35 L32 16 L41.5 35 L52 21 V50"/>' +
      '<path class="mp mb" pathLength="1" d="M8 56.5 H56"/>' +
      '<circle class="md" cx="12" cy="14.5" r="1.5"/><circle class="md" cx="32" cy="9.5" r="1.5"/><circle class="md" cx="52" cy="14.5" r="1.5"/></svg>';
    L.appendChild(m);
    if (!calm) setTimeout(function () { m.classList.add("done"); }, 5600);
  }

  function boot() {
    var hs = hosts();
    hs.forEach(function (h) {
      if (on.map) mapFx(h);
      if (on.monogram) monoFx(h);
      if (on.icons) iconField(h);
    });
    if (on.cursor) cursorFx();
    root.setAttribute("data-fx", Object.keys(on).join(" ") || "none");
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot); else boot();
})();
