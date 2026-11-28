// The world simulation: zone spawning (obstacles, corn, golden
// feathers, hide spots), collisions, near-miss combos, scoring and
// the win/lose rules. No drawing here — render.js reads this state.

import { FARMER, OBSTACLE, PIXELS_PER_METRE, RUN, VIEW, zoneIndexFor } from './config.js';
import { createFarmer, createTurkey, hideInHaystack, leaveHiding, stepTurkey, updateFarmerChase } from './entities.js';
import { addFlash, addPopup, addShake, burst, createEffects, featherBurst, showBanner, stepEffects } from './effects.js';
import { makeRng, rngPick, rngRange } from './rng.js';

const GROUND = VIEW.groundY;

const ZONE_OBSTACLES = [
  ['hayBale', 'knifeGround', 'oven', 'mud', 'hayBale'],
  ['pumpkin', 'knifeThrown', 'hayBale', 'oven', 'mud', 'pumpkin'],
  ['oven', 'pot', 'knifeThrown', 'knifeGround', 'oven', 'pot'],
];

export function createWorld(seed) {
  const rng = makeRng(seed);
  const state = {
    seed,
    time: 0,
    distance: 0,
    score: 0,
    corn: 0,
    lives: RUN.maxLives,
    stamina: RUN.staminaMax,
    speed: RUN.cruiseSpeed,
    zone: 0,
    combo: 0,
    bestCombo: 0,
    nearMisses: 0,
    over: false,
    escaped: false,
    turkey: createTurkey(),
    farmer: createFarmer(),
    obstacles: [],
    pickups: [],
    hideSpots: [],
    effects: createEffects(),
    nextSpawnAt: 24,
    nextHideAt: 60,
    scroll: 0,
  };

  function spawnObstacle() {
    const kind = rngPick(rng, ZONE_OBSTACLES[state.zone]);
    const spec = OBSTACLE[kind];
    const y = kind === 'knifeThrown' ? GROUND - 58 : GROUND - spec.height;
    state.obstacles.push({
      kind, x: VIEW.width + 70, y,
      width: spec.width, height: spec.height,
      vx: kind === 'knifeThrown' ? -170 : 0,
      spin: 0, passed: false, hitDone: false, nearChecked: false,
    });
    if (rng() < 0.6) {
      const golden = rng() < 0.14;
      state.pickups.push({
        kind: golden ? 'feather' : 'corn',
        x: VIEW.width + rngRange(rng, 100, 280),
        y: GROUND - rngRange(rng, 44, 130),
        taken: false,
        bob: rngRange(rng, 0, 6.28),
      });
    }
    const density = 1 - state.zone * 0.14;
    state.nextSpawnAt = state.distance + rngRange(rng, 17, 31) * density;
  }

  function spawnHideSpot() {
    const kinds = ['haystack', 'bush', 'counter'];
    state.hideSpots.push({
      kind: kinds[state.zone],
      x: VIEW.width + 80,
      width: 92,
    });
    state.nextHideAt = state.distance + rngRange(rng, 90, 150);
  }

  function overlaps(a, b, padX, padY) {
    return a.x + padX < b.x + b.width && a.x + a.width - padX > b.x
      && a.y + padY < b.y + b.height && a.y + a.height - padY > b.y;
  }

  function nearMissCombo(obstacle, events) {
    const turkey = state.turkey;
    if (obstacle.nearChecked || obstacle.hitDone) return;
    const clearance = obstacle.kind === 'knifeThrown'
      ? (obstacle.y + obstacle.height) - turkey.y
      : turkey.y + turkey.height - obstacle.y;
    const close = obstacle.kind === 'knifeThrown'
      ? turkey.ducking && clearance > -RUN.nearMissClearance && clearance < 6
      : !turkey.onGround && clearance > -RUN.nearMissClearance && clearance < 8;
    if (close) {
      obstacle.nearChecked = true;
      state.combo = Math.min(RUN.maxCombo, state.combo + 1);
      state.bestCombo = Math.max(state.bestCombo, state.combo);
      state.nearMisses += 1;
      const points = 10 * state.combo;
      state.score += points;
      addPopup(state.effects, turkey.x + 30, turkey.y - 16, `NEAR MISS x${state.combo} +${points}`, '#7dd7ff', 19);
      events.nearMiss = true;
    }
  }

  function hitTurkey(obstacle, events) {
    const turkey = state.turkey;
    obstacle.hitDone = true;
    state.combo = 0;
    if (obstacle.kind === 'mud') {
      turkey.stumble = RUN.stumbleSeconds;
      state.farmer.gap = Math.max(FARMER.catchGap, state.farmer.gap - 5);
      burst(state.effects, rng, turkey.x + 30, GROUND - 4, '#7a5a38', 9);
      addPopup(state.effects, turkey.x + 30, turkey.y - 14, 'MUD! SLOWED', '#e8b53a', 16);
      events.hit = true;
      return;
    }
    state.lives -= 1;
    turkey.stumble = RUN.stumbleSeconds;
    turkey.invincible = RUN.invincibleSeconds;
    state.farmer.gap = Math.max(FARMER.catchGap, state.farmer.gap - 7);
    featherBurst(state.effects, rng, turkey.x + 32, turkey.y + 18);
    addShake(state.effects, 9);
    addFlash(state.effects);
    addPopup(state.effects, turkey.x + 30, turkey.y - 14, 'OUCH! -1 ♥', '#ff7a5c', 18);
    events.hit = true;
    if (state.lives <= 0) {
      state.over = true;
      state.escaped = false;
      events.caught = true;
    }
  }

  function stepObstacles(dt, events) {
    const turkey = state.turkey;
    const scrollPx = state.speed * PIXELS_PER_METRE * dt;
    for (const obstacle of state.obstacles) {
      obstacle.x -= scrollPx - obstacle.vx * dt;
      obstacle.spin += dt * 10;
      if (!obstacle.passed && obstacle.x + obstacle.width < turkey.x) {
        obstacle.passed = true;
        state.score += 15;
      }
      const aligned = obstacle.x < turkey.x + turkey.width && obstacle.x + obstacle.width > turkey.x;
      if (aligned && !turkey.hidden) nearMissCombo(obstacle, events);
      if (obstacle.hitDone || turkey.invincible > 0 || turkey.hidden) continue;
      const hit = obstacle.kind === 'mud'
        ? turkey.onGround && overlaps(turkey, obstacle, 12, 4)
        : overlaps(turkey, obstacle, 10, 8);
      if (hit) hitTurkey(obstacle, events);
    }
    state.obstacles = state.obstacles.filter((o) => o.x + o.width > -90);

    for (const pickup of state.pickups) {
      pickup.x -= scrollPx;
      pickup.bob += dt * 4;
      if (pickup.taken || turkey.hidden) continue;
      if (overlaps(turkey, { x: pickup.x, y: pickup.y, width: 28, height: 36 }, 2, 2)) {
        pickup.taken = true;
        if (pickup.kind === 'feather') {
          state.lives = Math.min(RUN.maxLives, state.lives + 1);
          addPopup(state.effects, pickup.x, pickup.y - 8, '+1 ♥ GOLDEN FEATHER', '#ffe066', 17);
          events.feather = true;
        } else {
          state.corn += 1;
          state.score += RUN.cornScore;
          state.stamina = Math.min(RUN.staminaMax, state.stamina + RUN.cornStamina);
          addPopup(state.effects, pickup.x, pickup.y - 8, `+${RUN.cornScore} 🌽`, '#ffd23f', 16);
          events.corn = true;
        }
        burst(state.effects, rng, pickup.x + 14, pickup.y + 16, '#ffd23f', 7, 80);
      }
    }
    state.pickups = state.pickups.filter((p) => !p.taken && p.x > -70);
  }

  function stepHideSpots(dt, control, events) {
    const turkey = state.turkey;
    const scrollPx = state.speed * PIXELS_PER_METRE * dt;
    for (const spot of state.hideSpots) spot.x -= scrollPx;
    state.hideSpots = state.hideSpots.filter((s) => s.x + s.width > -90);
    const inside = state.hideSpots.some(
      (s) => turkey.x + turkey.width > s.x + 10 && turkey.x < s.x + s.width - 10,
    );
    if (!turkey.hidden && inside && control.duck && turkey.onGround) {
      hideInHaystack(state);
      addPopup(state.effects, turkey.x + 30, turkey.y - 18, 'HIDDEN…', '#b8e6a0', 17);
      events.hid = true;
    } else if (turkey.hidden && !control.duck) {
      leaveHiding(state, events);
    }
  }

  function step(dt, control) {
    const events = {};
    if (state.over) return events;
    state.time += dt;
    stepHideSpots(dt, control, events);
    stepTurkey(state, dt, control, events);
    state.distance += state.speed * dt;
    state.score += state.speed * dt;
    state.scroll += state.speed * PIXELS_PER_METRE * dt;
    const newZone = zoneIndexFor(state.distance);
    if (newZone !== state.zone) {
      state.zone = newZone;
      events.zone = true;
      showBanner(state.effects, `ZONE ${newZone + 1}`, newZone === 1 ? 'PUMPKIN ORCHARD' : 'THE KITCHEN — ALMOST THERE!');
      state.farmer.shout = newZone === 1 ? 'THROUGH THE PUMPKINS!' : 'INTO MY KITCHEN!';
      state.farmer.shoutTime = 1.6;
    }
    if (state.distance >= state.nextSpawnAt) spawnObstacle();
    if (state.distance >= state.nextHideAt) spawnHideSpot();
    stepObstacles(dt, events);
    updateFarmerChase(state, dt, rng, events);
    stepEffects(state.effects, dt);
    if (state.distance >= RUN.escapeDistance && !state.over) {
      state.over = true;
      state.escaped = true;
      state.score += 500;
      events.escaped = true;
    }
    return events;
  }

  return { state, step };
}

export function finalScore(state) {
  return Math.floor(state.score) + state.corn * 10 + Math.floor(state.distance);
}

export function escapeRank(state) {
  const score = finalScore(state);
  if (score >= 3200) return 'LEGENDARY GOBBLER 🏆';
  if (score >= 2600) return 'MASTER ESCAPIST 🥇';
  if (score >= 2100) return 'SPEEDY GOBBLER 🥈';
  return 'LUCKY TURKEY 🍀';
}
