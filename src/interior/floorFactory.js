import * as THREE from 'three/webgpu';
import { LOBBY } from '../constants.js';
import { loadModel } from '../utils/modelLoader.js';
import { initAgentAnimation, captureModelBase, updateAgentAnimation } from '../npc/agentAnimator.js';
import { createAgentModel } from '../npc/agentModel.js';
import { createCharacterInstance, isCharacterModelAvailable } from '../npc/characterLoader.js';
import { createWalkingNpcs, updateWalkingNpcs } from '../npc/walkingNpc.js';
import { createSpeechBubbles } from '../npc/speechBubble.js';
import { createDoorSign } from '../ui/doorSign.js';
import { createDustParticles, createVolumetricFog, createEmberParticles } from '../scene/atmospherics.js';
import { markInteractable } from '../interaction/hoverOutline.js';

const FLOOR_W = LOBBY.width;
const FLOOR_D = LOBBY.depth;
const CEIL_H = 4;

// Department-specific lighting and floor color schemes
const DEPT_THEMES = {
  Marketing: {
    mainLight: 0xf0ffe0,   // soft green-white
    ambientTint: 0x10b981,
    lightIntensity: 60,
    sideIntensity: 40,
    floorTint: 0x181e28,
    ceilPanelColor: 0xeafff0,
    fillLight: { color: 0x10b981, intensity: 10, y: 1.5 },
  },
  Engineering: {
    mainLight: 0xffe8d0,   // warm amber
    ambientTint: 0xf97316,
    lightIntensity: 65,
    sideIntensity: 42,
    floorTint: 0x1e1818,
    ceilPanelColor: 0xfff4e8,
    fillLight: { color: 0xf97316, intensity: 8, y: 1.5 },
  },
  Content: {
    mainLight: 0xfff0f8,   // pink-white
    ambientTint: 0xec4899,
    lightIntensity: 68,
    sideIntensity: 45,
    floorTint: 0x1e1820,
    ceilPanelColor: 0xfff0f5,
    fillLight: { color: 0xec4899, intensity: 10, y: 1.5 },
  },
  Intelligence: {
    mainLight: 0xfff8d0,   // warm yellow-white
    ambientTint: 0xeab308,
    lightIntensity: 56,
    sideIntensity: 38,
    floorTint: 0x1e1c18,
    ceilPanelColor: 0xfff8e0,
    fillLight: { color: 0xeab308, intensity: 7, y: 2.0 },
  },
  Operations: {
    mainLight: 0xe8fff0,   // cool green-white
    ambientTint: 0x22c55e,
    lightIntensity: 62,
    sideIntensity: 40,
    floorTint: 0x181e1a,
    ceilPanelColor: 0xeeffee,
    fillLight: { color: 0x22c55e, intensity: 8, y: 1.5 },
  },
  Monitoring: {
    mainLight: 0xffe0e0,   // red-tinted
    ambientTint: 0xef4444,
    lightIntensity: 50,
    sideIntensity: 32,
    floorTint: 0x1e1418,
    ceilPanelColor: 0xffe8e8,
    fillLight: { color: 0xef4444, intensity: 12, y: 2.0 },
  },
};

// Department-specific screen content generators (512x256 canvas)
// Helper: randomize a number by ±pct
function rVar(base, pct = 10) { return base + base * (Math.random() * 2 - 1) * pct / 100; }

const DEPT_SCREENS = {
  Marketing: (ctx, w, h, agentIdx) => {
    ctx.fillStyle = '#0a0e14'; ctx.fillRect(0, 0, w, h);
    const screens = [
      () => {
        ctx.fillStyle = '#10b981'; ctx.font = 'bold 28px sans-serif'; ctx.fillText('CAMPAIGNS', 16, 36);
        const metrics = [`FB Ads: $${rVar(142, 12).toFixed(0)}/day`, `CTR: ${rVar(3.2, 15).toFixed(1)}%`, `Leads: ${Math.floor(rVar(12, 20))}`];
        metrics.forEach((m, i) => { ctx.fillStyle = '#94a3b8'; ctx.font = '20px monospace'; ctx.fillText(m, 16, 72 + i * 34); });
        ctx.fillStyle = '#10b981';
        [70, 110, 140, 88, 160].forEach((v, i) => ctx.fillRect(16 + i * 96, h - v, 64, v));
      },
      () => {
        ctx.fillStyle = '#06b6d4'; ctx.font = 'bold 28px sans-serif'; ctx.fillText('FUNNEL', 16, 36);
        const stages = [['Visitors', `${rVar(2.4, 8).toFixed(1)}K`, w * 0.85], ['Leads', `${Math.floor(rVar(340, 10))}`, w * 0.6], ['MQLs', `${Math.floor(rVar(89, 12))}`, w * 0.35], ['Deals', `${Math.floor(rVar(12, 15))}`, w * 0.12]];
        stages.forEach(([label, val, bw], i) => {
          ctx.fillStyle = `rgba(16,185,129,${0.3 + i * 0.18})`; ctx.fillRect(16, 56 + i * 44, bw, 30);
          ctx.fillStyle = '#e2e8f0'; ctx.font = '18px monospace'; ctx.fillText(`${label}: ${val}`, 24, 78 + i * 44);
        });
      },
      () => {
        ctx.fillStyle = '#ec4899'; ctx.font = 'bold 28px sans-serif'; ctx.fillText('SOCIAL', 16, 36);
        ['IG: 12.4K', 'LI: 8.2K', 'X: 5.1K', 'YT: 2.8K'].forEach((m, i) => {
          ctx.fillStyle = '#94a3b8'; ctx.font = '22px monospace'; ctx.fillText(m, 16, 76 + i * 38);
        });
      },
    ];
    screens[agentIdx % screens.length]();
  },
  Engineering: (ctx, w, h, agentIdx) => {
    ctx.fillStyle = '#0a0c10'; ctx.fillRect(0, 0, w, h);
    const screens = [
      () => {
        ctx.fillStyle = '#f97316'; ctx.font = 'bold 22px monospace'; ctx.fillText('$ deploy --prod', 12, 32);
        ctx.fillStyle = '#10b981'; ctx.font = '20px monospace';
        ctx.fillText('✓ Build passed', 12, 68); ctx.fillText(`✓ Tests: ${Math.floor(rVar(347, 2))}/${Math.floor(rVar(347, 2))}`, 12, 96);
        ctx.fillText('✓ Deploy complete', 12, 124);
        ctx.fillStyle = '#3b82f6'; ctx.fillText('→ v2.4.1 live', 12, 160);
        ctx.fillStyle = '#f97316'; ctx.fillRect(12, 180, 12, 22); // cursor
      },
      () => {
        ctx.fillStyle = '#f97316'; ctx.font = 'bold 28px sans-serif'; ctx.fillText('API HEALTH', 16, 36);
        ctx.fillStyle = '#10b981'; ctx.font = '20px monospace';
        ctx.fillText(`Uptime: ${rVar(99.98, 0.02).toFixed(2)}%`, 16, 76);
        ctx.fillText(`p50: ${Math.floor(rVar(42, 15))}ms`, 16, 108);
        ctx.fillText(`p99: ${Math.floor(rVar(340, 10))}ms`, 16, 140);
        ctx.strokeStyle = '#f97316'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(16, 200);
        for (let x = 16; x < w - 16; x += 8) ctx.lineTo(x, 180 + Math.random() * 40);
        ctx.stroke();
      },
      () => {
        ctx.fillStyle = '#f97316'; ctx.font = 'bold 28px sans-serif'; ctx.fillText('GIT LOG', 16, 36);
        const commits = ['fix: API timeout handler', 'feat: rate limiter v2', 'refactor: auth middleware'];
        commits.forEach((c, i) => {
          ctx.fillStyle = '#eab308'; ctx.font = '18px monospace'; ctx.fillText('●', 16, 78 + i * 44);
          ctx.fillStyle = '#94a3b8'; ctx.fillText(c, 40, 78 + i * 44);
        });
      },
    ];
    screens[agentIdx % screens.length]();
  },
  Content: (ctx, w, h, agentIdx) => {
    ctx.fillStyle = '#0e0812'; ctx.fillRect(0, 0, w, h);
    const screens = [
      () => {
        ctx.fillStyle = '#ec4899'; ctx.font = 'bold 28px sans-serif'; ctx.fillText('CONTENT QUEUE', 16, 36);
        ['Blog: SEO Guide ✓', 'Video: Demo Reel', 'Social: Carousel', 'Email: Newsletter'].forEach((m, i) => {
          ctx.fillStyle = i === 0 ? '#10b981' : '#94a3b8'; ctx.font = '20px monospace'; ctx.fillText(m, 16, 76 + i * 38);
        });
      },
      () => {
        ctx.fillStyle = '#ec4899'; ctx.font = 'bold 28px sans-serif'; ctx.fillText('VIEWS', 16, 36);
        ctx.fillStyle = '#e2e8f0'; ctx.font = '20px monospace'; ctx.fillText(`${rVar(4.2, 10).toFixed(1)}K today`, 16, 68);
        ctx.fillStyle = '#ec4899';
        [50, 100, 72, 140, 170, 112, 152].forEach((v, i) => ctx.fillRect(16 + i * 64, h - v, 42, v));
      },
      () => {
        ctx.fillStyle = '#f8f0f8'; ctx.fillRect(0, 0, w, h);
        ctx.fillStyle = '#334155'; ctx.font = 'bold 24px sans-serif';
        ctx.fillText('How Virtual Teams', 16, 40); ctx.fillText('Scale Operations', 16, 72);
        ctx.fillStyle = '#64748b';
        for (let i = 0; i < 5; i++) ctx.fillRect(16, 100 + i * 28, 200 + Math.random() * 240, 10);
      },
    ];
    screens[agentIdx % screens.length]();
  },
  Intelligence: (ctx, w, h, agentIdx) => {
    ctx.fillStyle = '#0a0c08'; ctx.fillRect(0, 0, w, h);
    const screens = [
      () => {
        ctx.fillStyle = '#eab308'; ctx.font = 'bold 28px sans-serif'; ctx.fillText('MODEL v3.2', 16, 36);
        ctx.fillStyle = '#10b981'; ctx.font = '20px monospace';
        ctx.fillText(`Accuracy: ${rVar(97.2, 1).toFixed(1)}%`, 16, 76);
        ctx.fillText(`Loss: ${rVar(0.028, 10).toFixed(3)}`, 16, 108);
        ctx.strokeStyle = '#eab308'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(16, 220);
        for (let x = 16; x < w - 16; x += 6) ctx.lineTo(x, 220 - (x / w) * 160 + Math.random() * 10);
        ctx.stroke();
      },
      () => {
        ctx.fillStyle = '#eab308'; ctx.font = 'bold 28px sans-serif'; ctx.fillText('FORECAST', 16, 36);
        ctx.fillStyle = '#94a3b8'; ctx.font = '20px monospace';
        ctx.fillText(`MRR: $${rVar(12.4, 8).toFixed(1)}K`, 16, 76);
        ctx.fillText(`Q2 Target: $${Math.floor(rVar(48, 5))}K`, 16, 108);
        const pct = rVar(67, 5);
        ctx.fillStyle = '#eab308'; ctx.fillRect(16, 140, w * 0.65 * pct / 100, 20);
        ctx.fillStyle = '#1e293b'; ctx.fillRect(16 + w * 0.65 * pct / 100, 140, w * 0.65 * (1 - pct / 100), 20);
        ctx.fillStyle = '#e2e8f0'; ctx.font = '16px monospace'; ctx.fillText(`${pct.toFixed(0)}%`, w * 0.65 + 24, 156);
      },
    ];
    screens[agentIdx % screens.length]();
  },
  Operations: (ctx, w, h, agentIdx) => {
    ctx.fillStyle = '#080e0a'; ctx.fillRect(0, 0, w, h);
    const screens = [
      () => {
        ctx.fillStyle = '#22c55e'; ctx.font = 'bold 28px sans-serif'; ctx.fillText('SERVICES', 16, 36);
        [['Billing', true], ['CRM Sync', true], ['Notification Queue', true], ['Support', false]].forEach(([svc, up], i) => {
          ctx.fillStyle = up ? '#10b981' : '#eab308'; ctx.font = '22px monospace'; ctx.fillText(up ? '●' : '○', 16, 80 + i * 38);
          ctx.fillStyle = '#94a3b8'; ctx.fillText(svc, 48, 80 + i * 38);
        });
      },
      () => {
        ctx.fillStyle = '#22c55e'; ctx.font = 'bold 28px sans-serif'; ctx.fillText('INVOICES', 16, 36);
        ctx.fillStyle = '#94a3b8'; ctx.font = '20px monospace';
        ctx.fillText(`Processed: ${Math.floor(rVar(142, 5))}`, 16, 76);
        ctx.fillText(`Pending: ${Math.floor(rVar(8, 25))}`, 16, 108);
        ctx.fillText(`Revenue: $${rVar(47.2, 8).toFixed(1)}K`, 16, 140);
        ctx.fillStyle = '#22c55e'; ctx.fillRect(16, 170, w * 0.8, 14);
      },
    ];
    screens[agentIdx % screens.length]();
  },
  Monitoring: (ctx, w, h, agentIdx) => {
    ctx.fillStyle = '#0a0408'; ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = '#ef4444'; ctx.font = 'bold 28px sans-serif'; ctx.fillText('SYSTEM STATUS', 16, 36);
    ctx.strokeStyle = '#ef4444'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(16, 120);
    for (let x = 16; x < w - 16; x += 6) ctx.lineTo(x, 80 + Math.random() * 80);
    ctx.stroke();
    ctx.fillStyle = '#10b981'; ctx.font = 'bold 22px monospace'; ctx.fillText('ALL SYSTEMS OPERATIONAL', 16, h - 24);
    ctx.fillStyle = '#10b981'; ctx.beginPath(); ctx.arc(w - 30, h - 28, 8, 0, Math.PI * 2); ctx.fill();
  },
};

/**
 * Generic department floor factory.
 * config: { floorY, name, accentColor, agents: [{name, status}], extras?: function }
 * Returns: { group, mixers, screenCanvases, screenTextures, robotGroups, robotBaseY, robotPhaseOffsets }
 */
export async function createDepartmentFloor(scene, config) {
  const { id: deptId, floorY, name, accentColor, agents, extras } = config;
  const group = new THREE.Group();
  const hw = FLOOR_W / 2;
  const hd = FLOOR_D / 2;
  const mixers = [];
  const screenCanvases = [];
  const screenTextures = [];
  let screenTimer = 0;

  const accentHex = '#' + new THREE.Color(accentColor).getHexString();

  // --- Department theme ---
  const theme = DEPT_THEMES[name] || {
    mainLight: 0xfff5e0, ambientTint: accentColor, lightIntensity: 55,
    sideIntensity: 35, floorTint: 0x1a1a2e, ceilPanelColor: 0xfff8ee,
    fillLight: { color: accentColor, intensity: 8, y: 1.5 },
  };

  // --- Floor (polished concrete / dark reflective surface) ---
  const floorMat = new THREE.MeshPhysicalMaterial({
    color: theme.floorTint, roughness: 0.15, metalness: 0.12,
    clearcoat: 0.7, clearcoatRoughness: 0.1,
    envMapIntensity: 0.6, transparent: false,
    reflectivity: 0.8,
  });
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(FLOOR_W + 1, FLOOR_D + 1), floorMat);
  floor.rotation.x = -Math.PI / 2;
  floor.position.y = floorY;
  floor.receiveShadow = true;
  group.add(floor);

  // --- Ceiling (oversized to fully cover walls — no sky bleed at edges) ---
  const ceilMat = new THREE.MeshStandardMaterial({ color: 0xe0d8cc, roughness: 0.8 });
  const ceiling = new THREE.Mesh(new THREE.PlaneGeometry(FLOOR_W + 2, FLOOR_D + 2), ceilMat);
  ceiling.rotation.x = Math.PI / 2;
  ceiling.position.y = floorY + CEIL_H;
  group.add(ceiling);

  // --- Ceiling light panels (department-tinted) ---
  const ceilPanelMat = new THREE.MeshBasicMaterial({ color: theme.ceilPanelColor });
  const ceilPanelGeo = new THREE.PlaneGeometry(2, 1);
  const panelPositions = [[-5, -4], [0, -4], [5, -4], [-5, 4], [0, 4], [5, 4]];
  for (const [px, pz] of panelPositions) {
    const panel = new THREE.Mesh(ceilPanelGeo, ceilPanelMat);
    panel.rotation.x = Math.PI / 2;
    panel.position.set(px, floorY + CEIL_H - 0.02, pz);
    group.add(panel);
  }

  // --- Walls (department-tinted) ---
  // Blend the base wall color with the accent color for a subtle tint
  const baseWallColor = new THREE.Color(0x1e1e30);
  const tintedWallColor = baseWallColor.clone().lerp(new THREE.Color(accentColor), 0.12);
  const wallMat = new THREE.MeshStandardMaterial({
    color: tintedWallColor, roughness: 0.5, metalness: 0.15,
    emissive: accentColor, emissiveIntensity: 0.02,
    side: THREE.DoubleSide,
  });
  const accentWallMat = new THREE.MeshStandardMaterial({
    color: accentColor, roughness: 0.4, metalness: 0.1,
    emissive: accentColor, emissiveIntensity: 0.05,
    side: THREE.DoubleSide,
  });

  // Back wall — oversized to seal corners (+2 width, +1 height)
  const backWall = new THREE.Mesh(new THREE.PlaneGeometry(FLOOR_W + 2, CEIL_H + 1), wallMat);
  backWall.position.set(0, floorY + CEIL_H / 2, -hd);
  group.add(backWall);

  // Front wall — oversized to seal corners
  const frontWall = new THREE.Mesh(new THREE.PlaneGeometry(FLOOR_W + 2, CEIL_H + 1), wallMat);
  frontWall.rotation.y = Math.PI;
  frontWall.position.set(0, floorY + CEIL_H / 2, hd);
  group.add(frontWall);

  // Left wall (accent-colored section on bottom 38%, tinted on top) — oversized, trimmed to avoid ceiling poke
  const leftWallBottom = new THREE.Mesh(new THREE.PlaneGeometry(FLOOR_D + 2, CEIL_H * 0.38), accentWallMat);
  leftWallBottom.rotation.y = Math.PI / 2;
  leftWallBottom.position.set(-hw, floorY + CEIL_H * 0.19, 0);
  group.add(leftWallBottom);

  const leftWallTop = new THREE.Mesh(new THREE.PlaneGeometry(FLOOR_D + 2, CEIL_H * 0.6 + 0.5), wallMat);
  leftWallTop.rotation.y = Math.PI / 2;
  leftWallTop.position.set(-hw, floorY + CEIL_H * 0.7, 0);
  group.add(leftWallTop);

  // Right wall — oversized
  const rightWall = new THREE.Mesh(new THREE.PlaneGeometry(FLOOR_D + 2, CEIL_H + 1), wallMat);
  rightWall.rotation.y = -Math.PI / 2;
  rightWall.position.set(hw, floorY + CEIL_H / 2, 0);
  group.add(rightWall);

  // --- Lighting (department-specific warmth and color) ---
  const mainLight = new THREE.PointLight(theme.mainLight, theme.lightIntensity, 22, 2);
  mainLight.position.set(0, floorY + CEIL_H - 0.5, 0);
  mainLight.castShadow = true;
  mainLight.shadow.mapSize.set(512, 512);
  mainLight.shadow.radius = 4;
  group.add(mainLight);

  const sideLight1 = new THREE.PointLight(theme.mainLight, theme.sideIntensity, 16, 2);
  sideLight1.position.set(-6, floorY + CEIL_H - 0.5, 0);
  group.add(sideLight1);

  const sideLight2 = new THREE.PointLight(theme.mainLight, theme.sideIntensity, 16, 2);
  sideLight2.position.set(6, floorY + CEIL_H - 0.5, 0);
  group.add(sideLight2);

  // Department accent fill lights (low on walls for ambient color wash)
  const fillCfg = theme.fillLight;
  const fillLight1 = new THREE.PointLight(fillCfg.color, fillCfg.intensity, 10, 2);
  fillLight1.position.set(-hw + 1, floorY + fillCfg.y, -4);
  group.add(fillLight1);
  const fillLight2 = new THREE.PointLight(fillCfg.color, fillCfg.intensity, 10, 2);
  fillLight2.position.set(hw - 1, floorY + fillCfg.y, 4);
  group.add(fillLight2);

  // Warm under-desk glow for coziness
  const underDeskGlow = new THREE.PointLight(0xffe8c0, 3, 8, 2);
  underDeskGlow.position.set(0, floorY + 0.3, 0);
  group.add(underDeskGlow);

  // --- Smoke detector on ceiling ---
  const smokeMat = new THREE.MeshStandardMaterial({ color: 0xdddddd, roughness: 0.4 });
  const smokeDetector = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.07, 0.025, 8), smokeMat);
  smokeDetector.position.set(2, floorY + CEIL_H - 0.01, -2);
  group.add(smokeDetector);
  // Red LED on smoke detector
  const smokeLed = new THREE.Mesh(new THREE.BoxGeometry(0.012, 0.012, 0.005),
    new THREE.MeshBasicMaterial({ color: 0xff0000 }));
  smokeLed.position.set(2, floorY + CEIL_H - 0.025, -2);
  smokeLed.rotation.x = -Math.PI / 2;
  group.add(smokeLed);

  // --- AC vent on ceiling (4 vents) ---
  const ventMat = new THREE.MeshStandardMaterial({ color: 0xd0d0d0, roughness: 0.6 });
  const ventGeo = new THREE.BoxGeometry(0.6, 0.02, 0.4);
  for (const [vx, vz] of [[-7, -5], [7, -5], [-7, 5], [7, 5]]) {
    const vent = new THREE.Mesh(ventGeo, ventMat);
    vent.position.set(vx, floorY + CEIL_H - 0.01, vz);
    group.add(vent);
    // Vent slats
    for (let s = 0; s < 3; s++) {
      const slat = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.005, 0.02), ventMat);
      slat.position.set(vx, floorY + CEIL_H - 0.015, vz - 0.12 + s * 0.12);
      group.add(slat);
    }
  }

  // --- Department name sign (CanvasTexture on back wall) ---
  const labelCanvas = document.createElement('canvas');
  labelCanvas.width = 512;
  labelCanvas.height = 64;
  const lctx = labelCanvas.getContext('2d');
  lctx.fillStyle = '#1a1a2e';
  lctx.fillRect(0, 0, 512, 64);
  lctx.fillStyle = accentHex;
  lctx.font = 'bold 36px sans-serif';
  lctx.textAlign = 'center';
  lctx.textBaseline = 'middle';
  lctx.fillText(name.toUpperCase(), 256, 32);
  const labelTex = new THREE.CanvasTexture(labelCanvas);
  labelTex.colorSpace = THREE.SRGBColorSpace;
  const labelMesh = new THREE.Mesh(
    new THREE.PlaneGeometry(4, 0.5),
    new THREE.MeshBasicMaterial({ map: labelTex, polygonOffset: true, polygonOffsetFactor: -1, polygonOffsetUnits: -1 })
  );
  labelMesh.position.set(0, floorY + CEIL_H / 2 + 0.8, -hd + 0.22);
  group.add(labelMesh);

  // --- CONDUIT AI logo on right wall ---
  const logoCanvas = document.createElement('canvas');
  logoCanvas.width = 512;
  logoCanvas.height = 128;
  const logoCtx = logoCanvas.getContext('2d');
  logoCtx.fillStyle = '#1e1e30';
  logoCtx.fillRect(0, 0, 512, 128);
  logoCtx.font = 'bold 50px Arial, sans-serif';
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
    new THREE.PlaneGeometry(3.5, 0.9),
    new THREE.MeshBasicMaterial({ map: logoTex, polygonOffset: true, polygonOffsetFactor: -1, polygonOffsetUnits: -1 })
  );
  logoMesh.position.set(hw - 0.22, floorY + CEIL_H - 1.2, -2);
  logoMesh.rotation.y = -Math.PI / 2;
  group.add(logoMesh);
  console.log('[FIX] Department sign and CONDUIT AI logo z-fighting fix applied');

  // --- Elevator doors on back wall (rebuilt with panels + frame + gap) ---
  const elevFrameMat = new THREE.MeshStandardMaterial({ color: 0x2a2a30, metalness: 0.85, roughness: 0.15 });
  const elevDoorMat = new THREE.MeshStandardMaterial({ color: 0x888899, metalness: 0.9, roughness: 0.12 });
  const frameW = 1.5, frameH = 3.0;
  const doorZ = -hd + 0.2;

  // Frame — left, right, top (darker material)
  group.add(makeBox(0.12, frameH + 0.1, 0.1, -frameW / 2 - 0.06, floorY + frameH / 2, doorZ, elevFrameMat));
  group.add(makeBox(0.12, frameH + 0.1, 0.1, frameW / 2 + 0.06, floorY + frameH / 2, doorZ, elevFrameMat));
  group.add(makeBox(frameW + 0.24, 0.12, 0.1, 0, floorY + frameH + 0.05, doorZ, elevFrameMat));

  // Two door panels with 0.02 gap between them (brushed metal)
  const panelW = (frameW - 0.02) / 2;
  const leftPanel = makeBox(panelW, frameH - 0.05, 0.03, -panelW / 2 - 0.01, floorY + frameH / 2, doorZ + 0.02, elevDoorMat);
  group.add(leftPanel);
  const rightPanel = makeBox(panelW, frameH - 0.05, 0.03, panelW / 2 + 0.01, floorY + frameH / 2, doorZ + 0.02, elevDoorMat);
  group.add(rightPanel);

  // Center seam line (thin dark strip in the gap)
  const seamMat = new THREE.MeshStandardMaterial({ color: 0x111118 });
  group.add(makeBox(0.01, frameH - 0.1, 0.035, 0, floorY + frameH / 2, doorZ + 0.02, seamMat));

  // --- Floor number text above elevator door ---
  const indCanvas = document.createElement('canvas');
  indCanvas.width = 128;
  indCanvas.height = 64;
  const indCtx = indCanvas.getContext('2d');
  indCtx.fillStyle = '#0a0b10';
  indCtx.fillRect(0, 0, 128, 64);
  indCtx.fillStyle = accentHex;
  indCtx.font = 'bold 32px monospace';
  indCtx.textAlign = 'center';
  indCtx.textBaseline = 'middle';
  // Show floor number from config name
  const floorLabel = name.length <= 6 ? name.toUpperCase() : name.substring(0, 6).toUpperCase();
  indCtx.fillText(floorLabel, 64, 32);
  const indTex = new THREE.CanvasTexture(indCanvas);
  indTex.colorSpace = THREE.SRGBColorSpace;
  const indMesh = new THREE.Mesh(
    new THREE.PlaneGeometry(0.8, 0.4),
    new THREE.MeshBasicMaterial({ map: indTex })
  );
  indMesh.position.set(0, floorY + frameH + 0.3, doorZ + 0.04);
  group.add(indMesh);
  console.log('[FIX] Elevator doors rebuilt with dual panels + brushed metal + floor number');

  // --- Department door sign (beside elevator) ---
  if (deptId) {
    createDoorSign(deptId, floorY, accentColor, group, { x: 3.2, z: doorZ + 0.06 });
  }

  // --- Baseboards ---
  const bbMat = new THREE.MeshStandardMaterial({ color: 0x0f0f18, roughness: 0.5 });
  const bbH = 0.08;
  group.add(makeBox(FLOOR_W, bbH, 0.04, 0, floorY + bbH / 2, -hd + 0.02, bbMat));
  group.add(makeBox(FLOOR_W, bbH, 0.04, 0, floorY + bbH / 2, hd - 0.02, bbMat));
  group.add(makeBox(0.04, bbH, FLOOR_D, -hw + 0.02, floorY + bbH / 2, 0, bbMat));
  group.add(makeBox(0.04, bbH, FLOOR_D, hw - 0.02, floorY + bbH / 2, 0, bbMat));

  // --- EXIT signs ---
  createExitSign(group, -hw + 1, floorY + CEIL_H - 0.3, -hd + 1, 0);
  createExitSign(group, hw - 1, floorY + CEIL_H - 0.3, hd - 1, Math.PI);

  // --- Window panels on front wall (city skyline view) ---
  const windowGlass = new THREE.MeshPhysicalMaterial({
    color: 0x88bbff, transparent: true, opacity: 0.08,
    roughness: 0.02, metalness: 0.1, side: THREE.DoubleSide,
  });
  const windowFrameMat = new THREE.MeshStandardMaterial({ color: 0x333344, roughness: 0.3, metalness: 0.6 });
  // Two large windows on front wall
  for (const wx of [-5, 5]) {
    // Glass pane
    const glass = new THREE.Mesh(new THREE.PlaneGeometry(3.0, 2.2), windowGlass);
    glass.rotation.y = Math.PI;
    glass.position.set(wx, floorY + 2.0, hd - 0.03);
    group.add(glass);
    // Window frame
    const frameParts = [
      [3.1, 0.06, 0.06, wx, floorY + 3.12, hd - 0.04], // top
      [3.1, 0.06, 0.06, wx, floorY + 0.88, hd - 0.04], // bottom
      [0.06, 2.3, 0.06, wx - 1.52, floorY + 2.0, hd - 0.04], // left
      [0.06, 2.3, 0.06, wx + 1.52, floorY + 2.0, hd - 0.04], // right
    ];
    for (const [fw, fh, fd, fx, fy, fz] of frameParts) {
      group.add(makeBox(fw, fh, fd, fx, fy, fz, windowFrameMat));
    }
    // Cityscape backdrop behind window (canvas)
    const cityCanvas = document.createElement('canvas');
    cityCanvas.width = 256;
    cityCanvas.height = 128;
    const cCtx = cityCanvas.getContext('2d');
    // Night sky gradient
    const skyGrad = cCtx.createLinearGradient(0, 0, 0, 128);
    skyGrad.addColorStop(0, '#0a0e1a');
    skyGrad.addColorStop(0.5, '#111828');
    skyGrad.addColorStop(1, '#1a2040');
    cCtx.fillStyle = skyGrad;
    cCtx.fillRect(0, 0, 256, 128);
    // Stars
    cCtx.fillStyle = '#ffffff';
    for (let s = 0; s < 20; s++) {
      cCtx.globalAlpha = 0.3 + Math.random() * 0.7;
      cCtx.fillRect(Math.random() * 256, Math.random() * 60, 1, 1);
    }
    cCtx.globalAlpha = 1.0;
    // Building silhouettes
    cCtx.fillStyle = '#0e1420';
    const buildings = [];
    for (let b = 0; b < 12; b++) {
      const bx = b * 22 - 5 + Math.random() * 8;
      const bw = 10 + Math.random() * 15;
      const bh = 20 + Math.random() * 60;
      buildings.push({ x: bx, w: bw, h: bh });
      cCtx.fillRect(bx, 128 - bh, bw, bh);
    }
    // Windows on buildings (small yellow dots)
    for (const b of buildings) {
      cCtx.fillStyle = '#ffd700';
      for (let row = 0; row < Math.floor(b.h / 8); row++) {
        for (let col = 0; col < Math.floor(b.w / 6); col++) {
          if (Math.random() > 0.4) {
            cCtx.globalAlpha = 0.3 + Math.random() * 0.5;
            cCtx.fillRect(b.x + 2 + col * 6, 128 - b.h + 3 + row * 8, 2, 3);
          }
        }
      }
    }
    cCtx.globalAlpha = 1.0;
    const cityTex = new THREE.CanvasTexture(cityCanvas);
    cityTex.colorSpace = THREE.SRGBColorSpace;
    const cityView = new THREE.Mesh(
      new THREE.PlaneGeometry(4.0, 3.0),
      new THREE.MeshBasicMaterial({ map: cityTex, side: THREE.DoubleSide })
    );
    cityView.rotation.y = Math.PI;
    cityView.position.set(wx, floorY + 2.0, hd + 0.1);
    group.add(cityView);
  }

  // --- Desks + Agents ---
  const deskMat = new THREE.MeshPhysicalMaterial({
    color: 0x1a1520, roughness: 0.3, metalness: 0.1,
    clearcoat: 0.4, clearcoatRoughness: 0.2,
  });
  const deskGeo = new THREE.BoxGeometry(2.2, 0.8, 1.2);

  // Arrange agents in rows. Max ~3 per row.
  // Intelligence floor: tighter spacing to avoid boardroom on right side (x>3)
  const agentPositions = [];
  const npcModels = [];
  const statusLeds = [];
  const cols = 3;
  const hasRightExtras = (name === 'Intelligence');
  const rowSpacingX = hasRightExtras ? 3.5 : 6;
  const rowSpacingZ = 5;

  // Skin tone diversity
  const skinTones = [0xFFDBAC, 0xF1C27D, 0xE0AC69, 0xC68642, 0x8D5524, 0x5C3A1E];
  // Department-specific clothing colors
  const DEPT_SUITS = {
    Sales: [0x1a1a3e, 0x1e1e40, 0x1a2040], // navy blue
    Marketing: [0x1a2e2e, 0x1e3030, 0x1a2828], // teal/green business
    Engineering: [0x2a2a2e, 0x333338, 0x2e2e32], // dark gray casual
    Content: [0x2e1a2e, 0x1a2e1e, 0x2e2a1a], // varied creative
    Intelligence: [0x1e1e24, 0x222228, 0x1a1a20], // charcoal suits
    Operations: [0x2a2e1e, 0x262a1a, 0x2e301e], // khaki/olive
    Monitoring: [0x141418, 0x18181c, 0x121216], // black tech wear
  };
  const suitColors = DEPT_SUITS[name] || [0x1a1a3e, 0x1e1e30, 0x2a2a3e];

  for (let ai = 0; ai < agents.length; ai++) {
    const agent = agents[ai];
    const col = ai % cols;
    const row = Math.floor(ai / cols);
    const ax = (col - (cols - 1) / 2) * rowSpacingX;
    const az = row === 0 ? -3 : (row === 1 ? 3 : 0);
    const chairZ = az < 0 ? az + 1.0 : az - 1.0; // chair side (toward center)
    agentPositions.push({ x: ax, z: chairZ });

    // Desk
    const desk = new THREE.Mesh(deskGeo, deskMat);
    desk.position.set(ax, floorY + 0.4, az);
    desk.castShadow = true;
    desk.receiveShadow = true;
    group.add(desk);

    // Monitor on desk — pushed to far side, screen faces chair
    const monitorZDir = az < 0 ? -1 : 1; // push monitor away from center
    const monitorMat = new THREE.MeshStandardMaterial({ color: 0x111122, roughness: 0.15, metalness: 0.5 });
    const monitor = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.5, 0.05), monitorMat);
    monitor.position.set(ax, floorY + 1.05, az + 0.3 * monitorZDir);
    group.add(monitor);

    // Animated screen (department-specific content)
    const screenCanvas = document.createElement('canvas');
    screenCanvas.width = 512;
    screenCanvas.height = 256;
    const sctx = screenCanvas.getContext('2d');
    const deptScreen = DEPT_SCREENS[name];
    if (deptScreen) {
      deptScreen(sctx, 128, 64, ai);
    } else {
      randomDashboard(sctx, 512, 256, accentHex);
    }
    const screenTex = new THREE.CanvasTexture(screenCanvas);
    screenTex.colorSpace = THREE.SRGBColorSpace;
    screenCanvases.push(screenCanvas);
    screenTextures.push(screenTex);

    // Screen plane on FRONT face of monitor — emissive glow
    const screenMesh = new THREE.Mesh(
      new THREE.PlaneGeometry(0.7, 0.4),
      new THREE.MeshStandardMaterial({
        map: screenTex, side: THREE.DoubleSide,
        emissive: 0xffffff, emissiveMap: screenTex, emissiveIntensity: 2.5,
        toneMapped: false,
      })
    );
    screenMesh.position.set(ax, floorY + 1.05, az + 0.274 * monitorZDir);
    if (az > 0) screenMesh.rotation.y = Math.PI; // flip screen to face chair for bottom row
    group.add(screenMesh);

    // Screen glow light — casts accent color onto desk and walls
    const screenGlow = new THREE.PointLight(accentColor, 3, 4, 2);
    screenGlow.position.set(ax, floorY + 1.0, az);
    group.add(screenGlow);


    // Try rigged character first, fall back to procedural
    {
      const agentGroup = new THREE.Group();
      agentGroup.position.set(ax, floorY, chairZ);
      agentGroup.userData.phase = ai * 1.7;
      agentGroup.userData.baseY = floorY;

      const charInstance = isCharacterModelAvailable()
        ? createCharacterInstance(ai, name, floorY)
        : null;

      if (charInstance) {
        // Rigged character from soldier.glb
        charInstance.model.rotation.y = az < 0 ? Math.PI : 0;
        agentGroup.add(charInstance.model);
        agentGroup.userData.model = charInstance.model;
        agentGroup.userData.bones = charInstance.bones;
        agentGroup.userData.mixer = charInstance.mixer;
        if (charInstance.mixer) mixers.push(charInstance.mixer);
      } else {
        // Procedural articulated fallback
        const isFemale = ai % 2 === 0;
        const { group: agentMesh, parts } = createAgentModel({
          bodyColor: suitColors[ai % suitColors.length],
          skinColor: skinTones[ai % skinTones.length],
          accentColor, isFemale,
        });
        agentMesh.rotation.y = az < 0 ? Math.PI : 0;
        agentGroup.add(agentMesh);
        agentGroup.userData.model = agentMesh;
        agentGroup.userData.parts = parts;
      }

      group.add(agentGroup);
      npcModels.push(agentGroup);
      captureModelBase(agentGroup);
      initAgentAnimation(agentGroup, ai + floorY, name, agent.name);

      const tag = createNameTagWithStatus(agent.name, agent.status, accentHex);
      tag.position.set(0, charInstance ? 2.1 : 1.6, 0);
      agentGroup.add(tag);
    }
  }

  // Department colored LED strip along top of walls
  const ledMat = new THREE.MeshBasicMaterial({ color: accentColor });
  const ledH = 0.06, ledD = 0.04;
  const ledY = floorY + CEIL_H - 0.1;
  const ledBack = new THREE.Mesh(new THREE.BoxGeometry(FLOOR_W, ledH, ledD), ledMat);
  ledBack.position.set(0, ledY, -hd + 0.05);
  group.add(ledBack);
  const ledFront = new THREE.Mesh(new THREE.BoxGeometry(FLOOR_W, ledH, ledD), ledMat);
  ledFront.position.set(0, ledY, hd - 0.05);
  group.add(ledFront);
  const ledLeft = new THREE.Mesh(new THREE.BoxGeometry(ledD, ledH, FLOOR_D), ledMat);
  ledLeft.position.set(-hw + 0.05, ledY, 0);
  group.add(ledLeft);
  const ledRight = new THREE.Mesh(new THREE.BoxGeometry(ledD, ledH, FLOOR_D), ledMat);
  ledRight.position.set(hw - 0.05, ledY, 0);
  group.add(ledRight);

  // Ambient details — make rooms feel lived-in
  const detailMat = new THREE.MeshStandardMaterial({ color: 0x222233, roughness: 0.6 });
  const whiteMat = new THREE.MeshStandardMaterial({ color: 0xdddddd, roughness: 0.5 });

  // Water cooler (corner)
  const wcBase = new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.15, 0.5, 6), whiteMat);
  wcBase.position.set(hw - 1, floorY + 0.25, hd - 1);
  group.add(wcBase);
  const wcTop = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.12, 0.3, 6), new THREE.MeshStandardMaterial({ color: 0x2255cc, roughness: 0.3 }));
  wcTop.position.set(hw - 1, floorY + 0.65, hd - 1);
  group.add(wcTop);

  // Mini break area — small fridge + microwave shelf near water cooler
  const fridgeMat = new THREE.MeshStandardMaterial({ color: 0xdddddd, roughness: 0.3 });
  const fridge = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.9, 0.4), fridgeMat);
  fridge.position.set(hw - 2, floorY + 0.45, hd - 0.5);
  group.add(fridge);
  // Fridge handle
  const fridgeHandle = new THREE.Mesh(new THREE.BoxGeometry(0.02, 0.25, 0.03),
    new THREE.MeshStandardMaterial({ color: 0x888888, metalness: 0.7, roughness: 0.2 }));
  fridgeHandle.position.set(hw - 1.73, floorY + 0.55, hd - 0.28);
  group.add(fridgeHandle);
  // Microwave on top of fridge
  const microwaveMat = new THREE.MeshStandardMaterial({ color: 0x222233, roughness: 0.3 });
  const microwave = new THREE.Mesh(new THREE.BoxGeometry(0.35, 0.2, 0.3), microwaveMat);
  microwave.position.set(hw - 2, floorY + 1.0, hd - 0.5);
  group.add(microwave);
  // Microwave window
  const mwWindow = new THREE.Mesh(new THREE.BoxGeometry(0.15, 0.12, 0.005),
    new THREE.MeshStandardMaterial({ color: 0x111122, roughness: 0.1, metalness: 0.3 }));
  mwWindow.position.set(hw - 1.9, floorY + 1.0, hd - 0.34);
  group.add(mwWindow);

  // Trash cans — one near elevator, one by water cooler
  const trashMat = new THREE.MeshStandardMaterial({ color: 0x222233, roughness: 0.6 });
  const trash1 = new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.12, 0.4, 6), trashMat);
  trash1.position.set(1.5, floorY + 0.2, -hd + 0.5);
  group.add(trash1);
  const trash2 = new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.12, 0.4, 6), trashMat);
  trash2.position.set(hw - 1.5, floorY + 0.2, hd - 1);
  group.add(trash2);

  // Potted plants in corners
  const potMat = new THREE.MeshPhysicalMaterial({ color: 0x2a2a30, roughness: 0.3, clearcoat: 0.5 });
  const leafMat = new THREE.MeshStandardMaterial({ color: 0x1d5e15, roughness: 0.6 });
  const plantCorners = [
    [-hw + 0.8, hd - 0.8],
    [-hw + 0.8, -hd + 0.8],
    [hw - 0.8, -hd + 0.8],
  ];
  for (const [px, pz] of plantCorners) {
    const pot = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.14, 0.4, 8), potMat);
    pot.position.set(px, floorY + 0.2, pz);
    group.add(pot);
    // Soil
    const soil = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.16, 0.04, 8),
      new THREE.MeshStandardMaterial({ color: 0x3d2b1f, roughness: 0.9 }));
    soil.position.set(px, floorY + 0.42, pz);
    group.add(soil);
    // Leaves (icosahedron clusters)
    const leafPositions = [[0, 0.65, 0, 0.22], [0.08, 0.8, 0.06, 0.16], [-0.06, 0.75, -0.05, 0.14]];
    for (const [lx, ly, lz, lr] of leafPositions) {
      const leaf = new THREE.Mesh(new THREE.IcosahedronGeometry(lr, 1), leafMat);
      leaf.position.set(px + lx, floorY + ly, pz + lz);
      group.add(leaf);
    }
  }

  // --- Headphones on third desk (if available) ---
  if (agentPositions.length > 2) {
    const ap = agentPositions[2];
    const hpMat = new THREE.MeshStandardMaterial({ color: 0x222222, roughness: 0.4 });
    // Headband arc (torus segment)
    const hpBand = new THREE.Mesh(new THREE.TorusGeometry(0.08, 0.008, 6, 10, Math.PI), hpMat);
    hpBand.position.set(ap.x + 0.8, floorY + 0.87, ap.z + 0.1);
    hpBand.rotation.z = Math.PI;
    group.add(hpBand);
    // Left ear cup
    const earMat = new THREE.MeshStandardMaterial({ color: 0x333333, roughness: 0.3 });
    const earL = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.035, 0.015, 8), earMat);
    earL.position.set(ap.x + 0.72, floorY + 0.83, ap.z + 0.1);
    earL.rotation.z = Math.PI / 2;
    group.add(earL);
    // Right ear cup
    const earR = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.035, 0.015, 8), earMat);
    earR.position.set(ap.x + 0.88, floorY + 0.83, ap.z + 0.1);
    earR.rotation.z = Math.PI / 2;
    group.add(earR);
  }

  // Coffee mugs on desks (most desks)
  const mugMat = new THREE.MeshStandardMaterial({ color: 0xeeeeee, roughness: 0.4 });
  const mugColors = [0xeeeeee, 0xcc3333, 0x3366cc, 0x228844];
  for (let i = 0; i < agentPositions.length; i++) {
    if (i % 3 === 2) continue; // skip every 3rd desk
    const ap = agentPositions[i];
    const mugColor = mugColors[i % mugColors.length];
    const mug = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.025, 0.06, 6),
      new THREE.MeshStandardMaterial({ color: mugColor, roughness: 0.4 }));
    mug.position.set(ap.x + 0.4 + (i % 2) * 0.15, floorY + 0.83, ap.z + 0.15);
    group.add(mug);
    // Handle
    const handle = new THREE.Mesh(new THREE.TorusGeometry(0.015, 0.004, 4, 6, Math.PI),
      new THREE.MeshStandardMaterial({ color: mugColor, roughness: 0.4 }));
    handle.position.set(ap.x + 0.43 + (i % 2) * 0.15, floorY + 0.83, ap.z + 0.18);
    handle.rotation.y = Math.PI / 2;
    group.add(handle);
  }

  // Papers and paper stacks on desks
  const paperMat = new THREE.MeshStandardMaterial({ color: 0xf0f0e8, roughness: 0.8 });
  for (let i = 0; i < agentPositions.length; i++) {
    const ap = agentPositions[i];
    // Single scattered papers
    if (i % 2 === 1) {
      const paper = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.004, 0.13), paperMat);
      paper.position.set(ap.x - 0.35, floorY + 0.81, ap.z + 0.15);
      paper.rotation.y = 0.1 + i * 0.25;
      group.add(paper);
    }
    // Paper stacks (small pile of 3-5 sheets)
    if (i % 3 === 0) {
      for (let s = 0; s < 4; s++) {
        const sheet = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.003, 0.14), paperMat);
        sheet.position.set(ap.x - 0.6, floorY + 0.81 + s * 0.004, ap.z + 0.3);
        sheet.rotation.y = 0.02 * s;
        group.add(sheet);
      }
    }
  }

  // Keyboard on each desk + status LED
  const kbMat = new THREE.MeshStandardMaterial({ color: 0x111118, roughness: 0.4 });
  for (let i = 0; i < agentPositions.length; i++) {
    const ap = agentPositions[i];
    const kb = new THREE.Mesh(new THREE.BoxGeometry(0.35, 0.015, 0.12), kbMat);
    kb.position.set(ap.x, floorY + 0.81, ap.z + 0.4);
    group.add(kb);
    // Status LED on monitor (green=active, yellow=busy)
    const agentStatus = agents[i] ? agents[i].status : 'green';
    const ledColor = agentStatus === 'green' ? 0x10b981 : 0xeab308;
    const deskLed = new THREE.Mesh(new THREE.SphereGeometry(0.012, 6, 4),
      new THREE.MeshBasicMaterial({ color: ledColor }));
    deskLed.position.set(ap.x + 0.35, floorY + 1.32, ap.z - 0.3);
    group.add(deskLed);
    statusLeds.push({ mesh: deskLed, phase: i * 1.3, isGreen: agentStatus === 'green' });
  }

  // Desk lamp on first desk
  if (agentPositions.length > 0) {
    const ap = agentPositions[0];
    const lampBaseMat = new THREE.MeshStandardMaterial({ color: 0x333344, roughness: 0.3, metalness: 0.5 });
    const lampBase = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.07, 0.03, 8), lampBaseMat);
    lampBase.position.set(ap.x + 0.7, floorY + 0.82, ap.z + 0.05);
    group.add(lampBase);
    const lampArm = new THREE.Mesh(new THREE.BoxGeometry(0.02, 0.35, 0.02), lampBaseMat);
    lampArm.position.set(ap.x + 0.7, floorY + 1.0, ap.z + 0.05);
    lampArm.rotation.z = 0.15;
    group.add(lampArm);
    const lampShade = new THREE.Mesh(new THREE.ConeGeometry(0.06, 0.08, 6, 1, true),
      new THREE.MeshStandardMaterial({ color: accentColor, roughness: 0.5, emissive: accentColor, emissiveIntensity: 0.1, side: THREE.DoubleSide }));
    lampShade.position.set(ap.x + 0.72, floorY + 1.2, ap.z + 0.05);
    lampShade.rotation.x = Math.PI;
    group.add(lampShade);
  }

  // Fire extinguisher near elevator (right-side up: wider base, narrow top with nozzle)
  const feMat = new THREE.MeshStandardMaterial({ color: 0xcc2222, roughness: 0.4 });
  const fe = new THREE.Mesh(new THREE.CylinderGeometry(0.055, 0.065, 0.3, 8), feMat);
  fe.position.set(-1.5, floorY + 0.15, -hd + 0.3);
  group.add(fe);
  const feTop = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.04, 0.06, 8),
    new THREE.MeshStandardMaterial({ color: 0x222222, roughness: 0.3 }));
  feTop.position.set(-1.5, floorY + 0.33, -hd + 0.3);
  group.add(feTop);
  // Nozzle handle on top
  const feHandle = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.025, 0.015),
    new THREE.MeshStandardMaterial({ color: 0x222222, roughness: 0.3, metalness: 0.5 }));
  feHandle.position.set(-1.5, floorY + 0.37, -hd + 0.3);
  group.add(feHandle);

  // Coat hooks on back wall (near elevator)
  const hookMat = new THREE.MeshStandardMaterial({ color: 0x666677, metalness: 0.7, roughness: 0.2 });
  for (let h = 0; h < 3; h++) {
    const hook = new THREE.Mesh(new THREE.BoxGeometry(0.03, 0.08, 0.06), hookMat);
    hook.position.set(3 + h * 0.25, floorY + 1.6, -hd + 0.2);
    group.add(hook);
  }
  // Coat rack backplate
  const rackPlate = new THREE.Mesh(new THREE.BoxGeometry(1.0, 0.15, 0.02),
    new THREE.MeshStandardMaterial({ color: 0x2a1a0a, roughness: 0.5 }));
  rackPlate.position.set(3.25, floorY + 1.6, -hd + 0.15);
  group.add(rackPlate);

  // Desk phone on second desk (if available)
  if (agentPositions.length > 1) {
    const ap = agentPositions[1];
    const phoneMat = new THREE.MeshStandardMaterial({ color: 0x111118, roughness: 0.3, metalness: 0.3 });
    // Phone base
    const phoneBase = new THREE.Mesh(new THREE.BoxGeometry(0.15, 0.025, 0.1), phoneMat);
    phoneBase.position.set(ap.x + 0.6, floorY + 0.82, ap.z - 0.1);
    group.add(phoneBase);
    // Phone handset
    const handset = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.015, 0.12), phoneMat);
    handset.position.set(ap.x + 0.6, floorY + 0.84, ap.z - 0.1);
    group.add(handset);
  }

  // Motivational quote frame on front wall
  const quoteCanvas = document.createElement('canvas');
  quoteCanvas.width = 256;
  quoteCanvas.height = 128;
  const qctx = quoteCanvas.getContext('2d');
  qctx.fillStyle = '#0a0e14';
  qctx.fillRect(0, 0, 256, 128);
  qctx.strokeStyle = accentHex;
  qctx.lineWidth = 2;
  qctx.strokeRect(4, 4, 248, 120);
  const quotes = [
    'SHIP FAST. ITERATE FASTER.',
    'EVERY CALL IS AN OPPORTUNITY.',
    'DATA DRIVES DECISIONS.',
    'BUILD THE FUTURE.',
    'CUSTOMERS FIRST. ALWAYS.',
    'AUTOMATE EVERYTHING.',
  ];
  qctx.fillStyle = accentHex;
  qctx.font = 'bold 16px sans-serif';
  qctx.textAlign = 'center';
  qctx.textBaseline = 'middle';
  qctx.fillText(quotes[Math.floor(Math.random() * quotes.length)], 128, 64);
  const quoteTex = new THREE.CanvasTexture(quoteCanvas);
  quoteTex.colorSpace = THREE.SRGBColorSpace;
  const quoteFrame = new THREE.Mesh(
    new THREE.PlaneGeometry(1.5, 0.75),
    new THREE.MeshBasicMaterial({ map: quoteTex })
  );
  quoteFrame.rotation.y = Math.PI / 2;
  quoteFrame.position.set(-hw + 0.2, floorY + 2.5, -5);
  group.add(quoteFrame);

  // --- Wall power outlets (small dark boxes on walls) ---
  const outletMat = new THREE.MeshStandardMaterial({ color: 0xdddddd, roughness: 0.4 });
  const outletPositions = [
    [-hw + 0.05, floorY + 0.3, -3, Math.PI / 2],
    [-hw + 0.05, floorY + 0.3, 3, Math.PI / 2],
    [hw - 0.05, floorY + 0.3, -3, -Math.PI / 2],
    [hw - 0.05, floorY + 0.3, 3, -Math.PI / 2],
  ];
  for (const [ox, oy, oz, oRot] of outletPositions) {
    const outlet = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.06, 0.08), outletMat);
    outlet.position.set(ox, oy, oz);
    outlet.rotation.y = oRot;
    group.add(outlet);
  }

  // --- Thermostat on right wall ---
  const thermoMat = new THREE.MeshStandardMaterial({ color: 0xdddddd, roughness: 0.3 });
  const thermo = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.1, 0.08), thermoMat);
  thermo.position.set(hw - 0.04, floorY + 1.5, 5);
  group.add(thermo);
  const thermoScreenMat = new THREE.MeshBasicMaterial({ color: 0x111122 });
  const thermoScreen = new THREE.Mesh(new THREE.BoxGeometry(0.005, 0.06, 0.05), thermoScreenMat);
  thermoScreen.position.set(hw - 0.06, floorY + 1.5, 5);
  group.add(thermoScreen);

  // --- Water bottle on a desk ---
  if (agentPositions.length > 2) {
    const ap = agentPositions[2];
    const bottleMat = new THREE.MeshPhysicalMaterial({
      color: 0x88ccff, transparent: true, opacity: 0.4,
      roughness: 0.05, metalness: 0.0,
    });
    const bottle = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.025, 0.15, 6), bottleMat);
    bottle.position.set(ap.x - 0.5, floorY + 0.88, ap.z + 0.25);
    group.add(bottle);
    // Bottle cap
    const capMat = new THREE.MeshStandardMaterial({ color: 0x2255cc, roughness: 0.3 });
    const cap = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.025, 0.02, 6), capMat);
    cap.position.set(ap.x - 0.5, floorY + 0.96, ap.z + 0.25);
    group.add(cap);
  }

  // --- Tissue box on last desk ---
  if (agentPositions.length > 0) {
    const ap = agentPositions[agentPositions.length - 1];
    const tissueMat = new THREE.MeshStandardMaterial({ color: 0x4488cc, roughness: 0.6 });
    const tissue = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.06, 0.1), tissueMat);
    tissue.position.set(ap.x + 0.5, floorY + 0.84, ap.z + 0.3);
    group.add(tissue);
    // Tissue sticking out
    const tissuePaper = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.04, 0.003),
      new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.9 }));
    tissuePaper.position.set(ap.x + 0.5, floorY + 0.89, ap.z + 0.3);
    group.add(tissuePaper);
  }

  // ===== WALL CLOCK on right wall =====
  const wallClockGroup = new THREE.Group();
  const clockFaceMat = new THREE.MeshBasicMaterial({ color: 0xf0f0f0 });
  const clockFace = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.3, 0.025, 20), clockFaceMat);
  clockFace.rotation.x = Math.PI / 2;
  wallClockGroup.add(clockFace);
  const clockRimMat = new THREE.MeshStandardMaterial({ color: 0x222233, metalness: 0.8, roughness: 0.3 });
  const clockRim = new THREE.Mesh(new THREE.CylinderGeometry(0.33, 0.33, 0.04, 20), clockRimMat);
  clockRim.rotation.x = Math.PI / 2;
  wallClockGroup.add(clockRim);
  const clockHourHand = new THREE.Mesh(
    new THREE.BoxGeometry(0.02, 0.15, 0.008),
    new THREE.MeshBasicMaterial({ color: 0x111111 })
  );
  clockHourHand.geometry.translate(0, 0.075, 0);
  clockHourHand.position.z = 0.025;
  wallClockGroup.add(clockHourHand);
  const clockMinuteHand = new THREE.Mesh(
    new THREE.BoxGeometry(0.015, 0.22, 0.008),
    new THREE.MeshBasicMaterial({ color: 0x111111 })
  );
  clockMinuteHand.geometry.translate(0, 0.11, 0);
  clockMinuteHand.position.z = 0.03;
  wallClockGroup.add(clockMinuteHand);
  wallClockGroup.position.set(hw - 0.08, floorY + CEIL_H - 0.8, -3);
  wallClockGroup.rotation.y = -Math.PI / 2;
  wallClockGroup.userData.hourHand = clockHourHand;
  wallClockGroup.userData.minuteHand = clockMinuteHand;
  group.add(wallClockGroup);
  group.userData.wallClock = wallClockGroup;

  // ===== PENDANT LIGHTS (hanging from ceiling, 2 fixtures) =====
  const pendantMat = new THREE.MeshStandardMaterial({ color: accentColor, roughness: 0.4, metalness: 0.3 });
  for (const px of [-3, 3]) {
    // Hanging rod
    const rod = new THREE.Mesh(new THREE.CylinderGeometry(0.01, 0.01, 0.6, 6),
      new THREE.MeshStandardMaterial({ color: 0x444455, metalness: 0.7, roughness: 0.2 }));
    rod.position.set(px, floorY + CEIL_H - 0.3, 0);
    group.add(rod);
    // Shade (cone)
    const shade = new THREE.Mesh(new THREE.ConeGeometry(0.15, 0.12, 8, 1, true), pendantMat);
    shade.position.set(px, floorY + CEIL_H - 0.62, 0);
    shade.rotation.x = Math.PI;
    group.add(shade);
    // Warm glow
    const pendantLight = new THREE.PointLight(0xffe8c0, 8, 5, 2);
    pendantLight.position.set(px, floorY + CEIL_H - 0.7, 0);
    group.add(pendantLight);
  }

  // ===== CORK BULLETIN BOARD on left wall =====
  const corkCanvas = document.createElement('canvas');
  corkCanvas.width = 256;
  corkCanvas.height = 192;
  const corkCtx = corkCanvas.getContext('2d');
  corkCtx.fillStyle = '#8B6914';
  corkCtx.fillRect(0, 0, 256, 192);
  // Pinned notes
  const noteData = [
    { x: 20, y: 20, w: 70, h: 50, color: '#fef3c7', text: 'TEAM\nMEETING\n3PM' },
    { x: 110, y: 15, w: 65, h: 45, color: '#dbeafe', text: 'DEADLINE\nFRIDAY' },
    { x: 170, y: 40, w: 60, h: 55, color: '#d1fae5', text: 'GREAT\nWORK\nTEAM!' },
    { x: 30, y: 90, w: 80, h: 50, color: '#fce7f3', text: 'LUNCH\n& LEARN' },
    { x: 130, y: 100, w: 70, h: 55, color: '#fef9c3', text: 'SPRINT\nRETRO\nWED' },
  ];
  for (const note of noteData) {
    corkCtx.fillStyle = note.color;
    corkCtx.fillRect(note.x, note.y, note.w, note.h);
    corkCtx.fillStyle = '#334155';
    corkCtx.font = '10px sans-serif';
    const lines = note.text.split('\n');
    lines.forEach((line, li) => {
      corkCtx.fillText(line, note.x + 5, note.y + 14 + li * 12);
    });
    // Pin
    corkCtx.fillStyle = '#ef4444';
    corkCtx.beginPath();
    corkCtx.arc(note.x + note.w / 2, note.y + 4, 3, 0, Math.PI * 2);
    corkCtx.fill();
  }
  const corkTex = new THREE.CanvasTexture(corkCanvas);
  corkTex.colorSpace = THREE.SRGBColorSpace;
  // Board frame
  const corkFrameMat = new THREE.MeshStandardMaterial({ color: 0x2a1a0a, roughness: 0.5 });
  const corkFrame = new THREE.Mesh(new THREE.BoxGeometry(0.04, 1.2, 1.6), corkFrameMat);
  corkFrame.position.set(-hw + 0.05, floorY + 2.2, 3);
  group.add(corkFrame);
  const corkBoard = new THREE.Mesh(
    new THREE.PlaneGeometry(1.5, 1.1),
    new THREE.MeshStandardMaterial({ map: corkTex, roughness: 0.8 })
  );
  corkBoard.rotation.y = Math.PI / 2;
  corkBoard.position.set(-hw + 0.2, floorY + 2.2, 3);
  group.add(corkBoard);

  // ===== DEPARTMENT RUG (accent-colored, near entrance) =====
  const deptRugCanvas = document.createElement('canvas');
  deptRugCanvas.width = 256;
  deptRugCanvas.height = 128;
  const drCtx = deptRugCanvas.getContext('2d');
  drCtx.fillStyle = '#0e0a14';
  drCtx.fillRect(0, 0, 256, 128);
  drCtx.strokeStyle = accentHex;
  drCtx.lineWidth = 3;
  drCtx.strokeRect(8, 8, 240, 112);
  drCtx.strokeStyle = accentHex;
  drCtx.globalAlpha = 0.3;
  drCtx.strokeRect(16, 16, 224, 96);
  drCtx.globalAlpha = 1.0;
  drCtx.fillStyle = accentHex;
  drCtx.globalAlpha = 0.15;
  drCtx.font = 'bold 22px sans-serif';
  drCtx.textAlign = 'center';
  drCtx.textBaseline = 'middle';
  drCtx.fillText(name.toUpperCase(), 128, 64);
  drCtx.globalAlpha = 1.0;
  const deptRugTex = new THREE.CanvasTexture(deptRugCanvas);
  deptRugTex.colorSpace = THREE.SRGBColorSpace;
  const deptRug = new THREE.Mesh(
    new THREE.PlaneGeometry(3, 1.5),
    new THREE.MeshStandardMaterial({ map: deptRugTex, roughness: 0.85, polygonOffset: true, polygonOffsetFactor: -3, polygonOffsetUnits: -3 })
  );
  deptRug.rotation.x = -Math.PI / 2;
  deptRug.position.set(0, floorY + 0.005, -hd + 2.5);
  group.add(deptRug);

  // ===== UNIQUE DESK ITEMS (vary per agent for personality) =====
  for (let i = 0; i < agentPositions.length; i++) {
    const ap = agentPositions[i];
    // Sticky note pad (different colors per desk)
    if (i % 2 === 0) {
      const stickyColors = [0xfef3c7, 0xdbeafe, 0xd1fae5, 0xfce7f3, 0xfef9c3];
      const stickyMat = new THREE.MeshStandardMaterial({
        color: stickyColors[i % stickyColors.length], roughness: 0.8,
      });
      const sticky = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.01, 0.08), stickyMat);
      sticky.position.set(ap.x + 0.2, floorY + 0.815, ap.z - 0.15);
      sticky.rotation.y = 0.2 + i * 0.3;
      group.add(sticky);
    }
    // Pen on desk
    if (i % 3 === 1) {
      const penMat = new THREE.MeshStandardMaterial({ color: 0x1a1a88, roughness: 0.3 });
      const pen = new THREE.Mesh(new THREE.BoxGeometry(0.008, 0.008, 0.1), penMat);
      pen.position.set(ap.x + 0.15, floorY + 0.815, ap.z + 0.25);
      pen.rotation.y = 0.4 + i * 0.2;
      group.add(pen);
    }
    // Small succulent plant on desk (occasionally)
    if (i % 4 === 2) {
      const sucPotMat = new THREE.MeshStandardMaterial({ color: 0xcc9966, roughness: 0.6 });
      const sucPot = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.02, 0.04, 6), sucPotMat);
      sucPot.position.set(ap.x - 0.7, floorY + 0.83, ap.z + 0.2);
      group.add(sucPot);
      const sucPlant = new THREE.Mesh(new THREE.IcosahedronGeometry(0.03, 0),
        new THREE.MeshStandardMaterial({ color: 0x2d8a4e, roughness: 0.7 }));
      sucPlant.position.set(ap.x - 0.7, floorY + 0.87, ap.z + 0.2);
      group.add(sucPlant);
    }
    // Photo frame on desk
    if (i % 5 === 0 && i > 0) {
      const photoFrameMat = new THREE.MeshStandardMaterial({ color: 0x333344, roughness: 0.3, metalness: 0.4 });
      const photoFrame = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.1, 0.01), photoFrameMat);
      photoFrame.position.set(ap.x + 0.85, floorY + 0.86, ap.z + 0.2);
      photoFrame.rotation.x = -0.15;
      group.add(photoFrame);
      // Photo (small colored rect)
      const photoMat = new THREE.MeshBasicMaterial({ color: 0x3b82f6 });
      const photo = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.08, 0.005), photoMat);
      photo.position.set(ap.x + 0.85, floorY + 0.86, ap.z + 0.195);
      photo.rotation.x = -0.15;
      group.add(photo);
    }
    // Monitor arm (second monitor) for some desks
    if (i % 3 === 0) {
      const armMat = new THREE.MeshStandardMaterial({ color: 0x333344, roughness: 0.3, metalness: 0.5 });
      // Second smaller monitor
      const mon2 = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.35, 0.04),
        new THREE.MeshStandardMaterial({ color: 0x111122, roughness: 0.15, metalness: 0.5 }));
      mon2.position.set(ap.x + 0.6, floorY + 1.0, ap.z - 0.28);
      mon2.rotation.y = -0.2;
      group.add(mon2);
      // Screen glow
      const mon2Screen = new THREE.Mesh(new THREE.PlaneGeometry(0.42, 0.28),
        new THREE.MeshBasicMaterial({ color: new THREE.Color(accentColor).multiplyScalar(0.3) }));
      mon2Screen.position.set(ap.x + 0.6, floorY + 1.0, ap.z - 0.32);
      mon2Screen.rotation.y = -0.2;
      group.add(mon2Screen);
    }
  }

  // ===== DESK CHAIRS (simple box chairs behind each desk) =====
  const chairMat = new THREE.MeshStandardMaterial({ color: 0x1a1a2e, roughness: 0.5 });
  const chairLegMat = new THREE.MeshStandardMaterial({ color: 0x333344, roughness: 0.3, metalness: 0.5 });
  for (let i = 0; i < agentPositions.length; i++) {
    const ap = agentPositions[i];
    // Seat
    const seat = new THREE.Mesh(new THREE.BoxGeometry(0.45, 0.06, 0.45), chairMat);
    seat.position.set(ap.x, floorY + 0.48, ap.z);
    group.add(seat);
    // Back
    const cBack = new THREE.Mesh(new THREE.BoxGeometry(0.45, 0.4, 0.05), chairMat);
    const behindDir = ap.z < 0 ? 0.25 : -0.25;
    cBack.position.set(ap.x, floorY + 0.7, ap.z + behindDir);
    group.add(cBack);
    // Central leg/pedestal
    const pedestal = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.45, 6), chairLegMat);
    pedestal.position.set(ap.x, floorY + 0.24, ap.z);
    group.add(pedestal);
    // Star base (5 legs)
    for (let l = 0; l < 5; l++) {
      const angle = (l / 5) * Math.PI * 2;
      const legLen = 0.2;
      const leg = new THREE.Mesh(new THREE.BoxGeometry(legLen, 0.02, 0.02), chairLegMat);
      leg.position.set(
        ap.x + Math.cos(angle) * legLen / 2,
        floorY + 0.02,
        ap.z + Math.sin(angle) * legLen / 2
      );
      leg.rotation.y = angle;
      group.add(leg);
    }
  }

  // ===== DEPARTMENT KPI TICKER (scrolling-style text panel above elevator) =====
  const tickerCanvas = document.createElement('canvas');
  tickerCanvas.width = 512;
  tickerCanvas.height = 48;
  const tkCtx = tickerCanvas.getContext('2d');
  tkCtx.fillStyle = '#060810';
  tkCtx.fillRect(0, 0, 512, 48);
  tkCtx.fillStyle = accentHex;
  tkCtx.font = 'bold 11px monospace';
  tkCtx.textAlign = 'left';
  // Department-specific ticker messages
  const tickerMsgs = {
    Marketing: '▲ CTR 3.2%  |  LEADS +12 TODAY  |  SOCIAL +340 FOLLOWERS  |  CAMPAIGNS: 7 ACTIVE  |  SPEND: $142/DAY',
    Engineering: '▲ DEPLOY v2.4.1  |  TESTS 347/347 ✓  |  API p99: 340ms  |  UPTIME 99.98%  |  PRs OPEN: 2',
    Content: '▲ BLOG +340 VIEWS  |  VIDEO 4.2K PLAYS  |  CALENDAR 62% DONE  |  PODCAST EP 14 LIVE  |  SEO SCORE: 92',
    Intelligence: '▲ MODEL ACC: 97.2%  |  MRR FORECAST $48K  |  CHURN RISK: 2  |  COMPETITORS: 8 TRACKED  |  SENTIMENT 8.4/10',
    Operations: '▲ INVOICES: 142  |  BILLING 100%  |  TICKETS: 3 OPEN  |  NOTIFICATIONS: 228  |  AUTOMATIONS: 18 ACTIVE',
    Monitoring: '▲ ALL SYSTEMS GO  |  CPU 34%  |  MEM 62%  |  LATENCY 42ms  |  ERRORS: 0  |  UPTIME: 99.96%',
  };
  const tickerMsg = tickerMsgs[name] || '▲ CONDUIT AI — ALL SYSTEMS OPERATIONAL';
  tkCtx.fillText(tickerMsg, 8, 30);
  const tickerTex = new THREE.CanvasTexture(tickerCanvas);
  tickerTex.colorSpace = THREE.SRGBColorSpace;
  const tickerPanel = new THREE.Mesh(
    new THREE.PlaneGeometry(4.5, 0.3),
    new THREE.MeshBasicMaterial({ map: tickerTex })
  );
  tickerPanel.position.set(0, floorY + 3.8, -hd + 0.2);
  group.add(tickerPanel);

  // Store ticker data for scroll animation
  group.userData.ticker = {
    canvas: tickerCanvas,
    ctx: tkCtx,
    texture: tickerTex,
    msg: tickerMsg,
    accentHex,
    scrollOffset: 0,
  };

  // ===== GLASS PARTITION (divides desk area from break area) =====
  const partGlass = new THREE.MeshPhysicalMaterial({
    color: 0x88bbff, transparent: true, opacity: 0.06,
    roughness: 0.02, metalness: 0.1, side: THREE.DoubleSide,
  });
  const partition = new THREE.Mesh(new THREE.PlaneGeometry(0.04, 2.5), partGlass);
  partition.rotation.y = Math.PI / 2;
  partition.position.set(hw - 3.5, floorY + 1.5, 0);
  // Only add on floors with >=4 agents (not monitoring with 2)
  if (agents.length >= 4) {
    const partPane = new THREE.Mesh(new THREE.PlaneGeometry(4, 2.5), partGlass);
    partPane.position.set(hw - 3.5, floorY + 1.5, 3.5);
    partPane.rotation.y = -Math.PI / 2;
    group.add(partPane);
    // Mullion strip
    const partMullion = new THREE.Mesh(new THREE.BoxGeometry(0.03, 2.5, 0.03),
      new THREE.MeshStandardMaterial({ color: 0x444455, roughness: 0.3, metalness: 0.6 }));
    partMullion.position.set(hw - 3.5, floorY + 1.5, 5.5);
    group.add(partMullion);
    const partMullion2 = new THREE.Mesh(new THREE.BoxGeometry(0.03, 2.5, 0.03),
      new THREE.MeshStandardMaterial({ color: 0x444455, roughness: 0.3, metalness: 0.6 }));
    partMullion2.position.set(hw - 3.5, floorY + 1.5, 1.5);
    group.add(partMullion2);
  }

  // ===== CEILING FAN (animated, slow rotation) =====
  const ceilingFanGroup = new THREE.Group();
  // Motor housing — brushed metal cylinder
  const fanMotorMat = new THREE.MeshStandardMaterial({ color: 0xcccccc, roughness: 0.35, metalness: 0.7 });
  const fanMotor = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.18, 0.12, 12), fanMotorMat);
  ceilingFanGroup.add(fanMotor);
  // Mounting rod
  const fanRod = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.025, 0.4, 6), fanMotorMat);
  fanRod.position.y = 0.26;
  ceilingFanGroup.add(fanRod);
  // Ceiling plate
  const ceilingPlate = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 0.03, 8), fanMotorMat);
  ceilingPlate.position.y = 0.46;
  ceilingFanGroup.add(ceilingPlate);
  // 4 blades — dark brushed metal so they contrast against the ceiling
  const fanBladeMat = new THREE.MeshStandardMaterial({ color: 0x444444, roughness: 0.3, metalness: 0.8 });
  for (let b = 0; b < 4; b++) {
    const blade = new THREE.Mesh(new THREE.BoxGeometry(1.4, 0.06, 0.22), fanBladeMat);
    const angle = (b / 4) * Math.PI * 2;
    blade.position.set(Math.cos(angle) * 0.7, 0, Math.sin(angle) * 0.7);
    blade.rotation.y = angle;
    // Slight tilt for airflow
    blade.rotation.z = 0.05;
    ceilingFanGroup.add(blade);
  }
  ceilingFanGroup.position.set(-3, floorY + CEIL_H - 0.06, -2);
  group.add(ceilingFanGroup);
  group.userData.ceilingFan = ceilingFanGroup;
  console.log('[FIX] Ceiling fan rebuilt with 4 blades + brushed metal housing');

  // ===== WALL ART — framed colored rectangles to break up plain surfaces =====
  const wallArtDefs = [
    { x: hw - 0.25, y: floorY + 2.8, z: -5, rotY: -Math.PI / 2, w: 0.6, h: 0.8 },
    { x: hw - 0.25, y: floorY + 2.5, z: 5, rotY: -Math.PI / 2, w: 0.8, h: 0.5 },
    { x: -4, y: floorY + 2.8, z: -hd + 0.2, rotY: 0, w: 0.7, h: 0.6 },
  ];
  const artColors = [
    new THREE.Color(accentColor).multiplyScalar(0.6),
    new THREE.Color(accentColor).lerp(new THREE.Color(0x3b82f6), 0.5),
    new THREE.Color(accentColor).lerp(new THREE.Color(0x06b6d4), 0.5),
  ];
  wallArtDefs.forEach((wa, i) => {
    const artMat = new THREE.MeshBasicMaterial({ color: artColors[i % artColors.length] });
    const art = new THREE.Mesh(new THREE.PlaneGeometry(wa.w, wa.h), artMat);
    art.position.set(wa.x, wa.y, wa.z);
    art.rotation.y = wa.rotY;
    group.add(art);
    const frameMat2 = new THREE.MeshStandardMaterial({ color: 0x1a1520, roughness: 0.3, metalness: 0.4 });
    const ft = 0.04;
    const isWallX = Math.abs(wa.rotY) === Math.PI / 2;
    const fw2 = isWallX ? ft : wa.w + 0.08;
    const fd2 = isWallX ? wa.w + 0.08 : ft;
    const frame = new THREE.Mesh(new THREE.BoxGeometry(fw2, wa.h + 0.08, fd2), frameMat2);
    frame.position.set(wa.x, wa.y, wa.z);
    group.add(frame);
  });

  // Run extras callback if provided
  if (extras) {
    extras(group, floorY, CEIL_H, hw, hd);
  }

  // --- Glass Partitions (modern office aesthetic) ---
  const glassMat = new THREE.MeshPhysicalMaterial({
    color: 0xddeeff, transparent: true, opacity: 0.06,
    roughness: 0.05, metalness: 0.0,
    envMapIntensity: 0.3,
    side: THREE.DoubleSide,
  });
  const glassFrameMat = new THREE.MeshStandardMaterial({
    color: 0x888899, metalness: 0.8, roughness: 0.2,
  });

  // Partition between desk rows (center divider)
  const centerPartition = new THREE.Mesh(
    new THREE.PlaneGeometry(6, 2.5), glassMat
  );
  centerPartition.position.set(0, floorY + 1.5, 0);
  group.add(centerPartition);
  // Frame top
  const centerFrame = new THREE.Mesh(
    new THREE.BoxGeometry(6.1, 0.03, 0.03), glassFrameMat
  );
  centerFrame.position.set(0, floorY + 2.75, 0);
  group.add(centerFrame);
  // Frame posts
  for (const px of [-3, 0, 3]) {
    const post = new THREE.Mesh(
      new THREE.CylinderGeometry(0.015, 0.015, 2.5, 6), glassFrameMat
    );
    post.position.set(px, floorY + 1.5, 0);
    group.add(post);
  }

  // Side partitions (near walls, creating office pods)
  for (const side of [-1, 1]) {
    const sidePartition = new THREE.Mesh(
      new THREE.PlaneGeometry(2.5, 2.2), glassMat
    );
    sidePartition.position.set(side * 4, floorY + 1.35, 0);
    sidePartition.rotation.y = Math.PI / 2;
    group.add(sidePartition);
    // Frame
    const sideFrame = new THREE.Mesh(
      new THREE.BoxGeometry(0.03, 2.2, 0.03), glassFrameMat
    );
    sideFrame.position.set(side * 4, floorY + 1.35, -1.25);
    group.add(sideFrame);
    const sideFrame2 = new THREE.Mesh(
      new THREE.BoxGeometry(0.03, 2.2, 0.03), glassFrameMat
    );
    sideFrame2.position.set(side * 4, floorY + 1.35, 1.25);
    group.add(sideFrame2);
    const sideTop = new THREE.Mesh(
      new THREE.BoxGeometry(0.03, 0.03, 2.6), glassFrameMat
    );
    sideTop.position.set(side * 4, floorY + 2.45, 0);
    group.add(sideTop);
  }

  // --- Walking NPCs (2 per floor) ---
  const walkingNpcs = createWalkingNpcs(group, floorY, 2, accentColor);

  // --- Speech Bubbles ---
  const speechBubbles = createSpeechBubbles(npcModels, name);

  scene.add(group);

  // --- Update functions ---
  function updateScreens() {
    const deptScreen = DEPT_SCREENS[name];
    for (let i = 0; i < screenCanvases.length; i++) {
      const canvas = screenCanvases[i];
      const ctx = canvas.getContext('2d');
      if (deptScreen) {
        deptScreen(ctx, canvas.width, canvas.height, i);
      } else {
        randomDashboard(ctx, canvas.width, canvas.height, accentHex);
      }
      screenTextures[i].needsUpdate = true;
    }
  }

  // --- Atmospheric effects: dust particles + volumetric fog ---
  const dustSystem = createDustParticles(group, {
    count: 40,
    spread: { x: FLOOR_W - 2, y: CEIL_H - 0.5, z: FLOOR_D - 2 },
    baseY: floorY + 0.3,
    color: name === 'Monitoring' ? 0xff6644 : (name === 'Engineering' ? 0xffaa66 : 0xddeeff),
    size: 0.035,
    opacity: 0.35,
  });

  const fogSystem = createVolumetricFog(group, {
    layers: 3,
    width: FLOOR_W - 2,
    height: CEIL_H - 1,
    depth: FLOOR_D - 2,
    color: name === 'Monitoring' ? 0x442222 : (name === 'Engineering' ? 0x332211 : 0x222233),
    opacity: 0.018,
    baseY: floorY,
  });

  // Engineering + Monitoring get ember particles (server room feel)
  let emberSystem = null;
  if (name === 'Engineering' || name === 'Monitoring') {
    emberSystem = createEmberParticles(group, {
      count: 15,
      spread: { x: 8, y: 2.5, z: 6 },
      baseY: floorY,
      color: name === 'Monitoring' ? 0xff3322 : 0xff8844,
      size: 0.025,
    });
  }

  // --- Mark desks as interactable for hover outline ---
  group.traverse(child => {
    if (child.isMesh && child.geometry === deskGeo) {
      markInteractable(child, 'Press E to inspect agent');
    }
  });

  function updateFloor(time, playerPos) {
    // Atmospheric updates
    dustSystem.update(time);
    fogSystem.update(time);
    if (emberSystem) emberSystem.update(time);

    // Update screens every ~3 seconds for alive feeling
    if (time - screenTimer > 3) {
      screenTimer = time;
      updateScreens();
    }
    // Procedural agent idle animations (typing, breathing, head look, swivel)
    const dt = time - (group.userData._lastAnimTime || 0);
    group.userData._lastAnimTime = time;
    const animDelta = Math.min(dt, 0.1); // clamp to avoid large jumps
    // Walking NPCs
    updateWalkingNpcs(walkingNpcs, animDelta, time);
    // Speech bubbles
    speechBubbles.update(time);
    for (const g of npcModels) {
      updateAgentAnimation(g, time, animDelta, playerPos);
    }
    // Wall clock animation
    if (group.userData.wallClock) {
      const now = new Date();
      const hours = now.getHours() % 12;
      const minutes = now.getMinutes();
      const hourAngle = -((hours + minutes / 60) / 12) * Math.PI * 2;
      const minuteAngle = -(minutes / 60) * Math.PI * 2;
      group.userData.wallClock.userData.hourHand.rotation.z = hourAngle;
      group.userData.wallClock.userData.minuteHand.rotation.z = minuteAngle;
    }
    // Blinking server LEDs (monitoring floor)
    if (group.userData.blinkDots) {
      for (const dot of group.userData.blinkDots) {
        const v = Math.sin(time * dot.speed + dot.phase);
        dot.mesh.material.opacity = v > 0.3 ? 1 : 0.1;
        dot.mesh.material.transparent = true;
      }
    }
    // Ceiling fan rotation
    if (group.userData.ceilingFan) {
      group.userData.ceilingFan.rotation.y += 0.008;
    }
    // Ticker scroll animation (stock-ticker style)
    if (group.userData.ticker) {
      const tk = group.userData.ticker;
      tk.scrollOffset += 0.5;
      const c = tk.canvas;
      const ctx = tk.ctx;
      ctx.fillStyle = '#060810';
      ctx.fillRect(0, 0, c.width, c.height);
      ctx.fillStyle = tk.accentHex;
      ctx.font = 'bold 11px monospace';
      ctx.textAlign = 'left';
      const textW = ctx.measureText(tk.msg).width;
      const x = c.width - (tk.scrollOffset % (textW + c.width));
      ctx.fillText(tk.msg, x, 30);
      // Draw a second copy for seamless loop
      ctx.fillText(tk.msg, x + textW + 40, 30);
      tk.texture.needsUpdate = true;
    }
    // Status LED pulse on desk monitors
    for (const led of statusLeds) {
      if (led.isGreen) {
        // Green LEDs: gentle steady pulse
        const brightness = 0.7 + Math.sin(time * 2 + led.phase) * 0.3;
        led.mesh.material.opacity = brightness;
        led.mesh.material.transparent = true;
      } else {
        // Yellow LEDs: slower pulse (busy/thinking)
        const brightness = 0.4 + Math.sin(time * 1.2 + led.phase) * 0.6;
        led.mesh.material.opacity = brightness;
        led.mesh.material.transparent = true;
      }
    }
  }

  return { group, mixers, updateFloor, agentPositions, walkingNpcs };
}

// ---- Helpers ----

function makeBox(w, h, d, x, y, z, mat) {
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
  const sign = new THREE.Mesh(
    new THREE.PlaneGeometry(0.5, 0.18),
    new THREE.MeshBasicMaterial({ map: tex })
  );
  sign.position.set(x, y, z);
  sign.rotation.y = rotY;
  parent.add(sign);
}

function randomDashboard(ctx, w, h, accentHex) {
  ctx.fillStyle = '#0a0e1a'; ctx.fillRect(0, 0, w, h);
  const colors = ['#3b82f6', '#06b6d4', '#10b981', '#22d3ee', accentHex || '#2563eb', '#0891b2'];
  for (let i = 0; i < 6; i++) {
    ctx.fillStyle = colors[Math.floor(Math.random() * colors.length)];
    ctx.fillRect(Math.random() * w * 0.7 + 16, h * 0.3 + Math.random() * h * 0.5, 40 + Math.random() * 120, 20 + Math.random() * 60);
  }
  ctx.fillStyle = '#22d3ee'; ctx.fillRect(16, 10, w - 32, 6);
  ctx.fillStyle = '#334155';
  for (let i = 0; i < 3; i++) {
    ctx.fillRect(16, 36 + i * 28, 100 + Math.random() * 200, 10);
  }
}

function createNameTagWithStatus(name, status, accentHex) {
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
  ctx.strokeStyle = accentHex || '#3b82f6';
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
