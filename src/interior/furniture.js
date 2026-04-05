import * as THREE from 'three/webgpu';
import { LOBBY } from '../constants.js';
import { loadModel } from '../utils/modelLoader.js';

export async function createFurniture(scene) {
  const group = new THREE.Group();
  scene.add(group);

  // Load real models in parallel, falling back to primitives if any fail
  await Promise.allSettled([
    loadSofas(group),
    loadCoffeeTable(group),
    loadPlants(group),
  ]);

  // Debug: log all meshes near lobby floor level
  group.traverse(obj => {
    if (obj.isMesh && obj.position.y < 3) {
      console.log('[DEBUG] Lobby mesh:', obj.name || obj.type,
        obj.position.x.toFixed(1), obj.position.y.toFixed(1), obj.position.z.toFixed(1));
    }
  });
  console.log('[FIX] Random security desk removed from lobby');

  // ===== VISITOR SEATING AREA (front-right of lobby) =====
  const benchMat = new THREE.MeshPhysicalMaterial({ color: 0x1a1a28, roughness: 0.45, clearcoat: 0.2 });
  const legMat = new THREE.MeshStandardMaterial({ color: 0x333344, roughness: 0.3, metalness: 0.5 });

  // Two visitor benches facing each other
  for (const [bx, bz, bRot] of [[7, 2, 0], [7, -1, Math.PI]]) {
    const benchG = new THREE.Group();
    // Seat
    const seat = new THREE.Mesh(new THREE.BoxGeometry(2.4, 0.12, 0.7), benchMat);
    seat.position.y = 0.42;
    benchG.add(seat);
    // Back
    const back = new THREE.Mesh(new THREE.BoxGeometry(2.4, 0.45, 0.08), benchMat);
    back.position.set(0, 0.7, -0.32);
    benchG.add(back);
    // Legs
    for (const [lx, lz] of [[-1.0, -0.25], [-1.0, 0.25], [1.0, -0.25], [1.0, 0.25]]) {
      const leg = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.4, 0.04), legMat);
      leg.position.set(lx, 0.2, lz);
      benchG.add(leg);
    }
    benchG.position.set(bx, LOBBY.floorY, bz);
    benchG.rotation.y = bRot;
    group.add(benchG);
  }

  // Small side table between benches
  const sideTableMat = new THREE.MeshPhysicalMaterial({ color: 0x1a1520, roughness: 0.2, metalness: 0.15 });
  const sideTable = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.04, 0.6), sideTableMat);
  sideTable.position.set(7, LOBBY.floorY + 0.5, 0.5);
  group.add(sideTable);
  for (const [lx, lz] of [[-0.22, -0.22], [-0.22, 0.22], [0.22, -0.22], [0.22, 0.22]]) {
    const tLeg = new THREE.Mesh(new THREE.BoxGeometry(0.03, 0.48, 0.03), legMat);
    tLeg.position.set(7 + lx, LOBBY.floorY + 0.24, 0.5 + lz);
    group.add(tLeg);
  }

  // Magazine stack on side table
  const magMat = new THREE.MeshStandardMaterial({ color: 0xf0f0e8, roughness: 0.8 });
  for (let m = 0; m < 3; m++) {
    const mag = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.006, 0.13), magMat);
    mag.position.set(7, LOBBY.floorY + 0.53 + m * 0.007, 0.5);
    mag.rotation.y = m * 0.15;
    group.add(mag);
  }

  // "VISITOR" sign on wall near seating
  const visCanvas = document.createElement('canvas');
  visCanvas.width = 256;
  visCanvas.height = 64;
  const vctx = visCanvas.getContext('2d');
  vctx.fillStyle = '#0a0e14';
  vctx.fillRect(0, 0, 256, 64);
  vctx.strokeStyle = '#3b82f6';
  vctx.lineWidth = 2;
  vctx.strokeRect(4, 4, 248, 56);
  vctx.fillStyle = '#94a3b8';
  vctx.font = 'bold 22px sans-serif';
  vctx.textAlign = 'center';
  vctx.textBaseline = 'middle';
  vctx.fillText('VISITOR SEATING', 128, 32);
  const visTex = new THREE.CanvasTexture(visCanvas);
  visTex.colorSpace = THREE.SRGBColorSpace;
  const visSign = new THREE.Mesh(
    new THREE.PlaneGeometry(1.2, 0.3),
    new THREE.MeshBasicMaterial({ map: visTex })
  );
  visSign.rotation.y = -Math.PI / 2;
  visSign.position.set(LOBBY.width / 2 - LOBBY.wallInset - 0.05, 2.5, 0.5);
  group.add(visSign);

  return group;
}

async function loadSofas(parent) {
  try {
    const sofaData = await loadModel('/models/sofa/Sofa_01.glb');

    // Left sofa
    const sofa1 = sofaData.scene.clone();
    sofa1.scale.setScalar(2.0);
    sofa1.position.set(-5, LOBBY.floorY, 5.5);
    sofa1.rotation.y = Math.PI / 2;
    setupMesh(sofa1);
    parent.add(sofa1);

    // Right sofa
    const sofa2 = sofaData.scene.clone();
    sofa2.scale.setScalar(2.0);
    sofa2.position.set(5, LOBBY.floorY, 5.5);
    sofa2.rotation.y = -Math.PI / 2;
    setupMesh(sofa2);
    parent.add(sofa2);

    console.log('Loaded real sofas');
  } catch (e) {
    console.warn('Sofa model failed, using fallback:', e);
    createFallbackCouch(parent, -5, 5.5, 0);
    createFallbackCouch(parent, 5, 5.5, Math.PI);
  }
}

async function loadCoffeeTable(parent) {
  try {
    const tableData = await loadModel('/models/coffeetable/modern_coffee_table_01.glb');
    const table = tableData.scene.clone();
    table.scale.setScalar(2.0);
    table.position.set(0, LOBBY.floorY, 3.5);
    setupMesh(table);
    parent.add(table);
    console.log('Loaded real coffee table');
  } catch (e) {
    console.warn('Coffee table model failed:', e);
    // Fallback glass table
    const glassMat = new THREE.MeshPhysicalMaterial({
      color: 0xffffff, transparent: true, opacity: 0.3,
      roughness: 0.0, clearcoat: 1.0, envMapIntensity: 1.5,
    });
    const top = new THREE.Mesh(new THREE.BoxGeometry(2.2, 0.04, 1.0), glassMat);
    top.position.set(0, 0.48 + LOBBY.floorY, 3.5);
    parent.add(top);
  }
}

async function loadPlants(parent) {
  try {
    const plantData = await loadModel('/models/plant/potted_plant_01.glb');
    const plant2Data = await loadModel('/models/plant2/potted_plant_02.glb');

    const plantPositions = [
      [-8.5, 6, 1.2, plantData],
      [8.5, 6, 1.2, plantData],
      [-9.2, -6.5, 1.0, plant2Data],
      [9.2, -6.5, 1.0, plant2Data],
    ];

    plantPositions.forEach(([x, z, scale, data]) => {
      const plant = data.scene.clone();
      plant.scale.setScalar(scale);
      plant.position.set(x, LOBBY.floorY, z);
      setupMesh(plant);
      parent.add(plant);
    });
    console.log('Loaded real potted plants');
  } catch (e) {
    console.warn('Plant models failed, using fallback:', e);
    [[-8.5, 6], [8.5, 6], [-9.2, -6.5], [9.2, -6.5]].forEach(([x, z]) => {
      createFallbackPlant(parent, x, z);
    });
  }
}

async function loadSecurityDesk(parent) {
  try {
    const deskData = await loadModel('/models/officedesk/metal_office_desk.glb');
    const desk = deskData.scene.clone();
    desk.scale.setScalar(1.5);
    desk.position.set(-7.5, LOBBY.floorY, 2);
    desk.rotation.y = Math.PI / 6;
    setupMesh(desk);
    parent.add(desk);
    console.log('Loaded real office desk');
  } catch (e) {
    console.warn('Office desk model failed:', e);
    createFallbackDesk(parent);
  }
}

// Helper to enable shadows on all meshes in a model
function setupMesh(model) {
  model.traverse(c => {
    if (c.isMesh) {
      c.castShadow = true;
      c.receiveShadow = true;
      if (c.material) {
        c.material.envMapIntensity = 1.2;
      }
    }
  });
}

// ═══ FALLBACKS ═══

function createFallbackCouch(parent, x, z, rotY) {
  const mat = new THREE.MeshPhysicalMaterial({
    color: 0x1a1a28, roughness: 0.55, clearcoat: 0.2,
  });
  const g = new THREE.Group();
  const seat = new THREE.Mesh(new THREE.BoxGeometry(2.6, 0.35, 0.9), mat);
  seat.position.set(0, 0.35, 0);
  g.add(seat);
  const back = new THREE.Mesh(new THREE.BoxGeometry(2.6, 0.5, 0.15), mat);
  back.position.set(0, 0.65, -0.45);
  g.add(back);
  g.position.set(x, LOBBY.floorY, z);
  g.rotation.y = rotY;
  parent.add(g);
}

function createFallbackPlant(parent, x, z) {
  const g = new THREE.Group();
  const pot = new THREE.Mesh(
    new THREE.CylinderGeometry(0.22, 0.18, 0.6, 8),
    new THREE.MeshPhysicalMaterial({ color: 0x2a2a30, roughness: 0.3, clearcoat: 0.5 })
  );
  pot.position.y = 0.3;
  g.add(pot);
  const leaf = new THREE.MeshPhysicalMaterial({ color: 0x1d5e15, roughness: 0.6 });
  [[0, 0.85, 0, 0.3], [0.1, 1.05, 0.08, 0.22], [-0.08, 0.95, -0.06, 0.2]].forEach(([fx, fy, fz, r]) => {
    const s = new THREE.Mesh(new THREE.IcosahedronGeometry(r, 1), leaf);
    s.position.set(fx, fy, fz);
    g.add(s);
  });
  g.position.set(x, LOBBY.floorY, z);
  parent.add(g);
}

function createFallbackDesk(parent) {
  const mat = new THREE.MeshPhysicalMaterial({ color: 0x151520, roughness: 0.3, clearcoat: 0.5 });
  const desk = new THREE.Mesh(new THREE.BoxGeometry(2, 1.0, 1.2), mat);
  desk.position.set(-7.5, 0.5 + LOBBY.floorY, 2);
  desk.rotation.y = Math.PI / 6;
  parent.add(desk);
}
