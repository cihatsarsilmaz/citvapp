/** Oyuncu gün defteri. Eğlence sürekliliği: gün tavanı yolmaz. */
const KEY = "citv-day-v2";
const DAY_CAP = 0.92;

export function dayKey(now = Date.now()) {
  const fmt = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Europe/Istanbul",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
  return fmt.format(new Date(now));
}

export function emptyLedger() {
  return { day: dayKey(), in: 0, out: 0, lastGift: 0, gifts: 0 };
}

export function loadLedger() {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return emptyLedger();
    const d = JSON.parse(raw);
    if (!d || d.day !== dayKey()) return emptyLedger();
    return { ...emptyLedger(), ...d, day: dayKey() };
  } catch {
    return emptyLedger();
  }
}

export function saveLedger(L) {
  try { localStorage.setItem(KEY, JSON.stringify(L)); } catch {}
}

export function dayRatio(L) {
  if (!L || L.in < 50) return 0.22;
  return L.out / L.in;
}

export function dayPlan(L, ante, now = Date.now()) {
  const r = dayRatio(L);
  let edge = 0.18;
  let cap = 6;
  let drip = false;
  let gift = false;
  let rare = 0;
  if (r > 0.96) { edge = 0.28; cap = 4.2; }
  else if (r > 0.8) { edge = 0.22; cap = 5; }
  else if (r < 0.35) { edge = 0.08; cap = 7.5; drip = true; }
  else if (r < 0.55) { edge = 0.12; cap = 6.5; drip = true; }

  if (r < 0.5 && L.in >= 80 && now - (L.lastGift || 0) > 70000 && (L.gifts || 0) < 8) {
    gift = true;
    drip = true;
  }
  if (ante >= 6 && r < 0.7) rare = 0.01;
  else if (ante >= 4 && r < 0.55) rare = 0.004;

  return { edge, cap, drip, gift, rare, ratio: r, dayCap: DAY_CAP };
}

export function clipDay(L, wager, paid) {
  const inn = (L.in || 0) + wager;
  if (inn <= 0) return paid;
  const maxOut = Math.floor(DAY_CAP * inn);
  const room = maxOut - (L.out || 0);
  if (room <= 0) return Math.min(paid, Math.floor(betSafe(wager)));
  return Math.min(paid, room);
}

function betSafe(wager) {
  return Math.max(0, wager);
}

export function book(L, wager, paid, gifted) {
  const next = L && L.day === dayKey() ? { ...L } : emptyLedger();
  next.in += wager;
  next.out += paid;
  if (gifted) {
    next.lastGift = Date.now();
    next.gifts = (next.gifts || 0) + 1;
  }
  saveLedger(next);
  return next;
}
