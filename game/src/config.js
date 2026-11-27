// Gobble Dash — Last Turkey Out!  Shared tuning for the whole game.
// One place for sizes, speeds and stage thresholds so world.js and
// render.js always agree about the field the turkey runs on.

export const VIEW = { width: 960, height: 540, groundY: 452 };
export const STEP = 1 / 60;

export const RUN = {
  escapeDistance: 1200, // metres to freedom
  startLives: 3,
  maxLives: 5,
  turkeyX: 300, // turkey stays near here; the world scrolls past
  cruiseSpeed: 5.2, // metres per second at a steady trot
  dashSpeed: 8.6,
  brakeSpeed: 2.4,
  jumpVelocity: 720,
  gravity: 1450,
  dashStaminaMax: 100,
  dashDrain: 34, // per second while dashing
  dashRegen: 16, // per second while not dashing
  cornStamina: 22,
  cornScore: 25,
  metreScore: 1,
  stumbleSeconds: 0.9,
  invincibleSeconds: 1.4,
};

export const FARMER = {
  startGap: 30, // metres behind the turkey at the start
  maxGap: 48,
  baseSpeed: 5.0,
  stageSpeedBonus: [0, 0.5, 1.05],
  lungeSpeed: 9.8,
  lungeSeconds: 1.3,
  lungeWarnSeconds: 0.65,
  lungeCooldown: [7, 10], // seconds between lunges (min, max)
  tiredSeconds: 1.6,
  tiredSpeed: 2.6,
  catchGap: 0.4,
};

export const STAGES = [
  { name: 'Farmyard', from: 0, skyTop: '#f7c873', skyBottom: '#fdeec9', ground: '#8a5a33', grass: '#c98f3d' },
  { name: 'Barnyard', from: 400, skyTop: '#f2a65a', skyBottom: '#fbd9a0', ground: '#7c4f2c', grass: '#b87a34' },
  { name: 'Kitchen Run', from: 800, skyTop: '#e07a4a', skyBottom: '#f6c489', ground: '#6e4526', grass: '#a96a2e' },
];

export const OBSTACLE = {
  oven: { width: 74, height: 86, label: 'OVEN' },
  knifeGround: { width: 56, height: 30, label: 'KNIFE' },
  hay: { width: 62, height: 44, label: 'HAY' },
  puddle: { width: 84, height: 14, label: 'MUD' },
  knifeThrown: { width: 52, height: 16, label: 'KNIFE' },
};

export function stageForDistance(distance) {
  let index = 0;
  for (let i = 0; i < STAGES.length; i += 1) {
    if (distance >= STAGES[i].from) index = i;
  }
  return index;
}

export function stageName(distance) {
  return STAGES[stageForDistance(distance)].name;
}
