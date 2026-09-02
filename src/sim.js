import { spinGrid, applyHouse, emptySession } from "./house.js";
import { evalLines } from "./engine.js";

const THEME = "💰";

export function simulate({ n = 100000, bet = 10, theme = THEME } = {}) {
  let session = emptySession();
  let hits = 0;
  let maxPay = 0;
  let rawSum = 0;
  const t0 = Date.now();
  for (let i = 0; i < n; i++) {
    const grid = spinGrid(theme, session.cool > 0);
    const ev = evalLines(grid, theme, bet);
    const out = applyHouse(ev, bet, session);
    session = out.session;
    rawSum += ev.total;
    if (out.win > 0) hits++;
    if (out.win > maxPay) maxPay = out.win;
  }
  const rtp = session.wagered ? session.paid / session.wagered : 0;
  const raw = session.wagered ? rawSum / session.wagered : 0;
  return {
    n,
    bet,
    ms: Date.now() - t0,
    wagered: session.wagered,
    paid: session.paid,
    vault: session.vault,
    hits,
    hitPct: hits / n,
    maxPay,
    rtp,
    rawRtp: raw,
    rtpPct: +(rtp * 100).toFixed(2),
    rawPct: +(raw * 100).toFixed(2),
    hitPctShow: +((hits / n) * 100).toFixed(2),
  };
}

function print(r) {
  console.log("CITV Slot Monte Carlo");
  console.log("spin", r.n, "bahis", r.bet, r.ms + "ms");
  console.log("yatırılan", r.wagered, "ödenen", r.paid, "kasa", r.vault);
  console.log("RTP kasa sonrası", r.rtpPct + "%", "ham tablo", r.rawPct + "%");
  console.log("isabet", r.hits, r.hitPctShow + "%", "max ödeme", r.maxPay);
}

const isMain = process.argv[1] && process.argv[1].includes("sim.js");
const nArg = Number(process.argv[2]);
if (isMain) print(simulate({ n: Number.isFinite(nArg) && nArg > 0 ? nArg : 100000 }));
