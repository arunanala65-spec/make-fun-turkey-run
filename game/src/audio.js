// Tiny WebAudio sound kit: every noise is synthesised, no files.
// A gobble, a jump whoosh, corn dings, a lunge warning and two
// little jingles for escaping or getting caught. M toggles mute.

let context = null;
let muted = false;

function ensureContext() {
  if (context === null) {
    const AudioCtor = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtor) return null;
    context = new AudioCtor();
  }
  if (context.state === 'suspended') context.resume();
  return context;
}

function tone(freqFrom, freqTo, seconds, type, volume, when = 0) {
  if (muted) return;
  const ctx = ensureContext();
  if (!ctx) return;
  const start = ctx.currentTime + when;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freqFrom, start);
  osc.frequency.exponentialRampToValueAtTime(Math.max(30, freqTo), start + seconds);
  gain.gain.setValueAtTime(volume, start);
  gain.gain.exponentialRampToValueAtTime(0.001, start + seconds);
  osc.connect(gain).connect(ctx.destination);
  osc.start(start);
  osc.stop(start + seconds + 0.02);
}

export function playGobble() {
  tone(340, 180, 0.09, 'square', 0.08, 0);
  tone(320, 170, 0.09, 'square', 0.08, 0.11);
  tone(300, 150, 0.13, 'square', 0.09, 0.22);
}

export function playJump() {
  tone(280, 620, 0.16, 'sine', 0.1);
}

export function playDuck() {
  tone(500, 240, 0.1, 'sine', 0.06);
}

export function playCorn() {
  tone(880, 1320, 0.09, 'triangle', 0.12);
  tone(1320, 1760, 0.08, 'triangle', 0.08, 0.07);
}

export function playHit() {
  tone(220, 70, 0.22, 'sawtooth', 0.14);
  playGobble();
}

export function playLungeWarning() {
  tone(660, 660, 0.09, 'square', 0.1, 0);
  tone(660, 660, 0.09, 'square', 0.1, 0.14);
}

export function playDash() {
  tone(200, 700, 0.18, 'sawtooth', 0.05);
}

export function playEscaped() {
  [523, 659, 784, 1047].forEach((freq, i) => tone(freq, freq, 0.16, 'triangle', 0.12, i * 0.13));
}

export function playCaught() {
  [392, 330, 262, 196].forEach((freq, i) => tone(freq, freq * 0.9, 0.2, 'triangle', 0.12, i * 0.16));
}

export function toggleMute() {
  muted = !muted;
  return muted;
}

export function isMuted() {
  return muted;
}
