import * as THREE from 'three/webgpu';

/**
 * Monitoring floor extras: server racks with blinking LED dots.
 */
export function monitoringExtras(group, floorY, ceilH, hw, hd) {
  const rackMat = new THREE.MeshStandardMaterial({ color: 0x111118, roughness: 0.4, metalness: 0.3 });
  const rackPositions = [
    { x: -7, z: 2 },
    { x: -4.5, z: 2 },
    { x: -2, z: 2 },
    { x: 2, z: 2 },
    { x: 4.5, z: 2 },
    { x: 7, z: 2 },
  ];
  const blinkDots = [];

  for (const rp of rackPositions) {
    // Taller server racks (3.0 height instead of 2.0)
    const rack = new THREE.Mesh(new THREE.BoxGeometry(0.7, 3.2, 0.5), rackMat);
    rack.position.set(rp.x, floorY + 1.6, rp.z);
    rack.castShadow = true;
    group.add(rack);
    // Rack top panel
    const rackTop = new THREE.Mesh(new THREE.BoxGeometry(0.72, 0.03, 0.52),
      new THREE.MeshStandardMaterial({ color: 0x1a1a22, roughness: 0.3, metalness: 0.5 }));
    rackTop.position.set(rp.x, floorY + 3.22, rp.z);
    group.add(rackTop);

    // More LEDs per rack (6-8 blinking LEDs as small spheres with emissive)
    const ledCount = 6 + Math.floor(Math.random() * 3);
    for (let li = 0; li < ledCount; li++) {
      const ledColors = [0x10b981, 0x3b82f6, 0xeab308, 0xef4444, 0x06b6d4];
      const ledColor = ledColors[Math.floor(Math.random() * ledColors.length)];
      const ledMat = new THREE.MeshBasicMaterial({ color: ledColor, transparent: true });
      // Small spheres instead of boxes for LED look
      const led = new THREE.Mesh(new THREE.SphereGeometry(0.02, 6, 4), ledMat);
      const ly = floorY + 0.3 + li * 0.4;
      led.position.set(rp.x + 0.2 - Math.random() * 0.4, ly, rp.z - 0.27);
      group.add(led);
      blinkDots.push({ mesh: led, phase: Math.random() * Math.PI * 2, speed: 1.5 + Math.random() * 3 });
    }
  }

  // ===== LARGE WALL OF SCREENS (3x2 grid = 6 screens) on back wall =====
  const screenLabels = ['NETWORK', 'CPU LOAD', 'MEMORY', 'API CALLS', 'LATENCY', 'ERRORS'];
  const screenColors = ['#ef4444', '#10b981', '#3b82f6', '#eab308', '#06b6d4', '#ec4899'];
  for (let row = 0; row < 2; row++) {
    for (let col = 0; col < 3; col++) {
      const idx = row * 3 + col;
      const monCanvas = document.createElement('canvas');
      monCanvas.width = 256;
      monCanvas.height = 160;
      const mctx = monCanvas.getContext('2d');
      mctx.fillStyle = '#060a10';
      mctx.fillRect(0, 0, 256, 160);
      // Border
      mctx.strokeStyle = screenColors[idx];
      mctx.lineWidth = 2;
      mctx.strokeRect(2, 2, 252, 156);
      // Label
      mctx.fillStyle = screenColors[idx];
      mctx.font = 'bold 14px monospace';
      mctx.fillText(screenLabels[idx], 8, 20);
      // Fake graph
      mctx.strokeStyle = screenColors[idx];
      mctx.lineWidth = 2;
      mctx.beginPath();
      mctx.moveTo(8, 100);
      for (let x = 15; x < 248; x += 6) {
        mctx.lineTo(x, 50 + Math.random() * 70);
      }
      mctx.stroke();
      // Value
      mctx.fillStyle = '#e2e8f0';
      mctx.font = 'bold 22px monospace';
      mctx.fillText(Math.floor(Math.random() * 100) + '%', 8, 145);

      const monTex = new THREE.CanvasTexture(monCanvas);
      monTex.colorSpace = THREE.SRGBColorSpace;

      const bezelMat = new THREE.MeshStandardMaterial({ color: 0x111118, roughness: 0.3, metalness: 0.4 });
      const bezel = new THREE.Mesh(new THREE.BoxGeometry(2.4, 1.5, 0.05), bezelMat);
      // Offset screens to avoid elevator door at center of back wall
      const screenX = col < 2 ? -7 + col * 2.8 : 4 + (col - 2) * 2.8;
      bezel.position.set(screenX, floorY + 1.6 + row * 1.6, -hd + 0.2);
      // Faces into room from back wall
      group.add(bezel);

      const screen = new THREE.Mesh(
        new THREE.PlaneGeometry(2.2, 1.3),
        new THREE.MeshBasicMaterial({ map: monTex })
      );
      screen.position.set(screenX, floorY + 1.6 + row * 1.6, -hd + 0.21);
      // Faces into room from back wall
      group.add(screen);
    }
  }

  // Red ambient glow for monitoring vibe
  const redGlow = new THREE.PointLight(0xef4444, 10, 14, 2);
  redGlow.position.set(0, floorY + 2, -hd + 1);
  group.add(redGlow);
  // Extra red from screen wall
  const screenGlow = new THREE.PointLight(0xef4444, 6, 10, 2);
  screenGlow.position.set(0, floorY + 2.5, -hd + 2);
  group.add(screenGlow);

  // Status light beacon on ceiling (green = all systems go)
  const beaconMat = new THREE.MeshBasicMaterial({ color: 0x10b981 });
  const beacon = new THREE.Mesh(new THREE.SphereGeometry(0.1, 10, 8), beaconMat);
  beacon.position.set(0, floorY + ceilH - 0.15, 0);
  group.add(beacon);
  const beaconGlow = new THREE.PointLight(0x10b981, 6, 6, 2);
  beaconGlow.position.set(0, floorY + ceilH - 0.2, 0);
  group.add(beaconGlow);

  // ===== INCIDENT LOG display on left wall =====
  const incCanvas = document.createElement('canvas');
  incCanvas.width = 384;
  incCanvas.height = 256;
  const iCtx = incCanvas.getContext('2d');
  iCtx.fillStyle = '#0a0e14';
  iCtx.fillRect(0, 0, 384, 256);
  iCtx.strokeStyle = '#ef4444';
  iCtx.lineWidth = 2;
  iCtx.strokeRect(3, 3, 378, 250);
  iCtx.fillStyle = '#ef4444';
  iCtx.font = 'bold 16px monospace';
  iCtx.textAlign = 'center';
  iCtx.fillText('INCIDENT LOG', 192, 24);
  // Log entries
  const incidents = [
    ['03:14', 'INFO', 'All services healthy', '#10b981'],
    ['02:58', 'WARN', 'API latency spike (420ms)', '#eab308'],
    ['02:41', 'INFO', 'Auto-scaled to 3 replicas', '#3b82f6'],
    ['02:22', 'INFO', 'SSL cert renewed', '#10b981'],
    ['01:55', 'WARN', 'DB connection pool 80%', '#eab308'],
    ['01:30', 'INFO', 'Deployment v2.4.1 complete', '#10b981'],
  ];
  incidents.forEach(([time, level, msg, color], i) => {
    const y = 48 + i * 32;
    iCtx.fillStyle = '#475569';
    iCtx.font = '11px monospace';
    iCtx.textAlign = 'left';
    iCtx.fillText(time, 10, y);
    iCtx.fillStyle = color;
    iCtx.font = 'bold 11px monospace';
    iCtx.fillText(level, 60, y);
    iCtx.fillStyle = '#94a3b8';
    iCtx.font = '11px monospace';
    iCtx.fillText(msg, 110, y);
  });
  const incTex = new THREE.CanvasTexture(incCanvas);
  incTex.colorSpace = THREE.SRGBColorSpace;
  const incDisplay = new THREE.Mesh(
    new THREE.PlaneGeometry(2.5, 1.6),
    new THREE.MeshBasicMaterial({ map: incTex })
  );
  incDisplay.rotation.y = Math.PI / 2;
  incDisplay.position.set(-hw + 0.2, floorY + 2.2, 0);
  group.add(incDisplay);

  // ===== UPTIME DASHBOARD (right wall) =====
  const uptimeCanvas = document.createElement('canvas');
  uptimeCanvas.width = 384;
  uptimeCanvas.height = 256;
  const upCtx = uptimeCanvas.getContext('2d');
  upCtx.fillStyle = '#0a0408';
  upCtx.fillRect(0, 0, 384, 256);
  upCtx.strokeStyle = '#ef4444';
  upCtx.lineWidth = 2;
  upCtx.strokeRect(3, 3, 378, 250);
  upCtx.fillStyle = '#ef4444';
  upCtx.font = 'bold 14px monospace';
  upCtx.textAlign = 'center';
  upCtx.fillText('30-DAY UPTIME', 192, 22);
  // Service uptime bars
  const services = [
    { name: 'API Server', uptime: '99.98%', pct: 0.9998 },
    { name: 'Task Pipeline', uptime: '99.95%', pct: 0.9995 },
    { name: 'Database', uptime: '99.99%', pct: 0.9999 },
    { name: 'Notification Gateway', uptime: '99.92%', pct: 0.9992 },
    { name: 'Webhook Server', uptime: '99.97%', pct: 0.9997 },
    { name: 'Edge Functions', uptime: '99.94%', pct: 0.9994 },
  ];
  services.forEach((svc, i) => {
    const sy = 38 + i * 34;
    upCtx.fillStyle = '#94a3b8';
    upCtx.font = '10px monospace';
    upCtx.textAlign = 'left';
    upCtx.fillText(svc.name, 10, sy + 10);
    // Uptime bar (30 days, each day a small block)
    for (let d = 0; d < 30; d++) {
      const isUp = Math.random() < svc.pct;
      upCtx.fillStyle = isUp ? '#10b981' : '#ef4444';
      upCtx.fillRect(120 + d * 7, sy, 5, 14);
    }
    // Percentage
    upCtx.fillStyle = svc.pct >= 0.999 ? '#10b981' : '#eab308';
    upCtx.font = 'bold 10px monospace';
    upCtx.textAlign = 'right';
    upCtx.fillText(svc.uptime, 372, sy + 10);
  });
  // Overall
  upCtx.fillStyle = '#10b981';
  upCtx.font = 'bold 14px monospace';
  upCtx.textAlign = 'center';
  upCtx.fillText('OVERALL: 99.96% ✓', 192, 245);

  const uptimeTex = new THREE.CanvasTexture(uptimeCanvas);
  uptimeTex.colorSpace = THREE.SRGBColorSpace;
  const uptimeDisplay = new THREE.Mesh(
    new THREE.PlaneGeometry(2.2, 1.5),
    new THREE.MeshBasicMaterial({ map: uptimeTex })
  );
  uptimeDisplay.rotation.y = Math.PI / 2;
  uptimeDisplay.position.set(-hw + 0.2, floorY + 2.2, -3);
  group.add(uptimeDisplay);

  // "NOC" sign on back wall
  const nocCanvas = document.createElement('canvas');
  nocCanvas.width = 256;
  nocCanvas.height = 64;
  const nocCtx = nocCanvas.getContext('2d');
  nocCtx.fillStyle = '#0a0e14';
  nocCtx.fillRect(0, 0, 256, 64);
  nocCtx.fillStyle = '#ef4444';
  nocCtx.font = 'bold 36px monospace';
  nocCtx.textAlign = 'center';
  nocCtx.textBaseline = 'middle';
  nocCtx.fillText('N O C', 128, 32);
  const nocTex = new THREE.CanvasTexture(nocCanvas);
  nocTex.colorSpace = THREE.SRGBColorSpace;
  const nocSign = new THREE.Mesh(
    new THREE.PlaneGeometry(2, 0.5),
    new THREE.MeshBasicMaterial({ map: nocTex, side: THREE.DoubleSide })
  );
  // Position above server racks (racks are at z=2, spanning x=-7 to x=7)
  nocSign.position.set(0, floorY + 3.4, 2);
  group.add(nocSign);

  group.userData.blinkDots = blinkDots;

  // === 3x2 Monitor wall (back wall, highly visible from entrance) ===
  const monWallMat = new THREE.MeshStandardMaterial({ color: 0x0a0a10, roughness: 0.2, metalness: 0.4 });
  const monWallBack = new THREE.Mesh(new THREE.BoxGeometry(6, 3, 0.12), monWallMat);
  monWallBack.position.set(-3, floorY + 2.2, -hd + 0.2);
  group.add(monWallBack);
  const monColors = [0xef4444, 0x3b82f6, 0x10b981, 0xeab308, 0x8b5cf6, 0x06b6d4];
  for (let r = 0; r < 2; r++) {
    for (let c = 0; c < 3; c++) {
      const mc = monColors[r * 3 + c];
      // Monitor bezel
      const bezel = new THREE.Mesh(
        new THREE.BoxGeometry(1.7, 1.1, 0.06),
        new THREE.MeshStandardMaterial({ color: 0x111118, roughness: 0.3 })
      );
      bezel.position.set(-4.8 + c * 1.85, floorY + 1.35 + r * 1.3, -hd + 0.32);
      group.add(bezel);
      // Screen glow
      const screen = new THREE.Mesh(
        new THREE.PlaneGeometry(1.5, 0.9),
        new THREE.MeshBasicMaterial({ color: mc, transparent: true, opacity: 0.6 })
      );
      screen.position.set(-4.8 + c * 1.85, floorY + 1.35 + r * 1.3, -hd + 0.36);
      group.add(screen);
    }
  }
}

/**
 * Marketing floor extras: green accent, presentation board, standing whiteboard
 */
export function marketingExtras(group, floorY, ceilH, hw, hd) {
  // Green accent wall panel on left wall
  const panelMat = new THREE.MeshStandardMaterial({
    color: 0x10b981, roughness: 0.4, metalness: 0.1,
    emissive: 0x10b981, emissiveIntensity: 0.05,
  });
  const panel = new THREE.Mesh(new THREE.BoxGeometry(0.05, 2.0, 4.0), panelMat);
  panel.position.set(-hw + 0.05, floorY + 2.0, -2);
  group.add(panel);

  // Presentation board on back wall
  const boardCanvas = document.createElement('canvas');
  boardCanvas.width = 512;
  boardCanvas.height = 256;
  const ctx = boardCanvas.getContext('2d');
  ctx.fillStyle = '#f8f8f8';
  ctx.fillRect(0, 0, 512, 256);
  ctx.fillStyle = '#10b981';
  ctx.font = 'bold 28px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('Q2 CAMPAIGN PLAN', 256, 40);
  ctx.fillStyle = '#334155';
  ctx.font = '18px sans-serif';
  ctx.textAlign = 'left';
  ctx.fillText('- Social media blitz (May 1-15)', 40, 80);
  ctx.fillText('- Email sequences: 3 funnels', 40, 110);
  ctx.fillText('- Landing page A/B tests', 40, 140);
  ctx.fillText('- Influencer partnerships x5', 40, 170);
  ctx.fillStyle = '#10b981';
  ctx.fillRect(40, 200, 80, 30);
  ctx.fillRect(140, 190, 80, 40);
  ctx.fillRect(240, 195, 80, 35);
  ctx.fillRect(340, 180, 80, 50);

  const boardTex = new THREE.CanvasTexture(boardCanvas);
  boardTex.colorSpace = THREE.SRGBColorSpace;
  const board = new THREE.Mesh(
    new THREE.PlaneGeometry(3.5, 1.8),
    new THREE.MeshBasicMaterial({ map: boardTex })
  );
  board.position.set(4, floorY + 2.2, -hd + 0.2);
  group.add(board);

  // Board frame
  const frameMat = new THREE.MeshStandardMaterial({ color: 0x222233, roughness: 0.3 });
  group.add(_makeBox(3.6, 0.06, 0.04, 4, floorY + 3.12, -hd + 0.06, frameMat));
  group.add(_makeBox(3.6, 0.06, 0.04, 4, floorY + 1.28, -hd + 0.06, frameMat));

  // Standing whiteboard (on wheels)
  const wbMat = new THREE.MeshStandardMaterial({ color: 0xf5f5f5, roughness: 0.3 });
  const wb = new THREE.Mesh(new THREE.BoxGeometry(2.0, 1.4, 0.04), wbMat);
  wb.position.set(-5, floorY + 1.8, 5);
  wb.rotation.y = 0.3;
  group.add(wb);
  // Whiteboard frame
  group.add(_makeBox(2.1, 0.06, 0.06, -5, floorY + 2.52, 5, frameMat));
  group.add(_makeBox(2.1, 0.06, 0.06, -5, floorY + 1.08, 5, frameMat));
  // Whiteboard stand legs
  const standMat = new THREE.MeshStandardMaterial({ color: 0x444455, roughness: 0.3, metalness: 0.5 });
  group.add(_makeBox(0.04, 1.6, 0.04, -5.8, floorY + 0.8, 5, standMat));
  group.add(_makeBox(0.04, 1.6, 0.04, -4.2, floorY + 0.8, 5, standMat));

  // Marker tray
  const trayMat = new THREE.MeshStandardMaterial({ color: 0x333344, roughness: 0.4 });
  const tray = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.03, 0.08), trayMat);
  tray.position.set(-5, floorY + 1.15, 5.04);
  tray.rotation.y = 0.3;
  group.add(tray);

  // Social media metrics on right wall
  const smCanvas = document.createElement('canvas');
  smCanvas.width = 384;
  smCanvas.height = 256;
  const smCtx = smCanvas.getContext('2d');
  smCtx.fillStyle = '#060a10';
  smCtx.fillRect(0, 0, 384, 256);
  smCtx.strokeStyle = '#10b981';
  smCtx.lineWidth = 2;
  smCtx.strokeRect(4, 4, 376, 248);
  smCtx.fillStyle = '#10b981';
  smCtx.font = 'bold 16px monospace';
  smCtx.textAlign = 'center';
  smCtx.fillText('SOCIAL MEDIA DASHBOARD', 192, 28);
  // Platform stats
  const platforms = [
    ['Instagram', '12.4K followers', '+340 this week', '#ec4899'],
    ['LinkedIn', '8.2K connections', '+120 this week', '#3b82f6'],
    ['Twitter/X', '5.1K followers', '+89 this week', '#94a3b8'],
    ['YouTube', '2.8K subs', '+56 this week', '#ef4444'],
    ['TikTok', '18.9K followers', '+1.2K this week', '#06b6d4'],
  ];
  platforms.forEach(([platform, count, growth, color], i) => {
    const y = 52 + i * 38;
    smCtx.fillStyle = 'rgba(30,30,48,0.4)';
    smCtx.fillRect(12, y, 360, 30);
    smCtx.fillStyle = color;
    smCtx.beginPath();
    smCtx.arc(28, y + 15, 6, 0, Math.PI * 2);
    smCtx.fill();
    smCtx.fillStyle = '#e2e8f0';
    smCtx.font = '12px sans-serif';
    smCtx.textAlign = 'left';
    smCtx.fillText(platform, 42, y + 14);
    smCtx.fillStyle = '#94a3b8';
    smCtx.font = '11px monospace';
    smCtx.fillText(count, 150, y + 14);
    smCtx.fillStyle = '#10b981';
    smCtx.font = '10px monospace';
    smCtx.textAlign = 'right';
    smCtx.fillText(growth, 365, y + 24);
  });
  const smTex = new THREE.CanvasTexture(smCanvas);
  smTex.colorSpace = THREE.SRGBColorSpace;
  const smDisplay = new THREE.Mesh(
    new THREE.PlaneGeometry(2.2, 1.5),
    new THREE.MeshBasicMaterial({ map: smTex })
  );
  smDisplay.rotation.y = -Math.PI / 2;
  smDisplay.position.set(hw - 0.2, floorY + 2.2, 2);
  group.add(smDisplay);

  // Ceiling-mounted projector
  const projMat = new THREE.MeshStandardMaterial({ color: 0x222233, roughness: 0.3, metalness: 0.3 });
  const projBody = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.12, 0.25), projMat);
  projBody.position.set(4, floorY + ceilH - 0.3, -hd + 2);
  group.add(projBody);
  // Projector mount
  const projMount = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.2, 6), projMat);
  projMount.position.set(4, floorY + ceilH - 0.1, -hd + 2);
  group.add(projMount);
  // Projector lens (glowing)
  const projLens = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 0.02, 8),
    new THREE.MeshBasicMaterial({ color: 0x10b981 }));
  projLens.rotation.x = Math.PI / 2;
  projLens.position.set(4, floorY + ceilH - 0.34, -hd + 1.87);
  group.add(projLens);

  // ===== CUSTOMER JOURNEY MAP (large whiteboard on front wall, right side) =====
  const cjCanvas = document.createElement('canvas');
  cjCanvas.width = 512;
  cjCanvas.height = 256;
  const cjCtx = cjCanvas.getContext('2d');
  cjCtx.fillStyle = '#f8f8f8';
  cjCtx.fillRect(0, 0, 512, 256);
  cjCtx.fillStyle = '#10b981';
  cjCtx.font = 'bold 18px sans-serif';
  cjCtx.textAlign = 'center';
  cjCtx.fillText('CUSTOMER JOURNEY MAP', 256, 24);
  // Journey stages
  const stages = [
    { label: 'AWARENESS', color: '#3b82f6', items: ['Google Ads', 'Social Media', 'Referrals'] },
    { label: 'INTEREST', color: '#06b6d4', items: ['Landing Page', 'Blog Posts', 'Case Studies'] },
    { label: 'DECISION', color: '#10b981', items: ['Demo Call', 'Free Trial', 'ROI Calc'] },
    { label: 'ACTION', color: '#eab308', items: ['Sign Up', 'Onboard', 'Go Live'] },
    { label: 'RETAIN', color: '#ec4899', items: ['Support', 'Upsell', 'Referral'] },
  ];
  stages.forEach((s, i) => {
    const sx = 15 + i * 98;
    // Arrow shape
    cjCtx.fillStyle = s.color;
    cjCtx.globalAlpha = 0.15;
    cjCtx.fillRect(sx, 38, 90, 200);
    cjCtx.globalAlpha = 1.0;
    // Stage header
    cjCtx.fillStyle = s.color;
    cjCtx.font = 'bold 10px sans-serif';
    cjCtx.textAlign = 'center';
    cjCtx.fillText(s.label, sx + 45, 55);
    // Line
    cjCtx.fillRect(sx + 10, 60, 70, 1);
    // Items
    cjCtx.fillStyle = '#334155';
    cjCtx.font = '9px sans-serif';
    s.items.forEach((item, j) => {
      cjCtx.fillText(item, sx + 45, 78 + j * 20);
    });
    // Arrow connector
    if (i < stages.length - 1) {
      cjCtx.fillStyle = '#94a3b8';
      cjCtx.font = 'bold 14px sans-serif';
      cjCtx.fillText('→', sx + 92, 70);
    }
  });
  // Conversion funnel at bottom
  cjCtx.fillStyle = '#10b981';
  cjCtx.font = 'bold 10px sans-serif';
  cjCtx.textAlign = 'left';
  cjCtx.fillText('Conv: 2.4K → 340 → 89 → 12 → 11 retained', 30, 245);

  const cjTex = new THREE.CanvasTexture(cjCanvas);
  cjTex.colorSpace = THREE.SRGBColorSpace;
  const cjBoard = new THREE.Mesh(
    new THREE.PlaneGeometry(3.5, 1.8),
    new THREE.MeshBasicMaterial({ map: cjTex })
  );
  cjBoard.rotation.y = Math.PI;
  cjBoard.position.set(4, floorY + 2.2, hd - 0.2);
  group.add(cjBoard);

  // Warm accent spotlights on the whiteboard and presentation board
  const wbSpot = new THREE.SpotLight(0x10b981, 8, 6, 0.5, 0.6);
  wbSpot.position.set(-5, floorY + ceilH - 0.5, 5);
  wbSpot.target.position.set(-5, floorY + 1.8, 5);
  group.add(wbSpot);
  group.add(wbSpot.target);

  // === Large sticky-note wall (colorful, highly visible from entrance) ===
  const stickyWallMat = new THREE.MeshStandardMaterial({ color: 0x222233, roughness: 0.6 });
  const stickyWall = new THREE.Mesh(new THREE.BoxGeometry(4, 2.5, 0.06), stickyWallMat);
  stickyWall.position.set(-4, floorY + 2.2, -hd + 0.15);
  group.add(stickyWall);
  const stickyColors = [0xfef3c7, 0xdbeafe, 0xd1fae5, 0xfce7f3, 0xfef9c3, 0xe0e7ff, 0xfed7aa];
  for (let r = 0; r < 4; r++) {
    for (let c = 0; c < 6; c++) {
      const sc = stickyColors[(r * 6 + c) % stickyColors.length];
      const sm = new THREE.MeshBasicMaterial({ color: sc });
      const s = new THREE.Mesh(new THREE.PlaneGeometry(0.5, 0.45), sm);
      s.position.set(-5.4 + c * 0.58, floorY + 1.3 + r * 0.55, -hd + 0.2);
      group.add(s);
    }
  }
}

/**
 * Engineering floor extras: orange accent, server towers, extra monitors, cable management
 */
export function engineeringExtras(group, floorY, ceilH, hw, hd) {
  const serverMat = new THREE.MeshStandardMaterial({ color: 0x111118, roughness: 0.4, metalness: 0.3 });
  const ledMat = new THREE.MeshBasicMaterial({ color: 0xf97316 });

  // Server towers near desks
  const towerPositions = [
    { x: -7.5, z: -3 }, { x: 7.5, z: -3 },
    { x: -7.5, z: 3 }, { x: 7.5, z: 3 },
  ];
  for (const tp of towerPositions) {
    const tower = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.8, 0.3), serverMat);
    tower.position.set(tp.x, floorY + 0.4, tp.z);
    group.add(tower);

    const led = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.04, 0.02), ledMat);
    led.position.set(tp.x, floorY + 0.7, tp.z - 0.17);
    group.add(led);
  }

  // Extra small monitors near existing desk monitors
  const extraMonPositions = [
    { x: -6.6, z: -3.3 }, { x: -5.4, z: -3.3 },
    { x: 0.6, z: -3.3 }, { x: -0.6, z: -3.3 },
    { x: 6.6, z: -3.3 }, { x: 5.4, z: -3.3 },
  ];
  const monMat = new THREE.MeshStandardMaterial({ color: 0x111122, roughness: 0.15, metalness: 0.5 });
  for (const mp of extraMonPositions) {
    const mon = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.35, 0.04), monMat);
    mon.position.set(mp.x, floorY + 1.0, mp.z);
    group.add(mon);
  }

  // Whiteboard with "SPRINT BOARD" on front wall
  const sprintCanvas = document.createElement('canvas');
  sprintCanvas.width = 512;
  sprintCanvas.height = 256;
  const sctx = sprintCanvas.getContext('2d');
  sctx.fillStyle = '#f8f8f0';
  sctx.fillRect(0, 0, 512, 256);
  sctx.fillStyle = '#f97316';
  sctx.font = 'bold 24px sans-serif';
  sctx.textAlign = 'center';
  sctx.fillText('SPRINT BOARD — Week 13', 256, 30);
  // Columns
  const colLabels = ['TO DO', 'IN PROGRESS', 'DONE'];
  const colColors = ['#ef4444', '#eab308', '#10b981'];
  for (let c = 0; c < 3; c++) {
    const cx = 30 + c * 170;
    sctx.fillStyle = colColors[c];
    sctx.font = 'bold 14px sans-serif';
    sctx.textAlign = 'left';
    sctx.fillText(colLabels[c], cx, 60);
    sctx.strokeStyle = '#ddd';
    sctx.lineWidth = 1;
    sctx.beginPath();
    sctx.moveTo(cx - 5, 66);
    sctx.lineTo(cx + 145, 66);
    sctx.stroke();
    // Sticky notes
    const noteCount = 2 + Math.floor(Math.random() * 3);
    for (let n = 0; n < noteCount; n++) {
      const noteColors = ['#fef3c7', '#dbeafe', '#d1fae5', '#fce7f3'];
      sctx.fillStyle = noteColors[Math.floor(Math.random() * noteColors.length)];
      sctx.fillRect(cx, 75 + n * 42, 130, 35);
      sctx.fillStyle = '#334155';
      sctx.font = '11px sans-serif';
      sctx.fillText(['Fix API timeout', 'Deploy v2.4', 'Refactor auth', 'Add webhooks', 'DB migration'][Math.floor(Math.random() * 5)], cx + 5, 95 + n * 42);
    }
  }
  const sprintTex = new THREE.CanvasTexture(sprintCanvas);
  sprintTex.colorSpace = THREE.SRGBColorSpace;
  const sprintBoard = new THREE.Mesh(
    new THREE.PlaneGeometry(3.5, 1.8),
    new THREE.MeshBasicMaterial({ map: sprintTex })
  );
  sprintBoard.rotation.y = Math.PI;
  sprintBoard.position.set(-3, floorY + 2.2, hd - 0.2);
  group.add(sprintBoard);

  // Cable tray under desks (visual detail)
  const cableMat = new THREE.MeshStandardMaterial({ color: 0x222222, roughness: 0.6 });
  for (const tp of [{ x: -6, z: -3 }, { x: 0, z: -3 }, { x: 6, z: -3 }]) {
    const tray = new THREE.Mesh(new THREE.BoxGeometry(1.8, 0.04, 0.3), cableMat);
    tray.position.set(tp.x, floorY + 0.05, tp.z);
    group.add(tray);
  }

  // ===== SYSTEM ARCHITECTURE DIAGRAM on left wall =====
  const archCanvas = document.createElement('canvas');
  archCanvas.width = 512;
  archCanvas.height = 384;
  const aCtx = archCanvas.getContext('2d');
  aCtx.fillStyle = '#0e1018';
  aCtx.fillRect(0, 0, 512, 384);
  aCtx.strokeStyle = '#f97316';
  aCtx.lineWidth = 2;
  aCtx.strokeRect(3, 3, 506, 378);
  aCtx.fillStyle = '#f97316';
  aCtx.font = 'bold 18px monospace';
  aCtx.textAlign = 'center';
  aCtx.fillText('SYSTEM ARCHITECTURE', 256, 28);

  // Draw architecture boxes
  const archBoxes = [
    { x: 195, y: 45, w: 120, h: 35, label: 'Client App', color: '#3b82f6' },
    { x: 50, y: 110, w: 100, h: 35, label: 'Task Engine', color: '#06b6d4' },
    { x: 200, y: 110, w: 110, h: 35, label: 'API Gateway', color: '#f97316' },
    { x: 370, y: 110, w: 90, h: 35, label: 'Webhooks', color: '#eab308' },
    { x: 50, y: 190, w: 100, h: 35, label: 'Railway API', color: '#10b981' },
    { x: 200, y: 190, w: 110, h: 35, label: 'Edge Functions', color: '#8b5cf6' },
    { x: 370, y: 190, w: 90, h: 35, label: 'Workers', color: '#ec4899' },
    { x: 120, y: 270, w: 110, h: 35, label: 'Supabase DB', color: '#22c55e' },
    { x: 280, y: 270, w: 110, h: 35, label: 'Redis Cache', color: '#ef4444' },
    { x: 180, y: 340, w: 150, h: 30, label: 'Monitoring / Logs', color: '#94a3b8' },
  ];
  archBoxes.forEach(b => {
    aCtx.fillStyle = b.color;
    aCtx.globalAlpha = 0.15;
    aCtx.fillRect(b.x, b.y, b.w, b.h);
    aCtx.globalAlpha = 1.0;
    aCtx.strokeStyle = b.color;
    aCtx.lineWidth = 1.5;
    aCtx.strokeRect(b.x, b.y, b.w, b.h);
    aCtx.fillStyle = b.color;
    aCtx.font = '11px monospace';
    aCtx.textAlign = 'center';
    aCtx.fillText(b.label, b.x + b.w / 2, b.y + b.h / 2 + 4);
  });

  // Connection arrows
  aCtx.strokeStyle = '#475569';
  aCtx.lineWidth = 1;
  aCtx.setLineDash([4, 3]);
  // Client → API Gateway
  aCtx.beginPath(); aCtx.moveTo(255, 80); aCtx.lineTo(255, 110); aCtx.stroke();
  // API Gateway → Railway, Edge, Webhooks
  aCtx.beginPath(); aCtx.moveTo(225, 145); aCtx.lineTo(100, 190); aCtx.stroke();
  aCtx.beginPath(); aCtx.moveTo(255, 145); aCtx.lineTo(255, 190); aCtx.stroke();
  aCtx.beginPath(); aCtx.moveTo(285, 145); aCtx.lineTo(400, 190); aCtx.stroke();
  // Vapi → Railway
  aCtx.beginPath(); aCtx.moveTo(100, 145); aCtx.lineTo(100, 190); aCtx.stroke();
  // Railway/Edge → DB
  aCtx.beginPath(); aCtx.moveTo(100, 225); aCtx.lineTo(175, 270); aCtx.stroke();
  aCtx.beginPath(); aCtx.moveTo(255, 225); aCtx.lineTo(255, 270); aCtx.stroke();
  // DB → Monitoring
  aCtx.beginPath(); aCtx.moveTo(175, 305); aCtx.lineTo(230, 340); aCtx.stroke();
  aCtx.beginPath(); aCtx.moveTo(335, 305); aCtx.lineTo(280, 340); aCtx.stroke();
  aCtx.setLineDash([]);

  const archTex = new THREE.CanvasTexture(archCanvas);
  archTex.colorSpace = THREE.SRGBColorSpace;
  const archDisplay = new THREE.Mesh(
    new THREE.PlaneGeometry(2.5, 1.9),
    new THREE.MeshBasicMaterial({ map: archTex })
  );
  archDisplay.rotation.y = Math.PI / 2;
  archDisplay.position.set(-hw + 0.2, floorY + 2.2, 2);
  group.add(archDisplay);

  // Standing desk / standup station (for variety)
  const standDeskMat = new THREE.MeshPhysicalMaterial({ color: 0x1a1520, roughness: 0.3, clearcoat: 0.3 });
  const standDesk = new THREE.Mesh(new THREE.BoxGeometry(1.4, 0.06, 0.8), standDeskMat);
  standDesk.position.set(7, floorY + 1.1, 0);
  group.add(standDesk);
  // Standing desk legs (telescoping)
  const sdLegMat = new THREE.MeshStandardMaterial({ color: 0x444455, metalness: 0.6, roughness: 0.2 });
  for (const [sx, sz] of [[-0.55, -0.3], [-0.55, 0.3], [0.55, -0.3], [0.55, 0.3]]) {
    const sdLeg = new THREE.Mesh(new THREE.BoxGeometry(0.06, 1.1, 0.06), sdLegMat);
    sdLeg.position.set(7 + sx, floorY + 0.55, sz);
    group.add(sdLeg);
  }
  // Monitor on standing desk
  const sdMonMat = new THREE.MeshStandardMaterial({ color: 0x111122, roughness: 0.15, metalness: 0.5 });
  const sdMon = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.4, 0.04), sdMonMat);
  sdMon.position.set(7, floorY + 1.5, -0.1);
  group.add(sdMon);
  // Screen glow
  const sdScreen = new THREE.Mesh(new THREE.PlaneGeometry(0.5, 0.3),
    new THREE.MeshBasicMaterial({ color: 0xf97316 }));
  sdScreen.position.set(7, floorY + 1.5, -0.12);
  group.add(sdScreen);

  // ===== BUILD STATUS DISPLAY on right wall =====
  const buildCanvas = document.createElement('canvas');
  buildCanvas.width = 256;
  buildCanvas.height = 384;
  const bCtx = buildCanvas.getContext('2d');
  bCtx.fillStyle = '#0a0e14';
  bCtx.fillRect(0, 0, 256, 384);
  bCtx.strokeStyle = '#f97316';
  bCtx.lineWidth = 2;
  bCtx.strokeRect(4, 4, 248, 376);
  bCtx.fillStyle = '#f97316';
  bCtx.font = 'bold 16px monospace';
  bCtx.textAlign = 'center';
  bCtx.fillText('CI/CD PIPELINE', 128, 28);
  // Build entries
  const builds = [
    ['main', 'PASSED', '#10b981', '2m 14s'],
    ['staging', 'PASSED', '#10b981', '1m 58s'],
    ['feature/auth', 'RUNNING', '#eab308', '0m 42s'],
    ['fix/api-timeout', 'PASSED', '#10b981', '3m 01s'],
    ['dev', 'FAILED', '#ef4444', '1m 12s'],
    ['hotfix/db', 'PASSED', '#10b981', '2m 33s'],
  ];
  builds.forEach(([branch, status, color, time], i) => {
    const y = 55 + i * 50;
    bCtx.fillStyle = 'rgba(30,30,48,0.5)';
    bCtx.fillRect(12, y, 232, 40);
    bCtx.fillStyle = '#94a3b8';
    bCtx.font = '11px monospace';
    bCtx.textAlign = 'left';
    bCtx.fillText(branch, 18, y + 16);
    bCtx.fillStyle = color;
    bCtx.font = 'bold 11px monospace';
    bCtx.textAlign = 'right';
    bCtx.fillText(status, 200, y + 16);
    bCtx.fillStyle = '#475569';
    bCtx.font = '10px monospace';
    bCtx.fillText(time, 240, y + 32);
    // Status dot
    bCtx.fillStyle = color;
    bCtx.beginPath();
    bCtx.arc(220, y + 14, 4, 0, Math.PI * 2);
    bCtx.fill();
  });
  const buildTex = new THREE.CanvasTexture(buildCanvas);
  buildTex.colorSpace = THREE.SRGBColorSpace;
  const buildDisplay = new THREE.Mesh(
    new THREE.PlaneGeometry(1.2, 1.8),
    new THREE.MeshBasicMaterial({ map: buildTex })
  );
  buildDisplay.rotation.y = -Math.PI / 2;
  buildDisplay.position.set(hw - 0.2, floorY + 2.2, -3);
  group.add(buildDisplay);

  // === Large server rack cluster (left side, highly visible) ===
  const bigRackMat = new THREE.MeshStandardMaterial({ color: 0x0a0a12, roughness: 0.35, metalness: 0.4 });
  for (let i = 0; i < 3; i++) {
    const rack = new THREE.Mesh(new THREE.BoxGeometry(0.8, 3.0, 0.6), bigRackMat);
    rack.position.set(-hw + 1.5 + i * 1.2, floorY + 1.5, -hd + 1.5);
    group.add(rack);
    // Blinking LEDs on front face
    for (let j = 0; j < 8; j++) {
      const lc = [0xf97316, 0x10b981, 0x3b82f6][j % 3];
      const led = new THREE.Mesh(
        new THREE.BoxGeometry(0.04, 0.04, 0.02),
        new THREE.MeshBasicMaterial({ color: lc })
      );
      led.position.set(-hw + 1.5 + i * 1.2 + (j % 2 === 0 ? 0.15 : -0.15), floorY + 0.4 + j * 0.35, -hd + 1.18);
      group.add(led);
    }
  }
}

/**
 * Content floor extras: pink accent, camera tripod, ring light, extra ceiling lights
 */
export function contentExtras(group, floorY, ceilH, hw, hd) {
  // Camera tripod prop
  const tripodMat = new THREE.MeshStandardMaterial({ color: 0x222222, roughness: 0.5 });
  const pole = new THREE.Mesh(new THREE.BoxGeometry(0.05, 1.5, 0.05), tripodMat);
  pole.position.set(hw - 2, floorY + 0.75, 3);
  group.add(pole);
  const camMat = new THREE.MeshStandardMaterial({ color: 0x1a1a1a, roughness: 0.3, metalness: 0.2 });
  const cam = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.2, 0.15), camMat);
  cam.position.set(hw - 2, floorY + 1.6, 3);
  group.add(cam);
  const lensMat = new THREE.MeshBasicMaterial({ color: 0xec4899 });
  const lens = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.06, 0.02), lensMat);
  lens.position.set(hw - 2, floorY + 1.6, 2.92);
  group.add(lens);

  // Ring light (torus next to camera)
  const ringMat = new THREE.MeshBasicMaterial({ color: 0xfff0f5 });
  const ring = new THREE.Mesh(new THREE.TorusGeometry(0.25, 0.02, 8, 16), ringMat);
  ring.position.set(hw - 2.5, floorY + 1.5, 3.5);
  ring.rotation.y = 0.3;
  group.add(ring);
  // Ring light stand
  const ringStand = new THREE.Mesh(new THREE.BoxGeometry(0.04, 1.4, 0.04), tripodMat);
  ringStand.position.set(hw - 2.5, floorY + 0.7, 3.5);
  group.add(ringStand);

  // Backdrop (green screen style, pink for branding)
  const backdropMat = new THREE.MeshStandardMaterial({ color: 0xec4899, roughness: 0.8, emissive: 0xec4899, emissiveIntensity: 0.02 });
  const backdrop = new THREE.Mesh(new THREE.PlaneGeometry(3, 2.5), backdropMat);
  backdrop.position.set(hw - 0.2, floorY + 1.8, 3);
  backdrop.rotation.y = -Math.PI / 2;
  group.add(backdrop);

  // Extra ceiling light panels
  const brightPanelMat = new THREE.MeshBasicMaterial({ color: 0xfff0f5 });
  const extraPanelGeo = new THREE.PlaneGeometry(1.5, 0.8);
  const extraPanelPositions = [[-3, -2], [3, -2], [-3, 2], [3, 2]];
  for (const [px, pz] of extraPanelPositions) {
    const panel = new THREE.Mesh(extraPanelGeo, brightPanelMat);
    panel.rotation.x = Math.PI / 2;
    panel.position.set(px, floorY + ceilH - 0.03, pz);
    group.add(panel);
  }

  const extraLight = new THREE.PointLight(0xfff0f0, 20, 15, 2);
  extraLight.position.set(0, floorY + ceilH - 0.5, 2);
  group.add(extraLight);

  // ===== PODCAST / RECORDING BOOTH (front-left corner) =====
  // Mic stand
  const micStandMat = new THREE.MeshStandardMaterial({ color: 0x333344, roughness: 0.3, metalness: 0.5 });
  const micStand = new THREE.Mesh(new THREE.CylinderGeometry(0.015, 0.02, 1.2, 6), micStandMat);
  micStand.position.set(-7, floorY + 0.6, 5);
  group.add(micStand);
  // Mic boom arm
  const micBoom = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.02, 0.02), micStandMat);
  micBoom.position.set(-6.75, floorY + 1.2, 5);
  micBoom.rotation.z = -0.2;
  group.add(micBoom);
  // Microphone
  const micMat = new THREE.MeshStandardMaterial({ color: 0x1a1a1a, roughness: 0.3, metalness: 0.4 });
  const mic = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.12, 8), micMat);
  mic.position.set(-6.5, floorY + 1.15, 5);
  group.add(mic);
  // Mic mesh (gold ring)
  const micMesh = new THREE.Mesh(new THREE.TorusGeometry(0.035, 0.005, 4, 8),
    new THREE.MeshStandardMaterial({ color: 0xc0a050, metalness: 0.8, roughness: 0.2 }));
  micMesh.position.set(-6.5, floorY + 1.22, 5);
  group.add(micMesh);
  // Sound absorption panels on nearby wall (2 panels)
  const foamMat = new THREE.MeshStandardMaterial({ color: 0x2a2030, roughness: 0.9 });
  for (let i = 0; i < 2; i++) {
    const foam = new THREE.Mesh(new THREE.BoxGeometry(0.05, 1.0, 1.0), foamMat);
    foam.position.set(-hw + 0.06, floorY + 1.5, 4 + i * 1.5);
    group.add(foam);
    // Acoustic ridges
    for (let r = 0; r < 4; r++) {
      const ridge = new THREE.Mesh(new THREE.BoxGeometry(0.03, 0.08, 0.8), foamMat);
      ridge.position.set(-hw + 0.09, floorY + 1.2 + r * 0.25, 4 + i * 1.5);
      group.add(ridge);
    }
  }
  // "ON AIR" sign
  const onAirCanvas = document.createElement('canvas');
  onAirCanvas.width = 128;
  onAirCanvas.height = 48;
  const oaCtx = onAirCanvas.getContext('2d');
  oaCtx.fillStyle = '#1a0000';
  oaCtx.fillRect(0, 0, 128, 48);
  oaCtx.fillStyle = '#ef4444';
  oaCtx.font = 'bold 24px sans-serif';
  oaCtx.textAlign = 'center';
  oaCtx.textBaseline = 'middle';
  oaCtx.fillText('ON AIR', 64, 24);
  // Glow effect
  oaCtx.shadowColor = '#ef4444';
  oaCtx.shadowBlur = 10;
  oaCtx.fillText('ON AIR', 64, 24);
  const onAirTex = new THREE.CanvasTexture(onAirCanvas);
  onAirTex.colorSpace = THREE.SRGBColorSpace;
  const onAirSign = new THREE.Mesh(
    new THREE.PlaneGeometry(0.6, 0.22),
    new THREE.MeshBasicMaterial({ map: onAirTex })
  );
  onAirSign.rotation.y = Math.PI / 2;
  onAirSign.position.set(-hw + 0.2, floorY + 2.5, 5);
  group.add(onAirSign);
  // Red ON AIR glow
  const onAirGlow = new THREE.PointLight(0xef4444, 3, 4, 2);
  onAirGlow.position.set(-hw + 0.5, floorY + 2.5, 5);
  group.add(onAirGlow);

  // Storyboard / Content Calendar on left wall
  const sbCanvas = document.createElement('canvas');
  sbCanvas.width = 512;
  sbCanvas.height = 256;
  const sbCtx = sbCanvas.getContext('2d');
  sbCtx.fillStyle = '#f8f0f8';
  sbCtx.fillRect(0, 0, 512, 256);
  sbCtx.fillStyle = '#ec4899';
  sbCtx.font = 'bold 20px sans-serif';
  sbCtx.textAlign = 'center';
  sbCtx.fillText('CONTENT CALENDAR — MARCH', 256, 28);
  // Grid of content blocks
  const contentItems = [
    ['MON', 'Blog:\nSEO tips'],
    ['TUE', 'Video:\nDemo reel'],
    ['WED', 'Social:\nCarousel'],
    ['THU', 'Email:\nNewsletter'],
    ['FRI', 'Podcast:\nEp 14'],
  ];
  contentItems.forEach(([day, desc], i) => {
    const cx = 20 + i * 96;
    sbCtx.fillStyle = '#fce7f3';
    sbCtx.fillRect(cx, 50, 85, 80);
    sbCtx.fillStyle = '#ec4899';
    sbCtx.font = 'bold 12px sans-serif';
    sbCtx.textAlign = 'left';
    sbCtx.fillText(day, cx + 5, 66);
    sbCtx.fillStyle = '#334155';
    sbCtx.font = '10px sans-serif';
    const lines = desc.split('\n');
    lines.forEach((line, li) => {
      sbCtx.fillText(line, cx + 5, 82 + li * 14);
    });
  });
  // Week 2 row
  const week2Items = ['Webinar', 'Case Study', 'Reels x3', 'Infographic', 'AMA'];
  week2Items.forEach((item, i) => {
    const cx = 20 + i * 96;
    sbCtx.fillStyle = '#dbeafe';
    sbCtx.fillRect(cx, 145, 85, 50);
    sbCtx.fillStyle = '#334155';
    sbCtx.font = '10px sans-serif';
    sbCtx.textAlign = 'left';
    sbCtx.fillText(item, cx + 5, 175);
  });
  // Progress bar
  sbCtx.fillStyle = '#ec4899';
  sbCtx.fillRect(20, 210, 300, 10);
  sbCtx.fillStyle = '#e2e8f0';
  sbCtx.fillRect(320, 210, 170, 10);
  sbCtx.fillStyle = '#64748b';
  sbCtx.font = '10px sans-serif';
  sbCtx.fillText('62% complete', 340, 240);

  const sbTex = new THREE.CanvasTexture(sbCanvas);
  sbTex.colorSpace = THREE.SRGBColorSpace;
  // Frame
  const sbFrameMat = new THREE.MeshStandardMaterial({ color: 0x222233, roughness: 0.3 });
  const sbFrame = new THREE.Mesh(new THREE.BoxGeometry(0.04, 1.5, 3.0), sbFrameMat);
  sbFrame.position.set(-hw + 0.04, floorY + 2.2, -2);
  group.add(sbFrame);
  const sbBoard = new THREE.Mesh(
    new THREE.PlaneGeometry(2.8, 1.4),
    new THREE.MeshBasicMaterial({ map: sbTex })
  );
  sbBoard.rotation.y = Math.PI / 2;
  sbBoard.position.set(-hw + 0.2, floorY + 2.2, -2);
  group.add(sbBoard);

  // === Large green screen wall (left side, highly visible) ===
  const greenScreenMat = new THREE.MeshStandardMaterial({ color: 0x1a8a40, emissive: 0x0a4a20, emissiveIntensity: 0.3 });
  const greenScreen = new THREE.Mesh(new THREE.PlaneGeometry(5, 3), greenScreenMat);
  greenScreen.position.set(-4, floorY + 1.8, -hd + 0.15);
  group.add(greenScreen);
  // "STUDIO" label above
  const studioCanvas = document.createElement('canvas');
  studioCanvas.width = 256; studioCanvas.height = 64;
  const stCtx = studioCanvas.getContext('2d');
  stCtx.fillStyle = '#1a1a2e';
  stCtx.fillRect(0, 0, 256, 64);
  stCtx.fillStyle = '#ec4899';
  stCtx.font = 'bold 32px sans-serif';
  stCtx.textAlign = 'center';
  stCtx.textBaseline = 'middle';
  stCtx.fillText('STUDIO A', 128, 32);
  const stTex = new THREE.CanvasTexture(studioCanvas);
  stTex.colorSpace = THREE.SRGBColorSpace;
  const stLabel = new THREE.Mesh(
    new THREE.PlaneGeometry(2, 0.5),
    new THREE.MeshBasicMaterial({ map: stTex })
  );
  stLabel.position.set(-4, floorY + 3.5, -hd + 0.16);
  group.add(stLabel);
}

/**
 * Intelligence floor extras: glass-walled board room with conference table and chairs, wall charts
 */
export function intelligenceExtras(group, floorY, ceilH, hw, hd) {
  // ===== GLASS-WALLED BOARD ROOM (right side of floor) =====
  const roomX = 4;   // center of board room
  const roomZ = 0;
  const roomW = 6;   // width
  const roomD = 8;   // depth
  const roomH = ceilH - 0.2;

  // Glass wall material
  const glassMat = new THREE.MeshPhysicalMaterial({
    color: 0x88ccff,
    transparent: true,
    opacity: 0.12,
    roughness: 0.05,
    metalness: 0.1,
    emissive: 0x88ccff,
    emissiveIntensity: 0.03,
    side: THREE.DoubleSide,
  });

  // Glass frame mullions
  const mullionMat = new THREE.MeshStandardMaterial({ color: 0x444455, roughness: 0.3, metalness: 0.6 });

  // Front glass wall (facing left side of floor) with door opening
  const doorWidth = 1.2;
  // Left panel of front wall
  const frontLeftW = (roomD - doorWidth) / 2;
  const frontLeft = new THREE.Mesh(new THREE.PlaneGeometry(frontLeftW, roomH), glassMat);
  frontLeft.rotation.y = -Math.PI / 2;
  frontLeft.position.set(roomX - roomW / 2, floorY + roomH / 2, roomZ - roomD / 2 + frontLeftW / 2);
  group.add(frontLeft);

  // Right panel of front wall
  const frontRight = new THREE.Mesh(new THREE.PlaneGeometry(frontLeftW, roomH), glassMat);
  frontRight.rotation.y = -Math.PI / 2;
  frontRight.position.set(roomX - roomW / 2, floorY + roomH / 2, roomZ + roomD / 2 - frontLeftW / 2);
  group.add(frontRight);

  // Top panel above door
  const topAboveDoor = new THREE.Mesh(new THREE.PlaneGeometry(doorWidth, roomH - 2.8), glassMat);
  topAboveDoor.rotation.y = -Math.PI / 2;
  topAboveDoor.position.set(roomX - roomW / 2, floorY + 2.8 + (roomH - 2.8) / 2, roomZ);
  group.add(topAboveDoor);

  // Back glass wall
  const backGlass = new THREE.Mesh(new THREE.PlaneGeometry(roomW, roomH), glassMat);
  backGlass.position.set(roomX, floorY + roomH / 2, roomZ - roomD / 2);
  group.add(backGlass);

  // Front glass wall (far side)
  const farGlass = new THREE.Mesh(new THREE.PlaneGeometry(roomW, roomH), glassMat);
  farGlass.position.set(roomX, floorY + roomH / 2, roomZ + roomD / 2);
  group.add(farGlass);

  // Vertical mullions
  const mullionPositions = [
    [roomX - roomW / 2, roomZ - roomD / 2],
    [roomX - roomW / 2, roomZ + roomD / 2],
    [roomX - roomW / 2, roomZ - doorWidth / 2 - 0.04],
    [roomX - roomW / 2, roomZ + doorWidth / 2 + 0.04],
    [roomX + roomW / 2, roomZ - roomD / 2],
    [roomX + roomW / 2, roomZ + roomD / 2],
  ];
  for (const [mx, mz] of mullionPositions) {
    const mullion = new THREE.Mesh(new THREE.BoxGeometry(0.06, roomH, 0.06), mullionMat);
    mullion.position.set(mx, floorY + roomH / 2, mz);
    group.add(mullion);
  }

  // Horizontal mullion at door top
  const doorTopMullion = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.06, doorWidth + 0.1), mullionMat);
  doorTopMullion.position.set(roomX - roomW / 2, floorY + 2.8, roomZ);
  group.add(doorTopMullion);

  // "BOARD ROOM" label above door
  const brCanvas = document.createElement('canvas');
  brCanvas.width = 256;
  brCanvas.height = 48;
  const brCtx = brCanvas.getContext('2d');
  brCtx.fillStyle = '#0a0e1a';
  brCtx.fillRect(0, 0, 256, 48);
  brCtx.fillStyle = '#eab308';
  brCtx.font = 'bold 18px sans-serif';
  brCtx.textAlign = 'center';
  brCtx.textBaseline = 'middle';
  brCtx.fillText('BOARD ROOM', 128, 24);
  const brTex = new THREE.CanvasTexture(brCanvas);
  brTex.colorSpace = THREE.SRGBColorSpace;
  const brLabel = new THREE.Mesh(
    new THREE.PlaneGeometry(1.2, 0.22),
    new THREE.MeshBasicMaterial({ map: brTex })
  );
  brLabel.rotation.y = -Math.PI / 2;
  brLabel.position.set(roomX - roomW / 2 - 0.05, floorY + 3.1, roomZ);
  group.add(brLabel);

  // ===== CONFERENCE TABLE inside board room =====
  const tableMat = new THREE.MeshPhysicalMaterial({ color: 0x1a1520, roughness: 0.15, metalness: 0.15, clearcoat: 0.4 });
  const table = new THREE.Mesh(new THREE.BoxGeometry(3.5, 0.08, 1.4), tableMat);
  table.position.set(roomX, floorY + 0.75, roomZ);
  group.add(table);

  // Table legs
  const legMat = new THREE.MeshStandardMaterial({ color: 0x333344, roughness: 0.3, metalness: 0.5 });
  const legPositions = [[-1.5, -0.55], [-1.5, 0.55], [1.5, -0.55], [1.5, 0.55]];
  for (const [lx, lz] of legPositions) {
    const leg = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.7, 0.06), legMat);
    leg.position.set(roomX + lx, floorY + 0.35, roomZ + lz);
    group.add(leg);
  }

  // ===== CHAIRS around conference table (8 chairs) =====
  const chairMat = new THREE.MeshStandardMaterial({ color: 0x1a1a2e, roughness: 0.5 });
  const chairPositions = [
    // Left side
    [roomX - 1.2, roomZ - 1.1, 0],
    [roomX, roomZ - 1.1, 0],
    [roomX + 1.2, roomZ - 1.1, 0],
    // Right side
    [roomX - 1.2, roomZ + 1.1, Math.PI],
    [roomX, roomZ + 1.1, Math.PI],
    [roomX + 1.2, roomZ + 1.1, Math.PI],
    // Head of table
    [roomX + 2.0, roomZ, -Math.PI / 2],
    // Foot of table
    [roomX - 2.0, roomZ, Math.PI / 2],
  ];
  for (const [cx, cz, cRot] of chairPositions) {
    // Seat
    const seat = new THREE.Mesh(new THREE.BoxGeometry(0.45, 0.06, 0.45), chairMat);
    seat.position.set(cx, floorY + 0.48, cz);
    seat.rotation.y = cRot;
    group.add(seat);
    // Back
    const back = new THREE.Mesh(new THREE.BoxGeometry(0.45, 0.4, 0.05), chairMat);
    back.position.set(
      cx - Math.sin(cRot) * 0.2,
      floorY + 0.7,
      cz - Math.cos(cRot) * 0.2
    );
    back.rotation.y = cRot;
    group.add(back);
    // Legs (4)
    for (const [ox, oz] of [[-0.18, -0.18], [-0.18, 0.18], [0.18, -0.18], [0.18, 0.18]]) {
      const chairLeg = new THREE.Mesh(new THREE.BoxGeometry(0.03, 0.45, 0.03), legMat);
      const rotOx = ox * Math.cos(cRot) - oz * Math.sin(cRot);
      const rotOz = ox * Math.sin(cRot) + oz * Math.cos(cRot);
      chairLeg.position.set(cx + rotOx, floorY + 0.225, cz + rotOz);
      group.add(chairLeg);
    }
  }

  // ===== WALL CHARTS on right wall (outside board room) =====
  const chartData = [
    { title: 'FORECAST Q2', color: '#eab308' },
    { title: 'SENTIMENT', color: '#3b82f6' },
    { title: 'MARKET SHARE', color: '#10b981' },
  ];
  chartData.forEach((cd, i) => {
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 192;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#0a0e1a';
    ctx.fillRect(0, 0, 256, 192);
    ctx.fillStyle = cd.color;
    ctx.font = 'bold 16px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(cd.title, 128, 22);
    ctx.strokeStyle = cd.color;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(20, 150);
    for (let x = 30; x < 240; x += 20) {
      ctx.lineTo(x, 60 + Math.random() * 80);
    }
    ctx.stroke();
    ctx.strokeStyle = 'rgba(255,255,255,0.1)';
    ctx.lineWidth = 0.5;
    for (let y = 40; y < 170; y += 30) {
      ctx.beginPath();
      ctx.moveTo(20, y);
      ctx.lineTo(236, y);
      ctx.stroke();
    }

    const tex = new THREE.CanvasTexture(canvas);
    tex.colorSpace = THREE.SRGBColorSpace;
    const chart = new THREE.Mesh(
      new THREE.PlaneGeometry(1.8, 1.3),
      new THREE.MeshBasicMaterial({ map: tex })
    );
    // Place on left wall (outside the board room)
    chart.position.set(-hw + 0.2, floorY + 2.2 + (i - 1) * 0.05, -3 + i * 3);
    chart.rotation.y = Math.PI / 2;
    group.add(chart);
  });

  // Interior board room light
  const boardLight = new THREE.PointLight(0xfff5e0, 20, 10, 2);
  boardLight.position.set(roomX, floorY + ceilH - 0.5, roomZ);
  group.add(boardLight);

  // ===== COMPETITOR ANALYSIS MONITOR (left wall, interactive-looking) =====
  const compCanvas = document.createElement('canvas');
  compCanvas.width = 512;
  compCanvas.height = 384;
  const cpCtx = compCanvas.getContext('2d');
  cpCtx.fillStyle = '#080a10';
  cpCtx.fillRect(0, 0, 512, 384);
  cpCtx.strokeStyle = '#eab308';
  cpCtx.lineWidth = 2;
  cpCtx.strokeRect(4, 4, 504, 376);
  cpCtx.fillStyle = '#eab308';
  cpCtx.font = 'bold 16px monospace';
  cpCtx.textAlign = 'center';
  cpCtx.fillText('COMPETITOR LANDSCAPE', 256, 28);
  // Competitor cards
  const competitors = [
    { name: 'AgentStack AI', funding: '$12M', threat: 'HIGH', market: 'Enterprise', color: '#ef4444' },
    { name: 'WorkflowOS', funding: '$4.2M', threat: 'MEDIUM', market: 'SMB', color: '#eab308' },
    { name: 'AutoHQ', funding: '$800K', threat: 'LOW', market: 'SMB Ops', color: '#10b981' },
    { name: 'SmartAgent', funding: '$22M', threat: 'HIGH', market: 'Multi-vertical', color: '#ef4444' },
    { name: 'AutoReply AI', funding: 'Bootstrap', threat: 'LOW', market: 'Niche', color: '#10b981' },
  ];
  competitors.forEach((c, i) => {
    const cy = 45 + i * 60;
    cpCtx.fillStyle = 'rgba(30,30,48,0.5)';
    cpCtx.fillRect(15, cy, 482, 50);
    cpCtx.fillStyle = '#e2e8f0';
    cpCtx.font = 'bold 13px sans-serif';
    cpCtx.textAlign = 'left';
    cpCtx.fillText(c.name, 25, cy + 20);
    cpCtx.fillStyle = '#94a3b8';
    cpCtx.font = '11px monospace';
    cpCtx.fillText(`Funding: ${c.funding}`, 25, cy + 38);
    cpCtx.fillText(`Market: ${c.market}`, 200, cy + 38);
    // Threat badge
    cpCtx.fillStyle = c.color;
    cpCtx.font = 'bold 11px monospace';
    cpCtx.textAlign = 'right';
    cpCtx.fillText(c.threat, 485, cy + 20);
    cpCtx.beginPath();
    cpCtx.arc(440, cy + 17, 5, 0, Math.PI * 2);
    cpCtx.fill();
  });
  // Our position
  cpCtx.fillStyle = '#eab308';
  cpCtx.font = 'bold 12px sans-serif';
  cpCtx.textAlign = 'center';
  cpCtx.fillText('CONDUIT AI: $0 raised | 12 clients | $12.4K MRR | Virtual Business OS LEADER', 256, 365);

  const compTex = new THREE.CanvasTexture(compCanvas);
  compTex.colorSpace = THREE.SRGBColorSpace;
  const compDisplay = new THREE.Mesh(
    new THREE.PlaneGeometry(2.5, 1.9),
    new THREE.MeshBasicMaterial({ map: compTex })
  );
  compDisplay.rotation.y = Math.PI / 2;
  compDisplay.position.set(-hw + 0.2, floorY + 2.2, -3);
  group.add(compDisplay);

  // Warm spotlight on competitor display
  const compSpot = new THREE.PointLight(0xeab308, 4, 5, 2);
  compSpot.position.set(-hw + 1, floorY + 3, -3);
  group.add(compSpot);

  // Whiteboard inside board room (back wall)
  const brWbCanvas = document.createElement('canvas');
  brWbCanvas.width = 256;
  brWbCanvas.height = 192;
  const brWbCtx = brWbCanvas.getContext('2d');
  brWbCtx.fillStyle = '#f5f5f5';
  brWbCtx.fillRect(0, 0, 256, 192);
  brWbCtx.fillStyle = '#eab308';
  brWbCtx.font = 'bold 14px sans-serif';
  brWbCtx.textAlign = 'center';
  brWbCtx.fillText('THREAT ASSESSMENT', 128, 20);
  // Boxes connected by arrows
  brWbCtx.strokeStyle = '#334155';
  brWbCtx.lineWidth = 1.5;
  brWbCtx.fillStyle = '#dbeafe';
  brWbCtx.fillRect(20, 40, 60, 30);
  brWbCtx.fillRect(100, 40, 60, 30);
  brWbCtx.fillRect(180, 40, 60, 30);
  brWbCtx.fillStyle = '#334155';
  brWbCtx.font = '8px sans-serif';
  brWbCtx.textAlign = 'center';
  brWbCtx.fillText('COLLECT', 50, 58);
  brWbCtx.fillText('ANALYZE', 130, 58);
  brWbCtx.fillText('REPORT', 210, 58);
  // Arrows
  brWbCtx.beginPath(); brWbCtx.moveTo(80, 55); brWbCtx.lineTo(100, 55); brWbCtx.stroke();
  brWbCtx.beginPath(); brWbCtx.moveTo(160, 55); brWbCtx.lineTo(180, 55); brWbCtx.stroke();
  // Notes
  brWbCtx.fillStyle = '#fef3c7';
  brWbCtx.fillRect(30, 90, 90, 40);
  brWbCtx.fillRect(140, 90, 90, 40);
  brWbCtx.fillStyle = '#334155';
  brWbCtx.font = '9px sans-serif';
  brWbCtx.textAlign = 'left';
  brWbCtx.fillText('Competitor pricing', 35, 105);
  brWbCtx.fillText('updated Q2', 35, 118);
  brWbCtx.fillText('Market gap in', 145, 105);
  brWbCtx.fillText('local services', 145, 118);
  // Red circle emphasis
  brWbCtx.strokeStyle = '#ef4444';
  brWbCtx.lineWidth = 2;
  brWbCtx.beginPath();
  brWbCtx.arc(128, 160, 20, 0, Math.PI * 2);
  brWbCtx.stroke();
  brWbCtx.fillStyle = '#ef4444';
  brWbCtx.font = 'bold 10px sans-serif';
  brWbCtx.textAlign = 'center';
  brWbCtx.fillText('PRIORITY', 128, 163);

  const brWbTex = new THREE.CanvasTexture(brWbCanvas);
  brWbTex.colorSpace = THREE.SRGBColorSpace;
  const brWhiteboard = new THREE.Mesh(
    new THREE.PlaneGeometry(2.0, 1.5),
    new THREE.MeshBasicMaterial({ map: brWbTex })
  );
  brWhiteboard.position.set(roomX + roomW / 2 - 0.2, floorY + 2.2, roomZ);
  brWhiteboard.rotation.y = -Math.PI / 2;
  group.add(brWhiteboard);

  // Notepad on conference table
  const notepadMat = new THREE.MeshStandardMaterial({ color: 0xfef3c7, roughness: 0.8 });
  const notepad = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.015, 0.25), notepadMat);
  notepad.position.set(roomX - 0.5, floorY + 0.765, roomZ);
  notepad.rotation.y = 0.1;
  group.add(notepad);
  // Pen on notepad
  const notePen = new THREE.Mesh(new THREE.BoxGeometry(0.008, 0.008, 0.12),
    new THREE.MeshStandardMaterial({ color: 0x1a1a88 }));
  notePen.position.set(roomX - 0.4, floorY + 0.775, roomZ);
  notePen.rotation.y = -0.2;
  group.add(notePen);

  // Water bottles on table (2)
  const brBottleMat = new THREE.MeshPhysicalMaterial({
    color: 0x88ccff, transparent: true, opacity: 0.4,
    roughness: 0.05, metalness: 0.0,
  });
  for (const bx of [roomX + 0.5, roomX + 0.8]) {
    const brBottle = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 0.12, 6), brBottleMat);
    brBottle.position.set(bx, floorY + 0.82, roomZ + 0.3);
    group.add(brBottle);
  }

  // === Data visualization monitor wall (back-left, highly visible) ===
  const dvBackMat = new THREE.MeshStandardMaterial({ color: 0x0a0a14, roughness: 0.3 });
  const dvBack = new THREE.Mesh(new THREE.BoxGeometry(5, 2.8, 0.1), dvBackMat);
  dvBack.position.set(-4, floorY + 2.0, -hd + 0.2);
  group.add(dvBack);
  // Grid of small glowing panels
  const dvColors = [0x3b82f6, 0x06b6d4, 0x8b5cf6, 0x10b981, 0xeab308, 0x3b82f6];
  for (let r = 0; r < 3; r++) {
    for (let c = 0; c < 4; c++) {
      const dc = dvColors[(r * 4 + c) % dvColors.length];
      const dm = new THREE.MeshBasicMaterial({ color: dc, transparent: true, opacity: 0.7 + Math.random() * 0.3 });
      const dp = new THREE.Mesh(new THREE.PlaneGeometry(1.0, 0.7), dm);
      dp.position.set(-5.8 + c * 1.15, floorY + 1.0 + r * 0.85, -hd + 0.28);
      group.add(dp);
    }
  }
}

/**
 * Operations floor extras: green accent, filing cabinets, printer station, status board
 */
export function operationsExtras(group, floorY, ceilH, hw, hd) {
  const cabinetMat = new THREE.MeshStandardMaterial({ color: 0x222233, roughness: 0.5, metalness: 0.3 });

  // 4 tall filing cabinets along back wall
  for (let i = 0; i < 4; i++) {
    const cabinet = new THREE.Mesh(new THREE.BoxGeometry(0.6, 1.8, 0.5), cabinetMat);
    cabinet.position.set(-5 + i * 0.9, floorY + 0.9, -hd + 0.4);
    group.add(cabinet);

    // Drawer handles
    const handleMat = new THREE.MeshStandardMaterial({ color: 0x666677, metalness: 0.8, roughness: 0.2 });
    for (let h = 0; h < 3; h++) {
      const handle = new THREE.Mesh(new THREE.BoxGeometry(0.15, 0.02, 0.03), handleMat);
      handle.position.set(-5 + i * 0.9, floorY + 0.5 + h * 0.55, -hd + 0.17);
      group.add(handle);
    }
  }

  // Printer station (right side)
  const printerMat = new THREE.MeshStandardMaterial({ color: 0x1a1a22, roughness: 0.4, metalness: 0.2 });
  const printer = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.35, 0.5), printerMat);
  printer.position.set(hw - 1.5, floorY + 0.9, -hd + 0.5);
  group.add(printer);
  // Printer stand
  const pStand = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.7, 0.6), cabinetMat);
  pStand.position.set(hw - 1.5, floorY + 0.35, -hd + 0.5);
  group.add(pStand);
  // Green LED
  const pLed = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.04, 0.02),
    new THREE.MeshBasicMaterial({ color: 0x22c55e }));
  pLed.position.set(hw - 1.3, floorY + 1.1, -hd + 0.26);
  group.add(pLed);

  // Operations status board (front wall)
  const statusCanvas = document.createElement('canvas');
  statusCanvas.width = 512;
  statusCanvas.height = 256;
  const sctx = statusCanvas.getContext('2d');
  sctx.fillStyle = '#0a0e14';
  sctx.fillRect(0, 0, 512, 256);
  sctx.strokeStyle = '#22c55e';
  sctx.lineWidth = 3;
  sctx.strokeRect(4, 4, 504, 248);
  sctx.fillStyle = '#22c55e';
  sctx.font = 'bold 24px sans-serif';
  sctx.textAlign = 'center';
  sctx.fillText('OPERATIONS CENTER', 256, 36);
  // Status rows
  const statuses = [
    ['Billing Pipeline', 'RUNNING', '#10b981'],
    ['Invoice Generation', 'RUNNING', '#10b981'],
    ['CRM Sync', 'RUNNING', '#10b981'],
    ['Notification Queue', 'RUNNING', '#10b981'],
    ['Support Tickets', '3 OPEN', '#eab308'],
  ];
  statuses.forEach(([name, status, color], i) => {
    sctx.fillStyle = '#94a3b8';
    sctx.font = '16px sans-serif';
    sctx.textAlign = 'left';
    sctx.fillText(name, 30, 75 + i * 36);
    sctx.fillStyle = color;
    sctx.font = 'bold 16px monospace';
    sctx.textAlign = 'right';
    sctx.fillText(status, 480, 75 + i * 36);
  });
  const statusTex = new THREE.CanvasTexture(statusCanvas);
  statusTex.colorSpace = THREE.SRGBColorSpace;
  const statusBoard = new THREE.Mesh(
    new THREE.PlaneGeometry(3.5, 1.8),
    new THREE.MeshBasicMaterial({ map: statusTex })
  );
  statusBoard.rotation.y = Math.PI;
  statusBoard.position.set(0, floorY + 2.2, hd - 0.2);
  group.add(statusBoard);

  // ===== WORKFLOW AUTOMATION BOARD (front wall, right side) =====
  const wfCanvas = document.createElement('canvas');
  wfCanvas.width = 512;
  wfCanvas.height = 256;
  const wfCtx = wfCanvas.getContext('2d');
  wfCtx.fillStyle = '#080e0a';
  wfCtx.fillRect(0, 0, 512, 256);
  wfCtx.strokeStyle = '#22c55e';
  wfCtx.lineWidth = 2;
  wfCtx.strokeRect(3, 3, 506, 250);
  wfCtx.fillStyle = '#22c55e';
  wfCtx.font = 'bold 16px monospace';
  wfCtx.textAlign = 'center';
  wfCtx.fillText('AUTOMATION WORKFLOWS', 256, 24);
  // Workflow nodes
  const workflows = [
    { name: 'New Client → Onboard', steps: ['Signup', 'Welcome Email', 'Setup Call', 'Go Live'], status: 'ACTIVE' },
    { name: 'Invoice → Payment', steps: ['Generate', 'Send', 'Remind', 'Collect'], status: 'ACTIVE' },
    { name: 'Support → Resolve', steps: ['Ticket', 'Triage', 'Assign', 'Close'], status: 'ACTIVE' },
  ];
  workflows.forEach((wf, i) => {
    const wy = 42 + i * 68;
    wfCtx.fillStyle = '#e2e8f0';
    wfCtx.font = 'bold 11px sans-serif';
    wfCtx.textAlign = 'left';
    wfCtx.fillText(wf.name, 15, wy);
    // Steps as connected boxes
    wf.steps.forEach((step, j) => {
      const sx = 15 + j * 120;
      wfCtx.fillStyle = 'rgba(34,197,94,0.1)';
      wfCtx.fillRect(sx, wy + 8, 100, 28);
      wfCtx.strokeStyle = '#22c55e';
      wfCtx.lineWidth = 1;
      wfCtx.strokeRect(sx, wy + 8, 100, 28);
      wfCtx.fillStyle = '#94a3b8';
      wfCtx.font = '10px monospace';
      wfCtx.textAlign = 'center';
      wfCtx.fillText(step, sx + 50, wy + 26);
      // Arrow
      if (j < wf.steps.length - 1) {
        wfCtx.fillStyle = '#22c55e';
        wfCtx.font = '12px sans-serif';
        wfCtx.fillText('→', sx + 107, wy + 26);
      }
    });
    // Status badge
    wfCtx.fillStyle = '#10b981';
    wfCtx.font = 'bold 10px monospace';
    wfCtx.textAlign = 'right';
    wfCtx.fillText(wf.status, 500, wy);
  });

  const wfTex = new THREE.CanvasTexture(wfCanvas);
  wfTex.colorSpace = THREE.SRGBColorSpace;
  const wfBoard = new THREE.Mesh(
    new THREE.PlaneGeometry(3.5, 1.8),
    new THREE.MeshBasicMaterial({ map: wfTex })
  );
  wfBoard.rotation.y = -Math.PI / 2;
  wfBoard.position.set(hw - 0.2, floorY + 2.2, -2);
  group.add(wfBoard);

  // Inbox/outbox trays on a side table
  const trayMat = new THREE.MeshStandardMaterial({ color: 0x333344, roughness: 0.3, metalness: 0.4 });
  // Table
  const sideTable = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.7, 0.5), cabinetMat);
  sideTable.position.set(hw - 1.5, floorY + 0.35, hd - 0.5);
  group.add(sideTable);
  // Stacked trays
  for (let t = 0; t < 3; t++) {
    const tray = new THREE.Mesh(new THREE.BoxGeometry(0.35, 0.02, 0.25), trayMat);
    tray.position.set(hw - 1.5, floorY + 0.72 + t * 0.08, hd - 0.5);
    group.add(tray);
    // Papers in tray
    if (t < 2) {
      const papers = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.015, 0.2),
        new THREE.MeshStandardMaterial({ color: 0xf0f0e8, roughness: 0.8 }));
      papers.position.set(hw - 1.5, floorY + 0.73 + t * 0.08, hd - 0.5);
      group.add(papers);
    }
  }
  // Tray labels
  const trayLabels = ['IN', 'PENDING', 'OUT'];
  for (let t = 0; t < 3; t++) {
    const lblCanvas = document.createElement('canvas');
    lblCanvas.width = 64; lblCanvas.height = 32;
    const lctx = lblCanvas.getContext('2d');
    lctx.fillStyle = '#222233';
    lctx.fillRect(0, 0, 64, 32);
    lctx.fillStyle = '#22c55e';
    lctx.font = 'bold 14px sans-serif';
    lctx.textAlign = 'center';
    lctx.textBaseline = 'middle';
    lctx.fillText(trayLabels[t], 32, 16);
    const lblTex = new THREE.CanvasTexture(lblCanvas);
    lblTex.colorSpace = THREE.SRGBColorSpace;
    const lbl = new THREE.Mesh(
      new THREE.PlaneGeometry(0.15, 0.06),
      new THREE.MeshBasicMaterial({ map: lblTex })
    );
    lbl.position.set(hw - 1.3, floorY + 0.73 + t * 0.08, hd - 0.37);
    group.add(lbl);
  }

  // === Large planning board on back wall ===
  const planCanvas = document.createElement('canvas');
  planCanvas.width = 512; planCanvas.height = 256;
  const plCtx = planCanvas.getContext('2d');
  plCtx.fillStyle = '#1a2a1a';
  plCtx.fillRect(0, 0, 512, 256);
  plCtx.fillStyle = '#10b981';
  plCtx.font = 'bold 22px sans-serif';
  plCtx.textAlign = 'center';
  plCtx.fillText('OPS PLANNING BOARD', 256, 30);
  // Draw a Gantt-chart style grid
  const barColors = ['#3b82f6', '#f97316', '#10b981', '#8b5cf6', '#eab308'];
  for (let r = 0; r < 5; r++) {
    const bx = 30 + Math.random() * 60;
    const bw = 100 + Math.random() * 200;
    plCtx.fillStyle = barColors[r];
    plCtx.globalAlpha = 0.8;
    plCtx.fillRect(bx, 55 + r * 38, bw, 24);
    plCtx.globalAlpha = 1.0;
    plCtx.fillStyle = '#ffffff';
    plCtx.font = '12px sans-serif';
    plCtx.textAlign = 'left';
    plCtx.fillText(['Deploy v2.4', 'DB Migration', 'Load Tests', 'Rollback Plan', 'Monitoring'][r], bx + 5, 55 + r * 38 + 16);
  }
  plCtx.textAlign = 'center';
  const planTex = new THREE.CanvasTexture(planCanvas);
  planTex.colorSpace = THREE.SRGBColorSpace;
  const planBoard = new THREE.Mesh(
    new THREE.PlaneGeometry(5, 2.5),
    new THREE.MeshBasicMaterial({ map: planTex })
  );
  planBoard.position.set(-3, floorY + 2.2, -hd + 0.15);
  group.add(planBoard);

  // === Filing cabinets along left wall ===
  const fileCabMat = new THREE.MeshStandardMaterial({ color: 0x555566, roughness: 0.5, metalness: 0.3 });
  for (let i = 0; i < 4; i++) {
    const cab = new THREE.Mesh(new THREE.BoxGeometry(0.5, 1.4, 0.4), fileCabMat);
    cab.position.set(-hw + 0.5, floorY + 0.7, -4 + i * 0.7);
    group.add(cab);
    // Drawer handles
    const handleMat = new THREE.MeshStandardMaterial({ color: 0x888899, metalness: 0.8, roughness: 0.2 });
    for (let d = 0; d < 3; d++) {
      const handle = new THREE.Mesh(new THREE.BoxGeometry(0.15, 0.02, 0.03), handleMat);
      handle.position.set(-hw + 0.28, floorY + 0.3 + d * 0.4, -4 + i * 0.7);
      group.add(handle);
    }
  }
}

// Helper
function _makeBox(w, h, d, x, y, z, mat) {
  const mesh = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat);
  mesh.position.set(x, y, z);
  return mesh;
}

export const DEPARTMENTS = [
  {
    id: 'lobby', floor: 1, y: 0, name: 'Lobby',
  },
  {
    id: 'sales', floor: 2, y: 50, name: 'Sales',
    accentColor: 0x3b82f6,
    agents: [
      { name: 'HUNTER', status: 'green' },
      { name: 'CLOSER', status: 'green' },
      { name: 'STRIKER', status: 'yellow' },
      { name: 'REX', status: 'green' },
      { name: 'DEMO', status: 'yellow' },
      { name: 'REPLY', status: 'green' },
    ],
  },
  {
    id: 'marketing', floor: 3, y: 100, name: 'Marketing',
    accentColor: 0x10b981,
    agents: [
      { name: 'NOVA', status: 'green' },
      { name: 'ARIA', status: 'green' },
      { name: 'LOCAL', status: 'yellow' },
      { name: 'REFERRAL', status: 'green' },
      { name: 'COMMUNITY', status: 'green' },
    ],
    extras: marketingExtras,
  },
  {
    id: 'engineering', floor: 4, y: 150, name: 'Engineering',
    accentColor: 0xf97316,
    agents: [
      { name: 'BYTE', status: 'green' },
      { name: 'WEBMASTER', status: 'green' },
      { name: 'CRM', status: 'yellow' },
      { name: 'ONBOARD', status: 'green' },
    ],
    extras: engineeringExtras,
  },
  {
    id: 'content', floor: 5, y: 200, name: 'Content',
    accentColor: 0xec4899,
    agents: [
      { name: 'SAGE', status: 'green' },
      { name: 'VIBE', status: 'green' },
      { name: 'SOCIAL', status: 'green' },
      { name: 'VIRAL', status: 'yellow' },
      { name: 'AB TEST', status: 'green' },
    ],
    extras: contentExtras,
  },
  {
    id: 'intelligence', floor: 6, y: 250, name: 'Intelligence',
    accentColor: 0xeab308,
    agents: [
      { name: 'LEARNING', status: 'green' },
      { name: 'FORECAST', status: 'green' },
      { name: 'RESEARCH', status: 'yellow' },
      { name: 'STRATEGY', status: 'green' },
      { name: 'BRAND', status: 'green' },
    ],
    extras: intelligenceExtras,
  },
  {
    id: 'operations', floor: 7, y: 300, name: 'Operations',
    accentColor: 0x6B7B3A,
    agents: [
      { name: 'OTTO', status: 'green' },
      { name: 'CFO', status: 'green' },
      { name: 'BILLING', status: 'green' },
      { name: 'CS', status: 'yellow' },
      { name: 'SMS', status: 'green' },
    ],
    extras: operationsExtras,
  },
  {
    id: 'monitoring', floor: 8, y: 350, name: 'Monitoring',
    accentColor: 0xef4444,
    agents: [
      { name: 'WATCHDOG', status: 'green' },
      { name: 'ANALYTICS', status: 'green' },
      { name: 'SENTINEL', status: 'green' },
      { name: 'PULSE', status: 'yellow' },
      { name: 'GUARDIAN', status: 'green' },
    ],
    extras: monitoringExtras,
  },
  {
    id: 'ceo', floor: 15, y: 400, name: 'CEO Suite',
  },
];
