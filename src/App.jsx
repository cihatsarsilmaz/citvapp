import React, { useMemo, useState } from "react";
import { GAMES } from "./games";
import { playTheme, stopTheme } from "./audio";
import "./styles.css";

const SYMBOLS = ["🍬", "⚡", "💎", "🦈", "💰", "⭐", "🎰"];

export default function App() {
  const [game, setGame] = useState(null);
  const [reels, setReels] = useState(["🎰", "⭐", "💰"]);
  const [spinning, setSpinning] = useState(false);
  const [ante, setAnte] = useState(1);
  const [speed, setSpeed] = useState("normal");
  const [greet, setGreet] = useState("");

  const prize = useMemo(() => 250000 * ante, [ante]);

  function openGame(g) {
    setGame(g);
    setGreet(g.greeting);
    setReels([g.emoji, "⭐", "💰"]);
    playTheme(g.freq, true);
  }

  function back() {
    stopTheme();
    setGame(null);
    setGreet("");
  }

  function spin() {
    if (spinning || !game) return;
    setSpinning(true);
    const ms = speed === "fast" ? 280 : speed === "slow" ? 900 : 520;
    const t = setInterval(() => {
      setReels([
        SYMBOLS[Math.floor(Math.random() * SYMBOLS.length)],
        SYMBOLS[Math.floor(Math.random() * SYMBOLS.length)],
        SYMBOLS[Math.floor(Math.random() * SYMBOLS.length)],
      ]);
    }, 70);
    setTimeout(() => {
      clearInterval(t);
      setReels([game.emoji, game.emoji, SYMBOLS[Math.floor(Math.random() * SYMBOLS.length)]]);
      setSpinning(false);
    }, ms);
  }

  return (
    <div className="app">
      <header className="top">
        <div>
          <h1>CITV Slot</h1>
          <div className="sub">18 oyun · 18 karakter · kompakt sahne</div>
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
              <div className="ch">{g.character} · {g.title}</div>
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
                <div key={i} className="reel">{s}</div>
              ))}
            </div>
            <div className="row">
              <button className="act" onClick={spin} disabled={spinning}>{spinning ? "..." : "SPIN"}</button>
              <button className="act ghost" onClick={() => setAnte((n) => (n >= 10 ? 1 : n + 1))}>ANTE x{ante}</button>
              <button className="act ghost" onClick={() => setSpeed((s) => s === "normal" ? "fast" : s === "fast" ? "slow" : "normal")}>
                HIZ {speed}
              </button>
              <button className="act ghost" onClick={back}>LOBİ</button>
            </div>
            <ul className="features">
              <li>Tema: {game.theme}</li>
              <li>Doğrulama: karakter · ses · spin · ante · hız</li>
            </ul>
          </div>

          <aside className="corner">
            <div className="avatar" style={{ background: game.color + "22", boxShadow: `0 0 18px ${game.color}66` }}>
              {game.emoji}
            </div>
            <div>
              <p className="cname">{game.character}</p>
              <p className="ctitle">{game.title}</p>
              <p className="cquote">“{game.quote}”</p>
            </div>
            <button className="listen" onClick={() => playTheme(game.freq, false)}>▶ DİNLE</button>
          </aside>
          <div className="meta">CITV Slot önizleme · tipografi 32 / 14 / 12.5 / 10 · ödül 23px</div>
        </section>
      )}
    </div>
  );
}
