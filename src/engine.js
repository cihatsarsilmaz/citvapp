import { WILD, STAR, PAY3, PAY4, PAY5 } from "./paytable";

export const COLS = 5;
export const ROWS = 3;
export const LOW = ["🍬", "⚡", "💎", "🦈", "💰"];

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

export function lineMaps(cols, rows) {
  const mid = Math.min(rows - 1, Math.floor(rows / 2));
  const lines = [Array(cols).fill(mid)];
  if (rows >= 2) lines.push(Array(cols).fill(0));
  if (rows >= 3) lines.push(Array(cols).fill(rows - 1));
  if (rows >= 3 && cols >= 3) {
    lines.push(Array.from({ length: cols }, (_, i) => {
      const t = i / Math.max(1, cols - 1);
      return Math.round(t * (rows - 1));
    }));
    lines.push(Array.from({ length: cols }, (_, i) => {
      const t = i / Math.max(1, cols - 1);
      return Math.round((1 - t) * (rows - 1));
    }));
  }
  return lines;
}

export function countSym(grid, sym) {
  let n = 0;
  for (let c = 0; c < grid.length; c++) {
    for (let r = 0; r < grid[c].length; r++) if (grid[c][r] === sym) n++;
  }
  return n;
}

export function evalLines(grid, theme, bet, layout = { cols: 5, rows: 3 }) {
  const cols = grid.length;
  const rows = grid[0] ? grid[0].length : layout.rows || 3;
  const maps = lineMaps(cols, rows);
  const need = cols <= 3 ? cols : 3;
  const hits = [];
  let total = 0;
  let themeHit = false;
  maps.forEach((rowPick, li) => {
    const seq = rowPick.map((r, c) => grid[c][Math.min(r, rows - 1)]);
    let n = 1;
    for (let i = 1; i < cols; i++) {
      if (match(seq[0], seq[i], theme) && match(seq[i - 1], seq[i], theme)) n++;
      else break;
    }
    if (n < need) return;
    const core = seq.find((s) => s !== WILD) || WILD;
    const table = n >= 5 ? PAY5 : n === 4 ? PAY4 : PAY3;
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
      cells: rowPick.map((r, c) => (c < n ? `${c}:${r}` : null)).filter(Boolean),
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
