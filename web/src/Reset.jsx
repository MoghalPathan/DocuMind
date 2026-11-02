import { useState } from "react";

export default function Reset({ go }) {
  const token = new URLSearchParams(window.location.search).get("token") || "";
  const [password, setPassword] = useState("");
  const [again, setAgain] = useState("");
  const [show, setShow] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    if (password.length < 8) return setError("Password must be at least 8 characters.");
    if (password !== again) return setError("The two passwords do not match.");
    setBusy(true);
    try {
      const r = await fetch("/auth/reset", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password }),
      });
      const d = await r.json().catch(() => ({}));
      if (!r.ok) throw new Error(typeof d.detail === "string" ? d.detail : `Server said ${r.status}`);
      setDone(d.message || "Password changed.");
    } catch (err) {
      setError(err.message === "Failed to fetch" ? "Cannot reach the server." : err.message);
    }
    setBusy(false);
  };

  return (
    <div className="login-page">
      <div className="login-card">
        <div className="login-brand">
          <div className="logo big">D</div>
          <h1>DocuMind</h1>
        </div>
        {!token ? (
          <>
            <p className="login-sub">This reset link is incomplete. Please open the link from your email again, or ask for a new one.</p>
            <button className="login-primary" type="button" onClick={() => go("/login")}>Back to log in</button>
          </>
        ) : done ? (
          <>
            <div className="login-ok" role="status">{done}</div>
            <button className="login-primary" type="button" onClick={() => go("/login")}>Log in</button>
          </>
        ) : (
          <>
            <p className="login-sub">Choose a new password for your account.</p>
            <form onSubmit={submit}>
              <label htmlFor="np">New password</label>
              <div className="login-pw">
                <input id="np" type={show ? "text" : "password"} autoComplete="new-password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="At least 8 characters" />
                <button type="button" className="login-eye" onClick={() => setShow(!show)} aria-label={show ? "Hide password" : "Show password"}>
                  {show ? "Hide" : "Show"}
                </button>
              </div>
              <label htmlFor="np2">Repeat new password</label>
              <input id="np2" type={show ? "text" : "password"} autoComplete="new-password" value={again} onChange={(e) => setAgain(e.target.value)} />
              {error && <div className="login-error" role="alert">{error}</div>}
              <button className="login-primary" type="submit" disabled={busy}>{busy ? "Please wait…" : "Change password"}</button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
