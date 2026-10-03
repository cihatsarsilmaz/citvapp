/** Salon klasmanı. Genel slot katı: Tümü, Öne çıkan, Yeni, Bonus, Jackpot. */
export const BANDS = [
  { id: "tumu", label: "Tümü" },
  { id: "onecikan", label: "Öne çıkan" },
  { id: "yeni", label: "Yeni" },
  { id: "bonus", label: "Bonus" },
  { id: "jackpot", label: "Jackpot" },
];

export const FEATURED = ["sweet", "olympus", "west", "pharaoh", "vault"];
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
  if (band === "onecikan") return FEATURED.includes(game && game.id);
  return bandOf(game) === band;
}

export function featuredGames(games) {
  const list = Array.isArray(games) ? games : [];
  return FEATURED.map((id) => list.find((g) => g.id === id)).filter(Boolean);
}
