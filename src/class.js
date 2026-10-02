/** Salon klasmanı. Tümü her masayı açar; diğer bantlar tek kapıdan süzülür. */
export const BANDS = [
  { id: "tumu", label: "Tümü" },
  { id: "yeni", label: "Yeni" },
  { id: "bonus", label: "Bonus" },
  { id: "jackpot", label: "Jackpot" },
];

const YENI = new Set(["sweet", "olympus"]);
const JACK = new Set(["vault", "rich", "pharaoh", "dragon"]);

export function bandOf(game) {
  const id = game && game.id;
  if (YENI.has(id)) return "yeni";
  if (JACK.has(id)) return "jackpot";
  return "bonus";
}

export function inBand(game, band) {
  if (!band || band === "tumu") return true;
  return bandOf(game) === band;
}
