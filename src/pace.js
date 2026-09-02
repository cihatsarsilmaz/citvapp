import { STAR } from "./paytable";

export function lockAt(c, nCols, base, step, turbo) {
  const hold = c === nCols - 1 ? (turbo ? 90 : 280) : 0;
  return base + c * step + hold;
}

export function spinTempo(turbo) {
  return turbo
    ? { base: 110, step: 80 }
    : { base: 180, step: 115 };
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
