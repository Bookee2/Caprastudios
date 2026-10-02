# Capra Studios

An independent design and web studio in Atlanta: websites, web applications, 3D motion, and AI consulting. Operated by Capra, LLC.

One wall, two lights: a chalk page with flat paint colours taken from the koi pond's palettes, and a black light switch that turns the wall dark and makes the paint glow. Red Hat typography, the ribbon unicorn, hand-tagged notes, and the interactive koi pond hero give the studio its own identity. The direction and its reasoning are in `docs/SITE-CHARACTER-AUDIT.html`.

## Run it

Requires Node.js 22 or later. There are **no package dependencies** and no installation step.

```sh
npm run dev    # http://127.0.0.1:4173
npm run check  # link, metadata and deployment configuration tests
npm run build  # public website in dist/
```

The website frontend is ordinary HTML, CSS and JavaScript. The optional server-side assistant uses Node and Anthropic Opus 5; setup and verification are in [AI assistant](docs/AI-ASSISTANT.md). All important content, the portfolio, FAQ, and contact links work without JavaScript. With live chat unconfigured, Google Fonts is the only external service requested by the landing page; the ribbon artwork and portfolio screenshots are stored locally.

## Launch on GitHub Pages

1. Review and merge the website pull request.
2. In **Settings → Pages → Build and deployment**, set **Source** to **GitHub Actions** if it is not already configured.
3. The included workflow checks, builds, and publishes on a push to `main`. Pull requests run validation without deploying.
4. The initial address is `https://bookee2.github.io/Caprastudios/`. A manual workflow run from `main` can also publish.

Only `dist/` is uploaded. Source, docs, tests, and repository internals are not included in the public website artifact.

The September 28 implementation and retirement decisions are recorded in [the refresh scope](docs/STUDIO-REFRESH.md). The new site is locally implemented, not deployed. Capra HR and the Atlanta flythrough are excluded from the public portfolio and build; source assets remain preserved. New Unreal production is deferred until the shared workspace is available.

See [the launch guide](docs/LAUNCH.md) for the custom domain, contact details, and search setup. See [the animation handoff](docs/ANIMATION.md) for current film delivery and the earlier Blender sequence and [the brand guide](docs/BRAND.md) for logos and colors.

## Edit the website

| Content | File |
| --- | --- |
| All landing-page copy, portfolio links, contact links, structured data | `index.html` |
| Palette, type, layout and every shared component (daylight, black light, dark rooms, colour fields, paste-ups) | `assets/site.css` |
| Menu, year, film playback | `assets/studio-next.js` |
| Navigation bar, the lights switch (daylight or black light) and the motion switch | `assets/nav.js` |
| Shared behaviours: headline rise, process line, word lighting, diagram draw | `assets/interactions.js` |
| WebGPU koi pond hero | `assets/pond.js` |
| Work index and case studies | `work.html`, `trailgoat.html`, `purple-squirrel.html` |
| Motion showcase page | `motion.html`, `assets/motion-page.css`, `assets/motion-page.js`, `assets/motion-governor.js` |
| Motion page WebGPU pieces (shared device, one script per piece) and their fallback stills | `assets/motion-gpu.js`, `assets/gpu/*.js`; regenerate stills with `scripts/capture-gpu-posters.mjs` |
| Baked motion assets: unicorn turntable sprite sheet and shard rebuild film | `blender/bake_turntable.py`, `blender/bake_shards.py`, `blender/encode_shards.py` → `assets/motion/unicorn-*` |
| Public privacy explanation | `privacy.html` |
| Deployment URL used by the build | `site.config.json` or the `SITE_URL` environment variable |
| Vector logos and hero artwork | `assets/brand/` |
| Shared ribbon curves; regenerate with `npm run brand` | `scripts/ribbon-shapes.json` |
| Real portfolio screenshots | `assets/work/` |

The contact is **kris@caprastudios.ai**. All project pricing is intentionally quote-based; there are no invented prices, results, clients, or testimonials. Atlanta is taken from the founder's existing site.

## Validation

The build validates local asset paths, anchor targets, one H1 per page, and structured-data JSON. Tests exercise both the GitHub project subdirectory and the future custom-domain root, including canonical, sitemap, structured data, and 404 routing. Browser checks are documented in [QA](docs/QA.md).

## Reference provenance

- Design tokens adapted from `Bookee2/SkillZ`, branch `add/kb-tokyo`, `skills/kb-tokyo/assets/tokyo.css` (September 9, 2026).
- Portfolio descriptions and screenshots use the founder's actual websites: TrailGoat and Purple Squirrel. TrailGoat was rechecked and captured September 28, 2026. Purple Squirrel uses the existing product capture; its former public URL returned 404 on September 28, so no live-demo link is published.
- Capra ribbon-unicorn identity selected from concept 03. Native SVG applications and the shaded hero artwork are documented in `docs/RIBBON-ASSET.md`. The original C assets are preserved in `docs/brand-archive/cut-c/`. Portfolio pages may include their own third-party resources; screenshots represent the sites as accessed on September 9, 2026.

### Homepage

The October 1 remake replaces the dark, framed chapters with hard-edged sections: a chalk hero with the pond as a taped paste-up, one colour field per project, a dark room for the film, a ruled list of services, an orange studio band and a large contact line. GSAP and the pinned scroll stages are gone; the remaining motion is CSS plus small scripts. Motion off, reduced motion and missing JavaScript all leave every section readable.

The TrailGoat film now uses the September 29 4K render with its original music. Both the homepage and case study play it only on request. Updated posters, encoding details, and verification are recorded in the refresh scope.
