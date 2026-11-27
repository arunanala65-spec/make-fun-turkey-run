// The running world: turkey physics, the chasing farmer, obstacle
// spawning, corn pickups, scoring and win/lose rules.
// Pure simulation with no drawing — render.js only reads this state,
// and shots.js can step it headlessly for screenshot scenes.

import { FARMER, OBSTACLE, RUN, VIEW, stageForDistance } from './config.js';
import { makeRng, rngPick, rngRange } from './random.js';

export const EVENT = {
  none: 0,
  corn: 1,
  hit: 2,
  jumped: 4,
  lungeWarn: 8,
  lunge: 16,
  caught: 32,
  escaped: 64,
  stage: 128,
};

const GROUND = VIEW.groundY;
const TURKEY_W = 54;
const TURKEY_H = 46;
const DUCK_H = 28;
const PIXELS_PER_METRE = 46;

function freshTurkey() {
  return {
    x: RUN.turkeyX,
    y: GROUND - TURKEY_H,
    vy: 0,
    width: TURKEY_W,
    height: TURKEY_H,
    ducking: false,
    onGround: true,
    runPhase: 0,
    stumble: 0,
    invincible: 0,
    feathers: 0,
  };
}

function freshFarmer() {
  return {
    gap: FARMER.startGap,
    state: 'chase', // chase | warn | lunge | tired
    stateTime: 0,
    nextLunge: 6,
    runPhase: 0,
    shout: '',
    shoutTime: 0,
  };
}

export function createWorld(seed) {
  const rng = makeRng(seed);
  const state = {
    seed,
    time: 0,
    distance: 0,
    score: 0,
    corn: 0,
    lives: RUN.startLives,
    stamina: RUN.dashStaminaMax,
    speed: RUN.cruiseSpeed,
    stage: 0,
    over: false,
    escaped: false,
    turkey: freshTurkey(),
    farmer: freshFarmer(),
    obstacles: [],
    pickups: [],
    particles: [],
    nextSpawnAt: 26,
    scroll: 0,
  };

  function spawnAhead() {
    const stage = stageForDistance(state.distance);
    const kinds = stage === 0
      ? ['hay', 'knifeGround', 'puddle', 'oven']
      : stage === 1
        ? ['hay', 'knifeGround', 'oven', 'knifeThrown', 'puddle']
        : ['oven', 'knifeGround', 'knifeThrown', 'oven', 'knifeThrown', 'hay'];
    const kind = rngPick(rng, kinds);
    const spec = OBSTACLE[kind];
    const baseY = kind === 'knifeThrown' ? GROUND - 54 : GROUND - spec.height;
    state.obstacles.push({
      kind,
      x: VIEW.width + 60,
      y: baseY,
      width: spec.width,
      height: spec.height,
      vx: kind === 'knifeThrown' ? -150 : 0,
      spin: 0,
      passed: false,
      hitDone: false,
    });
    if (rng() < 0.55) {
      state.pickups.push({
        x: VIEW.width + rngRange(rng, 90, 260),
        y: GROUND - rngRange(rng, 40, 120),
        taken: false,
        bob: rngRange(rng, 0, 6.28),
      });
    }
    const density = 1 - stage * 0.16;
    state.nextSpawnAt = state.distance + rngRange(rng, 16, 30) * density;
  }

  function burst(x, y, colour, count) {
    for (let i = 0; i < count; i += 1) {
      state.particles.push({
        x, y,
        vx: rngRange(rng, -90, 90),
        vy: rngRange(rng, -160, -20),
        life: rngRange(rng, 0.35, 0.8),
        colour,
      });
    }
  }

  function farmerSpeed() {
    const farmer = state.farmer;
    if (farmer.state === 'lunge') return FARMER.lungeSpeed;
    if (farmer.state === 'tired') return FARMER.tiredSpeed;
    if (farmer.state === 'warn') return FARMER.baseSpeed + FARMER.stageSpeedBonus[state.stage] + 0.4;
    return FARMER.baseSpeed + FARMER.stageSpeedBonus[state.stage];
  }

  function stepFarmer(dt, events) {
    const farmer = state.farmer;
    farmer.stateTime += dt;
    farmer.runPhase += dt * (farmer.state === 'lunge' ? 13 : 9);
    if (farmer.shoutTime > 0) farmer.shoutTime -= dt;

    if (farmer.state === 'chase' && state.time >= farmer.nextLunge) {
      farmer.state = 'warn';
      farmer.stateTime = 0;
      farmer.shout = 'GOTCHA!';
      farmer.shoutTime = FARMER.lungeWarnSeconds + 0.4;
      events.value |= EVENT.lungeWarn;
    } else if (farmer.state === 'warn' && farmer.stateTime >= FARMER.lungeWarnSeconds) {
      farmer.state = 'lunge';
      farmer.stateTime = 0;
      events.value |= EVENT.lunge;
    } else if (farmer.state === 'lunge' && farmer.stateTime >= FARMER.lungeSeconds) {
      farmer.state = 'tired';
      farmer.stateTime = 0;
      farmer.shout = 'pant… pant…';
      farmer.shoutTime = 1.2;
    } else if (farmer.state === 'tired' && farmer.stateTime >= FARMER.tiredSeconds) {
      farmer.state = 'chase';
      farmer.stateTime = 0;
      farmer.nextLunge = state.time + rngRange(rng, FARMER.lungeCooldown[0], FARMER.lungeCooldown[1]);
    }

    farmer.gap += (state.speed - farmerSpeed()) * dt;
    farmer.gap = Math.min(FARMER.maxGap, farmer.gap);
    if (farmer.gap <= FARMER.catchGap && !state.over) {
      state.over = true;
      state.escaped = false;
      events.value |= EVENT.caught;
    }
  }

  function stepTurkey(dt, control, events) {
    const turkey = state.turkey;
    turkey.runPhase += dt * (control.dash ? 15 : 10);
    if (turkey.stumble > 0) turkey.stumble -= dt;
    if (turkey.invincible > 0) turkey.invincible -= dt;

    const wantDash = control.dash && state.stamina > 1 && turkey.stumble <= 0;
    if (control.brake) state.speed = RUN.brakeSpeed;
    else if (wantDash) state.speed = RUN.dashSpeed;
    else state.speed = RUN.cruiseSpeed;
    if (turkey.stumble > 0) state.speed = Math.min(state.speed, 2.2);

    if (wantDash && !control.brake) state.stamina = Math.max(0, state.stamina - RUN.dashDrain * dt);
    else state.stamina = Math.min(RUN.dashStaminaMax, state.stamina + RUN.dashRegen * dt);

    turkey.ducking = control.duck && turkey.onGround;
    turkey.height = turkey.ducking ? DUCK_H : TURKEY_H;

    if (control.jump && turkey.onGround && turkey.stumble <= 0) {
      turkey.vy = -RUN.jumpVelocity;
      turkey.onGround = false;
      turkey.ducking = false;
      events.value |= EVENT.jumped;
    }
    if (!turkey.onGround) {
      turkey.vy += RUN.gravity * dt;
      turkey.y += turkey.vy * dt;
      if (turkey.y >= GROUND - turkey.height) {
        turkey.y = GROUND - turkey.height;
        turkey.vy = 0;
        turkey.onGround = true;
        burst(turkey.x + 20, GROUND, '#d9b380', 5);
      }
    } else {
      turkey.y = GROUND - turkey.height;
    }
  }

  function overlaps(a, b, padX, padY) {
    return a.x + padX < b.x + b.width && a.x + a.width - padX > b.x
      && a.y + padY < b.y + b.height && a.y + a.height - padY > b.y;
  }

  function stepObstacles(dt, events) {
    const turkey = state.turkey;
    const scrollPx = state.speed * PIXELS_PER_METRE * dt;
    for (const obstacle of state.obstacles) {
      obstacle.x -= scrollPx - obstacle.vx * dt;
      obstacle.spin += dt * 9;
      if (!obstacle.passed && obstacle.x + obstacle.width < turkey.x) {
        obstacle.passed = true;
        state.score += 15;
      }
      if (obstacle.hitDone || turkey.invincible > 0) continue;
      const hit = obstacle.kind === 'puddle'
        ? turkey.onGround && overlaps(turkey, obstacle, 10, 4)
        : overlaps(turkey, obstacle, 9, 7);
      if (hit) {
        obstacle.hitDone = true;
        if (obstacle.kind === 'puddle') {
          turkey.stumble = RUN.stumbleSeconds;
          state.farmer.gap = Math.max(FARMER.catchGap, state.farmer.gap - 5);
          burst(turkey.x + 26, GROUND - 4, '#7a5a38', 8);
          events.value |= EVENT.hit;
        } else {
          state.lives -= 1;
          turkey.stumble = RUN.stumbleSeconds;
          turkey.invincible = RUN.invincibleSeconds;
          turkey.feathers += 1;
          state.farmer.gap = Math.max(FARMER.catchGap, state.farmer.gap - 7);
          burst(turkey.x + 26, turkey.y + 16, '#f3e2c7', 10);
          events.value |= EVENT.hit;
          if (state.lives <= 0) {
            state.over = true;
            state.escaped = false;
            events.value |= EVENT.caught;
          }
        }
      }
    }
    state.obstacles = state.obstacles.filter((o) => o.x + o.width > -80);

    for (const pickup of state.pickups) {
      pickup.x -= scrollPx;
      pickup.bob += dt * 4;
      if (!pickup.taken && overlaps(turkey, { x: pickup.x, y: pickup.y, width: 26, height: 34 }, 2, 2)) {
        pickup.taken = true;
        state.corn += 1;
        state.score += RUN.cornScore;
        state.stamina = Math.min(RUN.dashStaminaMax, state.stamina + RUN.cornStamina);
        burst(pickup.x + 13, pickup.y + 14, '#ffd23f', 7);
        events.value |= EVENT.corn;
      }
    }
    state.pickups = state.pickups.filter((p) => !p.taken && p.x > -60);
  }

  function stepParticles(dt) {
    for (const particle of state.particles) {
      particle.life -= dt;
      particle.x += particle.vx * dt;
      particle.y += particle.vy * dt;
      particle.vy += 420 * dt;
    }
    state.particles = state.particles.filter((p) => p.life > 0);
  }

  function step(dt, control) {
    const events = { value: EVENT.none };
    if (state.over) return events.value;
    state.time += dt;
    const beforeStage = state.stage;
    stepTurkey(dt, control, events);
    state.distance += state.speed * dt;
    state.score += RUN.metreScore * state.speed * dt;
    state.scroll += state.speed * PIXELS_PER_METRE * dt;
    state.stage = stageForDistance(state.distance);
    if (state.stage !== beforeStage) {
      events.value |= EVENT.stage;
      state.farmer.shout = state.stage === 1 ? 'INTO THE BARN!' : 'TO THE KITCHEN!';
      state.farmer.shoutTime = 1.6;
    }
    if (state.distance >= state.nextSpawnAt) spawnAhead();
    stepObstacles(dt, events);
    stepFarmer(dt, events);
    stepParticles(dt);
    if (state.distance >= RUN.escapeDistance && !state.over) {
      state.over = true;
      state.escaped = true;
      state.score += 500;
      events.value |= EVENT.escaped;
    }
    return events.value;
  }

  return { state, step };
}

export function finalScore(state) {
  return Math.floor(state.score) + state.corn * 10 + Math.floor(state.distance);
}
