// Keyboard + mouse input as plain intents. Held keys are polled
// every step; one-shot actions are queued so taps are never lost.

export const INTENT = { start: 'start', jump: 'jump', pause: 'pause', restart: 'restart', mute: 'mute' };

export function createInput(canvas) {
  const held = { brake: false, duck: false, dash: false };
  const queue = [];
  let clickPoint = null;

  const heldKeys = {
    ArrowLeft: 'brake', KeyA: 'brake',
    ArrowDown: 'duck', KeyS: 'duck',
    ShiftLeft: 'dash', ShiftRight: 'dash', KeyL: 'dash', ArrowRight: 'dash', KeyD: 'dash',
  };

  function onKeyDown(event) {
    const slot = heldKeys[event.code];
    if (slot) {
      held[slot] = true;
      event.preventDefault();
      return;
    }
    if (event.repeat) return;
    if (event.code === 'ArrowUp' || event.code === 'KeyW' || event.code === 'Space') {
      queue.push(INTENT.jump, INTENT.start);
      event.preventDefault();
    } else if (event.code === 'Enter') {
      queue.push(INTENT.start, INTENT.restart);
    } else if (event.code === 'KeyR') {
      queue.push(INTENT.restart);
    } else if (event.code === 'KeyP' || event.code === 'Escape') {
      queue.push(INTENT.pause);
    } else if (event.code === 'KeyM') {
      queue.push(INTENT.mute);
    }
  }

  function onKeyUp(event) {
    const slot = heldKeys[event.code];
    if (slot) held[slot] = false;
  }

  function onPointerDown(event) {
    const rect = canvas.getBoundingClientRect();
    clickPoint = {
      x: (event.clientX - rect.left) * (canvas.width / rect.width),
      y: (event.clientY - rect.top) * (canvas.height / rect.height),
    };
    queue.push(INTENT.start);
  }

  window.addEventListener('keydown', onKeyDown);
  window.addEventListener('keyup', onKeyUp);
  canvas.addEventListener('pointerdown', onPointerDown);

  return {
    held,
    takeIntents: () => queue.splice(0, queue.length),
    takeClick() {
      const point = clickPoint;
      clickPoint = null;
      return point;
    },
    pressJump: () => queue.push(INTENT.jump),
  };
}
