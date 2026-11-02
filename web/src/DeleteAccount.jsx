import { useState } from "react";

export default function DeleteAccount({ guest, onConfirm, onClose }) {
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    if (!guest && !password) {
      setError("Enter your password to confirm.");
      return;
    }
    setBusy(true);
    setError("");
    try {
      await onConfirm(guest ? null : password);
    } catch (err) {
      setError(err.message || "Could not delete the account.");
      setBusy(false);
    }
  };

  return (
    <div className="dlg-back" onClick={onClose}>
      <form className="dlg" onClick={(e) => e.stopPropagation()} onSubmit={submit} role="dialog" aria-modal="true" aria-labelledby="dlg-title">
        <h3 id="dlg-title">{guest ? "Delete this demo session?" : "Delete your account?"}</h3>
        <p>
          This permanently removes {guest ? "this demo session" : "your account"}, every PDF you uploaded, and your shared links.
          It cannot be undone.
        </p>
        {!guest && (
          <>
            <label htmlFor="dlg-pw">Your password</label>
            <input id="dlg-pw" type="password" autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} autoFocus />
          </>
        )}
        {error && <div className="dlg-error" role="alert">{error}</div>}
        <div className="dlg-actions">
          <button type="button" className="dlg-cancel" onClick={onClose} disabled={busy}>Cancel</button>
          <button type="submit" className="dlg-danger" disabled={busy}>{busy ? "Deleting…" : "Delete everything"}</button>
        </div>
      </form>
    </div>
  );
}
