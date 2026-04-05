import * as THREE from 'three/webgpu';

const textureLoader = new THREE.TextureLoader();

// Load a real texture with PBR wrapping defaults
function loadTex(path, repeatX = 1, repeatY = 1) {
  const tex = textureLoader.load(path);
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(repeatX, repeatY);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

function loadNormal(path, repeatX = 1, repeatY = 1) {
  const tex = textureLoader.load(path);
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(repeatX, repeatY);
  return tex; // normals are linear, no colorSpace
}

// --- Real texture loaders ---

export function createAsphaltMaterial(repeatX = 8, repeatY = 8) {
  return new THREE.MeshPhysicalMaterial({
    map: loadTex('/textures/asphalt_diff.jpg', repeatX, repeatY),
    normalMap: loadNormal('/textures/asphalt_nor.jpg', repeatX, repeatY),
    roughnessMap: loadNormal('/textures/asphalt_rough.jpg', repeatX, repeatY),
    roughness: 0.85,
    metalness: 0.0,
    envMapIntensity: 0.3,
  });
}

export function createConcreteMaterial(repeatX = 6, repeatY = 6) {
  return new THREE.MeshPhysicalMaterial({
    map: loadTex('/textures/concrete_diff.jpg', repeatX, repeatY),
    normalMap: loadNormal('/textures/concrete_nor.jpg', repeatX, repeatY),
    roughnessMap: loadNormal('/textures/concrete_rough.jpg', repeatX, repeatY),
    roughness: 0.75,
    metalness: 0.02,
    envMapIntensity: 0.3,
  });
}

// --- Procedural textures ---

export function createTileTexture(size = 512) {
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');

  const tileSize = size / 4;
  const groutWidth = 3;

  // Grout base
  ctx.fillStyle = '#3a3530';
  ctx.fillRect(0, 0, size, size);

  // Tiles
  for (let r = 0; r < 4; r++) {
    for (let c = 0; c < 4; c++) {
      const brightness = 140 + Math.random() * 30;
      const warm = Math.random() * 8;
      ctx.fillStyle = `rgb(${brightness + warm}, ${brightness + warm / 2}, ${brightness - warm})`;
      ctx.fillRect(
        c * tileSize + groutWidth,
        r * tileSize + groutWidth,
        tileSize - groutWidth * 2,
        tileSize - groutWidth * 2
      );

      // Subtle polish variation
      const grad = ctx.createRadialGradient(
        c * tileSize + tileSize / 2, r * tileSize + tileSize / 2, 0,
        c * tileSize + tileSize / 2, r * tileSize + tileSize / 2, tileSize / 2
      );
      grad.addColorStop(0, `rgba(255, 255, 255, ${0.02 + Math.random() * 0.03})`);
      grad.addColorStop(1, 'rgba(0, 0, 0, 0)');
      ctx.fillStyle = grad;
      ctx.fillRect(c * tileSize, r * tileSize, tileSize, tileSize);
    }
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(3, 2);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

export function createMarbleTexture(size = 512) {
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');

  ctx.fillStyle = '#f0e6d4';
  ctx.fillRect(0, 0, size, size);

  for (let i = 0; i < 60; i++) {
    ctx.beginPath();
    let cx = Math.random() * size, cy = Math.random() * size;
    ctx.moveTo(cx, cy);
    for (let s = 0; s < 10 + Math.random() * 10; s++) {
      cx += (Math.random() - 0.5) * 60;
      cy += (Math.random() - 0.5) * 40;
      ctx.lineTo(cx, cy);
    }
    const g = Math.floor(80 + Math.random() * 60);
    ctx.strokeStyle = `rgba(${g}, ${g - 10}, ${g - 20}, ${0.03 + Math.random() * 0.08})`;
    ctx.lineWidth = 0.5 + Math.random() * 2;
    ctx.stroke();
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(3, 3);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

export function createMarbleRoughnessMap(size = 512) {
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = '#666666';
  ctx.fillRect(0, 0, size, size);
  for (let i = 0; i < 40; i++) {
    const x = Math.random() * size, y = Math.random() * size;
    const r = 20 + Math.random() * 80;
    const grad = ctx.createRadialGradient(x, y, 0, x, y, r);
    grad.addColorStop(0, `rgba(40, 40, 40, ${0.1 + Math.random() * 0.2})`);
    grad.addColorStop(1, 'rgba(100, 100, 100, 0)');
    ctx.fillStyle = grad;
    ctx.fillRect(x - r, y - r, r * 2, r * 2);
  }
  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(3, 3);
  return tex;
}

export function createBrushedMetalNormal(size = 256) {
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = '#8080ff';
  ctx.fillRect(0, 0, size, size);
  for (let y = 0; y < size; y++) {
    const r = 128 + Math.sin(y * 0.3) * 2 + (Math.random() - 0.5) * 4;
    const g = 128 + (Math.random() - 0.5) * 3;
    ctx.fillStyle = `rgb(${Math.floor(r)}, ${Math.floor(g)}, 255)`;
    ctx.fillRect(0, y, size, 1);
  }
  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  return tex;
}

export function createWoodTexture(size = 512) {
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = '#1a1018';
  ctx.fillRect(0, 0, size, size);
  for (let y = 0; y < size; y++) {
    const wave = Math.sin(y * 0.02) * 30 + Math.sin(y * 0.05) * 15;
    const b = 20 + Math.sin((y + wave) * 0.08) * 8;
    ctx.fillStyle = `rgb(${b + 10}, ${b + 5}, ${b})`;
    ctx.fillRect(0, y, size, 1);
  }
  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}
