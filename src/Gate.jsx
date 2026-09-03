import React, { useEffect } from "react";
import { kitOf } from "./kits";

export default function Gate({ game, onDone }) {
  const kit = kitOf(game);
  const ms = Math.max(kit.ms || 900, 1680);
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
      <div className="hero-wrap">
        <b className="mark hero">{game.emoji}</b>
        <span className="hero-ring" />
      </div>
      <p className="hero-name">{game.character}</p>
      <p className="hero-title">{game.title}</p>
      <i className="bar" />
    </div>
  );
}
