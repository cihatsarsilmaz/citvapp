/** CITV Tetikçi — kendini, kodu, bakışı ve turu izler; sonraki adımı yeniler. */
import { readFileSync, writeFileSync, readdirSync, existsSync } from "node:fs";
import { audit } from "./audit.js";

export const NAME = "CITV Tetikçi";
export const VIEW = "salon keçe, 5 hat, kasa sıkı, AUTO durunca makine asılı kalmaz, ödeme okunur";

const NEED_AUTO = ["abortAutoChain", "armAuto", "AbortController"];
const NEED_PAY = ["paystrip", "PAY3", "PAY5"];

function scan(path) {
  return existsSync(path) ? readFileSync(path, "utf8") : "";
}

function artParts() {
  const dir = "src/art/parts";
  if (!existsSync(dir)) return [];
  const fail = [];
  for (const name of readdirSync(dir)) {
    if (!name.endsWith(".js")) continue;
    const t = scan(dir + "/" + name).trimEnd();
    if (!t.startsWith("export default '") && !t.startsWith("export default \"")) {
      fail.push("parca baslik " + name);
      continue;
    }
    if (!t.endsWith("';") && !t.endsWith('";')) fail.push("parca acik " + name);
  }
  return fail;
}

export function inspect() {
  const fail = [];
  const notes = [];
  const a = audit();
  if (!a.ok) fail.push(...a.fail);
  else notes.push("kit/oyun OK");

  const app = scan("src/App.jsx");
  const missingAuto = NEED_AUTO.filter((k) => !app.includes(k));
  if (missingAuto.length) fail.push("AUTO abort eksik: " + missingAuto.join(","));
  else notes.push("AUTO abort OK");
  if (/else if \(!n\) \{\s*clearTimers\(\);/.test(app)) {
    fail.push("AUTO stop hala clearTimers ile gen yiyor");
  }

  const missingPay = NEED_PAY.filter((k) => !app.includes(k));
  if (missingPay.length) notes.push("paytable eksik: " + missingPay.join(","));
  else notes.push("paystrip OK");

  const parts = artParts();
  if (parts.length) fail.push(...parts);
  else notes.push("art parca OK");

  const next = missingPay.length
    ? "paytable okunurluk — .paystrip sahneye"
    : "görsel sıkılaştırma — dock/keçe boşluk ve hücre ritmi";

  return { ok: fail.length === 0, fail, notes, next, view: VIEW };
}

export function assertTetikci() {
  const r = inspect();
  const log = {
    name: NAME,
    t: new Date().toISOString(),
    ok: r.ok,
    view: r.view,
    notes: r.notes,
    fail: r.fail,
    next: r.next,
  };
  try {
    writeFileSync("TETIKCI.json", JSON.stringify(log, null, 2));
  } catch {
    /* CI disinda da sessiz */
  }
  if (!r.ok) {
    throw new Error("CITV tetikci reddetti:\n" + r.fail.join("\n"));
  }
  return r;
}
