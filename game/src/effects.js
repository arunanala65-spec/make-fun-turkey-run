// Juice: particles, floating score popups, screen shake and the
// red edge flash when Pip gets hit. Pure data + update helpers;
// render.js draws whatever this module keeps alive.

export function createEffects() {
  return { particles: [], popups: [], shake: 0, flash: 0, banner: null };
}

export function burst(effects, rng, x, y, colour, count, speed = 120) {
  for (let i = 0; i < count; i += 1) {
    const angle = rng() * Math.PI * 2;
    const velocity = speed * (0.3 + rng() * 0.7);
    effects.particles.push({
      x, y,
      vx: Math.cos(angle) * velocity,
      vy: Math.sin(angle) * velocity - 60,
      life: 0.4 + rng() * 0.5,
      colour,
      size: 3 + rng() * 4,
    });
  }
}

export function featherBurst(effects, rng, x, y) {
  burst(effects, rng, x, y, '#f3e2c7', 12, 90);
  burst(effects, rng, x, y, '#b0632f', 6, 70);
}

export function addPopup(effects, x, y, text, colour = '#ffd23f', size = 18) {
  effects.popups.push({ x, y, text, colour, size, life: 1.1 });
}

export function addShake(effects, amount) {
  effects.shake = Math.max(effects.shake, amount);
}

export function addFlash(effects) {
  effects.flash = 0.55;
}

export function showBanner(effects, title, subtitle) {
  effects.banner = { title, subtitle, life: 2.4 };
}

export function stepEffects(effects, dt) {
  for (const p of effects.particles) {
    p.life -= dt;
    p.x += p.vx * dt;
    p.y += p.vy * dt;
    p.vy += 380 * dt;
  }
  effects.particles = effects.particles.filter((p) => p.life > 0);
  for (const popup of effects.popups) {
    popup.life -= dt;
    popup.y -= 42 * dt;
  }
  effects.popups = effects.popups.filter((p) => p.life > 0);
  effects.shake = Math.max(0, effects.shake - dt * 26);
  effects.flash = Math.max(0, effects.flash - dt * 1.6);
  if (effects.banner) {
    effects.banner.life -= dt;
    if (effects.banner.life <= 0) effects.banner = null;
  }
}

export function shakeOffset(effects, rng) {
  if (effects.shake <= 0.2) return { x: 0, y: 0 };
  return { x: (rng() - 0.5) * effects.shake, y: (rng() - 0.5) * effects.shake };
}
