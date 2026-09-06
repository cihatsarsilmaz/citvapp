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
    last = last * 0.96 + (Math.random() * 2 - 1) * 0.08;
    d[i] = last;
  }
  noiseBuf = buf;
  return buf;
}

function tone({ freq = 440, type = "sine", dur = 0.12, gain = 0.045, slide = 0, start = 0 }) {
  if (muted) return;
  try {
    const ac = getCtx();
    const t = ac.currentTime + start;
    const o = ac.createOscillator();
    const o2 = ac.createOscillator();
    const g = ac.createGain();
    const f = ac.createBiquadFilter();
    o.type = type;
    o2.type = "sine";
    o.frequency.setValueAtTime(freq, t);
    o2.frequency.setValueAtTime(freq * 2.01, t);
    if (slide) {
      o.frequency.exponentialRampToValueAtTime(Math.max(40, freq + slide), t + dur);
      o2.frequency.exponentialRampToValueAtTime(Math.max(80, (freq + slide) * 2), t + dur);
    }
    f.type = "lowpass";
    f.frequency.setValueAtTime(1400, t);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(gain, t + 0.014);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(f);
    o2.connect(f);
    f.connect(g);
    g.connect(ac.destination);
    o.start(t);
    o2.start(t);
    o.stop(t + dur + 0.02);
    o2.stop(t + dur + 0.02);
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
    g.gain.setValueAtTime(0.08, t);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.09);
    src.connect(f);
    f.connect(g);
    g.connect(ac.destination);
    src.start(t);
    src.stop(t + 0.1);
  } catch {}
}

const VOICE = {
  chime: { thud: 180, snap: 740, type: "sine" },
  thunder: { thud: 70, snap: 240, type: "sine" },
  glass: { thud: 210, snap: 980, type: "sine" },
  low: { thud: 80, snap: 180, type: "sine" },
  coin: { thud: 150, snap: 720, type: "sine" },
  snap: { thud: 130, snap: 520, type: "sine" },
  pad: { thud: 170, snap: 420, type: "sine" },
  howl: { thud: 78, snap: 240, type: "sine" },
  crackle: { thud: 140, snap: 480, type: "sine" },
  wood: { thud: 110, snap: 240, type: "sine" },
  bell: { thud: 190, snap: 860, type: "sine" },
  creak: { thud: 90, snap: 160, type: "sine" },
  blip: { thud: 220, snap: 760, type: "sine" },
  steel: { thud: 200, snap: 980, type: "sine" },
  ice: { thud: 260, snap: 1100, type: "sine" },
  roar: { thud: 55, snap: 140, type: "sine" },
  toot: { thud: 220, snap: 400, type: "sine" },
  clack: { thud: 150, snap: 320, type: "sine" },
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
    master.gain.exponentialRampToValueAtTime(0.035, now + 0.08);
    master.connect(ac.destination);
    freqs.slice(0, 4).forEach((f, i) => {
      const o = ac.createOscillator();
      o.type = "sine";
      o.frequency.setValueAtTime(f, now);
      o.connect(master);
      o.start(now + i * 0.06);
      o.stop(now + 0.7);
      if (i === 0) current = o;
    });
    master.gain.exponentialRampToValueAtTime(0.0001, now + 0.72);
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
    f.type = "bandpass";
    f.frequency.setValueAtTime(380, now);
    f.frequency.linearRampToValueAtTime(520, now + 0.4);
    f.Q.value = 0.85;
    const g = ac.createGain();
    g.gain.setValueAtTime(0.028, now);
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
  tone({ freq: v.snap, type: v.type, dur: 0.07, gain: 0.028, start: 0.02 });
}

export function playWin(tier = 1) {
  if (muted) return;
  [392, 494, 587, 784].slice(0, 2 + tier).forEach((f, i) =>
    tone({ freq: f, type: "sine", dur: 0.2, gain: 0.035, start: i * 0.07 })
  );
}
export function playMiss() { tone({ freq: 150, type: "sine", dur: 0.22, gain: 0.022, slide: -40 }); }
export function playClick() { thud(420); tone({ freq: 360, type: "sine", dur: 0.05, gain: 0.02 }); }
export function playBonusIn() {
  [523, 659, 784, 1046].forEach((f, i) => tone({ freq: f, type: "sine", dur: 0.22, gain: 0.04, start: i * 0.08 }));
}
export function playJack() {
  thud(90);
  tone({ freq: 196, type: "sine", dur: 0.18, gain: 0.045 });
  tone({ freq: 392, type: "sine", dur: 0.24, gain: 0.035, start: 0.1 });
}
export function playExtra() { tone({ freq: 660, type: "sine", dur: 0.14, gain: 0.032, slide: 160 }); }
