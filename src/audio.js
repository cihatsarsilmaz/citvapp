let ctx;
let current;
let spinNoise;
let muted = false;

export function setMuted(v) {
  muted = !!v;
  if (muted) {
    stopTheme();
    stopSpinLoop();
  }
}
export function isMuted() {
  return muted;
}

function getCtx() {
  if (!ctx) ctx = new (window.AudioContext || window.webkitAudioContext)();
  if (ctx.state === "suspended") ctx.resume();
  return ctx;
}

function tone({ freq = 440, type = "square", dur = 0.12, gain = 0.07, slide = 0, start = 0 }) {
  if (muted) return;
  const ac = getCtx();
  const t = ac.currentTime + start;
  const o = ac.createOscillator();
  const g = ac.createGain();
  o.type = type;
  o.frequency.setValueAtTime(freq, t);
  if (slide) o.frequency.exponentialRampToValueAtTime(Math.max(40, freq + slide), t + dur);
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(gain, t + 0.01);
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  o.connect(g);
  g.connect(ac.destination);
  o.start(t);
  o.stop(t + dur + 0.02);
}

const VOICE = {
  chime: { thud: 190, snap: 880, type: "sine" },
  thunder: { thud: 70, snap: 420, type: "sawtooth" },
  glass: { thud: 240, snap: 1320, type: "sine" },
  low: { thud: 88, snap: 220, type: "triangle" },
  coin: { thud: 160, snap: 980, type: "square" },
  snap: { thud: 140, snap: 700, type: "square" },
  pad: { thud: 180, snap: 560, type: "triangle" },
  howl: { thud: 90, snap: 310, type: "sawtooth" },
  crackle: { thud: 150, snap: 640, type: "sawtooth" },
  wood: { thud: 120, snap: 280, type: "triangle" },
  bell: { thud: 200, snap: 1040, type: "sine" },
  creak: { thud: 100, snap: 180, type: "sawtooth" },
  blip: { thud: 260, snap: 1180, type: "square" },
  steel: { thud: 210, snap: 1600, type: "square" },
  ice: { thud: 300, snap: 1400, type: "sine" },
  roar: { thud: 60, snap: 180, type: "sawtooth" },
  toot: { thud: 250, snap: 520, type: "triangle" },
  clack: { thud: 170, snap: 400, type: "square" },
};

export function stopTheme() {
  if (current) {
    try { current.stop(); } catch {}
    current = null;
  }
}

export function playTheme(freqs, loop = false) {
  if (muted || !freqs) return;
  stopTheme();
  const ac = getCtx();
  const now = ac.currentTime;
  const master = ac.createGain();
  master.gain.setValueAtTime(0.0001, now);
  master.gain.exponentialRampToValueAtTime(0.07, now + 0.05);
  master.connect(ac.destination);
  const osc = ac.createOscillator();
  osc.type = "triangle";
  osc.frequency.setValueAtTime(freqs[0], now);
  freqs.forEach((f, i) => osc.frequency.setValueAtTime(f, now + i * 0.22));
  osc.connect(master);
  osc.start(now);
  const dur = freqs.length * 0.22 + (loop ? 0.4 : 0.25);
  master.gain.setValueAtTime(0.07, now + dur - 0.12);
  master.gain.exponentialRampToValueAtTime(0.0001, now + dur);
  osc.stop(now + dur);
  current = osc;
  if (loop) {
    osc.onended = () => {
      if (current === osc && !muted) playTheme(freqs, true);
    };
  }
}

export function playSpinLoop(base = 90) {
  if (muted) return;
  stopSpinLoop();
  const ac = getCtx();
  const now = ac.currentTime;
  const o = ac.createOscillator();
  const g = ac.createGain();
  o.type = "sawtooth";
  o.frequency.setValueAtTime(Math.max(55, base * 0.35), now);
  o.frequency.linearRampToValueAtTime(Math.max(90, base * 0.55), now + 0.4);
  g.gain.setValueAtTime(0.022, now);
  o.connect(g);
  g.connect(ac.destination);
  o.start(now);
  spinNoise = { o, g };
}

export function stopSpinLoop() {
  if (!spinNoise) return;
  try {
    const ac = getCtx();
    spinNoise.g.gain.exponentialRampToValueAtTime(0.0001, ac.currentTime + 0.05);
    spinNoise.o.stop(ac.currentTime + 0.06);
  } catch {}
  spinNoise = null;
}

export const SYMBOL_SFX = {
  "🎰": { play: () => { tone({ freq: 220, type: "square", dur: 0.08, gain: 0.06 }); tone({ freq: 440, type: "square", dur: 0.1, gain: 0.05, start: 0.07 }); } },
  "⭐": { play: () => { tone({ freq: 880, type: "sine", dur: 0.14, gain: 0.05 }); } },
  "🍬": { play: () => tone({ freq: 920, type: "triangle", dur: 0.09, gain: 0.05, slide: 180 }) },
  "⚡": { play: () => tone({ freq: 720, type: "sawtooth", dur: 0.05, gain: 0.04, slide: -400 }) },
  "💎": { play: () => tone({ freq: 1046, type: "sine", dur: 0.12, gain: 0.045 }) },
  "🦈": { play: () => tone({ freq: 110, type: "sawtooth", dur: 0.16, gain: 0.04, slide: -40 }) },
  "💰": { play: () => tone({ freq: 196, type: "square", dur: 0.07, gain: 0.05 }) },
};

export function playSymbol(sym) {
  if (muted) return;
  const fx = SYMBOL_SFX[sym];
  if (fx) fx.play();
  else tone({ freq: 330, type: "triangle", dur: 0.08, gain: 0.04 });
}

export function playStop(voice = "clack") {
  if (muted) return;
  const v = VOICE[voice] || VOICE.clack;
  tone({ freq: v.thud, type: "square", dur: 0.05, gain: 0.04, slide: -50 });
}

/** Makara kilit + sembol çarpışır: thud önce, tını 30ms sonra. */
export function playClash(sym, voice = "clack") {
  if (muted) return;
  playStop(voice);
  const v = VOICE[voice] || VOICE.clack;
  tone({ freq: v.snap, type: v.type, dur: 0.07, gain: 0.035, start: 0.03 });
  playSymbol(sym);
}

export function playWin(tier = 1) {
  if (muted) return;
  [0, 1, 2].forEach((i) => tone({ freq: 392 * (i + 1), type: "triangle", dur: 0.16 + tier * 0.04, gain: 0.05, start: i * 0.09 }));
}
export function playMiss() { if (!muted) tone({ freq: 180, type: "sine", dur: 0.18, gain: 0.03, slide: -80 }); }
export function playClick() { if (!muted) tone({ freq: 520, type: "square", dur: 0.04, gain: 0.03 }); }

export function playBonusIn() {
  if (muted) return;
  [523, 659, 784, 1046].forEach((f, i) => tone({ freq: f, type: "triangle", dur: 0.18, gain: 0.06, start: i * 0.07 }));
}

export function playJack() {
  if (muted) return;
  tone({ freq: 196, type: "square", dur: 0.12, gain: 0.06 });
  tone({ freq: 392, type: "triangle", dur: 0.2, gain: 0.05, start: 0.08 });
  tone({ freq: 784, type: "sine", dur: 0.22, gain: 0.04, start: 0.16 });
}

export function playExtra() {
  if (muted) return;
  tone({ freq: 880, type: "sine", dur: 0.1, gain: 0.05, slide: 200 });
}
