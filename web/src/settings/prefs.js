// Small settings store: saved in the browser, shared by every part of the app.
import { useEffect, useState } from "react";

const KEY = "documind.prefs";
const MODEL_KEY = "documind.model";
const EVENT = "documind-prefs";

export const DEFAULTS = {
  theme: "dark", // "light" | "dark" | "device"
  textSize: 1, // 0 small, 1 normal, 2 large
  reduceMotion: false,
  examples: true,
  sendKey: "enter", // "enter" or "ctrl"
  voiceLang: "en-IN",
  autoSend: false,
  ttsRate: 1, // 0 slow, 1 normal, 2 fast
  ttsVoice: "",
};

export const TEXT_SCALE = [0.9, 1, 1.15];
export const TTS_RATE = [0.8, 1, 1.25];

function savedTheme() {
  try {
    return JSON.parse(localStorage.getItem("documind.theme")) || "dark";
  } catch {
    return "dark";
  }
}

function read() {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) return { ...DEFAULTS, ...JSON.parse(raw) };
  } catch {
    /* ignore */
  }
  return { ...DEFAULTS, theme: savedTheme() };
}

let cache = read();

export const getPrefs = () => cache;

export function resolveTheme(mode) {
  if (mode === "device") {
    return window.matchMedia && window.matchMedia("(prefers-color-scheme: light)").matches ? "light" : "dark";
  }
  return mode === "light" ? "light" : "dark";
}

// Apply what the settings say to the page itself.
export function applyPrefs() {
  const root = document.documentElement;
  const t = resolveTheme(cache.theme);
  root.dataset.theme = t;
  try {
    localStorage.setItem("documind.theme", JSON.stringify(t));
  } catch {
    /* ignore */
  }
  root.style.setProperty("--chat-scale", String(TEXT_SCALE[cache.textSize] ?? 1));
  root.dataset.motion = cache.reduceMotion ? "reduce" : "full";
}

export function setPref(key, value) {
  cache = { ...cache, [key]: value };
  try {
    localStorage.setItem(KEY, JSON.stringify(cache));
  } catch {
    /* ignore */
  }
  applyPrefs();
  window.dispatchEvent(new Event(EVENT));
}

// The theme switch in the top bar and the one in Settings share one value.
export function currentTheme() {
  return cache.theme === "device" ? "device" : savedTheme();
}

export function getModel(fallback) {
  try {
    return JSON.parse(localStorage.getItem(MODEL_KEY)) || fallback;
  } catch {
    return fallback;
  }
}

export function setModelPref(id) {
  try {
    localStorage.setItem(MODEL_KEY, JSON.stringify(id));
  } catch {
    /* ignore */
  }
  window.dispatchEvent(new Event(EVENT));
}

export function usePrefs() {
  const [, tick] = useState(0);
  useEffect(() => {
    const f = () => tick((n) => n + 1);
    window.addEventListener(EVENT, f);
    return () => window.removeEventListener(EVENT, f);
  }, []);
  return cache;
}

// Call once at the top of the app.
export function useApplyPrefs() {
  useEffect(() => {
    // a saved "device" choice, or a first visit, is applied now; an explicit light or dark choice is left as saved
    if (cache.theme === "device") applyPrefs();
    else {
      const root = document.documentElement;
      root.style.setProperty("--chat-scale", String(TEXT_SCALE[cache.textSize] ?? 1));
      root.dataset.motion = cache.reduceMotion ? "reduce" : "full";
    }
    const mq = window.matchMedia ? window.matchMedia("(prefers-color-scheme: light)") : null;
    const onChange = () => {
      if (cache.theme === "device") applyPrefs();
    };
    mq && mq.addEventListener && mq.addEventListener("change", onChange);
    return () => mq && mq.removeEventListener && mq.removeEventListener("change", onChange);
  }, []);
}

// Commands that Settings sends to the chat screen (export, clear, delete account, open shortcuts).
export const sendCommand = (cmd) => window.dispatchEvent(new CustomEvent("documind-cmd", { detail: { cmd } }));
