# Website verification

Verified September 9, 2026, in headless Chrome through Playwright on macOS. This is a targeted check, not a claim of formal accessibility certification or guaranteed search ranking.

## Browser checks

- 1280×800 desktop, 768×1024 tablet, 390×844 phone, and 320×740 narrow phone.
- No horizontal page overflow at those sizes.
- No page JavaScript exceptions.
- The local hero artwork and all three portfolio screenshots load successfully.
- One H1, valid section anchors, and live external portfolio destinations.
- Desktop menu button hidden; mobile menu opens, closes after selecting a section, and closes on Escape with focus restored to its trigger.
- Native FAQ disclosures open and close using browser controls.
- Reduced-motion mode keeps every section visible, disables animated effects, and hides the replay control.
- Normal motion reveals the ribbon and settles; replay disables while running and re-enables on completion. Changing the motion preference while on the page also works.
- No-JavaScript phone visit retains the hero, contact CTA, header contact link, and usable FAQ.
- Desktop/phone screenshots were reviewed for the hero, motion stage, portfolio, studio, services, and contact.
- Contact links were inspected as `mailto:` links; no test email was sent.

## Build checks

`npm run check` verifies deployment URL validation and complete builds for both:

- `https://bookee2.github.io/Caprastudios/`
- `https://caprastudios.ai/`

The build checks relative assets, section anchors, JSON structured data, and H1 count. Tests also verify consistent canonical URLs, structured-data URLs, sitemap URLs, and 404 home links, and ensure only the public file allowlist is emitted.

`npm run build` produces the static `dist/` artifact. There are no runtime or build package dependencies.

## Launch-dependent verification

After merging and deploying, check the actual public URL, HTTPS, default and custom domain redirects, and Search Console ownership. Domain registration, email delivery, and production DNS cannot be tested until configured. These are launch operations, not features simulated by the site.

## Motion page and UI refresh — October 1, 2026

Checked in the Chromium preview pane at 1440×900 and 375×812, and in headless Google Chrome through Playwright.

- `npm run check` and `npm run build` pass after every phase; `motion.html` is in the sitemap and both URL layouts.
- No horizontal overflow at 1440 and 375 px on the homepage, work, AI consulting, case studies and motion page.
- Navigation: one bar on every page, hide on scroll down and return on scroll up, current-link tracking on the homepage, phone menu opens as a solid panel. The footer motion switch persists and turns off GSAP choreography, hover motion and the shy bar.
- Homepage hero: element boxes for the header, hero, H1, intro, actions, pond stage, controls and work chapter measure identically before and after the homepage changes.
- Motion page: turntable spin, drag and slider; shard film plays when half visible and offers a replay; eight tiles; page pause rests every piece. WebGPU pieces start without shader or validation errors, and with `navigator.gpu` removed every piece keeps its still with a note and no page errors.
- Homepage stack: card positions measured at three scroll depths, last card dwells, the diagram draws on arrival; phones get the cards in normal flow.
- Inner pages: headline rise, process line progress and reached steps, word lighting, diagram draw, next-project band, 12 px label floor.
- Hover states at desktop size were checked by mirroring the `:hover` rules onto a test class, because the preview pane is narrower than 1440 px.

Not verified: real-mouse hover at desktop size, Safari 26, Firefox (no scroll-driven animations yet, so the film opening and progress line are absent there), a physical phone, frame-rate measurement, and a screen reader pass.
