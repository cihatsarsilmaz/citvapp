const KEY = "citv-slot-v1";

export function loadState(fallback) {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return fallback;
    const d = JSON.parse(raw);
    return {
      balance: Number.isFinite(d.balance) ? d.balance : fallback.balance,
      session: d.session && typeof d.session === "object" ? { ...fallback.session, ...d.session } : fallback.session,
      muted: !!d.muted,
    };
  } catch {
    return fallback;
  }
}

export function saveState(state) {
  try {
    localStorage.setItem(KEY, JSON.stringify({
      balance: state.balance,
      session: state.session,
      muted: state.muted,
    }));
  } catch {}
}
