import React, { useEffect, useState } from "react";
import Character from "./Character";

export default function BonusFloor({ game, kit, left, on, onOk }) {
  const [phase, setPhase] = useState("mist");
  useEffect(() => {
    if (!on) return;
    setPhase("mist");
    const a = setTimeout(() => setPhase("tunnel"), 700);
    const b = setTimeout(() => setPhase("valley"), 1600);
    return () => { clearTimeout(a); clearTimeout(b); };
  }, [on]);
  if (!on || !game) return null;
  return (
    <div className={"bonus-scene kit-" + (kit?.extra || "foil") + " ph-" + phase} style={{ "--c": game.color }} role="dialog" aria-label="bonus oyunu">
      <div className="bonus-veil" />
      <div className="bonus-mist" />
      <div className="bonus-tunnel" />
      <div className="bonus-valley" />
      <div className="bonus-stage">
        <p className="bonus-kicker">BONUS OYUNU</p>
        <div className="bonus-walker">
          <Character game={game} mood="bonus" bond={0} />
        </div>
        <h2>{game.theme}</h2>
        <p className="bonus-who">{game.character} vadiye indi</p>
        <b className="bonus-count">{left}</b>
        <em className="bonus-sub">bedava tur · ante yemez · {kit?.spin || "BONUS"}</em>
        <button className="entry-ok" onClick={onOk}>Oyuna gir</button>
      </div>
    </div>
  );
}
