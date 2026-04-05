import * as THREE from 'three/webgpu';
import { LOBBY } from '../constants.js';

export function createLobbyLighting(scene) {
  const group = new THREE.Group();

  // 1. Main ceiling warm fill — bright and dramatic
  const ceil1 = new THREE.PointLight(0xffeedd, 65, 25, 2);
  ceil1.position.set(-3, LOBBY.height - 0.5, 0);
  group.add(ceil1);

  const ceil2 = new THREE.PointLight(0xffeedd, 65, 25, 2);
  ceil2.position.set(3, LOBBY.height - 0.5, 0);
  group.add(ceil2);

  // Extra ceiling center fill to eliminate dark spots
  const ceilCenter = new THREE.PointLight(0xfff0e0, 40, 20, 2);
  ceilCenter.position.set(0, LOBBY.height - 0.3, -3);
  group.add(ceilCenter);

  // 2. Logo backlight — vivid teal accent on back wall
  const logoGlow = new THREE.PointLight(0x22ccff, 60, 14, 2);
  logoGlow.position.set(0, 5, -LOBBY.depth / 2 + 2);
  group.add(logoGlow);

  // 3. Entrance transition glow — warm golden
  const entranceGlow = new THREE.PointLight(0xffcc88, 25, 10, 2);
  entranceGlow.position.set(0, 3.5, LOBBY.depth / 2 - 1);
  group.add(entranceGlow);

  // Visual ceiling light panels (emissive geometry)
  const panelMat = new THREE.MeshBasicMaterial({ color: 0xfff8f0 });
  const panelGeo = new THREE.PlaneGeometry(2.2, 2.2);
  [[-3, -2], [3, -2], [-3, 4], [3, 4]].forEach(([x, z]) => {
    const panel = new THREE.Mesh(panelGeo, panelMat);
    panel.position.set(x, LOBBY.height - 0.02, z);
    panel.rotation.x = Math.PI / 2;
    group.add(panel);
  });

  // Spotlight on logo wall — brighter, more focused
  const logoSpot = new THREE.SpotLight(0x44aaff, 90, 18, Math.PI / 6, 0.5, 2);
  logoSpot.position.set(0, LOBBY.height - 1, -LOBBY.depth / 2 + 5);
  logoSpot.target.position.set(0, 5, -LOBBY.depth / 2 + 0.5);
  group.add(logoSpot);
  group.add(logoSpot.target);

  // Additional warm ceiling lights
  const warmPanel = new THREE.PointLight(0xffeebb, 30, 14, 2);
  warmPanel.position.set(0, LOBBY.height - 0.5, 2);
  group.add(warmPanel);

  // Extra warm recessed panels (visual)
  const warmPanelMat = new THREE.MeshBasicMaterial({ color: 0xfff0dd });
  const warmPanelGeo = new THREE.PlaneGeometry(1.8, 1.8);
  [[0, 0], [-6, 0], [6, 0]].forEach(([x, z]) => {
    const p = new THREE.Mesh(warmPanelGeo, warmPanelMat);
    p.position.set(x, LOBBY.height - 0.02, z);
    p.rotation.x = Math.PI / 2;
    group.add(p);
  });

  // Reception desk warm spotlight — brighter
  const receptionSpot = new THREE.PointLight(0xffe8c0, 20, 10, 2);
  receptionSpot.position.set(0, LOBBY.height - 1, -2);
  group.add(receptionSpot);

  // Floor-level ambient warm glow
  const floorWarm = new THREE.PointLight(0xffd4a0, 8, 12, 2);
  floorWarm.position.set(0, 0.5, 0);
  group.add(floorWarm);

  // Teal accent wash on floor edges — department theme color
  const tealAccent1 = new THREE.PointLight(0x06b6d4, 8, 10, 2);
  tealAccent1.position.set(-LOBBY.width / 2 + 1, 0.5, 0);
  group.add(tealAccent1);
  const tealAccent2 = new THREE.PointLight(0x06b6d4, 8, 10, 2);
  tealAccent2.position.set(LOBBY.width / 2 - 1, 0.5, 0);
  group.add(tealAccent2);

  // Chandelier warm glow (from above center)
  const chandelierGlow = new THREE.PointLight(0xffeedd, 15, 12, 2);
  chandelierGlow.position.set(0, LOBBY.height - 2, 0);
  group.add(chandelierGlow);

  scene.add(group);
  return group;
}
