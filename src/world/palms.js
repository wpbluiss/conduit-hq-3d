import * as THREE from 'three/webgpu';

export function createPalms(scene) {
  const group = new THREE.Group();

  // Bark material — rough textured brown
  const barkMat = new THREE.MeshPhysicalMaterial({
    color: 0x7a5a28, roughness: 0.9, metalness: 0.0, envMapIntensity: 0.2,
  });

  // Frond materials — two tones for depth
  const frondDark = new THREE.MeshPhysicalMaterial({
    color: 0x1a5518, roughness: 0.6, metalness: 0.0,
    side: THREE.DoubleSide, envMapIntensity: 0.3,
  });
  const frondLight = new THREE.MeshPhysicalMaterial({
    color: 0x2d7a22, roughness: 0.55, metalness: 0.0,
    side: THREE.DoubleSide, envMapIntensity: 0.3,
  });

  const coconutMat = new THREE.MeshPhysicalMaterial({
    color: 0x5a4a1a, roughness: 0.65, metalness: 0.0,
  });

  const ringMat = new THREE.MeshPhysicalMaterial({
    color: 0x5a4018, roughness: 0.95, metalness: 0.0,
  });

  const positions = [
    [-18, 20], [-12, 20], [-6, 20], [6, 20], [12, 20], [18, 20],
    [-22, 12], [22, 12],
  ];

  positions.forEach(([x, z]) => {
    const height = 8 + Math.random() * 3;
    const tree = createDetailedPalm(height, barkMat, ringMat, frondDark, frondLight, coconutMat);
    tree.position.set(x, 0, z);
    tree.rotation.y = Math.random() * Math.PI * 2;
    // Slight lean
    tree.rotation.z = (Math.random() - 0.5) * 0.06;
    tree.rotation.x = (Math.random() - 0.5) * 0.04;
    group.add(tree);
  });

  scene.add(group);
  return group;
}

function createDetailedPalm(height, barkMat, ringMat, frondDark, frondLight, coconutMat) {
  const tree = new THREE.Group();

  // ═══ SEGMENTED CURVED TRUNK ═══
  const segments = 12;
  const trunkGeo = new THREE.CylinderGeometry(0.1, 0.28, height, 8, segments);
  const pos = trunkGeo.getAttribute('position');

  // Natural S-curve and taper
  for (let i = 0; i < pos.count; i++) {
    const y = pos.getY(i);
    const t = (y + height / 2) / height; // 0 at base, 1 at top

    // Organic curve
    const curveX = Math.sin(t * Math.PI * 0.4) * 0.8 + Math.sin(t * Math.PI * 1.5) * 0.15;
    const curveZ = Math.cos(t * Math.PI * 0.3) * 0.3;

    pos.setX(i, pos.getX(i) + curveX);
    pos.setZ(i, pos.getZ(i) + curveZ);
  }
  pos.needsUpdate = true;
  trunkGeo.computeVertexNormals();

  const trunk = new THREE.Mesh(trunkGeo, barkMat);
  trunk.position.y = height / 2;
  trunk.castShadow = true;
  tree.add(trunk);

  // Bark ring segments (the characteristic palm trunk rings)
  const ringGeo = new THREE.TorusGeometry(0.18, 0.025, 4, 10);
  for (let r = 0; r < 8; r++) {
    const t = 0.2 + r * 0.08;
    const y = t * height;
    const curveX = Math.sin(t * Math.PI * 0.4) * 0.8 + Math.sin(t * Math.PI * 1.5) * 0.15;
    const ring = new THREE.Mesh(ringGeo, ringMat);
    ring.position.set(curveX, y, Math.cos(t * Math.PI * 0.3) * 0.3);
    ring.rotation.x = Math.PI / 2;
    // Scale ring to match trunk taper at this height
    const scale = 1.0 - t * 0.35;
    ring.scale.setScalar(scale);
    tree.add(ring);
  }

  // Crown shaft (lighter green cylinder at top)
  const shaftMat = new THREE.MeshPhysicalMaterial({
    color: 0x3a7a28, roughness: 0.5, metalness: 0.0,
  });
  const topCurveX = Math.sin(Math.PI * 0.4) * 0.8 + Math.sin(Math.PI * 1.5) * 0.15;
  const shaftGeo = new THREE.CylinderGeometry(0.08, 0.12, 0.6, 6);
  const shaft = new THREE.Mesh(shaftGeo, shaftMat);
  shaft.position.set(topCurveX, height + 0.3, Math.cos(Math.PI * 0.3) * 0.3);
  tree.add(shaft);

  // ═══ COCONUT CLUSTER ═══
  for (let c = 0; c < 4; c++) {
    const angle = (c / 4) * Math.PI * 2 + Math.random() * 0.5;
    const nut = new THREE.Mesh(new THREE.SphereGeometry(0.1, 6, 5), coconutMat);
    nut.position.set(
      topCurveX + Math.cos(angle) * 0.18,
      height + 0.1,
      Math.cos(Math.PI * 0.3) * 0.3 + Math.sin(angle) * 0.18
    );
    nut.scale.set(1, 1.2, 1);
    tree.add(nut);
  }

  // ═══ DETAILED FRONDS ═══
  const frondCount = 9;
  for (let f = 0; f < frondCount; f++) {
    const angle = (f / frondCount) * Math.PI * 2 + Math.random() * 0.3;
    const mat = f % 2 === 0 ? frondDark : frondLight;
    const length = 4 + Math.random() * 2;
    const droop = 0.3 + Math.random() * 0.5;
    const isOld = f < 2; // bottom fronds droop more

    const frond = createDetailedFrond(mat, length, isOld ? droop + 0.3 : droop);
    frond.position.set(
      topCurveX,
      height + 0.5,
      Math.cos(Math.PI * 0.3) * 0.3
    );
    frond.rotation.y = angle;
    frond.rotation.z = -(droop * 0.6);
    if (isOld) frond.rotation.z -= 0.3; // old fronds hang lower
    frond.castShadow = true;
    tree.add(frond);
  }

  return tree;
}

function createDetailedFrond(material, length, droop) {
  const frondGroup = new THREE.Group();

  // Central rachis (stem of the frond)
  const rachisGeo = new THREE.CylinderGeometry(0.01, 0.025, length, 4);
  const rachisMat = new THREE.MeshPhysicalMaterial({
    color: 0x4a7a30, roughness: 0.6, metalness: 0.0,
  });

  // Bend the rachis
  const rPos = rachisGeo.getAttribute('position');
  for (let i = 0; i < rPos.count; i++) {
    const y = rPos.getY(i);
    const t = (y + length / 2) / length;
    rPos.setZ(i, rPos.getZ(i) - t * t * droop * 2);
  }
  rPos.needsUpdate = true;
  rachisGeo.computeVertexNormals();

  const rachis = new THREE.Mesh(rachisGeo, rachisMat);
  rachis.rotation.x = Math.PI / 2;
  rachis.position.z = length / 2;
  frondGroup.add(rachis);

  // Individual leaflets along the rachis
  const leafletCount = 14;
  for (let l = 0; l < leafletCount; l++) {
    const t = (l + 1) / (leafletCount + 1);
    const y = t * length;
    const bendZ = -t * t * droop * 2;

    // Leaflet size varies — bigger in middle, smaller at tip and base
    const sizeMult = Math.sin(t * Math.PI) * 0.8 + 0.2;
    const leafLen = 0.6 * sizeMult;
    const leafW = 0.08 * sizeMult;

    [-1, 1].forEach(side => {
      const leafGeo = new THREE.PlaneGeometry(leafLen, leafW);
      const leaf = new THREE.Mesh(leafGeo, material);
      leaf.position.set(side * leafLen / 2 * 0.7, bendZ, y);
      leaf.rotation.z = side * 0.4; // angle away from rachis
      leaf.rotation.y = side * 0.1;
      // Slight random droop on each leaflet
      leaf.rotation.x = (Math.random() - 0.3) * 0.2;
      frondGroup.add(leaf);
    });
  }

  return frondGroup;
}
