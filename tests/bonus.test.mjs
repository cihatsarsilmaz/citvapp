import test from "node:test";
import assert from "node:assert/strict";
import { applyHouse, emptySession } from "../src/house.js";
import { UNIT } from "../src/paytable.js";

const bet = UNIT;
const steady = () => 0.5;

function bonusSession(bonusLeft = 10) {
  return { ...emptySession(), inBonus: bonusLeft > 0, bonusLeft };
}

function miss(stars) {
  return { total: 0, hits: [], themeHit: false, stars, themes: 0 };
}

function ctx(extra = {}) {
  return { balance: 12500, ante: 1, turbo: false, random: steady, now: Date.now(), ...extra };
}

test("bonus turu tam 10 spinde kapanır", () => {
  let session = bonusSession(10);
  let spins = 0;
  while (session.inBonus && spins < 200) {
    session = applyHouse(miss(2), bet, session, ctx()).session;
    spins += 1;
  }
  assert.equal(session.inBonus, false, "bonus turu kapanmalı");
  assert.equal(spins, 10);
});

test("bonus turu ortalama 10-16 spin sürer", () => {
  let total = 0;
  let longest = 0;
  for (let round = 0; round < 400; round += 1) {
    let session = bonusSession(10);
    let spins = 0;
    while (session.inBonus && spins < 500) {
      session = applyHouse(miss(Math.random() < 0.2 ? 4 : 2), bet, session, ctx({ random: Math.random })).session;
      spins += 1;
    }
    total += spins;
    longest = Math.max(longest, spins);
  }
  const mean = total / 400;
  assert.ok(mean >= 9 && mean <= 16, `ortalama tur uzunluğu: ${mean.toFixed(1)}`);
  assert.ok(longest <= 60, `en uzun tur: ${longest}`);
});

test("iki yıldız bonus hakkını geri kazandırmaz", () => {
  const session = bonusSession(10);
  const result = applyHouse(miss(2), bet, session, ctx());
  assert.equal(result.session.bonusLeft, 9);
  assert.equal(result.extra, 0);
});

test("dört yıldız bonus hakkını bir kez yeniler", () => {
  const session = bonusSession(10);
  const result = applyHouse(miss(4), bet, session, ctx());
  assert.equal(result.session.bonusLeft, 10);
  assert.equal(result.extra, 1);
});

test("günlük tavan bedava spinleri de kapsar", () => {
  // Tavan oyunun tek RTP denetleyicisi: yalnızca ücretli spinlere uygulanırsa
  // bedava spinler sınırsız ödeme yapar ve RTP %500'ü aşar.
  const session = bonusSession(5);
  const ledger = { day: "2026-11-20", in: 100, out: 92, lastGift: 0, gifts: 0 };
  const result = applyHouse({ ...miss(0), total: 50 }, bet, session, ctx({ ledger }));
  assert.equal(result.win, 0);
});

test("ücretli spinde günlük tavan hâlâ uygulanır", () => {
  const session = emptySession();
  const ledger = { day: "2026-11-20", in: 100, out: 0, lastGift: 0, gifts: 0 };
  const result = applyHouse({ ...miss(0), total: 500 }, bet, session, ctx({ ledger }));
  assert.ok(result.win <= Math.floor(0.92 * 110), `tavan aşıldı: ${result.win}`);
});
