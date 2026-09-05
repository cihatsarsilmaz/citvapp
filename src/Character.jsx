import React from "react";
import { BOND_MAX } from "./bond";

export default function Character({ game, mood, bond = 0 }) {
  if (!game) return null;
  const m = mood || "idle";
  const fill = Math.max(0, Math.min(1, bond / BOND_MAX));
  return (
    <div className={`actor mot-${game.motion || "sway"} mood-${m}`} aria-hidden="true">
      <i className="ring" style={{ "--bond": fill }} />
      <i className={`aura fx-${game.fx || "dust"}`} />
      <div className="figure">
        <span className="shadow" />
        <span className="plate" />
        <span className="face">{game.emoji}</span>
        <span className="glow" />
      </div>
      {m === "c" && <em className="cflash">C</em>}
    </div>
  );
}
