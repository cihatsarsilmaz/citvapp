import { createSpinClient } from "./spin-client.mjs";
import { DEMO, demoApi } from "./demo.js";

let csrfToken = "";
const apiBase = String(import.meta.env?.VITE_CITV_API_URL || "").replace(/\/+$/, "");

export class ApiError extends Error {
  constructor(message, status, code) {
    super(message);
    this.status = status;
    this.code = code;
  }
}

async function ensureCsrf() {
  if (csrfToken) return csrfToken;
  const response = await fetch(`${apiBase}/api/auth/csrf`, { credentials: "include" });
  const data = await response.json();
  csrfToken = data.csrf || "";
  return csrfToken;
}

export async function api(path, options = {}) {
  const method = String(options.method || "GET").toUpperCase();
  // Sunucusuz yayinda (Pages) istekler yerel motora gider.
  if (DEMO) return demoApi(path, options);
  const headers = { Accept: "application/json", ...(options.headers || {}) };
  if (!["GET", "HEAD", "OPTIONS"].includes(method)) {
    headers["X-CSRF-Token"] = await ensureCsrf();
  }
  if (options.body !== undefined) headers["Content-Type"] = "application/json";
  const response = await fetch(`${apiBase}/api${path}`, {
    method,
    headers,
    credentials: "include",
    signal: AbortSignal.timeout(15_000),
    body: options.body === undefined ? undefined : JSON.stringify(options.body),
  });
  let data = {};
  try {
    data = await response.json();
  } catch {
    data = {};
  }
  if (!response.ok) {
    if (data?.error?.code === "csrf_invalid") csrfToken = "";
    throw new ApiError(
      data?.error?.message || "İstek tamamlanamadı.",
      response.status,
      data?.error?.code || "request_error",
    );
  }
  if (data.csrf) csrfToken = data.csrf;
  return data;
}

export function resetCsrf() {
  csrfToken = "";
}

let pendingStorage;
try { pendingStorage = globalThis.sessionStorage; } catch {}
export const submitSpin = createSpinClient(api, pendingStorage);
