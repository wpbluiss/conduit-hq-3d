import * as THREE from 'three/webgpu';
import { LOBBY } from '../constants.js';
import { loadModel } from '../utils/modelLoader.js';
import { createDoorSign } from '../ui/doorSign.js';

function createNameTagWithStatus(name, status, borderColor = '#8b5cf6') {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 64;
  const ctx = canvas.getContext('2d');

  ctx.clearRect(0, 0, 512, 64);

  ctx.fillStyle = 'rgba(10, 11, 16, 0.75)';
  _roundRect(ctx, 20, 8, 472, 48, 12);
  ctx.fill();

  ctx.strokeStyle = borderColor;
  ctx.lineWidth = 2;
  _roundRect(ctx, 20, 8, 472, 48, 12);
  ctx.stroke();

  const dotColor = status === 'green' ? '#10b981' : '#eab308';
  ctx.fillStyle = dotColor;
  ctx.beginPath();
  ctx.arc(60, 34, 8, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 26px "Segoe UI", system-ui, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(name, 276, 34);

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;

  const mat = new THREE.SpriteMaterial({
    map: texture,
    transparent: true,
    depthTest: true,
    sizeAttenuation: true,
  });

  const sprite = new THREE.Sprite(mat);
  sprite.scale.set(2.5, 0.32, 1);
  return sprite;
}

function _roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}

const FLOOR_Y = 400;
const FLOOR_W = LOBBY.width;
const FLOOR_D = LOBBY.depth;
const CEIL_H = 5;

// Wall clock references for update
const ceoWallClocks = [];

// CEO ceiling fan reference for animation
let ceoCeilingFan = null;

export function setCeoCeilingFan(fan) {
  ceoCeilingFan = fan;
}

export function updateCeoClocks(time) {
  const now = new Date();
  const hours = now.getHours() % 12;
  const minutes = now.getMinutes();
  const hourAngle = -((hours + minutes / 60) / 12) * Math.PI * 2;
  const minuteAngle = -(minutes / 60) * Math.PI * 2;
  for (const clock of ceoWallClocks) {
    clock.userData.hourHand.rotation.z = hourAngle;
    clock.userData.minuteHand.rotation.z = minuteAngle;
  }
  // Rotate ceiling fan
  if (ceoCeilingFan) {
    ceoCeilingFan.rotation.y += 0.008;
  }
}

function createWallClock(group, x, y, z, rotY) {
  const clockGroup = new THREE.Group();
  const faceMat = new THREE.MeshBasicMaterial({ color: 0xf0f0f0 });
  const face = new THREE.Mesh(new THREE.CylinderGeometry(0.35, 0.35, 0.03, 24), faceMat);
  face.rotation.x = Math.PI / 2;
  clockGroup.add(face);

  const rimMat = new THREE.MeshStandardMaterial({ color: 0x222233, metalness: 0.8, roughness: 0.3 });
  const rim = new THREE.Mesh(new THREE.CylinderGeometry(0.38, 0.38, 0.05, 24), rimMat);
  rim.rotation.x = Math.PI / 2;
  clockGroup.add(rim);

  const hourHand = new THREE.Mesh(
    new THREE.BoxGeometry(0.025, 0.18, 0.01),
    new THREE.MeshBasicMaterial({ color: 0x111111 })
  );
  hourHand.geometry.translate(0, 0.09, 0);
  hourHand.position.z = 0.03;
  clockGroup.add(hourHand);

  const minuteHand = new THREE.Mesh(
    new THREE.BoxGeometry(0.018, 0.28, 0.01),
    new THREE.MeshBasicMaterial({ color: 0x111111 })
  );
  minuteHand.geometry.translate(0, 0.14, 0);
  minuteHand.position.z = 0.035;
  clockGroup.add(minuteHand);

  const dot = new THREE.Mesh(
    new THREE.CylinderGeometry(0.02, 0.02, 0.02, 8),
    new THREE.MeshBasicMaterial({ color: 0x333333 })
  );
  dot.rotation.x = Math.PI / 2;
  dot.position.z = 0.04;
  clockGroup.add(dot);

  clockGroup.position.set(x, y, z);
  clockGroup.rotation.y = rotY || 0;
  group.add(clockGroup);
  clockGroup.userData.hourHand = hourHand;
  clockGroup.userData.minuteHand = minuteHand;
  return clockGroup;
}

function createExitSign(parent, x, y, z, rotY) {
  const canvas = document.createElement('canvas');
  canvas.width = 128;
  canvas.height = 48;
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = '#004400';
  ctx.fillRect(0, 0, 128, 48);
  ctx.fillStyle = '#00ff66';
  ctx.font = 'bold 28px sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('EXIT', 64, 24);
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  const sign = new THREE.Mesh(
    new THREE.PlaneGeometry(0.5, 0.18),
    new THREE.MeshBasicMaterial({ map: tex })
  );
  sign.position.set(x, y, z);
  sign.rotation.y = rotY;
  parent.add(sign);
}

export async function createCeoSuite(scene) {
  const group = new THREE.Group();
  const hw = FLOOR_W / 2;
  const hd = FLOOR_D / 2;

  // Floor
  const floorMat = new THREE.MeshPhysicalMaterial({ color: 0x12101a, roughness: 0.18, metalness: 0.2, clearcoat: 0.7, clearcoatRoughness: 0.08, envMapIntensity: 2.2, transparent: false });
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(FLOOR_W + 1, FLOOR_D + 1), floorMat);
  floor.rotation.x = -Math.PI / 2;
  floor.position.y = FLOOR_Y;
  floor.receiveShadow = true;
  group.add(floor);

  // Ceiling
  const ceilMat = new THREE.MeshStandardMaterial({ color: 0x1a1a2a, roughness: 0.6 });
  const ceiling = new THREE.Mesh(new THREE.PlaneGeometry(FLOOR_W, FLOOR_D), ceilMat);
  ceiling.rotation.x = Math.PI / 2;
  ceiling.position.y = FLOOR_Y + CEIL_H;
  group.add(ceiling);

  // Back wall (solid, with panoramic window cutout area)
  const wallMat = new THREE.MeshStandardMaterial({ color: 0x141420, roughness: 0.4, metalness: 0.1, side: THREE.DoubleSide });
  const backWall = new THREE.Mesh(new THREE.PlaneGeometry(FLOOR_W, CEIL_H), wallMat);
  backWall.position.set(0, FLOOR_Y + CEIL_H / 2, -hd);
  group.add(backWall);

  // ===== PANORAMIC NIGHTTIME CITYSCAPE WINDOW on back wall =====
  const backCityCanvas = document.createElement('canvas');
  backCityCanvas.width = 512;
  backCityCanvas.height = 256;
  const bcCtx = backCityCanvas.getContext('2d');
  // Night sky
  const nightGrad = bcCtx.createLinearGradient(0, 0, 0, 256);
  nightGrad.addColorStop(0, '#020810');
  nightGrad.addColorStop(0.3, '#081028');
  nightGrad.addColorStop(0.6, '#0a1535');
  nightGrad.addColorStop(1, '#0e1a40');
  bcCtx.fillStyle = nightGrad;
  bcCtx.fillRect(0, 0, 512, 256);
  // Stars
  bcCtx.fillStyle = '#ffffff';
  for (let s = 0; s < 60; s++) {
    bcCtx.globalAlpha = 0.2 + Math.random() * 0.8;
    const sz = Math.random() > 0.85 ? 2 : 1;
    bcCtx.fillRect(Math.random() * 512, Math.random() * 100, sz, sz);
  }
  bcCtx.globalAlpha = 1.0;
  // Moon
  bcCtx.fillStyle = '#f0e8c8';
  bcCtx.beginPath();
  bcCtx.arc(420, 35, 16, 0, Math.PI * 2);
  bcCtx.fill();
  bcCtx.fillStyle = '#e8ddb8';
  bcCtx.beginPath();
  bcCtx.arc(416, 32, 14, 0, Math.PI * 2);
  bcCtx.fill();
  // Moon glow
  bcCtx.fillStyle = 'rgba(240, 232, 200, 0.08)';
  bcCtx.beginPath();
  bcCtx.arc(420, 35, 35, 0, Math.PI * 2);
  bcCtx.fill();
  // Skyline buildings (tall, premium)
  for (let b = 0; b < 22; b++) {
    const bx = b * 25 - 15 + Math.random() * 10;
    const bw = 10 + Math.random() * 18;
    const bh = 50 + Math.random() * 140;
    bcCtx.fillStyle = '#060c18';
    bcCtx.fillRect(bx, 256 - bh, bw, bh);
    // Lit windows
    for (let row = 0; row < Math.floor(bh / 6); row++) {
      for (let col = 0; col < Math.floor(bw / 4.5); col++) {
        if (Math.random() > 0.35) {
          bcCtx.fillStyle = Math.random() > 0.7 ? '#ffd700' : '#ffeeaa';
          bcCtx.globalAlpha = 0.3 + Math.random() * 0.6;
          bcCtx.fillRect(bx + 1.5 + col * 4.5, 256 - bh + 2 + row * 6, 2, 3);
        }
      }
    }
    bcCtx.globalAlpha = 1.0;
  }
  const backCityTex = new THREE.CanvasTexture(backCityCanvas);
  backCityTex.colorSpace = THREE.SRGBColorSpace;
  // Window frame
  const backWinFrame = new THREE.MeshStandardMaterial({ color: 0x333344, roughness: 0.3, metalness: 0.6 });
  group.add(makeBox(FLOOR_W - 2, 0.06, 0.06, 0, FLOOR_Y + 3.8, -hd + 0.04, backWinFrame));
  group.add(makeBox(FLOOR_W - 2, 0.06, 0.06, 0, FLOOR_Y + 0.8, -hd + 0.04, backWinFrame));
  group.add(makeBox(0.06, 3.06, 0.06, -(FLOOR_W / 2 - 1), FLOOR_Y + 2.3, -hd + 0.04, backWinFrame));
  group.add(makeBox(0.06, 3.06, 0.06, (FLOOR_W / 2 - 1), FLOOR_Y + 2.3, -hd + 0.04, backWinFrame));
  group.add(makeBox(0.04, 3.06, 0.04, 0, FLOOR_Y + 2.3, -hd + 0.04, backWinFrame));
  // Cityscape mesh
  const backCityView = new THREE.Mesh(
    new THREE.PlaneGeometry(FLOOR_W - 2.2, 2.9),
    new THREE.MeshBasicMaterial({ map: backCityTex })
  );
  backCityView.position.set(0, FLOOR_Y + 2.3, -hd + 0.06);
  group.add(backCityView);

  // ===== #14: Glass walls with very low opacity =====
  const glassMat = new THREE.MeshPhysicalMaterial({
    color: 0x88ccff,
    transparent: true,
    opacity: 0.12,
    roughness: 0.05,
    metalness: 0.1,
    emissive: 0x88ccff,
    emissiveIntensity: 0.05,
    side: THREE.DoubleSide,
  });

  const frontWall = new THREE.Mesh(new THREE.PlaneGeometry(FLOOR_W, CEIL_H), glassMat);
  frontWall.position.set(0, FLOOR_Y + CEIL_H / 2, hd);
  frontWall.rotation.y = Math.PI;
  group.add(frontWall);

  [-1, 1].forEach((side) => {
    const wall = new THREE.Mesh(new THREE.PlaneGeometry(FLOOR_D, CEIL_H), glassMat);
    wall.rotation.y = -side * Math.PI / 2;
    wall.position.set(side * hw, FLOOR_Y + CEIL_H / 2, 0);
    group.add(wall);
  });

  // Glass frame mullions — skip center (i=0) to keep cityscape view clear
  const mullionMat = new THREE.MeshStandardMaterial({ color: 0x333344, roughness: 0.3, metalness: 0.6 });
  for (let i = -3; i <= 3; i++) {
    if (i === 0) continue;
    const mullion = new THREE.Mesh(new THREE.BoxGeometry(0.05, CEIL_H, 0.05), mullionMat);
    mullion.position.set(i * (FLOOR_W / 6), FLOOR_Y + CEIL_H / 2, hd - 0.04);
    group.add(mullion);
  }

  // Lighting — Executive suite: dramatic warm amber + purple accent for premium feel
  const mainLight = new THREE.PointLight(0xffe0b0, 55, 24, 2);
  mainLight.position.set(0, FLOOR_Y + CEIL_H - 0.5, 0);
  mainLight.castShadow = true;
  mainLight.shadow.mapSize.set(512, 512);
  mainLight.shadow.radius = 4;
  group.add(mainLight);

  const accentLight = new THREE.PointLight(0x8b5cf6, 28, 16, 2);
  accentLight.position.set(4, FLOOR_Y + CEIL_H - 1, -4);
  group.add(accentLight);

  const ambientFloor = new THREE.PointLight(0xfff0dd, 32, 20, 2);
  ambientFloor.position.set(-3, FLOOR_Y + 2, 2);
  group.add(ambientFloor);

  // Warm back-wall wash for depth
  const backWash = new THREE.PointLight(0xffe8c0, 14, 12, 2);
  backWash.position.set(0, FLOOR_Y + 1.5, -6);
  group.add(backWash);

  // Purple floor-level ambiance — stronger for premium feel
  const floorPurple = new THREE.PointLight(0x8b5cf6, 10, 10, 2);
  floorPurple.position.set(0, FLOOR_Y + 0.3, 0);
  group.add(floorPurple);

  // Extra accent: warm golden window wash from front
  const windowWash = new THREE.PointLight(0xffcc88, 12, 14, 2);
  windowWash.position.set(0, FLOOR_Y + 2.5, 7);
  group.add(windowWash);

  // Executive desk
  const deskMat = new THREE.MeshStandardMaterial({ color: 0x2a1a0a, roughness: 0.4, metalness: 0.1 });
  const desk = new THREE.Mesh(new THREE.BoxGeometry(3.5, 0.9, 1.5), deskMat);
  desk.position.set(0, FLOOR_Y + 0.45, -3);
  desk.castShadow = true;
  group.add(desk);

  // Nameplate on desk
  const plateCanvas = document.createElement('canvas');
  plateCanvas.width = 512;
  plateCanvas.height = 128;
  const pctx = plateCanvas.getContext('2d');
  pctx.fillStyle = '#0a0b10';
  pctx.fillRect(0, 0, 512, 128);
  pctx.strokeStyle = '#8b5cf6';
  pctx.lineWidth = 3;
  pctx.strokeRect(4, 4, 504, 120);
  pctx.fillStyle = '#e2e8f0';
  pctx.font = 'bold 32px "Segoe UI", system-ui, sans-serif';
  pctx.textAlign = 'center';
  pctx.textBaseline = 'middle';
  pctx.fillText('LUIS GARCIA \u2014 CEO', 256, 64);
  const plateTex = new THREE.CanvasTexture(plateCanvas);
  plateTex.colorSpace = THREE.SRGBColorSpace;
  const plateMesh = new THREE.Mesh(
    new THREE.PlaneGeometry(1.2, 0.3),
    new THREE.MeshBasicMaterial({ map: plateTex })
  );
  plateMesh.position.set(0, FLOOR_Y + 1.01, -2.6);
  plateMesh.rotation.x = -0.3;
  group.add(plateMesh);

  // ===== CEO DASHBOARD MONITORS (3 screens on desk) =====
  const ceoScreenCanvases = [];
  const ceoScreenTextures = [];
  const monitorPositions = [
    { x: -1.2, label: 'WORKFORCE' },
    { x: 0, label: 'OVERVIEW' },
    { x: 1.2, label: 'PIPELINE' },
  ];
  for (const mp of monitorPositions) {
    // Monitor housing
    const monHousing = new THREE.Mesh(
      new THREE.BoxGeometry(1.0, 0.65, 0.05),
      new THREE.MeshStandardMaterial({ color: 0x111118, roughness: 0.3, metalness: 0.5 })
    );
    monHousing.position.set(mp.x, FLOOR_Y + 1.3, -3.5);
    group.add(monHousing);

    // Screen canvas
    const sc = document.createElement('canvas');
    sc.width = 512;
    sc.height = 320;
    ceoScreenCanvases.push(sc);
    const tex = new THREE.CanvasTexture(sc);
    tex.colorSpace = THREE.SRGBColorSpace;
    ceoScreenTextures.push(tex);
    const screenMesh = new THREE.Mesh(
      new THREE.PlaneGeometry(0.9, 0.55),
      new THREE.MeshBasicMaterial({ map: tex, side: THREE.DoubleSide })
    );
    screenMesh.position.set(mp.x, FLOOR_Y + 1.3, -3.474);
    group.add(screenMesh);
  }
  // Render CEO screen content
  function renderCeoScreens() {
    const w = 512, h = 320;
    // Screen 0: WORKFORCE
    {
      const ctx = ceoScreenCanvases[0].getContext('2d');
      ctx.fillStyle = '#080610'; ctx.fillRect(0, 0, w, h);
      ctx.fillStyle = '#8b5cf6'; ctx.font = 'bold 22px sans-serif'; ctx.fillText('WORKFORCE STATUS', 16, 30);
      ctx.fillStyle = '#10b981'; ctx.font = '16px monospace'; ctx.fillText('32 / 32 AGENTS ONLINE', 16, 60);
      const depts = [['Sales', 6, '#3b82f6'], ['Marketing', 5, '#10b981'], ['Engineering', 4, '#f97316'], ['Content', 5, '#ec4899'], ['Intelligence', 5, '#eab308'], ['Operations', 5, '#22c55e'], ['Monitoring', 2, '#ef4444']];
      depts.forEach(([name, count, color], i) => {
        const y = 85 + i * 32;
        ctx.fillStyle = color; ctx.fillRect(16, y, count * 40, 20);
        ctx.fillStyle = '#94a3b8'; ctx.font = '14px monospace'; ctx.fillText(name + ' (' + count + ')', 16 + count * 40 + 10, y + 15);
      });
      ceoScreenTextures[0].needsUpdate = true;
    }
    // Screen 1: OVERVIEW (center, main dashboard)
    {
      const ctx = ceoScreenCanvases[1].getContext('2d');
      ctx.fillStyle = '#080610'; ctx.fillRect(0, 0, w, h);
      ctx.fillStyle = '#8b5cf6'; ctx.font = 'bold 28px sans-serif'; ctx.fillText('CONDUIT AI', 16, 34);
      ctx.fillStyle = '#475569'; ctx.font = '14px sans-serif'; ctx.fillText('CEO DASHBOARD', 180, 30);
      // KPI boxes
      const kpis = [
        ['MRR', '$12.4K', '#8b5cf6'], ['Clients', '1', '#3b82f6'],
        ['Tasks Today', String(Math.floor(8 + Math.random() * 10)), '#10b981'], ['Pipeline', '$445K', '#eab308']
      ];
      kpis.forEach(([label, val, color], i) => {
        const x = 16 + (i % 2) * 250, y = 56 + Math.floor(i / 2) * 80;
        ctx.fillStyle = 'rgba(139,92,246,0.08)'; ctx.fillRect(x, y, 230, 65);
        ctx.strokeStyle = color + '40'; ctx.lineWidth = 1; ctx.strokeRect(x, y, 230, 65);
        ctx.fillStyle = '#64748b'; ctx.font = '13px sans-serif'; ctx.fillText(label, x + 12, y + 22);
        ctx.fillStyle = color; ctx.font = 'bold 28px monospace'; ctx.fillText(val, x + 12, y + 52);
      });
      ctx.fillStyle = '#10b981'; ctx.font = '14px monospace'; ctx.fillText('ALL SYSTEMS OPERATIONAL', 16, h - 20);
      ctx.fillStyle = '#10b981'; ctx.beginPath(); ctx.arc(w - 24, h - 24, 6, 0, Math.PI * 2); ctx.fill();
      ceoScreenTextures[1].needsUpdate = true;
    }
    // Screen 2: PIPELINE
    {
      const ctx = ceoScreenCanvases[2].getContext('2d');
      ctx.fillStyle = '#080610'; ctx.fillRect(0, 0, w, h);
      ctx.fillStyle = '#eab308'; ctx.font = 'bold 22px sans-serif'; ctx.fillText('PIPELINE', 16, 30);
      ctx.fillStyle = '#94a3b8'; ctx.font = '16px monospace'; ctx.fillText('$445.7K  |  746 prospects', 16, 56);
      // Pipeline stages
      const stages = [['New', 280, '#3b82f6'], ['Contacted', 180, '#06b6d4'], ['Demo', 60, '#eab308'], ['Proposal', 30, '#f97316'], ['Closed', 12, '#10b981']];
      stages.forEach(([label, count, color], i) => {
        const y = 80 + i * 44;
        const bw = Math.min(w - 32, count * 1.5);
        ctx.fillStyle = color + '30'; ctx.fillRect(16, y, bw, 30);
        ctx.fillStyle = color; ctx.fillRect(16, y, bw * 0.7, 30);
        ctx.fillStyle = '#e2e8f0'; ctx.font = '14px monospace'; ctx.fillText(label + ': ' + count, 24, y + 20);
      });
      ceoScreenTextures[2].needsUpdate = true;
    }
  }
  renderCeoScreens();
  // Refresh every 15 seconds
  setInterval(renderCeoScreens, 15000);

  // ===== EXECUTIVE RUG under desk area =====
  const rugCanvas = document.createElement('canvas');
  rugCanvas.width = 256;
  rugCanvas.height = 256;
  const rugCtx = rugCanvas.getContext('2d');
  rugCtx.fillStyle = '#0e0a14';
  rugCtx.fillRect(0, 0, 256, 256);
  rugCtx.strokeStyle = '#8b5cf6';
  rugCtx.lineWidth = 4;
  rugCtx.strokeRect(12, 12, 232, 232);
  rugCtx.strokeStyle = 'rgba(139,92,246,0.3)';
  rugCtx.lineWidth = 1;
  rugCtx.strokeRect(24, 24, 208, 208);
  // Monogram
  rugCtx.fillStyle = 'rgba(139,92,246,0.12)';
  rugCtx.font = 'bold 48px serif';
  rugCtx.textAlign = 'center';
  rugCtx.textBaseline = 'middle';
  rugCtx.fillText('LG', 128, 128);
  const rugTex = new THREE.CanvasTexture(rugCanvas);
  rugTex.colorSpace = THREE.SRGBColorSpace;
  const rug = new THREE.Mesh(
    new THREE.PlaneGeometry(5, 4),
    new THREE.MeshStandardMaterial({ map: rugTex, roughness: 0.85, polygonOffset: true, polygonOffsetFactor: -3, polygonOffsetUnits: -3 })
  );
  rug.rotation.x = -Math.PI / 2;
  rug.position.set(0, FLOOR_Y + 0.005, -3);
  group.add(rug);

  // ===== DESK LAMP =====
  const lampBaseMat = new THREE.MeshStandardMaterial({ color: 0x333344, roughness: 0.3, metalness: 0.5 });
  const lampBase = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.06, 0.03, 8), lampBaseMat);
  lampBase.position.set(-1.5, FLOOR_Y + 0.97, -2.8);
  group.add(lampBase);
  const lampArm = new THREE.Mesh(new THREE.BoxGeometry(0.015, 0.3, 0.015), lampBaseMat);
  lampArm.position.set(-1.5, FLOOR_Y + 1.12, -2.8);
  lampArm.rotation.z = 0.1;
  group.add(lampArm);
  const lampShade = new THREE.Mesh(new THREE.ConeGeometry(0.06, 0.08, 6, 1, true),
    new THREE.MeshStandardMaterial({ color: 0x8b5cf6, roughness: 0.5, emissive: 0x8b5cf6, emissiveIntensity: 0.15, side: THREE.DoubleSide }));
  lampShade.position.set(-1.49, FLOOR_Y + 1.29, -2.8);
  lampShade.rotation.x = Math.PI;
  group.add(lampShade);

  // ===== #11: MULTIPLE MONITORS (3 screens) =====
  const monitorMat = new THREE.MeshStandardMaterial({ color: 0x111122, roughness: 0.2, metalness: 0.5 });
  const screenColors = [0x8b5cf6, 0x3b82f6, 0x10b981]; // purple, blue, green
  const monitorAngles = [-0.3, 0, 0.3]; // slight angle outward
  const monitorXPositions = [-1.1, 0, 1.1];

  for (let mi = 0; mi < 3; mi++) {
    const monitor = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.6, 0.04), monitorMat);
    monitor.position.set(monitorXPositions[mi], FLOOR_Y + 1.3, -3.5);
    monitor.rotation.y = monitorAngles[mi];
    group.add(monitor);

    const screenMat = new THREE.MeshStandardMaterial({
      color: screenColors[mi],
      emissive: screenColors[mi], emissiveIntensity: 3.0,
      toneMapped: false,
    });
    const screen = new THREE.Mesh(new THREE.PlaneGeometry(0.8, 0.5), screenMat);
    screen.position.set(monitorXPositions[mi], FLOOR_Y + 1.3, -3.55);
    screen.rotation.y = monitorAngles[mi];
    group.add(screen);

    // Screen glow light
    const screenGlow = new THREE.PointLight(screenColors[mi], 5, 4, 2);
    screenGlow.position.set(monitorXPositions[mi], FLOOR_Y + 1.3, -3.2);
    group.add(screenGlow);
  }

  // Chair behind desk
  const chairMat = new THREE.MeshStandardMaterial({ color: 0x1a1a2e, roughness: 0.5 });
  const chairSeat = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.1, 0.8), chairMat);
  chairSeat.position.set(0, FLOOR_Y + 0.5, -4.2);
  group.add(chairSeat);
  const chairBack = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.8, 0.1), chairMat);
  chairBack.position.set(0, FLOOR_Y + 0.9, -4.55);
  group.add(chairBack);

  // Floor label
  const labelCanvas = document.createElement('canvas');
  labelCanvas.width = 512;
  labelCanvas.height = 64;
  const lctx = labelCanvas.getContext('2d');
  lctx.fillStyle = '#1a1a2e';
  lctx.fillRect(0, 0, 512, 64);
  lctx.fillStyle = '#8b5cf6';
  lctx.font = 'bold 36px sans-serif';
  lctx.textAlign = 'center';
  lctx.textBaseline = 'middle';
  lctx.fillText('CEO SUITE', 256, 32);
  const labelTex = new THREE.CanvasTexture(labelCanvas);
  labelTex.colorSpace = THREE.SRGBColorSpace;
  const labelMesh = new THREE.Mesh(
    new THREE.PlaneGeometry(4, 0.5),
    new THREE.MeshBasicMaterial({ map: labelTex })
  );
  labelMesh.position.set(0, FLOOR_Y + CEIL_H / 2 + 0.8, -hd + 0.2);
  group.add(labelMesh);

  // ===== #5: CONDUIT AI LOGO on back wall =====
  const logoCanvas = document.createElement('canvas');
  logoCanvas.width = 512;
  logoCanvas.height = 128;
  const logoCtx = logoCanvas.getContext('2d');
  logoCtx.fillStyle = '#141420';
  logoCtx.fillRect(0, 0, 512, 128);
  logoCtx.font = 'bold 60px Arial, sans-serif';
  logoCtx.textAlign = 'center';
  logoCtx.textBaseline = 'middle';
  const logoGrad = logoCtx.createLinearGradient(80, 0, 432, 0);
  logoGrad.addColorStop(0, '#8b5cf6');
  logoGrad.addColorStop(1, '#06b6d4');
  logoCtx.fillStyle = logoGrad;
  logoCtx.fillText('CONDUIT AI', 256, 64);
  const logoTex = new THREE.CanvasTexture(logoCanvas);
  logoTex.colorSpace = THREE.SRGBColorSpace;
  const logoMesh = new THREE.Mesh(
    new THREE.PlaneGeometry(5, 1.2),
    new THREE.MeshBasicMaterial({ map: logoTex })
  );
  logoMesh.position.set(0, FLOOR_Y + CEIL_H - 1, -hd + 0.2);
  group.add(logoMesh);

  // ===== POTTED PLANTS in corners =====
  const potMat2 = new THREE.MeshPhysicalMaterial({ color: 0x2a2a30, roughness: 0.3, clearcoat: 0.5 });
  const leafMat2 = new THREE.MeshStandardMaterial({ color: 0x1d5e15, roughness: 0.6 });
  const ceoPlantCorners = [[-hw + 0.8, hd - 0.8], [hw - 0.8, hd - 0.8], [-hw + 0.8, -hd + 0.8], [hw - 0.8, -hd + 0.8]];
  for (const [px, pz] of ceoPlantCorners) {
    const pot = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.16, 0.5, 8), potMat2);
    pot.position.set(px, FLOOR_Y + 0.25, pz);
    group.add(pot);
    const soil = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.18, 0.04, 8),
      new THREE.MeshStandardMaterial({ color: 0x3d2b1f, roughness: 0.9 }));
    soil.position.set(px, FLOOR_Y + 0.52, pz);
    group.add(soil);
    [[0, 0.75, 0, 0.25], [0.1, 0.95, 0.08, 0.18], [-0.08, 0.85, -0.06, 0.16]].forEach(([lx, ly, lz, lr]) => {
      const leaf = new THREE.Mesh(new THREE.IcosahedronGeometry(lr, 1), leafMat2);
      leaf.position.set(px + lx, FLOOR_Y + ly, pz + lz);
      group.add(leaf);
    });
  }

  // ===== TRASH CAN =====
  const ceoTrash = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.15, 0.4, 6),
    new THREE.MeshStandardMaterial({ color: 0x222233, roughness: 0.6 }));
  ceoTrash.position.set(1.5, FLOOR_Y + 0.2, -3.5);
  group.add(ceoTrash);

  // ===== COFFEE MUG on desk =====
  const ceoMug = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.03, 0.07, 6),
    new THREE.MeshStandardMaterial({ color: 0x8b5cf6, roughness: 0.4 }));
  ceoMug.position.set(1.2, FLOOR_Y + 0.94, -2.8);
  group.add(ceoMug);

  // ===== PAPER STACK on desk =====
  const ceoPaperMat = new THREE.MeshStandardMaterial({ color: 0xf0f0e8, roughness: 0.8 });
  for (let s = 0; s < 5; s++) {
    const sheet = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.003, 0.16), ceoPaperMat);
    sheet.position.set(-1.2, FLOOR_Y + 0.91 + s * 0.004, -2.6);
    sheet.rotation.y = 0.02 * s;
    group.add(sheet);
  }

  // ===== #10: BOOKSHELF behind desk =====
  const bookshelfMat = new THREE.MeshStandardMaterial({ color: 0x2a1a0a, roughness: 0.5, metalness: 0.05 });
  // Frame
  const bsW = 3, bsH = 3.5, bsD = 0.4;
  const bsX = 5, bsZ = -hd + 0.6;
  // Back panel
  group.add(makeBox(bsW, bsH, 0.05, bsX, FLOOR_Y + bsH / 2, bsZ, bookshelfMat));
  // Side panels
  group.add(makeBox(0.06, bsH, bsD, bsX - bsW / 2, FLOOR_Y + bsH / 2, bsZ + bsD / 2 - 0.05, bookshelfMat));
  group.add(makeBox(0.06, bsH, bsD, bsX + bsW / 2, FLOOR_Y + bsH / 2, bsZ + bsD / 2 - 0.05, bookshelfMat));
  // Shelves (4 levels)
  for (let s = 0; s < 4; s++) {
    group.add(makeBox(bsW, 0.04, bsD, bsX, FLOOR_Y + 0.8 * (s + 1), bsZ + bsD / 2 - 0.05, bookshelfMat));
  }
  // Books (colored boxes on shelves)
  const deskBookColors = [0x8b2222, 0x1e5599, 0x226633, 0x8b5cf6, 0xcc8833, 0x444466, 0x993355, 0x2288aa];
  for (let s = 0; s < 3; s++) {
    const shelfY = FLOOR_Y + 0.8 * (s + 1) + 0.15;
    const booksOnShelf = 3 + Math.floor(Math.random() * 4);
    let bx = bsX - bsW / 2 + 0.2;
    for (let b = 0; b < booksOnShelf && bx < bsX + bsW / 2 - 0.2; b++) {
      const bw = 0.08 + Math.random() * 0.12;
      const bh = 0.2 + Math.random() * 0.15;
      const color = deskBookColors[Math.floor(Math.random() * deskBookColors.length)];
      group.add(makeBox(bw, bh, 0.2, bx + bw / 2, shelfY + bh / 2, bsZ + bsD / 2,
        new THREE.MeshStandardMaterial({ color, roughness: 0.6 })));
      bx += bw + 0.04;
    }
  }

  // ===== #12: SEATING AREA (front-left) =====
  const couchMat = new THREE.MeshStandardMaterial({ color: 0x1a1a28, roughness: 0.55 });
  // Couch
  const couchSeat = new THREE.Mesh(new THREE.BoxGeometry(2.2, 0.35, 0.8), couchMat);
  couchSeat.position.set(-5, FLOOR_Y + 0.35, 4);
  group.add(couchSeat);
  const couchBack = new THREE.Mesh(new THREE.BoxGeometry(2.2, 0.5, 0.12), couchMat);
  couchBack.position.set(-5, FLOOR_Y + 0.65, 4.35);
  group.add(couchBack);
  // Armrests
  group.add(makeBox(0.12, 0.4, 0.8, -6.05, FLOOR_Y + 0.5, 4, couchMat));
  group.add(makeBox(0.12, 0.4, 0.8, -3.95, FLOOR_Y + 0.5, 4, couchMat));

  // Coffee table
  const tableMat = new THREE.MeshStandardMaterial({ color: 0x1a1520, roughness: 0.2, metalness: 0.15 });
  const tableTop = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.06, 0.6), tableMat);
  tableTop.position.set(-5, FLOOR_Y + 0.45, 3);
  group.add(tableTop);
  // Legs
  [[-0.5, -0.25], [-0.5, 0.25], [0.5, -0.25], [0.5, 0.25]].forEach(([lx, lz]) => {
    const leg = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.4, 0.04), tableMat);
    leg.position.set(-5 + lx, FLOOR_Y + 0.2, 3 + lz);
    group.add(leg);
  });

  // ===== DECORATIVE GLOBE on coffee table =====
  const globeStandMat = new THREE.MeshStandardMaterial({ color: 0x2a1a0a, roughness: 0.4 });
  const globeStand = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.08, 0.12, 8), globeStandMat);
  globeStand.position.set(-5, FLOOR_Y + 0.54, 3);
  group.add(globeStand);
  const globeMat = new THREE.MeshPhysicalMaterial({
    color: 0x1e3a5f, roughness: 0.3, metalness: 0.2,
    emissive: 0x1e3a5f, emissiveIntensity: 0.1,
  });
  const globe = new THREE.Mesh(new THREE.SphereGeometry(0.18, 12, 8), globeMat);
  globe.position.set(-5, FLOOR_Y + 0.78, 3);
  group.add(globe);
  // Globe ring
  const ringMat = new THREE.MeshStandardMaterial({ color: 0x666677, metalness: 0.8, roughness: 0.2 });
  const globeRing = new THREE.Mesh(new THREE.TorusGeometry(0.2, 0.01, 8, 16), ringMat);
  globeRing.position.set(-5, FLOOR_Y + 0.78, 3);
  globeRing.rotation.x = Math.PI / 6;
  group.add(globeRing);

  // ===== PEN SET on desk =====
  const penSetMat = new THREE.MeshStandardMaterial({ color: 0x1a1520, roughness: 0.3, metalness: 0.3 });
  const penBase = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.02, 0.1), penSetMat);
  penBase.position.set(0.5, FLOOR_Y + 0.91, -2.5);
  group.add(penBase);
  const pen1 = new THREE.Mesh(new THREE.BoxGeometry(0.01, 0.12, 0.01),
    new THREE.MeshStandardMaterial({ color: 0x8b5cf6 }));
  pen1.position.set(0.48, FLOOR_Y + 0.97, -2.5);
  pen1.rotation.z = 0.05;
  group.add(pen1);
  const pen2 = new THREE.Mesh(new THREE.BoxGeometry(0.01, 0.12, 0.01),
    new THREE.MeshStandardMaterial({ color: 0x333344 }));
  pen2.position.set(0.52, FLOOR_Y + 0.97, -2.5);
  pen2.rotation.z = -0.05;
  group.add(pen2);

  // ===== #13: ACHIEVEMENT FRAMES on side wall =====
  const achievements = ['FOUNDED 2026', 'FIRST 100 CLIENTS', '$1M ARR'];
  achievements.forEach((text, i) => {
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 128;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#0a0b10';
    ctx.fillRect(0, 0, 256, 128);
    ctx.strokeStyle = '#8b5cf6';
    ctx.lineWidth = 3;
    ctx.strokeRect(6, 6, 244, 116);
    ctx.fillStyle = '#e2e8f0';
    ctx.font = 'bold 22px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(text, 128, 64);
    const tex = new THREE.CanvasTexture(canvas);
    tex.colorSpace = THREE.SRGBColorSpace;

    // Dark frame
    const frameW = 1.0, frameH = 0.5;
    const frameMat = new THREE.MeshStandardMaterial({ color: 0x1a1520, roughness: 0.3, metalness: 0.4 });
    const frameBox = new THREE.Mesh(new THREE.BoxGeometry(frameW + 0.08, frameH + 0.08, 0.04), frameMat);
    frameBox.position.set(-hw + 0.14, FLOOR_Y + 2.5 + i * 0.8, -2 + i * 2);
    frameBox.rotation.y = Math.PI / 2;
    group.add(frameBox);

    const artMesh = new THREE.Mesh(
      new THREE.PlaneGeometry(frameW, frameH),
      new THREE.MeshBasicMaterial({ map: tex })
    );
    artMesh.position.set(-hw + 0.2, FLOOR_Y + 2.5 + i * 0.8, -2 + i * 2);
    artMesh.rotation.y = Math.PI / 2;
    group.add(artMesh);
  });

  // ===== #4: WALL CLOCK =====
  const clock = createWallClock(group, hw - 0.2, FLOOR_Y + CEIL_H - 0.8, 0, -Math.PI / 2);
  ceoWallClocks.push(clock);

  // ===== #18: BASEBOARDS =====
  const bbMat = new THREE.MeshStandardMaterial({ color: 0x0f0f18, roughness: 0.5 });
  const bbH = 0.08;
  group.add(makeBox(FLOOR_W, bbH, 0.04, 0, FLOOR_Y + bbH / 2, -hd + 0.02, bbMat));
  group.add(makeBox(FLOOR_W, bbH, 0.04, 0, FLOOR_Y + bbH / 2, hd - 0.02, bbMat));
  group.add(makeBox(0.04, bbH, FLOOR_D, -hw + 0.02, FLOOR_Y + bbH / 2, 0, bbMat));
  group.add(makeBox(0.04, bbH, FLOOR_D, hw - 0.02, FLOOR_Y + bbH / 2, 0, bbMat));

  // ===== #19: ELEVATOR DOOR FRAME =====
  const efMat = new THREE.MeshStandardMaterial({ color: 0x444455, metalness: 0.8, roughness: 0.2 });
  const efW = 2.2, efH = 3.2;
  group.add(makeBox(0.1, efH, 0.1, -efW / 2, FLOOR_Y + efH / 2, -hd + 0.15, efMat));
  group.add(makeBox(0.1, efH, 0.1, efW / 2, FLOOR_Y + efH / 2, -hd + 0.15, efMat));
  group.add(makeBox(efW + 0.1, 0.1, 0.1, 0, FLOOR_Y + efH, -hd + 0.15, efMat));

  // ===== FLOOR INDICATOR above elevator =====
  const indCanvas2 = document.createElement('canvas');
  indCanvas2.width = 128;
  indCanvas2.height = 64;
  const indCtx2 = indCanvas2.getContext('2d');
  indCtx2.fillStyle = '#0a0b10';
  indCtx2.fillRect(0, 0, 128, 64);
  indCtx2.fillStyle = '#8b5cf6';
  indCtx2.font = 'bold 28px monospace';
  indCtx2.textAlign = 'center';
  indCtx2.textBaseline = 'middle';
  indCtx2.fillText('CEO', 64, 32);
  const indTex2 = new THREE.CanvasTexture(indCanvas2);
  indTex2.colorSpace = THREE.SRGBColorSpace;
  const indMesh2 = new THREE.Mesh(
    new THREE.PlaneGeometry(0.8, 0.4),
    new THREE.MeshBasicMaterial({ map: indTex2 })
  );
  indMesh2.position.set(0, FLOOR_Y + efH + 0.3, -hd + 0.16);
  group.add(indMesh2);

  // Department door sign
  createDoorSign('ceo', FLOOR_Y, 0x8b5cf6, group, { x: 3.2, z: -hd + 0.16 });

  // ===== #20: EXIT SIGNS =====
  createExitSign(group, -hw + 1, FLOOR_Y + CEIL_H - 0.3, -hd + 1, 0);
  createExitSign(group, hw - 1, FLOOR_Y + CEIL_H - 0.3, hd - 1, Math.PI);

  // ===== WALL-MOUNTED TV (front glass wall, showing company dashboard) =====
  const tvCanvas = document.createElement('canvas');
  tvCanvas.width = 512;
  tvCanvas.height = 256;
  const tvCtx = tvCanvas.getContext('2d');
  tvCtx.fillStyle = '#060a10';
  tvCtx.fillRect(0, 0, 512, 256);
  // Header
  tvCtx.shadowColor = '#8b5cf6';
  tvCtx.shadowBlur = 15;
  tvCtx.fillStyle = '#8b5cf6';
  tvCtx.font = 'bold 24px monospace';
  tvCtx.textAlign = 'center';
  tvCtx.fillText('CEO DASHBOARD', 256, 35);
  tvCtx.shadowBlur = 0;
  // Big number
  tvCtx.fillStyle = '#10b981';
  tvCtx.font = 'bold 56px monospace';
  tvCtx.fillText('$12,400', 256, 100);
  tvCtx.fillStyle = '#64748b';
  tvCtx.font = '14px sans-serif';
  tvCtx.fillText('Monthly Recurring Revenue', 256, 125);
  // Mini stats row
  const ceoStats = [['35', 'Agents'], ['24', 'Clients'], ['99.98%', 'Uptime']];
  ceoStats.forEach(([val, label], i) => {
    const sx = 100 + i * 156;
    tvCtx.fillStyle = '#e2e8f0';
    tvCtx.font = 'bold 28px monospace';
    tvCtx.textAlign = 'center';
    tvCtx.fillText(val, sx, 180);
    tvCtx.fillStyle = '#64748b';
    tvCtx.font = '12px sans-serif';
    tvCtx.fillText(label, sx, 200);
  });
  // Growth bar
  tvCtx.fillStyle = '#10b981';
  tvCtx.fillRect(40, 225, 300, 12);
  tvCtx.fillStyle = '#1e293b';
  tvCtx.fillRect(340, 225, 132, 12);
  tvCtx.fillStyle = '#94a3b8';
  tvCtx.font = '10px monospace';
  tvCtx.textAlign = 'right';
  tvCtx.fillText('69% to $18K goal', 480, 235);

  const tvTex = new THREE.CanvasTexture(tvCanvas);
  tvTex.colorSpace = THREE.SRGBColorSpace;
  // TV bezel — mounted on RIGHT wall
  const tvBezelMat = new THREE.MeshStandardMaterial({ color: 0x111118, roughness: 0.2, metalness: 0.4 });
  const tvBezel = new THREE.Mesh(new THREE.BoxGeometry(0.06, 1.8, 3.5), tvBezelMat);
  tvBezel.position.set(hw - 0.2, FLOOR_Y + 2.5, 2);
  group.add(tvBezel);
  const tvScreen = new THREE.Mesh(
    new THREE.PlaneGeometry(3.2, 1.6),
    new THREE.MeshStandardMaterial({
      map: tvTex, emissive: 0xffffff, emissiveMap: tvTex,
      emissiveIntensity: 2.5, toneMapped: false,
    })
  );
  tvScreen.rotation.y = -Math.PI / 2;
  tvScreen.position.set(hw - 0.28, FLOOR_Y + 2.5, 2);
  group.add(tvScreen);
  // TV purple glow
  const tvSpot = new THREE.PointLight(0x8b5cf6, 10, 6, 2);
  tvSpot.position.set(hw - 0.5, FLOOR_Y + 2.5, 2);
  group.add(tvSpot);

  // ===== Ceiling light panels =====
  const ceilPanelMat = new THREE.MeshBasicMaterial({ color: 0xfff5e0 });
  const ceilPanelGeo = new THREE.PlaneGeometry(2, 1.5);
  [[-4, -3], [4, -3], [-4, 3], [4, 3]].forEach(([px, pz]) => {
    const panel = new THREE.Mesh(ceilPanelGeo, ceilPanelMat);
    panel.rotation.x = Math.PI / 2;
    panel.position.set(px, FLOOR_Y + CEIL_H - 0.02, pz);
    group.add(panel);
  });

  // ===== MINI BAR / REFRESHMENT AREA (right side, near back) =====
  const barMat = new THREE.MeshStandardMaterial({ color: 0x1a1520, roughness: 0.3, metalness: 0.1 });
  // Bar counter
  const barCounter = new THREE.Mesh(new THREE.BoxGeometry(2.0, 0.9, 0.6), barMat);
  barCounter.position.set(hw - 1.5, FLOOR_Y + 0.45, 4);
  group.add(barCounter);
  // Bar top (polished)
  const barTopMat = new THREE.MeshPhysicalMaterial({ color: 0x0e0a14, roughness: 0.1, metalness: 0.15, clearcoat: 0.8 });
  const barTop = new THREE.Mesh(new THREE.BoxGeometry(2.1, 0.04, 0.7), barTopMat);
  barTop.position.set(hw - 1.5, FLOOR_Y + 0.92, 4);
  group.add(barTop);
  // Glasses (3 glass tumblers)
  const glassMat2 = new THREE.MeshPhysicalMaterial({
    color: 0x88ccff, transparent: true, opacity: 0.25,
    roughness: 0.05, metalness: 0.0,
  });
  for (let g = 0; g < 3; g++) {
    const glass = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.02, 0.06, 8), glassMat2);
    glass.position.set(hw - 2.1 + g * 0.3, FLOOR_Y + 0.97, 4);
    group.add(glass);
  }
  // Bottle (dark, like whiskey)
  const bottleMat2 = new THREE.MeshStandardMaterial({ color: 0x1a0a00, roughness: 0.2, metalness: 0.1 });
  const bottle = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.035, 0.18, 8), bottleMat2);
  bottle.position.set(hw - 0.9, FLOOR_Y + 1.03, 4);
  group.add(bottle);
  const bottleNeck = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.02, 0.06, 6), bottleMat2);
  bottleNeck.position.set(hw - 0.9, FLOOR_Y + 1.15, 4);
  group.add(bottleNeck);

  // ===== FRAMED FAMILY PHOTO on right wall =====
  const photoCanvas = document.createElement('canvas');
  photoCanvas.width = 128;
  photoCanvas.height = 96;
  const phCtx = photoCanvas.getContext('2d');
  phCtx.fillStyle = '#1a2a3a';
  phCtx.fillRect(0, 0, 128, 96);
  // Simple silhouette figures
  phCtx.fillStyle = '#334155';
  // Person 1
  phCtx.beginPath();
  phCtx.arc(40, 40, 8, 0, Math.PI * 2);
  phCtx.fill();
  phCtx.fillRect(34, 48, 12, 20);
  // Person 2
  phCtx.beginPath();
  phCtx.arc(64, 38, 9, 0, Math.PI * 2);
  phCtx.fill();
  phCtx.fillRect(57, 47, 14, 22);
  // Person 3
  phCtx.beginPath();
  phCtx.arc(88, 42, 7, 0, Math.PI * 2);
  phCtx.fill();
  phCtx.fillRect(83, 49, 10, 18);
  // Ground
  phCtx.fillStyle = '#1d5e15';
  phCtx.fillRect(0, 70, 128, 26);
  // Sky gradient
  phCtx.fillStyle = 'rgba(59, 130, 246, 0.1)';
  phCtx.fillRect(0, 0, 128, 35);

  const photoTex = new THREE.CanvasTexture(photoCanvas);
  photoTex.colorSpace = THREE.SRGBColorSpace;
  // Photo frame
  const photoFrameMat = new THREE.MeshStandardMaterial({ color: 0x2a1a0a, roughness: 0.4, metalness: 0.1 });
  const photoFrame = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.6, 0.8), photoFrameMat);
  photoFrame.position.set(hw - 0.14, FLOOR_Y + 2.0, -5);
  group.add(photoFrame);
  const photo = new THREE.Mesh(
    new THREE.PlaneGeometry(0.7, 0.5),
    new THREE.MeshBasicMaterial({ map: photoTex })
  );
  photo.rotation.y = -Math.PI / 2;
  photo.position.set(hw - 0.2, FLOOR_Y + 2.0, -5);
  group.add(photo);

  // ===== FLOOR STANDING LAMP (tall, modern) =====
  const floorLampMat = new THREE.MeshStandardMaterial({ color: 0x333344, roughness: 0.3, metalness: 0.5 });
  const flPole = new THREE.Mesh(new THREE.CylinderGeometry(0.015, 0.02, 1.8, 6), floorLampMat);
  flPole.position.set(-hw + 1, FLOOR_Y + 0.9, 5);
  group.add(flPole);
  const flBase = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.12, 0.03, 8), floorLampMat);
  flBase.position.set(-hw + 1, FLOOR_Y + 0.015, 5);
  group.add(flBase);
  const flShade = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.08, 0.2, 8, 1, true),
    new THREE.MeshStandardMaterial({ color: 0x8b5cf6, roughness: 0.5, emissive: 0x8b5cf6, emissiveIntensity: 0.1, side: THREE.DoubleSide }));
  flShade.position.set(-hw + 1, FLOOR_Y + 1.85, 5);
  group.add(flShade);
  const flLight = new THREE.PointLight(0xffe8d0, 8, 5, 2);
  flLight.position.set(-hw + 1, FLOOR_Y + 1.7, 5);
  group.add(flLight);

  // ===== PANORAMIC WINDOW VIEW (front wall — CEO gets the best view) =====
  const ceoWindowGlass = new THREE.MeshPhysicalMaterial({
    color: 0x88bbff, transparent: true, opacity: 0.06,
    roughness: 0.02, metalness: 0.1, side: THREE.DoubleSide,
  });
  const ceoWindowFrame = new THREE.MeshStandardMaterial({ color: 0x333344, roughness: 0.3, metalness: 0.6 });
  // Full-width panoramic window
  const panoramaGlass = new THREE.Mesh(new THREE.PlaneGeometry(12, 2.8), ceoWindowGlass);
  panoramaGlass.rotation.y = Math.PI;
  panoramaGlass.position.set(0, FLOOR_Y + 2.2, hd - 0.03);
  group.add(panoramaGlass);
  // Window frame
  group.add(makeBox(12.2, 0.06, 0.06, 0, FLOOR_Y + 3.62, hd - 0.04, ceoWindowFrame));
  group.add(makeBox(12.2, 0.06, 0.06, 0, FLOOR_Y + 0.78, hd - 0.04, ceoWindowFrame));
  group.add(makeBox(0.06, 2.9, 0.06, -6.08, FLOOR_Y + 2.2, hd - 0.04, ceoWindowFrame));
  group.add(makeBox(0.06, 2.9, 0.06, 6.08, FLOOR_Y + 2.2, hd - 0.04, ceoWindowFrame));
  // Center mullion
  group.add(makeBox(0.04, 2.9, 0.04, 0, FLOOR_Y + 2.2, hd - 0.04, ceoWindowFrame));
  // Premium cityscape view
  const ceoCityCanvas = document.createElement('canvas');
  ceoCityCanvas.width = 512;
  ceoCityCanvas.height = 192;
  const ccCtx = ceoCityCanvas.getContext('2d');
  // Sunset sky gradient
  const sunsetGrad = ccCtx.createLinearGradient(0, 0, 0, 192);
  sunsetGrad.addColorStop(0, '#0a0e1a');
  sunsetGrad.addColorStop(0.3, '#1a1040');
  sunsetGrad.addColorStop(0.5, '#2a1848');
  sunsetGrad.addColorStop(0.7, '#4a2060');
  sunsetGrad.addColorStop(1, '#1a1040');
  ccCtx.fillStyle = sunsetGrad;
  ccCtx.fillRect(0, 0, 512, 192);
  // Stars
  ccCtx.fillStyle = '#ffffff';
  for (let s = 0; s < 40; s++) {
    ccCtx.globalAlpha = 0.2 + Math.random() * 0.6;
    ccCtx.fillRect(Math.random() * 512, Math.random() * 80, 1, 1);
  }
  ccCtx.globalAlpha = 1.0;
  // Moon
  ccCtx.fillStyle = '#e0d8c0';
  ccCtx.beginPath();
  ccCtx.arc(400, 30, 12, 0, Math.PI * 2);
  ccCtx.fill();
  // Premium buildings (taller, more detailed)
  ccCtx.fillStyle = '#0a0e18';
  for (let b = 0; b < 18; b++) {
    const bx = b * 30 - 10 + Math.random() * 12;
    const bw = 12 + Math.random() * 20;
    const bh = 40 + Math.random() * 100;
    ccCtx.fillRect(bx, 192 - bh, bw, bh);
    // Lit windows
    ccCtx.fillStyle = '#ffd700';
    for (let row = 0; row < Math.floor(bh / 7); row++) {
      for (let col = 0; col < Math.floor(bw / 5); col++) {
        if (Math.random() > 0.35) {
          ccCtx.globalAlpha = 0.3 + Math.random() * 0.5;
          ccCtx.fillRect(bx + 1.5 + col * 5, 192 - bh + 2 + row * 7, 2.5, 3.5);
        }
      }
    }
    ccCtx.globalAlpha = 1.0;
    ccCtx.fillStyle = '#0a0e18';
  }
  // Water reflection at bottom
  ccCtx.fillStyle = 'rgba(30,20,60,0.6)';
  ccCtx.fillRect(0, 170, 512, 22);
  const ceoCityTex = new THREE.CanvasTexture(ceoCityCanvas);
  ceoCityTex.colorSpace = THREE.SRGBColorSpace;
  const ceoCityView = new THREE.Mesh(
    new THREE.PlaneGeometry(11.8, 2.6),
    new THREE.MeshBasicMaterial({ map: ceoCityTex })
  );
  ceoCityView.rotation.y = Math.PI;
  ceoCityView.position.set(0, FLOOR_Y + 2.2, hd - 0.01);
  group.add(ceoCityView);

  // ===== LARGE BOOKSHELF (left wall) — floor-to-ceiling with colorful books =====
  const shelfMat = new THREE.MeshStandardMaterial({ color: 0x2a1a0a, roughness: 0.5, metalness: 0.1 });
  const bsHeight = 3.8;
  const bsWidth = 4.0;
  // Back panel
  const bookshelfBack = new THREE.Mesh(new THREE.BoxGeometry(0.04, bsHeight, bsWidth), shelfMat);
  bookshelfBack.position.set(-hw + 0.04, FLOOR_Y + bsHeight / 2, -2);
  group.add(bookshelfBack);
  // Side panels
  group.add(makeBox(0.3, bsHeight, 0.05, -hw + 0.17, FLOOR_Y + bsHeight / 2, -2 - bsWidth / 2, shelfMat));
  group.add(makeBox(0.3, bsHeight, 0.05, -hw + 0.17, FLOOR_Y + bsHeight / 2, -2 + bsWidth / 2, shelfMat));
  // 5 shelves
  for (let s = 0; s < 5; s++) {
    const shelf = new THREE.Mesh(new THREE.BoxGeometry(0.32, 0.03, bsWidth), shelfMat);
    shelf.position.set(-hw + 0.17, FLOOR_Y + 0.5 + s * 0.72, -2);
    group.add(shelf);
  }
  // Books on each shelf (colorful spines, varying heights)
  const bookColors = [0xcc2222, 0x1e5599, 0x226633, 0x8b5cf6, 0xcc8833, 0xec4899, 0x2288aa, 0xf97316, 0xeab308, 0x06b6d4, 0x3b82f6, 0xef4444];
  for (let s = 0; s < 5; s++) {
    const bookCount = 8 + Math.floor(Math.random() * 6);
    let bz = -2 - bsWidth / 2 + 0.15;
    for (let b = 0; b < bookCount && bz < -2 + bsWidth / 2 - 0.15; b++) {
      const bookW = 0.04 + Math.random() * 0.06;
      const bookH = 0.22 + Math.random() * 0.2;
      const bookColor = bookColors[Math.floor(Math.random() * bookColors.length)];
      const bookMat = new THREE.MeshStandardMaterial({ color: bookColor, roughness: 0.6 });
      const book = new THREE.Mesh(new THREE.BoxGeometry(0.22, bookH, bookW), bookMat);
      book.position.set(-hw + 0.17, FLOOR_Y + 0.5 + s * 0.72 + bookH / 2 + 0.02, bz);
      group.add(book);
      bz += bookW + 0.01;
    }
  }

  // ===== CEILING FAN (animated) =====
  const ceoFanGroup = new THREE.Group();
  const cfMotorMat = new THREE.MeshStandardMaterial({ color: 0xcccccc, roughness: 0.35, metalness: 0.7 });
  ceoFanGroup.add(new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.18, 0.12, 12), cfMotorMat));
  const cfRod = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.025, 0.4, 6), cfMotorMat);
  cfRod.position.y = 0.26;
  ceoFanGroup.add(cfRod);
  const cfPlate = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 0.03, 8), cfMotorMat);
  cfPlate.position.y = 0.46;
  ceoFanGroup.add(cfPlate);
  const cfBladeMat = new THREE.MeshStandardMaterial({ color: 0x444444, roughness: 0.3, metalness: 0.8 });
  for (let b = 0; b < 4; b++) {
    const blade = new THREE.Mesh(new THREE.BoxGeometry(1.4, 0.06, 0.22), cfBladeMat);
    const angle = (b / 4) * Math.PI * 2;
    blade.position.set(Math.cos(angle) * 0.7, 0, Math.sin(angle) * 0.7);
    blade.rotation.y = angle;
    blade.rotation.z = 0.05;
    ceoFanGroup.add(blade);
  }
  ceoFanGroup.position.set(0, FLOOR_Y + CEIL_H - 0.08, 0);
  group.add(ceoFanGroup);
  group.userData.ceilingFan = ceoFanGroup;
  console.log('[FIX] CEO suite ceiling fan rebuilt with 4 blades');

  // ===== WALL ART — framed colored rectangles =====
  const wallArtColors = [0x8b5cf6, 0x3b82f6, 0x06b6d4];
  const wallArtPositions = [
    { x: hw - 0.14, y: FLOOR_Y + 3.2, z: -4, rotY: -Math.PI / 2, w: 0.8, h: 0.6 },
    { x: -hw + 0.14, y: FLOOR_Y + 3.0, z: 4, rotY: Math.PI / 2, w: 0.6, h: 0.9 },
  ];
  wallArtPositions.forEach((wa, i) => {
    const artMat = new THREE.MeshBasicMaterial({ color: wallArtColors[i % wallArtColors.length] });
    const art = new THREE.Mesh(new THREE.PlaneGeometry(wa.w, wa.h), artMat);
    art.position.set(wa.x, wa.y, wa.z);
    art.rotation.y = wa.rotY;
    group.add(art);
    // Frame
    const frameMat2 = new THREE.MeshStandardMaterial({ color: 0x1a1520, roughness: 0.3, metalness: 0.4 });
    const frameThick = 0.04;
    const fw = wa.rotY === -Math.PI / 2 || wa.rotY === Math.PI / 2 ? frameThick : wa.w + 0.08;
    const fd = wa.rotY === -Math.PI / 2 || wa.rotY === Math.PI / 2 ? wa.w + 0.08 : frameThick;
    const frame = new THREE.Mesh(new THREE.BoxGeometry(fw, wa.h + 0.08, fd), frameMat2);
    frame.position.set(wa.x, wa.y, wa.z);
    group.add(frame);
  });

  // JARVIS — Meshy human with purple tint
  const jarvisMixer = null;
  const jarvisPosition = new THREE.Vector3(5, FLOOR_Y, -2);

  try {
    const { scene: jarvisModel } = await loadModel('/models/meshy/male_worker.glb');
    const box = new THREE.Box3().setFromObject(jarvisModel);
    const h = box.max.y - box.min.y;
    jarvisModel.scale.setScalar(1.8 / h);
    const sBox = new THREE.Box3().setFromObject(jarvisModel);
    jarvisModel.position.y = -sBox.min.y;
    jarvisModel.rotation.y = -Math.PI / 4;

    // Purple tint
    jarvisModel.traverse(c => {
      if (c.isMesh && c.material) {
        c.material = c.material.clone();
        c.material.color.lerp(new THREE.Color(0x8b5cf6), 0.25);
      }
    });

    const jarvisGroup = new THREE.Group();
    jarvisGroup.add(jarvisModel);
    jarvisGroup.position.copy(jarvisPosition);
    group.add(jarvisGroup);

    const tag = createNameTagWithStatus('JARVIS', 'green', '#8b5cf6');
    tag.position.set(0, 2.2, 0);
    jarvisGroup.add(tag);
    console.log('JARVIS: Meshy human loaded with purple tint');
  } catch (e) {
    console.warn('JARVIS model failed, using tag only:', e);
    const tag = createNameTagWithStatus('JARVIS', 'green', '#8b5cf6');
    tag.position.set(5, FLOOR_Y + 2.0, -2);
    group.add(tag);
  }

  // ==========================================================
  // BOARD MEETING ROOM (right-front zone, X: +3 to +9, Z: +1 to +7)
  // ==========================================================
  {
  const boardGroup = new THREE.Group();
  boardGroup.name = 'boardRoom';

  const boardX = 6, boardZ = 4;

  // Glass partition walls (L-shape enclosure)
  const boardGlassMat = new THREE.MeshPhysicalMaterial({
    color: 0xddeeff, transparent: true, opacity: 0.1,
    roughness: 0.02, metalness: 0.0,
    clearcoat: 1.0, clearcoatRoughness: 0.05,
    side: THREE.DoubleSide,
  });
  const boardFrameMat = new THREE.MeshStandardMaterial({
    color: 0x888899, metalness: 0.8, roughness: 0.2,
  });

  // Left wall (X=3, facing inward)
  const leftWall = new THREE.Mesh(new THREE.PlaneGeometry(6, 3.5), boardGlassMat);
  leftWall.position.set(3, FLOOR_Y + 2, boardZ);
  leftWall.rotation.y = Math.PI / 2;
  boardGroup.add(leftWall);
  // Frame posts
  for (const pz of [1, 4, 7]) {
    const post = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 3.5, 6), boardFrameMat);
    post.position.set(3, FLOOR_Y + 2, pz);
    boardGroup.add(post);
  }
  // Top frame
  const leftTop = new THREE.Mesh(new THREE.BoxGeometry(0.03, 0.03, 6.1), boardFrameMat);
  leftTop.position.set(3, FLOOR_Y + 3.75, boardZ);
  boardGroup.add(leftTop);

  // Back wall (Z=1, facing forward) — partial, leaves doorway
  const boardBackWall = new THREE.Mesh(new THREE.PlaneGeometry(3, 3.5), boardGlassMat);
  boardBackWall.position.set(7.5, FLOOR_Y + 2, 1);
  boardGroup.add(boardBackWall);

  // Conference table (oval-ish — elongated capsule top)
  const tableMat = new THREE.MeshPhysicalMaterial({
    color: 0x1a1210, roughness: 0.25, metalness: 0.15,
    clearcoat: 0.6, clearcoatRoughness: 0.1,
  });
  // Table top
  const tableTop = new THREE.Mesh(
    new THREE.CylinderGeometry(1.6, 1.6, 0.06, 16), tableMat
  );
  tableTop.position.set(boardX, FLOOR_Y + 0.78, boardZ);
  tableTop.scale.set(1, 1, 0.6);
  boardGroup.add(tableTop);
  // Table edge trim
  const tableEdge = new THREE.Mesh(
    new THREE.TorusGeometry(1.6, 0.02, 4, 24), tableMat
  );
  tableEdge.position.set(boardX, FLOOR_Y + 0.78, boardZ);
  tableEdge.rotation.x = Math.PI / 2;
  tableEdge.scale.set(1, 0.6, 1);
  boardGroup.add(tableEdge);
  // Table legs (4 corners)
  const tableLegMat = new THREE.MeshStandardMaterial({ color: 0x333344, metalness: 0.6, roughness: 0.3 });
  for (const [lx, lz] of [[-1, -0.6], [1, -0.6], [-1, 0.6], [1, 0.6]]) {
    const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.04, 0.75, 6), tableLegMat);
    leg.position.set(boardX + lx, FLOOR_Y + 0.38, boardZ + lz);
    boardGroup.add(leg);
  }

  // Chairs around table (8 chairs)
  const chairMat = new THREE.MeshPhysicalMaterial({
    color: 0x1a1a2e, roughness: 0.5, metalness: 0.05,
    clearcoat: 0.15,
  });
  const chairPositions = [
    { x: -1.3, z: 0, ry: Math.PI / 2 },
    { x: 1.3, z: 0, ry: -Math.PI / 2 },
    { x: -0.8, z: -0.85, ry: 0 },
    { x: 0, z: -0.85, ry: 0 },
    { x: 0.8, z: -0.85, ry: 0 },
    { x: -0.8, z: 0.85, ry: Math.PI },
    { x: 0, z: 0.85, ry: Math.PI },
    { x: 0.8, z: 0.85, ry: Math.PI },
  ];

  for (const cp of chairPositions) {
    const cg = new THREE.Group();
    // Seat
    const seat = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.06, 0.4), chairMat);
    seat.position.y = 0.45;
    cg.add(seat);
    // Back
    const back = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.5, 0.05), chairMat);
    back.position.set(0, 0.72, -0.17);
    cg.add(back);
    // Legs (5-star base)
    const baseMat = new THREE.MeshStandardMaterial({ color: 0x333344, metalness: 0.6, roughness: 0.3 });
    const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 0.4, 6), baseMat);
    pole.position.y = 0.22;
    cg.add(pole);
    for (let ai = 0; ai < 5; ai++) {
      const a = (ai / 5) * Math.PI * 2;
      const armMesh = new THREE.Mesh(new THREE.CylinderGeometry(0.01, 0.01, 0.2, 4), baseMat);
      armMesh.rotation.z = Math.PI / 2;
      armMesh.position.set(Math.cos(a) * 0.1, 0.03, Math.sin(a) * 0.1);
      armMesh.rotation.y = a;
      cg.add(armMesh);
    }

    cg.position.set(boardX + cp.x, FLOOR_Y, boardZ + cp.z);
    cg.rotation.y = cp.ry;
    boardGroup.add(cg);
  }

  // Board meeting display screen
  const boardScreenCanvas = document.createElement('canvas');
  boardScreenCanvas.width = 512;
  boardScreenCanvas.height = 256;
  const bsctx = boardScreenCanvas.getContext('2d');
  bsctx.fillStyle = '#080810';
  bsctx.fillRect(0, 0, 512, 256);
  // Logo gradient
  const bsGrad = bsctx.createLinearGradient(100, 0, 412, 0);
  bsGrad.addColorStop(0, '#8b5cf6');
  bsGrad.addColorStop(1, '#06b6d4');
  bsctx.fillStyle = bsGrad;
  bsctx.font = 'bold 36px "Segoe UI", system-ui, sans-serif';
  bsctx.textAlign = 'center';
  bsctx.fillText('CONDUIT AI', 256, 100);
  bsctx.fillStyle = '#94a3b8';
  bsctx.font = '22px "Segoe UI", system-ui, sans-serif';
  bsctx.fillText('Board Meeting', 256, 145);
  // Divider
  bsctx.strokeStyle = '#8b5cf6';
  bsctx.lineWidth = 1;
  bsctx.beginPath();
  bsctx.moveTo(150, 170);
  bsctx.lineTo(362, 170);
  bsctx.stroke();
  // Status text
  bsctx.fillStyle = '#64748b';
  bsctx.font = '16px monospace';
  bsctx.fillText('Q2 2026 — Strategic Review', 256, 200);

  const boardScreenTex = new THREE.CanvasTexture(boardScreenCanvas);
  boardScreenTex.colorSpace = THREE.SRGBColorSpace;
  const boardScreen = new THREE.Mesh(
    new THREE.PlaneGeometry(2.0, 1.0),
    new THREE.MeshStandardMaterial({
      map: boardScreenTex,
      emissive: new THREE.Color(0x8b5cf6),
      emissiveIntensity: 1.5,
      toneMapped: false,
    })
  );
  boardScreen.position.set(boardX, FLOOR_Y + 2.5, 1.05);
  boardGroup.add(boardScreen);

  // Screen bezel
  const bezelMat = new THREE.MeshStandardMaterial({ color: 0x111118, metalness: 0.5, roughness: 0.3 });
  const bezel = new THREE.Mesh(new THREE.BoxGeometry(2.1, 1.1, 0.04), bezelMat);
  bezel.position.set(boardX, FLOOR_Y + 2.5, 1.03);
  boardGroup.add(bezel);

  // Screen glow light
  const screenGlow = new THREE.PointLight(0x8b5cf6, 5, 6);
  screenGlow.position.set(boardX, FLOOR_Y + 2.5, 1.5);
  boardGroup.add(screenGlow);

  // "BOARD ROOM" sign on glass
  const brSignCanvas = document.createElement('canvas');
  brSignCanvas.width = 256;
  brSignCanvas.height = 48;
  const brctx = brSignCanvas.getContext('2d');
  brctx.clearRect(0, 0, 256, 48);
  brctx.fillStyle = 'rgba(10,11,16,0.6)';
  brctx.beginPath();
  brctx.roundRect(8, 6, 240, 36, 8);
  brctx.fill();
  brctx.fillStyle = '#8b5cf6';
  brctx.font = '500 18px sans-serif';
  brctx.textAlign = 'center';
  brctx.fillText('BOARD ROOM', 128, 30);
  const brSignTex = new THREE.CanvasTexture(brSignCanvas);
  brSignTex.colorSpace = THREE.SRGBColorSpace;
  const brSign = new THREE.Sprite(new THREE.SpriteMaterial({
    map: brSignTex, transparent: true,
  }));
  brSign.scale.set(1.5, 0.28, 1);
  brSign.position.set(3.1, FLOOR_Y + 3.2, boardZ);
  boardGroup.add(brSign);

  group.add(boardGroup);
  } // end board room scope

  scene.add(group);
  return { group, jarvisPosition, jarvisMixer };
}

function makeBox(w, h, d, x, y, z, mat) {
  const mesh = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat);
  mesh.position.set(x, y, z);
  return mesh;
}
