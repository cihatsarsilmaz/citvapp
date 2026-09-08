let ctx;
let current;
let spinNoise;
let muted = false;
let noiseBuf;

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

function noise(seconds = 0.5) {
  const ac = getCtx();
  if (noiseBuf) return noiseBuf;
  const n = Math.floor(ac.sampleRate * seconds);
  const buf = ac.createBuffer(1, n, ac.sampleRate);
  const d = buf.getChannelData(0);
  let last = 0;
  for (let i = 0; i < n; i++) {
    last = last * 0.97 + (Math.random() * 2 - 1) * 0.06;
    d[i] = last;
  }
  noiseBuf = buf;
  return buf;
}

function tone({ freq = 220, type = "sine", dur = 0.12, gain = 0.03, slide = 0, start = 0 }) {
  if (muted) return;
  try {
    const ac = getCtx();
    const t = ac.currentTime + start;
    const o = ac.createOscillator();
    const g = ac.createGain();
    const f = ac.createBiquadFilter();
    o.type = type;
    o.frequency.setValueAtTime(freq, t);
    if (slide) o.frequency.exponentialRampToValueAtTime(Math.max(40, freq + slide), t + dur);
    f.type = "lowpass";
    f.frequency.setValueAtTime(900, t);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(gain, t + 0.02);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(f);
    f.connect(g);
    g.connect(ac.destination);
    o.start(t);
    o.stop(t + dur + 0.02);
  } catch {}
}

function thud(freq, start = 0) {
  if (muted) return;
  try {
    const ac = getCtx();
    const t = ac.currentTime + start;
    const src = ac.createBufferSource();
    src.buffer = noise();
    const f = ac.createBiquadFilter();
    f.type = "lowpass";
    f.frequency.setValueAtTime(freq, t);
    const g = ac.createGain();
    g.gain.setValueAtTime(0.07, t);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.1);
    src.connect(f);
    f.connect(g);
    g.connect(ac.destination);
    src.start(t);
    src.stop(t + 0.11);
  } catch {}
}

const VOICE = {
  chime: { thud: 140, snap: 280 },
  thunder: { thud: 60, snap: 120 },
  glass: { thud: 160, snap: 320 },
  low: { thud: 70, snap: 110 },
  coin: { thud: 120, snap: 240 },
  snap: { thud: 110, snap: 200 },
  pad: { thud: 130, snap: 210 },
  howl: { thud: 70, snap: 140 },
  crackle: { thud: 120, snap: 200 },
  wood: { thud: 100, snap: 160 },
  bell: { thud: 150, snap: 260 },
  creak: { thud: 80, snap: 120 },
  blip: { thud: 140, snap: 220 },
  steel: { thud: 160, snap: 280 },
  ice: { thud: 170, snap: 300 },
  roar: { thud: 50, snap: 90 },
  toot: { thud: 140, snap: 180 },
  clack: { thud: 120, snap: 180 },
};

export function stopTheme() {
  if (current) {
    try { current.stop(); } catch {}
    current = null;
  }
}

export function playTheme(freqs) {
  if (muted || !freqs) return;
  stopTheme();
  try {
    const ac = getCtx();
    const now = ac.currentTime;
    const master = ac.createGain();
    master.gain.setValueAtTime(0.0001, now);
    master.gain.exponentialRampToValueAtTime(0.02, now + 0.08);
    master.connect(ac.destination);
    const f0 = Math.min(...freqs.slice(0, 2));
    const o = ac.createOscillator();
    o.type = "sine";
    o.frequency.setValueAtTime(Math.max(80, f0 / 2), now);
    o.connect(master);
    o.start(now);
    o.stop(now + 0.45);
    current = o;
    master.gain.exponentialRampToValueAtTime(0.0001, now + 0.46);
  } catch {}
}

export function playSpinLoop() {
  if (muted) return;
  stopSpinLoop();
  try {
    const ac = getCtx();
    const now = ac.currentTime;
    const src = ac.createBufferSource();
    src.buffer = noise();
    src.loop = true;
    const f = ac.createBiquadFilter();
    f.type = "lowpass";
    f.frequency.setValueAtTime(280, now);
    const g = ac.createGain();
    g.gain.setValueAtTime(0.02, now);
    src.connect(f);
    f.connect(g);
    g.connect(ac.destination);
    src.start(now);
    spinNoise = { o: src, g, f };
  } catch {}
}

export function stopSpinLoop() {
  if (!spinNoise) return;
  try {
    const ac = getCtx();
    spinNoise.g.gain.exponentialRampToValueAtTime(0.0001, ac.currentTime + 0.08);
    spinNoise.o.stop(ac.currentTime + 0.1);
  } catch {}
  spinNoise = null;
}

export function playClash(sym, voice = "clack") {
  if (muted) return;
  const v = VOICE[voice] || VOICE.clack;
  thud(v.thud);
  tone({ freq: v.snap, type: "sine", dur: 0.06, gain: 0.02, start: 0.02 });
}

export function playWin(tier = 1) {
  if (muted) return;
  thud(70);
  const seq = tier >= 3 ? [110, 165, 220] : tier >= 2 ? [98, 147] : [98];
  seq.forEach((f, i) => tone({ freq: f, type: "sine", dur: 0.16, gain: 0.028, start: i * 0.06 }));
}
export function playMiss() { tone({ freq: 90, type: "sine", dur: 0.18, gain: 0.018, slide: -20 }); }
export function playClick() { thud(200); }
export function playBonusIn() {
  thud(60);
  tone({ freq: 130, type: "sine", dur: 0.28, gain: 0.03 });
  tone({ freq: 196, type: "sine", dur: 0.22, gain: 0.022, start: 0.12 });
}
export function playJack() {
  thud(55);
  tone({ freq: 82, type: "sine", dur: 0.3, gain: 0.04 });
  tone({ freq: 164, type: "sine", dur: 0.24, gain: 0.028, start: 0.1 });
}
export function playExtra() { tone({ freq: 147, type: "sine", dur: 0.12, gain: 0.024 }); }
