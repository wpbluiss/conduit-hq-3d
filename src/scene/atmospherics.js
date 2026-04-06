import * as THREE from 'three/webgpu';

/**
 * Atmospheric effects system: floating dust particles, volumetric fog planes,
 * and screen flicker for that moody industrial feel.
 */

// ═══ FLOATING DUST PARTICLES (per-floor) ═══
export function createDustParticles(parent, opts = {}) {
  const {
    count = 60,
    spread = { x: 20, y: 3.5, z: 14 },
    baseY = 0.5,
    color = 0xffeedd,
    size = 0.04,
    opacity = 0.4,
  } = opts;

  const geo = new THREE.BufferGeometry();
  const positions = new Float32Array(count * 3);
  const speeds = new Float32Array(count);
  const phases = new Float32Array(count);

  for (let i = 0; i < count; i++) {
    positions[i * 3] = (Math.random() - 0.5) * spread.x;
    positions[i * 3 + 1] = baseY + Math.random() * spread.y;
    positions[i * 3 + 2] = (Math.random() - 0.5) * spread.z;
    speeds[i] = 0.15 + Math.random() * 0.35;
    phases[i] = Math.random() * Math.PI * 2;
  }
  geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));

  const mat = new THREE.PointsMaterial({
    color,
    size,
    transparent: true,
    opacity,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
  });

  const points = new THREE.Points(geo, mat);
  parent.add(points);

  function update(elapsed) {
    const arr = points.geometry.attributes.position.array;
    for (let i = 0; i < count; i++) {
      const spd = speeds[i];
      const ph = phases[i];
      // Gentle drift up + swirl
      arr[i * 3 + 1] += Math.sin(elapsed * spd + ph) * 0.002;
      arr[i * 3] += Math.cos(elapsed * spd * 0.6 + ph * 1.3) * 0.001;
      arr[i * 3 + 2] += Math.sin(elapsed * spd * 0.4 + ph * 0.7) * 0.0008;

      // Wrap vertically
      if (arr[i * 3 + 1] > baseY + spread.y) arr[i * 3 + 1] = baseY;
      if (arr[i * 3 + 1] < baseY - 0.5) arr[i * 3 + 1] = baseY + spread.y;
    }
    points.geometry.attributes.position.needsUpdate = true;
  }

  return { points, update };
}

// ═══ VOLUMETRIC FOG PLANES (layered transparent planes) ═══
export function createVolumetricFog(parent, opts = {}) {
  const {
    layers = 4,
    width = 22,
    height = 3.5,
    depth = 16,
    color = 0x8899bb,
    opacity = 0.025,
    baseY = 0,
  } = opts;

  const planes = [];
  const fogMat = new THREE.MeshBasicMaterial({
    color,
    transparent: true,
    opacity,
    blending: THREE.AdditiveBlending,
    side: THREE.DoubleSide,
    depthWrite: false,
  });

  for (let i = 0; i < layers; i++) {
    const plane = new THREE.Mesh(
      new THREE.PlaneGeometry(width, height),
      fogMat.clone()
    );
    // Horizontal layers at different heights
    plane.rotation.x = -Math.PI / 2;
    plane.position.y = baseY + 0.8 + i * (height / layers) * 0.7;
    plane.position.z = (Math.random() - 0.5) * 2;
    plane.material.opacity = opacity * (1 - i * 0.15);
    planes.push(plane);
    parent.add(plane);
  }

  // Vertical fog wisps
  for (let i = 0; i < 2; i++) {
    const wisp = new THREE.Mesh(
      new THREE.PlaneGeometry(3, height * 0.8),
      fogMat.clone()
    );
    wisp.position.set(
      (Math.random() - 0.5) * width * 0.6,
      baseY + height * 0.4,
      (Math.random() - 0.5) * depth * 0.3
    );
    wisp.rotation.y = Math.random() * Math.PI;
    wisp.material.opacity = opacity * 0.6;
    planes.push(wisp);
    parent.add(wisp);
  }

  function update(elapsed) {
    for (let i = 0; i < planes.length; i++) {
      const p = planes[i];
      // Gentle drift
      p.position.x += Math.sin(elapsed * 0.15 + i * 1.5) * 0.003;
      p.material.opacity = (opacity * (1 - (i % 4) * 0.12)) *
        (0.85 + 0.15 * Math.sin(elapsed * 0.3 + i * 0.8));
    }
  }

  return { planes, update };
}

// ═══ SCREEN FLICKER for department monitors ═══
export function createScreenFlicker() {
  const screens = [];

  function register(mesh) {
    if (!mesh || !mesh.material) return;
    screens.push({
      mesh,
      baseEmissive: mesh.material.emissiveIntensity || 1.0,
      flickerSpeed: 2 + Math.random() * 4,
      flickerPhase: Math.random() * Math.PI * 2,
      // Occasional glitch: rapid flicker for a few frames
      glitchTimer: 5 + Math.random() * 15,
      glitching: false,
      glitchDuration: 0,
    });
  }

  function update(elapsed) {
    for (const s of screens) {
      if (!s.mesh.visible) continue;

      // Normal subtle flicker
      let intensity = s.baseEmissive * (0.92 + 0.08 * Math.sin(elapsed * s.flickerSpeed + s.flickerPhase));

      // Occasional glitch effect
      s.glitchTimer -= 0.016;
      if (s.glitchTimer <= 0 && !s.glitching) {
        s.glitching = true;
        s.glitchDuration = 0.1 + Math.random() * 0.2;
      }
      if (s.glitching) {
        intensity *= (Math.random() > 0.5 ? 1.3 : 0.5);
        s.glitchDuration -= 0.016;
        if (s.glitchDuration <= 0) {
          s.glitching = false;
          s.glitchTimer = 8 + Math.random() * 20;
        }
      }

      if (s.mesh.material.emissiveIntensity !== undefined) {
        s.mesh.material.emissiveIntensity = intensity;
      }
    }
  }

  return { register, update };
}

// ═══ EMBER / SPARK PARTICLES (for engineering / server rooms) ═══
export function createEmberParticles(parent, opts = {}) {
  const {
    count = 25,
    spread = { x: 10, y: 2, z: 8 },
    baseY = 0,
    color = 0xff6622,
    size = 0.03,
  } = opts;

  const geo = new THREE.BufferGeometry();
  const positions = new Float32Array(count * 3);
  const velocities = new Float32Array(count * 3);

  for (let i = 0; i < count; i++) {
    positions[i * 3] = (Math.random() - 0.5) * spread.x;
    positions[i * 3 + 1] = baseY + Math.random() * spread.y;
    positions[i * 3 + 2] = (Math.random() - 0.5) * spread.z;
    velocities[i * 3] = (Math.random() - 0.5) * 0.02;
    velocities[i * 3 + 1] = 0.005 + Math.random() * 0.015;
    velocities[i * 3 + 2] = (Math.random() - 0.5) * 0.02;
  }
  geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));

  const mat = new THREE.PointsMaterial({
    color,
    size,
    transparent: true,
    opacity: 0.7,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
  });

  const points = new THREE.Points(geo, mat);
  parent.add(points);

  function update(elapsed) {
    const arr = points.geometry.attributes.position.array;
    for (let i = 0; i < count; i++) {
      arr[i * 3] += velocities[i * 3] + Math.sin(elapsed + i) * 0.001;
      arr[i * 3 + 1] += velocities[i * 3 + 1];
      arr[i * 3 + 2] += velocities[i * 3 + 2];

      // Reset when they float too high
      if (arr[i * 3 + 1] > baseY + spread.y) {
        arr[i * 3] = (Math.random() - 0.5) * spread.x;
        arr[i * 3 + 1] = baseY;
        arr[i * 3 + 2] = (Math.random() - 0.5) * spread.z;
      }
    }
    points.geometry.attributes.position.needsUpdate = true;
  }

  return { points, update };
}
