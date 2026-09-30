import { GAMES } from "./games.js";
import { KITS } from "./kits.js";

const NEED_GAME = ["id", "name", "emoji", "character", "color", "freq", "motion", "fx", "sky"];
const NEED_KIT = ["load", "ms", "extra", "spin", "cols", "rows", "jack", "voice"];
const SKINS = ["sweet", "olympus", "nova", "reef", "rich", "west", "mystic", "wolf", "flame", "forest", "pharaoh", "pirate", "neon", "samurai", "ice", "dragon", "circus", "vault"];

export function audit() {
  const fail = [];
  if (GAMES.length < 12) fail.push("oyun sayisi zayif: " + GAMES.length);
  const ids = new Set();
  for (const g of GAMES) {
    if (ids.has(g.id)) fail.push("cift id " + g.id);
    ids.add(g.id);
    for (const k of NEED_GAME) if (g[k] == null || g[k] === "") fail.push(g.id + " eksik " + k);
    if (!Array.isArray(g.freq) || g.freq.length < 3) fail.push(g.id + " freq zayif");
    if (!KITS[g.id]) fail.push(g.id + " kit yok");
    if (!SKINS.includes(g.id)) fail.push(g.id + " skin yok");
  }
  for (const id of Object.keys(KITS)) {
    if (!ids.has(id)) fail.push("kit yetim " + id);
    const kit = KITS[id];
    for (const k of NEED_KIT) if (kit[k] == null) fail.push(id + " kit eksik " + k);
    if (kit.cols < 3 || kit.cols > 6 || kit.rows < 3 || kit.rows > 4) fail.push(id + " duzen sinir disi");
    if (kit.ms < 600 || kit.ms > 1400) fail.push(id + " gate ms zayif");
  }
  return { ok: fail.length === 0, fail };
}

export function assertAudit() {
  const r = audit();
  if (!r.ok) {
    const msg = "CITV denetci reddetti:\n" + r.fail.join("\n");
    throw new Error(msg);
  }
  return r;
}
