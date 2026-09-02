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
  tap(14);
}

export function tapWin(tier = 1) {
  tap(tier > 1 ? [12, 20, 28] : [8, 16]);
}
