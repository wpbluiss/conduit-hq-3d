import puppeteer from 'puppeteer';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const URL = process.env.QA_URL || 'http://localhost:3000';
const SCENE_TIMEOUT = 45_000;
const SETTLE_MS = 2000;

// ~40 camera positions for comprehensive visual QA
const CAMERA_POSITIONS = [
  // ===== EXTERIOR (5 views) =====
  { name: '01-exterior-wide',           pos: { x: 40, y: 20, z: 55 },    target: { x: 0, y: 10, z: 0 } },
  { name: '02-exterior-entrance',       pos: { x: 0, y: 4, z: 25 },      target: { x: 0, y: 4, z: 0 } },
  { name: '03-exterior-behind',         pos: { x: 0, y: 15, z: -50 },    target: { x: 0, y: 10, z: 0 } },
  { name: '04-exterior-street-level',   pos: { x: 20, y: 2, z: 30 },     target: { x: 0, y: 25, z: 0 } },
  { name: '05-exterior-corner',         pos: { x: 35, y: 12, z: -30 },   target: { x: 0, y: 10, z: 0 } },

  // ===== LOBBY (7 views) =====
  { name: '06-lobby-overview',          pos: { x: 0, y: 3, z: 6 },       target: { x: 0, y: 2, z: -10 } },
  { name: '07-lobby-from-elevator',     pos: { x: 0, y: 3, z: -6 },      target: { x: 0, y: 3, z: 8 } },
  { name: '08-lobby-reception-closeup', pos: { x: -1.5, y: 1.8, z: -1 }, target: { x: 0.8, y: 1.2, z: -2.8 } },
  { name: '09-lobby-right-side',        pos: { x: 6, y: 2.5, z: 2 },     target: { x: 9, y: 1.5, z: -2 } },
  { name: '10-lobby-ceiling-up',        pos: { x: 0, y: 1.5, z: 0 },     target: { x: 0, y: 8, z: 0 } },
  { name: '11-lobby-elevator-closeup',  pos: { x: 0, y: 3, z: -4 },      target: { x: 0, y: 3, z: -10 } },
  { name: '12-receptionist-closeup',    pos: { x: -1.5, y: 1.5, z: -1.5 }, target: { x: 0.8, y: 1.5, z: -2.8 } },

  // ===== FLOOR 2: SALES — y=50 (2 views) =====
  { name: '13-floor2-sales-front',      pos: { x: 0, y: 52.5, z: 7 },    target: { x: 0, y: 52, z: -5 } },
  { name: '14-floor2-sales-rear',       pos: { x: 0, y: 52.5, z: -6 },   target: { x: 0, y: 52, z: 5 } },

  // ===== FLOOR 3: MARKETING — y=100 (2 views) =====
  { name: '15-floor3-marketing-front',  pos: { x: 0, y: 102.5, z: 7 },   target: { x: 0, y: 102, z: -5 } },
  { name: '16-floor3-marketing-rear',   pos: { x: 0, y: 102.5, z: -6 },  target: { x: 0, y: 102, z: 5 } },

  // ===== FLOOR 4: ENGINEERING — y=150 (2 views) =====
  { name: '17-floor4-engineering-front', pos: { x: 0, y: 152.5, z: 7 },   target: { x: 0, y: 152, z: -5 } },
  { name: '18-floor4-engineering-rear',  pos: { x: 0, y: 152.5, z: -6 },  target: { x: 0, y: 152, z: 5 } },

  // ===== FLOOR 5: CONTENT — y=200 (2 views) =====
  { name: '19-floor5-content-front',    pos: { x: 0, y: 202.5, z: 7 },   target: { x: 0, y: 202, z: -5 } },
  { name: '20-floor5-content-rear',     pos: { x: 0, y: 202.5, z: -6 },  target: { x: 0, y: 202, z: 5 } },

  // ===== FLOOR 6: INTELLIGENCE — y=250 (2 views) =====
  { name: '21-floor6-intel-front',      pos: { x: 0, y: 252.5, z: 7 },   target: { x: 0, y: 252, z: -5 } },
  { name: '22-floor6-intel-rear',       pos: { x: 0, y: 252.5, z: -6 },  target: { x: 0, y: 252, z: 5 } },

  // ===== FLOOR 7: OPERATIONS — y=300 (2 views) =====
  { name: '23-floor7-ops-front',        pos: { x: 0, y: 302.5, z: 7 },   target: { x: 0, y: 302, z: -5 } },
  { name: '24-floor7-ops-rear',         pos: { x: 0, y: 302.5, z: -6 },  target: { x: 0, y: 302, z: 5 } },

  // ===== FLOOR 8: MONITORING — y=350 (2 views) =====
  { name: '25-floor8-monitor-front',    pos: { x: 0, y: 352.5, z: 7 },   target: { x: 0, y: 352, z: -5 } },
  { name: '26-floor8-monitor-rear',     pos: { x: 0, y: 352.5, z: -6 },  target: { x: 0, y: 352, z: 5 } },

  // ===== FLOOR 15: CEO SUITE — y=400 (4 views) =====
  { name: '27-ceo-suite-front',         pos: { x: 0, y: 402.5, z: 7 },   target: { x: 0, y: 402, z: -5 } },
  { name: '28-ceo-desk-closeup',        pos: { x: -2, y: 401.5, z: -1 }, target: { x: 0, y: 401, z: -3 } },
  { name: '29-ceo-window-outward',      pos: { x: 0, y: 402, z: -6 },    target: { x: 0, y: 402, z: 8 } },
  { name: '30-ceo-suite-rear',          pos: { x: 0, y: 402.5, z: -6 },  target: { x: 0, y: 402, z: 5 } },

  // ===== SPECIAL VIEWS (8 views) =====
  { name: '31-inside-elevator',         pos: { x: 0, y: 2, z: -7.8 },    target: { x: 0, y: 2, z: 0 } },
  { name: '32-ceiling-fan-closeup',     pos: { x: -3, y: 52.2, z: 0 },   target: { x: -3, y: 53.94, z: -2 } },
  { name: '33-elevator-to-floor',       pos: { x: 0, y: 52, z: -7 },     target: { x: 0, y: 52, z: 5 } },
  { name: '34-exterior-dusk',           pos: { x: -35, y: 15, z: 50 },   target: { x: 0, y: 8, z: 0 } },
];

async function run() {
  const dateStr = new Date().toISOString().slice(0, 10);
  const screenshotDir = path.join(__dirname, 'screenshots', dateStr);
  fs.mkdirSync(screenshotDir, { recursive: true });

  console.log(`Launching browser...`);
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
  await page.setViewport({ width: 1920, height: 1080 });

  // Collect console messages
  const consoleLogs = [];
  page.on('console', msg => consoleLogs.push(`[${msg.type()}] ${msg.text()}`));
  page.on('pageerror', err => consoleLogs.push(`[PAGE_ERROR] ${err.message}`));

  console.log(`Navigating to ${URL}...`);
  await page.goto(URL, { waitUntil: 'domcontentloaded', timeout: 30_000 });

  // Wait for scene to be ready
  console.log(`Waiting for __SCENE_READY (timeout ${SCENE_TIMEOUT / 1000}s)...`);
  try {
    await page.waitForFunction('window.__SCENE_READY === true', { timeout: SCENE_TIMEOUT });
  } catch {
    console.error('TIMEOUT: Scene did not become ready within', SCENE_TIMEOUT / 1000, 'seconds');
    // Take a diagnostic screenshot anyway
    await page.screenshot({ path: path.join(screenshotDir, 'TIMEOUT-debug.png') });
    await browser.close();
    process.exit(1);
  }

  console.log('Scene ready. Starting visual QA...\n');

  // Wait an extra second for first frames to stabilize
  await sleep(1500);

  const report = {
    date: dateStr,
    url: URL,
    timestamp: new Date().toISOString(),
    views: [],
    warnings: [],
    summary: {},
  };

  for (const cam of CAMERA_POSITIONS) {
    // Move camera
    await page.evaluate((pos, target) => {
      window.__setCamera(pos, target);
    }, cam.pos, cam.target);

    // Let the scene settle and render a few frames
    await sleep(SETTLE_MS);

    // Collect metrics
    const metrics = await page.evaluate(() => {
      const info = window.__renderer?.info;
      return {
        fps: window.__currentFPS || 0,
        triangles: info?.render?.triangles || 0,
        drawCalls: info?.render?.calls || 0,
        textures: info?.memory?.textures || 0,
        geometries: info?.memory?.geometries || 0,
      };
    });

    // Take screenshot
    const filename = `${cam.name}.png`;
    const filepath = path.join(screenshotDir, filename);
    await page.screenshot({ path: filepath });

    const isWarning = metrics.fps > 0 && metrics.fps < 24;
    const status = metrics.fps === 0 ? 'NO_DATA' : isWarning ? 'WARN' : 'OK';

    const viewResult = {
      name: cam.name,
      camera: { position: cam.pos, target: cam.target },
      metrics,
      screenshot: filename,
      status,
    };
    report.views.push(viewResult);

    if (isWarning) {
      const warning = `${cam.name}: ${metrics.fps} FPS (below 24 threshold)`;
      report.warnings.push(warning);
      console.log(`  [WARN] ${cam.name} — ${metrics.fps} FPS | ${metrics.drawCalls} draws | ${metrics.triangles} tris`);
    } else {
      console.log(`  [${status}]  ${cam.name} — ${metrics.fps} FPS | ${metrics.drawCalls} draws | ${metrics.triangles} tris`);
    }
  }

  // Summary
  const fpsValues = report.views.map(v => v.metrics.fps).filter(f => f > 0);
  report.summary = {
    totalViews: report.views.length,
    avgFPS: fpsValues.length ? Math.round(fpsValues.reduce((a, b) => a + b, 0) / fpsValues.length) : 0,
    minFPS: fpsValues.length ? Math.min(...fpsValues) : 0,
    maxFPS: fpsValues.length ? Math.max(...fpsValues) : 0,
    warningCount: report.warnings.length,
    noDataCount: report.views.filter(v => v.status === 'NO_DATA').length,
  };

  // Write JSON report
  const reportPath = path.join(screenshotDir, 'report.json');
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));

  console.log('\n=== VISUAL QA REPORT ===');
  console.log(`Views tested:  ${report.summary.totalViews}`);
  console.log(`FPS range:     ${report.summary.minFPS}–${report.summary.maxFPS}`);
  console.log(`Average FPS:   ${report.summary.avgFPS}`);
  console.log(`Warnings:      ${report.summary.warningCount}`);
  console.log(`No data:       ${report.summary.noDataCount}`);
  console.log(`Screenshots:   ${screenshotDir}`);
  console.log(`Report:        ${reportPath}`);

  if (report.warnings.length > 0) {
    console.log('\nFPS Warnings:');
    report.warnings.forEach(w => console.log(`  - ${w}`));
  }

  await browser.close();
  console.log('\nDone.');
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

run().catch(err => {
  console.error('Visual QA failed:', err);
  process.exit(1);
});
