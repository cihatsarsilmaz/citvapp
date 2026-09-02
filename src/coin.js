/** CITV coin — salon birimi.
 * DEMO: yerel kredi (dağıtım öncesi).
 * LIVE: sen dağıtımı bitirdikten sonra açılır; zincir/cüzdan adaptörü buraya takılır.
 */
export const TICKER = "CITV";
export const MODE_KEY = "citv-mode";
export const CLAIM_KEY = "citv-claim";
export const WALLET_KEY = "citv-wallet";

export const DEMO = "demo";
export const LIVE = "live";

export function loadMode() {
  try {
    return localStorage.getItem(MODE_KEY) === LIVE ? LIVE : DEMO;
  } catch {
    return DEMO;
  }
}

export function saveMode(mode) {
  try {
    localStorage.setItem(MODE_KEY, mode === LIVE ? LIVE : DEMO);
  } catch {}
}

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

export function loadWallet() {
  try {
    return localStorage.getItem(WALLET_KEY) || "";
  } catch {
    return "";
  }
}

export function saveWallet(addr) {
  try {
    localStorage.setItem(WALLET_KEY, String(addr || "").trim());
  } catch {}
}

export function formatCitv(n) {
  const v = Number.isFinite(Number(n)) ? Number(n) : 0;
  return `${v.toLocaleString("tr-TR")} ${TICKER}`;
}

/** Dağıtım sonrası gerçek bakiye — endpoint gelince doldurulur. */
export async function fetchLiveBalance({ endpoint, wallet } = {}) {
  if (!endpoint || !wallet) return null;
  const url = `${endpoint.replace(/\/$/, "")}?wallet=${encodeURIComponent(wallet)}`;
  const res = await fetch(url, { headers: { Accept: "application/json" } });
  if (!res.ok) throw new Error(`live ${res.status}`);
  const data = await res.json();
  const bal = Number(data.balance ?? data.citv ?? data.amount);
  return Number.isFinite(bal) ? bal : null;
}

export function liveReady() {
  return loadMode() === LIVE && !!loadWallet();
}
