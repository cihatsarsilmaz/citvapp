import React, { useEffect, useMemo, useState } from "react";
import { GAMES } from "./games";
import { playTheme, stopTheme, playSpinLoop, stopSpinLoop, playSymbol, playStop, playWin, playMiss, playClick } from "./audio";
import { UNIT, WILD, STAR } from "./paytable";
import { spinGrid, applyHouse, emptySession, HOUSE_EDGE, WIN_CAP } from "./house";
import { evalLines, COLS, ROWS, LINES, LOW } from "./engine";
import Admin from "./Admin";
import "./styles.css";

const POOL = [...LOW, STAR, WILD];
const rnd = () => POOL[Math.floor(Math.random() * POOL.length)];
const blank = () => Array.from({ length: COLS }, () => [rnd(), rnd(), rnd()]);

export default function App() {
  const [hash, setHash] = useState(typeof location !== "undefined" ? location.hash : "");
  const [game, setGame] = useState(null);
  const [grid, setGrid] = useState(blank());
  const [lock, setLock] = useState([false, false, false, false, false]);
  const [spinning, setSpinning] = useState(false);
  const [ante, setAnte] = useState(1);
  const [speed, setSpeed] = useState("normal");
  const [last, setLast] = useState(null);
  const [balance, setBalance] = useState(1000);
  const [session, setSession] = useState(emptySession());

  useEffect(() => {
    const onHash = () => setHash(location.hash);
    window.addEventListener("hashchange", onHash);
    return () => window.removeEventListener("hashchange", onHash);
  }, []);

  const bet = UNIT * ante;
  const hitSet = useMemo(() => new Set((last?.hits || []).flatMap((h) => h.cells)), [last]);
  const jack = (250000 + session.vault * 17).toLocaleString("tr-TR");

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
    playClick();
    playTheme(g.freq, true);
  }

  function back() {
    stopSpinLoop();
    stopTheme();
    setGame(null);
    setLast(null);
  }

  function spin() {
    if (spinning || !game) return;
    if (balance < bet) return;
    setBalance((n) => n - bet);
    setSpinning(true);
    setLast(null);
    setLock([false, false, false, false, false]);
    playSpinLoop();
    const next = spinGrid(game.emoji, session.cool > 0);
    const gap = speed === "fast" ? 90 : speed === "slow" ? 180 : 130;
    const t = setInterval(() => {
      setGrid((prev) => prev.map((col, c) => (lock[c] ? col : [rnd(), rnd(), rnd()])));
    }, 50);
    for (let c = 0; c < COLS; c++) {
      setTimeout(() => {
        setLock((L) => { const n = [...L]; n[c] = true; return n; });
        setGrid((prev) => { const copy = prev.map((col) => [...col]); copy[c] = next[c]; return copy; });
        playStop();
        playSymbol(next[c][1]);
        if (c === COLS - 1) {
          clearInterval(t);
          stopSpinLoop();
          const ev = evalLines(next, game.emoji, bet);
          const result = applyHouse(ev, bet, session);
          setLast(result);
          setSession(result.session);
          setBalance((n) => n + result.win);
          setSpinning(false);
          if (result.win) playWin(2); else playMiss();
        }
      }, 240 + c * gap);
    }
  }

  return (
    <div className="app wide">
      <div className="ambient" aria-hidden />
      <header className="top">
        <div>
          <p className="kicker">CITV Slot · keçe salon</p>
          <h1>{game ? game.name : "Masaya otur"}</h1>
        </div>
        <a className="admin-link" href="#admin">kasa</a>
      </header>

      {!game && (
        <section className="grid">
          {GAMES.map((g) => (
            <button key={g.id} className="card" onClick={() => openGame(g)} style={{ "--c": g.color }}>
              <div className="ribbon" />
              <div className="em">{g.emoji}</div>
              <div className="nm">{g.name}</div>
              <div className="ch">{g.character}</div>
            </button>
          ))}
        </section>
      )}

      {game && (
        <section className="stage" style={{ "--c": game.color }}>
          <div className="jackpot">JACKPOT {jack} ₺</div>
          <div className="hud">
            <span>FİŞ {balance}</span>
            <span>KASA {session.vault}</span>
            <span>{LINES} HAT</span>
          </div>
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
            {last ? (last.win ? `WIN ${last.win}` : last.label) : spinning ? "…" : "ÇEVİR"}
          </p>
          <div className="dock">
            <div className="meter"><em>FİŞ</em><b>{balance}</b></div>
            <button className="act ghost" onClick={() => { playClick(); setAnte((n) => Math.max(1, n - 1)); }}>−</button>
            <div className="meter"><em>BAHİS</em><b>{bet}</b></div>
            <button className="act ghost" onClick={() => { playClick(); setAnte((n) => Math.min(10, n + 1)); }}>+</button>
            <button className="spinbtn" onClick={spin} disabled={spinning}>{spinning ? "…" : "SPIN"}</button>
            <div className="meter"><em>KAZANÇ</em><b>{last?.win || 0}</b></div>
            <button className="act ghost" onClick={() => { playClick(); setSpeed((s) => (s === "normal" ? "fast" : s === "fast" ? "slow" : "normal")); }}>{speed}</button>
            <button className="act ghost" onClick={back}>LOBİ</button>
          </div>
        </section>
      )}
    </div>
  );
}
