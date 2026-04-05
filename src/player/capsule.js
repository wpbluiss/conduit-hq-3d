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

  // 1. Try Soldier model first (rigged with animations)
  if (!modelLoaded) {
    try {
      const { scene: model, animations } = await loadModel('/models/soldier.glb');
      model.scale.setScalar(1.0);
      model.rotation.y = Math.PI;

      // Recolor soldier to look like a professional CEO
      model.traverse((child) => {
        if (child.isMesh) {
          child.castShadow = true;
          child.receiveShadow = true;
          if (child.material) {
            child.material = child.material.clone();
            const meshName = (child.name || '').toLowerCase();
            if (meshName.includes('head') || meshName.includes('hand') || meshName.includes('face')) {
              child.material.color.set(0xc68642);
            } else if (meshName.includes('hair')) {
              child.material.color.set(0x1a1a1a);
            } else {
              child.material.color.set(0x1a1a3e);
            }
          }
        }
      });

      group.add(model);
      addShadow();

      const anim = setupAnimations(model, animations);
      mixer = anim.mixer;
      actions = anim.actions;
      if (actions['Idle']) {
        actions['Idle'].play();
        currentAction = 'Idle';
      }
      modelLoaded = true;
      console.log('[FIX] Player: Soldier recolored as CEO (navy suit, skin tone)');
    } catch (e) {
      console.warn('Soldier model failed:', e);
    }
  }

  // 2. Stylized capsule character (clean, professional look)
  if (!modelLoaded) {
    const charGroup = new THREE.Group();

    const suitMat = new THREE.MeshPhysicalMaterial({
      color: 0x1a1a3e, roughness: 0.5, metalness: 0.05,
      clearcoat: 0.15, clearcoatRoughness: 0.3,
    });
    const skinMat = new THREE.MeshPhysicalMaterial({
      color: 0xc68642, roughness: 0.65, metalness: 0.0,
    });
    const hairMat = new THREE.MeshPhysicalMaterial({
      color: 0x1a1a1a, roughness: 0.8, metalness: 0.05,
    });
    const shoeMat = new THREE.MeshPhysicalMaterial({
      color: 0x111115, roughness: 0.3, metalness: 0.15,
    });

    // Body (capsule torso)
    const body = new THREE.Mesh(new THREE.CapsuleGeometry(0.18, 0.55, 4, 8), suitMat);
    body.position.y = 0.85;
    body.castShadow = true;
    charGroup.add(body);

    // Head
    const head = new THREE.Mesh(new THREE.SphereGeometry(0.14, 12, 10), skinMat);
    head.position.y = 1.42;
    head.scale.set(1, 1.06, 0.93);
    head.castShadow = true;
    charGroup.add(head);

    // Hair
    const hair = new THREE.Mesh(
      new THREE.SphereGeometry(0.145, 10, 7, 0, Math.PI * 2, 0, Math.PI * 0.5),
      hairMat
    );
    hair.position.y = 1.44;
    charGroup.add(hair);

    // Eyes
    const eyeWhiteMat = new THREE.MeshPhysicalMaterial({ color: 0xffffff, roughness: 0.1 });
    for (const ex of [-0.045, 0.045]) {
      const eye = new THREE.Mesh(new THREE.SphereGeometry(0.018, 6, 5), eyeWhiteMat);
      eye.position.set(ex, 1.43, 0.12);
      charGroup.add(eye);
      const iris = new THREE.Mesh(
        new THREE.SphereGeometry(0.01, 5, 4),
        new THREE.MeshPhysicalMaterial({ color: 0x3a2a15, roughness: 0.2 })
      );
      iris.position.set(ex, 1.43, 0.135);
      charGroup.add(iris);
    }

    // Legs
    for (const side of [-1, 1]) {
      const leg = new THREE.Mesh(new THREE.CapsuleGeometry(0.07, 0.45, 3, 6), suitMat);
      leg.position.set(side * 0.09, 0.35, 0);
      leg.castShadow = true;
      charGroup.add(leg);

      const shoe = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.06, 0.18), shoeMat);
      shoe.position.set(side * 0.09, 0.06, 0.02);
      charGroup.add(shoe);
    }

    // Arms
    for (const side of [-1, 1]) {
      const arm = new THREE.Mesh(new THREE.CapsuleGeometry(0.05, 0.35, 3, 6), suitMat);
      arm.position.set(side * 0.26, 0.82, 0);
      arm.rotation.z = side * 0.12;
      arm.castShadow = true;
      charGroup.add(arm);

      const hand = new THREE.Mesh(new THREE.SphereGeometry(0.035, 6, 4), skinMat);
      hand.position.set(side * 0.3, 0.55, 0);
      charGroup.add(hand);
    }

    charGroup.rotation.y = Math.PI;
    group.add(charGroup);
    addShadow();

    proceduralAnim = { model: charGroup, time: 0, baseY: 0 };
    modelLoaded = true;
    console.log('Player: Stylized capsule character');
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

  // Procedural animation update
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
