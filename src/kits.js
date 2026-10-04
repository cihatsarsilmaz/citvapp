/** Görsel + düzen kiti. Ödeme tavanı house.js'te kalır; vol sadece his/tempo. */
export const KITS = {
  sweet:    { load: "pour",    ms: 900,  extra: "sprinkle", spin: "YAĞ", cols: 5, rows: 3, jack: "orb",      voice: "chime",   vol: "mid",  anteMax: 8,  base: 170, step: 110 },
  olympus:  { load: "flash",   ms: 860,  extra: "bolt",     spin: "ÇAK", cols: 5, rows: 4, jack: "bolt",     voice: "thunder", vol: "high", anteMax: 10, base: 150, step: 95  },
  nova:     { load: "bloom",   ms: 980,  extra: "prism",    spin: "IŞI", cols: 6, rows: 3, jack: "gem",      voice: "glass",   vol: "high", anteMax: 8,  base: 200, step: 90  },
  reef:     { load: "dive",    ms: 920,  extra: "tide",     spin: "DAL", cols: 5, rows: 3, jack: "pearl",    voice: "low",     vol: "low",  anteMax: 6,  base: 210, step: 125 },
  rich:     { load: "unfurl",  ms: 900,  extra: "foil",     spin: "KAZ", cols: 4, rows: 3, jack: "chest",    voice: "coin",    vol: "mid",  anteMax: 10, base: 180, step: 120 },
  west:     { load: "dust",    ms: 820,  extra: "spur",     spin: "ÇEK", cols: 5, rows: 3, jack: "shoe",     voice: "snap",    vol: "mid",  anteMax: 8,  base: 140, step: 100 },
  mystic:   { load: "mist",    ms: 1000, extra: "veil",     spin: "PER", cols: 3, rows: 3, jack: "crystal",  voice: "pad",     vol: "high", anteMax: 5,  base: 240, step: 140 },
  wolf:     { load: "howl",    ms: 940,  extra: "moon",     spin: "ULU", cols: 5, rows: 3, jack: "moon",     voice: "howl",    vol: "mid",  anteMax: 8,  base: 190, step: 115 },
  flame:    { load: "ignite",  ms: 800,  extra: "ember",    spin: "YAK", cols: 5, rows: 4, jack: "urn",      voice: "crackle", vol: "high", anteMax: 9,  base: 130, step: 85  },
  forest:   { load: "grow",    ms: 980,  extra: "moss",     spin: "KÖK", cols: 4, rows: 4, jack: "acorn",    voice: "wood",    vol: "low",  anteMax: 6,  base: 220, step: 130 },
  pharaoh:  { load: "rise",    ms: 1020, extra: "gilt",     spin: "RA",  cols: 5, rows: 3, jack: "pyramid",  voice: "bell",    vol: "mid",  anteMax: 10, base: 200, step: 120 },
  pirate:   { load: "tide",    ms: 900,  extra: "brine",    spin: "YEL", cols: 6, rows: 3, jack: "barrel",   voice: "creak",   vol: "high", anteMax: 8,  base: 160, step: 100 },
  neon:     { load: "scan",    ms: 760,  extra: "grid",     spin: "YAN", cols: 5, rows: 3, jack: "tube",     voice: "blip",    vol: "mid",  anteMax: 7,  base: 120, step: 75  },
  samurai:  { load: "draw",    ms: 780,  extra: "steel",    spin: "KES", cols: 3, rows: 3, jack: "blade",    voice: "steel",   vol: "high", anteMax: 5,  base: 110, step: 70  },
  ice:      { load: "freeze",  ms: 960,  extra: "glass",    spin: "DON", cols: 5, rows: 4, jack: "flake",    voice: "ice",     vol: "low",  anteMax: 7,  base: 230, step: 135 },
  dragon:   { load: "roar",    ms: 1040, extra: "scale",    spin: "KÜK", cols: 5, rows: 3, jack: "egg",      voice: "roar",    vol: "high", anteMax: 10, base: 175, step: 105 },
  circus:   { load: "curtain", ms: 840,  extra: "ring",     spin: "HOP", cols: 4, rows: 3, jack: "ticket",   voice: "toot",    vol: "mid",  anteMax: 8,  base: 145, step: 95  },
  vault:    { load: "unlock",  ms: 980,  extra: "lock",     spin: "KASA",cols: 5, rows: 3, jack: "safe",     voice: "clack",   vol: "low",  anteMax: 10, base: 200, step: 118 },
};

export function kitOf(game) {
  return KITS[game?.id] || { load: "bloom", ms: 900, extra: "foil", spin: "GO", cols: 5, rows: 3, jack: "orb", voice: "chime", vol: "mid", anteMax: 10, base: 180, step: 115 };
}
