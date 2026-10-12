let ctx;
let master;
let spinTimer;
let muted = false;
const VOL = 1.6;
const cache = {};

export function setMuted(v) {
  muted = !!v;
  if (muted) stopSpinLoop();
}
export function isMuted() {
  return muted;
}
export function wakeAudio() {
  try { getCtx(); } catch {}
}

function getCtx() {
  if (!ctx) {
    ctx = new (window.AudioContext || window.webkitAudioContext)();
    master = ctx.createGain();
    master.gain.value = 0.7;
    master.connect(ctx.destination);
  }
  if (ctx.state === "suspended") ctx.resume();
  return ctx;
}
function dest() {
  getCtx();
  return master;
}

function make(kind) {
  const ac = getCtx();
  const rate = ac.sampleRate;
  const sec = kind === "thunder" || kind === "roar" ? 0.32 : kind === "glass" || kind === "ice" ? 0.22 : 0.16;
  const n = Math.floor(rate * sec);
  const buf = ac.createBuffer(1, n, rate);
  const d = buf.getChannelData(0);
  for (let i = 0; i < n; i++) {
    const t = i / rate;
    const env = Math.exp(-t * (kind === "glass" || kind === "ice" ? 8 : kind === "thunder" || kind === "roar" ? 6 : 12));
    let s = 0;
    if (kind === "coin") {
      s = Math.sin(2 * Math.PI * 880 * t) * 0.5 +
          Math.sin(2 * Math.PI * 1320 * t) * 0.35 +
          Math.sin(2 * Math.PI * 1760 * t) * 0.15;
      if (t < 0.008) s += (Math.random() * 2 - 1) * 0.15;
    } else if (kind === "chime" || kind === "bell") {
      s = Math.sin(2 * Math.PI * 1046 * t) * 0.45 +
          Math.sin(2 * Math.PI * 1568 * t) * 0.3 +
          Math.sin(2 * Math.PI * 2093 * t) * 0.15;
    } else if (kind === "thunder" || kind === "roar") {
      s = Math.sin(2 * Math.PI * 70 * t) * 0.6 +
          Math.sin(2 * Math.PI * 110 * t) * 0.3;
      if (t < 0.04) s += (Math.random() * 2 - 1) * Math.exp(-t * 40) * 0.25;
    } else if (kind === "glass" || kind === "ice") {
      s = Math.sin(2 * Math.PI * 1760 * t) * 0.5 +
          Math.sin(2 * Math.PI * 2340 * t) * 0.3 +
          Math.sin(2 * Math.PI * 3520 * t) * 0.12;
    } else if (kind === "low") {
      s = Math.sin(2 * Math.PI * 140 * t) * 0.7 + Math.sin(2 * Math.PI * 210 * t) * 0.2;
    } else if (kind === "snap" || kind === "clack" || kind === "steel") {
      s = Math.sin(2 * Math.PI * 380 * t) * (t < 0.012 ? 1 : 0.15);
      if (t < 0.006) s += (Math.random() * 2 - 1) * 0.2;
    } else if (kind === "blip") {
      s = Math.sin(2 * Math.PI * 1480 * t) * 0.7 + Math.sin(2 * Math.PI * 2220 * t) * 0.2;
    } else if (kind === "howl") {
      s = Math.sin(2 * Math.PI * 180 * t) * 0.6 + Math.sin(2 * Math.PI * 270 * t) * 0.25;
    } else if (kind === "crackle") {
      s = Math.sin(2 * Math.PI * 340 * t) * (i % 50 < 6 ? 0.8 : 0.1);
    } else if (kind === "wood" || kind === "creak") {
      s = Math.sin(2 * Math.PI * 220 * t) * 0.6 + Math.sin(2 * Math.PI * 330 * t) * 0.2;
    } else if (kind === "toot") {
      s = Math.sin(2 * Math.PI * 520 * t) * 0.55 + Math.sin(2 * Math.PI * 780 * t) * 0.25;
    } else {
      s = Math.sin(2 * Math.PI * 440 * t) * 0.6;
    }
    d[i] = s * env * 0.5;
  }
  return buf;
}

function bufferOf(kind) {
  if (!cache[kind]) cache[kind] = make(kind);
  return cache[kind];
}

function play(kind, gain = 0.65, start = 0) {
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

const VOICE = {
  chime: "chime", thunder: "thunder", glass: "glass", low: "low", coin: "coin",
  snap: "snap", pad: "pad", howl: "howl", crackle: "crackle", wood: "wood",
  bell: "bell", creak: "creak", blip: "blip", steel: "steel", ice: "ice",
  roar: "roar", toot: "toot", clack: "clack",
};
function kindOf(name) {
  return VOICE[name] || "clack";
}

export function stopTheme() {}
export function playTheme(freqs) {
  play("chime", 0.45);
}

export function playSpinLoop(voice = "clack", bonus = false) {
  if (muted) return;
  stopSpinLoop();
  const kind = kindOf(voice);
  const gap = bonus ? 150 : 210;
  const tick = () => play(kind, bonus ? 0.5 : 0.35);
  tick();
  spinTimer = setInterval(tick, gap);
}
export function stopSpinLoop() {
  if (spinTimer) {
    clearInterval(spinTimer);
    spinTimer = null;
  }
}

export function playClash(sym, voice = "clack") {
  play(kindOf(voice), 0.6);
}
export function playWin(tier = 1, voice = "clack") {
  const k = kindOf(voice);
  play(k, 0.65);
  play(k, 0.5, 0.09);
  if (tier > 1) play("coin", 0.45, 0.16);
}
export function playMiss(voice = "clack") {
  play(kindOf(voice), 0.22);
}
export function playClick() {
  play("clack", 0.35);
}
export function playBonusIn(voice = "clack") {
  const k = kindOf(voice);
  play(k, 0.75);
  play("chime", 0.45, 0.11);
  play("coin", 0.4, 0.22);
}
export function playJack(voice = "clack") {
  play(kindOf(voice), 0.75);
  play("coin", 0.55, 0.09);
  play("chime", 0.45, 0.18);
}
export function playExtra(voice = "clack") {
  play(kindOf(voice), 0.5);
  play("coin", 0.35, 0.07);
}
