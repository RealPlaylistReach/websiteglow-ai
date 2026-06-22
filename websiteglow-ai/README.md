# WebsiteGlow AI

Paste a website → get a real screenshot of the live site as the **before**, and an AI‑regenerated modern version as the **after**, side‑by‑side with a slider. Built to deploy on **Netlify** (static frontend + two serverless functions).

---

## How the "real preview" actually works

A browser **cannot** crawl arbitrary third‑party sites (CORS) and can't reliably re‑render them (relative URLs break, most sites block being iframed). So the work happens in two Netlify Functions:

```
Frontend (static, dist/)
   │  POST /api/analyze  { url }
   ▼
analyze.mjs        screenshot the live site (ScreenshotOne → base64)
                   + fetch raw HTML
                   + run a real heuristic audit (viewport, alt text, H1s,
                     HTTPS, CTAs, page weight, dated markup…)
   │  returns { beforeImage, audit, brand{logo,colors,title}, content }
   ▼
Frontend shows the score report, then:
   │  POST /api/redesign  { brand, content }
   ▼
redesign.mjs       one Claude call → a self‑contained, responsive, modern
                   HTML page that reuses the real logo, colors and copy
   │  returns { afterHtml }
   ▼
Slider: before = <img> screenshot, after = <iframe srcDoc>.
```

The audit is **deterministic and real** (it reports actual detected issues, not AI guesses), which keeps the high‑volume free path fast and ~free. The single AI call only runs when someone reaches the preview.

Three input modes:
- **URL** — the real path (screenshot + audit + AI redesign).
- **Paste HTML** — for sites that block bots; before = the pasted markup, after = AI redesign. No screenshot key needed.
- **Demo** — fully offline (bundled bakery before/after), costs nothing. Great for testing the UI.

---

## Deploy to Netlify

1. **Push this folder to a GitHub repo**, then in Netlify: *Add new site → Import from Git → pick the repo.* Build settings are auto‑detected from `netlify.toml` (`npm run build`, publish `dist`).
   (Or drag‑and‑drop deploy: run `npm install && npm run build` locally and drop the project folder onto Netlify — but Git import is better so functions deploy.)

2. **Set environment variables** (Site settings → Environment variables):
   - `ANTHROPIC_API_KEY` — **required** (the redesign engine).
   - `SCREENSHOTONE_ACCESS_KEY` — **required for a true before screenshot.** Free key at https://screenshotone.com. Without it, the URL path still audits + redesigns, but the "before" panel shows a placeholder (use Paste mode meanwhile).
   - `REDESIGN_MODEL` — optional (`claude-sonnet-4-6` default; `claude-opus-4-8` for max quality; `claude-haiku-4-5-20251001` for speed).

3. **Redeploy** after adding env vars. Done — visit the site, paste a URL.

Local dev: `npm install` then `npx netlify dev` (runs the frontend **and** the functions together at one localhost URL so `/api/*` works). Plain `npm run dev` runs the UI only — the API routes won't respond.

---

## The three things that will bite you

**1. The redesign call can exceed Netlify's free 10s function timeout.** A full‑page rebuild is typically 10–22s. Options, in order of effort:
- **Netlify Pro** — raise the function timeout to 26s (Site config → Functions). The redesign is tuned to finish under 24s. Simplest fix, works as‑is.
- **Use Haiku** for the redesign (`REDESIGN_MODEL=claude-haiku-4-5-20251001`) — usually fits in 10s, lower visual quality.
- **Background function + polling** — rename to `redesign-background.mjs` (up to 15 min) and have the frontend poll for the result. Ask and I'll wire this; it's the right long‑term pattern for the free tier.

**2. Unit economics — protect the free preview.** Every free run costs you 1 screenshot + (if they reach preview) 1 Claude call. Unprotected, a bot can run up a bill. Before you promote this, add: a **URL result cache** (same URL within 24h → return cached, via Netlify Blobs or Supabase), a **per‑IP rate limit**, and **Cloudflare Turnstile** on submit. I can add all three.

**3. Keys are server‑side only.** `ANTHROPIC_API_KEY` and the screenshot key are read **inside the functions** and never reach the browser (the screenshot is returned as base64, not as a keyed URL). Do not move these calls to the frontend — that exposed key was fine for an in‑chat prototype, fatal in production.

---

## Honest scope notes

- **Best on the target market** (small‑business / local sites: dentists, bakeries, trades, law firms). A single AI pass faithfully rebuilds those. A 50‑section enterprise SaaS site won't rebuild 1:1 — but the screenshot "before" is always accurate, and those aren't your buyers.
- **No fabrication:** the redesign prompt forbids inventing testimonials, ratings, prices, or claims — it uses only the real extracted content. Keep that rule; a fake testimonial in someone's "after" is a dealbreaker.
- **SSRF guard is basic** (blocks localhost / private IP ranges / non‑http). Harden before scale (DNS‑resolution checks, redirect pinning).
- **Stripe checkout and the downloadable package are stubbed** in the UI (buttons explain what connects). Those are the next build — say the word and I'll add the Stripe Checkout function + the post‑purchase zip (HTML/CSS + reports) generator.

---

## Files

```
index.html, vite.config.js, package.json     # static frontend (Vite + React, no Tailwind toolchain)
src/main.jsx, src/App.jsx                     # the app (homepage, analysis, report, before/after slider, pricing)
netlify/functions/analyze.mjs                 # screenshot + fetch + heuristic audit
netlify/functions/redesign.mjs               # AI redesign → self-contained HTML
netlify.toml                                  # build + /api/* routing + SPA fallback
.env.example                                  # the env vars to set in Netlify
```

## Swapping the screenshot provider
`analyze.mjs` → the `screenshot()` function. It calls ScreenshotOne and returns a base64 data URL. To use Urlbox / ApiFlash / Browserless, change that one function to return `data:image/jpeg;base64,...` and you're done. To avoid per‑screenshot cost at scale, self‑host Puppeteer (`puppeteer-core` + `@sparticuz/chromium`) in the function — heavier and slower cold starts, but no per‑shot fee.
