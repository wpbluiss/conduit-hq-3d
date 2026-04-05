import * as THREE from 'three/webgpu';
import { FontLoader } from 'three/addons/loaders/FontLoader.js';
import { TextGeometry } from 'three/addons/geometries/TextGeometry.js';
import { LOBBY, COLORS } from '../constants.js';

export async function createLogoWall(scene) {
  const group = new THREE.Group();
  const backZ = -LOBBY.depth / 2 + LOBBY.wallInset + 0.15;

  const loader = new FontLoader();
  const font = await new Promise((resolve, reject) => {
    loader.load('/fonts/helvetiker_bold.typeface.json', resolve, undefined, reject);
  });

  // "CONDUIT AI" text — LARGE
  const textGeo = new TextGeometry('CONDUIT AI', {
    font,
    size: 1.6,
    depth: 0.2,
    curveSegments: 6,
    bevelEnabled: true,
    bevelThickness: 0.03,
    bevelSize: 0.03,
    bevelSegments: 3,
  });

  textGeo.computeBoundingBox();
  const textWidth = textGeo.boundingBox.max.x - textGeo.boundingBox.min.x;

  // Gradient vertex colors
  const posAttr = textGeo.getAttribute('position');
  const colors = new Float32Array(posAttr.count * 3);
  const bbox = textGeo.boundingBox;
  const blue = COLORS.blue;
  const cyan = COLORS.cyan;

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
    emissive: new THREE.Color('#5599dd'),
    emissiveIntensity: 3.0,
    metalness: 0.4,
    roughness: 0.15,
    envMapIntensity: 1.5,
  });

  const textMesh = new THREE.Mesh(textGeo, textMat);
  textMesh.position.set(-textWidth / 2, 4.0, backZ);
  group.add(textMesh);

  // Glow halo behind the text — bigger
  const haloGeo = new THREE.PlaneGeometry(textWidth + 3, 3.5);
  const haloMat = new THREE.MeshStandardMaterial({
    color: 0x1a2040,
    emissive: COLORS.blue,
    emissiveIntensity: 0.5,
    transparent: true,
    opacity: 0.6,
    side: THREE.DoubleSide,
  });
  const halo = new THREE.Mesh(haloGeo, haloMat);
  halo.position.set(0, 4.8, backZ - 0.08);
  group.add(halo);

  // Accent line under logo
  const lineGeo = new THREE.BoxGeometry(textWidth + 1.5, 0.05, 0.06);
  const lineMat = new THREE.MeshStandardMaterial({
    color: COLORS.cyan,
    emissive: COLORS.cyan,
    emissiveIntensity: 2.5,
  });
  const line = new THREE.Mesh(lineGeo, lineMat);
  line.position.set(0, 3.7, backZ + 0.05);
  group.add(line);

  // Spot light highlighting the logo
  const logoSpot = new THREE.SpotLight(0x3b82f6, 15, 8, Math.PI / 6, 0.5);
  logoSpot.position.set(0, LOBBY.height - 0.5, backZ + 3);
  logoSpot.target.position.set(0, 4.8, backZ);
  group.add(logoSpot);
  group.add(logoSpot.target);

  scene.add(group);

  // Expose materials for animation (pulse glow)
  group.userData.logoTextMat = textMat;
  group.userData.logoHaloMat = haloMat;

  return group;
}
