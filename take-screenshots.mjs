import puppeteer from 'puppeteer';
import fs from 'fs';
import path from 'path';

const SHOTS = [
  {
    name: 'lobby-dashboard',
    desc: 'Lobby with company dashboard screen',
    cam: { x: -2, y: 4, z: 0 },
    target: { x: 0, y: 5.5, z: -6.5 },
    floor: 0,
    wait: 4000,
  },
  {
    name: 'ceo-boardroom',
    desc: 'CEO Suite board room area',
    cam: { x: 3, y: 402, z: 8 },
    target: { x: 6, y: 401, z: 4 },
    floor: 400,
    wait: 4000,
  },
  {
    name: 'ceo-dashboard',
    desc: 'CEO Suite with dashboard screen',
    cam: { x: -5, y: 402, z: 3 },
    target: { x: -8, y: 402.5, z: 0 },
    floor: 400,
    wait: 4000,
  },
  {
    name: 'notifications-lobby',
    desc: 'Lobby interior showing notification toast',
    cam: { x: 0, y: 3, z: 5 },
    target: { x: 0, y: 2, z: -3 },
    floor: 0,
    wait: 5000,
  },
];

const outDir = path.resolve('screenshots');
if (!fs.existsSync(outDir)) fs.mkdirSync(outDir);

async function run() {
  const browser = await puppeteer.launch({
    headless: false,
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--enable-unsafe-webgpu',
      '--enable-features=Vulkan,UseSkiaRenderer',
      '--window-size=1920,1080',
    ],
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1920, height: 1080 });

  // Log console messages for debugging
  page.on('console', msg => {
    if (msg.type() === 'error') console.log('PAGE ERROR:', msg.text());
  });

  console.log('Loading page...');
  await page.goto('http://localhost:5174/', { waitUntil: 'networkidle0', timeout: 60000 });

  // Wait for scene ready with longer timeout
  try {
    await page.waitForFunction('window.__SCENE_READY === true', { timeout: 45000 });
    console.log('Scene ready');
  } catch (e) {
    console.log('Scene not ready after 45s, checking state...');
    const state = await page.evaluate(() => ({
      ready: window.__SCENE_READY,
      hasRenderer: !!window.__renderer,
    }));
    console.log('State:', state);
    if (!state.ready) {
      console.error('Scene failed to load');
      await browser.close();
      process.exit(1);
    }
  }

  // Extra wait for animations to settle
  await new Promise(r => setTimeout(r, 3000));

  for (const shot of SHOTS) {
    console.log(`Taking: ${shot.name} — ${shot.desc}`);

    await page.evaluate((s) => {
      window.__setCamera(
        { x: s.cam.x, y: s.cam.y, z: s.cam.z },
        { x: s.target.x, y: s.target.y, z: s.target.z }
      );
    }, shot);

    await new Promise(r => setTimeout(r, shot.wait));

    await page.screenshot({
      path: path.join(outDir, `${shot.name}.png`),
      fullPage: false,
    });
    console.log(`  Saved: ${shot.name}.png`);
  }

  await browser.close();
  console.log(`Done! ${SHOTS.length} screenshots saved to ${outDir}/`);
}

run().catch(e => { console.error(e); process.exit(1); });
