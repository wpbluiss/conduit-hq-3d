import * as THREE from 'three/webgpu';

/**
 * Agent Animator — Procedural desk animations with state machine.
 *
 * States: TYPING, THINKING, ON_PHONE, STANDING
 * All agents stay seated at their desks. No position translation.
 * Animations are rotation-only to look natural on non-rigged mesh models.
 *
 * WALKING is disabled until rigged Mixamo characters are available.
 */

// ============================================================
// States — rotation-only, no position changes
// ============================================================
const STATE_WEIGHTS = { TYPING: 65, THINKING: 20, ON_PHONE: 15 };
const STATE_LIST = Object.keys(STATE_WEIGHTS);
const TOTAL_WEIGHT = Object.values(STATE_WEIGHTS).reduce((a, b) => a + b, 0);

function pickRandomState(exclude) {
  for (let attempt = 0; attempt < 5; attempt++) {
    let r = Math.random() * TOTAL_WEIGHT;
    for (const s of STATE_LIST) {
      r -= STATE_WEIGHTS[s];
      if (r <= 0) {
        if (s !== exclude || attempt >= 3) return s;
        break;
      }
    }
  }
  return 'TYPING';
}

// ============================================================
// Department action text
// ============================================================
const DEPT_ACTIONS = {
  Sales:        ['Sending outreach email...', 'Following up with lead...', 'Updating pipeline...', 'Qualifying prospect...', 'Scheduling demo...'],
  Marketing:    ['Scheduling social post...', 'Analyzing campaign...', 'Creating content brief...', 'Running A/B test...', 'Optimizing SEO...'],
  Engineering:  ['Deploying update...', 'Reviewing PR...', 'Running tests...', 'Fixing bug...', 'Refactoring module...'],
  Content:      ['Writing blog draft...', 'Editing video clip...', 'Designing graphic...', 'A/B testing headline...', 'Recording voiceover...'],
  Intelligence: ['Analyzing market data...', 'Generating forecast...', 'Researching competitor...', 'Building report...', 'Tracking trends...'],
  Operations:   ['Processing invoice...', 'Updating ticket...', 'Onboarding client...', 'Reconciling accounts...', 'Scheduling follow-up...'],
  Monitoring:   ['Checking uptime...', 'Reviewing alerts...', 'Analyzing error logs...', 'Monitoring latency...', 'Running diagnostics...'],
};
const STATE_ACTIONS = {
  THINKING: ['Deep in thought...', 'Reviewing strategy...', 'Planning next steps...', 'Considering options...'],
  ON_PHONE: ['On a call...', 'Client call...', 'Team sync...', 'Discussing project...'],
};

function getActionText(state, department) {
  if (state === 'TYPING') {
    const a = DEPT_ACTIONS[department] || DEPT_ACTIONS.Operations;
    return a[Math.floor(Math.random() * a.length)];
  }
  const a = STATE_ACTIONS[state];
  if (a) return a[Math.floor(Math.random() * a.length)];
  return 'Working...';
}

// ============================================================
// Floating action text
// ============================================================
const activeFloaters = [];

function createFloatingText(text, agentGroup) {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 64;
  const ctx = canvas.getContext('2d');
  ctx.clearRect(0, 0, 512, 64);
  ctx.fillStyle = 'rgba(10, 11, 16, 0.75)';
  ctx.beginPath();
  ctx.roundRect(10, 8, 492, 48, 10);
  ctx.fill();
  ctx.fillStyle = '#10b981';
  ctx.font = '600 22px "Segoe UI", system-ui, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(text, 256, 32);

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  const mat = new THREE.SpriteMaterial({ map: texture, transparent: true, opacity: 0, depthTest: false });
  const sprite = new THREE.Sprite(mat);
  sprite.scale.set(2.5, 0.32, 1);
  sprite.position.set(0, 2.8, 0);
  agentGroup.add(sprite);
  activeFloaters.push({ sprite, parent: agentGroup, age: 0, duration: 3.0 });
}

function updateFloaters(delta) {
  for (let i = activeFloaters.length - 1; i >= 0; i--) {
    const f = activeFloaters[i];
    f.age += delta;
    if (f.age < 0.3) f.sprite.material.opacity = f.age / 0.3;
    else if (f.age > f.duration - 0.5) f.sprite.material.opacity = Math.max(0, (f.duration - f.age) / 0.5);
    else f.sprite.material.opacity = 1;
    f.sprite.position.y = 2.8 + (f.age / f.duration) * 0.5;
    if (f.age >= f.duration) {
      f.parent.remove(f.sprite);
      f.sprite.material.map?.dispose();
      f.sprite.material.dispose();
      activeFloaters.splice(i, 1);
    }
  }
}

// ============================================================
// Status LED
// ============================================================
function createStatusLED() {
  const geo = new THREE.SphereGeometry(0.04, 6, 4);
  const mat = new THREE.MeshBasicMaterial({ color: 0x10b981, transparent: true, opacity: 0.8 });
  return new THREE.Mesh(geo, mat);
}

function updateStatusLED(mesh, state, time) {
  if (!mesh) return;
  const m = mesh.material;
  if (state === 'TYPING' || state === 'ON_PHONE') {
    m.color.setHex(0x10b981); // green
    m.opacity = 0.6 + Math.sin(time * 3) * 0.2;
  } else {
    m.color.setHex(0xeab308); // yellow
    m.opacity = 0.8;
  }
}

// ============================================================
// Debug overlay (press D)
// ============================================================
let debugEnabled = false;
const debugSprites = new Map();

document.addEventListener('keydown', (e) => {
  if (e.code === 'KeyD' && !e.ctrlKey && !e.metaKey && e.target.tagName !== 'INPUT' && e.target.tagName !== 'TEXTAREA') {
    debugEnabled = !debugEnabled;
    if (!debugEnabled) for (const [, s] of debugSprites) s.visible = false;
  }
});

function updateDebugOverlay(agentGroup, state) {
  if (!debugEnabled) return;
  let sprite = debugSprites.get(agentGroup);
  if (!sprite) {
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 48;
    const tex = new THREE.CanvasTexture(canvas);
    tex.colorSpace = THREE.SRGBColorSpace;
    const mat = new THREE.SpriteMaterial({ map: tex, transparent: true, depthTest: false });
    sprite = new THREE.Sprite(mat);
    sprite.scale.set(1.8, 0.34, 1);
    sprite.position.set(0, 3.2, 0);
    agentGroup.add(sprite);
    debugSprites.set(agentGroup, sprite);
  }
  sprite.visible = true;
  const canvas = sprite.material.map.image;
  const ctx = canvas.getContext('2d');
  ctx.clearRect(0, 0, 256, 48);
  ctx.fillStyle = 'rgba(0,0,0,0.85)';
  ctx.fillRect(0, 0, 256, 48);
  const colors = { TYPING: '#10b981', THINKING: '#eab308', ON_PHONE: '#3b82f6' };
  ctx.fillStyle = colors[state.state] || '#fff';
  ctx.font = 'bold 16px monospace';
  ctx.textAlign = 'center';
  ctx.fillText(state.state, 128, 18);
  ctx.fillStyle = '#94a3b8';
  ctx.font = '13px monospace';
  ctx.fillText(`${Math.max(0, state.stateDuration - state.stateTimer).toFixed(0)}s left`, 128, 38);
  sprite.material.map.needsUpdate = true;
}

// ============================================================
// Per-agent state
// ============================================================
function createAgentState(index) {
  const r = () => Math.random();
  // Stagger initial states
  const initial = ['TYPING', 'TYPING', 'TYPING', 'THINKING', 'ON_PHONE', 'TYPING', 'TYPING', 'THINKING'];

  return {
    state: initial[index % initial.length],
    stateTimer: 0,
    stateDuration: 15 + r() * 45, // 15-60s
    transitionProgress: 1.0,

    // Phase offsets (unique per agent)
    breathPhase: r() * Math.PI * 2,
    typingPhase: r() * Math.PI * 2,

    // Breathing
    breathSpeed: 1.2 + r() * 0.6,

    // Typing — subtle rotations only
    typingSpeed: 4.0 + r() * 3.0,
    typingLeanAmp: 0.08 + r() * 0.04,   // 5-7° forward lean
    typingSwayAmp: 0.008 + r() * 0.005,  // very subtle sway
    typingBobAmp: 0.004 + r() * 0.003,   // barely perceptible bob

    // Head nod
    headNodInterval: 3.0 + r() * 2.0,
    headNodTimer: r() * 3.0,
    headNodActive: false,
    headNodProgress: 0,

    // Head look
    headLookInterval: 6.0 + r() * 8.0,
    headLookTimer: r() * 5.0,
    headLookActive: false,
    headLookProgress: 0,
    headLookDirection: 0,
    headLookHoldTime: 1.5 + r() * 1.0,
    _headLookAngle: 0,

    // Swivel
    swivelInterval: 12.0 + r() * 10.0,
    swivelTimer: r() * 10.0,
    swivelActive: false,
    swivelProgress: 0,
    swivelDirection: 0,
    swivelHoldTime: 2.0 + r() * 2.0,
    _swivelAngle: 0,

    // Thinking head tilt
    thinkingTiltTimer: r() * 4.0,
    thinkingTiltInterval: 4.0 + r() * 2.0,
    thinkingTiltActive: false,
    thinkingTiltProgress: 0,
    thinkingTiltDir: 0,

    // On phone nod
    phoneNodTimer: r() * 2.0,
    phoneNodInterval: 2.0 + r() * 1.0,
    phoneNodActive: false,
    phoneNodProgress: 0,

    // Mouse micro-movement
    mouseSpeed: 1.5 + r() * 1.0,
    mouseAmp: 0.005 + r() * 0.003,

    // Pose interpolation (rotation only, no position)
    targetLeanX: 0, targetLeanZ: 0,
    currentLeanX: 0, currentLeanZ: 0,

    // Base (captured at init)
    baseRotationY: 0, baseRotationX: 0, baseRotationZ: 0, baseScaleY: 1,

    // Info
    department: '', agentName: '',
  };
}

// ============================================================
// Public API
// ============================================================

export function initAgentAnimation(agentGroup, index, department, agentName) {
  const state = createAgentState(index);
  const model = agentGroup.userData.model;
  if (model) {
    state.baseRotationY = model.rotation.y;
    state.baseRotationX = model.rotation.x;
    state.baseRotationZ = model.rotation.z;
    state.baseScaleY = model.scale.y;
  }
  state.department = department || '';
  state.agentName = agentName || '';
  agentGroup.userData.animState = state;

  // Status LED above name tag
  const led = createStatusLED();
  led.position.set(0, 2.5, 0);
  agentGroup.add(led);
  agentGroup.userData.statusLED = led;

  return state;
}

export function captureModelBase(agentGroup) {
  const model = agentGroup.userData.model;
  if (!model) return;
  if (!model.userData) model.userData = {};
  model.userData.baseX = model.position.x;
  model.userData.baseZ = model.position.z;
  if (!agentGroup.userData.baseY) agentGroup.userData.baseY = agentGroup.position.y;
}

export function updateAgentAnimation(agentGroup, time, delta, playerPos) {
  const state = agentGroup.userData.animState;
  const model = agentGroup.userData.model;
  if (!state || !model) return;

  const parts = agentGroup.userData.parts; // articulated model parts (if available)

  // --- State machine ---
  state.stateTimer += delta;
  if (state.stateTimer >= state.stateDuration) {
    transitionState(state, agentGroup);
  }

  // --- Compute target pose ---
  computePose(state, time, delta);

  // --- Smooth interpolation ---
  state.currentLeanX += (state.targetLeanX - state.currentLeanX) * Math.min(1, delta * 2.5);
  state.currentLeanZ += (state.targetLeanZ - state.currentLeanZ) * Math.min(1, delta * 2.5);

  // --- Chair swivel ---
  updateSwivel(state, delta);
  agentGroup.rotation.y = state._swivelAngle;

  // --- Head rotation ---
  const headY = computeHeadY(state, time, delta, playerPos, agentGroup);
  const headNod = computeHeadNod(state, delta);

  if (parts) {
    // === ARTICULATED MODEL: animate individual body parts ===
    const torso = parts.torso;
    const head = parts.head;
    const leftForearm = parts.leftForearm;
    const rightForearm = parts.rightForearm;
    const leftArm = parts.leftArm;
    const rightArm = parts.rightArm;

    // Breathing on torso
    if (torso) {
      const breathe = 1.0 + Math.sin(time * state.breathSpeed + state.breathPhase) * 0.012;
      torso.scale.y = breathe;
    }

    // Torso lean (forward/back, sway)
    if (torso) {
      torso.rotation.x = state.currentLeanX;
      torso.rotation.z = state.currentLeanZ;
    }

    // Head rotation (independent from torso)
    if (head) {
      head.rotation.y += (headY - state.baseRotationY - head.rotation.y) * Math.min(1, delta * 4);
      head.rotation.x = headNod;
    }

    // Forearm animation per state
    if (state.state === 'TYPING') {
      // Typing: forearms oscillate rapidly (each arm slightly different phase)
      const t = time;
      if (leftForearm) {
        leftForearm.rotation.x = -0.3 + Math.sin(t * state.typingSpeed + state.typingPhase) * 0.15;
        leftForearm.rotation.z = Math.sin(t * state.typingSpeed * 0.8 + state.typingPhase + 1) * 0.06;
      }
      if (rightForearm) {
        rightForearm.rotation.x = -0.3 + Math.sin(t * state.typingSpeed + state.typingPhase + 1.5) * 0.15;
        rightForearm.rotation.z = Math.sin(t * state.typingSpeed * 0.8 + state.typingPhase + 2.5) * 0.06;
      }
    } else if (state.state === 'THINKING') {
      // Thinking: arms relaxed, slightly spread
      if (leftForearm) {
        leftForearm.rotation.x = -0.1;
        leftForearm.rotation.z = 0;
      }
      if (rightForearm) {
        // Right hand near chin
        rightForearm.rotation.x = -0.8;
        rightForearm.rotation.z = 0.2;
      }
    } else if (state.state === 'ON_PHONE') {
      // On phone: right arm raised to ear
      if (rightArm) rightArm.rotation.x = -0.3; // raise shoulder area
      if (rightForearm) {
        rightForearm.rotation.x = -1.4; // forearm up to ear
        rightForearm.rotation.z = 0.3;
      }
      // Left arm rests
      if (leftForearm) {
        leftForearm.rotation.x = -0.2;
        leftForearm.rotation.z = 0;
      }
      if (leftArm) leftArm.rotation.x = 0;
    }

    // Reset arm raise when not on phone
    if (state.state !== 'ON_PHONE') {
      if (rightArm) rightArm.rotation.x = 0;
      if (leftArm) leftArm.rotation.x = 0;
    }

  } else if (agentGroup.userData.bones) {
    // === RIGGED MODEL: animate skeleton bones ===
    const bones = agentGroup.userData.bones;

    // Spine lean (forward/back for typing vs thinking)
    if (bones.spine) {
      bones.spine.rotation.x += (state.currentLeanX - (bones.spine.rotation.x - (bones.spine.userData?._baseX || 0))) * Math.min(1, delta * 3);
      if (!bones.spine.userData) bones.spine.userData = {};
      if (bones.spine.userData._baseX === undefined) bones.spine.userData._baseX = bones.spine.rotation.x;
    }

    // Head look + nod
    if (bones.head) {
      const targetHeadY = headY - state.baseRotationY;
      bones.head.rotation.y += (targetHeadY - bones.head.rotation.y) * Math.min(1, delta * 4);
      bones.head.rotation.x = headNod;
    }

    // Forearm animation per state
    if (state.state === 'TYPING') {
      if (bones.leftForearm) {
        bones.leftForearm.rotation.x = -0.5 + Math.sin(time * state.typingSpeed + state.typingPhase) * 0.3;
      }
      if (bones.rightForearm) {
        bones.rightForearm.rotation.x = -0.5 + Math.sin(time * state.typingSpeed + state.typingPhase + Math.PI) * 0.3;
      }
    } else if (state.state === 'ON_PHONE') {
      if (bones.rightUpperArm) bones.rightUpperArm.rotation.x = -0.4;
      if (bones.rightForearm) {
        bones.rightForearm.rotation.x = -1.5;
        bones.rightForearm.rotation.z = 0.3;
      }
      if (bones.leftForearm) bones.leftForearm.rotation.x = -0.2;
    } else if (state.state === 'THINKING') {
      if (bones.leftForearm) bones.leftForearm.rotation.x = -0.1;
      if (bones.rightForearm) {
        bones.rightForearm.rotation.x = -0.8;
        bones.rightForearm.rotation.z = 0.2;
      }
    }
    // Reset upper arm when not on phone
    if (state.state !== 'ON_PHONE' && bones.rightUpperArm) {
      bones.rightUpperArm.rotation.x = 0;
    }

  } else {
    // === MONOLITHIC MODEL: rotate whole mesh (fallback) ===
    const breathe = 1.0 + Math.sin(time * state.breathSpeed + state.breathPhase) * 0.012;
    model.scale.y = state.baseScaleY * breathe;

    model.rotation.x = state.baseRotationX + state.currentLeanX + headNod;
    model.rotation.z = state.baseRotationZ + state.currentLeanZ;
    model.rotation.y += (headY - model.rotation.y) * Math.min(1, delta * 4);

    // Mouse micro-movement (TYPING only)
    if (state.state === 'TYPING') {
      model.position.x = (model.userData?.baseX || 0) + Math.sin(time * state.mouseSpeed + state.typingPhase) * state.mouseAmp;
      model.position.z = (model.userData?.baseZ || 0) + Math.cos(time * state.mouseSpeed * 0.7 + state.typingPhase) * state.mouseAmp;
    } else {
      model.position.x = model.userData?.baseX || 0;
      model.position.z = model.userData?.baseZ || 0;
    }
  }

  // --- Status LED ---
  updateStatusLED(agentGroup.userData.statusLED, state.state, time);

  // --- Debug + floaters ---
  updateDebugOverlay(agentGroup, state);
  updateFloaters(delta);
}

// ============================================================
// State transition
// ============================================================
function transitionState(state, agentGroup) {
  const prev = state.state;
  const next = pickRandomState(prev);
  state.state = next;
  state.stateTimer = 0;
  state.stateDuration = 15 + Math.random() * 45;
  state.transitionProgress = 0;

  createFloatingText(getActionText(next, state.department), agentGroup);
  console.log(`[AGENT] ${state.agentName}: ${prev} → ${next} (${state.stateDuration.toFixed(0)}s)`);
}

// ============================================================
// Pose targets per state (rotation only)
// ============================================================
function computePose(state, time, delta) {
  const t = time;
  switch (state.state) {
    case 'TYPING': {
      // Subtle forward lean that oscillates slightly
      state.targetLeanX = state.typingLeanAmp * (0.6 + 0.4 * Math.sin(t * 0.3 + state.typingPhase));
      // Very subtle lateral sway
      state.targetLeanZ = Math.sin(t * 0.8 + state.typingPhase) * state.typingSwayAmp;
      break;
    }
    case 'THINKING': {
      // Lean back ~18° — clearly different from typing
      state.targetLeanX = -0.32;
      // Very gentle idle sway
      state.targetLeanZ = Math.sin(t * 0.12 + state.breathPhase) * 0.005;
      // Head tilt timer
      state.thinkingTiltTimer += delta;
      if (!state.thinkingTiltActive && state.thinkingTiltTimer > state.thinkingTiltInterval) {
        state.thinkingTiltActive = true;
        state.thinkingTiltProgress = 0;
        state.thinkingTiltTimer = 0;
        state.thinkingTiltDir = Math.random() > 0.5 ? 1 : -1;
        state.thinkingTiltInterval = 4.0 + Math.random() * 2.0;
      }
      if (state.thinkingTiltActive) {
        state.thinkingTiltProgress += delta;
        if (state.thinkingTiltProgress >= 5.0) state.thinkingTiltActive = false;
      }
      break;
    }
    case 'ON_PHONE': {
      // Slight upright lean — not leaned into desk like typing
      state.targetLeanX = 0.03;
      // No body rock — just head nods are the primary motion
      state.targetLeanZ = 0;
      // Phone nod timer
      state.phoneNodTimer += delta;
      if (!state.phoneNodActive && state.phoneNodTimer > state.phoneNodInterval) {
        state.phoneNodActive = true;
        state.phoneNodProgress = 0;
        state.phoneNodTimer = 0;
        state.phoneNodInterval = 2.0 + Math.random() * 1.0;
      }
      if (state.phoneNodActive) {
        state.phoneNodProgress += delta * 3.5;
        if (state.phoneNodProgress >= 1.0) state.phoneNodActive = false;
      }
      break;
    }
  }
}

// ============================================================
// Head Y rotation
// ============================================================
function computeHeadY(state, time, delta, playerPos, agentGroup) {
  let angle = 0;

  if (state.state === 'THINKING') {
    // Slow deliberate head tilt side-to-side
    if (state.thinkingTiltActive) {
      const p = state.thinkingTiltProgress;
      if (p < 1.2) angle = state.thinkingTiltDir * 0.22 * smoothStep(p / 1.2);
      else if (p < 3.2) angle = state.thinkingTiltDir * 0.22;
      else if (p < 5.0) angle = state.thinkingTiltDir * 0.22 * (1 - smoothStep((p - 3.2) / 1.8));
    }
  } else {
    // TYPING / ON_PHONE: occasional glance left/right
    updateHeadLook(state, delta, 0.22, 6.0, 10.0); // ±13°
    angle = state._headLookAngle;
  }

  // Player tracking (when not actively looking away)
  let track = 0;
  if (playerPos && !state.headLookActive) {
    const dx = playerPos.x - agentGroup.position.x;
    const dz = playerPos.z - agentGroup.position.z;
    const dist = Math.sqrt(dx * dx + dz * dz);
    if (dist < 8 && dist > 0.5) {
      const target = Math.atan2(dx, dz);
      track = Math.max(-0.5, Math.min(0.5, target - state.baseRotationY)) * 0.25;
    }
  }

  return state.baseRotationY + angle + track;
}

function updateHeadLook(state, delta, maxAngle, minInt, maxInt) {
  state.headLookTimer += delta;
  if (!state.headLookActive && state.headLookTimer > state.headLookInterval) {
    state.headLookActive = true;
    state.headLookProgress = 0;
    state.headLookTimer = 0;
    state.headLookDirection = Math.random() > 0.5 ? 1 : -1;
    state.headLookInterval = minInt + Math.random() * (maxInt - minInt);
    state.headLookHoldTime = 1.5 + Math.random() * 1.0;
  }
  let a = 0;
  if (state.headLookActive) {
    state.headLookProgress += delta;
    const tD = 0.6, hD = state.headLookHoldTime, rD = 0.8;
    if (state.headLookProgress < tD) a = state.headLookDirection * maxAngle * smoothStep(state.headLookProgress / tD);
    else if (state.headLookProgress < tD + hD) a = state.headLookDirection * maxAngle;
    else if (state.headLookProgress < tD + hD + rD) a = state.headLookDirection * maxAngle * (1 - smoothStep((state.headLookProgress - tD - hD) / rD));
    else state.headLookActive = false;
  }
  state._headLookAngle = a;
}

// ============================================================
// Head nod
// ============================================================
function computeHeadNod(state, delta) {
  // ON_PHONE: deliberate nods — the main visible motion for this state
  if (state.state === 'ON_PHONE' && state.phoneNodActive) {
    return Math.sin(state.phoneNodProgress * Math.PI) * 0.08;
  }
  // TYPING/THINKING: subtle micro-nods
  state.headNodTimer += delta;
  const interval = state.state === 'THINKING' ? 5.0 + Math.random() * 2.0 : 3.0 + Math.random() * 2.0;
  if (state.headNodTimer > state.headNodInterval) {
    state.headNodActive = true;
    state.headNodProgress = 0;
    state.headNodTimer = 0;
    state.headNodInterval = interval;
  }
  if (state.headNodActive) {
    state.headNodProgress += delta * 3.0;
    if (state.headNodProgress >= 1.0) { state.headNodActive = false; return 0; }
    return Math.sin(state.headNodProgress * Math.PI) * 0.04;
  }
  return 0;
}

// ============================================================
// Chair swivel
// ============================================================
function updateSwivel(state, delta) {
  state.swivelTimer += delta;
  if (!state.swivelActive && state.swivelTimer > state.swivelInterval) {
    state.swivelActive = true;
    state.swivelProgress = 0;
    state.swivelTimer = 0;
    state.swivelDirection = Math.random() > 0.5 ? 1 : -1;
    state.swivelInterval = 12.0 + Math.random() * 10.0;
    state.swivelHoldTime = 2.0 + Math.random() * 2.0;
  }
  let a = 0;
  if (state.swivelActive) {
    state.swivelProgress += delta;
    const d1 = 1.2, hold = state.swivelHoldTime, d2 = 1.5;
    if (state.swivelProgress < d1) a = state.swivelDirection * 0.17 * smoothStep(state.swivelProgress / d1);
    else if (state.swivelProgress < d1 + hold) a = state.swivelDirection * 0.17;
    else if (state.swivelProgress < d1 + hold + d2) a = state.swivelDirection * 0.17 * (1 - smoothStep((state.swivelProgress - d1 - hold) / d2));
    else { state.swivelActive = false; a = 0; }
  }
  state._swivelAngle = a;
}

function smoothStep(t) {
  const c = Math.max(0, Math.min(1, t));
  return c * c * (3 - 2 * c);
}
