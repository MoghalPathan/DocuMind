import { useState } from "react";

export default function Login({ onAuth, go, start }) {
  const [mode, setMode] = useState(start === "signup" ? "signup" : "login");
  const [show, setShow] = useState(false); // "login" or "signup"
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const call = async (path, body) => {
    setBusy(true);
    setError("");
    try {
      const r = await fetch(path, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body || {}),
      });
      let data = {};
      try {
        data = await r.json();
      } catch {
        /* not json */
      }
      if (!r.ok) throw new Error(typeof data.detail === "string" ? data.detail : `Server said ${r.status}`);
      onAuth(data);
    } catch (e) {
      setError(e.message === "Failed to fetch" ? "Cannot reach the server. Is it running?" : e.message);
    }
    setBusy(false);
  };

  const submit = (e) => {
    e.preventDefault();
    if (!email.trim() || !password) {
      setError("Enter your email and password.");
      return;
    }
    call(mode === "login" ? "/auth/login" : "/auth/signup", { email, password });
  };

  return (
    <div className="login-page">
      <div className="login-card">
        <div className="login-brand">
          <div className="logo big">D</div>
          <h1>DocuMind</h1>
        </div>
        <p className="login-sub">Chat with your PDFs. Every answer shows the pages it came from.</p>

        <div className="login-tabs" role="tablist">
          <button
            type="button"
            role="tab"
            aria-selected={mode === "login"}
            className={mode === "login" ? "on" : ""}
            onClick={() => { setMode("login"); setError(""); }}
          >
            Log in
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={mode === "signup"}
            className={mode === "signup" ? "on" : ""}
            onClick={() => { setMode("signup"); setError(""); }}
          >
            Sign up
          </button>
        </div>

        <form onSubmit={submit}>
          <label htmlFor="email">Email</label>
          <input
            id="email"
            type="email"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
          />
          <label htmlFor="password">Password</label>
          <div className="login-pw">
            <input
              id="password"
              type={show ? "text" : "password"}
              autoComplete={mode === "login" ? "current-password" : "new-password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder={mode === "signup" ? "At least 8 characters" : "Your password"}
            />
            <button type="button" className="login-eye" onClick={() => setShow(!show)} aria-label={show ? "Hide password" : "Show password"}>
              {show ? "Hide" : "Show"}
            </button>
          </div>
          {mode === "login" && (
            <p className="login-forgot">
              Forgot your password? Use <b>Try the demo</b> below, or <a href="mailto:navedmoghalpathan@proton.me?subject=DocuMind%20password%20reset">email me</a> and I will reset it.
            </p>
          )}
          {error && <div className="login-error" role="alert">{error}</div>}
          <button className="login-primary" type="submit" disabled={busy}>
            {busy ? "Please wait…" : mode === "login" ? "Log in" : "Sign up"}
          </button>
        </form>

        <div className="login-or"><span>or</span></div>
        <button className="login-demo" type="button" disabled={busy} onClick={() => call("/auth/demo")}>
          Try the demo, no sign-up
        </button>
        <p className="login-note">Demo sessions last 24 hours and have smaller limits.</p>
        <p className="login-note">
          By continuing you agree to the{" "}
          <a href="/terms" onClick={(e) => { if (go) { e.preventDefault(); go("/terms"); } }}>Terms</a> and{" "}
          <a href="/privacy" onClick={(e) => { if (go) { e.preventDefault(); go("/privacy"); } }}>Privacy</a>.
        </p>
      </div>
    </div>
  );
}
