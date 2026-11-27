// Keyboard and mouse input, translated into plain game intents.
// Held keys are polled each step; one-shot actions (jump, pause,
// restart, start) are queued so a tap between frames is never lost.

export const INTENT = {
  start: 'start',
  jump: 'jump',
  pause: 'pause',
  restart: 'restart',
  mute: 'mute',
};

export function createInput(canvas) {
  const held = { left: false, right: false, down: false, dash: false };
  const queue = [];
  let clickPoint = null;

  const keyMap = {
    ArrowLeft: 'left', KeyA: 'left',
    ArrowRight: 'right', KeyD: 'right',
    ArrowDown: 'down', KeyS: 'down',
    ShiftLeft: 'dash', ShiftRight: 'dash', KeyL: 'dash',
  };

  function onKeyDown(event) {
    const slot = keyMap[event.code];
    if (slot) {
      held[slot] = true;
      event.preventDefault();
      return;
    }
    if (event.repeat) return;
    if (event.code === 'ArrowUp' || event.code === 'KeyW' || event.code === 'Space') {
      queue.push(INTENT.jump);
      queue.push(INTENT.start);
      event.preventDefault();
    } else if (event.code === 'Enter') {
      queue.push(INTENT.start);
      queue.push(INTENT.restart);
    } else if (event.code === 'KeyR') {
      queue.push(INTENT.restart);
    } else if (event.code === 'KeyP' || event.code === 'Escape') {
      queue.push(INTENT.pause);
    } else if (event.code === 'KeyM') {
      queue.push(INTENT.mute);
    }
  }

  function onKeyUp(event) {
    const slot = keyMap[event.code];
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
    takeIntents() {
      const out = queue.splice(0, queue.length);
      return out;
    },
    takeClick() {
      const point = clickPoint;
      clickPoint = null;
      return point;
    },
    pressJump() {
      queue.push(INTENT.jump);
    },
  };
}
