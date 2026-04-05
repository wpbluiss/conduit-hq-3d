import * as THREE from 'three/webgpu';

/**
 * Outdoor environment — cars, fountain, street lights, bench, ground fog.
 * All procedural (no model loading required).
 */

// ── Procedural car ──
function createCar(color, x, z, rotY = 0) {
  const group = new THREE.Group();
  const bodyMat = new THREE.MeshStandardMaterial({ color, metalness: 0.7, roughness: 0.25 });
  const glassMat = new THREE.MeshStandardMaterial({ color: 0x88ccee, metalness: 0.3, roughness: 0.1, opacity: 0.5, transparent: true });
  const tireMat = new THREE.MeshStandardMaterial({ color: 0x1a1a1a, roughness: 0.9 });
  const chromeMat = new THREE.MeshStandardMaterial({ color: 0xcccccc, metalness: 0.95, roughness: 0.05 });

  // Body lower
  const body = new THREE.Mesh(new THREE.BoxGeometry(4.2, 0.9, 1.8), bodyMat);
  body.position.y = 0.55;
  body.castShadow = true;
  group.add(body);

  // Cabin
  const cabin = new THREE.Mesh(new THREE.BoxGeometry(2.2, 0.75, 1.6), bodyMat);
  cabin.position.set(-0.2, 1.3, 0);
  cabin.castShadow = true;
  group.add(cabin);

  // Windshield (front)
  const windshield = new THREE.Mesh(new THREE.PlaneGeometry(1.5, 0.7), glassMat);
  windshield.position.set(0.9, 1.3, 0);
  windshield.rotation.y = Math.PI / 2;
  windshield.rotation.x = -0.15;
  group.add(windshield);

  // Rear window
  const rearWin = new THREE.Mesh(new THREE.PlaneGeometry(1.5, 0.65), glassMat);
  rearWin.position.set(-1.3, 1.3, 0);
  rearWin.rotation.y = -Math.PI / 2;
  rearWin.rotation.x = 0.1;
  group.add(rearWin);

  // Side windows
  [-1, 1].forEach(side => {
    const sideWin = new THREE.Mesh(new THREE.PlaneGeometry(2.0, 0.6), glassMat);
    sideWin.position.set(-0.2, 1.35, side * 0.81);
    sideWin.rotation.y = side > 0 ? 0 : Math.PI;
    group.add(sideWin);
  });

  // Wheels (4)
  const wheelGeo = new THREE.CylinderGeometry(0.3, 0.3, 0.2, 12);
  [[-1.3, -0.85], [-1.3, 0.85], [1.3, -0.85], [1.3, 0.85]].forEach(([wx, wz]) => {
    const wheel = new THREE.Mesh(wheelGeo, tireMat);
    wheel.position.set(wx, 0.3, wz);
    wheel.rotation.x = Math.PI / 2;
    wheel.castShadow = true;
    group.add(wheel);
    // Hub cap
    const hub = new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.15, 0.22, 8), chromeMat);
    hub.position.set(wx, 0.3, wz);
    hub.rotation.x = Math.PI / 2;
    group.add(hub);
  });

  // Headlights
  [-0.6, 0.6].forEach(hz => {
    const hl = new THREE.Mesh(new THREE.SphereGeometry(0.12, 8, 6), chromeMat);
    hl.position.set(2.1, 0.6, hz);
    group.add(hl);
  });

  // Taillights
  const tailMat = new THREE.MeshStandardMaterial({ color: 0xff2222, emissive: 0xff0000, emissiveIntensity: 0.3 });
  [-0.6, 0.6].forEach(hz => {
    const tl = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.15, 0.3), tailMat);
    tl.position.set(-2.1, 0.6, hz);
    group.add(tl);
  });

  group.position.set(x, 0, z);
  group.rotation.y = rotY;
  return group;
}

// ── Procedural fountain ──
function createFountain(x, z) {
  const group = new THREE.Group();
  const stoneMat = new THREE.MeshStandardMaterial({ color: 0x666672, roughness: 0.7, metalness: 0.1 });

  // Base pool
  const pool = new THREE.Mesh(new THREE.CylinderGeometry(2.0, 2.2, 0.5, 24), stoneMat);
  pool.position.y = 0.25;
  pool.castShadow = true;
  group.add(pool);

  // Water surface
  const waterMat = new THREE.MeshStandardMaterial({
    color: 0x2288cc, roughness: 0.05, metalness: 0.3,
    transparent: true, opacity: 0.7,
  });
  const water = new THREE.Mesh(new THREE.CylinderGeometry(1.85, 1.85, 0.02, 24), waterMat);
  water.position.y = 0.48;
  group.add(water);

  // Center column
  const col = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.25, 1.5, 12), stoneMat);
  col.position.y = 1.0;
  col.castShadow = true;
  group.add(col);

  // Top basin
  const basin = new THREE.Mesh(new THREE.CylinderGeometry(0.7, 0.5, 0.2, 16), stoneMat);
  basin.position.y = 1.8;
  group.add(basin);

  // Water particles (small spheres simulating spray)
  const sprayMat = new THREE.MeshBasicMaterial({
    color: 0x66ccff, transparent: true, opacity: 0.5,
  });
  const sprays = [];
  for (let i = 0; i < 8; i++) {
    const angle = (i / 8) * Math.PI * 2;
    const spray = new THREE.Mesh(new THREE.SphereGeometry(0.04, 4, 4), sprayMat);
    spray.position.set(
      Math.cos(angle) * 0.3,
      2.0,
      Math.sin(angle) * 0.3
    );
    group.add(spray);
    sprays.push({ mesh: spray, angle, phase: Math.random() * Math.PI * 2 });
  }

  // Subtle blue light
  const fLight = new THREE.PointLight(0x4488cc, 3, 6);
  fLight.position.set(0, 1.5, 0);
  group.add(fLight);

  group.position.set(x, 0, z);
  group.userData.sprays = sprays;
  group.userData.water = water;
  return group;
}

// ── Procedural street light ──
function createStreetLight(x, z) {
  const group = new THREE.Group();
  const poleMat = new THREE.MeshStandardMaterial({ color: 0x333338, metalness: 0.7, roughness: 0.3 });

  // Pole
  const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.1, 5.5, 8), poleMat);
  pole.position.y = 2.75;
  pole.castShadow = true;
  group.add(pole);

  // Base
  const base = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.25, 0.3, 8), poleMat);
  base.position.y = 0.15;
  group.add(base);

  // Arm
  const arm = new THREE.Mesh(new THREE.BoxGeometry(1.5, 0.06, 0.06), poleMat);
  arm.position.set(0.6, 5.4, 0);
  group.add(arm);

  // Lamp housing
  const lampMat = new THREE.MeshStandardMaterial({
    color: 0xffeecc, emissive: 0xffddaa, emissiveIntensity: 2.0, toneMapped: false,
  });
  const lamp = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.12, 0.3), lampMat);
  lamp.position.set(1.3, 5.35, 0);
  group.add(lamp);

  // Light cone
  const light = new THREE.PointLight(0xffddaa, 8, 15, 2);
  light.position.set(1.3, 5.2, 0);
  light.castShadow = true;
  group.add(light);

  // Subtle downward spot glow on ground
  const spotGeo = new THREE.CircleGeometry(2.5, 16);
  const spotMat = new THREE.MeshBasicMaterial({
    color: 0xffddaa, transparent: true, opacity: 0.08,
    blending: THREE.AdditiveBlending, depthWrite: false,
  });
  const spot = new THREE.Mesh(spotGeo, spotMat);
  spot.rotation.x = -Math.PI / 2;
  spot.position.set(1.3, 0.08, 0);
  group.add(spot);

  group.position.set(x, 0, z);
  return group;
}

// ── Procedural bench ──
function createBench(x, z, rotY = 0) {
  const group = new THREE.Group();
  const woodMat = new THREE.MeshStandardMaterial({ color: 0x8B5A2B, roughness: 0.7 });
  const metalMat = new THREE.MeshStandardMaterial({ color: 0x333338, metalness: 0.8, roughness: 0.3 });

  // Seat slats (5)
  for (let i = 0; i < 5; i++) {
    const slat = new THREE.Mesh(new THREE.BoxGeometry(1.8, 0.05, 0.12), woodMat);
    slat.position.set(0, 0.5, -0.2 + i * 0.1);
    slat.castShadow = true;
    group.add(slat);
  }

  // Back slats (3)
  for (let i = 0; i < 3; i++) {
    const slat = new THREE.Mesh(new THREE.BoxGeometry(1.8, 0.05, 0.12), woodMat);
    slat.position.set(0, 0.65 + i * 0.15, -0.26);
    slat.rotation.x = 0.15;
    slat.castShadow = true;
    group.add(slat);
  }

  // Metal legs (2 sides)
  [-0.7, 0.7].forEach(lx => {
    const leg = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.5, 0.5), metalMat);
    leg.position.set(lx, 0.25, -0.1);
    group.add(leg);
    // Armrest
    const arm = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.04, 0.4), metalMat);
    arm.position.set(lx, 0.55, -0.05);
    group.add(arm);
  });

  group.position.set(x, 0, z);
  group.rotation.y = rotY;
  return group;
}

// ── Ground fog ──
function createGroundFog(parentGroup) {
  const fogParticles = [];
  const fogMat = new THREE.MeshBasicMaterial({
    color: 0x8899aa, transparent: true, opacity: 0.06,
    blending: THREE.AdditiveBlending, depthWrite: false,
    side: THREE.DoubleSide,
  });

  for (let i = 0; i < 12; i++) {
    const size = 4 + Math.random() * 6;
    const fog = new THREE.Mesh(new THREE.PlaneGeometry(size, size), fogMat.clone());
    fog.rotation.x = -Math.PI / 2;
    const angle = Math.random() * Math.PI * 2;
    const radius = 5 + Math.random() * 15;
    fog.position.set(
      Math.cos(angle) * radius,
      0.15 + Math.random() * 0.3,
      Math.sin(angle) * radius + 15
    );
    fog.rotation.z = Math.random() * Math.PI;
    parentGroup.add(fog);
    fogParticles.push({
      mesh: fog,
      baseX: fog.position.x,
      baseZ: fog.position.z,
      speed: 0.1 + Math.random() * 0.2,
      phase: Math.random() * Math.PI * 2,
    });
  }
  return fogParticles;
}

/**
 * Create all outdoor elements and return an update function.
 */
export function createOutdoor(parentGroup) {
  // Cars parked along the road (z ≈ 32)
  const car1 = createCar(0x1a1a2e, -15, 29, 0);         // dark navy sedan
  const car2 = createCar(0x8b0000, 12, 29, 0);           // dark red sedan
  const car3 = createCar(0xf0f0f0, 20, 35, Math.PI);     // white car, opposite lane
  parentGroup.add(car1, car2, car3);

  // Fountain near entrance
  const fountain = createFountain(8, 18);
  parentGroup.add(fountain);

  // Street lights
  const lights = [
    createStreetLight(-18, 26),
    createStreetLight(-6, 26),
    createStreetLight(8, 26),
    createStreetLight(20, 26),
  ];
  lights.forEach(l => parentGroup.add(l));

  // Benches near entrance
  const bench1 = createBench(-12, 18, Math.PI / 2);
  const bench2 = createBench(15, 14, -Math.PI / 4);
  parentGroup.add(bench1, bench2);

  // Ground fog
  const fogParticles = createGroundFog(parentGroup);

  function update(time) {
    // Animate fountain spray
    const sprays = fountain.userData.sprays;
    for (const s of sprays) {
      const t = time * 2 + s.phase;
      s.mesh.position.y = 1.9 + Math.abs(Math.sin(t)) * 0.8;
      const r = 0.2 + Math.abs(Math.sin(t)) * 0.4;
      s.mesh.position.x = Math.cos(s.angle) * r;
      s.mesh.position.z = Math.sin(s.angle) * r;
    }

    // Subtle water surface shimmer
    const water = fountain.userData.water;
    if (water) {
      water.rotation.y = time * 0.2;
    }

    // Drift fog
    for (const fp of fogParticles) {
      fp.mesh.position.x = fp.baseX + Math.sin(time * fp.speed + fp.phase) * 2;
      fp.mesh.position.z = fp.baseZ + Math.cos(time * fp.speed * 0.7 + fp.phase) * 1.5;
      fp.mesh.material.opacity = 0.04 + Math.sin(time * 0.3 + fp.phase) * 0.02;
    }
  }

  return { update };
}
