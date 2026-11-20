import { randomInt, randomUUID } from "node:crypto";
import { GAMES } from "../src/games.js";
import { kitOf } from "../src/kits.js";
import { evalLines } from "../src/engine.js";
import { applyHouse, emptySession, spinGrid } from "../src/house.js";
import { book, dayKey } from "../src/ledger.js";
import { UNIT } from "../src/paytable.js";
import { httpError } from "./security.mjs";

const GAME_MAP = new Map(GAMES.map((game) => [game.id, game]));
const secureRandom = () => randomInt(0, 2 ** 47) / 2 ** 47;

export function secureGrid(game, cols, rows) {
  return spinGrid(game.emoji, false, { cols, rows }, secureRandom);
}

function sessionFromRow(row) {
  if (!row) return { ...emptySession(), bonusGameId: null, bonusAnte: null };
  return {
    start: row.start, spins: row.spins, wagered: row.wagered, paid: row.paid,
    vault: row.vault, cool: row.cool, dry: row.dry, bond: row.bond,
    bonusLeft: row.bonus_left, inBonus: row.bonus_left > 0, bonusLock: row.bonus_lock,
    bonusGameId: row.bonus_game_id, bonusAnte: row.bonus_ante,
  };
}

export function gameState(db, userId) {
  const session = sessionFromRow(db.prepare("SELECT * FROM game_sessions WHERE user_id = ?").get(userId));
  const last = db.prepare("SELECT response_json FROM spins WHERE user_id = ? ORDER BY rowid DESC LIMIT 1").get(userId);
  return { session, lastSpin: last?.response_json ? JSON.parse(last.response_json) : null };
}

export function ensureDemoCredits(db, userId, { now = Date.now() } = {}) {
  db.exec("BEGIN IMMEDIATE");
  try {
    const user = db.prepare("SELECT id, balance, status FROM users WHERE id = ?").get(userId);
    if (!user || user.status !== "active" || user.balance >= 20) {
      db.exec("COMMIT");
      return { amount: 0, balance: user?.balance ?? 0 };
    }
    const amount = 2500;
    const stamp = new Date(now).toISOString();
    db.prepare("UPDATE users SET balance = balance + ?, updated_at = ?, revision = revision + 1 WHERE id = ?")
      .run(amount, stamp, userId);
    db.prepare(`INSERT INTO audit_logs (actor_user_id, action, target_user_id, details_json, ip, created_at)
      VALUES (?, 'credits.demo_refill', ?, ?, 'server', ?)`)
      .run(userId, userId, JSON.stringify({ amount, trigger: "game_state" }), stamp);
    db.exec("COMMIT");
    return { amount, balance: user.balance + amount };
  } catch (error) {
    db.exec("ROLLBACK");
    throw error;
  }
}

export function performSpin(db, userId, { gameId, ante: inputAnte, turbo = false, idempotencyKey }, dependencies = {}) {
  const requestKey = String(idempotencyKey || "").trim();
  if (!/^[A-Za-z0-9._~-]{8,128}$/.test(requestKey)) {
    throw httpError(400, "8-128 karakterlik Idempotency-Key gereklidir.", "invalid_idempotency_key");
  }
  const game = GAME_MAP.get(String(gameId || ""));
  if (!game) throw httpError(404, "Oyun bulunamadı.", "game_not_found");
  const kit = kitOf(game);
  const ante = Number(inputAnte);
  if (!Number.isInteger(ante) || ante < 1 || ante > (kit.anteMax || 10)) {
    throw httpError(400, "Bahis seviyesi geçersiz.", "invalid_ante");
  }
  if (typeof turbo !== "boolean") throw httpError(400, "Turbo boolean olmalıdır.", "invalid_turbo");
  // Dependency injection is available to local tests, never read from HTTP input.
  const random = dependencies.random || secureRandom;
  const nowMs = dependencies.now ?? Date.now();
  const now = new Date(nowMs).toISOString();
  const fingerprint = JSON.stringify({ gameId: game.id, ante, turbo });

  db.exec("BEGIN IMMEDIATE");
  try {
    const user = db.prepare("SELECT * FROM users WHERE id = ?").get(userId);
    if (!user || user.status !== "active") throw httpError(403, "Hesap oyun için etkin değil.", "account_inactive");
    const replay = db.prepare("SELECT request_json, response_json FROM spins WHERE user_id = ? AND idempotency_key = ?")
      .get(userId, requestKey);
    if (replay?.response_json) {
      if (replay.request_json && replay.request_json !== fingerprint) {
        throw httpError(409, "Bu anahtar farklı bir spin isteği için kullanıldı.", "idempotency_conflict");
      }
      db.exec("COMMIT");
      return JSON.parse(replay.response_json);
    }
    const row = db.prepare("SELECT * FROM game_sessions WHERE user_id = ?").get(userId);
    const session = sessionFromRow(row);
    if (session.inBonus && (session.bonusGameId !== game.id || session.bonusAnte !== ante)) {
      throw httpError(409, "Bonus turu aynı oyun ve bahis seviyesiyle sürdürülmelidir.", "bonus_locked");
    }
    const bet = UNIT * ante;
    const wager = session.inBonus ? 0 : bet;
    if (user.balance < wager) throw httpError(409, "Yetersiz CITV bakiyesi.", "insufficient_balance");
    const today = dayKey(nowMs);
    const ledger = row?.day === today
      ? { day: today, in: row.day_in, out: row.day_out, lastGift: row.day_last_gift, gifts: row.day_gifts }
      : { day: today, in: 0, out: 0, lastGift: 0, gifts: 0 };
    const grid = spinGrid(game.emoji, false, kit, random);
    const result = applyHouse(evalLines(grid, game.emoji, bet, kit), bet, session, {
      balance: user.balance - wager, ante, turbo: turbo && !session.inBonus,
      ledger, kit, random, now: nowMs,
    });
    const nextLedger = book(ledger, wager, result.win, result.gift, { now: nowMs, persist: false });
    const next = result.session;
    next.bonusGameId = next.inBonus ? game.id : null;
    next.bonusAnte = next.inBonus ? ante : null;
    const balance = user.balance - wager + result.win;
    if (!Number.isSafeInteger(balance) || balance < 0) throw new Error("Invalid settlement balance");
    db.prepare("UPDATE users SET balance = ?, updated_at = ?, revision = revision + 1 WHERE id = ?")
      .run(balance, now, userId);
    db.prepare(`
      UPDATE game_sessions SET start=?, spins=?, wagered=?, paid=?, vault=?, cool=?, dry=?,
        bond=?, bonus_lock=?, bonus_left=?, bonus_game_id=?, bonus_ante=?,
        day=?, day_in=?, day_out=?, day_last_gift=?, day_gifts=?, updated_at=?
      WHERE user_id=?
    `).run(next.start, next.spins, next.wagered, next.paid, next.vault, next.cool, next.dry,
      next.bond, next.bonusLock, next.bonusLeft, next.bonusGameId, next.bonusAnte,
      today, nextLedger.in, nextLedger.out, nextLedger.lastGift, nextLedger.gifts, now, userId);
    const response = { spinId: randomUUID(), gameId: game.id, grid, balance, result };
    db.prepare(`
      INSERT INTO spins (id, user_id, game_id, ante, bet, win, balance_after, grid_json,
        idempotency_key, request_json, response_json, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(response.spinId, userId, game.id, ante, wager, result.win, balance,
      JSON.stringify(grid), requestKey, fingerprint, JSON.stringify(response), now);
    db.exec("COMMIT");
    return response;
  } catch (error) {
    db.exec("ROLLBACK");
    throw error;
  }
}
