import { WILD, STAR, PAY2, PAY3, PAY4, PAY5 } from "./paytable";

export const COLS = 5;
export const ROWS = 3;
export const LINES = 5;

export const LOW = ["🍬", "⚡", "💎", "🦈", "💰"];

export const LINE_MAP = [
  [1, 1, 1, 1, 1],
  [0, 0, 0, 0, 0],
  [2, 2, 2, 2, 2],
  [0, 1, 2, 1, 0],
  [2, 1, 0, 1, 2],
];

function kind(sym, theme) {
  if (sym === WILD) return "wild";
  if (sym === theme) return "theme";
  if (sym === STAR) return "star";
  return "low";
}

function match(a, b, theme) {
  if (a === b) return true;
  if (a === WILD && (b === theme || b === WILD)) return true;
  if (b === WILD && (a === theme || a === WILD)) return true;
  return false;
}

export function countSym(grid, sym) {
  let n = 0;
  for (let c = 0; c < grid.length; c++) {
    for (let r = 0; r < grid[c].length; r++) if (grid[c][r] === sym) n++;
  }
  return n;
}

export function evalLines(grid, theme, bet) {
  const hits = [];
  let total = 0;
  let themeHit = false;
  LINE_MAP.forEach((rows, li) => {
    const seq = rows.map((r, c) => grid[c][r]);
    let n = 1;
    for (let i = 1; i < 5; i++) {
      if (match(seq[0], seq[i], theme) && match(seq[i - 1], seq[i], theme)) n++;
      else break;
    }
    if (n < 3) return;
    const core = seq.find((s) => s !== WILD) || WILD;
    const table = n === 5 ? PAY5 : n === 4 ? PAY4 : PAY3;
    const k = kind(core, theme);
    const mult = table[k] || 0;
    if (!mult) return;
    if (k === "theme") themeHit = true;
    const win = bet * mult;
    total += win;
    hits.push({
      line: li,
      n,
      kind: k,
      mult,
      win,
      cells: rows.map((r, c) => (c < n ? `${c}:${r}` : null)).filter(Boolean),
    });
  });
  return {
    total,
    hits,
    themeHit,
    stars: countSym(grid, STAR),
    themes: countSym(grid, theme),
  };
}
