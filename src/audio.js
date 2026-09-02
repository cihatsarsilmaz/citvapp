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

export function playSpinLoop() {
  if (muted) return;
  stopSpinLoop();
  const ac = getCtx();
  const now = ac.currentTime;
  const o = ac.createOscillator();
  const g = ac.createGain();
  o.type = "sawtooth";
  o.frequency.setValueAtTime(90, now);
  o.frequency.linearRampToValueAtTime(140, now + 0.4);
  g.gain.setValueAtTime(0.025, now);
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
export function playStop() { if (!muted) tone({ freq: 160, type: "square", dur: 0.05, gain: 0.035, slide: -60 }); }
export function playWin(tier = 1) {
  if (muted) return;
  [0, 1, 2].forEach((i) => tone({ freq: 392 * (i + 1), type: "triangle", dur: 0.16 + tier * 0.04, gain: 0.05, start: i * 0.09 }));
}
export function playMiss() { if (!muted) tone({ freq: 180, type: "sine", dur: 0.18, gain: 0.03, slide: -80 }); }
export function playClick() { if (!muted) tone({ freq: 520, type: "square", dur: 0.04, gain: 0.03 }); }
