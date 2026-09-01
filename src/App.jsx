import React, { useEffect, useMemo, useState } from "react";
import { GAMES } from "./games";
import { playTheme, stopTheme, playSpinLoop, stopSpinLoop, playSymbol, playStop, playWin, playMiss, playClick } from "./audio";
import { settle, UNIT, WILD, STAR } from "./paytable";
import { payRows, payout, RULES } from "./combos";
import { spinReels, applyHouse, emptySession, HOUSE_EDGE, WIN_CAP } from "./house";
import Admin from "./Admin";
import "./styles.css";

const PREVIEW = ["🍬", "⚡", "💎", "🦈", "💰", STAR, WILD];
const rnd = () => PREVIEW[Math.floor(Math.random() * PREVIEW.length)];
function strip(mid) {
  return [rnd(), mid, rnd()];
}

export default function App() {
  const [hash, setHash] = useState(typeof location !== "undefined" ? location.hash : "");
  const [game, setGame] = useState(null);
  const [cols, setCols] = useState([strip(WILD), strip(STAR), strip("💰")]);
  const [spinning, setSpinning] = useState(false);
  const [ante, setAnte] = useState(1);
  const [speed, setSpeed] = useState("normal");
  const [greet, setGreet] = useState("");
  const [last, setLast] = useState(null);
  const [balance, setBalance] = useState(1000);
  const [session, setSession] = useState(emptySession());

  useEffect(() => {
    const onHash = () => setHash(location.hash);
    window.addEventListener("hashchange", onHash);
    return () => window.removeEventListener("hashchange", onHash);
  }, []);

  const prize = useMemo(() => 250000 * ante, [ante]);
  const rows = useMemo(() => (game ? payRows(game.emoji) : []), [game]);
  const edgePct = Math.round(HOUSE_EDGE * 100);
  const rtpShow = session.wagered ? Math.round((session.paid / session.wagered) * 100) : 0;
  const mids = cols.map((c) => c[1]);

  if (hash.includes("admin")) {
    return (
      <div className="app">
        <Admin session={session} setSession={setSession} balance={balance} setBalance={setBalance} emptySession={emptySession} />
      </div>
    );
  }

  function openGame(g) {
    setGame(g);
    setGreet(g.greeting);
    setCols([strip(g.emoji), strip(STAR), strip(WILD)]);
    setLast(null);
    playClick();
    playTheme(g.freq, true);
  }

  function back() {
    stopSpinLoop();
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
    setLast(null);
    playSpinLoop();
    const gap = speed === "fast" ? 140 : speed === "slow" ? 280 : 200;
    const next = spinReels(game.emoji, session.cool > 0);
    const t = setInterval(() => {
      setCols((prev) => prev.map((col) => (col.locked ? col : strip(rnd()))));
    }, 60);
    [0, 1, 2].forEach((i) => {
      setTimeout(() => {
        setCols((prev) => {
          const copy = prev.map((c) => [...c]);
          copy[i] = strip(next[i]);
          copy[i].locked = true;
          return copy;
        });
        playStop();
        playSymbol(next[i]);
        if (i === 2) {
          clearInterval(t);
          stopSpinLoop();
          const raw = settle(next, game, ante);
          const result = applyHouse(raw, session);
          setLast(result);
          setSession(result.session);
          setBalance((n) => n + result.win);
          setSpinning(false);
          if (result.win) playWin(result.mult >= 5 ? 2 : 1);
          else playMiss();
        }
      }, 280 + i * gap);
    });
  }

  const hit = last?.hit || [];
  const won = last && last.win > 0;

  return (
    <div className="app">
      <div className="ambient" aria-hidden />
      <header className="top">
        <div>
          <p className="kicker">CITV Slot · salon</p>
          <h1>{game ? game.name : "Kasa önce"}</h1>
          <div className="sub">kenar %{edgePct} · tavan {WIN_CAP}x · soğuma {session.cool}</div>
        </div>
        <div className="prize">
          <span>Turnuva vitrini</span>
          <b>{prize.toLocaleString("tr-TR")} ₺</b>
        </div>
      </header>
      <div className="ledger">
        <div><span>Oyuncu</span><b>{balance}</b></div>
        <div><span>Kasa</span><b className="hot">{session.vault}</b></div>
        <div><span>RTP</span><b>{session.wagered ? `%${rtpShow}` : "—"}</b></div>
        <div><span>Bahis</span><b>{UNIT * ante}</b></div>
      </div>
      <div className="vaultbar"><i style={{ width: `${Math.min(100, 38 + session.vault / 8)}%` }} /></div>
      {!game && (
        <>
          <div className="billboard">
            <span>18 sahne</span>
            <strong>Karakter Köşesi açık</strong>
            <em><a href="#admin" style={{ color: "inherit" }}>admin</a></em>
          </div>
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
        </>
      )}
      {game && (
        <section className="scene">
          <div className={"cabinet " + (won ? "win" : "") + (spinning ? " busy" : "")} style={{ "--c": game.color }}>
            <div className="chrome"><b>CITV</b><span>{game.character}</span><b>SLOT</b></div>
            <div className="lights"><i /><i /><i /><i /><i /><i /><i /></div>
            <p className="welcome">{greet}</p>
            <div className={"window " + (spinning ? "spin" : "")}>
              <div className="payline" />
              {cols.map((col, i) => (
                <div key={i} className={"col " + (hit.includes(i) ? "hit" : "")}>
                  <span className="dim">{col[0]}</span>
                  <span className="mid">{col[1]}</span>
                  <span className="dim">{col[2]}</span>
                </div>
              ))}
            </div>
            <p className="result">{last ? (won ? `+${last.win} · ${last.label}` : last.label) : mids.join(" ")}</p>
            <div className="row">
              <button className="act" onClick={spin} disabled={spinning}>{spinning ? "…" : "SPIN"}</button>
              <button className="act ghost" onClick={() => { playClick(); setAnte((n) => (n >= 10 ? 1 : n + 1)); }}>ANTE x{ante}</button>
              <button className="act ghost" onClick={() => { playClick(); setSpeed((s) => (s === "normal" ? "fast" : s === "fast" ? "slow" : "normal")); }}>HIZ {speed}</button>
              <button className="act ghost" onClick={back}>LOBİ</button>
            </div>
          </div>
        </section>
      )}
    </div>
  );
}
