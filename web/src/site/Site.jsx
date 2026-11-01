import { useEffect, useState } from "react";
import { Home, Features, HowItWorks, Results, Pricing, About, Contact } from "./Pages.jsx";
import { A, GITHUB } from "./shared.jsx";
import { Privacy, Terms, NotFound } from "./Legal.jsx";
import "./Site.css";

const ROUTES = {
  "/": Home,
  "/features": Features,
  "/how-it-works": HowItWorks,
  "/results": Results,
  "/pricing": Pricing,
  "/about": About,
  "/contact": Contact,
  "/privacy": Privacy,
  "/terms": Terms,
};

const PRODUCT = [
  ["/features", "Features", "What DocuMind can do"],
  ["/how-it-works", "How it works", "From PDF to cited answer"],
  ["/results", "Results", "Every test question, graded"],
];

export default function Site({ route, go, onAuth }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [menu, setMenu] = useState(false);
  const [dd, setDd] = useState(false);
  const [stuck, setStuck] = useState(false);
  const [theme, setTheme] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("documind.theme")) || "dark";
    } catch {
      return "dark";
    }
  });

  const toggleTheme = () => {
    const t = theme === "dark" ? "light" : "dark";
    document.documentElement.dataset.theme = t;
    try {
      localStorage.setItem("documind.theme", JSON.stringify(t));
    } catch {
      /* private window: the choice lasts until the tab closes */
    }
    setTheme(t);
  };

  useEffect(() => {
    const on = () => setStuck(window.scrollY > 8);
    on();
    window.addEventListener("scroll", on, { passive: true });
    return () => window.removeEventListener("scroll", on);
  }, []);

  useEffect(() => {
    setMenu(false);
    setDd(false);
    const names = { "/": "", "/features": "Features", "/how-it-works": "How it works", "/results": "Results", "/pricing": "Pricing", "/about": "About", "/contact": "Contact", "/privacy": "Privacy", "/terms": "Terms" };
    const n = names[route];
    document.title = route in names ? (n ? `${n} · DocuMind` : "DocuMind: ask your PDF, get cited answers") : "Page not found · DocuMind";
  }, [route]);

  useEffect(() => {
    if (!("IntersectionObserver" in window)) return;
    const els = document.querySelectorAll(".st main .st-sec .st-wrap > *, .st main .st-frow-in > *, .st main .st-strip-in > *, .st main .st-band-in");
    const io = new IntersectionObserver(
      (list) => list.forEach((e) => { if (e.isIntersecting) { e.target.classList.add("in"); io.unobserve(e.target); } }),
      { threshold: 0.1, rootMargin: "0px 0px -40px 0px" }
    );
    els.forEach((el) => { el.classList.add("rv"); io.observe(el); });
    return () => io.disconnect();
  }, [route]);

  const demo = async () => {
    setBusy(true);
    setError("");
    try {
      const r = await fetch("/auth/demo", { method: "POST", headers: { "Content-Type": "application/json" }, body: "{}" });
      const j = await r.json().catch(() => ({}));
      if (!r.ok) throw new Error(typeof j.detail === "string" ? j.detail : `Server said ${r.status}`);
      onAuth(j);
    } catch (e) {
      setError(e.message === "Failed to fetch" ? "Cannot reach the server right now." : e.message);
    }
    setBusy(false);
  };

  const Page = ROUTES[route] || NotFound;
  const inProduct = PRODUCT.some(([p]) => p === route);
  const cls = (p) => (route === p ? "on" : "");

  return (
    <div className="st" onClick={() => setDd(false)}>
      <header className={`st-head ${stuck ? "stuck" : ""}`}>
        <div className="st-wrap st-head-in">
          <A to="/" go={go} className="st-brand">
            <span className="st-logo">D</span> DocuMind
          </A>

          <nav className="st-nav">
            <div className="st-dd" onClick={(e) => e.stopPropagation()}>
              <button className={inProduct ? "on" : ""} onClick={() => setDd((v) => !v)} aria-expanded={dd}>
                Product <span className="st-caret" aria-hidden="true" />
              </button>
              {dd && (
                <div className="st-menu">
                  {PRODUCT.map(([p, t, d]) => (
                    <A key={p} to={p} go={go} className={cls(p)}>
                      <b>{t}</b>
                      <small>{d}</small>
                    </A>
                  ))}
                </div>
              )}
            </div>
            <A to="/pricing" go={go} className={cls("/pricing")}>Pricing</A>
          </nav>

          <div className="st-actions">
            <button className="st-icon" aria-label="Switch theme" title={theme === "dark" ? "Light mode" : "Dark mode"} onClick={toggleTheme}>
              {theme === "dark" ? (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="12" r="4" /><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" /></svg>
              ) : (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z" /></svg>
              )}
            </button>
            <a className="st-btn ghost st-gh" href={GITHUB} target="_blank" rel="noreferrer">GitHub</a>
            <button className="st-btn ghost" onClick={() => go("/login")}>Log in</button>
            <button className="st-btn solid" onClick={demo} disabled={busy}>{busy ? "Opening…" : "Try demo"}</button>
            <button className="st-burger" aria-label="Menu" onClick={(e) => { e.stopPropagation(); setMenu((v) => !v); }}>
              <span /><span /><span />
            </button>
          </div>
        </div>
        {menu && (
          <div className="st-drawer">
            {[["/", "Home"], ...PRODUCT.map(([p, t]) => [p, t]), ["/pricing", "Pricing"], ["/about", "About"], ["/contact", "Contact"]].map(([p, t]) => (
              <A key={p} to={p} go={go} className={cls(p)}>{t}</A>
            ))}
            <a href={GITHUB} target="_blank" rel="noreferrer">GitHub</a>
          </div>
        )}
      </header>
      {error && <div className="st-error">{error}</div>}

      <main key={route} className="st-page">
        <Page go={go} demo={demo} busy={busy} />
      </main>

      <footer className="st-foot">
        <div className="st-wrap st-foot-grid">
          <div>
            <A to="/" go={go} className="st-brand"><span className="st-logo">D</span> DocuMind</A>
            <p>Ask your PDF. Get the answer and the page it came from. A portfolio project by Naved Korabu.</p>
          </div>
          <div>
            <h4>Product</h4>
            {PRODUCT.map(([p, t]) => <A key={p} to={p} go={go}>{t}</A>)}
            <A to="/pricing" go={go}>Pricing</A>
          </div>
          <div>
            <h4>Project</h4>
            <A to="/about" go={go}>About</A>
            <A to="/contact" go={go}>Contact</A>
          </div>
          <div>
            <h4>Legal</h4>
            <A to="/privacy" go={go}>Privacy</A>
            <A to="/terms" go={go}>Terms</A>
          </div>
        </div>
        <div className="st-wrap st-foot-base">
          <span>&copy; 2026 DocuMind</span>
          <span>Please do not upload private or confidential documents.</span>
          <button className="st-top" onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}>Back to top <i aria-hidden="true" /></button>
        </div>
      </footer>
    </div>
  );
}
