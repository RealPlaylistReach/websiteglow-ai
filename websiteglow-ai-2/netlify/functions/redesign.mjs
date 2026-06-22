// POST /api/redesign
// Body: { brand, content }  OR  { html }  OR  { url }
// Returns: { afterHtml }
//
// AI provider is chosen automatically:
//   - GEMINI_API_KEY set    -> Google Gemini (free tier, no credit card). DEFAULT.
//   - else ANTHROPIC_API_KEY -> Claude.
// Set whichever you have. You don't need both.

const json = (status, obj) =>
  new Response(JSON.stringify(obj), { status, headers: { "content-type": "application/json" } });

function isSafeUrl(u) {
  try {
    const url = new URL(u);
    if (!/^https?:$/.test(url.protocol)) return false;
    const h = url.hostname.toLowerCase();
    if (h === "localhost" || h === "0.0.0.0" || h.endsWith(".local")) return false;
    if (/^(10\.|127\.|169\.254\.|192\.168\.|172\.(1[6-9]|2\d|3[01])\.)/.test(h)) return false;
    if (!h.includes(".")) return false;
    return true;
  } catch { return false; }
}

const stripTags = (s) => s.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
const attr = (tag, name) => tag.match(new RegExp(name + '\\s*=\\s*["\']([^"\']+)["\']', "i"))?.[1] || null;
const absolute = (b, m) => { try { return new URL(m, b).href; } catch { return null; } };

async function fetchHtml(url) {
  const c = new AbortController();
  const t = setTimeout(() => c.abort(), 7000);
  try {
    const r = await fetch(url, {
      signal: c.signal, redirect: "follow",
      headers: { "user-agent": "Mozilla/5.0 (compatible; WebsiteGlowBot/1.0)", accept: "text/html" },
    });
    if (!(r.headers.get("content-type") || "").includes("html")) return "";
    return (await r.text()).slice(0, 600000);
  } catch { return ""; } finally { clearTimeout(t); }
}

function extract(html, baseUrl) {
  const title = (html.match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1] || "").trim().slice(0, 120);
  const headings = (html.match(/<h[1-3][^>]*>([\s\S]*?)<\/h[1-3]>/gi) || [])
    .map(stripTags).filter((t) => t && t.length < 140).slice(0, 12);
  const body = html.replace(/<script[\s\S]*?<\/script>/gi, " ").replace(/<style[\s\S]*?<\/style>/gi, " ");
  const text = stripTags(body).slice(0, 2600);
  const ogImg = html.match(/property=["']og:image["'][^>]*content=["']([^"']+)/i)?.[1];
  const logoImg = (html.match(/<img\b[^>]*>/gi) || []).find((t) =>
    /logo/i.test((attr(t, "src") || "") + (attr(t, "alt") || "") + (attr(t, "class") || "")));
  const logo = logoImg ? absolute(baseUrl, attr(logoImg, "src")) : null;
  const counts = {};
  (html.match(/#[0-9a-fA-F]{6}/g) || []).forEach((c) => {
    const v = c.toLowerCase();
    if (["#ffffff", "#000000", "#fefefe", "#fafafa"].includes(v)) return;
    counts[v] = (counts[v] || 0) + 1;
  });
  const colors = Object.entries(counts).sort((a, b) => b[1] - a[1]).map((x) => x[0]).slice(0, 4);
  const phone = (html.match(/tel:([+\d().\-\s]{7,})/i)?.[1] || html.match(/(\(?\d{3}\)?[\s.\-]\d{3}[\s.\-]\d{4})/)?.[1] || "").trim();
  const email = (html.match(/mailto:([^"'?]+)/i)?.[1] || "").trim();
  const images = [...new Set((html.match(/<img\b[^>]*>/gi) || [])
    .map((t) => absolute(baseUrl, attr(t, "src")))
    .filter((u) => u && /^https?:/.test(u) && /\.(png|jpe?g|webp|svg|avif)/i.test(u)))].slice(0, 4);
  return { title, headings, text, logo, colors, phone, email, images, image: ogImg ? absolute(baseUrl, ogImg) : null };
}

/* ---------- AI providers ---------- */
async function callGemini(system, prompt, maxTokens) {
  const key = process.env.GEMINI_API_KEY;
  const model = process.env.GEMINI_MODEL || "gemini-2.0-flash";
  const c = new AbortController();
  const t = setTimeout(() => c.abort(), 24000);
  try {
    const r = await fetch(
      "https://generativelanguage.googleapis.com/v1beta/models/" + model + ":generateContent?key=" + key,
      {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          system_instruction: { parts: [{ text: system }] },
          contents: [{ role: "user", parts: [{ text: prompt }] }],
          generationConfig: { maxOutputTokens: maxTokens, temperature: 0.7 },
        }),
        signal: c.signal,
      }
    );
    if (!r.ok) throw new Error("Gemini API " + r.status + ": " + (await r.text()).slice(0, 180));
    const d = await r.json();
    const parts = d?.candidates?.[0]?.content?.parts || [];
    const text = parts.map((p) => p.text || "").join("");
    if (!text) throw new Error("Gemini returned no content (it may have been blocked). Try again.");
    return text;
  } finally { clearTimeout(t); }
}

async function callClaude(system, prompt, maxTokens) {
  const key = process.env.ANTHROPIC_API_KEY;
  const c = new AbortController();
  const t = setTimeout(() => c.abort(), 24000);
  try {
    const r = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: { "x-api-key": key, "anthropic-version": "2023-06-01", "content-type": "application/json" },
      body: JSON.stringify({
        model: process.env.REDESIGN_MODEL || "claude-sonnet-4-6",
        max_tokens: maxTokens, system, messages: [{ role: "user", content: prompt }],
      }),
      signal: c.signal,
    });
    if (!r.ok) throw new Error("Anthropic API " + r.status + ": " + (await r.text()).slice(0, 180));
    const d = await r.json();
    return (d.content || []).filter((b) => b.type === "text").map((b) => b.text).join("\n");
  } finally { clearTimeout(t); }
}

async function generate(system, prompt) {
  if (process.env.GEMINI_API_KEY) return callGemini(system, prompt, 8000);
  if (process.env.ANTHROPIC_API_KEY) return callClaude(system, prompt, 8000);
  throw new Error("No AI key set. Add a free GEMINI_API_KEY (aistudio.google.com) or an ANTHROPIC_API_KEY.");
}

const SYSTEM = `You are an elite web design agency doing a REDESIGN, not a rebuild. You receive the real content and brand of an existing website and return a single, self-contained, modern, mobile-first HTML document that is clearly the SAME business — just dramatically better executed.

HARD RULES:
- Output ONLY the HTML document, beginning with <!doctype html>. No commentary, no markdown fences.
- One file. Inline <style> only. NO external CSS, NO web fonts, NO JavaScript, NO external requests EXCEPT the absolute image/logo URLs explicitly provided.
- Use ONLY facts present in the provided content. NEVER fabricate testimonials, star ratings, prices, statistics, awards, addresses, or claims. If a detail isn't provided, omit that section.
- Preserve the brand: keep the exact business name and real copy/services. Build the palette from the provided brand colors. If a logo URL is provided, place it in the header <img>; always also render the business name as text.
- Images: use ONLY the provided absolute https URLs. If none fit a slot, use a tasteful CSS gradient/color block — never a broken or placeholder <img>.
- Upgrade everything else: typography scale, spacing, layout, visual hierarchy, sticky nav, clear primary CTA, trust/contact section, and full responsiveness (looks great at 380px). System font stack only.
- Keep it compact and production-clean.`;

function buildPrompt(brand, content) {
  const b = brand || {};
  const c = content || {};
  const colors = (b.colors && b.colors.length ? b.colors : c.colors) || [];
  return [
    `BUSINESS NAME: ${b.title || c.title || "(unknown — infer from content)"}`,
    b.logo ? `LOGO URL (use in header): ${b.logo}` : `LOGO: none provided (use the name as a wordmark)`,
    colors.length ? `BRAND COLORS: ${colors.join(", ")}` : `BRAND COLORS: none detected (choose a tasteful palette that fits the business)`,
    (c.images && c.images.length) ? `USABLE IMAGE URLS:\n${c.images.join("\n")}` : `IMAGE URLS: none — use CSS color/gradient blocks`,
    c.phone ? `PHONE: ${c.phone}` : "",
    c.email ? `EMAIL: ${c.email}` : "",
    (c.navItems && c.navItems.length) ? `NAV ITEMS: ${c.navItems.join(" · ")}` : "",
    (c.headings && c.headings.length) ? `HEADINGS FROM THE SITE:\n- ${c.headings.join("\n- ")}` : "",
    c.text ? `PAGE CONTENT (use this real copy, rewritten only for clarity — do not invent new facts):\n${c.text}` : "",
    ``,
    `Redesign this into a modern, high-converting single page for the SAME business.`,
  ].filter(Boolean).join("\n");
}

export default async (req) => {
  if (req.method !== "POST") return json(405, { error: "POST only" });
  let body = {};
  try { body = await req.json(); } catch { return json(400, { error: "Invalid JSON body" }); }

  let { brand, content } = body;
  if ((!content || !content.text) && body.html) {
    content = extract(body.html.slice(0, 600000), "https://example.com");
    brand = brand || { title: content.title, logo: content.logo, colors: content.colors, image: content.image };
  } else if ((!content || !content.text) && body.url && isSafeUrl(body.url)) {
    const html = await fetchHtml(body.url);
    content = extract(html, body.url);
    brand = brand || { title: content.title, logo: content.logo, colors: content.colors, image: content.image };
  }
  if (!content) return json(400, { error: "No site content to redesign." });

  let out;
  try {
    out = await generate(SYSTEM, buildPrompt(brand, content));
  } catch (e) {
    return json(502, { error: e.message || "Redesign generation failed." });
  }
  out = out.replace(/```html/gi, "").replace(/```/g, "").trim();
  const s = out.toLowerCase().indexOf("<!doctype");
  if (s > 0) out = out.slice(s);
  if (!/<\/html>|<\/body>/i.test(out)) {
    if (out.length > 600 && /<body/i.test(out)) out += "</body></html>";
    else return json(422, { error: "The redesign came back incomplete — please try again." });
  }
  return json(200, { afterHtml: out });
};
