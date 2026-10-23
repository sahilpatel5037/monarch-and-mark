/* Monarch & Mark — site script
 *
 * CONTACT DETAILS — the only place to edit them.
 *   fiverrUrl:    your Fiverr profile or gig link, e.g. "https://www.fiverr.com/yourname"
 *   email:        where enquiries, quotes and chat briefs are sent
 *   formEndpoint: FormSubmit address used to email briefs without a server.
 *                 Leave "" to use https://formsubmit.co/ajax/<email>. After you activate
 *                 FormSubmit you can paste the private alias it gives you here instead,
 *                 e.g. "https://formsubmit.co/ajax/abc123yourAlias", to hide your address.
 * Leave fiverrUrl as "" until it's ready: Fiverr buttons then scroll to the contact form.
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
    CONTACT: CONTACT, validEmail: validEmail, validFiverr: validFiverr, EMAIL_RE: EMAIL_RE,
    mailtoHref: mailtoHref, sendBrief: sendBrief, asText: asText
  };

  // Fiverr buttons
  document.querySelectorAll("[data-fiverr]").forEach(function (a) {
    if (validFiverr) {
      a.href = fiverr;
      a.target = "_blank";
      a.rel = "noopener";
    } else {
      a.href = "#contact";
    }
  });

  // Email buttons
  document.querySelectorAll("[data-email]").forEach(function (a) {
    a.href = validEmail ? mailtoHref("New project enquiry") : "#contact-form";
  });

  const note = document.querySelector("[data-contact-note]");
  if (note && !validFiverr) {
    note.hidden = false;
    note.textContent = validEmail
      ? "Our Fiverr profile opens soon. Until then, email us or use the form."
      : "Our Fiverr profile and studio inbox open shortly. Please check back soon.";
  }

  // Sticky nav state + mobile menu
  const nav = document.querySelector(".nav");
  const toggle = document.querySelector(".nav-toggle");
  const links = document.getElementById("nav-links");
  const onScroll = function () { nav.classList.toggle("scrolled", window.scrollY > 10); };
  onScroll();
  window.addEventListener("scroll", onScroll, { passive: true });
  function closeMenu() {
    links.classList.remove("open");
    nav.classList.remove("menu-open");
    toggle.setAttribute("aria-expanded", "false");
  }
  toggle.addEventListener("click", function () {
    const open = !links.classList.contains("open");
    links.classList.toggle("open", open);
    nav.classList.toggle("menu-open", open);
    toggle.setAttribute("aria-expanded", String(open));
  });
  links.querySelectorAll("a").forEach(function (a) { a.addEventListener("click", closeMenu); });
  document.addEventListener("keydown", function (e) { if (e.key === "Escape") closeMenu(); });

  // Reveal on scroll
  const items = document.querySelectorAll(".reveal");
  if ("IntersectionObserver" in window) {
    const io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) { en.target.classList.add("in"); io.unobserve(en.target); }
      });
    }, { rootMargin: "0px 0px -8% 0px", threshold: 0.08 });
    items.forEach(function (el) { io.observe(el); });
  } else {
    items.forEach(function (el) { el.classList.add("in"); });
  }

  // Lightbox for concept work
  const dlg = document.getElementById("lightbox");
  const img = document.getElementById("lb-img");
  const cap = document.getElementById("lb-cap");
  if (dlg && typeof dlg.showModal === "function") {
    document.querySelectorAll(".work-media").forEach(function (btn) {
      btn.addEventListener("click", function () {
        img.src = btn.dataset.full;
        img.alt = btn.querySelector("img").alt;
        cap.textContent = btn.dataset.title;
        dlg.showModal();
      });
    });
    dlg.querySelector(".lb-close").addEventListener("click", function () { dlg.close(); });
    dlg.addEventListener("click", function (e) { if (e.target === dlg) dlg.close(); });
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
