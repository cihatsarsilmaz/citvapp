/** Oyun başına görsel ürün kiti. Ödeme tablosuna dokunmaz. */
export const KITS = {
  sweet: { load: "pour", ms: 1080, extra: "sprinkle", spin: "GO" },
  olympus: { load: "flash", ms: 1020, extra: "bolt", spin: "GO" },
  nova: { load: "bloom", ms: 1180, extra: "prism", spin: "GO" },
  reef: { load: "dive", ms: 1140, extra: "tide", spin: "GO" },
  rich: { load: "unfurl", ms: 1100, extra: "foil", spin: "GO" },
  west: { load: "dust", ms: 980, extra: "spur", spin: "GO" },
  mystic: { load: "mist", ms: 1220, extra: "veil", spin: "GO" },
  wolf: { load: "howl", ms: 1120, extra: "moon", spin: "GO" },
  flame: { load: "ignite", ms: 960, extra: "ember", spin: "GO" },
  forest: { load: "grow", ms: 1200, extra: "moss", spin: "GO" },
  pharaoh: { load: "rise", ms: 1240, extra: "gilt", spin: "GO" },
  pirate: { load: "tide", ms: 1080, extra: "brine", spin: "GO" },
  neon: { load: "scan", ms: 900, extra: "grid", spin: "GO" },
  samurai: { load: "draw", ms: 940, extra: "steel", spin: "GO" },
  ice: { load: "freeze", ms: 1160, extra: "glass", spin: "GO" },
  dragon: { load: "roar", ms: 1260, extra: "scale", spin: "GO" },
  circus: { load: "curtain", ms: 1000, extra: "ring", spin: "GO" },
  vault: { load: "unlock", ms: 1180, extra: "lock", spin: "GO" },
};

export function kitOf(game) {
  return KITS[game?.id] || { load: "bloom", ms: 1100, extra: "foil", spin: "GO" };
}
