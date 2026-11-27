// Gobble Dash boot: wires input, world, rendering and sound into a
// fixed-step game loop, and handles title / play / pause / end flow.
// With ?shot=title|play|kitchen|end it stages a screenshot scene and
// freezes on that frame instead of starting live play.

import { STEP, VIEW } from './config.js';
import { createInput, INTENT } from './input.js';
import { BUTTONS, drawGame, pointInButton, SCREEN } from './render.js';
import { seedFromQuery } from './random.js';
import { stageShot } from './shots.js';
import { createWorld, EVENT, finalScore } from './world.js';
import {
  isMuted, playCaught, playCorn, playDash, playDuck, playEscaped,
  playGobble, playHit, playJump, playLungeWarning, toggleMute,
} from './audio.js';

const canvas = document.getElementById('game');
canvas.width = VIEW.width;
canvas.height = VIEW.height;
const ctx = canvas.getContext('2d');
const statusLine = document.getElementById('status');

const params = new URLSearchParams(window.location.search);
const seed = seedFromQuery(window.location.search);
const shotName = params.get('shot');

let world = createWorld(seed);
let screen = SCREEN.title;
let best = 0;
let lastDashSound = 0;

function announce(message) {
  if (statusLine) statusLine.textContent = message;
}

function resetRun() {
  world = createWorld(seed + Math.floor(Math.random() * 100000));
  screen = SCREEN.play;
  announce('Run! Outrun Farmer Hank.');
  playGobble();
}

function handleEvents(events) {
  if (events & EVENT.corn) playCorn();
  if (events & EVENT.jumped) playJump();
  if (events & EVENT.hit) playHit();
  if (events & EVENT.lungeWarn) playLungeWarning();
  if (events & EVENT.escaped) {
    playEscaped();
    screen = SCREEN.end;
    announce('Pip escaped! Thanksgiving is saved for turkeys.');
  }
  if (events & EVENT.caught) {
    playCaught();
    screen = SCREEN.end;
    announce('Caught by Farmer Hank. Press R to run again.');
  }
  const score = finalScore(world.state);
  if (score > best) best = score;
}

if (shotName) {
  const staged = stageShot(shotName, world);
  screen = staged.screen;
  if (screen === SCREEN.end && !world.state.over) {
    world.state.over = true;
  }
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
          duck: input.held.down,
          dash: input.held.dash,
          brake: input.held.left,
        };
        if (control.duck && world.state.turkey.onGround) playDuck();
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
