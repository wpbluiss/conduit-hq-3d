import puppeteer from 'puppeteer';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const URL = process.env.QA_URL || 'http://localhost:3000';
const outDir = path.join(__dirname, 'visual-qa-results', 'comprehensive-audit');
fs.mkdirSync(outDir, { recursive: true });

const SCENE_TIMEOUT = 45_000;
const SETTLE_MS = 1500;

// Floor definitions
const FLOORS = [
  { name: 'lobby', y: 0, label: 'Floor 1 — Lobby' },
  { name: 'floor2-sales', y: 50, label: 'Floor 2 — Sales' },
  { name: 'floor3-marketing', y: 100, label: 'Floor 3 — Marketing' },
  { name: 'floor4-engineering', y: 150, label: 'Floor 4 — Engineering' },
  { name: 'floor5-content', y: 200, label: 'Floor 5 — Content' },
  { name: 'floor6-intel', y: 250, label: 'Floor 6 — Intelligence' },
  { name: 'floor7-ops', y: 300, label: 'Floor 7 — Operations' },
  { name: 'floor8-monitor', y: 350, label: 'Floor 8 — Monitoring' },
  { name: 'floor15-ceo', y: 400, label: 'Floor 15 — CEO Suite' },
];

// Camera positions per floor (relative to floorY)
function getFloorCameras(name, y) {
  const fy = y;
  const h = fy + 2.5; // eye height
  const dh = fy + 1.5; // desk height view
  const hw = 10; // half width
  const hd = 8; // half depth

  if (name === 'lobby') {
    return [
      { shot: 'wide', pos: { x: 0, y: 3, z: 6 }, target: { x: 0, y: 2, z: -4 } },
      { shot: 'left-wall', pos: { x: -8, y: 3, z: 0 }, target: { x: -10, y: 3, z: 0 } },
      { shot: 'right-wall', pos: { x: 8, y: 3, z: 0 }, target: { x: 10, y: 3, z: 0 } },
      { shot: 'back-wall', pos: { x: 0, y: 3, z: -3 }, target: { x: 0, y: 3, z: -10 } },
      { shot: 'reception-closeup', pos: { x: -1.5, y: 1.8, z: -1 }, target: { x: 0.8, y: 1.2, z: -2.8 } },
      { shot: 'elevator-bank', pos: { x: 0, y: 3, z: -4 }, target: { x: 0, y: 3, z: -10 } },
      { shot: 'entrance-outside', pos: { x: 0, y: 2.5, z: 12 }, target: { x: 0, y: 2, z: 0 } },
      { shot: 'floor-mat', pos: { x: 0, y: 1.5, z: 3 }, target: { x: 0, y: 0.1, z: -1 } },
      { shot: 'clock', pos: { x: -4, y: 4, z: -2 }, target: { x: -5, y: 4, z: -6 } },
    ];
  }

  if (name === 'floor15-ceo') {
    return [
      { shot: 'wide', pos: { x: 0, y: fy + 3, z: fy > 100 ? 6 : 6 }, target: { x: 0, y: fy + 2, z: fy - 2 } },
      { shot: 'desk-closeup', pos: { x: 2, y: fy + 1.5, z: -2 }, target: { x: 0, y: fy + 1, z: -4 } },
      { shot: 'jarvis', pos: { x: 4, y: fy + 2, z: 0 }, target: { x: 6, y: fy + 1.5, z: -2 } },
      { shot: 'window-view', pos: { x: 0, y: fy + 2, z: -2 }, target: { x: 0, y: fy + 2.5, z: 8 } },
      { shot: 'back-wall', pos: { x: 0, y: fy + 3, z: 3 }, target: { x: 0, y: fy + 3, z: -8 } },
      { shot: 'nameplate', pos: { x: -0.5, y: fy + 1.2, z: -3 }, target: { x: 0, y: fy + 1, z: -4.5 } },
    ];
  }

  // Standard department floors
  return [
    // Wide from front
    { shot: 'wide', pos: { x: 0, y: h, z: 8 }, target: { x: 0, y: h - 0.5, z: -2 } },
    // Left wall
    { shot: 'left-wall', pos: { x: -6, y: h, z: 0 }, target: { x: -hw, y: h, z: 0 } },
    // Right wall
    { shot: 'right-wall', pos: { x: 6, y: h, z: 0 }, target: { x: hw, y: h, z: 0 } },
    // Back wall (elevator side)
    { shot: 'back-wall', pos: { x: 0, y: h, z: -3 }, target: { x: 0, y: h, z: -hd } },
    // Desk closeup (first agent, front row)
    { shot: 'desk-closeup', pos: { x: -4, y: dh, z: -1 }, target: { x: -6, y: dh - 0.3, z: -3 } },
    // Monitor closeup
    { shot: 'monitor-closeup', pos: { x: -5.5, y: dh + 0.3, z: -2.5 }, target: { x: -6, y: dh + 0.1, z: -3.3 } },
    // Window view
    { shot: 'window-view', pos: { x: -3, y: h, z: 6 }, target: { x: -5, y: h, z: 8 } },
  ];
}

// Exterior cameras
const EXTERIOR_CAMERAS = [
  { name: 'exterior-tower-front', pos: { x: 0, y: 15, z: 40 }, target: { x: 0, y: 15, z: 0 } },
  { name: 'exterior-street-level', pos: { x: 20, y: 2, z: 30 }, target: { x: 0, y: 10, z: 0 } },
  { name: 'exterior-signage', pos: { x: 0, y: 14, z: 18 }, target: { x: 0, y: 14, z: 10 } },
  { name: 'exterior-entrance', pos: { x: 0, y: 3, z: 20 }, target: { x: 0, y: 3, z: 0 } },
];

async function run() {
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-gpu-sandbox'],
  });
  const page = await browser.newPage();
  await page.setViewport({ width: 1920, height: 1080 });

  console.log('Navigating to', URL);
  await page.goto(URL, { waitUntil: 'domcontentloaded' });

  console.log('Waiting for scene...');
  await page.waitForFunction('window.__SCENE_READY === true', { timeout: SCENE_TIMEOUT });
  console.log('Scene ready.\n');

  let totalShots = 0;

  // --- Exterior shots ---
  console.log('=== EXTERIOR ===');
  for (const cam of EXTERIOR_CAMERAS) {
    await page.evaluate((pos, target) => window.__setCamera(pos, target), cam.pos, cam.target);
    await new Promise(r => setTimeout(r, SETTLE_MS));
    const filename = `${cam.name}.png`;
    await page.screenshot({ path: path.join(outDir, filename) });
    console.log(`  ${filename}`);
    totalShots++;
  }

  // --- Floor shots ---
  for (const floor of FLOORS) {
    console.log(`\n=== ${floor.label} ===`);
    const cameras = getFloorCameras(floor.name, floor.y);

    for (const cam of cameras) {
      const absPos = cam.pos;
      const absTarget = cam.target;

      await page.evaluate((pos, target) => window.__setCamera(pos, target), absPos, absTarget);
      await new Promise(r => setTimeout(r, SETTLE_MS));

      const filename = `${floor.name}-${cam.shot}.png`;
      await page.screenshot({ path: path.join(outDir, filename) });
      console.log(`  ${filename}`);
      totalShots++;
    }
  }

  console.log(`\n=== COMPLETE ===`);
  console.log(`Total screenshots: ${totalShots}`);
  console.log(`Output: ${outDir}`);

  await browser.close();
}

run().catch(e => { console.error(e); process.exit(1); });
