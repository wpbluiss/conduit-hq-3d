import * as THREE from 'three/webgpu';
import { SUN_DIR } from '../constants.js';

export function createLighting(scene) {
  // Warm ambient — golden hour warmth
  const ambient = new THREE.AmbientLight(0xffeedd, 1.0);
  scene.add(ambient);

  // Hemisphere: warm golden ground bounce + cool purple-blue sky
  const hemi = new THREE.HemisphereLight(0x6677aa, 0xffbb77, 0.7);
  scene.add(hemi);

  // Directional sun — strong golden hour warmth
  const sun = new THREE.DirectionalLight(0xffbb66, 4.5);
  sun.position.copy(SUN_DIR).multiplyScalar(100);
  sun.castShadow = true;
  sun.shadow.mapSize.set(1024, 1024);
  sun.shadow.camera.left = -60;
  sun.shadow.camera.right = 60;
  sun.shadow.camera.top = 60;
  sun.shadow.camera.bottom = -60;
  sun.shadow.camera.near = 10;
  sun.shadow.camera.far = 250;
  sun.shadow.bias = -0.001;
  sun.shadow.radius = 3;
  scene.add(sun);

  // Rim/back light for dramatic silhouettes — warm orange kicker
  const rim = new THREE.DirectionalLight(0xff8844, 1.8);
  rim.position.set(60, 40, 80);
  scene.add(rim);

  // Cool fill from opposite side for contrast
  const fill = new THREE.DirectionalLight(0x8899dd, 0.6);
  fill.position.set(-50, 30, -60);
  scene.add(fill);

  return { ambient, hemi, sun, rim, fill };
}
