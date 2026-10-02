/* The SEO standard every Capra site ships with. The build fails if an indexable page misses any of it.
   What it checks, and why, is written up in docs/SEO-STANDARD.md. */
import { readFile, access } from 'node:fs/promises';
import path from 'node:path';

const decode = s => s.replace(/&amp;/g, '&').replace(/&quot;/g, '"').replace(/&#39;/g, "'");
const meta = (html, attr, name) => { const m = html.match(new RegExp(`<meta ${attr}="${name}" content="([^"]*)"`)); return m ? decode(m[1]) : null; };

export async function checkSEO(output, url, pages) {
  const problems = [], titles = new Map(), descriptions = new Map();
  for (const page of pages) {
    const html = await readFile(path.join(output, page), 'utf8'), fail = message => problems.push(`${page}: ${message}`);
    const title = decode(html.match(/<title>([^<]*)<\/title>/)?.[1] ?? ''), description = meta(html, 'name', 'description') ?? '';
    if (title.length < 15 || title.length > 65) fail(`title should be 15–65 characters (has ${title.length}): "${title}"`);
    if (description.length < 70 || description.length > 165) fail(`description should be 70–165 characters (has ${description.length})`);
    if (titles.has(title)) fail(`title repeats ${titles.get(title)}`); titles.set(title, page);
    if (descriptions.has(description)) fail(`description repeats ${descriptions.get(description)}`); descriptions.set(description, page);
    if (!/<html lang="[a-z]{2}/.test(html)) fail('missing <html lang>');
    if (/<meta name="robots" content="[^"]*noindex/.test(html)) fail('is marked noindex but listed as indexable');
    const canonical = html.match(/<link rel="canonical" href="([^"]*)"/)?.[1];
    const expected = page === 'index.html' ? url : page.endsWith('/index.html') ? new URL(page.slice(0, -10), 'https://caprastudios.co/').href : url + page;
    if (canonical !== expected) fail(`canonical should be ${expected} (has ${canonical})`);
    for (const key of ['og:title', 'og:description', 'og:url', 'og:type', 'og:image', 'og:image:alt']) if (!meta(html, 'property', key)) fail(`missing ${key}`);
    if (meta(html, 'name', 'twitter:card') !== 'summary_large_image') fail('twitter:card should be summary_large_image');
    const image = meta(html, 'property', 'og:image');
    if (image) { const local = image.replace(/^https:\/\/[^/]+\/(?:Caprastudios\/)?/, ''); await access(path.join(output, local)).catch(() => fail(`og:image file not found: ${local}`)); }
    if (!/<link rel="icon"/.test(html) || !/<link rel="apple-touch-icon"/.test(html)) fail('missing favicon or apple-touch-icon');
    if ((html.match(/<h1\b/g) || []).length !== 1) fail('needs exactly one <h1>');
    for (const [img] of html.matchAll(/<img\b[^>]*>/g)) if (!/\balt="/.test(img)) fail(`image without alt: ${img.slice(0, 80)}`);
    const ld = [...html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)];
    if (!ld.length && page !== 'privacy.html' && !page.startsWith('marketing/')) fail('missing structured data (JSON-LD)');
    for (const [, json] of ld) { try { JSON.parse(json); } catch { fail('structured data is not valid JSON'); } }
  }
  if (problems.length) throw new Error(`SEO standard not met:\n- ${problems.join('\n- ')}`);
}
