import { useState, useEffect, useRef, useCallback } from "react";

const COLS = 10;
const ROWS = 12;
const CELL = 48;

const SHIPS = [
  { id: 1, name: "Ana Gemi",    size: 4, color: "#4fc3f7" },
  { id: 2, name: "Kruvazör",    size: 3, color: "#81c784" },
  { id: 3, name: "Destroyer",   size: 3, color: "#81c784" },
  { id: 4, name: "Süpürücü",    size: 2, color: "#ffb74d" },
  { id: 5, name: "İstihbarat",  size: 2, color: "#ffb74d" },
  { id: 6, name: "Mayın Gemisi",size: 2, color: "#ffb74d" },
  { id: 7, name: "Keşif Aracı", size: 1, color: "#ef9a9a" },
];

function emptyGrid() {
  return Array.from({ length: ROWS }, () => Array(COLS).fill(null));
}

function randomPlace(grid, ship) {
  const placed = JSON.parse(JSON.stringify(grid));
  let tries = 0;
  while (tries < 200) {
    tries++;
    const horiz = Math.random() < 0.5;
    const row = Math.floor(Math.random() * (horiz ? ROWS : ROWS - ship.size + 1));
    const col = Math.floor(Math.random() * (horiz ? COLS - ship.size + 1 : COLS));
    let ok = true;
    for (let i = 0; i < ship.size; i++) {
      const r = horiz ? row : row + i;
      const c = horiz ? col + i : col;
      if (placed[r][c] !== null) { ok = false; break; }
    }
    if (ok) {
      for (let i = 0; i < ship.size; i++) {
        const r = horiz ? row : row + i;
        const c = horiz ? col + i : col;
        placed[r][c] = ship.id;
      }
      return placed;
    }
  }
  return null;
}

function buildAI() {
  let grid = emptyGrid();
  for (const ship of SHIPS) {
    const next = randomPlace(grid, ship);
    if (next) grid = next;
  }
  return grid;
}

const STARS = Array.from({ length: 80 }, (_, i) => ({
  x: Math.random() * 100,
  y: Math.random() * 100,
  r: Math.random() * 1.5 + 0.3,
  o: Math.random() * 0.6 + 0.2,
  delay: Math.random() * 3,
}));

function StarField() {
  return (
    <svg
      style={{ position: "fixed", inset: 0, width: "100vw", height: "100vh", pointerEvents: "none", zIndex: 0 }}
      viewBox="0 0 100 100"
      preserveAspectRatio="xMidYMid slice"
    >
      {STARS.map((s, i) => (
        <circle
          key={i}
          cx={s.x}
          cy={s.y}
          r={s.r}
          fill="white"
          opacity={s.o}
          style={{ animation: `twinkle 3s ${s.delay}s ease-in-out infinite alternate` }}
        />
      ))}
    </svg>
  );
}

function Grid({ cells, shots, onShot, disabled, reveal }) {
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: `repeat(${COLS}, ${CELL}px)`,
        gap: 2,
        cursor: disabled ? "default" : "crosshair",
      }}
    >
      {cells.map((row, r) =>
        row.map((cell, c) => {
          const key = `${r}-${c}`;
          const hit = shots[key];
          const isShip = cell !== null;
          let bg = "rgba(2,8,16,0.7)";
          if (hit === "hit") bg = "#ef5350";
          else if (hit === "miss") bg = "#37474f";
          else if (reveal && isShip) bg = "rgba(79,195,247,0.25)";
          return (
            <div
              key={key}
              onClick={() => !disabled && !hit && onShot(r, c)}
              style={{
                width: CELL,
                height: CELL,
                background: bg,
                border: "1px solid rgba(79,195,247,0.25)",
                borderRadius: 3,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 18,
                transition: "background 0.2s",
              }}
            >
              {hit === "hit" ? "💥" : hit === "miss" ? "·" : (reveal && isShip ? "🚀" : "")}
            </div>
          );
        })
      )}
    </div>
  );
}

function countRemaining(grid, shots) {
  let count = 0;
  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS; c++) {
      if (grid[r][c] !== null && !shots[`${r}-${c}`]) count++;
    }
  }
  return count;
}

export default function App() {
  const [phase, setPhase] = useState("menu"); // menu | place | battle | over
  const [playerGrid, setPlayerGrid] = useState(emptyGrid());
  const [aiGrid] = useState(buildAI);
  const [playerShots, setPlayerShots] = useState({});
  const [aiShots, setAiShots] = useState({});
  const [placing, setPlacing] = useState(0);
  const [horiz, setHoriz] = useState(true);
  const [winner, setWinner] = useState(null);
  const [msg, setMsg] = useState("");
  const [turn, setTurn] = useState("player");
  const placingShip = SHIPS[placing];

  const totalShipCells = SHIPS.reduce((a, s) => a + s.size, 0);

  function startPlacing() {
    setPlayerGrid(emptyGrid());
    setPlayerShots({});
    setAiShots({});
    setPlacing(0);
    setWinner(null);
    setMsg("");
    setTurn("player");
    setPhase("place");
  }

  function placeShip(r, c) {
    if (placing >= SHIPS.length) return;
    const ship = SHIPS[placing];
    const next = JSON.parse(JSON.stringify(playerGrid));
    let ok = true;
    for (let i = 0; i < ship.size; i++) {
      const pr = horiz ? r : r + i;
      const pc = horiz ? c + i : c;
      if (pr >= ROWS || pc >= COLS || next[pr][pc] !== null) { ok = false; break; }
    }
    if (!ok) { setMsg("Geçersiz konum!"); return; }
    for (let i = 0; i < ship.size; i++) {
      const pr = horiz ? r : r + i;
      const pc = horiz ? c + i : c;
      next[pr][pc] = ship.id;
    }
    setPlayerGrid(next);
    setMsg("");
    if (placing + 1 >= SHIPS.length) {
      setPlacing(SHIPS.length);
      setPhase("battle");
    } else {
      setPlacing(placing + 1);
    }
  }

  const doAIShot = useCallback((currentAiShots) => {
    let r, c, key;
    do {
      r = Math.floor(Math.random() * ROWS);
      c = Math.floor(Math.random() * COLS);
      key = `${r}-${c}`;
    } while (currentAiShots[key]);

    const hit = playerGrid[r][c] !== null ? "hit" : "miss";
    const newShots = { ...currentAiShots, [key]: hit };
    setAiShots(newShots);

    const remaining = countRemaining(playerGrid, newShots);
    if (hit === "hit" && remaining === 0) {
      setWinner("ai");
      setPhase("over");
    } else {
      setTurn("player");
      setMsg(hit === "hit" ? "⚠️ Düşman ateş etti ve GEMİNİZE İSABET ETTİ!" : "Düşman ıskaladı. Sıra sende!");
    }
  }, [playerGrid]);

  function playerShot(r, c) {
    if (turn !== "player" || phase !== "battle") return;
    const key = `${r}-${c}`;
    if (playerShots[key]) return;
    const hit = aiGrid[r][c] !== null ? "hit" : "miss";
    const newShots = { ...playerShots, [key]: hit };
    setPlayerShots(newShots);

    const remaining = countRemaining(aiGrid, newShots);
    if (hit === "hit" && remaining === 0) {
      setWinner("player");
      setPhase("over");
      setMsg("🎉 TÜM DÜŞMAN GEMİLERİ İMHA EDİLDİ!");
      return;
    }
    setMsg(hit === "hit" ? "💥 İsabet! Tekrar ateş edebilirsin." : "Iskaladı. Düşman sırası...");
    if (hit === "miss") {
      setTurn("ai");
      setTimeout(() => doAIShot(newShots), 900);
    }
  }

  const styles = {
    app: {
      minHeight: "100vh",
      background: "#020810",
      color: "#e0f7fa",
      fontFamily: "'Segoe UI', Arial, sans-serif",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "flex-start",
      paddingTop: 24,
      paddingBottom: 40,
      position: "relative",
      zIndex: 1,
    },
    title: { fontSize: 32, fontWeight: 900, letterSpacing: 3, color: "#4fc3f7", marginBottom: 4, textShadow: "0 0 20px #4fc3f7" },
    sub: { fontSize: 13, color: "#546e7a", marginBottom: 32, letterSpacing: 1 },
    btn: {
      background: "linear-gradient(135deg, #01579b, #0288d1)",
      color: "#fff",
      border: "none",
      borderRadius: 8,
      padding: "14px 40px",
      fontSize: 16,
      fontWeight: 700,
      cursor: "pointer",
      letterSpacing: 1,
      boxShadow: "0 4px 16px rgba(79,195,247,0.3)",
      marginTop: 16,
    },
    msg: { minHeight: 24, color: "#80cbc4", fontSize: 14, margin: "10px 0", textAlign: "center" },
    label: { color: "#546e7a", fontSize: 13, marginBottom: 6 },
    row: { display: "flex", gap: 24, flexWrap: "wrap", justifyContent: "center", alignItems: "flex-start", marginTop: 8 },
  };

  return (
    <div style={styles.app}>
      <style>{`
        @keyframes twinkle { from { opacity: 0.2; } to { opacity: 0.9; } }
      `}</style>
      <StarField />

      <div style={styles.title}>⚔ ASTROGAME<span style={{ color: "#ef5350" }}>WAR</span></div>
      <div style={styles.sub}>Uzay Stratejisi &amp; Filo Savaşı</div>

      {phase === "menu" && (
        <div style={{ textAlign: "center", position: "relative", zIndex: 1 }}>
          <p style={{ color: "#78909c", maxWidth: 340, lineHeight: 1.6 }}>
            Galaksi haritasına filosunu yerleştir ve düşman filolarını imha et!<br />
            <span style={{ color: "#4fc3f7" }}>{COLS}×{ROWS}</span> uzay alanında{" "}
            <span style={{ color: "#4fc3f7" }}>{SHIPS.length}</span> gemi seni bekliyor.
          </p>
          <button style={styles.btn} onClick={startPlacing}>SAVAŞA BAŞLA 🚀</button>
        </div>
      )}

      {phase === "place" && (
        <div style={{ textAlign: "center", position: "relative", zIndex: 1 }}>
          <div style={{ marginBottom: 12, color: "#4fc3f7", fontWeight: 700 }}>
            GEMİ YERLEŞTİR: {placingShip?.name} (boyut: {placingShip?.size})
          </div>
          <button
            style={{ ...styles.btn, padding: "8px 24px", marginTop: 0, fontSize: 13, marginBottom: 12 }}
            onClick={() => setHoriz(h => !h)}
          >
            {horiz ? "↔ Yatay" : "↕ Dikey"} — Döndür
          </button>
          <div style={styles.msg}>{msg}</div>
          <div
            style={{ display: "grid", gridTemplateColumns: `repeat(${COLS}, ${CELL}px)`, gap: 2, cursor: "crosshair" }}
          >
            {playerGrid.map((row, r) =>
              row.map((cell, c) => {
                const ship = SHIPS.find(s => s.id === cell);
                return (
                  <div
                    key={`${r}-${c}`}
                    onClick={() => placeShip(r, c)}
                    style={{
                      width: CELL,
                      height: CELL,
                      background: cell ? (ship?.color + "55") : "rgba(2,8,16,0.7)",
                      border: `1px solid ${cell ? (ship?.color || "#4fc3f7") : "rgba(79,195,247,0.25)"}`,
                      borderRadius: 3,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: 18,
                      transition: "background 0.15s",
                    }}
                  >
                    {cell ? "🚀" : ""}
                  </div>
                );
              })
            )}
          </div>
          <div style={{ ...styles.label, marginTop: 12 }}>
            {SHIPS.slice(0, placing).map(s => (
              <span key={s.id} style={{ marginRight: 8, color: s.color }}>✓ {s.name}</span>
            ))}
          </div>
        </div>
      )}

      {(phase === "battle" || phase === "over") && (
        <div style={{ position: "relative", zIndex: 1 }}>
          <div style={styles.msg}>{msg}</div>
          <div style={styles.row}>
            <div style={{ textAlign: "center" }}>
              <div style={{ ...styles.label, marginBottom: 8 }}>
                🛡 SENİN FİLON —{" "}
                <span style={{ color: "#4fc3f7" }}>
                  {countRemaining(playerGrid, aiShots)} / {totalShipCells}
                </span>{" "}
                kalan
              </div>
              <Grid cells={playerGrid} shots={aiShots} onShot={() => {}} disabled={true} reveal={true} />
            </div>
            <div style={{ textAlign: "center" }}>
              <div style={{ ...styles.label, marginBottom: 8 }}>
                🎯 DÜŞMAN FİLOSU —{" "}
                <span style={{ color: "#ef5350" }}>
                  {countRemaining(aiGrid, playerShots)} / {totalShipCells}
                </span>{" "}
                kalan
              </div>
              <Grid
                cells={aiGrid}
                shots={playerShots}
                onShot={playerShot}
                disabled={turn !== "player" || phase === "over"}
                reveal={phase === "over"}
              />
            </div>
          </div>
          {phase === "over" && (
            <div style={{ textAlign: "center", marginTop: 24 }}>
              <div style={{ fontSize: 22, fontWeight: 700, color: winner === "player" ? "#66bb6a" : "#ef5350", marginBottom: 8 }}>
                {winner === "player" ? "🏆 ZAFER! TÜM DÜŞMANLAR İMHA EDİLDİ!" : "💀 YENILDIN! Filo yok edildi."}
              </div>
              <button style={styles.btn} onClick={startPlacing}>Tekrar Oyna</button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
