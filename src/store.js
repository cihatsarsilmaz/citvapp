import { getMode, setMode, DEMO, LIVE } from "./coin";

const KEY = "citv-slot-v2";
const LEGACY = "citv-slot-v1";
export const GRANT = 10000;
export const FLOOR = 250;

function readRaw(key) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function loadState(fallback) {
  const d = readRaw(KEY) || readRaw(LEGACY);
  if (!d) return { ...fallback, granted: true };
  const storedLive = String(d.mode).toUpperCase() === LIVE;
  if (storedLive && getMode() !== LIVE) setMode(LIVE);
  const live = getMode() === LIVE || storedLive;
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
}

export function saveState(state) {
  try {
    localStorage.setItem(KEY, JSON.stringify({
      balance: state.balance,
      session: state.session,
      muted: state.muted,
      mode: getMode() || DEMO,
      granted: state.granted !== false,
    }));
  } catch {}
}

export function topUp(balance, amount = 2500) {
  if (getMode() === LIVE) return Math.max(0, Number(balance) || 0);
  return Math.max(0, Number(balance) || 0) + amount;
}
