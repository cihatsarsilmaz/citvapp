import { assertAudit } from "../src/audit.js";

try {
  const r = assertAudit();
  console.log("CITV denetci OK", r.fail.length);
} catch (e) {
  console.error(e.message);
  process.exit(1);
}
