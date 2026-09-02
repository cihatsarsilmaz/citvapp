import { WILD, STAR } from "./paytable";
import { LOW, COLS } from "./engine";

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

export function stripsFor(theme) {
  return [
    strip(theme, 2, 2, 1),
    strip(theme, 1, 2, 1),
    strip(theme, 1, 1, 1),
    strip(theme, 1, 1, 1),
    strip(theme, 0, 1, 1),
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

export function readStyle(session, balance, ante, turbo) {
  const start = session.start || START_BANK;
  const ratio = start > 0 ? balance / start : 1;
  const rtp = session.wagered > 40 ? session.paid / session.wagered : 0.5;
  const dry = session.dry || 0;
  const hot = ratio > 1.25 || rtp > 0.68;
  const cold = ratio < 0.32 || dry >= 9;
  const grind = turbo || ante >= 7;
  return { ratio, rtp, dry, hot, cold, grind, start };
}

/** Kasa önde. Oyuncu yükselince sıkışır, düşünce kısa nefes alır. */
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
  } else if (style.dry >= 6) {
    edge = 0.28;
    cap = 2.8;
    forceMiss = false;
    cChance = 0.14;
  }

  if (style.grind && !style.cold) {
    edge += 0.06;
    cap = Math.min(cap, 2.8);
    cChance *= 0.5;
  }
  if (session.inBonus) {
    edge = Math.min(0.6, edge + 0.1);
    cap = Math.min(cap, 2.4);
    cChance = Math.min(cChance, 0.08);
  }
  if (style.rtp > 0.74 && session.spins > 8) forceMiss = true;

  return { edge, cap, forceMiss, drip, cChance };
}

export function spinGrid(theme, forceMiss) {
  const strips = stripsFor(theme);
  const filler = lows(theme);
  const grid = [];
  for (let c = 0; c < COLS; c++) {
    const reel = strips[c];
    const col = window3(reel, Math.floor(Math.random() * reel.length));
    if (forceMiss && c > 0) {
      const avoid = grid[0][1];
      col[1] = pick(filler.filter((s) => s !== avoid));
    }
    grid.push(col);
  }
  return grid;
}

function rollC(themeHit, cChance, hot) {
  if (!themeHit || hot && Math.random() < 0.7) return 1;
  const r = Math.random();
  if (r < cChance * 0.18) return 3;
  if (r < cChance) return 2;
  return 1;
}

export function applyHouse(evaled, bet, session, ctx = {}) {
  const style = readStyle(session, ctx.balance ?? START_BANK, ctx.ante ?? 1, ctx.turbo);
  const p = plan(style, session);
  const cMult = rollC(!!evaled.themeHit, p.cChance, style.hot);
  const raw = (evaled.total || 0) * cMult;
  let paid = raw > 0 ? Math.floor(Math.min(raw, bet * p.cap) * (1 - p.edge)) : 0;
  if (p.drip && paid === 0 && Math.random() < 0.72) paid = bet;
  if (p.forceMiss && !p.drip) paid = 0;

  const enterBonus = !session.inBonus && (session.bonusLock || 0) <= 0 && (evaled.stars || 0) >= 3;
  const bonusLeft = session.inBonus
    ? Math.max(0, (session.bonusLeft || 0) - 1)
    : enterBonus ? 6 : 0;
  const inBonus = bonusLeft > 0;
  const won = paid > 0;

  return {
    win: paid,
    raw,
    hits: evaled.hits || [],
    cMult: paid > 0 ? cMult : 1,
    bonus: enterBonus,
    inBonus,
    session: {
      start: session.start || START_BANK,
      spins: (session.spins || 0) + 1,
      wagered: (session.wagered || 0) + (session.inBonus ? 0 : bet),
      paid: (session.paid || 0) + paid,
      vault: (session.vault || 0) + (session.inBonus ? 0 : bet) - paid,
      cool: won ? (style.hot ? 2 : 1) : Math.max(0, (session.cool || 0) - 1),
      dry: won ? 0 : (session.dry || 0) + 1,
      bonusLeft,
      inBonus,
      bonusLock: enterBonus ? 0 : inBonus ? 0 : Math.max(0, (session.bonusLock || 0) - 1) + (session.inBonus && !inBonus ? 8 : 0),
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
});
