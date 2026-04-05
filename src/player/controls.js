import * as THREE from 'three/webgpu';
import { PLAYER, LOBBY, TOWER } from '../constants.js';
import { createFootstepSystem } from './footsteps.js';

// ═══ BOUNDS ONLY — ZERO OBSTACLES ON UPPER FLOORS ═══
const LOBBY_BOUNDS = { minX: -24, maxX: 24, minZ: -10, maxZ: 50 };
const UPPER_BOUNDS = { minX: -12, maxX: 12, minZ: -10, maxZ: 10 };
const LOBBY_OBSTACLES = [{ x: 0, z: -3, hw: 1.5, hd: 0.6 }];
const PLAYER_R = 0.25;

function clampToBounds(x, z, bounds) {
  return {
    x: Math.max(bounds.minX + PLAYER_R, Math.min(bounds.maxX - PLAYER_R, x)),
    z: Math.max(bounds.minZ + PLAYER_R, Math.min(bounds.maxZ - PLAYER_R, z)),
  };
}

function pushOutOfObstacles(px, pz, obstacles) {
  let x = px, z = pz;
  for (const ob of obstacles) {
    const dx = x - ob.x, dz = z - ob.z;
    const ox = (ob.hw + PLAYER_R) - Math.abs(dx);
    const oz = (ob.hd + PLAYER_R) - Math.abs(dz);
    if (ox > 0 && oz > 0) {
      if (ox < oz) x += dx > 0 ? ox : -ox;
      else z += dz > 0 ? oz : -oz;
    }
  }
  return { x, z };
}

// ═══ GTA-STYLE THIRD PERSON CONTROLS ═══
export function createControls(camera, player, domElement) {
  // Camera orbit
  let yaw = Math.PI;
  let pitch = 0.3;
  let camDist = 5;         // scroll wheel zoom
  const CAM_HEIGHT = 2.5;
  const CAM_MIN_DIST = 2;
  const CAM_MAX_DIST = 10;
  const CAM_DAMP = 0.15;  // smooth cinematic follow

  // Smoothed mouse input (cinematic lag)
  let smoothYawVel = 0;
  let smoothPitchVel = 0;
  const MOUSE_SMOOTH = 0.12;  // lower = more lag/cinematic
  const MOUSE_SENS = 0.002;   // slower rotation speed

  // Camera walk bob
  let bobPhase = 0;
  const BOB_SPEED = 8;       // oscillation speed
  const BOB_AMOUNT = 0.04;   // vertical bob amplitude
  const BOB_SWAY = 0.015;    // horizontal sway amplitude

  let locked = false;
  let currentFloorY = 0;
  let inputEnabled = true;
  let teleportCooldown = 0;

  const keys = {};
  const velocity = new THREE.Vector3(0, 0, 0);
  const moveInput = new THREE.Vector3();
  const camForward = new THREE.Vector3();
  const camRight = new THREE.Vector3();
  const UP = new THREE.Vector3(0, 1, 0);
  const camPos = new THREE.Vector3(0, 4, 46);
  camera.position.copy(camPos);

  let currentObstacles = LOBBY_OBSTACLES;
  let currentBounds = LOBBY_BOUNDS;
  let onIndoorChange = null;
  let wasIndoor = false;

  const footsteps = createFootstepSystem();

  // Walk: 5, Sprint: 9
  const WALK_SPEED = 5;
  const SPRINT_SPEED = 9;
  const ACCEL = 25;       // acceleration
  const DECEL = 15;       // deceleration (smooth stop)

  // --- Input ---
  domElement.addEventListener('click', () => {
    if (inputEnabled) domElement.requestPointerLock();
  });
  document.addEventListener('pointerlockchange', () => {
    locked = document.pointerLockElement === domElement;
    const hint = document.getElementById('controls-hint');
    if (hint) hint.classList.toggle('hidden', locked);
  });
  // Raw mouse deltas accumulated per frame, then smoothed in update()
  let rawYawDelta = 0;
  let rawPitchDelta = 0;
  document.addEventListener('mousemove', (e) => {
    if (!locked || !inputEnabled) return;
    rawYawDelta -= e.movementX * MOUSE_SENS;
    rawPitchDelta -= e.movementY * MOUSE_SENS;
  });
  document.addEventListener('keydown', (e) => { keys[e.code] = true; });
  document.addEventListener('keyup', (e) => { keys[e.code] = false; });

  // Scroll wheel zoom
  domElement.addEventListener('wheel', (e) => {
    camDist += e.deltaY * 0.005;
    camDist = Math.max(CAM_MIN_DIST, Math.min(CAM_MAX_DIST, camDist));
  }, { passive: true });

  const lobbyHW = LOBBY.width / 2;
  const lobbyHD = LOBBY.depth / 2;

  function isInsideLobby() {
    if (currentFloorY > 10) return true;
    const p = player.position;
    return p.x > -lobbyHW && p.x < lobbyHW &&
      p.z > -lobbyHD && p.z < lobbyHD &&
      Math.abs(p.y - currentFloorY) < 1;
  }

  function isInsideBuilding() {
    if (currentFloorY > 10) return true;
    const p = player.position;
    return p.x > -lobbyHW && p.x < lobbyHW &&
      p.z > -lobbyHD && p.z < lobbyHD;
  }

  function update() {
    const now = performance.now();
    const dt = Math.min((now - performance._lastTime || now) / 1000, 0.05);
    performance._lastTime = now;

    if (!inputEnabled) return;

    // Smooth mouse input with easing
    smoothYawVel += (rawYawDelta - smoothYawVel) * MOUSE_SMOOTH;
    smoothPitchVel += (rawPitchDelta - smoothPitchVel) * MOUSE_SMOOTH;
    yaw += smoothYawVel;
    pitch += smoothPitchVel;
    pitch = Math.max(-0.5, Math.min(1.2, pitch));
    rawYawDelta = 0;
    rawPitchDelta = 0;

    // Teleport cooldown
    if (teleportCooldown > 0) {
      teleportCooldown -= dt;
      player.position.y = currentFloorY;
      updateCamera(dt);
      return;
    }

    // Space = teleport to spawn
    if (keys['Space']) {
      player.position.set(0, currentFloorY, currentFloorY <= 0 ? 30 : 2);
      velocity.set(0, 0, 0);
      keys['Space'] = false;
    }

    // --- Camera-relative movement ---
    // Forward/right from camera's yaw (ignoring pitch)
    camForward.set(-Math.sin(yaw), 0, -Math.cos(yaw)).normalize();
    camRight.set(camForward.z, 0, -camForward.x); // perpendicular

    moveInput.set(0, 0, 0);
    if (keys['KeyW'] || keys['ArrowUp']) moveInput.add(camForward);
    if (keys['KeyS'] || keys['ArrowDown']) moveInput.sub(camForward);
    if (keys['KeyA'] || keys['ArrowLeft']) moveInput.add(camRight);
    if (keys['KeyD'] || keys['ArrowRight']) moveInput.sub(camRight);

    const wantMove = moveInput.lengthSq() > 0;
    const isSprinting = keys['ShiftLeft'] || keys['ShiftRight'];
    const targetSpeed = wantMove ? (isSprinting ? SPRINT_SPEED : WALK_SPEED) : 0;

    if (wantMove) {
      moveInput.normalize();
      // Accelerate toward target
      velocity.x += (moveInput.x * targetSpeed - velocity.x) * Math.min(1, ACCEL * dt);
      velocity.z += (moveInput.z * targetSpeed - velocity.z) * Math.min(1, ACCEL * dt);
    } else {
      // Decelerate smoothly
      velocity.x += (0 - velocity.x) * Math.min(1, DECEL * dt);
      velocity.z += (0 - velocity.z) * Math.min(1, DECEL * dt);
      // Kill tiny drift
      if (Math.abs(velocity.x) < 0.01) velocity.x = 0;
      if (Math.abs(velocity.z) < 0.01) velocity.z = 0;
    }

    const isMoving = velocity.lengthSq() > 0.01;

    // Apply velocity
    let newX = player.position.x + velocity.x * dt;
    let newZ = player.position.z + velocity.z * dt;

    // Clamp + obstacles
    const clamped = clampToBounds(newX, newZ, currentBounds);
    newX = clamped.x; newZ = clamped.z;
    if (currentObstacles.length > 0) {
      const pushed = pushOutOfObstacles(newX, newZ, currentObstacles);
      newX = pushed.x; newZ = pushed.z;
    }

    player.position.x = newX;
    player.position.z = newZ;

    // Face movement direction (smooth rotation)
    if (isMoving) {
      const targetAngle = Math.atan2(velocity.x, velocity.z) + Math.PI;
      let diff = targetAngle - player.rotation.y;
      // Wrap to [-PI, PI]
      while (diff > Math.PI) diff -= Math.PI * 2;
      while (diff < -Math.PI) diff += Math.PI * 2;
      player.rotation.y += diff * Math.min(1, 10 * dt);
    }

    // Animations
    if (player.userData.setAnimation) {
      if (isMoving && isSprinting) player.userData.setAnimation('Run');
      else if (isMoving) player.userData.setAnimation('Walk');
      else player.userData.setAnimation('Idle');
    }
    if (player.userData.updateProceduralAnim) {
      player.userData.updateProceduralAnim(dt, isMoving, isSprinting);
    }

    // Footsteps
    footsteps.update(dt, isMoving, isSprinting, isInsideLobby());

    player.position.y = currentFloorY;

    // Exterior toggle
    const nowIndoor = isInsideBuilding();
    if (nowIndoor !== wasIndoor) {
      wasIndoor = nowIndoor;
      if (onIndoorChange) onIndoorChange(nowIndoor);
    }

    updateCamera(dt);
  }

  function updateCamera(dt) {
    // Update walk bob phase
    const isMoving = velocity.lengthSq() > 0.5;
    if (isMoving) {
      const isSprinting = keys['ShiftLeft'] || keys['ShiftRight'];
      bobPhase += dt * BOB_SPEED * (isSprinting ? 1.4 : 1.0);
    } else {
      // Smoothly decay bob when stopping
      bobPhase += dt * 2;
    }
    const bobY = isMoving ? Math.sin(bobPhase) * BOB_AMOUNT : 0;
    const bobX = isMoving ? Math.cos(bobPhase * 0.5) * BOB_SWAY : 0;

    // Orbit camera behind player
    const cx = player.position.x + Math.sin(yaw) * camDist * Math.cos(pitch);
    const cy = player.position.y + CAM_HEIGHT + Math.sin(pitch) * camDist;
    const cz = player.position.z + Math.cos(yaw) * camDist * Math.cos(pitch);

    // Ensure camera stays above ground
    const minY = player.position.y + 0.5;

    // Smooth follow with damping
    camPos.x += (cx - camPos.x) * CAM_DAMP;
    camPos.y += (Math.max(cy, minY) - camPos.y) * CAM_DAMP;
    camPos.z += (cz - camPos.z) * CAM_DAMP;

    camera.position.set(camPos.x + bobX, camPos.y + bobY, camPos.z);
    camera.lookAt(player.position.x, player.position.y + 1.0, player.position.z);
  }

  function setFloor(floorNum) {
    currentFloorY = (floorNum - 1) * TOWER.floorHeight + LOBBY.floorY;
  }

  function setFloorY(y) {
    currentFloorY = y;
    teleportCooldown = 0.5;
    velocity.set(0, 0, 0);
    if (y <= 0) {
      currentBounds = LOBBY_BOUNDS;
      currentObstacles = LOBBY_OBSTACLES;
    } else {
      currentBounds = UPPER_BOUNDS;
      currentObstacles = [];
    }
  }

  function setFloorObstacles() {}
  function setCollisionScene() {}
  function setInputEnabled(enabled) { inputEnabled = enabled; }
  function isKeyDown(code) { return !!keys[code]; }
  function getCurrentFloorY() { return currentFloorY; }
  function setOnIndoorChange(cb) { onIndoorChange = cb; }

  // Self-test (T key)
  document.addEventListener('keydown', (e) => {
    if (e.code === 'KeyT' && !e.repeat) {
      const floors = [0, 50, 100, 150, 200, 250, 300, 350, 400];
      console.log('%c═══ FLOOR TEST ═══', 'color:yellow;font-weight:bold');
      for (const y of floors) {
        setFloorY(y);
        player.position.set(0, y, y <= 0 ? 30 : 2);
        teleportCooldown = 0;
        const c = clampToBounds(1, 1, currentBounds);
        console.log(`y=${y} | bounds=[${currentBounds.minX},${currentBounds.maxX}]x[${currentBounds.minZ},${currentBounds.maxZ}] | obstacles=${currentObstacles.length} | ✅`);
      }
      setFloorY(0); player.position.set(0, 0, 30); teleportCooldown = 0;
    }
  });

  return {
    update, setFloor, setFloorY, setInputEnabled, isKeyDown,
    isInsideLobby, setCollisionScene, getCurrentFloorY,
    setFloorObstacles, setOnIndoorChange,
  };
}
