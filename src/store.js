import { getMode, LIVE } from "./coin";

const KEY = "citv-slot-v1";
export const GRANT = 10000;
export const FLOOR = 250;

export function loadState(fallback) {
  const live = getMode() === LIVE;
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) {
      return { ...fallback, balance: fallback.balance, granted: true };
    }
    const d = JSON.parse(raw);
    let balance = Number.isFinite(d.balance) ? d.balance : fallback.balance;
    let granted = !!d.granted;
    if (!live && !granted) {
      balance += GRANT;
      granted = true;
    }
    if (!live && balance < FLOOR) balance += 2500;
    if (live) granted = true;
    const session = d.session && typeof d.session === "object" ? { ...fallback.session, ...d.session } : fallback.session;
    if (!d.granted && !live) session.start = balance;
    const next = { balance, session, muted: !!d.muted, granted };
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

export function topUp(balance, amount = 2500) {
  if (getMode() === LIVE) return Math.max(0, Number(balance) || 0);
  return Math.max(0, Number(balance) || 0) + amount;
}
