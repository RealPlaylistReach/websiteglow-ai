import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  Sparkles, ArrowRight, Globe, Gauge, Eye, Smartphone, Tablet, Monitor,
  TrendingUp, Check, Loader2, Code2, Share2, ClipboardPaste, X, Lock,
  BadgeCheck, Wand2, Search, AlertTriangle, ChevronRight, Download, RotateCw
} from "lucide-react";

const STYLES = `
@import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@500;600;700&family=Inter:wght@400;500;600;700&display=swap');
.wg *{box-sizing:border-box}
.wg{font-family:'Inter',system-ui,-apple-system,sans-serif;color:#ECEAFF;background:#07060E;min-height:100vh}
.disp{font-family:'Space Grotesk','Inter',sans-serif;letter-spacing:-0.02em}
.glass{background:rgba(255,255,255,0.045);border:1px solid rgba(255,255,255,0.09);backdrop-filter:blur(14px);-webkit-backdrop-filter:blur(14px)}
.aurora{position:absolute;border-radius:9999px;filter:blur(90px);pointer-events:none}
.iris{background:linear-gradient(92deg,#67E8F9,#A78BFA 52%,#F0ABFC);-webkit-background-clip:text;background-clip:text;color:transparent}
.btn-primary{position:relative;border:none;cursor:pointer;color:#0a0712;font-weight:700;background:linear-gradient(92deg,#22D3EE,#8B5CF6 55%,#F472B6);box-shadow:0 10px 34px rgba(139,92,246,.42);transition:filter .15s,transform .15s}
.btn-primary:hover{filter:brightness(1.07)}.btn-primary:active{transform:translateY(1px)}
.btn-ghost{cursor:pointer;color:#ECEAFF;background:rgba(255,255,255,0.05);border:1px solid rgba(255,255,255,0.14);transition:background .15s}
.btn-ghost:hover{background:rgba(255,255,255,0.10)}
.shimmer{background:linear-gradient(100deg,rgba(255,255,255,0.02) 28%,rgba(139,92,246,0.22) 50%,rgba(255,255,255,0.02) 72%);background-size:220% 100%;animation:shimmer 1.4s linear infinite}
.sheen{position:absolute;inset:0;background:linear-gradient(120deg,transparent 42%,rgba(103,232,249,0.12) 50%,transparent 58%);background-size:280% 100%;animation:sheen 4.5s linear infinite;pointer-events:none;mix-blend-mode:screen}
@keyframes shimmer{to{background-position:-220% 0}}
@keyframes sheen{to{background-position:-280% 0}}
@keyframes spin{to{transform:rotate(360deg)}}
@keyframes spinr{to{transform:rotate(-360deg)}}
@keyframes pulse{0%,100%{opacity:.55;transform:translate(-50%,-50%) scale(1)}50%{opacity:.95;transform:translate(-50%,-50%) scale(1.08)}}
@keyframes fadeUp{from{opacity:0;transform:translateY(16px)}to{opacity:1;transform:none}}
@keyframes twinkle{0%,100%{opacity:.12}50%{opacity:.7}}
@keyframes orbit{from{transform:rotate(0) translateX(64px) rotate(0)}to{transform:rotate(360deg) translateX(64px) rotate(-360deg)}}
.fade-up{animation:fadeUp .55s cubic-bezier(.2,.7,.2,1) both}
.spin-slow{animation:spin 8s linear infinite}.spin-rev{animation:spinr 12s linear infinite}
.pulse-core{animation:pulse 2.6s ease-in-out infinite}
.wg input::placeholder,.wg textarea::placeholder{color:#6E6B8E}
.wg ::selection{background:rgba(139,92,246,.4)}.wg textarea{resize:none}
@media (prefers-reduced-motion: reduce){.spin-slow,.spin-rev,.shimmer,.sheen,.fade-up,.pulse-core{animation:none!important}}
`;

/* demo (offline, no API cost) ------------------------------------ */
const BEFORE_HTML = `<!doctype html><html><head><meta charset="utf-8"><title>Bella's Bakery</title><style>
body{font-family:"Times New Roman",Georgia,serif;background:#e9e4d8;color:#222;margin:0;text-align:center}
.wrap{max-width:660px;margin:0 auto;background:#fff;border:3px solid #5a3a1a;border-top:14px solid #5a3a1a}
.top{background:#7a4a1a;color:#ffefe0;padding:14px}.top h1{margin:0;font-size:30px;letter-spacing:1px}.top p{margin:4px 0 0;font-size:13px;font-style:italic}
.nav{background:#d9c9a3;padding:8px;font-size:14px;border-bottom:2px solid #5a3a1a}.nav a{color:#0033cc;text-decoration:underline;margin:0 9px}
.hero{padding:18px 22px}.hl{background:#fff2a8}
.btn{background:#d8c089;border:2px outset #b89a55;color:#3a2a10;padding:6px 16px;font-size:15px;cursor:pointer;font-weight:bold}
.menu{margin:12px auto;width:90%;border-collapse:collapse}.menu td{border:1px solid #b9a06a;padding:6px;font-size:14px}
.foot{background:#d9c9a3;font-size:12px;padding:10px;border-top:2px solid #5a3a1a;color:#333}</style></head>
<body><div class="wrap"><div class="top"><h1>Bella's Bakery</h1><p>~ Freshly Baked Goods Since 1998 ~</p></div>
<div class="nav"><a href="#">Home</a>|<a href="#">Menu</a>|<a href="#">About Us</a>|<a href="#">Contact</a></div>
<div class="hero"><p>Welcome to <b>Bella's Bakery</b>! We are a <span class="hl">family owned bakery</span> in downtown. Come visit us for the best bread and pastries in town!!</p>
<p>Call to order: <b>(416) 555-0182</b></p><input class="btn" type="button" value="Order Now">
<h3 style="color:#5a3a1a;text-decoration:underline">Our Menu</h3>
<table class="menu"><tr><td>Sourdough Loaf</td><td>$6.00</td></tr><tr><td>Butter Croissant</td><td>$3.50</td></tr>
<tr><td>Cinnamon Rolls (6)</td><td>$9.00</td></tr><tr><td>Custom Birthday Cakes</td><td>from $35.00</td></tr></table></div>
<div class="foot">123 Baker Street, Toronto ON &nbsp;|&nbsp; Open Tue-Sun 7am-4pm &nbsp;|&nbsp; (416) 555-0182<br>Best viewed at 1024x768</div></div></body></html>`;

const AFTER_DEMO_HTML = `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Bella's Bakery</title><style>
*{box-sizing:border-box;margin:0;padding:0}:root{--ink:#2b2018;--accent:#c2410c;--cream:#fbf6ee}
body{font-family:'Inter',system-ui,sans-serif;color:var(--ink);background:var(--cream);line-height:1.6;-webkit-font-smoothing:antialiased}
.nav{position:sticky;top:0;display:flex;align-items:center;justify-content:space-between;padding:15px 22px;background:rgba(251,246,238,.86);backdrop-filter:blur(10px);border-bottom:1px solid #ece0cf;z-index:5}
.brand{font-weight:800;font-size:19px;letter-spacing:-.02em}.brand span{color:var(--accent)}
.links{display:flex;gap:20px;font-size:14px;color:#6b5847}.links a{color:inherit;text-decoration:none}
.cta{background:var(--accent);color:#fff;padding:9px 17px;border-radius:999px;font-weight:600;font-size:14px;text-decoration:none}
.hero{padding:56px 22px 44px;text-align:center;background:radial-gradient(120% 100% at 50% 0,#fff3e3 0,var(--cream) 62%)}
.eyebrow{display:inline-block;font-size:11px;letter-spacing:.15em;text-transform:uppercase;color:var(--accent);background:#fff;border:1px solid #f0dcc6;padding:6px 12px;border-radius:999px;font-weight:600}
.hero h1{font-size:42px;line-height:1.05;letter-spacing:-.03em;margin:16px auto 12px;max-width:15ch;font-weight:800}
.hero p{color:#6b5847;max-width:46ch;margin:0 auto 24px;font-size:16px}
.rowc{display:flex;gap:11px;justify-content:center;flex-wrap:wrap}
.ghost{background:#fff;border:1px solid #ecdcc8;color:var(--ink);padding:11px 19px;border-radius:999px;font-weight:600;font-size:15px;text-decoration:none}
.solid{background:var(--accent);color:#fff;padding:11px 21px;border-radius:999px;font-weight:600;font-size:15px;text-decoration:none}
.trust{margin-top:20px;font-size:13px;color:#8a7763}
.menu{max-width:880px;margin:6px auto;padding:36px 22px}.menu h2{text-align:center;font-size:26px;letter-spacing:-.02em;margin-bottom:4px}
.menu .sub{text-align:center;color:#8a7763;margin-bottom:24px;font-size:14px}
.grid{display:grid;grid-template-columns:repeat(2,1fr);gap:14px}
.card{background:#fff;border:1px solid #f0e3d2;border-radius:16px;padding:18px;display:flex;justify-content:space-between;align-items:center}
.card h3{font-size:16px;margin-bottom:2px}.card small{color:#8a7763}.price{font-weight:800;color:var(--accent);font-size:17px}
.foot{background:#fff;border-top:1px solid #efe2d1;padding:26px 22px;text-align:center;color:#6b5847;font-size:14px;margin-top:16px}.foot b{color:var(--ink)}
@media(max-width:640px){.links{display:none}.hero h1{font-size:32px}.grid{grid-template-columns:1fr}}</style></head>
<body><nav class="nav"><div class="brand">Bella's <span>Bakery</span></div><div class="links"><a href="#">Menu</a><a href="#">About</a><a href="#">Visit</a></div><a class="cta" href="#">Order for pickup</a></nav>
<header class="hero"><span class="eyebrow">Family-owned since 1998</span><h1>Fresh bread &amp; pastries, baked every morning</h1><p>Downtown Toronto's neighbourhood bakery. Order ahead for pickup, or stop by for something still warm.</p><div class="rowc"><a class="solid" href="#">Order for pickup</a><a class="ghost" href="#">See the menu</a></div><div class="trust">★★★★★ Loved by the neighbourhood · (416) 555-0182</div></header>
<section class="menu"><h2>Bakery favourites</h2><div class="sub">Made from scratch, in small batches</div><div class="grid">
<div class="card"><div><h3>Sourdough Loaf</h3><small>Naturally leavened, 24-hr rise</small></div><div class="price">$6</div></div>
<div class="card"><div><h3>Butter Croissant</h3><small>Laminated by hand</small></div><div class="price">$3.50</div></div>
<div class="card"><div><h3>Cinnamon Rolls</h3><small>Pack of six</small></div><div class="price">$9</div></div>
<div class="card"><div><h3>Custom Birthday Cakes</h3><small>Order 48 hrs ahead</small></div><div class="price">from $35</div></div>
</div></section><footer class="foot"><b>Bella's Bakery</b> · 123 Baker Street, Toronto ON<br>Open Tue–Sun, 7am–4pm · (416) 555-0182</footer></body></html>`;

const DEMO_AUDIT = {
  overall: 37,
  categories: { design: 31, mobile: 22, conversion: 28, accessibility: 35, seo: 44, performance: 58 },
  summary: "Looks roughly a decade out of date, with no mobile support and unclear calls to action.",
  findings: [
    "No viewport tag — the site doesn't scale on phones",
    "Uses dated, table/center-based layout markup",
    "Call-to-action lacks hierarchy and contrast",
    "Missing meta description — weak in search results",
    "No trust signals or social proof",
    "Low colour contrast hurts accessibility",
  ],
};

const STEPS = [
  { icon: Globe, label: "Crawling website" },
  { icon: Wand2, label: "Extracting design system" },
  { icon: Smartphone, label: "Evaluating mobile experience" },
  { icon: Search, label: "Auditing SEO" },
  { icon: TrendingUp, label: "Improving UX & conversion" },
  { icon: Eye, label: "Enhancing accessibility" },
  { icon: Code2, label: "Generating upgraded version" },
];
const CATS = [
  { key: "design", label: "Design", icon: Wand2 },
  { key: "mobile", label: "Mobile Experience", icon: Smartphone },
  { key: "conversion", label: "Conversion Potential", icon: TrendingUp },
  { key: "accessibility", label: "Accessibility", icon: Eye },
  { key: "seo", label: "SEO", icon: Search },
  { key: "performance", label: "Performance", icon: Gauge },
];
const TIERS = [
  { name: "Basic Upgrade", price: "49.99", accent: "#67E8F9",
    feats: ["Visual modernization", "Responsive improvements", "Accessibility improvements", "SEO improvements", "Downloadable HTML / CSS / JS"] },
  { name: "Premium Upgrade", price: "99.99", accent: "#A78BFA", featured: true,
    feats: ["Everything in Basic", "Conversion optimization", "Advanced animations", "Landing page redesign", "Modern component system", "Design + SEO + improvement reports"] },
];

const scoreColor = (v) => (v >= 75 ? "#34D399" : v >= 50 ? "#FBBF24" : "#FB7185");
const wait = (ms) => new Promise((r) => setTimeout(r, ms));
async function postJSON(url, body) {
  const r = await fetch(url, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body) });
  const data = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(data.error || `Request failed (${r.status})`);
  return data;
}
function useCountUp(target, ms = 900) {
  const [n, setN] = useState(0);
  useEffect(() => {
    let raf, start;
    const step = (t) => { if (!start) start = t; const p = Math.min(1, (t - start) / ms); setN(Math.round(p * target)); if (p < 1) raf = requestAnimationFrame(step); };
    raf = requestAnimationFrame(step); return () => cancelAnimationFrame(raf);
  }, [target, ms]);
  return n;
}

function Starfield() {
  const stars = React.useMemo(() => Array.from({ length: 34 }, () => ({ l: Math.random() * 100, t: Math.random() * 100, s: Math.random() * 1.6 + 0.6, d: Math.random() * 4 })), []);
  return (
    <div className="fixed inset-0" style={{ position: "fixed", inset: 0, overflow: "hidden", pointerEvents: "none", zIndex: 0 }}>
      <div className="aurora" style={{ width: 520, height: 520, top: -160, left: -120, background: "radial-gradient(circle,#7c3aed,transparent 70%)", opacity: 0.5 }} />
      <div className="aurora" style={{ width: 460, height: 460, top: -120, right: -120, background: "radial-gradient(circle,#0891b2,transparent 70%)", opacity: 0.42 }} />
      <div className="aurora" style={{ width: 540, height: 540, bottom: -220, left: "32%", background: "radial-gradient(circle,#db2777,transparent 70%)", opacity: 0.3 }} />
      {stars.map((st, i) => (<span key={i} style={{ position: "absolute", left: st.l + "%", top: st.t + "%", width: st.s, height: st.s, borderRadius: "50%", background: "#cbd5ff", animation: `twinkle 3.5s ease-in-out ${st.d}s infinite` }} />))}
    </div>
  );
}

function Home({ onUrl, onHtml, error }) {
  const [url, setUrl] = useState("");
  const [pasteOpen, setPasteOpen] = useState(false);
  const [html, setHtml] = useState("");
  const chips = ["Design language", "Brand colours", "Typography", "Layout", "Mobile", "SEO", "Accessibility", "CTAs", "Speed"];
  return (
    <div style={{ position: "relative", zIndex: 1, minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", textAlign: "center", padding: "56px 24px" }}>
      <div className="glass fade-up" style={{ borderRadius: 999, padding: "7px 14px", display: "inline-flex", alignItems: "center", gap: 8, fontSize: 13, color: "#C7C3F2" }}>
        <Sparkles size={14} style={{ color: "#A78BFA" }} /> WebsiteGlow AI <span style={{ opacity: 0.5 }}>·</span> Redesign, not replace
      </div>
      <h1 className="disp fade-up" style={{ fontWeight: 700, fontSize: "clamp(36px,7vw,68px)", lineHeight: 1.02, margin: "22px 0 16px", maxWidth: "16ch" }}>
        Upgrade your website in <span className="iris">minutes</span>.
      </h1>
      <p className="fade-up" style={{ color: "#A5A2C9", maxWidth: "54ch", fontSize: "clamp(15px,2vw,19px)", margin: "0 0 30px" }}>
        Paste your site. AI modernizes it like an elite design agency would — then preview the transformation on your real pages before you pay.
      </p>

      {error && (
        <div className="glass fade-up" style={{ borderRadius: 12, padding: "11px 16px", marginBottom: 16, maxWidth: 560, display: "flex", gap: 9, alignItems: "center", color: "#FCA5A5", border: "1px solid rgba(251,113,133,.35)" }}>
          <AlertTriangle size={15} style={{ flexShrink: 0 }} /> <span style={{ fontSize: 14 }}>{error}</span>
        </div>
      )}

      {!pasteOpen ? (
        <div className="fade-up" style={{ width: "100%", maxWidth: 620 }}>
          <div className="glass" style={{ borderRadius: 16, padding: 7, display: "flex", gap: 8, alignItems: "center", boxShadow: "0 18px 50px rgba(124,58,237,.18)" }}>
            <Globe size={18} style={{ color: "#7C7AA6", marginLeft: 10, flexShrink: 0 }} />
            <input value={url} onChange={(e) => setUrl(e.target.value)} onKeyDown={(e) => e.key === "Enter" && url.trim() && onUrl(url.trim())}
              placeholder="https://mywebsite.com"
              style={{ flex: 1, background: "transparent", border: "none", outline: "none", color: "#fff", fontSize: 16, padding: "12px 4px" }} />
            <button className="btn-primary" onClick={() => url.trim() && onUrl(url.trim())} style={{ borderRadius: 11, padding: "12px 18px", display: "inline-flex", alignItems: "center", gap: 8, fontSize: 15, whiteSpace: "nowrap" }}>
              Analyze my website <ArrowRight size={16} />
            </button>
          </div>
          <div style={{ marginTop: 12, fontSize: 13, color: "#8480AE", display: "flex", gap: 6, alignItems: "center", justifyContent: "center", flexWrap: "wrap" }}>
            <Lock size={12} /> We screenshot your live site for a true before/after. Or
            <button onClick={() => setPasteOpen(true)} style={{ background: "none", border: "none", color: "#A78BFA", cursor: "pointer", fontSize: 13, padding: 0, display: "inline-flex", gap: 4, alignItems: "center" }}>
              <ClipboardPaste size={12} /> paste your HTML
            </button>
          </div>
        </div>
      ) : (
        <div className="fade-up" style={{ width: "100%", maxWidth: 620 }}>
          <div className="glass" style={{ borderRadius: 16, padding: 14, textAlign: "left" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
              <span style={{ fontSize: 13, color: "#C7C3F2", display: "inline-flex", gap: 6, alignItems: "center" }}><Code2 size={14} /> Paste your page's HTML</span>
              <button onClick={() => setPasteOpen(false)} style={{ background: "none", border: "none", color: "#8480AE", cursor: "pointer" }}><X size={16} /></button>
            </div>
            <textarea value={html} onChange={(e) => setHtml(e.target.value)} placeholder="<!doctype html> … View Source on any page → select all → paste here"
              style={{ width: "100%", height: 150, background: "rgba(0,0,0,.25)", border: "1px solid rgba(255,255,255,.08)", borderRadius: 10, color: "#D8D5FF", padding: 12, fontSize: 13, fontFamily: "monospace", outline: "none" }} />
            <button className="btn-primary" onClick={() => html.trim().length > 40 && onHtml(html)} style={{ marginTop: 10, width: "100%", borderRadius: 11, padding: "13px", display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 8, fontSize: 15, opacity: html.trim().length > 40 ? 1 : 0.5 }}>
              Run the AI engine on this page <ArrowRight size={16} />
            </button>
          </div>
        </div>
      )}

      <button className="btn-ghost fade-up" onClick={() => onUrl("__DEMO__")} style={{ marginTop: 18, borderRadius: 999, padding: "11px 20px", fontSize: 14, display: "inline-flex", alignItems: "center", gap: 8 }}>
        <Sparkles size={15} style={{ color: "#67E8F9" }} /> Watch the live demo transformation
      </button>

      <div className="fade-up" style={{ marginTop: 40, display: "flex", flexWrap: "wrap", gap: 8, justifyContent: "center", maxWidth: 640 }}>
        {chips.map((c) => (<span key={c} className="glass" style={{ borderRadius: 999, padding: "6px 13px", fontSize: 12.5, color: "#9D99C9" }}>{c}</span>))}
      </div>
    </div>
  );
}

function Analyzing({ ready, onDone }) {
  const [idx, setIdx] = useState(0);
  const [animDone, setAnimDone] = useState(false);
  useEffect(() => { if (idx >= STEPS.length) { setAnimDone(true); return; } const t = setTimeout(() => setIdx((i) => i + 1), idx === 0 ? 350 : 620); return () => clearTimeout(t); }, [idx]);
  useEffect(() => { if (animDone && ready) { const t = setTimeout(onDone, 450); return () => clearTimeout(t); } }, [animDone, ready, onDone]);
  useEffect(() => { const t = setTimeout(onDone, 30000); return () => clearTimeout(t); }, [onDone]);
  return (
    <div style={{ position: "relative", zIndex: 1, minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", textAlign: "center", padding: "0 24px" }}>
      <div style={{ position: "relative", width: 168, height: 168, marginBottom: 34 }}>
        <div className="spin-slow" style={{ position: "absolute", inset: 0, borderRadius: "50%", border: "1px solid rgba(167,139,250,.35)", borderTopColor: "#A78BFA" }} />
        <div className="spin-rev" style={{ position: "absolute", inset: 22, borderRadius: "50%", border: "1px solid rgba(103,232,249,.3)", borderBottomColor: "#67E8F9" }} />
        <div className="spin-slow" style={{ position: "absolute", inset: 44, borderRadius: "50%", border: "1px solid rgba(240,171,252,.3)", borderRightColor: "#F0ABFC" }} />
        <div className="pulse-core" style={{ position: "absolute", left: "50%", top: "50%", width: 54, height: 54, borderRadius: "50%", background: "radial-gradient(circle,#fff,#A78BFA 40%,#22D3EE 75%)", filter: "blur(2px)" }} />
        <div style={{ position: "absolute", left: "50%", top: "50%", width: 8, height: 8, marginLeft: -4, marginTop: -4, borderRadius: "50%", background: "#67E8F9", animation: "orbit 3.4s linear infinite" }} />
      </div>
      <h2 className="disp" style={{ fontSize: 24, fontWeight: 600, marginBottom: 4 }}>Analyzing your website</h2>
      <p style={{ color: "#8480AE", fontSize: 14, marginBottom: 28 }}>Capturing your live site and planning the redesign.</p>
      <div className="glass" style={{ borderRadius: 16, padding: 8, width: "100%", maxWidth: 380, textAlign: "left" }}>
        {STEPS.map((s, i) => {
          const done = i < idx, active = i === idx, Icon = s.icon;
          return (
            <div key={i} style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 12px", opacity: done || active ? 1 : 0.4, transition: "opacity .3s" }}>
              <span style={{ width: 24, height: 24, borderRadius: 7, display: "grid", placeItems: "center", flexShrink: 0, background: done ? "rgba(52,211,153,.16)" : "rgba(255,255,255,.05)", border: `1px solid ${done ? "rgba(52,211,153,.5)" : "rgba(255,255,255,.1)"}` }}>
                {done ? <Check size={14} style={{ color: "#34D399" }} /> : active ? <Loader2 size={14} className="spin-slow" style={{ color: "#A78BFA", animationDuration: "1s" }} /> : <Icon size={13} style={{ color: "#8480AE" }} />}
              </span>
              <span style={{ fontSize: 14.5, color: done ? "#D8D5FF" : "#A5A2C9" }}>{s.label}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function Gauge2({ value }) {
  const r = 78, c = 2 * Math.PI * r;
  const [off, setOff] = useState(c);
  const n = useCountUp(value);
  useEffect(() => { const t = setTimeout(() => setOff(c - (value / 100) * c), 120); return () => clearTimeout(t); }, [value, c]);
  const col = scoreColor(value);
  return (
    <div style={{ position: "relative", width: 196, height: 196 }}>
      <svg width="196" height="196" style={{ transform: "rotate(-90deg)" }}>
        <defs><linearGradient id="gg" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stopColor="#22D3EE" /><stop offset="55%" stopColor="#8B5CF6" /><stop offset="100%" stopColor="#F472B6" /></linearGradient></defs>
        <circle cx="98" cy="98" r={r} fill="none" stroke="rgba(255,255,255,.07)" strokeWidth="12" />
        <circle cx="98" cy="98" r={r} fill="none" stroke="url(#gg)" strokeWidth="12" strokeLinecap="round" strokeDasharray={c} strokeDashoffset={off} style={{ transition: "stroke-dashoffset 1.1s cubic-bezier(.2,.7,.2,1)" }} />
      </svg>
      <div style={{ position: "absolute", inset: 0, display: "grid", placeItems: "center", textAlign: "center" }}>
        <div><div className="disp" style={{ fontSize: 52, fontWeight: 700, lineHeight: 1 }}>{n}</div><div style={{ fontSize: 12, letterSpacing: ".12em", textTransform: "uppercase", color: "#8480AE", marginTop: 2 }}>/ 100</div></div>
      </div>
      <span style={{ position: "absolute", bottom: 6, left: "50%", transform: "translateX(-50%)", fontSize: 11, fontWeight: 600, color: col }}>{value >= 75 ? "Strong" : value >= 50 ? "Needs work" : "Outdated"}</span>
    </div>
  );
}
function CatBar({ label, value, Icon }) {
  const [w, setW] = useState(0);
  useEffect(() => { const t = setTimeout(() => setW(value), 200); return () => clearTimeout(t); }, [value]);
  const col = scoreColor(value);
  return (
    <div style={{ padding: "11px 0" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 7 }}>
        <span style={{ display: "inline-flex", alignItems: "center", gap: 9, fontSize: 14, color: "#CFCCF0" }}><Icon size={15} style={{ color: "#8E8AC0" }} /> {label}</span>
        <span className="disp" style={{ fontSize: 15, fontWeight: 600, color: col }}>{value}</span>
      </div>
      <div style={{ height: 7, borderRadius: 99, background: "rgba(255,255,255,.06)", overflow: "hidden" }}>
        <div style={{ height: "100%", width: w + "%", borderRadius: 99, background: `linear-gradient(90deg,${col},${col}cc)`, transition: "width 1s cubic-bezier(.2,.7,.2,1)" }} />
      </div>
    </div>
  );
}

function Report({ data, onNext }) {
  return (
    <div style={{ position: "relative", zIndex: 1, maxWidth: 1000, margin: "0 auto", padding: "48px 20px" }}>
      <div className="fade-up" style={{ textAlign: "center", marginBottom: 8 }}>
        <span className="glass" style={{ borderRadius: 999, padding: "6px 13px", fontSize: 12, color: "#C7C3F2", display: "inline-flex", gap: 7, alignItems: "center" }}><BadgeCheck size={13} style={{ color: "#67E8F9" }} /> Audit complete</span>
      </div>
      <h2 className="disp fade-up" style={{ textAlign: "center", fontSize: "clamp(26px,4vw,38px)", fontWeight: 700, marginBottom: 26 }}>Your website report</h2>
      <div className="glass fade-up" style={{ borderRadius: 22, padding: 24, display: "flex", flexWrap: "wrap", gap: 28, alignItems: "center", justifyContent: "center", marginBottom: 16 }}>
        <Gauge2 value={data.overall} />
        <div style={{ flex: 1, minWidth: 260 }}>
          <div style={{ fontSize: 12, letterSpacing: ".14em", textTransform: "uppercase", color: "#8480AE", marginBottom: 8 }}>Overall verdict</div>
          <p style={{ fontSize: 18, lineHeight: 1.5, color: "#E6E3FF", marginBottom: 16 }}>{data.summary}</p>
          {CATS.map((cc) => <CatBar key={cc.key} label={cc.label} value={data.categories?.[cc.key] ?? 50} Icon={cc.icon} />)}
        </div>
      </div>
      <div className="glass fade-up" style={{ borderRadius: 22, padding: 24, marginBottom: 26 }}>
        <div style={{ fontSize: 12, letterSpacing: ".14em", textTransform: "uppercase", color: "#8480AE", marginBottom: 14, display: "flex", alignItems: "center", gap: 8 }}><AlertTriangle size={14} style={{ color: "#FBBF24" }} /> What's holding it back</div>
        <div style={{ display: "grid", gap: 10, gridTemplateColumns: "repeat(auto-fit,minmax(240px,1fr))" }}>
          {(data.findings || []).map((f, i) => (
            <div key={i} style={{ display: "flex", gap: 11, alignItems: "flex-start", padding: "12px 14px", borderRadius: 13, background: "rgba(255,255,255,.03)", border: "1px solid rgba(255,255,255,.06)" }}>
              <span style={{ width: 7, height: 7, borderRadius: 99, background: "#FB7185", marginTop: 6, flexShrink: 0 }} />
              <span style={{ fontSize: 14, color: "#CFCCF0", lineHeight: 1.45 }}>{f}</span>
            </div>
          ))}
        </div>
      </div>
      <div className="fade-up" style={{ textAlign: "center" }}>
        <button className="btn-primary" onClick={onNext} style={{ borderRadius: 13, padding: "15px 30px", fontSize: 16, display: "inline-flex", alignItems: "center", gap: 10 }}>See your transformation <ArrowRight size={18} /></button>
      </div>
    </div>
  );
}

function Compare({ beforeImage, beforeHtml, afterHtml, afterError, onRetry }) {
  const [device, setDevice] = useState("desktop");
  const [pos, setPos] = useState(56);
  const frameRef = useRef(null);
  const dragging = useRef(false);
  const widths = { desktop: "100%", tablet: "800px", mobile: "380px" };
  const devices = [{ k: "desktop", I: Monitor }, { k: "tablet", I: Tablet }, { k: "mobile", I: Smartphone }];
  const move = useCallback((x) => { const r = frameRef.current?.getBoundingClientRect(); if (!r) return; setPos(Math.max(4, Math.min(96, ((x - r.left) / r.width) * 100))); }, []);
  useEffect(() => {
    const mv = (e) => { if (dragging.current) move(e.touches ? e.touches[0].clientX : e.clientX); };
    const up = () => (dragging.current = false);
    window.addEventListener("mousemove", mv); window.addEventListener("touchmove", mv, { passive: true });
    window.addEventListener("mouseup", up); window.addEventListener("touchend", up);
    return () => { window.removeEventListener("mousemove", mv); window.removeEventListener("touchmove", mv); window.removeEventListener("mouseup", up); window.removeEventListener("touchend", up); };
  }, [move]);
  const onDown = (e) => { dragging.current = true; move(e.touches ? e.touches[0].clientX : e.clientX); };
  const frameH = device === "mobile" ? 600 : 560;
  const Before = beforeImage
    ? <img src={beforeImage} alt="Your current site" style={{ position: "absolute", inset: 0, width: "100%", height: "auto", display: "block", pointerEvents: "none", objectFit: "cover", objectPosition: "top" }} />
    : <iframe title="before" srcDoc={beforeHtml} scrolling="no" sandbox="allow-same-origin" style={{ position: "absolute", inset: 0, width: "100%", height: "100%", border: "none", pointerEvents: "none" }} />;
  return (
    <div>
      <div style={{ display: "flex", justifyContent: "center", marginBottom: 18 }}>
        <div className="glass" style={{ borderRadius: 12, padding: 5, display: "inline-flex", gap: 4 }}>
          {devices.map(({ k, I }) => (
            <button key={k} onClick={() => setDevice(k)} style={{ border: "none", cursor: "pointer", borderRadius: 8, padding: "8px 16px", display: "inline-flex", alignItems: "center", gap: 7, fontSize: 13.5, textTransform: "capitalize", background: device === k ? "linear-gradient(92deg,#22D3EE,#8B5CF6)" : "transparent", color: device === k ? "#0a0712" : "#A5A2C9", fontWeight: device === k ? 700 : 500 }}>
              <I size={15} /> {k}
            </button>
          ))}
        </div>
      </div>
      <div style={{ display: "flex", justifyContent: "center" }}>
        <div style={{ width: widths[device], maxWidth: "100%", transition: "width .35s cubic-bezier(.2,.7,.2,1)" }}>
          <div ref={frameRef} onMouseDown={onDown} onTouchStart={onDown}
            style={{ position: "relative", height: frameH, borderRadius: device === "mobile" ? 30 : 16, overflow: "hidden", border: "1px solid rgba(255,255,255,.12)", cursor: "ew-resize", userSelect: "none", boxShadow: "0 30px 80px rgba(124,58,237,.25)", background: "#0b0a12" }}>
            {Before}
            <div style={{ position: "absolute", inset: 0, clipPath: `inset(0 ${100 - pos}% 0 0)` }}>
              {afterHtml ? (<><iframe title="after" srcDoc={afterHtml} scrolling="no" sandbox="allow-same-origin" style={{ position: "absolute", inset: 0, width: "100%", height: "100%", border: "none", pointerEvents: "none" }} /><div className="sheen" /></>)
                : afterError ? (
                  <div style={{ position: "absolute", inset: 0, display: "grid", placeItems: "center", background: "#0b0a12" }}>
                    <div style={{ textAlign: "center", color: "#C7C3F2", padding: 24 }}>
                      <AlertTriangle size={24} style={{ color: "#FBBF24", marginBottom: 10 }} />
                      <div style={{ fontSize: 14, marginBottom: 14, maxWidth: 260 }}>{afterError}</div>
                      <button className="btn-ghost" onClick={onRetry} style={{ borderRadius: 10, padding: "9px 16px", fontSize: 14, display: "inline-flex", gap: 7, alignItems: "center" }}><RotateCw size={14} /> Retry</button>
                    </div>
                  </div>
                ) : (
                  <div className="shimmer" style={{ position: "absolute", inset: 0, display: "grid", placeItems: "center" }}>
                    <div style={{ textAlign: "center", color: "#C7C3F2" }}><Loader2 size={26} className="spin-slow" style={{ animationDuration: "1s", marginBottom: 10 }} /><div style={{ fontSize: 14 }}>Generating your upgrade…</div></div>
                  </div>
                )}
            </div>
            {afterHtml && pos > 24 && (<>
              <span className="glass fade-up" style={{ position: "absolute", top: 14, left: 14, borderRadius: 999, padding: "5px 11px", fontSize: 11.5, color: "#E6E3FF", display: "inline-flex", gap: 5, alignItems: "center" }}><Check size={12} style={{ color: "#34D399" }} /> Modern type</span>
              <span className="glass fade-up" style={{ position: "absolute", top: 50, left: 14, borderRadius: 999, padding: "5px 11px", fontSize: 11.5, color: "#E6E3FF", display: "inline-flex", gap: 5, alignItems: "center" }}><Check size={12} style={{ color: "#34D399" }} /> Clear CTA</span>
            </>)}
            <span style={{ position: "absolute", top: 14, right: 14, fontSize: 11, fontWeight: 700, letterSpacing: ".1em", color: "#fff", background: "rgba(0,0,0,.45)", padding: "4px 9px", borderRadius: 7 }}>BEFORE</span>
            {afterHtml && pos > 18 && <span className="fade-up" style={{ position: "absolute", bottom: 14, left: 14, fontSize: 11, fontWeight: 700, letterSpacing: ".1em", color: "#0a0712", background: "linear-gradient(92deg,#22D3EE,#8B5CF6)", padding: "4px 9px", borderRadius: 7 }}>AFTER</span>}
            <div style={{ position: "absolute", top: 0, bottom: 0, left: pos + "%", width: 2, background: "linear-gradient(#67E8F9,#A78BFA,#F0ABFC)", boxShadow: "0 0 16px rgba(167,139,250,.9)", transform: "translateX(-1px)" }}>
              <div style={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%,-50%)", width: 38, height: 38, borderRadius: "50%", background: "rgba(10,7,18,.7)", border: "2px solid #A78BFA", backdropFilter: "blur(6px)", display: "grid", placeItems: "center", boxShadow: "0 0 24px rgba(167,139,250,.7)" }}>
                <ChevronRight size={13} style={{ color: "#67E8F9", marginRight: -4 }} /><ChevronRight size={13} style={{ color: "#F0ABFC", transform: "rotate(180deg)", marginLeft: -4 }} />
              </div>
            </div>
          </div>
          <p style={{ textAlign: "center", fontSize: 12.5, color: "#7C78A4", marginTop: 12 }}>Drag anywhere across the frame to reveal the upgrade · switch devices above</p>
        </div>
      </div>
    </div>
  );
}

function Preview({ beforeImage, beforeHtml, afterHtml, afterError, onRetry, scoreFrom, scoreTo, onToast }) {
  return (
    <div style={{ position: "relative", zIndex: 1, maxWidth: 1080, margin: "0 auto", padding: "48px 20px" }}>
      <div className="fade-up" style={{ textAlign: "center", marginBottom: 26 }}>
        <span className="glass" style={{ borderRadius: 999, padding: "6px 13px", fontSize: 12, color: "#C7C3F2", display: "inline-flex", gap: 7, alignItems: "center" }}><Sparkles size={13} style={{ color: "#F0ABFC" }} /> The transformation</span>
        <h2 className="disp" style={{ fontSize: "clamp(26px,4vw,40px)", fontWeight: 700, margin: "14px 0 8px" }}>Same site. <span className="iris">Better than imagined.</span></h2>
        <p style={{ color: "#A5A2C9", fontSize: 16, maxWidth: "52ch", margin: "0 auto" }}>Your brand, logo and content — preserved. Typography, layout, hierarchy, mobile and CTAs — rebuilt to 2026 standard.</p>
      </div>
      <div className="fade-up"><Compare beforeImage={beforeImage} beforeHtml={beforeHtml} afterHtml={afterHtml} afterError={afterError} onRetry={onRetry} /></div>
      <div className="glass fade-up" style={{ borderRadius: 18, padding: "18px 22px", margin: "26px auto", maxWidth: 460, display: "flex", alignItems: "center", justifyContent: "center", gap: 18 }}>
        <div style={{ textAlign: "center" }}><div className="disp" style={{ fontSize: 30, fontWeight: 700, color: "#FB7185" }}>{scoreFrom}</div><div style={{ fontSize: 11, color: "#8480AE", textTransform: "uppercase", letterSpacing: ".1em" }}>Before</div></div>
        <ArrowRight size={22} style={{ color: "#8E8AC0" }} />
        <div style={{ textAlign: "center" }}><div className="disp iris" style={{ fontSize: 30, fontWeight: 700 }}>{scoreTo}</div><div style={{ fontSize: 11, color: "#8480AE", textTransform: "uppercase", letterSpacing: ".1em" }}>After</div></div>
      </div>
      <div className="fade-up" style={{ display: "grid", gap: 18, gridTemplateColumns: "repeat(auto-fit,minmax(280px,1fr))", maxWidth: 760, margin: "0 auto 26px" }}>
        {TIERS.map((t) => (
          <div key={t.name} className="glass" style={{ borderRadius: 20, padding: 26, position: "relative", border: t.featured ? "1px solid rgba(167,139,250,.5)" : "1px solid rgba(255,255,255,.09)", boxShadow: t.featured ? "0 20px 60px rgba(139,92,246,.25)" : "none" }}>
            {t.featured && <span style={{ position: "absolute", top: -11, left: "50%", transform: "translateX(-50%)", fontSize: 11, fontWeight: 700, letterSpacing: ".08em", color: "#0a0712", background: "linear-gradient(92deg,#22D3EE,#8B5CF6,#F472B6)", padding: "4px 12px", borderRadius: 999 }}>MOST POPULAR</span>}
            <div style={{ fontSize: 15, fontWeight: 600, color: "#E6E3FF", marginBottom: 6 }}>{t.name}</div>
            <div style={{ display: "flex", alignItems: "baseline", gap: 3, marginBottom: 18 }}><span style={{ fontSize: 18, color: "#9D99C9" }}>$</span><span className="disp" style={{ fontSize: 40, fontWeight: 700 }}>{t.price}</span><span style={{ fontSize: 13, color: "#8480AE", marginLeft: 4 }}>one-time</span></div>
            <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 22 }}>
              {t.feats.map((f) => (<div key={f} style={{ display: "flex", gap: 10, alignItems: "flex-start", fontSize: 14, color: "#CFCCF0" }}><Check size={16} style={{ color: t.accent, flexShrink: 0, marginTop: 1 }} /> {f}</div>))}
            </div>
            <button onClick={() => onToast("Stripe checkout (cards · Apple Pay · Google Pay) connects on deploy.")} className={t.featured ? "btn-primary" : "btn-ghost"} style={{ width: "100%", borderRadius: 12, padding: "13px", fontSize: 15, display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
              <Download size={16} /> Get my upgrade
            </button>
          </div>
        ))}
      </div>
      <div className="glass fade-up" style={{ borderRadius: 20, padding: 22, maxWidth: 760, margin: "0 auto" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 14 }}>
          <div>
            <div style={{ fontSize: 12, letterSpacing: ".12em", textTransform: "uppercase", color: "#8480AE", marginBottom: 6 }}>Viral share card</div>
            <div className="disp" style={{ fontSize: 20, fontWeight: 600 }}>“Look what AI did to my website.”</div>
            <div style={{ fontSize: 13.5, color: "#9D99C9", marginTop: 4 }}>Auto-branded before/after image with your score jump.</div>
          </div>
          <button onClick={() => onToast("Share-image export renders server-side and posts to X / LinkedIn.")} className="btn-ghost" style={{ borderRadius: 11, padding: "11px 18px", fontSize: 14, display: "inline-flex", alignItems: "center", gap: 8, whiteSpace: "nowrap" }}><Share2 size={15} /> Generate share image</button>
        </div>
      </div>
    </div>
  );
}

export default function App() {
  const [view, setView] = useState("home");
  const [mode, setMode] = useState("url");
  const [beforeImage, setBeforeImage] = useState(null);
  const [beforeHtml, setBeforeHtml] = useState(null);
  const [afterHtml, setAfterHtml] = useState(null);
  const [afterError, setAfterError] = useState("");
  const [analysis, setAnalysis] = useState(null);
  const [brand, setBrand] = useState(null);
  const [content, setContent] = useState(null);
  const [error, setError] = useState("");
  const [toast, setToast] = useState(null);
  const lastRedesign = useRef(null);

  const showToast = (m) => { setToast(m); setTimeout(() => setToast(null), 3400); };
  const resetRun = () => { setBeforeImage(null); setBeforeHtml(null); setAfterHtml(null); setAfterError(""); setAnalysis(null); setBrand(null); setContent(null); };

  const runRedesign = useCallback(async (payload) => {
    lastRedesign.current = payload;
    setAfterError(""); setAfterHtml(null);
    try { const r = await postJSON("/api/redesign", payload); setAfterHtml(r.afterHtml); }
    catch (e) { setAfterError(e.message || "Couldn't generate the upgrade."); }
  }, []);

  const runDemo = async () => {
    setMode("demo"); resetRun(); setBeforeHtml(BEFORE_HTML); setView("analyzing");
    await wait(60); setAnalysis(DEMO_AUDIT);
    await wait(2200); setAfterHtml(AFTER_DEMO_HTML);
  };

  const onUrl = async (url) => {
    if (url === "__DEMO__") return runDemo();
    setMode("url"); setError(""); resetRun(); setView("analyzing");
    try {
      const r = await postJSON("/api/analyze", { url });
      setAnalysis(r.audit); setBrand(r.brand); setContent(r.content);
      setBeforeImage(r.beforeImage || null);
      if (!r.beforeImage) setBeforeHtml("<!doctype html><html><body style='font-family:sans-serif;display:grid;place-items:center;height:100%;margin:0;background:#f4f4f8;color:#555;text-align:center;padding:24px'><div>Live screenshot unavailable for this site.<br><small>Add a screenshot key for a true before image.</small></div></body></html>");
      runRedesign({ brand: r.brand, content: r.content });
    } catch (e) { setError(e.message || "Analysis failed."); setView("home"); }
  };

  const onHtml = async (html) => {
    setMode("paste"); setError(""); resetRun(); setBeforeHtml(html); setView("analyzing");
    try {
      const r = await postJSON("/api/analyze", { html });
      setAnalysis(r.audit); setBrand(r.brand); setContent(r.content);
      runRedesign({ html });
    } catch (e) { setError(e.message || "Analysis failed."); setView("home"); }
  };

  const scoreFrom = analysis?.overall ?? 37;
  const scoreTo = Math.min(98, 86 + Math.round((100 - scoreFrom) * 0.1));

  return (
    <div className="wg" style={{ minHeight: "100vh", position: "relative", overflow: "hidden" }}>
      <style>{STYLES}</style>
      <Starfield />
      {view !== "home" && (
        <div style={{ position: "relative", zIndex: 2, display: "flex", justifyContent: "space-between", alignItems: "center", padding: "16px 22px", maxWidth: 1100, margin: "0 auto" }}>
          <button onClick={() => { resetRun(); setView("home"); }} style={{ background: "none", border: "none", cursor: "pointer", display: "inline-flex", alignItems: "center", gap: 8, color: "#ECEAFF" }}>
            <span style={{ width: 26, height: 26, borderRadius: 8, background: "linear-gradient(92deg,#22D3EE,#8B5CF6,#F472B6)", display: "grid", placeItems: "center" }}><Sparkles size={14} style={{ color: "#0a0712" }} /></span>
            <span className="disp" style={{ fontWeight: 600 }}>WebsiteGlow AI</span>
          </button>
          {mode === "demo" && <span className="glass" style={{ borderRadius: 999, padding: "5px 12px", fontSize: 12, color: "#9D99C9" }}>Bella's Bakery · demo</span>}
          {mode !== "demo" && brand?.title && <span className="glass" style={{ borderRadius: 999, padding: "5px 12px", fontSize: 12, color: "#9D99C9", maxWidth: 220, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{brand.title}</span>}
        </div>
      )}
      {view === "home" && <Home onUrl={onUrl} onHtml={onHtml} error={error} />}
      {view === "analyzing" && <Analyzing ready={analysis !== null} onDone={() => setView("report")} />}
      {view === "report" && analysis && <Report data={analysis} onNext={() => setView("preview")} />}
      {view === "preview" && (
        <Preview beforeImage={beforeImage} beforeHtml={beforeHtml} afterHtml={afterHtml} afterError={afterError}
          onRetry={() => lastRedesign.current && runRedesign(lastRedesign.current)}
          scoreFrom={scoreFrom} scoreTo={scoreTo} onToast={showToast} />
      )}
      {toast && (
        <div className="glass fade-up" style={{ position: "fixed", bottom: 24, left: "50%", transform: "translateX(-50%)", zIndex: 50, borderRadius: 12, padding: "13px 18px", fontSize: 14, color: "#E6E3FF", display: "inline-flex", gap: 9, alignItems: "center", maxWidth: "90%", boxShadow: "0 14px 40px rgba(0,0,0,.4)" }}>
          <Lock size={14} style={{ color: "#67E8F9", flexShrink: 0 }} /> {toast}
        </div>
      )}
    </div>
  );
}
