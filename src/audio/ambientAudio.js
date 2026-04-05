/**
 * Ambient Audio System — Procedural office sounds using Web Audio API.
 *
 * All sounds are synthesized. Zero external audio files.
 * Starts on first user interaction (browser autoplay policy).
 *
 * Sounds:
 * - Keyboard typing clicks (per-floor, scales with TYPING agents)
 * - Phone ring (Sales + Operations, triggers ON_PHONE state)
 * - HVAC hum (always, louder on Monitoring)
 * - Elevator ding (global, random interval)
 * - Notification ping (Intelligence + Monitoring)
 *
 * Controls: N to mute/unmute. Master volume in localStorage.
 */

let ctx = null;
let masterGain = null;
let started = false;
let muted = false;
let currentFloorY = 0;
let currentFloorDept = '';

// Active sound loops (cleaned up on floor switch)
let typingInterval = null;
let phoneInterval = null;
let pingInterval = null;
let elevatorInterval = null;
let humOsc = null;
let humGain = null;

// Callback to trigger agent state changes (set from outside)
let onPhoneRingCallback = null;

// Master volume (0-1)
let masterVolume = 0.5;
try {
  const saved = localStorage.getItem('hq-audio-volume');
  if (saved !== null) masterVolume = parseFloat(saved);
} catch (e) {}

// Floor Y → department mapping
const FLOOR_DEPT = {
  50: 'Sales', 100: 'Marketing', 150: 'Engineering',
  200: 'Content', 250: 'Intelligence', 300: 'Operations', 350: 'Monitoring',
};

// ============================================================
// Initialization
// ============================================================

function initAudioContext() {
  if (ctx) return;
  try {
    ctx = new (window.AudioContext || window.webkitAudioContext)();
    masterGain = ctx.createGain();
    masterGain.gain.value = muted ? 0 : masterVolume;
    masterGain.connect(ctx.destination);
    console.log('[AUDIO] AudioContext initialized');
  } catch (e) {
    console.warn('[AUDIO] AudioContext not available:', e);
  }
}

function ensureContext() {
  if (!ctx) return false;
  if (ctx.state === 'suspended') ctx.resume();
  return ctx.state === 'running';
}

// ============================================================
// Sound generators (all procedural)
// ============================================================

/** Short noise burst — keyboard click */
function playKeyClick() {
  if (!ensureContext()) return;
  const now = ctx.currentTime;
  const dur = 0.02; // 20ms
  const len = Math.floor(ctx.sampleRate * dur);
  const buffer = ctx.createBuffer(1, len, ctx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < len; i++) {
    data[i] = (Math.random() * 2 - 1) * (1 - i / len); // decaying noise
  }

  const source = ctx.createBufferSource();
  source.buffer = buffer;

  // Bandpass filter 800-2000Hz for clicky sound
  const filter = ctx.createBiquadFilter();
  filter.type = 'bandpass';
  filter.frequency.value = 800 + Math.random() * 1200;
  filter.Q.value = 1.5;

  // Stereo pan (randomize left/right)
  const panner = ctx.createStereoPanner();
  panner.pan.value = (Math.random() - 0.5) * 0.6;

  const gain = ctx.createGain();
  gain.gain.setValueAtTime(0.06 + Math.random() * 0.02, now);
  gain.gain.exponentialRampToValueAtTime(0.001, now + dur);

  source.connect(filter).connect(panner).connect(gain).connect(masterGain);
  source.start(now);
  source.stop(now + dur + 0.01);
}

/** Phone ring: two-tone oscillation (440+480Hz), 2 rings */
function playPhoneRing() {
  if (!ensureContext()) return;
  const now = ctx.currentTime;
  const vol = 0.10;

  for (let ring = 0; ring < 2; ring++) {
    const start = now + ring * 1.0;
    for (const freq of [440, 480]) {
      const osc = ctx.createOscillator();
      osc.type = 'sine';
      osc.frequency.value = freq;
      const gain = ctx.createGain();
      gain.gain.setValueAtTime(0, start);
      gain.gain.linearRampToValueAtTime(vol, start + 0.02);
      gain.gain.setValueAtTime(vol, start + 0.4);
      gain.gain.linearRampToValueAtTime(0, start + 0.5);
      osc.connect(gain).connect(masterGain);
      osc.start(start);
      osc.stop(start + 0.55);
    }
  }
}

/** Elevator ding: 1000Hz sine, 200ms, quick fade */
function playElevatorDing() {
  if (!ensureContext()) return;
  const now = ctx.currentTime;
  const osc = ctx.createOscillator();
  osc.type = 'sine';
  osc.frequency.value = 1000;
  const gain = ctx.createGain();
  gain.gain.setValueAtTime(0.05, now);
  gain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);
  osc.connect(gain).connect(masterGain);
  osc.start(now);
  osc.stop(now + 0.25);
}

/** Notification ping: descending two-tone 880→660Hz */
function playNotificationPing() {
  if (!ensureContext()) return;
  const now = ctx.currentTime;
  for (const [freq, offset] of [[880, 0], [660, 0.1]]) {
    const osc = ctx.createOscillator();
    osc.type = 'sine';
    osc.frequency.value = freq;
    const gain = ctx.createGain();
    const t = now + offset;
    gain.gain.setValueAtTime(0.04, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.1);
    osc.connect(gain).connect(masterGain);
    osc.start(t);
    osc.stop(t + 0.15);
  }
}

// ============================================================
// Continuous HVAC hum
// ============================================================
function startHum(isMonitoring) {
  if (!ensureContext()) return;
  stopHum();
  humOsc = ctx.createOscillator();
  humOsc.type = 'sine';
  humOsc.frequency.value = 60;
  humGain = ctx.createGain();
  humGain.gain.value = isMonitoring ? 0.035 : 0.018;
  humOsc.connect(humGain).connect(masterGain);
  humOsc.start();
}

function stopHum() {
  if (humOsc) { try { humOsc.stop(); } catch (e) {} humOsc = null; }
  humGain = null;
}

// ============================================================
// Floor-specific sound loops
// ============================================================

function startFloorSounds(floorY) {
  stopFloorSounds();
  const dept = FLOOR_DEPT[floorY];
  if (!dept) return; // lobby or CEO — no office sounds

  // Keyboard typing (all department floors)
  typingInterval = setInterval(() => {
    playKeyClick();
  }, 50 + Math.random() * 100);

  // Phone ring (Sales + Operations)
  if (dept === 'Sales' || dept === 'Operations') {
    const scheduleRing = () => {
      const delay = (45 + Math.random() * 45) * 1000;
      phoneInterval = setTimeout(() => {
        playPhoneRing();
        if (onPhoneRingCallback) onPhoneRingCallback(floorY);
        scheduleRing();
      }, delay);
    };
    scheduleRing();
  }

  // Notification pings (Intelligence + Monitoring)
  if (dept === 'Intelligence' || dept === 'Monitoring') {
    const schedulePing = () => {
      const delay = (30 + Math.random() * 30) * 1000;
      pingInterval = setTimeout(() => {
        playNotificationPing();
        schedulePing();
      }, delay);
    };
    schedulePing();
  }

  // HVAC hum
  startHum(dept === 'Monitoring');
}

function stopFloorSounds() {
  if (typingInterval) { clearInterval(typingInterval); typingInterval = null; }
  if (phoneInterval) { clearTimeout(phoneInterval); phoneInterval = null; }
  if (pingInterval) { clearTimeout(pingInterval); pingInterval = null; }
  stopHum();
}

// Global elevator ding (random interval, any floor)
function startElevatorDings() {
  const scheduleDing = () => {
    const delay = (60 + Math.random() * 120) * 1000;
    elevatorInterval = setTimeout(() => {
      playElevatorDing();
      scheduleDing();
    }, delay);
  };
  scheduleDing();
}

// ============================================================
// Mute toggle + HUD indicator
// ============================================================

function createMuteIndicator() {
  const el = document.createElement('div');
  el.id = 'audio-indicator';
  el.style.cssText = `
    position: fixed; bottom: 12px; left: 12px; padding: 6px 10px;
    background: rgba(10,11,16,0.7); border: 1px solid rgba(139,92,246,0.3);
    border-radius: 6px; color: #94a3b8; font: 500 11px monospace;
    z-index: 50; pointer-events: none; backdrop-filter: blur(4px);
  `;
  el.textContent = muted ? '🔇 N to unmute' : '🔊 N to mute';
  document.body.appendChild(el);

  document.addEventListener('keydown', (e) => {
    if (e.code === 'KeyN' && !e.ctrlKey && !e.metaKey && e.target.tagName !== 'INPUT' && e.target.tagName !== 'TEXTAREA') {
      muted = !muted;
      if (masterGain) masterGain.gain.value = muted ? 0 : masterVolume;
      el.textContent = muted ? '🔇 N to unmute' : '🔊 N to mute';
      el.style.color = muted ? '#64748b' : '#94a3b8';
    }
  });
}

// ============================================================
// Public API
// ============================================================

/**
 * Initialize the ambient audio system.
 * Call once from main.js. Starts on first user interaction.
 */
export function initAmbientAudio() {
  if (started) return;
  started = true;

  createMuteIndicator();

  function doStart() {
    initAudioContext();
    startElevatorDings();
    // Start floor sounds for current floor
    if (currentFloorY > 0) startFloorSounds(currentFloorY);
  }

  document.addEventListener('click', doStart, { once: true });
  document.addEventListener('keydown', doStart, { once: true });
}

/**
 * Switch audio to a new floor. Stops previous floor sounds, starts new ones.
 */
export function setAudioFloor(floorY) {
  currentFloorY = floorY;
  currentFloorDept = FLOOR_DEPT[floorY] || '';
  if (ctx) {
    stopFloorSounds();
    if (floorY > 0) startFloorSounds(floorY);
  }
}

/**
 * Register callback for phone ring events (to trigger agent ON_PHONE state).
 * callback(floorY) is called when a phone rings on a floor.
 */
export function onPhoneRing(callback) {
  onPhoneRingCallback = callback;
}

/**
 * Set master volume (0-1). Persists to localStorage.
 */
export function setMasterVolume(vol) {
  masterVolume = Math.max(0, Math.min(1, vol));
  if (masterGain && !muted) masterGain.gain.value = masterVolume;
  try { localStorage.setItem('hq-audio-volume', String(masterVolume)); } catch (e) {}
}
