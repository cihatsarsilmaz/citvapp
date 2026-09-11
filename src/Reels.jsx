import React, { useEffect, useRef } from "react";
import { blit, buildAtlas } from "./atlas";
import { LOW } from "./engine";

export default function Reels({ grid, lock, hits, hold, spinning, win, onPointerDown }) {
  const ref = useRef(null);
  const raf = useRef(0);
  const lastT = useRef(0);
  const shiftRef = useRef([]);
  const velRef = useRef([]);

  useEffect(() => { buildAtlas(); }, []);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const parent = canvas.parentElement;
    lastT.current = performance.now();

    function fit() {
      const dpr = Math.min(2, window.devicePixelRatio || 1);
      const boxW = Math.max(160, parent.clientWidth || 320);
      const cols = Math.max(1, (grid && grid.length) || 5);
      const rows = Math.max(1, (grid && grid[0] && grid[0].length) || 3);
      const gap = 4;
      const capH = Math.min(Math.round(window.innerHeight * 0.4), 380);
      const cellW = Math.floor((boxW - gap * (cols + 1)) / cols);
      const cellH = Math.floor((capH - gap * (rows + 1)) / rows);
      const cell = Math.max(28, Math.min(88, cellW, cellH));
      const w = gap * (cols + 1) + cell * cols;
      const h = gap * (rows + 1) + cell * rows;
      canvas.style.width = w + "px";
      canvas.style.height = h + "px";
      canvas.style.margin = "0 auto";
      canvas.width = Math.floor(w * dpr);
      canvas.height = Math.floor(h * dpr);
    }

    function draw(now) {
      const ctx = canvas.getContext("2d", { alpha: false });
      if (!ctx) return false;
      const dpr = canvas.width / Math.max(1, canvas.clientWidth);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      const W = canvas.clientWidth;
      const H = canvas.clientHeight;
      const cols = Math.max(1, (grid && grid.length) || 5);
      const rows = Math.max(1, (grid && grid[0] && grid[0].length) || 3);
      if (shiftRef.current.length !== cols) {
        shiftRef.current = Array(cols).fill(0);
        velRef.current = Array(cols).fill(0);
      }
      const dt = Math.min(0.05, Math.max(0.008, (now - lastT.current) / 1000));
      lastT.current = now;
      ctx.fillStyle = "#120206";
      ctx.fillRect(0, 0, W, H);
      const gap = 4;
      const cw = (W - gap * (cols + 1)) / cols;
      const rh = (H - gap * (rows + 1)) / rows;
      const span = rh + gap;
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = spinning ? "medium" : "high";
      let moving = false;
      for (let c = 0; c < cols; c++) {
        const locked = lock && lock[c];
        const x = gap + c * (cw + gap);
        const speed = 300 + c * 36;
        if (spinning && !locked) {
          velRef.current[c] = speed;
          shiftRef.current[c] = (shiftRef.current[c] + speed * dt) % span;
          moving = true;
        } else if (shiftRef.current[c] > 0.35) {
          velRef.current[c] = Math.max(28, velRef.current[c] * Math.exp(-dt * 8.5));
          let next = shiftRef.current[c] + velRef.current[c] * dt;
          if (next >= span) next -= span;
          const remain = span - next;
          if (remain < 16 || velRef.current[c] < 48) {
            next += remain * Math.min(1, dt * 16);
            if (span - next < 0.5) next = 0;
          }
          shiftRef.current[c] = next % span;
          if (shiftRef.current[c] > 0.35) moving = true;
        } else {
          shiftRef.current[c] = 0;
          velRef.current[c] = 0;
        }
        const shift = shiftRef.current[c];
        ctx.save();
        ctx.beginPath();
        const rr = Math.min(8, cw * 0.12);
        roundRect(ctx, x, gap, cw, H - gap * 2, rr);
        ctx.clip();
        const extra = shift > 0.2 ? 1 : 0;
        for (let r = -extra; r < rows + extra; r++) {
          const y = gap + r * span - shift;
          const key = `${c}:${r}`;
          const hit = !spinning && hits && hits.has(key);
          const held = hold && hold.has(key);
          ctx.fillStyle = hit ? "#5a2810" : held ? "#2a2210" : "#1a080c";
          ctx.fillRect(x, y, cw, rh);
          if (hit) {
            ctx.strokeStyle = "#ffe08a";
            ctx.lineWidth = 2;
            ctx.strokeRect(x + 1.5, y + 1.5, cw - 3, rh - 3);
          }
          let sym;
          if (r >= 0 && r < rows && grid[c]) sym = grid[c][r];
          else sym = LOW[(c + ((r + 8) | 0) + ((now / 110) | 0)) % LOW.length];
          if (sym) {
            const side = Math.min(cw, rh);
            const pad = Math.max(3, side * 0.1);
            const sx = x + (cw - side) / 2 + pad;
            const sy = y + (rh - side) / 2 + pad;
            blit(ctx, sym, sx, sy, side - pad * 2, side - pad * 2);
          }
        }
        ctx.restore();
        if (locked) {
          ctx.strokeStyle = "#f0d78a88";
          ctx.lineWidth = 1.5;
          ctx.strokeRect(x + 0.5, gap + 0.5, cw - 1, H - gap * 2 - 1);
        }
      }
      return moving;
    }

    function loop(now) {
      const moving = draw(now);
      if (spinning || moving) raf.current = requestAnimationFrame(loop);
    }

    fit();
    draw(performance.now());
    raf.current = requestAnimationFrame(loop);
    const ro = new ResizeObserver(() => { fit(); draw(performance.now()); });
    ro.observe(parent);
    return () => {
      cancelAnimationFrame(raf.current);
      ro.disconnect();
    };
  }, [grid, lock, hits, hold, spinning, win]);

  return <canvas ref={ref} className="reels-canvas" onPointerDown={onPointerDown} />;
}

function roundRect(ctx, x, y, w, h, r) {
  const rad = Math.max(0, Math.min(r, w / 2, h / 2));
  ctx.moveTo(x + rad, y);
  ctx.arcTo(x + w, y, x + w, y + h, rad);
  ctx.arcTo(x + w, y + h, x, y + h, rad);
  ctx.arcTo(x, y + h, x, y, rad);
  ctx.arcTo(x, y, x + w, y, rad);
  ctx.closePath();
}
