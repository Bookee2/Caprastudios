# Capra Studios

An independent design and web studio in Atlanta: websites, web applications, 3D motion, and AI consulting. Operated by Capra, LLC.

Built around the `/kb-tokyo` design philosophy: Tokyo Night, Red Hat typography, neutral controls, precise borders, a clear accent CTA, and motion with a purpose. Capra's ribbon unicorn, oversized editorial typography, and interactive koi pond hero give the studio its own identity.

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
| Shared Tokyo Night tokens | `assets/tokens.css` |
| Layout, responsive rules, motion, hover states | `assets/studio-next.css` |
| Navigation, supporting loops, media behavior | `assets/studio-next.js` |
| WebGPU koi pond hero | `assets/pond.js` |
| Work index and case studies | `work.html`, `trailgoat.html`, `purple-squirrel.html` |
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

### Homepage scroll chapters

The current homepage follows the user's September 28 critique: the rejected ribbon bridge is removed, and the approved two-project stage anchors a consistent family of framed, layered scenes. The film has three chapter controls; Design, Build, and Connect share an illustrated capability stage; studio and contact share a signature composition. Desktop scrolling drives the work and capability stages. Smaller/touch layouts use normal flow and direct capability buttons. Scroll-effects off and reduced motion preserve usable content, and missing JavaScript leaves all service descriptions readable.

GSAP/ScrollTrigger is self-hosted. Supported browsers also transition images between real project pages. Detailed process and FAQs remain on the work page. See `docs/STUDIO-REFRESH.md` for the current scope and verification; rejected first-pass source snapshots are preserved under `docs/capra-motion-study/archive-scroll-v1/` and excluded from deployment.

The TrailGoat film now uses the September 29 4K render with its original music. Both the homepage and case study play it only on request. Updated posters, encoding details, and verification are recorded in the refresh scope.
