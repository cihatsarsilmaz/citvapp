/** 3 makara, tek hat: sol → sağ. Joker 🎰 tema yerine geçer. */
export const UNIT = 10;
export const WILD = "🎰";
export const STAR = "⭐";

export const PAY = {
  theme3: 12,
  wild3: 20,
  star3: 8,
  other3: 5,
  theme2: 2,
  any2: 1,
};

function same(a, b, theme) {
  if (a === b) return true;
  if (a === WILD && b === theme) return true;
  if (b === WILD && a === theme) return true;
  return false;
}

export function settle(reels, game, ante) {
  const bet = UNIT * ante;
  const theme = game.emoji;
  const [a, b, c] = reels;
  const three =
    same(a, b, theme) && same(b, c, theme) && same(a, c, theme);
  const leftPair = same(a, b, theme);

  let mult = 0;
  let label = "eşleşme yok";
  let hit = [];

  if (three) {
    hit = [0, 1, 2];
    const core = [a, b, c].find((s) => s !== WILD) || WILD;
    if (a === WILD && b === WILD && c === WILD) {
      mult = PAY.wild3; label = "3 joker";
    } else if (core === theme || [a, b, c].every((s) => s === theme || s === WILD)) {
      mult = PAY.theme3; label = "3 tema";
    } else if (core === STAR) {
      mult = PAY.star3; label = "3 yıldız";
    } else {
      mult = PAY.other3; label = "3 aynı";
    }
  } else if (leftPair) {
    hit = [0, 1];
    const core = a === WILD ? b : a;
    if (core === theme || a === WILD || b === WILD) {
      mult = PAY.theme2; label = "2 tema (sol hat)";
    } else {
      mult = PAY.any2; label = "2'li (sol hat)";
    }
  }

  return { bet, win: bet * mult, mult, label, hit };
}
