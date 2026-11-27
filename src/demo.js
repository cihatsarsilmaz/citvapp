// Sunucusuz mod: API yoksa aynı oyun motoru tarayıcıda çalışır.
// Yalnızca VITE_CITV_DEMO=1 ile derlenen yayınlarda devreye girer;
// sunuculu derlemede hiçbir etkisi yoktur.
import { GAMES } from "./games.js";
import { kitOf } from "./kits.js";
import { evalLines } from "./engine.js";
import { applyHouse, emptySession, spinGrid } from "./house.js";
import { book, dayKey } from "./ledger.js";
import { UNIT } from "./paytable.js";

const env = (import.meta && import.meta.env) || {};
export const DEMO = env.VITE_CITV_DEMO === "1";

const KEY = "citv-demo-state-v1";
const START = 12500;
const REFILL_BELOW = 20;
const REFILL_AMOUNT = 2500;
const GAME_MAP = new Map(GAMES.map((game) => [game.id, game]));

let memory = null;

function storage() {
  try {
    return globalThis.localStorage ?? null;
  } catch {
    return null;
  }
}

function blank() {
  return {
    balance: START,
    session: emptySession(),
    bonusGameId: null,
    bonusAnte: null,
    ledger: { day: dayKey(), in: 0, out: 0, lastGift: 0, gifts: 0 },
    activity: [],
    displayName: "Demo Oyuncu",
  };
}

function load() {
  const store = storage();
  if (!store) return memory || (memory = blank());
  try {
    const raw = store.getItem(KEY);
    if (!raw) return blank();
    const parsed = JSON.parse(raw);
    return { ...blank(), ...parsed };
  } catch {
    return blank();
  }
}

function save(state) {
  memory = state;
  const store = storage();
  if (!store) return;
  try {
    store.setItem(KEY, JSON.stringify(state));
  } catch {}
}

function guest(state) {
  return {
    id: "demo",
    email: "demo@local",
    displayName: state.displayName || "Demo Oyuncu",
    role: "player",
    status: "active",
    balance: state.balance,
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: new Date().toISOString(),
    revision: 0,
  };
}

function fail(message, code = "demo_error") {
  const error = new Error(message);
  error.status = 400;
  error.code = code;
  return error;
}

export function demoGameState() {
  const state = load();
  if (state.balance < REFILL_BELOW) {
    state.balance += REFILL_AMOUNT;
    save(state);
  }
  return { session: state.session, lastSpin: null, user: guest(state) };
}

export function demoSpin({ gameId, ante: inputAnte, turbo = false }) {
  const game = GAME_MAP.get(String(gameId || ""));
  if (!game) throw fail("Oyun bulunamadı.", "game_not_found");
  const kit = kitOf(game);
  const ante = Number(inputAnte);
  if (!Number.isInteger(ante) || ante < 1 || ante > (kit.anteMax || 10)) {
    throw fail("Bahis seviyesi geçersiz.", "invalid_ante");
  }
  const state = load();
  const session = { ...state.session, inBonus: (state.session.bonusLeft || 0) > 0 };
  const bet = UNIT * ante;
  const wager = session.inBonus ? 0 : bet;
  if (state.balance < wager) throw fail("Yetersiz CITV bakiyesi.", "insufficient_balance");
  const now = Date.now();
  const today = dayKey(now);
  const ledger = state.ledger && state.ledger.day === today
    ? state.ledger
    : { day: today, in: 0, out: 0, lastGift: 0, gifts: 0 };
  const grid = spinGrid(game.emoji, false, kit, Math.random);
  const result = applyHouse(evalLines(grid, game.emoji, bet, kit), bet, session, {
    balance: state.balance - wager,
    ante,
    turbo: turbo && !session.inBonus,
    ledger,
    kit,
    random: Math.random,
    now,
  });
  const nextLedger = book(ledger, wager, result.win, result.gift, { now, persist: false });
  const next = result.session;
  next.bonusGameId = next.inBonus ? game.id : null;
  next.bonusAnte = next.inBonus ? ante : null;
  const balance = state.balance - wager + result.win;

  const spin = {
    id: `demo-${now}-${Math.random().toString(36).slice(2, 8)}`,
    gameId: game.id,
    ante,
    bet: wager,
    win: result.win,
    balanceAfter: balance,
    createdAt: new Date(now).toISOString(),
  };

  save({
    ...state,
    balance,
    session: next,
    bonusGameId: next.bonusGameId,
    bonusAnte: next.bonusAnte,
    ledger: nextLedger,
    activity: [spin, ...(state.activity || [])].slice(0, 25),
  });

  return { spinId: spin.id, gameId: game.id, grid, balance, result };
}

export function demoActivity() {
  return { spins: load().activity || [] };
}

export function demoAccount(body = {}) {
  const state = load();
  if (typeof body.displayName === "string" && body.displayName.trim().length >= 2) {
    state.displayName = body.displayName.trim().slice(0, 40);
    save(state);
  }
  return { user: guest(state) };
}

export function demoApi(path, options = {}) {
  const method = String(options.method || "GET").toUpperCase();
  const body = options.body ? JSON.parse(options.body) : {};
  if (path === "/auth/me" || path === "/auth/login" || path === "/auth/register") {
    return { user: guest(load()), csrf: "" };
  }
  if (path === "/auth/logout") return { ok: true };
  if (path === "/game-state" && method === "GET") return demoGameState();
  if (path === "/spins" && method === "POST") return demoSpin(body);
  if (path === "/account/activity" && method === "GET") return demoActivity();
  if (path === "/account" && method === "PATCH") return demoAccount(body);
  if (path === "/admin/overview") {
    return {
      totals: { users: 1, activeUsers: 1, spins: 0, wagered: 0, paid: 0 },
      users: [],
      recent: [],
    };
  }
  throw fail("Bu ekran demo modunda kapalı.", "demo_unsupported");
}

export function resetDemo() {
  memory = blank();
  const store = storage();
  if (store) {
    try { store.removeItem(KEY); } catch {}
  }
}
