/**
 * Minimal ambient sound — one quiet 40Hz sine wave.
 * Starts on first click/keypress.
 */

let audioCtx = null;
let started = false;

export function startAmbience() {
  if (started) return;

  function doStart() {
    if (started) return;
    started = true;

    try {
      audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    } catch (e) {
      console.warn('AudioContext not available:', e);
      return;
    }

    // Single 40Hz sine wave, volume 0.02
    const hum = audioCtx.createOscillator();
    hum.type = 'sine';
    hum.frequency.value = 40;
    const humGain = audioCtx.createGain();
    humGain.gain.value = 0.02;
    hum.connect(humGain);
    humGain.connect(audioCtx.destination);
    hum.start();
  }

  // Start on first user interaction
  document.addEventListener('click', doStart, { once: true });
  document.addEventListener('keydown', doStart, { once: true });
}
