  const stageCls = [
    "stage", "lux",
    "g-" + (game?.id || ""),
    "kit-" + kit.extra,
    "vol-" + (kit.vol || "mid"),
    "c" + cols, "r" + rows,
    last?.win ? "hot" : "",
    session.inBonus || last?.bonus ? "bonus" : "",
    last?.cMult > 1 ? "cmult" : "",
    last?.collect ? "collect" : "",
    last?.rare ? "rare" : "",
    last?.extra ? "extra" : "",
    "floor",
  ].filter(Boolean).join(" ");