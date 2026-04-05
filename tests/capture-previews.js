import puppeteer from 'puppeteer';
import fs from 'fs';
import path from 'path';

const URL = process.env.QA_URL || 'http://localhost:3000';
const SCENE_TIMEOUT = 60_000;

// 4 hero shots for the website
const SHOTS = [
  {
    name: 'hq-preview-1',
    desc: 'Exterior — golden hour, tower glowing, palms silhouetted against sunset',
    pos: { x: 30, y: 6, z: 45 },
    target: { x: 0, y: 22, z: 0 },
    settle: 4000,
  },
  {
    name: 'hq-preview-2',
    desc: 'Lobby — logo wall, chandelier, warm reception, light motes floating',
    pos: { x: 0, y: 4, z: 6 },
    target: { x: 0, y: 2, z: -4 },
    settle: 4000,
  },
  {
    name: 'hq-preview-3',
    desc: 'Sales Floor — busy agents at bright glowing screens, blue accent lighting',
    pos: { x: -6, y: 52.5, z: 5 },
    target: { x: 2, y: 51.2, z: -3 },
    settle: 4000,
  },
  {
    name: 'hq-preview-4',
    desc: 'CEO Suite — premium executive desk, JARVIS, panoramic city view, purple accents',
    pos: { x: -5, y: 402.2, z: 5 },
    target: { x: 1, y: 401.3, z: -4 },
    settle: 4000,
  },
];

const DEST_PROJECT = path.resolve(process.env.HOME, 'Downloads/conduit-nextjs/public');

async function run() {
  console.log('Launching browser for high-quality screenshots...');
  const browser = await puppeteer.launch({
    headless: 'new',
    args: [
      '--enable-unsafe-webgpu',
      '--enable-features=Vulkan',
      '--use-gl=angle',
      '--use-angle=metal',
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--window-size=1920,1080',
    ],
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1920, height: 1080, deviceScaleFactor: 1 });

  // Collect errors
  page.on('pageerror', err => console.error('[PAGE_ERROR]', err.message));

  console.log(`Navigating to ${URL}...`);
  await page.goto(URL, { waitUntil: 'domcontentloaded', timeout: 30_000 });

  console.log('Waiting for scene to be ready...');
  try {
    await page.waitForFunction('window.__SCENE_READY === true', { timeout: SCENE_TIMEOUT });
  } catch {
    console.error('TIMEOUT: Scene did not load within', SCENE_TIMEOUT / 1000, 's');
    await browser.close();
    process.exit(1);
  }

  // Let initial frames settle
  await sleep(3000);
  console.log('Scene ready. Capturing screenshots...\n');

  // Hide UI overlays for clean screenshots
  await page.evaluate(() => {
    // Hide HUD, FPS counter, controls hint, and other overlays
    document.querySelectorAll('[id]').forEach(el => {
      if (['loading', 'controls-hint'].includes(el.id)) return;
      if (el.style.position === 'fixed' || getComputedStyle(el).position === 'fixed') {
        el.dataset.wasVisible = el.style.display;
        el.style.display = 'none';
      }
    });
    // Also hide the FPS counter (first fixed div with monospace font)
    document.querySelectorAll('div').forEach(el => {
      const s = getComputedStyle(el);
      if (s.position === 'fixed' && s.pointerEvents === 'none' && el.textContent.includes('FPS')) {
        el.dataset.wasVisible = el.style.display;
        el.style.display = 'none';
      }
    });
  });

  const localDir = path.join(path.dirname(new globalThis.URL(import.meta.url).pathname), 'previews');
  fs.mkdirSync(localDir, { recursive: true });

  for (const shot of SHOTS) {
    console.log(`  Capturing: ${shot.name} — ${shot.desc}`);

    // Move camera
    await page.evaluate((pos, target) => {
      window.__setCamera(pos, target);
    }, shot.pos, shot.target);

    // Let scene settle and render multiple frames for bloom to stabilize
    await sleep(shot.settle);

    // Force extra renders to ensure async pipeline completes
    for (let i = 0; i < 10; i++) {
      await page.evaluate((pos, target) => {
        window.__setCamera(pos, target);
      }, shot.pos, shot.target);
      await sleep(300);
    }

    // Capture
    const localPath = path.join(localDir, `${shot.name}.png`);
    await page.screenshot({ path: localPath, type: 'png' });

    // Copy to conduit-nextjs
    const destPath = path.join(DEST_PROJECT, `${shot.name}.png`);
    if (fs.existsSync(DEST_PROJECT)) {
      fs.copyFileSync(localPath, destPath);
      console.log(`    -> Saved to ${destPath}`);
    } else {
      console.log(`    [WARN] ${DEST_PROJECT} not found, saved locally only`);
    }

    console.log(`    -> Saved to ${localPath}`);
  }

  // Restore UI
  await page.evaluate(() => {
    document.querySelectorAll('[data-was-visible]').forEach(el => {
      el.style.display = el.dataset.wasVisible || '';
      delete el.dataset.wasVisible;
    });
  });

  await browser.close();
  console.log('\nDone! 4 screenshots captured.');
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

run().catch(err => {
  console.error('Screenshot capture failed:', err);
  process.exit(1);
});
