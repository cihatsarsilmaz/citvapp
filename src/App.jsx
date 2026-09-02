import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { GAMES } from "./games";
import { playTheme, stopTheme, playSpinLoop, stopSpinLoop, playClash, playWin, playMiss, playClick, playBonusIn, playJack, playExtra, setMuted } from "./audio";
import { UNIT } from "./paytable";
import { spinGrid, applyHouse, emptySession, plan, readStyle } from "./house";
import { evalLines, LOW } from "./engine";
import { loadState, saveState } from "./store";
import { getMode, LIVE } from "./coin";
import { tap, tapSpin, tapTick, tapLock, tapWin } from "./feel";
import { kitOf } from "./kits";
import { loadRecents, pushRecent } from "./recents";
import { lockAt, starsLocked, markCell } from "./pace";
import { holdKeys } from "./bond";
import { loadLedger, book } from "./ledger";
import Character from "./Character";
import Gate from "./Gate";
import Jackpot from "./Jackpot";
import Joy from "./Joy";
import Admin from "./Admin";

const POOL = [...LOW];
const rnd = () => POOL[Math.floor(Math.random() * POOL.length)];
function blank(cols = 5, rows = 3) {
  return Array.from({ length: cols }, () => Array.from({ length: rows }, rnd));
}
const START = 2500;
const TOPUP = 500;
const saved = loadState({ balance: START, session: emptySession(), muted: false });

export default function App() {
  const [hash, setHash] = useState(typeof location !== "undefined" ? location.hash : "");
  const [game, setGame] = useState(null);
  const [boot, setBoot] = useState(false);
  const [grid, setGrid] = useState(() => blank());
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
  const [joy, setJoy] = useState(null);
  const [recents, setRecents] = useState(loadRecents);
  const [held, setHeld] = useState([]);
  const lockRef = useRef([0, 0, 0, 0, 0]);
  const busy = useRef(false);
  const autoRef = useRef(false);
  const turboRef = useRef(false);
  const timers = useRef([]);
  const gen = useRef(0);
  const pending = useRef(null);
  const taps = useRef(0);
  const ledger = useRef(loadLedger());
  const live = useRef({});
  live.current = { game, balance, ante, session, ledger: ledger.current };
  autoRef.current = auto;
  turboRef.current = turbo;
  const isLive = mode === LIVE;
  const kit = kitOf(game);
  const cols = kit.cols || 5;
  const rows = kit.rows || 3;
  const lobby = useMemo(() => {
    const rank = (id) => {
      const i = recents.indexOf(id);
      return i === -1 ? 99 : i;
    };
    return [...GAMES].sort((a, b) => rank(a.id) - rank(b.id));
  }, [recents]);

  useEffect(() => { setMuted(mute); }, [mute]);
  useEffect(() => { saveState({ balance, session, muted: mute }); }, [balance, session, mute]);

  function clearTimers() {
    gen.current += 1;
    timers.current.forEach((id) => clearTimeout(id));
    timers.current = [];
    stopSpinLoop();
  }

  const closeGate = useCallback(() => setBoot(false), []);
  const closeJoy = useCallback(() => setJoy(null), []);

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
  const holdSet = useMemo(() => new Set(held), [held]);
  const broke = balance < bet && !(session.inBonus);

  function finishSpin(my, next, b, snap) {
    if (gen.current !== my) return;
    stopSpinLoop();
    const s = live.current;
    const k = kitOf(s.game);
    const ev = evalLines(next, s.game.emoji, b, k);
    const result = applyHouse(ev, b, snap, {
      balance: s.balance,
      ante: s.ante,
      turbo: turboRef.current,
      ledger: ledger.current,
    });
    ledger.current = book(ledger.current, snap.inBonus ? 0 : b, result.win, result.gift);
    setLast(result);
    setSession(result.session);
    setBalance((n) => n + result.win);
    busy.current = false;
    setSpinning(false);
    pending.current = null;
    taps.current = 0;
    setHeld(holdKeys(next, result.extra));
    if (result.rare) {
      setMood("c");
      setJoy("jack");
      playJack();
    } else if (result.gift) {
      setMood("win");
      playWin(2);
    } else if (result.collect) {
      setMood("collect");
      playExtra();
    } else if (result.bonus) {
      setMood("bonus");
      setJoy("bonus");
      playBonusIn();
    } else if (result.jack) {
      setMood("win");
      setJoy("jack");
      playJack();
    } else if (result.extra) {
      setMood("bonus");
      playExtra();
    } else if (result.cMult > 1) setMood("c");
    else if (result.win) setMood(result.session.inBonus ? "bonuswin" : "win");
    else setMood("miss");
    if (result.win) {
      playWin(result.cMult > 1 ? 3 : 2);
      tapWin(result.cMult > 1 ? 2 : 1);
    } else if (!result.bonus && !result.collect) playMiss();
    if (autoRef.current && gen.current === my) {
      const gap = turboRef.current ? 140 : 260;
      timers.current.push(setTimeout(runSpin, gap));
    }
  }

  function lockCol(my, c, next) {
    if (gen.current !== my) return;
    if (lockRef.current[c]) return;
    const s = live.current;
    const k = kitOf(s.game);
    const nCols = k.cols || next.length;
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
    const mid = Math.floor((next[c].length - 1) / 2);
    playClash(next[c][mid], k.voice);
    tapLock();
    if (c < nCols - 1 && starsLocked(next, lockRef.current) >= 2) {
      playExtra();
      setMood("c");
    }
    if (c === nCols - 1) {
      const p = pending.current;
      if (p && p.my === my) finishSpin(my, next, p.bet, p.snap);
    }
  }

  function armSpin(my, next, base, step) {
    const nCols = next.length;
    const turbo = turboRef.current;
    for (let c = 0; c < nCols; c++) {
      if (lockRef.current[c]) continue;
      const id = setTimeout(() => lockCol(my, c, next), lockAt(c, nCols, base, step, turbo));
      timers.current.push(id);
    }
  }

  function runSpin() {
    const s = live.current;
    if (!s.game || busy.current || boot) return;
    const k = kitOf(s.game);
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
    const base = fast ? 50 : 140;
    const step = fast ? 42 : 88;
    busy.current = true;
    setSpinning(true);
    setMood(s.session.inBonus ? "bonus" : "spin");
    if (!free) setBalance((n) => n - b);
    setLast(null);
    setHeld([]);
    lockRef.current = Array(k.cols || 5).fill(0);
    setLock(Array(k.cols || 5).fill(0));
    taps.current = 0;
    stopTheme();
    playSpinLoop(s.game.freq ? s.game.freq[0] : 90);
    tapSpin();
    const snap = s.session;
    const style = readStyle(snap, s.balance, s.ante, fast);
    const p = plan(style, snap);
    const next = spinGrid(s.game.emoji, p.forceMiss && !snap.inBonus, k);
    pending.current = { my, next, bet: b, snap };
    armSpin(my, next, base, step);
  }

  function nudgeStage() {
    if (boot) return;
    const p = pending.current;
    if (!p || !busy.current) return;
    tap(11);
    taps.current += 1;
    timers.current.forEach((id) => clearTimeout(id));
    timers.current = [];
    const my = p.my;
    const next = p.next;
    if (taps.current >= 2) {
      for (let c = 0; c < next.length; c++) lockCol(my, c, next);
      return;
    }
    const first = lockRef.current.findIndex((v) => !v);
    if (first < 0) return;
    lockCol(my, first, next);
    for (let c = first + 1; c < next.length; c++) {
      const id = setTimeout(() => lockCol(my, c, next), (c - first) * 32);
      timers.current.push(id);
    }
  }

  useEffect(() => {
    const key = (e) => {
      if (e.code === "Space" && live.current.game) {
        e.preventDefault();
        if (boot) return;
        if (busy.current) nudgeStage();
        else runSpin();
      }
    };
    window.addEventListener("keydown", key);
    return () => window.removeEventListener("keydown", key);
  }, [boot]);

  if (hash.includes("admin")) {
    return (
      <div className="app">
        <Admin session={session} setSession={setSession} balance={balance} setBalance={setBalance} emptySession={emptySession} />
      </div>
    );
  }

  function openGame(g) {
    const k = kitOf(g);
    clearTimers();
    busy.current = false;
    setSpinning(false);
    setGame(g);
    setBoot(true);
    setGrid(blank(k.cols, k.rows));
    setLock(Array(k.cols).fill(0));
    setLast(null);
    setHeld([]);
    setAuto(false);
    autoRef.current = false;
    setMood("idle");
    setJoy(null);
    setRecents(pushRecent(g.id));
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
    setBoot(false);
    setLast(null);
    setHeld([]);
    setSpinning(false);
    setMood("idle");
    setJoy(null);
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
    if (n && !busy.current && !boot) timers.current.push(setTimeout(runSpin, 70));
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
    "stage", "lux",
    "g-" + (game?.id || ""),
    "kit-" + kit.extra,
    "c" + cols, "r" + rows,
    last?.win ? "hot" : "",
    last && !last.win && !spinning ? "shake" : "",
    session.inBonus || last?.bonus ? "bonus" : "",
    last?.cMult > 1 ? "cmult" : "",
    last?.collect ? "collect" : "",
    last?.rare ? "rare" : "",
    "floor",
  ].filter(Boolean).join(" ");
  const lamps = Math.max(5, Math.min(12, session.inBonus ? session.bonusLeft || 6 : 7));

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
            {lobby.map((g) => (
              <button key={g.id} className={"card lux g-" + g.id + (recents[0] === g.id ? " recent" : "")} onClick={() => openGame(g)} style={{ "--c": g.color }}>
                <div className="ribbon" />
                <div className={"em mot-" + g.motion}>{g.emoji}</div>
                <div className="nm">{g.name}</div>
                <div className="tag">{g.character}</div>
              </button>
            ))}
          </section>
        </>
      )}
      {game && boot && <Gate game={game} onDone={closeGate} />}
      {game && joy && <Joy kind={joy} onDone={closeJoy} />}
      {game && (
        <section className={stageCls} style={{ "--c": game.color, "--sky": game.sky, "--cols": cols, "--rows": rows }}>
          <div className="bevel" />
          <div className="lamps">{Array.from({ length: lamps }, (_, i) => <i key={i} />)}</div>
          <Jackpot kit={kit} vault={session.vault} hit={!!last?.jack} />
          <Character game={game} mood={mood} bond={session.bond || 0} />
          <div className={"window five " + (spinning ? "spin" : "") + (showWin ? " win" : "")} onPointerDown={nudgeStage}>
            {grid.map((col, c) => (
              <div key={c} className={"reelcol " + (lock[c] ? "lock" : "")}>
                {col.map((s, r) => (
                  <div key={r} className={"cell" + markCell(s) + (hitSet.has(`${c}:${r}`) ? " hit drop" : "") + (holdSet.has(`${c}:${r}`) ? " hold" : "")}>{s}</div>
                ))}
              </div>
            ))}
          </div>
          <p className={"bang " + (showWin ? "" : "quiet")}>
            {showWin ? (last.cMult > 1 ? `${last.win} ×${last.cMult}` : last.win) : ""}
          </p>
          <div className={"dock lux kit-" + kit.extra}>
            <div className="well"><em>CITV</em><b>{balance}</b></div>
            <button className="key tick" onPointerDown={() => bumpAnte(-1)}>−</button>
            <div className="well step"><em>{ante}</em><b>{bet}</b></div>
            <button className="key tick" onPointerDown={() => bumpAnte(1)}>+</button>
            <button className="plunger tick" onPointerDown={() => { if (spinning) nudgeStage(); else runSpin(); }} disabled={broke && !spinning}>
              {spinning ? "" : kit.spin}
            </button>
            <button className={"key latch tick " + (auto ? "on" : "")} onPointerDown={toggleAuto}>{auto ? "■" : "▶"}</button>
            <button className={"key latch tick " + (turbo ? "on" : "")} onPointerDown={() => { playClick(); tapTick(); setTurbo((t) => !t); }}>{turbo ? "▶▶" : "▶"}</button>
            {broke && !isLive && !session.inBonus && (
              <button className="key fill tick" onPointerDown={() => { playClick(); tapTick(); setBalance((n) => n + TOPUP); }}>+</button>
            )}
            <button className="key tick" onPointerDown={() => { playClick(); tapTick(); setMute((m) => !m); }}>{mute ? "·" : "♪"}</button>
            <button className="key tick" onPointerDown={() => back(false)}>←</button>
          </div>
        </section>
      )}
    </div>
  );
}
