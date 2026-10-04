import React, { useEffect } from "react";
import { tapBonus, tapWin } from "./feel";

export default function Joy({ kind, onDone }) {
  const ms = kind === "bonus" ? 2200 : kind === "jack" ? 980 : 560;
  const title = kind === "bonus" ? "BONUS" : kind === "jack" ? "KASA" : "";
  const sub = kind === "bonus" ? "8 bedava tur" : kind === "jack" ? "kasa açıldı" : "";
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
      {title && <p className="joy-title">{title}</p>}
      {sub && <p className="joy-sub">{sub}</p>}
    </div>
  );
}
