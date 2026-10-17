import { WILD, STAR } from "./paytable";
import { LOW } from "./engine";
import { nextBond } from "./bond";
import { dayPlan, clipDay } from "./ledger";

export const START_BANK = 12500;

function pick(list) {
  return list[Math.floor(Math.random() * list.length)];
}

function lows(theme) {
  return LOW.filter((s) => s !== theme);
}

function strip(theme, wilds, themes, stars) {
  const s = [];
  lows(theme).forEach((sym) => {
    s.push(sym, sym);
  });
  for (let i = 0; i < themes; i++) s.push(theme);
  for (let i = 0; i < stars; i++) s.push(STAR);
  for (let i = 0; i < wilds; i++) s.push(WILD);
  return s;
}

export function stripsFor(theme, cols = 5) {
  const base = [
    strip(theme, 2, 4, 2),
    strip(theme, 2, 3, 2),
    strip(theme, 1, 3, 2),
    strip(theme, 1, 3, 2),
    strip(theme, 1, 2, 1),
    strip(theme, 1, 2, 1),
  ];
  return base.slice(0, cols);
}

function windowN(reel, stop, rows) {
  const n = reel.length;
  const out = [];
  const mid = Math.floor((rows - 1) / 2);
  for (let r = 0; r < rows; r++) {
    out.push(reel[(stop + (r - mid) + n * 8) % n]);
  }
  return out;
}

export function readStyle(session, balance, ante, turbo) {
  const start = session.start || START_BANK;
  const ratio = start > 0 ? balance / start : 1;
  const rtp = session.wagered > 40 ? session.paid / session.wagered : 0.85;
  const dry = session.dry || 0;
  const hot = ratio > 2.2 || rtp > 1.15;
  const cold = ratio < 0.4 || dry >= 8;
  const grind = turbo || ante >= 8;
  return { ratio, rtp, dry, hot, cold, grind, start };
}

export function plan(style, session, kit) {
  let edge = 0.08;
  let cap = 12;
  let forceMiss = false;
  let drip = false;
  let roar = 0.34;

  if (style.hot) {
    edge = 0.14;
    cap = 8;
    roar = 0.22;
  } else if (style.cold) {
    edge = 0.03;
    cap = 14;
    forceMiss = false;
    drip = true;
    roar = 0.42;
  } else if (style.dry >= 5) {
    edge = 0.04;
    cap = 12;
    drip = true;
    roar = 0.38;
  }

  if (style.grind && !style.cold) {
    edge += 0.01;
    cap = Math.min(cap, 10);
  }
  if (session.inBonus) {
    edge = Math.max(0.02, edge - 0.03);
    cap = Math.max(cap, 14);
    roar = Math.max(roar, 0.4);
  }

  const vol = kit?.vol || "mid";
  if (vol === "high") {
    cap = Math.min(16, cap + 1.5);
    roar = Math.min(0.48, roar + 0.06);
  } else if (vol === "low") {
    cap = Math.max(8, cap - 0.5);
    roar *= 0.9;
  }

  return { edge, cap, forceMiss, drip, roar };
}

export function spinGrid(theme, forceMiss, layout = { cols: 5, rows: 3 }) {
  const cols = layout.cols || 5;
  const rows = layout.rows || 3;
  const strips = stripsFor(theme, cols);
  const filler = lows(theme);
  const grid = [];
  for (let c = 0; c < cols; c++) {
    const reel = strips[c];
    const col = windowN(reel, Math.floor(Math.random() * reel.length), rows);
    if (forceMiss && c > 0) {
      const avoid = grid[0][Math.floor(rows / 2)];
      const mid = Math.floor(rows / 2);
      col[mid] = pick(filler.filter((s) => s !== avoid));
    }
    grid.push(col);
  }
  return grid;
}

function rollRoar(themeHit, chance, hot) {
  if (!themeHit) return 1;
  const r = Math.random();
  if (r < chance * 0.12) return 5;
  if (r < chance * 0.36) return 3;
  if (r < chance) return 2;
  return 1;
}

export function applyHouse(evaled, bet, session, ctx = {}) {
  const style = readStyle(session, ctx.balance ?? START_BANK, ctx.ante ?? 1, ctx.turbo);
  const p = plan(style, session, ctx.kit);
  const day = ctx.ledger ? dayPlan(ctx.ledger, ctx.ante ?? 1) : null;
  if (day) {
    p.edge = (p.edge + day.edge) / 2;
    p.cap = Math.max(p.cap, day.cap);
    if (day.drip) p.drip = true;
  }
  const raw = evaled.total || 0;
  let paid = raw > 0 ? Math.floor(Math.min(raw, bet * p.cap) * (1 - p.edge)) : 0;
  if (p.drip && paid === 0 && Math.random() < 0.72) paid = bet;
  if (p.forceMiss && !p.drip && !session.inBonus) paid = 0;

  const tick = nextBond(session.bond, evaled.themes);
  if (tick.collect && paid === 0 && Math.random() < 0.75) paid = bet;

  let gift = false;
  if (day && day.gift && paid === 0) {
    paid = Math.random() < 0.45 ? bet * 2 : bet;
    gift = true;
  }

  let rare = false;
  if (day && day.rare && Math.random() < day.rare) {
    paid = Math.floor(bet * (10 + Math.random() * 8));
    rare = true;
  }

  let jack = 0;
  const vault = session.vault || 0;
  if (style.cold && vault > bet * 6 && Math.random() < 0.2 && !rare) {
    jack = Math.min(bet * 5, Math.floor(vault * 0.1));
    paid += jack;
  }

  const wager = session.inBonus ? 0 : bet;
  if (ctx.ledger) paid = clipDay(ctx.ledger, wager, paid);

  let roar = 1;
  if (paid > 0 && !rare) {
    roar = rollRoar(!!evaled.themeHit, p.roar, style.hot);
    if (roar > 1) {
      paid = paid * roar;
      if (ctx.ledger) paid = clipDay(ctx.ledger, wager, paid);
    }
  }
  if (rare) roar = Math.max(8, Math.round(paid / Math.max(1, bet)));

  const extra = session.inBonus && (evaled.stars || 0) >= 2 ? 1 : 0;
  const enterBonus = !session.inBonus && (session.bonusLock || 0) <= 0 && (evaled.stars || 0) >= 2;
  let bonusLeft = session.inBonus
    ? Math.max(0, (session.bonusLeft || 0) - 1 + extra)
    : enterBonus ? 10 : 0;
  if (bonusLeft > 14) bonusLeft = 14;
  const inBonus = bonusLeft > 0;
  const won = paid > 0;
  const cMult = roar >= 2 ? roar : 1;

  return {
    win: paid,
    raw,
    hits: evaled.hits || [],
    cMult,
    roar: cMult,
    bonus: enterBonus,
    extra,
    jack,
    collect: tick.collect,
    gift,
    rare,
    inBonus,
    session: {
      start: session.start || START_BANK,
      spins: (session.spins || 0) + 1,
      wagered: (session.wagered || 0) + wager,
      paid: (session.paid || 0) + paid,
      vault: Math.max(0, vault + wager - paid),
      cool: won ? 0 : Math.max(0, (session.cool || 0) - 1),
      dry: won ? 0 : (session.dry || 0) + 1,
      bonusLeft,
      inBonus,
      bonusLock: enterBonus ? 0 : inBonus ? 0 : Math.max(0, (session.bonusLock || 0) - 1) + (session.inBonus && !inBonus ? 3 : 0),
      bond: tick.bond,
    },
  };
}

export const emptySession = () => ({
  start: START_BANK,
  spins: 0,
  wagered: 0,
  paid: 0,
  vault: 0,
  cool: 0,
  dry: 0,
  bonusLeft: 0,
  inBonus: false,
  bonusLock: 0,
  bond: 0,
});
