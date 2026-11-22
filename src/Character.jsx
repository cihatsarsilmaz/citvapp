import React from "react";
import { BOND_MAX } from "./bond";
import { figureOf } from "./figures";
import { portraitOf } from "./portraits";

export default function Character({ game, mood, bond = 0, onPoke }) {
  if (!game) return null;
  const m = mood || "idle";
  const fig = figureOf(game);
  const fill = Math.max(0, Math.min(1, bond / BOND_MAX));
  const live = m === "c" || m === "win" || m === "bonus" || m === "collect" || m === "bonuswin";
  const portrait = portraitOf(game.id);
  return (
    <div
      className={`actor fig seat d7 look mot-${game.motion || "sway"} mood-${m} id-${game.id}${portrait ? " has-port" : ""}${onPoke ? " pokeable" : ""}`}
      aria-hidden={onPoke ? undefined : "true"}
      role={onPoke ? "button" : undefined}
      tabIndex={onPoke ? 0 : undefined}
      aria-label={onPoke ? `${game.character} ile etkileşim` : undefined}
      onClick={onPoke}
      onKeyDown={onPoke ? (event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          onPoke();
        }
      } : undefined}
      title={onPoke ? `${fig.story} · dokun` : fig.story}
    >
      <i className="depth" />
      <i className="ring" style={{ "--bond": fill }} />
      <i className={`aura fx-${game.fx || "dust"}`} />
      {live && <i className="burst" />}
      {live && <i className="shock" />}
      {portrait ? (
        <span className="figure port">
          <img className="port-img" src={portrait} alt="" />
          <b className="mark body" data-mark={fig.mark}>{game.emoji}</b>
        </span>
      ) : (
        <span className="figure">
          <i className="cape" />
          <i className="hip" />
          <i className="torso" />
          <i className="bust" />
          <i className="head" />
          <i className="eye L" />
          <i className="eye R" />
          <i className="mouth" />
          <i className="hair" />
          <b className="mark body" data-mark={fig.mark}>{game.emoji}</b>
        </span>
      )}
      {m === "c" && <em className="cflash">×</em>}
    </div>
  );
}
