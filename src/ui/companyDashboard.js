import * as THREE from 'three/webgpu';

/**
 * Company Dashboard Screens — wall-mounted displays showing live metrics.
 * Used in lobby and CEO suite.
 */

const METRICS = [
  { label: 'Monthly Revenue', value: 199, prefix: '$', suffix: '/mo', color: '#10b981' },
  { label: 'Active Employees', value: 35, prefix: '', suffix: '', color: '#3b82f6' },
  { label: 'Tasks Today', value: 0, prefix: '', suffix: '', color: '#eab308', dynamic: true },
  { label: 'Client Satisfaction', value: 98, prefix: '', suffix: '%', color: '#8b5cf6' },
];

/**
 * Create a dashboard screen mesh to add to a scene group.
 * @param {number} x - World X position
 * @param {number} y - World Y position
 * @param {number} z - World Z position
 * @param {number} rotY - Y rotation (0 = facing +Z)
 * @param {number} scale - Screen scale multiplier
 * @returns {{ mesh: THREE.Mesh, update: (time: number) => void }}
 */
export function createCompanyDashboard(x, y, z, rotY = 0, scale = 1) {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 320;
  const ctx = canvas.getContext('2d');

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;

  const screenMat = new THREE.MeshStandardMaterial({
    map: texture,
    emissive: new THREE.Color(0x111122),
    emissiveIntensity: 1.5,
    toneMapped: false,
  });

  const screenMesh = new THREE.Mesh(
    new THREE.PlaneGeometry(2.0 * scale, 1.25 * scale),
    screenMat
  );
  screenMesh.position.set(x, y, z);
  screenMesh.rotation.y = rotY;

  // Bezel
  const bezelMat = new THREE.MeshStandardMaterial({
    color: 0x111118, metalness: 0.5, roughness: 0.3,
  });
  const bezel = new THREE.Mesh(
    new THREE.BoxGeometry(2.1 * scale, 1.35 * scale, 0.04),
    bezelMat
  );
  bezel.position.set(x, y, z);
  bezel.rotation.y = rotY;
  // Offset bezel slightly behind screen
  const bOff = 0.025;
  bezel.position.x -= Math.sin(rotY) * bOff;
  bezel.position.z -= Math.cos(rotY) * bOff;

  // Screen glow
  const glow = new THREE.PointLight(0x3b82f6, 3, 5);
  glow.position.set(x, y, z);
  // Offset forward
  glow.position.x += Math.sin(rotY) * 0.5;
  glow.position.z += Math.cos(rotY) * 0.5;

  let lastUpdate = 0;
  let tasksValue = 12 + Math.floor(Math.random() * 20);
  let animatedValues = METRICS.map(m => m.dynamic ? tasksValue : m.value);

  function drawDashboard() {
    ctx.fillStyle = '#080810';
    ctx.fillRect(0, 0, 512, 320);

    // Header
    const hGrad = ctx.createLinearGradient(100, 0, 412, 0);
    hGrad.addColorStop(0, '#3b82f6');
    hGrad.addColorStop(1, '#06b6d4');
    ctx.fillStyle = hGrad;
    ctx.font = 'bold 22px "Segoe UI", system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('CONDUIT AI — LIVE', 256, 35);

    // Divider
    ctx.strokeStyle = 'rgba(59,130,246,0.3)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(40, 50);
    ctx.lineTo(472, 50);
    ctx.stroke();

    // Metrics grid (2x2)
    const positions = [
      { x: 128, y: 110 },
      { x: 384, y: 110 },
      { x: 128, y: 220 },
      { x: 384, y: 220 },
    ];

    for (let i = 0; i < METRICS.length; i++) {
      const m = METRICS[i];
      const p = positions[i];
      const val = animatedValues[i];

      // Value
      ctx.fillStyle = m.color;
      ctx.font = 'bold 42px "Segoe UI", system-ui, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(`${m.prefix}${Math.round(val)}${m.suffix}`, p.x, p.y);

      // Label
      ctx.fillStyle = '#64748b';
      ctx.font = '14px "Segoe UI", system-ui, sans-serif';
      ctx.fillText(m.label, p.x, p.y + 25);
    }

    // Timestamp
    const now = new Date();
    const timeStr = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
    ctx.fillStyle = '#475569';
    ctx.font = '12px monospace';
    ctx.textAlign = 'right';
    ctx.fillText(`Updated ${timeStr}`, 490, 305);

    texture.needsUpdate = true;
  }

  function update(time) {
    if (time - lastUpdate < 5) return; // Update every 5s
    lastUpdate = time;

    // Bump tasks occasionally
    if (Math.random() > 0.6) {
      tasksValue = Math.min(47, tasksValue + Math.floor(Math.random() * 3));
    }
    animatedValues[2] = tasksValue;

    drawDashboard();
  }

  // Initial draw
  drawDashboard();

  return { mesh: screenMesh, bezel, glow, update };
}
