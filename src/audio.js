let ctx;
let master;
let spinTimer;
let ambient;
let muted = false;
const cache = {};

export function setMuted(v) {
  muted = !!v;
  if (muted) {
    stopSpinLoop();
    stopAmbient();
  }
}
export function isMuted() { return muted; }
export function wakeAudio() { try { getCtx(); } catch {} }

function getCtx() {
  if (!ctx) {
    ctx = new (window.AudioContext || window.webkitAudioContext)();
    master = ctx.createGain();
    master.gain.value = 0.8;
    master.connect(ctx.destination);
  }
  if (ctx.state === "suspended") ctx.resume();
  return ctx;
}
function dest() { getCtx(); return master; }

function hit(kind) {
  const ac = getCtx();
  const rate = ac.sampleRate;
  const sec = kind === "candy" ? 0.07 : kind === "body" ? 0.08 : kind === "voice" ? 0.18 : 0.05;
  const n = Math.floor(rate * sec);
  const buf = ac.createBuffer(1, n, rate);
  const d = buf.getChannelData(0);
  for (let i = 0; i < n; i++) {
    const t = i / rate;
    let s = 0;
    if (kind === "candy") {
      const env = Math.exp(-t * 36);
      s = Math.sin(2 * Math.PI * 1046 * t) * 0.45 + Math.sin(2 * Math.PI * 1568 * t) * 0.22;
      d[i] = s * env * 0.45;
    } else {
      const env = Math.exp(-t * (kind === "voice" ? 10 : 50));
      const f = kind === "wood" ? 180 : kind === "metal" ? 420 : kind === "soft" ? 160 : kind === "voice" ? 220 : 260;
      const body = Math.sin(2 * Math.PI * f * t);
      const click = t < 0.003 ? (Math.random() * 2 - 1) * 0.18 : 0;
      d[i] = (body * 0.5 + click) * env;
    }
  }
  return buf;
}

function bufferOf(kind) {
  if (!cache[kind]) cache[kind] = hit(kind);
  return cache[kind];
}

function play(kind, gain = 0.6, start = 0) {
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
  chime: "candy", thunder: "body", glass: "metal", low: "body", coin: "metal",
  snap: "wood", pad: "soft", howl: "body", crackle: "wood", wood: "wood",
  bell: "metal", creak: "wood", blip: "metal", steel: "metal", ice: "metal",
  roar: "body", toot: "soft", clack: "wood",
};
function kindOf(name) { return MAP[name] || "wood"; }

export function stopTheme() {}
export function playTheme() { play("soft", 0.3); }

export function startAmbient(freq = 110) {
  if (muted) return;
  stopAmbient();
  try {
    const ac = getCtx();
    const now = ac.currentTime;
    const o = ac.createOscillator();
    const g = ac.createGain();
    o.type = "sine";
    o.frequency.setValueAtTime(Math.max(70, freq * 0.45), now);
    g.gain.setValueAtTime(0.0001, now);
    g.gain.linearRampToValueAtTime(0.028, now + 0.9);
    o.connect(g);
    g.connect(dest());
    o.start(now);
    ambient = { o, g };
  } catch {}
}
export function stopAmbient() {
  if (!ambient) return;
  try {
    const ac = getCtx();
    const t = ac.currentTime;
    ambient.g.gain.linearRampToValueAtTime(0.0001, t + 0.3);
    ambient.o.stop(t + 0.35);
  } catch {}
  ambient = null;
}

export function playSpinLoop(voice = "clack", bonus = false) {
  if (muted) return;
  stopSpinLoop();
  const k = kindOf(voice);
  const gap = bonus ? 140 : 190;
  const gain = k === "candy" ? (bonus ? 0.42 : 0.32) : bonus ? 0.48 : 0.36;
  const tick = () => play(k, gain);
  tick();
  spinTimer = setInterval(tick, gap);
}
export function stopSpinLoop() {
  if (spinTimer) { clearInterval(spinTimer); spinTimer = null; }
}

export function playClash(sym, voice = "clack") {
  const k = kindOf(voice);
  play(k, k === "candy" ? 0.5 : 0.68);
}
export function playWin(tier = 1, voice = "clack") {
  const k = kindOf(voice);
  play(k, 0.6);
  if (k !== "candy") play("metal", 0.42, 0.06);
  else play("candy", 0.4, 0.07);
}
export function playMiss(voice = "clack") { play("soft", 0.2); }
export function playClick() { play("wood", 0.4); }
export function playBonusIn(voice = "clack") {
  const k = kindOf(voice);
  play(k, 0.55);
  play(k === "candy" ? "candy" : "metal", 0.4, 0.08);
}
export function playJack(voice = "clack") {
  play(kindOf(voice), 0.6);
  play("metal", 0.45, 0.07);
}
export function playExtra(voice = "clack") {
  play(kindOf(voice), 0.48);
}

export function playAnticipate() {
  play("soft", 0.22);
}

export function playCharacter(voice = "clack", mood = "win") {
  const base = kindOf(voice);
  if (base === "candy") {
    play("candy", 0.5);
    play("candy", 0.35, 0.08);
    return;
  }
  if (mood === "angry" || mood === "c") {
    play("body", 0.7);
    play("wood", 0.5, 0.06);
  } else if (mood === "bonus") {
    play("voice", 0.45);
    play(base, 0.5, 0.08);
  } else {
    play("voice", 0.4);
    play(base, 0.45, 0.07);
  }
}
