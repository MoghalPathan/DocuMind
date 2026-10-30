import { useEffect, useState } from "react";
import ReactMarkdown from "react-markdown";

// Read-only page for a shared conversation (opened from /s/<id>, no login needed).
export default function Shared({ id }) {
  const [data, setData] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch(`/share/${encodeURIComponent(id)}`)
      .then(async (r) => {
        const j = await r.json().catch(() => ({}));
        if (!r.ok) throw new Error(typeof j.detail === "string" ? j.detail : `Server said ${r.status}`);
        setData(j);
        document.title = `${j.title || "Conversation"} · DocuMind`;
      })
      .catch((e) => setError(e.message));
  }, [id]);

  return (
    <div className="shared-page">
      <header className="shared-top">
        <div className="shared-brand">
          <span className="shared-logo">D</span> DocuMind
        </div>
        <a className="shared-try" href="/">Try DocuMind</a>
      </header>
      <main className="shared-body">
        {error && <div className="shared-msg">{error}</div>}
        {!error && !data && <div className="shared-msg">Loading…</div>}
        {data && (
          <>
            <h1 className="shared-title">{data.title || "Conversation"}</h1>
            <p className="shared-note">A read-only copy of a DocuMind conversation.</p>
            {data.messages.map((m, i) =>
              m.role === "user" ? (
                <div key={i} className="shared-user">{m.text}</div>
              ) : (
                <div key={i} className="shared-ai">
                  <div className={`text md ${m.noAnswer ? "soft" : ""}`}>
                    <ReactMarkdown>{m.noAnswer ? `No answer found in the documents. ${m.text}` : m.text}</ReactMarkdown>
                  </div>
                  {m.cites && m.cites.length > 0 && (
                    <div className="shared-cites">
                      {m.cites.map((c, j) => (
                        <span key={j}>{c.doc ? `${c.doc.replace(/\.pdf$/i, "")} · ` : ""}p.{c.page}</span>
                      ))}
                    </div>
                  )}
                </div>
              ),
            )}
          </>
        )}
      </main>
    </div>
  );
}
