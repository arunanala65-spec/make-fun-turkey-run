// Gobble Dash 2 — shared tuning: view size, run physics, farmer
// behaviour and the three zones Pip escapes through.

export const VIEW = { width: 960, height: 540, groundY: 456 };
export const STEP = 1 / 60;
export const PIXELS_PER_METRE = 44;

export const RUN = {
  escapeDistance: 1500,
  maxLives: 3,
  turkeyX: 320,
  cruiseSpeed: 5.6,
  dashSpeed: 9.2,
  brakeSpeed: 2.6,
  jumpVelocity: 760,
  gravity: 1500,
  staminaMax: 100,
  dashDrain: 30,
  dashRegen: 18,
  cornStamina: 24,
  cornScore: 25,
  stumbleSeconds: 0.85,
  invincibleSeconds: 1.5,
  nearMissClearance: 30,
  maxCombo: 8,
};

export const FARMER = {
  startGap: 26,
  maxGap: 46,
  baseSpeed: 5.15,
  zoneSpeedBonus: [0, 0.45, 0.95],
  lungeSpeed: 10.2,
  lungeSeconds: 1.25,
  lungeWarnSeconds: 0.6,
  lungeCooldown: [6.5, 9.5],
  tiredSeconds: 1.7,
  tiredSpeed: 2.4,
  searchSeconds: 2.6,
  catchGap: 0.4,
};

export const ZONES = [
  { name: 'Farmyard', from: 0, skyTop: '#f8cf7e', skyBottom: '#fdf0cd', ground: '#8a5a33', trim: '#c98f3d' },
  { name: 'Pumpkin Orchard', from: 500, skyTop: '#f4a95c', skyBottom: '#fbd9a0', ground: '#7c4f2c', trim: '#d97b2f' },
  { name: 'The Kitchen', from: 1000, skyTop: '#5d4a3a', skyBottom: '#8a6a4d', ground: '#4c3a2c', trim: '#e8dcc3' },
];

export const OBSTACLE = {
  oven: { width: 84, height: 96 },
  knifeGround: { width: 62, height: 32 },
  hayBale: { width: 68, height: 48 },
  pumpkin: { width: 52, height: 44 },
  mud: { width: 92, height: 14 },
  knifeThrown: { width: 56, height: 16 },
  pot: { width: 58, height: 52 },
};

export function zoneIndexFor(distance) {
  let index = 0;
  for (let i = 0; i < ZONES.length; i += 1) {
    if (distance >= ZONES[i].from) index = i;
  }
  return index;
}

export function zoneName(distance) {
  return ZONES[zoneIndexFor(distance)].name;
}
