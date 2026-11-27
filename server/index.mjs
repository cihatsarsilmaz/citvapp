import { createServer } from "node:http";
import { existsSync, readFileSync, statSync } from "node:fs";
import { extname, join, normalize, resolve, sep } from "node:path";
import { randomUUID } from "node:crypto";
import { openDatabase, bootstrapAdmin, createUser } from "./database.mjs";
import { ensureDemoCredits, gameState, performSpin } from "./game.mjs";
import {
  cookie,
  httpError,
  newToken,
  normalizeEmail,
  parseCookies,
  readJson,
  safeUser,
  tokenHash,
  validateDisplayName,
  verifyPassword,
} from "./security.mjs";

const host = process.env.HOST || "127.0.0.1";
const port = Number(process.env.PORT || 8787);
const secureCookie = process.env.COOKIE_SECURE === "true" || process.env.NODE_ENV === "production";
const cookieSameSite = process.env.COOKIE_SAME_SITE || "Strict";
const sessionHours = Math.max(1, Number(process.env.SESSION_HOURS || 24));
const appOrigin = process.env.APP_ORIGIN || `http://${host}:${port}`;
const configuredOrigins = new Set(appOrigin.split(",").map((value) => value.trim()).filter(Boolean));
const apiOrigin = process.env.API_ORIGIN || "";
if (apiOrigin) {
  const parsed = new URL(apiOrigin);
  if (!["http:", "https:"].includes(parsed.protocol) || parsed.origin !== apiOrigin) {
    throw new Error("API_ORIGIN yalnızca http(s) origin olmalıdır; yol veya ek CSP içeremez.");
  }
}
if (cookieSameSite === "None" && !secureCookie) {
  throw new Error("COOKIE_SAME_SITE=None için COOKIE_SECURE=true gereklidir.");
}
const distRoot = resolve("dist");
const db = openDatabase();
bootstrapAdmin(db);

const rateBuckets = new Map();
let lastRateCleanup = 0;
const MIME = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".webp": "image/webp",
  ".woff2": "font/woff2",
};

function ipOf(req) {
  return String(req.socket.remoteAddress || "unknown");
}

function rateLimit(req, group, limit, windowMs) {
  const now = Date.now();
  if (now - lastRateCleanup > 60_000) {
    for (const [key, value] of rateBuckets) {
      if (value.resetAt <= now) rateBuckets.delete(key);
    }
    lastRateCleanup = now;
  }
  const key = `${ipOf(req)}:${group}`;
  const bucket = rateBuckets.get(key);
  if (!bucket || bucket.resetAt <= now) {
    rateBuckets.set(key, { count: 1, resetAt: now + windowMs });
    return;
  }
  bucket.count += 1;
  if (bucket.count > limit) {
    const retry = Math.max(1, Math.ceil((bucket.resetAt - now) / 1000));
    const error = httpError(429, "Çok fazla istek. Lütfen biraz bekleyin.", "rate_limited");
    error.retryAfter = retry;
    throw error;
  }
}

function securityHeaders(req, res, requestId) {
  res.setHeader("X-Request-Id", requestId);
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("Referrer-Policy", "same-origin");
  res.setHeader("Permissions-Policy", "camera=(), microphone=(), geolocation=()");
  res.setHeader("Cross-Origin-Opener-Policy", "same-origin");
  if (process.env.NODE_ENV === "production") {
    res.setHeader("Strict-Transport-Security", "max-age=31536000; includeSubDomains");
  }
  res.setHeader(
    "Content-Security-Policy",
    `default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; media-src 'self' data:; connect-src 'self' ${apiOrigin}; object-src 'none'; base-uri 'self'; frame-ancestors 'none'; form-action 'self'`,
  );
  const origin = req.headers.origin;
  if (origin && configuredOrigins.has(origin)) {
    res.setHeader("Access-Control-Allow-Origin", origin);
    res.setHeader("Access-Control-Allow-Credentials", "true");
    res.setHeader("Vary", "Origin");
  }
}

function json(res, status, body, headers = {}) {
  res.writeHead(status, {
    "Content-Type": "application/json; charset=utf-8",
    "Cache-Control": "no-store",
    ...headers,
  });
  res.end(JSON.stringify(body));
}

function requireOrigin(req) {
  const origin = req.headers.origin;
  if (!origin) return;
  if (!configuredOrigins.has(origin)) throw httpError(403, "İstek kaynağı reddedildi.", "origin_rejected");
}

function verifyCsrf(req) {
  requireOrigin(req);
  const cookies = parseCookies(req.headers.cookie);
  const header = req.headers["x-csrf-token"];
  if (!cookies.citv_csrf || !header || cookies.citv_csrf !== header) {
    throw httpError(403, "Güvenlik belirteci geçersiz.", "csrf_invalid");
  }
  const current = sessionFrom(req);
  if (current && current.csrf !== header) {
    throw httpError(403, "Güvenlik belirteci geçersiz.", "csrf_invalid");
  }
}

function sessionFrom(req) {
  const token = parseCookies(req.headers.cookie).citv_session;
  if (!token) return null;
  const row = db.prepare(`
    SELECT s.id_hash, s.csrf_token, s.expires_at, u.*
    FROM sessions s JOIN users u ON u.id = s.user_id
    WHERE s.id_hash = ? AND s.expires_at > ?
  `).get(tokenHash(token), Date.now());
  if (!row) return null;
  return { sessionHash: row.id_hash, csrf: row.csrf_token, user: row };
}

function requireSession(req) {
  const current = sessionFrom(req);
  if (!current) throw httpError(401, "Oturum açmanız gerekiyor.", "unauthorized");
  if (current.user.status !== "active") throw httpError(403, "Hesap askıya alınmış.", "account_suspended");
  return current;
}

function requireAdmin(req) {
  const current = requireSession(req);
  if (current.user.role !== "admin") throw httpError(403, "Yönetici yetkisi gerekiyor.", "forbidden");
  return current;
}

function setSessionCookies(res, token, csrf) {
  const maxAge = sessionHours * 3600;
  res.setHeader("Set-Cookie", [
    cookie("citv_session", token, { httpOnly: true, secure: secureCookie, maxAge, sameSite: cookieSameSite }),
    cookie("citv_csrf", csrf, { secure: secureCookie, maxAge, sameSite: cookieSameSite }),
  ]);
}

function createSession(res, userId) {
  const token = newToken();
  const csrf = newToken(24);
  const expiresAt = Date.now() + sessionHours * 3600_000;
  db.prepare(`
    INSERT INTO sessions (id_hash, user_id, csrf_token, expires_at, created_at)
    VALUES (?, ?, ?, ?, ?)
  `).run(tokenHash(token), userId, csrf, expiresAt, new Date().toISOString());
  setSessionCookies(res, token, csrf);
  return csrf;
}

function clearSession(res) {
  res.setHeader("Set-Cookie", [
    cookie("citv_session", "", { httpOnly: true, secure: secureCookie, maxAge: 0, sameSite: cookieSameSite }),
    cookie("citv_csrf", "", { secure: secureCookie, maxAge: 0, sameSite: cookieSameSite }),
  ]);
}

function audit(actorId, action, targetId, details, req) {
  db.prepare(`
    INSERT INTO audit_logs (actor_user_id, action, target_user_id, details_json, ip, created_at)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run(actorId, action, targetId || null, JSON.stringify(details || {}), ipOf(req), new Date().toISOString());
}

async function api(req, res, url) {
  const method = req.method || "GET";
  const pathname = url.pathname;

  if (method === "GET" && pathname === "/api/health") {
    return json(res, 200, { ok: true, service: "citv-api" });
  }
  if (method === "GET" && pathname === "/api/auth/csrf") {
    const current = sessionFrom(req);
    const csrf = current?.csrf || newToken(24);
    res.setHeader("Set-Cookie", cookie("citv_csrf", csrf, {
      secure: secureCookie,
      maxAge: sessionHours * 3600,
      sameSite: cookieSameSite,
    }));
    return json(res, 200, { csrf });
  }
  if (method === "POST" && pathname === "/api/auth/register") {
    rateLimit(req, "auth", 8, 15 * 60_000);
    verifyCsrf(req);
    const body = await readJson(req);
    let user;
    try {
      user = createUser(db, {
        email: body.email,
        displayName: body.displayName,
        password: body.password,
      });
    } catch (error) {
      if (String(error.message).includes("UNIQUE")) {
        throw httpError(409, "Bu e-posta zaten kayıtlı.", "email_exists");
      }
      throw error;
    }
    const csrf = createSession(res, user.id);
    audit(user.id, "auth.register", user.id, {}, req);
    return json(res, 201, { user: safeUser(user), csrf });
  }
  if (method === "POST" && pathname === "/api/auth/login") {
    rateLimit(req, "auth", 8, 15 * 60_000);
    verifyCsrf(req);
    const body = await readJson(req);
    let email;
    try {
      email = normalizeEmail(body.email);
    } catch {
      email = "";
    }
    const user = db.prepare("SELECT * FROM users WHERE email = ?").get(email);
    if (!user || !verifyPassword(String(body.password || ""), user.password_hash)) {
      throw httpError(401, "E-posta veya parola hatalı.", "invalid_credentials");
    }
    if (user.status !== "active") throw httpError(403, "Hesap askıya alınmış.", "account_suspended");
    db.prepare("DELETE FROM sessions WHERE user_id = ? OR expires_at <= ?").run(user.id, Date.now());
    const csrf = createSession(res, user.id);
    audit(user.id, "auth.login", user.id, {}, req);
    return json(res, 200, { user: safeUser(user), csrf });
  }
  if (method === "POST" && pathname === "/api/auth/logout") {
    verifyCsrf(req);
    const current = sessionFrom(req);
    if (current) db.prepare("DELETE FROM sessions WHERE id_hash = ?").run(current.sessionHash);
    clearSession(res);
    return json(res, 200, { ok: true });
  }
  if (method === "GET" && pathname === "/api/auth/me") {
    const current = requireSession(req);
    return json(res, 200, { user: safeUser(current.user) });
  }
  if (method === "GET" && pathname === "/api/game-state") {
    const current = requireSession(req);
    current.user.balance = ensureDemoCredits(db, current.user.id).balance;
    return json(res, 200, { ...gameState(db, current.user.id), user: safeUser(current.user) });
  }
  if (method === "PATCH" && pathname === "/api/account") {
    verifyCsrf(req);
    const current = requireSession(req);
    const body = await readJson(req);
    const displayName = validateDisplayName(body.displayName);
    db.prepare("UPDATE users SET display_name = ?, updated_at = ?, revision = revision + 1 WHERE id = ?")
      .run(displayName, new Date().toISOString(), current.user.id);
    const user = db.prepare("SELECT * FROM users WHERE id = ?").get(current.user.id);
    audit(user.id, "account.update", user.id, { displayName }, req);
    return json(res, 200, { user: safeUser(user) });
  }
  if (method === "POST" && pathname === "/api/spins") {
    rateLimit(req, "spin", 180, 60_000);
    verifyCsrf(req);
    const current = requireSession(req);
    const body = await readJson(req);
    const key = req.headers["idempotency-key"];
    const result = performSpin(db, current.user.id, {
      gameId: body.gameId, ante: body.ante, turbo: body.turbo, idempotencyKey: key,
    });
    return json(res, 201, result);
  }
  if (method === "GET" && pathname === "/api/account/activity") {
    const current = requireSession(req);
    const spins = db.prepare(`
      SELECT id, game_id AS gameId, ante, bet, win, balance_after AS balanceAfter, created_at AS createdAt
      FROM spins WHERE user_id = ? ORDER BY created_at DESC LIMIT 25
    `).all(current.user.id);
    return json(res, 200, { spins });
  }
  if (method === "GET" && pathname === "/api/admin/overview") {
    const current = requireAdmin(req);
    const totals = db.prepare(`
      SELECT
        (SELECT COUNT(*) FROM users) AS users,
        (SELECT COUNT(*) FROM users WHERE status = 'active') AS activeUsers,
        (SELECT COUNT(*) FROM spins) AS spins,
        COALESCE((SELECT SUM(bet) FROM spins), 0) AS wagered,
        COALESCE((SELECT SUM(win) FROM spins), 0) AS paid
    `).get();
    const users = db.prepare(`
      SELECT id, email, display_name, role, status, balance, created_at, updated_at, revision
      FROM users ORDER BY created_at DESC LIMIT 100
    `).all().map(safeUser);
    const recent = db.prepare(`
      SELECT s.id, s.game_id AS gameId, s.bet, s.win, s.created_at AS createdAt,
             u.display_name AS displayName, u.email
      FROM spins s JOIN users u ON u.id = s.user_id
      ORDER BY s.created_at DESC LIMIT 50
    `).all();
    return json(res, 200, { totals, users, recent });
  }
  const userMatch = pathname.match(/^\/api\/admin\/users\/([0-9a-f-]+)$/i);
  if (method === "PATCH" && userMatch) {
    verifyCsrf(req);
    const current = requireAdmin(req);
    const body = await readJson(req);
    const target = db.prepare("SELECT * FROM users WHERE id = ?").get(userMatch[1]);
    if (!target) throw httpError(404, "Kullanıcı bulunamadı.", "user_not_found");
    const expectedRevision = body.expectedRevision;
    if (!Number.isSafeInteger(expectedRevision) || expectedRevision < 0) {
      throw httpError(428, "Güncel expectedRevision gereklidir.", "revision_required");
    }
    const balance = body.balance == null ? target.balance : Number(body.balance);
    const role = body.role == null ? target.role : String(body.role);
    const status = body.status == null ? target.status : String(body.status);
    if (!Number.isSafeInteger(balance) || balance < 0 || balance > 10_000_000) {
      throw httpError(400, "Bakiye 0-10.000.000 arasında tam sayı olmalıdır.");
    }
    if (!["player", "admin"].includes(role) || !["active", "suspended"].includes(status)) {
      throw httpError(400, "Rol veya durum geçersiz.");
    }
    if (target.id === current.user.id && (role !== "admin" || status !== "active")) {
      throw httpError(409, "Kendi yönetici erişiminizi kaldıramazsınız.");
    }
    if (expectedRevision !== target.revision) {
      throw httpError(409, "Kullanıcı kaydı güncellendi; paneli yenileyip tekrar deneyin.", "stale_user");
    }
    const updatedAt = new Date().toISOString();
    db.exec("BEGIN IMMEDIATE");
    try {
      const updated = db.prepare(`
        UPDATE users SET balance = ?, role = ?, status = ?, updated_at = ?, revision = revision + 1
        WHERE id = ? AND revision = ?
      `).run(balance, role, status, updatedAt, target.id, expectedRevision);
      if (updated.changes !== 1) {
        throw httpError(409, "Kullanıcı kaydı eşzamanlı değişti; paneli yenileyip tekrar deneyin.", "stale_user");
      }
      if (status === "suspended") db.prepare("DELETE FROM sessions WHERE user_id = ?").run(target.id);
      audit(current.user.id, "admin.user.update", target.id, { balance, role, status }, req);
      db.exec("COMMIT");
    } catch (error) {
      db.exec("ROLLBACK");
      throw error;
    }
    const user = db.prepare("SELECT * FROM users WHERE id = ?").get(target.id);
    return json(res, 200, { user: safeUser(user) });
  }
  throw httpError(404, "API yolu bulunamadı.", "not_found");
}

function serveStatic(res, url) {
  if (!existsSync(distRoot)) {
    throw httpError(503, "Web paketi bulunamadı. Önce npm run build çalıştırın.", "build_missing");
  }
  const rawPath = decodeURIComponent(url.pathname);
  const wanted = rawPath === "/" ? "index.html" : rawPath.replace(/^\/+/, "");
  const normalizedPath = normalize(wanted);
  let file = resolve(distRoot, normalizedPath);
  if (!file.startsWith(distRoot + sep) && file !== join(distRoot, "index.html")) {
    throw httpError(403, "Dosya yolu reddedildi.");
  }
  if (!existsSync(file) || statSync(file).isDirectory()) file = join(distRoot, "index.html");
  const extension = extname(file);
  const relative = file.slice(distRoot.length + 1).replaceAll("\\", "/");
  const cacheControl = extension === ".html" || relative === "sw.js" || relative.endsWith("manifest.json")
    ? "no-cache"
    : "public, max-age=31536000, immutable";
  res.writeHead(200, {
    "Content-Type": MIME[extension] || "application/octet-stream",
    "Cache-Control": cacheControl,
  });
  res.end(readFileSync(file));
}

const server = createServer(async (req, res) => {
  const requestId = randomUUID();
  securityHeaders(req, res, requestId);
  try {
    const url = new URL(req.url || "/", `http://${req.headers.host || "localhost"}`);
    if (req.method === "OPTIONS" && url.pathname.startsWith("/api/")) {
      requireOrigin(req);
      res.writeHead(204, {
        "Access-Control-Allow-Methods": "GET, POST, PATCH, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type, X-CSRF-Token, Idempotency-Key",
        "Access-Control-Max-Age": "600",
      });
      return res.end();
    }
    if (url.pathname.startsWith("/api/")) await api(req, res, url);
    else serveStatic(res, url);
  } catch (error) {
    const status = Number(error.status || 500);
    const headers = error.retryAfter ? { "Retry-After": String(error.retryAfter) } : {};
    if (status >= 500) console.error(`[${requestId}]`, error);
    json(res, status, {
      error: {
        code: error.code || "internal_error",
        message: status >= 500 ? "Sunucu hatası." : error.message,
        requestId,
      },
    }, headers);
  }
});

if (process.env.NODE_ENV !== "test") {
  server.listen(port, host, () => console.log(`CITV http://${host}:${port}`));
}

export { server, db };
