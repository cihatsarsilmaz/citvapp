import { WILD, STAR } from "./paytable";

export const HOUSE_EDGE = 0.32;
export const WIN_CAP = 3;
export const COOLDOWN = 3;

const LOW = ["🍬", "⚡", "💎", "🦈", "💰"];

function pick(list) {
  return list[Math.floor(Math.random() * list.length)];
}

function weightedPool(theme) {
  return [
    ...Array(8).fill(pick(LOW.filter((s) => s !== theme))),
    ...Array(6).fill(pick(LOW)),
    ...Array(3).fill(theme),
    ...Array(2).fill(STAR),
    WILD,
  ];
}

export function spinReels(theme, forceMiss) {
  const pool = weightedPool(theme);
  const a = pick(pool);
  let b = pick(pool);
  let c = pick(pool);
  if (forceMiss || Math.random() < 0.82) {
    const others = LOW.filter((s) => s !== a).concat(STAR);
    b = pick(others);
  }
  if (forceMiss || Math.random() < 0.88) {
    const others = LOW.filter((s) => s !== b && s !== a);
    c = pick(others.length ? others : LOW);
  }
  return [a, b, c];
}

export function applyHouse(result, session) {
  const { bet, win } = result;
  const capped = Math.min(win, bet * WIN_CAP);
  const paid = capped > 0 ? Math.floor(capped * (1 - HOUSE_EDGE)) : 0;
  const houseTake = bet - paid + (capped - paid);
  return {
    ...result,
    win: paid,
    raw: win,
    capped,
    houseTake,
    label: paid ? `${result.label} · kasa kesti` : result.label,
    session: {
      spins: session.spins + 1,
      wagered: session.wagered + bet,
      paid: session.paid + paid,
      vault: session.vault + bet - paid,
      cool: paid > 0 ? COOLDOWN : Math.max(0, session.cool - 1),
    },
  };
}

export const emptySession = () => ({
  spins: 0,
  wagered: 0,
  paid: 0,
  vault: 0,
  cool: 0,
});
