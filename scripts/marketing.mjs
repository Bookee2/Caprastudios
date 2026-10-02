import { cp, mkdir, readFile, rm, stat } from 'node:fs/promises';
import path from 'node:path';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';

const run = promisify(execFile);
const publicFiles = ['index.html', 'style.css', 'app.js', 'data.js', 'manifest.json', 'asset-inventory.csv', 'platform-map.json', 'START-HERE.txt'];
const publicFolders = ['brand', 'carousels', 'copy', 'email', 'motion', 'print', 'profiles', 'proofs', 'social', 'source'];

export async function copyMarketing(root, output) {
  const source = path.join(root, 'marketing');
  const target = path.join(output, 'marketing');
  await rm(target, { recursive: true, force: true });
  await mkdir(target, { recursive: true });
  for (const name of [...publicFiles, ...publicFolders]) {
    await cp(path.join(source, name), path.join(target, name), {
      recursive: true,
      filter: file => !path.basename(file).startsWith('.') && !['__pycache__', 'trailgoat-brand-film-source.mp4'].includes(path.basename(file)) && !file.endsWith('.zip'),
    });
  }
  await validateMarketing(target);
}

export async function validateMarketing(target, archives = false) {
  const assertFile = async reference => {
    const file = path.resolve(target, reference.split(/[?#]/)[0]);
    if (!file.startsWith(path.resolve(target) + path.sep)) throw Error(`Marketing path escapes its folder: ${reference}`);
    if (!(await stat(file)).isFile()) throw Error(`Missing marketing file: ${reference}`);
  };
  const assets = JSON.parse(await readFile(path.join(target, 'manifest.json'), 'utf8'));
  for (const asset of assets) for (const field of ['png', 'svg', 'pdf', 'thumb']) if (asset[field]) await assertFile(asset[field]);
  const videos = JSON.parse(await readFile(path.join(target, 'motion/videos.json'), 'utf8'));
  for (const video of videos) { await assertFile(video.video); await assertFile(video.poster); }
  const html = await readFile(path.join(target, 'index.html'), 'utf8');
  for (const [, reference] of html.matchAll(/(?:href|src)="([^"]+)"/g)) {
    if (/^(https?:|mailto:|tel:|data:|#)/.test(reference)) continue;
    if (!archives && reference.endsWith('.zip')) continue;
    await assertFile(reference);
  }
  if (archives) {
    const platforms = JSON.parse(await readFile(path.join(target, 'platform-map.json'), 'utf8'));
    for (let i = 1; i <= Object.keys(platforms).length; i++) await assertFile(`platform-kits/${String(i).padStart(2, '0')}-starter.zip`);
  }
}

export async function packageMarketing(root, output) {
  const target = path.join(output, 'marketing');
  // Reuse the film already versioned in the site. Include it in the offline kit
  // so the editable motion source works without another copy in Git.
  await cp(path.join(root, 'assets/motion/trailgoat-brand-film.mp4'), path.join(target, 'brand/media/trailgoat-brand-film-source.mp4'));
  const { stdout } = await run('python3', [path.join(root, 'marketing/source/package_suite.py'), target], { maxBuffer: 1024 * 1024 });
  console.log(stdout.trim());
  await validateMarketing(target, true);
}
