import { CANDY } from "./candy";

let ctx;
let master;
let spinTimer;
let ambient;
let muted = false;
const cache = {};
let candyBuf = null;
let candyReady = false;

export function setMuted(v) {
  muted = !!v;
  if (muted) {
    stopSpinLoop();
    stopAmbient();
  }
}
export function isMuted() { return muted; }
export function wakeAudio() {
  try { getCtx(); loadCandy(); } catch {}
}

function getCtx() {
  if (!ctx) {
    ctx = new (window.AudioContext || window.webkitAudioContext)();
    master = ctx.createGain();
    master.gain.value = 0.72;
    master.connect(ctx.destination);
  }
  if (ctx.state === "suspended") ctx.resume();
  return ctx;
}
function dest() { getCtx(); return master; }

function loadCandy() {
  if (candyReady || candyBuf) return;
  candyReady = true;
  try {
    const ac = getCtx();
    const bin = atob(CANDY.split(",")[1]);
    const arr = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) arr[i] = bin.charCodeAt(i);
    ac.decodeAudioData(arr.buffer, (b) => { candyBuf = b; }, () => {});
  } catch {}
}

/** Yumuşak akustik vuruş — gürültü/tırmalama yok */
function hit(kind) {
  if (kind.startsWith("win:")) return winBuffer(kind);
  const ac = getCtx();
  const rate = ac.sampleRate;
  const sec =
    kind === "candy" ? 0.12 :
    kind === "voice" ? 0.22 :
    kind === "soft" ? 0.16 :
    kind === "win" ? 0.28 :
    kind === "body" ? 0.14 :
    kind === "spin" ? 0.05 :
    kind === "bonus" ? 0.42 : 0.1;
  const n = Math.floor(rate * sec);
  const buf = ac.createBuffer(1, n, rate);
  const d = buf.getChannelData(0);
  for (let i = 0; i < n; i++) {
    const t = i / rate;
    let s = 0;
    if (kind === "spin") {
      const env = Math.exp(-t * 48);
      s = Math.sin(2 * Math.PI * 160 * t) * 0.16;
      d[i] = s * env * 0.22;
    } else if (kind === "bonus") {
      const env = Math.exp(-t * 6) * Math.min(1, t * 8);
      s = Math.sin(2 * Math.PI * (220 + t * 180) * t) * 0.28 +
          Math.sin(2 * Math.PI * 330 * t) * 0.16;
      d[i] = s * env * 0.45;
    } else if (kind === "candy") {
      const env = Math.exp(-t * 22);
      s = Math.sin(2 * Math.PI * 880 * t) * 0.35 +
          Math.sin(2 * Math.PI * 1320 * t) * 0.18;
      d[i] = s * env * 0.5;
    } else if (kind === "soft") {
      const env = Math.exp(-t * 14);
      s = Math.sin(2 * Math.PI * 196 * t) * 0.4 +
          Math.sin(2 * Math.PI * 294 * t) * 0.15;
      d[i] = s * env * 0.35;
    } else if (kind === "voice") {
      const env = Math.exp(-t * 8);
      s = Math.sin(2 * Math.PI * 180 * t) * 0.35 +
          Math.sin(2 * Math.PI * 270 * t) * 0.2 +
          Math.sin(2 * Math.PI * 360 * t) * 0.08;
      d[i] = s * env * 0.4;
    } else if (kind === "win") {
      const env = Math.exp(-t * 9);
      s = Math.sin(2 * Math.PI * 523 * t) * 0.3 +
          Math.sin(2 * Math.PI * 659 * t) * 0.22 +
          Math.sin(2 * Math.PI * 784 * t) * 0.15;
      d[i] = s * env * 0.48;
    } else if (kind === "metal") {
      const env = Math.exp(-t * 18);
      s = Math.sin(2 * Math.PI * 520 * t) * 0.28 +
          Math.sin(2 * Math.PI * 780 * t) * 0.12;
      d[i] = s * env * 0.32;
    } else if (kind === "wood") {
      const env = Math.exp(-t * 28);
      s = Math.sin(2 * Math.PI * 140 * t) * 0.45;
      d[i] = s * env * 0.28;
    } else {
      const env = Math.exp(-t * 16);
      s = Math.sin(2 * Math.PI * 200 * t) * 0.4 +
          Math.sin(2 * Math.PI * 100 * t) * 0.2;
      d[i] = s * env * 0.36;
    }
  }
  return buf;
}

function bufferOf(kind) {
  if (kind === "candy" && candyBuf) return candyBuf;
  if (!cache[kind]) cache[kind] = hit(kind);
  return cache[kind];
}

function play(kind, gain = 0.5, start = 0) {
  if (muted) return;
  try {
    loadCandy();
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
  snap: "wood", pad: "soft", howl: "body", crackle: "soft", wood: "wood",
  bell: "metal", creak: "wood", blip: "soft", steel: "metal", ice: "soft",
  roar: "body", toot: "soft", clack: "wood",
};
function kindOf(name) { return MAP[name] || "soft"; }

// Her oyunun kendi tınısı var (kits.js -> voice). Kazanç arpeji o tınıyla
// çalınır; 18 oyun aynı "win" sesini çalmaz.
const WIN_TONES = {
  candy: [1046.5, 1318.5, 1568.0],
  metal: [880.0, 1108.7, 1318.5],
  wood: [392.0, 523.3, 659.3],
  body: [220.0, 277.2, 329.6],
  soft: [523.3, 659.3, 784.0],
};

function winVoiceKind(voice) {
  const base = kindOf(voice);
  return WIN_TONES[base] ? base : "soft";
}

function winKind(voice, tier) {
  const t = Math.max(1, Math.min(3, Number(tier) || 2));
  return `win:${winVoiceKind(voice)}:${t}`;
}

function winBuffer(kind) {
  const [, fam, tierText] = kind.split(":");
  const tier = Number(tierText) || 2;
  const notes = WIN_TONES[fam] || WIN_TONES.soft;
  const ac = getCtx();
  const rate = ac.sampleRate;
  const step = tier >= 3 ? 0.085 : 0.075;
  const seq = tier >= 3 ? [...notes, notes[notes.length - 1] * 1.5] : notes;
  const n = Math.floor(rate * (step * seq.length + 0.5));
  const buf = ac.createBuffer(1, n, rate);
  const d = buf.getChannelData(0);
  const decay = fam === "body" ? 7 : 9;
  const shimmer = fam === "metal" || fam === "candy" ? 0.09 : 0;
  for (let i = 0; i < n; i += 1) {
    const t = i / rate;
    let s = 0;
    for (let k = 0; k < seq.length; k += 1) {
      const lt = t - k * step;
      if (lt < 0) continue;
      const env = Math.exp(-lt * decay);
      s += Math.sin(2 * Math.PI * seq[k] * lt) * env * 0.26;
      if (shimmer) s += Math.sin(4 * Math.PI * seq[k] * lt) * env * shimmer;
    }
    d[i] = Math.max(-1, Math.min(1, s));
  }
  return buf;
}

export function stopTheme() {}
export function playTheme() { play("soft", 0.22); }

export function startAmbient(freq = 110) {
  if (muted) return;
  stopAmbient();
  try {
    const ac = getCtx();
    const now = ac.currentTime;
    const o = ac.createOscillator();
    const g = ac.createGain();
    o.type = "sine";
    o.frequency.setValueAtTime(Math.max(80, freq * 0.4), now);
    g.gain.setValueAtTime(0.0001, now);
    g.gain.linearRampToValueAtTime(0.02, now + 1.2);
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
    ambient.g.gain.linearRampToValueAtTime(0.0001, t + 0.4);
    ambient.o.stop(t + 0.45);
  } catch {}
  ambient = null;
}

export function playSpinLoop(voice = "clack", bonus = false) {
  if (muted) return;
  stopSpinLoop();
  loadCandy();
  const gap = bonus ? 420 : 480;
  const gain = bonus ? 0.10 : 0.07;
  const tick = () => play("spin", gain);
  tick();
  spinTimer = setInterval(tick, gap);
}
export function stopSpinLoop() {
  if (spinTimer) { clearInterval(spinTimer); spinTimer = null; }
}

export function playClash(sym, voice = "clack") {
  const k = kindOf(voice);
  play(k === "wood" || k === "metal" ? "soft" : k, k === "candy" ? 0.48 : 0.36);
}
export function playWin(tier = 1, voice = "clack") {
  play(winKind(voice, tier), 0.58);
  const base = winVoiceKind(voice);
  if (base === "candy") play("candy", 0.3, 0.1);
  else if (base === "metal") play("metal", 0.2, 0.1);
  else play("soft", 0.2, 0.12);
}
export function playMiss(voice = "clack") { play("soft", 0.14); }
export function playClick() { play("soft", 0.22); }
export function playBonusIn(voice = "clack") {
  play("bonus", 0.52);
  play(winKind(voice, 2), 0.38, 0.12);
  play(kindOf(voice) === "candy" ? "candy" : "soft", 0.32, 0.22);
}
export function playJack(voice = "clack") {
  play(winKind(voice, 3), 0.6);
  play("soft", 0.32, 0.12);
}
export function playExtra(voice = "clack") {
  play("soft", 0.32);
}

export function playAnticipate() {
  play("soft", 0.18);
}

export function playCharacter(voice = "clack", mood = "win") {
  const base = kindOf(voice);
  if (base === "candy") {
    play("candy", 0.5);
    play("candy", 0.3, 0.1);
    return;
  }
  if (mood === "angry" || mood === "c") {
    play("body", 0.42);
    play("soft", 0.28, 0.08);
  } else if (mood === "bonus") {
    play("bonus", 0.45);
    play("voice", 0.32, 0.1);
    play("soft", 0.22, 0.18);
  } else {
    play("voice", 0.32);
    play("soft", 0.24, 0.08);
  }
}
