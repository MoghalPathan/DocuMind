import { useEffect, useRef } from "react";
import { usePrefs } from "./prefs.js";

export default function Shortcuts({ onClose }) {
  const p = usePrefs();
  const btn = useRef(null);
  useEffect(() => {
    btn.current && btn.current.focus();
    const esc = (e) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", esc);
    return () => window.removeEventListener("keydown", esc);
  }, [onClose]);
  const rows = [
    ["New chat", ["Alt", "N"]],
    ["Search chats", ["Alt", "K"]],
    ["Open or close the sidebar", ["Alt", "B"]],
    ["Go to the question box", ["Alt", "M"]],
    ["Send the question", p.sendKey === "ctrl" ? ["Ctrl", "Enter"] : ["Enter"]],
    ["New line in the question", p.sendKey === "ctrl" ? ["Enter"] : ["Shift", "Enter"]],
    ["Show this list", ["Ctrl", "/"]],
    ["Close menus and windows", ["Esc"]],
  ];
  return (
    <div className="sk-scrim" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div className="sk-box" role="dialog" aria-modal="true" aria-label="Keyboard shortcuts">
        <div className="sk-head">
          <h2>Keyboard shortcuts</h2>
          <button type="button" ref={btn} className="sk-x" aria-label="Close" onClick={onClose}>
            <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><line x1="6" y1="6" x2="18" y2="18" /><line x1="18" y1="6" x2="6" y2="18" /></svg>
          </button>
        </div>
        <ul className="sk-list">
          {rows.map(([label, keys]) => (
            <li key={label}>
              <span>{label}</span>
              <span className="sk-keys">{keys.map((k, i) => <span key={k + i}>{i > 0 && <em>+</em>}<kbd>{k}</kbd></span>)}</span>
            </li>
          ))}
        </ul>
        <p className="sk-note">On a Mac, Alt is the Option key. Change the send keys in Settings, General.</p>
      </div>
    </div>
  );
}
