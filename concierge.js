/* Monarch & Mark — "Monarch Concierge" chat + voice widget ("Ask the studio").
 * Answers come from /api/chat (a Vercel function) and fall back to built-in answers
 * drawn from assets/studio.json whenever the live service isn't available. Leads are emailed
 * through window.MM.sendBrief (see CONTACT in script.js).
 * Voice: speech-to-text with the browser's SpeechRecognition, replies read aloud with
 * speechSynthesis. The mic only appears where the browser supports it. No cost.
 */
(function () {
  "use strict";
  const CROWN = '<svg viewBox="0 0 64 64" aria-hidden="true"><path d="M12 50 V21 L22.5 35 L32 16 L41.5 35 L52 21 V50" fill="none" stroke="currentColor" stroke-width="4.4" stroke-linejoin="miter" stroke-miterlimit="10" stroke-linecap="square"/><circle cx="12" cy="14.5" r="3" fill="currentColor"/><circle cx="32" cy="9.5" r="3" fill="currentColor"/><circle cx="52" cy="14.5" r="3" fill="currentColor"/><path d="M8 56.5 H56" stroke="currentColor" stroke-width="2.4"/></svg>';
  const MIC = '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="9" y="3" width="6" height="11" rx="3" fill="none" stroke="currentColor" stroke-width="1.8"/><path d="M5.5 11a6.5 6.5 0 0 0 13 0M12 17.5V21M8.5 21h7" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>';
  const SEND = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 12h14M12 5l7 7-7 7" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>';
  const SPK_ON = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 9.5h3.5L12 5.5v13l-4.5-4H4z" fill="currentColor"/><path d="M15.5 9a4 4 0 0 1 0 6M18 6.5a7.5 7.5 0 0 1 0 11" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>';
  const SPK_OFF = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 9.5h3.5L12 5.5v13l-4.5-4H4z" fill="currentColor"/><path d="M16 9.5l5 5M21 9.5l-5 5" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>';

  const MM = window.MM || {};
  let studio = window.MM_STUDIO || null;
  document.addEventListener("mm:studio", function (e) { studio = e.detail; });
  function getStudio() {
    if (studio) return Promise.resolve(studio);
    return fetch("assets/studio.json").then(function (r) { return r.json(); }).then(function (d) { studio = d; return d; }).catch(function () { return null; });
  }

  // ---------- UI ----------
  const wrap = document.createElement("div");
  wrap.className = "mma";
  wrap.innerHTML =
    '<button class="mma-launch" type="button" aria-expanded="false" aria-controls="mma-panel">' +
      '<span class="mma-launch-ic">' + CROWN + '</span><span class="mma-launch-t">Ask the studio</span></button>' +
    '<section class="mma-panel" id="mma-panel" role="dialog" aria-label="Monarch Concierge" hidden>' +
      '<header class="mma-head"><span class="mma-av">' + CROWN + '</span>' +
        '<div class="mma-id"><b>Monarch Concierge</b><small data-mma-sub>Ask the studio · replies instantly</small></div>' +
        '<button class="mma-ic mma-spk" type="button" aria-pressed="false" aria-label="Read replies aloud" title="Read replies aloud">' + SPK_OFF + '</button>' +
        '<button class="mma-ic mma-x" type="button" aria-label="Close concierge">×</button></header>' +
      '<div class="mma-log" role="log" aria-live="polite"></div>' +
      '<div class="mma-chips"></div>' +
      '<form class="mma-form" autocomplete="off">' +
        '<label class="sr" for="mma-in">Message</label>' +
        '<input id="mma-in" class="mma-in" placeholder="Ask a question or start your project" maxlength="600">' +
        '<button class="mma-ic mma-mic" type="button" aria-label="Speak your question" title="Speak" hidden>' + MIC + '</button>' +
        '<button class="mma-ic mma-go" type="submit" aria-label="Send">' + SEND + '</button>' +
      '</form>' +
      '<p class="mma-foot">Answers are a guide. Final prices are confirmed by the studio.</p>' +
    '</section>';
  document.body.appendChild(wrap);

  const launch = wrap.querySelector(".mma-launch");
  const panel = wrap.querySelector(".mma-panel");
  const log = wrap.querySelector(".mma-log");
  const chipsEl = wrap.querySelector(".mma-chips");
  const form = wrap.querySelector(".mma-form");
  const input = wrap.querySelector(".mma-in");
  const micBtn = wrap.querySelector(".mma-mic");
  const spkBtn = wrap.querySelector(".mma-spk");
  const sub = wrap.querySelector("[data-mma-sub]");

  const history = []; // {role, text}
  let mode = "live"; // "live" until the API says otherwise, then "faq"
  let brief = null; // active brief-collection state
  let started = false;
  let busy = false;

  function open() {
    panel.hidden = false;
    wrap.classList.add("open");
    launch.setAttribute("aria-expanded", "true");
    if (!started) { started = true; greet(); }
    setTimeout(function () { input.focus({ preventScroll: true }); }, 50);
  }
  function close() {
    panel.hidden = true;
    wrap.classList.remove("open");
    launch.setAttribute("aria-expanded", "false");
    stopSpeaking();
  }
  launch.addEventListener("click", function () { panel.hidden ? open() : close(); });
  wrap.querySelector(".mma-x").addEventListener("click", close);
  document.addEventListener("keydown", function (e) { if (e.key === "Escape" && !panel.hidden) close(); });
  document.querySelectorAll("[data-open-concierge]").forEach(function (b) {
    b.addEventListener("click", function (e) {
      e.preventDefault();
      open();
      if (b.hasAttribute("data-voice") && recog) startListening();
    });
  });

  function add(role, text) {
    const m = document.createElement("div");
    m.className = "mma-msg mma-" + role;
    m.textContent = text;
    log.appendChild(m);
    log.scrollTop = log.scrollHeight;
    if (role !== "note") history.push({ role: role === "bot" ? "assistant" : "user", text: text });
    if (role === "bot") speak(text);
    return m;
  }
  function typing(on) {
    let t = log.querySelector(".mma-typing");
    if (on && !t) {
      t = document.createElement("div");
      t.className = "mma-msg mma-bot mma-typing";
      t.setAttribute("aria-label", "Concierge is typing");
      t.innerHTML = "<i></i><i></i><i></i>";
      log.appendChild(t);
      log.scrollTop = log.scrollHeight;
    } else if (!on && t) t.remove();
  }
  function chips(list) {
    chipsEl.innerHTML = "";
    (list || []).forEach(function (c) {
      const b = document.createElement("button");
      b.type = "button";
      b.className = "mma-chip";
      b.textContent = c;
      b.addEventListener("click", function () { handle(c); });
      chipsEl.appendChild(b);
    });
  }
  const DEFAULT_CHIPS = ["Prices", "How long does it take?", "How does it work?", "Start a project"];

  function greet() {
    add("bot", "Welcome to Monarch & Mark. Ask a question about our websites, logos and pitch decks, or start your project and I’ll pass your brief to the studio.");
    chips(DEFAULT_CHIPS);
  }

  // ---------- Answers ----------
  function money(n) { return "$" + n; }
  function svc(id) { return studio && studio.services.find(function (s) { return s.id === id; }); }

  function faqAnswer(q) {
    const t = " " + q.toLowerCase().replace(/[^a-z0-9$ ]/g, " ") + " ";
    const has = function () { for (let i = 0; i < arguments.length; i++) if (t.indexOf(arguments[i]) > -1) return true; return false; };
    const w = svc("website"), b = svc("brand"), d = svc("deck");
    if (!studio) return "I can help with services, prices, timelines and how we work, or I can take your project brief.";
    if (has(" hire", " start", " quote", " brief", " order", " book", " interested", " work with", " get started", " contact me", " call me")) return "BRIEF";
    if (has(" hi ", " hello", " hey", " good morning", " good evening")) return "Hello! I can answer questions about our websites, logos and brand kits, and pitch decks, or take your brief. What are you working on?";
    if (has(" price", " cost", " how much", " pricing", " rate", " budget", " cheap", " expensive", " $")) {
      if (has(" logo", " brand", " identity")) return "Logo & brand kits start from " + money(b.from) + " USD. That includes " + b.includes.slice(0, 3).join(", ").toLowerCase() + ". Try the instant quote calculator on this page for a live estimate.";
      if (has(" deck", " pitch", " presentation", " slide")) return "Pitch decks start from " + money(d.from) + " USD, depending on the number of slides. The instant quote calculator on this page gives you a live estimate.";
      if (has(" website", " site", " landing", " page")) return "Websites start from " + money(w.from) + " USD for a one-page landing site; more pages and extras add to that. The instant quote calculator shows a live estimate.";
      return "Our starting prices: websites from " + money(w.from) + ", logo & brand kits from " + money(b.from) + ", and pitch decks from " + money(d.from) + " (USD). You get a fixed quote before any work starts.";
    }
    if (has(" long", " time", " timeline", " days", " deadline", " fast", " quick", " urgent", " rush", " deliver")) return "Typical timelines: logo & brand kit " + b.typical_time + "; website " + w.typical_time + "; pitch deck " + d.typical_time + ". Need it sooner? Priority and rush options are in the quote calculator, and your exact date is agreed before we start.";
    if (has(" revision", " change", " edit", " not happy", " redo")) return studio.faq.find(function (f) { return f.q === "Revisions"; }).a;
    if (has(" own", " rights", " copyright", " source file", " files")) return studio.faq.find(function (f) { return f.q === "Ownership"; }).a;
    if (has(" logo", " brand", " identity", " branding")) return b.name + " (from " + money(b.from) + "): " + b.includes.join("; ") + ".";
    if (has(" deck", " pitch", " presentation", " slide", " investor")) return d.name + " (from " + money(d.from) + "): " + d.includes.join("; ") + ".";
    if (has(" host", " vercel", " netlify", " domain", " live", " launch", " deploy")) return studio.faq.find(function (f) { return f.q === "Going live"; }).a;
    if (has(" website", " site", " landing", " web ", " shopify", " wordpress", " ecommerce")) return w.name + " (from " + money(w.from) + "): " + w.includes.join("; ") + ".";
    if (has(" process", " how does", " how do you", " steps", " work ")) return "Four steps: " + studio.process.join(". ") + ".";
    if (has(" are you a bot", " are you a robot", " are you real", " are you human", " a real person", " automated", " chatbot")) return "I’m the studio’s automated assistant. I can answer questions about services and prices, and pass your brief to the team, who reply personally by email.";
    if (has(" portfolio", " examples", " previous", " clients", " review", " testimonial")) return studio.faq.find(function (f) { return f.q === "Portfolio"; }).a;
    if (has(" fiverr", " pay", " payment", " paypal", " card", " invoice")) return studio.faq.find(function (f) { return f.q === "How do I order?"; }).a;
    if (has(" existing", " already have", " rebrand", " refresh", " redesign")) return studio.faq.find(function (f) { return f.q === "Existing brand"; }).a;
    if (has(" email", " phone", " reach", " talk to", " human", " person")) return "The quickest way to reach the team is to leave your brief here and we’ll reply by email.";
    if (has(" thank", " thanks", " great", " perfect", " cool")) return "You’re welcome! Anything else I can help with?";
    return "I can help with our services, prices, timelines and process, or take your project brief for the team. What would you like to know?";
  }

  async function liveAnswer() {
    try {
      const ctrl = typeof AbortController === "function" ? new AbortController() : null;
      const timer = ctrl ? setTimeout(function () { ctrl.abort(); }, 12000) : null;
      const r = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: history.slice(-14) }),
        signal: ctrl ? ctrl.signal : undefined
      });
      if (timer) clearTimeout(timer);
      if (!r.ok) return null;
      const data = await r.json().catch(function () { return null; });
      if (!data || data.fallback || typeof data.reply !== "string" || !data.reply.trim()) return null;
      return data.reply.trim();
    } catch (e) {
      return null;
    }
  }

  async function answer(q) {
    let text = null;
    if (mode === "live") {
      text = await liveAnswer();
      if (text == null) { mode = "faq"; sub.textContent = "Ask the studio · quick answers"; }
    }
    if (text == null) {
      await getStudio();
      await new Promise(function (r) { setTimeout(r, 450); });
      const a = faqAnswer(q);
      if (a === "BRIEF") return { text: "Happy to help you get started.", brief: true };
      return { text: a, brief: false };
    }
    const wantsBrief = text.indexOf("[[BRIEF]]") > -1;
    return { text: text.replace(/\[\[BRIEF\]\]/g, "").trim(), brief: wantsBrief };
  }

  // ---------- Brief collection ----------
  const STEPS = [
    { key: "name", ask: "Great, let’s put your brief together. What’s your name?" },
    { key: "email", ask: function (b) { return "Thanks, " + b.name.split(" ")[0] + ". What email should we reply to?"; } },
    { key: "type", ask: "What do you need?", chips: ["Website or landing page", "Logo & brand kit", "Pitch deck", "More than one"] },
    { key: "budget", ask: "Roughly what budget do you have in mind (USD)?", chips: ["$80 – $150", "$150 – $400", "$400 – $1,000", "$1,000+", "Not sure yet"] },
    { key: "deadline", ask: "When do you need it by?", chips: ["As soon as possible", "Within 2 weeks", "Within a month", "Flexible"] },
    { key: "details", ask: "Last one: tell us a little about the business and the project. (Or tap Skip.)", chips: ["Skip"] }
  ];
  function startBrief() {
    brief = { step: 0, data: {} };
    askStep();
  }
  function askStep() {
    const s = STEPS[brief.step];
    add("bot", typeof s.ask === "function" ? s.ask(brief.data) : s.ask);
    chips(s.chips || ["Cancel"]);
    input.placeholder = s.key === "email" ? "you@company.com" : "Type your answer…";
  }
  function briefInput(text) {
    if (/^cancel$/i.test(text.trim())) {
      brief = null;
      add("bot", "No problem, I’ve cancelled that. Ask me anything else.");
      chips(DEFAULT_CHIPS);
      input.placeholder = "Ask a question or start your project";
      return;
    }
    if (brief.step >= STEPS.length) return confirmInput(text);
    const s = STEPS[brief.step];
    let v = text.trim();
    if (s.key === "email") {
      const m = v.match(/[^\s@]+@[^\s@]+\.[^\s@]+/);
      if (!m) { add("bot", "That doesn’t look like an email address. Could you type it again?"); return; }
      v = m[0].replace(/[.,;]+$/, "");
    }
    if (s.key === "details" && /^skip$/i.test(v)) v = "Not given";
    brief.data[s.key] = v;
    brief.step++;
    if (brief.step < STEPS.length) return askStep();
    const d = brief.data;
    add("bot", "Here’s your brief:\n• " + d.name + " (" + d.email + ")\n• " + d.type + "\n• Budget: " + d.budget + "\n• Deadline: " + d.deadline + "\n• Details: " + d.details + "\nShall I send it to the team?");
    chips(["Send brief", "Start over", "Cancel"]);
  }
  async function confirmInput(text) {
    if (/start over/i.test(text)) { brief = { step: 0, data: {} }; askStep(); return; }
    if (!/send|yes|yep|ok|sure|confirm/i.test(text)) { add("bot", "Tap “Send brief” when you’re ready, or “Cancel”."); return; }
    const d = brief.data;
    const fields = {
      Name: d.name, Email: d.email, Project: d.type, Budget: d.budget, Deadline: d.deadline, Details: d.details,
      Conversation: history.filter(function (m) { return m.role === "user"; }).map(function (m) { return m.text; }).slice(-8).join(" | "),
      Source: "Monarch Concierge (chat)"
    };
    chips([]);
    typing(true);
    const res = MM.validEmail && MM.sendBrief ? await MM.sendBrief("New chat brief: " + d.type + " (" + d.name + ")", fields) : { ok: false };
    typing(false);
    brief = null;
    input.placeholder = "Ask a question or start your project";
    if (res.ok) {
      add("bot", "Sent! The team has your brief and will reply to " + d.email + " soon. Anything else I can help with?");
      chips(["Prices", "How does it work?"]);
    } else {
      add("bot", "I couldn’t send that automatically. Tap the link below to email it to us instead.");
      if (MM.mailtoHref && MM.validEmail) {
        const a = document.createElement("a");
        a.className = "mma-msg mma-bot mma-link";
        a.href = MM.mailtoHref("Project brief: " + d.type, MM.asText(fields));
        a.textContent = "Email my brief →";
        log.appendChild(a);
        log.scrollTop = log.scrollHeight;
      }
      chips(DEFAULT_CHIPS);
    }
  }

  // ---------- Main handler ----------
  async function handle(text) {
    text = (text || "").trim();
    if (!text || busy) return;
    add("user", text);
    input.value = "";
    if (brief) { await briefInput(text); return; }
    if (/^start a project$/i.test(text)) { startBrief(); return; }
    busy = true;
    chips([]);
    typing(true);
    const a = await answer(text);
    typing(false);
    busy = false;
    add("bot", a.text);
    if (a.brief) startBrief();
    else chips(DEFAULT_CHIPS);
  }
  form.addEventListener("submit", function (e) { e.preventDefault(); handle(input.value); });

  // ---------- Voice ----------
  const synth = "speechSynthesis" in window ? window.speechSynthesis : null;
  let speakOn = false;
  let voice = null;
  function pickVoice() {
    if (!synth) return;
    const vs = synth.getVoices().filter(function (v) { return /^en(-|_)/i.test(v.lang); });
    const prefs = [/natural/i, /google us english/i, /samantha/i, /premium|enhanced/i, /aria|jenny|guy/i, /daniel|serena|karen/i];
    for (let i = 0; i < prefs.length && !voice; i++) voice = vs.find(function (v) { return prefs[i].test(v.name); }) || null;
    if (!voice) voice = vs.find(function (v) { return /en-US/i.test(v.lang); }) || vs[0] || null;
  }
  if (synth) { pickVoice(); if ("onvoiceschanged" in synth) synth.onvoiceschanged = function () { voice = null; pickVoice(); }; }
  function setSpeak(on) {
    speakOn = !!on && !!synth;
    spkBtn.setAttribute("aria-pressed", String(speakOn));
    spkBtn.innerHTML = speakOn ? SPK_ON : SPK_OFF;
    spkBtn.title = speakOn ? "Mute voice replies" : "Read replies aloud";
    spkBtn.setAttribute("aria-label", spkBtn.title);
    if (!speakOn) stopSpeaking();
  }
  if (!synth) spkBtn.hidden = true;
  spkBtn.addEventListener("click", function () { setSpeak(!speakOn); });
  function stopSpeaking() { if (synth) synth.cancel(); }
  function speak(text) {
    if (!speakOn || !synth) return;
    stopSpeaking();
    const u = new SpeechSynthesisUtterance(text.replace(/https?:\/\/\S+/g, "").replace(/[•]/g, "").replace(/\$(\d)/g, "$1 dollars ").replace(/ dollars (\d)/g, "$1"));
    if (voice) u.voice = voice;
    u.lang = (voice && voice.lang) || "en-US";
    u.rate = 1.02;
    synth.speak(u);
  }

  const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
  let recog = null;
  let listening = false;
  if (SR) {
    recog = new SR();
    recog.lang = "en-US";
    recog.interimResults = true;
    recog.maxAlternatives = 1;
    micBtn.hidden = false;
    recog.onresult = function (e) {
      let txt = "", fin = false;
      for (let i = e.resultIndex; i < e.results.length; i++) {
        txt += e.results[i][0].transcript;
        if (e.results[i].isFinal) fin = true;
      }
      input.value = txt;
      if (fin) { stopListening(); handle(txt); }
    };
    recog.onerror = function (e) {
      stopListening();
      if (e.error === "not-allowed" || e.error === "service-not-allowed") {
        add("note", "Microphone access is blocked. You can allow it in your browser settings, or just type.");
      }
    };
    recog.onend = function () { stopListening(); };
    micBtn.addEventListener("click", function () { listening ? recog.stop() : startListening(); });
  }
  function startListening() {
    if (!recog || listening) return;
    stopSpeaking();
    setSpeak(true); // voice in → voice out (the speaker button mutes it)
    try {
      recog.start();
      listening = true;
      micBtn.classList.add("on");
      micBtn.setAttribute("aria-label", "Stop listening");
      input.placeholder = "Listening…";
    } catch (e) { stopListening(); }
  }
  function stopListening() {
    listening = false;
    micBtn.classList.remove("on");
    micBtn.setAttribute("aria-label", "Speak your question");
    if (input.placeholder === "Listening…") input.placeholder = "Ask a question or start your project";
  }
  if (!SR) document.querySelectorAll("[data-voice-only]").forEach(function (n) { n.hidden = true; });

  window.MMConcierge = { open: open, close: close, ask: handle, get mode() { return mode; }, get voice() { return !!SR; } };
})();
