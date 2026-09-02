import React from "react";

export default function Jackpot({ kit, vault, hit }) {
  const fill = Math.max(8, Math.min(100, 12 + Math.log10(Math.max(1, vault)) * 18));
  return (
    <div className={"jp jp-" + (kit.jack || "orb") + (hit ? " hit" : "")} aria-hidden="true">
      <i className="body" />
      <i className="fill" style={{ height: fill + "%" }} />
    </div>
  );
}
