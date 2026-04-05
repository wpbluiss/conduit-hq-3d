// Procedural footstep sounds using Web Audio API
// Very quiet, barely noticeable
let ctx = null;

function getContext() {
  if (!ctx) {
    ctx = new (window.AudioContext || window.webkitAudioContext)();
  }
  return ctx;
}

function playStep(surface = 'hard') {
  const audio = getContext();
  if (audio.state === 'suspended') audio.resume();

  const now = audio.currentTime;

  // Short noise burst — 30ms
  const len = Math.floor(audio.sampleRate * 0.03);
  const buffer = audio.createBuffer(1, len, audio.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < len; i++) {
    data[i] = (Math.random() * 2 - 1);
  }

  const source = audio.createBufferSource();
  source.buffer = buffer;

  // Low-pass filter
  const filter = audio.createBiquadFilter();
  filter.type = 'lowpass';
  if (surface === 'marble') {
    // Indoor marble — slightly brighter
    filter.frequency.value = 300;
    filter.Q.value = 0.5;
  } else {
    filter.frequency.value = 200;
    filter.Q.value = 0.4;
  }

  // Very quiet volume with quick decay
  const gain = audio.createGain();
  gain.gain.setValueAtTime(0.05, now);
  gain.gain.exponentialRampToValueAtTime(0.001, now + 0.03);

  source.connect(filter).connect(gain).connect(audio.destination);
  source.start(now);
  source.stop(now + 0.035);
}

export function createFootstepSystem() {
  let stepTimer = 0;
  const walkInterval = 0.4;
  const runInterval = 0.25;

  return {
    update(dt, isMoving, isSprinting, isIndoor) {
      if (!isMoving) {
        stepTimer = 0;
        return;
      }

      stepTimer += dt;
      const interval = isSprinting ? runInterval : walkInterval;

      if (stepTimer >= interval) {
        stepTimer -= interval;
        playStep(isIndoor ? 'marble' : 'hard');
      }
    },
  };
}
