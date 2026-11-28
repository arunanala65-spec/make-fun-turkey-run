// Gobble Dash 3 boot: input, world, rendering and sound in a
// fixed-step loop with title / play / pause / end flow, best score
// in localStorage, and ?shot= staging for screenshots.

import { STEP, VIEW } from './config.js';
import { createInput, INTENT } from './input.js';
import { BUTTONS, drawGame, pointInButton, SCREEN } from './render.js';
import { seedFromQuery } from './rng.js';
import { stageShot } from './shots.js';
import { createWorld, finalScore } from './world.js';
import {
  isMuted, playCaught, playCorn, playDash, playDuck, playEscaped, playFeather,
  playGauntletAlarm, playGobble, playHit, playJump, playLungeWarning, playNearMiss,
  playPowerup, playShieldBlock, playSpotted, playTurbo, toggleMute,
} from './audio.js';

const canvas = document.getElementById('game');
canvas.width = VIEW.width;
canvas.height = VIEW.height;
const ctx = canvas.getContext('2d');
const statusLine = document.getElementById('status');

const params = new URLSearchParams(window.location.search);
const seed = seedFromQuery(window.location.search);
const shotName = params.get('shot');
const BEST_KEY = 'gobble-dash-3-best';

let world = createWorld(seed);
let screen = SCREEN.title;
let best = 0;
try { best = Number(window.localStorage.getItem(BEST_KEY)) || 0; } catch { best = 0; }
let lastDashSound = 0;

function announce(message) {
  if (statusLine) statusLine.textContent = message;
}

function saveBest() {
  const score = finalScore(world.state);
  if (score > best) {
    best = score;
    try { window.localStorage.setItem(BEST_KEY, String(best)); } catch { /* private mode */ }
  }
}

function resetRun() {
  world = createWorld(seed + Math.floor(Math.random() * 100000));
  screen = SCREEN.play;
  announce('Run! Outrun Farmer Hank for 1500 metres.');
  playGobble();
}

function handleEvents(events) {
  if (events.corn) playCorn();
  if (events.feather) playFeather();
  if (events.powerup === 'chili') playTurbo();
  else if (events.powerup) playPowerup();
  if (events.shieldBlock) playShieldBlock();
  if (events.jump) playJump();
  if (events.hit) playHit();
  if (events.nearMiss) playNearMiss();
  if (events.lungeWarn) playLungeWarning();
  if (events.spotted) playSpotted();
  if (events.gauntlet) playGauntletAlarm();
  if (events.zone) playGobble();
  if (events.escaped) {
    playEscaped();
    screen = SCREEN.end;
    announce('Pip escaped! Thanksgiving is saved for turkeys.');
  }
  if (events.caught) {
    playCaught();
    screen = SCREEN.end;
    announce('Caught by Farmer Hank. Press R to run again.');
  }
  saveBest();
}

if (shotName) {
  const staged = stageShot(shotName, world);
  screen = staged.screen;
  if (screen === SCREEN.end && !world.state.over) world.state.over = true;
  best = Math.max(best, finalScore(world.state));
  drawGame(ctx, world.state, screen, best);
} else {
  const input = createInput(canvas);
  let accumulator = 0;
  let lastTime = performance.now();

  function frame(now) {
    requestAnimationFrame(frame);
    accumulator += Math.min(0.1, (now - lastTime) / 1000);
    lastTime = now;
    const intents = input.takeIntents();
    const click = input.takeClick();

    for (const intent of intents) {
      if (intent === INTENT.mute) announce(toggleMute() ? 'Sound off' : 'Sound on');
      if (screen === SCREEN.title && intent === INTENT.start) resetRun();
      else if (screen === SCREEN.end && intent === INTENT.restart) resetRun();
      else if (screen === SCREEN.play && intent === INTENT.pause) screen = SCREEN.pause;
      else if (screen === SCREEN.pause && intent === INTENT.pause) screen = SCREEN.play;
    }
    if (click) {
      if (screen === SCREEN.title && pointInButton(click, BUTTONS.start)) resetRun();
      else if (screen === SCREEN.end && pointInButton(click, BUTTONS.restart)) resetRun();
      else if (screen === SCREEN.pause && pointInButton(click, BUTTONS.resume)) screen = SCREEN.play;
      else if (screen === SCREEN.play) input.pressJump();
    }

    while (accumulator >= STEP) {
      accumulator -= STEP;
      if (screen === SCREEN.play) {
        const control = {
          jump: intents.includes(INTENT.jump),
          duck: input.held.duck,
          dash: input.held.dash,
          brake: input.held.brake,
        };
        if (control.duck && world.state.turkey.onGround && !world.state.turkey.hidden) playDuck();
        if (control.dash && now - lastDashSound > 400) {
          playDash();
          lastDashSound = now;
        }
        handleEvents(world.step(STEP, control));
      }
    }
    drawGame(ctx, world.state, screen, best);
    if (isMuted()) {
      ctx.font = 'bold 12px Verdana, sans-serif';
      ctx.textAlign = 'right';
      ctx.fillStyle = '#fff6e3';
      ctx.fillText('MUTED (M)', VIEW.width - 16, VIEW.height - 14);
    }
  }
  requestAnimationFrame(frame);
}
