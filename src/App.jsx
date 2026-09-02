import React, { useEffect, useMemo, useRef, useState } from "react";
import { GAMES } from "./games";
import { playTheme, stopTheme, playSpinLoop, stopSpinLoop, playSymbol, playStop, playWin, playMiss, playClick, setMuted } from "./audio";
import { UNIT, WILD, STAR } from "./paytable";
import { spinGrid, applyHouse, emptySession } from "./house";
import { evalLines, COLS, LOW } from "./engine";
import { loadState, saveState } from "./store";
import { TICKER, DEMO, LIVE, loadMode, saveMode, formatCitv, loadWallet } from "./coin";
import Admin from "./Admin";

const POOL = [...LOW, STAR, WILD];
const rnd = () => POOL[Math.floor(Math.random() * POOL.length)];
const blank = () => Array.from({ length: COLS }, () => [rnd(), rnd(), rnd()]);
const START = 2500;
const TOPUP = 500;
const saved = loadState({ balance: START, session: emptySession(), muted: false, mode: DEMO });

export default function App() {
  const [hash, setHash] = useState(typeof location !== "undefined" ? location.hash : "");
  const [game, setGame] = useState(null);
  const [grid, setGrid] = useState(blank());
  const [lock, setLock] = useState([0, 0, 0, 0, 0]);
  const [spinning, setSpinning] = useState(false);
  const [ante, setAnte] = useState(1);
  const [last, setLast] = useState(null);
  const [trail, setTrail] = useState([]);
  const [balance, setBalance] = useState(saved.balance);
  const [session, setSession] = useState(saved.session);
  const [auto, setAuto] = useState(false);
  const [turbo, setTurbo] = useState(false);
  const [mute, setMute] = useState(saved.muted);
  const [mode, setMode] = useState(saved.mode || loadMode());
  const lockRef = useRef([0, 0, 0, 0, 0]);
  const busy = useRef(false);
  const autoRef = useRef(false);
  const turboRef = useRef(false);
  const timers = useRef([]);
  const gen = useRef(0);
  const live = useRef({});
  live.current = { game, balance, ante, session, mode };
  autoRef.current = auto;
  turboRef.current = turbo;

  useEffect(() => { setMuted(mute); }, [mute]);
  useEffect(() => {
    saveState({ balance, session, muted: mute, mode });
    saveMode(mode);
  }, [balance, session, mute, mode]);

  function clearTimers() {
    gen.current += 1;
    timers.current.forEach((id) => clearTimeout(id));
    timers.current = [];
    stopSpinLoop();
  }

  useEffect(() => {
    const onHash = () => setHash(location.hash);
    window.addEventListener("hashchange", onHash);
    return () => {
      window.removeEventListener("hashchange", onHash);
      clearTimers();
    };
  }, []);

  const bet = UNIT * ante;
  const hitSet = useMemo(() => new Set((last?.hits || []).flatMap((h) => h.cells || [])), [last]);
  const jack = formatCitv(250000 + session.vault * 17);
  const broke = balance < bet;
  const demo = mode !== LIVE;

  function runSpin() {
    const s = live.current;
    if (!s.game || busy.current) return;
    const b = UNIT * s.ante;
    if (s.balance < b) {
      autoRef.current = false;
      setAuto(false);
      return;
    }
    const my = ++gen.current;
    const fast = turboRef.current;
    const base = fast ? 70 : 160;
    const step = fast ? 55 : 100;
    const gap = fast ? 160 : 300;
    busy.current = true;
    setSpinning(true);
    setBalance((n) => n - b);
    setLast(null);
    lockRef.current = [0, 0, 0, 0, 0];
    setLock([0, 0, 0, 0, 0]);
    stopTheme();
    playSpinLoop();
    const snap = s.session;
    const next = spinGrid(s.game.emoji, snap.cool > 0);
    for (let c = 0; c < COLS; c++) {
      const id = setTimeout(() => {
        if (gen.current !== my) return;
        lockRef.current[c] = 1;
        setLock((L) => { const n = [...L]; n[c] = 1; return n; });
        setGrid((prev) => { const copy = prev.map((col) => [...col]); copy[c] = next[c]; return copy; });
        playStop();
        if (!fast) playSymbol(next[c][1]);
        if (c === COLS - 1) {
          stopSpinLoop();
          const ev = evalLines(next, s.game.emoji, b);
          const result = applyHouse(ev, b, snap);
          setLast(result);
          setTrail((t) => [result.win, ...t].slice(0, 5));
          setSession(result.session);
          setBalance((n) => n + result.win);
          busy.current = false;
          setSpinning(false);
          result.win ? playWin(2) : playMiss();
          if (autoRef.current && gen.current === my) {
            timers.current.push(setTimeout(runSpin, gap));
          }
        }
      }, base + c * step);
      timers.current.push(id);
    }
  }

  useEffect(() => {
    const key = (e) => {
      if (e.code === "Space" && live.current.game) { e.preventDefault(); runSpin(); }
    };
    window.addEventListener("keydown", key);
    return () => window.removeEventListener("keydown", key);
  }, []);

  if (hash.includes("admin")) {
    return (
      <div className="app">
        <Admin
          session={session}
          setSession={setSession}
          balance={balance}
          setBalance={setBalance}
          emptySession={emptySession}
          mode={mode}
          setMode={setMode}
        />
      </div>
    );
  }

  function openGame(g) {
    clearTimers();
    busy.current = false;
    setSpinning(false);
    setGame(g);
    setGrid(blank());
    setLast(null);
    setTrail([]);
    setAuto(false);
    autoRef.current = false;
    playClick();
    playTheme(g.freq, true);
  }

  function back() {
    clearTimers();
    busy.current = false;
    autoRef.current = false;
    setAuto(false);
    stopTheme();
    setGame(null);
    setLast(null);
    setSpinning(false);
  }

  function toggleAuto() {
    playClick();
    const n = !autoRef.current;
    autoRef.current = n;
    setAuto(n);
    if (n && !busy.current) timers.current.push(setTimeout(runSpin, 80));
    if (!n) clearTimers();
  }

  const spinLine = spinning ? "SPIN" : last ? (last.win ? `WIN ${last.win}` : "0") : game?.name;
  const stageCls = "stage" + (last?.win ? " hot" : "") + (last && !last.win ? " shake" : "");
  const wallet = loadWallet();

  return (
    <div className="app wide">
      {!game && (
        <>
          <header className="top">
            <div>
              <p className="kicker">CITV Slot · web</p>
              <h1>Masaya otur</h1>
            </div>
            <div className="meter"><em>{TICKER}</em><b>{balance.toLocaleString("tr-TR")}</b></div>
          </header>
          <p className="notes" style={{ margin: "0 0 12px" }}>
            {demo
              ? "DEMO rayı — dağıtım bitince gerçek CITV buraya bağlanır. Mağaza yok."
              : `LIVE · ${wallet ? wallet.slice(0, 8) + "…" : "cüzdan bekleniyor"}`}
          </p>
          <section className="grid">
            {GAMES.map((g) => (
              <button key={g.id} className="card" onClick={() => openGame(g)} style={{ "--c": g.color }}>
                <div className="ribbon" />
                <div className="em">{g.emoji}</div>
                <div className="nm">{g.name}</div>
                <div className="tag">{g.character}</div>
              </button>
            ))}
          </section>
        </>
      )}
      {game && (
        <section className={stageCls} style={{ "--c": game.color }}>
          <div className="lamps"><i /><i /><i /><i /><i /><i /><i /></div>
          <div className="jackpot">JACKPOT {jack}</div>
          <p className="face">{game.emoji} {game.character}</p>
          <div className={"window five " + (spinning ? "spin" : "") + (last?.win ? " win" : "")}>
            {grid.map((col, c) => (
              <div key={c} className={"reelcol " + (lock[c] ? "lock" : "")}>
                {col.map((s, r) => (
                  <div key={r} className={"cell " + (hitSet.has(`${c}:${r}`) ? "hit" : "")}>{s}</div>
                ))}
              </div>
            ))}
          </div>
          <p className="trail">
            {(trail.length ? trail : [null, null, null, null, null]).slice(0, 5).map((v, i) => (
              <b key={i} className={v ? "on" : ""}>{v == null ? "·" : v}</b>
            ))}
          </p>
          <p className={"bang " + (last && !last.win ? "miss" : "")}>{spinLine}</p>
          <div className="dock">
            <div className="meter"><em>{TICKER}</em><b>{balance.toLocaleString("tr-TR")}</b></div>
            <button className="act ghost" onClick={() => { playClick(); setAnte((n) => Math.max(1, n - 1)); }}>−</button>
            <div className="meter"><em>BAHİS</em><b>{bet}</b></div>
            <button className="act ghost" onClick={() => { playClick(); setAnte((n) => Math.min(10, n + 1)); }}>+</button>
            <button className="spinbtn" onClick={runSpin} disabled={spinning || broke}>SPIN</button>
            <button className={"act ghost " + (auto ? "on" : "")} onClick={toggleAuto}>{auto ? "DUR" : "AUTO"}</button>
            <button className={"act ghost " + (turbo ? "on" : "")} onClick={() => { playClick(); setTurbo((t) => !t); }}>{turbo ? "TURBO" : "NORM"}</button>
            <div className="meter"><em>KAZANÇ</em><b>{last?.win || 0}</b></div>
            {broke && demo && <button className="act" onClick={() => { playClick(); setBalance((n) => n + TOPUP); }}>+{TOPUP}</button>}
            <button className="act ghost" onClick={() => { playClick(); setMute((m) => !m); }}>{mute ? "AÇ" : "SUS"}</button>
            <button className="act ghost" onClick={back}>←</button>
          </div>
        </section>
      )}
    </div>
  );
}
