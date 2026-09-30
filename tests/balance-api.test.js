import assert from "node:assert/strict";
import { afterEach, test } from "node:test";
import handler from "../api/balance.js";
import { loadState } from "../src/store.js";

const originalEnv = { ...process.env };
const originalFetch = globalThis.fetch;
const originalLocalStorage = globalThis.localStorage;

afterEach(() => {
  process.env = { ...originalEnv };
  globalThis.fetch = originalFetch;
  globalThis.localStorage = originalLocalStorage;
});

function response() {
  return {
    statusCode: 200,
    headers: {},
    setHeader(name, value) { this.headers[name] = value; },
    status(code) { this.statusCode = code; return this; },
    json(value) { this.body = value; return this; },
  };
}

function configure() {
  process.env.CITV_RPC_URL = "https://rpc.example";
  process.env.CITV_TOKEN_ADDRESS = "0x0000000000000000000000000000000000000001";
  process.env.CITV_TOKEN_DECIMALS = "2";
}

test("returns an ERC-20 balance for a valid wallet", async () => {
  configure();
  let request;
  globalThis.fetch = async (url, options) => {
    request = { url, options };
    return { ok: true, json: async () => ({ result: "0x7b" }) };
  };

  const res = response();
  await handler({ method: "GET", query: { wallet: "0x00000000000000000000000000000000000000Ab" } }, res);

  assert.equal(res.statusCode, 200);
  assert.deepEqual(res.body, { balance: 1.23 });
  assert.equal(request.url, "https://rpc.example");
  assert.equal(request.options.method, "POST");
  assert.match(request.options.body, /0x70a08231/);
});

test("rejects invalid wallets without querying the RPC", async () => {
  configure();
  globalThis.fetch = () => { throw new Error("must not fetch"); };

  const res = response();
  await handler({ method: "GET", query: { wallet: "not-an-address" } }, res);

  assert.equal(res.statusCode, 400);
  assert.deepEqual(res.body, { error: "invalid_wallet" });
});

test("does not return a fabricated balance when RPC configuration is missing", async () => {
  delete process.env.CITV_RPC_URL;

  const res = response();
  await handler({ method: "GET", query: { wallet: "0x0000000000000000000000000000000000000001" } }, res);

  assert.equal(res.statusCode, 503);
  assert.deepEqual(res.body, { error: "balance_unavailable" });
});

test("keeps DEMO balances from refilling and ignores cached balances in LIVE", () => {
  const values = new Map([
    ["citv-mode", "DEMO"],
    ["citv-slot-v1", JSON.stringify({ balance: 5, granted: false })],
  ]);
  globalThis.localStorage = {
    getItem: (key) => values.get(key) || null,
    setItem: (key, value) => values.set(key, value),
  };
  const fallback = { balance: 12500, session: {}, muted: false };

  assert.equal(loadState(fallback).balance, 5);
  values.set("citv-mode", "LIVE");
  values.set("citv-slot-v1", JSON.stringify({ balance: 99999 }));
  assert.equal(loadState(fallback).balance, 0);
});
