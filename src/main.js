import * as THREE from 'three/webgpu';
import { ELEVATOR, NPC, LOBBY } from './constants.js';

// Stage 1 -- Exterior
import { createSky } from './scene/sky.js';
import { createLighting } from './scene/lighting.js';
import { createEnvironment } from './scene/environment.js';
import { createTower } from './buildings/tower.js';
import { createSignage } from './buildings/signage.js';
import { createSkyline } from './buildings/skyline.js';
import { createGround } from './world/ground.js';
import { createPalms } from './world/palms.js';
import { createPlayer } from './player/capsule.js';
import { createControls } from './player/controls.js';

// Stage 2 -- Interior
import { createLobby } from './interior/lobby.js';
import { createReceptionDesk } from './interior/receptionDesk.js';
import { createFurniture } from './interior/furniture.js';
import { createElevatorBank } from './interior/elevatorBank.js';
import { createLobbyLighting } from './interior/lobbyLighting.js';
import { createLogoWall } from './interior/logoWall.js';
import { createReceptionist } from './npc/receptionist.js';
import { createProximitySystem } from './interaction/proximity.js';
import { createElevatorSystem } from './interaction/elevatorSystem.js';
import { createPromptOverlay } from './ui/promptOverlay.js';
import { createElevatorPanel } from './ui/elevatorPanel.js';

// Stage 3 -- Floors
import { createSalesFloor, updateSalesFloor, updateWallClocks, setSalesCeilingFan } from './interior/salesFloor.js';
import { createCeoSuite, updateCeoClocks, setCeoCeilingFan } from './interior/ceoSuite.js';
import { DEPARTMENTS } from './interior/departments.js';
import { createDepartmentFloor } from './interior/floorFactory.js';

// Stage 4 -- UI + Live Data
import { createJarvisChat } from './ui/jarvisChat.js';
import { createHUD, updateFloorName } from './ui/hud.js';
import { createActivityFeed } from './ui/activityFeed.js';

// Stage 5-7 -- Ambient life, interactions, polish
import { startAmbience } from './audio/ambience.js';
import { initAmbientAudio, setAudioFloor } from './audio/ambientAudio.js';
import { createAgentCard } from './ui/agentCard.js';
import { createCeoDashboard } from './ui/ceoDashboard.js';
import { createMinimap } from './ui/minimap.js';
import { createVoiceMic } from './ui/voiceMic.js';
import { createFloorTitle, FLOOR_DISPLAY } from './ui/floorTitle.js';
import { createBoardMeeting } from './ui/boardMeeting.js';
import { createNotifications } from './ui/notifications.js';
import { createCompanyDashboard } from './ui/companyDashboard.js';
import { createReceptionPanel } from './ui/receptionPanel.js';
import { createOutdoor } from './world/outdoor.js';
import { createPostProcessing } from './scene/postprocessing.js';
import { createDustParticles, createVolumetricFog, createScreenFlicker } from './scene/atmospherics.js';
import { createHoverOutline, markInteractable } from './interaction/hoverOutline.js';

// Stage 8 -- Live data integration
import { setCurrentFloor, getAgentTask } from './data/liveAgentStatus.js';
import { updateAgentAnimation as _updateReceptionist } from './npc/agentAnimator.js';
import { preloadCharacterModel } from './npc/characterLoader.js';

const loadBar = document.getElementById('load-bar');
const loadPct = document.getElementById('load-pct');
const loadingScreen = document.getElementById('loading');

function setProgress(pct) {
  if (loadBar) loadBar.style.width = pct + '%';
  if (loadPct) loadPct.textContent = Math.round(pct) + '%';
}

async function init() {
  // --- WebGPU Renderer (async init required) ---
  const renderer = new THREE.WebGPURenderer({ antialias: true, powerPreference: 'high-performance' });
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.2;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.outputColorSpace = THREE.SRGBColorSpace;

  // WebGPU requires async initialization
  await renderer.init();
  document.body.appendChild(renderer.domElement);

  // --- Visual QA hooks ---
  window.__SCENE_READY = false;
  window.__renderer = renderer;
  window.__currentFPS = 0;

  setProgress(5);

  // --- Scene & Camera ---
  const scene = new THREE.Scene();
  window.__scene = scene;
  scene.background = new THREE.Color(0x87ceeb); // fallback blue sky until HDR loads
  scene.fog = new THREE.FogExp2(0x887766, 0.0005); // subtle warm haze — crisp, not cloudy
  const camera = new THREE.PerspectiveCamera(55, window.innerWidth / window.innerHeight, 0.1, 1000);

  // Baseline warm ambient so objects are ALWAYS visible
  const baselineAmbient = new THREE.AmbientLight(0xfff5e8, 1.0);
  scene.add(baselineAmbient);

  // --- Build the world ---
  const { updateSky } = createSky(scene);
  setProgress(10);

  createLighting(scene);
  setProgress(15);

  const skylineGroup = createSkyline(scene);
  setProgress(20);

  // Load HDR environment map (async)
  await createEnvironment(renderer, scene);
  setProgress(30);

  // Wrap exterior objects in a group for visibility toggling on upper floors
  const exteriorGroup = new THREE.Group();
  exteriorGroup.name = 'exterior';

  // Tower, signage, ground, palms go into exterior group
  // But they call scene.add() internally, so we temporarily swap scene.add
  const origAdd = scene.add.bind(scene);
  const exteriorCapture = [];
  scene.add = function(...args) {
    for (const a of args) exteriorCapture.push(a);
    origAdd(...args);
  };

  createTower(scene);
  setProgress(40);

  let signageGroup = null;
  try {
    signageGroup = await createSignage(scene);
  } catch (e) {
    console.warn('Signage font load failed, using fallback:', e);
    createFallbackSignage(scene);
  }
  setProgress(48);

  await createGround(scene);
  setProgress(52);

  createPalms(scene);
  setProgress(54);

  setProgress(55);

  // Restore scene.add and reparent captured objects under exteriorGroup
  scene.add = origAdd;
  for (const obj of exteriorCapture) {
    scene.remove(obj);
    exteriorGroup.add(obj);
  }
  scene.add(exteriorGroup);

  // Outdoor environment (cars, fountain, street lights, bench, fog)
  const outdoor = createOutdoor(exteriorGroup);

  // --- Interior (lobby) — wrap in group for hiding on upper floors ---
  const lobbyInteriorGroup = new THREE.Group();
  lobbyInteriorGroup.name = 'lobbyInterior';
  const lobbyCapture = [];
  scene.add = function(...args) {
    for (const a of args) lobbyCapture.push(a);
    origAdd(...args);
  };

  const lobbyGroup = createLobby(scene);
  setProgress(60);

  createReceptionDesk(scene);
  setProgress(63);

  await createFurniture(scene);
  setProgress(66);

  const { doorPositions, animateDoors, openDoors, closeDoors } = createElevatorBank(scene);
  setProgress(70);

  createLobbyLighting(scene);
  setProgress(73);

  let logoWallGroup = null;
  try {
    logoWallGroup = await createLogoWall(scene);
  } catch (e) {
    console.warn('Logo wall font load failed:', e);
  }
  setProgress(78);

  const receptionist = await createReceptionist(scene);
  // Mark receptionist as interactable for hover outline
  if (receptionist.group) {
    markInteractable(receptionist.group, 'Press E to check in');
  }
  setProgress(82);

  // --- Lobby floating light motes (particles) — brighter, more magical ---
  const MOTE_COUNT = 100;
  const moteGeo = new THREE.BufferGeometry();
  const motePositions = new Float32Array(MOTE_COUNT * 3);
  const moteSpeeds = new Float32Array(MOTE_COUNT);
  for (let i = 0; i < MOTE_COUNT; i++) {
    motePositions[i * 3] = (Math.random() - 0.5) * 18;     // x: lobby width
    motePositions[i * 3 + 1] = 0.5 + Math.random() * 6.5;  // y: floor to ceiling
    motePositions[i * 3 + 2] = (Math.random() - 0.5) * 14;  // z: lobby depth
    moteSpeeds[i] = 0.2 + Math.random() * 0.5;
  }
  moteGeo.setAttribute('position', new THREE.BufferAttribute(motePositions, 3));
  const moteMat = new THREE.PointsMaterial({
    color: 0xaaddff,
    size: 0.09,
    transparent: true,
    opacity: 0.7,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
  });
  const motePoints = new THREE.Points(moteGeo, moteMat);
  motePoints.position.set(0, 0, 0);
  lobbyCapture.push(motePoints);
  scene.add(motePoints);

  // --- Light shafts from entrance (volumetric-style additive planes) ---
  const shaftMat = new THREE.MeshBasicMaterial({
    color: 0xffddaa,
    transparent: true,
    opacity: 0.06,
    blending: THREE.AdditiveBlending,
    side: THREE.DoubleSide,
    depthWrite: false,
  });
  for (let si = 0; si < 3; si++) {
    const shaft = new THREE.Mesh(new THREE.PlaneGeometry(2.5, 7), shaftMat);
    shaft.position.set(-3 + si * 3, 3.5, LOBBY.depth / 2 - 1);
    shaft.rotation.x = -0.15;
    shaft.rotation.y = (si - 1) * 0.1;
    lobbyCapture.push(shaft);
    scene.add(shaft);
  }

  // Restore and reparent
  scene.add = origAdd;
  for (const obj of lobbyCapture) {
    scene.remove(obj);
    lobbyInteriorGroup.add(obj);
  }
  scene.add(lobbyInteriorGroup);

  // Player (async -- loads 3D model)
  const player = await createPlayer(scene);
  const controls = createControls(camera, player, renderer.domElement);

  // --- Post-processing pipeline (bloom, GTAO, outline, film grain) ---
  let ppEnabled = true;
  let ppChain = null;
  try {
    ppChain = createPostProcessing(renderer, scene, camera);
    console.log('[PP] Post-processing pipeline created: bloom + GTAO + outline + film grain');
  } catch (e) {
    console.warn('[PP] Post-processing failed, falling back to direct render:', e);
    ppEnabled = false;
  }

  // --- Screen flicker system ---
  const screenFlicker = createScreenFlicker();

  // --- Lobby atmospheric effects (subtle — not hazy) ---
  const lobbyDust = createDustParticles(lobbyInteriorGroup, {
    count: 25,
    spread: { x: 18, y: 6, z: 12 },
    baseY: 0.3,
    color: 0xffeedd,
    size: 0.025,
    opacity: 0.2,
  });
  const lobbyFog = createVolumetricFog(lobbyInteriorGroup, {
    layers: 2,
    width: 18,
    height: 6,
    depth: 14,
    color: 0x998877,
    opacity: 0.008,
    baseY: 0,
  });

  // Hover outline created later (after promptOverlay is declared)
  let hoverOutline = null;

  setProgress(86);

  // --- Pre-load rigged character model ---
  await preloadCharacterModel();

  // --- Build upper floors ---
  // Sales floor (custom built)
  const salesResult = await createSalesFloor(scene);
  if (salesResult.group.userData.ceilingFan) {
    setSalesCeilingFan(salesResult.group.userData.ceilingFan);
  }
  setProgress(88);

  // CEO Suite (custom built, now at y=400)
  const ceoResult = await createCeoSuite(scene);
  if (ceoResult.group.userData.ceilingFan) {
    setCeoCeilingFan(ceoResult.group.userData.ceilingFan);
  }
  setProgress(90);

  // --- Factory-built department floors ---
  // Map of floorY -> { group, mixers, updateFloor, agentPositions, deptInfo }
  const floorMap = new Map();

  // Sales floor agents info
  const salesDept = DEPARTMENTS.find(d => d.id === 'sales');
  const salesAgentPositions = salesResult.agentPositions || [];
  floorMap.set(50, {
    group: salesResult.group, mixers: salesResult.mixers, updateFloor: null,
    custom: 'sales', agentPositions: salesAgentPositions,
    agents: salesDept ? salesDept.agents : [],
    deptName: 'Sales', accentHex: '#3b82f6',
  });

  floorMap.set(400, {
    group: ceoResult.group, mixers: [], updateFloor: null,
    custom: 'ceo', jarvisMixer: ceoResult.jarvisMixer,
    agentPositions: [], agents: [], deptName: 'CEO Suite', accentHex: '#8b5cf6',
  });

  // Build factory floors for departments that are not lobby, sales, or ceo
  const factoryDepts = DEPARTMENTS.filter(d => d.id !== 'lobby' && d.id !== 'sales' && d.id !== 'ceo');
  for (let di = 0; di < factoryDepts.length; di++) {
    const dept = factoryDepts[di];
    const result = await createDepartmentFloor(scene, {
      id: dept.id,
      floorY: dept.y,
      name: dept.name,
      accentColor: dept.accentColor,
      agents: dept.agents,
      extras: dept.extras,
    });
    const accentHex = '#' + new THREE.Color(dept.accentColor).getHexString();
    floorMap.set(dept.y, {
      group: result.group, mixers: result.mixers, updateFloor: result.updateFloor, custom: null,
      agentPositions: result.agentPositions || [],
      agents: dept.agents || [],
      deptName: dept.name, accentHex,
      walkingNpcs: result.walkingNpcs || [],
    });
    setProgress(90 + Math.floor((di + 1) / factoryDepts.length * 5));
  }

  setProgress(95);

  // --- Interaction systems ---
  const promptOverlay = createPromptOverlay();
  const elevatorPanel = createElevatorPanel();
  const proximity = createProximitySystem(player);
  const elevator = createElevatorSystem(player, controls, elevatorPanel, promptOverlay, { openDoors, closeDoors });

  // --- Hover outline system (needs promptOverlay, so created here) ---
  if (ppChain) {
    hoverOutline = createHoverOutline(camera, scene, ppChain.selectedObjects, promptOverlay);
  }

  // --- UI Overlays ---
  const jarvisChat = createJarvisChat();
  createHUD();
  const activityFeed = createActivityFeed();

  // Stage 6: Agent card, CEO dashboard, minimap, voice mic, floor title
  const agentCard = createAgentCard();
  const ceoDashboard = createCeoDashboard();
  const minimap = createMinimap(player);
  const voiceMic = createVoiceMic();
  const floorTitle = createFloorTitle();
  const boardMeeting = createBoardMeeting(ceoResult.group);
  const notifications = createNotifications();
  const receptionPanel = createReceptionPanel((floor) => {
    elevator.teleportToFloor(floor);
  });

  // --- Company Dashboard Screens ---
  const dashboards = [];
  // Lobby dashboard — back wall, facing +Z
  {
    const lobbyDash = createCompanyDashboard(0, 5.5, -6.5, 0, 1);
    lobbyInteriorGroup.add(lobbyDash.mesh);
    lobbyInteriorGroup.add(lobbyDash.bezel);
    lobbyInteriorGroup.add(lobbyDash.glow);
    dashboards.push(lobbyDash);
  }
  // CEO Suite dashboard — side wall
  {
    const ceoDash = createCompanyDashboard(-8, 402.5, 0, Math.PI / 2, 1);
    ceoResult.group.add(ceoDash.mesh);
    ceoResult.group.add(ceoDash.bezel);
    ceoResult.group.add(ceoDash.glow);
    dashboards.push(ceoDash);
  }

  // --- Floor visibility culling ---
  // Start with upper floors hidden (player begins in lobby)
  for (const [floorY, floorData] of floorMap) {
    floorData.group.visible = false;
    floorData.group.traverse(child => { child.visible = false; });
  }
  let currentFloorY = 0;

  // Comprehensive mesh audit at startup
  {
    let visTris = 0, hidTris = 0, visMeshes = 0, hidMeshes = 0;
    const groupTris = new Map(); // parent name -> tris
    scene.traverse(obj => {
      if (obj.isMesh && obj.geometry) {
        const tris = obj.geometry.index
          ? obj.geometry.index.count / 3
          : (obj.geometry.attributes.position?.count || 0) / 3;
        let hidden = false;
        let p = obj;
        while (p) { if (!p.visible) { hidden = true; break; } p = p.parent; }
        if (hidden) { hidTris += tris; hidMeshes++; }
        else { visTris += tris; visMeshes++; }
        // Track by top-level parent
        let topParent = obj;
        while (topParent.parent && topParent.parent !== scene) topParent = topParent.parent;
        const pname = topParent.name || topParent.type || 'unnamed';
        groupTris.set(pname, (groupTris.get(pname) || 0) + tris);
      }
    });
    console.log(`%c=== MESH AUDIT ===`, 'color:red;font-weight:bold');
    console.log(`VISIBLE: ${Math.round(visTris)} tris (${visMeshes} meshes) | HIDDEN: ${Math.round(hidTris)} tris (${hidMeshes} meshes)`);
    console.log(`Top-level groups by triangle count:`);
    [...groupTris.entries()].sort((a, b) => b[1] - a[1]).forEach(([name, tris]) => {
      console.log(`  ${Math.round(tris).toString().padStart(8)} tris | ${name}`);
    });
    // Per-floor counts
    for (const [fy, fd] of floorMap) {
      let floorTris = 0;
      fd.group.traverse(obj => {
        if (obj.isMesh && obj.geometry) {
          floorTris += obj.geometry.index
            ? obj.geometry.index.count / 3
            : (obj.geometry.attributes.position?.count || 0) / 3;
        }
      });
      console.log(`  Floor y=${fy}: ${Math.round(floorTris)} tris, visible=${fd.group.visible}`);
    }
  }

  // Track which agents are near the player
  let nearAgentInfo = null;
  let nearCeoDesk = false;

  const floorNameMap = {
    0: 'Lobby',
    50: 'Floor 2 — Sales',
    100: 'Floor 3 — Marketing',
    150: 'Floor 4 — Engineering',
    200: 'Floor 5 — Content',
    250: 'Floor 6 — Intelligence',
    300: 'Floor 7 — Operations',
    350: 'Floor 8 — Monitoring',
    400: 'Floor 15 — CEO Suite',
  };

  function switchToFloor(floorY) {
    currentFloorY = floorY;
    updateFloorName(floorNameMap[floorY] || `Floor — Unknown`);

    const isLobby = (floorY <= 0);
    const isCeo = (floorY === 400);

    // Exterior (tower, ground, palms) only on lobby and CEO
    // Skyline buildings visible from ALL floors (city view through windows)
    exteriorGroup.visible = isLobby || isCeo;
    exteriorGroup.traverse(c => { c.visible = exteriorGroup.visible; });
    skylineGroup.visible = true;
    skylineGroup.traverse(c => { c.visible = true; });
    lobbyInteriorGroup.visible = isLobby;
    lobbyInteriorGroup.traverse(c => { c.visible = lobbyInteriorGroup.visible; });

    // Hide ALL upper floors, show only current
    for (const [fy, floorData] of floorMap) {
      const shouldShow = (fy === floorY);
      floorData.group.visible = shouldShow;
      floorData.group.traverse(child => { child.visible = shouldShow; });
    }

    // Debug: count visible triangles
    let visTris = 0, hidTris = 0, visCount = 0, hidCount = 0;
    scene.traverse(obj => {
      if (obj.isMesh && obj.geometry) {
        const tris = obj.geometry.index
          ? obj.geometry.index.count / 3
          : (obj.geometry.attributes.position?.count || 0) / 3;
        // Walk parents to check true visibility
        let hidden = false;
        let p = obj;
        while (p) { if (!p.visible) { hidden = true; break; } p = p.parent; }
        if (hidden) { hidTris += tris; hidCount++; }
        else { visTris += tris; visCount++; }
      }
    });
    console.log(`FLOOR SWITCH y=${floorY} | VISIBLE: ${Math.round(visTris)} tris (${visCount} meshes) | HIDDEN: ${Math.round(hidTris)} tris (${hidCount} meshes)`);
    console.log('[PERF] Visible triangles:', Math.round(visTris));
    console.log('[FIX] Floor culling applied — only floor y=' + floorY + ' visible');

    // Update minimap data for new floor
    updateMinimapForFloor(floorY);

    // Fetch live agent data for this floor
    setCurrentFloor(floorY);

    // Switch ambient audio to new floor
    setAudioFloor(floorY);

    // Show cinematic floor title on arrival (skip lobby — player starts there)
    const floorDisplay = FLOOR_DISPLAY[floorY];
    if (floorDisplay && floorY > 0) {
      floorTitle.show(floorDisplay.floor, floorDisplay.department, floorDisplay.accent);
    }
  }

  elevator.onFloorChange(switchToFloor);

  // --- Visual QA: camera teleport hook ---
  // Controls are GTA-style 3rd person — they overwrite camera.position every frame.
  // To take screenshots from arbitrary angles we must: disable controls, switch floor, force render.
  const FLOOR_YS = [0, 50, 100, 150, 200, 250, 300, 350, 400];
  window.__setCamera = (pos, target) => {
    controls.setInputEnabled(false);
    // Determine which floor to show based on camera Y
    let bestFloorY = 0;
    let bestDist = Infinity;
    for (const fy of FLOOR_YS) {
      const d = Math.abs(pos.y - fy);
      if (d < bestDist) { bestDist = d; bestFloorY = fy; }
    }
    switchToFloor(bestFloorY);
    camera.position.set(pos.x, pos.y, pos.z);
    camera.lookAt(target.x, target.y, target.z);
    renderer.renderAsync(scene, camera);
  };

  // --- Minimap floor data helper ---
  function updateMinimapForFloor(floorY) {
    const floorData = floorMap.get(floorY);
    if (!floorData) {
      minimap.setFloorData([], [], []);
      return;
    }
    const agents = [];
    const desks = [];
    if (floorData.agentPositions && floorData.agents) {
      for (let i = 0; i < floorData.agentPositions.length; i++) {
        const ap = floorData.agentPositions[i];
        const ag = floorData.agents[i];
        const color = ag && ag.status === 'green' ? '#10b981' : '#eab308';
        agents.push({ x: ap.x, z: ap.z, color });
        desks.push({ x: ap.x, z: ap.z, w: 2.2, d: 1.2 });
      }
    }
    minimap.setFloorData(agents, desks, floorData.walkingNpcs || []);
  }

  // --- Proximity zones ---
  let nearReceptionist = false;
  proximity.addZone({
    position: receptionist.position,
    radius: NPC.greetDistance,
    id: 'receptionist',
    onEnter: () => {
      nearReceptionist = true;
      promptOverlay.show('Welcome to Conduit AI. Press E to check in');
    },
    onExit: () => {
      nearReceptionist = false;
      if (!elevator.isNearElevator()) promptOverlay.hide();
    },
  });

  // Elevator proximity zones -- offset Z forward from door mesh so player triggers from in front
  doorPositions.forEach((pos, i) => {
    const triggerPos = new THREE.Vector3(pos.x, pos.y, pos.z + 2);
    console.log(`Elevator zone ${i}: door at (${pos.x}, ${pos.y}, ${pos.z}), trigger at (${triggerPos.x}, ${triggerPos.y}, ${triggerPos.z}), radius=${ELEVATOR.promptDistance}`);
    proximity.addZone({
      position: triggerPos,
      radius: ELEVATOR.promptDistance,
      id: `elevator-${i}`,
      yTolerance: 5,
      onEnter: () => {
        elevator.setNearElevator(true);
        promptOverlay.show('Press E to enter elevator');
        openDoors();
      },
      onExit: () => {
        elevator.setNearElevator(false);
        promptOverlay.hide();
        closeDoors();
      },
    });
  });

  // Add elevator proximity zones on EVERY upper floor
  const upperFloorYs = [50, 100, 150, 200, 250, 300, 350, 400];
  upperFloorYs.forEach((fy) => {
    proximity.addZone({
      position: new THREE.Vector3(0, fy, -6),
      radius: 3.0,
      id: `elevator-floor-${fy}`,
      yTolerance: 3,
      onEnter: () => {
        elevator.setNearElevator(true);
        promptOverlay.show('Press E to enter elevator');
      },
      onExit: () => {
        elevator.setNearElevator(false);
        promptOverlay.hide();
      },
    });
  });

  // --- Agent proximity zones (all floors) ---
  for (const [floorY, floorData] of floorMap) {
    if (!floorData.agentPositions || !floorData.agents) continue;
    for (let ai = 0; ai < floorData.agentPositions.length; ai++) {
      const ap = floorData.agentPositions[ai];
      const ag = floorData.agents[ai];
      if (!ag) continue;
      const agentWorldPos = new THREE.Vector3(ap.x, floorY, ap.z);
      proximity.addZone({
        position: agentWorldPos,
        radius: 2.5,
        id: `agent-${floorY}-${ai}`,
        yTolerance: 3,
        onEnter: () => {
          nearAgentInfo = {
            name: ag.name,
            status: ag.status,
            department: floorData.deptName,
            accentHex: floorData.accentHex,
          };
          if (!elevator.isNearElevator()) {
            promptOverlay.show(`Press E to inspect ${ag.name}`);
          }
        },
        onExit: () => {
          if (nearAgentInfo && nearAgentInfo.name === ag.name) {
            nearAgentInfo = null;
            if (!elevator.isNearElevator()) {
              promptOverlay.hide();
            }
          }
        },
      });
    }
  }

  // --- CEO desk proximity zone ---
  proximity.addZone({
    position: new THREE.Vector3(0, 400, -2),
    radius: 3.0,
    id: 'ceo-desk',
    yTolerance: 3,
    onEnter: () => {
      nearCeoDesk = true;
      if (!elevator.isNearElevator()) {
        promptOverlay.show('Press E to view CEO Dashboard');
      }
    },
    onExit: () => {
      nearCeoDesk = false;
      if (!elevator.isNearElevator()) {
        promptOverlay.hide();
      }
    },
  });

  // --- Board room proximity zone (CEO Suite) ---
  let nearBoardRoom = false;
  proximity.addZone({
    position: new THREE.Vector3(6, 400, 4),
    radius: 3.0,
    id: 'board-room',
    yTolerance: 3,
    onEnter: () => {
      nearBoardRoom = true;
      if (!elevator.isNearElevator()) {
        promptOverlay.show(boardMeeting.isActive()
          ? 'Press B to end Board Meeting'
          : 'Press B to start Board Meeting');
      }
    },
    onExit: () => {
      nearBoardRoom = false;
      if (!elevator.isNearElevator()) {
        promptOverlay.hide();
      }
    },
  });

  // --- E key handler for agents, CEO desk, and receptionist (when NOT near elevator) ---
  elevator.onEKey(() => {
    // This fires when E is pressed but NOT near elevator
    if (receptionPanel.isOpen()) {
      receptionPanel.close();
      return;
    }
    if (agentCard.isOpen()) {
      agentCard.hide();
      return;
    }
    if (ceoDashboard.isOpen()) {
      ceoDashboard.hide();
      return;
    }
    if (nearReceptionist && currentFloorY <= 0) {
      receptionPanel.open();
      return;
    }
    if (nearCeoDesk && currentFloorY === 400) {
      ceoDashboard.show();
      return;
    }
    if (nearAgentInfo) {
      agentCard.show(nearAgentInfo);
      return;
    }
  });

  // JARVIS proximity zone (CEO Suite)
  let nearJarvis = false;
  proximity.addZone({
    position: ceoResult.jarvisPosition,
    radius: 4.0,
    id: 'jarvis',
    yTolerance: 3,
    onEnter: () => {
      nearJarvis = true;
      if (!jarvisChat.isOpen()) {
        promptOverlay.show('Press J to chat with JARVIS  |  Press V to talk');
      }
    },
    onExit: () => {
      nearJarvis = false;
      promptOverlay.hide();
    },
  });

  // J key for JARVIS chat -- works from any floor
  document.addEventListener('keydown', (e) => {
    if (e.code === 'KeyJ') {
      jarvisChat.toggle();
      if (jarvisChat.isOpen()) {
        promptOverlay.hide();
      } else if (nearJarvis) {
        promptOverlay.show('Press J to chat with JARVIS  |  Press V to talk');
      }
    }
    // V key for voice interaction (near JARVIS)
    if (e.code === 'KeyV') {
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
      if (voiceMic.isOpen()) {
        voiceMic.hide();
      } else if (nearJarvis) {
        voiceMic.show();
        promptOverlay.hide();
      }
    }
    // B key for board meeting (near board room on CEO floor)
    if (e.code === 'KeyB') {
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
      if (nearBoardRoom && currentFloorY === 400) {
        boardMeeting.toggle();
        promptOverlay.show(boardMeeting.isActive()
          ? 'Press B to end Board Meeting'
          : 'Press B to start Board Meeting');
      }
    }
    // Escape closes voice mic
    if (e.code === 'Escape' && voiceMic.isOpen()) {
      voiceMic.hide();
    }
  });

  controls.setCollisionScene(scene);

  // Hide exterior when player walks inside building on lobby floor
  // Lobby interior is ALWAYS visible on floor 0 — only exterior toggles
  controls.setOnIndoorChange((isIndoor) => {
    if (currentFloorY <= 0) {
      const showExterior = !isIndoor;
      // Ensure lobby interior stays visible at all times on floor 0
      lobbyInteriorGroup.visible = true;
      lobbyInteriorGroup.traverse(c => { c.visible = true; });
      exteriorGroup.visible = showExterior;
      exteriorGroup.traverse(c => { c.visible = showExterior; });
      skylineGroup.visible = showExterior;
      skylineGroup.traverse(c => { c.visible = showExterior; });
      // When going outdoor on lobby floor, hide all upper floors too
      if (showExterior) {
        for (const [fy, floorData] of floorMap) {
          floorData.group.visible = false;
          floorData.group.traverse(child => { child.visible = false; });
        }
      }
    }
  });

  setProgress(100);

  // Start minimal ambient sound (40Hz hum, on first interaction)
  startAmbience();
  initAmbientAudio();

  setTimeout(() => {
    if (loadingScreen) loadingScreen.classList.add('done');
  }, 600);

  // --- Visual QA: signal scene ready after all assets loaded ---
  window.__SCENE_READY = true;

  // --- Lobby clock reference ---
  const lobbyClock = lobbyGroup.userData.lobbyClock;

  // --- Resize ---
  window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
  });

  // --- FPS Counter ---
  const fpsEl = document.createElement('div');
  fpsEl.style.cssText = `
    position:fixed;top:8px;left:8px;color:#10b981;font:600 12px monospace;
    z-index:999;pointer-events:none;opacity:0.7;
  `;
  document.body.appendChild(fpsEl);
  let frameCount = 0;
  let fpsTime = performance.now();

  // Animation clock for mixers
  const clock = new THREE.Clock();
  let elapsedTime = 0;

  // --- Sign glow material reference (5c) ---
  const signMat = signageGroup?.userData?.signMaterial || null;

  // --- Render Loop ---
  renderer.setAnimationLoop(() => {
    const delta = clock.getDelta();
    elapsedTime += delta;

    controls.update();
    proximity.update();
    animateDoors(delta);

    // Update animation mixers
    if (player.userData.mixer) player.userData.mixer.update(delta);
    // Animate receptionist (articulated agent with state machine)
    if (lobbyInteriorGroup.visible && receptionist.group?.userData?.animState) {
      _updateReceptionist(receptionist.group, elapsedTime, Math.min(delta, 0.1), player.position);
    }

    // Update floor-specific animations only for visible floors
    for (const [fy, floorData] of floorMap) {
      if (!floorData.group.visible) continue;

      // Update mixers
      if (floorData.mixers) {
        for (const m of floorData.mixers) m.update(delta);
      }

      // Custom floor updates
      if (floorData.custom === 'sales') {
        updateSalesFloor(elapsedTime, player.position);
        updateWallClocks();
      } else if (floorData.custom === 'ceo') {
        if (floorData.jarvisMixer) floorData.jarvisMixer.update(delta);
        updateCeoClocks();
      } else if (floorData.updateFloor) {
        floorData.updateFloor(elapsedTime, player.position);
      }
    }

    // Logo wall glow pulse (only if lobby visible)
    if (lobbyInteriorGroup.visible && logoWallGroup) {
      const logoTextMat = logoWallGroup.userData.logoTextMat;
      const logoHaloMat = logoWallGroup.userData.logoHaloMat;
      if (logoTextMat) {
        logoTextMat.emissiveIntensity = 2.5 + 1.0 * Math.sin(elapsedTime * 0.8);
      }
      if (logoHaloMat) {
        logoHaloMat.emissiveIntensity = 0.3 + 0.3 * Math.sin(elapsedTime * 0.8 + 0.5);
      }
    }

    // Animate lobby light motes
    if (lobbyInteriorGroup.visible && motePoints) {
      const posArr = motePoints.geometry.attributes.position.array;
      for (let i = 0; i < MOTE_COUNT; i++) {
        const speed = moteSpeeds[i];
        posArr[i * 3 + 1] += Math.sin(elapsedTime * speed + i) * 0.003; // gentle float
        posArr[i * 3] += Math.cos(elapsedTime * speed * 0.7 + i * 2) * 0.001; // drift
        // Wrap vertically
        if (posArr[i * 3 + 1] > 7) posArr[i * 3 + 1] = 0.5;
        if (posArr[i * 3 + 1] < 0.3) posArr[i * 3 + 1] = 6.5;
      }
      motePoints.geometry.attributes.position.needsUpdate = true;
    }

    // Update lobby clock (only if lobby visible)
    if (lobbyClock && lobbyInteriorGroup.visible) {
      const now = new Date();
      const hours = now.getHours() % 12;
      const minutes = now.getMinutes();
      lobbyClock.userData.hourHand.rotation.z = -((hours + minutes / 60) / 12) * Math.PI * 2;
      lobbyClock.userData.minuteHand.rotation.z = -(minutes / 60) * Math.PI * 2;
    }

    // 5c: Conduit AI sign glow pulsing (only when exterior visible)
    // Update sky (clouds, aircraft)
    updateSky(elapsedTime, delta);

    if (signMat && exteriorGroup.visible) {
      signMat.emissiveIntensity = 0.5 + 1.5 * (0.5 + 0.5 * Math.sin(elapsedTime * 1.2));
    }

    // Outdoor environment (fountain spray, fog drift)
    if (exteriorGroup.visible) {
      outdoor.update(elapsedTime);
    }

    // Board meeting animation (CEO floor only)
    boardMeeting.update(elapsedTime);

    // Notification toasts
    notifications.update(elapsedTime);

    // Company dashboards (update only when parent group visible)
    for (const dash of dashboards) {
      dash.update(elapsedTime);
    }

    // Update lobby atmospheric effects (only when visible)
    if (lobbyInteriorGroup.visible) {
      lobbyDust.update(elapsedTime);
      lobbyFog.update(elapsedTime);
    }

    // Screen flicker
    screenFlicker.update(elapsedTime);

    // Hover outline detection (only when pointer is locked)
    if (hoverOutline) {
      hoverOutline.update(elapsedTime);
    }

    // Render with post-processing pipeline (bloom + outline + film grain)
    if (ppEnabled && ppChain) {
      ppChain.pipeline.render();
    } else {
      renderer.renderAsync(scene, camera);
    }

    frameCount++;
    const now = performance.now();
    if (now - fpsTime >= 1000) {
      window.__currentFPS = Math.round((frameCount * 1000) / (now - fpsTime));
      const backend = renderer.backend?.constructor?.name || 'WebGPU';
      fpsEl.textContent = `${window.__currentFPS} FPS | ${backend} | ${renderer.info.render.triangles} tris | ${renderer.info.render.calls} draws`;
      frameCount = 0;
      fpsTime = now;
    }
  });
}

function createFallbackSignage(scene) {
  const canvas = document.createElement('canvas');
  canvas.width = 1024;
  canvas.height = 128;
  const ctx = canvas.getContext('2d');
  ctx.clearRect(0, 0, 1024, 128);
  ctx.font = 'bold 80px Arial, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  const grad = ctx.createLinearGradient(200, 0, 824, 0);
  grad.addColorStop(0, '#3b82f6');
  grad.addColorStop(1, '#06b6d4');
  ctx.fillStyle = grad;
  ctx.fillText('CONDUIT AI', 512, 64);
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  const mat = new THREE.MeshBasicMaterial({ map: tex, transparent: true, side: THREE.DoubleSide });
  const mesh = new THREE.Mesh(new THREE.PlaneGeometry(14, 1.8), mat);
  mesh.position.set(0, 14, 10);
  scene.add(mesh);
}

init().catch(console.error);
