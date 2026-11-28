// Deterministic screenshot scenes behind ?shot=cover|title|gauntlet|escaped.
// Each scene steps the real simulation with an autopilot (jump ground
// hazards, duck thrown knives, dash out of lunges, hide when the
// farmer closes in) so every screenshot is a genuine frame of play.

import { STEP } from './config.js';
import { addPopup } from './effects.js';
import { SCREEN } from './render.js';

function autopilotControl(state) {
  const turkey = state.turkey;
  const control = { jump: false, duck: false, dash: false, brake: false };
  let nearestGround = Infinity;
  let thrownNear = false;
  for (const obstacle of state.obstacles) {
    const ahead = obstacle.x - (turkey.x + turkey.width);
    if (obstacle.kind === 'knifeThrown') {
      if (ahead > -40 && ahead < 200) thrownNear = true;
    } else if (obstacle.kind !== 'mud' && ahead > -10) {
      nearestGround = Math.min(nearestGround, ahead);
    }
  }
  const hideSpotNear = state.hideSpots.some(
    (s) => turkey.x + turkey.width > s.x + 6 && turkey.x < s.x + s.width - 6,
  );
  if (turkey.hidden) {
    control.duck = state.farmer.state === 'search' || state.farmer.stateTime < 2.2;
    return control;
  }
  if (hideSpotNear && state.farmer.gap < 9 && turkey.onGround && nearestGround > 120) {
    control.duck = true;
    return control;
  }
  if (thrownNear && turkey.onGround) control.duck = true;
  else if (nearestGround < 55 && turkey.onGround) control.jump = true;
  if (state.farmer.state === 'warn' || state.farmer.state === 'lunge') control.dash = true;
  if (state.farmer.gap < 18) control.dash = true;
  return control;
}

function runUntil(world, predicate, maxSteps) {
  let steps = 0;
  while (!predicate(world.state) && !world.state.over && steps < maxSteps) {
    world.step(STEP, autopilotControl(world.state));
    steps += 1;
  }
  return steps;
}

function runSeconds(world, seconds) {
  const steps = Math.floor(seconds / STEP);
  for (let i = 0; i < steps && !world.state.over; i += 1) {
    world.step(STEP, autopilotControl(world.state));
  }
}

export function stageShot(name, world) {
  const state = world.state;
  if (name === 'cover') {
    runSeconds(world, 21);
    let guard = 0;
    while (state.turkey.onGround && !state.over && guard < 60 * 6) {
      world.step(STEP, autopilotControl(state));
      guard += 1;
    }
    runSeconds(world, 0.24);
    if (state.effects.popups.length === 0) {
      state.combo = Math.max(state.combo, 4);
      addPopup(state.effects, state.turkey.x + 40, state.turkey.y - 26, 'NEAR MISS x4 +40', '#7dd7ff', 20);
    }
    if (state.farmer.gap > 20) state.farmer.gap = 13;
    state.farmer.spottedFlash = 0.6;
    // show a power-up chip + shield ring on the cover frame
    state.power.shield = true;
    state.power.turbo = Math.max(state.power.turbo, 2.4);
    return { screen: SCREEN.play };
  }
  if (name === 'gauntlet') {
    runUntil(world, (s) => s.distance >= 1450, 60 * 300);
    if (state.over) {
      // autopilot fell short: restart the run state at the gauntlet mouth
      state.over = false;
      state.lives = Math.max(1, state.lives);
      state.distance = 1432;
      state.zone = 2;
      state.farmer.gap = 14;
      state.turkey.invincible = 1;
      runSeconds(world, 0.6);
    }
    if (!state.over) {
      state.farmer.gap = Math.min(state.farmer.gap, 12);
      state.farmer.spottedFlash = 0.6;
      runSeconds(world, 0.5);
    }
    return { screen: SCREEN.play };
  }
  if (name === 'escaped') {
    runUntil(world, (s) => s.over, 60 * 420);
    if (!state.escaped) {
      state.over = false;
      state.lives = Math.max(1, state.lives);
      state.distance = 1492;
      state.farmer.gap = 30;
      runSeconds(world, 3);
    }
    return { screen: SCREEN.end };
  }
  runSeconds(world, 2);
  return { screen: SCREEN.title };
}
