import { WILD, STAR } from "./paytable";
import { LOW } from "./engine";
import { nextBond } from "./bond";
import { dayPlan, clipDay } from "./ledger";

export const START_BANK = 2500;

function pick(list) {
  return list[Math.floor(Math.random() * list.length)];
}

function lows(theme) {
  return LOW.filter((s) => s !== theme);
}

function strip(theme, wilds, themes, stars) {
  const s = [];
  lows(theme).forEach((sym) => {
    s.push(sym, sym, sym, sym);
  });
  for (let i = 0; i < themes; i++) s.push(theme);
  for (let i = 0; i < stars; i++) s.push(STAR);
  for (let i = 0; i < wilds; i++) s.push(WILD);
  return s;
}

export function stripsFor(theme, cols = 5) {
  const base = [
    strip(theme, 2, 2, 1),
    strip(theme, 1, 2, 1),
    strip(theme, 1, 1, 1),
    strip(theme, 1, 1, 1),
    strip(theme, 0, 1, 1),
    strip(theme, 0, 1, 0),
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
  const rtp = session.wagered > 40 ? session.paid / session.wagered : 0.5;
  const dry = session.dry || 0;
  const hot = ratio > 1.25 || rtp > 0.68;
  const cold = ratio < 0.32 || dry >= 8;
  const grind = turbo || ante >= 7;
  return { ratio, rtp, dry, hot, cold, grind, start };
}

export function plan(style, session) {
  let edge = 0.44;
  let cap = 3.2;
  let forceMiss = (session.cool || 0) > 0;
  let drip = false;
  let cChance = 0.1;

  if (style.hot) {
    edge = 0.56;
    cap = 2.6;
    forceMiss = forceMiss || Math.random() < 0.62;
    cChance = 0.03;
  } else if (style.cold) {
    edge = 0.16;
    cap = 2.2;
    forceMiss = false;
    drip = true;
    cChance = 0.18;
  } else if (style.dry >= 5) {
    edge = 0.26;
    cap = 2.8;
    forceMiss = false;
    drip = style.dry >= 7;
    cChance = 0.14;
  }

  if (style.grind && !style.cold) {
    edge += 0.06;
    cap = Math.min(cap, 2.8);
    cChance *= 0.5;
  }
  if (session.inBonus) {
    edge = Math.min(0.58, edge + 0.08);
    cap = Math.min(cap, 2.5);
    cChance = Math.min(cChance, 0.1);
  }
  if (style.rtp > 0.74 && session.spins > 8) forceMiss = true;

  return { edge, cap, forceMiss, drip, cChance };
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

function rollC(themeHit, cChance, hot) {
  if (!themeHit || (hot && Math.random() < 0.7)) return 1;
  const r = Math.random();
  if (r < cChance * 0.18) return 3;
  if (r < cChance) return 2;
  return 1;
}

export function applyHouse(evaled, bet, session, ctx = {}) {
  const style = readStyle(session, ctx.balance ?? START_BANK, ctx.ante ?? 1, ctx.turbo);
  const p = plan(style, session);
  const day = ctx.ledger ? dayPlan(ctx.ledger, ctx.ante ?? 1) : null;
  if (day) {
    p.edge = (p.edge + day.edge) / 2;
    p.cap = Math.min(p.cap, day.cap);
    if (day.drip) p.drip = true;
    if (day.ratio > 0.48) p.forceMiss = true;
  }
  const cMult = rollC(!!evaled.themeHit, p.cChance, style.hot);
  const raw = (evaled.total || 0) * cMult;
  let paid = raw > 0 ? Math.floor(Math.min(raw, bet * p.cap) * (1 - p.edge)) : 0;
  if (p.drip && paid === 0 && Math.random() < 0.78) paid = bet;
  if (p.forceMiss && !p.drip) paid = 0;

  const tick = nextBond(session.bond, evaled.themes);
  if (tick.collect && paid === 0 && !style.hot && Math.random() < 0.5) paid = bet;

  let gift = false;
  if (day && day.gift && paid === 0) {
    paid = Math.random() < 0.35 ? bet * 2 : bet;
    gift = true;
  }

  let rare = false;
  if (day && day.rare && Math.random() < day.rare && day.ratio < 0.3) {
    paid = Math.floor(bet * (8 + Math.random() * 4));
    rare = true;
  }

  let jack = 0;
  const vault = session.vault || 0;
  if (style.cold && vault > bet * 12 && Math.random() < 0.12 && !rare) {
    jack = Math.min(bet * 2, Math.floor(vault * 0.04));
    paid += jack;
  }

  const wager = session.inBonus ? 0 : bet;
  if (ctx.ledger) paid = clipDay(ctx.ledger, wager, paid);

  const extra = session.inBonus && (evaled.stars || 0) >= 2 ? 1 : 0;
  const enterBonus = !session.inBonus && (session.bonusLock || 0) <= 0 && (evaled.stars || 0) >= 3;
  let bonusLeft = session.inBonus
    ? Math.max(0, (session.bonusLeft || 0) - 1 + extra)
    : enterBonus ? 6 : 0;
  if (bonusLeft > 12) bonusLeft = 12;
  const inBonus = bonusLeft > 0;
  const won = paid > 0;

  return {
    win: paid,
    raw,
    hits: evaled.hits || [],
    cMult: paid > 0 ? (rare ? Math.max(8, Math.round(paid / bet)) : cMult) : 1,
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
      vault: vault + wager - paid,
      cool: won ? (style.hot ? 2 : 1) : Math.max(0, (session.cool || 0) - 1),
      dry: won ? 0 : (session.dry || 0) + 1,
      bonusLeft,
      inBonus,
      bonusLock: enterBonus ? 0 : inBonus ? 0 : Math.max(0, (session.bonusLock || 0) - 1) + (session.inBonus && !inBonus ? 8 : 0),
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
