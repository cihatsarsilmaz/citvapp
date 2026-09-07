import React from "react";
import { BOND_MAX } from "./bond";

export default function Character({ game, mood, bond = 0 }) {
  if (!game) return null;
  const m = mood || "idle";
  const fill = Math.max(0, Math.min(1, bond / BOND_MAX));
  const live = m === "c" || m === "win" || m === "bonus" || m === "collect" || m === "bonuswin";
  return (
    <div className={`actor fig seat d7 mot-${game.motion || "sway"} mood-${m} id-${game.id}`} aria-hidden="true">
      <i className="depth" />
      <i className="ring" style={{ "--bond": fill }} />
      <i className={`aura fx-${game.fx || "dust"}`} />
      {live && <i className="burst" />}
      {live && <i className="shock" />}
      <span className="figure">
        <i className="cape" />
        <i className="torso" />
        <i className="head" />
        <i className="eye L" />
        <i className="eye R" />
        <i className="mouth" />
        <b className="face">{game.emoji}</b>
      </span>
      {m === "c" && <em className="cflash">C</em>}
    </div>
  );
}
