import React from "react";

export default function BonusFloor({ game, kit, left, on }) {
  if (!on || !game) return null;
  return (
    <section className={"bonus-floor kit-" + (kit?.extra || "foil")} aria-label="bonus sahnesi">
      <p className="bonus-kicker">{game.theme} bonus</p>
      <b className="bonus-count">{left}</b>
      <em className="bonus-sub">{kit?.spin || "BONUS"} · bedava tur</em>
      <span className="bonus-note">Ante yemez. İki yıldız tur ekler.</span>
    </section>
  );
}
