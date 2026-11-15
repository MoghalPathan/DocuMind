import { useState } from "react";
import { Btn, Card, Row } from "./controls.jsx";

// small helper: talk to the server with this login's token
async function call(path, body, token) {
  const r = await fetch(path, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
    body: JSON.stringify(body || {}),
  });
  let data = {};
  try {
    data = await r.json();
  } catch {
    /* no body */
  }
  if (!r.ok) {
    const d = data.detail;
    throw new Error(typeof d === "string" ? d : "Something went wrong. Please try again.");
  }
  return data;
}

export function Security({ auth }) {
  const [cur, setCur] = useState("");
  const [nw, setNw] = useState("");
  const [again, setAgain] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState(null); // { ok: true|false, text }

  if (auth.user.guest) {
    return (
      <div className="sx-empty">
        <b>Demo sessions have no password</b>
        <p>Create an account to change a password or log out of other devices.</p>
      </div>
    );
  }

  const save = async (e) => {
    e.preventDefault();
    if (nw !== again) return setMsg({ ok: false, text: "The new passwords do not match." });
    setBusy(true);
    setMsg(null);
    try {
      const d = await call("/account/password", { current: cur, new: nw }, auth.token);
      window.dispatchEvent(new CustomEvent("documind-newtoken", { detail: d.token }));
      setCur("");
      setNw("");
      setAgain("");
      setMsg({ ok: true, text: "Password changed. Your other devices were logged out." });
    } catch (err) {
      setMsg({ ok: false, text: err.message });
    } finally {
      setBusy(false);
    }
  };

  const logoutAll = async () => {
    if (!window.confirm("Log out of all devices? You will need to log in again here too.")) return;
    try {
      await call("/account/logout-all", {}, auth.token);
      window.dispatchEvent(new Event("documind-logout"));
    } catch (err) {
      setMsg({ ok: false, text: err.message });
    }
  };

  return (
    <>
      <Card>
        <Row title="Email" hint="Your login.">
          <span className="sx-val">{auth.user.email}</span>
        </Row>
      </Card>
      <h2 className="sx-sub">Change password</h2>
      <form className="sx-card sx-form" onSubmit={save}>
        <label>
          Current password
          <input className="sx-input" type="password" autoComplete="current-password" value={cur} onChange={(e) => setCur(e.target.value)} required />
        </label>
        <label>
          New password
          <input className="sx-input" type="password" autoComplete="new-password" minLength={8} maxLength={128} value={nw} onChange={(e) => setNw(e.target.value)} required />
        </label>
        <label>
          Repeat new password
          <input className="sx-input" type="password" autoComplete="new-password" minLength={8} maxLength={128} value={again} onChange={(e) => setAgain(e.target.value)} required />
        </label>
        <small className="sx-note">Use 8 to 128 characters. Changing it also logs out your other devices.</small>
        {msg && <div className={"sx-msg " + (msg.ok ? "ok" : "bad")} role="status">{msg.text}</div>}
        <div>
          <button type="submit" className="sx-btn primary" disabled={busy || !cur || !nw || !again}>
            {busy ? "Saving..." : "Change password"}
          </button>
        </div>
      </form>
      <h2 className="sx-sub">Devices</h2>
      <Card>
        <Row title="Log out of all devices" hint="Ends every login for this account, including this one.">
          <Btn danger onClick={logoutAll}>Log out everywhere</Btn>
        </Row>
      </Card>
    </>
  );
}
