# Monarch & Mark — studio hub

The main website for **Monarch & Mark**, an independent creative studio: short-form video editing, YouTube channel production, websites, Discord bots and servers, Roblox game development, and brand identity & pitch decks. It is also the hub that links to everything the studio runs: AfterDark Archives, DON'T ANSWER, Nifty Nine and SAHNTRO.

Plain static HTML, CSS and JavaScript. No build step, no framework, no dependencies.

## Deploy

Vercel deploys every push to `main` on its own (Framework Preset: Other, no build command, root `/`).

## Editing

| Path | What it is |
| --- | --- |
| `index.html` | All page content and links |
| `styles.css` | Design (colours are the variables at the top: navy, black and gold `#C4A162`) |
| `script.js` | Menu, scroll reveals, hero motion, copy-email button |
| `assets/work/` | Screenshots and thumbnails of the studio's live projects |
| `assets/monarch-mark.png` | The gold Monarch crown mark |
| `assets/fonts/` | Self-hosted Cormorant Garamond + Manrope (SIL Open Font License) |
| `brand/` | Logo files |
| `og.png` | Social preview image |

Contact email and the Fiverr link appear in `index.html` (search for `sahilpatel5037`).
