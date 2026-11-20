import test from "node:test";
import assert from "node:assert/strict";
import { openDatabase, createUser } from "../server/database.mjs";
import { ensureDemoCredits, gameState, performSpin, secureGrid } from "../server/game.mjs";
import { GAMES } from "../src/games.js";
import { kitOf } from "../src/kits.js";

test("güvenli grid oyun düzenini korur", () => {
  const game = GAMES[0];
  const kit = kitOf(game);
  const grid = secureGrid(game, kit.cols, kit.rows);
  assert.equal(grid.length, kit.cols);
  assert.ok(grid.every((column) => column.length === kit.rows));
});

test("spin bakiyeyi atomik olarak günceller", () => {
  const db = openDatabase(":memory:");
  const user = createUser(db, {
    email: "oyuncu@example.com",
    displayName: "Oyuncu",
    password: "GuvenliParola123",
  });
  const before = user.balance;
  const result = performSpin(db, user.id, { gameId: GAMES[0].id, ante: 1, idempotencyKey: "balance-test-0001" });
  const stored = db.prepare("SELECT balance FROM users WHERE id = ?").get(user.id);
  assert.equal(stored.balance, result.balance);
  assert.ok(result.balance >= before - 10);
  assert.equal(result.grid.length, kitOf(GAMES[0]).cols);
});

test("geçersiz oyun ve ante reddedilir", () => {
  const db = openDatabase(":memory:");
  const user = createUser(db, {
    email: "oyuncu2@example.com",
    displayName: "Oyuncu İki",
    password: "GuvenliParola123",
  });
  assert.throws(() => performSpin(db, user.id, { gameId: "yok", ante: 1 }));
  assert.throws(() => performSpin(db, user.id, { gameId: GAMES[0].id, ante: 999 }));
});

test("bonus turu oyun ve ante ile kilitlenir", () => {
  const db = openDatabase(":memory:");
  const user = createUser(db, {
    email: "bonus-lock@example.com",
    displayName: "Bonus Lock",
    password: "BonusLockParola123",
  });
  db.prepare("UPDATE game_sessions SET bonus_left = 2, bonus_game_id = ?, bonus_ante = ? WHERE user_id = ?")
    .run(GAMES[0].id, 1, user.id);
  assert.throws(
    () => performSpin(db, user.id, { gameId: GAMES[1].id, ante: 1, idempotencyKey: "bonus-lock-0001" }),
    (error) => error.code === "bonus_locked",
  );
});

test("aynı idempotency anahtarı aynı spin sonucunu döndürür", () => {
  const db = openDatabase(":memory:");
  const user = createUser(db, {
    email: "replay@example.com",
    displayName: "Replay Guard",
    password: "ReplayGuardParola123",
  });
  const first = performSpin(db, user.id, { gameId: GAMES[0].id, ante: 1, idempotencyKey: "replay-key-1234" });
  const second = performSpin(db, user.id, { gameId: GAMES[0].id, ante: 1, idempotencyKey: "replay-key-1234" });
  assert.deepEqual(second, first);
  assert.equal(db.prepare("SELECT COUNT(*) AS count FROM spins WHERE user_id = ?").get(user.id).count, 1);
});

test("aynı idempotency anahtarı farklı istekte reddedilir", () => {
  const db = openDatabase(":memory:");
  const user = createUser(db, {
    email: "replay-conflict@example.com",
    displayName: "Replay Conflict",
    password: "ReplayConflictParola123",
  });
  performSpin(db, user.id, { gameId: GAMES[0].id, ante: 1, idempotencyKey: "replay-conflict-0001" });
  assert.throws(
    () => performSpin(db, user.id, { gameId: GAMES[0].id, ante: 2, idempotencyKey: "replay-conflict-0001" }),
    (error) => error.code === "idempotency_conflict",
  );
});

test("düşük bakiyede bir kez sanal kredi tamamlanır", () => {
  const db = openDatabase(":memory:");
  const user = createUser(db, {
    email: "refill@example.com",
    displayName: "Refill",
    password: "RefillParola2026",
  });
  db.prepare("UPDATE users SET balance = 3 WHERE id = ?").run(user.id);
  assert.deepEqual(ensureDemoCredits(db, user.id, { now: 1_760_000_000_000 }), { amount: 2500, balance: 2503 });
  assert.equal(ensureDemoCredits(db, user.id).amount, 0);
  assert.equal(db.prepare("SELECT balance FROM users WHERE id = ?").get(user.id).balance, 2503);
});

test("bonus durumu yenilemeden sonra oyun ve bahis kilidiyle geri yüklenir", () => {
  const db = openDatabase(":memory:");
  const user = createUser(db, {
    email: "resume@example.com",
    displayName: "Resume",
    password: "ResumeParola2026",
  });
  db.prepare(`UPDATE game_sessions SET bonus_left = 2, bonus_game_id = ?, bonus_ante = 1,
    bond = 3 WHERE user_id = ?`).run(GAMES[0].id, user.id);
  const state = gameState(db, user.id);
  assert.equal(state.session.bonusLeft, 2);
  assert.equal(state.session.bonusGameId, GAMES[0].id);
  assert.equal(state.session.bonusAnte, 1);
  assert.equal(state.session.bond, 3);
  assert.ok(state.session.inBonus);
});
