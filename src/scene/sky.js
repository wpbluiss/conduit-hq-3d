import * as THREE from 'three/webgpu';

/**
 * Creates a sky dome using a canvas-painted gradient texture.
 * WebGPU doesn't support raw GLSL ShaderMaterial, so we use
 * a painted texture approach instead. The HDR env map provides
 * the actual skybox — this adds the dramatic golden hour gradient.
 */
export function createSky(scene) {
  // Paint the sky gradient onto a canvas
  const canvas = document.createElement('canvas');
  canvas.width = 1;
  canvas.height = 512;
  const ctx = canvas.getContext('2d');

  const gradient = ctx.createLinearGradient(0, 0, 0, 512);
  // Top (zenith) → bottom (horizon) — vivid golden hour
  gradient.addColorStop(0.0, '#0c0e2a');   // deep indigo zenith
  gradient.addColorStop(0.1, '#1a1855');   // rich purple
  gradient.addColorStop(0.22, '#3a2268');  // vibrant purple
  gradient.addColorStop(0.35, '#7a3860');  // magenta-mauve
  gradient.addColorStop(0.48, '#cc4425');  // deep orange
  gradient.addColorStop(0.58, '#ff6622');  // blazing orange
  gradient.addColorStop(0.68, '#ff8833');  // bright orange
  gradient.addColorStop(0.78, '#ffaa44');  // golden
  gradient.addColorStop(0.86, '#ffcc66');  // warm gold
  gradient.addColorStop(0.93, '#ffe088');  // horizon glow
  gradient.addColorStop(1.0, '#1a1520');   // below horizon

  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, 1, 512);

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;

  const geo = new THREE.SphereGeometry(450, 32, 32);
  const mat = new THREE.MeshBasicMaterial({
    map: tex,
    side: THREE.BackSide,
    depthWrite: false,
    fog: false,
  });

  const sky = new THREE.Mesh(geo, mat);
  sky.renderOrder = -1;
  scene.add(sky);

  // Sun disc as a bright sprite
  const sunCanvas = document.createElement('canvas');
  sunCanvas.width = 128;
  sunCanvas.height = 128;
  const sctx = sunCanvas.getContext('2d');
  const sunGrad = sctx.createRadialGradient(64, 64, 0, 64, 64, 64);
  sunGrad.addColorStop(0, 'rgba(255, 250, 220, 1)');
  sunGrad.addColorStop(0.15, 'rgba(255, 230, 180, 0.9)');
  sunGrad.addColorStop(0.4, 'rgba(255, 180, 100, 0.4)');
  sunGrad.addColorStop(0.7, 'rgba(255, 130, 60, 0.1)');
  sunGrad.addColorStop(1, 'rgba(255, 100, 40, 0)');
  sctx.fillStyle = sunGrad;
  sctx.fillRect(0, 0, 128, 128);

  const sunTex = new THREE.CanvasTexture(sunCanvas);
  const sunMat = new THREE.SpriteMaterial({
    map: sunTex,
    transparent: true,
    depthWrite: false,
    fog: false,
    toneMapped: false,
  });
  const sun = new THREE.Sprite(sunMat);
  sun.scale.set(120, 120, 1);
  // Position low on horizon, matching SUN_DIR — bigger and brighter
  sun.position.set(-160, 55, -320);
  scene.add(sun);

  // --- Clouds (scattered sprites that drift slowly) ---
  const cloudGroup = new THREE.Group();
  cloudGroup.name = 'clouds';

  const cloudCanvas = document.createElement('canvas');
  cloudCanvas.width = 256;
  cloudCanvas.height = 128;
  const cctx = cloudCanvas.getContext('2d');
  // Paint soft cloud blob
  cctx.clearRect(0, 0, 256, 128);
  for (let ci = 0; ci < 5; ci++) {
    const cx = 60 + ci * 35 + Math.random() * 20;
    const cy = 50 + Math.random() * 30;
    const cr = 25 + Math.random() * 25;
    const cgrad = cctx.createRadialGradient(cx, cy, 0, cx, cy, cr);
    cgrad.addColorStop(0, 'rgba(255,240,220,0.6)');
    cgrad.addColorStop(0.5, 'rgba(255,220,190,0.3)');
    cgrad.addColorStop(1, 'rgba(255,200,160,0)');
    cctx.fillStyle = cgrad;
    cctx.fillRect(cx - cr, cy - cr, cr * 2, cr * 2);
  }

  const cloudTex = new THREE.CanvasTexture(cloudCanvas);
  cloudTex.colorSpace = THREE.SRGBColorSpace;

  for (let i = 0; i < 12; i++) {
    const cloudMat = new THREE.SpriteMaterial({
      map: cloudTex, transparent: true, opacity: 0.3 + Math.random() * 0.3,
      depthWrite: false, fog: false,
    });
    const cloud = new THREE.Sprite(cloudMat);
    const scale = 40 + Math.random() * 60;
    cloud.scale.set(scale, scale * 0.4, 1);
    const angle = Math.random() * Math.PI * 2;
    const dist = 200 + Math.random() * 200;
    cloud.position.set(
      Math.cos(angle) * dist,
      60 + Math.random() * 100,
      Math.sin(angle) * dist
    );
    cloud.userData.driftSpeed = 0.5 + Math.random() * 1.0;
    cloud.userData.baseX = cloud.position.x;
    cloudGroup.add(cloud);
  }
  scene.add(cloudGroup);

  // --- Distant aircraft light (small blinking dot moving across sky) ---
  const aircraftMat = new THREE.SpriteMaterial({
    color: 0xffffff, transparent: true, opacity: 0,
    depthWrite: false, fog: false, toneMapped: false,
  });
  const aircraft = new THREE.Sprite(aircraftMat);
  aircraft.scale.set(2, 2, 1);
  aircraft.position.set(300, 120, -200);
  aircraft.userData.phase = 0;
  aircraft.userData.active = false;
  aircraft.userData.nextAppear = 20 + Math.random() * 40;
  aircraft.userData.timer = 0;
  scene.add(aircraft);

  // Animation function — call from render loop
  function updateSky(elapsedTime, delta) {
    // Drift clouds
    for (const cloud of cloudGroup.children) {
      cloud.position.x = cloud.userData.baseX + Math.sin(elapsedTime * 0.02 * cloud.userData.driftSpeed) * 30;
    }

    // Aircraft light
    aircraft.userData.timer += delta;
    if (!aircraft.userData.active) {
      if (aircraft.userData.timer > aircraft.userData.nextAppear) {
        aircraft.userData.active = true;
        aircraft.userData.timer = 0;
        aircraft.userData.phase = 0;
        // Random start position
        const angle = Math.random() * Math.PI * 2;
        aircraft.position.set(Math.cos(angle) * 350, 80 + Math.random() * 80, Math.sin(angle) * 350);
        aircraft.userData.vx = -Math.cos(angle) * 8;
        aircraft.userData.vz = -Math.sin(angle) * 8;
      }
    } else {
      aircraft.userData.phase += delta;
      aircraft.position.x += aircraft.userData.vx * delta;
      aircraft.position.z += aircraft.userData.vz * delta;
      // Blinking pattern
      const blink = Math.sin(aircraft.userData.phase * 4) > 0.5 ? 1 : 0.1;
      aircraftMat.opacity = blink;
      // Disappear after crossing
      if (aircraft.userData.phase > 30) {
        aircraft.userData.active = false;
        aircraftMat.opacity = 0;
        aircraft.userData.nextAppear = 30 + Math.random() * 60;
        aircraft.userData.timer = 0;
      }
    }
  }

  return { sky, cloudGroup, updateSky };
}
