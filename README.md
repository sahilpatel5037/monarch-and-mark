# Monarch & Mark — studio website

Portfolio and sales site for **Monarch & Mark**, an independent design studio for websites and landing pages, logos and brand identity kits, and pitch decks.

Plain static HTML, CSS and JavaScript, plus one optional serverless function for the AI assistant. No build step, no framework, no dependencies.

## Deploy on Vercel

Add New Project → import this repo → Deploy.

Leave every setting on its default (Framework Preset: Other, no build command, root directory `/`). After that, every push to `main` goes live on its own.

## Turn on the AI chat assistant (free)

The "Monarch Assistant" widget (bottom-right) works straight away in **quick-answer mode**: it answers common questions about services, prices, timelines and process from `assets/studio.json`, and it collects project briefs. To give it full AI answers:

1. Get a free Gemini API key at **https://aistudio.google.com** → *Get API key* → *Create API key*.
2. In Vercel open the project → **Settings → Environment Variables**.
3. Add `GEMINI_API_KEY` with your key as the value (tick Production, Preview and Development) → **Save**.
4. Go to **Deployments**, open the ⋯ menu on the latest one and choose **Redeploy** (environment variables only apply to new deployments).

The function is `api/chat.js`. It uses Google's `gemini-flash-latest` model and falls back to `gemini-flash-lite-latest` if that one is out of free quota. Set `GEMINI_MODEL` to pin a different model. If the key is missing or Google is unavailable, the widget quietly switches to quick-answer mode. Visitors never see an error.

**Voice:** visitors can tap the 🎙️ mic in the widget (or "Talk to our AI assistant" in the hero) and speak. Their speech becomes text in the browser (Web Speech API), and replies are read aloud with the browser's built-in voices. It costs nothing and needs no phone line. The mic shows up in Chrome, Edge and Safari and is hidden where the browser can't do speech recognition (for example Firefox). Typing works everywhere.

## Activate email delivery (one time)

The contact form, the instant quote and the chat assistant send briefs to the studio inbox through **FormSubmit** (https://formsubmit.co), so no server is needed.

- The **first** submission from the live site triggers an activation email from FormSubmit to the inbox. Open it and click **Activate Form**. Briefs arrive normally after that.
- Until it's activated, briefs are not delivered, so send one test message yourself right after deploying.
- Optional: the activation email gives you a private alias. Paste it as `formEndpoint` in `script.js` (for example `https://formsubmit.co/ajax/your-alias`) so your email address no longer appears in the page code.
- If automatic sending ever fails, visitors get an "Email it to us instead" link that opens their email app with the brief filled in.

## Contact details: one place

All contact details live in the `CONTACT` object at the top of **`script.js`**:

```js
const CONTACT = {
  fiverrUrl: "",                         // e.g. "https://www.fiverr.com/yourname"
  email: "sahilpatel5037@gmail.com",     // where briefs and the Email button go
  formEndpoint: ""                       // optional FormSubmit alias
};
```

While `fiverrUrl` is empty, the "Hire on Fiverr" buttons scroll to the contact form instead of opening a broken link.

## Prices and assistant knowledge

`assets/studio.json` holds the services, starting prices, typical timelines, FAQ and the instant-quote price table. The quote calculator, the chat assistant's quick answers and the AI system prompt all read from this file, so changing a price there updates all three. The starting prices shown on the service cards are in `index.html`.

The add-on prices in the quote calculator (extra pages, logo concepts, slides, extras, revisions, priority/rush) are suggested starting points. Adjust them to your own rates.

## What's in the repo

| Path | What it is |
| --- | --- |
| `index.html`, `styles.css`, `script.js` | The site |
| `quote.js` | Instant quote calculator |
| `assistant.js` | Monarch Assistant chat + voice widget |
| `api/chat.js` | Vercel serverless function (Gemini) |
| `assets/studio.json` | Services, prices, FAQ, quote table |
| `assets/work/` | Concept portfolio images |
| `assets/fonts/` | Self-hosted Cormorant Garamond + Manrope (SIL Open Font License) |
| `brand/` | Logo files: SVG + PNG wordmarks (dark/light), symbol, icon, favicon |
| `favicon.svg`, `favicon-32.png`, `apple-touch-icon.png`, `og.png` | Icons and social preview |

## Honesty notes

- Every portfolio piece is **concept work for fictional brands** and is labelled that way on the page. Swap in real client work as projects are delivered.
- No testimonials, client logos or statistics are claimed.

## Brand

- Colours: Ink `#0E1626`, Ivory `#F5F0E6`, Gold `#C9A45C`, Deep gold `#7A5B22`
- Type: Cormorant Garamond (headlines), Manrope (body)
- Mark: a crown drawn as an "M", over a single line (the "mark")

© 2026 Monarch & Mark
