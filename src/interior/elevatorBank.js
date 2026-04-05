import * as THREE from 'three/webgpu';
import { ELEVATOR, LOBBY, COLORS } from '../constants.js';
import { createBrushedMetalNormal } from '../utils/textures.js';

export function createElevatorBank(scene) {
  const group = new THREE.Group();
  const doorPositions = [];
  const metalNorm = createBrushedMetalNormal();

  // Polished stainless steel frame — low envMap to avoid outdoor HDR reflections indoors
  const frameMat = new THREE.MeshPhysicalMaterial({
    color: 0x999aaa,
    metalness: 0.95,
    roughness: 0.15,
    normalMap: metalNorm,
    normalScale: new THREE.Vector2(0.2, 0.2),
    envMapIntensity: 0.3,
    clearcoat: 0.4,
    clearcoatRoughness: 0.1,
  });

  // Brushed door panel — neutral reflections for indoor use
  const doorMat = new THREE.MeshPhysicalMaterial({
    color: 0x888899,
    metalness: 0.9,
    roughness: 0.2,
    normalMap: metalNorm,
    normalScale: new THREE.Vector2(0.4, 0.4),
    envMapIntensity: 0.3,
  });

  const z = ELEVATOR.backWallZ;

  for (let i = 0; i < ELEVATOR.count; i++) {
    const x = (i - 1) * ELEVATOR.spacing;
    const dg = new THREE.Group();

    const dw = ELEVATOR.doorWidth;
    const dh = ELEVATOR.doorHeight;

    // Outer frame — beveled extrusion
    const frameShape = new THREE.Shape();
    const fw = dw / 2 + 0.2, fh = dh + 0.25;
    const fr = 0.06;
    frameShape.moveTo(-fw + fr, 0);
    frameShape.lineTo(fw - fr, 0);
    frameShape.quadraticCurveTo(fw, 0, fw, fr);
    frameShape.lineTo(fw, fh - fr);
    frameShape.quadraticCurveTo(fw, fh, fw - fr, fh);
    frameShape.lineTo(-fw + fr, fh);
    frameShape.quadraticCurveTo(-fw, fh, -fw, fh - fr);
    frameShape.lineTo(-fw, fr);
    frameShape.quadraticCurveTo(-fw, 0, -fw + fr, 0);

    // Cut out door opening
    const hole = new THREE.Path();
    const hw = dw / 2, hh = dh;
    hole.moveTo(-hw, 0.01);
    hole.lineTo(hw, 0.01);
    hole.lineTo(hw, hh);
    hole.lineTo(-hw, hh);
    hole.lineTo(-hw, 0.01);
    frameShape.holes.push(hole);

    const frameGeo = new THREE.ExtrudeGeometry(frameShape, {
      depth: 0.08, bevelEnabled: true,
      bevelThickness: 0.015, bevelSize: 0.015, bevelSegments: 2,
    });
    const frame = new THREE.Mesh(frameGeo, frameMat);
    frame.position.set(0, 0, 0.04);
    dg.add(frame);

    // Door panels (left + right)
    const panelGeo = new THREE.BoxGeometry(dw / 2 - 0.03, dh - 0.04, 0.03);
    const leftDoor = new THREE.Mesh(panelGeo, doorMat);
    leftDoor.position.set(-dw / 4, dh / 2, 0.02);
    dg.add(leftDoor);

    const rightDoor = new THREE.Mesh(panelGeo, doorMat);
    rightDoor.position.set(dw / 4, dh / 2, 0.02);
    dg.add(rightDoor);

    // Center seam
    const seamGeo = new THREE.BoxGeometry(0.008, dh - 0.05, 0.035);
    const seamMat = new THREE.MeshStandardMaterial({ color: 0x444455 });
    const seam = new THREE.Mesh(seamGeo, seamMat);
    seam.position.set(0, dh / 2, 0.025);
    dg.add(seam);

    // Floor indicator (above door)
    const indGeo = new THREE.BoxGeometry(0.7, 0.3, 0.04);
    const indMat = new THREE.MeshPhysicalMaterial({
      color: 0x080810,
      emissive: COLORS.blue,
      emissiveIntensity: 1.0,
      metalness: 0.5,
      roughness: 0.1,
    });
    const indicator = new THREE.Mesh(indGeo, indMat);
    indicator.position.set(0, dh + 0.35, 0.04);
    dg.add(indicator);

    // Floor number
    const numCanvas = document.createElement('canvas');
    numCanvas.width = 64; numCanvas.height = 32;
    const ctx = numCanvas.getContext('2d');
    ctx.fillStyle = '#0a0b10';
    ctx.fillRect(0, 0, 64, 32);
    ctx.fillStyle = '#3b82f6';
    ctx.font = 'bold 22px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('1', 32, 16);
    const numTex = new THREE.CanvasTexture(numCanvas);
    const numPlane = new THREE.Mesh(
      new THREE.PlaneGeometry(0.5, 0.22),
      new THREE.MeshBasicMaterial({ map: numTex })
    );
    numPlane.position.set(0, dh + 0.35, 0.065);
    dg.add(numPlane);

    // Call button panel
    const btnPanelGeo = new THREE.BoxGeometry(0.12, 0.2, 0.025);
    const btnPanel = new THREE.Mesh(btnPanelGeo, frameMat);
    btnPanel.position.set(dw / 2 + 0.25, 1.15, 0.04);
    dg.add(btnPanel);

    // Button (glowing)
    const btnGeo = new THREE.CylinderGeometry(0.025, 0.025, 0.015, 8);
    const btnMat = new THREE.MeshPhysicalMaterial({
      color: COLORS.cyan,
      emissive: COLORS.cyan,
      emissiveIntensity: 2.5,
      toneMapped: false,
    });
    const btn = new THREE.Mesh(btnGeo, btnMat);
    btn.rotation.x = Math.PI / 2;
    btn.position.set(dw / 2 + 0.25, 1.15, 0.06);
    dg.add(btn);

    dg.position.set(x, LOBBY.floorY, z);
    group.add(dg);
    doorPositions.push(new THREE.Vector3(x, LOBBY.floorY, z));

    // Store door refs for animation
    dg.userData.leftDoor = leftDoor;
    dg.userData.rightDoor = rightDoor;
    dg.userData.doorWidth = dw;
  }

  // Door animation system
  let doorsOpen = false;
  let doorAnim = 0; // 0=closed, 1=open
  let doorTarget = 0;

  function animateDoors(dt) {
    if (doorAnim !== doorTarget) {
      const speed = 1.8; // opens in ~0.55s
      doorAnim += (doorTarget - doorAnim) * Math.min(1, dt * speed * 3);
      if (Math.abs(doorAnim - doorTarget) < 0.01) doorAnim = doorTarget;

      group.children.forEach(dg => {
        if (!dg.userData.leftDoor) return;
        const offset = doorAnim * (dg.userData.doorWidth / 2 - 0.05);
        dg.userData.leftDoor.position.x = -dg.userData.doorWidth / 4 - offset;
        dg.userData.rightDoor.position.x = dg.userData.doorWidth / 4 + offset;
      });
    }
  }

  function openDoors() { doorTarget = 1; }
  function closeDoors() { doorTarget = 0; }
  function areDoorsOpen() { return doorAnim > 0.9; }

  scene.add(group);
  return { group, doorPositions, animateDoors, openDoors, closeDoors, areDoorsOpen };
}
