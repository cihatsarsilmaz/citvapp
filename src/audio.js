let ctx;
let current;

function getCtx() {
  if (!ctx) ctx = new (window.AudioContext || window.webkitAudioContext)();
  if (ctx.state === "suspended") ctx.resume();
  return ctx;
}

export function stopTheme() {
  if (current) {
    try { current.stop(); } catch {}
    current = null;
  }
}

export function playTheme(freqs, loop = false) {
  stopTheme();
  const ac = getCtx();
  const now = ac.currentTime;
  const master = ac.createGain();
  master.gain.setValueAtTime(0.0001, now);
  master.gain.exponentialRampToValueAtTime(0.08, now + 0.05);
  master.connect(ac.destination);

  const osc = ac.createOscillator();
  osc.type = "triangle";
  osc.frequency.setValueAtTime(freqs[0], now);
  freqs.forEach((f, i) => {
    osc.frequency.setValueAtTime(f, now + i * 0.22);
  });
  osc.connect(master);
  osc.start(now);

  if (loop) {
    const dur = freqs.length * 0.22 + 0.4;
    master.gain.setValueAtTime(0.08, now + dur - 0.15);
    master.gain.exponentialRampToValueAtTime(0.0001, now + dur);
    osc.stop(now + dur);
    current = osc;
    osc.onended = () => {
      if (current === osc) playTheme(freqs, true);
    };
  } else {
    const dur = freqs.length * 0.22 + 0.25;
    master.gain.setValueAtTime(0.08, now + dur - 0.12);
    master.gain.exponentialRampToValueAtTime(0.0001, now + dur);
    osc.stop(now + dur);
    current = osc;
  }
}
