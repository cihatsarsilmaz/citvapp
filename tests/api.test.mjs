import test from "node:test";
import assert from "node:assert/strict";

process.env.NODE_ENV = "test";
process.env.DATABASE_PATH = ":memory:";
process.env.ADMIN_EMAIL = "admin-api@citv.test";
process.env.ADMIN_PASSWORD = "AdminApiParola2026";

const { server, db } = await import("../server/index.mjs");

function cookiesFrom(response) {
  return response.headers.getSetCookie()
    .map((item) => item.split(";")[0])
    .join("; ");
}

function cookieValue(cookies, name) {
  const pair = cookies.split("; ").find((item) => item.startsWith(`${name}=`));
  return pair ? decodeURIComponent(pair.slice(name.length + 1)) : "";
}

async function withServer(run) {
  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
  const address = server.address();
  try {
    await run(`http://127.0.0.1:${address.port}`);
  } finally {
    await new Promise((resolve, reject) => server.close((error) => error ? reject(error) : resolve()));
  }
}

test("kayıt, sunucu spin'i ve yetki kontrolleri birlikte çalışır", async () => {
  await withServer(async (base) => {
    const csrfResponse = await fetch(`${base}/api/auth/csrf`);
    let cookies = cookiesFrom(csrfResponse);
    const csrf = cookieValue(cookies, "citv_csrf");
    assert.ok(csrf);

    const register = await fetch(`${base}/api/auth/register`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-CSRF-Token": csrf,
        Cookie: cookies,
      },
      body: JSON.stringify({
        displayName: "API Oyuncu",
        email: "api-player@citv.test",
        password: "ApiOyuncuParola2026",
      }),
    });
    assert.equal(register.status, 201);
    const registered = await register.json();
    cookies = cookiesFrom(register);
    assert.equal(registered.user.balance, 12500);
    assert.equal(registered.user.role, "player");

    const spin = await fetch(`${base}/api/spins`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-CSRF-Token": registered.csrf,
        "Idempotency-Key": "api-spin-test-0001",
        Cookie: cookies,
      },
      body: JSON.stringify({ gameId: "sweet", ante: 1 }),
    });
    assert.equal(spin.status, 201);
    const spun = await spin.json();
    assert.equal(spun.grid.length, 5);
    assert.ok(spun.balance >= 12490);
    assert.equal(typeof spun.result.session.bond, "number");

    const state = await fetch(`${base}/api/game-state`, { headers: { Cookie: cookies } });
    assert.equal(state.status, 200);
    const stateBody = await state.json();
    assert.equal(stateBody.user.balance, spun.balance);
    assert.equal(stateBody.session.spins, 1);

    const replay = await fetch(`${base}/api/spins`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-CSRF-Token": registered.csrf,
        "Idempotency-Key": "api-spin-test-0001",
        Cookie: cookies,
      },
      body: JSON.stringify({ gameId: "sweet", ante: 1 }),
    });
    assert.equal(replay.status, 201);
    assert.equal((await replay.json()).spinId, spun.spinId);

    const missingKey = await fetch(`${base}/api/spins`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-CSRF-Token": registered.csrf,
        Cookie: cookies,
      },
      body: JSON.stringify({ gameId: "sweet", ante: 1 }),
    });
    assert.equal(missingKey.status, 400);
    assert.equal((await missingKey.json()).error.code, "invalid_idempotency_key");

    const adminDenied = await fetch(`${base}/api/admin/overview`, { headers: { Cookie: cookies } });
    assert.equal(adminDenied.status, 403);

    const csrfDenied = await fetch(`${base}/api/account`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        "X-CSRF-Token": "wrong",
        Cookie: cookies,
      },
      body: JSON.stringify({ displayName: "Değişmemeli" }),
    });
    assert.equal(csrfDenied.status, 403);
  });
});

test("yönetici revizyonu, CORS ön kontrolü ve düşük bakiye tamamlaması doğrulanır", async () => {
  await withServer(async (base) => {
    const playerCsrfResponse = await fetch(`${base}/api/auth/csrf`);
    let playerCookies = cookiesFrom(playerCsrfResponse);
    const playerCsrf = cookieValue(playerCookies, "citv_csrf");
    const register = await fetch(`${base}/api/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "X-CSRF-Token": playerCsrf, Cookie: playerCookies },
      body: JSON.stringify({
        displayName: "Kasa Oyuncusu",
        email: "admin-target@citv.test",
        password: "KasaOyuncuParola2026",
      }),
    });
    assert.equal(register.status, 201);
    const player = await register.json();
    playerCookies = cookiesFrom(register);
    db.prepare("UPDATE users SET balance = 5 WHERE id = ?").run(player.user.id);
    const state = await fetch(`${base}/api/game-state`, { headers: { Cookie: playerCookies } });
    const stateBody = await state.json();
    assert.equal(stateBody.user.balance, 2505);

    const adminCsrfResponse = await fetch(`${base}/api/auth/csrf`);
    let adminCookies = cookiesFrom(adminCsrfResponse);
    const adminCsrf = cookieValue(adminCookies, "citv_csrf");
    const login = await fetch(`${base}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "X-CSRF-Token": adminCsrf, Cookie: adminCookies },
      body: JSON.stringify({ email: "admin-api@citv.test", password: "AdminApiParola2026" }),
    });
    assert.equal(login.status, 200);
    const admin = await login.json();
    adminCookies = cookiesFrom(login);
    const overview = await fetch(`${base}/api/admin/overview`, { headers: { Cookie: adminCookies } });
    assert.equal(overview.status, 200);
    const overviewBody = await overview.json();
    const target = overviewBody.users.find((item) => item.id === player.user.id);
    assert.ok(target);

    const stale = await fetch(`${base}/api/admin/users/${target.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json", "X-CSRF-Token": admin.csrf, Cookie: adminCookies },
      body: JSON.stringify({ balance: target.balance, role: target.role, status: target.status, expectedRevision: 0 }),
    });
    assert.equal(stale.status, 409);

    const update = await fetch(`${base}/api/admin/users/${target.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json", "X-CSRF-Token": admin.csrf, Cookie: adminCookies },
      body: JSON.stringify({ balance: target.balance, role: target.role, status: target.status, expectedRevision: target.revision }),
    });
    assert.equal(update.status, 200);
    assert.equal((await update.json()).user.revision, target.revision + 1);

    const preflight = await fetch(`${base}/api/spins`, {
      method: "OPTIONS",
      headers: { Origin: "http://127.0.0.1:8787", "Access-Control-Request-Headers": "Idempotency-Key" },
    });
    assert.equal(preflight.status, 204);
    assert.match(preflight.headers.get("access-control-allow-headers"), /Idempotency-Key/i);

    const rejected = await fetch(`${base}/api/spins`, {
      method: "OPTIONS",
      headers: { Origin: "https://evil.example" },
    });
    assert.equal(rejected.status, 403);
  });
});
