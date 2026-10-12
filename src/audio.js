let ctx;
let master;
let spinTimer;
let muted = false;
const VOL = 1.6;

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

function ping(freq, dur = 0.1, gain = 0.06, start = 0) {
  if (muted) return;
  try {
    const ac = getCtx();
    const t = ac.currentTime + start;
    const o = ac.createOscillator();
    const g = ac.createGain();
    o.type = "sine";
    o.frequency.setValueAtTime(freq, t);
    g.gain.setValueAtTime(0, t);
    g.gain.linearRampToValueAtTime(gain * VOL, t + 0.02);
    g.gain.linearRampToValueAtTime(0, t + dur);
    o.connect(g);
    g.connect(dest());
    o.start(t);
    o.stop(t + dur + 0.02);
  } catch {}
}

const VOICE = {
  chime: { note: 784, gap: 180 },
  thunder: { note: 196, gap: 220 },
  glass: { note: 880, gap: 160 },
  low: { note: 220, gap: 240 },
  coin: { note: 660, gap: 170 },
  snap: { note: 330, gap: 190 },
  pad: { note: 392, gap: 210 },
  howl: { note: 247, gap: 230 },
  crackle: { note: 349, gap: 180 },
  wood: { note: 262, gap: 220 },
  bell: { note: 698, gap: 190 },
  creak: { note: 220, gap: 240 },
  blip: { note: 932, gap: 150 },
  steel: { note: 440, gap: 170 },
  ice: { note: 1046, gap: 160 },
  roar: { note: 196, gap: 250 },
  toot: { note: 523, gap: 180 },
  clack: { note: 294, gap: 200 },
};
function voiceOf(name) {
  return VOICE[name] || VOICE.clack;
}

export function stopTheme() {}
export function playTheme(freqs) {
  if (!freqs || muted) return;
  const f = Math.max(180, freqs[0] || 330);
  ping(f, 0.24, 0.07);
  ping(f * 1.5, 0.18, 0.04, 0.08);
}

export function playSpinLoop(voice = "clack", bonus = false) {
  if (muted) return;
  stopSpinLoop();
  const v = voiceOf(voice);
  const note = bonus ? v.note * 1.25 : v.note;
  const gap = bonus ? Math.max(140, v.gap - 30) : v.gap;
  const tick = () => ping(note, 0.08, bonus ? 0.07 : 0.05);
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
  ping(v.note, 0.07, 0.07);
}
export function playWin(tier = 1, voice = "clack") {
  const v = voiceOf(voice);
  const seq = tier >= 3 ? [1, 1.25, 1.5, 2] : tier >= 2 ? [1, 1.25, 1.5] : [1, 1.25];
  seq.forEach((m, i) => ping(v.note * m, 0.16, 0.07, i * 0.08));
}
export function playMiss(voice = "clack") {
  const v = voiceOf(voice);
  ping(v.note * 0.75, 0.16, 0.04);
}
export function playClick() {
  ping(440, 0.05, 0.04);
}
export function playBonusIn(voice = "clack") {
  const v = voiceOf(voice);
  [1, 1.25, 1.5, 2].forEach((m, i) => ping(v.note * m, 0.22, 0.08, i * 0.09));
}
export function playJack(voice = "clack") {
  const v = voiceOf(voice);
  [1, 1.25, 1.5, 2].forEach((m, i) => ping(v.note * m, 0.24, 0.08, i * 0.09));
}
export function playExtra(voice = "clack") {
  const v = voiceOf(voice);
  ping(v.note, 0.12, 0.06);
  ping(v.note * 1.5, 0.14, 0.05, 0.06);
}
