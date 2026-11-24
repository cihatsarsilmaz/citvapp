import React, { useEffect, useRef, useState } from "react";
import Character from "./Character";
import { playCharacter, playClick } from "./audio";

const PHASE_MOOD = { mist: "idle", tunnel: "bonus", valley: "bonuswin" };

export default function BonusFloor({ game, kit, left, on, onOk }) {
  const [phase, setPhase] = useState("mist");
  const [mood, setMood] = useState("idle");
  const [taps, setTaps] = useState(0);
  const pokeT = useRef(0);
  const phaseRef = useRef(phase);
  phaseRef.current = phase;

  useEffect(() => {
    if (!on) return;
    setPhase("mist");
    setMood("idle");
    setTaps(0);
    const a = setTimeout(() => setPhase("tunnel"), 700);
    const b = setTimeout(() => setPhase("valley"), 1600);
    return () => { clearTimeout(a); clearTimeout(b); };
  }, [on]);

  useEffect(() => {
    if (on) setMood(PHASE_MOOD[phase] || "idle");
  }, [phase, on]);

  useEffect(() => () => clearTimeout(pokeT.current), []);

  function poke() {
    const roll = Math.random();
    const pick = roll < 0.4 ? "c" : roll < 0.75 ? "win" : "bonus";
    setMood(pick);
    setTaps((n) => n + 1);
    playCharacter(kit?.voice, pick);
    clearTimeout(pokeT.current);
    pokeT.current = setTimeout(() => setMood(PHASE_MOOD[phaseRef.current] || "idle"), 900);
  }

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
          <Character game={game} mood={mood} bond={0} onPoke={poke} />
        </div>
        <h2>{game.theme}</h2>
        <p className="bonus-who">{game.character} vadiye indi</p>
        <b className="bonus-count">{left}</b>
        <em className="bonus-sub">bedava tur · ante yemez · {kit?.spin || "BONUS"}</em>
        <p className="bonus-tap">{taps === 0 ? "Karaktere dokun" : `${taps} dokunuş · tepki veriyor`}</p>
        <button className="entry-ok" onClick={() => { playClick(); onOk(); }}>Oyuna gir</button>
      </div>
    </div>
  );
}
