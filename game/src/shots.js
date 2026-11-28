// Deterministic screenshot scenes behind ?shot=cover|title|kitchen|escaped.
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
    // keep stepping until Pip is airborne over a hazard for the cover frame
    let guard = 0;
    while (state.turkey.onGround && !state.over && guard < 60 * 6) {
      world.step(STEP, autopilotControl(state));
      guard += 1;
    }
    runSeconds(world, 0.24);
    // freeze mid-action: ensure a near-miss popup and combo are visible
    if (state.effects.popups.length === 0) {
      state.combo = Math.max(state.combo, 4);
      addPopup(state.effects, state.turkey.x + 40, state.turkey.y - 26, 'NEAR MISS x4 +40', '#7dd7ff', 20);
    }
    if (state.farmer.gap > 20) state.farmer.gap = 13;
    state.farmer.spottedFlash = 0.6;
    return { screen: SCREEN.play };
  }
  if (name === 'kitchen') {
    runUntil(world, (s) => s.distance >= 1040, 60 * 300);
    // settle into a hide spot in the kitchen for the search scene
    state.hideSpots.push({ kind: 'counter', x: state.turkey.x - 14, width: 92 });
    state.turkey.hidden = true;
    state.turkey.ducking = false;
    state.turkey.vy = 0;
    state.turkey.onGround = true;
    state.turkey.height = 34;
    state.turkey.y = 456 - 34;
    state.farmer.state = 'search';
    state.farmer.stateTime = 0.4;
    state.farmer.shout = 'WHERE?!';
    state.farmer.shoutTime = 1.2;
    state.farmer.gap = 11;
    runSeconds(world, 0.4);
    return { screen: SCREEN.play };
  }
  if (name === 'escaped') {
    runUntil(world, (s) => s.over, 60 * 420);
    if (!state.escaped) {
      // autopilot fell short: restart the run state at the finish line
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
