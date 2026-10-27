import { useEffect, useMemo, useRef, useState } from "react";
import ReactMarkdown from "react-markdown";
import "./App.css";

const MODELS = [
  {
    id: "groq",
    label: "Groq",
    name: "gpt-oss-20b",
    note: "Default",
  },
  {
    id: "gemini",
    label: "Gemini",
    name: "gemini-3.5-flash-lite",
    note: "Google",
  },
];

const modelName = (id) =>
  id ? `${String(id).startsWith("gemini") ? "Gemini" : "Groq"} · ${String(id).split("/").pop()}` : null;

const EXAMPLES = [
  "What CPU and how much RAM do the lab systems have?",
  "How early should students arrive at the lab?",
  "Which callbacks does the Week-12 VGG16 program use?",
];

const NOTE = "Answers are based on your uploaded PDFs. Always check the cited pages.";

const STORE_KEY = "documind.chats.v1";

function load(key, fallback) {
  try {
    const v = localStorage.getItem(key);
    return v ? JSON.parse(v) : fallback;
  } catch {
    return fallback;
  }
}

function save(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* storage can be blocked; the app still works without it */
  }
}

function shortName(name, max = 26) {
  if (!name) return "";
  const base = name.replace(/\.pdf$/i, "");
  return base.length > max ? base.slice(0, max - 1) + "…" : base;
}

const uid = () => Math.random().toString(36).slice(2, 10);

const ICONS = {
  panel: (
    <>
      <rect x="3" y="3" width="18" height="18" rx="2" />
      <line x1="9" y1="3" x2="9" y2="21" />
    </>
  ),
  plus: (
    <>
      <line x1="12" y1="5" x2="12" y2="19" />
      <line x1="5" y1="12" x2="19" y2="12" />
    </>
  ),
  more: (
    <>
      <circle cx="5" cy="12" r="1.2" />
      <circle cx="12" cy="12" r="1.2" />
      <circle cx="19" cy="12" r="1.2" />
    </>
  ),
  clip: (
    <path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48" />
  ),
  mic: (
    <>
      <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
      <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
      <line x1="12" y1="19" x2="12" y2="23" />
      <line x1="8" y1="23" x2="16" y2="23" />
    </>
  ),
  up: (
    <>
      <line x1="12" y1="19" x2="12" y2="5" />
      <polyline points="5 12 12 5 19 12" />
    </>
  ),
  share: (
    <>
      <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8" />
      <polyline points="16 6 12 2 8 6" />
      <line x1="12" y1="2" x2="12" y2="15" />
    </>
  ),
  pin: (
    <>
      <line x1="12" y1="17" x2="12" y2="22" />
      <path d="M5 17h14v-1.76a2 2 0 0 0-1.11-1.79l-1.78-.9A2 2 0 0 1 15 10.76V6h1a2 2 0 0 0 0-4H8a2 2 0 0 0 0 4h1v4.76a2 2 0 0 1-1.11 1.79l-1.78.9A2 2 0 0 0 5 15.24z" />
    </>
  ),
  edit: (
    <>
      <path d="M12 20h9" />
      <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
    </>
  ),
  archive: (
    <>
      <polyline points="21 8 21 21 3 21 3 8" />
      <rect x="1" y="3" width="22" height="5" />
      <line x1="10" y1="12" x2="14" y2="12" />
    </>
  ),
  trash: (
    <>
      <polyline points="3 6 5 6 21 6" />
      <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
      <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
    </>
  ),
  down: <polyline points="6 9 12 15 18 9" />,
  copy: (
    <>
      <rect x="9" y="9" width="13" height="13" rx="2" />
      <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
    </>
  ),
  file: (
    <>
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <polyline points="14 2 14 8 20 8" />
    </>
  ),
  search: (
    <>
      <circle cx="11" cy="11" r="8" />
      <line x1="21" y1="21" x2="16.65" y2="16.65" />
    </>
  ),
  check: <polyline points="20 6 9 17 4 12" />,
  thumbUp: (
    <path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3zM7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3" />
  ),
  thumbDown: (
    <path d="M10 15v4a3 3 0 0 0 3 3l4-9V2H5.72a2 2 0 0 0-2 1.7l-1.38 9a2 2 0 0 0 2 2.3zm7-13h2.67A2.31 2.31 0 0 1 22 4v7a2.31 2.31 0 0 1-2.33 2H17" />
  ),
  external: (
    <>
      <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
      <polyline points="15 3 21 3 21 9" />
      <line x1="10" y1="14" x2="21" y2="3" />
    </>
  ),
  chevron: <polyline points="9 18 15 12 9 6" />,
  refresh: (
    <>
      <path d="M21 12a9 9 0 1 1-3-6.7" />
      <polyline points="21 3 21 9 15 9" />
    </>
  ),
  play: <polygon points="6 4 20 12 6 20 6 4" />,
  stop: <rect x="6" y="6" width="12" height="12" rx="1.5" />,
  sun: (
    <>
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
    </>
  ),
  moon: <path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z" />,
  info: (
    <>
      <circle cx="12" cy="12" r="10" />
      <line x1="12" y1="16" x2="12" y2="12" />
      <line x1="12" y1="8" x2="12.01" y2="8" />
    </>
  ),
  eraser: (
    <>
      <path d="M20 20H9l-5-5a2 2 0 0 1 0-2.8l9.2-9.2a2 2 0 0 1 2.8 0l5.2 5.2a2 2 0 0 1 0 2.8L12 20" />
      <line x1="8" y1="11" x2="15" y2="18" />
    </>
  ),
};

function Icon({ name, size = 18 }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {ICONS[name]}
    </svg>
  );
}

function transcript(chat) {
  return chat.messages
    .map((m) => {
      const who = m.role === "user" ? "You" : "DocuMind";
      const pages = m.cites && m.cites.length ? `\n(Sources: ${m.cites.map((c) => `${c.doc || "PDF"} p.${c.page}`).join(", ")})` : "";
      const body = m.noAnswer ? `No answer found in your documents. ${m.text}`.trim() : m.text;
      return `${who}: ${body}${pages}`;
    })
    .join("\n\n");
}

export default function App() {
  const [chats, setChats] = useState(() => load(STORE_KEY, []));
  const [activeId, setActiveId] = useState(() => load(STORE_KEY, [])[0]?.id ?? null);
  const [sidebarOpen, setSidebarOpen] = useState(() => window.innerWidth > 800);
  const [search, setSearch] = useState("");
  const [theme, setTheme] = useState(() => load("documind.theme", "dark"));
  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    save("documind.theme", theme);
  }, [theme]);
  const [collapsed, setCollapsed] = useState(() =>
    load("documind.collapsed", { docs: false, pinned: false, recent: false, archived: true }),
  );
  const [menuId, setMenuId] = useState(null);
  const [topMenu, setTopMenu] = useState(false);
  const [regenMenu, setRegenMenu] = useState(null);
  const [speaking, setSpeaking] = useState(null);
  const [renamingId, setRenamingId] = useState(null);
  const [renameText, setRenameText] = useState("");
  const [docs, setDocs] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [model, setModel] = useState(() => load("documind.model", MODELS[0].id));
  const [modelOpen, setModelOpen] = useState(false);
  const [listening, setListening] = useState(false);
  const [toast, setToast] = useState("");
  const [status, setStatus] = useState("Searching documents…");
  const [selectedDoc, setSelectedDoc] = useState(() => load("documind.doc", ""));
  const [docOpen, setDocOpen] = useState(false);
  const [docMenu, setDocMenu] = useState(null);
  const fileRef = useRef(null);
  const endRef = useRef(null);
  const areaRef = useRef(null);
  const recRef = useRef(null);

  const activeDoc = docs.find((d) => d.name === selectedDoc)?.name || "";
  const active = chats.find((c) => c.id === activeId) || null;
  const messages = active ? active.messages : [];

  useEffect(() => save(STORE_KEY, chats), [chats]);
  useEffect(() => save("documind.model", model), [model]);
  useEffect(() => save("documind.doc", selectedDoc), [selectedDoc]);
  useEffect(() => save("documind.collapsed", collapsed), [collapsed]);

  useEffect(() => {
    fetch("/documents")
      .then((r) => r.json())
      .then(setDocs)
      .catch(() => {});
  }, []);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length, loading]);

  useEffect(() => {
    const el = areaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = Math.min(el.scrollHeight, 180) + "px";
  }, [input]);

  useEffect(() => {
    const close = () => {
      setMenuId(null);
      setModelOpen(false);
      setDocOpen(false);
      setDocMenu(null);
    };
    window.addEventListener("click", close);
    return () => window.removeEventListener("click", close);
  }, []);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(""), 2200);
    return () => clearTimeout(t);
  }, [toast]);

  const patchChat = (id, patch) =>
    setChats((cs) => cs.map((c) => (c.id === id ? { ...c, ...patch } : c)));

  const newChat = () => {
    setActiveId(null);
    setInput("");
    if (window.innerWidth <= 800) setSidebarOpen(false);
  };

  const openChat = (id) => {
    setActiveId(id);
    if (window.innerWidth <= 800) setSidebarOpen(false);
  };

  const historyOf = (messages) =>
    messages
      .filter((m) => !m.error && m.text)
      .slice(-6)
      .map((m) => ({ role: m.role, text: String(m.text).slice(0, 400) }));

  const toReply = (data, q, scope) => {
    const said = String(data.answer || "").trim();
    const kind = data.kind || (/^i don['\u2019]?t know/i.test(said) ? "no_answer" : "answer");
    const idk = kind === "no_answer";
    return {
      role: "ai",
      kind,
      text: idk ? said.replace(/^i don['\u2019]?t know\.?\s*/i, "") : said,
      cites:
        kind === "answer"
          ? (data.sources || []).map((c) =>
              typeof c === "string" ? { doc: null, page: c, pdf_page: Number(c) || 1 } : c,
            )
          : [],
      noAnswer: idk,
      model: providerOf(data.model_used) || currentModel.label,
      scope: scope || null,
      question: q,
      asked: data.asked && data.asked !== q ? data.asked : null,
    };
  };

  const regenerate = async (idx, style) => {
    if (!active || loading) return;
    const old = active.messages[idx];
    if (!old || !old.question) return;
    const id = active.id;
    const before = active.messages.slice(0, idx - 1);
    setRegenMenu(null);
    setLoading(true);
    setStatus("Writing another answer…");
    let reply;
    try {
      const r = await fetch("/query", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          question: old.question,
          model,
          doc: old.scope || null,
          history: historyOf(before),
          regen: style,
        }),
      });
      if (!r.ok) throw new Error(`Server said ${r.status}`);
      reply = toReply(await r.json(), old.question, old.scope);
    } catch (e) {
      reply = { role: "ai", text: `Something went wrong: ${e.message}`, cites: [], error: true };
    }
    setChats((cs) =>
      cs.map((c) =>
        c.id === id ? { ...c, messages: c.messages.map((x, i) => (i === idx ? reply : x)) } : c,
      ),
    );
    setLoading(false);
  };

  const send = async (text) => {
    const q = (text ?? input).trim();
    if (!q || loading) return;
    setInput("");
    let id = activeId;
    const userMsg = { role: "user", text: q };
    const prior = active ? active.messages : [];
    if (!id) {
      id = uid();
      const chat = {
        id,
        title: q.length > 42 ? q.slice(0, 42) + "…" : q,
        pinned: false,
        archived: false,
        messages: [userMsg],
      };
      setChats((cs) => [chat, ...cs]);
      setActiveId(id);
    } else {
      setChats((cs) =>
        cs.map((c) => (c.id === id ? { ...c, messages: [...c.messages, userMsg] } : c)),
      );
    }
    setLoading(true);
    setStatus("Searching documents…");
    const phase = setTimeout(() => setStatus("Writing the answer…"), 1800);
    let reply;
    try {
      const r = await fetch("/query", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question: q, model, doc: activeDoc || null, history: historyOf(prior) }),
      });
      if (!r.ok) throw new Error(`Server said ${r.status}`);
      reply = toReply(await r.json(), q, activeDoc);
    } catch (e) {
      reply = { role: "ai", text: `Something went wrong: ${e.message}`, cites: [], error: true };
    }
    clearTimeout(phase);
    setChats((cs) =>
      cs.map((c) => (c.id === id ? { ...c, messages: [...c.messages, reply] } : c)),
    );
    setLoading(false);
  };

  const uploadFile = async (file) => {
    if (!file) return;
    if (!file.name.toLowerCase().endsWith(".pdf")) {
      setToast("Only PDF files are supported");
      return;
    }
    setUploading(true);
    try {
      const form = new FormData();
      form.append("file", file);
      const r = await fetch("/ingest", { method: "POST", body: form });
      if (!r.ok) {
        let msg = `Server said ${r.status}`;
        try {
          const j = await r.json();
          if (typeof j.detail === "string") msg = j.detail;
        } catch {
          /* keep the default message */
        }
        throw new Error(msg);
      }
      const data = await r.json();
      setDocs((d) => [
        ...d.filter((x) => x.name !== data.file),
        { name: data.file, chunks: data.chunks },
      ]);
      setToast(`Added ${data.file}`);
    } catch (e) {
      setToast(`Upload failed: ${e.message}`);
    }
    setUploading(false);
    if (fileRef.current) fileRef.current.value = "";
  };

  const onPaste = (e) => {
    const f = e.clipboardData?.files?.[0];
    if (f) {
      e.preventDefault();
      uploadFile(f);
    }
  };

  const toggleVoice = () => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) {
      setToast("Voice input is not supported in this browser (try Chrome or Edge)");
      return;
    }
    if (listening) {
      recRef.current?.stop();
      return;
    }
    const rec = new SR();
    rec.lang = "en-IN";
    rec.interimResults = false;
    rec.onresult = (ev) => {
      const said = ev.results[0][0].transcript;
      setInput((v) => (v ? v + " " : "") + said);
    };
    rec.onend = () => setListening(false);
    rec.onerror = () => setListening(false);
    recRef.current = rec;
    setListening(true);
    rec.start();
  };

  const copyText = async (text, msg = "Copied") => {
    try {
      await navigator.clipboard.writeText(text);
      setToast(msg);
    } catch {
      setToast("Could not copy");
    }
  };

  const speak = (text, idx) => {
    const synth = window.speechSynthesis;
    if (!synth) { setToast("Your browser cannot read aloud"); return; }
    if (speaking === idx) { synth.cancel(); setSpeaking(null); return; }
    synth.cancel();
    const u = new SpeechSynthesisUtterance(text.replace(/[*_`#>]/g, ""));
    u.onend = () => setSpeaking(null);
    u.onerror = () => setSpeaking(null);
    setSpeaking(idx);
    synth.speak(u);
  };

  const shareChat = (chat) => copyText(transcript(chat), "Conversation copied as text");

  const deleteDoc = async (name) => {
    if (!window.confirm(`Delete "${name}"? Its text is removed from search.`)) return;
    try {
      const r = await fetch(`/documents/${encodeURIComponent(name)}`, { method: "DELETE" });
      if (!r.ok) throw new Error(`Server said ${r.status}`);
      setDocs((d) => d.filter((x) => x.name !== name));
      if (selectedDoc === name) setSelectedDoc("");
      setToast(`Deleted ${name}`);
    } catch (e) {
      setToast(`Delete failed: ${e.message}`);
    }
  };

  const rate = (idx, rating) => {
    if (!active) return;
    const m = active.messages[idx];
    const next = m.rating === rating ? null : rating;
    setChats((cs) =>
      cs.map((c) =>
        c.id === active.id
          ? { ...c, messages: c.messages.map((x, i) => (i === idx ? { ...x, rating: next } : x)) }
          : c,
      ),
    );
    if (next) {
      fetch("/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          question: m.question || "",
          answer: m.text || "",
          rating: next,
          doc: m.scope || null,
          model: m.model || null,
        }),
      }).catch(() => {});
      setToast("Thanks for the feedback");
    }
  };

  const clearChat = () => {
    if (!active) return;
    if (!window.confirm("Clear all messages in this chat? Your uploaded documents stay.")) return;
    patchChat(active.id, { messages: [] });
  };

  const startRename = (chat) => {
    setRenamingId(chat.id);
    setRenameText(chat.title);
  };

  const finishRename = () => {
    const t = renameText.trim();
    if (t && renamingId) patchChat(renamingId, { title: t });
    setRenamingId(null);
  };

  const deleteChat = (id) => {
    if (!window.confirm("Delete this chat? This cannot be undone.")) return;
    setChats((cs) => cs.filter((c) => c.id !== id));
    if (activeId === id) setActiveId(null);
  };

  const filtered = useMemo(() => {
    const s = search.trim().toLowerCase();
    return chats.filter((c) => !s || c.title.toLowerCase().includes(s));
  }, [chats, search]);

  const pinned = filtered.filter((c) => c.pinned && !c.archived);
  const recent = filtered.filter((c) => !c.pinned && !c.archived);
  const archived = filtered.filter((c) => c.archived);

  const currentModel = MODELS.find((m) => m.id === model) || MODELS[0];

  const head = (key, label, count) => (
    <button
      className="section-head"
      aria-expanded={!collapsed[key]}
      onClick={() => setCollapsed((c) => ({ ...c, [key]: !c[key] }))}
    >
      <span className={`chev ${collapsed[key] ? "" : "open"}`}><Icon name="chevron" size={13} /></span>
      <span className="head-label">{label}</span>
      <span className="count">{count}</span>
    </button>
  );

  const renderRow = (chat) => (
    <div key={chat.id} className={`chat-row ${chat.id === activeId ? "active" : ""}`}>
      {renamingId === chat.id ? (
        <input
          className="rename-input"
          autoFocus
          value={renameText}
          onChange={(e) => setRenameText(e.target.value)}
          onBlur={finishRename}
          onKeyDown={(e) => {
            if (e.key === "Enter") finishRename();
            if (e.key === "Escape") setRenamingId(null);
          }}
          onClick={(e) => e.stopPropagation()}
        />
      ) : (
        <button className="chat-title" onClick={() => openChat(chat.id)} title={chat.title}>
          {chat.pinned && <Icon name="pin" size={13} />}
          <span>{chat.title}</span>
        </button>
      )}
      <button
        className="icon-btn dots"
        aria-label="Chat options"
        onClick={(e) => {
          e.stopPropagation();
          setMenuId(menuId === chat.id ? null : chat.id);
        }}
      >
        <Icon name="more" />
      </button>
      {menuId === chat.id && (
        <div className="menu" onClick={(e) => e.stopPropagation()}>
          <button onClick={() => { shareChat(chat); setMenuId(null); }}>
            <Icon name="copy" /> Copy conversation
          </button>
          <button onClick={() => { patchChat(chat.id, { pinned: !chat.pinned }); setMenuId(null); }}>
            <Icon name="pin" /> {chat.pinned ? "Unpin" : "Pin"}
          </button>
          <button onClick={() => { startRename(chat); setMenuId(null); }}>
            <Icon name="edit" /> Rename
          </button>
          <button onClick={() => { patchChat(chat.id, { archived: !chat.archived }); setMenuId(null); }}>
            <Icon name="archive" /> {chat.archived ? "Unarchive" : "Archive"}
          </button>
          <button className="danger" onClick={() => { deleteChat(chat.id); setMenuId(null); }}>
            <Icon name="trash" /> Delete
          </button>
        </div>
      )}
    </div>
  );

  const composer = (
    <div className="composer">
      <textarea
        ref={areaRef}
        rows={1}
        placeholder="Ask a question about your uploaded documents…"
        value={input}
        onChange={(e) => setInput(e.target.value)}
        onPaste={onPaste}
        onKeyDown={(e) => {
          if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            send();
          }
        }}
      />
      <div className="composer-row">
        <button className="attach" aria-label="Attach PDF" title="Attach a PDF" onClick={() => fileRef.current?.click()}>
          <Icon name="clip" /> <span className="attach-label">Attach PDF</span>
        </button>
        <div className="model-wrap" onClick={(e) => e.stopPropagation()}>
          <button
            className="doc-pill"
            title="Choose which PDF to search"
            onClick={() => { setDocOpen((v) => !v); setModelOpen(false); }}
          >
            <Icon name="file" size={15} />
            {activeDoc ? shortName(activeDoc, 22) : docs.length ? "All documents" : "No documents"}
            <Icon name="down" size={14} />
          </button>
          {docOpen && (
            <div className="menu doc-menu">
              <div className="menu-head">Search in</div>
              <button onClick={() => { setSelectedDoc(""); setDocOpen(false); }}>
                <span className="model-line"><b>All documents</b><small>{docs.length} uploaded</small></span>
                {!activeDoc && <Icon name="check" size={15} />}
              </button>
              {docs.map((d) => (
                <button key={d.name} onClick={() => { setSelectedDoc(d.name); setDocOpen(false); }}>
                  <span className="model-line"><b>{shortName(d.name, 30)}</b><small>{d.chunks} chunks</small></span>
                  {activeDoc === d.name && <Icon name="check" size={15} />}
                </button>
              ))}
            </div>
          )}
        </div>
        <div className="spacer" />
        <div className="model-wrap" onClick={(e) => e.stopPropagation()}>
          <button
            className="model-pill"
            title={`${currentModel.label}: ${currentModel.name}`}
            onClick={() => { setModelOpen((v) => !v); setDocOpen(false); }}
          >
            <span className="dot" /> <span className="model-label">{currentModel.label}</span> <Icon name="down" size={14} />
          </button>
          {modelOpen && (
            <div className="menu model-menu">
              <div className="menu-head">Choose AI</div>
              {MODELS.map((m) => (
                <button key={m.id} onClick={() => { setModel(m.id); setModelOpen(false); }}>
                  <span className="model-line">
                    <b>{m.label} <em>{m.name}</em></b>
                  </span>
                  {m.id === model && <Icon name="check" size={15} />}
                </button>
              ))}
            </div>
          )}
        </div>
        <button
          className={`icon-btn ${listening ? "rec" : ""}`}
          aria-label="Voice input"
          title={listening ? "Stop listening" : "Voice input"}
          onClick={toggleVoice}
        >
          <Icon name="mic" />
        </button>
        <button className="send" aria-label="Send" disabled={!input.trim() || loading} onClick={() => send()}>
          <Icon name="up" />
        </button>
      </div>
    </div>
  );

  const empty = messages.length === 0;

  return (
    <div className="app">
      {sidebarOpen && window.innerWidth <= 800 && (
        <div className="scrim" onClick={() => setSidebarOpen(false)} />
      )}
      <aside className={`sidebar ${sidebarOpen ? "" : "closed"}`}>
        <div className="side-top">
          <div className="brand">
            <div className="logo">D</div>
            <span>DocuMind</span>
          </div>
          <button className="icon-btn" aria-label="Close sidebar" onClick={() => setSidebarOpen(false)}>
            <Icon name="panel" />
          </button>
        </div>

        <nav className="nav-list">
          <button className="nav new" onClick={newChat}>
            <Icon name="plus" /> New chat
          </button>
          <label className="nav search">
            <Icon name="search" />
            <input placeholder="Search chats" value={search} onChange={(e) => setSearch(e.target.value)} />
          </label>
        </nav>

        <div className="side-scroll">
          <div className="side-section">
            {head("docs", "Your documents", docs.length)}
            {!collapsed.docs && (
              <div className="section-body">
                {uploading && (
                  <div className="doc-card pending">
                    <span className="spinner" />
                    <div>
                      <div className="doc-name">Processing PDF…</div>
                      <div className="doc-meta">Reading, splitting and indexing</div>
                    </div>
                  </div>
                )}
                {docs.length === 0 && !uploading && (
                  <div className="empty-note">No documents yet. Use Attach PDF in the message box.</div>
                )}
          {docs.map((d) => (
            <div className={`doc-card ${activeDoc === d.name ? "selected" : ""}`} key={d.name}>
              <Icon name="file" size={15} />
              <div className="doc-body">
                <div className="doc-name" title={d.name}>{d.name}</div>
                <div className="doc-meta"><span className="ok-dot" /> Ready · {d.chunks} chunks</div>
              </div>
              <button
                className="icon-btn dots small"
                aria-label="Document options"
                onClick={(e) => { e.stopPropagation(); setDocMenu(docMenu === d.name ? null : d.name); }}
              >
                <Icon name="more" size={16} />
              </button>
              {docMenu === d.name && (
                <div className="menu" onClick={(e) => e.stopPropagation()}>
                  <button onClick={() => { window.open(`/files/${encodeURIComponent(d.name)}`, "_blank"); setDocMenu(null); }}>
                    <Icon name="external" /> Preview PDF
                  </button>
                  <button onClick={() => { setSelectedDoc(d.name); setDocMenu(null); }}>
                    <Icon name="search" /> Ask only this PDF
                  </button>
                  <button className="danger" onClick={() => { deleteDoc(d.name); setDocMenu(null); }}>
                    <Icon name="trash" /> Delete
                  </button>
                </div>
              )}
            </div>
          ))}
              </div>
            )}
          </div>

          {pinned.length > 0 && (
            <div className="side-section">
              {head("pinned", "Pinned", pinned.length)}
              {!collapsed.pinned && <div className="section-body">{pinned.map(renderRow)}</div>}
            </div>
          )}

          <div className="side-section">
            {head("recent", "Recent chats", recent.length)}
            {!collapsed.recent && (
              <div className="section-body">
                {recent.length === 0 && <div className="empty-note">No chats yet</div>}
                {recent.map(renderRow)}
              </div>
            )}
          </div>

          {archived.length > 0 && (
            <div className="side-section">
              {head("archived", "Archived", archived.length)}
              {!collapsed.archived && <div className="section-body">{archived.map(renderRow)}</div>}
            </div>
          )}
        </div>

      </aside>

      <main className="main">
        <header className="topbar">
          {!sidebarOpen && (
            <button className="icon-btn" aria-label="Open sidebar" onClick={() => setSidebarOpen(true)}>
              <Icon name="panel" />
            </button>
          )}
          <div className="top-title">{active ? active.title : ""}</div>
          <button
            className="icon-btn"
            aria-label="Switch theme"
            title={theme === "dark" ? "Light mode" : "Dark mode"}
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
          >
            <Icon name={theme === "dark" ? "sun" : "moon"} />
          </button>
          {active && !empty && (
            <>
              <button
                className="ghost"
                onClick={() => shareChat(active)}
                title="Copies this conversation as text. No link is created."
              >
                <Icon name="share" size={16} /> Share
              </button>
              <div className="top-more">
                <button className="icon-btn" aria-label="More" onClick={() => setTopMenu((v) => !v)}>
                  <Icon name="more" />
                </button>
                {topMenu && (
                  <div className="menu top-menu">
                    <button onClick={() => { setTopMenu(false); clearChat(); }}>
                      <Icon name="eraser" size={15} /> Clear chat
                    </button>
                  </div>
                )}
              </div>
            </>
          )}
        </header>

        {empty ? (
          <section className="chat welcome-mode">
            <div className="welcome">
              <div className="greet">
                <div className="logo big">D</div>
                <h1>Chat with your PDFs</h1>
              </div>
              <p className="sub">Upload a PDF, ask questions, and get answers with page references.</p>
              {composer}
              <div className="try-label">Try asking</div>
              <div className="chips-row">
                {EXAMPLES.map((ex) => (
                  <button key={ex} onClick={() => send(ex)}>{ex}</button>
                ))}
              </div>
              <div className="note">{NOTE}</div>
            </div>
          </section>
        ) : (
          <>
            <section className="chat">
              <div className="thread">
                {messages.map((m, i) => (
                  <div className={`msg ${m.role}`} key={i}>
                    {m.role === "ai" && <div className="avatar">D</div>}
                    <div className="bubble">
                      {m.noAnswer && (
                        <div className="noanswer-box">
                          <div className="noanswer">
                            <Icon name="info" size={16} /> No answer found in your documents
                          </div>
                          <div className="tips">
                            Try asking in different words, or add a detail such as the week, section or
                            program name.
                            {docs.length > 1 && " You can also pick a different PDF."}
                          </div>
                          <div className="tip-actions">
                            {m.scope && (
                              <button
                                onClick={() => { setSelectedDoc(""); send(m.question); }}
                              >
                                Search all documents
                              </button>
                            )}
                            {docs.length > 1 && (
                              <button
                                onClick={(e) => { e.stopPropagation(); setDocOpen(true); }}
                              >
                                Choose another PDF
                              </button>
                            )}
                          </div>
                        </div>
                      )}
                      {m.role === "ai" && !m.error ? (
                        m.text ? <div className={`text md ${m.noAnswer ? "soft" : ""}`}><ReactMarkdown>{m.text}</ReactMarkdown></div> : null
                      ) : (
                        <div className={`text ${m.error ? "err" : ""}`}>{m.text}</div>
                      )}
                      {m.cites && m.cites.length > 0 && (
                        <div className="pages">
                          {m.cites.map((c) =>
                            c.doc ? (
                              <a
                                className="cite"
                                key={`${c.doc}-${c.page}`}
                                href={`/files/${encodeURIComponent(c.doc)}#page=${c.pdf_page}`}
                                target="_blank"
                                rel="noreferrer"
                                title={`Open page ${c.page} of ${c.doc}`}
                              >
                                <Icon name="file" size={13} /> {shortName(c.doc, 20)} · p.{c.page}
                              </a>
                            ) : (
                              <span key={c.page}>Page {c.page}</span>
                            ),
                          )}
                        </div>
                      )}
                      {m.role === "ai" && !m.error && m.kind !== "chat" && m.kind !== "busy" && (
                        <div className="meta">
                          {m.cites && m.cites.length > 0
                            ? `Based on ${[...new Set(m.cites.map((c) => shortName(c.doc, 28)).filter(Boolean))].join(", ") || "your PDF"}`
                            : `Searched ${m.scope ? shortName(m.scope, 28) : "all documents"}`}
                          {m.model ? ` · ${m.model}` : ""}
                          {m.asked && <div className="asked">Searched for: “{m.asked}”</div>}
                        </div>
                      )}
                      {m.kind === "busy" && (
                        <div className="tip-actions">
                          <button onClick={() => regenerate(i)}>Try again</button>
                        </div>
                      )}
                      {m.role === "ai" && !m.error && (
                        <div className="actions">
                          <button className="mini" aria-label="Copy" title="Copy" onClick={() => copyText(m.text)}>
                            <Icon name="copy" size={15} />
                          </button>
                          <button
                            className={`mini ${speaking === i ? "on" : ""}`}
                            aria-label="Read aloud"
                            title={speaking === i ? "Stop" : "Read aloud"}
                            onClick={() => speak(m.text, i)}
                          >
                            <Icon name={speaking === i ? "stop" : "play"} size={15} />
                          </button>
                          {m.question && m.kind !== "chat" && m.kind !== "busy" && (
                            <div className="regen-wrap">
                              <button
                                className="mini"
                                aria-label="Regenerate"
                                title="Try again"
                                onClick={() => setRegenMenu(regenMenu === i ? null : i)}
                              >
                                <Icon name="refresh" size={15} />
                              </button>
                              {regenMenu === i && (
                                <div className="menu regen-menu">
                                  <button onClick={() => regenerate(i, "different")}>Try again</button>
                                  <button onClick={() => regenerate(i, "detailed")}>More detail</button>
                                  <button onClick={() => regenerate(i, "shorter")}>Shorter</button>
                                </div>
                              )}
                            </div>
                          )}
                          {m.kind !== "chat" && m.kind !== "busy" && (<>
                          <button
                            className={`mini ${m.rating === "up" ? "on" : ""}`}
                            aria-label="Good answer"
                            title="Good answer"
                            onClick={() => rate(i, "up")}
                          >
                            <Icon name="thumbUp" size={14} />
                          </button>
                          <button
                            className={`mini ${m.rating === "down" ? "on bad" : ""}`}
                            aria-label="Bad answer"
                            title="Bad answer"
                            onClick={() => rate(i, "down")}
                          >
                            <Icon name="thumbDown" size={14} />
                          </button>
                          </>)}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
                {loading && (
                  <div className="msg ai">
                    <div className="avatar">D</div>
                    <div className="bubble"><div className="text muted status"><span className="spinner" /> {status}</div></div>
                  </div>
                )}
                <div ref={endRef} />
              </div>
            </section>
            <footer className="composer-wrap">
              {composer}
              <div className="hint">{NOTE}</div>
            </footer>
          </>
        )}
      </main>

      <input
        ref={fileRef}
        type="file"
        accept="application/pdf"
        hidden
        onChange={(e) => uploadFile(e.target.files[0])}
      />
      {toast && <div className="toast">{toast}</div>}
    </div>
  );
}
