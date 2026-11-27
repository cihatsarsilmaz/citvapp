import test from "node:test";
import assert from "node:assert/strict";
import {
  hashPassword,
  normalizeEmail,
  parseCookies,
  validateDisplayName,
  validatePassword,
  verifyPassword,
} from "../server/security.mjs";
import { openDatabase, createUser, bootstrapAdmin } from "../server/database.mjs";

test("parolalar scrypt ile doğrulanır", () => {
  const encoded = hashPassword("GuvenliParola123");
  assert.equal(verifyPassword("GuvenliParola123", encoded), true);
  assert.equal(verifyPassword("yanlis", encoded), false);
  assert.notEqual(encoded, "GuvenliParola123");
});

test("kimlik alanları normalize edilir ve doğrulanır", () => {
  assert.equal(normalizeEmail(" TEST@Example.COM "), "test@example.com");
  assert.equal(validateDisplayName("  Ada   Lovelace "), "Ada Lovelace");
  assert.equal(validatePassword("BirParola2026"), "BirParola2026");
  assert.throws(() => validatePassword("kisa"));
  assert.throws(() => normalizeEmail("gecersiz"));
});

test("çerez ayrıştırma bozuk girdide güvenli kalır", () => {
  assert.deepEqual(parseCookies("a=1; b=iki%20kelime"), { a: "1", b: "iki kelime" });
});

test("mevcut bootstrap hesabı parola doğrulaması olmadan yükseltilmez", () => {
  const db = openDatabase(":memory:");
  const user = createUser(db, {
    email: "bootstrap@example.com",
    displayName: "Bootstrap",
    password: "OriginalBootstrap123",
  });
  process.env.ADMIN_EMAIL = user.email;
  process.env.ADMIN_PASSWORD = "WrongBootstrap456";
  assert.throws(() => bootstrapAdmin(db));
  assert.equal(db.prepare("SELECT role FROM users WHERE id = ?").get(user.id).role, "player");
  delete process.env.ADMIN_EMAIL;
  delete process.env.ADMIN_PASSWORD;
});
