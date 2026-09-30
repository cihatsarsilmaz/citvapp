import { getMode, LIVE } from "./coin.js";

const KEY = "citv-slot-v1";

export function loadState(fallback) {
  const live = getMode() === LIVE;
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) {
      return { ...fallback, balance: fallback.balance, granted: true };
    }
    const d = JSON.parse(raw);
    let balance = live ? 0 : Number.isFinite(d.balance) ? d.balance : fallback.balance;
    const session = d.session && typeof d.session === "object" ? { ...fallback.session, ...d.session } : fallback.session;
    if (!d.granted && !live) session.start = balance;
    const next = { balance, session, muted: !!d.muted, granted: true };
    saveState(next);
    return next;
  } catch {
    return { ...fallback, granted: true };
  }
}

export function saveState(state) {
  try {
    localStorage.setItem(KEY, JSON.stringify({
      balance: state.balance,
      session: state.session,
      muted: state.muted,
      granted: state.granted !== false,
    }));
  } catch {}
}
