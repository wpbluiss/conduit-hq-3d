import * as THREE from 'three/webgpu';

export function createSkyline(scene) {
  const group = new THREE.Group();

  const windowTex = createWindowTexture();

  // Skyline materials — StandardMaterial for perf (distant buildings, don't need clearcoat)
  const glassMat = new THREE.MeshStandardMaterial({
    color: 0x556688, metalness: 0.45, roughness: 0.1,
    emissive: 0xffeedd, emissiveMap: windowTex, emissiveIntensity: 0.8,
    envMapIntensity: 2.2,
  });

  const concreteMat = new THREE.MeshStandardMaterial({
    color: 0x777780, metalness: 0.08, roughness: 0.6,
    emissive: 0xffeedd, emissiveMap: windowTex, emissiveIntensity: 0.5,
    envMapIntensity: 0.6,
  });

  const darkGlassMat = new THREE.MeshStandardMaterial({
    color: 0x334455, metalness: 0.55, roughness: 0.06,
    emissive: 0xffeedd, emissiveMap: windowTex, emissiveIntensity: 0.7,
    envMapIntensity: 2.5,
  });

  const mats = [glassMat, concreteMat, darkGlassMat];

  // Building definitions: [x, z, width, depth, height, rotY, style]
  // style: 0=glass, 1=concrete, 2=dark glass
  const buildings = [
    // Right cluster
    [50, -20, 18, 16, 45, 0.1, 0],
    [75, 10, 20, 18, 70, -0.05, 2],
    [60, 35, 16, 14, 38, 0.15, 1],
    [85, -35, 22, 18, 55, 0, 0],
    [55, -50, 15, 15, 42, 0.2, 1],
    // Left cluster
    [-55, -15, 18, 16, 52, -0.1, 2],
    [-70, 20, 20, 20, 65, 0.05, 0],
    [-50, 45, 16, 14, 35, -0.15, 1],
    [-80, -30, 22, 16, 48, 0, 0],
    [-60, -55, 14, 14, 40, 0.1, 2],
    // Behind
    [-20, -70, 20, 18, 58, 0.08, 0],
    [15, -80, 24, 20, 72, -0.03, 2],
    [40, -65, 16, 16, 44, 0.12, 1],
    [-40, -75, 18, 16, 50, -0.08, 0],
    // Far
    [100, -10, 25, 20, 80, 0, 2],
    [-100, 5, 22, 18, 75, 0.05, 0],
    [90, 45, 18, 16, 55, -0.1, 1],
    [-85, 50, 20, 18, 60, 0.1, 0],
    // Near
    [30, 20, 14, 12, 30, 0.05, 1],
    [-30, 25, 14, 12, 28, -0.05, 1],
  ];

  buildings.forEach(([x, z, w, d, h, rotY, style]) => {
    const buildingGroup = createBuilding(w, d, h, mats[style], windowTex);
    buildingGroup.position.set(x, 0, z);
    buildingGroup.rotation.y = rotY;
    group.add(buildingGroup);
  });

  scene.add(group);
  return group;
}

function createBuilding(w, d, h, mat, windowTex) {
  const g = new THREE.Group();

  // Main body — simplified, no shadows (too far to matter)
  const bodyGeo = new THREE.BoxGeometry(w, h, d);
  const body = new THREE.Mesh(bodyGeo, mat);
  body.position.y = h / 2;
  body.castShadow = false;
  body.receiveShadow = false;
  g.add(body);

  // Skip individual mullions — emissive window texture provides detail
  // Only add a few horizontal bands for tall buildings (3 max)
  const mullionMat = new THREE.MeshStandardMaterial({ color: 0x333340, metalness: 0.8, roughness: 0.25 });
  const bandCount = Math.min(3, Math.floor(h / 15));
  for (let f = 1; f <= bandCount; f++) {
    const y = f * (h / (bandCount + 1));
    const bandGeo = new THREE.BoxGeometry(w + 0.1, 0.15, d + 0.1);
    const band = new THREE.Mesh(bandGeo, mullionMat);
    band.position.y = y;
    g.add(band);
  }

  // Single rooftop AC unit (simplified)
  const acMat = new THREE.MeshStandardMaterial({ color: 0x777777, roughness: 0.6 });
  const ac = new THREE.Mesh(new THREE.BoxGeometry(2, 0.8, 2), acMat);
  ac.position.set(0, h + 0.4, 0);
  g.add(ac);

  // Antenna on tall buildings
  if (h > 50 && Math.random() > 0.4) {
    const antennaMat = new THREE.MeshStandardMaterial({ color: 0xaaaaaa, metalness: 0.9, roughness: 0.15 });
    const antennaH = 3 + Math.random() * 5;
    const antenna = new THREE.Mesh(
      new THREE.CylinderGeometry(0.08, 0.15, antennaH, 4), antennaMat
    );
    antenna.position.y = h + antennaH / 2;
    g.add(antenna);

    // Blinking light at top
    const blinkMat = new THREE.MeshPhysicalMaterial({
      color: 0xff0000, emissive: 0xff0000,
      emissiveIntensity: 3.0, toneMapped: false,
    });
    const blink = new THREE.Mesh(new THREE.SphereGeometry(0.15, 6, 4), blinkMat);
    blink.position.y = h + antennaH;
    g.add(blink);
  }

  // Lit lobby at ground level (warm glow)
  const lobbyGlowMat = new THREE.MeshPhysicalMaterial({
    color: 0xffeecc,
    emissive: 0xffddaa,
    emissiveIntensity: 2.0,
    transparent: true,
    opacity: 0.75,
  });
  const lobbyGeo = new THREE.BoxGeometry(w * 0.6, 3, 0.05);
  const lobbyFront = new THREE.Mesh(lobbyGeo, lobbyGlowMat);
  lobbyFront.position.set(0, 1.5, d / 2 + 0.03);
  g.add(lobbyFront);

  return g;
}

function createWindowTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = 128;
  canvas.height = 256;
  const ctx = canvas.getContext('2d');

  ctx.fillStyle = '#0a0a15';
  ctx.fillRect(0, 0, 128, 256);

  const cols = 8, rows = 20;
  const winW = 10, winH = 8;
  const gapX = (128 - cols * winW) / (cols + 1);
  const gapY = (256 - rows * winH) / (rows + 1);

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const lit = Math.random() > 0.15;
      if (lit) {
        const warmth = Math.random();
        const brightness = 0.4 + Math.random() * 0.6;
        ctx.fillStyle = warmth > 0.5
          ? `rgba(255, ${200 + Math.random() * 55}, ${150 + Math.random() * 50}, ${brightness})`
          : `rgba(200, ${220 + Math.random() * 35}, 255, ${brightness * 0.7})`;
      } else {
        ctx.fillStyle = 'rgba(20, 25, 40, 0.3)';
      }
      ctx.fillRect(gapX + c * (winW + gapX), gapY + r * (winH + gapY), winW, winH);
    }
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(2, 3);
  return tex;
}
