import React, { useEffect, useRef } from "react";
import { blit, buildAtlas } from "./atlas";

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
        const bounce = spinning && !locked ? Math.sin(t * 18 + c * 0.7) * 5 : 0;
        const x = gap + c * (cw + gap);
        for (let r = 0; r < rows; r++) {
          const y = gap + r * (rh + gap) + bounce;
          const key = `${c}:${r}`;
          const hit = hits && hits.has(key);
          const held = hold && hold.has(key);
          ctx.fillStyle = hit ? "#5a2810" : held ? "#2a2210" : "#1a080c";
          ctx.fillRect(x, y, cw, rh);
          if (hit) {
            ctx.strokeStyle = "#ffe08a";
            ctx.lineWidth = 2;
            ctx.strokeRect(x + 1, y + 1, cw - 2, rh - 2);
          }
          const sym = grid[c] && grid[c][r];
          if (sym) blit(ctx, sym, x + 4, y + 4, cw - 8, rh - 8);
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
