let ctx;
let master;
let spinTimer;
let muted = false;
const VOL = 2.4;

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
    master.gain.value = 0.85;
    master.connect(ctx.destination);
  }
  if (ctx.state === "suspended") ctx.resume();
  return ctx;
}
function dest() {
  getCtx();
  return master;
}

function tone({ freq = 220, type = "sine", dur = 0.12, gain = 0.08, slide = 0, start = 0 }) {
  if (muted) return;
  try {
    const ac = getCtx();
    const t = ac.currentTime + start;
    const o = ac.createOscillator();
    const g = ac.createGain();
    o.type = type;
    o.frequency.setValueAtTime(freq, t);
    if (slide) o.frequency.exponentialRampToValueAtTime(Math.max(40, freq + slide), t + dur);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(gain * VOL, t + 0.012);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g);
    g.connect(dest());
    o.start(t);
    o.stop(t + dur + 0.02);
  } catch {}
}

const VOICE = {
  chime: { note: 784, type: "sine", gap: 140 },
  thunder: { note: 98, type: "triangle", gap: 180 },
  glass: { note: 880, type: "sine", gap: 120 },
  low: { note: 110, type: "sine", gap: 200 },
  coin: { note: 660, type: "triangle", gap: 130 },
  snap: { note: 247, type: "triangle", gap: 150 },
  pad: { note: 311, type: "sine", gap: 170 },
  howl: { note: 147, type: "triangle", gap: 190 },
  crackle: { note: 220, type: "triangle", gap: 140 },
  wood: { note: 175, type: "triangle", gap: 180 },
  bell: { note: 698, type: "sine", gap: 150 },
  creak: { note: 123, type: "triangle", gap: 200 },
  blip: { note: 932, type: "sine", gap: 110 },
  steel: { note: 392, type: "triangle", gap: 130 },
  ice: { note: 1046, type: "sine", gap: 120 },
  roar: { note: 82, type: "triangle", gap: 210 },
  toot: { note: 523, type: "triangle", gap: 140 },
  clack: { note: 196, type: "triangle", gap: 160 },
};
function voiceOf(name) {
  return VOICE[name] || VOICE.clack;
}

export function stopTheme() {}
export function playTheme(freqs) {
  if (!freqs || muted) return;
  const f = Math.max(90, freqs[0] || 220);
  tone({ freq: f, type: "sine", dur: 0.28, gain: 0.08 });
  tone({ freq: f * 1.5, type: "sine", dur: 0.22, gain: 0.05, start: 0.08 });
}

export function playSpinLoop(voice = "clack", bonus = false) {
  if (muted) return;
  stopSpinLoop();
  const v = voiceOf(voice);
  const note = bonus ? v.note * 1.5 : v.note;
  const gap = bonus ? Math.max(90, v.gap - 40) : v.gap;
  const type = bonus ? "sine" : v.type;
  const tick = () => tone({ freq: note, type, dur: 0.06, gain: bonus ? 0.09 : 0.06 });
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
  const v = voiceOf(voice);
  tone({ freq: v.note * 0.5, type: "triangle", dur: 0.08, gain: 0.1 });
}
export function playWin(tier = 1, voice = "clack") {
  const v = voiceOf(voice);
  const seq = tier >= 3 ? [1, 1.25, 1.5, 2] : tier >= 2 ? [1, 1.25, 1.5] : [1, 1.25];
  seq.forEach((m, i) => tone({ freq: v.note * m, type: "sine", dur: 0.2, gain: 0.09, start: i * 0.08 }));
}
export function playMiss(voice = "clack") {
  const v = voiceOf(voice);
  tone({ freq: v.note * 0.5, type: "sine", dur: 0.18, gain: 0.05, slide: -30 });
}
export function playClick() {
  tone({ freq: 420, type: "sine", dur: 0.05, gain: 0.05 });
}
export function playBonusIn(voice = "clack") {
  const v = voiceOf(voice);
  [1, 1.25, 1.5, 2, 2.5].forEach((m, i) =>
    tone({ freq: v.note * m, type: "sine", dur: 0.28, gain: 0.1, start: i * 0.09 })
  );
}
export function playJack(voice = "clack") {
  const v = voiceOf(voice);
  [1, 1.25, 1.5, 2].forEach((m, i) =>
    tone({ freq: v.note * m, type: "sine", dur: 0.3, gain: 0.1, start: i * 0.09 })
  );
}
export function playExtra(voice = "clack") {
  const v = voiceOf(voice);
  tone({ freq: v.note, type: "sine", dur: 0.14, gain: 0.08 });
  tone({ freq: v.note * 1.5, type: "sine", dur: 0.16, gain: 0.06, start: 0.06 });
}
