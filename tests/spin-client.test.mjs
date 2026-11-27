import test from "node:test";
import assert from "node:assert/strict";
import { createSpinClient } from "../src/spin-client.mjs";

function fakeStorage() {
  const values = new Map();
  return {
    getItem: (key) => values.get(key) ?? null,
    setItem: (key, value) => values.set(key, value),
    removeItem: (key) => values.delete(key),
  };
}

test("belirsiz ağ hatası aynı idempotency anahtarıyla yeniden denenir", async () => {
  const keys = [];
  let calls = 0;
  const request = async (_path, options) => {
    keys.push(options.headers["Idempotency-Key"]);
    calls += 1;
    if (calls === 1) throw Object.assign(new Error("ağ kesildi"), { status: 0 });
    return { spinId: "spin-1" };
  };
  const submit = createSpinClient(request, fakeStorage(), () => "stable-key-0001");
  const result = await submit("user-1", { gameId: "sweet", ante: 1, turbo: false });
  assert.equal(result.spinId, "spin-1");
  assert.deepEqual(keys, ["stable-key-0001", "stable-key-0001"]);
});

test("bekleyen işlem farklı istek için sessizce yeniden kullanılmaz", async () => {
  const storage = fakeStorage();
  let calls = 0;
  const request = async () => {
    calls += 1;
    throw Object.assign(new Error("zaman aşımı"), { status: 0 });
  };
  const submit = createSpinClient(request, storage, () => "pending-key-0001");
  await assert.rejects(submit("user-2", { gameId: "sweet", ante: 1, turbo: false }));
  await assert.rejects(
    submit("user-2", { gameId: "sweet", ante: 2, turbo: false }),
    /sonucu belirsiz/,
  );
  assert.equal(calls, 2);
});

test("kesin istemci hatası bekleyen anahtarı temizler", async () => {
  const keys = [];
  let next = 0;
  const request = async (_path, options) => {
    keys.push(options.headers["Idempotency-Key"]);
    if (keys.length === 1) throw Object.assign(new Error("geçersiz"), { status: 400 });
    return { spinId: "spin-2" };
  };
  const submit = createSpinClient(request, fakeStorage(), () => `key-${++next}-00000000`);
  await assert.rejects(submit("user-3", { gameId: "sweet", ante: 1, turbo: false }));
  const result = await submit("user-3", { gameId: "sweet", ante: 1, turbo: false });
  assert.equal(result.spinId, "spin-2");
  assert.deepEqual(keys, ["key-1-00000000", "key-2-00000000"]);
});
