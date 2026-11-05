import { useState } from "react";

export default function AddLink({ onAdd, onClose }) {
  const [url, setUrl] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    if (!url.trim()) {
      setError("Paste a web page link.");
      return;
    }
    setBusy(true);
    setError("");
    try {
      await onAdd(url.trim());
      onClose();
    } catch (err) {
      setError(err.message || "Could not add this link.");
      setBusy(false);
    }
  };

  return (
    <div className="dlg-back" onClick={busy ? undefined : onClose}>
      <form className="dlg" onClick={(e) => e.stopPropagation()} onSubmit={submit} role="dialog" aria-modal="true" aria-labelledby="link-title">
        <h3 id="link-title">Add a web page</h3>
        <p>Paste the link of a public web page. DocuMind reads its text so you can ask questions about it. Pages that need a login are not supported.</p>
        <label htmlFor="link-url">Web page link</label>
        <input id="link-url" type="url" inputMode="url" placeholder="https://example.com/article" value={url} onChange={(e) => setUrl(e.target.value)} autoFocus />
        {error && <div className="dlg-error" role="alert">{error}</div>}
        <div className="dlg-actions">
          <button type="button" className="dlg-cancel" onClick={onClose} disabled={busy}>Cancel</button>
          <button type="submit" className="dlg-primary" disabled={busy}>{busy ? "Reading page…" : "Add page"}</button>
        </div>
      </form>
    </div>
  );
}
