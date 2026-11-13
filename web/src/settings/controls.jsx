import { useEffect, useRef, useState } from "react";

export function Card({ children }) {
  return <div className="sx-card">{children}</div>;
}

export function Row({ title, hint, children }) {
  return (
    <div className="sx-row">
      <div className="sx-row-text">
        <b>{title}</b>
        {hint && <small>{hint}</small>}
      </div>
      <div className="sx-row-ctl">{children}</div>
    </div>
  );
}

export function Toggle({ checked, onChange, label }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      className={"sx-toggle" + (checked ? " on" : "")}
      onClick={() => onChange(!checked)}
    >
      <i />
    </button>
  );
}

// Buttons that share one sliding highlight.
export function Segmented({ value, options, onChange, label }) {
  const idx = Math.max(0, options.findIndex((o) => o.value === value));
  return (
    <div className="sx-seg" role="radiogroup" aria-label={label} style={{ "--n": options.length, "--i": idx }}>
      <span className="sx-seg-thumb" aria-hidden="true" />
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          role="radio"
          aria-checked={o.value === value}
          className={o.value === value ? "on" : ""}
          onClick={() => onChange(o.value)}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

// A real range input with a few named stops.
export function Slider({ value, labels, onChange, label }) {
  const max = labels.length - 1;
  return (
    <div className="sx-slider">
      <input
        type="range"
        min={0}
        max={max}
        step={1}
        value={value}
        aria-label={label}
        aria-valuetext={labels[value]}
        style={{ "--p": (value / max) * 100 + "%" }}
        onChange={(e) => onChange(Number(e.target.value))}
      />
      <div className="sx-slider-labels">
        {labels.map((l, i) => (
          <button key={l} type="button" tabIndex={-1} className={i === value ? "on" : ""} onClick={() => onChange(i)}>
            {l}
          </button>
        ))}
      </div>
    </div>
  );
}

export function Select({ value, options, onChange, label }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  useEffect(() => {
    if (!open) return undefined;
    const away = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    const esc = (e) => e.key === "Escape" && setOpen(false);
    document.addEventListener("mousedown", away);
    document.addEventListener("keydown", esc);
    return () => {
      document.removeEventListener("mousedown", away);
      document.removeEventListener("keydown", esc);
    };
  }, [open]);
  const cur = options.find((o) => o.value === value) || options[0];
  return (
    <div className="sx-select" ref={ref}>
      <button type="button" className="sx-select-btn" aria-haspopup="listbox" aria-expanded={open} aria-label={label} onClick={() => setOpen((v) => !v)}>
        <span>{cur.label}</span>
        <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true"><polyline points="6 9 12 15 18 9" /></svg>
      </button>
      {open && (
        <ul className="sx-select-list" role="listbox">
          {options.map((o) => (
            <li key={o.value}>
              <button
                type="button"
                role="option"
                aria-selected={o.value === value}
                className={o.value === value ? "on" : ""}
                onClick={() => {
                  onChange(o.value);
                  setOpen(false);
                }}
              >
                <span>{o.label}</span>
                {o.hint && <small>{o.hint}</small>}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export function Btn({ children, onClick, danger, disabled }) {
  return (
    <button type="button" className={"sx-btn" + (danger ? " danger" : "")} onClick={onClick} disabled={disabled}>
      {children}
    </button>
  );
}
