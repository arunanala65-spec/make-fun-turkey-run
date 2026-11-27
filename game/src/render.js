// All drawing for Gobble Dash: autumn farm scenery, Pip the turkey,
// Farmer Hank with his carving knife, ovens, hay, corn and the HUD.
// Screens (title, pause, caught, escaped) are drawn here too so a
// screenshot always shows the complete game at a glance.

import { RUN, STAGES, VIEW } from './config.js';
import { finalScore } from './world.js';

export const SCREEN = { title: 'title', play: 'play', pause: 'pause', end: 'end' };

const INK = '#3a2415';
const CREAM = '#fff6e3';

export const BUTTONS = {
  start: { x: 350, y: 356, width: 260, height: 56, label: '▶  START RUNNING' },
  restart: { x: 350, y: 392, width: 260, height: 56, label: '↻  RUN AGAIN (R)' },
  resume: { x: 350, y: 300, width: 260, height: 52, label: '▶  RESUME (P)' },
};

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function text(ctx, value, x, y, size, colour, align = 'left', weight = 'bold') {
  ctx.font = `${weight} ${size}px Verdana, Geneva, sans-serif`;
  ctx.textAlign = align;
  ctx.textBaseline = 'middle';
  ctx.fillStyle = colour;
  ctx.fillText(value, x, y);
}

function drawSky(ctx, stage, scroll) {
  const palette = STAGES[stage];
  const gradient = ctx.createLinearGradient(0, 0, 0, VIEW.groundY);
  gradient.addColorStop(0, palette.skyTop);
  gradient.addColorStop(1, palette.skyBottom);
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, VIEW.width, VIEW.groundY);
  // low autumn sun
  ctx.fillStyle = '#fff3c4';
  ctx.beginPath();
  ctx.arc(830, 84, 40, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = 'rgba(255,255,255,0.75)';
  for (let i = 0; i < 4; i += 1) {
    const cx = ((i * 280 - scroll * 0.12) % 1120 + 1120) % 1120 - 80;
    ctx.beginPath();
    ctx.ellipse(cx, 60 + (i % 2) * 34, 52, 15, 0, 0, Math.PI * 2);
    ctx.ellipse(cx + 34, 66 + (i % 2) * 34, 38, 12, 0, 0, Math.PI * 2);
    ctx.fill();
  }
}

function drawBarn(ctx, x, stage) {
  ctx.fillStyle = stage === 2 ? '#8a4b3a' : '#a33b2e';
  ctx.fillRect(x, 300, 150, 152);
  ctx.fillStyle = '#6e2418';
  ctx.beginPath();
  ctx.moveTo(x - 12, 302);
  ctx.lineTo(x + 75, 248);
  ctx.lineTo(x + 162, 302);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = '#f7e8c9';
  ctx.fillRect(x + 52, 352, 46, 100);
  ctx.strokeStyle = '#6e2418';
  ctx.lineWidth = 4;
  ctx.strokeRect(x + 52, 352, 46, 100);
  ctx.beginPath();
  ctx.moveTo(x + 52, 352);
  ctx.lineTo(x + 98, 452);
  ctx.moveTo(x + 98, 352);
  ctx.lineTo(x + 52, 452);
  ctx.stroke();
  ctx.fillStyle = '#ffd23f';
  ctx.fillRect(x + 16, 318, 26, 22);
  ctx.fillRect(x + 108, 318, 26, 22);
  text(ctx, stage === 2 ? 'KITCHEN' : 'BARN', x + 75, 282, 15, '#fff6e3', 'center');
}

function drawTree(ctx, x, scale) {
  ctx.fillStyle = '#6e4526';
  ctx.fillRect(x - 5 * scale, 452 - 66 * scale, 10 * scale, 66 * scale);
  const blobs = ['#d96c2c', '#e88f3a', '#c7532a', '#e0a83e'];
  for (let i = 0; i < 4; i += 1) {
    ctx.fillStyle = blobs[i];
    ctx.beginPath();
    ctx.arc(x + (i - 1.5) * 20 * scale, 452 - (84 + (i % 2) * 16) * scale, 26 * scale, 0, Math.PI * 2);
    ctx.fill();
  }
}

function drawScenery(ctx, state) {
  drawSky(ctx, state.stage, state.scroll);
  const barnX = 1080 - ((state.scroll * 0.35) % 1500);
  drawBarn(ctx, barnX, state.stage);
  for (let i = 0; i < 3; i += 1) {
    const tx = 1100 - (((state.scroll * 0.55) + i * 420) % 1260);
    drawTree(ctx, tx, 0.9 + (i % 2) * 0.25);
  }
  // fence line
  ctx.fillStyle = '#9c6b40';
  const fenceOff = -(state.scroll % 64);
  for (let x = fenceOff; x < VIEW.width; x += 64) {
    ctx.fillRect(x + 26, 404, 9, 48);
  }
  ctx.fillRect(0, 416, VIEW.width, 7);
  ctx.fillRect(0, 436, VIEW.width, 7);
  // ground
  const palette = STAGES[state.stage];
  ctx.fillStyle = palette.ground;
  ctx.fillRect(0, VIEW.groundY, VIEW.width, VIEW.height - VIEW.groundY);
  ctx.fillStyle = palette.grass;
  ctx.fillRect(0, VIEW.groundY, VIEW.width, 10);
  ctx.fillStyle = 'rgba(0,0,0,0.18)';
  const dashOff = -(state.scroll % 90);
  for (let x = dashOff; x < VIEW.width; x += 90) {
    ctx.fillRect(x, VIEW.groundY + 34, 44, 6);
  }
  // falling leaves
  ctx.fillStyle = '#e88f3a';
  for (let i = 0; i < 10; i += 1) {
    const lx = ((i * 173 + state.time * 36) % 1000) - 20;
    const ly = 90 + ((i * 61 + state.time * 22) % 300);
    ctx.save();
    ctx.translate(lx, ly);
    ctx.rotate(state.time + i);
    ctx.fillRect(-5, -2, 10, 4);
    ctx.restore();
  }
}

function drawTurkey(ctx, turkey, time) {
  const blink = turkey.invincible > 0 && Math.floor(time * 14) % 2 === 0;
  ctx.save();
  ctx.translate(turkey.x, turkey.y);
  if (blink) ctx.globalAlpha = 0.35;
  const legSwing = turkey.onGround ? Math.sin(turkey.runPhase) * 9 : 4;
  ctx.strokeStyle = '#e8a13a';
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.moveTo(20, turkey.height - 6);
  ctx.lineTo(20 + legSwing, turkey.height + 6);
  ctx.moveTo(32, turkey.height - 6);
  ctx.lineTo(32 - legSwing, turkey.height + 6);
  ctx.stroke();
  // tail fan
  const fan = ['#8a4b26', '#b0632f', '#d98a44', '#b0632f', '#8a4b26'];
  for (let i = 0; i < 5; i += 1) {
    ctx.save();
    ctx.translate(8, turkey.height - 16);
    ctx.rotate(-0.9 + i * 0.32);
    ctx.fillStyle = fan[i];
    ctx.beginPath();
    ctx.ellipse(0, -20, 8, 22, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
  // body
  ctx.fillStyle = '#7a4a28';
  ctx.beginPath();
  ctx.ellipse(28, turkey.height - 20, 27, 19, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#96602f';
  ctx.beginPath();
  ctx.ellipse(32, turkey.height - 24, 18, 12, -0.3, 0, Math.PI * 2);
  ctx.fill();
  // head + wattle + beak
  const headY = turkey.ducking ? turkey.height - 30 : turkey.height - 40;
  ctx.fillStyle = '#c9a06a';
  ctx.beginPath();
  ctx.arc(52, headY, 10, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#e05252';
  ctx.beginPath();
  ctx.ellipse(56, headY + 9, 4, 7, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#f5b63f';
  ctx.beginPath();
  ctx.moveTo(60, headY - 2);
  ctx.lineTo(70, headY + 1);
  ctx.lineTo(60, headY + 4);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = INK;
  ctx.beginPath();
  ctx.arc(55, headY - 3, 2, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function drawFarmer(ctx, farmer, turkeyX, time) {
  const gapPx = Math.min(380, farmer.gap * 5.5);
  const fx = Math.max(-70, turkeyX - 66 - gapPx);
  const ground = VIEW.groundY;
  const legSwing = Math.sin(farmer.runPhase) * 11;
  ctx.save();
  ctx.translate(fx, ground);
  // legs + boots
  ctx.strokeStyle = '#33506e';
  ctx.lineWidth = 7;
  ctx.beginPath();
  ctx.moveTo(16, -42);
  ctx.lineTo(16 + legSwing, -4);
  ctx.moveTo(28, -42);
  ctx.lineTo(28 - legSwing, -4);
  ctx.stroke();
  // overalls body
  ctx.fillStyle = '#3f6d9e';
  roundRect(ctx, 4, -92, 36, 54, 8);
  ctx.fill();
  ctx.fillStyle = '#c94f38';
  roundRect(ctx, 2, -116, 40, 30, 8);
  ctx.fill();
  // arms: one holds the carving knife up
  ctx.strokeStyle = '#c94f38';
  ctx.lineWidth = 7;
  ctx.beginPath();
  ctx.moveTo(40, -106);
  ctx.lineTo(58, -124);
  ctx.moveTo(6, -106);
  ctx.lineTo(-8, -84 + legSwing * 0.4);
  ctx.stroke();
  // carving knife in hand
  ctx.save();
  ctx.translate(58, -124);
  ctx.rotate(-0.5 + Math.sin(time * 6) * 0.08);
  ctx.fillStyle = '#5a3a22';
  ctx.fillRect(-3, -4, 16, 7);
  ctx.fillStyle = '#dfe6ee';
  ctx.beginPath();
  ctx.moveTo(12, -5);
  ctx.lineTo(42, -1);
  ctx.lineTo(12, 5);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
  // head + hat
  ctx.fillStyle = '#f0c297';
  ctx.beginPath();
  ctx.arc(22, -128, 13, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#e8b53a';
  ctx.fillRect(2, -140, 40, 7);
  ctx.fillRect(10, -152, 24, 13);
  ctx.fillStyle = INK;
  ctx.beginPath();
  ctx.arc(27, -130, 2, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
  // lunge warning / shout bubble
  if (farmer.state === 'warn') {
    text(ctx, '!', fx + 22, ground - 182, 34, '#d63c2a', 'center');
  }
  if (farmer.shoutTime > 0 && farmer.shout) {
    const w = farmer.shout.length * 9 + 18;
    ctx.fillStyle = CREAM;
    roundRect(ctx, fx + 6, ground - 212, w, 26, 8);
    ctx.fill();
    ctx.strokeStyle = INK;
    ctx.lineWidth = 2;
    ctx.stroke();
    text(ctx, farmer.shout, fx + 6 + w / 2, ground - 199, 13, INK, 'center');
  }
}

function drawOven(ctx, o, time) {
  ctx.fillStyle = '#4a4a52';
  roundRect(ctx, o.x, o.y, o.width, o.height, 6);
  ctx.fill();
  ctx.fillStyle = '#2c2c33';
  ctx.fillRect(o.x + 8, o.y + 8, o.width - 16, 10);
  const glow = 0.75 + Math.sin(time * 7) * 0.25;
  ctx.fillStyle = `rgba(255,${Math.floor(120 * glow)},40,0.95)`;
  ctx.fillRect(o.x + 12, o.y + 30, o.width - 24, 34);
  ctx.fillStyle = '#ffd23f';
  for (let i = 0; i < 3; i += 1) ctx.beginPath(), ctx.arc(o.x + 18 + i * 20, o.y + 13, 4, 0, Math.PI * 2), ctx.fill();
  text(ctx, 'OVEN 350°', o.x + o.width / 2, o.y + o.height - 10, 11, '#fff6e3', 'center');
  ctx.fillStyle = 'rgba(255,160,60,0.5)';
  ctx.beginPath();
  ctx.ellipse(o.x + o.width / 2, o.y - 6 - Math.sin(time * 5) * 3, 16, 7, 0, 0, Math.PI * 2);
  ctx.fill();
}

function drawKnifeGround(ctx, o) {
  ctx.save();
  ctx.translate(o.x + o.width / 2, o.y + o.height);
  ctx.fillStyle = '#dfe6ee';
  ctx.beginPath();
  ctx.moveTo(-26, 0);
  ctx.lineTo(8, -26);
  ctx.lineTo(26, -6);
  ctx.lineTo(10, 0);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = '#8fa3b8';
  ctx.lineWidth = 2;
  ctx.stroke();
  ctx.fillStyle = '#5a3a22';
  ctx.fillRect(8, -8, 20, 8);
  ctx.restore();
  text(ctx, 'KNIFE!', o.x + o.width / 2, o.y - 10, 11, '#d63c2a', 'center');
}

function drawKnifeThrown(ctx, o) {
  ctx.save();
  ctx.translate(o.x + o.width / 2, o.y + o.height / 2);
  ctx.rotate(o.spin);
  ctx.fillStyle = '#dfe6ee';
  ctx.beginPath();
  ctx.moveTo(-24, -3);
  ctx.lineTo(10, -6);
  ctx.lineTo(24, 0);
  ctx.lineTo(10, 6);
  ctx.lineTo(-24, 3);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = '#5a3a22';
  ctx.fillRect(-24, -3, 10, 6);
  ctx.restore();
  text(ctx, 'DUCK!', o.x + o.width / 2, o.y - 12, 11, '#d63c2a', 'center');
}

function drawHay(ctx, o) {
  ctx.fillStyle = '#e3b94e';
  roundRect(ctx, o.x, o.y, o.width, o.height, 8);
  ctx.fill();
  ctx.strokeStyle = '#b98a2e';
  ctx.lineWidth = 2;
  for (let i = 1; i < 4; i += 1) {
    ctx.beginPath();
    ctx.moveTo(o.x + i * (o.width / 4), o.y + 4);
    ctx.lineTo(o.x + i * (o.width / 4) - 6, o.y + o.height - 4);
    ctx.stroke();
  }
  text(ctx, 'HAY', o.x + o.width / 2, o.y + o.height / 2, 12, '#7a5a14', 'center');
}

function drawPuddle(ctx, o) {
  ctx.fillStyle = '#5d4326';
  ctx.beginPath();
  ctx.ellipse(o.x + o.width / 2, o.y + o.height - 4, o.width / 2, 9, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = 'rgba(255,255,255,0.25)';
  ctx.beginPath();
  ctx.ellipse(o.x + o.width / 2 - 10, o.y + o.height - 7, 16, 3, 0, 0, Math.PI * 2);
  ctx.fill();
}

function drawCorn(ctx, pickup) {
  const y = pickup.y + Math.sin(pickup.bob) * 4;
  ctx.save();
  ctx.translate(pickup.x + 13, y + 17);
  ctx.rotate(0.4);
  ctx.fillStyle = '#ffd23f';
  roundRect(ctx, -7, -15, 14, 30, 7);
  ctx.fill();
  ctx.strokeStyle = '#d9a41f';
  ctx.lineWidth = 1.5;
  for (let i = -1; i <= 1; i += 1) {
    ctx.beginPath();
    ctx.moveTo(i * 5, -13);
    ctx.lineTo(i * 5, 13);
    ctx.stroke();
  }
  ctx.fillStyle = '#7cb342';
  ctx.beginPath();
  ctx.moveTo(-7, 8);
  ctx.lineTo(-16, 18);
  ctx.lineTo(-5, 16);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

function drawParticles(ctx, particles) {
  for (const p of particles) {
    ctx.globalAlpha = Math.max(0, Math.min(1, p.life * 2));
    ctx.fillStyle = p.colour;
    ctx.fillRect(p.x - 3, p.y - 3, 6, 6);
  }
  ctx.globalAlpha = 1;
}

function drawHud(ctx, state, best) {
  ctx.fillStyle = 'rgba(58,36,21,0.82)';
  roundRect(ctx, 12, 10, 936, 58, 12);
  ctx.fill();
  text(ctx, `SCORE ${finalScore(state)}`, 28, 30, 19, '#ffd23f');
  text(ctx, `BEST ${best}`, 28, 54, 12, '#f7e8c9', 'left', 'normal');
  text(ctx, `${Math.floor(state.distance)}m / ${RUN.escapeDistance}m`, 480, 30, 19, CREAM, 'center');
  text(ctx, STAGES[state.stage].name.toUpperCase(), 480, 54, 12, '#f7c873', 'center', 'normal');
  // lives as feathers
  for (let i = 0; i < RUN.maxLives; i += 1) {
    ctx.fillStyle = i < state.lives ? '#e05252' : 'rgba(255,255,255,0.25)';
    const hx = 700 + i * 26;
    ctx.beginPath();
    ctx.moveTo(hx, 36);
    ctx.bezierCurveTo(hx - 9, 24, hx - 3, 16, hx, 24);
    ctx.bezierCurveTo(hx + 3, 16, hx + 9, 24, hx, 36);
    ctx.fill();
  }
  text(ctx, `🌽 ${state.corn}`, 852, 30, 17, '#ffd23f', 'center');
  // distance progress
  ctx.fillStyle = 'rgba(255,255,255,0.25)';
  roundRect(ctx, 330, 62, 300, 5, 3);
  ctx.fill();
  ctx.fillStyle = '#7cb342';
  roundRect(ctx, 330, 62, 300 * Math.min(1, state.distance / RUN.escapeDistance), 5, 3);
  ctx.fill();
  // farmer gap meter
  const gapRatio = Math.max(0, Math.min(1, state.farmer.gap / 70));
  text(ctx, 'FARMER', 28, 86, 11, gapRatio < 0.25 ? '#ff7a5c' : CREAM);
  ctx.fillStyle = 'rgba(58,36,21,0.7)';
  roundRect(ctx, 88, 79, 170, 13, 6);
  ctx.fill();
  ctx.fillStyle = gapRatio < 0.25 ? '#e05252' : gapRatio < 0.5 ? '#f5b63f' : '#7cb342';
  roundRect(ctx, 90, 81, 166 * gapRatio, 9, 4);
  ctx.fill();
  text(ctx, `${state.farmer.gap.toFixed(0)}m`, 266, 86, 11, CREAM);
  // dash stamina
  text(ctx, 'DASH', 700, 86, 11, CREAM);
  ctx.fillStyle = 'rgba(58,36,21,0.7)';
  roundRect(ctx, 744, 79, 140, 13, 6);
  ctx.fill();
  ctx.fillStyle = '#4fc3f7';
  roundRect(ctx, 746, 81, 136 * (state.stamina / RUN.dashStaminaMax), 9, 4);
  ctx.fill();
  if (state.farmer.state === 'warn') {
    text(ctx, '⚠ FARMER LUNGING — DASH! (SHIFT)', 480, 108, 17, '#d63c2a', 'center');
  } else if (state.turkey.stumble > 0) {
    text(ctx, 'STUMBLED!', state.turkey.x + 28, state.turkey.y - 18, 14, '#d63c2a', 'center');
  }
}

function drawButton(ctx, button, hover) {
  ctx.fillStyle = hover ? '#e88f3a' : '#d96c2c';
  roundRect(ctx, button.x, button.y, button.width, button.height, 14);
  ctx.fill();
  ctx.strokeStyle = INK;
  ctx.lineWidth = 3;
  ctx.stroke();
  text(ctx, button.label, button.x + button.width / 2, button.y + button.height / 2 + 1, 19, CREAM, 'center');
}

function drawTitle(ctx, state, best) {
  drawScenery(ctx, state);
  drawFarmer(ctx, { ...state.farmer, gap: 10, state: 'chase', shout: '', shoutTime: 0 }, 800, state.time);
  drawTurkey(ctx, { ...state.turkey, x: 800, y: VIEW.groundY - 46 }, state.time);
  ctx.fillStyle = 'rgba(58,36,21,0.55)';
  ctx.fillRect(0, 0, VIEW.width, 300);
  text(ctx, '🦃 GOBBLE DASH', 480, 78, 52, '#ffd23f', 'center');
  text(ctx, '— LAST TURKEY OUT! —', 480, 124, 22, CREAM, 'center');
  text(ctx, 'Pip the turkey is NOT becoming Thanksgiving dinner.', 480, 160, 16, '#f7e8c9', 'center', 'normal');
  text(ctx, 'Outrun Farmer Hank, leap the OVEN, duck the CARVING KNIFE,', 480, 186, 16, '#f7e8c9', 'center', 'normal');
  text(ctx, `grab corn and run ${RUN.escapeDistance}m to freedom!`, 480, 210, 16, '#f7e8c9', 'center', 'normal');
  text(ctx, '← → / A D  run & brake      ↑ / W / SPACE / CLICK  jump', 480, 248, 14, CREAM, 'center', 'normal');
  text(ctx, '↓ / S  duck knives      SHIFT  dash      P pause      M sound', 480, 272, 14, CREAM, 'center', 'normal');
  drawButton(ctx, BUTTONS.start, false);
  text(ctx, `BEST ${best}   ·   Farmyard → Barnyard → Kitchen Run`, 480, 436, 14, INK, 'center');
}

function drawEnd(ctx, state, best) {
  drawScenery(ctx, state);
  for (const o of state.obstacles) {
    if (o.kind === 'oven') drawOven(ctx, o, state.time);
    else if (o.kind === 'knifeGround') drawKnifeGround(ctx, o);
    else if (o.kind === 'knifeThrown') drawKnifeThrown(ctx, o);
    else if (o.kind === 'hay') drawHay(ctx, o);
    else drawPuddle(ctx, o);
  }
  if (!state.escaped) {
    drawFarmer(ctx, { ...state.farmer, gap: 4, state: 'chase', shout: '', shoutTime: 0 }, state.turkey.x, state.time);
  }
  drawTurkey(ctx, state.turkey, state.time);
  ctx.fillStyle = 'rgba(58,36,21,0.62)';
  ctx.fillRect(0, 0, VIEW.width, VIEW.height);
  if (state.escaped) {
    text(ctx, '🎉 PIP ESCAPED!', 480, 150, 46, '#7cb342', 'center');
    text(ctx, 'No turkey on this table. Thanksgiving is saved (for turkeys).', 480, 198, 17, CREAM, 'center', 'normal');
  } else {
    text(ctx, '🍽️ CAUGHT!', 480, 150, 46, '#ff7a5c', 'center');
    text(ctx, 'Farmer Hank wins… this time. The oven stays cold a little longer.', 480, 198, 17, CREAM, 'center', 'normal');
  }
  text(ctx, `SCORE ${finalScore(state)}    DISTANCE ${Math.floor(state.distance)}m    🌽 ${state.corn}    BEST ${best}`, 480, 250, 18, '#ffd23f', 'center');
  text(ctx, state.escaped ? 'You outran the farmer through all 3 stages!' : `Reached the ${STAGES[state.stage].name} — dash when he lunges!`, 480, 286, 15, '#f7e8c9', 'center', 'normal');
  drawButton(ctx, BUTTONS.restart, false);
  text(ctx, 'Press R or click RUN AGAIN', 480, 472, 13, CREAM, 'center', 'normal');
}

export function drawGame(ctx, state, screen, best) {
  if (screen === SCREEN.title) {
    drawTitle(ctx, state, best);
    return;
  }
  if (screen === SCREEN.end) {
    drawEnd(ctx, state, best);
    return;
  }
  drawScenery(ctx, state);
  for (const o of state.obstacles) {
    if (o.kind === 'oven') drawOven(ctx, o, state.time);
    else if (o.kind === 'knifeGround') drawKnifeGround(ctx, o);
    else if (o.kind === 'knifeThrown') drawKnifeThrown(ctx, o);
    else if (o.kind === 'hay') drawHay(ctx, o);
    else drawPuddle(ctx, o);
  }
  for (const pickup of state.pickups) drawCorn(ctx, pickup);
  drawFarmer(ctx, state.farmer, state.turkey.x, state.time);
  drawTurkey(ctx, state.turkey, state.time);
  drawParticles(ctx, state.particles);
  drawHud(ctx, state, best);
  if (screen === SCREEN.pause) {
    ctx.fillStyle = 'rgba(58,36,21,0.55)';
    ctx.fillRect(0, 0, VIEW.width, VIEW.height);
    text(ctx, '⏸ PAUSED', 480, 220, 38, CREAM, 'center');
    drawButton(ctx, BUTTONS.resume, false);
  }
}

export function pointInButton(point, button) {
  return point !== null && point.x >= button.x && point.x <= button.x + button.width
    && point.y >= button.y && point.y <= button.y + button.height;
}
