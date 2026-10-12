import React from "react";
import Character from "./Character";

export default function BonusFloor({ game, kit, left, on, onOk }) {
  if (!on || !game) return null;
  return (
    <div className={"bonus-scene kit-" + (kit?.extra || "foil")} style={{ "--c": game.color }} role="dialog" aria-label="bonus sahnesi">
      <div className="bonus-veil" />
      <div className="bonus-stage">
        <p className="bonus-kicker">BONUS AÇILDI</p>
        <Character game={game} mood="bonus" bond={0} />
        <h2>{game.theme}</h2>
        <b className="bonus-count">{left}</b>
        <em className="bonus-sub">bedava tur · {kit?.spin || "BONUS"}</em>
        <ul className="bonus-rules">
          <li>Ante yemez</li>
          <li>İki yıldız bir tur ekler</li>
          <li>Kazancı anlık yazar</li>
        </ul>
        <button className="entry-ok" onClick={onOk}>Tamam</button>
      </div>
    </div>
  );
}
