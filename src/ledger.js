/** Oyuncu gün defteri: yatırım / ödeme. Sahneye yazı yok. */
const KEY = "citv-day-v1";
const DAY_CAP = 0.45;

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
  let edge = 0.46;
  let cap = 3.4;
  let drip = false;
  let gift = false;
  let rare = 0;
  if (r > 0.48) { edge = 0.64; cap = 2.1; }
  else if (r > 0.36) { edge = 0.54; cap = 2.7; }
  else if (r < 0.12) { edge = 0.16; cap = 4.4; drip = true; }
  else if (r < 0.22) { edge = 0.26; cap = 3.8; drip = true; }

  if (r < 0.26 && L.in >= 80 && now - (L.lastGift || 0) > 90000 && (L.gifts || 0) < 6) {
    gift = true;
    drip = true;
  }
  if (ante >= 6 && r < 0.3) rare = 0.0026;
  else if (ante >= 4 && r < 0.2) rare = 0.0011;

  return { edge, cap, drip, gift, rare, ratio: r, dayCap: DAY_CAP };
}

export function clipDay(L, wager, paid) {
  const inn = (L.in || 0) + wager;
  if (inn <= 0) return paid;
  const maxOut = Math.floor(DAY_CAP * inn);
  const room = maxOut - (L.out || 0);
  if (room <= 0) return 0;
  return Math.min(paid, room);
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
