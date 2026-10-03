import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, readFile, rm, access, mkdir, writeFile, readdir } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { build, normalizeURL, defaultURL, publicPages } from './build.mjs';
import { checkSEO } from './seo.mjs';

test('SEO standard rejects a page missing its basics', async () => {
  const dir = await mkdtemp(path.join(tmpdir(), 'capra-seo-'));
  try {
    await writeFile(path.join(dir, 'bare.html'), '<!doctype html><html lang="en"><head><title>Hi</title></head><body><h1>Hi</h1><img src="x.png"></body></html>');
    await assert.rejects(checkSEO(dir, 'https://example.com/', ['bare.html']), error => ['title should be', 'description should be', 'canonical should be', 'missing og:image', 'twitter:card', 'apple-touch-icon', 'image without alt', 'missing structured data'].every(part => error.message.includes(part)));
  } finally { await rm(dir, { recursive: true, force: true }); }
});

test('rejects unsafe deployment origins', () => {
  for (const bad of ['http://example.com', 'https://user:pass@example.com', 'https://example.com/?x=1', 'https://example.com/#foo']) {
    assert.throws(() => normalizeURL(bad));
  }
});

for (const url of [defaultURL, 'https://caprastudios.co/']) {
  test(`build preserves links and consistent metadata for ${url}`, async () => {
    const output = await mkdtemp(path.join(tmpdir(), 'capra-build-'));
    try {
      // A rebuild must remove retired work from an older output directory.
      await mkdir(path.join(output, 'assets/motion'), {recursive: true});
      await mkdir(path.join(output, 'assets/work'), {recursive: true});
      await writeFile(path.join(output, 'assets/motion/atlanta-wide.mp4'), 'old-output');
      await writeFile(path.join(output, 'assets/work/caprahr.jpg'), 'old-output');
      const result = await build(output, url);
      const html = await readFile(path.join(output, 'index.html'), 'utf8');
      assert.ok(html.includes(`<link rel="canonical" href="${url}">`));
      assert.ok(html.includes(`"url": "${url}"`));
      assert.match(html, /href="assets\/site\.css(?:\?[^\"]*)?"/);
      assert.ok(html.includes('href="mailto:info@caprastudios.co'));
      if (url !== defaultURL) assert.equal(html.includes(defaultURL), false);
      const sitemap = await readFile(path.join(output, 'sitemap.xml'), 'utf8');
      assert.ok(sitemap.includes(`<loc>${url}</loc>`));
      for (const page of ['work.html', 'motion.html', 'motion-lab.html', 'ai-consulting.html', 'trailgoat.html', 'purple-squirrel.html']) {
        const content = await readFile(path.join(output, page), 'utf8');
        assert.ok(content.includes(`<link rel="canonical" href="${url}${page}">`));
        assert.ok(sitemap.includes(`<loc>${url}${page}</loc>`));
      }
      await assert.rejects(access(path.join(output, 'server')));
      await assert.rejects(access(path.join(output, '.env')));
      await assert.rejects(access(path.join(output, '.local')));
      const marketing = await readFile(path.join(output, 'marketing/index.html'), 'utf8');
      assert.match(marketing, /The Marketing Room/);
      assert.match(marketing, /kris@caprastudios.co/);
      // Kris's phone number must never be published (spam); print versions with it live off-site.
      for (const file of await readdir(path.join(output, 'marketing'), { recursive: true })) {
        if (/\.(html|js|json|txt|csv|svg)$/.test(file)) assert.doesNotMatch(await readFile(path.join(output, 'marketing', file), 'utf8'), /757[-. ]?3000|7707573000/, file);
      }
      assert.doesNotMatch(marketing, /noindex/);
      assert.ok(marketing.includes('<link rel="canonical" href="https://caprastudios.co/marketing/">'));
      assert.ok(sitemap.includes(`<loc>${url}marketing/</loc>`));
      await access(path.join(output, 'marketing/print/business-card-personal-day-duplex.pdf'));
      await access(path.join(output, 'marketing/motion/01-imagination-vertical.mp4'));
      await assert.rejects(access(path.join(output, 'marketing/.env')));
      await assert.rejects(access(path.join(output, 'marketing/source/__pycache__')));
      await assert.rejects(access(path.join(output, 'assets/work/caprahr.jpg')));
      await assert.rejects(access(path.join(output, 'assets/motion/atlanta-wide.mp4')));
      assert.doesNotMatch(html, /AI-native|AI adoption|AI training|caprahr|atlanta-film/i);
      const film = await readFile(path.join(output, 'assets/motion/trailgoat-brand-film.mp4'));
      assert.ok(film.length > 1000);
      const notFound = await readFile(path.join(output, '404.html'), 'utf8');
      assert.ok(notFound.includes(`href="${url}"`));
      assert.deepEqual(result.files.sort(), ['.nojekyll','assets','marketing',...publicPages,'robots.txt','sitemap.xml'].sort());
    } finally { await rm(output, { recursive: true, force: true }); }
  });
}
