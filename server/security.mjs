import {
  createHash,
  randomBytes,
  scryptSync,
  timingSafeEqual,
} from "node:crypto";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function normalizeEmail(value) {
  const email = String(value || "").trim().toLowerCase();
  if (!EMAIL_RE.test(email) || email.length > 254) {
    throw httpError(400, "Geçerli bir e-posta adresi girin.");
  }
  return email;
}

export function validateDisplayName(value) {
  const name = String(value || "").trim().replace(/\s+/g, " ");
  if (name.length < 2 || name.length > 40) {
    throw httpError(400, "Görünen ad 2-40 karakter olmalıdır.");
  }
  return name;
}

export function validatePassword(value) {
  const password = String(value || "");
  if (password.length < 12 || password.length > 128) {
    throw httpError(400, "Parola 12-128 karakter olmalıdır.");
  }
  if (!/[a-zA-ZçğıöşüÇĞİÖŞÜ]/.test(password) || !/\d/.test(password)) {
    throw httpError(400, "Parola en az bir harf ve bir rakam içermelidir.");
  }
  return password;
}

export function hashPassword(password) {
  const salt = randomBytes(16);
  const derived = scryptSync(password, salt, 64, {
    N: 16_384,
    r: 8,
    p: 1,
    maxmem: 32 * 1024 * 1024,
  });
  return `scrypt$16384$8$1$${salt.toString("base64url")}$${derived.toString("base64url")}`;
}

export function verifyPassword(password, encoded) {
  try {
    const [kind, n, r, p, saltText, hashText] = String(encoded).split("$");
    if (kind !== "scrypt") return false;
    const expected = Buffer.from(hashText, "base64url");
    const actual = scryptSync(password, Buffer.from(saltText, "base64url"), expected.length, {
      N: Number(n),
      r: Number(r),
      p: Number(p),
      maxmem: 32 * 1024 * 1024,
    });
    return expected.length === actual.length && timingSafeEqual(expected, actual);
  } catch {
    return false;
  }
}

export function newToken(bytes = 32) {
  return randomBytes(bytes).toString("base64url");
}

export function tokenHash(token) {
  return createHash("sha256").update(String(token)).digest("hex");
}

export function parseCookies(header = "") {
  const out = {};
  for (const item of header.split(";")) {
    const at = item.indexOf("=");
    if (at < 1) continue;
    const key = item.slice(0, at).trim();
    const value = item.slice(at + 1).trim();
    try {
      out[key] = decodeURIComponent(value);
    } catch {
      out[key] = value;
    }
  }
  return out;
}

export function cookie(name, value, options = {}) {
  const sameSite = ["Strict", "Lax", "None"].includes(options.sameSite) ? options.sameSite : "Strict";
  const bits = [`${name}=${encodeURIComponent(value)}`, "Path=/", `SameSite=${sameSite}`];
  if (options.httpOnly) bits.push("HttpOnly");
  if (options.secure) bits.push("Secure");
  if (Number.isFinite(options.maxAge)) bits.push(`Max-Age=${Math.max(0, Math.floor(options.maxAge))}`);
  return bits.join("; ");
}

export function safeUser(row) {
  return {
    id: row.id,
    email: row.email,
    displayName: row.display_name,
    role: row.role,
    status: row.status,
    balance: row.balance,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    revision: row.revision,
  };
}

export function httpError(status, message, code = "request_error") {
  const error = new Error(message);
  error.status = status;
  error.code = code;
  return error;
}

export function readJson(req, maxBytes = 16_384) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    let size = 0;
    req.on("data", (chunk) => {
      size += chunk.length;
      if (size > maxBytes) {
        reject(httpError(413, "İstek gövdesi çok büyük.", "payload_too_large"));
        req.destroy();
        return;
      }
      chunks.push(chunk);
    });
    req.on("end", () => {
      try {
        const text = Buffer.concat(chunks).toString("utf8");
        const value = text ? JSON.parse(text) : {};
        if (!value || typeof value !== "object" || Array.isArray(value)) {
          reject(httpError(400, "JSON gövdesi bir nesne olmalıdır.", "invalid_json"));
          return;
        }
        resolve(value);
      } catch {
        reject(httpError(400, "Geçersiz JSON.", "invalid_json"));
      }
    });
    req.on("error", reject);
  });
}
