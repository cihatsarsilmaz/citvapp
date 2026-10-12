import React from "react";
import Character from "./Character";

export default function Entry({ game, kit, onOk }) {
  if (!game) return null;
  return (
    <div className="entry-scene" style={{ "--c": game.color }} role="dialog" aria-label="sahneye giriş">
      <div className="entry-veil" />
      <div className="entry-card">
        <Character game={game} mood="idle" bond={0} />
        <p className="entry-theme">{game.theme}</p>
        <h2>{game.name}</h2>
        <p className="entry-who">{game.character} · {game.title}</p>
        <div className="entry-facts">
          <span>{kit.cols}×{kit.rows}</span>
          <span>{kit.spin}</span>
          <span>ante yemez bonus</span>
        </div>
        <button className="entry-ok" onClick={onOk}>Tamam</button>
      </div>
    </div>
  );
}
