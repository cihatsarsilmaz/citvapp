import React, { useEffect, useMemo, useRef, useState } from "react";
import { GAMES } from "./games";
import { playTheme, stopTheme, playSpinLoop, stopSpinLoop, playSymbol, playStop, playWin, playMiss, playClick } from "./audio";
import { UNIT, WILD, STAR } from "./paytable";
import { spinGrid, applyHouse, emptySession } from "./house";
import { evalLines, COLS, LOW } from "./engine";
import Admin from "./Admin";
import "./styles.css";

const POOL = [...LOW, STAR, WILD];
const rnd = () => POOL[Math.floor(Math.random() * POOL.length)];
const blank = () => Array.from({ length: COLS }, () => [rnd(), rnd(), rnd()]);

export default function App() {
  const [hash, setHash] = useState(typeof location !== "undefined" ? location.hash : "");
  const [game, setGame] = useState(null);
  const [grid, setGrid] = useState(blank());
  const [lock, setLock] = useState([0, 0, 0, 0, 0]);
  const [spinning, setSpinning] = useState(false);
  const [ante, setAnte] = useState(1);
  const [last, setLast] = useState(null);
  const [balance, setBalance] = useState(1000);
  const [session, setSession] = useState(emptySession());
  const [auto, setAuto] = useState(false);
  const lockRef = useRef([0, 0, 0, 0, 0]);
  const live = useRef({});
  live.current = { game, balance, ante, session, spinning, auto };

  useEffect(() => {
    const onHash = () => setHash(location.hash);
    window.addEventListener("hashchange", onHash);
    return () => window.removeEventListener("hashchange", onHash);
  }, []);

  const bet = UNIT * ante;
  const hitSet = useMemo(() => new Set((last?.hits || []).flatMap((h) => h.cells)), [last]);
  const jack = (250000 + session.vault * 17).toLocaleString("tr-TR");

  function runSpin() {
    const s = live.current;
    if (!s.game || s.spinning) return;
    const b = UNIT * s.ante;
    if (s.balance < b) { setAuto(false); return; }
    setBalance((n) => n - b);
    setSpinning(true);
    setLast(null);
    lockRef.current = [0, 0, 0, 0, 0];
    setLock([0, 0, 0, 0, 0]);
    playSpinLoop();
    const next = spinGrid(s.game.emoji, s.session.cool > 0);
    const tick = setInterval(() => {
      setGrid((prev) => prev.map((col, c) => (lockRef.current[c] ? col : [rnd(), rnd(), rnd()])));
    }, 48);
    for (let c = 0; c < COLS; c++) {
      setTimeout(() => {
        lockRef.current[c] = 1;
        setLock((L) => { const n = [...L]; n[c] = 1; return n; });
        setGrid((prev) => { const copy = prev.map((col) => [...col]); copy[c] = next[c]; return copy; });
        playStop();
        playSymbol(next[c][1]);
        if (c === COLS - 1) {
          clearInterval(tick);
          stopSpinLoop();
          const ev = evalLines(next, s.game.emoji, b);
          const result = applyHouse(ev, b, live.current.session);
          setLast(result);
          setSession(result.session);
          setBalance((n) => n + result.win);
          setSpinning(false);
          result.win ? playWin(2) : playMiss();
          if (live.current.auto) setTimeout(runSpin, 420);
        }
      }, 220 + c * 140);
    }
  }

  useEffect(() => {
    const key = (e) => {
      if (e.code === "Space" && game) { e.preventDefault(); runSpin(); }
    };
    window.addEventListener("keydown", key);
    return () => window.removeEventListener("keydown", key);
  });

  if (hash.includes("admin")) {
    return (
      <div className="app">
        <Admin session={session} setSession={setSession} balance={balance} setBalance={setBalance} emptySession={emptySession} />
      </div>
    );
  }

  function openGame(g) {
    setGame(g);
    setGrid(blank());
    setLast(null);
    setAuto(false);
    playClick();
    playTheme(g.freq, true);
  }

  function back() {
    setAuto(false);
    stopSpinLoop();
    stopTheme();
    setGame(null);
    setLast(null);
  }

  return (
    <div className="app wide">
      {!game && (
        <>
          <header className="top">
            <div>
              <p className="kicker">CITV Slot</p>
              <h1>Masaya otur</h1>
            </div>
          </header>
          <section className="grid">
            {GAMES.map((g) => (
              <button key={g.id} className="card" onClick={() => openGame(g)} style={{ "--c": g.color }}>
                <div className="em">{g.emoji}</div>
                <div className="nm">{g.name}</div>
              </button>
            ))}
          </section>
        </>
      )}
      {game && (
        <section className="stage" style={{ "--c": game.color }}>
          <div className="jackpot">JACKPOT {jack} ₺</div>
          <div className={"window five " + (spinning ? "spin" : "") + (last?.win ? " win" : "")}>
            {grid.map((col, c) => (
              <div key={c} className={"reelcol " + (lock[c] ? "lock" : "")}>
                {col.map((s, r) => (
                  <div key={r} className={"cell " + (hitSet.has(`${c}:${r}`) ? "hit" : "")}>{s}</div>
                ))}
              </div>
            ))}
          </div>
          <p className={"bang " + (last && !last.win ? "miss" : "")}>
            {last ? (last.win ? `WIN ${last.win}` : "—") : spinning ? "" : game.name}
          </p>
          <div className="dock">
            <div className="meter"><em>FİŞ</em><b>{balance}</b></div>
            <button className="act ghost" onClick={() => { playClick(); setAnte((n) => Math.max(1, n - 1)); }}>−</button>
            <div className="meter"><em>BAHİS</em><b>{bet}</b></div>
            <button className="act ghost" onClick={() => { playClick(); setAnte((n) => Math.min(10, n + 1)); }}>+</button>
            <button className="spinbtn" onClick={runSpin} disabled={spinning}>SPIN</button>
            <button className={"act ghost " + (auto ? "on" : "")} onClick={() => { playClick(); setAuto((a) => { const n = !a; if (n && !spinning) setTimeout(runSpin, 80); return n; }); }}>
              {auto ? "DUR" : "AUTO"}
            </button>
            <div className="meter"><em>KAZANÇ</em><b>{last?.win || 0}</b></div>
            <button className="act ghost" onClick={back}>←</button>
          </div>
        </section>
      )}
    </div>
  );
}
