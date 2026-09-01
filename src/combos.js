import { UNIT, WILD, STAR } from "./paytable";

export const LOW = [
  { id: "candy", s: "🍬", name: "Şeker" },
  { id: "bolt", s: "⚡", name: "Şimşek" },
  { id: "gem", s: "💎", name: "Mücevher" },
  { id: "shark", s: "🦈", name: "Köpekbalığı" },
  { id: "bag", s: "💰", name: "Kese" },
];

export function payRows(theme) {
  return [
    { s: WILD, name: "Joker", three: 20, two: 0, note: "3 joker max. 2 joker tek başına ödemez; temayı tamamlar" },
    { s: theme, name: "Tema (bu oyun)", three: 12, two: 2, note: "Joker ile karışık 3'lü de x12" },
    { s: STAR, name: "Yıldız", three: 8, two: 1, note: "Joker yıldız yerine geçmez" },
    ...LOW.filter((x) => x.s !== theme).map((x) => ({
      s: x.s, name: x.name, three: 5, two: 1, note: "Düşük sembol",
    })),
  ];
}

export function payout(mult, ante = 1) {
  return UNIT * ante * mult;
}

export const RULES = [
  "Hat: 3 makara, sol → sağ. Sağ çift (makara 2-3) ödemez.",
  `Bahis = ${UNIT} × ante. Kazanç = bahis × çarpan.`,
  "Joker yalnız tema ile birleşir. Yıldız/düşük + joker üçlüsü tema değilse 0 (3 joker hariç).",
];
