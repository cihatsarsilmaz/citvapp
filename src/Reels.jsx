import React, { useEffect, useRef } from "react";
import { blit, buildAtlas } from "./atlas";
import { LOW } from "./engine";

export default function Reels({ grid, lock, hits, hold, spinning, win, onPointerDown }) {
  const ref = useRef(null);
  const raf = useRef(0);
  const start = useRef(0);

  useEffect(() => { buildAtlas(); }, []);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const parent = canvas.parentElement;
    start.current = performance.now();

    function fit() {
      const dpr = Math.min(2, window.devicePixelRatio || 1);
      const w = Math.max(160, parent.clientWidth || 320);
      const cols = Math.max(1, (grid && grid.length) || 5);
      const rows = Math.max(1, (grid && grid[0] && grid[0].length) || 3);
      const gap = 4;
      const cell = Math.min(96, Math.floor((w - gap * (cols + 1)) / cols));
      let h = gap * (rows + 1) + cell * rows;
      const cap = Math.min(Math.round(window.innerHeight * 0.42), 420);
      h = Math.max(156, Math.min(h, cap));
      canvas.style.width = w + "px";
      canvas.style.height = h + "px";
      canvas.width = Math.floor(w * dpr);
      canvas.height = Math.floor(h * dpr);
    }

    function draw(now) {
      const ctx = canvas.getContext("2d", { alpha: false });
      if (!ctx) return;
      const dpr = canvas.width / Math.max(1, canvas.clientWidth);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      const W = canvas.clientWidth;
      const H = canvas.clientHeight;
      const cols = Math.max(1, (grid && grid.length) || 5);
      const rows = Math.max(1, (grid && grid[0] && grid[0].length) || 3);
      ctx.fillStyle = "#120206";
      ctx.fillRect(0, 0, W, H);
      const gap = 4;
      const cw = (W - gap * (cols + 1)) / cols;
      const rh = (H - gap * (rows + 1)) / rows;
      const t = (now - start.current) / 1000;
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = spinning ? "medium" : "high";
      for (let c = 0; c < cols; c++) {
        const locked = lock && lock[c];
        const x = gap + c * (cw + gap);
        ctx.save();
        ctx.beginPath();
        const rr = Math.min(8, cw * 0.12);
        roundRect(ctx, x, gap, cw, H - gap * 2, rr);
        ctx.clip();
        const speed = 360 + c * 48;
        const shift = spinning && !locked ? (t * speed) % (rh + gap) : 0;
        const extra = spinning && !locked ? 1 : 0;
        for (let r = -extra; r < rows + extra; r++) {
          const y = gap + r * (rh + gap) + (spinning && !locked ? -shift : 0);
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
          else sym = LOW[(c + ((r + 8) | 0) + (Math.floor(t * 9) % 7)) % LOW.length];
          if (sym) {
            const pad = Math.max(3, Math.min(cw, rh) * 0.08);
            blit(ctx, sym, x + pad, y + pad, cw - pad * 2, rh - pad * 2);
          }
        }
        ctx.restore();
        if (locked) {
          ctx.strokeStyle = "#f0d78a88";
          ctx.lineWidth = 1.5;
          ctx.strokeRect(x + 0.5, gap + 0.5, cw - 1, H - gap * 2 - 1);
        }
      }
    }

    function loop(now) {
      draw(now);
      if (spinning) raf.current = requestAnimationFrame(loop);
    }

    fit();
    draw(performance.now());
    if (spinning) raf.current = requestAnimationFrame(loop);
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
