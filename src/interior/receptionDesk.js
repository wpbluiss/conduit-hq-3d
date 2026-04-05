import * as THREE from 'three/webgpu';
import { COLORS, LOBBY } from '../constants.js';
import { createWoodTexture, createBrushedMetalNormal } from '../utils/textures.js';

export function createReceptionDesk(scene) {
  const group = new THREE.Group();

  const woodTex = createWoodTexture();
  const metalNorm = createBrushedMetalNormal();

  // Rich dark wood material
  const woodMat = new THREE.MeshPhysicalMaterial({
    map: woodTex,
    roughness: 0.3,
    metalness: 0.05,
    clearcoat: 0.8,
    clearcoatRoughness: 0.15,
    envMapIntensity: 1.2,
  });

  // Polished stone top
  const stoneMat = new THREE.MeshPhysicalMaterial({
    color: 0x1a1520,
    roughness: 0.1,
    metalness: 0.15,
    clearcoat: 1.0,
    clearcoatRoughness: 0.05,
    envMapIntensity: 2.0,
  });

  // Brushed metal accents
  const metalMat = new THREE.MeshPhysicalMaterial({
    color: 0x888899,
    metalness: 0.95,
    roughness: 0.2,
    normalMap: metalNorm,
    normalScale: new THREE.Vector2(0.3, 0.3),
    envMapIntensity: 1.5,
  });

  const dw = 5.5, dh = 1.1, dd = 1.6;

  // Curved front panel — use extruded shape for bevel
  const frontShape = new THREE.Shape();
  frontShape.moveTo(-dw / 2, 0);
  frontShape.lineTo(-dw / 2, dh + 0.15);
  frontShape.quadraticCurveTo(-dw / 2 + 0.3, dh + 0.2, -dw / 2 + 0.6, dh + 0.2);
  frontShape.lineTo(dw / 2 - 0.6, dh + 0.2);
  frontShape.quadraticCurveTo(dw / 2 - 0.3, dh + 0.2, dw / 2, dh + 0.15);
  frontShape.lineTo(dw / 2, 0);
  frontShape.lineTo(-dw / 2, 0);

  const frontGeo = new THREE.ExtrudeGeometry(frontShape, {
    depth: 0.12, bevelEnabled: true, bevelThickness: 0.02,
    bevelSize: 0.02, bevelSegments: 2,
  });
  const front = new THREE.Mesh(frontGeo, woodMat);
  front.position.set(0, 0, dd / 2);
  front.castShadow = true;
  group.add(front);

  // Desktop surface — polished stone slab
  const topGeo = new THREE.BoxGeometry(dw + 0.1, 0.06, dd + 0.15);
  const top = new THREE.Mesh(topGeo, stoneMat);
  top.position.set(0, dh + 0.03, 0);
  top.receiveShadow = true;
  group.add(top);

  // Metal edge trim around top
  const trimGeo = new THREE.BoxGeometry(dw + 0.2, 0.015, 0.015);
  const trimFront = new THREE.Mesh(trimGeo, metalMat);
  trimFront.position.set(0, dh + 0.068, dd / 2 + 0.08);
  group.add(trimFront);
  const trimBack = trimFront.clone();
  trimBack.position.z = -dd / 2 - 0.08;
  group.add(trimBack);

  // Side panels
  const sideMat = woodMat;
  [-1, 1].forEach((s) => {
    const side = new THREE.Mesh(
      new THREE.BoxGeometry(0.08, dh, dd), sideMat
    );
    side.position.set(s * dw / 2, dh / 2, 0);
    side.castShadow = true;
    group.add(side);
  });

  // Back panel
  const back = new THREE.Mesh(new THREE.BoxGeometry(dw, dh - 0.15, 0.06), woodMat);
  back.position.set(0, (dh - 0.15) / 2, -dd / 2);
  group.add(back);

  // LED accent strip — blue-to-cyan gradient
  const stripGeo = new THREE.BoxGeometry(dw + 0.1, 0.025, 0.025);
  const stripMat = new THREE.MeshPhysicalMaterial({
    color: COLORS.cyan,
    emissive: COLORS.cyan,
    emissiveIntensity: 3.5,
    toneMapped: false, // ensures bloom catches this
  });
  const strip = new THREE.Mesh(stripGeo, stripMat);
  strip.position.set(0, dh + 0.08, dd / 2 + 0.12);
  group.add(strip);

  // Second strip along the base
  const baseStrip = strip.clone();
  baseStrip.position.set(0, 0.02, dd / 2 + 0.06);
  baseStrip.material = stripMat.clone();
  baseStrip.material.emissiveIntensity = 1.5;
  group.add(baseStrip);

  // Monitors (dual) with welcome screen content
  const receptionScreens = ['left', 'right'];
  [-0.8, 0.8].forEach((xOff, idx) => {
    // Monitor housing
    const housingGeo = new THREE.BoxGeometry(0.7, 0.45, 0.02);
    const housingMat = new THREE.MeshStandardMaterial({ color: 0x111118, roughness: 0.2, metalness: 0.5 });
    const housing = new THREE.Mesh(housingGeo, housingMat);
    housing.position.set(xOff, dh + 0.32, -0.15);
    housing.rotation.x = -0.08;
    group.add(housing);

    // Glowing screen on front face
    const sc = document.createElement('canvas');
    sc.width = 512; sc.height = 320;
    const ctx = sc.getContext('2d');
    ctx.fillStyle = '#080610'; ctx.fillRect(0, 0, 512, 320);
    if (idx === 0) {
      // Left monitor: CONDUIT AI welcome
      ctx.fillStyle = '#8b5cf6'; ctx.font = 'bold 36px sans-serif'; ctx.textAlign = 'center';
      ctx.fillText('CONDUIT AI', 256, 50);
      ctx.fillStyle = '#e2e8f0'; ctx.font = '22px sans-serif';
      ctx.fillText('HEADQUARTERS', 256, 82);
      ctx.fillStyle = '#10b981'; ctx.font = '18px monospace';
      ctx.fillText('WELCOME', 256, 140);
      ctx.fillStyle = '#64748b'; ctx.font = '14px sans-serif';
      ctx.fillText('32 AI Employees Active', 256, 180);
      ctx.fillStyle = '#10b981'; ctx.beginPath(); ctx.arc(200, 177, 5, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#475569'; ctx.font = '12px monospace';
      ctx.fillText(new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' }), 256, 220);
    } else {
      // Right monitor: department status
      ctx.fillStyle = '#3b82f6'; ctx.font = 'bold 24px sans-serif'; ctx.textAlign = 'center';
      ctx.fillText('DEPARTMENTS', 256, 36);
      const depts = [['Sales', '#3b82f6'], ['Marketing', '#10b981'], ['Engineering', '#f97316'], ['Content', '#ec4899'], ['Intelligence', '#eab308'], ['Operations', '#22c55e'], ['Monitoring', '#ef4444']];
      depts.forEach(([name, color], i) => {
        ctx.fillStyle = color; ctx.beginPath(); ctx.arc(140, 70 + i * 34, 6, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = '#94a3b8'; ctx.font = '16px monospace'; ctx.textAlign = 'left'; ctx.fillText(name, 156, 76 + i * 34);
        ctx.fillStyle = '#10b981'; ctx.textAlign = 'right'; ctx.fillText('ONLINE', 380, 76 + i * 34);
      });
      ctx.textAlign = 'center';
    }
    const tex = new THREE.CanvasTexture(sc);
    tex.colorSpace = THREE.SRGBColorSpace;
    const screenMesh = new THREE.Mesh(
      new THREE.PlaneGeometry(0.65, 0.4),
      new THREE.MeshBasicMaterial({ map: tex, side: THREE.DoubleSide })
    );
    screenMesh.position.set(xOff, dh + 0.32, -0.14);
    screenMesh.rotation.x = -0.08;
    group.add(screenMesh);

    // Monitor arm
    const armGeo = new THREE.CylinderGeometry(0.015, 0.02, 0.2, 6);
    const arm = new THREE.Mesh(armGeo, metalMat);
    arm.position.set(xOff, dh + 0.1, -0.15);
    group.add(arm);

    // Base plate
    const basePlate = new THREE.Mesh(
      new THREE.CylinderGeometry(0.06, 0.06, 0.01, 8), metalMat
    );
    basePlate.position.set(xOff, dh + 0.005, -0.15);
    group.add(basePlate);
  });

  // Sign-in tablet (iPad-like) on desk
  const tabletMat = new THREE.MeshStandardMaterial({ color: 0x111118, roughness: 0.15, metalness: 0.5 });
  const tablet = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.3, 0.015), tabletMat);
  tablet.position.set(2.0, dh + 0.2, 0.3);
  tablet.rotation.x = -0.8;
  group.add(tablet);
  // Tablet screen
  const tabletScreenCanvas = document.createElement('canvas');
  tabletScreenCanvas.width = 128;
  tabletScreenCanvas.height = 192;
  const tsCtx = tabletScreenCanvas.getContext('2d');
  tsCtx.fillStyle = '#0a0e14';
  tsCtx.fillRect(0, 0, 128, 192);
  tsCtx.fillStyle = '#3b82f6';
  tsCtx.font = 'bold 14px sans-serif';
  tsCtx.textAlign = 'center';
  tsCtx.fillText('SIGN IN', 64, 30);
  tsCtx.fillStyle = '#94a3b8';
  tsCtx.font = '10px sans-serif';
  tsCtx.fillText('Tap to check in', 64, 55);
  // Name field placeholder
  tsCtx.fillStyle = '#1e293b';
  tsCtx.fillRect(16, 70, 96, 24);
  tsCtx.fillRect(16, 102, 96, 24);
  tsCtx.fillStyle = '#475569';
  tsCtx.font = '9px sans-serif';
  tsCtx.textAlign = 'left';
  tsCtx.fillText('Name', 22, 85);
  tsCtx.fillText('Company', 22, 117);
  // Check-in button
  tsCtx.fillStyle = '#3b82f6';
  tsCtx.fillRect(32, 145, 64, 24);
  tsCtx.fillStyle = '#ffffff';
  tsCtx.font = 'bold 10px sans-serif';
  tsCtx.textAlign = 'center';
  tsCtx.fillText('CHECK IN', 64, 160);

  const tabletTex = new THREE.CanvasTexture(tabletScreenCanvas);
  tabletTex.colorSpace = THREE.SRGBColorSpace;
  const tabletScreen = new THREE.Mesh(
    new THREE.PlaneGeometry(0.17, 0.26),
    new THREE.MeshBasicMaterial({ map: tabletTex })
  );
  tabletScreen.position.set(2.0, dh + 0.2, 0.31);
  tabletScreen.rotation.x = -0.8;
  group.add(tabletScreen);

  // Business card holder
  const bcHolderMat = new THREE.MeshStandardMaterial({ color: 0x333344, roughness: 0.3, metalness: 0.5 });
  const bcHolder = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.06, 0.08), bcHolderMat);
  bcHolder.position.set(-2.0, dh + 0.04, 0.3);
  group.add(bcHolder);
  // Cards inside
  const cardMat = new THREE.MeshStandardMaterial({ color: 0xf0f0e8, roughness: 0.8 });
  for (let c = 0; c < 3; c++) {
    const card = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.003, 0.06), cardMat);
    card.position.set(-2.0, dh + 0.075 + c * 0.004, 0.3);
    card.rotation.y = c * 0.03;
    group.add(card);
  }

  group.position.set(0, LOBBY.floorY, -2);
  scene.add(group);
  return group;
}
