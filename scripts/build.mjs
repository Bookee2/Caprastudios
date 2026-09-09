import { cp, mkdir, readFile, writeFile, readdir } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const root = fileURLToPath(new URL('../', import.meta.url));
export const defaultURL = 'https://bookee2.github.io/Caprastudios/';
export function normalizeURL(value) {
  const url = new URL(value);
  if (url.protocol !== 'https:' || url.username || url.password || url.search || url.hash || url.port || /[<>"'&]/.test(value)) {
    throw new Error('SITE_URL must be a plain HTTPS website URL without credentials, query, fragment, or port.');
  }
  url.pathname = url.pathname.replace(/\/+$/, '') + '/';
  return url.href;
}

export async function build(output = path.join(root, 'dist'), override) {
  const config = JSON.parse(await readFile(path.join(root, 'site.config.json'), 'utf8'));
  const url = normalizeURL(override || process.env.SITE_URL || config.url);
  await mkdir(output, { recursive: true });
  // Allowlist only public files. Never publish the repository, docs, scripts or environment.
  for (const name of ['index.html', 'privacy.html', '404.html']) {
    const source = await readFile(path.join(root, name), 'utf8');
    await writeFile(path.join(output, name), source.replaceAll(defaultURL, url));
  }
  await cp(path.join(root, 'assets'), path.join(output, 'assets'), { recursive: true });
  await writeFile(path.join(output, '.nojekyll'), '');
  await writeFile(path.join(output, 'robots.txt'), `User-agent: *\nAllow: /\n\nSitemap: ${url}sitemap.xml\n`);
  await writeFile(path.join(output, 'sitemap.xml'), `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n  <url><loc>${url}</loc></url>\n  <url><loc>${url}privacy.html</loc></url>\n</urlset>\n`);
  // Local relative assets must resolve equally at /Caprastudios/ and at a custom domain root.
  for (const name of ['index.html', 'privacy.html']) {
    const html = await readFile(path.join(output, name), 'utf8');
    const ids = new Set([...html.matchAll(/\bid="([^"]+)"/g)].map(match => match[1]));
    for (const [, reference] of html.matchAll(/(?:href|src)="([^"]+)"/g)) {
      if (reference.startsWith('#')) {
        if (!ids.has(reference.slice(1))) throw new Error(`${name}: missing anchor ${reference}`);
      } else if (!/^(https?:|mailto:|data:)/.test(reference)) {
        const target = path.resolve(output, reference.split(/[?#]/)[0]);
        if (!target.startsWith(path.resolve(output))) throw new Error(`Invalid asset path: ${reference}`);
        if (reference !== './') await readFile(target);
      }
    }
    if ([...html.matchAll(/<h1\b/g)].length !== 1) throw new Error(`${name}: expected exactly one H1`);
    for (const [, json] of html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)) JSON.parse(json);
  }
  return { url, output, files: await readdir(output) };
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const result = await build();
  console.log(`Built static website for ${result.url}\nOutput: ${result.output}`);
}
