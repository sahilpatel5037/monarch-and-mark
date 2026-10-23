/* Monarch & Mark — site script
 *
 * CONTACT DETAILS — the only place to edit them.
 *   fiverrUrl:    your Fiverr profile or gig link, e.g. "https://www.fiverr.com/yourname"
 *   email:        where enquiries, quotes and chat briefs are sent
 *   formEndpoint: FormSubmit address used to email briefs without a server.
 *                 Leave "" to use https://formsubmit.co/ajax/<email>. After you activate
 *                 FormSubmit you can paste the private alias it gives you here instead,
 *                 e.g. "https://formsubmit.co/ajax/abc123yourAlias", to hide your address.
 * Leave fiverrUrl as "" until your profile is ready: Fiverr buttons then open fiverr.com
 * in a new tab. Paste your profile or gig link above to point every Fiverr button at it.
 */
const CONTACT = {
  fiverrUrl: "",
  email: "sahilpatel5037@gmail.com",
  formEndpoint: ""
};

(function () {
  "use strict";
  document.documentElement.classList.add("js");

  const fiverr = (CONTACT.fiverrUrl || "").trim();
  const email = (CONTACT.email || "").trim();
  const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const validFiverr = /^https:\/\/(www\.)?fiverr\.com\//i.test(fiverr);
  const FIVERR_FALLBACK = "https://www.fiverr.com/";
  const fiverrHref = validFiverr ? fiverr : FIVERR_FALLBACK;
  const validEmail = EMAIL_RE.test(email);
  const endpoint = (CONTACT.formEndpoint || "").trim() ||
    (validEmail ? "https://formsubmit.co/ajax/" + email : "");

  function mailtoHref(subject, body) {
    if (!validEmail) return "";
    return "mailto:" + email + "?subject=" + encodeURIComponent(subject || "New project enquiry") +
      (body ? "&body=" + encodeURIComponent(body) : "");
  }

  function asText(fields) {
    return Object.keys(fields).map(function (k) { return k + ": " + fields[k]; }).join("\n");
  }

  // Sends a brief to the studio inbox through FormSubmit. Resolves { ok, message }.
  async function sendBrief(subject, fields) {
    if (!endpoint) return { ok: false, message: "not_configured" };
    const payload = Object.assign({}, fields, {
      _subject: subject,
      _template: "table",
      _captcha: "false"
    });
    if (fields.Email && EMAIL_RE.test(fields.Email)) payload._replyto = fields.Email;
    const ctrl = typeof AbortController === "function" ? new AbortController() : null;
    const timer = ctrl ? setTimeout(function () { ctrl.abort(); }, 15000) : null;
    try {
      const r = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json", "Accept": "application/json" },
        body: JSON.stringify(payload),
        signal: ctrl ? ctrl.signal : undefined
      });
      const data = await r.json().catch(function () { return {}; });
      const ok = r.ok && (data.success === true || data.success === "true");
      return { ok: ok, message: data.message || "" };
    } catch (err) {
      return { ok: false, message: "network" };
    } finally {
      if (timer) clearTimeout(timer);
    }
  }

  window.MM = {
    CONTACT: CONTACT, validEmail: validEmail, validFiverr: validFiverr, fiverrHref: fiverrHref, EMAIL_RE: EMAIL_RE,
    mailtoHref: mailtoHref, sendBrief: sendBrief, asText: asText
  };

  const reduceMotion = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  // Fiverr buttons: always open Fiverr in a new tab.
  document.querySelectorAll("[data-fiverr]").forEach(function (a) {
    a.href = fiverrHref;
    a.target = "_blank";
    a.rel = "noopener";
  });

  // Email buttons
  document.querySelectorAll("[data-email]").forEach(function (a) {
    a.href = validEmail ? mailtoHref("New project enquiry") : "#contact-form";
  });

  const note = document.querySelector("[data-contact-note]");
  if (note && !validEmail) {
    note.hidden = false;
    note.textContent = "Our studio inbox opens shortly. Please check back soon.";
  }

  // Hero headline reveal
  requestAnimationFrame(function () { requestAnimationFrame(function () { document.documentElement.classList.add("loaded"); }); });

  // Sticky nav state + mobile menu
  const nav = document.querySelector(".nav");
  const toggle = document.querySelector(".nav-toggle");
  const links = document.getElementById("nav-links");
  const onScroll = function () { nav.classList.toggle("scrolled", window.scrollY > 10); };
  onScroll();
  window.addEventListener("scroll", onScroll, { passive: true });
  function setMenu(open) {
    links.classList.toggle("open", open);
    nav.classList.toggle("menu-open", open);
    document.body.classList.toggle("modal-open", open);
    toggle.setAttribute("aria-expanded", String(open));
  }
  toggle.addEventListener("click", function () { setMenu(!links.classList.contains("open")); });
  links.querySelectorAll("a").forEach(function (a) { a.addEventListener("click", function () { setMenu(false); }); });
  document.addEventListener("keydown", function (e) { if (e.key === "Escape" && links.classList.contains("open")) setMenu(false); });

  // Active section in the nav
  const navMap = {};
  links.querySelectorAll('a[href^="#"]:not(.btn)').forEach(function (a) { navMap[a.getAttribute("href").slice(1)] = a; });
  if ("IntersectionObserver" in window) {
    const so = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        const a = navMap[en.target.id];
        if (a) a.classList.toggle("active", en.isIntersecting);
      });
    }, { rootMargin: "-45% 0px -50% 0px" });
    Object.keys(navMap).forEach(function (id) { const s = document.getElementById(id); if (s) so.observe(s); });
  }

  // Reveal on scroll
  const items = document.querySelectorAll(".reveal");
  if ("IntersectionObserver" in window && !reduceMotion) {
    const io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) { en.target.classList.add("in"); io.unobserve(en.target); }
      });
    }, { rootMargin: "0px 0px -8% 0px", threshold: 0.06 });
    items.forEach(function (el, i) {
      const sib = el.parentElement ? Array.prototype.indexOf.call(el.parentElement.children, el) : 0;
      if (sib > 0 && sib < 6) el.style.transitionDelay = (sib * 0.07) + "s";
      io.observe(el);
    });
  } else {
    items.forEach(function (el) { el.classList.add("in"); });
  }

  // Gentle parallax on the hero frames
  const frames = document.querySelectorAll("[data-parallax]");
  if (frames.length && !reduceMotion) {
    let ticking = false;
    const move = function () {
      ticking = false;
      const y = window.scrollY;
      if (y > window.innerHeight * 1.2) return;
      frames.forEach(function (f) { f.style.transform = "translate3d(0," + (y * parseFloat(f.dataset.parallax) * -1).toFixed(1) + "px,0)"; });
    };
    window.addEventListener("scroll", function () { if (!ticking) { ticking = true; requestAnimationFrame(move); } }, { passive: true });
  }

  // Quote prefill from service cards and case studies
  function quoteFor(service) {
    if (window.MMQuote) window.MMQuote.select(service);
    else window.MM_PENDING_SERVICE = service;
    const target = document.getElementById("quote");
    if (target) target.scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth", block: "start" });
    if (history.replaceState) history.replaceState(null, "", "#quote");
  }
  window.MM.quoteFor = quoteFor;
  document.querySelectorAll("[data-quote-service]").forEach(function (b) {
    b.addEventListener("click", function () {
      const card = b.closest(".svc");
      if (card) { card.classList.add("flash"); setTimeout(function () { card.classList.remove("flash"); }, 1600); }
      quoteFor(b.getAttribute("data-quote-service"));
    });
  });

  // Case study modal for concept work
  const dlg = document.getElementById("case");
  const cards = Array.prototype.slice.call(document.querySelectorAll(".work-card"));
  let current = 0;
  function fillCase(i) {
    current = (i + cards.length) % cards.length;
    const c = cards[current].dataset;
    const img = document.getElementById("case-img");
    img.src = c.full;
    img.alt = c.title + ": " + c.sub + ", concept work by Monarch & Mark";
    document.getElementById("case-kind").textContent = c.kind;
    document.getElementById("case-title").textContent = c.title;
    document.getElementById("case-sub").textContent = c.sub;
    document.getElementById("case-desc").textContent = c.desc;
    const ul = document.getElementById("case-chips");
    ul.innerHTML = "";
    (c.chips || "").split("|").filter(Boolean).forEach(function (t) { const li = document.createElement("li"); li.textContent = t; ul.appendChild(li); });
    dlg.dataset.service = c.service;
    dlg.dataset.case = c.case;
  }
  function closeCase() { if (dlg.open) dlg.close(); }
  if (dlg) {
    cards.forEach(function (card, i) {
      card.addEventListener("click", function () {
        fillCase(i);
        if (typeof dlg.showModal === "function") dlg.showModal(); else dlg.setAttribute("open", "");
        document.body.classList.add("modal-open");
      });
    });
    dlg.addEventListener("close", function () {
      document.body.classList.remove("modal-open");
      const back = cards[current];
      if (back) back.focus({ preventScroll: true });
    });
    dlg.querySelector(".case-close").addEventListener("click", closeCase);
    dlg.querySelector(".case-prev").addEventListener("click", function () { fillCase(current - 1); });
    dlg.querySelector(".case-next").addEventListener("click", function () { fillCase(current + 1); });
    dlg.addEventListener("click", function (e) { if (e.target === dlg) closeCase(); });
    dlg.addEventListener("keydown", function (e) {
      if (e.key === "ArrowRight") fillCase(current + 1);
      if (e.key === "ArrowLeft") fillCase(current - 1);
    });
    dlg.querySelector("[data-case-quote]").addEventListener("click", function () {
      const s = dlg.dataset.service;
      closeCase();
      quoteFor(s);
    });
  }

  // Contact form → studio inbox (FormSubmit), with an email-app fallback.
  const form = document.getElementById("contact-form");
  const status = form.querySelector(".form-status");
  const submitBtn = form.querySelector('button[type="submit"]');
  form.addEventListener("submit", async function (e) {
    e.preventDefault();
    let ok = true;
    ["name", "email", "message"].forEach(function (n) {
      const f = form.elements[n];
      const bad = !f.value.trim() || (n === "email" && !EMAIL_RE.test(f.value.trim()));
      f.setAttribute("aria-invalid", bad ? "true" : "false");
      if (bad) ok = false;
    });
    if (!ok) {
      status.textContent = "Please add your name, a valid email and a short message.";
      return;
    }
    if (form.elements._honey.value) return; // bot
    const d = form.elements;
    const fields = {
      Name: d.name.value.trim(),
      Email: d.email.value.trim(),
      Project: d.type.value,
      Budget: d.budget.value,
      Deadline: d.deadline.value.trim() || "Not given",
      Message: d.message.value.trim(),
      Source: "Website contact form"
    };
    if (!validEmail) {
      status.textContent = "Thanks! Our studio inbox opens shortly, so please check back soon.";
      return;
    }
    submitBtn.disabled = true;
    status.textContent = "Sending…";
    const res = await sendBrief("New enquiry: " + fields.Project + " (" + fields.Name + ")", fields);
    submitBtn.disabled = false;
    if (res.ok) {
      form.reset();
      status.textContent = "Thank you! Your brief is with us and we’ll reply by email soon.";
    } else {
      status.innerHTML = "";
      status.append("We couldn’t send that automatically. ");
      const a = document.createElement("a");
      a.href = mailtoHref("Project enquiry: " + fields.Project, asText(fields));
      a.textContent = "Email it to us instead";
      status.append(a);
    }
  });
})();
