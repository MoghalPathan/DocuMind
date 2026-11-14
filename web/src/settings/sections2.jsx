import { useEffect, useState } from "react";
import SIcon from "./icons.jsx";
import { Btn, Card, Row, Toggle } from "./controls.jsx";
import { AVATAR_COLORS, readActivity, sendCommand, setPref, streaks, useLive, usePrefs } from "./prefs.js";

// numbers count up when a page opens (skipped when motion is reduced)
function useCount(target) {
  const [n, setN] = useState(0);
  useEffect(() => {
    if (document.documentElement.dataset.motion === "reduce" || target === 0) {
      setN(target);
      return undefined;
    }
    let raf;
    const t0 = performance.now();
    const step = (t) => {
      const k = Math.min(1, (t - t0) / 700);
      setN(Math.round(target * (1 - Math.pow(1 - k, 3))));
      if (k < 1) raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [target]);
  return n;
}

function Stat({ label, value, unit }) {
  const n = useCount(value);
  return (
    <div className="sx-stat">
      <b>
        {n}
        {unit && <small>{unit}</small>}
      </b>
      <span>{label}</span>
    </div>
  );
}

const MODEL_NAME = { groq: "Groq", gemini: "Gemini" };
const plural = (n, w) => `${n} ${w}${n === 1 ? "" : "s"}`;
const shortDoc = (s, n = 34) => (s.length > n ? s.slice(0, n - 1) + "..." : s);

export function Profile({ auth }) {
  const p = usePrefs();
  const lv = useLive();
  const act = readActivity(auth.user.id);
  const sk = streaks(act.days);
  const own = (p.displayName || "").trim();
  const letter = own ? own[0].toUpperCase() : (auth.user.email || "G")[0].toUpperCase();
  const top = (o) => Object.entries(o).sort((a, b) => b[1] - a[1])[0];
  const topModel = top(act.models);
  const topDoc = top(act.docs);
  const helpful = lv.chats.reduce((n, c) => n + (c.messages || []).filter((m) => m.rating === "up").length, 0);
  return (
    <>
      <div className="sx-hero">
        <span className="sx-hero-av" style={{ background: p.avatarColor }}>{letter}</span>
        <div className="sx-hero-text">
          <label htmlFor="sx-name">Display name</label>
          <input
            id="sx-name"
            className="sx-input"
            maxLength={30}
            placeholder="What should we call you?"
            value={p.displayName}
            onChange={(e) => setPref("displayName", e.target.value)}
          />
          <small>{auth.user.guest ? "Guest session" : auth.user.email}</small>
        </div>
      </div>
      <Card>
        <Row title="Avatar colour" hint="Shown next to your name in the sidebar.">
          <div className="sx-swatches" role="radiogroup" aria-label="Avatar colour">
            {AVATAR_COLORS.map((c) => (
              <button
                key={c}
                type="button"
                role="radio"
                aria-checked={p.avatarColor === c}
                aria-label={"Colour " + c}
                className={"sx-swatch" + (p.avatarColor === c ? " on" : "")}
                style={{ background: c }}
                onClick={() => setPref("avatarColor", c)}
              />
            ))}
          </div>
        </Row>
      </Card>
      <h2 className="sx-sub">Your activity</h2>
      <div className="sx-stats">
        <Stat label="Questions asked" value={act.total || 0} />
        <Stat label="Documents" value={lv.docs.length} />
        <Stat label="Longest streak" value={sk.best} unit={sk.best === 1 ? "day" : "days"} />
        <Stat label="Current streak" value={sk.cur} unit={sk.cur === 1 ? "day" : "days"} />
      </div>
      <h2 className="sx-sub">Insights</h2>
      <Card>
        <Row title="Most used AI" hint="The model you picked for most questions.">
          <span className="sx-val">{topModel ? `${MODEL_NAME[topModel[0]] || topModel[0]} (${plural(topModel[1], "question")})` : "Nothing yet"}</span>
        </Row>
        <Row title="Most asked document" hint="The document you chose most often.">
          <span className="sx-val" title={topDoc ? topDoc[0] : ""}>{topDoc ? `${shortDoc(topDoc[0])} (${topDoc[1]})` : "Nothing yet"}</span>
        </Row>
        <Row title="Helpful answers" hint="Answers you marked with a thumbs up.">
          <span className="sx-val">{helpful}</span>
        </Row>
      </Card>
      <p className="sx-note sx-gap">Your activity is counted in this browser only. Clearing your browser data resets it.</p>
    </>
  );
}

export function Personalization() {
  const p = usePrefs();
  return (
    <Card>
      <Row title="Stream answers" hint="Show the answer as it is written. Off shows it once, when it is ready.">
        <Toggle label="Stream answers" checked={p.stream} onChange={(v) => setPref("stream", v)} />
      </Row>
      <Row title="Show source text on hover" hint="Hover a page chip to read the exact passage the answer used.">
        <Toggle label="Show source text on hover" checked={p.hoverSource} onChange={(v) => setPref("hoverSource", v)} />
      </Row>
      <Row title="Use my name in the greeting" hint="Say hello by name on the start screen. Set your name in Profile.">
        <Toggle label="Use my name in the greeting" checked={p.greetName} onChange={(v) => setPref("greetName", v)} />
      </Row>
    </Card>
  );
}

function Empty({ icon, title, hint }) {
  return (
    <div className="sx-empty">
      <SIcon name={icon} size={30} />
      <b>{title}</b>
      <p>{hint}</p>
    </div>
  );
}

export function Documents({ go }) {
  const lv = useLive();
  const limit = lv.limits ? lv.limits.docs : 0;
  const used = lv.docs.length;
  return (
    <>
      <div className="sx-quota">
        <div>
          <b>{limit ? `${used} of ${limit}` : used}</b> documents {limit ? "used" : "added"}
        </div>
        {limit > 0 && <div className="sx-bar"><i style={{ width: Math.min(100, (used / limit) * 100) + "%" }} /></div>}
        <Btn onClick={() => { go("/"); sendCommand("upload"); }} disabled={limit > 0 && used >= limit}>Add a document</Btn>
      </div>
      {used === 0 ? (
        <Empty icon="docs" title="No documents yet" hint="Upload a file or add a link from the main screen." />
      ) : (
        <Card>
          {lv.docs.map((d) => (
            <div className="sx-item" key={d.name}>
              <SIcon name="file" size={20} />
              <div className="sx-item-text">
                <b title={d.name}>{d.name}</b>
                <small>{plural(d.chunks || 0, "part")} in search</small>
              </div>
              <Btn onClick={() => { go("/"); sendCommand("askDoc", d.name); }}>Ask about it</Btn>
              <Btn danger onClick={() => sendCommand("deleteDoc", d.name)}>Delete</Btn>
            </div>
          ))}
        </Card>
      )}
    </>
  );
}

export function Archived({ go }) {
  const lv = useLive();
  const list = lv.chats.filter((c) => c.archived);
  return (
    <>
      {list.length > 0 && (
        <div className="sx-bulk">
          <Btn onClick={() => sendCommand("unarchiveAll")}>Unarchive all</Btn>
        </div>
      )}
      {list.length === 0 ? (
        <Empty icon="archive" title="No archived chats" hint="Archive a chat from its menu in the sidebar and it will show up here." />
      ) : (
        <Card>
          {list.map((c) => (
            <div className="sx-item" key={c.id}>
              <SIcon name="archive" size={20} />
              <div className="sx-item-text">
                <b title={c.title}>{c.title}</b>
                <small>{plural((c.messages || []).length, "message")}</small>
              </div>
              <Btn onClick={() => { go("/"); sendCommand("openChat", c.id); }}>Open</Btn>
              <Btn onClick={() => sendCommand("unarchive", c.id)}>Unarchive</Btn>
              <Btn danger onClick={() => sendCommand("deleteChat", c.id)}>Delete</Btn>
            </div>
          ))}
        </Card>
      )}
    </>
  );
}

export function Shared() {
  const lv = useLive();
  const [copied, setCopied] = useState("");
  const list = lv.chats.filter((c) => c.shareId);
  const url = (c) => `${window.location.origin}/s/${c.shareId}`;
  const copy = async (c) => {
    try {
      await navigator.clipboard.writeText(url(c));
      setCopied(c.shareId);
      setTimeout(() => setCopied(""), 1600);
    } catch {
      window.prompt("Copy this link", url(c));
    }
  };
  return list.length === 0 ? (
    <Empty icon="link" title="No shared links" hint="Use Share on a chat to make a link. Your links are listed here, and you can stop sharing any time." />
  ) : (
    <Card>
      {list.map((c) => (
        <div className="sx-item" key={c.id}>
          <SIcon name="link" size={20} />
          <div className="sx-item-text">
            <b title={c.title}>{c.title}</b>
            <small>{url(c)}</small>
          </div>
          <Btn onClick={() => copy(c)}>{copied === c.shareId ? "Copied" : "Copy link"}</Btn>
          <Btn onClick={() => window.open(url(c), "_blank", "noopener")}>Open</Btn>
          <Btn danger onClick={() => sendCommand("unshare", c.id)}>Stop sharing</Btn>
        </div>
      ))}
    </Card>
  );
}
