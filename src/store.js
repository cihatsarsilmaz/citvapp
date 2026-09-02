import { loadMode, DEMO } from "./coin";

const KEY = "citv-slot-v2";
const LEGACY = "citv-slot-v1";

function readRaw(key) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function loadState(fallback) {
  const d = readRaw(KEY) || readRaw(LEGACY) || {};
  return {
    balance: Number.isFinite(d.balance) ? d.balance : fallback.balance,
    session: d.session && typeof d.session === "object" ? { ...fallback.session, ...d.session } : fallback.session,
    muted: !!d.muted,
    mode: d.mode === "live" || loadMode() === "live" ? "live" : DEMO,
  };
}

export function saveState(state) {
  try {
    localStorage.setItem(KEY, JSON.stringify({
      balance: state.balance,
      session: state.session,
      muted: state.muted,
      mode: state.mode || DEMO,
    }));
  } catch {}
}
