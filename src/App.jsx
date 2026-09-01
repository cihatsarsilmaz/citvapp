import React, { useMemo, useState } from "react";
import { GAMES } from "./games";
import { playTheme, stopTheme } from "./audio";
import { settle, UNIT, WILD, STAR } from "./paytable";
import "./styles.css";

const POOL = ["🍬", "⚡", "💎", "🦈", "💰", STAR, WILD];

export default function App() {
  const [game, setGame] = useState(null);
  const [reels, setReels] = useState([WILD, STAR, "💰"]);
  const [spinning, setSpinning] = useState(false);
  const [ante, setAnte] = useState(1);
  const [speed, setSpeed] = useState("normal");
  const [greet, setGreet] = useState("");
  const [last, setLast] = useState(null);
  const [balance, setBalance] = useState(1000);

  const prize = useMemo(() => 250000 * ante, [ante]);

  function openGame(g) {
    setGame(g);
    setGreet(g.greeting);
    setReels([g.emoji, STAR, WILD]);
    setLast(null);
    playTheme(g.freq, true);
  }

  function back() {
    stopTheme();
    setGame(null);
    setGreet("");
    setLast(null);
  }

  function spin() {
    if (spinning || !game) return;
    const bet = UNIT * ante;
    if (balance < bet) return;
    setBalance((n) => n - bet);
    setSpinning(true);
    const ms = speed === "fast" ? 280 : speed === "slow" ? 900 : 520;
    const t = setInterval(() => {
      setReels([
        POOL[Math.floor(Math.random() * POOL.length)],
        POOL[Math.floor(Math.random() * POOL.length)],
        POOL[Math.floor(Math.random() * POOL.length)],
      ]);
    }, 70);
    setTimeout(() => {
      clearInterval(t);
      const next = [
        POOL[Math.floor(Math.random() * POOL.length)],
        POOL[Math.floor(Math.random() * POOL.length)],
        POOL[Math.floor(Math.random() * POOL.length)],
      ];
      setReels(next);
      const result = settle(next, game, ante);
      setLast(result);
      setBalance((n) => n + result.win);
      setSpinning(false);
    }, ms);
  }

  const hit = last?.hit || [];

  return (
    <div className="app">
      <header className="top">
        <div>
          <h1>CITV Slot</h1>
          <div className="sub">sol → sağ tek hat · joker {WILD} · bakiye {balance}</div>
        </div>
        <div className="prize">
          <span>Turnuva ödülü</span>
          <b>{prize.toLocaleString("tr-TR")} ₺</b>
        </div>
      </header>

      {!game && (
        <section className="grid">
          {GAMES.map((g) => (
            <button key={g.id} className="card" onClick={() => openGame(g)}>
              <div className="em">{g.emoji}</div>
              <div className="nm">{g.name}</div>
              <div className="ch">{g.character} · tema {g.emoji}</div>
            </button>
          ))}
        </section>
      )}

      {game && (
        <section className="scene">
          <div className="hero" style={{ boxShadow: `inset 0 0 0 1px ${game.color}33` }}>
            <p className="welcome">{greet}</p>
            <div className="reels">
              {reels.map((s, i) => (
                <div key={i} className={hit.includes(i) ? "reel hit" : "reel"}>{s}</div>
              ))}
            </div>
            <p className="result">{last ? (last.win ? `+${last.win} · ${last.label}` : last.label) : `bahis ${UNIT * ante}`}</p>
            <div className="row">
              <button className="act" onClick={spin} disabled={spinning}>{spinning ? "..." : "SPIN"}</button>
              <button className="act ghost" onClick={() => setAnte((n) => (n >= 10 ? 1 : n + 1))}>ANTE x{ante}</button>
              <button className="act ghost" onClick={() => setSpeed((s) => s === "normal" ? "fast" : s === "fast" ? "slow" : "normal")}>
                HIZ {speed}
              </button>
              <button className="act ghost" onClick={back}>LOBİ</button>
            </div>
            <table className="pay">
              <tbody>
                <tr><td>3× {game.emoji} tema</td><td>x12</td></tr>
                <tr><td>3× {WILD} joker</td><td>x20</td></tr>
                <tr><td>3× {STAR}</td><td>x8</td></tr>
                <tr><td>3× diğer</td><td>x5</td></tr>
                <tr><td>2× sol hat tema/{WILD}</td><td>x2</td></tr>
                <tr><td>2× sol hat diğer</td><td>x1</td></tr>
              </tbody>
            </table>
          </div>
          <aside className="corner">
            <div className="avatar" style={{ background: game.color + "22", boxShadow: `0 0 18px ${game.color}66` }}>{game.emoji}</div>
            <div>
              <p className="cname">{game.character}</p>
              <p className="ctitle">{game.title}</p>
              <p className="cquote">“{game.quote}”</p>
            </div>
            <button className="listen" onClick={() => playTheme(game.freq, false)}>▶ DİNLE</button>
          </aside>
        </section>
      )}
    </div>
  );
}
