import React, { useMemo, useState } from "react";
import { GAMES } from "./games";
import { playTheme, stopTheme } from "./audio";
import { settle, UNIT, WILD, STAR } from "./paytable";
import { payRows, payout, RULES } from "./combos";
import { spinReels, applyHouse, emptySession, HOUSE_EDGE, WIN_CAP } from "./house";
import "./styles.css";

const PREVIEW = ["🍬", "⚡", "💎", "🦈", "💰", STAR, WILD];

export default function App() {
  const [game, setGame] = useState(null);
  const [reels, setReels] = useState([WILD, STAR, "💰"]);
  const [spinning, setSpinning] = useState(false);
  const [ante, setAnte] = useState(1);
  const [speed, setSpeed] = useState("normal");
  const [greet, setGreet] = useState("");
  const [last, setLast] = useState(null);
  const [balance, setBalance] = useState(1000);
  const [session, setSession] = useState(emptySession());

  const prize = useMemo(() => 250000 * ante, [ante]);
  const rows = useMemo(() => (game ? payRows(game.emoji) : []), [game]);
  const edgePct = Math.round(HOUSE_EDGE * 100);
  const rtpShow = session.wagered ? Math.round((session.paid / session.wagered) * 100) : 0;

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
    const ms = speed === "fast" ? 320 : speed === "slow" ? 980 : 620;
    const t = setInterval(() => {
      setReels([
        PREVIEW[Math.floor(Math.random() * PREVIEW.length)],
        PREVIEW[Math.floor(Math.random() * PREVIEW.length)],
        PREVIEW[Math.floor(Math.random() * PREVIEW.length)],
      ]);
    }, 70);
    setTimeout(() => {
      clearInterval(t);
      const next = spinReels(game.emoji, session.cool > 0);
      setReels(next);
      const raw = settle(next, game, ante);
      const result = applyHouse(raw, session);
      setLast(result);
      setSession(result.session);
      setBalance((n) => n + result.win);
      setSpinning(false);
    }, ms);
  }

  const hit = last?.hit || [];

  return (
    <div className="app">
      <div className="ambient" aria-hidden />
      <header className="top">
        <div>
          <p className="kicker">CITV Slot · kasa hattı</p>
          <h1>Kasa önce</h1>
          <div className="sub">kenar %{edgePct} · tavan {WIN_CAP}x bahis · soğuma {session.cool}</div>
        </div>
        <div className="prize">
          <span>Turnuva vitrini</span>
          <b>{prize.toLocaleString("tr-TR")} ₺</b>
        </div>
      </header>

      <div className="ledger">
        <div><span>Oyuncu</span><b>{balance}</b></div>
        <div><span>Kasa kasası</span><b className="hot">{session.vault}</b></div>
        <div><span>Oturum RTP</span><b>{session.wagered ? `%${rtpShow}` : "—"}</b></div>
        <div><span>Bahis</span><b>{UNIT * ante}</b></div>
      </div>
      <div className="vaultbar"><i style={{ width: `${Math.min(100, 40 + session.vault / 8)}%` }} /></div>

      {!game && (
        <section className="grid">
          {GAMES.map((g) => (
            <button key={g.id} className="card" onClick={() => openGame(g)} style={{ "--c": g.color }}>
              <div className="em">{g.emoji}</div>
              <div className="nm">{g.name}</div>
              <div className="ch">{g.character} · tema {g.emoji}</div>
            </button>
          ))}
        </section>
      )}

      {game && (
        <section className="scene">
          <div className="cabinet" style={{ "--c": game.color }}>
            <div className="lights"><i /><i /><i /><i /><i /></div>
            <p className="welcome">{greet}</p>
            <div className={"glass " + (spinning ? "spin" : "")}>
              {reels.map((s, i) => (
                <div key={i} className={hit.includes(i) ? "reel hit" : "reel"}>{s}</div>
              ))}
            </div>
            <p className="result">{last ? (last.win ? `+${last.win} · ${last.label}` : last.label) : "kasa bekliyor"}</p>
            <div className="row">
              <button className="act" onClick={spin} disabled={spinning}>{spinning ? "..." : "SPIN"}</button>
              <button className="act ghost" onClick={() => setAnte((n) => (n >= 10 ? 1 : n + 1))}>ANTE x{ante}</button>
              <button className="act ghost" onClick={() => setSpeed((s) => s === "normal" ? "fast" : s === "fast" ? "slow" : "normal")}>
                HIZ {speed}
              </button>
              <button className="act ghost" onClick={back}>LOBİ</button>
            </div>
            <div className="ptwrap">
              <table className="pay">
                <thead>
                  <tr>
                    <th>Simge</th>
                    <th>3'lü</th>
                    <th>Tablo</th>
                    <th>Kasa sonra</th>
                    <th>2'li</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((r) => (
                    <tr key={r.id || r.name}>
                      <td>{r.s} {r.name}</td>
                      <td>x{r.three}</td>
                      <td>{payout(r.three, ante)}</td>
                      <td>{Math.floor(Math.min(payout(r.three, ante), UNIT * ante * WIN_CAP) * (1 - HOUSE_EDGE))}</td>
                      <td>{r.two ? payout(r.two, ante) : "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <ul className="notes">{RULES.map((n) => <li key={n}>{n}</li>)}</ul>
          </div>
          <aside className="corner" style={{ "--c": game.color }}>
            <div className="avatar">{game.emoji}</div>
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
