// Deterministic daily puzzle selection: the answer comes from the date alone, so
// every player gets the same country and the stateless Vercel function stays
// consistent. Rollover at KST midnight (KST has no DST, so the UTC instant stays
// exactly 24h apart forever); EPOCH_MS is launch day 2026-06-23 00:00 KST = #1.

import { COUNTRIES } from './countries.js';

const DAY_MS = 86_400_000;
const TZ_OFFSET_MIN = 540; // KST = UTC+9, no daylight saving
const EPOCH_MS = Date.UTC(2026, 5, 22, 15, 0, 0); // 2026-06-23 00:00:00 KST (launch day = #1)

// The shuffle seed is the one real secret: with it anyone could compute every
// day's answer. Set WORLDLE_SEED in production; the fallback is dev-only and
// yields a DIFFERENT order.
const SHUFFLE_SEED = (Number(process.env.WORLDLE_SEED) || 0x9e3779b1) >>> 0;

/** Puzzle number for an instant. Puzzle #1 is the KST day of 2026-06-23. */
export function dayNumber(now = Date.now()) {
  return Math.floor((now - EPOCH_MS) / DAY_MS) + 1;
}

/** Civil date (YYYY-MM-DD, KST) that a given puzzle number falls on. */
export function dateStringFor(day) {
  const instant = EPOCH_MS + (day - 1) * DAY_MS + TZ_OFFSET_MIN * 60_000;
  const d = new Date(instant);
  const yyyy = d.getUTCFullYear();
  const mm = String(d.getUTCMonth() + 1).padStart(2, '0');
  const dd = String(d.getUTCDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

// mulberry32: a small, fast, deterministic PRNG seeded from a 32-bit integer.
function mulberry32(seed) {
  let a = seed >>> 0;
  return function next() {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// A seeded Fisher–Yates shuffle of [0..n) — a fresh permutation per cycle.
function shuffledIndices(n, seed) {
  const arr = Array.from({ length: n }, (_, i) => i);
  const rand = mulberry32(seed);
  for (let i = n - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

/**
 * The answer country for a puzzle number. The list is shuffled once per full
 * cycle (every COUNTRIES.length days) so nothing repeats within a cycle, and a
 * different permutation is used each cycle.
 */
export function answerFor(day) {
  const n = COUNTRIES.length;
  const idx0 = ((day - 1) % n + n) % n; // position within the current cycle
  const cycle = Math.floor((day - 1) / n);
  const order = shuffledIndices(n, (SHUFFLE_SEED ^ (cycle * 0x85ebca6b)) >>> 0);
  return COUNTRIES[order[idx0]];
}

/** Today's answer for the current instant. */
export function todaysAnswer(now = Date.now()) {
  return answerFor(dayNumber(now));
}
