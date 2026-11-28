// Juice: particles (feathers, sparks, confetti), floating score
// popups, screen shake, the red edge flash on hit, zone banners
// and turbo flame trails. Data + updates only; render.js draws it.

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

export function confettiRain(effects, rng, width) {
  const colours = ['#ffd23f', '#e05252', '#7cb342', '#4fc3f7', '#f5b63f'];
  for (let i = 0; i < 42; i += 1) {
    effects.particles.push({
      x: rng() * width,
      y: -10 - rng() * 120,
      vx: (rng() - 0.5) * 40,
      vy: 60 + rng() * 90,
      life: 1.6 + rng(),
      colour: colours[i % colours.length],
      size: 4 + rng() * 4,
    });
  }
}

export function flameTrail(effects, rng, x, y) {
  effects.particles.push({
    x: x + (rng() - 0.5) * 10,
    y: y + (rng() - 0.5) * 16,
    vx: -160 - rng() * 80,
    vy: (rng() - 0.5) * 30,
    life: 0.25 + rng() * 0.2,
    colour: rng() < 0.5 ? '#ff7a3c' : '#ffd23f',
    size: 5 + rng() * 6,
  });
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
    p.vy += 300 * dt;
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
