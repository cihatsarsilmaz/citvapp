import React from "react";

export default function Board({ grid, hits, spinning }) {
  const cols = grid && grid.length ? grid : [];
  return (
    <div className={"reel-board" + (spinning ? " spin" : "")} aria-label="makara">
      {cols.map((col, c) => (
        <div className="reel-col" key={c}>
          {col.map((sym, r) => {
            const key = c + ":" + r;
            const hit = hits && hits.has(key);
            return (
              <span className={"reel-cell" + (hit ? " hit" : "")} key={key}>{sym}</span>
            );
          })}
        </div>
      ))}
    </div>
  );
}
