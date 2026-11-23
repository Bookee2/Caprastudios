# Capra Studios

An independent land marketing studio in Atlanta: marketing films for land listings, funds and planned projects. Operated by Capra, LLC.

One wall, two lights: a chalk page with flat paint colours taken from the koi pond's palettes, and a black light switch that turns the wall dark and makes the paint glow. Red Hat typography, the ribbon unicorn, hand-tagged notes, and the interactive koi pond hero give the studio its own identity. The direction and its reasoning are in `docs/SITE-CHARACTER-AUDIT.html`.

Since November 23, 2026 the site sells one thing: land marketing films. Every page follows the lights switch: a chalk wall in daylight, dark with lime when the lights are off. Film frames sit in plates and a silent reel plays in a frame, never behind the words. Do not wrap a whole page in `.room`: a room stays dark in both lights, so the switch would have nothing to change. The AI systems, web apps, work and demo pages are retired and forward to the pages that replaced them. Every film or frame on the site comes from a master at 1080p or better. The rules are in [the brand guide](docs/BRAND.md).

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
4. The site is served at `https://caprastudios.co/` (set in `site.config.json`); the GitHub project address `https://bookee2.github.io/Caprastudios/` redirects there. A manual workflow run from `main` can also publish.

Only `dist/` is uploaded. Source, docs, tests, and repository internals are not included in the public website artifact.

The September 28 implementation and retirement decisions are recorded in [the refresh scope](docs/STUDIO-REFRESH.md). The new site is locally implemented, not deployed. Capra HR and the Atlanta flythrough are excluded from the public portfolio and build; source assets remain preserved. New Unreal production is deferred until the shared workspace is available.

See [the launch guide](docs/LAUNCH.md) for the custom domain, contact details, and search setup. See [the animation handoff](docs/ANIMATION.md) for current film delivery and the earlier Blender sequence and [the brand guide](docs/BRAND.md) for logos and colors.

## Edit the website

| Content | File |
| --- | --- |
| Homepage: the reel, what a film is for, a film in order, what comes with it, the three films, what a drone can't show, kinds of land, how it works, prices, structured data | `index.html`, `assets/reel.js` |
| The films: two films in full, the planned project frame by frame, sources, prices, questions | `land-films.html`, `assets/films/` |
| About: how the studio works, the software it also builds, the lab | `about.html` |
| The plain facts page (what we make, prices, proof). Keep it in step with the other pages | `facts.html` |
| Contact page and its brief form | `contact.html`, `assets/contact.js` |
| Palette, type, layout and every shared component (daylight, black light, dark rooms, colour fields, paste-ups) | `assets/site.css` |
| Menu, year, film playback | `assets/studio-next.js` |
| Navigation bar, the lights switch (daylight or black light) and the motion switch | `assets/nav.js` |
| Shared behaviours: headline rise, process line, word lighting, diagram draw | `assets/interactions.js` |
| WebGPU koi pond hero | `assets/pond.js` |
| TrailGoat case study (linked from About) | `trailgoat.html` |
| Motion lab (linked from About) | `motion-lab.html`, `assets/motion-page.css`, `assets/motion-page.js`, `assets/motion-governor.js` |
| Motion page WebGPU pieces (shared device, one script per piece) and their fallback stills | `assets/motion-gpu.js`, `assets/gpu/*.js`; regenerate stills with `scripts/capture-gpu-posters.mjs` |
| Baked motion assets: unicorn turntable sprite sheet and shard rebuild film | `blender/bake_turntable.py`, `blender/bake_shards.py`, `blender/encode_shards.py` → `assets/motion/unicorn-*` |
| Public privacy explanation | `privacy.html` |
| Deployment URL used by the build | `site.config.json` or the `SITE_URL` environment variable |
| Vector logos and hero artwork | `assets/brand/` |
| Shared ribbon curves; regenerate with `npm run brand` | `scripts/ribbon-shapes.json` |
| Real portfolio screenshots | `assets/work/` |
| Link-preview cards, 1200 × 627, one per page | `assets/share/` |
| The published page list and retired addresses that forward | `publicPages` and `redirects` in `scripts/build.mjs` |
| What the site assistant knows. After a change, set `knowledgeVersion` there and `KNOWLEDGE` in `assets/agent.js` to the same new date, then redeploy the Worker from `server/` (`npx wrangler deploy`); until then the site shows its prepared answers | `server/knowledge.mjs` |

The contact is **info@caprastudios.co**. The one published price is a film of a single lot, on the homepage, the films page and the facts page; everything else is quoted. There are no invented results, clients, or testimonials, and no client is named: the films on the site are studio pieces and say so. TrailGoat and Purple Squirrel are Capra's own products and are described that way. Kris's phone number is never published; a test enforces it. Atlanta is taken from the founder's existing site.

## Validation

The build validates local asset paths, anchor targets, one H1 per page, and structured-data JSON. Every indexable page must also pass the SEO standard in `scripts/seo.mjs` (see `docs/SEO-STANDARD.md`). Tests exercise both the GitHub project subdirectory and the custom-domain root, including canonical, sitemap, structured data, 404 routing, the forwarding page for a retired address, and that the Marketing Room is no longer published. Browser checks are documented in [QA](docs/QA.md).

## Reference provenance

- Design tokens adapted from `Bookee2/SkillZ`, branch `add/kb-tokyo`, `skills/kb-tokyo/assets/tokyo.css` (September 9, 2026).
- Portfolio descriptions and screenshots use the founder's actual websites: TrailGoat and Purple Squirrel. TrailGoat was rechecked and captured September 28, 2026. Purple Squirrel was recaptured from purplesquirrel.icu on October 5, 2026, after its public site was rebuilt; the case study links to it.
- Capra ribbon-unicorn identity selected from concept 03. Native SVG applications and the shaded hero artwork are documented in `docs/RIBBON-ASSET.md`. The original C assets are preserved in `docs/brand-archive/cut-c/`. Portfolio pages may include their own third-party resources; screenshots represent the sites as accessed on September 9, 2026.

### Homepage

The October 1 remake replaces the dark, framed chapters with hard-edged sections: a chalk hero with the pond as a taped paste-up, one colour field per project, a dark room for the film, a ruled list of services, an orange studio band and a large contact line. GSAP and the pinned scroll stages are gone; the remaining motion is CSS plus small scripts. Motion off, reduced motion and missing JavaScript all leave every section readable.

The TrailGoat film now uses the September 29 4K render with its original music. Both the homepage and case study play it only on request. Updated posters, encoding details, and verification are recorded in the refresh scope.

## Marketing Room (retired from the site)

The Marketing Room was published at `/marketing/` until November 2026. It is no longer built, linked or listed in the sitemap, and a rebuild removes an older copy from `dist/`. The `marketing/` folder stays in the repository: the land film pipeline loads its fonts from `marketing/brand/fonts`, and the exports remain the studio's own asset library. `npm run dev` still serves the folder locally. See [Marketing Room delivery](docs/MARKETING-ROOM.md) for provenance.

## Retired pages

GitHub Pages has no server redirects, so the build writes a small `noindex` page at each retired address that forwards to its successor. `motion.html`, `ai-consulting.html`, `web-apps.html` and `market-pulse.html` forward to the homepage, `work.html` to the films page and `purple-squirrel.html` to About. Add any other retired address to `redirects` in `scripts/build.mjs`; an empty target is the homepage.

The demo scripts in `assets/demos/` are no longer used by any page. They still ship and are still syntax-checked; removing them means changing the `check` script in `package.json` and two assertions in `scripts/build.test.mjs`.
