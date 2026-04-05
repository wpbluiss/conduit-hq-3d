import * as THREE from 'three/webgpu';
import { FontLoader } from 'three/addons/loaders/FontLoader.js';
import { TextGeometry } from 'three/addons/geometries/TextGeometry.js';
import { TOWER, COLORS } from '../constants.js';

export async function createSignage(scene) {
  const group = new THREE.Group();

  const loader = new FontLoader();
  const font = await new Promise((resolve, reject) => {
    loader.load('/fonts/helvetiker_bold.typeface.json', resolve, undefined, reject);
  });

  // Main "CONDUIT AI" text
  const textGeo = new TextGeometry('CONDUIT AI', {
    font,
    size: 1.8,
    depth: 0.3,
    curveSegments: 6,
    bevelEnabled: true,
    bevelThickness: 0.04,
    bevelSize: 0.03,
    bevelSegments: 3,
  });

  textGeo.computeBoundingBox();
  const textWidth = textGeo.boundingBox.max.x - textGeo.boundingBox.min.x;

  // Apply gradient vertex colors (blue → cyan across X)
  const posAttr = textGeo.getAttribute('position');
  const colors = new Float32Array(posAttr.count * 3);
  const blue = COLORS.blue;
  const cyan = COLORS.cyan;
  const bbox = textGeo.boundingBox;

  for (let i = 0; i < posAttr.count; i++) {
    const x = posAttr.getX(i);
    const t = (x - bbox.min.x) / (bbox.max.x - bbox.min.x);
    colors[i * 3] = blue.r + (cyan.r - blue.r) * t;
    colors[i * 3 + 1] = blue.g + (cyan.g - blue.g) * t;
    colors[i * 3 + 2] = blue.b + (cyan.b - blue.b) * t;
  }
  textGeo.setAttribute('color', new THREE.BufferAttribute(colors, 3));

  const textMat = new THREE.MeshPhysicalMaterial({
    vertexColors: true,
    emissive: new THREE.Color('#5599ee'),
    emissiveIntensity: 5.0,
    metalness: 0.6,
    roughness: 0.1,
    envMapIntensity: 2.0,
    clearcoat: 0.5,
    clearcoatRoughness: 0.1,
    toneMapped: false, // ensures glow punches through
  });

  const textMesh = new THREE.Mesh(textGeo, textMat);

  // Position on the front face of the tower, above entrance
  // Floor 3-4 area, centered on front face
  const signageY = TOWER.floorHeight * 3 + 2;
  const signageZ = TOWER.baseDepth / 2 + 0.5;
  textMesh.position.set(-textWidth / 2, signageY, signageZ);

  group.add(textMesh);

  // Glow light behind the text
  const glowLight = new THREE.PointLight(0x3b82f6, 80, 25, 2);
  glowLight.position.set(0, signageY + 1, signageZ + 2);
  group.add(glowLight);

  // Secondary cyan glow
  const cyanGlow = new THREE.PointLight(0x06b6d4, 40, 20, 2);
  cyanGlow.position.set(textWidth * 0.3, signageY + 0.5, signageZ + 1.5);
  group.add(cyanGlow);

  // Accent strip under the text
  const stripGeo = new THREE.BoxGeometry(textWidth + 1, 0.08, 0.3);
  const stripMat = new THREE.MeshStandardMaterial({
    color: COLORS.cyan,
    emissive: COLORS.cyan,
    emissiveIntensity: 2.0,
  });
  const strip = new THREE.Mesh(stripGeo, stripMat);
  strip.position.set(0, signageY - 0.3, signageZ + 0.15);
  group.add(strip);

  scene.add(group);

  // Store sign material for pulsing animation from render loop
  group.userData.signMaterial = textMat;

  return group;
}
