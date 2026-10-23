# Monarch & Mark — studio website

Portfolio and sales site for **Monarch & Mark**, an independent design studio for websites and landing pages, logos and brand identity kits, and pitch decks.

Plain static HTML, CSS and JavaScript, plus one optional serverless function for the concierge chat. No build step, no framework, no dependencies.

## Deploy on Vercel

Add New Project → import this repo → Deploy.

Leave every setting on its default (Framework Preset: Other, no build command, root directory `/`). After that, every push to `main` goes live on its own.

## Monarch Concierge ("Ask the studio")

The concierge (bottom-right, and the "Ask the studio" buttons) works straight away in **quick-answer mode**: it answers common questions about services, prices, timelines and process from `assets/studio.json`, and it collects project briefs. To switch on full conversational answers:

1. Create a free Google API key at **aistudio.google.com** → *Get API key* → *Create API key*.
2. In Vercel open the project → **Settings → Environment Variables**.
3. Add `CHAT_API_KEY` with your key as the value (tick Production, Preview and Development) → **Save**.
4. Go to **Deployments**, open the ⋯ menu on the latest one and choose **Redeploy** (environment variables only apply to new deployments).

The function is `api/chat.js`. If the key is missing or the service is unavailable, the concierge quietly switches to quick-answer mode, so visitors never see an error. Keep the key in Vercel only: never paste it into the code.

**Voice:** visitors can tap the mic and speak. Speech becomes text in the browser, and replies are read aloud with the browser's built-in voices. It costs nothing and needs no phone line. The mic shows up in Chrome, Edge and Safari and is hidden where the browser can't do speech recognition (for example Firefox). Typing works everywhere.

## Activate email delivery (one time)

The contact form, the instant quote and the concierge send briefs to the studio inbox through **FormSubmit** (https://formsubmit.co), so no server is needed.

- The **first** submission from the live site triggers an activation email from FormSubmit to the inbox. Open it and click **Activate Form**. Briefs arrive normally after that.
- Until it's activated, briefs are not delivered, so send one test message yourself right after deploying.
- Optional: the activation email gives you a private alias. Paste it as `formEndpoint` in `script.js` (for example `https://formsubmit.co/ajax/your-alias`) so your email address is no longer used for form delivery.
- If automatic sending ever fails, visitors get an "Email it to us instead" link that opens their email app with the brief filled in.

## Contact details: one place

All contact details live in the `CONTACT` object at the top of **`script.js`**: `fiverrUrl` (your Fiverr profile or gig link), `email` (where briefs and the "Email us" buttons go) and `formEndpoint` (optional FormSubmit alias).

While `fiverrUrl` is empty, every "Hire on Fiverr" button opens fiverr.com in a new tab. Paste your profile link to point them all at it.

## Prices and concierge knowledge

`assets/studio.json` holds the services, starting prices, typical timelines, FAQ and the instant-quote price table. The quote calculator and the concierge both read from this file, so changing a price there updates both. The starting prices shown on the service cards are in `index.html`.

The add-on prices in the quote calculator (extra pages, logo concepts, slides, extras, revisions, priority/rush) are suggested starting points. Adjust them to your own rates.

## What's in the repo

| Path | What it is |
| --- | --- |
| `index.html`, `styles.css`, `script.js` | The site |
| `quote.js` | Instant quote calculator |
| `concierge.js` | Monarch Concierge chat + voice widget |
| `api/chat.js` | Vercel serverless function for the concierge |
| `assets/studio.json` | Services, prices, FAQ, quote table |
| `assets/work/` | Concept portfolio images |
| `assets/fonts/` | Self-hosted Cormorant Garamond + Manrope (SIL Open Font License) |
| `brand/` | Logo files: SVG + PNG wordmarks (dark/light), symbol, icon, favicon |
| `favicon.svg`, `favicon-32.png`, `apple-touch-icon.png`, `og.png` | Icons and social preview |

## Honesty notes

- Every portfolio piece is **concept work for fictional brands** and is labelled that way on the page. Swap in real client work as projects are delivered.
- No testimonials, client logos or statistics are claimed.

## Brand

- Colours: Ink `#0B0B0D`, Ivory `#F3EEE4`, Gold `#C3A060`, Deep gold `#7C5E26`
- Type: Cormorant Garamond (headlines), Manrope (body)
- Mark: a crown drawn as an "M", over a single line (the "mark")

© 2026 Monarch & Mark
