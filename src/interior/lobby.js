import * as THREE from 'three/webgpu';
import { LOBBY, COLORS } from '../constants.js';
import { createMarbleTexture, createMarbleRoughnessMap } from '../utils/textures.js';

export function createLobby(scene) {
  const group = new THREE.Group();
  const hw = LOBBY.width / 2;
  const hd = LOBBY.depth / 2;
  const eh = LOBBY.entranceWidth / 2;

  const marbleTex = createMarbleTexture();
  const marbleRough = createMarbleRoughnessMap();

  // --- Marble floor — MeshPhysicalMaterial with roughness variation ---
  const floorMat = new THREE.MeshPhysicalMaterial({
    map: marbleTex,
    roughnessMap: marbleRough,
    roughness: 0.15,
    metalness: 0.05,
    clearcoat: 0.8,
    clearcoatRoughness: 0.06,
    envMapIntensity: 2.0,
    polygonOffset: true,
    polygonOffsetFactor: -1,
    polygonOffsetUnits: -1,
  });

  const floor = new THREE.Mesh(new THREE.PlaneGeometry(LOBBY.width, LOBBY.depth), floorMat);
  floor.rotation.x = -Math.PI / 2;
  floor.position.y = LOBBY.floorY;
  floor.receiveShadow = true;
  group.add(floor);

  // Floor border inlay — dark polished stone
  const borderMat = new THREE.MeshPhysicalMaterial({
    color: 0x15121a,
    roughness: 0.15,
    metalness: 0.1,
    clearcoat: 0.8,
    clearcoatRoughness: 0.05,
    envMapIntensity: 1.8,
    polygonOffset: true,
    polygonOffsetFactor: -2,
    polygonOffsetUnits: -2,
  });

  // Border strips
  const bw = 0.4;
  const borders = [
    [LOBBY.width, bw, 0, hd - bw / 2],     // front
    [LOBBY.width, bw, 0, -hd + bw / 2],     // back
    [bw, LOBBY.depth - bw * 2, -hw + bw / 2, 0], // left
    [bw, LOBBY.depth - bw * 2, hw - bw / 2, 0],   // right
  ];
  borders.forEach(([w, d, x, z]) => {
    const strip = new THREE.Mesh(new THREE.PlaneGeometry(w, d), borderMat);
    strip.rotation.x = -Math.PI / 2;
    strip.position.set(x, LOBBY.floorY + 0.005, z);
    group.add(strip);
  });

  // --- Ceiling — warm matte with recessed panel illusion ---
  const ceilMat = new THREE.MeshPhysicalMaterial({
    color: 0xe8e0d2,
    roughness: 0.85,
    metalness: 0.0,
    side: THREE.DoubleSide,
  });
  const ceiling = new THREE.Mesh(new THREE.PlaneGeometry(LOBBY.width + 4, LOBBY.depth + 4), ceilMat);
  ceiling.rotation.x = Math.PI / 2;
  ceiling.position.y = LOBBY.height;
  group.add(ceiling);

  // --- Walls — polished dark stone ---
  const wallMat = new THREE.MeshPhysicalMaterial({
    color: 0x141420,
    roughness: 0.3,
    metalness: 0.15,
    clearcoat: 0.4,
    clearcoatRoughness: 0.2,
    envMapIntensity: 1.0,
    side: THREE.DoubleSide,
  });

  const sideWallMat = new THREE.MeshPhysicalMaterial({
    color: 0x1e1e2e,
    roughness: 0.4,
    metalness: 0.1,
    clearcoat: 0.3,
    clearcoatRoughness: 0.25,
    envMapIntensity: 0.8,
    side: THREE.DoubleSide,
  });

  // Back wall
  const backWall = new THREE.Mesh(
    new THREE.PlaneGeometry(LOBBY.width, LOBBY.height), wallMat
  );
  backWall.position.set(0, LOBBY.height / 2, -hd + LOBBY.wallInset);
  group.add(backWall);

  // Side walls
  [[-1, Math.PI / 2], [1, -Math.PI / 2]].forEach(([side, rotY]) => {
    const wall = new THREE.Mesh(
      new THREE.PlaneGeometry(LOBBY.depth, LOBBY.height), sideWallMat
    );
    wall.rotation.y = rotY;
    wall.position.set(side * (hw - LOBBY.wallInset), LOBBY.height / 2, 0);
    group.add(wall);
  });

  // Front wall segments
  const frontSideW = (LOBBY.width - LOBBY.entranceWidth) / 2;
  const frontGeo = new THREE.PlaneGeometry(frontSideW, LOBBY.height);
  [[-1, -hw + frontSideW / 2], [1, hw - frontSideW / 2]].forEach(([_, x]) => {
    const fw = new THREE.Mesh(frontGeo, sideWallMat);
    fw.rotation.y = Math.PI;
    fw.position.set(x, LOBBY.height / 2, hd - LOBBY.wallInset);
    group.add(fw);
  });

  // Top above entrance
  const topGeo = new THREE.PlaneGeometry(LOBBY.entranceWidth, LOBBY.height - LOBBY.entranceHeight);
  const topWall = new THREE.Mesh(topGeo, sideWallMat);
  topWall.rotation.y = Math.PI;
  topWall.position.set(
    0,
    LOBBY.entranceHeight + (LOBBY.height - LOBBY.entranceHeight) / 2,
    hd - LOBBY.wallInset
  );
  group.add(topWall);

  // --- Polished stone columns ---
  const colMat = new THREE.MeshPhysicalMaterial({
    color: 0xd0c8b8,
    roughness: 0.2,
    metalness: 0.08,
    clearcoat: 0.6,
    clearcoatRoughness: 0.1,
    envMapIntensity: 1.4,
  });
  const colGeo = new THREE.CylinderGeometry(0.3, 0.32, LOBBY.height, 16);

  [[-eh - 0.5, hd - 0.5], [eh + 0.5, hd - 0.5],
   [-eh - 0.5, hd - 5], [eh + 0.5, hd - 5]].forEach(([x, z]) => {
    const col = new THREE.Mesh(colGeo, colMat);
    col.position.set(x, LOBBY.height / 2, z);
    col.castShadow = true;
    group.add(col);

    // Column base and cap
    const capGeo = new THREE.CylinderGeometry(0.38, 0.32, 0.15, 16);
    const capMat = colMat;
    const cap = new THREE.Mesh(capGeo, capMat);
    cap.position.set(x, LOBBY.height - 0.075, z);
    group.add(cap);
    const base = new THREE.Mesh(capGeo, capMat);
    base.position.set(x, 0.075, z);
    group.add(base);
  });

  // ===== #16: DIGITAL DIRECTORY BOARD (near elevator bank) =====
  const dirCanvas = document.createElement('canvas');
  dirCanvas.width = 512;
  dirCanvas.height = 512;
  const dctx = dirCanvas.getContext('2d');
  dctx.fillStyle = '#0a0e14';
  dctx.fillRect(0, 0, 512, 512);
  dctx.strokeStyle = '#3b82f6';
  dctx.lineWidth = 3;
  dctx.strokeRect(6, 6, 500, 500);
  dctx.fillStyle = '#3b82f6';
  dctx.font = 'bold 30px sans-serif';
  dctx.textAlign = 'center';
  dctx.fillText('CONDUIT AI HEADQUARTERS', 256, 60);
  // Divider line
  dctx.strokeStyle = '#1e3a5f';
  dctx.lineWidth = 2;
  dctx.beginPath(); dctx.moveTo(40, 85); dctx.lineTo(472, 85); dctx.stroke();
  dctx.fillStyle = '#94a3b8';
  dctx.font = '20px sans-serif';
  dctx.textAlign = 'left';
  const dirFloors = [
    'L  \u2014  Lobby & Reception',
    '2  \u2014  Sales',
    '3  \u2014  Marketing',
    '4  \u2014  Engineering',
    '5  \u2014  Content',
    '6  \u2014  Intelligence',
    '7  \u2014  Operations',
    '8  \u2014  Monitoring',
    '15 \u2014  CEO Suite',
  ];
  dirFloors.forEach((text, i) => {
    dctx.fillText(text, 50, 120 + i * 36);
  });
  // Footer
  dctx.fillStyle = '#475569';
  dctx.font = '16px sans-serif';
  dctx.textAlign = 'center';
  dctx.fillText('Please check in at reception', 256, 460);
  const dirTex = new THREE.CanvasTexture(dirCanvas);
  dirTex.colorSpace = THREE.SRGBColorSpace;

  // Stand + screen
  const dirGroup = new THREE.Group();
  // Pole
  const poleMat = new THREE.MeshStandardMaterial({ color: 0x444455, metalness: 0.8, roughness: 0.2 });
  const pole = new THREE.Mesh(new THREE.BoxGeometry(0.08, 1.8, 0.08), poleMat);
  pole.position.y = 0.9;
  dirGroup.add(pole);
  // Screen
  const dirScreen = new THREE.Mesh(
    new THREE.PlaneGeometry(1.6, 1.6),
    new THREE.MeshBasicMaterial({ map: dirTex })
  );
  dirScreen.position.set(0, 2.0, 0.05);
  dirGroup.add(dirScreen);
  // Frame
  const dirFrame = new THREE.Mesh(
    new THREE.BoxGeometry(1.7, 1.7, 0.04),
    new THREE.MeshStandardMaterial({ color: 0x1a1a22, roughness: 0.3, metalness: 0.4 })
  );
  dirFrame.position.set(0, 2.0, 0);
  dirGroup.add(dirFrame);

  dirGroup.position.set(3.5, LOBBY.floorY, -hd + 2);
  group.add(dirGroup);

  // ===== #18: BASEBOARDS =====
  const bbMat = new THREE.MeshStandardMaterial({ color: 0x0f0f18, roughness: 0.5 });
  const bbH = 0.08;
  // Back wall
  const bbBack = new THREE.Mesh(new THREE.BoxGeometry(LOBBY.width, bbH, 0.04), bbMat);
  bbBack.position.set(0, LOBBY.floorY + bbH / 2, -hd + LOBBY.wallInset + 0.02);
  group.add(bbBack);
  // Side walls
  [[-1, 1]].flat().forEach(side => {
    const bb = new THREE.Mesh(new THREE.BoxGeometry(0.04, bbH, LOBBY.depth), bbMat);
    bb.position.set(side * (hw - LOBBY.wallInset) + side * 0.02, LOBBY.floorY + bbH / 2, 0);
    group.add(bb);
  });

  // ===== COMPANY METRICS DISPLAY on right wall =====
  const metricsCanvas = document.createElement('canvas');
  metricsCanvas.width = 512;
  metricsCanvas.height = 256;
  const metCtx = metricsCanvas.getContext('2d');
  metCtx.fillStyle = '#060a10';
  metCtx.fillRect(0, 0, 512, 256);
  metCtx.strokeStyle = '#3b82f6';
  metCtx.lineWidth = 2;
  metCtx.strokeRect(4, 4, 504, 248);
  // Header
  metCtx.fillStyle = '#3b82f6';
  metCtx.font = 'bold 18px monospace';
  metCtx.textAlign = 'center';
  metCtx.fillText('CONDUIT AI — LIVE METRICS', 256, 30);
  // Metrics
  const metrics = [
    ['Active Clients', '24', '#10b981'],
    ['Calls Handled Today', '186', '#22d3ee'],
    ['MRR', '$12,400', '#10b981'],
    ['Agent Uptime', '99.98%', '#10b981'],
    ['Avg Response Time', '340ms', '#eab308'],
  ];
  metrics.forEach(([label, value, color], i) => {
    const y = 65 + i * 36;
    metCtx.fillStyle = '#94a3b8';
    metCtx.font = '14px sans-serif';
    metCtx.textAlign = 'left';
    metCtx.fillText(label, 30, y);
    metCtx.fillStyle = color;
    metCtx.font = 'bold 16px monospace';
    metCtx.textAlign = 'right';
    metCtx.fillText(value, 480, y);
  });
  const metricsTex = new THREE.CanvasTexture(metricsCanvas);
  metricsTex.colorSpace = THREE.SRGBColorSpace;

  // Mount frame
  const mFrameMat = new THREE.MeshStandardMaterial({ color: 0x111118, roughness: 0.3, metalness: 0.4 });
  const mFrame = new THREE.Mesh(new THREE.BoxGeometry(0.04, 1.5, 2.8), mFrameMat);
  mFrame.position.set(hw - LOBBY.wallInset - 0.2, 4.5, -3);
  group.add(mFrame);

  const metricsScreen = new THREE.Mesh(
    new THREE.PlaneGeometry(2.6, 1.3),
    new THREE.MeshBasicMaterial({ map: metricsTex })
  );
  metricsScreen.rotation.y = -Math.PI / 2;
  metricsScreen.position.set(hw - LOBBY.wallInset - 0.2, 4.5, -3);
  group.add(metricsScreen);

  // ===== #20: EXIT SIGNS =====
  function addExitSign(ex, ey, ez, eRotY) {
    const c = document.createElement('canvas');
    c.width = 128; c.height = 48;
    const cx = c.getContext('2d');
    cx.fillStyle = '#004400'; cx.fillRect(0, 0, 128, 48);
    cx.fillStyle = '#00ff66'; cx.font = 'bold 28px sans-serif';
    cx.textAlign = 'center'; cx.textBaseline = 'middle';
    cx.fillText('EXIT', 64, 24);
    const t = new THREE.CanvasTexture(c);
    t.colorSpace = THREE.SRGBColorSpace;
    const s = new THREE.Mesh(new THREE.PlaneGeometry(0.5, 0.18), new THREE.MeshBasicMaterial({ map: t }));
    s.position.set(ex, ey, ez);
    s.rotation.y = eRotY;
    group.add(s);
  }
  addExitSign(-hw + LOBBY.wallInset + 0.5, LOBBY.height - 0.3, -hd + 1.5, 0);
  addExitSign(hw - LOBBY.wallInset - 0.5, LOBBY.height - 0.3, hd - 1.5, Math.PI);

  // ===== WELCOME MAT at entrance =====
  const matCanvas = document.createElement('canvas');
  matCanvas.width = 256;
  matCanvas.height = 128;
  const matCtx = matCanvas.getContext('2d');
  matCtx.fillStyle = '#1a1a28';
  matCtx.fillRect(0, 0, 256, 128);
  matCtx.strokeStyle = '#3b82f6';
  matCtx.lineWidth = 4;
  matCtx.strokeRect(8, 8, 240, 112);
  matCtx.fillStyle = '#94a3b8';
  matCtx.font = 'bold 24px sans-serif';
  matCtx.textAlign = 'center';
  matCtx.textBaseline = 'middle';
  matCtx.fillText('WELCOME', 128, 64);
  const matTex = new THREE.CanvasTexture(matCanvas);
  matTex.colorSpace = THREE.SRGBColorSpace;
  const welcomeMat = new THREE.Mesh(
    new THREE.PlaneGeometry(2.5, 1.2),
    new THREE.MeshStandardMaterial({ map: matTex, roughness: 0.9, polygonOffset: true, polygonOffsetFactor: -1, polygonOffsetUnits: -1 })
  );
  welcomeMat.rotation.x = -Math.PI / 2;
  welcomeMat.position.set(0, LOBBY.floorY + 0.01, hd - 2);
  group.add(welcomeMat);
  console.log('[FIX] Welcome mat z-fighting fix applied (polygonOffset + y offset)');

  // ===== UMBRELLA STAND near entrance =====
  const umbStandMat = new THREE.MeshStandardMaterial({ color: 0x333344, roughness: 0.4, metalness: 0.3 });
  const umbStand = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.14, 0.5, 8), umbStandMat);
  umbStand.position.set(eh + 1.2, LOBBY.floorY + 0.25, hd - 1);
  group.add(umbStand);

  // ===== FIRE EXTINGUISHER near elevator =====
  const feMatL = new THREE.MeshStandardMaterial({ color: 0xcc2222, roughness: 0.4 });
  const feL = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.07, 0.35, 8), feMatL);
  feL.position.set(-2, LOBBY.floorY + 0.175, -hd + LOBBY.wallInset + 0.2);
  group.add(feL);
  const feTopL = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.045, 0.07, 6),
    new THREE.MeshStandardMaterial({ color: 0x222222, roughness: 0.3 }));
  feTopL.position.set(-2, LOBBY.floorY + 0.37, -hd + LOBBY.wallInset + 0.2);
  group.add(feTopL);

  // ===== MOTIVATIONAL POSTER on left wall =====
  const motivCanvas = document.createElement('canvas');
  motivCanvas.width = 256;
  motivCanvas.height = 192;
  const mctx = motivCanvas.getContext('2d');
  mctx.fillStyle = '#0a0e14';
  mctx.fillRect(0, 0, 256, 192);
  mctx.strokeStyle = '#3b82f6';
  mctx.lineWidth = 3;
  mctx.strokeRect(6, 6, 244, 180);
  // Gradient text
  const tGrad = mctx.createLinearGradient(0, 60, 256, 120);
  tGrad.addColorStop(0, '#3b82f6');
  tGrad.addColorStop(1, '#06b6d4');
  mctx.fillStyle = tGrad;
  mctx.font = 'bold 22px sans-serif';
  mctx.textAlign = 'center';
  mctx.fillText('THE FUTURE OF', 128, 70);
  mctx.fillText('BUSINESS IS AI', 128, 100);
  mctx.fillStyle = '#64748b';
  mctx.font = '14px sans-serif';
  mctx.fillText('— CONDUIT AI', 128, 140);
  const motivTex = new THREE.CanvasTexture(motivCanvas);
  motivTex.colorSpace = THREE.SRGBColorSpace;

  // Frame
  const motivFrameMat = new THREE.MeshStandardMaterial({ color: 0x1a1520, roughness: 0.3, metalness: 0.4 });
  const motivFrame = new THREE.Mesh(new THREE.BoxGeometry(0.04, 1.5, 1.1), motivFrameMat);
  motivFrame.position.set(-hw + LOBBY.wallInset + 0.2, 3.5, 2);
  group.add(motivFrame);

  const motivArt = new THREE.Mesh(
    new THREE.PlaneGeometry(1.0, 1.4),
    new THREE.MeshBasicMaterial({ map: motivTex })
  );
  motivArt.rotation.y = Math.PI / 2;
  motivArt.position.set(-hw + LOBBY.wallInset + 0.2, 3.5, 2);
  group.add(motivArt);

  // ===== #4: WALL CLOCK =====
  const clockGroup = new THREE.Group();
  const clockFaceMat = new THREE.MeshBasicMaterial({ color: 0xf0f0f0 });
  const clockFace = new THREE.Mesh(new THREE.CylinderGeometry(0.35, 0.35, 0.03, 24), clockFaceMat);
  clockFace.rotation.x = Math.PI / 2;
  clockGroup.add(clockFace);
  const clockRimMat = new THREE.MeshStandardMaterial({ color: 0x222233, metalness: 0.8, roughness: 0.3 });
  const clockRim = new THREE.Mesh(new THREE.CylinderGeometry(0.38, 0.38, 0.05, 24), clockRimMat);
  clockRim.rotation.x = Math.PI / 2;
  clockGroup.add(clockRim);
  const clockHourHand = new THREE.Mesh(
    new THREE.BoxGeometry(0.025, 0.18, 0.01),
    new THREE.MeshBasicMaterial({ color: 0x111111 })
  );
  clockHourHand.geometry.translate(0, 0.09, 0);
  clockHourHand.position.z = 0.03;
  clockGroup.add(clockHourHand);
  const clockMinuteHand = new THREE.Mesh(
    new THREE.BoxGeometry(0.018, 0.28, 0.01),
    new THREE.MeshBasicMaterial({ color: 0x111111 })
  );
  clockMinuteHand.geometry.translate(0, 0.14, 0);
  clockMinuteHand.position.z = 0.035;
  clockGroup.add(clockMinuteHand);
  clockGroup.position.set(hw - LOBBY.wallInset - 0.2, LOBBY.height - 1.5, 0);
  clockGroup.rotation.y = -Math.PI / 2;
  clockGroup.userData.hourHand = clockHourHand;
  clockGroup.userData.minuteHand = clockMinuteHand;
  group.add(clockGroup);

  // Export clock reference via group
  group.userData.lobbyClock = clockGroup;

  // ===== DECORATIVE RUG in center of lobby =====
  const rugCanvas = document.createElement('canvas');
  rugCanvas.width = 512;
  rugCanvas.height = 512;
  const rugCtx = rugCanvas.getContext('2d');
  // Dark base
  rugCtx.fillStyle = '#12101a';
  rugCtx.fillRect(0, 0, 512, 512);
  // Border pattern
  rugCtx.strokeStyle = '#1e3a5f';
  rugCtx.lineWidth = 8;
  rugCtx.strokeRect(20, 20, 472, 472);
  rugCtx.strokeStyle = '#3b82f6';
  rugCtx.lineWidth = 2;
  rugCtx.strokeRect(35, 35, 442, 442);
  // Corner accents
  for (const [cx, cy] of [[40, 40], [472, 40], [40, 472], [472, 472]]) {
    rugCtx.fillStyle = '#3b82f6';
    rugCtx.beginPath();
    rugCtx.arc(cx, cy, 8, 0, Math.PI * 2);
    rugCtx.fill();
  }
  // Subtle CONDUIT logo in center
  rugCtx.fillStyle = 'rgba(59, 130, 246, 0.15)';
  rugCtx.font = 'bold 48px Arial, sans-serif';
  rugCtx.textAlign = 'center';
  rugCtx.textBaseline = 'middle';
  rugCtx.fillText('CONDUIT', 256, 240);
  rugCtx.fillText('AI', 256, 290);

  const rugTex = new THREE.CanvasTexture(rugCanvas);
  rugTex.colorSpace = THREE.SRGBColorSpace;
  const rug = new THREE.Mesh(
    new THREE.PlaneGeometry(6, 5),
    new THREE.MeshStandardMaterial({ map: rugTex, roughness: 0.85, polygonOffset: true, polygonOffsetFactor: -3, polygonOffsetUnits: -3 })
  );
  rug.rotation.x = -Math.PI / 2;
  rug.position.set(0, LOBBY.floorY + 0.006, 1);
  group.add(rug);

  // ===== DRAMATIC CHANDELIER — cluster of glowing spheres =====
  const chandelierGroup = new THREE.Group();
  const chandelierMat = new THREE.MeshStandardMaterial({ color: 0x444455, roughness: 0.2, metalness: 0.7 });
  // Central mounting plate
  const mountPlate = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.5, 0.04, 16), chandelierMat);
  mountPlate.position.y = LOBBY.height - 0.05;
  chandelierGroup.add(mountPlate);
  // Cluster of 12 glowing spheres at varying heights
  const spherePositions = [
    // Inner ring (4 spheres, shorter drops)
    { x: 0, z: 0, drop: 0.8, r: 0.1 },
    { x: 0.25, z: 0.25, drop: 0.6, r: 0.08 },
    { x: -0.25, z: 0.25, drop: 0.7, r: 0.07 },
    { x: 0, z: -0.3, drop: 0.65, r: 0.09 },
    // Middle ring (4 spheres)
    { x: 0.5, z: 0, drop: 1.0, r: 0.1 },
    { x: -0.5, z: 0, drop: 1.1, r: 0.08 },
    { x: 0, z: 0.5, drop: 0.9, r: 0.09 },
    { x: 0.35, z: -0.35, drop: 1.05, r: 0.07 },
    // Outer ring (4 spheres, longer drops)
    { x: 0.7, z: 0.3, drop: 1.3, r: 0.06 },
    { x: -0.6, z: -0.4, drop: 1.2, r: 0.07 },
    { x: -0.3, z: 0.65, drop: 1.15, r: 0.06 },
    { x: 0.5, z: -0.55, drop: 1.35, r: 0.05 },
  ];
  const sphereGlowMat = new THREE.MeshBasicMaterial({ color: 0xfff5e0 });
  const warmGlowMat = new THREE.MeshBasicMaterial({ color: 0xffeec0 });
  for (const sp of spherePositions) {
    // Hanging wire
    const wire = new THREE.Mesh(new THREE.CylinderGeometry(0.003, 0.003, sp.drop, 4), chandelierMat);
    wire.position.set(sp.x, LOBBY.height - 0.05 - sp.drop / 2, sp.z);
    chandelierGroup.add(wire);
    // Glowing sphere
    const sphere = new THREE.Mesh(
      new THREE.SphereGeometry(sp.r, 8, 6),
      sp.r > 0.08 ? sphereGlowMat : warmGlowMat
    );
    sphere.position.set(sp.x, LOBBY.height - 0.05 - sp.drop - sp.r, sp.z);
    chandelierGroup.add(sphere);
  }
  // Chandelier warm light (bright, covers whole lobby center)
  const chandelierLight = new THREE.PointLight(0xfff0d0, 25, 12, 2);
  chandelierLight.position.set(0, LOBBY.height - 1.2, 0);
  chandelierGroup.add(chandelierLight);
  chandelierGroup.position.set(0, 0, 1);
  group.add(chandelierGroup);

  // ===== HAND SANITIZER DISPENSER near entrance =====
  const sanitizerMat = new THREE.MeshStandardMaterial({ color: 0xdddddd, roughness: 0.3 });
  const sanitizer = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.15, 0.06), sanitizerMat);
  sanitizer.position.set(-eh - 1, 1.3, hd - 1);
  group.add(sanitizer);
  // Dispenser nozzle
  const nozzle = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.02, 0.04),
    new THREE.MeshStandardMaterial({ color: 0x888888, roughness: 0.3 }));
  nozzle.position.set(-eh - 1, 1.22, hd - 0.97);
  group.add(nozzle);

  // ===== TROPHY / AWARD CASE on left wall =====
  const caseMat = new THREE.MeshStandardMaterial({ color: 0x111118, roughness: 0.3, metalness: 0.3 });
  // Case frame
  const trophyCase = new THREE.Mesh(new THREE.BoxGeometry(0.04, 1.4, 2.0), caseMat);
  trophyCase.position.set(-hw + LOBBY.wallInset + 0.2, 2.5, -2);
  group.add(trophyCase);
  // Glass front
  const caseGlass = new THREE.Mesh(
    new THREE.PlaneGeometry(1.8, 1.2),
    new THREE.MeshPhysicalMaterial({
      color: 0x88ccff, transparent: true, opacity: 0.08,
      roughness: 0.05, metalness: 0.1, side: THREE.DoubleSide,
    })
  );
  caseGlass.rotation.y = Math.PI / 2;
  caseGlass.position.set(-hw + LOBBY.wallInset + 0.2, 2.5, -2);
  group.add(caseGlass);
  // Shelf inside
  const shelfMat = new THREE.MeshStandardMaterial({ color: 0x1a1520, roughness: 0.3 });
  const shelf = new THREE.Mesh(new THREE.BoxGeometry(0.15, 0.02, 1.6), shelfMat);
  shelf.position.set(-hw + LOBBY.wallInset + 0.2, 2.2, -2);
  group.add(shelf);
  // Trophies on shelf
  const trophyMat = new THREE.MeshStandardMaterial({ color: 0xdaa520, roughness: 0.2, metalness: 0.8 });
  // Trophy 1 (cup)
  const t1base = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.04, 0.08), trophyMat);
  t1base.position.set(-hw + LOBBY.wallInset + 0.2, 2.24, -2.5);
  group.add(t1base);
  const t1stem = new THREE.Mesh(new THREE.CylinderGeometry(0.01, 0.015, 0.1, 6), trophyMat);
  t1stem.position.set(-hw + LOBBY.wallInset + 0.2, 2.31, -2.5);
  group.add(t1stem);
  const t1cup = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.02, 0.06, 8), trophyMat);
  t1cup.position.set(-hw + LOBBY.wallInset + 0.2, 2.39, -2.5);
  group.add(t1cup);
  // Trophy 2 (star shape - using octahedron)
  const t2base = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.04, 0.08), trophyMat);
  t2base.position.set(-hw + LOBBY.wallInset + 0.2, 2.24, -2.0);
  group.add(t2base);
  const t2star = new THREE.Mesh(new THREE.OctahedronGeometry(0.04, 0),
    new THREE.MeshStandardMaterial({ color: 0xc0c0c0, roughness: 0.15, metalness: 0.9 }));
  t2star.position.set(-hw + LOBBY.wallInset + 0.2, 2.34, -2.0);
  t2star.rotation.z = Math.PI / 4;
  group.add(t2star);
  // Trophy 3 (tall pillar)
  const t3base = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.04, 0.06), trophyMat);
  t3base.position.set(-hw + LOBBY.wallInset + 0.2, 2.24, -1.5);
  group.add(t3base);
  const t3pillar = new THREE.Mesh(new THREE.CylinderGeometry(0.015, 0.02, 0.15, 6), trophyMat);
  t3pillar.position.set(-hw + LOBBY.wallInset + 0.2, 2.34, -1.5);
  group.add(t3pillar);
  const t3top = new THREE.Mesh(new THREE.SphereGeometry(0.025, 8, 6), trophyMat);
  t3top.position.set(-hw + LOBBY.wallInset + 0.2, 2.43, -1.5);
  group.add(t3top);
  // "AWARDS" label
  const awardCanvas = document.createElement('canvas');
  awardCanvas.width = 128;
  awardCanvas.height = 32;
  const awCtx = awardCanvas.getContext('2d');
  awCtx.fillStyle = '#0a0b10';
  awCtx.fillRect(0, 0, 128, 32);
  awCtx.fillStyle = '#daa520';
  awCtx.font = 'bold 14px sans-serif';
  awCtx.textAlign = 'center';
  awCtx.textBaseline = 'middle';
  awCtx.fillText('AWARDS', 64, 16);
  const awardTex = new THREE.CanvasTexture(awardCanvas);
  awardTex.colorSpace = THREE.SRGBColorSpace;
  const awardLabel = new THREE.Mesh(
    new THREE.PlaneGeometry(0.4, 0.1),
    new THREE.MeshBasicMaterial({ map: awardTex })
  );
  awardLabel.rotation.y = Math.PI / 2;
  awardLabel.position.set(-hw + LOBBY.wallInset + 0.2, 3.0, -2);
  group.add(awardLabel);
  // Case spotlight
  const caseLight = new THREE.PointLight(0xfff5e0, 5, 3, 2);
  caseLight.position.set(-hw + LOBBY.wallInset + 0.3, 3.2, -2);
  group.add(caseLight);

  // ===== BRIGHT SPOTLIGHT on CONDUIT AI logo wall =====
  const logoSpotlight = new THREE.SpotLight(0x4488ff, 80, 16, Math.PI / 5, 0.6, 2);
  logoSpotlight.position.set(0, LOBBY.height - 0.5, -hd + 6);
  logoSpotlight.target.position.set(0, 4.5, -hd + 0.5);
  group.add(logoSpotlight);
  group.add(logoSpotlight.target);
  // Secondary warm wash on logo
  const logoWarm = new THREE.PointLight(0xfff0dd, 15, 8, 2);
  logoWarm.position.set(0, 6, -hd + 2);
  group.add(logoWarm);

  // ===== WALL ART — framed colored rectangles =====
  const lobbyArtColors = [0x3b82f6, 0x06b6d4];
  const lobbyArtDefs = [
    { x: hw - LOBBY.wallInset - 0.2, y: 5, z: 4, rotY: -Math.PI / 2, w: 0.8, h: 0.6 },
    { x: -hw + LOBBY.wallInset + 0.2, y: 5.5, z: -4, rotY: Math.PI / 2, w: 0.6, h: 0.8 },
  ];
  lobbyArtDefs.forEach((wa, i) => {
    const artMat = new THREE.MeshBasicMaterial({ color: lobbyArtColors[i] });
    const art = new THREE.Mesh(new THREE.PlaneGeometry(wa.w, wa.h), artMat);
    art.position.set(wa.x, wa.y, wa.z);
    art.rotation.y = wa.rotY;
    group.add(art);
    const frameMat3 = new THREE.MeshStandardMaterial({ color: 0x1a1520, roughness: 0.3, metalness: 0.4 });
    const ft = 0.04;
    const fw3 = Math.abs(wa.rotY) === Math.PI / 2 ? ft : wa.w + 0.08;
    const fd3 = Math.abs(wa.rotY) === Math.PI / 2 ? wa.w + 0.08 : ft;
    const frame3 = new THREE.Mesh(new THREE.BoxGeometry(fw3, wa.h + 0.08, fd3), frameMat3);
    frame3.position.set(wa.x, wa.y, wa.z);
    group.add(frame3);
  });

  // ===== ENTRANCE DOOR PANELS (dark glass, angled open) =====
  const doorGlassMat = new THREE.MeshPhysicalMaterial({
    color: 0x1a1a2e,
    opacity: 0.7,
    transparent: true,
    roughness: 0.05,
    metalness: 0.1,
    side: THREE.DoubleSide,
  });
  const doorGeo = new THREE.BoxGeometry(1, 3, 0.05);
  // Left door panel — angled outward
  const doorLeft = new THREE.Mesh(doorGeo, doorGlassMat);
  doorLeft.position.set(-eh / 2, LOBBY.floorY + 1.5, hd - 0.5);
  doorLeft.rotation.y = Math.PI / 6; // ~30 degrees outward
  group.add(doorLeft);
  // Right door panel — angled outward (mirrored)
  const doorRight = new THREE.Mesh(doorGeo, doorGlassMat);
  doorRight.position.set(eh / 2, LOBBY.floorY + 1.5, hd - 0.5);
  doorRight.rotation.y = -Math.PI / 6; // ~30 degrees outward
  group.add(doorRight);

  // ===== LOBBY SMOKE DETECTOR =====
  const lobbySmokeDetector = new THREE.Mesh(
    new THREE.CylinderGeometry(0.07, 0.08, 0.03, 8),
    new THREE.MeshStandardMaterial({ color: 0xdddddd, roughness: 0.4 })
  );
  lobbySmokeDetector.position.set(0, LOBBY.height - 0.01, 0);
  group.add(lobbySmokeDetector);

  scene.add(group);
  return group;
}
