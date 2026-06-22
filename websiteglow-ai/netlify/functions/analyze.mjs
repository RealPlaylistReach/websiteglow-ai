// POST /api/analyze
// Body: { url } -> screenshots the live site + fetches HTML + runs a real heuristic audit
//        { html } -> audits pasted HTML only (no screenshot; the client already has the markup)
// Returns: { beforeImage, audit, brand, content, warning? }

const json = (status, obj) =>
  new Response(JSON.stringify(obj), { status, headers: { "content-type": "application/json" } });

/* ---------- url safety (basic SSRF guard) ---------- */
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

function withTimeout(ms) {
  const c = new AbortController();
  const t = setTimeout(() => c.abort(), ms);
  return { signal: c.signal, clear: () => clearTimeout(t) };
}

/* ---------- fetch raw HTML ---------- */
async function fetchHtml(url) {
  const { signal, clear } = withTimeout(7000);
  try {
    const r = await fetch(url, {
      signal,
      redirect: "follow",
      headers: {
        "user-agent":
          "Mozilla/5.0 (compatible; WebsiteGlowBot/1.0; +https://websiteglow.ai)",
        accept: "text/html,application/xhtml+xml",
      },
    });
    const ct = r.headers.get("content-type") || "";
    if (!ct.includes("html")) return "";
    const txt = await r.text();
    return txt.slice(0, 600000); // cap
  } catch {
    return "";
  } finally {
    clear();
  }
}

/* ---------- screenshot via ScreenshotOne -> base64 (key stays server-side) ---------- */
async function screenshot(url) {
  const key = process.env.SCREENSHOTONE_ACCESS_KEY;
  if (!key) return null;
  const q = new URLSearchParams({
    access_key: key,
    url,
    viewport_width: "1280",
    viewport_height: "900",
    full_page: "false",
    format: "jpg",
    image_quality: "78",
    block_ads: "true",
    block_cookie_banners: "true",
    block_trackers: "true",
    cache: "true",
    cache_ttl: "86400",
  });
  const { signal, clear } = withTimeout(12000);
  try {
    const r = await fetch("https://api.screenshotone.com/take?" + q.toString(), { signal });
    if (!r.ok) return null;
    const buf = Buffer.from(await r.arrayBuffer());
    if (!buf.length) return null;
    return "data:image/jpeg;base64," + buf.toString("base64");
  } catch {
    return null;
  } finally {
    clear();
  }
}

/* ---------- brand + content extraction ---------- */
const stripTags = (s) => s.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
const attr = (tag, name) => {
  const m = tag.match(new RegExp(name + '\\s*=\\s*["\']([^"\']+)["\']', "i"));
  return m ? m[1] : null;
};
function absolute(base, maybe) {
  try { return new URL(maybe, base).href; } catch { return null; }
}

function extractBrand(html, baseUrl) {
  const title =
    (html.match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1] || "").trim().slice(0, 120) ||
    (html.match(/property=["']og:site_name["'][^>]*content=["']([^"']+)/i)?.[1] || "");
  // logo
  let logo = null;
  const ogImg = html.match(/property=["']og:image["'][^>]*content=["']([^"']+)/i)?.[1];
  const logoImg = (html.match(/<img\b[^>]*>/gi) || []).find((t) =>
    /logo/i.test((attr(t, "src") || "") + (attr(t, "alt") || "") + (attr(t, "class") || ""))
  );
  if (logoImg) logo = absolute(baseUrl, attr(logoImg, "src"));
  // colors
  const counts = {};
  (html.match(/#[0-9a-fA-F]{6}/g) || []).forEach((c) => {
    const v = c.toLowerCase();
    if (["#ffffff", "#000000", "#fefefe", "#fafafa", "#111111"].includes(v)) return;
    counts[v] = (counts[v] || 0) + 1;
  });
  const theme = html.match(/name=["']theme-color["'][^>]*content=["']([^"']+)/i)?.[1];
  let colors = Object.entries(counts).sort((a, b) => b[1] - a[1]).map((x) => x[0]).slice(0, 4);
  if (theme && /^#?[0-9a-fA-F]{6}$/.test(theme.replace("#", ""))) {
    const t = theme.startsWith("#") ? theme.toLowerCase() : "#" + theme.toLowerCase();
    colors = [t, ...colors.filter((c) => c !== t)].slice(0, 4);
  }
  const image = ogImg ? absolute(baseUrl, ogImg) : null;
  return { title, logo, colors, image };
}

function extractContent(html, baseUrl) {
  const headings = [];
  (html.match(/<h[1-3][^>]*>([\s\S]*?)<\/h[1-3]>/gi) || []).forEach((h) => {
    const t = stripTags(h);
    if (t && t.length < 140) headings.push(t);
  });
  // visible text
  const body = html
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<noscript[\s\S]*?<\/noscript>/gi, " ");
  const text = stripTags(body).slice(0, 2600);
  // nav
  const navBlock = html.match(/<nav[\s\S]*?<\/nav>/i)?.[0] || "";
  const navItems = [...new Set(
    (navBlock.match(/<a\b[^>]*>([\s\S]*?)<\/a>/gi) || [])
      .map((a) => stripTags(a))
      .filter((t) => t && t.length < 30)
  )].slice(0, 7);
  const phone = (html.match(/tel:([+\d().\-\s]{7,})/i)?.[1] || html.match(/(\(?\d{3}\)?[\s.\-]\d{3}[\s.\-]\d{4})/)?.[1] || "").trim();
  const email = (html.match(/mailto:([^"'?]+)/i)?.[1] || "").trim();
  // a few absolute images for the rebuild
  const images = [...new Set(
    (html.match(/<img\b[^>]*>/gi) || [])
      .map((t) => absolute(baseUrl, attr(t, "src")))
      .filter((u) => u && /^https?:/.test(u) && /\.(png|jpe?g|webp|svg|avif)/i.test(u))
  )].slice(0, 4);
  return { headings: headings.slice(0, 12), text, navItems, phone, email, images };
}

/* ---------- real heuristic audit ---------- */
function clamp(n) { return Math.max(2, Math.min(98, Math.round(n))); }

function runAudit(html, url) {
  const lower = html.toLowerCase();
  const hasViewport = /<meta[^>]+name=["']viewport["']/i.test(html);
  const titleM = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1]?.trim() || "";
  const hasDesc = /<meta[^>]+name=["']description["']/i.test(html);
  const h1 = (html.match(/<h1[\s>]/gi) || []).length;
  const imgs = (html.match(/<img\b[^>]*>/gi) || []);
  const imgsAlt = imgs.filter((t) => /\balt\s*=\s*["'][^"']+["']/i.test(t)).length;
  const hasLang = /<html[^>]+lang=/i.test(html);
  const scripts = (html.match(/<script\b/gi) || []).length;
  const sheets = (html.match(/<link[^>]+stylesheet/gi) || []).length;
  const media = /@media/.test(lower);
  const deprecated = /<(center|font|marquee)\b/i.test(html) || /\bbgcolor=/i.test(html);
  const tables = (html.match(/<table\b/gi) || []).length;
  const https = url.startsWith("https://");
  const og = /property=["']og:/i.test(html);
  const ctaWords = /(buy|order|book|contact|get started|sign up|shop now|call now|subscribe|download|request|get a quote|schedule)/i;
  const ctaHits = (html.match(new RegExp(ctaWords.source, "gi")) || []).length;
  const hasForm = /<form\b/i.test(html);
  const hasContact = /tel:|mailto:/i.test(html);
  const kb = Math.round(html.length / 1024);

  let mobile = 100;
  if (!hasViewport) mobile -= 58;
  if (!media) mobile -= 18;
  if (tables > 3) mobile -= 14;

  let seo = 8;
  if (titleM && titleM.length >= 10 && titleM.length <= 65) seo += 26; else if (titleM) seo += 12;
  if (hasDesc) seo += 20;
  seo += h1 === 1 ? 16 : h1 > 1 ? 6 : 0;
  if (https) seo += 16;
  if (og) seo += 14;

  const altRatio = imgs.length ? imgsAlt / imgs.length : 1;
  let access = 0;
  access += hasLang ? 28 : 0;
  access += Math.round(altRatio * 42);
  access += deprecated ? 0 : 16;
  access += h1 >= 1 ? 14 : 0;

  let perf = 100;
  if (kb > 120) perf -= Math.min(35, (kb - 120) / 6);
  perf -= Math.min(28, scripts * 2.5);
  perf -= Math.min(16, sheets * 2);

  let design = 100;
  if (deprecated) design -= 38;
  if (tables > 3) design -= 16;
  if (!hasViewport) design -= 22;
  if (!og) design -= 8;

  let conversion = 6;
  conversion += ctaHits >= 1 ? 30 : 0;
  conversion += ctaHits >= 3 ? 16 : 0;
  conversion += hasForm ? 22 : 0;
  conversion += hasContact ? 22 : 0;

  const cats = {
    design: clamp(design),
    mobile: clamp(mobile),
    conversion: clamp(conversion),
    accessibility: clamp(access),
    seo: clamp(seo),
    performance: clamp(perf),
  };
  const overall = clamp(
    cats.design * 0.22 + cats.mobile * 0.2 + cats.conversion * 0.2 +
    cats.accessibility * 0.13 + cats.seo * 0.13 + cats.performance * 0.12
  );

  // real, specific findings from failed checks (ranked)
  const f = [];
  if (!hasViewport) f.push(["No viewport tag — the site doesn't scale on phones", 5]);
  if (imgs.length && imgsAlt < imgs.length) f.push([`${imgs.length - imgsAlt} of ${imgs.length} images are missing alt text`, 4]);
  if (deprecated || tables > 3) f.push(["Uses dated, table/center-based layout markup", 4]);
  if (!hasDesc) f.push(["Missing meta description — weak in search results", 3]);
  if (h1 !== 1) f.push([h1 === 0 ? "No H1 heading — unclear page hierarchy" : "Multiple H1s — confused heading structure", 3]);
  if (ctaHits === 0) f.push(["No clear call-to-action above the fold", 4]);
  if (!https) f.push(["Not served over HTTPS — flagged as 'not secure'", 4]);
  if (!hasLang) f.push(["Missing lang attribute — hurts accessibility", 2]);
  if (kb > 200) f.push([`Heavy page (~${kb}KB of HTML) — slower to load`, 2]);
  if (!og) f.push(["No social/Open Graph tags — poor link previews", 2]);
  const findings = f.sort((a, b) => b[1] - a[1]).slice(0, 6).map((x) => x[0]);
  if (findings.length === 0) findings.push("Solid fundamentals — opportunities are mostly visual polish");

  const summary =
    overall < 45 ? "Looks roughly a decade out of date, with weak mobile support and unclear calls to action."
    : overall < 65 ? "Decent bones, but the design, mobile experience and conversion paths need a modern pass."
    : "Reasonably modern — targeted upgrades to hierarchy, CTAs and polish will lift conversions.";

  return { overall, categories: cats, summary, findings };
}

/* ---------- handler ---------- */
export default async (req) => {
  if (req.method !== "POST") return json(405, { error: "POST only" });
  let body = {};
  try { body = await req.json(); } catch { return json(400, { error: "Invalid JSON body" }); }

  // paste-HTML path
  if (body.html && typeof body.html === "string") {
    const html = body.html.slice(0, 600000);
    const audit = runAudit(html, "(pasted)");
    const brand = extractBrand(html, "https://example.com");
    const content = extractContent(html, "https://example.com");
    return json(200, { beforeImage: null, audit, brand, content });
  }

  // URL path
  const url = (body.url || "").trim();
  if (!url || !isSafeUrl(url)) return json(400, { error: "Enter a valid public website URL (https://…)." });

  const [img, html] = await Promise.all([screenshot(url), fetchHtml(url)]);
  if (!html && !img) {
    return json(422, {
      error: "Couldn't reach this site. It may block automated requests — try the “paste your HTML” option.",
    });
  }
  const audit = runAudit(html || "", url);
  const brand = extractBrand(html || "", url);
  const content = extractContent(html || "", url);
  const beforeImage = img || brand.image || null;

  return json(200, {
    beforeImage,
    audit,
    brand,
    content,
    warning: img ? undefined : "Live screenshot unavailable — set SCREENSHOTONE_ACCESS_KEY for a true before/after.",
  });
};
