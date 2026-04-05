import * as THREE from 'three/webgpu';

/**
 * Walking NPCs — patrol between waypoints on each floor.
 * Creates standing humanoids that walk between desk areas,
 * pause briefly, then continue to the next waypoint.
 */

const skinTones = [0xFFDBAC, 0xF1C27D, 0xE0AC69, 0xC68642, 0x8D5524];
const outfitColors = [0x2a3040, 0x3a2a2a, 0x1e3028, 0x302828, 0x282838];

// Waypoints per floor type (relative to floor center)
const FLOOR_WAYPOINTS = [
  { x: -5, z: 0 },
  { x: 5, z: 0 },
  { x: 3, z: 5 },
  { x: -3, z: -4 },
  { x: 0, z: 4 },
];

export function createWalkingNpcs(parentGroup, floorY, count = 2, accentColor = 0x3b82f6) {
  const npcs = [];

  for (let i = 0; i < count; i++) {
    const npc = createWalkingHumanoid(i, accentColor);
    const startWp = i % FLOOR_WAYPOINTS.length;
    const wp = FLOOR_WAYPOINTS[startWp];

    npc.group.position.set(wp.x, floorY, wp.z);
    parentGroup.add(npc.group);

    npcs.push({
      group: npc.group,
      parts: npc.parts,
      floorY,
      currentWaypoint: startWp,
      targetWaypoint: (startWp + 1 + i) % FLOOR_WAYPOINTS.length,
      speed: 1.2 + Math.random() * 0.6, // 1.2-1.8 units/sec
      pauseTimer: Math.random() * 2, // stagger starts
      paused: true,
      pauseDuration: 3 + Math.random() * 2, // 3-5s pause
      walkPhase: Math.random() * Math.PI * 2,
    });
  }

  return npcs;
}

export function updateWalkingNpcs(npcs, delta, time) {
  for (const npc of npcs) {
    if (npc.paused) {
      npc.pauseTimer += delta;
      if (npc.pauseTimer >= npc.pauseDuration) {
        npc.paused = false;
        npc.pauseTimer = 0;
        // Pick next waypoint
        npc.currentWaypoint = npc.targetWaypoint;
        npc.targetWaypoint = (npc.targetWaypoint + 1 + Math.floor(Math.random() * 2)) % FLOOR_WAYPOINTS.length;
      }
      // Idle animation — subtle sway
      if (npc.parts) {
        npc.parts.torso.rotation.z = Math.sin(time * 0.5 + npc.walkPhase) * 0.02;
      }
      return;
    }

    const target = FLOOR_WAYPOINTS[npc.targetWaypoint];
    const pos = npc.group.position;
    const dx = target.x - pos.x;
    const dz = target.z - pos.z;
    const dist = Math.sqrt(dx * dx + dz * dz);

    if (dist < 0.3) {
      // Arrived — start pause
      npc.paused = true;
      npc.pauseTimer = 0;
      npc.pauseDuration = 3 + Math.random() * 2;
      // Reset walk animation
      if (npc.parts) {
        npc.parts.leftLeg.rotation.x = 0;
        npc.parts.rightLeg.rotation.x = 0;
        npc.parts.leftArm.rotation.x = 0;
        npc.parts.rightArm.rotation.x = 0;
      }
      return;
    }

    // Move toward target
    const moveX = (dx / dist) * npc.speed * delta;
    const moveZ = (dz / dist) * npc.speed * delta;
    pos.x += moveX;
    pos.z += moveZ;

    // Face movement direction
    const angle = Math.atan2(dx, dz);
    npc.group.rotation.y += (angle - npc.group.rotation.y) * Math.min(1, delta * 5);

    // Walk animation
    npc.walkPhase += delta * npc.speed * 4;
    if (npc.parts) {
      const swing = Math.sin(npc.walkPhase) * 0.4;
      npc.parts.leftLeg.rotation.x = swing;
      npc.parts.rightLeg.rotation.x = -swing;
      npc.parts.leftArm.rotation.x = -swing * 0.5;
      npc.parts.rightArm.rotation.x = swing * 0.5;
      // Slight body bob
      npc.parts.torso.position.y = 0.17 + Math.abs(Math.sin(npc.walkPhase)) * 0.02;
    }
  }
}

function createWalkingHumanoid(index, accentColor) {
  const group = new THREE.Group();
  const skinColor = skinTones[index % skinTones.length];
  const outfitColor = outfitColors[index % outfitColors.length];
  const isFemale = index % 2 === 1;

  const skinMat = new THREE.MeshPhysicalMaterial({
    color: skinColor, roughness: 0.65, metalness: 0.0,
  });
  const suitMat = new THREE.MeshPhysicalMaterial({
    color: outfitColor, roughness: 0.5, metalness: 0.05,
    clearcoat: 0.15, clearcoatRoughness: 0.3,
  });
  const hairMat = new THREE.MeshPhysicalMaterial({
    color: isFemale ? 0x2a1a08 : 0x1a1008, roughness: 0.8,
  });
  const shoeMat = new THREE.MeshPhysicalMaterial({
    color: 0x111115, roughness: 0.3, metalness: 0.15,
  });

  // Legs (animatable)
  const leftLeg = new THREE.Group();
  leftLeg.name = 'leftLeg';
  leftLeg.position.set(-0.09, 0.4, 0);
  const leftLegMesh = new THREE.Mesh(new THREE.CapsuleGeometry(0.06, 0.45, 3, 6), suitMat);
  leftLeg.add(leftLegMesh);
  const leftShoe = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.05, 0.18), shoeMat);
  leftShoe.position.y = -0.28;
  leftShoe.position.z = 0.02;
  leftLeg.add(leftShoe);
  group.add(leftLeg);

  const rightLeg = new THREE.Group();
  rightLeg.name = 'rightLeg';
  rightLeg.position.set(0.09, 0.4, 0);
  const rightLegMesh = new THREE.Mesh(new THREE.CapsuleGeometry(0.06, 0.45, 3, 6), suitMat);
  rightLeg.add(rightLegMesh);
  const rightShoe = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.05, 0.18), shoeMat);
  rightShoe.position.y = -0.28;
  rightShoe.position.z = 0.02;
  rightLeg.add(rightShoe);
  group.add(rightLeg);

  // Torso
  const torso = new THREE.Group();
  torso.name = 'torso';
  torso.position.y = 0.17;
  const torsoMesh = new THREE.Mesh(
    new THREE.CylinderGeometry(isFemale ? 0.14 : 0.16, 0.17, 0.5, 8), suitMat
  );
  torsoMesh.position.y = 0.65;
  torso.add(torsoMesh);

  // Collar
  const collar = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.14, 0.08, 8),
    new THREE.MeshPhysicalMaterial({ color: 0xeeeeee, roughness: 0.6 }));
  collar.position.set(0, 0.92, 0.02);
  torso.add(collar);

  // Arms (animatable)
  const leftArm = new THREE.Group();
  leftArm.name = 'leftArm';
  leftArm.position.set(-0.22, 0.85, 0);
  const leftArmMesh = new THREE.Mesh(new THREE.CapsuleGeometry(0.04, 0.35, 3, 6), suitMat);
  leftArmMesh.position.y = -0.15;
  leftArm.add(leftArmMesh);
  const leftHand = new THREE.Mesh(new THREE.SphereGeometry(0.03, 6, 4), skinMat);
  leftHand.position.y = -0.35;
  leftArm.add(leftHand);
  torso.add(leftArm);

  const rightArm = new THREE.Group();
  rightArm.name = 'rightArm';
  rightArm.position.set(0.22, 0.85, 0);
  const rightArmMesh = new THREE.Mesh(new THREE.CapsuleGeometry(0.04, 0.35, 3, 6), suitMat);
  rightArmMesh.position.y = -0.15;
  rightArm.add(rightArmMesh);
  const rightHand = new THREE.Mesh(new THREE.SphereGeometry(0.03, 6, 4), skinMat);
  rightHand.position.y = -0.35;
  rightArm.add(rightHand);

  // Clipboard in right hand (distinguishes walkers from sitters)
  const clipboard = new THREE.Mesh(
    new THREE.BoxGeometry(0.12, 0.16, 0.01),
    new THREE.MeshStandardMaterial({ color: 0x8B4513, roughness: 0.6 })
  );
  clipboard.position.set(0.02, -0.3, 0.06);
  clipboard.rotation.x = -0.3;
  rightArm.add(clipboard);
  // Paper on clipboard
  const paper = new THREE.Mesh(
    new THREE.PlaneGeometry(0.1, 0.14),
    new THREE.MeshBasicMaterial({ color: 0xf8f8f0 })
  );
  paper.position.set(0.02, -0.29, 0.07);
  paper.rotation.x = -0.3;
  rightArm.add(paper);

  torso.add(rightArm);

  // Head
  const head = new THREE.Mesh(new THREE.SphereGeometry(0.12, 10, 8), skinMat);
  head.position.set(0, 1.04, 0);
  head.scale.set(1, 1.05, 0.93);
  torso.add(head);

  // Hair
  const hair = new THREE.Mesh(
    new THREE.SphereGeometry(0.125, 8, 6, 0, Math.PI * 2, 0, Math.PI * (isFemale ? 0.6 : 0.45)),
    hairMat
  );
  hair.position.set(0, 1.06, -0.01);
  torso.add(hair);

  if (isFemale) {
    for (const s of [-1, 1]) {
      const sideHair = new THREE.Mesh(new THREE.SphereGeometry(0.06, 6, 5), hairMat);
      sideHair.position.set(s * 0.09, 0.98, -0.02);
      sideHair.scale.set(0.5, 1.2, 0.7);
      torso.add(sideHair);
    }
  }

  // Eyes
  for (const ex of [-0.035, 0.035]) {
    const eye = new THREE.Mesh(new THREE.SphereGeometry(0.015, 5, 4),
      new THREE.MeshPhysicalMaterial({ color: 0xffffff, roughness: 0.1 }));
    eye.position.set(ex, 1.05, 0.1);
    torso.add(eye);
    const iris = new THREE.Mesh(new THREE.SphereGeometry(0.008, 4, 3),
      new THREE.MeshPhysicalMaterial({ color: 0x3a2a15, roughness: 0.2 }));
    iris.position.set(ex, 1.05, 0.112);
    torso.add(iris);
  }

  group.add(torso);

  // Name tag
  const tagCanvas = document.createElement('canvas');
  tagCanvas.width = 256;
  tagCanvas.height = 48;
  const tctx = tagCanvas.getContext('2d');
  tctx.clearRect(0, 0, 256, 48);
  tctx.fillStyle = 'rgba(10,11,16,0.7)';
  tctx.beginPath();
  tctx.roundRect(8, 6, 240, 36, 8);
  tctx.fill();
  tctx.fillStyle = '#94a3b8';
  tctx.font = '500 18px sans-serif';
  tctx.textAlign = 'center';
  tctx.fillText(isFemale ? 'Office Staff' : 'Team Lead', 128, 30);

  const tagTex = new THREE.CanvasTexture(tagCanvas);
  tagTex.colorSpace = THREE.SRGBColorSpace;
  const tagSprite = new THREE.Sprite(new THREE.SpriteMaterial({
    map: tagTex, transparent: true, depthTest: true,
  }));
  tagSprite.scale.set(1.5, 0.28, 1);
  tagSprite.position.set(0, 1.5, 0);
  group.add(tagSprite);

  return {
    group,
    parts: { leftLeg, rightLeg, leftArm, rightArm, torso },
  };
}
