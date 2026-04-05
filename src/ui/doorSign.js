import * as THREE from 'three/webgpu';

/**
 * Department door sign descriptions — wall-mounted illuminated signs
 * placed beside the elevator on each floor.
 */
const SIGN_TEXT = {
  sales:        { title: 'SALES DEPARTMENT',    sub: 'Pipeline Management & Deal Closing' },
  marketing:    { title: 'MARKETING',           sub: 'Campaign Strategy & Brand Growth' },
  engineering:  { title: 'ENGINEERING',         sub: 'Product Development & Infrastructure' },
  content:      { title: 'CONTENT',             sub: 'Creative Production & Publishing' },
  intelligence: { title: 'INTELLIGENCE',        sub: 'Data Analytics & Market Research' },
  operations:   { title: 'OPERATIONS',          sub: 'Finance, Billing & Business Ops' },
  monitoring:   { title: 'MONITORING',          sub: 'System Health & Incident Response' },
  ceo:          { title: 'CEO SUITE',           sub: 'Executive Office & Board Room' },
};

/**
 * Create an illuminated wall-mounted department sign.
 * @param {string} deptId - Department ID (sales, marketing, etc.)
 * @param {number} floorY - Floor Y position
 * @param {number} accentColor - Hex accent color (e.g. 0x3b82f6)
 * @param {THREE.Group} parentGroup - Group to add sign meshes to
 * @param {object} [opts] - Optional overrides { x, z, rotY }
 */
export function createDoorSign(deptId, floorY, accentColor, parentGroup, opts = {}) {
  const info = SIGN_TEXT[deptId];
  if (!info) return;

  const accentHex = '#' + new THREE.Color(accentColor).getHexString();

  // Canvas for sign face
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 192;
  const ctx = canvas.getContext('2d');

  // Background
  ctx.fillStyle = '#0a0b10';
  ctx.fillRect(0, 0, 512, 192);

  // Accent border (simple rect for compatibility)
  ctx.strokeStyle = accentHex;
  ctx.lineWidth = 3;
  ctx.strokeRect(6, 6, 500, 180);

  // Thin accent line under title
  ctx.fillStyle = accentHex;
  ctx.fillRect(24, 100, 464, 2);

  // Title
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 36px "Segoe UI", system-ui, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(info.title, 256, 55);

  // Subtitle
  ctx.fillStyle = '#94a3b8';
  ctx.font = '400 20px "Segoe UI", system-ui, sans-serif';
  ctx.fillText(info.sub, 256, 140);

  // Small accent dots in corners
  ctx.fillStyle = accentHex;
  ctx.beginPath();
  ctx.arc(24, 24, 4, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(488, 24, 4, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(24, 168, 4, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(488, 168, 4, 0, Math.PI * 2);
  ctx.fill();

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;

  // Sign dimensions
  const signW = 3.0;
  const signH = 1.12;

  // Default position: right side of elevator, on the back wall
  const x = opts.x ?? 3.0;
  const z = opts.z ?? -7.7;
  const rotY = opts.rotY ?? 0;
  const y = floorY + 2.8;

  // Backing panel (dark metal frame, sits against the wall)
  const backMat = new THREE.MeshStandardMaterial({
    color: 0x111118,
    metalness: 0.6,
    roughness: 0.3,
  });
  const back = new THREE.Mesh(
    new THREE.BoxGeometry(signW + 0.14, signH + 0.14, 0.06),
    backMat
  );
  back.position.set(x, y, z);
  back.rotation.y = rotY;
  parentGroup.add(back);

  // Sign face — use MeshBasicMaterial (self-lit screen, avoids z-fight artifacts)
  // Offset clearly in front of the backing panel
  const signMat = new THREE.MeshBasicMaterial({ map: texture });
  const signMesh = new THREE.Mesh(
    new THREE.PlaneGeometry(signW, signH),
    signMat
  );
  signMesh.position.set(x, y, z);
  signMesh.rotation.y = rotY;
  // Push sign face forward (in the direction it's facing)
  signMesh.position.x += Math.sin(rotY) * 0.04;
  signMesh.position.z += Math.cos(rotY) * 0.04;
  parentGroup.add(signMesh);

  // Accent glow light
  const signLight = new THREE.PointLight(accentColor, 2, 4);
  signLight.position.set(x, y + 0.8, z);
  signLight.position.x += Math.sin(rotY) * 0.5;
  signLight.position.z += Math.cos(rotY) * 0.5;
  parentGroup.add(signLight);
}
