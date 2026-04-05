import * as THREE from 'three/webgpu';

/**
 * Walking NPCs — patrol between waypoints on each floor.
 * Creates standing humanoids that walk between desk areas,
 * pause briefly, then continue to the next waypoint.
 * Enhanced with proper proportions, facial features, and accessories.
 */

const skinTones = [0xFFDBAC, 0xF1C27D, 0xE0AC69, 0xC68642, 0x8D5524];
const outfitColors = [0x2a3040, 0x3a2a2a, 0x1e3028, 0x302828, 0x282838];
const hairColors = [0x1a1008, 0x2a1a08, 0x0a0808, 0x3a2010, 0x5a3020];

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
      speed: 1.2 + Math.random() * 0.6,
      pauseTimer: Math.random() * 2,
      paused: true,
      pauseDuration: 3 + Math.random() * 2,
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
        npc.currentWaypoint = npc.targetWaypoint;
        npc.targetWaypoint = (npc.targetWaypoint + 1 + Math.floor(Math.random() * 2)) % FLOOR_WAYPOINTS.length;
      }
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
      npc.paused = true;
      npc.pauseTimer = 0;
      npc.pauseDuration = 3 + Math.random() * 2;
      if (npc.parts) {
        npc.parts.leftLeg.rotation.x = 0;
        npc.parts.rightLeg.rotation.x = 0;
        npc.parts.leftArm.rotation.x = 0;
        npc.parts.rightArm.rotation.x = 0;
      }
      return;
    }

    const moveX = (dx / dist) * npc.speed * delta;
    const moveZ = (dz / dist) * npc.speed * delta;
    pos.x += moveX;
    pos.z += moveZ;

    const angle = Math.atan2(dx, dz);
    npc.group.rotation.y += (angle - npc.group.rotation.y) * Math.min(1, delta * 5);

    npc.walkPhase += delta * npc.speed * 4;
    if (npc.parts) {
      const swing = Math.sin(npc.walkPhase) * 0.4;
      npc.parts.leftLeg.rotation.x = swing;
      npc.parts.rightLeg.rotation.x = -swing;
      npc.parts.leftArm.rotation.x = -swing * 0.5;
      npc.parts.rightArm.rotation.x = swing * 0.5;
      npc.parts.torso.position.y = 0.17 + Math.abs(Math.sin(npc.walkPhase)) * 0.02;
    }
  }
}

function createWalkingHumanoid(index, accentColor) {
  const group = new THREE.Group();
  const skinColor = skinTones[index % skinTones.length];
  const outfitColor = outfitColors[index % outfitColors.length];
  const hairColor = hairColors[index % hairColors.length];
  const isFemale = index % 2 === 1;

  const skinMat = new THREE.MeshPhysicalMaterial({
    color: skinColor, roughness: 0.6, metalness: 0.0,
    sheen: 0.3, sheenColor: new THREE.Color(0xffddbb), sheenRoughness: 0.4,
  });
  const suitMat = new THREE.MeshPhysicalMaterial({
    color: outfitColor, roughness: 0.45, metalness: 0.05,
    clearcoat: 0.2, clearcoatRoughness: 0.25,
  });
  const hairMat = new THREE.MeshPhysicalMaterial({
    color: hairColor, roughness: 0.75, metalness: 0.05,
  });
  const shoeMat = new THREE.MeshPhysicalMaterial({
    color: 0x111115, roughness: 0.25, metalness: 0.15,
    clearcoat: 0.5, clearcoatRoughness: 0.15,
  });

  // Legs (animatable)
  const leftLeg = new THREE.Group();
  leftLeg.name = 'leftLeg';
  leftLeg.position.set(-0.09, 0.4, 0);
  const leftLegMesh = new THREE.Mesh(new THREE.CapsuleGeometry(0.055, 0.42, 4, 8), suitMat);
  leftLeg.add(leftLegMesh);
  // Knee
  const leftKnee = new THREE.Mesh(new THREE.SphereGeometry(0.05, 6, 5), suitMat);
  leftKnee.position.y = -0.15;
  leftLeg.add(leftKnee);
  // Shoe
  const leftShoe = new THREE.Mesh(new THREE.CapsuleGeometry(0.035, 0.08, 3, 6), shoeMat);
  leftShoe.rotation.z = Math.PI / 2;
  leftShoe.position.set(0, -0.28, 0.02);
  leftLeg.add(leftShoe);
  const leftToe = new THREE.Mesh(new THREE.SphereGeometry(0.036, 6, 4), shoeMat);
  leftToe.position.set(0, -0.28, 0.07);
  leftToe.scale.set(1, 0.7, 1.1);
  leftLeg.add(leftToe);
  group.add(leftLeg);

  const rightLeg = new THREE.Group();
  rightLeg.name = 'rightLeg';
  rightLeg.position.set(0.09, 0.4, 0);
  const rightLegMesh = new THREE.Mesh(new THREE.CapsuleGeometry(0.055, 0.42, 4, 8), suitMat);
  rightLeg.add(rightLegMesh);
  const rightKnee = new THREE.Mesh(new THREE.SphereGeometry(0.05, 6, 5), suitMat);
  rightKnee.position.y = -0.15;
  rightLeg.add(rightKnee);
  const rightShoe = new THREE.Mesh(new THREE.CapsuleGeometry(0.035, 0.08, 3, 6), shoeMat);
  rightShoe.rotation.z = Math.PI / 2;
  rightShoe.position.set(0, -0.28, 0.02);
  rightLeg.add(rightShoe);
  const rightToe = new THREE.Mesh(new THREE.SphereGeometry(0.036, 6, 4), shoeMat);
  rightToe.position.set(0, -0.28, 0.07);
  rightToe.scale.set(1, 0.7, 1.1);
  rightLeg.add(rightToe);
  group.add(rightLeg);

  // Torso
  const torso = new THREE.Group();
  torso.name = 'torso';
  torso.position.y = 0.17;

  // Body — lathe for natural shape
  const topR = isFemale ? 0.13 : 0.15;
  const botR = isFemale ? 0.12 : 0.16;
  const torsoMesh = new THREE.Mesh(
    new THREE.LatheGeometry(
      Array.from({ length: 10 }, (_, i) => {
        const t = i / 9;
        const y = t * 0.5;
        let r;
        if (t < 0.3) r = botR;
        else if (t < 0.7) r = topR + (isFemale && t > 0.4 && t < 0.65 ? 0.012 : 0);
        else r = topR * 0.7;
        return new THREE.Vector2(r, y);
      }), 10
    ),
    suitMat
  );
  torsoMesh.position.y = 0.4;
  torso.add(torsoMesh);

  // Collar
  const collar = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.1, 0.06, 10),
    new THREE.MeshPhysicalMaterial({ color: 0xeeeeee, roughness: 0.5 }));
  collar.position.set(0, 0.92, 0.02);
  torso.add(collar);

  // Arms (animatable)
  const armW = isFemale ? 0.2 : 0.22;
  const leftArm = new THREE.Group();
  leftArm.name = 'leftArm';
  leftArm.position.set(-armW, 0.85, 0);
  const leftShoulder = new THREE.Mesh(new THREE.SphereGeometry(0.055, 8, 6), suitMat);
  leftArm.add(leftShoulder);
  const leftArmMesh = new THREE.Mesh(new THREE.CapsuleGeometry(0.035, 0.3, 4, 8), suitMat);
  leftArmMesh.position.y = -0.12;
  leftArm.add(leftArmMesh);
  // Forearm + hand
  const leftForearm = new THREE.Mesh(new THREE.CapsuleGeometry(0.03, 0.2, 3, 6), skinMat);
  leftForearm.position.y = -0.3;
  leftArm.add(leftForearm);
  const leftHand = new THREE.Mesh(new THREE.SphereGeometry(0.028, 6, 5), skinMat);
  leftHand.position.y = -0.42;
  leftArm.add(leftHand);
  torso.add(leftArm);

  const rightArm = new THREE.Group();
  rightArm.name = 'rightArm';
  rightArm.position.set(armW, 0.85, 0);
  const rightShoulder = new THREE.Mesh(new THREE.SphereGeometry(0.055, 8, 6), suitMat);
  rightArm.add(rightShoulder);
  const rightArmMesh = new THREE.Mesh(new THREE.CapsuleGeometry(0.035, 0.3, 4, 8), suitMat);
  rightArmMesh.position.y = -0.12;
  rightArm.add(rightArmMesh);
  const rightForearm = new THREE.Mesh(new THREE.CapsuleGeometry(0.03, 0.2, 3, 6), skinMat);
  rightForearm.position.y = -0.3;
  rightArm.add(rightForearm);
  const rightHand = new THREE.Mesh(new THREE.SphereGeometry(0.028, 6, 5), skinMat);
  rightHand.position.y = -0.42;
  rightArm.add(rightHand);

  // Clipboard in right hand
  const clipboard = new THREE.Mesh(
    new THREE.BoxGeometry(0.1, 0.14, 0.008),
    new THREE.MeshStandardMaterial({ color: 0x8B4513, roughness: 0.5 })
  );
  clipboard.position.set(0.02, -0.36, 0.06);
  clipboard.rotation.x = -0.3;
  rightArm.add(clipboard);
  const paper = new THREE.Mesh(
    new THREE.PlaneGeometry(0.08, 0.12),
    new THREE.MeshBasicMaterial({ color: 0xf8f8f0 })
  );
  paper.position.set(0.02, -0.35, 0.065);
  paper.rotation.x = -0.3;
  rightArm.add(paper);

  torso.add(rightArm);

  // Head
  const head = new THREE.Mesh(new THREE.SphereGeometry(0.12, 14, 12), skinMat);
  head.position.set(0, 1.04, 0);
  head.scale.set(1, 1.07, 0.95);
  torso.add(head);

  // Jawline
  const jaw = new THREE.Mesh(
    new THREE.SphereGeometry(0.08, 8, 5, 0, Math.PI * 2, Math.PI * 0.55, Math.PI * 0.25), skinMat
  );
  jaw.position.set(0, 0.97, 0.01);
  jaw.scale.set(1, isFemale ? 0.5 : 0.7, 0.9);
  torso.add(jaw);

  // Hair
  const hairCoverage = isFemale ? 0.6 : 0.45;
  const hair = new THREE.Mesh(
    new THREE.SphereGeometry(0.125, 10, 7, 0, Math.PI * 2, 0, Math.PI * hairCoverage),
    hairMat
  );
  hair.position.set(0, 1.06, -0.01);
  torso.add(hair);

  if (isFemale) {
    for (const s of [-1, 1]) {
      const sideHair = new THREE.Mesh(new THREE.SphereGeometry(0.05, 8, 6), hairMat);
      sideHair.position.set(s * 0.09, 0.98, -0.02);
      sideHair.scale.set(0.45, 1.3, 0.65);
      torso.add(sideHair);
    }
  }

  // Eyes
  const eyeWhiteMat = new THREE.MeshPhysicalMaterial({ color: 0xfafafa, roughness: 0.05 });
  const irisMat = new THREE.MeshPhysicalMaterial({ color: 0x3a2a15, roughness: 0.15 });
  for (const ex of [-0.035, 0.035]) {
    const eye = new THREE.Mesh(new THREE.SphereGeometry(0.014, 7, 5), eyeWhiteMat);
    eye.position.set(ex, 1.06, 0.1);
    torso.add(eye);
    const iris = new THREE.Mesh(new THREE.SphereGeometry(0.008, 5, 4), irisMat);
    iris.position.set(ex, 1.06, 0.112);
    torso.add(iris);
    const pupil = new THREE.Mesh(new THREE.SphereGeometry(0.004, 4, 3),
      new THREE.MeshPhysicalMaterial({ color: 0x050505, roughness: 0.1 }));
    pupil.position.set(ex, 1.06, 0.115);
    torso.add(pupil);
  }

  // Eyebrows
  const browMat = new THREE.MeshPhysicalMaterial({ color: hairColor, roughness: 0.8 });
  for (const ex of [-0.035, 0.035]) {
    const brow = new THREE.Mesh(new THREE.BoxGeometry(0.028, 0.005, 0.006), browMat);
    brow.position.set(ex, 1.1, 0.1);
    torso.add(brow);
  }

  // Nose
  const noseTip = new THREE.Mesh(new THREE.SphereGeometry(isFemale ? 0.01 : 0.013, 6, 5), skinMat);
  noseTip.position.set(0, 1.02, 0.12);
  torso.add(noseTip);

  // Mouth
  const lipMat = new THREE.MeshPhysicalMaterial({ color: isFemale ? 0xcc7766 : 0xbb7766, roughness: 0.4 });
  const mouth = new THREE.Mesh(
    new THREE.TorusGeometry(0.015, 0.004, 4, 8, Math.PI), lipMat
  );
  mouth.position.set(0, 0.99, 0.105);
  torso.add(mouth);

  // Ears
  for (const ex of [-0.11, 0.11]) {
    const ear = new THREE.Mesh(new THREE.SphereGeometry(0.018, 5, 4), skinMat);
    ear.position.set(ex, 1.04, 0);
    ear.scale.set(0.35, 0.8, 0.5);
    torso.add(ear);
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
