// Deterministic seeded random numbers (mulberry32).
// The same seed always lays out the same farm, so screenshot scenes
// staged with ?seed= render identically on every machine.

export function makeRng(seed) {
  let state = (seed >>> 0) || 1;
  return function next() {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function rngRange(rng, min, max) {
  return min + rng() * (max - min);
}

export function rngPick(rng, items) {
  return items[Math.min(items.length - 1, Math.floor(rng() * items.length))];
}

export function seedFromQuery(search) {
  const params = new URLSearchParams(search);
  const raw = Number(params.get('seed'));
  return Number.isFinite(raw) && raw > 0 ? Math.floor(raw) : 7;
}
