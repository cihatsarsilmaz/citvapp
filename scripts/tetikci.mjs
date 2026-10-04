import { assertTetikci } from "../src/tetikci.js";

try {
  const r = assertTetikci();
  console.log("CITV tetikci OK", r.notes.join(" | "));
  console.log("sonraki:", r.next);
} catch (e) {
  console.error(e.message);
  process.exit(1);
}
