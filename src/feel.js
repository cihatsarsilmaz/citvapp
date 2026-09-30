export function tap(ms = 8) {
  try {
    if (navigator.vibrate) navigator.vibrate(ms);
  } catch {}
}

export function tapSpin() {
  tap([10, 12, 16]);
}

export function tapTick() {
  tap(7);
}

export function tapLock() {
  tap(16);
}

export function tapWin(tier = 1) {
  tap(tier > 1 ? [14, 24, 36, 20] : [10, 18]);
}

export function tapBonus() {
  tap([18, 30, 22, 40, 28, 50]);
}
