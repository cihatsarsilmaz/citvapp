import { spinGrid, emptySession, HOUSE_EDGE, WIN_CAP, COOLDOWN } from "./house.js";
import { evalLines } from "./engine.js";

function apply(evaled, bet, session, { rake, cap, cool }) {
  const capN = cap ? bet * WIN_CAP : Infinity;
  const capped = Math.min(evaled.total, capN);
  const paid = capped > 0 ? (rake ? Math.floor(capped * (1 - HOUSE_EDGE)) : capped) : 0;
  return {
    win: paid,
    session: {
      spins: session.spins + 1,
      wagered: session.wagered + bet,
      paid: session.paid + paid,
      vault: session.vault + bet - paid,
      cool: cool && paid > 0 ? COOLDOWN : cool ? Math.max(0, session.cool - 1) : 0,
    },
  };
}

export function run(label, opts, n = 100000, bet = 10, theme = "💰") {
  let session = emptySession();
  let hits = 0;
  let maxPay = 0;
  for (let i = 0; i < n; i++) {
    const ev = evalLines(spinGrid(theme, opts.cool && session.cool > 0), theme, bet);
    const out = apply(ev, bet, session, opts);
    session = out.session;
    if (out.win > 0) hits++;
    if (out.win > maxPay) maxPay = out.win;
  }
  return {
    label,
    rtp: +((session.paid / session.wagered) * 100).toFixed(2),
    hit: +((hits / n) * 100).toFixed(2),
    maxPay,
    vault: session.vault,
  };
}

const n = Number(process.argv[2]) || 100000;
if (process.argv[1] && process.argv[1].includes("sim-compare")) {
  console.log(JSON.stringify({
    n,
    rows: [
      run("canlı", { rake: true, cap: true, cool: true }, n),
      run("kesim+tavan", { rake: true, cap: true, cool: false }, n),
      run("sadece kesim", { rake: true, cap: false, cool: false }, n),
      run("ham", { rake: false, cap: false, cool: false }, n),
    ],
  }, null, 2));
}
