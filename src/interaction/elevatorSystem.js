import * as THREE from 'three/webgpu';
import { ELEVATOR, TOWER, LOBBY } from '../constants.js';

/**
 * Elevator system -- handles E key press near doors, opens panel, teleports player.
 * Enhanced with floor-counting animation during transition.
 */

const FLOOR_MAP = {
  1:  { y: LOBBY.floorY, label: 'Lobby',        spawnX: 0, spawnZ: 30 },
  2:  { y: 50,           label: 'Sales',         spawnX: 0, spawnZ: 2 },
  3:  { y: 100,          label: 'Marketing',     spawnX: 0, spawnZ: 2 },
  4:  { y: 150,          label: 'Engineering',   spawnX: 0, spawnZ: 2 },
  5:  { y: 200,          label: 'Content',       spawnX: 0, spawnZ: 2 },
  6:  { y: 250,          label: 'Intelligence',  spawnX: 0, spawnZ: 2 },
  7:  { y: 300,          label: 'Operations',    spawnX: 0, spawnZ: 2 },
  8:  { y: 350,          label: 'Monitoring',    spawnX: 0, spawnZ: 2 },
  15: { y: 400,          label: 'CEO Suite',     spawnX: 0, spawnZ: 2 },
};

// Ordered floor numbers for counting animation
const FLOOR_ORDER = [1, 2, 3, 4, 5, 6, 7, 8, 15];

// Play a short elevator ding (800Hz, 300ms, volume 0.05)
function playElevatorDing() {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.frequency.value = 800;
    osc.type = 'sine';
    gain.gain.setValueAtTime(0.05, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.3);
    osc.connect(gain).connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.3);
  } catch (e) {
    // Audio not available, skip
  }
}

export function createElevatorSystem(player, controls, elevatorPanel, promptOverlay, doorCallbacks) {
  let nearElevator = false;
  let onFloorChangeCallback = null;
  let _onEKeyCallback = null; // external E key handler
  const _doors = doorCallbacks || {};

  // Listen for E key
  document.addEventListener('keydown', (e) => {
    if (e.code === 'KeyE') {
      const p = player.position;
      console.log(`E pressed | player=(${p.x.toFixed(1)}, ${p.y.toFixed(1)}, ${p.z.toFixed(1)}) | nearElevator=${nearElevator} | panelOpen=${elevatorPanel.isOpen()}`);
      if (nearElevator && !elevatorPanel.isOpen()) {
        openPanel();
      } else if (_onEKeyCallback) {
        _onEKeyCallback();
      }
    }
  });

  function openPanel() {
    controls.setInputEnabled(false);
    promptOverlay.hide();

    elevatorPanel.open((floor) => {
      teleportToFloor(floor);
    });
  }

  // Fade overlay (reused)
  let fadeEl = null;
  let floorNumEl = null;
  let floorLabelEl = null;
  function getFade() {
    if (!fadeEl) {
      fadeEl = document.createElement('div');
      fadeEl.id = 'elevator-fade';
      fadeEl.style.cssText = `
        position: fixed; top: 0; left: 0; width: 100%; height: 100%;
        background: #0a0b10; z-index: 300;
        opacity: 0; transition: opacity 0.4s;
        pointer-events: none;
        display: flex; flex-direction: column; align-items: center; justify-content: center;
      `;
      document.body.appendChild(fadeEl);

      floorNumEl = document.createElement('div');
      floorNumEl.style.cssText = `
        font-family: 'Segoe UI', system-ui, sans-serif;
        font-size: 64px; font-weight: bold; color: #3b82f6;
        text-align: center; opacity: 0; transition: opacity 0.15s;
        text-shadow: 0 0 30px rgba(59,130,246,0.5);
      `;
      fadeEl.appendChild(floorNumEl);

      floorLabelEl = document.createElement('div');
      floorLabelEl.style.cssText = `
        font-family: 'Segoe UI', system-ui, sans-serif;
        font-size: 28px; font-weight: 400; color: #94a3b8;
        text-align: center; opacity: 0; transition: opacity 0.3s;
        margin-top: 12px;
      `;
      fadeEl.appendChild(floorLabelEl);
    }
    return fadeEl;
  }

  function getCurrentFloor() {
    const py = player.position.y;
    let closest = 1;
    let closestDist = Infinity;
    for (const [fStr, info] of Object.entries(FLOOR_MAP)) {
      const d = Math.abs(info.y - py);
      if (d < closestDist) {
        closestDist = d;
        closest = parseInt(fStr);
      }
    }
    return closest;
  }

  function getFloorsToCount(fromFloor, toFloor) {
    const fromIdx = FLOOR_ORDER.indexOf(fromFloor);
    const toIdx = FLOOR_ORDER.indexOf(toFloor);
    if (fromIdx === -1 || toIdx === -1) return [toFloor];

    const floors = [];
    if (toIdx > fromIdx) {
      for (let i = fromIdx + 1; i <= toIdx; i++) floors.push(FLOOR_ORDER[i]);
    } else {
      for (let i = fromIdx - 1; i >= toIdx; i--) floors.push(FLOOR_ORDER[i]);
    }
    return floors.length > 0 ? floors : [toFloor];
  }

  function teleportToFloor(floor) {
    const info = FLOOR_MAP[floor];
    if (!info) return;

    const fade = getFade();
    fade.style.pointerEvents = 'all';
    floorNumEl.style.opacity = '0';
    floorNumEl.textContent = '';
    floorLabelEl.style.opacity = '0';
    floorLabelEl.textContent = '';

    // Close doors before fade
    if (_doors.closeDoors) _doors.closeDoors();

    // Fade to black (0.4s)
    requestAnimationFrame(() => {
      fade.style.opacity = '1';
    });

    const currentFloor = getCurrentFloor();
    const floorsToCount = getFloorsToCount(currentFloor, floor);
    const msPerFloor = 200;

    setTimeout(() => {
      // Show floor counting animation
      let idx = 0;
      function showNextFloor() {
        if (idx >= floorsToCount.length) {
          // Done counting -- show "Floor X -- Department Name" arrival label
          const floorNum = floor === 15 ? '15' : String(floor);
          floorNumEl.textContent = 'Floor ' + floorNum;
          floorNumEl.style.opacity = '1';
          floorLabelEl.textContent = info.label;
          floorLabelEl.style.opacity = '1';

          // Teleport player immediately
          const targetY = info.y;
          const sx = info.spawnX, sz = info.spawnZ;
          player.position.set(sx, targetY, sz);
          controls.setFloorY(targetY);
          if (onFloorChangeCallback) onFloorChangeCallback(targetY);

          // Force position again after 100ms to guarantee clean state
          setTimeout(() => {
            player.position.set(sx, targetY, sz);
          }, 100);

          // Wait 1.5s so text is visible, then ding + open doors + fade in
          setTimeout(() => {
            playElevatorDing();
            if (_doors.openDoors) _doors.openDoors();
            floorNumEl.style.opacity = '0';
            floorLabelEl.style.opacity = '0';
            fade.style.opacity = '0';
            setTimeout(() => {
              fade.style.pointerEvents = 'none';
              controls.setInputEnabled(true);
            }, 400);
          }, 1500);
          return;
        }

        const f = floorsToCount[idx];
        floorNumEl.textContent = FLOOR_MAP[f] ? FLOOR_MAP[f].label : f;
        floorNumEl.style.opacity = '1';

        setTimeout(() => {
          floorNumEl.style.opacity = '0.3';
          idx++;
          setTimeout(showNextFloor, msPerFloor * 0.3);
        }, msPerFloor * 0.7);
      }

      showNextFloor();
    }, 400);
  }

  function setNearElevator(near) {
    nearElevator = near;
  }

  function isNearElevator() {
    return nearElevator;
  }

  function onFloorChange(cb) {
    onFloorChangeCallback = cb;
  }

  function onEKey(cb) {
    _onEKeyCallback = cb;
  }

  return { setNearElevator, isNearElevator, onFloorChange, onEKey, teleportToFloor };
}
