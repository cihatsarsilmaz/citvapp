import React from "react";
import Character from "./Character";

export default function BonusFloor({ game, kit, left, on, onOk }) {
  if (!on || !game) return null;
  return (
    <div className={"bonus-scene kit-" + (kit?.extra || "foil")} style={{ "--c": game.color }} role="dialog" aria-label="bonus oyunu">
      <div className="bonus-veil" />
      <div className="bonus-rays" />
      <div className="bonus-stage">
        <p className="bonus-kicker">BONUS OYUNU</p>
        <Character game={game} mood="bonus" bond={0} />
        <h2>{game.theme}</h2>
        <p className="bonus-who">{game.character} sahneyi açtı</p>
        <b className="bonus-count">{left}</b>
        <em className="bonus-sub">bedava tur · ante yemez · {kit?.spin || "BONUS"}</em>
        <ul className="bonus-rules">
          <li>Spin sesi değişir</li>
          <li>Kabin altın olur</li>
          <li>İki yıldız tur ekler</li>
        </ul>
        <button className="entry-ok" onClick={onOk}>Oyuna gir</button>
      </div>
    </div>
  );
}
