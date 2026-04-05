import * as THREE from 'three/webgpu';

/**
 * Creates an articulated humanoid agent with separately animatable body parts.
 * Enhanced with proper proportions, rounded geometry, facial features,
 * varied hair styles, department clothing, and gender dimorphism.
 *
 * Structure:
 *   agentRoot (Group)
 *     ├── hips (Group) — base of body, y=0.5
 *     │   ├── hipMesh
 *     │   ├── leftLeg (Group) — upper + lower leg + shoe
 *     │   └── rightLeg (Group)
 *     ├── torso (Group) — y=0.5 relative to hips
 *     │   ├── torsoMesh
 *     │   ├── collar
 *     │   ├── leftArm (Group) — shoulder + upper arm + forearm + hand
 *     │   ├── rightArm (Group)
 *     │   └── head (Group) — head rotates independently
 *     └── lapelPin
 *
 * Returns: { group, parts } where parts has named references for animation.
 */

// Hair style presets
const HAIR_STYLES = {
  short:    { coverage: 0.45, hasBack: false, hasSide: false, hasBangs: false },
  medium:   { coverage: 0.55, hasBack: true,  hasSide: false, hasBangs: true },
  long:     { coverage: 0.6,  hasBack: true,  hasSide: true,  hasBangs: true },
  ponytail: { coverage: 0.5,  hasBack: false, hasSide: false, hasBangs: true, hasPonytail: true },
  bald:     { coverage: 0.2,  hasBack: false, hasSide: false, hasBangs: false },
  buzz:     { coverage: 0.35, hasBack: false, hasSide: false, hasBangs: false },
};

const HAIR_COLORS = [0x1a1008, 0x2a1a08, 0x0a0808, 0x3a2010, 0x5a3020, 0x8a4030];

export function createAgentModel({
  bodyColor = 0x1a1a3e,
  shirtColor = 0x2a2a4e,
  skinColor = 0xdebb99,
  accentColor = 0x3b82f6,
  isFemale = false,
  hairStyle = null,
  agentIndex = 0,
} = {}) {
  const group = new THREE.Group();

  // Pick hair style based on gender and index
  if (!hairStyle) {
    if (isFemale) {
      hairStyle = ['long', 'ponytail', 'medium'][agentIndex % 3];
    } else {
      hairStyle = ['short', 'buzz', 'medium', 'bald'][agentIndex % 4];
    }
  }
  const style = HAIR_STYLES[hairStyle] || HAIR_STYLES.short;
  const hairColor = HAIR_COLORS[agentIndex % HAIR_COLORS.length];

  // Materials
  const skinMat = new THREE.MeshPhysicalMaterial({
    color: skinColor, roughness: 0.6, metalness: 0.0,
    sheen: 0.3, sheenColor: new THREE.Color(0xffddbb), sheenRoughness: 0.4,
  });
  const suitMat = new THREE.MeshPhysicalMaterial({
    color: bodyColor, roughness: 0.45, metalness: 0.05,
    clearcoat: 0.2, clearcoatRoughness: 0.25,
  });
  const shirtMat = new THREE.MeshPhysicalMaterial({
    color: shirtColor, roughness: 0.55, metalness: 0.0,
  });
  const hairMat = new THREE.MeshPhysicalMaterial({
    color: hairColor, roughness: 0.75, metalness: 0.05,
    clearcoat: 0.1,
  });
  const shoeMat = new THREE.MeshPhysicalMaterial({
    color: 0x111115, roughness: 0.25, metalness: 0.15,
    clearcoat: 0.5, clearcoatRoughness: 0.15,
  });

  // Body proportions based on gender
  const shoulderW = isFemale ? 0.22 : 0.26;
  const torsoTopR = isFemale ? 0.14 : 0.17;
  const torsoBotR = isFemale ? 0.13 : 0.18;
  const hipW = isFemale ? 0.16 : 0.18;
  const waistR = isFemale ? 0.12 : 0.15;

  // ========================
  // SEATED POSE
  // ========================

  // --- Hips ---
  const hipsGroup = new THREE.Group();
  hipsGroup.name = 'hips';
  hipsGroup.position.y = 0.5;

  // Rounded hips using capsule
  const hipMesh = new THREE.Mesh(
    new THREE.CapsuleGeometry(hipW * 0.55, hipW * 0.4, 4, 8),
    suitMat
  );
  hipMesh.rotation.z = Math.PI / 2;
  hipMesh.scale.set(1, 1, 0.7);
  hipsGroup.add(hipMesh);
  group.add(hipsGroup);

  // --- Legs (seated) ---
  for (const side of [-1, 1]) {
    const legGroup = new THREE.Group();
    legGroup.name = side < 0 ? 'leftLeg' : 'rightLeg';
    legGroup.position.set(side * 0.1, 0, 0);

    // Upper leg — smooth capsule
    const upperLeg = new THREE.Mesh(
      new THREE.CapsuleGeometry(0.055, 0.35, 4, 8), suitMat
    );
    upperLeg.rotation.z = Math.PI / 2;
    upperLeg.rotation.y = side * 0.04;
    upperLeg.position.set(0, -0.02, 0.2);
    legGroup.add(upperLeg);

    // Knee joint sphere
    const knee = new THREE.Mesh(new THREE.SphereGeometry(0.055, 8, 6), suitMat);
    knee.position.set(0, -0.04, 0.38);
    legGroup.add(knee);

    // Lower leg — tapered capsule
    const lowerLeg = new THREE.Mesh(
      new THREE.CapsuleGeometry(0.045, 0.35, 4, 8), suitMat
    );
    lowerLeg.position.set(0, -0.22, 0.4);
    legGroup.add(lowerLeg);

    // Ankle
    const ankle = new THREE.Mesh(new THREE.SphereGeometry(0.04, 6, 5), skinMat);
    ankle.position.set(0, -0.42, 0.42);
    legGroup.add(ankle);

    // Shoe — rounded box shape
    const shoeBody = new THREE.Mesh(
      new THREE.CapsuleGeometry(0.04, 0.1, 3, 6), shoeMat
    );
    shoeBody.rotation.z = Math.PI / 2;
    shoeBody.position.set(0, -0.46, 0.44);
    legGroup.add(shoeBody);
    // Shoe toe
    const shoeToe = new THREE.Mesh(new THREE.SphereGeometry(0.042, 6, 5), shoeMat);
    shoeToe.position.set(0, -0.46, 0.5);
    shoeToe.scale.set(1, 0.7, 1.2);
    legGroup.add(shoeToe);
    // Shoe heel
    const shoeHeel = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.03, 0.04), shoeMat);
    shoeHeel.position.set(0, -0.48, 0.38);
    legGroup.add(shoeHeel);

    hipsGroup.add(legGroup);
  }

  // --- Torso ---
  const torsoGroup = new THREE.Group();
  torsoGroup.name = 'torso';
  torsoGroup.position.y = 0.5;

  // Chest — lathe for natural shape
  const chestProfile = new THREE.Shape();
  chestProfile.moveTo(0, -0.25);
  chestProfile.quadraticCurveTo(torsoBotR, -0.2, torsoTopR, 0);
  chestProfile.quadraticCurveTo(torsoTopR + 0.01, 0.15, waistR + 0.02, 0.25);
  chestProfile.lineTo(0, 0.25);
  const torsoMesh = new THREE.Mesh(
    new THREE.LatheGeometry(
      Array.from({ length: 12 }, (_, i) => {
        const t = i / 11;
        const y = -0.25 + t * 0.5;
        let r;
        if (t < 0.3) r = torsoBotR + (torsoTopR - torsoBotR) * (t / 0.3);
        else if (t < 0.7) r = torsoTopR;
        else r = torsoTopR - (torsoTopR - waistR) * ((t - 0.7) / 0.3);
        if (isFemale && t > 0.2 && t < 0.5) r += 0.015; // bust
        return new THREE.Vector2(r, y);
      }), 12
    ),
    suitMat
  );
  torsoMesh.position.y = 0.15;
  torsoGroup.add(torsoMesh);

  // Collar / shirt collar
  const collar = new THREE.Mesh(
    new THREE.CylinderGeometry(0.08, waistR * 0.8, 0.06, 10),
    shirtMat
  );
  collar.position.set(0, 0.42, 0.02);
  torsoGroup.add(collar);

  // Tie or necklace
  if (!isFemale) {
    const tieMat = new THREE.MeshPhysicalMaterial({
      color: accentColor, roughness: 0.4, metalness: 0.1,
    });
    const tieKnot = new THREE.Mesh(new THREE.SphereGeometry(0.02, 5, 4), tieMat);
    tieKnot.position.set(0, 0.38, 0.12);
    tieKnot.scale.set(1, 1.2, 0.6);
    torsoGroup.add(tieKnot);
    const tieBody = new THREE.Mesh(new THREE.BoxGeometry(0.035, 0.18, 0.008), tieMat);
    tieBody.position.set(0, 0.26, 0.13);
    torsoGroup.add(tieBody);
  } else {
    // Necklace
    const neckMat = new THREE.MeshPhysicalMaterial({
      color: 0xd4af37, roughness: 0.2, metalness: 0.8,
    });
    const pendant = new THREE.Mesh(new THREE.SphereGeometry(0.012, 6, 5), neckMat);
    pendant.position.set(0, 0.34, 0.13);
    torsoGroup.add(pendant);
  }

  // --- Arms ---
  for (const side of [-1, 1]) {
    const armGroup = new THREE.Group();
    armGroup.name = side < 0 ? 'leftArm' : 'rightArm';
    armGroup.position.set(side * shoulderW, 0.35, 0);

    // Shoulder — rounded
    const shoulder = new THREE.Mesh(new THREE.SphereGeometry(0.065, 8, 6), suitMat);
    armGroup.add(shoulder);

    // Upper arm
    const upperArm = new THREE.Mesh(
      new THREE.CapsuleGeometry(0.04, 0.24, 4, 8), suitMat
    );
    upperArm.position.set(side * 0.02, -0.16, 0.02);
    upperArm.rotation.z = side * 0.08;
    upperArm.name = 'upperArm';
    armGroup.add(upperArm);

    // Elbow joint
    const elbow = new THREE.Mesh(new THREE.SphereGeometry(0.038, 6, 5), suitMat);
    elbow.position.set(side * 0.03, -0.3, 0.04);
    armGroup.add(elbow);

    // Forearm group (animatable)
    const forearmGroup = new THREE.Group();
    forearmGroup.name = side < 0 ? 'leftForearm' : 'rightForearm';
    forearmGroup.position.set(side * 0.04, -0.33, 0.04);

    const forearm = new THREE.Mesh(
      new THREE.CapsuleGeometry(0.032, 0.2, 4, 8), skinMat
    );
    forearm.position.y = -0.08;
    forearm.rotation.x = -0.4;
    forearmGroup.add(forearm);

    // Wrist
    const wrist = new THREE.Mesh(new THREE.SphereGeometry(0.028, 6, 5), skinMat);
    wrist.position.set(0, -0.17, 0.06);
    forearmGroup.add(wrist);

    // Hand with simple fingers
    const handGroup = new THREE.Group();
    handGroup.position.set(0, -0.2, 0.08);
    handGroup.name = 'hand';

    // Palm
    const palm = new THREE.Mesh(
      new THREE.BoxGeometry(0.05, 0.04, 0.035),
      skinMat
    );
    palm.scale.set(1, 1, 1);
    handGroup.add(palm);

    // Fingers (4 simple cylinders)
    for (let fi = 0; fi < 4; fi++) {
      const finger = new THREE.Mesh(
        new THREE.CapsuleGeometry(0.006, 0.025, 2, 4), skinMat
      );
      finger.position.set(-0.015 + fi * 0.01, -0.01, 0.022);
      finger.rotation.x = -0.2;
      handGroup.add(finger);
    }
    // Thumb
    const thumb = new THREE.Mesh(
      new THREE.CapsuleGeometry(0.007, 0.02, 2, 4), skinMat
    );
    thumb.position.set(side * 0.025, 0.005, 0.015);
    thumb.rotation.z = side * 0.6;
    handGroup.add(thumb);

    forearmGroup.add(handGroup);
    armGroup.add(forearmGroup);
    torsoGroup.add(armGroup);
  }

  // --- Head ---
  const headGroup = new THREE.Group();
  headGroup.name = 'head';
  headGroup.position.set(0, 0.52, 0);

  // Neck
  const neck = new THREE.Mesh(
    new THREE.CylinderGeometry(0.045, 0.06, 0.08, 10), skinMat
  );
  neck.position.y = -0.02;
  headGroup.add(neck);

  // Head — slightly oval, more natural
  const headMesh = new THREE.Mesh(
    new THREE.SphereGeometry(0.135, 16, 14), skinMat
  );
  headMesh.position.y = 0.12;
  headMesh.scale.set(1, 1.08, 0.95);
  headGroup.add(headMesh);

  // Jawline
  const jaw = new THREE.Mesh(
    new THREE.SphereGeometry(0.1, 10, 6, 0, Math.PI * 2, Math.PI * 0.55, Math.PI * 0.25),
    skinMat
  );
  jaw.position.set(0, 0.06, 0.01);
  jaw.scale.set(1, isFemale ? 0.6 : 0.8, 0.9);
  headGroup.add(jaw);

  // --- Hair ---
  if (style.coverage > 0.1) {
    const hairGeo = new THREE.SphereGeometry(
      0.14, 12, 8, 0, Math.PI * 2, 0, Math.PI * style.coverage
    );
    const hair = new THREE.Mesh(hairGeo, hairMat);
    hair.position.set(0, 0.14, -0.01);
    headGroup.add(hair);
  }

  if (style.hasSide) {
    for (const s of [-1, 1]) {
      const sideHair = new THREE.Mesh(
        new THREE.SphereGeometry(0.06, 8, 6), hairMat
      );
      sideHair.position.set(s * 0.1, 0.06, -0.02);
      sideHair.scale.set(0.45, 1.4, 0.65);
      headGroup.add(sideHair);
    }
  }

  if (style.hasBack) {
    const backHair = new THREE.Mesh(
      new THREE.SphereGeometry(0.1, 8, 6), hairMat
    );
    backHair.position.set(0, 0.04, -0.1);
    backHair.scale.set(0.9, 1.2, 0.6);
    headGroup.add(backHair);
  }

  if (style.hasBangs) {
    const bangs = new THREE.Mesh(
      new THREE.SphereGeometry(0.12, 8, 4, -Math.PI * 0.4, Math.PI * 0.8, 0, Math.PI * 0.2),
      hairMat
    );
    bangs.position.set(0, 0.2, 0.06);
    headGroup.add(bangs);
  }

  if (style.hasPonytail) {
    // Ponytail bun
    const bun = new THREE.Mesh(new THREE.SphereGeometry(0.055, 8, 6), hairMat);
    bun.position.set(0, 0.08, -0.14);
    headGroup.add(bun);
    // Tail
    const tail = new THREE.Mesh(
      new THREE.CapsuleGeometry(0.025, 0.12, 3, 6), hairMat
    );
    tail.position.set(0, -0.02, -0.16);
    tail.rotation.x = 0.4;
    headGroup.add(tail);
  }

  // --- Face ---

  // Eyebrows
  const browMat = new THREE.MeshPhysicalMaterial({ color: hairColor, roughness: 0.8 });
  for (const ex of [-0.042, 0.042]) {
    const brow = new THREE.Mesh(
      new THREE.BoxGeometry(0.035, 0.006, 0.008), browMat
    );
    brow.position.set(ex, 0.18, 0.118);
    brow.rotation.z = ex > 0 ? -0.1 : 0.1;
    headGroup.add(brow);
  }

  // Eyes — slightly larger, more expressive
  const eyeWhiteMat = new THREE.MeshPhysicalMaterial({
    color: 0xfafafa, roughness: 0.05, metalness: 0.0,
  });
  const eyeColors = [0x3a2a15, 0x2255aa, 0x228844, 0x554422, 0x1a1a1a];
  const eyeColor = eyeColors[agentIndex % eyeColors.length];
  const irisMat = new THREE.MeshPhysicalMaterial({
    color: eyeColor, roughness: 0.15, metalness: 0.1,
  });
  const pupilMat = new THREE.MeshPhysicalMaterial({ color: 0x050505, roughness: 0.1 });

  for (const ex of [-0.042, 0.042]) {
    // Eye socket depression (subtle shadow)
    const socket = new THREE.Mesh(
      new THREE.SphereGeometry(0.026, 6, 5), skinMat
    );
    socket.position.set(ex, 0.14, 0.115);
    socket.scale.set(1.2, 0.8, 0.3);
    headGroup.add(socket);

    // Eye white
    const eyeWhite = new THREE.Mesh(new THREE.SphereGeometry(0.018, 8, 6), eyeWhiteMat);
    eyeWhite.position.set(ex, 0.14, 0.12);
    headGroup.add(eyeWhite);

    // Iris
    const iris = new THREE.Mesh(new THREE.SphereGeometry(0.011, 6, 5), irisMat);
    iris.position.set(ex, 0.14, 0.135);
    headGroup.add(iris);

    // Pupil
    const pupil = new THREE.Mesh(new THREE.SphereGeometry(0.006, 5, 4), pupilMat);
    pupil.position.set(ex, 0.14, 0.138);
    headGroup.add(pupil);

    // Eyelid hint (thin arc above eye)
    const lid = new THREE.Mesh(
      new THREE.TorusGeometry(0.018, 0.003, 4, 8, Math.PI), skinMat
    );
    lid.position.set(ex, 0.155, 0.12);
    lid.rotation.x = -0.2;
    headGroup.add(lid);
  }

  // Nose — more dimensional
  const noseGroup = new THREE.Group();
  noseGroup.position.set(0, 0.1, 0.13);
  // Bridge
  const noseBridge = new THREE.Mesh(
    new THREE.CapsuleGeometry(0.008, 0.03, 2, 4), skinMat
  );
  noseBridge.position.y = 0.02;
  noseGroup.add(noseBridge);
  // Tip
  const noseTip = new THREE.Mesh(
    new THREE.SphereGeometry(isFemale ? 0.013 : 0.016, 6, 5), skinMat
  );
  noseTip.position.y = -0.005;
  noseTip.position.z = 0.005;
  noseGroup.add(noseTip);
  // Nostrils
  for (const nx of [-0.008, 0.008]) {
    const nostril = new THREE.Mesh(new THREE.SphereGeometry(0.006, 4, 3), skinMat);
    nostril.position.set(nx, -0.012, 0.002);
    noseGroup.add(nostril);
  }
  headGroup.add(noseGroup);

  // Mouth
  const lipColor = isFemale ? 0xcc7766 : 0xbb7766;
  const lipMat = new THREE.MeshPhysicalMaterial({
    color: lipColor, roughness: 0.4, metalness: 0.0,
  });
  // Upper lip
  const upperLip = new THREE.Mesh(
    new THREE.TorusGeometry(0.02, 0.004, 4, 8, Math.PI), lipMat
  );
  upperLip.position.set(0, 0.068, 0.125);
  upperLip.rotation.x = Math.PI;
  headGroup.add(upperLip);
  // Lower lip
  const lowerLip = new THREE.Mesh(
    new THREE.TorusGeometry(0.018, 0.005, 4, 8, Math.PI), lipMat
  );
  lowerLip.position.set(0, 0.062, 0.125);
  headGroup.add(lowerLip);

  // Ears — more detailed
  for (const ex of [-1, 1]) {
    const earGroup = new THREE.Group();
    earGroup.position.set(ex * 0.13, 0.12, 0);

    const earOuter = new THREE.Mesh(
      new THREE.TorusGeometry(0.025, 0.008, 4, 8, Math.PI * 1.4), skinMat
    );
    earOuter.rotation.y = ex * Math.PI / 2;
    earOuter.rotation.z = -0.1;
    earGroup.add(earOuter);

    const earLobe = new THREE.Mesh(new THREE.SphereGeometry(0.012, 5, 4), skinMat);
    earLobe.position.set(0, -0.02, ex * 0.005);
    earGroup.add(earLobe);

    headGroup.add(earGroup);
  }

  // Chin dimple (male) or smooth chin (female)
  if (!isFemale) {
    const chin = new THREE.Mesh(new THREE.SphereGeometry(0.015, 5, 4), skinMat);
    chin.position.set(0, 0.025, 0.12);
    chin.scale.set(1, 0.5, 0.5);
    headGroup.add(chin);
  }

  torsoGroup.add(headGroup);
  hipsGroup.add(torsoGroup);

  // --- Lapel pin ---
  const pinMat = new THREE.MeshPhysicalMaterial({
    color: accentColor, emissive: new THREE.Color(accentColor),
    emissiveIntensity: 0.8, metalness: 0.8, roughness: 0.2,
  });
  const pin = new THREE.Mesh(new THREE.CircleGeometry(0.015, 8), pinMat);
  pin.position.set(-0.08, 0.85, 0.16);
  group.add(pin);

  // Belt
  const beltMat = new THREE.MeshPhysicalMaterial({
    color: 0x222222, roughness: 0.3, metalness: 0.3,
  });
  const belt = new THREE.Mesh(
    new THREE.TorusGeometry(hipW * 0.58, 0.012, 4, 16), beltMat
  );
  belt.position.set(0, 0.56, 0);
  belt.rotation.x = Math.PI / 2;
  group.add(belt);
  // Belt buckle
  const buckleMat = new THREE.MeshPhysicalMaterial({
    color: 0xcccccc, roughness: 0.2, metalness: 0.8,
  });
  const buckle = new THREE.Mesh(new THREE.BoxGeometry(0.025, 0.02, 0.008), buckleMat);
  buckle.position.set(0, 0.56, hipW * 0.6);
  group.add(buckle);

  // Watch on left wrist
  const watchMat = new THREE.MeshPhysicalMaterial({
    color: 0x333333, roughness: 0.2, metalness: 0.6,
  });
  const watchFace = new THREE.Mesh(new THREE.CylinderGeometry(0.015, 0.015, 0.006, 8), watchMat);
  watchFace.rotation.x = Math.PI / 2;
  // Position relative to left forearm area
  watchFace.position.set(-shoulderW - 0.02, 0.68, 0.1);
  group.add(watchFace);

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
