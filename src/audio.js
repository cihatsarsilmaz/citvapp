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
  chime: { thud: 160, snap: 392 },
  thunder: { thud: 55, snap: 98 },
  glass: { thud: 180, snap: 523 },
  low: { thud: 70, snap: 110 },
  coin: { thud: 140, snap: 330 },
  snap: { thud: 120, snap: 247 },
  pad: { thud: 130, snap: 311 },
  howl: { thud: 65, snap: 147 },
  crackle: { thud: 130, snap: 220 },
  wood: { thud: 100, snap: 175 },
  bell: { thud: 160, snap: 349 },
  creak: { thud: 80, snap: 123 },
  blip: { thud: 150, snap: 466 },
  steel: { thud: 170, snap: 392 },
  ice: { thud: 190, snap: 587 },
  roar: { thud: 48, snap: 82 },
  toot: { thud: 150, snap: 262 },
  clack: { thud: 130, snap: 196 },
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
    const g = ac.createGain();
    g.gain.setValueAtTime(0.0001, now);
    g.gain.exponentialRampToValueAtTime(0.09 * VOL, now + 0.06);
    g.gain.exponentialRampToValueAtTime(0.0001, now + 0.62);
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
    o.stop(now + 0.64);
    o2.stop(now + 0.64);
    current = o;
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
    f.frequency.setValueAtTime(420, now);
    f.Q.setValueAtTime(0.7, now);
    f.frequency.linearRampToValueAtTime(780, now + 0.35);
    const g = ac.createGain();
    g.gain.setValueAtTime(0.0001, now);
    g.gain.exponentialRampToValueAtTime(0.09 * VOL, now + 0.05);
    const o = ac.createOscillator();
    o.type = "sawtooth";
    o.frequency.setValueAtTime(48, now);
    const og = ac.createGain();
    og.gain.setValueAtTime(0.025 * VOL, now);
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
    spinNoise.g.gain.exponentialRampToValueAtTime(0.0001, t + 0.09);
    if (spinNoise.og) spinNoise.og.gain.exponentialRampToValueAtTime(0.0001, t + 0.09);
    spinNoise.o.stop(t + 0.12);
    if (spinNoise.osc) spinNoise.osc.stop(t + 0.12);
  } catch {}
  spinNoise = null;
}

export function playClash(sym, voice = "clack") {
  if (muted) return;
  const v = VOICE[voice] || VOICE.clack;
  thud(v.thud, 0, 0.26);
  tone({ freq: v.snap, type: "triangle", dur: 0.09, gain: 0.09, start: 0.01 });
}

export function playWin(tier = 1) {
  if (muted) return;
  thud(62, 0, 0.28);
  const seq = tier >= 3 ? [131, 165, 196, 262] : tier >= 2 ? [131, 196, 247] : [147, 196];
  seq.forEach((f, i) => tone({ freq: f, type: "triangle", dur: 0.22, gain: 0.1, start: i * 0.07 }));
}

export function playMiss() {
  tone({ freq: 98, type: "sine", dur: 0.2, gain: 0.06, slide: -28 });
}

export function playClick() {
  thud(220, 0, 0.18);
  tone({ freq: 420, type: "triangle", dur: 0.06, gain: 0.05 });
}

export function playBonusIn() {
  thud(52, 0, 0.34);
  const seq = [131, 165, 196, 262, 330, 392];
  seq.forEach((f, i) => tone({ freq: f, type: "triangle", dur: 0.28, gain: 0.11, start: i * 0.08 }));
  tone({ freq: 523, type: "sine", dur: 0.45, gain: 0.08, start: 0.42 });
}

export function playJack() {
  thud(46, 0, 0.36);
  [82, 123, 164, 246, 329].forEach((f, i) =>
    tone({ freq: f, type: "triangle", dur: 0.32, gain: 0.12, start: i * 0.09 })
  );
}

export function playExtra() {
  thud(90, 0, 0.2);
  tone({ freq: 196, type: "triangle", dur: 0.16, gain: 0.09 });
  tone({ freq: 294, type: "sine", dur: 0.18, gain: 0.07, start: 0.06 });
}
