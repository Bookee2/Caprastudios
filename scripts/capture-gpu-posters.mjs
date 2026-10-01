// Capture each WebGPU piece on the motion page as its own fallback still.
//   npm run dev   (in another terminal)
//   PLAYWRIGHT=/path/to/node_modules/playwright/index.mjs node scripts/capture-gpu-posters.mjs
// Uses the installed Google Chrome with WebGPU enabled. Playwright is not a project dependency.
import { writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';

const { chromium } = await import(process.env.PLAYWRIGHT || 'playwright');
const root = fileURLToPath(new URL('../', import.meta.url));
const site = process.env.SITE || 'http://localhost:4173/';
// Frames each piece draws before its still is taken, chosen so the still shows the piece at its best.
// Headless Chrome draws far fewer frames per second than a screen, so counting frames keeps stills consistent.
const pieces = [['metal', 240], ['grow', 900], ['ink', 700], ['print', 90]];

const browser = await chromium.launch({ channel: 'chrome', headless: true, args: ['--enable-unsafe-webgpu', '--use-angle=metal'] });
const page = await browser.newPage({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1.5 });
await page.goto(new URL('motion.html', site).href);
for (const [id, frames] of pieces) {
  await page.locator(`[data-gpu="${id}"]`).scrollIntoViewIfNeeded();
  await page.waitForFunction(name => window.CapraGPU?.state(name) === 'ready', id, { timeout: 20000 });
  if (id === 'print') await page.click('[data-print="1"]');   // the dither is the poster
  await page.waitForFunction(([name, n]) => window.CapraGPU.frames(name) >= n, [id, frames], { timeout: 180000, polling: 500 });
  // Paused, the print piece shows the film's finished pose instead of wherever the loop happens to be.
  if (id === 'print') { await page.click('.mo-pause'); await page.waitForTimeout(600); }
  const url = await page.evaluate(name => window.CapraGPU.snap(name, 0.86), id);
  if (!url) throw new Error(`${id} did not draw`);
  const file = `${root}assets/motion/gpu-${id}.jpg`;
  await writeFile(file, Buffer.from(url.split(',')[1], 'base64'));
  console.log(`${id}: ${file}`);
}
await browser.close();
