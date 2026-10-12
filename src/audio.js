let ctx;
let master;
let spinTimer;
let muted = false;
const cache = {};

export function setMuted(v) {
  muted = !!v;
  if (muted) stopSpinLoop();
}
export function isMuted() { return muted; }
export function wakeAudio() { try { getCtx(); } catch {} }

function getCtx() {
  if (!ctx) {
    ctx = new (window.AudioContext || window.webkitAudioContext)();
    master = ctx.createGain();
    master.gain.value = 0.85;
    master.connect(ctx.destination);
  }
  if (ctx.state === "suspended") ctx.resume();
  return ctx;
}
function dest() { getCtx(); return master; }

function hit(kind) {
  const ac = getCtx();
  const rate = ac.sampleRate;
  const sec = kind === "body" ? 0.09 : 0.055;
  const n = Math.floor(rate * sec);
  const buf = ac.createBuffer(1, n, rate);
  const d = buf.getChannelData(0);
  const f = kind === "wood" ? 180 : kind === "metal" ? 420 : kind === "soft" ? 140 : 260;
  for (let i = 0; i < n; i++) {
    const t = i / rate;
    const env = Math.exp(-t * 48);
    const body = Math.sin(2 * Math.PI * f * t);
    const click = t < 0.004 ? (Math.random() * 2 - 1) * 0.35 : 0;
    d[i] = (body * 0.55 + click) * env;
  }
  return buf;
}

function bufferOf(kind) {
  if (!cache[kind]) cache[kind] = hit(kind);
  return cache[kind];
}

function play(kind, gain = 0.7, start = 0) {
  if (muted) return;
  try {
    const ac = getCtx();
    const src = ac.createBufferSource();
    src.buffer = bufferOf(kind);
    const g = ac.createGain();
    g.gain.value = gain;
    src.connect(g);
    g.connect(dest());
    src.start(ac.currentTime + start);
  } catch {}
}

const MAP = {
  chime: "soft", thunder: "body", glass: "metal", low: "body", coin: "metal",
  snap: "wood", pad: "soft", howl: "body", crackle: "wood", wood: "wood",
  bell: "metal", creak: "wood", blip: "metal", steel: "metal", ice: "metal",
  roar: "body", toot: "soft", clack: "wood",
};
function kindOf(name) { return MAP[name] || "wood"; }

export function stopTheme() {}
export function playTheme() { play("soft", 0.4); }

export function playSpinLoop(voice = "clack", bonus = false) {
  if (muted) return;
  stopSpinLoop();
  const k = kindOf(voice);
  const gap = bonus ? 120 : 160;
  const tick = () => play(k, bonus ? 0.55 : 0.4);
  tick();
  spinTimer = setInterval(tick, gap);
}
export function stopSpinLoop() {
  if (spinTimer) { clearInterval(spinTimer); spinTimer = null; }
}

export function playClash(sym, voice = "clack") { play(kindOf(voice), 0.75); }
export function playWin(tier = 1, voice = "clack") {
  play(kindOf(voice), 0.8);
  play("metal", 0.55, 0.06);
  if (tier > 1) play("wood", 0.5, 0.12);
}
export function playMiss(voice = "clack") { play("soft", 0.28); }
export function playClick() { play("wood", 0.5); }
export function playBonusIn(voice = "clack") {
  play("body", 0.7);
  play("metal", 0.55, 0.07);
  play("wood", 0.5, 0.14);
}
export function playJack(voice = "clack") {
  play("body", 0.75);
  play("metal", 0.6, 0.06);
  play("wood", 0.5, 0.12);
}
export function playExtra(voice = "clack") {
  play(kindOf(voice), 0.6);
  play("metal", 0.4, 0.05);
}
