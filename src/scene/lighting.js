import * as THREE from 'three/webgpu';
import { SUN_DIR } from '../constants.js';

export function createLighting(scene) {
  // Warm ambient — soft warm white, not too bright (let point lights do the work)
  const ambient = new THREE.AmbientLight(0xfff5e8, 0.6);
  scene.add(ambient);

  // Hemisphere: warm golden ground bounce + cool blue-grey sky
  const hemi = new THREE.HemisphereLight(0x7788aa, 0xffcc88, 0.5);
  scene.add(hemi);

  // Directional sun — golden hour warmth, strong shadows
  const sun = new THREE.DirectionalLight(0xffbb66, 3.5);
  sun.position.copy(SUN_DIR).multiplyScalar(100);
  sun.castShadow = true;
  sun.shadow.mapSize.set(2048, 2048);
  sun.shadow.camera.left = -60;
  sun.shadow.camera.right = 60;
  sun.shadow.camera.top = 60;
  sun.shadow.camera.bottom = -60;
  sun.shadow.camera.near = 10;
  sun.shadow.camera.far = 250;
  sun.shadow.bias = -0.0005;
  sun.shadow.radius = 4;
  scene.add(sun);

  // Rim/back light — warm orange kicker for silhouettes
  const rim = new THREE.DirectionalLight(0xff9955, 1.4);
  rim.position.set(60, 40, 80);
  scene.add(rim);

  // Cool fill from opposite side — blue tone for contrast
  const fill = new THREE.DirectionalLight(0x6688bb, 0.5);
  fill.position.set(-50, 30, -60);
  scene.add(fill);

  return { ambient, hemi, sun, rim, fill };
}

/**
 * Department-specific interior lighting rig.
 * Creates moody, atmospheric lighting per floor with warm whites,
 * cool blues, and subtle accent colors (NOT teal).
 */
export function createDepartmentLighting(parent, opts = {}) {
  const {
    floorY = 0,
    accentColor = 0x3b82f6,
    intensity = 1.0,
    name = 'default',
  } = opts;

  const lights = [];

  // Main overhead — warm white with slight color tint
  const mainLight = new THREE.PointLight(0xfff0dd, 40 * intensity, 20, 1.8);
  mainLight.position.set(0, floorY + 3.5, 0);
  mainLight.castShadow = false;
  parent.add(mainLight);
  lights.push(mainLight);

  // Corner fill lights — cool blue tone for depth
  const cornerPositions = [
    [-7, floorY + 3, -5],
    [7, floorY + 3, -5],
    [-7, floorY + 3, 5],
    [7, floorY + 3, 5],
  ];
  for (const pos of cornerPositions) {
    const corner = new THREE.PointLight(0xaabbdd, 8 * intensity, 12, 2);
    corner.position.set(...pos);
    parent.add(corner);
    lights.push(corner);
  }

  // Accent light — department color, subtle, from one side
  const accent = new THREE.PointLight(accentColor, 15 * intensity, 10, 2);
  accent.position.set(-5, floorY + 2, 3);
  parent.add(accent);
  lights.push(accent);

  // Warm task light near desks — subtle orange
  const task = new THREE.PointLight(0xffaa66, 6 * intensity, 8, 2);
  task.position.set(3, floorY + 1.5, -2);
  parent.add(task);
  lights.push(task);

  return { lights };
}
