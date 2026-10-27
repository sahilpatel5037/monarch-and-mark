const { test } = require("node:test");
const assert = require("node:assert");
const fs = require("node:fs");
const path = require("node:path");
const SITE = path.join(__dirname, "..", "site");
const html = fs.readFileSync(path.join(SITE, "index.html"), "utf8");
const css = fs.readFileSync(path.join(SITE, "styles.css"), "utf8");

test("title, viewport and landmarks", () => {
  assert.match(html, /<title>Monarch &amp; Mark[^<]+<\/title>/);
  assert.match(html, /<meta name="viewport" content="width=device-width, initial-scale=1/);
  for (const t of ["<header", "<main", "<footer", "<nav"]) assert.ok(html.includes(t), t);
  assert.equal((html.match(/<h1/g) || []).length, 1);
});

test("all hub links present", () => {
  const need = [
    "https://afterdark-archives.sites.tab.bot/", "https://afterdark-studio.sites.tab.bot/", "https://afterdark-studio.sites.tab.bot/plan/",
    "https://www.roblox.com/games/91110462194238", "https://niftynine.sites.tab.bot/",
    "https://sahntro.sites.tab.bot/", "https://www.fiverr.com/sahilpatel420", "mailto:sahilpatel5037@gmail.com",
  ];
  for (const u of need) assert.ok(html.includes(u), u);
  assert.ok(!/discord\.gg|discord\.com\/invite/i.test(html), "no public Discord invite");
  assert.ok(!/youtube\.com|youtu\.be/i.test(html), "no links out to YouTube");
  assert.ok(!html.includes("own Discord server"), "no Discord server mention");
});

test("services listed", () => {
  for (const s of ["Short-form video editing", "YouTube channel production", "Websites", "Discord bots", "Roblox game development"]) assert.ok(html.includes(s), s);
  for (const id of ['id="work"', 'id="services"', 'id="process"', 'id="about"', 'id="contact"', 'id="video-editing"']) assert.ok(html.includes(id), id);
});

test("nothing banned or placeholder", () => {
  const low = html.toLowerCase();
  for (const w of ["truckersmp", "tmp ", "scs software", "antho", "patreon", "work engine", "influencer", "lorem", "todo", "placeholder", "testimonial", "trusted by", "100+", "thumbnail design", " ai "])
    assert.ok(!low.includes(w), "found: " + w);
  assert.ok(!/\$\d/.test(html), "no prices");
});

test("local assets exist", () => {
  const refs = [...html.matchAll(/(?:src|href)="([^"#:?]+)(?:\?[^"]*)?"/g)].map(m => m[1]).filter(r => !r.startsWith("http") && !r.startsWith("mailto"));
  assert.ok(refs.length > 10);
  for (const r of refs) assert.ok(fs.existsSync(path.join(SITE, r)), "missing " + r);
  const cssRefs = [...fs.readFileSync(path.join(SITE, "assets/fonts.css"), "utf8").matchAll(/url\('([^']+)'\)/g)].map(m => m[1]);
  for (const r of cssRefs) assert.ok(fs.existsSync(path.join(SITE, "assets", r)), "missing font " + r);
});

test("external links open safely and brand colour used", () => {
  for (const m of html.matchAll(/<a [^>]*target="_blank"[^>]*>/g)) assert.match(m[0], /rel="noopener"/);
  assert.ok(css.includes("#C4A162"));
  assert.ok(/@media \(max-width:640px\)/.test(css));
});
