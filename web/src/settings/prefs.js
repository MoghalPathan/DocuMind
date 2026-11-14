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
  stream: true,
  hoverSource: true,
  greetName: true,
  displayName: "",
  avatarColor: "#6d7cff",
};

export const AVATAR_COLORS = ["#6d7cff", "#0ea5e9", "#10b981", "#f59e0b", "#ef4444", "#ec4899"];

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
export const sendCommand = (cmd, arg) => window.dispatchEvent(new CustomEvent("documind-cmd", { detail: { cmd, arg } }));

// ---- what ChatApp shares with the Settings pages (chats and documents) ----
export const live = { docs: [], chats: [], userId: "", guest: false, limits: null };
export function useLive() {
  const [, tick] = useState(0);
  useEffect(() => {
    const f = () => tick((n) => n + 1);
    window.addEventListener("documind-live", f);
    return () => window.removeEventListener("documind-live", f);
  }, []);
  return live;
}
export function publishLive(patch) {
  Object.assign(live, patch);
  window.dispatchEvent(new Event("documind-live"));
}

// ---- small activity log, kept in this browser, for the Profile page ----
const actKey = (id) => "documind.activity." + id;
const today = (d = new Date()) => d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0");

export function readActivity(userId) {
  try {
    const a = JSON.parse(localStorage.getItem(actKey(userId)));
    if (a && a.days) return a;
  } catch {
    /* ignore */
  }
  return { days: {}, models: {}, docs: {}, total: 0 };
}

export function logQuestion(userId, model, doc) {
  const a = readActivity(userId);
  const t = today();
  a.days[t] = (a.days[t] || 0) + 1;
  a.total = (a.total || 0) + 1;
  if (model) a.models[model] = (a.models[model] || 0) + 1;
  if (doc) a.docs[doc] = (a.docs[doc] || 0) + 1;
  try {
    localStorage.setItem(actKey(userId), JSON.stringify(a));
  } catch {
    /* ignore */
  }
  window.dispatchEvent(new Event("documind-live"));
}

export function streaks(days) {
  const keys = Object.keys(days).sort();
  const one = 86400000;
  const ms = (k) => new Date(k + "T00:00:00").getTime();
  let best = 0;
  let run = 0;
  let prev = null;
  keys.forEach((k) => {
    run = prev !== null && Math.round((ms(k) - prev) / one) === 1 ? run + 1 : 1;
    prev = ms(k);
    if (run > best) best = run;
  });
  // current streak counts back from today (or yesterday, if nothing asked yet today)
  let cur = 0;
  let d = new Date();
  if (!days[today(d)]) d = new Date(d.getTime() - one);
  while (days[today(d)]) {
    cur += 1;
    d = new Date(d.getTime() - one);
  }
  return { best, cur };
}
