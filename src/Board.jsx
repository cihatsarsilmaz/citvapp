import React, { useEffect, useState } from "react";
import { LOW } from "./engine";

const STRIP = ["🎰", "⭐", ...LOW, "🎰", "⭐"];

export default function Board({ grid, hits, spinning }) {
  const cols = grid && grid.length ? grid : [];
  const [tick, setTick] = useState(0);

  useEffect(() => {
    if (!spinning) return;
    const id = setInterval(() => setTick((n) => n + 1), 70);
    return () => clearInterval(id);
  }, [spinning]);

  return (
    <div className={"reel-board" + (spinning ? " spin" : "")} aria-label="makara">
      {cols.map((col, c) => (
        <div className={"reel-col delay-" + (c % 6)} key={c}>
          {col.map((sym, r) => {
            const key = c + ":" + r;
            const hit = !spinning && hits && hits.has(key);
            const show = spinning ? STRIP[(tick + c * 2 + r) % STRIP.length] : sym;
            return (
              <span className={"reel-cell" + (hit ? " hit" : "")} key={key}>{show}</span>
            );
          })}
        </div>
      ))}
    </div>
  );
}
