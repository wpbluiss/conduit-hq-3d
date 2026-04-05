import * as THREE from 'three/webgpu';

/**
 * Creates an articulated humanoid agent with separately animatable body parts.
 * Each major body part is a named group so the animator can rotate them independently.
 *
 * Structure:
 *   agentRoot (Group)
 *     ├── hips (Group) — base of body, y=0.82
 *     │   ├── hipMesh
 *     │   ├── leftLeg (Group) — upper + lower leg + shoe
 *     │   └── rightLeg (Group)
 *     ├── torso (Group) — y=1.17, animatable lean
 *     │   ├── torsoMesh
 *     │   ├── collar
 *     │   ├── leftArm (Group) — shoulder + upper arm + forearm + hand
 *     │   ├── rightArm (Group)
 *     │   └── neck+head (Group) — head rotates independently
 *     └── lapelPin
 *
 * Returns: { group, parts } where parts has named references for animation.
 */

export function createAgentModel({
  bodyColor = 0x1a1a3e,
  shirtColor = 0x2a2a4e,
  skinColor = 0xdebb99,
  accentColor = 0x3b82f6,
  isFemale = false,
} = {}) {
  const group = new THREE.Group();

  // Materials
  const skinMat = new THREE.MeshPhysicalMaterial({
    color: skinColor, roughness: 0.65, metalness: 0.0,
    sheen: 0.2, sheenColor: new THREE.Color(0xffddbb), sheenRoughness: 0.5,
  });
  const suitMat = new THREE.MeshPhysicalMaterial({
    color: bodyColor, roughness: 0.5, metalness: 0.05,
    clearcoat: 0.15, clearcoatRoughness: 0.3,
  });
  const shirtMat = new THREE.MeshPhysicalMaterial({
    color: shirtColor, roughness: 0.6, metalness: 0.0,
  });
  const hairMat = new THREE.MeshPhysicalMaterial({
    color: isFemale ? 0x2a1a08 : 0x1a1008, roughness: 0.8, metalness: 0.05,
  });
  const shoeMat = new THREE.MeshPhysicalMaterial({
    color: 0x111115, roughness: 0.3, metalness: 0.15,
    clearcoat: 0.4, clearcoatRoughness: 0.2,
  });

  // ========================
  // SEATED POSE — legs bent, torso upright at desk height
  // Agent is seated: hips at ~0.5, torso above, legs bent
  // ========================

  // --- Hips ---
  const hipsGroup = new THREE.Group();
  hipsGroup.name = 'hips';
  hipsGroup.position.y = 0.5;
  const hipMesh = new THREE.Mesh(new THREE.BoxGeometry(0.35, 0.12, 0.18), suitMat);
  hipsGroup.add(hipMesh);
  group.add(hipsGroup);

  // --- Legs (seated: upper leg horizontal, lower leg vertical) ---
  for (const side of [-1, 1]) {
    const legGroup = new THREE.Group();
    legGroup.name = side < 0 ? 'leftLeg' : 'rightLeg';
    legGroup.position.set(side * 0.1, 0, 0);

    // Upper leg (horizontal, forward)
    const upperLeg = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.065, 0.4, 6), suitMat);
    upperLeg.rotation.z = Math.PI / 2;
    upperLeg.rotation.y = side * 0.05;
    upperLeg.position.set(0, -0.02, 0.2);
    legGroup.add(upperLeg);

    // Lower leg (vertical, down)
    const lowerLeg = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.06, 0.4, 6), suitMat);
    lowerLeg.position.set(0, -0.22, 0.4);
    legGroup.add(lowerLeg);

    // Shoe
    const shoe = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.05, 0.18), shoeMat);
    shoe.position.set(0, -0.44, 0.42);
    legGroup.add(shoe);

    hipsGroup.add(legGroup);
  }

  // --- Torso ---
  const torsoGroup = new THREE.Group();
  torsoGroup.name = 'torso';
  torsoGroup.position.y = 0.5; // relative to hips
  const torsoMesh = new THREE.Mesh(
    new THREE.CylinderGeometry(isFemale ? 0.16 : 0.18, 0.19, 0.5, 8), suitMat
  );
  torsoMesh.position.y = 0.15;
  torsoGroup.add(torsoMesh);

  // Collar
  const collar = new THREE.Mesh(new THREE.CylinderGeometry(0.11, 0.16, 0.08, 8), shirtMat);
  collar.position.set(0, 0.42, 0.02);
  torsoGroup.add(collar);

  // --- Arms (children of torso so they lean with it) ---
  for (const side of [-1, 1]) {
    const armGroup = new THREE.Group();
    armGroup.name = side < 0 ? 'leftArm' : 'rightArm';
    armGroup.position.set(side * 0.25, 0.35, 0);

    // Shoulder sphere
    const shoulder = new THREE.Mesh(new THREE.SphereGeometry(0.07, 6, 5), suitMat);
    armGroup.add(shoulder);

    // Upper arm — angled down and slightly forward (resting on desk)
    const upperArm = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.05, 0.28, 6), suitMat);
    upperArm.position.set(side * 0.02, -0.18, 0.02);
    upperArm.rotation.z = side * 0.1;
    upperArm.name = 'upperArm';
    armGroup.add(upperArm);

    // Forearm group — this is the part that animates for typing
    const forearmGroup = new THREE.Group();
    forearmGroup.name = side < 0 ? 'leftForearm' : 'rightForearm';
    forearmGroup.position.set(side * 0.04, -0.33, 0.04);

    const forearm = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.045, 0.25, 6), skinMat);
    forearm.position.y = -0.1;
    forearm.rotation.x = -0.4; // angled forward toward desk
    forearmGroup.add(forearm);

    // Hand
    const hand = new THREE.Mesh(new THREE.SphereGeometry(0.035, 6, 4), skinMat);
    hand.position.set(0, -0.2, 0.08);
    hand.name = 'hand';
    forearmGroup.add(hand);

    armGroup.add(forearmGroup);
    torsoGroup.add(armGroup);
  }

  // --- Head group (child of torso, rotates independently) ---
  const headGroup = new THREE.Group();
  headGroup.name = 'head';
  headGroup.position.set(0, 0.52, 0);

  // Neck
  const neck = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.07, 0.08, 8), skinMat);
  neck.position.y = -0.02;
  headGroup.add(neck);

  // Head sphere
  const headMesh = new THREE.Mesh(new THREE.SphereGeometry(0.14, 12, 10), skinMat);
  headMesh.position.y = 0.12;
  headMesh.scale.set(1, 1.06, 0.93);
  headGroup.add(headMesh);

  // Hair
  const hairGeo = new THREE.SphereGeometry(0.145, 10, 7, 0, Math.PI * 2, 0, Math.PI * (isFemale ? 0.65 : 0.5));
  const hair = new THREE.Mesh(hairGeo, hairMat);
  hair.position.set(0, 0.14, -0.01);
  headGroup.add(hair);

  if (isFemale) {
    // Longer hair on sides
    for (const s of [-1, 1]) {
      const sideHair = new THREE.Mesh(new THREE.SphereGeometry(0.07, 6, 5), hairMat);
      sideHair.position.set(s * 0.11, 0.06, -0.03);
      sideHair.scale.set(0.5, 1.3, 0.7);
      headGroup.add(sideHair);
    }
  }

  // Eyes
  const eyeWhiteMat = new THREE.MeshPhysicalMaterial({ color: 0xffffff, roughness: 0.1 });
  const irisMat = new THREE.MeshPhysicalMaterial({ color: 0x3a2a15, roughness: 0.2, metalness: 0.1 });
  for (const ex of [-0.045, 0.045]) {
    const eyeWhite = new THREE.Mesh(new THREE.SphereGeometry(0.02, 6, 5), eyeWhiteMat);
    eyeWhite.position.set(ex, 0.13, 0.12);
    headGroup.add(eyeWhite);
    const iris = new THREE.Mesh(new THREE.SphereGeometry(0.012, 5, 4), irisMat);
    iris.position.set(ex, 0.13, 0.135);
    headGroup.add(iris);
  }

  // Nose
  const nose = new THREE.Mesh(new THREE.ConeGeometry(0.015, 0.03, 4), skinMat);
  nose.position.set(0, 0.095, 0.135);
  nose.rotation.x = -0.3;
  headGroup.add(nose);

  // Mouth
  const mouthMat = new THREE.MeshPhysicalMaterial({ color: 0xbb7766, roughness: 0.5 });
  const mouth = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.004, 0.004), mouthMat);
  mouth.position.set(0, 0.07, 0.13);
  headGroup.add(mouth);

  // Ears
  for (const ex of [-0.13, 0.13]) {
    const ear = new THREE.Mesh(new THREE.SphereGeometry(0.025, 5, 4), skinMat);
    ear.position.set(ex, 0.12, 0);
    ear.scale.set(0.4, 0.9, 0.6);
    headGroup.add(ear);
  }

  torsoGroup.add(headGroup);
  hipsGroup.add(torsoGroup);

  // --- Lapel pin ---
  const pinMat = new THREE.MeshPhysicalMaterial({
    color: accentColor, emissive: new THREE.Color(accentColor),
    emissiveIntensity: 0.8, metalness: 0.8, roughness: 0.2,
  });
  const pin = new THREE.Mesh(new THREE.CircleGeometry(0.015, 6), pinMat);
  pin.position.set(-0.08, 0.85, 0.16);
  group.add(pin);

  // Named references for animation
  const parts = {
    hips: hipsGroup,
    torso: torsoGroup,
    head: headGroup,
    leftArm: torsoGroup.getObjectByName('leftArm'),
    rightArm: torsoGroup.getObjectByName('rightArm'),
    leftForearm: torsoGroup.getObjectByName('leftForearm'),
    rightForearm: torsoGroup.getObjectByName('rightForearm'),
    leftLeg: hipsGroup.getObjectByName('leftLeg'),
    rightLeg: hipsGroup.getObjectByName('rightLeg'),
  };

  return { group, parts };
}
