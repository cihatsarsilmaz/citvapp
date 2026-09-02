/** Görsel + düzen kiti. Ödeme tavanı house.js'te kalır. */
export const KITS = {
  sweet: { load: "pour", ms: 900, extra: "sprinkle", spin: "GO", cols: 5, rows: 3, jack: "orb", voice: "chime" },
  olympus: { load: "flash", ms: 860, extra: "bolt", spin: "GO", cols: 5, rows: 4, jack: "bolt", voice: "thunder" },
  nova: { load: "bloom", ms: 980, extra: "prism", spin: "GO", cols: 6, rows: 3, jack: "gem", voice: "glass" },
  reef: { load: "dive", ms: 920, extra: "tide", spin: "GO", cols: 5, rows: 3, jack: "pearl", voice: "low" },
  rich: { load: "unfurl", ms: 900, extra: "foil", spin: "GO", cols: 4, rows: 3, jack: "chest", voice: "coin" },
  west: { load: "dust", ms: 820, extra: "spur", spin: "GO", cols: 5, rows: 3, jack: "shoe", voice: "snap" },
  mystic: { load: "mist", ms: 1000, extra: "veil", spin: "GO", cols: 3, rows: 3, jack: "crystal", voice: "pad" },
  wolf: { load: "howl", ms: 940, extra: "moon", spin: "GO", cols: 5, rows: 3, jack: "moon", voice: "howl" },
  flame: { load: "ignite", ms: 800, extra: "ember", spin: "GO", cols: 5, rows: 4, jack: "urn", voice: "crackle" },
  forest: { load: "grow", ms: 980, extra: "moss", spin: "GO", cols: 4, rows: 4, jack: "acorn", voice: "wood" },
  pharaoh: { load: "rise", ms: 1020, extra: "gilt", spin: "GO", cols: 5, rows: 3, jack: "pyramid", voice: "bell" },
  pirate: { load: "tide", ms: 900, extra: "brine", spin: "GO", cols: 6, rows: 3, jack: "barrel", voice: "creak" },
  neon: { load: "scan", ms: 760, extra: "grid", spin: "GO", cols: 5, rows: 3, jack: "tube", voice: "blip" },
  samurai: { load: "draw", ms: 780, extra: "steel", spin: "GO", cols: 3, rows: 3, jack: "blade", voice: "steel" },
  ice: { load: "freeze", ms: 960, extra: "glass", spin: "GO", cols: 5, rows: 4, jack: "flake", voice: "ice" },
  dragon: { load: "roar", ms: 1040, extra: "scale", spin: "GO", cols: 5, rows: 3, jack: "egg", voice: "roar" },
  circus: { load: "curtain", ms: 840, extra: "ring", spin: "GO", cols: 4, rows: 3, jack: "ticket", voice: "toot" },
  vault: { load: "unlock", ms: 980, extra: "lock", spin: "GO", cols: 5, rows: 3, jack: "safe", voice: "clack" },
};

export function kitOf(game) {
  return KITS[game?.id] || { load: "bloom", ms: 900, extra: "foil", spin: "GO", cols: 5, rows: 3, jack: "orb", voice: "chime" };
}
