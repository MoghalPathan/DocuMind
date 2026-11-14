import { useEffect, useState } from "react";
import SIcon from "./icons.jsx";
import { Appearance, DataControls, General, Voice } from "./sections.jsx";
import { Archived, Documents, Personalization, Profile, Shared } from "./sections2.jsx";
import "./settings.css";

const GROUPS = [
  {
    title: "Personal",
    items: [
      { id: "general", label: "General", icon: "gear", Page: General },
      { id: "appearance", label: "Appearance", icon: "sun", Page: Appearance },
      { id: "personalization", label: "Personalization", icon: "sliders", Page: Personalization },
      { id: "profile", label: "Profile", icon: "user", Page: Profile },
      { id: "voice", label: "Voice", icon: "mic", Page: Voice },
    ],
  },
  {
    title: "Library",
    items: [
      { id: "documents", label: "Documents", icon: "docs", Page: Documents },
      { id: "archived", label: "Archived chats", icon: "archive", Page: Archived },
      { id: "shared", label: "Shared links", icon: "link", Page: Shared },
    ],
  },
  {
    title: "Data",
    items: [{ id: "data", label: "Data controls", icon: "shield", Page: DataControls }],
  },
];

const ALL = GROUPS.flatMap((g) => g.items);

export default function Settings({ go, auth }) {
  const [id, setId] = useState(() => new URLSearchParams(window.location.search).get("s") || "general");
  const cur = ALL.find((x) => x.id === id) || ALL[0];
  const pick = (to) => {
    setId(to);
    window.history.replaceState({}, "", "/settings?s=" + to);
  };

  useEffect(() => {
    const old = document.title;
    document.title = "Settings - DocuMind";
    const esc = (e) => e.key === "Escape" && go("/");
    window.addEventListener("keydown", esc);
    return () => {
      document.title = old;
      window.removeEventListener("keydown", esc);
    };
  }, [go]);

  return (
    <div className="sx-page" role="dialog" aria-label="Settings">
      <aside className="sx-nav">
        <button type="button" className="sx-back" onClick={() => go("/")}>
          <SIcon name="back" /> <span>Back to app</span>
        </button>
        <nav aria-label="Settings sections">
          {GROUPS.map((g) => (
            <div className="sx-group" key={g.title}>
              <div className="sx-group-title">{g.title}</div>
              {g.items.map((it) => (
                <button
                  key={it.id}
                  type="button"
                  className={"sx-nav-item" + (it.id === cur.id ? " on" : "")}
                  aria-current={it.id === cur.id ? "page" : undefined}
                  onClick={() => pick(it.id)}
                >
                  <SIcon name={it.icon} /> <span>{it.label}</span>
                </button>
              ))}
            </div>
          ))}
        </nav>
      </aside>
      <main className="sx-main">
        <div className="sx-content" key={cur.id}>
          <h1>{cur.label}</h1>
          <cur.Page go={go} auth={auth} />
        </div>
      </main>
    </div>
  );
}
