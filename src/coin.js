// CITV Slot — bakiye kapisi
// DEMO: yerel fiş. LIVE: dağıtım sonrası GET ?wallet= (Issue #24)
// Sunucu yokken LIVE açılsa bile spin istemcide kalır; musluk kapanır.

export const DEMO = "DEMO";
export const LIVE = "LIVE";
const MODE_KEY = "citv-mode";
const WALLET_KEY = "citv-wallet";

export function getMode() {
  try {
    return localStorage.getItem(MODE_KEY) === LIVE ? LIVE : DEMO;
  } catch {
    return DEMO;
  }
}

export function setMode(mode) {
  const v = mode === LIVE ? LIVE : DEMO;
  try {
    localStorage.setItem(MODE_KEY, v);
  } catch {}
  return v;
}

export function getWallet() {
  try {
    return localStorage.getItem(WALLET_KEY) || "";
  } catch {
    return "";
  }
}

export function setWallet(addr) {
  const v = String(addr || "").trim();
  try {
    localStorage.setItem(WALLET_KEY, v);
  } catch {}
  return v;
}

export function liveUrl() {
  try {
    return (import.meta.env && import.meta.env.VITE_CITV_BALANCE_URL) || "";
  } catch {
    return "";
  }
}

export async function fetchLiveBalance(wallet) {
  const base = liveUrl();
  const w = wallet || getWallet();
  if (!base) return { ok: false, reason: "endpoint-yok" };
  if (!w) return { ok: false, reason: "cüzdan-yok" };
  try {
    const r = await fetch(`${base}?wallet=${encodeURIComponent(w)}`);
    if (!r.ok) return { ok: false, reason: "http" };
    const j = await r.json();
    const balance = Number(j.balance);
    if (!Number.isFinite(balance)) return { ok: false, reason: "sayi-degil" };
    return { ok: true, balance };
  } catch {
    return { ok: false, reason: "ag" };
  }
}
