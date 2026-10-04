import React from "react";
import Character from "./Character";
import { kitOf } from "./kits";

export default function Seat({ game, onOpen, recent }) {
  const k = kitOf(game);
  return (
    <button
      className={"card lux seat-card g-" + game.id + (recent ? " recent" : "")}
      onClick={() => onOpen(game)}
      style={{ "--c": game.color }}
    >
      <span className="seat-frame" />
      <span className="seat-theme">{game.theme}</span>
      <Character game={game} mood="idle" bond={0} />
      <span className="seat-plate">
        <b className="nm">{game.name}</b>
        <em className="tag">{game.character}</em>
        <span className="seat-meta">
          <i>{k.cols}×{k.rows}</i>
          <i>{k.spin}</i>
        </span>
      </span>
      <span className="seat-play">Oyna</span>
    </button>
  );
}
