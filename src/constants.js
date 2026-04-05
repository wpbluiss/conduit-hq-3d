import * as THREE from 'three/webgpu';

// Brand colors
export const COLORS = {
  primary: new THREE.Color('#0a0b10'),
  blue: new THREE.Color('#3b82f6'),
  cyan: new THREE.Color('#06b6d4'),
  green: new THREE.Color('#10b981'),
  white: new THREE.Color('#f8fafc'),
};

// Tower dimensions
export const TOWER = {
  floors: 15,
  floorHeight: 4.0,
  baseWidth: 22,
  baseDepth: 18,
  topScale: 0.55,       // taper to 55% at top
  twistAngle: 12,       // degrees total twist over height
  mullionWidth: 0.15,
};

// Sun direction (low on horizon, golden hour)
export const SUN_DIR = new THREE.Vector3(-0.4, 0.15, -0.8).normalize();

// Player
export const PLAYER = {
  speed: 10,
  sprintMultiplier: 1.8,
  height: 1.1,
  radius: 0.18,
  cameraDistance: 6,
  cameraDistanceIndoor: 2.8,
  cameraHeight: 2.2,
  cameraHeightIndoor: 1.5,
};

// Lobby interior
export const LOBBY = {
  width: 20,
  depth: 16,
  height: 8,
  floorY: 0.1,
  wallInset: 0.5,
  entranceWidth: 8,
  entranceHeight: 4,
};

// Elevator
export const ELEVATOR = {
  count: 3,
  doorWidth: 2.0,
  doorHeight: 3.0,
  spacing: 3.5,
  backWallZ: -(18 / 2) + 1.5,  // TOWER.baseDepth/2 inset
  promptDistance: 3.0,
};

// NPCs
export const NPC = {
  bodyHeight: 1.2,
  bodyRadius: 0.25,
  headRadius: 0.22,
  greetDistance: 5.0,
};
