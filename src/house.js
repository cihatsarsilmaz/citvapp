import { WILD, STAR } from "./paytable";
import { LOW, COLS } from "./engine";

export const HOUSE_EDGE = 0.32;
export const WIN_CAP = 8;
export const COOLDOWN = 1;

function pick(list) {
  return list[Math.floor(Math.random() * list.length)];
}

export function spinGrid(theme, forceMiss) {
  const pool = [...LOW, ...LOW, theme, STAR, WILD];
  const grid = [];
  for (let c = 0; c < COLS; c++) {
    const col = [pick(pool), pick(pool), pick(pool)];
    if (forceMiss && c > 0) {
      col[1] = pick(LOW.filter((s) => s !== grid[0][1]));
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
    label: paid ? `${evaled.label} · kasa kesti` : evaled.label,
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
