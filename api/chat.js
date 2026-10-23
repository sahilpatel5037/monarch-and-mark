// Vercel serverless function: POST /api/chat
// Answers visitor questions for the "Monarch Concierge" chat widget ("Ask the studio")
// through Google's Generative Language API.
// Needs the environment variable CHAT_API_KEY (Vercel → Project → Settings → Environment Variables).
// Optional: CHAT_MODEL to pin a model.
// If the key is missing or the service fails, it answers { fallback: true } and the widget
// switches to its built-in quick answers, so visitors never see an error.

const studio = require("../assets/studio.json");

const PINNED = process.env.CHAT_MODEL || process.env.GEMINI_MODEL; // older variable name still accepted
const MODELS = PINNED
  ? [PINNED]
  : ["gemini-flash-latest", "gemini-flash-lite-latest"];
const MAX_MESSAGES = 14;
const MAX_CHARS = 1200;

function systemPrompt() {
  const services = studio.services
    .map(s => `- ${s.name}: starting from $${s.from} USD. Includes: ${s.includes.join("; ")}. Typical timeline: ${s.typical_time}.`)
    .join("\n");
  const faq = studio.faq.map(f => `- ${f.q}: ${f.a}`).join("\n");
  const process = studio.process.map(p => `- ${p}`).join("\n");
  return [
    `You are "Monarch Concierge", the website concierge for ${studio.name}. Visitors reach you through the "Ask the studio" button.`,
    studio.about,
    "",
    "SERVICES AND STARTING PRICES (the only prices you may state):",
    services,
    "",
    "PROCESS:",
    process,
    "",
    "FAQ:",
    faq,
    "",
    "RULES:",
    "- Be warm, concise and professional. Reply in 1 to 4 short sentences, plain text, no markdown.",
    "- Never invent prices, discounts, packages, timelines, guarantees, client names, reviews or statistics beyond what is written above. For anything not listed, say the final fixed quote is confirmed after a short brief, and suggest the instant quote calculator on the page.",
    "- Speak for the studio in a calm, polished, premium tone. Do not describe yourself, your technology or how you work unless asked. Never bring up models, automation or the technology behind you on your own.",
    "- Never claim to be a human or a named person, and never claim to make phone calls.",
    "- If the visitor sincerely asks whether they are talking to a real person or a machine, answer honestly in one sentence: you are the studio's automated assistant, and the team replies personally by email to every brief. Then offer to help or take their brief.",
    "- Do not ask for passwords, payment details or phone numbers.",
    "- If the visitor wants to start a project, get a quote, hire the studio or be contacted, answer briefly and end your reply with the exact token [[BRIEF]] so the widget can collect their details (name, email, project type, budget, deadline).",
    "- If a question is unrelated to the studio's services, politely steer back."
  ].join("\n");
}

function readBody(req) {
  if (req.body && typeof req.body === "object") return req.body;
  if (typeof req.body === "string") {
    try { return JSON.parse(req.body); } catch (e) { return {}; }
  }
  return {};
}

module.exports = async function handler(req, res) {
  res.setHeader("Cache-Control", "no-store");
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "method_not_allowed" });
  }
  const key = process.env.CHAT_API_KEY || process.env.GEMINI_API_KEY; // older variable name still accepted
  if (!key) return res.status(200).json({ fallback: true, reason: "not_configured" });

  const body = readBody(req);
  const messages = (Array.isArray(body.messages) ? body.messages : [])
    .filter(m => m && typeof m.text === "string" && m.text.trim())
    .slice(-MAX_MESSAGES)
    .map(m => ({
      role: m.role === "assistant" ? "model" : "user",
      parts: [{ text: m.text.slice(0, MAX_CHARS) }]
    }));
  while (messages.length && messages[0].role !== "user") messages.shift();
  if (!messages.length || messages[messages.length - 1].role !== "user") {
    return res.status(400).json({ error: "no_question" });
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 9000);
  const payload = JSON.stringify({
    systemInstruction: { parts: [{ text: systemPrompt() }] },
    contents: messages,
    generationConfig: { temperature: 0.4, maxOutputTokens: 600 }
  });
  try {
    for (const model of MODELS) {
      const r = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json", "x-goog-api-key": key },
          body: payload,
          signal: controller.signal
        }
      );
      const data = await r.json().catch(() => ({}));
      const parts = (((data.candidates || [])[0] || {}).content || {}).parts || [];
      const reply = parts.filter(p => !p.thought).map(p => p.text || "").join("").trim();
      if (r.ok && reply) return res.status(200).json({ reply });
      console.error("Concierge model error", model, r.status, JSON.stringify(data).slice(0, 300));
      // A retired model name (404) or a model's quota running out (429) is worth trying the next one.
      if (r.status !== 404 && r.status !== 429) break;
    }
    return res.status(200).json({ fallback: true, reason: "upstream" });
  } catch (err) {
    console.error("Concierge request failed", String(err));
    return res.status(200).json({ fallback: true, reason: "upstream" });
  } finally {
    clearTimeout(timer);
  }
};

module.exports.systemPrompt = systemPrompt;
