import * as THREE from 'three/webgpu';

/**
 * Creates a detailed humanoid figure with proper proportions,
 * face features, and physical materials.
 */
export function createHumanoid({
  bodyColor = 0x1a1a3e,
  shirtColor = 0x2a2a4e,
  headColor = 0xdebb99,
  accentColor = 0x3b82f6,
} = {}) {
  const group = new THREE.Group();

  const skinMat = new THREE.MeshPhysicalMaterial({
    color: headColor,
    roughness: 0.65,
    metalness: 0.0,
    sheen: 0.2,
    sheenColor: new THREE.Color(0xffddbb),
    sheenRoughness: 0.5,
  });

  const suitMat = new THREE.MeshPhysicalMaterial({
    color: bodyColor,
    roughness: 0.5,
    metalness: 0.05,
    clearcoat: 0.15,
    clearcoatRoughness: 0.3,
  });

  const shirtMat = new THREE.MeshPhysicalMaterial({
    color: shirtColor,
    roughness: 0.6,
    metalness: 0.0,
  });

  const hairMat = new THREE.MeshPhysicalMaterial({
    color: 0x1a1008,
    roughness: 0.8,
    metalness: 0.05,
  });

  const shoeMat = new THREE.MeshPhysicalMaterial({
    color: 0x111115,
    roughness: 0.3,
    metalness: 0.15,
    clearcoat: 0.4,
    clearcoatRoughness: 0.2,
  });

  // --- Shoes ---
  const shoeGeo = new THREE.BoxGeometry(0.12, 0.06, 0.22);
  [-0.1, 0.1].forEach((xOff) => {
    const shoe = new THREE.Mesh(shoeGeo, shoeMat);
    shoe.position.set(xOff, 0.03, 0.03);
    group.add(shoe);
  });

  // --- Legs ---
  const legGeo = new THREE.CylinderGeometry(0.065, 0.07, 0.75, 8);
  [-0.1, 0.1].forEach((xOff) => {
    const leg = new THREE.Mesh(legGeo, suitMat);
    leg.position.set(xOff, 0.435, 0);
    group.add(leg);
  });

  // --- Hips ---
  const hipGeo = new THREE.BoxGeometry(0.35, 0.15, 0.18);
  const hips = new THREE.Mesh(hipGeo, suitMat);
  hips.position.set(0, 0.82, 0);
  group.add(hips);

  // --- Torso ---
  // Upper body — tapered for natural shape
  const torsoGeo = new THREE.CylinderGeometry(0.18, 0.2, 0.55, 8);
  const torso = new THREE.Mesh(torsoGeo, suitMat);
  torso.position.set(0, 1.17, 0);
  group.add(torso);

  // --- Shirt collar / chest area ---
  const collarGeo = new THREE.CylinderGeometry(0.12, 0.17, 0.1, 8);
  const collar = new THREE.Mesh(collarGeo, shirtMat);
  collar.position.set(0, 1.47, 0.02);
  group.add(collar);

  // --- Shoulders ---
  const shoulderGeo = new THREE.SphereGeometry(0.1, 8, 6);
  [-0.28, 0.28].forEach((xOff) => {
    const shoulder = new THREE.Mesh(shoulderGeo, suitMat);
    shoulder.position.set(xOff, 1.38, 0);
    group.add(shoulder);
  });

  // --- Arms ---
  const upperArmGeo = new THREE.CylinderGeometry(0.05, 0.055, 0.35, 6);
  const forearmGeo = new THREE.CylinderGeometry(0.04, 0.05, 0.3, 6);

  [-1, 1].forEach((side) => {
    const xOff = side * 0.3;

    // Upper arm
    const upper = new THREE.Mesh(upperArmGeo, suitMat);
    upper.position.set(xOff, 1.15, 0);
    upper.rotation.z = side * 0.08;
    group.add(upper);

    // Forearm (skin)
    const forearm = new THREE.Mesh(forearmGeo, skinMat);
    forearm.position.set(xOff + side * 0.02, 0.88, 0.04);
    forearm.rotation.z = side * 0.05;
    forearm.rotation.x = -0.15;
    group.add(forearm);

    // Hand
    const handGeo = new THREE.SphereGeometry(0.04, 6, 5);
    const hand = new THREE.Mesh(handGeo, skinMat);
    hand.position.set(xOff + side * 0.03, 0.72, 0.06);
    group.add(hand);
  });

  // --- Neck ---
  const neckGeo = new THREE.CylinderGeometry(0.06, 0.08, 0.1, 8);
  const neck = new THREE.Mesh(neckGeo, skinMat);
  neck.position.set(0, 1.52, 0);
  group.add(neck);

  // --- Head ---
  // Slightly elongated sphere for head shape
  const headGeo = new THREE.SphereGeometry(0.17, 16, 12);
  const head = new THREE.Mesh(headGeo, skinMat);
  head.position.set(0, 1.72, 0);
  head.scale.set(1, 1.08, 0.95);
  group.add(head);

  // --- Hair ---
  const hairGeo = new THREE.SphereGeometry(0.175, 12, 8, 0, Math.PI * 2, 0, Math.PI * 0.55);
  const hair = new THREE.Mesh(hairGeo, hairMat);
  hair.position.set(0, 1.74, -0.01);
  group.add(hair);

  // Side hair
  [-1, 1].forEach((side) => {
    const sideHairGeo = new THREE.SphereGeometry(0.08, 6, 5);
    const sideHair = new THREE.Mesh(sideHairGeo, hairMat);
    sideHair.position.set(side * 0.14, 1.72, -0.04);
    sideHair.scale.set(0.6, 1, 0.8);
    group.add(sideHair);
  });

  // --- Face ---
  // Eyes
  const eyeWhiteGeo = new THREE.SphereGeometry(0.025, 8, 6);
  const eyeWhiteMat = new THREE.MeshPhysicalMaterial({
    color: 0xffffff, roughness: 0.1, metalness: 0.0,
  });
  const irisMat = new THREE.MeshPhysicalMaterial({
    color: 0x3a2a15, roughness: 0.2, metalness: 0.1,
  });
  const pupilMat = new THREE.MeshBasicMaterial({ color: 0x0a0a0a });

  [-0.06, 0.06].forEach((xOff) => {
    // Eye white
    const eyeWhite = new THREE.Mesh(eyeWhiteGeo, eyeWhiteMat);
    eyeWhite.position.set(xOff, 1.73, 0.145);
    group.add(eyeWhite);

    // Iris
    const iris = new THREE.Mesh(
      new THREE.SphereGeometry(0.015, 6, 4), irisMat
    );
    iris.position.set(xOff, 1.73, 0.165);
    group.add(iris);

    // Pupil
    const pupil = new THREE.Mesh(
      new THREE.SphereGeometry(0.008, 5, 3), pupilMat
    );
    pupil.position.set(xOff, 1.73, 0.172);
    group.add(pupil);

    // Eyebrow
    const browGeo = new THREE.BoxGeometry(0.05, 0.008, 0.01);
    const brow = new THREE.Mesh(browGeo, hairMat);
    brow.position.set(xOff, 1.765, 0.155);
    brow.rotation.z = xOff > 0 ? -0.1 : 0.1;
    group.add(brow);
  });

  // Nose
  const noseGeo = new THREE.ConeGeometry(0.02, 0.04, 4);
  const nose = new THREE.Mesh(noseGeo, skinMat);
  nose.position.set(0, 1.705, 0.165);
  nose.rotation.x = -0.3;
  group.add(nose);

  // Mouth (subtle line)
  const mouthGeo = new THREE.BoxGeometry(0.05, 0.005, 0.005);
  const mouthMat = new THREE.MeshPhysicalMaterial({
    color: 0xbb7766, roughness: 0.5,
  });
  const mouth = new THREE.Mesh(mouthGeo, mouthMat);
  mouth.position.set(0, 1.675, 0.155);
  group.add(mouth);

  // Ears
  const earGeo = new THREE.SphereGeometry(0.03, 6, 4);
  [-0.165, 0.165].forEach((xOff) => {
    const ear = new THREE.Mesh(earGeo, skinMat);
    ear.position.set(xOff, 1.72, 0);
    ear.scale.set(0.5, 1, 0.7);
    group.add(ear);
  });

  // --- Accent: lapel pin or badge ---
  const pinGeo = new THREE.CircleGeometry(0.02, 8);
  const pinMat = new THREE.MeshPhysicalMaterial({
    color: accentColor,
    emissive: new THREE.Color(accentColor),
    emissiveIntensity: 1.0,
    metalness: 0.8,
    roughness: 0.2,
  });
  const pin = new THREE.Mesh(pinGeo, pinMat);
  pin.position.set(-0.1, 1.35, 0.18);
  group.add(pin);

  return group;
}
