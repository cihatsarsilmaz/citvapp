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
      const w = parent.clientWidth || 320;
      const h = Math.max(168, Math.round(w * 0.62));
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
        ctx.rect(x, gap, cw, H - gap * 2);
        ctx.clip();
        const speed = 420 + c * 55;
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
            ctx.strokeRect(x + 1, y + 1, cw - 2, rh - 2);
          }
          let sym;
          if (r >= 0 && r < rows && grid[c]) sym = grid[c][r];
          else sym = LOW[(c + ((r + 8) | 0) + (Math.floor(t * 9) % 7)) % LOW.length];
          if (sym) blit(ctx, sym, x + 4, y + 4, cw - 8, rh - 8);
        }
        ctx.restore();
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
