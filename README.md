# Capra Studios

An independent web design and AI development studio for small businesses, operated by Capra, LLC.

Built around the `/kb-tokyo` design philosophy: Tokyo Night, Red Hat typography, neutral controls, precise borders, a single solid accent CTA, and motion with a purpose. Capra's cut-C monogram, oversized editorial typography, and full-width brand study give the studio its own identity.

## Run it

Requires Node.js 22 or later. There are **no package dependencies** and no installation step.

```sh
npm run dev    # http://127.0.0.1:4173
npm run check  # link, metadata and deployment configuration tests
npm run build  # public website in dist/
```

The website itself is ordinary HTML, CSS and JavaScript. All important content, the portfolio, FAQ, and contact links work without JavaScript. Google Fonts is the only external request on the landing page; portfolio screenshots are stored locally.

## Launch on GitHub Pages

1. Review and merge the website pull request.
2. In **Settings → Pages → Build and deployment**, set **Source** to **GitHub Actions** if it is not already configured.
3. The included workflow checks, builds, and publishes on a push to `main`. Pull requests run validation without deploying.
4. The initial address is `https://bookee2.github.io/Caprastudios/`. A manual workflow run from `main` can also publish.

Only `dist/` is uploaded. Source, docs, tests, and repository internals are not included in the public website artifact.

See [the launch guide](docs/LAUNCH.md) for the custom domain, contact details, and search setup. See [the animation handoff](docs/ANIMATION.md) for the future Blender sequence and [the brand guide](docs/BRAND.md) for logos and colors.

## Edit the website

| Content | File |
| --- | --- |
| All landing-page copy, portfolio links, contact links, structured data | `index.html` |
| Shared Tokyo Night tokens | `assets/tokens.css` |
| Layout, responsive rules, motion, hover states | `assets/studio.css` |
| Menu, reveals, brand-study replay | `assets/studio.js` |
| Public privacy explanation | `privacy.html` |
| Deployment URL used by the build | `site.config.json` or the `SITE_URL` environment variable |
| Vector logos | `assets/brand/` |
| Real portfolio screenshots | `assets/work/` |

The provisional contact is **kris@caprahr.com**, the existing public email on Capra HR. All project pricing is intentionally quote-based; there are no invented prices, results, clients, or testimonials. Atlanta is taken from the founder's existing site. Confirm these before launching.

## Validation

The build validates local asset paths, anchor targets, one H1 per page, and structured-data JSON. Tests exercise both the GitHub project subdirectory and the future custom-domain root, including canonical, sitemap, structured data, and 404 routing. Browser checks are documented in [QA](docs/QA.md).

## Reference provenance

- Design tokens adapted from `Bookee2/SkillZ`, branch `add/kb-tokyo`, `skills/kb-tokyo/assets/tokyo.css` (September 9, 2026).
- Portfolio descriptions and screenshots use the founder's actual websites: [TrailGoat](https://trailgoat.run), [Purple Squirrel](https://purplesquirrel.icu), [Capra HR](https://caprahr.com).
- Custom Capra monogram and layout created for this project. Portfolio pages may include their own third-party resources; screenshots represent the sites as accessed on September 9, 2026.
