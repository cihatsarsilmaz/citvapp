import { WILD, STAR } from "./paytable";
import { LOW, COLS } from "./engine";

export const HOUSE_EDGE = 0.32;
export const WIN_CAP = 8;
export const COOLDOWN = 1;

function pick(list) {
  return list[Math.floor(Math.random() * list.length)];
}

function lows(theme) {
  return LOW.filter((s) => s !== theme);
}

function strip(theme, wilds, themes, stars) {
  const s = [];
  lows(theme).forEach((sym) => {
    s.push(sym, sym, sym);
  });
  for (let i = 0; i < themes; i++) s.push(theme);
  for (let i = 0; i < stars; i++) s.push(STAR);
  for (let i = 0; i < wilds; i++) s.push(WILD);
  return s;
}

export function stripsFor(theme) {
  return [
    strip(theme, 3, 3, 2),
    strip(theme, 2, 2, 2),
    strip(theme, 2, 2, 1),
    strip(theme, 1, 1, 1),
    strip(theme, 1, 1, 1),
  ];
}

function window3(reel, stop) {
  const n = reel.length;
  return [
    reel[(stop - 1 + n) % n],
    reel[stop % n],
    reel[(stop + 1) % n],
  ];
}

export function spinGrid(theme, forceMiss) {
  const strips = stripsFor(theme);
  const filler = lows(theme);
  const grid = [];
  for (let c = 0; c < COLS; c++) {
    const reel = strips[c];
    const col = window3(reel, Math.floor(Math.random() * reel.length));
    if (forceMiss && c > 0) {
      col[1] = pick(filler.filter((s) => s !== grid[0][1]));
    }
    grid.push(col);
  }
  return grid;
}

export function applyHouse(evaled, bet, session) {
  const capped = Math.min(evaled.total, bet * WIN_CAP);
  const paid = capped > 0 ? Math.floor(capped * (1 - HOUSE_EDGE)) : 0;
  return {
    win: paid,
    raw: evaled.total,
    hits: evaled.hits,
    label: evaled.label,
    session: {
      spins: session.spins + 1,
      wagered: session.wagered + bet,
      paid: session.paid + paid,
      vault: session.vault + bet - paid,
      cool: paid > 0 ? COOLDOWN : Math.max(0, session.cool - 1),
    },
  };
}

export const emptySession = () => ({ spins: 0, wagered: 0, paid: 0, vault: 0, cool: 0 });
