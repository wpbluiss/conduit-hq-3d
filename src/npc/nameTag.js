import * as THREE from 'three/webgpu';

export function createNameTag(text, color = '#3b82f6') {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 64;
  const ctx = canvas.getContext('2d');

  // Transparent background
  ctx.clearRect(0, 0, 512, 64);

  // Outer glow
  ctx.shadowColor = color;
  ctx.shadowBlur = 16;

  // Semi-transparent dark background pill
  ctx.fillStyle = 'rgba(10, 11, 16, 0.75)';
  roundRect(ctx, 20, 8, 472, 48, 12);
  ctx.fill();

  // Border with glow
  ctx.strokeStyle = color;
  ctx.lineWidth = 2.5;
  roundRect(ctx, 20, 8, 472, 48, 12);
  ctx.stroke();

  ctx.shadowBlur = 0;

  // Text with subtle glow
  ctx.shadowColor = '#ffffff';
  ctx.shadowBlur = 6;
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 28px "Segoe UI", system-ui, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(text, 256, 34);
  ctx.shadowBlur = 0;

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;

  const mat = new THREE.SpriteMaterial({
    map: texture,
    transparent: true,
    depthTest: true,
    sizeAttenuation: true,
  });

  const sprite = new THREE.Sprite(mat);
  sprite.scale.set(2.5, 0.32, 1);

  return sprite;
}

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}
