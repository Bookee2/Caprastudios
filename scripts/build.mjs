import { cp, mkdir, readFile, writeFile, readdir, rm } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { checkSEO } from './seo.mjs';
import { copyMarketing, packageMarketing } from './marketing.mjs';

const root = fileURLToPath(new URL('../', import.meta.url));
export const publicPages = ['index.html', 'work.html', 'ai-consulting.html', 'motion.html', 'trailgoat.html', 'purple-squirrel.html', 'privacy.html', '404.html'];
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
  const endpoint = process.env.SITE_AGENT_ENDPOINT || '';
  if (endpoint) { const parsed = new URL(endpoint); if(parsed.protocol !== 'https:' || parsed.username || parsed.password || parsed.search || parsed.hash || /[<>"'&]/.test(endpoint)) throw Error('SITE_AGENT_ENDPOINT must be a plain HTTPS endpoint URL.'); }
  await mkdir(output, { recursive: true });
  // Allowlist only public files. Never publish the repository, docs, scripts or environment.
  for (const name of publicPages) {
    const source = await readFile(path.join(root, name), 'utf8');
    await writeFile(path.join(output, name), source.replaceAll(defaultURL, url).replace('<meta name="capra-agent-endpoint" content="">', `<meta name="capra-agent-endpoint" content="${endpoint.replace(/\/$/, '')}">`));
  }
  // Remove retired media from an existing output too; keep source assets intact.
  for (const name of (await readdir(path.join(root, 'assets/motion'))).filter(name => name.startsWith('atlanta-'))) {
    await rm(path.join(output, 'assets/motion', name), { force: true });
  }
  await rm(path.join(output, 'assets/work/caprahr.jpg'), { force: true });
  await cp(path.join(root, 'assets'), path.join(output, 'assets'), { recursive: true, filter: source => !/^atlanta-/.test(path.basename(source)) && path.basename(source) !== 'caprahr.jpg' });
  await copyMarketing(root, output);
  await writeFile(path.join(output, '.nojekyll'), '');
  await writeFile(path.join(output, 'robots.txt'), `User-agent: *\nAllow: /\n\nSitemap: ${url}sitemap.xml\n`);
  // Each page's lastmod is the date of the last commit that touched it, when history is available.
  const lastmod = file => { try { const d = execFileSync('git', ['log', '-1', '--format=%cs', '--', file], { cwd: root, encoding: 'utf8' }).trim(); return d ? `<lastmod>${d}</lastmod>` : ''; } catch { return ''; } };
  const entries = [...publicPages.filter(p => p !== '404.html').map(p => [p === 'index.html' ? '' : p, p]), ['marketing/', 'marketing/index.html']];
  await writeFile(path.join(output, 'sitemap.xml'), `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${entries.map(([loc, file]) => `  <url><loc>${url}${loc}</loc>${lastmod(file)}</url>`).join('\n')}\n</urlset>\n`);
  // Local relative assets must resolve equally at /Caprastudios/ and at a custom domain root.
  for (const name of publicPages.filter(p => p !== '404.html')) {
    const html = await readFile(path.join(output, name), 'utf8');
    const ids = new Set([...html.matchAll(/\bid="([^"]+)"/g)].map(match => match[1]));
    for (const [, reference] of html.matchAll(/(?:href|src)="([^"]+)"/g)) {
      if (reference.startsWith('#')) {
        if (!ids.has(reference.slice(1))) throw new Error(`${name}: missing anchor ${reference}`);
      } else if (!/^(https?:|mailto:|data:)/.test(reference)) {
        const target = path.resolve(output, reference.split(/[?#]/)[0]);
        if (!target.startsWith(path.resolve(output))) throw new Error(`Invalid asset path: ${reference}`);
        if (reference !== './') await readFile(reference.split(/[?#]/)[0].endsWith('/') ? path.join(target, 'index.html') : target);
      }
    }
    if ([...html.matchAll(/<h1\b/g)].length !== 1) throw new Error(`${name}: expected exactly one H1`);
    for (const [, json] of html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)) JSON.parse(json);
  }
  // The SEO standard: every indexable page must pass before anything is published.
  await checkSEO(output, url, [...publicPages.filter(p => p !== '404.html'), 'marketing/index.html']);
  return { url, output, files: await readdir(output) };
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const result = await build();
  await packageMarketing(root, result.output);
  console.log(`Built static website for ${result.url}\nOutput: ${result.output}`);
}
