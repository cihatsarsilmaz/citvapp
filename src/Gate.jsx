import React, { useEffect } from "react";
import { kitOf } from "./kits";
import Character from "./Character";

export default function Gate({ game, onDone }) {
  const kit = kitOf(game);
  const ms = Math.max(kit.ms || 900, 720);
  useEffect(() => {
    const t = setTimeout(onDone, ms);
    return () => clearTimeout(t);
  }, [game, ms, onDone]);

  return (
    <div
      className={`gate cine load-${kit.load} g-${game.id}`}
      style={{ "--c": game.color, "--sky": game.sky }}
      onPointerDown={onDone}
      aria-hidden="true"
    >
      <i className="depth d1" />
      <i className="depth d2" />
      <i className="depth d3" />
      <i className="depth d4" />
      <i className="depth d5" />
      <i className="depth d6" />
      <i className="depth d7" />
      <i className="halo" />
      <i className="filigree" />
      <span className="gate-hero">
        <Character game={game} mood="idle" bond={0} />
      </span>
      <i className="bar" />
    </div>
  );
}
