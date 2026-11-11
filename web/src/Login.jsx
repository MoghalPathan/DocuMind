import { useState } from "react";
import Logo from "./Logo.jsx";

export default function Login({ onAuth, go, start }) {
  const [mode, setMode] = useState(start === "signup" ? "signup" : "login"); // "login", "signup" or "forgot"
  const [show, setShow] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [busy, setBusy] = useState(false);

  const post = async (path, body) => {
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
    return data;
  };

  const run = async (path, body, done) => {
    setBusy(true);
    setError("");
    setNotice("");
    try {
      done(await post(path, body));
    } catch (e) {
      setError(e.message === "Failed to fetch" ? "Cannot reach the server. Is it running?" : e.message);
    }
    setBusy(false);
  };

  const switchTo = (m) => {
    setMode(m);
    setError("");
    setNotice("");
  };

  const submit = (e) => {
    e.preventDefault();
    if (mode === "forgot") {
      if (!email.trim()) {
        setError("Enter your email address.");
        return;
      }
      run("/auth/forgot", { email }, (d) => setNotice(d.message));
      return;
    }
    if (!email.trim() || !password) {
      setError("Enter your email and password.");
      return;
    }
    run(mode === "login" ? "/auth/login" : "/auth/signup", { email, password }, onAuth);
  };

  const forgot = mode === "forgot";

  return (
    <main className="login-page">
      <div className="login-card">
        <div className="login-brand">
          <Logo className="logo big" />
          <h1>DocuMind</h1>
        </div>
        <p className="login-sub">
          {forgot
            ? "Enter your email and we will send you a link to choose a new password."
            : "Chat with your documents. Every answer shows where it came from."}
        </p>

        {!forgot && (
          <div className="login-tabs" role="tablist">
            <button
              type="button"
              role="tab"
              aria-selected={mode === "login"}
              className={mode === "login" ? "on" : ""}
              onClick={() => switchTo("login")}
            >
              Log in
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={mode === "signup"}
              className={mode === "signup" ? "on" : ""}
              onClick={() => switchTo("signup")}
            >
              Sign up
            </button>
          </div>
        )}

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
          {!forgot && (
            <>
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
            </>
          )}
          {mode === "login" && (
            <div className="login-forgot-row">
              <button type="button" className="login-link" onClick={() => switchTo("forgot")}>
                Forgot password?
              </button>
            </div>
          )}
          {error && <div className="login-error" role="alert">{error}</div>}
          {notice && <div className="login-ok" role="status">{notice}</div>}
          <button className="login-primary" type="submit" disabled={busy}>
            {busy ? "Please wait…" : forgot ? "Send reset link" : mode === "login" ? "Log in" : "Sign up"}
          </button>
          {forgot && (
            <div className="login-forgot-row center">
              <button type="button" className="login-link" onClick={() => switchTo("login")}>
                Back to log in
              </button>
            </div>
          )}
        </form>

        <div className="login-or"><span>or</span></div>
        <button className="login-demo" type="button" disabled={busy} onClick={() => run("/auth/demo", {}, onAuth)}>
          Try the demo, no sign-up
        </button>
        <p className="login-note">Demo sessions last 24 hours and have smaller limits.</p>
        <p className="login-note">
          By continuing you agree to the{" "}
          <a href="/terms" onClick={(e) => { if (go) { e.preventDefault(); go("/terms"); } }}>Terms</a> and{" "}
          <a href="/privacy" onClick={(e) => { if (go) { e.preventDefault(); go("/privacy"); } }}>Privacy</a>.
        </p>
      </div>
    </main>
  );
}
