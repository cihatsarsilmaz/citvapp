// CITV Slot — bakiye kapisi
// DEMO: yerel fiş. LIVE: dağıtım sonrası GET ?wallet= (Issue #24)
// Sunucu yokken LIVE açılsa bile spin istemcide kalır; musluk kapanır.

export const DEMO = "DEMO";
export const LIVE = "LIVE";
export const TICKER = "CITV";
export const MODE_KEY = "citv-mode";
export const CLAIM_KEY = "citv-claim";
export const WALLET_KEY = "citv-wallet";

export function getMode() {
  try {
    const mode = localStorage.getItem(MODE_KEY);
    return mode === LIVE || String(mode).toLowerCase() === "live" ? LIVE : DEMO;
  } catch {
    return DEMO;
  }
}

export const loadMode = getMode;

export function setMode(mode) {
  const v = mode === LIVE ? LIVE : DEMO;
  try {
    localStorage.setItem(MODE_KEY, v);
  } catch {}
  return v;
}

export const saveMode = setMode;

export function loadClaim() {
  try {
    return localStorage.getItem(CLAIM_KEY) || "";
  } catch {
    return "";
  }
}

export function saveClaim(code) {
  try {
    localStorage.setItem(CLAIM_KEY, String(code || "").trim());
  } catch {}
}

export function getWallet() {
  try {
    return localStorage.getItem(WALLET_KEY) || "";
  } catch {
    return "";
  }
}

export const loadWallet = getWallet;

export function setWallet(addr) {
  const v = String(addr || "").trim();
  try {
    localStorage.setItem(WALLET_KEY, v);
  } catch {}
  return v;
}

export const saveWallet = setWallet;

export function formatCitv(n) {
  const value = Number.isFinite(Number(n)) ? Number(n) : 0;
  return `${value.toLocaleString("tr-TR")} ${TICKER}`;
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
  const url = `${base}?wallet=${encodeURIComponent(w)}`;
  let r;
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      r = await fetch(url);
    } catch {
      if (attempt === 2) return { ok: false, reason: "ag" };
      await new Promise((resolve) => setTimeout(resolve, 250 * 2 ** attempt));
      continue;
    }

    if (r.ok) break;
    if (![408, 429].includes(r.status) && r.status < 500) {
      return { ok: false, reason: `http ${url} (${r.status} ${r.statusText})` };
    }
    if (attempt === 2) {
      return { ok: false, reason: `http ${url} (${r.status} ${r.statusText})` };
    }
    await new Promise((resolve) => setTimeout(resolve, 250 * 2 ** attempt));
  }
  try {
    const j = await r.json();
    const balance = Number(j.balance);
    if (!Number.isFinite(balance)) return { ok: false, reason: "sayi-degil" };
    return { ok: true, balance };
  } catch {
    return { ok: false, reason: "ag" };
  }
}

export function liveReady() {
  return getMode() === LIVE && !!getWallet();
}
