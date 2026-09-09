import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { build, normalizeURL, defaultURL } from './build.mjs';

test('rejects unsafe deployment origins', () => {
  for (const bad of ['http://example.com', 'https://user:pass@example.com', 'https://example.com/?x=1', 'https://example.com/#foo']) {
    assert.throws(() => normalizeURL(bad));
  }
});

for (const url of [defaultURL, 'https://caprastudios.ai/']) {
  test(`build preserves links and consistent metadata for ${url}`, async () => {
    const output = await mkdtemp(path.join(tmpdir(), 'capra-build-'));
    try {
      const result = await build(output, url);
      const html = await readFile(path.join(output, 'index.html'), 'utf8');
      assert.ok(html.includes(`<link rel="canonical" href="${url}">`));
      assert.ok(html.includes(`"url": "${url}"`));
      assert.match(html, /href="assets\/studio\.css(?:\?[^\"]*)?"/);
      assert.ok(html.includes('href="mailto:kris@caprahr.com'));
      if (url !== defaultURL) assert.equal(html.includes(defaultURL), false);
      const sitemap = await readFile(path.join(output, 'sitemap.xml'), 'utf8');
      assert.ok(sitemap.includes(`<loc>${url}</loc>`));
      const notFound = await readFile(path.join(output, '404.html'), 'utf8');
      assert.ok(notFound.includes(`href="${url}"`));
      assert.deepEqual(result.files.sort(), ['.nojekyll','404.html','assets','index.html','privacy.html','robots.txt','sitemap.xml'].sort());
    } finally { await rm(output, { recursive: true, force: true }); }
  });
}
