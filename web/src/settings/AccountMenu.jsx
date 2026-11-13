import { useEffect, useRef, useState } from "react";
import SIcon from "./icons.jsx";

const BUG = "https://github.com/MoghalPathan/DocuMind/issues/new";
const open = (url) => window.open(url, "_blank", "noopener");

export default function AccountMenu({ auth, onLogout, go, onShortcuts }) {
  const [on, setOn] = useState(false);
  const [help, setHelp] = useState(false);
  const ref = useRef(null);
  const guest = !!auth.user.guest;
  const name = guest ? "Guest session" : auth.user.email;
  const letter = guest ? "G" : (auth.user.email || "G")[0].toUpperCase();

  useEffect(() => {
    if (!on) return undefined;
    const away = (e) => {
      if (ref.current && !ref.current.contains(e.target)) {
        setOn(false);
        setHelp(false);
      }
    };
    const esc = (e) => {
      if (e.key === "Escape") {
        setOn(false);
        setHelp(false);
      }
    };
    document.addEventListener("mousedown", away);
    document.addEventListener("keydown", esc);
    return () => {
      document.removeEventListener("mousedown", away);
      document.removeEventListener("keydown", esc);
    };
  }, [on]);

  const close = () => {
    setOn(false);
    setHelp(false);
  };
  const item = (icon, label, onClick, extra) => (
    <button type="button" role="menuitem" className={"am-item" + (extra?.danger ? " danger" : "")} onClick={() => { close(); onClick(); }}>
      <SIcon name={icon} size={19} />
      <span>{label}</span>
      {extra?.key && <kbd>{extra.key}</kbd>}
    </button>
  );

  return (
    <div className="am" ref={ref}>
      {on && (
        <div className="am-menu" role="menu" aria-label="Account">
          <div className="am-who">
            <span className="am-av">{letter}</span>
            <div>
              <b title={auth.user.email}>{name}</b>
              <small>{guest ? "Demo account, deleted after 48 hours" : "Signed-up account"}</small>
            </div>
          </div>
          <div className="am-line" />
          {item("gear", "Settings", () => go("/settings"))}
          <div className="am-line" />
          <div className="am-helpwrap" onMouseEnter={() => window.matchMedia("(hover: hover)").matches && setHelp(true)}>
            <button type="button" role="menuitem" aria-haspopup="menu" aria-expanded={help} className={"am-item" + (help ? " hot" : "")} onClick={() => setHelp((v) => !v)}>
              <SIcon name="help" size={19} />
              <span>Help</span>
              <SIcon name="chev" size={16} />
            </button>
            {help && (
              <div className="am-sub" role="menu" aria-label="Help">
                {item("help", "Help center", () => open("/pricing"))}
                {item("note", "Release notes", () => open("/changelog"))}
                {item("key", "Keyboard shortcuts", onShortcuts, { key: "Ctrl+/" })}
                <div className="am-line" />
                {item("file", "Terms of use", () => open("/terms"))}
                {item("shield", "Privacy policy", () => open("/privacy"))}
                {item("bug", "Report a bug", () => open(BUG))}
                {item("ext", "About DocuMind", () => open("/about"))}
              </div>
            )}
          </div>
          {item("out", "Log out", onLogout)}
        </div>
      )}
      <button type="button" className={"am-btn" + (on ? " on" : "")} aria-haspopup="menu" aria-expanded={on} onClick={() => { setOn((v) => !v); setHelp(false); }}>
        <span className="am-av">{letter}</span>
        <span className="am-name" title={auth.user.email}>{name}</span>
      </button>
    </div>
  );
}
