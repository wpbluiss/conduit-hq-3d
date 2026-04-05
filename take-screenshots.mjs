import puppeteer from 'puppeteer';
import fs from 'fs';
import path from 'path';

const SHOTS = [
  {
    name: 'sales-door-sign',
    desc: 'Sales floor with illuminated department sign',
    cam: { x: 4, y: 52.5, z: -4.5 },
    target: { x: 3.2, y: 52.8, z: -7.8 },
    floor: 50,
  },
  {
    name: 'engineering-door-sign',
    desc: 'Engineering floor door sign',
    cam: { x: 4, y: 152.5, z: -4.5 },
    target: { x: 3.2, y: 152.8, z: -7.8 },
    floor: 150,
  },
  {
    name: 'ceo-door-sign',
    desc: 'CEO Suite door sign',
    cam: { x: 4, y: 402.5, z: -4.5 },
    target: { x: 3.2, y: 402.8, z: -7.8 },
    floor: 400,
  },
  {
    name: 'monitoring-door-sign',
    desc: 'Monitoring floor sign with server racks',
    cam: { x: 4, y: 352.5, z: -4.5 },
    target: { x: 3.2, y: 352.8, z: -7.8 },
    floor: 350,
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

  page.on('console', msg => {
    if (msg.type() === 'error') console.log('PAGE ERROR:', msg.text());
  });

  console.log('Loading page...');
  await page.goto('http://localhost:5174/', { waitUntil: 'networkidle0', timeout: 60000 });

  try {
    await page.waitForFunction('window.__SCENE_READY === true', { timeout: 45000 });
    console.log('Scene ready');
  } catch (e) {
    console.error('Scene failed to load');
    await browser.close();
    process.exit(1);
  }

  await new Promise(r => setTimeout(r, 3000));

  for (const shot of SHOTS) {
    console.log(`Taking: ${shot.name} — ${shot.desc}`);

    await page.evaluate((s) => {
      window.__setCamera(
        { x: s.cam.x, y: s.cam.y, z: s.cam.z },
        { x: s.target.x, y: s.target.y, z: s.target.z }
      );
    }, shot);

    await new Promise(r => setTimeout(r, 4000));

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
