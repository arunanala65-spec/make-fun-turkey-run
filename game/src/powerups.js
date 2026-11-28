// Pip's power-ups: the chili pepper (turbo — free top speed with a
// flame trail), the shield feather (blocks one hit) and the corn
// magnet (pulls nearby corn in). Spawned, collected and timed here.

import { POWERUP } from './config.js';
import { addPopup, burst } from './effects.js';

export const POWERUP_KINDS = ['chili', 'shield', 'magnet'];

export function createPowerupState() {
  return { turbo: 0, shield: false, magnet: 0 };
}

export function powerupLabel(kind) {
  if (kind === 'chili') return '🌶 CHILI TURBO!';
  if (kind === 'shield') return '🛡 SHIELD FEATHER!';
  return '🧲 CORN MAGNET!';
}

export function collectPowerup(state, kind, x, y, rng, events) {
  const power = state.power;
  if (kind === 'chili') power.turbo = POWERUP.turboSeconds;
  else if (kind === 'shield') power.shield = true;
  else power.magnet = POWERUP.magnetSeconds;
  addPopup(state.effects, x, y - 10, powerupLabel(kind), '#ffb03a', 19);
  burst(state.effects, rng, x + 12, y + 14, '#ffb03a', 9, 90);
  events.powerup = kind;
}

export function stepPowerups(state, dt) {
  if (state.power.turbo > 0) state.power.turbo -= dt;
  if (state.power.magnet > 0) state.power.magnet -= dt;
}

export function magnetPull(state, pickup, dt) {
  if (state.power.magnet <= 0) return;
  const turkey = state.turkey;
  const dx = (turkey.x + turkey.width / 2) - (pickup.x + 14);
  const dy = (turkey.y + turkey.height / 2) - (pickup.y + 18);
  const distance = Math.hypot(dx, dy);
  if (distance < POWERUP.magnetRadius && distance > 4) {
    const pull = 420 * dt;
    pickup.x += (dx / distance) * pull;
    pickup.y += (dy / distance) * pull;
  }
}

export function activePowerupChips(state) {
  const chips = [];
  if (state.power.turbo > 0) chips.push({ text: `🌶 TURBO ${state.power.turbo.toFixed(1)}s`, colour: '#ff7a3c' });
  if (state.power.shield) chips.push({ text: '🛡 SHIELD', colour: '#4fc3f7' });
  if (state.power.magnet > 0) chips.push({ text: `🧲 MAGNET ${state.power.magnet.toFixed(0)}s`, colour: '#ffd23f' });
  return chips;
}
