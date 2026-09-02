const KEY = "citv-recent";

export function loadRecents() {
  try {
    const d = JSON.parse(localStorage.getItem(KEY) || "[]");
    return Array.isArray(d) ? d.filter((x) => typeof x === "string").slice(0, 4) : [];
  } catch {
    return [];
  }
}

export function pushRecent(id) {
  const next = [id, ...loadRecents().filter((x) => x !== id)].slice(0, 4);
  try { localStorage.setItem(KEY, JSON.stringify(next)); } catch {}
  return next;
}
