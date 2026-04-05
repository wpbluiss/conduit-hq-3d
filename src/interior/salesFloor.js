import * as THREE from 'three/webgpu';
import { LOBBY } from '../constants.js';
import { loadModel } from '../utils/modelLoader.js';
import { initAgentAnimation, captureModelBase, updateAgentAnimation } from '../npc/agentAnimator.js';
import { createAgentModel } from '../npc/agentModel.js';
import { createCharacterInstance, isCharacterModelAvailable } from '../npc/characterLoader.js';
import { createWalkingNpcs, updateWalkingNpcs } from '../npc/walkingNpc.js';

const FLOOR_Y = 50;
const FLOOR_W = LOBBY.width;
const FLOOR_D = LOBBY.depth;
const CEIL_H = 4;

const AGENTS = [
  { name: 'HUNTER',  status: 'green',  x: -6, z: -3 },
  { name: 'CLOSER',  status: 'green',  x: 0,  z: -3 },
  { name: 'STRIKER', status: 'yellow', x: 6,  z: -3 },
  { name: 'REX',     status: 'green',  x: -6, z: 3 },
  { name: 'DEMO',    status: 'yellow', x: 0,  z: 3 },
  { name: 'REPLY',   status: 'green',  x: 6,  z: 3 },
];

// ---- Animated screen state ----
const screenCanvases = [];
const screenTextures = [];
let screenTimer = 0;
let salesWalkingNpcs = [];

// Sales-specific screen content per agent (512x256 canvas)
function rV(base, pct = 10) { return base + base * (Math.random() * 2 - 1) * pct / 100; }

const SALES_SCREENS = [
  null, // HUNTER gets custom screen below
  (ctx, w, h) => { // CLOSER — email pipeline
    ctx.fillStyle = '#0a0814'; ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = '#3b82f6'; ctx.font = 'bold 28px sans-serif'; ctx.fillText('OUTREACH', 16, 36);
    ctx.fillStyle = '#94a3b8'; ctx.font = '20px monospace';
    ctx.fillText(`Sent: ${Math.floor(rV(142, 8))}`, 16, 76); ctx.fillText(`Opened: ${rV(68, 5).toFixed(0)}%`, 16, 108);
    ctx.fillText(`Replied: ${Math.floor(rV(19, 15))}`, 16, 140);
    ctx.fillStyle = '#3b82f6'; [140, 192, 112, 220, 168].forEach((v, i) => ctx.fillRect(16 + i * 96, h - v, 64, v));
  },
  (ctx, w, h) => { // STRIKER — call stats
    ctx.fillStyle = '#0a0a14'; ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = '#eab308'; ctx.font = 'bold 28px sans-serif'; ctx.fillText('CALLS', 16, 36);
    ctx.fillStyle = '#10b981'; ctx.font = '20px monospace';
    ctx.fillText(`Today: ${Math.floor(rV(14, 20))}`, 16, 76); ctx.fillText(`Connected: ${Math.floor(rV(9, 15))}`, 16, 108);
    ctx.fillText(`Booked: ${Math.floor(rV(3, 30))}`, 16, 140);
    ctx.strokeStyle = '#eab308'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(16, 200);
    for (let x = 16; x < w - 16; x += 6) ctx.lineTo(x, 190 + Math.sin(x * 0.08) * 30);
    ctx.stroke();
  },
  (ctx, w, h) => { // REX — CRM enrichment
    ctx.fillStyle = '#080e14'; ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = '#06b6d4'; ctx.font = 'bold 28px sans-serif'; ctx.fillText('CRM DATA', 16, 36);
    ctx.fillStyle = '#94a3b8'; ctx.font = '20px monospace';
    ctx.fillText(`Enriched: ${Math.floor(rV(28, 10))}`, 16, 76); ctx.fillText(`Phones: +${Math.floor(rV(12, 20))}`, 16, 108);
    ctx.fillText(`Dupes: ${Math.floor(rV(4, 30))}`, 16, 140);
    ctx.fillStyle = '#06b6d4'; ctx.fillRect(16, 180, w * 0.75, 20);
    ctx.fillStyle = '#e2e8f0'; ctx.font = '16px monospace'; ctx.fillText('92%', w * 0.75 + 24, 196);
  },
  (ctx, w, h) => { // DEMO — calendar
    ctx.fillStyle = '#0a0e14'; ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = '#10b981'; ctx.font = 'bold 28px sans-serif'; ctx.fillText('DEMOS TODAY', 16, 36);
    ['10:00 AM  ✓  Acme Corp', '2:00 PM  ●  TechFlow Inc', '4:00 PM  ○  DataBridge'].forEach((m, i) => {
      ctx.fillStyle = i === 0 ? '#10b981' : i === 1 ? '#eab308' : '#94a3b8';
      ctx.font = '20px monospace'; ctx.fillText(m, 16, 80 + i * 44);
    });
  },
  (ctx, w, h) => { // REPLY — inbox
    ctx.fillStyle = '#0a0814'; ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = '#8b5cf6'; ctx.font = 'bold 28px sans-serif'; ctx.fillText('INBOX', 16, 36);
    ctx.fillStyle = '#94a3b8'; ctx.font = '20px monospace';
    ctx.fillText(`New: ${Math.floor(rV(7, 25))}`, 16, 76); ctx.fillText(`Positive: ${Math.floor(rV(37, 10))}%`, 16, 108);
    ctx.fillText(`Auto-replied: ${Math.floor(rV(14, 15))}`, 16, 140);
    ctx.fillStyle = '#8b5cf6'; ctx.fillRect(16, 180, 190, 20);
    ctx.fillStyle = '#475569'; ctx.fillRect(206, 180, 280, 20);
  },
];

function randomDashboard(ctx, w, h) {
  ctx.fillStyle = '#0a0e1a'; ctx.fillRect(0, 0, w, h);
  const colors = ['#3b82f6', '#06b6d4', '#10b981', '#22d3ee', '#2563eb', '#0891b2'];
  for (let i = 0; i < 6; i++) {
    ctx.fillStyle = colors[Math.floor(Math.random() * colors.length)];
    ctx.fillRect(Math.random() * w * 0.7, h * 0.3 + Math.random() * h * 0.5, 40 + Math.random() * 120, 20 + Math.random() * 60);
  }
  ctx.fillStyle = '#22d3ee'; ctx.fillRect(16, 10, w - 32, 6);
  ctx.fillStyle = '#334155';
  for (let i = 0; i < 3; i++) ctx.fillRect(16, 30 + i * 24, 100 + Math.random() * 200, 10);
}

function updateScreens() {
  for (let i = 0; i < screenCanvases.length; i++) {
    const canvas = screenCanvases[i];
    const ctx = canvas.getContext('2d');
    randomDashboard(ctx, canvas.width, canvas.height);
    screenTextures[i].needsUpdate = true;
  }
}

// Sales ceiling fan reference
let salesCeilingFan = null;
export function setSalesCeilingFan(fan) { salesCeilingFan = fan; }

export function updateSalesFloor(time, playerPos) {
  // Update screens every ~10 seconds
  if (time - screenTimer > 3) {
    screenTimer = time;
    updateScreens();
  }
  // Ceiling fan rotation
  if (salesCeilingFan) salesCeilingFan.rotation.y += 0.008;
  // Procedural agent idle animations (typing, breathing, head look, swivel)
  const dt = time - (updateSalesFloor._lastAnimTime || 0);
  updateSalesFloor._lastAnimTime = time;
  const animDelta = Math.min(dt, 0.1);
  for (const g of npcGroups) {
    updateAgentAnimation(g, time, animDelta, playerPos);
  }
  // Walking NPCs
  updateWalkingNpcs(salesWalkingNpcs, animDelta, time);
}

// ---- Wall clock ----
function createWallClock(group, x, y, z, rotY) {
  const clockGroup = new THREE.Group();

  // Face (flat cylinder)
  const faceMat = new THREE.MeshBasicMaterial({ color: 0xf0f0f0 });
  const face = new THREE.Mesh(new THREE.CylinderGeometry(0.35, 0.35, 0.03, 24), faceMat);
  face.rotation.x = Math.PI / 2;
  clockGroup.add(face);

  // Rim
  const rimMat = new THREE.MeshStandardMaterial({ color: 0x222233, metalness: 0.8, roughness: 0.3 });
  const rim = new THREE.Mesh(new THREE.CylinderGeometry(0.38, 0.38, 0.05, 24), rimMat);
  rim.rotation.x = Math.PI / 2;
  clockGroup.add(rim);
  // Hollow out rim by adding inner face slightly forward
  const innerFace = new THREE.Mesh(new THREE.CylinderGeometry(0.34, 0.34, 0.02, 24), faceMat);
  innerFace.rotation.x = Math.PI / 2;
  innerFace.position.z = 0.02;
  clockGroup.add(innerFace);

  // Hour hand
  const hourHand = new THREE.Mesh(
    new THREE.BoxGeometry(0.025, 0.18, 0.01),
    new THREE.MeshBasicMaterial({ color: 0x111111 })
  );
  hourHand.geometry.translate(0, 0.09, 0);
  hourHand.position.z = 0.03;
  clockGroup.add(hourHand);

  // Minute hand
  const minuteHand = new THREE.Mesh(
    new THREE.BoxGeometry(0.018, 0.28, 0.01),
    new THREE.MeshBasicMaterial({ color: 0x111111 })
  );
  minuteHand.geometry.translate(0, 0.14, 0);
  minuteHand.position.z = 0.035;
  clockGroup.add(minuteHand);

  // Center dot
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

  // Store hands for animation
  clockGroup.userData.hourHand = hourHand;
  clockGroup.userData.minuteHand = minuteHand;

  return clockGroup;
}

// Module-level NPC groups for idle animation in updateSalesFloor
const npcGroups = [];
const wallClocks = [];

export function updateWallClocks() {
  const now = new Date();
  const hours = now.getHours() % 12;
  const minutes = now.getMinutes();
  const hourAngle = -((hours + minutes / 60) / 12) * Math.PI * 2;
  const minuteAngle = -(minutes / 60) * Math.PI * 2;

  for (const clock of wallClocks) {
    clock.userData.hourHand.rotation.z = hourAngle;
    clock.userData.minuteHand.rotation.z = minuteAngle;
  }
}

export async function createSalesFloor(scene) {
  const group = new THREE.Group();
  const hw = FLOOR_W / 2;
  const hd = FLOOR_D / 2;

  // Floor
  const floorMat = new THREE.MeshPhysicalMaterial({ color: 0x1a1a2e, roughness: 0.25, metalness: 0.08, clearcoat: 0.6, clearcoatRoughness: 0.15, envMapIntensity: 1.8, transparent: false });
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(FLOOR_W + 1, FLOOR_D + 1), floorMat);
  floor.rotation.x = -Math.PI / 2;
  floor.position.y = FLOOR_Y;
  floor.receiveShadow = true;
  group.add(floor);

  // Ceiling
  const ceilMat = new THREE.MeshStandardMaterial({ color: 0xe0d8cc, roughness: 0.8 });
  const ceiling = new THREE.Mesh(new THREE.PlaneGeometry(FLOOR_W, FLOOR_D), ceilMat);
  ceiling.rotation.x = Math.PI / 2;
  ceiling.position.y = FLOOR_Y + CEIL_H;
  group.add(ceiling);

  // Walls — Sales gets a subtle blue tint
  const salesWallColor = new THREE.Color(0x1e1e30).lerp(new THREE.Color(0x3b82f6), 0.12);
  const wallMat = new THREE.MeshStandardMaterial({
    color: salesWallColor, roughness: 0.5, metalness: 0.15,
    emissive: 0x3b82f6, emissiveIntensity: 0.02,
    side: THREE.DoubleSide,
  });

  // Back wall
  const backWall = new THREE.Mesh(new THREE.PlaneGeometry(FLOOR_W, CEIL_H), wallMat);
  backWall.position.set(0, FLOOR_Y + CEIL_H / 2, -hd);
  group.add(backWall);

  // Front wall
  const frontWall = new THREE.Mesh(new THREE.PlaneGeometry(FLOOR_W, CEIL_H), wallMat);
  frontWall.rotation.y = Math.PI;
  frontWall.position.set(0, FLOOR_Y + CEIL_H / 2, hd);
  group.add(frontWall);

  // Side walls
  [-1, 1].forEach((side) => {
    const wall = new THREE.Mesh(new THREE.PlaneGeometry(FLOOR_D, CEIL_H), wallMat);
    wall.rotation.y = -side * Math.PI / 2;
    wall.position.set(side * hw, FLOOR_Y + CEIL_H / 2, 0);
    group.add(wall);
  });

  // Lighting — Sales floor: bright, energetic blue-white with warm accents
  const ambient = new THREE.PointLight(0xf0f4ff, 65, 24, 2);
  ambient.position.set(0, FLOOR_Y + CEIL_H - 0.5, 0);
  ambient.castShadow = true;
  ambient.shadow.mapSize.set(512, 512);
  ambient.shadow.radius = 4;
  group.add(ambient);

  const light2 = new THREE.PointLight(0xf0f4ff, 42, 18, 2);
  light2.position.set(-6, FLOOR_Y + CEIL_H - 0.5, 0);
  group.add(light2);

  const light3 = new THREE.PointLight(0xf0f4ff, 42, 18, 2);
  light3.position.set(6, FLOOR_Y + CEIL_H - 0.5, 0);
  group.add(light3);

  // Blue accent fill lights — stronger for sales energy
  const salesFill1 = new THREE.PointLight(0x3b82f6, 12, 12, 2);
  salesFill1.position.set(-hw + 1, FLOOR_Y + 1.5, -4);
  group.add(salesFill1);
  const salesFill2 = new THREE.PointLight(0x3b82f6, 12, 12, 2);
  salesFill2.position.set(hw - 1, FLOOR_Y + 1.5, 4);
  group.add(salesFill2);

  // Warm under-desk glow
  const underGlow = new THREE.PointLight(0xffe8c0, 5, 10, 2);
  underGlow.position.set(0, FLOOR_Y + 0.3, 0);
  group.add(underGlow);

  // Floor label
  const labelCanvas = document.createElement('canvas');
  labelCanvas.width = 512;
  labelCanvas.height = 64;
  const lctx = labelCanvas.getContext('2d');
  lctx.fillStyle = '#1a1a2e';
  lctx.fillRect(0, 0, 512, 64);
  lctx.fillStyle = '#3b82f6';
  lctx.font = 'bold 36px sans-serif';
  lctx.textAlign = 'center';
  lctx.textBaseline = 'middle';
  lctx.fillText('SALES FLOOR', 256, 32);
  const labelTex = new THREE.CanvasTexture(labelCanvas);
  labelTex.colorSpace = THREE.SRGBColorSpace;
  const labelMesh = new THREE.Mesh(
    new THREE.PlaneGeometry(4, 0.5),
    new THREE.MeshBasicMaterial({ map: labelTex })
  );
  labelMesh.position.set(0, FLOOR_Y + CEIL_H - 0.5, hd - 0.2);
  labelMesh.rotation.y = Math.PI;
  group.add(labelMesh);

  // ===== DESKS AND AGENTS =====
  const agentSlots = [];
  const agentPositions = [];
  const deskMat = new THREE.MeshPhysicalMaterial({ color: 0x1a1520, roughness: 0.3, metalness: 0.1, clearcoat: 0.4, clearcoatRoughness: 0.2 });
  const deskGeo = new THREE.BoxGeometry(2.2, 0.8, 1.2);
  const mixers = [];

  for (let ai = 0; ai < AGENTS.length; ai++) {
    const agent = AGENTS[ai];
    // Desk
    const desk = new THREE.Mesh(deskGeo, deskMat);
    desk.position.set(agent.x, FLOOR_Y + 0.4, agent.z);
    desk.castShadow = true;
    desk.receiveShadow = true;
    group.add(desk);

    // Monitor on desk — face toward the chair side (toward center)
    const monitorZDir = agent.z < 0 ? 1 : -1; // push monitor toward far side, screen faces chair
    const monitorMat = new THREE.MeshStandardMaterial({ color: 0x111122, roughness: 0.15, metalness: 0.5 });
    const monitor = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.5, 0.05), monitorMat);
    monitor.position.set(agent.x, FLOOR_Y + 1.05, agent.z - 0.3 * monitorZDir);
    group.add(monitor);

    // Animated screen (CanvasTexture)
    const screenCanvas = document.createElement('canvas');
    screenCanvas.width = 512;
    screenCanvas.height = 256;
    const sctx = screenCanvas.getContext('2d');

    if (ai === 0) {
      // HUNTER's screen: "5 NEW LEADS FOUND" with green glow
      sctx.fillStyle = '#060e08';
      sctx.fillRect(0, 0, 128, 64);
      sctx.shadowColor = '#10b981';
      sctx.shadowBlur = 8;
      sctx.fillStyle = '#10b981';
      sctx.font = 'bold 48px monospace';
      sctx.textAlign = 'center';
      sctx.fillText('5 NEW LEADS', 256, 100);
      sctx.font = 'bold 36px monospace';
      sctx.fillText('FOUND', 256, 160);
      sctx.shadowBlur = 0;
      sctx.strokeStyle = '#10b981';
      sctx.lineWidth = 3;
      sctx.strokeRect(12, 12, 488, 232);
    } else if (SALES_SCREENS[ai]) {
      SALES_SCREENS[ai](sctx, 512, 256);
    } else {
      randomDashboard(sctx, 512, 256);
    }

    const screenTex = new THREE.CanvasTexture(screenCanvas);
    screenTex.colorSpace = THREE.SRGBColorSpace;

    // Only animate non-HUNTER screens
    if (ai !== 0) {
      screenCanvases.push(screenCanvas);
      screenTextures.push(screenTex);
    }

    // Screen on FRONT face of monitor — emissive glow
    const screenMatAnimated = new THREE.MeshStandardMaterial({
      map: screenTex, side: THREE.DoubleSide,
      emissive: 0xffffff, emissiveMap: screenTex, emissiveIntensity: 2.5,
      toneMapped: false,
    });
    const screen = new THREE.Mesh(new THREE.PlaneGeometry(0.7, 0.4), screenMatAnimated);
    screen.position.set(agent.x, FLOOR_Y + 1.05, agent.z - 0.274 * monitorZDir);
    if (agent.z > 0) screen.rotation.y = Math.PI;
    group.add(screen);

    // Screen glow — colored PointLight near each monitor
    const screenGlow = new THREE.PointLight(
      ai === 0 ? 0x10b981 : ai <= 2 ? 0x3b82f6 : 0x06b6d4,
      4, 4, 2
    );
    screenGlow.position.set(agent.x, FLOOR_Y + 1.0, agent.z);
    group.add(screenGlow);


    // Agent sits IN the chair, facing their desk/monitor
    const chairZ = agent.z < 0 ? agent.z + 1.0 : agent.z - 1.0;   // chair side (toward center)
    // Face TOWARD the desk: top row faces -z, bottom row faces +z
    const faceDir = agent.z < 0 ? Math.PI : 0;
    agentSlots.push({ x: agent.x, z: chairZ, faceZ: faceDir, name: agent.name, status: agent.status });
  }

  // ===== AGENTS for ALL desks (rigged or procedural fallback) =====
  const skinTones = [0xFFDBAC, 0xF1C27D, 0xE0AC69, 0xC68642, 0x8D5524, 0x5C3A1E];
  const suitColors = [0x1a237e, 0x1a1a50, 0x1e2060];

  for (let i = 0; i < agentSlots.length; i++) {
    const slot = agentSlots[i];
    agentPositions.push({ x: slot.x, z: slot.z });

    const agentGroup = new THREE.Group();
    agentGroup.position.set(slot.x, FLOOR_Y, slot.z);
    agentGroup.userData.baseY = FLOOR_Y;
    agentGroup.userData.phase = i * 1.7;

    const charInstance = isCharacterModelAvailable()
      ? createCharacterInstance(i, 'Sales', FLOOR_Y)
      : null;

    if (charInstance) {
      charInstance.model.rotation.y = slot.faceZ;
      agentGroup.add(charInstance.model);
      agentGroup.userData.model = charInstance.model;
      agentGroup.userData.bones = charInstance.bones;
      agentGroup.userData.mixer = charInstance.mixer;
      if (charInstance.mixer) mixers.push(charInstance.mixer);
    } else {
      const isFemale = i % 2 === 0;
      const { group: agentMesh, parts } = createAgentModel({
        bodyColor: suitColors[i % suitColors.length],
        skinColor: skinTones[i % skinTones.length],
        accentColor: 0x3b82f6, isFemale,
      });
      agentMesh.rotation.y = slot.faceZ;
      agentGroup.add(agentMesh);
      agentGroup.userData.model = agentMesh;
      agentGroup.userData.parts = parts;
    }

    group.add(agentGroup);
    npcGroups.push(agentGroup);
    captureModelBase(agentGroup);
    initAgentAnimation(agentGroup, i + FLOOR_Y, 'Sales', slot.name);

    const tag = createNameTagWithStatus(slot.name, slot.status);
    tag.position.set(0, charInstance ? 2.1 : 1.6, 0);
    agentGroup.add(tag);
  }
  console.log(`Sales Floor: ${agentSlots.length} agents (rigged: ${isCharacterModelAvailable()})`);

  // ===== #4: WALL CLOCK =====
  const clock = createWallClock(group, hw - 0.1, FLOOR_Y + CEIL_H - 0.6, 0, -Math.PI / 2);
  wallClocks.push(clock);

  // ===== #5: CONDUIT AI LOGO on back wall =====
  const logoCanvas = document.createElement('canvas');
  logoCanvas.width = 512;
  logoCanvas.height = 128;
  const logoCtx = logoCanvas.getContext('2d');
  logoCtx.fillStyle = '#1e1e30';
  logoCtx.fillRect(0, 0, 512, 128);
  logoCtx.font = 'bold 60px Arial, sans-serif';
  logoCtx.textAlign = 'center';
  logoCtx.textBaseline = 'middle';
  const logoGrad = logoCtx.createLinearGradient(80, 0, 432, 0);
  logoGrad.addColorStop(0, '#3b82f6');
  logoGrad.addColorStop(1, '#06b6d4');
  logoCtx.fillStyle = logoGrad;
  logoCtx.fillText('CONDUIT AI', 256, 64);
  const logoTex = new THREE.CanvasTexture(logoCanvas);
  logoTex.colorSpace = THREE.SRGBColorSpace;
  const logoMesh = new THREE.Mesh(
    new THREE.PlaneGeometry(5, 1.2),
    new THREE.MeshBasicMaterial({ map: logoTex })
  );
  logoMesh.position.set(0, FLOOR_Y + CEIL_H - 1.2, -hd + 0.2);
  group.add(logoMesh);

  // ===== #6: WHITEBOARD on side wall =====
  const wbCanvas = document.createElement('canvas');
  wbCanvas.width = 256;
  wbCanvas.height = 256;
  const wbCtx = wbCanvas.getContext('2d');
  wbCtx.fillStyle = '#f5f5f5';
  wbCtx.fillRect(0, 0, 256, 256);
  // Fake scribbles
  wbCtx.strokeStyle = '#2255aa';
  wbCtx.lineWidth = 2;
  wbCtx.beginPath(); wbCtx.moveTo(20, 30); wbCtx.lineTo(120, 30); wbCtx.stroke();
  wbCtx.beginPath(); wbCtx.moveTo(20, 50); wbCtx.lineTo(180, 50); wbCtx.stroke();
  wbCtx.strokeStyle = '#cc3333';
  wbCtx.beginPath(); wbCtx.moveTo(20, 80); wbCtx.lineTo(100, 120); wbCtx.lineTo(160, 90); wbCtx.stroke();
  wbCtx.strokeStyle = '#22aa55';
  wbCtx.strokeRect(30, 140, 80, 60);
  wbCtx.strokeRect(130, 140, 80, 60);
  wbCtx.fillStyle = '#333';
  wbCtx.font = '14px sans-serif';
  wbCtx.fillText('Q4 Targets', 20, 230);
  const wbTex = new THREE.CanvasTexture(wbCanvas);
  wbTex.colorSpace = THREE.SRGBColorSpace;
  const whiteboard = new THREE.Mesh(
    new THREE.PlaneGeometry(2.5, 1.8),
    new THREE.MeshBasicMaterial({ map: wbTex })
  );
  whiteboard.position.set(-hw + 0.2, FLOOR_Y + 2.2, 2);
  whiteboard.rotation.y = Math.PI / 2;
  group.add(whiteboard);

  // ===== #6: WATER COOLER =====
  const wcGroup = new THREE.Group();
  const wcBottom = new THREE.Mesh(
    new THREE.CylinderGeometry(0.18, 0.18, 0.6, 8),
    new THREE.MeshStandardMaterial({ color: 0xdddddd, roughness: 0.5 })
  );
  wcBottom.position.y = 0.3;
  wcGroup.add(wcBottom);
  const wcTop = new THREE.Mesh(
    new THREE.CylinderGeometry(0.12, 0.15, 0.4, 8),
    new THREE.MeshStandardMaterial({ color: 0x2255cc, roughness: 0.3 })
  );
  wcTop.position.y = 0.8;
  wcGroup.add(wcTop);
  wcGroup.position.set(-hw + 1, FLOOR_Y, -hd + 1);
  group.add(wcGroup);

  // ===== POTTED PLANTS in corners =====
  const potMat = new THREE.MeshPhysicalMaterial({ color: 0x2a2a30, roughness: 0.3, clearcoat: 0.5 });
  const leafMat = new THREE.MeshStandardMaterial({ color: 0x1d5e15, roughness: 0.6 });
  const plantCorners = [[-hw + 0.8, hd - 0.8], [hw - 0.8, hd - 0.8], [-hw + 0.8, -hd + 0.8]];
  for (const [px, pz] of plantCorners) {
    const pot = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.14, 0.4, 8), potMat);
    pot.position.set(px, FLOOR_Y + 0.2, pz);
    group.add(pot);
    const soil = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.16, 0.04, 8),
      new THREE.MeshStandardMaterial({ color: 0x3d2b1f, roughness: 0.9 }));
    soil.position.set(px, FLOOR_Y + 0.42, pz);
    group.add(soil);
    [[0, 0.65, 0, 0.22], [0.08, 0.8, 0.06, 0.16], [-0.06, 0.75, -0.05, 0.14]].forEach(([lx, ly, lz, lr]) => {
      const leaf = new THREE.Mesh(new THREE.IcosahedronGeometry(lr, 1), leafMat);
      leaf.position.set(px + lx, FLOOR_Y + ly, pz + lz);
      group.add(leaf);
    });
  }

  // ===== TRASH CANS =====
  const trashMat = new THREE.MeshStandardMaterial({ color: 0x222233, roughness: 0.6 });
  const trash2 = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.15, 0.4, 6), trashMat);
  trash2.position.set(hw - 1.5, FLOOR_Y + 0.2, hd - 1);
  group.add(trash2);
  const trash3 = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.15, 0.4, 6), trashMat);
  trash3.position.set(-2, FLOOR_Y + 0.2, -hd + 0.5);
  group.add(trash3);

  // ===== COFFEE MUGS on desks =====
  const mugColors = [0xeeeeee, 0xcc3333, 0x3366cc, 0x228844];
  for (let i = 0; i < AGENTS.length; i++) {
    if (i % 3 === 2) continue;
    const a = AGENTS[i];
    const mugColor = mugColors[i % mugColors.length];
    const mug = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.025, 0.06, 6),
      new THREE.MeshStandardMaterial({ color: mugColor, roughness: 0.4 }));
    mug.position.set(a.x + 0.4, FLOOR_Y + 0.83, a.z + 0.15);
    group.add(mug);
  }

  // ===== PAPER STACKS on desks =====
  const paperMat = new THREE.MeshStandardMaterial({ color: 0xf0f0e8, roughness: 0.8 });
  for (let i = 0; i < AGENTS.length; i += 2) {
    const a = AGENTS[i];
    for (let s = 0; s < 4; s++) {
      const sheet = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.003, 0.14), paperMat);
      sheet.position.set(a.x - 0.6, FLOOR_Y + 0.81 + s * 0.004, a.z + 0.3);
      sheet.rotation.y = 0.02 * s;
      group.add(sheet);
    }
  }

  // ===== KEYBOARDS on desks =====
  const kbMat = new THREE.MeshStandardMaterial({ color: 0x111118, roughness: 0.4 });
  for (const a of AGENTS) {
    const kb = new THREE.Mesh(new THREE.BoxGeometry(0.35, 0.015, 0.12), kbMat);
    kb.position.set(a.x, FLOOR_Y + 0.81, a.z + 0.4);
    group.add(kb);
  }

  // ===== #6: FILING CABINETS =====
  const cabinetMat = new THREE.MeshStandardMaterial({ color: 0x222233, roughness: 0.5, metalness: 0.3 });
  for (let ci = 0; ci < 2; ci++) {
    const cabinet = new THREE.Mesh(
      new THREE.BoxGeometry(0.6, 1.4, 0.5),
      cabinetMat
    );
    cabinet.position.set(3 + ci * 0.8, FLOOR_Y + 0.7, -hd + 0.4);
    group.add(cabinet);
  }

  // ===== #6: PRINTER =====
  const printer = new THREE.Mesh(
    new THREE.BoxGeometry(0.6, 0.35, 0.5),
    new THREE.MeshStandardMaterial({ color: 0x1a1a22, roughness: 0.4, metalness: 0.2 })
  );
  printer.position.set(5, FLOOR_Y + 0.175, -hd + 0.4);
  group.add(printer);
  // Green LED
  const led = new THREE.Mesh(
    new THREE.BoxGeometry(0.04, 0.04, 0.04),
    new THREE.MeshBasicMaterial({ color: 0x00ff44 })
  );
  led.position.set(5.15, FLOOR_Y + 0.37, -hd + 0.25);
  group.add(led);

  // ===== LEADERBOARD on side wall =====
  const lbCanvas = document.createElement('canvas');
  lbCanvas.width = 512;
  lbCanvas.height = 512;
  const lbCtx = lbCanvas.getContext('2d');
  lbCtx.fillStyle = '#060a10';
  lbCtx.fillRect(0, 0, 512, 512);
  lbCtx.strokeStyle = '#3b82f6';
  lbCtx.lineWidth = 3;
  lbCtx.strokeRect(6, 6, 500, 500);
  lbCtx.shadowColor = '#3b82f6';
  lbCtx.shadowBlur = 10;
  lbCtx.fillStyle = '#3b82f6';
  lbCtx.font = 'bold 28px monospace';
  lbCtx.textAlign = 'center';
  lbCtx.fillText('SALES LEADERBOARD', 256, 50);
  lbCtx.shadowBlur = 0;
  // Leaderboard entries
  const leaders = [
    ['1. HUNTER', '42 leads', '#fbbf24'],
    ['2. CLOSER', '38 emails', '#c0c0c0'],
    ['3. STRIKER', '28 calls', '#cd7f32'],
    ['4. REX', '24 enriched', '#94a3b8'],
    ['5. DEMO', '18 demos', '#94a3b8'],
    ['6. REPLY', '52 replies', '#94a3b8'],
  ];
  leaders.forEach(([name, stat, color], i) => {
    const y = 100 + i * 62;
    lbCtx.fillStyle = 'rgba(30,30,60,0.5)';
    lbCtx.fillRect(30, y - 18, 452, 48);
    lbCtx.fillStyle = color;
    lbCtx.font = 'bold 22px monospace';
    lbCtx.textAlign = 'left';
    lbCtx.fillText(name, 50, y + 10);
    lbCtx.fillStyle = '#10b981';
    lbCtx.font = '18px monospace';
    lbCtx.textAlign = 'right';
    lbCtx.fillText(stat, 460, y + 10);
  });
  const lbTex = new THREE.CanvasTexture(lbCanvas);
  lbTex.colorSpace = THREE.SRGBColorSpace;
  const lbScreen = new THREE.Mesh(
    new THREE.PlaneGeometry(2.5, 2.5),
    new THREE.MeshBasicMaterial({ map: lbTex })
  );
  lbScreen.rotation.y = -Math.PI / 2;
  lbScreen.position.set(hw - 0.2, FLOOR_Y + 2.2, -2);
  group.add(lbScreen);

  // ===== PEN HOLDERS on some desks =====
  const penHolderMat = new THREE.MeshStandardMaterial({ color: 0x333344, roughness: 0.4 });
  for (let i = 0; i < AGENTS.length; i += 3) {
    const a = AGENTS[i];
    const holder = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.08, 6), penHolderMat);
    holder.position.set(a.x + 0.7, FLOOR_Y + 0.85, a.z + 0.2);
    group.add(holder);
    // Pen sticking out
    const pen = new THREE.Mesh(new THREE.BoxGeometry(0.008, 0.1, 0.008),
      new THREE.MeshStandardMaterial({ color: 0x2222cc }));
    pen.position.set(a.x + 0.7, FLOOR_Y + 0.94, a.z + 0.2);
    pen.rotation.z = 0.15;
    group.add(pen);
  }

  // ===== FIRE EXTINGUISHER =====
  const feMatS = new THREE.MeshStandardMaterial({ color: 0xcc2222, roughness: 0.4 });
  const feS = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 0.3, 6), feMatS);
  feS.position.set(-hw + 0.3, FLOOR_Y + 0.15, -hd + 0.2);
  group.add(feS);

  // ===== #7: PARTITION WALLS =====
  const partitionMat = new THREE.MeshStandardMaterial({ color: 0x2a2a3a, roughness: 0.8 });
  const partition = new THREE.Mesh(
    new THREE.BoxGeometry(FLOOR_W - 2, 1.3, 0.08),
    partitionMat
  );
  partition.position.set(0, FLOOR_Y + 0.65, 0);
  group.add(partition);

  // ===== DESK CHAIRS =====
  const chairMatS = new THREE.MeshStandardMaterial({ color: 0x1a1a2e, roughness: 0.5 });
  const chairLegMatS = new THREE.MeshStandardMaterial({ color: 0x333344, roughness: 0.3, metalness: 0.5 });
  for (const slot of agentSlots) {
    const cz = slot.z; // chair sits at agent position (toward center, facing desk)
    // Seat
    const seat = new THREE.Mesh(new THREE.BoxGeometry(0.45, 0.06, 0.45), chairMatS);
    seat.position.set(slot.x, FLOOR_Y + 0.48, cz);
    group.add(seat);
    // Back — on the side AWAY from desk so occupant faces desk/monitor
    const backDir = cz < 0 ? 0.25 : -0.25;
    const cBack = new THREE.Mesh(new THREE.BoxGeometry(0.45, 0.4, 0.05), chairMatS);
    cBack.position.set(slot.x, FLOOR_Y + 0.7, cz + backDir);
    group.add(cBack);
    // Pedestal
    const pedestal = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.45, 6), chairLegMatS);
    pedestal.position.set(slot.x, FLOOR_Y + 0.24, cz);
    group.add(pedestal);
  }

  // ===== SMOKE DETECTOR =====
  const smokeMat = new THREE.MeshStandardMaterial({ color: 0xdddddd, roughness: 0.4 });
  const smokeDetector = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.07, 0.025, 8), smokeMat);
  smokeDetector.position.set(3, FLOOR_Y + CEIL_H - 0.01, -1);
  group.add(smokeDetector);

  // ===== #8: CEILING LIGHT PANELS =====
  const ceilPanelMat = new THREE.MeshBasicMaterial({ color: 0xfff8ee });
  const ceilPanelGeo = new THREE.PlaneGeometry(2, 1);
  const panelPositions = [[-5, -4], [0, -4], [5, -4], [-5, 4], [0, 4], [5, 4]];
  for (const [px, pz] of panelPositions) {
    const panel = new THREE.Mesh(ceilPanelGeo, ceilPanelMat);
    panel.rotation.x = Math.PI / 2;
    panel.position.set(px, FLOOR_Y + CEIL_H - 0.02, pz);
    group.add(panel);
  }

  // ===== #9: PIPELINE DISPLAY (large, with glow) =====
  const pipeCanvas = document.createElement('canvas');
  pipeCanvas.width = 1024;
  pipeCanvas.height = 512;
  const pctx = pipeCanvas.getContext('2d');
  pctx.fillStyle = '#060a10';
  pctx.fillRect(0, 0, 1024, 512);
  // Glow effect — draw text with shadow
  pctx.shadowColor = '#10b981';
  pctx.shadowBlur = 30;
  pctx.fillStyle = '#10b981';
  pctx.font = 'bold 80px monospace';
  pctx.textAlign = 'center';
  pctx.fillText('PIPELINE: $89,895', 512, 120);
  pctx.shadowColor = '#22d3ee';
  pctx.fillStyle = '#22d3ee';
  pctx.font = 'bold 56px monospace';
  pctx.fillText('LEADS TODAY: 8', 512, 240);
  pctx.shadowColor = '#3b82f6';
  pctx.fillStyle = '#3b82f6';
  pctx.font = 'bold 48px monospace';
  pctx.fillText('AGENTS ACTIVE: 35/35', 512, 350);
  pctx.shadowBlur = 0;
  // Border with glow
  pctx.strokeStyle = '#10b981';
  pctx.lineWidth = 4;
  pctx.shadowColor = '#10b981';
  pctx.shadowBlur = 15;
  pctx.strokeRect(8, 8, 1008, 496);
  const pipeTex = new THREE.CanvasTexture(pipeCanvas);
  pipeTex.colorSpace = THREE.SRGBColorSpace;
  const pipeScreen = new THREE.Mesh(
    new THREE.PlaneGeometry(6, 3),
    new THREE.MeshBasicMaterial({ map: pipeTex })
  );
  pipeScreen.rotation.y = Math.PI;
  pipeScreen.position.set(0, FLOOR_Y + 2.5, hd - 0.2);
  group.add(pipeScreen);

  // ===== SALES TROPHY / BELL (ring the bell!) =====
  const bellStandMat = new THREE.MeshStandardMaterial({ color: 0x2a1a0a, roughness: 0.4 });
  const bellStand = new THREE.Mesh(new THREE.BoxGeometry(0.3, 1.0, 0.3), bellStandMat);
  bellStand.position.set(-hw + 0.5, FLOOR_Y + 0.5, 0);
  group.add(bellStand);
  // Bell on top
  const bellMat = new THREE.MeshStandardMaterial({ color: 0xdaa520, roughness: 0.2, metalness: 0.8 });
  const bell = new THREE.Mesh(new THREE.SphereGeometry(0.1, 8, 6, 0, Math.PI * 2, 0, Math.PI / 2), bellMat);
  bell.position.set(-hw + 0.5, FLOOR_Y + 1.05, 0);
  group.add(bell);
  // Bell label
  const bellCanvas = document.createElement('canvas');
  bellCanvas.width = 128;
  bellCanvas.height = 64;
  const blCtx = bellCanvas.getContext('2d');
  blCtx.fillStyle = '#2a1a0a';
  blCtx.fillRect(0, 0, 128, 64);
  blCtx.fillStyle = '#daa520';
  blCtx.font = 'bold 12px sans-serif';
  blCtx.textAlign = 'center';
  blCtx.textBaseline = 'middle';
  blCtx.fillText('RING THE BELL', 64, 20);
  blCtx.fillText('WHEN YOU CLOSE!', 64, 42);
  const bellTex = new THREE.CanvasTexture(bellCanvas);
  bellTex.colorSpace = THREE.SRGBColorSpace;
  const bellLabel = new THREE.Mesh(
    new THREE.PlaneGeometry(0.28, 0.14),
    new THREE.MeshBasicMaterial({ map: bellTex })
  );
  bellLabel.rotation.y = Math.PI / 2;
  bellLabel.position.set(-hw + 0.35, FLOOR_Y + 0.85, 0);
  group.add(bellLabel);

  // ===== BLUE LED STRIP along top of walls =====
  const ledMat = new THREE.MeshBasicMaterial({ color: 0x3b82f6 });
  const ledH = 0.06;
  const ledD = 0.04;
  const ledY = FLOOR_Y + CEIL_H - 0.1;
  // Back wall
  group.add(new THREE.Mesh(new THREE.BoxGeometry(FLOOR_W, ledH, ledD), ledMat).translateX(0).translateY(ledY).translateZ(-hd + 0.05));
  // Front wall
  group.add(new THREE.Mesh(new THREE.BoxGeometry(FLOOR_W, ledH, ledD), ledMat).translateX(0).translateY(ledY).translateZ(hd - 0.05));
  // Side walls
  group.add(new THREE.Mesh(new THREE.BoxGeometry(ledD, ledH, FLOOR_D), ledMat).translateX(-hw + 0.05).translateY(ledY).translateZ(0));
  group.add(new THREE.Mesh(new THREE.BoxGeometry(ledD, ledH, FLOOR_D), ledMat).translateX(hw - 0.05).translateY(ledY).translateZ(0));

  // ===== #18: BASEBOARDS =====
  const bbMat = new THREE.MeshStandardMaterial({ color: 0x0f0f18, roughness: 0.5 });
  const bbH = 0.08;
  // Back wall
  group.add(createBaseboard(FLOOR_W, bbH, 0.04, 0, FLOOR_Y + bbH / 2, -hd + 0.02, bbMat));
  // Front wall
  group.add(createBaseboard(FLOOR_W, bbH, 0.04, 0, FLOOR_Y + bbH / 2, hd - 0.02, bbMat));
  // Side walls
  group.add(createBaseboard(0.04, bbH, FLOOR_D, -hw + 0.02, FLOOR_Y + bbH / 2, 0, bbMat));
  group.add(createBaseboard(0.04, bbH, FLOOR_D, hw - 0.02, FLOOR_Y + bbH / 2, 0, bbMat));

  // ===== #19: ELEVATOR DOOR FRAME =====
  const frameMat = new THREE.MeshStandardMaterial({ color: 0x444455, metalness: 0.8, roughness: 0.2 });
  // Frame around elevator area at back wall (z = -hd), centered at x=0
  const frameW = 2.2, frameH = 3.2;
  // Left pillar
  group.add(createBox(0.1, frameH, 0.1, -frameW / 2, FLOOR_Y + frameH / 2, -hd + 0.15, frameMat));
  // Right pillar
  group.add(createBox(0.1, frameH, 0.1, frameW / 2, FLOOR_Y + frameH / 2, -hd + 0.15, frameMat));
  // Top bar
  group.add(createBox(frameW + 0.1, 0.1, 0.1, 0, FLOOR_Y + frameH, -hd + 0.15, frameMat));

  // ===== FLOOR INDICATOR above elevator =====
  const indCanvas = document.createElement('canvas');
  indCanvas.width = 128;
  indCanvas.height = 64;
  const indCtx = indCanvas.getContext('2d');
  indCtx.fillStyle = '#0a0b10';
  indCtx.fillRect(0, 0, 128, 64);
  indCtx.fillStyle = '#3b82f6';
  indCtx.font = 'bold 32px monospace';
  indCtx.textAlign = 'center';
  indCtx.textBaseline = 'middle';
  indCtx.fillText('SALES', 64, 32);
  const indTex = new THREE.CanvasTexture(indCanvas);
  indTex.colorSpace = THREE.SRGBColorSpace;
  const indMesh = new THREE.Mesh(
    new THREE.PlaneGeometry(0.8, 0.4),
    new THREE.MeshBasicMaterial({ map: indTex })
  );
  indMesh.position.set(0, FLOOR_Y + frameH + 0.3, -hd + 0.16);
  group.add(indMesh);

  // ===== QUOTA THERMOMETER on left wall =====
  const thermoCanvas = document.createElement('canvas');
  thermoCanvas.width = 128;
  thermoCanvas.height = 512;
  const tCtx = thermoCanvas.getContext('2d');
  tCtx.fillStyle = '#060a10';
  tCtx.fillRect(0, 0, 128, 512);
  tCtx.strokeStyle = '#3b82f6';
  tCtx.lineWidth = 2;
  tCtx.strokeRect(4, 4, 120, 504);
  // Title
  tCtx.fillStyle = '#3b82f6';
  tCtx.font = 'bold 14px sans-serif';
  tCtx.textAlign = 'center';
  tCtx.fillText('MONTHLY', 64, 30);
  tCtx.fillText('QUOTA', 64, 48);
  // Thermometer tube
  tCtx.strokeStyle = '#334155';
  tCtx.lineWidth = 2;
  tCtx.strokeRect(44, 70, 40, 360);
  // Fill level (72%)
  const fillH = 360 * 0.72;
  const gradient = tCtx.createLinearGradient(0, 430 - fillH, 0, 430);
  gradient.addColorStop(0, '#10b981');
  gradient.addColorStop(1, '#059669');
  tCtx.fillStyle = gradient;
  tCtx.fillRect(46, 70 + (360 - fillH), 36, fillH);
  // Markers
  for (let p = 0; p <= 100; p += 25) {
    const my = 430 - (360 * p / 100);
    tCtx.strokeStyle = '#475569';
    tCtx.lineWidth = 1;
    tCtx.beginPath();
    tCtx.moveTo(30, my);
    tCtx.lineTo(44, my);
    tCtx.stroke();
    tCtx.fillStyle = '#94a3b8';
    tCtx.font = '10px monospace';
    tCtx.textAlign = 'right';
    tCtx.fillText(p + '%', 28, my + 4);
  }
  // Current value
  tCtx.fillStyle = '#10b981';
  tCtx.font = 'bold 24px monospace';
  tCtx.textAlign = 'center';
  tCtx.fillText('72%', 64, 470);
  tCtx.fillStyle = '#64748b';
  tCtx.font = '10px sans-serif';
  tCtx.fillText('$89.9K / $125K', 64, 492);

  const thermoTex = new THREE.CanvasTexture(thermoCanvas);
  thermoTex.colorSpace = THREE.SRGBColorSpace;
  const thermoBoard = new THREE.Mesh(
    new THREE.PlaneGeometry(0.6, 2.4),
    new THREE.MeshBasicMaterial({ map: thermoTex })
  );
  thermoBoard.rotation.y = Math.PI / 2;
  thermoBoard.position.set(-hw + 0.2, FLOOR_Y + 2.0, -3);
  group.add(thermoBoard);

  // ===== HEADSET STAND on corner desk =====
  const headsetStandMat = new THREE.MeshStandardMaterial({ color: 0x333344, roughness: 0.3, metalness: 0.5 });
  const hStandBase = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.06, 0.02, 8), headsetStandMat);
  hStandBase.position.set(AGENTS[3].x + 0.7, FLOOR_Y + 0.82, AGENTS[3].z + 0.1);
  group.add(hStandBase);
  const hStandPole = new THREE.Mesh(new THREE.CylinderGeometry(0.01, 0.01, 0.2, 6), headsetStandMat);
  hStandPole.position.set(AGENTS[3].x + 0.7, FLOOR_Y + 0.93, AGENTS[3].z + 0.1);
  group.add(hStandPole);
  const hStandTop = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.01, 0.04), headsetStandMat);
  hStandTop.position.set(AGENTS[3].x + 0.7, FLOOR_Y + 1.03, AGENTS[3].z + 0.1);
  group.add(hStandTop);
  // Headset hanging
  const hBand = new THREE.Mesh(new THREE.TorusGeometry(0.06, 0.006, 6, 10, Math.PI),
    new THREE.MeshStandardMaterial({ color: 0x222222, roughness: 0.4 }));
  hBand.position.set(AGENTS[3].x + 0.7, FLOOR_Y + 1.0, AGENTS[3].z + 0.1);
  hBand.rotation.z = Math.PI;
  group.add(hBand);

  // ===== SALES PIPELINE BOARD (front wall) =====
  const funnelCanvas = document.createElement('canvas');
  funnelCanvas.width = 512;
  funnelCanvas.height = 256;
  const fCtx = funnelCanvas.getContext('2d');
  fCtx.fillStyle = '#060a14';
  fCtx.fillRect(0, 0, 512, 256);
  fCtx.strokeStyle = '#3b82f6';
  fCtx.lineWidth = 2;
  fCtx.strokeRect(3, 3, 506, 250);
  fCtx.fillStyle = '#3b82f6';
  fCtx.font = 'bold 18px sans-serif';
  fCtx.textAlign = 'center';
  fCtx.fillText('SALES PIPELINE — MARCH', 256, 28);
  // Pipeline stages as funnel
  const pStages = [
    { label: 'PROSPECTS', count: '142', value: '', color: '#64748b', width: 460 },
    { label: 'CONTACTED', count: '89', value: '', color: '#3b82f6', width: 380 },
    { label: 'DEMO BOOKED', count: '34', value: '', color: '#06b6d4', width: 280 },
    { label: 'PROPOSAL', count: '18', value: '$22.5K', color: '#10b981', width: 200 },
    { label: 'CLOSED WON', count: '12', value: '$12.4K MRR', color: '#22c55e', width: 140 },
  ];
  pStages.forEach((s, i) => {
    const sy = 45 + i * 38;
    const sx = (512 - s.width) / 2;
    fCtx.fillStyle = s.color;
    fCtx.globalAlpha = 0.2;
    fCtx.fillRect(sx, sy, s.width, 28);
    fCtx.globalAlpha = 1.0;
    fCtx.strokeStyle = s.color;
    fCtx.lineWidth = 1;
    fCtx.strokeRect(sx, sy, s.width, 28);
    fCtx.fillStyle = '#e2e8f0';
    fCtx.font = 'bold 11px sans-serif';
    fCtx.textAlign = 'center';
    fCtx.fillText(`${s.label}: ${s.count}`, 256, sy + 15);
    if (s.value) {
      fCtx.fillStyle = s.color;
      fCtx.font = 'bold 10px monospace';
      fCtx.fillText(s.value, 256, sy + 26);
    }
  });
  const funnelTex = new THREE.CanvasTexture(funnelCanvas);
  funnelTex.colorSpace = THREE.SRGBColorSpace;
  const funnelBoard = new THREE.Mesh(
    new THREE.PlaneGeometry(3.5, 1.8),
    new THREE.MeshBasicMaterial({ map: funnelTex })
  );
  funnelBoard.rotation.y = Math.PI;
  funnelBoard.position.set(4, FLOOR_Y + 2.2, hd - 0.2);
  group.add(funnelBoard);

  // ===== #20: EXIT SIGNS =====
  createExitSign(group, -hw + 1, FLOOR_Y + CEIL_H - 0.3, -hd + 1, 0);
  createExitSign(group, hw - 1, FLOOR_Y + CEIL_H - 0.3, hd - 1, Math.PI);

  // ===== CEILING FAN =====
  const salesFanGroup = new THREE.Group();
  const sfMotorMat = new THREE.MeshStandardMaterial({ color: 0xcccccc, roughness: 0.35, metalness: 0.7 });
  salesFanGroup.add(new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.18, 0.12, 12), sfMotorMat));
  const sfRod = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.025, 0.4, 6), sfMotorMat);
  sfRod.position.y = 0.26;
  salesFanGroup.add(sfRod);
  const sfPlate = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 0.03, 8), sfMotorMat);
  sfPlate.position.y = 0.46;
  salesFanGroup.add(sfPlate);
  const sfBladeMat = new THREE.MeshStandardMaterial({ color: 0x444444, roughness: 0.3, metalness: 0.8 });
  for (let b = 0; b < 4; b++) {
    const blade = new THREE.Mesh(new THREE.BoxGeometry(1.4, 0.06, 0.22), sfBladeMat);
    const angle = (b / 4) * Math.PI * 2;
    blade.position.set(Math.cos(angle) * 0.7, 0, Math.sin(angle) * 0.7);
    blade.rotation.y = angle;
    blade.rotation.z = 0.05;
    salesFanGroup.add(blade);
  }
  salesFanGroup.position.set(3, FLOOR_Y + CEIL_H - 0.06, 0);
  group.add(salesFanGroup);
  group.userData.ceilingFan = salesFanGroup;
  console.log('[FIX] Sales floor ceiling fan rebuilt with 4 blades');

  // ===== WALL ART — framed colored rectangles =====
  const salesArtColors = [0x3b82f6, 0x06b6d4, 0x1e40af];
  const salesArtDefs = [
    { x: hw - 0.2, y: FLOOR_Y + 2.8, z: -5, rotY: -Math.PI / 2, w: 0.6, h: 0.8 },
    { x: -hw + 0.2, y: FLOOR_Y + 3.0, z: 2, rotY: Math.PI / 2, w: 0.7, h: 0.5 },
  ];
  salesArtDefs.forEach((wa, i) => {
    const artMat = new THREE.MeshBasicMaterial({ color: salesArtColors[i] });
    const art = new THREE.Mesh(new THREE.PlaneGeometry(wa.w, wa.h), artMat);
    art.position.set(wa.x, wa.y, wa.z);
    art.rotation.y = wa.rotY;
    group.add(art);
    const frameMat = new THREE.MeshStandardMaterial({ color: 0x1a1520, roughness: 0.3, metalness: 0.4 });
    const ft = 0.04;
    const fw = Math.abs(wa.rotY) === Math.PI / 2 ? ft : wa.w + 0.08;
    const fd = Math.abs(wa.rotY) === Math.PI / 2 ? wa.w + 0.08 : ft;
    group.add(new THREE.Mesh(new THREE.BoxGeometry(fw, wa.h + 0.08, fd), frameMat).translateX(wa.x).translateY(wa.y).translateZ(wa.z));
  });

  // --- Walking NPCs (2 on sales floor) ---
  salesWalkingNpcs = createWalkingNpcs(group, FLOOR_Y, 2, 0x3b82f6);

  scene.add(group);

  return { group, mixers, agentPositions };
}

// ---- Helper functions ----

function createBaseboard(w, h, d, x, y, z, mat) {
  const mesh = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat);
  mesh.position.set(x, y, z);
  return mesh;
}

function createBox(w, h, d, x, y, z, mat) {
  const mesh = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat);
  mesh.position.set(x, y, z);
  return mesh;
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
  const mat = new THREE.MeshBasicMaterial({ map: tex });
  const sign = new THREE.Mesh(new THREE.PlaneGeometry(0.5, 0.18), mat);
  sign.position.set(x, y, z);
  sign.rotation.y = rotY;
  parent.add(sign);
}

function createNameTagWithStatus(name, status) {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 64;
  const ctx = canvas.getContext('2d');

  ctx.clearRect(0, 0, 512, 64);

  // Background pill
  ctx.fillStyle = 'rgba(10, 11, 16, 0.75)';
  roundRect(ctx, 20, 8, 472, 48, 12);
  ctx.fill();

  // Border
  ctx.strokeStyle = '#3b82f6';
  ctx.lineWidth = 2;
  roundRect(ctx, 20, 8, 472, 48, 12);
  ctx.stroke();

  // Status dot
  const dotColor = status === 'green' ? '#10b981' : '#eab308';
  ctx.fillStyle = dotColor;
  ctx.beginPath();
  ctx.arc(60, 34, 8, 0, Math.PI * 2);
  ctx.fill();

  // Name text
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

function roundRect(ctx, x, y, w, h, r) {
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
