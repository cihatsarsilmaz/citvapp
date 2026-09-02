import { STAR } from "./paytable";

export function lockAt(c, nCols, base, step, turbo) {
  const hold = !turbo && c === nCols - 1 ? 240 : 0;
  return base + c * step + hold;
}

export function starsLocked(next, locks) {
  let n = 0;
  for (let i = 0; i < next.length; i++) {
    if (!locks[i]) continue;
    for (const s of next[i]) if (s === STAR) n++;
  }
  return n;
}

export function markCell(sym) {
  if (sym === STAR) return " star";
  if (sym === "🎰") return " wild";
  return "";
}
