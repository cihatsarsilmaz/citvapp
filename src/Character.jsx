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
      <b className="body">{game.emoji}</b>
      {m === "c" && <em className="cflash">C</em>}
    </div>
  );
}
