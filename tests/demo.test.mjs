import test from "node:test";
import assert from "node:assert/strict";
import { demoGameState, demoSpin, resetDemo, demoAccount, DEMO } from "../src/demo.js";

test("demo modu bayragi varsayilan kapali", () => {
  assert.equal(DEMO, false);
});

test("demo oyun durumu bakiyeyle acilir", () => {
  resetDemo();
  const state = demoGameState();
  assert.equal(state.user.balance, 12500);
  assert.equal(state.user.role, "player");
  assert.ok(state.session);
});

test("demo spin gecerli grid ve bakiye dondurur", () => {
  resetDemo();
  const out = demoSpin({ gameId: "sweet", ante: 1, turbo: false });
  assert.equal(out.grid.length, 5);
  assert.ok(out.grid.every((col) => col.length === 3));
  assert.equal(typeof out.balance, "number");
  assert.ok(out.result.session);
  assert.ok(out.balance >= 0);
});

test("demo spin bakiyeyi negatife dusurmez ve gecmisi sinirlar", () => {
  resetDemo();
  for (let i = 0; i < 60; i += 1) {
    demoGameState();
    try {
      const out = demoSpin({ gameId: "sweet", ante: 2, turbo: true });
      assert.ok(out.balance >= 0);
    } catch (error) {
      assert.equal(error.code, "insufficient_balance");
    }
  }
  const state = demoGameState();
  assert.ok(state.session);
});

test("demo hesap adi guncellenir", () => {
  resetDemo();
  const updated = demoAccount({ displayName: "Deneme" });
  assert.equal(updated.user.displayName, "Deneme");
});
