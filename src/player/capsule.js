import * as THREE from 'three/webgpu';
import { PLAYER } from '../constants.js';
import { loadModel, setupAnimations } from '../utils/modelLoader.js';

export async function createPlayer(scene) {
  const group = new THREE.Group();
  let mixer = null;
  let actions = {};
  let currentAction = null;
  let proceduralAnim = null;

  let modelLoaded = false;

  // Shadow circle
  function addShadow() {
    const shadowGeo = new THREE.CircleGeometry(0.4, 16);
    const shadowMat = new THREE.MeshBasicMaterial({
      color: 0x000000, transparent: true, opacity: 0.3,
      depthWrite: false,
    });
    const shadow = new THREE.Mesh(shadowGeo, shadowMat);
    shadow.rotation.x = -Math.PI / 2;
    shadow.position.y = 0.02;
    group.add(shadow);
  }

  // Professional CEO character (procedural — clean business person)
  if (!modelLoaded) {
    const charGroup = new THREE.Group();

    const suitMat = new THREE.MeshPhysicalMaterial({
      color: 0x0f0f20, roughness: 0.4, metalness: 0.08,
      clearcoat: 0.3, clearcoatRoughness: 0.2,
    });
    const skinMat = new THREE.MeshPhysicalMaterial({
      color: 0xc68642, roughness: 0.55, metalness: 0.0,
      sheen: 0.3, sheenColor: new THREE.Color(0xffddbb), sheenRoughness: 0.4,
    });
    const hairMat = new THREE.MeshPhysicalMaterial({
      color: 0x0a0a0a, roughness: 0.7, metalness: 0.05,
      clearcoat: 0.15,
    });
    const shoeMat = new THREE.MeshPhysicalMaterial({
      color: 0x0a0a0a, roughness: 0.2, metalness: 0.2,
      clearcoat: 0.6, clearcoatRoughness: 0.1,
    });
    const shirtMat = new THREE.MeshPhysicalMaterial({
      color: 0xf0f0f0, roughness: 0.5, metalness: 0.0,
    });

    // --- Legs ---
    for (const side of [-1, 1]) {
      const legGroup = new THREE.Group();
      // Upper leg
      const upper = new THREE.Mesh(new THREE.CapsuleGeometry(0.065, 0.35, 4, 8), suitMat);
      upper.position.y = 0.45;
      legGroup.add(upper);
      // Knee
      const knee = new THREE.Mesh(new THREE.SphereGeometry(0.058, 6, 5), suitMat);
      knee.position.y = 0.24;
      legGroup.add(knee);
      // Lower leg
      const lower = new THREE.Mesh(new THREE.CapsuleGeometry(0.055, 0.3, 4, 8), suitMat);
      lower.position.y = 0.06;
      legGroup.add(lower);
      // Ankle
      const ankle = new THREE.Mesh(new THREE.SphereGeometry(0.04, 6, 5), skinMat);
      ankle.position.y = -0.12;
      legGroup.add(ankle);
      // Shoe
      const shoe = new THREE.Mesh(new THREE.CapsuleGeometry(0.04, 0.1, 3, 6), shoeMat);
      shoe.rotation.z = Math.PI / 2;
      shoe.position.set(0, -0.16, 0.02);
      legGroup.add(shoe);
      const toe = new THREE.Mesh(new THREE.SphereGeometry(0.042, 6, 5), shoeMat);
      toe.position.set(0, -0.16, 0.08);
      toe.scale.set(1, 0.7, 1.2);
      legGroup.add(toe);

      legGroup.position.set(side * 0.09, 0, 0);
      charGroup.add(legGroup);
    }

    // --- Torso ---
    // Lathe for natural body shape
    const torsoMesh = new THREE.Mesh(
      new THREE.LatheGeometry(
        Array.from({ length: 12 }, (_, i) => {
          const t = i / 11;
          const y = 0.6 + t * 0.55;
          let r;
          if (t < 0.2) r = 0.17;
          else if (t < 0.5) r = 0.18;
          else if (t < 0.8) r = 0.16;
          else r = 0.1;
          return new THREE.Vector2(r, y);
        }), 14
      ),
      suitMat
    );
    torsoMesh.castShadow = true;
    charGroup.add(torsoMesh);

    // Shirt collar
    const collar = new THREE.Mesh(
      new THREE.CylinderGeometry(0.065, 0.09, 0.05, 10), shirtMat
    );
    collar.position.y = 1.18;
    collar.position.z = 0.01;
    charGroup.add(collar);

    // Tie
    const tieMat = new THREE.MeshPhysicalMaterial({
      color: 0x8b5cf6, roughness: 0.35, metalness: 0.1,
    });
    const tieKnot = new THREE.Mesh(new THREE.SphereGeometry(0.018, 5, 4), tieMat);
    tieKnot.position.set(0, 1.14, 0.1);
    tieKnot.scale.set(1, 1.2, 0.6);
    charGroup.add(tieKnot);
    const tieBody = new THREE.Mesh(new THREE.BoxGeometry(0.032, 0.2, 0.006), tieMat);
    tieBody.position.set(0, 1.0, 0.11);
    charGroup.add(tieBody);

    // --- Arms ---
    for (const side of [-1, 1]) {
      // Shoulder
      const shoulder = new THREE.Mesh(new THREE.SphereGeometry(0.06, 8, 6), suitMat);
      shoulder.position.set(side * 0.24, 1.12, 0);
      charGroup.add(shoulder);
      // Upper arm
      const arm = new THREE.Mesh(new THREE.CapsuleGeometry(0.045, 0.25, 4, 8), suitMat);
      arm.position.set(side * 0.27, 0.92, 0);
      arm.rotation.z = side * 0.1;
      arm.castShadow = true;
      charGroup.add(arm);
      // Elbow
      const elbow = new THREE.Mesh(new THREE.SphereGeometry(0.038, 6, 5), suitMat);
      elbow.position.set(side * 0.29, 0.76, 0);
      charGroup.add(elbow);
      // Forearm
      const forearm = new THREE.Mesh(new THREE.CapsuleGeometry(0.035, 0.2, 3, 6), skinMat);
      forearm.position.set(side * 0.3, 0.62, 0);
      charGroup.add(forearm);
      // Hand with fingers
      const handGroup = new THREE.Group();
      handGroup.position.set(side * 0.3, 0.48, 0);
      const palm = new THREE.Mesh(new THREE.BoxGeometry(0.045, 0.035, 0.03), skinMat);
      handGroup.add(palm);
      for (let fi = 0; fi < 4; fi++) {
        const finger = new THREE.Mesh(new THREE.CapsuleGeometry(0.005, 0.025, 2, 4), skinMat);
        finger.position.set(-0.012 + fi * 0.008, -0.025, 0);
        handGroup.add(finger);
      }
      const thumb = new THREE.Mesh(new THREE.CapsuleGeometry(0.006, 0.018, 2, 4), skinMat);
      thumb.position.set(side * 0.022, 0, 0.01);
      thumb.rotation.z = side * 0.6;
      handGroup.add(thumb);
      charGroup.add(handGroup);
    }

    // --- Head ---
    // Neck
    const neck = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.055, 0.08, 10), skinMat);
    neck.position.y = 1.24;
    charGroup.add(neck);

    // Head
    const head = new THREE.Mesh(new THREE.SphereGeometry(0.135, 16, 14), skinMat);
    head.position.y = 1.4;
    head.scale.set(1, 1.08, 0.95);
    head.castShadow = true;
    charGroup.add(head);

    // Jawline
    const jaw = new THREE.Mesh(
      new THREE.SphereGeometry(0.1, 10, 6, 0, Math.PI * 2, Math.PI * 0.55, Math.PI * 0.25),
      skinMat
    );
    jaw.position.set(0, 1.33, 0.01);
    jaw.scale.set(1, 0.75, 0.9);
    charGroup.add(jaw);

    // Hair — clean short executive cut
    const hair = new THREE.Mesh(
      new THREE.SphereGeometry(0.14, 12, 8, 0, Math.PI * 2, 0, Math.PI * 0.42),
      hairMat
    );
    hair.position.set(0, 1.42, -0.01);
    charGroup.add(hair);
    // Subtle side hair
    for (const s of [-1, 1]) {
      const sideHair = new THREE.Mesh(new THREE.SphereGeometry(0.03, 6, 5), hairMat);
      sideHair.position.set(s * 0.12, 1.38, -0.02);
      sideHair.scale.set(0.4, 0.8, 0.5);
      charGroup.add(sideHair);
    }

    // Eyebrows
    const browMat = new THREE.MeshPhysicalMaterial({ color: 0x0a0a0a, roughness: 0.8 });
    for (const ex of [-0.042, 0.042]) {
      const brow = new THREE.Mesh(new THREE.BoxGeometry(0.032, 0.006, 0.008), browMat);
      brow.position.set(ex, 1.46, 0.118);
      brow.rotation.z = ex > 0 ? -0.1 : 0.1;
      charGroup.add(brow);
    }

    // Eyes
    const eyeWhiteMat = new THREE.MeshPhysicalMaterial({ color: 0xfafafa, roughness: 0.05 });
    const irisMat = new THREE.MeshPhysicalMaterial({ color: 0x3a2a15, roughness: 0.15, metalness: 0.1 });
    for (const ex of [-0.042, 0.042]) {
      const eyeWhite = new THREE.Mesh(new THREE.SphereGeometry(0.017, 8, 6), eyeWhiteMat);
      eyeWhite.position.set(ex, 1.42, 0.12);
      charGroup.add(eyeWhite);
      const iris = new THREE.Mesh(new THREE.SphereGeometry(0.01, 6, 5), irisMat);
      iris.position.set(ex, 1.42, 0.134);
      charGroup.add(iris);
      const pupil = new THREE.Mesh(new THREE.SphereGeometry(0.005, 5, 4),
        new THREE.MeshPhysicalMaterial({ color: 0x050505 }));
      pupil.position.set(ex, 1.42, 0.137);
      charGroup.add(pupil);
      // Eyelid
      const lid = new THREE.Mesh(
        new THREE.TorusGeometry(0.016, 0.003, 4, 8, Math.PI), skinMat
      );
      lid.position.set(ex, 1.435, 0.12);
      lid.rotation.x = -0.2;
      charGroup.add(lid);
    }

    // Nose
    const noseBridge = new THREE.Mesh(new THREE.CapsuleGeometry(0.007, 0.025, 2, 4), skinMat);
    noseBridge.position.set(0, 1.39, 0.13);
    charGroup.add(noseBridge);
    const noseTip = new THREE.Mesh(new THREE.SphereGeometry(0.014, 6, 5), skinMat);
    noseTip.position.set(0, 1.375, 0.138);
    charGroup.add(noseTip);

    // Mouth
    const lipMat = new THREE.MeshPhysicalMaterial({ color: 0xbb7766, roughness: 0.4 });
    const upperLip = new THREE.Mesh(new THREE.TorusGeometry(0.018, 0.004, 4, 8, Math.PI), lipMat);
    upperLip.position.set(0, 1.35, 0.125);
    upperLip.rotation.x = Math.PI;
    charGroup.add(upperLip);
    const lowerLip = new THREE.Mesh(new THREE.TorusGeometry(0.016, 0.004, 4, 8, Math.PI), lipMat);
    lowerLip.position.set(0, 1.345, 0.125);
    charGroup.add(lowerLip);

    // Ears
    for (const ex of [-1, 1]) {
      const ear = new THREE.Mesh(new THREE.SphereGeometry(0.018, 5, 4), skinMat);
      ear.position.set(ex * 0.13, 1.4, 0);
      ear.scale.set(0.35, 0.8, 0.5);
      charGroup.add(ear);
    }

    // Chin
    const chin = new THREE.Mesh(new THREE.SphereGeometry(0.013, 5, 4), skinMat);
    chin.position.set(0, 1.305, 0.12);
    chin.scale.set(1, 0.5, 0.5);
    charGroup.add(chin);

    // Belt
    const beltMat = new THREE.MeshPhysicalMaterial({ color: 0x111111, roughness: 0.25, metalness: 0.3 });
    const belt = new THREE.Mesh(new THREE.TorusGeometry(0.17, 0.012, 4, 16), beltMat);
    belt.position.set(0, 0.62, 0);
    belt.rotation.x = Math.PI / 2;
    charGroup.add(belt);
    const buckle = new THREE.Mesh(new THREE.BoxGeometry(0.022, 0.018, 0.008),
      new THREE.MeshPhysicalMaterial({ color: 0xcccccc, metalness: 0.8, roughness: 0.2 }));
    buckle.position.set(0, 0.62, 0.18);
    charGroup.add(buckle);

    // Watch
    const watchMat = new THREE.MeshPhysicalMaterial({ color: 0x222222, metalness: 0.6, roughness: 0.2 });
    const watch = new THREE.Mesh(new THREE.CylinderGeometry(0.014, 0.014, 0.005, 8), watchMat);
    watch.rotation.x = Math.PI / 2;
    watch.position.set(-0.3, 0.56, 0);
    charGroup.add(watch);
    const watchFace = new THREE.Mesh(new THREE.CircleGeometry(0.012, 8),
      new THREE.MeshPhysicalMaterial({ color: 0x1a1a3e, metalness: 0.3 }));
    watchFace.position.set(-0.3, 0.56, 0.004);
    watchFace.rotation.x = 0;
    charGroup.add(watchFace);

    charGroup.rotation.y = Math.PI;
    group.add(charGroup);
    addShadow();

    proceduralAnim = { model: charGroup, time: 0, baseY: 0 };
    modelLoaded = true;
    console.log('Player: Premium CEO character');
  }

  group.position.set(0, 0, 40);
  scene.add(group);

  group.userData.mixer = mixer;
  group.userData.actions = actions;
  group.userData.currentAction = currentAction;

  group.userData.setAnimation = (name) => {
    if (!mixer || !actions[name] || currentAction === name) return;
    if (currentAction && actions[currentAction]) {
      actions[currentAction].fadeOut(0.2);
    }
    actions[name].reset().fadeIn(0.2).play();
    currentAction = name;
    group.userData.currentAction = name;
  };

  group.userData.updateProceduralAnim = (dt, isMoving, isSprinting) => {
    if (!proceduralAnim) return;
    const { model, baseY } = proceduralAnim;

    if (isMoving) {
      const speed = isSprinting ? 12 : 7;
      proceduralAnim.time += dt * speed;
      const t = proceduralAnim.time;
      model.position.y = baseY + Math.abs(Math.sin(t)) * 0.015;
    } else {
      model.position.y = baseY;
    }

    model.rotation.z = 0;
    model.rotation.x = 0;
  };

  return group;
}
