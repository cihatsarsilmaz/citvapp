import React, { useEffect, useMemo, useRef, useState } from "react";
import { GAMES } from "./games";
import { playTheme, stopTheme, playSpinLoop, stopSpinLoop, playSymbol, playStop, playWin, playMiss, playClick, setMuted } from "./audio";
import { UNIT } from "./paytable";
import { spinGrid, applyHouse, emptySession, plan, readStyle } from "./house";
import { evalLines, COLS, LOW } from "./engine";
import { loadState, saveState } from "./store";
import { getMode, LIVE } from "./coin";
import { tap, tapSpin, tapTick, tapLock, tapWin } from "./feel";
import Character from "./Character";
import Admin from "./Admin";

const POOL = [...LOW];
const rnd = () => POOL[Math.floor(Math.random() * POOL.length)];
const blank = () => Array.from({ length: COLS }, () => [rnd(), rnd(), rnd()]);
const START = 2500;
const TOPUP = 500;
const saved = loadState({ balance: START, session: emptySession(), muted: false });

export default function App() {
  const [hash, setHash] = useState(typeof location !== "undefined" ? location.hash : "");
  const [game, setGame] = useState(null);
  const [grid, setGrid] = useState(blank());
  const [lock, setLock] = useState([0, 0, 0, 0, 0]);
  const [spinning, setSpinning] = useState(false);
  const [ante, setAnte] = useState(1);
  const [last, setLast] = useState(null);
  const [balance, setBalance] = useState(saved.balance);
  const [session, setSession] = useState(saved.session);
  const [auto, setAuto] = useState(false);
  const [turbo, setTurbo] = useState(false);
  const [mute, setMute] = useState(saved.muted);
  const [mode, setModeTick] = useState(getMode());
  const [mood, setMood] = useState("idle");
  const lockRef = useRef([0, 0, 0, 0, 0]);
  const busy = useRef(false);
  const autoRef = useRef(false);
  const turboRef = useRef(false);
  const timers = useRef([]);
  const gen = useRef(0);
  const pending = useRef(null);
  const taps = useRef(0);
  const live = useRef({});
  live.current = { game, balance, ante, session };
  autoRef.current = auto;
  turboRef.current = turbo;
  const isLive = mode === LIVE;

  useEffect(() => { setMuted(mute); }, [mute]);
  useEffect(() => { saveState({ balance, session, muted: mute }); }, [balance, session, mute]);

  function clearTimers() {
    gen.current += 1;
    timers.current.forEach((id) => clearTimeout(id));
    timers.current = [];
    stopSpinLoop();
  }

  useEffect(() => {
    const onHash = () => {
      setHash(location.hash);
      setModeTick(getMode());
    };
    const onPop = () => {
      if (live.current.game) back(true);
    };
    window.addEventListener("hashchange", onHash);
    window.addEventListener("popstate", onPop);
    return () => {
      window.removeEventListener("hashchange", onHash);
      window.removeEventListener("popstate", onPop);
      clearTimers();
    };
  }, []);

  const bet = UNIT * ante;
  const hitSet = useMemo(() => new Set((last?.hits || []).flatMap((h) => h.cells || [])), [last]);
  const broke = balance < bet && !(session.inBonus);

  function finishSpin(my, next, b, snap) {
    if (gen.current !== my) return;
    stopSpinLoop();
    const s = live.current;
    const ev = evalLines(next, s.game.emoji, b);
    const result = applyHouse(ev, b, snap, {
      balance: s.balance,
      ante: s.ante,
      turbo: turboRef.current,
    });
    setLast(result);
    setSession(result.session);
    setBalance((n) => n + result.win);
    busy.current = false;
    setSpinning(false);
    pending.current = null;
    taps.current = 0;
    if (result.bonus) setMood("bonus");
    else if (result.cMult > 1) setMood("c");
    else if (result.win) setMood(result.session.inBonus ? "bonuswin" : "win");
    else setMood("miss");
    if (result.win) {
      playWin(result.cMult > 1 ? 3 : 2);
      tapWin(result.cMult > 1 ? 2 : 1);
    } else playMiss();
    if (autoRef.current && gen.current === my) {
      const gap = turboRef.current ? 140 : 280;
      timers.current.push(setTimeout(runSpin, gap));
    }
  }

  function lockCol(my, c, next) {
    if (gen.current !== my) return;
    if (lockRef.current[c]) return;
    lockRef.current[c] = 1;
    setLock((L) => {
      const n = [...L];
      n[c] = 1;
      return n;
    });
    setGrid((prev) => {
      const copy = prev.map((col) => [...col]);
      copy[c] = next[c];
      return copy;
    });
    playStop();
    tapLock();
    if (!turboRef.current) playSymbol(next[c][1]);
    if (c === COLS - 1) {
      const p = pending.current;
      if (p && p.my === my) finishSpin(my, next, p.bet, p.snap);
    }
  }

  function armSpin(my, next, base, step) {
    for (let c = 0; c < COLS; c++) {
      if (lockRef.current[c]) continue;
      const id = setTimeout(() => lockCol(my, c, next), base + c * step);
      timers.current.push(id);
    }
  }

  function runSpin() {
    const s = live.current;
    if (!s.game || busy.current) return;
    const free = !!(s.session && s.session.inBonus);
    const b = UNIT * s.ante;
    if (!free && s.balance < b) {
      autoRef.current = false;
      setAuto(false);
      return;
    }
    const my = ++gen.current;
    timers.current.forEach((id) => clearTimeout(id));
    timers.current = [];
    const fast = turboRef.current;
    const base = fast ? 55 : 150;
    const step = fast ? 48 : 95;
    busy.current = true;
    setSpinning(true);
    setMood(s.session.inBonus ? "bonus" : "spin");
    if (!free) setBalance((n) => n - b);
    setLast(null);
    lockRef.current = [0, 0, 0, 0, 0];
    setLock([0, 0, 0, 0, 0]);
    taps.current = 0;
    stopTheme();
    playSpinLoop();
    tapSpin();
    const snap = s.session;
    const style = readStyle(snap, s.balance, s.ante, fast);
    const p = plan(style, snap);
    const next = spinGrid(s.game.emoji, p.forceMiss && !snap.inBonus);
    pending.current = { my, next, bet: b, snap };
    armSpin(my, next, base, step);
  }

  function nudgeStage() {
    const p = pending.current;
    if (!p || !busy.current) return;
    tap(11);
    taps.current += 1;
    timers.current.forEach((id) => clearTimeout(id));
    timers.current = [];
    const my = p.my;
    const next = p.next;
    if (taps.current >= 2) {
      for (let c = 0; c < COLS; c++) lockCol(my, c, next);
      return;
    }
    const first = lockRef.current.findIndex((v) => !v);
    if (first < 0) return;
    lockCol(my, first, next);
    for (let c = first + 1; c < COLS; c++) {
      const id = setTimeout(() => lockCol(my, c, next), (c - first) * 36);
      timers.current.push(id);
    }
  }

  useEffect(() => {
    const key = (e) => {
      if (e.code === "Space" && live.current.game) {
        e.preventDefault();
        if (busy.current) nudgeStage();
        else runSpin();
      }
    };
    window.addEventListener("keydown", key);
    return () => window.removeEventListener("keydown", key);
  }, []);

  if (hash.includes("admin")) {
    return (
      <div className="app">
        <Admin session={session} setSession={setSession} balance={balance} setBalance={setBalance} emptySession={emptySession} />
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
    setAuto(false);
    autoRef.current = false;
    setMood("idle");
    playClick();
    tapTick();
    playTheme(g.freq, true);
    try { history.pushState({ citv: "stage" }, ""); } catch {}
  }

  function back(fromPop) {
    clearTimers();
    busy.current = false;
    autoRef.current = false;
    setAuto(false);
    stopTheme();
    setGame(null);
    setLast(null);
    setSpinning(false);
    setMood("idle");
    if (!fromPop) {
      try { if (history.state && history.state.citv === "stage") history.back(); } catch {}
    }
  }

  function toggleAuto() {
    playClick();
    tapTick();
    const n = !autoRef.current;
    autoRef.current = n;
    setAuto(n);
    if (n && !busy.current) timers.current.push(setTimeout(runSpin, 70));
    if (!n) {
      timers.current.forEach((id) => clearTimeout(id));
      timers.current = [];
    }
  }

  function bumpAnte(d) {
    playClick();
    tapTick();
    setAnte((n) => Math.min(10, Math.max(1, n + d)));
  }

  const showWin = !spinning && last && last.win > 0;
  const stageCls = [
    "stage",
    "g-" + (game?.id || ""),
    last?.win ? "hot" : "",
    last && !last.win && !spinning ? "shake" : "",
    session.inBonus || last?.bonus ? "bonus" : "",
    last?.cMult > 1 ? "cmult" : "",
  ].filter(Boolean).join(" ");

  return (
    <div className="app wide">
      {!game && (
        <>
          <header className="top">
            <div>
              <p className="kicker">CITV</p>
              <h1>Masaya otur</h1>
            </div>
            <div className="meter"><em>CITV</em><b>{balance}</b></div>
          </header>
          <section className="grid">
            {GAMES.map((g) => (
              <button key={g.id} className={"card g-" + g.id} onClick={() => openGame(g)} style={{ "--c": g.color }}>
                <div className="ribbon" />
                <div className={"em mot-" + g.motion}>{g.emoji}</div>
                <div className="nm">{g.name}</div>
                <div className="tag">{g.character}</div>
              </button>
            ))}
          </section>
        </>
      )}
      {game && (
        <section className={stageCls} style={{ "--c": game.color, "--sky": game.sky }}>
          <div className="lamps"><i /><i /><i /><i /><i /><i /><i /></div>
          <Character game={game} mood={mood} />
          <div
            className={"window five " + (spinning ? "spin" : "") + (showWin ? " win" : "")}
            onPointerDown={nudgeStage}
          >
            {grid.map((col, c) => (
              <div key={c} className={"reelcol " + (lock[c] ? "lock" : "")}>
                {col.map((s, r) => (
                  <div key={r} className={"cell " + (hitSet.has(`${c}:${r}`) ? "hit" : "")}>{s}</div>
                ))}
              </div>
            ))}
          </div>
          <p className={"bang " + (showWin ? "" : "quiet")}>
            {showWin ? (last.cMult > 1 ? `${last.win} ×${last.cMult}` : last.win) : ""}
          </p>
          <div className="dock">
            <div className="meter"><em>CITV</em><b>{balance}</b></div>
            <button className="act ghost tick" onPointerDown={() => bumpAnte(-1)}>−</button>
            <div className="meter tickface"><em>{ante}</em><b>{bet}</b></div>
            <button className="act ghost tick" onPointerDown={() => bumpAnte(1)}>+</button>
            <button className="spinbtn tick" onPointerDown={() => { if (spinning) nudgeStage(); else runSpin(); }} disabled={broke && !spinning}>
              {spinning ? "" : "SPIN"}
            </button>
            <button className={"act ghost tick " + (auto ? "on" : "")} onPointerDown={toggleAuto}>{auto ? "■" : "▶"}</button>
            <button
              className={"act ghost tick " + (turbo ? "on" : "")}
              onPointerDown={() => { playClick(); tapTick(); setTurbo((t) => !t); }}
            >{turbo ? "▶▶" : "▶"}</button>
            {broke && !isLive && !session.inBonus && (
              <button className="act tick" onPointerDown={() => { playClick(); tapTick(); setBalance((n) => n + TOPUP); }}>+</button>
            )}
            <button className="act ghost tick" onPointerDown={() => { playClick(); tapTick(); setMute((m) => !m); }}>{mute ? "·" : "♪"}</button>
            <button className="act ghost tick" onPointerDown={() => back(false)}>←</button>
          </div>
        </section>
      )}
    </div>
  );
}
