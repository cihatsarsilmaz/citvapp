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
    { s: WILD, name: "Joker", three: 20, two: 0 },
    { s: theme, name: "Tema", three: 12, two: 2 },
    { s: STAR, name: "Yıldız", three: 8, two: 1 },
    ...LOW.filter((x) => x.s !== theme).map((x) => ({
      s: x.s, name: x.name, three: 5, two: 1,
    })),
  ];
}

export function payout(mult, ante = 1) {
  return UNIT * ante * mult;
}

export const RULES = [
  "Tablo vitrindir. Ödenen: min(kazanç, 3×bahis) sonra %32 kasa kesintisi.",
  "Makara ağırlıklı: eşleşme kırılır. Kazançtan sonra 3 spin soğuma (zorunlu miss).",
  "Oturum RTP kasaya akar. Sağ çift ödemez. Joker yalnız temayı tamamlar.",
];
