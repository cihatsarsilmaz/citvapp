import { WILD, STAR } from "./paytable";
import { LOW } from "./engine";
import { GAMES } from "./games";

export const CELL = 128;
export const PAD = 8;
export const BLEED = 2;

const KEYS = [...new Set([WILD, STAR, ...LOW, ...GAMES.map((g) => g.emoji)])];

let pack = null;

function slot(i) {
  const cols = 8;
  const col = i % cols;
  const row = Math.floor(i / cols);
  const stride = CELL + PAD;
  return { x: col * stride + BLEED, y: row * stride + BLEED, w: CELL - BLEED * 2, h: CELL - BLEED * 2 };
}

export function buildAtlas() {
  if (pack) return pack;
  const cols = 8;
  const rows = Math.ceil(KEYS.length / cols);
  const w = cols * (CELL + PAD);
  const h = rows * (CELL + PAD);
  const cnv = document.createElement("canvas");
  cnv.width = w;
  cnv.height = h;
  const ctx = cnv.getContext("2d", { alpha: true });
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.font = `${Math.floor(CELL * 0.62)}px "Apple Color Emoji","Segoe UI Emoji","Noto Color Emoji",sans-serif`;
  const map = {};
  KEYS.forEach((k, i) => {
    const r = slot(i);
    ctx.clearRect(r.x - BLEED, r.y - BLEED, CELL, CELL);
    ctx.fillText(k, r.x + r.w / 2, r.y + r.h / 2 + 4);
    map[k] = r;
  });
  pack = { canvas: cnv, map, size: CELL };
  return pack;
}

export function blit(ctx, sym, dx, dy, dw, dh) {
  const p = buildAtlas();
  const r = p.map[sym] || p.map[LOW[0]];
  if (!r) return;
  ctx.drawImage(p.canvas, r.x, r.y, r.w, r.h, dx, dy, dw, dh);
}
