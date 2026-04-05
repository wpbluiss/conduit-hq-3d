import * as THREE from 'three/webgpu';
import { TOWER, COLORS } from '../constants.js';
import { createAsphaltMaterial, createConcreteMaterial, createTileTexture } from '../utils/textures.js';
import { loadModel } from '../utils/modelLoader.js';

export async function createGround(scene) {
  const group = new THREE.Group();

  // ═══ FAR GROUND ═══
  const farGround = new THREE.Mesh(
    new THREE.PlaneGeometry(1000, 1000),
    new THREE.MeshPhysicalMaterial({ color: 0x4a4a52, roughness: 0.7, metalness: 0.05, envMapIntensity: 0.8 })
  );
  farGround.rotation.x = -Math.PI / 2;
  farGround.position.y = -0.02;
  farGround.receiveShadow = true;
  group.add(farGround);

  // ═══ ROAD with real asphalt texture ═══
  const road = new THREE.Mesh(new THREE.PlaneGeometry(200, 14), createAsphaltMaterial(12, 2));
  road.rotation.x = -Math.PI / 2;
  road.position.set(0, 0.02, 32);
  road.receiveShadow = true;
  group.add(road);

  // Lane markings
  const dashMat = new THREE.MeshPhysicalMaterial({ color: 0xddcc33, roughness: 0.5 });
  const laneMat = new THREE.MeshPhysicalMaterial({ color: 0xeeeeee, roughness: 0.4 });
  for (let i = 0; i < 20; i++) {
    const dash = new THREE.Mesh(new THREE.BoxGeometry(3, 0.02, 0.15), dashMat);
    dash.position.set(-95 + i * 10, 0.04, 32);
    group.add(dash);
  }
  [-1, 1].forEach(s => {
    const lane = new THREE.Mesh(new THREE.BoxGeometry(200, 0.02, 0.12), laneMat);
    lane.position.set(0, 0.035, 32 + s * 6.5);
    group.add(lane);
  });

  // Crosswalk
  const crossMat = new THREE.MeshPhysicalMaterial({ color: 0xf0f0f0, roughness: 0.5 });
  for (let i = 0; i < 8; i++) {
    const stripe = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.02, 4), crossMat);
    stripe.position.set(-3 + i * 0.9, 0.035, 32);
    group.add(stripe);
  }

  // ═══ SIDEWALK with real concrete texture ═══
  const sidewalk = new THREE.Mesh(new THREE.PlaneGeometry(50, 40), createConcreteMaterial(8, 6));
  sidewalk.rotation.x = -Math.PI / 2;
  sidewalk.position.set(0, 0.05, 5);
  sidewalk.receiveShadow = true;
  group.add(sidewalk);

  // ═══ CURBS ═══
  const curbMat = new THREE.MeshPhysicalMaterial({ color: 0x999999, roughness: 0.65 });
  const curbShape = new THREE.Shape();
  curbShape.moveTo(0, 0);
  curbShape.lineTo(0.3, 0);
  curbShape.lineTo(0.25, 0.18);
  curbShape.lineTo(0.05, 0.18);
  curbShape.lineTo(0, 0.12);
  const curbGeo = new THREE.ExtrudeGeometry(curbShape, { depth: 52, bevelEnabled: false });
  [24.5, -15.5].forEach(z => {
    const curb = new THREE.Mesh(curbGeo, curbMat);
    curb.position.set(-26, 0, z);
    group.add(curb);
  });

  // ═══ PLAZA with tile texture ═══
  const plaza = new THREE.Mesh(
    new THREE.PlaneGeometry(20, 10),
    new THREE.MeshPhysicalMaterial({
      map: createTileTexture(), roughness: 0.2, clearcoat: 0.7,
      clearcoatRoughness: 0.08, envMapIntensity: 1.5, metalness: 0.05,
    })
  );
  plaza.rotation.x = -Math.PI / 2;
  plaza.position.set(0, 0.06, 18);
  plaza.receiveShadow = true;
  group.add(plaza);

  // ═══ ENTRANCE ═══
  // Branded mat
  const matCanvas = document.createElement('canvas');
  matCanvas.width = 256; matCanvas.height = 128;
  const mctx = matCanvas.getContext('2d');
  mctx.fillStyle = '#0a0b10';
  mctx.fillRect(0, 0, 256, 128);
  mctx.strokeStyle = '#3b82f6';
  mctx.lineWidth = 3;
  mctx.strokeRect(8, 8, 240, 112);
  mctx.fillStyle = '#3b82f6';
  mctx.font = 'bold 28px sans-serif';
  mctx.textAlign = 'center';
  mctx.textBaseline = 'middle';
  mctx.fillText('CONDUIT AI', 128, 64);
  const matTex = new THREE.CanvasTexture(matCanvas);
  matTex.colorSpace = THREE.SRGBColorSpace;
  const eMat = new THREE.Mesh(
    new THREE.PlaneGeometry(4, 2),
    new THREE.MeshPhysicalMaterial({ map: matTex, roughness: 0.8 })
  );
  eMat.rotation.x = -Math.PI / 2;
  eMat.position.set(0, 0.07, 13);
  group.add(eMat);

  // Bollards
  const bollardMat = new THREE.MeshPhysicalMaterial({
    color: 0x444444, metalness: 0.9, roughness: 0.15, envMapIntensity: 1.5,
  });
  [-3, -2, 2, 3].forEach(x => {
    const b = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.12, 0.9, 8), bollardMat);
    b.position.set(x, 0.45, 14);
    b.castShadow = true;
    group.add(b);
    const ring = new THREE.Mesh(
      new THREE.TorusGeometry(0.08, 0.015, 6, 12),
      new THREE.MeshPhysicalMaterial({
        color: COLORS.cyan, emissive: COLORS.cyan,
        emissiveIntensity: 2.0, toneMapped: false,
      })
    );
    ring.position.set(x, 0.92, 14);
    ring.rotation.x = Math.PI / 2;
    group.add(ring);
  });

  scene.add(group);

  // ═══ LOAD REAL 3D MODELS (async, placed after scene.add so scene renders immediately) ═══
  loadRealModels(scene);

  return group;
}

async function loadRealModels(scene) {
  // Street lamps — real Poly Haven model
  try {
    const lampData = await loadModel('/models/streetlamp/street_lamp_01.glb');
    const lampPositions = [[-20, 26], [-8, 26], [8, 26], [20, 26]];
    lampPositions.forEach(([x, z]) => {
      const lamp = lampData.scene.clone();
      lamp.scale.setScalar(2.5);
      lamp.position.set(x, 0, z);
      lamp.traverse(c => {
        if (c.isMesh) { c.castShadow = true; c.receiveShadow = true; }
      });
      scene.add(lamp);

      // Add actual light at lamp head position
      const light = new THREE.PointLight(0xffddaa, 12, 12, 2);
      light.position.set(x, 5, z - 1);
      scene.add(light);
    });
    console.log('Loaded real street lamps');
  } catch (e) {
    console.warn('Street lamp model failed:', e);
  }

  // Benches — real Poly Haven modular street seating
  try {
    const benchData = await loadModel('/models/bench/modular_street_seating.glb');
    [[-14, 20, Math.PI / 2], [14, 20, -Math.PI / 2]].forEach(([x, z, ry]) => {
      const bench = benchData.scene.clone();
      bench.scale.setScalar(1.8);
      bench.position.set(x, 0, z);
      bench.rotation.y = ry;
      bench.traverse(c => {
        if (c.isMesh) { c.castShadow = true; c.receiveShadow = true; }
      });
      scene.add(bench);
    });
    console.log('Loaded real benches');
  } catch (e) {
    console.warn('Bench model failed:', e);
  }

  // Entrance planters — real Poly Haven planter boxes with plants
  try {
    const planterData = await loadModel('/models/planterbox/planter_box_01.glb');
    const plantData = await loadModel('/models/plant/potted_plant_01.glb');

    [-5.5, 5.5].forEach(x => {
      const planter = planterData.scene.clone();
      planter.scale.setScalar(2.0);
      planter.position.set(x, 0, 14);
      planter.traverse(c => { if (c.isMesh) c.castShadow = true; });
      scene.add(planter);

      const plant = plantData.scene.clone();
      plant.scale.setScalar(1.5);
      plant.position.set(x, 0.5, 14);
      plant.traverse(c => { if (c.isMesh) c.castShadow = true; });
      scene.add(plant);
    });
    console.log('Loaded real planters + plants');
  } catch (e) {
    console.warn('Planter/plant models failed:', e);
  }
}
