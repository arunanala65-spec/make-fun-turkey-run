// Screenshot scenes behind ?shot=title|play|kitchen|end.
// Each scene steps the real world simulation with a simple autopilot
// (jump what is on the ground, duck what flies, dash out of lunges),
// so every screenshot is a genuine frame of the game being played.

import { STEP } from './config.js';
import { SCREEN } from './render.js';
import { EVENT } from './world.js';

function autopilotControl(state) {
  const turkey = state.turkey;
  const control = { jump: false, duck: false, dash: false, brake: false };
  let nearestGround = Infinity;
  let thrownNear = false;
  for (const obstacle of state.obstacles) {
    const ahead = obstacle.x - (turkey.x + turkey.width);
    if (obstacle.kind === 'knifeThrown') {
      if (ahead > -40 && ahead < 190) thrownNear = true;
    } else if (obstacle.kind !== 'puddle' && ahead > -10) {
      nearestGround = Math.min(nearestGround, ahead);
    }
  }
  if (thrownNear && turkey.onGround) {
    control.duck = true;
  } else if (nearestGround < 65 && turkey.onGround) {
    control.jump = true;
  }
  if (state.farmer.state === 'warn' || state.farmer.state === 'lunge') control.dash = true;
  if (state.farmer.gap < 16) control.dash = true;
  return control;
}

function runSeconds(world, seconds, reckless = false) {
  const steps = Math.floor(seconds / STEP);
  for (let i = 0; i < steps; i += 1) {
    const control = reckless
      ? { jump: false, duck: false, dash: false, brake: i % 90 < 40 }
      : autopilotControl(world.state);
    const events = world.step(STEP, control);
    if (events & (EVENT.caught | EVENT.escaped)) break;
    if (world.state.over) break;
  }
}

export function stageShot(name, world) {
  if (name === 'play') {
    runSeconds(world, 26);
    return { screen: world.state.over ? SCREEN.end : SCREEN.play };
  }
  if (name === 'kitchen') {
    // Fast-forward: keep the autopilot running until the Kitchen Run.
    let guard = 0;
    while (world.state.distance < 830 && !world.state.over && guard < 60 * 240) {
      world.step(STEP, autopilotControl(world.state));
      guard += 1;
    }
    runSeconds(world, 4);
    return { screen: world.state.over ? SCREEN.end : SCREEN.play };
  }
  if (name === 'end') {
    runSeconds(world, 240, true);
    return { screen: SCREEN.end };
  }
  // title: a few idle seconds so leaves and clouds sit naturally
  runSeconds(world, 2);
  return { screen: SCREEN.title };
}
