import { STAR } from "./paytable";

export function lockAt(c, nCols, base, step, turbo) {
  const hold = c === nCols - 1 ? (turbo ? 90 : 280) : 0;
  return base + c * step + hold;
}

export function spinTempo(turbo, kit) {
  const base0 = Number(kit?.base) > 0 ? kit.base : 180;
  const step0 = Number(kit?.step) > 0 ? kit.step : 115;
  return turbo
    ? { base: Math.max(90, Math.round(base0 * 0.62)), step: Math.max(55, Math.round(step0 * 0.68)) }
    : { base: base0, step: step0 };
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
