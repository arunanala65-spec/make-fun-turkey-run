// Synthesised WebAudio sounds — no audio files. Gobbles, jumps,
// corn dings, power-up chimes, near-miss whooshes, lunge warnings,
// the gauntlet alarm and win/lose jingles.

let context = null;
let muted = false;

function ensureContext() {
  if (context === null) {
    const Ctor = window.AudioContext || window.webkitAudioContext;
    if (!Ctor) return null;
    context = new Ctor();
  }
  if (context.state === 'suspended') context.resume();
  return context;
}

function tone(from, to, seconds, type, volume, delay = 0) {
  if (muted) return;
  const ctx = ensureContext();
  if (!ctx) return;
  const start = ctx.currentTime + delay;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(from, start);
  osc.frequency.exponentialRampToValueAtTime(Math.max(30, to), start + seconds);
  gain.gain.setValueAtTime(volume, start);
  gain.gain.exponentialRampToValueAtTime(0.001, start + seconds);
  osc.connect(gain).connect(ctx.destination);
  osc.start(start);
  osc.stop(start + seconds + 0.02);
}

export function playGobble() {
  tone(350, 180, 0.09, 'square', 0.08, 0);
  tone(330, 170, 0.09, 'square', 0.08, 0.11);
  tone(310, 150, 0.14, 'square', 0.09, 0.22);
}

export function playJump() { tone(280, 640, 0.16, 'sine', 0.1); }
export function playDuck() { tone(520, 240, 0.1, 'sine', 0.06); }
export function playDash() { tone(200, 720, 0.18, 'sawtooth', 0.05); }
export function playNearMiss() { tone(900, 300, 0.12, 'sawtooth', 0.07); }
export function playShieldBlock() { tone(520, 1040, 0.14, 'triangle', 0.12); }

export function playCorn() {
  tone(880, 1320, 0.09, 'triangle', 0.12);
  tone(1320, 1760, 0.08, 'triangle', 0.08, 0.07);
}

export function playFeather() {
  tone(660, 990, 0.12, 'triangle', 0.11);
  tone(990, 1320, 0.12, 'triangle', 0.09, 0.1);
}

export function playPowerup() {
  [523, 784, 1047].forEach((f, i) => tone(f, f * 1.2, 0.1, 'square', 0.07, i * 0.07));
}

export function playTurbo() { tone(300, 1400, 0.3, 'sawtooth', 0.09); }

export function playHit() {
  tone(220, 70, 0.22, 'sawtooth', 0.14);
  playGobble();
}

export function playLungeWarning() {
  tone(660, 660, 0.09, 'square', 0.1, 0);
  tone(660, 660, 0.09, 'square', 0.1, 0.14);
}

export function playSpotted() { tone(980, 980, 0.1, 'square', 0.1); }

export function playGauntletAlarm() {
  tone(440, 440, 0.12, 'square', 0.1, 0);
  tone(440, 440, 0.12, 'square', 0.1, 0.18);
  tone(587, 587, 0.18, 'square', 0.1, 0.36);
}

export function playEscaped() {
  [523, 659, 784, 1047, 1319, 1568].forEach((f, i) => tone(f, f, 0.16, 'triangle', 0.12, i * 0.11));
}

export function playCaught() {
  [392, 330, 262, 196].forEach((f, i) => tone(f, f * 0.9, 0.2, 'triangle', 0.12, i * 0.16));
}

export function toggleMute() {
  muted = !muted;
  return muted;
}

export function isMuted() { return muted; }
