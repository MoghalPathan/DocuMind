import { useEffect, useState } from "react";
import { Home, Features, HowItWorks, Results, Pricing, About, Contact } from "./Pages.jsx";
import { A, GITHUB } from "./shared.jsx";
import "./Site.css";

const ROUTES = {
  "/": Home,
  "/features": Features,
  "/how-it-works": HowItWorks,
  "/results": Results,
  "/pricing": Pricing,
  "/about": About,
  "/contact": Contact,
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

  useEffect(() => {
    const on = () => setStuck(window.scrollY > 8);
    on();
    window.addEventListener("scroll", on, { passive: true });
    return () => window.removeEventListener("scroll", on);
  }, []);

  useEffect(() => {
    setMenu(false);
    setDd(false);
    const names = { "/": "", "/features": "Features", "/how-it-works": "How it works", "/results": "Results", "/pricing": "Pricing", "/about": "About", "/contact": "Contact" };
    const n = names[route];
    document.title = n ? `${n} · DocuMind` : "DocuMind: ask your PDF, get cited answers";
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

  const Page = ROUTES[route] || Home;
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
                Product <span className="st-caret">▾</span>
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
            <A to="/about" go={go} className={cls("/about")}>About</A>
            <A to="/contact" go={go} className={cls("/contact")}>Contact</A>
          </nav>

          <div className="st-actions">
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
            <a href={GITHUB} target="_blank" rel="noreferrer">GitHub</a>
          </div>
          <div>
            <h4>Try it</h4>
            <button onClick={demo} disabled={busy}>Try the demo</button>
            <button onClick={() => go("/login")}>Log in or sign up</button>
          </div>
        </div>
        <div className="st-wrap st-foot-base">
          <span>&copy; 2026 DocuMind. A portfolio project.</span>
          <span>Please do not upload private or confidential documents.</span>
        </div>
      </footer>
    </div>
  );
}
