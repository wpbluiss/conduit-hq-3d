import * as THREE from 'three/webgpu';
import { TOWER, COLORS } from '../constants.js';
import * as BufferGeometryUtils from 'three/addons/utils/BufferGeometryUtils.js';

export function createTower(scene) {
  const group = new THREE.Group();

  // --- Cross-section: angular octagon ---
  function makeProfile(scale, rotation) {
    const hw = (TOWER.baseWidth / 2) * scale;
    const hd = (TOWER.baseDepth / 2) * scale;
    const bevel = 3.0 * scale;
    const pts = [
      [-hw + bevel, -hd], [-hw, -hd + bevel],
      [-hw, hd - bevel], [-hw + bevel, hd],
      [hw - bevel, hd], [hw, hd - bevel],
      [hw, -hd + bevel], [hw - bevel, -hd],
    ];
    const cos = Math.cos(rotation);
    const sin = Math.sin(rotation);
    return pts.map(([x, z]) => [x * cos - z * sin, x * sin + z * cos]);
  }

  // --- Procedural tower shell ---
  const totalHeight = TOWER.floors * TOWER.floorHeight;
  const sections = TOWER.floors * 2;
  const positions = [];
  const normals = [];
  const uvs = [];
  const indices = [];

  const profiles = [];
  for (let i = 0; i <= sections; i++) {
    const t = i / sections;
    const y = t * totalHeight;
    const taper = 1.0 - (1.0 - TOWER.topScale) * Math.pow(t, 1.5);
    const twist = (t * TOWER.twistAngle * Math.PI) / 180;
    const bulge = 1.0 + 0.06 * Math.sin(t * Math.PI);
    profiles.push({ y, points: makeProfile(taper * bulge, twist) });
  }

  const ptsPerProfile = profiles[0].points.length;
  for (let i = 0; i < profiles.length; i++) {
    const { y, points } = profiles[i];
    const v = i / (profiles.length - 1);
    for (let j = 0; j < points.length; j++) {
      positions.push(points[j][0], y, points[j][1]);
      uvs.push(j / points.length, v);
      normals.push(0, 0, 0);
    }
  }

  for (let i = 0; i < profiles.length - 1; i++) {
    for (let j = 0; j < ptsPerProfile; j++) {
      const a = i * ptsPerProfile + j;
      const b = i * ptsPerProfile + ((j + 1) % ptsPerProfile);
      const c = (i + 1) * ptsPerProfile + ((j + 1) % ptsPerProfile);
      const d = (i + 1) * ptsPerProfile + j;
      indices.push(a, b, c, a, c, d);
    }
  }

  // Compute normals
  const posArr = new Float32Array(positions);
  const normArr = new Float32Array(normals);
  const idxArr = new Uint32Array(indices);
  const tA = new THREE.Vector3(), tB = new THREE.Vector3(), tC = new THREE.Vector3();
  const e1 = new THREE.Vector3(), e2 = new THREE.Vector3(), fn = new THREE.Vector3();

  for (let i = 0; i < idxArr.length; i += 3) {
    const ia = idxArr[i] * 3, ib = idxArr[i+1] * 3, ic = idxArr[i+2] * 3;
    tA.set(posArr[ia], posArr[ia+1], posArr[ia+2]);
    tB.set(posArr[ib], posArr[ib+1], posArr[ib+2]);
    tC.set(posArr[ic], posArr[ic+1], posArr[ic+2]);
    e1.subVectors(tB, tA); e2.subVectors(tC, tA);
    fn.crossVectors(e1, e2).normalize();
    for (const idx of [ia, ib, ic]) {
      normArr[idx] += fn.x; normArr[idx+1] += fn.y; normArr[idx+2] += fn.z;
    }
  }
  for (let i = 0; i < normArr.length; i += 3) {
    tA.set(normArr[i], normArr[i+1], normArr[i+2]).normalize();
    normArr[i] = tA.x; normArr[i+1] = tA.y; normArr[i+2] = tA.z;
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.BufferAttribute(posArr, 3));
  geometry.setAttribute('normal', new THREE.BufferAttribute(normArr, 3));
  geometry.setAttribute('uv', new THREE.BufferAttribute(new Float32Array(uvs), 2));
  geometry.setIndex(new THREE.BufferAttribute(idxArr, 1));

  // --- Glass material — warm interior glow visible through glass ---
  const glassMat = new THREE.MeshPhysicalMaterial({
    color: 0x9ac4e8,
    metalness: 0.12,
    roughness: 0.04,
    envMapIntensity: 2.5,
    clearcoat: 1.0,
    clearcoatRoughness: 0.02,
    side: THREE.FrontSide,
    transparent: true,
    opacity: 0.32,
    emissive: 0xffeedd,
    emissiveIntensity: 0.15,
  });

  const towerMesh = new THREE.Mesh(geometry, glassMat);
  towerMesh.castShadow = true;
  towerMesh.receiveShadow = true;
  group.add(towerMesh);

  // --- PERF FIX: Merge all mullion bands into ONE mesh ---
  // Brighter color + thicker bands so floor lines read from a distance
  const bandMat = new THREE.MeshPhysicalMaterial({
    color: 0x2a3a4a, metalness: 0.9, roughness: 0.2,
    envMapIntensity: 1.5,
    emissive: 0x0a1520, emissiveIntensity: 0.3,
  });
  const bandGeometries = [];
  for (let f = 1; f < TOWER.floors; f++) {
    const t = f / TOWER.floors;
    const y = f * TOWER.floorHeight;
    const taper = 1.0 - (1.0 - TOWER.topScale) * Math.pow(t, 1.5);
    const bulge = 1.0 + 0.06 * Math.sin(t * Math.PI);
    const s = taper * bulge;
    const twist = (t * TOWER.twistAngle * Math.PI) / 180;

    const bandGeo = new THREE.BoxGeometry(
      TOWER.baseWidth * s + 0.6, 0.3, TOWER.baseDepth * s + 0.6
    );
    const m = new THREE.Matrix4().makeRotationY(twist);
    m.setPosition(0, y, 0);
    bandGeo.applyMatrix4(m);
    bandGeometries.push(bandGeo);
  }
  if (bandGeometries.length > 0) {
    const mergedBands = BufferGeometryUtils.mergeGeometries(bandGeometries);
    const bandsMesh = new THREE.Mesh(mergedBands, bandMat);
    group.add(bandsMesh);
    bandGeometries.forEach(g => g.dispose());
  }

  // --- Crown ---
  const crownGeo = new THREE.BoxGeometry(
    TOWER.baseWidth * TOWER.topScale * 0.6, 1.5,
    TOWER.baseDepth * TOWER.topScale * 0.6
  );
  const crownMat = new THREE.MeshPhysicalMaterial({
    color: COLORS.blue, emissive: COLORS.blue,
    emissiveIntensity: 2.5, metalness: 0.95, roughness: 0.08,
    envMapIntensity: 2.5, clearcoat: 0.6, clearcoatRoughness: 0.08,
  });
  const crown = new THREE.Mesh(crownGeo, crownMat);
  crown.position.y = totalHeight + 1;
  crown.rotation.y = (TOWER.twistAngle * Math.PI) / 180;
  group.add(crown);

  // --- Podium sides (structural) ---
  const podiumMat = new THREE.MeshPhysicalMaterial({
    color: 0x1a1a2e, metalness: 0.3, roughness: 0.2,
    clearcoat: 0.6, clearcoatRoughness: 0.1, envMapIntensity: 1.2,
  });
  const podiumLeft = new THREE.Mesh(new THREE.BoxGeometry(11, 3, 26), podiumMat);
  podiumLeft.position.set(-9.5, 1.5, 0);
  podiumLeft.castShadow = true; podiumLeft.receiveShadow = true;
  group.add(podiumLeft);

  const podiumRight = new THREE.Mesh(new THREE.BoxGeometry(11, 3, 26), podiumMat);
  podiumRight.position.set(9.5, 1.5, 0);
  podiumRight.castShadow = true; podiumRight.receiveShadow = true;
  group.add(podiumRight);

  // --- Lintel above entrance ---
  const lintel = new THREE.Mesh(new THREE.BoxGeometry(8, 0.5, 4), podiumMat);
  lintel.position.set(0, 3.25, 9);
  group.add(lintel);

  // --- Canopy with real glass ---
  const canopyMat = new THREE.MeshPhysicalMaterial({
    color: 0xccddff, metalness: 0.0, roughness: 0.02,
    transmission: 0.9, thickness: 0.2, ior: 1.5,
    transparent: true, envMapIntensity: 1.5,
  });
  const canopy = new THREE.Mesh(new THREE.BoxGeometry(12, 0.3, 6), canopyMat);
  canopy.position.set(0, 4.5, TOWER.baseDepth / 2 + 3);
  group.add(canopy);

  scene.add(group);
  return group;
}
