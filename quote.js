/* Monarch & Mark — instant quote calculator.
 * Prices come from assets/studio.json ("quote" section): edit them there.
 */
(function () {
  "use strict";
  const root = document.querySelector("[data-quote]");
  if (!root) return;

  const NAMES = { website: "Website", brand: "Logo & brand kit", deck: "Pitch deck" };
  const LEVEL_KEY = { website: "pages", brand: "concepts", deck: "slides" };
  const LEVEL_LABEL = { website: "Pages", brand: "Logo concepts", deck: "Slides" };
  const usd = function (n) { return "$" + Math.round(n).toLocaleString("en-US"); };
  const el = function (tag, attrs, html) {
    const e = document.createElement(tag);
    if (attrs) Object.keys(attrs).forEach(function (k) { e.setAttribute(k, attrs[k]); });
    if (html != null) e.innerHTML = html;
    return e;
  };

  function build(Q) {
    const state = { on: { website: true, brand: false, deck: false }, level: { website: 0, brand: 0, deck: 0 }, extras: {}, rev: 0, speed: 0 };

    root.innerHTML = "";
    const left = el("div", { class: "q-left" });
    const right = el("aside", { class: "q-sum", "aria-live": "polite" });
    root.append(left, right);

    // Step 1: services
    const s1 = el("fieldset", { class: "q-step" });
    s1.append(el("legend", null, "<span>1</span> What do you need?"));
    const svcRow = el("div", { class: "q-svcs" });
    Object.keys(NAMES).forEach(function (id) {
      const lab = el("label", { class: "q-svc" });
      lab.innerHTML = '<input type="checkbox" name="q-svc" value="' + id + '"' + (state.on[id] ? " checked" : "") + '>' +
        '<span class="q-svc-box"><b>' + NAMES[id] + '</b><small>from ' + usd(Q[id].base) + '</small></span>';
      svcRow.append(lab);
    });
    s1.append(svcRow);
    left.append(s1);

    // Step 2: per-service options
    const s2 = el("div", { class: "q-step q-opts" });
    s2.append(el("p", { class: "q-legend" }, "<span>2</span> Tailor it"));
    const panels = {};
    Object.keys(NAMES).forEach(function (id) {
      const p = el("fieldset", { class: "q-panel", "data-svc": id });
      p.append(el("legend", { class: "q-panel-t" }, NAMES[id]));
      const lvl = el("div", { class: "q-seg", role: "radiogroup", "aria-label": LEVEL_LABEL[id] });
      Q[id][LEVEL_KEY[id]].forEach(function (o, i) {
        const l = el("label");
        l.innerHTML = '<input type="radio" name="q-lvl-' + id + '" value="' + i + '"' + (i === 0 ? " checked" : "") + '><span>' + o.label +
          (o.add ? ' <em>+' + usd(o.add) + '</em>' : "") + '</span>';
        lvl.append(l);
      });
      p.append(el("p", { class: "q-sub" }, LEVEL_LABEL[id]), lvl);
      const ex = el("div", { class: "q-chips" });
      Q[id].extras.forEach(function (o) {
        const l = el("label");
        l.innerHTML = '<input type="checkbox" name="q-ex" value="' + id + ":" + o.id + '"><span>' + o.label + ' <em>+' + usd(o.add) + '</em></span>';
        ex.append(l);
      });
      p.append(el("p", { class: "q-sub" }, "Extras"), ex);
      panels[id] = p;
      s2.append(p);
    });
    left.append(s2);

    // Step 3: revisions + speed
    const s3 = el("fieldset", { class: "q-step" });
    s3.append(el("legend", null, "<span>3</span> Revisions &amp; speed"));
    const rev = el("div", { class: "q-seg", role: "radiogroup", "aria-label": "Revisions" });
    Q.revisions.forEach(function (o, i) {
      const l = el("label");
      l.innerHTML = '<input type="radio" name="q-rev" value="' + i + '"' + (i === 0 ? " checked" : "") + '><span>' + o.label +
        (o.add_per_service ? ' <em>+' + usd(o.add_per_service) + '/service</em>' : "") + '</span>';
      rev.append(l);
    });
    const spd = el("div", { class: "q-seg", role: "radiogroup", "aria-label": "Delivery speed" });
    Q.speed.forEach(function (o, i) {
      const l = el("label");
      l.innerHTML = '<input type="radio" name="q-speed" value="' + i + '"' + (i === 0 ? " checked" : "") + '><span>' + o.label +
        (o.mult > 1 ? ' <em>+' + Math.round((o.mult - 1) * 100) + '%</em>' : "") + '</span>';
      spd.append(l);
    });
    s3.append(el("p", { class: "q-sub" }, "Revision rounds"), rev, el("p", { class: "q-sub" }, "Delivery speed"), spd);
    left.append(s3);

    // Summary
    right.innerHTML =
      '<p class="q-sum-k">Your estimate</p>' +
      '<p class="q-total"><span data-q-total>$0</span> <small>USD</small></p>' +
      '<ul class="q-lines" data-q-lines></ul>' +
      '<p class="q-note">' + Q.note + '</p>' +
      '<button type="button" class="btn btn-gold q-send" data-q-open>Send this brief</button>' +
      '<form class="q-form" data-q-form hidden novalidate>' +
        '<label class="sr" for="q-name">Your name</label><input id="q-name" name="name" placeholder="Your name" autocomplete="name" required>' +
        '<label class="sr" for="q-email">Email</label><input id="q-email" name="email" type="email" placeholder="Email" autocomplete="email" required>' +
        '<label class="sr" for="q-deadline">Deadline</label><input id="q-deadline" name="deadline" placeholder="Deadline (optional)">' +
        '<label class="sr" for="q-notes">Notes</label><textarea id="q-notes" name="notes" rows="3" placeholder="Anything we should know? (optional)"></textarea>' +
        '<input type="text" name="_honey" class="hp" tabindex="-1" autocomplete="off" aria-hidden="true">' +
        '<button type="submit" class="btn btn-gold">Send brief</button>' +
      '</form>' +
      '<p class="q-status" role="status" aria-live="polite" data-q-status></p>';

    const totalEl = right.querySelector("[data-q-total]");
    const linesEl = right.querySelector("[data-q-lines]");
    const sendBtn = right.querySelector("[data-q-open]");
    const qform = right.querySelector("[data-q-form]");
    const qstatus = right.querySelector("[data-q-status]");

    function compute() {
      const lines = [];
      let sub = 0;
      const services = Object.keys(NAMES).filter(function (id) { return state.on[id]; });
      services.forEach(function (id) {
        const lvl = Q[id][LEVEL_KEY[id]][state.level[id]];
        let price = Q[id].base + lvl.add;
        const ex = Q[id].extras.filter(function (o) { return state.extras[id + ":" + o.id]; });
        ex.forEach(function (o) { price += o.add; });
        sub += price;
        lines.push({ label: NAMES[id] + " · " + lvl.label + (ex.length ? " + " + ex.map(function (o) { return o.label; }).join(", ") : ""), amount: price });
      });
      const r = Q.revisions[state.rev];
      if (r.add_per_service && services.length) {
        sub += r.add_per_service * services.length;
        lines.push({ label: "Revisions · " + r.label, amount: r.add_per_service * services.length });
      }
      const s = Q.speed[state.speed];
      let total = sub;
      if (s.mult > 1 && services.length) {
        total = sub * s.mult;
        lines.push({ label: "Delivery · " + s.label + " (+" + Math.round((s.mult - 1) * 100) + "%)", amount: total - sub });
      }
      return { services: services, lines: lines, total: total, revisions: r.label, speed: s.label };
    }

    function render() {
      Object.keys(panels).forEach(function (id) { panels[id].hidden = !state.on[id]; });
      const c = compute();
      totalEl.textContent = usd(c.total);
      linesEl.innerHTML = "";
      if (!c.services.length) {
        linesEl.append(el("li", { class: "q-empty" }, "Choose at least one service."));
      } else {
        c.lines.forEach(function (l) {
          const li = el("li");
          li.append(el("span", null, ""), el("b", null, usd(l.amount)));
          li.firstChild.textContent = l.label;
          linesEl.append(li);
        });
      }
      sendBtn.disabled = !c.services.length;
      root.dataset.total = String(Math.round(c.total));
      return c;
    }

    root.addEventListener("change", function (e) {
      const t = e.target;
      if (t.name === "q-svc") state.on[t.value] = t.checked;
      else if (t.name.indexOf("q-lvl-") === 0) state.level[t.name.slice(6)] = +t.value;
      else if (t.name === "q-ex") state.extras[t.value] = t.checked;
      else if (t.name === "q-rev") state.rev = +t.value;
      else if (t.name === "q-speed") state.speed = +t.value;
      else return;
      render();
    });

    sendBtn.addEventListener("click", function () {
      qform.hidden = false;
      sendBtn.hidden = true;
      qform.querySelector("input").focus();
    });

    qform.addEventListener("submit", async function (e) {
      e.preventDefault();
      const MM = window.MM;
      const name = qform.elements.name.value.trim();
      const mail = qform.elements.email.value.trim();
      qform.elements.name.setAttribute("aria-invalid", name ? "false" : "true");
      qform.elements.email.setAttribute("aria-invalid", MM.EMAIL_RE.test(mail) ? "false" : "true");
      if (!name || !MM.EMAIL_RE.test(mail)) { qstatus.textContent = "Please add your name and a valid email."; return; }
      if (qform.elements._honey.value) return;
      const c = compute();
      const fields = {
        Name: name,
        Email: mail,
        Services: c.services.map(function (id) { return NAMES[id]; }).join(", "),
        Breakdown: c.lines.map(function (l) { return l.label + " = " + usd(l.amount); }).join(" | "),
        "Estimated total": usd(c.total) + " USD",
        Revisions: c.revisions,
        Speed: c.speed,
        Deadline: qform.elements.deadline.value.trim() || "Not given",
        Notes: qform.elements.notes.value.trim() || "None",
        Source: "Instant quote calculator"
      };
      if (!MM.validEmail) { qstatus.textContent = "Thanks! Our inbox opens shortly, so please check back soon."; return; }
      const btn = qform.querySelector("button");
      btn.disabled = true;
      qstatus.textContent = "Sending…";
      const res = await MM.sendBrief("New quote request: " + usd(c.total) + " (" + name + ")", fields);
      btn.disabled = false;
      if (res.ok) {
        qform.hidden = true;
        qstatus.textContent = "Sent! We’ll confirm your fixed price by email soon.";
      } else {
        qstatus.innerHTML = "";
        qstatus.append("We couldn’t send that automatically. ");
        const a = document.createElement("a");
        a.href = MM.mailtoHref("Quote request: " + usd(c.total), MM.asText(fields));
        a.textContent = "Email it to us instead";
        qstatus.append(a);
      }
    });

    render();
  }

  fetch("assets/studio.json", { cache: "no-cache" })
    .then(function (r) { if (!r.ok) throw new Error(r.status); return r.json(); })
    .then(function (d) { build(d.quote); window.MM_STUDIO = d; document.dispatchEvent(new CustomEvent("mm:studio", { detail: d })); })
    .catch(function () {
      root.innerHTML = '<p class="fine">The calculator couldn’t load. Please use the contact form below and we’ll send a quote.</p>';
    });
})();
