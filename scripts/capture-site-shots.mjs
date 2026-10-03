/* Captures the framed screenshots the Web page shows of this site, in daylight and under black light.
   Run with the dev server up:  PLAYWRIGHT=<path to playwright/index.mjs> node scripts/capture-site-shots.mjs
   Re-run whenever the homepage changes, so the hero stays honest. */
import { fileURLToPath } from 'node:url';
import path from 'node:path';
const { chromium } = await import(process.env.PLAYWRIGHT);
const root = fileURLToPath(new URL('../', import.meta.url));
const site = process.env.SITE_URL || 'http://localhost:4173/';
const shots = [
  { file: 'home-day.jpg', page: '', light: 'day' },
  { file: 'home-night.jpg', page: '', light: 'bl' },
  { file: 'marketing-room.jpg', page: 'marketing/', light: 'day' },
];
const browser = await chromium.launch({ channel: 'chrome', headless: true, args: ['--enable-unsafe-webgpu', '--use-angle=metal'] });
for (const shot of shots) {
  const context = await browser.newContext({ viewport: { width: 1280, height: 800 }, deviceScaleFactor: 1.5, reducedMotion: 'reduce' });
  // The shots show the site, not the assistant button; the pond's own motion is left running so the live piece is captured.
  await context.addInitScript(light => { try { localStorage.setItem('capra-light', light); } catch {} }, shot.light);
  const page = await context.newPage();
  await page.goto(new URL(shot.page, site).href, { waitUntil: 'networkidle' });
  await page.addStyleTag({ content: '.agent-launch{display:none!important}' });
  await page.waitForTimeout(2500);
  await page.screenshot({ path: path.join(root, 'assets/web', shot.file), type: 'jpeg', quality: 84 });
  await context.close();
  console.log('captured', shot.file);
}
await browser.close();
