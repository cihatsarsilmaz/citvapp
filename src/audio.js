let ctx;
let master;
let current;
let spinNoise;
let muted = false;
let noiseBuf;
const VOL = 3.4;

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

export function wakeAudio() {
  try { getCtx(); } catch {}
}

function getCtx() {
  if (!ctx) {
    ctx = new (window.AudioContext || window.webkitAudioContext)();
    master = ctx.createDynamicsCompressor();
    master.threshold.setValueAtTime(-18, ctx.currentTime);
    master.knee.setValueAtTime(12, ctx.currentTime);
    master.ratio.setValueAtTime(3.2, ctx.currentTime);
    master.attack.setValueAtTime(0.003, ctx.currentTime);
    master.release.setValueAtTime(0.12, ctx.currentTime);
    const out = ctx.createGain();
    out.gain.value = 1.15;
    master.connect(out);
    out.connect(ctx.destination);
  }
  if (ctx.state === "suspended") ctx.resume();
  return ctx;
}

function dest() {
  getCtx();
  return master;
}

function noise(seconds = 0.7) {
  const ac = getCtx();
  if (noiseBuf) return noiseBuf;
  const n = Math.floor(ac.sampleRate * seconds);
  const buf = ac.createBuffer(1, n, ac.sampleRate);
  const d = buf.getChannelData(0);
  let last = 0;
  for (let i = 0; i < n; i++) {
    last = last * 0.94 + (Math.random() * 2 - 1) * 0.12;
    d[i] = last;
  }
  noiseBuf = buf;
  return buf;
}

function tone({ freq = 220, type = "triangle", dur = 0.14, gain = 0.1, slide = 0, start = 0 }) {
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
    o2.frequency.setValueAtTime(freq * 2, t);
    if (slide) {
      o.frequency.exponentialRampToValueAtTime(Math.max(40, freq + slide), t + dur);
      o2.frequency.exponentialRampToValueAtTime(Math.max(80, (freq + slide) * 2), t + dur);
    }
    f.type = "lowpass";
    f.frequency.setValueAtTime(2200, t);
    const peak = gain * VOL;
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(peak, t + 0.012);
    g.gain.exponentialRampToValueAtTime(peak * 0.55, t + dur * 0.35);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(f);
    o2.connect(f);
    f.connect(g);
    g.connect(dest());
    o.start(t);
    o2.start(t);
    o.stop(t + dur + 0.03);
    o2.stop(t + dur + 0.03);
  } catch {}
}

function thud(freq, start = 0, gain = 0.22) {
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
    g.gain.setValueAtTime(gain * VOL * 0.42, t);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.16);
    src.connect(f);
    f.connect(g);
    g.connect(dest());
    src.start(t);
    src.stop(t + 0.17);
  } catch {}
}

const VOICE = {
  chime: { thud: 160, snap: 784, type: "triangle" },
  thunder: { thud: 42, snap: 70, type: "sawtooth" },
  glass: { thud: 220, snap: 880, type: "sine" },
  low: { thud: 48, snap: 90, type: "sine" },
  coin: { thud: 180, snap: 660, type: "square" },
  snap: { thud: 110, snap: 220, type: "square" },
  pad: { thud: 130, snap: 311, type: "sine" },
  howl: { thud: 55, snap: 110, type: "sawtooth" },
  crackle: { thud: 140, snap: 280, type: "square" },
  wood: { thud: 80, snap: 160, type: "triangle" },
  bell: { thud: 200, snap: 698, type: "sine" },
  creak: { thud: 60, snap: 120, type: "sawtooth" },
  blip: { thud: 240, snap: 932, type: "square" },
  steel: { thud: 190, snap: 392, type: "triangle" },
  ice: { thud: 260, snap: 1046, type: "sine" },
  roar: { thud: 36, snap: 72, type: "sawtooth" },
  toot: { thud: 170, snap: 523, type: "square" },
  clack: { thud: 130, snap: 196, type: "triangle" },
};

function voiceOf(name) {
  return VOICE[name] || VOICE.clack;
}

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
    const g = ac.createGain();
    g.gain.setValueAtTime(0.0001, now);
    g.gain.exponentialRampToValueAtTime(0.12 * VOL, now + 0.06);
    g.gain.exponentialRampToValueAtTime(0.0001, now + 0.7);
    g.connect(dest());
    const f0 = Math.max(90, Math.min(...freqs.slice(0, 2)));
    const o = ac.createOscillator();
    const o2 = ac.createOscillator();
    o.type = "triangle";
    o2.type = "sine";
    o.frequency.setValueAtTime(f0, now);
    o2.frequency.setValueAtTime(f0 * 1.5, now);
    o.connect(g);
    o2.connect(g);
    o.start(now);
    o2.start(now);
    o.stop(now + 0.72);
    o2.stop(now + 0.72);
    current = o;
  } catch {}
}

export function playSpinLoop(voice = "clack") {
  if (muted) return;
  stopSpinLoop();
  const v = voiceOf(voice);
  try {
    const ac = getCtx();
    const now = ac.currentTime;
    const src = ac.createBufferSource();
    src.buffer = noise();
    src.loop = true;
    const f = ac.createBiquadFilter();
    f.type = "bandpass";
    f.frequency.setValueAtTime(Math.max(180, v.snap * 0.4), now);
    f.Q.setValueAtTime(2.2, now);
    const g = ac.createGain();
    g.gain.setValueAtTime(0.0001, now);
    g.gain.exponentialRampToValueAtTime(0.07 * VOL, now + 0.03);
    const o = ac.createOscillator();
    o.type = "square";
    o.frequency.setValueAtTime(Math.max(48, v.thud * 1.6), now);
    const og = ac.createGain();
    og.gain.setValueAtTime(0.018 * VOL, now);
    src.connect(f);
    f.connect(g);
    o.connect(og);
    g.connect(dest());
    og.connect(dest());
    src.start(now);
    o.start(now);
    spinNoise = { o: src, osc: o, g, og, f };
  } catch {}
}

export function stopSpinLoop() {
  if (!spinNoise) return;
  try {
    const ac = getCtx();
    const t = ac.currentTime;
    spinNoise.g.gain.exponentialRampToValueAtTime(0.0001, t + 0.06);
    if (spinNoise.og) spinNoise.og.gain.exponentialRampToValueAtTime(0.0001, t + 0.06);
    spinNoise.o.stop(t + 0.08);
    if (spinNoise.osc) spinNoise.osc.stop(t + 0.08);
  } catch {}
  spinNoise = null;
}

export function playClash(sym, voice = "clack") {
  if (muted) return;
  const v = voiceOf(voice);
  thud(Math.max(70, v.thud), 0, 0.32);
  tone({ freq: Math.max(140, v.snap * 0.5), type: "square", dur: 0.05, gain: 0.08 });
}

export function playWin(tier = 1, voice = "clack") {
  if (muted) return;
  const v = voiceOf(voice);
  thud(v.thud, 0, 0.28);
  const base = v.snap;
  const type = v.type || "triangle";
  const seq = tier >= 3 ? [base, base * 1.25, base * 1.5, base * 2] : tier >= 2 ? [base, base * 1.25, base * 1.5] : [base, base * 1.25];
  seq.forEach((f, i) => tone({ freq: f, type, dur: 0.22, gain: 0.12, start: i * 0.07 }));
}

export function playMiss(voice = "clack") {
  const v = voiceOf(voice);
  tone({ freq: Math.max(50, v.thud), type: "sine", dur: 0.22, gain: 0.07, slide: -40 });
}

export function playClick() {
  thud(220, 0, 0.18);
  tone({ freq: 420, type: "triangle", dur: 0.06, gain: 0.05 });
}

export function playBonusIn(voice = "clack") {
  const v = voiceOf(voice);
  thud(v.thud, 0, 0.36);
  const base = v.snap;
  const type = v.type || "triangle";
  const seq = [base, base * 1.25, base * 1.5, base * 2, base * 2.5];
  seq.forEach((f, i) => tone({ freq: f, type, dur: 0.3, gain: 0.14, start: i * 0.09 }));
}

export function playJack(voice = "clack") {
  const v = voiceOf(voice);
  thud(v.thud, 0, 0.36);
  const base = v.snap;
  const type = v.type || "triangle";
  [base, base * 1.25, base * 1.5, base * 2].forEach((f, i) =>
    tone({ freq: f, type, dur: 0.32, gain: 0.14, start: i * 0.09 })
  );
}

export function playExtra(voice = "clack") {
  const v = voiceOf(voice);
  thud(v.thud, 0, 0.2);
  tone({ freq: v.snap, type: v.type || "triangle", dur: 0.16, gain: 0.1 });
  tone({ freq: v.snap * 1.5, type: "sine", dur: 0.18, gain: 0.08, start: 0.06 });
}
