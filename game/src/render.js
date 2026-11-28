// All drawing for Gobble Dash 3: three distinct zones, the oven
// gauntlet gate, big readable sprites, power-up icons and chips,
// a minimap with zone markers, HUD and every screen.

import { RUN, VIEW, ZONES } from './config.js';
import { activePowerupChips } from './powerups.js';
import { escapeRank, finalScore } from './world.js';

export const SCREEN = { title: 'title', play: 'play', pause: 'pause', end: 'end' };

const INK = '#33200f';
const CREAM = '#fff6e3';

export const BUTTONS = {
  start: { x: 340, y: 368, width: 280, height: 58, label: '▶  START RUNNING' },
  restart: { x: 340, y: 400, width: 280, height: 58, label: '↻  RUN AGAIN (R)' },
  resume: { x: 340, y: 306, width: 280, height: 54, label: '▶  RESUME (P)' },
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

function drawSky(ctx, zone, scroll, distance) {
  const palette = ZONES[zone];
  const gradient = ctx.createLinearGradient(0, 0, 0, VIEW.groundY);
  gradient.addColorStop(0, palette.skyTop);
  gradient.addColorStop(1, palette.skyBottom);
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, VIEW.width, VIEW.groundY);
  if (zone === 2) {
    ctx.strokeStyle = 'rgba(255,246,227,0.14)';
    ctx.lineWidth = 2;
    for (let x = -(scroll % 64); x < VIEW.width; x += 64) {
      ctx.beginPath(); ctx.moveTo(x, 90); ctx.lineTo(x, VIEW.groundY); ctx.stroke();
    }
    ctx.fillStyle = '#f7c873';
    roundRect(ctx, 700, 110, 150, 110, 8); ctx.fill();
    ctx.strokeStyle = '#6e4526'; ctx.lineWidth = 6; ctx.stroke();
    ctx.beginPath(); ctx.moveTo(775, 110); ctx.lineTo(775, 220); ctx.stroke();
    return;
  }
  // sun sinks as the run goes on: morning farmyard -> dusk orchard
  const sunY = 70 + Math.min(150, distance * 0.14);
  ctx.fillStyle = zone === 1 ? '#ffb03a' : '#fff3c4';
  ctx.beginPath(); ctx.arc(842, sunY, 38, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = 'rgba(255,255,255,0.8)';
  for (let i = 0; i < 4; i += 1) {
    const cx = ((i * 290 - scroll * 0.1) % 1140 + 1140) % 1140 - 90;
    ctx.beginPath();
    ctx.ellipse(cx, 58 + (i % 2) * 32, 54, 15, 0, 0, Math.PI * 2);
    ctx.ellipse(cx + 36, 64 + (i % 2) * 32, 38, 12, 0, 0, Math.PI * 2);
    ctx.fill();
  }
}

function drawBarn(ctx, x) {
  ctx.fillStyle = '#a33b2e';
  ctx.fillRect(x, 296, 164, 160);
  ctx.fillStyle = '#6e2418';
  ctx.beginPath();
  ctx.moveTo(x - 14, 298); ctx.lineTo(x + 82, 240); ctx.lineTo(x + 178, 298); ctx.closePath(); ctx.fill();
  ctx.fillStyle = '#f7e8c9';
  ctx.fillRect(x + 58, 350, 48, 106);
  ctx.strokeStyle = '#6e2418'; ctx.lineWidth = 4; ctx.strokeRect(x + 58, 350, 48, 106);
  ctx.beginPath();
  ctx.moveTo(x + 58, 350); ctx.lineTo(x + 106, 456);
  ctx.moveTo(x + 106, 350); ctx.lineTo(x + 58, 456); ctx.stroke();
  ctx.fillStyle = '#ffd23f';
  ctx.fillRect(x + 18, 316, 28, 24); ctx.fillRect(x + 118, 316, 28, 24);
  text(ctx, 'BARN', x + 82, 276, 16, CREAM, 'center');
}

function drawAutumnTree(ctx, x, scale) {
  ctx.fillStyle = '#6e4526';
  ctx.fillRect(x - 6 * scale, VIEW.groundY - 74 * scale, 12 * scale, 74 * scale);
  const blobs = ['#d96c2c', '#e88f3a', '#c7532a', '#e0a83e'];
  for (let i = 0; i < 4; i += 1) {
    ctx.fillStyle = blobs[i];
    ctx.beginPath();
    ctx.arc(x + (i - 1.5) * 22 * scale, VIEW.groundY - (92 + (i % 2) * 18) * scale, 28 * scale, 0, Math.PI * 2);
    ctx.fill();
  }
}

function drawScarecrow(ctx, x) {
  ctx.strokeStyle = '#6e4526'; ctx.lineWidth = 6;
  ctx.beginPath();
  ctx.moveTo(x, VIEW.groundY); ctx.lineTo(x, VIEW.groundY - 96);
  ctx.moveTo(x - 34, VIEW.groundY - 74); ctx.lineTo(x + 34, VIEW.groundY - 74);
  ctx.stroke();
  ctx.fillStyle = '#7a8a4a';
  ctx.fillRect(x - 20, VIEW.groundY - 88, 40, 48);
  ctx.fillStyle = '#e8c98a';
  ctx.beginPath(); ctx.arc(x, VIEW.groundY - 104, 15, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#e8b53a';
  ctx.fillRect(x - 22, VIEW.groundY - 116, 44, 7);
  ctx.fillRect(x - 12, VIEW.groundY - 128, 24, 13);
  ctx.fillStyle = INK;
  ctx.beginPath(); ctx.arc(x - 5, VIEW.groundY - 106, 2, 0, Math.PI * 2); ctx.arc(x + 5, VIEW.groundY - 106, 2, 0, Math.PI * 2); ctx.fill();
}

function drawPumpkinPatch(ctx, scroll) {
  for (let i = 0; i < 5; i += 1) {
    const x = 1020 - (((scroll * 0.7) + i * 230) % 1150);
    ctx.fillStyle = '#e07b2a';
    ctx.beginPath(); ctx.ellipse(x, VIEW.groundY - 14, 26, 17, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#5d7a2e';
    ctx.fillRect(x - 3, VIEW.groundY - 36, 6, 9);
  }
}

function drawKitchenProps(ctx, scroll, time) {
  ctx.fillStyle = '#3a2a1c';
  ctx.fillRect(0, 96, VIEW.width, 8);
  for (let i = 0; i < 5; i += 1) {
    const x = 1040 - (((scroll * 0.4) + i * 210) % 1050);
    ctx.strokeStyle = '#2c1e12'; ctx.lineWidth = 3;
    ctx.beginPath(); ctx.moveTo(x, 104); ctx.lineTo(x, 128); ctx.stroke();
    ctx.fillStyle = '#9aa5b1';
    roundRect(ctx, x - 20, 128, 40, 30, 6); ctx.fill();
    ctx.fillStyle = '#6b7684';
    ctx.fillRect(x - 20, 128, 40, 7);
  }
  ctx.fillStyle = '#6e4526';
  ctx.fillRect(60, 236, 220, 10);
  const jarColours = ['#d96c2c', '#7cb342', '#e8b53a', '#c94f38'];
  for (let i = 0; i < 4; i += 1) {
    ctx.fillStyle = jarColours[i];
    roundRect(ctx, 76 + i * 52, 204, 34, 32, 5); ctx.fill();
  }
  ctx.fillStyle = 'rgba(255,255,255,0.35)';
  for (let i = 0; i < 3; i += 1) {
    const sx = 620 + i * 90;
    const sy = 300 - ((time * 24 + i * 30) % 60);
    ctx.beginPath(); ctx.ellipse(sx, sy, 14, 8, 0, 0, Math.PI * 2); ctx.fill();
  }
}

function drawGiantOvenGate(ctx, state, time) {
  // the finish-line oven: scrolls in during the gauntlet finale
  const metresLeft = RUN.escapeDistance - state.distance;
  if (metresLeft > 60) return;
  const x = state.turkey.x + metresLeft * 44;
  if (x > VIEW.width + 200) return;
  const y = VIEW.groundY - 210;
  ctx.fillStyle = '#3c3c44';
  roundRect(ctx, x, y, 170, 210, 12); ctx.fill();
  ctx.fillStyle = '#232329';
  ctx.fillRect(x + 14, y + 14, 142, 18);
  const glow = 0.75 + Math.sin(time * 7) * 0.25;
  ctx.fillStyle = `rgba(255,${Math.floor(120 * glow)},40,0.95)`;
  ctx.fillRect(x + 22, y + 52, 126, 96);
  ctx.fillStyle = '#ffd23f';
  for (let i = 0; i < 4; i += 1) { ctx.beginPath(); ctx.arc(x + 30 + i * 38, y + 23, 7, 0, Math.PI * 2); ctx.fill(); }
  text(ctx, 'THE OVEN', x + 85, y + 172, 20, CREAM, 'center');
  text(ctx, '350°', x + 85, y + 196, 16, '#ffb03a', 'center');
  ctx.fillStyle = '#e05252';
  ctx.beginPath();
  ctx.moveTo(x - 6, y - 34); ctx.lineTo(x + 176, y - 34); ctx.lineTo(x + 85, y - 2); ctx.closePath(); ctx.fill();
  text(ctx, '🏁 ESCAPE!', x + 85, y - 44, 18, '#d63c2a', 'center');
}

function drawZoneBackground(ctx, state) {
  drawSky(ctx, state.zone, state.scroll, state.distance);
  if (state.zone === 0) {
    drawBarn(ctx, 1120 - ((state.scroll * 0.32) % 1560));
    for (let i = 0; i < 3; i += 1) {
      drawAutumnTree(ctx, 1120 - (((state.scroll * 0.55) + i * 430) % 1290), 0.95 + (i % 2) * 0.2);
    }
    ctx.fillStyle = '#9c6b40';
    for (let x = -(state.scroll % 64); x < VIEW.width; x += 64) ctx.fillRect(x + 26, 402, 9, 54);
    ctx.fillRect(0, 414, VIEW.width, 7); ctx.fillRect(0, 436, VIEW.width, 7);
  } else if (state.zone === 1) {
    for (let i = 0; i < 3; i += 1) {
      drawAutumnTree(ctx, 1120 - (((state.scroll * 0.5) + i * 460) % 1380), 1.05);
    }
    drawScarecrow(ctx, 1080 - ((state.scroll * 0.45) % 1400));
    drawPumpkinPatch(ctx, state.scroll);
  } else {
    drawKitchenProps(ctx, state.scroll, state.time);
  }
  const palette = ZONES[state.zone];
  ctx.fillStyle = palette.ground;
  ctx.fillRect(0, VIEW.groundY, VIEW.width, VIEW.height - VIEW.groundY);
  if (state.zone === 2) {
    const size = 42;
    for (let row = 0; row < 2; row += 1) {
      for (let x = -(state.scroll % (size * 2)) - size; x < VIEW.width; x += size) {
        const col = Math.floor((x + state.scroll) / size);
        ctx.fillStyle = (col + row) % 2 === 0 ? '#e8dcc3' : '#8a4b3a';
        ctx.fillRect(x, VIEW.groundY + row * size, size, size);
      }
    }
  } else {
    ctx.fillStyle = palette.trim;
    ctx.fillRect(0, VIEW.groundY, VIEW.width, 10);
    ctx.fillStyle = 'rgba(0,0,0,0.18)';
    for (let x = -(state.scroll % 90); x < VIEW.width; x += 90) ctx.fillRect(x, VIEW.groundY + 36, 44, 6);
    // foreground grass tufts
    ctx.strokeStyle = '#5d7a2e'; ctx.lineWidth = 2;
    for (let x = -(state.scroll % 70); x < VIEW.width; x += 70) {
      ctx.beginPath();
      ctx.moveTo(x, VIEW.groundY + 8); ctx.lineTo(x - 4, VIEW.groundY - 6);
      ctx.moveTo(x + 5, VIEW.groundY + 8); ctx.lineTo(x + 9, VIEW.groundY - 8);
      ctx.stroke();
    }
  }
  if (state.zone < 2) {
    ctx.fillStyle = '#e88f3a';
    for (let i = 0; i < 9; i += 1) {
      const lx = ((i * 173 + state.time * 38) % 1000) - 20;
      const ly = 100 + ((i * 61 + state.time * 24) % 290);
      ctx.save(); ctx.translate(lx, ly); ctx.rotate(state.time + i); ctx.fillRect(-5, -2, 10, 4); ctx.restore();
    }
  }
  drawGiantOvenGate(ctx, state, state.time);
}

export function drawTurkey(ctx, state, time) {
  const turkey = state.turkey;
  const blink = turkey.invincible > 0 && Math.floor(time * 14) % 2 === 0;
  ctx.save();
  ctx.translate(turkey.x, turkey.y);
  if (blink) ctx.globalAlpha = 0.35;
  if (state.power.shield) {
    ctx.strokeStyle = 'rgba(79,195,247,0.85)';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.ellipse(34, turkey.height - 24, 46, 36, 0, 0, Math.PI * 2);
    ctx.stroke();
  }
  const legSwing = turkey.onGround && !turkey.hidden ? Math.sin(turkey.runPhase) * 11 : 3;
  ctx.strokeStyle = '#e8a13a'; ctx.lineWidth = 5;
  ctx.beginPath();
  ctx.moveTo(24, turkey.height - 6); ctx.lineTo(24 + legSwing, turkey.height + 7);
  ctx.moveTo(40, turkey.height - 6); ctx.lineTo(40 - legSwing, turkey.height + 7);
  ctx.stroke();
  const fan = ['#8a4b26', '#b0632f', '#d98a44', '#b0632f', '#8a4b26'];
  for (let i = 0; i < 5; i += 1) {
    ctx.save();
    ctx.translate(10, turkey.height - 18);
    ctx.rotate(-0.95 + i * 0.34);
    ctx.fillStyle = fan[i];
    ctx.beginPath(); ctx.ellipse(0, -24, 10, 27, 0, 0, Math.PI * 2); ctx.fill();
    ctx.restore();
  }
  ctx.fillStyle = '#7a4a28';
  ctx.beginPath(); ctx.ellipse(34, turkey.height - 24, 33, 23, 0, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#96602f';
  ctx.beginPath(); ctx.ellipse(39, turkey.height - 29, 22, 14, -0.3, 0, Math.PI * 2); ctx.fill();
  const headY = turkey.ducking || turkey.hidden ? turkey.height - 36 : turkey.height - 49;
  ctx.fillStyle = '#c9a06a';
  ctx.beginPath(); ctx.arc(64, headY, 12, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#e05252';
  ctx.beginPath(); ctx.ellipse(69, headY + 11, 5, 8, 0, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#f5b63f';
  ctx.beginPath();
  ctx.moveTo(74, headY - 2); ctx.lineTo(86, headY + 1); ctx.lineTo(74, headY + 5); ctx.closePath(); ctx.fill();
  ctx.fillStyle = INK;
  ctx.beginPath(); ctx.arc(67, headY - 3, 2.4, 0, Math.PI * 2); ctx.fill();
  if (turkey.hidden) {
    ctx.globalAlpha = 0.85;
    text(ctx, '…', 34, -12, 20, CREAM, 'center');
  }
  ctx.restore();
  if (state.power.turbo > 0 && !turkey.hidden) {
    ctx.strokeStyle = 'rgba(255,255,255,0.5)';
    ctx.lineWidth = 2;
    for (let i = 0; i < 4; i += 1) {
      const y = turkey.y + 8 + i * 12;
      ctx.beginPath();
      ctx.moveTo(turkey.x - 70 - (i % 2) * 30, y);
      ctx.lineTo(turkey.x - 14, y);
      ctx.stroke();
    }
  }
}

export function drawFarmer(ctx, farmer, turkeyX, time) {
  const gapPx = Math.min(360, farmer.gap * 5.2);
  const fx = Math.max(-60, turkeyX - 74 - gapPx);
  const ground = VIEW.groundY;
  const legSwing = Math.sin(farmer.runPhase) * 13;
  ctx.save();
  ctx.translate(fx, ground);
  ctx.strokeStyle = '#33506e'; ctx.lineWidth = 8;
  ctx.beginPath();
  ctx.moveTo(18, -48); ctx.lineTo(18 + legSwing, -4);
  ctx.moveTo(32, -48); ctx.lineTo(32 - legSwing, -4);
  ctx.stroke();
  ctx.fillStyle = '#3f6d9e';
  roundRect(ctx, 4, -104, 42, 60, 8); ctx.fill();
  ctx.fillStyle = '#c94f38';
  roundRect(ctx, 2, -132, 46, 34, 8); ctx.fill();
  ctx.strokeStyle = '#c94f38'; ctx.lineWidth = 8;
  ctx.beginPath();
  ctx.moveTo(46, -120); ctx.lineTo(66, -140);
  ctx.moveTo(6, -120); ctx.lineTo(-10, -96 + legSwing * 0.4);
  ctx.stroke();
  ctx.save();
  ctx.translate(66, -140);
  ctx.rotate(-0.5 + Math.sin(time * 6) * 0.08);
  ctx.fillStyle = '#5a3a22'; ctx.fillRect(-3, -4, 18, 8);
  ctx.fillStyle = '#dfe6ee';
  ctx.beginPath();
  ctx.moveTo(14, -6); ctx.lineTo(48, -1); ctx.lineTo(14, 6); ctx.closePath(); ctx.fill();
  ctx.restore();
  ctx.fillStyle = '#f0c297';
  ctx.beginPath(); ctx.arc(25, -146, 15, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#e8b53a';
  ctx.fillRect(1, -160, 48, 8);
  ctx.fillRect(11, -174, 28, 15);
  ctx.fillStyle = INK;
  ctx.beginPath(); ctx.arc(31, -148, 2.2, 0, Math.PI * 2); ctx.fill();
  ctx.restore();
  if (farmer.state === 'warn') text(ctx, '!', fx + 25, ground - 204, 38, '#d63c2a', 'center');
  if (farmer.state === 'search') text(ctx, '?', fx + 25, ground - 204, 36, '#ffd23f', 'center');
  if (farmer.spottedFlash > 0) text(ctx, '!', fx + 25, ground - 204, 38, '#d63c2a', 'center');
  if (farmer.shoutTime > 0 && farmer.shout) {
    const w = farmer.shout.length * 9 + 20;
    ctx.fillStyle = CREAM;
    roundRect(ctx, fx + 4, ground - 238, w, 27, 8); ctx.fill();
    ctx.strokeStyle = INK; ctx.lineWidth = 2; ctx.stroke();
    text(ctx, farmer.shout, fx + 4 + w / 2, ground - 224, 13, INK, 'center');
  }
}

function drawOven(ctx, o, time) {
  ctx.fillStyle = '#4a4a52';
  roundRect(ctx, o.x, o.y, o.width, o.height, 7); ctx.fill();
  ctx.fillStyle = '#2c2c33';
  ctx.fillRect(o.x + 9, o.y + 9, o.width - 18, 11);
  const glow = 0.75 + Math.sin(time * 7) * 0.25;
  ctx.fillStyle = `rgba(255,${Math.floor(120 * glow)},40,0.95)`;
  ctx.fillRect(o.x + 14, o.y + 34, o.width - 28, 38);
  ctx.fillStyle = '#ffd23f';
  for (let i = 0; i < 3; i += 1) { ctx.beginPath(); ctx.arc(o.x + 20 + i * 22, o.y + 14, 4.5, 0, Math.PI * 2); ctx.fill(); }
  text(ctx, 'OVEN 350°', o.x + o.width / 2, o.y + o.height - 11, 12, CREAM, 'center');
}

function drawKnifeGround(ctx, o) {
  ctx.save();
  ctx.translate(o.x + o.width / 2, o.y + o.height);
  ctx.fillStyle = '#dfe6ee';
  ctx.beginPath();
  ctx.moveTo(-28, 0); ctx.lineTo(9, -29); ctx.lineTo(28, -7); ctx.lineTo(11, 0); ctx.closePath(); ctx.fill();
  ctx.strokeStyle = '#8fa3b8'; ctx.lineWidth = 2; ctx.stroke();
  ctx.fillStyle = '#5a3a22'; ctx.fillRect(9, -9, 22, 9);
  ctx.restore();
  text(ctx, 'KNIFE!', o.x + o.width / 2, o.y - 11, 12, '#d63c2a', 'center');
}

function drawKnifeThrown(ctx, o) {
  ctx.save();
  ctx.translate(o.x + o.width / 2, o.y + o.height / 2);
  ctx.rotate(o.spin);
  ctx.fillStyle = '#dfe6ee';
  ctx.beginPath();
  ctx.moveTo(-26, -3); ctx.lineTo(11, -7); ctx.lineTo(26, 0); ctx.lineTo(11, 7); ctx.lineTo(-26, 3); ctx.closePath(); ctx.fill();
  ctx.fillStyle = '#5a3a22'; ctx.fillRect(-26, -3, 11, 6);
  ctx.restore();
  text(ctx, 'DUCK!', o.x + o.width / 2, o.y - 13, 12, '#d63c2a', 'center');
}

function drawHayBale(ctx, o) {
  ctx.fillStyle = '#e3b94e';
  roundRect(ctx, o.x, o.y, o.width, o.height, 9); ctx.fill();
  ctx.strokeStyle = '#b98a2e'; ctx.lineWidth = 2;
  for (let i = 1; i < 4; i += 1) {
    ctx.beginPath();
    ctx.moveTo(o.x + i * (o.width / 4), o.y + 4);
    ctx.lineTo(o.x + i * (o.width / 4) - 7, o.y + o.height - 4);
    ctx.stroke();
  }
  text(ctx, 'HAY', o.x + o.width / 2, o.y + o.height / 2, 13, '#7a5a14', 'center');
}

function drawPumpkinObstacle(ctx, o) {
  ctx.fillStyle = '#e07b2a';
  ctx.beginPath(); ctx.ellipse(o.x + o.width / 2, o.y + o.height - 16, o.width / 2, 20, 0, 0, Math.PI * 2); ctx.fill();
  ctx.strokeStyle = '#b85a18'; ctx.lineWidth = 2;
  for (let i = -1; i <= 1; i += 1) {
    ctx.beginPath();
    ctx.ellipse(o.x + o.width / 2 + i * 12, o.y + o.height - 16, 9, 19, 0, 0, Math.PI * 2);
    ctx.stroke();
  }
  ctx.fillStyle = '#5d7a2e';
  ctx.fillRect(o.x + o.width / 2 - 3, o.y + 2, 7, 10);
  text(ctx, 'PUMPKIN', o.x + o.width / 2, o.y - 10, 11, '#b85a18', 'center');
}

function drawPot(ctx, o, time) {
  ctx.fillStyle = '#8a95a3';
  roundRect(ctx, o.x, o.y + 12, o.width, o.height - 12, 8); ctx.fill();
  ctx.fillStyle = '#6b7684';
  ctx.fillRect(o.x - 3, o.y + 6, o.width + 6, 9);
  ctx.fillStyle = '#e8eef4';
  ctx.beginPath(); ctx.ellipse(o.x + o.width / 2, o.y + 2, 16, 5, 0, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = 'rgba(255,255,255,0.4)';
  ctx.beginPath(); ctx.ellipse(o.x + o.width / 2, o.y - 8 - Math.sin(time * 5) * 3, 10, 5, 0, 0, Math.PI * 2); ctx.fill();
  text(ctx, 'HOT POT', o.x + o.width / 2, o.y + o.height - 10, 11, '#3a2a1c', 'center');
}

function drawMud(ctx, o) {
  ctx.fillStyle = '#5d4326';
  ctx.beginPath(); ctx.ellipse(o.x + o.width / 2, o.y + o.height - 4, o.width / 2, 10, 0, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = 'rgba(255,255,255,0.25)';
  ctx.beginPath(); ctx.ellipse(o.x + o.width / 2 - 12, o.y + o.height - 7, 18, 3, 0, 0, Math.PI * 2); ctx.fill();
  text(ctx, 'MUD', o.x + o.width / 2, o.y - 8, 11, '#5d4326', 'center');
}

function drawHideSpot(ctx, spot) {
  const y = VIEW.groundY;
  if (spot.kind === 'haystack') {
    ctx.fillStyle = '#e3b94e';
    ctx.beginPath();
    ctx.moveTo(spot.x, y);
    ctx.quadraticCurveTo(spot.x + spot.width / 2, y - 96, spot.x + spot.width, y);
    ctx.closePath(); ctx.fill();
    ctx.strokeStyle = '#b98a2e'; ctx.lineWidth = 2;
    for (let i = 1; i < 4; i += 1) {
      ctx.beginPath();
      ctx.moveTo(spot.x + i * (spot.width / 4), y - 6);
      ctx.lineTo(spot.x + spot.width / 2, y - 84);
      ctx.stroke();
    }
  } else if (spot.kind === 'bush') {
    ctx.fillStyle = '#5d7a2e';
    for (let i = 0; i < 4; i += 1) {
      ctx.beginPath();
      ctx.arc(spot.x + 16 + i * 20, y - 26 - (i % 2) * 14, 24, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.fillStyle = '#e07b2a';
    ctx.beginPath(); ctx.arc(spot.x + 30, y - 40, 5, 0, Math.PI * 2); ctx.arc(spot.x + 62, y - 30, 5, 0, Math.PI * 2); ctx.fill();
  } else {
    ctx.fillStyle = '#6e4526';
    ctx.fillRect(spot.x, y - 74, spot.width, 74);
    ctx.fillStyle = '#e8dcc3';
    ctx.fillRect(spot.x - 4, y - 82, spot.width + 8, 10);
    ctx.fillStyle = '#c94f38';
    ctx.fillRect(spot.x + 12, y - 100, 20, 18);
    ctx.fillStyle = '#7cb342';
    ctx.fillRect(spot.x + 44, y - 96, 16, 14);
  }
  ctx.fillStyle = 'rgba(51,32,15,0.8)';
  roundRect(ctx, spot.x + spot.width / 2 - 34, y - 122, 68, 22, 6); ctx.fill();
  text(ctx, 'HIDE ↓', spot.x + spot.width / 2, y - 111, 13, '#b8e6a0', 'center');
}

function drawPickup(ctx, pickup) {
  const y = pickup.y + Math.sin(pickup.bob) * 4;
  ctx.save();
  ctx.translate(pickup.x + 14, y + 18);
  if (pickup.kind === 'feather') {
    ctx.rotate(0.5 + Math.sin(pickup.bob) * 0.2);
    ctx.fillStyle = '#ffe066';
    ctx.beginPath(); ctx.ellipse(0, 0, 9, 19, 0, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = '#d9a41f'; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(0, -18); ctx.lineTo(0, 20); ctx.stroke();
    text(ctx, '+1♥', 0, -30, 13, '#d9a41f', 'center');
  } else if (pickup.kind === 'chili') {
    ctx.rotate(0.6 + Math.sin(pickup.bob) * 0.15);
    ctx.fillStyle = '#e03a2a';
    ctx.beginPath();
    ctx.moveTo(-6, -16);
    ctx.quadraticCurveTo(14, -6, 8, 14);
    ctx.quadraticCurveTo(2, 22, -4, 16);
    ctx.quadraticCurveTo(-10, 0, -6, -16);
    ctx.fill();
    ctx.fillStyle = '#5d7a2e';
    ctx.fillRect(-8, -22, 12, 7);
    text(ctx, '🌶', 0, -34, 15, '#e03a2a', 'center');
  } else if (pickup.kind === 'shield') {
    ctx.fillStyle = '#4fc3f7';
    ctx.beginPath();
    ctx.moveTo(0, -18);
    ctx.lineTo(15, -11);
    ctx.lineTo(15, 4);
    ctx.quadraticCurveTo(15, 16, 0, 21);
    ctx.quadraticCurveTo(-15, 16, -15, 4);
    ctx.lineTo(-15, -11);
    ctx.closePath(); ctx.fill();
    ctx.strokeStyle = '#1b6ea8'; ctx.lineWidth = 2; ctx.stroke();
    text(ctx, '🛡', 0, -32, 15, '#1b6ea8', 'center');
  } else if (pickup.kind === 'magnet') {
    ctx.fillStyle = '#e05252';
    ctx.fillRect(-13, -16, 9, 24);
    ctx.fillRect(4, -16, 9, 24);
    ctx.fillRect(-13, -16, 26, 9);
    ctx.fillStyle = '#e8eef4';
    ctx.fillRect(-13, 2, 9, 7);
    ctx.fillRect(4, 2, 9, 7);
    text(ctx, '🧲', 0, -30, 15, '#b83232', 'center');
  } else {
    ctx.rotate(0.4);
    ctx.fillStyle = '#ffd23f';
    roundRect(ctx, -8, -17, 16, 34, 8); ctx.fill();
    ctx.strokeStyle = '#d9a41f'; ctx.lineWidth = 1.5;
    for (let i = -1; i <= 1; i += 1) {
      ctx.beginPath(); ctx.moveTo(i * 5, -15); ctx.lineTo(i * 5, 15); ctx.stroke();
    }
    ctx.fillStyle = '#7cb342';
    ctx.beginPath();
    ctx.moveTo(-8, 9); ctx.lineTo(-18, 20); ctx.lineTo(-5, 18); ctx.closePath(); ctx.fill();
  }
  ctx.restore();
}

function drawObstacle(ctx, o, time) {
  if (o.kind === 'oven') drawOven(ctx, o, time);
  else if (o.kind === 'knifeGround') drawKnifeGround(ctx, o);
  else if (o.kind === 'knifeThrown') drawKnifeThrown(ctx, o);
  else if (o.kind === 'hayBale') drawHayBale(ctx, o);
  else if (o.kind === 'pumpkin') drawPumpkinObstacle(ctx, o);
  else if (o.kind === 'pot') drawPot(ctx, o, time);
  else drawMud(ctx, o);
}

function drawEffects(ctx, effects) {
  for (const p of effects.particles) {
    ctx.globalAlpha = Math.max(0, Math.min(1, p.life * 2));
    ctx.fillStyle = p.colour;
    ctx.fillRect(p.x - p.size / 2, p.y - p.size / 2, p.size, p.size);
  }
  ctx.globalAlpha = 1;
  for (const popup of effects.popups) {
    ctx.globalAlpha = Math.max(0, Math.min(1, popup.life));
    text(ctx, popup.text, popup.x, popup.y, popup.size, popup.colour, 'center');
  }
  ctx.globalAlpha = 1;
  if (effects.flash > 0) {
    ctx.strokeStyle = `rgba(214,60,42,${effects.flash})`;
    ctx.lineWidth = 18;
    ctx.strokeRect(0, 0, VIEW.width, VIEW.height);
  }
  if (effects.banner) {
    ctx.globalAlpha = Math.min(1, effects.banner.life);
    ctx.fillStyle = 'rgba(51,32,15,0.78)';
    roundRect(ctx, 280, 150, 400, 74, 14); ctx.fill();
    text(ctx, effects.banner.title, 480, 176, 26, '#ffd23f', 'center');
    text(ctx, effects.banner.subtitle, 480, 204, 16, CREAM, 'center', 'normal');
    ctx.globalAlpha = 1;
  }
}

function drawMinimap(ctx, state) {
  const x = 330;
  const y = 63;
  const width = 300;
  ctx.fillStyle = 'rgba(255,255,255,0.25)';
  roundRect(ctx, x, y, width, 5, 3); ctx.fill();
  ctx.fillStyle = '#7cb342';
  roundRect(ctx, x, y, width * Math.min(1, state.distance / RUN.escapeDistance), 5, 3); ctx.fill();
  for (const zone of ZONES.slice(1)) {
    const zx = x + width * (zone.from / RUN.escapeDistance);
    ctx.fillStyle = '#ffd23f';
    ctx.fillRect(zx - 1, y - 3, 2, 11);
  }
  const gx = x + width * (RUN.gauntletFrom / RUN.escapeDistance);
  ctx.fillStyle = '#ff7a3c';
  ctx.fillRect(gx - 1, y - 3, 2, 11);
  const px = x + width * Math.min(1, state.distance / RUN.escapeDistance);
  ctx.fillStyle = '#fff6e3';
  ctx.beginPath(); ctx.arc(px, y + 2, 5, 0, Math.PI * 2); ctx.fill();
}

function drawHud(ctx, state, best) {
  ctx.fillStyle = 'rgba(51,32,15,0.88)';
  roundRect(ctx, 12, 10, 936, 60, 12); ctx.fill();
  text(ctx, `SCORE ${finalScore(state)}`, 28, 31, 20, '#ffd23f');
  text(ctx, `BEST ${best}`, 28, 55, 12, '#f7e8c9', 'left', 'normal');
  text(ctx, `${Math.floor(state.distance)}m / ${RUN.escapeDistance}m`, 480, 31, 20, CREAM, 'center');
  text(ctx, `${ZONES[state.zone].name.toUpperCase()} · ZONE ${state.zone + 1}/3`, 480, 55, 12, '#f7c873', 'center', 'normal');
  for (let i = 0; i < RUN.maxLives; i += 1) {
    ctx.fillStyle = i < state.lives ? '#e05252' : 'rgba(255,255,255,0.22)';
    const hx = 716 + i * 27;
    ctx.beginPath();
    ctx.moveTo(hx, 37);
    ctx.bezierCurveTo(hx - 10, 24, hx - 3, 15, hx, 24);
    ctx.bezierCurveTo(hx + 3, 15, hx + 10, 24, hx, 37);
    ctx.fill();
  }
  text(ctx, `🌽 ${state.corn}`, 868, 31, 18, '#ffd23f', 'center');
  if (state.combo > 1) text(ctx, `COMBO x${state.combo}`, 868, 55, 13, '#7dd7ff', 'center');
  drawMinimap(ctx, state);
  const gapRatio = Math.max(0, Math.min(1, state.farmer.gap / 46));
  ctx.fillStyle = 'rgba(51,32,15,0.82)';
  roundRect(ctx, 12, 78, 300, 24, 8); ctx.fill();
  text(ctx, 'FARMER', 22, 90, 12, gapRatio < 0.25 ? '#ff7a5c' : CREAM);
  ctx.fillStyle = 'rgba(255,255,255,0.25)';
  roundRect(ctx, 86, 84, 150, 12, 6); ctx.fill();
  ctx.fillStyle = gapRatio < 0.25 ? '#e05252' : gapRatio < 0.5 ? '#f5b63f' : '#7cb342';
  roundRect(ctx, 88, 86, 146 * gapRatio, 8, 4); ctx.fill();
  text(ctx, `${state.farmer.gap.toFixed(0)}m`, 246, 90, 12, CREAM);
  ctx.fillStyle = 'rgba(51,32,15,0.82)';
  roundRect(ctx, 648, 78, 300, 24, 8); ctx.fill();
  text(ctx, 'DASH', 658, 90, 12, CREAM);
  ctx.fillStyle = 'rgba(255,255,255,0.25)';
  roundRect(ctx, 704, 84, 170, 12, 6); ctx.fill();
  ctx.fillStyle = '#4fc3f7';
  roundRect(ctx, 706, 86, 166 * (state.stamina / RUN.staminaMax), 8, 4); ctx.fill();
  const chips = activePowerupChips(state);
  chips.forEach((chip, i) => {
    const cx = 12 + i * 150;
    ctx.fillStyle = 'rgba(51,32,15,0.82)';
    roundRect(ctx, cx, 108, 142, 24, 8); ctx.fill();
    text(ctx, chip.text, cx + 71, 120, 12, chip.colour, 'center');
  });
  if (state.farmer.state === 'warn') {
    text(ctx, '⚠ FARMER LUNGING — DASH! (SHIFT)', 480, 118, 18, '#d63c2a', 'center');
  } else if (state.turkey.hidden) {
    text(ctx, 'HIDDEN — farmer is searching…', 480, 118, 16, '#2e5d1e', 'center');
  } else if (state.turkey.stumble > 0) {
    text(ctx, 'STUMBLED!', state.turkey.x + 33, state.turkey.y - 20, 15, '#d63c2a', 'center');
  }
}

function drawButton(ctx, button) {
  ctx.fillStyle = '#d96c2c';
  roundRect(ctx, button.x, button.y, button.width, button.height, 14); ctx.fill();
  ctx.strokeStyle = INK; ctx.lineWidth = 3; ctx.stroke();
  text(ctx, button.label, button.x + button.width / 2, button.y + button.height / 2 + 1, 20, CREAM, 'center');
}

function drawTitle(ctx, state, best) {
  drawZoneBackground(ctx, state);
  drawFarmer(ctx, { ...state.farmer, gap: 12, state: 'chase', shout: '', shoutTime: 0, spottedFlash: 0 }, 760, state.time);
  drawTurkey(ctx, { ...state, turkey: { ...state.turkey, x: 760, y: VIEW.groundY - 56, hidden: false } }, state.time);
  ctx.fillStyle = 'rgba(51,32,15,0.6)';
  ctx.fillRect(0, 0, VIEW.width, 330);
  text(ctx, '🦃 GOBBLE DASH 3', 480, 66, 52, '#ffd23f', 'center');
  text(ctx, '— THANKSGIVING BREAKOUT! —', 480, 110, 22, CREAM, 'center');
  text(ctx, 'Pip is NOT becoming Thanksgiving dinner. Run 1500m to freedom!', 480, 144, 16, '#f7e8c9', 'center', 'normal');
  text(ctx, 'Jump the OVEN · duck the CARVING KNIFE · HIDE in haystacks · grab corn 🌽', 480, 170, 15, '#f7e8c9', 'center', 'normal');
  text(ctx, '🌶 chili turbo · 🛡 shield feather · 🧲 corn magnet · near-miss combos x8', 480, 194, 15, '#f7e8c9', 'center', 'normal');
  text(ctx, 'SPACE/W/CLICK jump · S/↓ duck+hide · SHIFT dash · ← brake · P pause · M sound', 480, 228, 14, CREAM, 'center', 'normal');
  text(ctx, 'FARMYARD → PUMPKIN ORCHARD → KITCHEN → 🔥 OVEN GAUNTLET', 480, 254, 14, '#f7c873', 'center', 'normal');
  drawButton(ctx, BUTTONS.start);
  text(ctx, `BEST ${best}`, 480, 302, 15, '#ffd23f', 'center');
}

function drawEnd(ctx, state, best) {
  drawZoneBackground(ctx, state);
  for (const spot of state.hideSpots) drawHideSpot(ctx, spot);
  for (const o of state.obstacles) drawObstacle(ctx, o, state.time);
  if (!state.escaped) {
    drawFarmer(ctx, { ...state.farmer, gap: 3, state: 'chase', shout: '', shoutTime: 0, spottedFlash: 0 }, state.turkey.x, state.time);
  }
  drawTurkey(ctx, state, state.time);
  drawEffects(ctx, state.effects);
  ctx.fillStyle = 'rgba(51,32,15,0.64)';
  ctx.fillRect(0, 0, VIEW.width, VIEW.height);
  if (state.escaped) {
    text(ctx, '🎉 PIP ESCAPED!', 480, 132, 48, '#7cb342', 'center');
    text(ctx, 'Past the giant oven — no turkey on this Thanksgiving table!', 480, 180, 17, CREAM, 'center', 'normal');
    text(ctx, escapeRank(state), 480, 214, 20, '#ffd23f', 'center');
  } else {
    text(ctx, '🍽️ CAUGHT!', 480, 132, 48, '#ff7a5c', 'center');
    text(ctx, 'Farmer Hank wins… this time. The oven stays cold a little longer.', 480, 180, 17, CREAM, 'center', 'normal');
  }
  text(ctx, `SCORE ${finalScore(state)}   DISTANCE ${Math.floor(state.distance)}m   🌽 ${state.corn}   BEST COMBO x${state.bestCombo}`, 480, 256, 19, '#ffd23f', 'center');
  text(ctx, `Near misses ${state.nearMisses} · Power-ups ${state.powerupsTaken} · Time ${state.time.toFixed(0)}s · BEST ${best}`, 480, 290, 15, '#f7e8c9', 'center', 'normal');
  drawButton(ctx, BUTTONS.restart);
  text(ctx, 'Press R or click RUN AGAIN', 480, 482, 13, CREAM, 'center', 'normal');
}

export function drawGame(ctx, state, screen, best) {
  if (screen === SCREEN.title) { drawTitle(ctx, state, best); return; }
  if (screen === SCREEN.end) { drawEnd(ctx, state, best); return; }
  drawZoneBackground(ctx, state);
  for (const o of state.obstacles) drawObstacle(ctx, o, state.time);
  for (const pickup of state.pickups) drawPickup(ctx, pickup);
  drawFarmer(ctx, state.farmer, state.turkey.x, state.time);
  if (state.turkey.hidden) {
    drawTurkey(ctx, state, state.time);
    for (const spot of state.hideSpots) drawHideSpot(ctx, spot);
  } else {
    for (const spot of state.hideSpots) drawHideSpot(ctx, spot);
    drawTurkey(ctx, state, state.time);
  }
  drawEffects(ctx, state.effects);
  drawHud(ctx, state, best);
  if (screen === SCREEN.pause) {
    ctx.fillStyle = 'rgba(51,32,15,0.55)';
    ctx.fillRect(0, 0, VIEW.width, VIEW.height);
    text(ctx, '⏸ PAUSED', 480, 240, 38, CREAM, 'center');
    drawButton(ctx, BUTTONS.resume);
  }
}

export function pointInButton(point, button) {
  return point !== null && point.x >= button.x && point.x <= button.x + button.width
    && point.y >= button.y && point.y <= button.y + button.height;
}
