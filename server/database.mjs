import { mkdirSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { DatabaseSync } from "node:sqlite";
import { randomUUID } from "node:crypto";
import {
  hashPassword,
  normalizeEmail,
  validateDisplayName,
  validatePassword,
  verifyPassword,
} from "./security.mjs";

export function openDatabase(path = process.env.DATABASE_PATH || ".data/citv.sqlite") {
  const filename = path === ":memory:" ? path : resolve(path);
  if (filename !== ":memory:") mkdirSync(dirname(filename), { recursive: true, mode: 0o700 });
  const db = new DatabaseSync(filename);
  db.exec(`
    PRAGMA foreign_keys = ON;
    PRAGMA journal_mode = WAL;
    PRAGMA busy_timeout = 5000;

    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      email TEXT NOT NULL UNIQUE,
      display_name TEXT NOT NULL,
      password_hash TEXT NOT NULL,
      role TEXT NOT NULL DEFAULT 'player' CHECK(role IN ('player', 'admin')),
      status TEXT NOT NULL DEFAULT 'active' CHECK(status IN ('active', 'suspended')),
      balance INTEGER NOT NULL DEFAULT 12500 CHECK(balance >= 0),
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    ) STRICT;

    CREATE TABLE IF NOT EXISTS sessions (
      id_hash TEXT PRIMARY KEY,
      user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      csrf_token TEXT NOT NULL,
      expires_at INTEGER NOT NULL,
      created_at TEXT NOT NULL
    ) STRICT;

    CREATE TABLE IF NOT EXISTS game_sessions (
      user_id TEXT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
      start INTEGER NOT NULL DEFAULT 12500,
      spins INTEGER NOT NULL DEFAULT 0,
      wagered INTEGER NOT NULL DEFAULT 0,
      paid INTEGER NOT NULL DEFAULT 0,
      vault INTEGER NOT NULL DEFAULT 0,
      cool INTEGER NOT NULL DEFAULT 0,
      dry INTEGER NOT NULL DEFAULT 0,
      bond INTEGER NOT NULL DEFAULT 0,
      bonus_lock INTEGER NOT NULL DEFAULT 0,
      bonus_left INTEGER NOT NULL DEFAULT 0,
      bonus_game_id TEXT,
      bonus_ante INTEGER,
      day TEXT,
      day_in INTEGER NOT NULL DEFAULT 0,
      day_out INTEGER NOT NULL DEFAULT 0,
      day_last_gift INTEGER NOT NULL DEFAULT 0,
      day_gifts INTEGER NOT NULL DEFAULT 0,
      updated_at TEXT NOT NULL
    ) STRICT;

    CREATE TABLE IF NOT EXISTS spins (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      game_id TEXT NOT NULL,
      ante INTEGER NOT NULL,
      bet INTEGER NOT NULL,
      win INTEGER NOT NULL,
      balance_after INTEGER NOT NULL,
      grid_json TEXT NOT NULL,
      created_at TEXT NOT NULL
    ) STRICT;

    CREATE TABLE IF NOT EXISTS audit_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      actor_user_id TEXT REFERENCES users(id) ON DELETE SET NULL,
      action TEXT NOT NULL,
      target_user_id TEXT REFERENCES users(id) ON DELETE SET NULL,
      details_json TEXT NOT NULL,
      ip TEXT NOT NULL,
      created_at TEXT NOT NULL
    ) STRICT;

    CREATE INDEX IF NOT EXISTS idx_sessions_user ON sessions(user_id);
    CREATE INDEX IF NOT EXISTS idx_sessions_expiry ON sessions(expires_at);
    CREATE INDEX IF NOT EXISTS idx_spins_user_created ON spins(user_id, created_at DESC);
    CREATE INDEX IF NOT EXISTS idx_audit_created ON audit_logs(created_at DESC);
  `);
  // Additive migrations for databases created by earlier releases.
  for (const statement of [
    "ALTER TABLE game_sessions ADD COLUMN start INTEGER NOT NULL DEFAULT 12500",
    "ALTER TABLE game_sessions ADD COLUMN cool INTEGER NOT NULL DEFAULT 0",
    "ALTER TABLE game_sessions ADD COLUMN bond INTEGER NOT NULL DEFAULT 0",
    "ALTER TABLE game_sessions ADD COLUMN bonus_lock INTEGER NOT NULL DEFAULT 0",
    "ALTER TABLE game_sessions ADD COLUMN bonus_game_id TEXT",
    "ALTER TABLE game_sessions ADD COLUMN bonus_ante INTEGER",
    "ALTER TABLE game_sessions ADD COLUMN day TEXT",
    "ALTER TABLE game_sessions ADD COLUMN day_in INTEGER NOT NULL DEFAULT 0",
    "ALTER TABLE game_sessions ADD COLUMN day_out INTEGER NOT NULL DEFAULT 0",
    "ALTER TABLE game_sessions ADD COLUMN day_last_gift INTEGER NOT NULL DEFAULT 0",
    "ALTER TABLE game_sessions ADD COLUMN day_gifts INTEGER NOT NULL DEFAULT 0",
    "ALTER TABLE spins ADD COLUMN idempotency_key TEXT",
    "ALTER TABLE spins ADD COLUMN response_json TEXT",
    "ALTER TABLE spins ADD COLUMN request_json TEXT",
    "ALTER TABLE users ADD COLUMN revision INTEGER NOT NULL DEFAULT 0",
  ]) {
    try { db.exec(statement); } catch (error) {
      if (!String(error.message).includes("duplicate column name")) throw error;
    }
  }
  db.exec("CREATE UNIQUE INDEX IF NOT EXISTS idx_spins_idempotency ON spins(user_id, idempotency_key) WHERE idempotency_key IS NOT NULL");
  // Older releases persisted bonus counters but not their game/ante locks.
  // Recover from the last settled spin; retain counters instead of discarding a bonus.
  db.exec(`
    UPDATE game_sessions SET
      bonus_game_id = COALESCE(bonus_game_id,
        (SELECT game_id FROM spins WHERE spins.user_id = game_sessions.user_id ORDER BY rowid DESC LIMIT 1), 'sweet'),
      bonus_ante = COALESCE(bonus_ante,
        (SELECT ante FROM spins WHERE spins.user_id = game_sessions.user_id ORDER BY rowid DESC LIMIT 1), 1)
    WHERE bonus_left > 0 AND (bonus_game_id IS NULL OR bonus_ante IS NULL);
  `);
  return db;
}

export function createUser(db, { email, displayName, password, role = "player" }) {
  const now = new Date().toISOString();
  const user = {
    id: randomUUID(),
    email: normalizeEmail(email),
    displayName: validateDisplayName(displayName),
    passwordHash: hashPassword(validatePassword(password)),
    role: role === "admin" ? "admin" : "player",
    createdAt: now,
  };
  db.prepare(`
    INSERT INTO users (id, email, display_name, password_hash, role, status, balance, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, 'active', 12500, ?, ?)
  `).run(user.id, user.email, user.displayName, user.passwordHash, user.role, now, now);
  db.prepare("INSERT INTO game_sessions (user_id, updated_at) VALUES (?, ?)").run(user.id, now);
  return db.prepare("SELECT * FROM users WHERE id = ?").get(user.id);
}

export function bootstrapAdmin(db) {
  const email = process.env.ADMIN_EMAIL;
  const password = process.env.ADMIN_PASSWORD;
  if (!email && !password) return;
  if (!email || !password) throw new Error("ADMIN_EMAIL ve ADMIN_PASSWORD birlikte verilmelidir.");
  const normalized = normalizeEmail(email);
  const existing = db.prepare("SELECT id FROM users WHERE email = ?").get(normalized);
  if (existing) {
    const row = db.prepare("SELECT * FROM users WHERE id = ?").get(existing.id);
    if (!verifyPassword(password, row.password_hash)) {
      throw new Error("ADMIN_EMAIL mevcut hesapla eşleşiyor ancak parola doğrulanamadı.");
    }
    db.prepare("UPDATE users SET role = 'admin', updated_at = ?, revision = revision + 1 WHERE id = ?")
      .run(new Date().toISOString(), existing.id);
    return;
  }
  createUser(db, {
    email: normalized,
    displayName: "CITV Yönetici",
    password,
    role: "admin",
  });
}
