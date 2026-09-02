import React, { useEffect } from "react";
import { kitOf } from "./kits";

export default function Gate({ game, onDone }) {
  const kit = kitOf(game);
  useEffect(() => {
    const t = setTimeout(onDone, kit.ms);
    return () => clearTimeout(t);
  }, [game, kit.ms, onDone]);

  return (
    <div
      className={`gate load-${kit.load} g-${game.id}`}
      style={{ "--c": game.color, "--sky": game.sky }}
      onPointerDown={onDone}
      aria-hidden="true"
    >
      <i className="halo" />
      <i className="filigree" />
      <b className="mark">{game.emoji}</b>
      <i className="bar" />
    </div>
  );
}
