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

  return sky;
}
