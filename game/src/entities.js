// The two stars: Pip the turkey and Farmer Hank. Turkey physics,
// hiding, and the farmer's chase / warn / lunge / tired / search
// brain — with a gauntlet gear for the final oven stretch.

import { FARMER, inGauntlet, RUN, VIEW } from './config.js';

export const TURKEY_SIZE = { width: 66, height: 56, duckHeight: 34 };
const GROUND = VIEW.groundY;

export function createTurkey() {
  return {
    x: RUN.turkeyX,
    y: GROUND - TURKEY_SIZE.height,
    vy: 0,
    width: TURKEY_SIZE.width,
    height: TURKEY_SIZE.height,
    ducking: false,
    hidden: false,
    onGround: true,
    runPhase: 0,
    stumble: 0,
    invincible: 0,
  };
}

export function createFarmer() {
  return {
    gap: FARMER.startGap,
    state: 'chase', // chase | warn | lunge | tired | search
    stateTime: 0,
    nextLunge: 5.5,
    runPhase: 0,
    shout: '',
    shoutTime: 0,
    spottedFlash: 0,
  };
}

export function turkeySpeed(state, control) {
  const turkey = state.turkey;
  if (turkey.hidden) return 0;
  if (turkey.stumble > 0) return 2.2;
  if (state.power.turbo > 0) return RUN.turboSpeed;
  if (control.brake) return RUN.brakeSpeed;
  if (control.dash && state.stamina > 1) return RUN.dashSpeed;
  return RUN.cruiseSpeed;
}

export function stepTurkey(state, dt, control, events) {
  const turkey = state.turkey;
  turkey.runPhase += dt * (state.power.turbo > 0 ? 20 : control.dash && !turkey.hidden ? 16 : 11);
  if (turkey.stumble > 0) turkey.stumble -= dt;
  if (turkey.invincible > 0) turkey.invincible -= dt;

  const wantDash = control.dash && state.stamina > 1 && !turkey.hidden && turkey.stumble <= 0;
  if (wantDash && state.power.turbo <= 0) state.stamina = Math.max(0, state.stamina - RUN.dashDrain * dt);
  else state.stamina = Math.min(RUN.staminaMax, state.stamina + RUN.dashRegen * dt);
  state.speed = turkeySpeed(state, control);

  turkey.ducking = control.duck && turkey.onGround && !turkey.hidden;
  turkey.height = turkey.ducking || turkey.hidden ? TURKEY_SIZE.duckHeight : TURKEY_SIZE.height;

  if (control.jump && turkey.onGround && !turkey.hidden && turkey.stumble <= 0) {
    turkey.vy = -RUN.jumpVelocity;
    turkey.onGround = false;
    turkey.ducking = false;
    events.jump = true;
  }
  if (!turkey.onGround) {
    turkey.vy += RUN.gravity * dt;
    turkey.y += turkey.vy * dt;
    if (turkey.y >= GROUND - turkey.height) {
      turkey.y = GROUND - turkey.height;
      turkey.vy = 0;
      turkey.onGround = true;
      events.landed = true;
    }
  } else {
    turkey.y = GROUND - turkey.height;
  }
}

export function farmerChaseSpeed(state) {
  const farmer = state.farmer;
  if (farmer.state === 'lunge') return FARMER.lungeSpeed;
  if (farmer.state === 'tired') return FARMER.tiredSpeed;
  if (farmer.state === 'search') return 1.2;
  const gauntlet = inGauntlet(state.distance) ? FARMER.gauntletBonus : 0;
  return FARMER.baseSpeed + FARMER.zoneSpeedBonus[state.zone] + gauntlet + (farmer.state === 'warn' ? 0.4 : 0);
}

export function hideInHaystack(state) {
  const turkey = state.turkey;
  const farmer = state.farmer;
  turkey.hidden = true;
  turkey.ducking = false;
  farmer.state = 'search';
  farmer.stateTime = 0;
  farmer.shout = 'WHERE?!';
  farmer.shoutTime = 1.4;
}

export function leaveHiding(state, events) {
  const turkey = state.turkey;
  const farmer = state.farmer;
  turkey.hidden = false;
  farmer.state = 'chase';
  farmer.stateTime = 0;
  farmer.spottedFlash = 0.8;
  farmer.shout = 'SPOTTED!';
  farmer.shoutTime = 1.2;
  farmer.nextLunge = state.time + 3.5;
  events.spotted = true;
}

export function updateFarmerChase(state, dt, rng, events) {
  const farmer = state.farmer;
  farmer.stateTime += dt;
  farmer.runPhase += dt * (farmer.state === 'lunge' ? 14 : 10);
  if (farmer.shoutTime > 0) farmer.shoutTime -= dt;
  if (farmer.spottedFlash > 0) farmer.spottedFlash -= dt;

  if (farmer.state === 'search') {
    if (!state.turkey.hidden) {
      farmer.state = 'chase';
      farmer.stateTime = 0;
    } else if (farmer.stateTime >= FARMER.searchSeconds) {
      farmer.state = 'tired';
      farmer.stateTime = 0;
      farmer.shout = 'huff… lost it';
      farmer.shoutTime = 1.4;
      farmer.gap = Math.min(FARMER.maxGap, farmer.gap + 9);
    }
  } else if (farmer.state === 'chase' && state.time >= farmer.nextLunge && !state.turkey.hidden) {
    farmer.state = 'warn';
    farmer.stateTime = 0;
    farmer.shout = 'GOTCHA!';
    farmer.shoutTime = FARMER.lungeWarnSeconds + 0.4;
    events.lungeWarn = true;
  } else if (farmer.state === 'warn' && farmer.stateTime >= FARMER.lungeWarnSeconds) {
    farmer.state = 'lunge';
    farmer.stateTime = 0;
    events.lunge = true;
  } else if (farmer.state === 'lunge' && farmer.stateTime >= FARMER.lungeSeconds) {
    farmer.state = 'tired';
    farmer.stateTime = 0;
    farmer.shout = 'pant… pant…';
    farmer.shoutTime = 1.2;
  } else if (farmer.state === 'tired' && farmer.stateTime >= FARMER.tiredSeconds) {
    farmer.state = 'chase';
    farmer.stateTime = 0;
    farmer.nextLunge = state.time + FARMER.lungeCooldown[0] + rng() * (FARMER.lungeCooldown[1] - FARMER.lungeCooldown[0]);
  }

  farmer.gap += (state.speed - farmerChaseSpeed(state)) * dt;
  farmer.gap = Math.min(FARMER.maxGap, farmer.gap);
  if (farmer.gap <= FARMER.catchGap && !state.turkey.hidden && !state.over) {
    state.over = true;
    state.escaped = false;
    events.caught = true;
  }
}
