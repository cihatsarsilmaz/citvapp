import test from "node:test";
import assert from "node:assert/strict";
import { lineFor } from "../src/lines.js";

const game = { id: "sweet" };

test("tanimli duygular icin replik doner", () => {
  for (const mood of ["c", "win", "bonus"]) {
    const line = lineFor(game, mood);
    assert.equal(typeof line, "string");
    assert.ok(line.length > 0, `${mood} icin replik bos`);
  }
});

test("bilinmeyen duygu veya oyun icin bos doner", () => {
  assert.equal(lineFor(game, "miss"), "");
  assert.equal(lineFor(null, "c"), "");
});
