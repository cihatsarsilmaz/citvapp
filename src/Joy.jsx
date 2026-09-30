import React, { useEffect } from "react";
import { tapBonus, tapWin } from "./feel";

export default function Joy({ kind, onDone }) {
  const ms = kind === "bonus" ? 1680 : kind === "jack" ? 980 : 560;
  useEffect(() => {
    if (kind === "bonus") tapBonus();
    if (kind === "jack") tapWin(2);
    const t = setTimeout(onDone, ms);
    return () => clearTimeout(t);
  }, [kind, onDone, ms]);
  return (
    <div className={"joy joy-" + kind} aria-hidden="true">
      <i className="joy-burst" />
      <i className="joy-ring" />
    </div>
  );
}
