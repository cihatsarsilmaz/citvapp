import { WILD, STAR } from "./paytable";

const LOW = ["🍬", "⚡", "💎", "🦈", "💰"];

/** theme = açık oyunun emojisi */
export function comboCatalog(theme) {
  return [
    { id: "w3", pat: `${WILD}${WILD}${WILD}`, name: "Üç joker", rule: "3 joker", mult: 20 },
    { id: "t3", pat: `${theme}${theme}${theme}`, name: "Üç tema", rule: "3 tema", mult: 12 },
    { id: "tw", pat: `${theme}${WILD}${theme}`, name: "Tema + joker", rule: "joker temayı tamamlar", mult: 12 },
    { id: "wt", pat: `${WILD}${theme}${theme}`, name: "Joker solda tema", rule: "joker = tema", mult: 12 },
    { id: "tw2", pat: `${theme}${theme}${WILD}`, name: "Joker sağda tema", rule: "joker = tema", mult: 12 },
    { id: "s3", pat: `${STAR}${STAR}${STAR}`, name: "Üç yıldız", rule: "3 yıldız", mult: 8 },
    { id: "l3", pat: "AAA", name: "Üç düşük", rule: `${LOW.join(" ")} üçlüsü`, mult: 5 },
    { id: "t2", pat: `${theme}${theme}—`, name: "İki tema soldan", rule: "sol hat, 3. serbest", mult: 2 },
    { id: "t2w", pat: `${theme}${WILD}—`, name: "Tema+joker soldan", rule: "sol hat", mult: 2 },
    { id: "l2", pat: "AA—", name: "İki düşük soldan", rule: "sol hat", mult: 1 },
    { id: "miss", pat: "A B C", name: "Hat yok", rule: "sağ çift veya dağınık sayılmaz", mult: 0 },
  ];
}

export const NOTES = [
  "Tek hat: makara 1-2-3, sol → sağ.",
  "Joker yalnız temayı tamamlar; yıldız veya düşük yerine geçmez (3 joker hariç).",
  "Sağdaki 2'li (makara 2-3) ödeme vermez.",
  "Bahis = 10 × ante. Kazanç = bahis × çarpan.",
];
