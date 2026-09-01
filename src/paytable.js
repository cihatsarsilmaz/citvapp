/** CITV Slot — önizleme matematiği. Hedef RTP ~96%, demo seed. */
export const PAY = {
  tripleTheme: 12,
  tripleStar: 8,
  tripleWild: 20,
  pairTheme: 2,
  pairAny: 1,
};

export const UNIT = 10;

export function settle(reels, game, ante) {
  const bet = UNIT * ante;
  const [a, b, c] = reels;
  let mult = 0;
  let label = "—";
  if (a === b && b === c) {
    if (a === game.emoji) { mult = PAY.tripleTheme; label = "3x tema"; }
    else if (a === "⭐") { mult = PAY.tripleStar; label = "3x yıldız"; }
    else if (a === "🎰") { mult = PAY.tripleWild; label = "3x joker"; }
    else { mult = 5; label = "3x sembol"; }
  } else if (a === b || b === c || a === c) {
    const pair = a === b ? a : b === c ? b : a;
    if (pair === game.emoji) { mult = PAY.pairTheme; label = "2x tema"; }
    else { mult = PAY.pairAny; label = "2x"; }
  }
  return { bet, win: bet * mult, mult, label };
}
