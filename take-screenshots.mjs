import puppeteer from 'puppeteer';
import fs from 'fs';
import path from 'path';

const SHOTS = [
  {
    name: 'outdoor-overview',
    desc: 'Wide shot of outdoor — fountain, cars, street lights, bench',
    cam: { x: 15, y: 8, z: 28 },
    target: { x: 0, y: 1, z: 22 },
    floor: 0,
  },
];

const outDir = path.resolve('screenshots');
if (!fs.existsSync(outDir)) fs.mkdirSync(outDir);

async function run() {
  const browser = await puppeteer.launch({
    headless: false,
    args: [
      '--no-sandbox', '--disable-setuid-sandbox',
      '--enable-unsafe-webgpu', '--enable-features=Vulkan,UseSkiaRenderer',
      '--window-size=1920,1080',
    ],
  });
  const page = await browser.newPage();
  await page.setViewport({ width: 1920, height: 1080 });
  page.on('console', msg => { if (msg.type() === 'error') console.log('ERR:', msg.text()); });
  await page.goto('http://localhost:5174/', { waitUntil: 'networkidle0', timeout: 60000 });
  await page.waitForFunction('window.__SCENE_READY === true', { timeout: 45000 });
  console.log('Scene ready');
  await new Promise(r => setTimeout(r, 3000));

  for (const shot of SHOTS) {
    console.log(`Taking: ${shot.name}`);
    await page.evaluate((s) => {
      window.__setCamera(
        { x: s.cam.x, y: s.cam.y, z: s.cam.z },
        { x: s.target.x, y: s.target.y, z: s.target.z }
      );
    }, shot);
    await new Promise(r => setTimeout(r, 4000));
    await page.screenshot({ path: path.join(outDir, `${shot.name}.png`) });
    console.log(`  Saved: ${shot.name}.png`);
  }

  await browser.close();
}

run().catch(e => { console.error(e); process.exit(1); });
