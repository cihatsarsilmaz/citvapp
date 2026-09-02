import React from "react";

export default function Character({ game, mood }) {
  if (!game) return null;
  const m = mood || "idle";
  return (
    <div className={`actor mot-${game.motion || "sway"} mood-${m}`} aria-hidden="true">
      <i className={`aura fx-${game.fx || "dust"}`} />
      <b className="body">{game.emoji}</b>
      {m === "c" && <em className="cflash">C</em>}
    </div>
  );
}
