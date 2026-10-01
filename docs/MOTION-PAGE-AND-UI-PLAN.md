# Motion page and site UI: implementation plan

Handoff plan for the builder, written 1 October 2026. Read `docs/MOTION-PAGE-AND-UI-BRIEF.md` first: it holds the audit, the reasoning and the full specification. This file says what to build, in what order, and when each phase is done.

## Kickoff prompt

Paste this to start the build session:

> Read `docs/MOTION-PAGE-AND-UI-BRIEF.md` and `docs/MOTION-PAGE-AND-UI-PLAN.md` in full, then `README.md` and `docs/STUDIO-REFRESH.md`. Build the plan one phase at a time, starting with Phase 1. Each phase is its own branch and pull request. Do not start a phase until I have approved the one before it. The homepage hero (copy, pond canvas, its controls, `assets/pond.js`) must not change. Before each pull request, run `npm run check` and `npm run build`, verify the pages in the browser preview at 1440 px and 375 px wide and with reduced motion, and show me screenshots. Stop and ask me where the plan says "Kris decides".

## Starting state

- Repository: `/Users/kb/Desktop/Projects/Caprastudios`. Static site, no dependencies, Node 22. `npm run dev` serves on port 4173.
- The current hero lives on branch `glow-graffiti-tag`, which is pushed but not merged to `main`. **Branch from `glow-graffiti-tag`**, or from `main` once that branch is merged. Kris decides which.
- The brief and this plan are untracked files in `docs/`. Commit them with Phase 1.
- Study source code is outside the repository, in `~/Documents/SecondBrain/inbox/`:
  - `Motion Frontier (offline site)/source/`: `core.js` (governor), `demos-a.js` to `demos-h.js`, `bake/bake_turntable.py`, `bake/bake_fracture.py`, `assets/`.
  - `Pointer and Scroll Lab (offline site)/source/`: `fx.js`, `page.html`.
  - Copy what is needed into the repository. Never link to or load from the SecondBrain folder at runtime.
- Technique notes and known pitfalls: `~/Documents/SecondBrain/wiki/concepts/` (`WebGPU Motion Techniques`, `WebGPU Engine Gotchas`, `Pointer, Hover and Scroll Effects`, `Baking Motion Assets in Blender`).

## Rules for every phase

1. The homepage hero is untouched below the navigation bar.
2. No package dependencies. No framework. No build step beyond `scripts/build.mjs`.
3. Every page reads in full without JavaScript. One H1 per page.
4. Reduced motion, and the site's motion toggle, switch every effect off and show the finished state.
5. Animate `transform` and `opacity` only. Native scrolling and native cursor.
6. Nothing depends on hover. Every hover behaviour also applies on `:focus-visible`.
7. No invented clients, prices, results or testimonials. New copy follows the existing voice: short, concrete, two-line headlines.
8. The lab demos use TrailGoat content. Replace it with Capra content before anything ships.
9. Match the existing code style: compact CSS, small IIFE scripts with progressive enhancement.

---

## Phase 1. Navigation and interaction vocabulary

Brief: Part 3, groups A and B. Every later phase builds on this.

**Build**

- A single sticky navigation bar on all seven pages: mark, Work, Motion, AI consulting, Studio, contact button. Remove the homepage `.chapter-nav`. "Motion" points at `index.html#motion` until Phase 2 ships.
- Shy behaviour: hide on scroll down, return on scroll up, always shown at the top of the page and whenever something inside it has focus.
- A 2 px scroll progress line under the bar using `animation-timeline: scroll()`, with no fallback needed.
- A sliding highlight pill behind the hovered or focused link, resting on the current page.
- Phone: one bar with the mark and the Menu button. Keep the existing menu behaviour (Escape closes, focus returns).
- New `assets/interactions.css` with the five behaviours: drawing underline, roll-over button label, spotlight card border, image lift with caption wipe, neighbours dim.
- Apply them: text links, primary buttons, work cards, AI service cards, process steps, FAQ rows, film chapter buttons.
- Move the scroll-effects toggle to the footer as "Motion: on / off". It governs GSAP choreography and the new effects. Persist the choice in `localStorage` inside try/catch.
- Footer: add navigation links and the email address.
- `↗` only on links that leave the site or open email.

**Files**

`index.html`, `work.html`, `trailgoat.html`, `purple-squirrel.html`, `ai-consulting.html`, `privacy.html`, `404.html`, `assets/studio-next.css`, `assets/studio-next.js`, `assets/chapters.css`, `assets/chapters.js`, new `assets/interactions.css`, new `assets/nav.js` if the script grows, `scripts/build.mjs` and `package.json` for any new file.

**Watch for**

- `chapters.js` returns early if `.scroll-toggle` is missing, and uses the chapter links for `aria-current`. Rework both when the chapter nav goes.
- ScrollTrigger start offsets assume a 60 px sticky bar (`start: 'top 60px'`). Recheck them against the new bar height.
- A parent with `overflow: hidden` freezes scroll timelines. Use `overflow: clip`.

**Done when**

- One navigation bar on every page at every width, and the hero begins directly under it.
- Keyboard: the bar never hides a focused element; the pill follows focus.
- Toggle off or reduced motion: no pill slide, no shy hide, no hover animation, everything usable.
- `npm run check` and `npm run build` pass.

## Phase 2. The motion page, everywhere-compatible version

Brief: Part 2, sections 0, 2, 3, 4, 5 and 6. This phase ships a complete page that works in every browser. The WebGPU pieces come in Phase 3.

**Build**

- `motion.html` with the shared header, footer and contact block, its own H1, title, description, canonical and Open Graph tags.
- `assets/motion-page.css` and `assets/motion-governor.js`. Port the governor from the lab's `core.js`: create a piece when it nears the viewport, draw only while visible, stop when the tab is hidden, and expose one "Pause all motion" control that announces its state.
- Piece 5, the scroll turntable: bake 48 frames of the ribbon unicorn from `blender/capra-ribbon-unicorn.blend` with the lab's `bake_turntable.py`, as one 8 × 6 WebP sprite sheet. Draw on a 2D canvas from scroll progress, with drag as an alternative.
- Piece 6, assembled from shards: bake the mark's fracture with `bake_fracture.py`, replay in reverse on entering the viewport, with a replay button. WebGL2, with a poster fallback.
- Film section: the Capra unicorn film (`assets/motion/capra-unicorn-1080p.mp4`, mobile cut and posters already in the repository) and the TrailGoat film with its chapter buttons. Play on request only.
- Eight interaction tiles ported from `fx.js`, with Capra content. Scroll tiles each sit in their own framed scroller. On touch, pointer-only tiles run a scripted preview and are labelled "Best with a mouse".
- "How we use motion": the five guardrails as client promises.
- Four placeholder stages for the Phase 3 pieces, showing their poster stills and descriptions.
- Point "Motion" in the navigation at `motion.html`. Add a "See all motion" link to the homepage film section. Add view-transition names so the film poster carries across.
- Add `motion.html` to `publicPages` in `scripts/build.mjs`, new scripts to `check` in `package.json`, tests in `scripts/build.test.mjs`, and a row in the README table.

**Kris decides**

- The page's headline and intro copy. Propose three options.
- Whether Blender is available on the build machine for the two bakes. If not, stop and say so; do not substitute the lab's buckle or pane assets.

**Done when**

- With JavaScript off, every piece shows a still and a description.
- The page's initial load, before any piece starts, is under 300 KB excluding fonts.
- No horizontal overflow at 320, 375, 768, 1280 and 1440 px.
- Turntable, shards, films and all eight tiles work in Chromium, and the turntable and tiles are confirmed in Safari and Firefox.

## Phase 3. WebGPU signature pieces

Brief: Part 2, section 1. One pull request per piece, in this order.

| Order | Piece | Lab source | Capra treatment |
| --- | --- | --- | --- |
| 1 | Liquid metal mark | Demo 5 | The ribbon unicorn as a signed-distance shape in mercury; pointer moves the light. This is the page opener |
| 2 | Ink in water | Demo 3 | Tokyo palette pigments; dragging stirs |
| 3 | Letters that grow | Demo 1 | The word "capra" as the mask; a re-seed button |
| 4 | One scene, three printers | Demo 13 | A unicorn film frame through dither, halftone and ASCII |

**For each piece**

- One script file, loaded by the governor on approach. One shared `GPUDevice`.
- A poster still rendered from the piece itself, used for no JavaScript, no WebGPU, reduced motion and loading.
- Uniforms as vec4 blocks. No declared-but-unused bindings.
- Device pixel ratio capped at 2. On a phone, at most one GPU piece running.
- A text alternative on the canvas and real buttons for controls.

**Done when**

- Without WebGPU, the still shows and nothing errors.
- 60 fps while scrolling the page on the development Mac, with no more than two GPU pieces drawing at once.
- Checked in Chrome, Safari 26 and Firefox, and on a real phone.

## Phase 4. Homepage rhythm

Brief: Part 3, group C.

**Build**

- Film section goes full-bleed with the copy overlaid at the lower left and an opening mask on scroll in. This is the only opening mask on the site.
- Capability section becomes three stacking sticky cards in a block container, each with its story and its existing illustration. Remove the pinned state switch and its ScrollTrigger. Keep the three illustrations unchanged.
- Closing headline lights word by word on scroll.
- Work stage unchanged.

**Done when**

- Each capability gets about a full viewport of scroll and works on touch.
- The hero is pixel-for-pixel unchanged. Compare screenshots before and after.
- With motion off, all three capability cards are simply stacked in normal flow.

## Phase 5. Inner pages, legibility and weight

Brief: Part 3, groups D, E and F.

**Build**

- Headline rise on H1 and H2 only, once, on all inner pages.
- A drawing process line through the three steps on `work.html` and `ai-consulting.html`.
- `ai-consulting.html`: the `.intelligence-model` diagram becomes the opening visual with its path drawing once; one paragraph under "The bigger picture" lights by word.
- FAQ: the `+` rotates to `×` on open.
- Case studies: the "Next project" link becomes a full-width band with the next project's image.
- `work.html`: eyebrow numbering runs in order.
- Eyebrows and mono captions to 12 px minimum on desktop, 11 px on a phone.
- "Ask Capra" on a phone: icon-only 48 px button, hidden while scrolling down.
- `ribbon-hero.png` re-encoded as AVIF with a WebP fallback at 800 px wide, under 120 KB.
- A 1080p cut of the TrailGoat film at 8 to 12 MB as the default source, with the 4K file offered as a link.
- Remove `assets/studio.css`, `assets/studio.js` and `assets/filament.js` after confirming no `docs/` preview uses them.

**Kris decides**

- Whether to re-encode the TrailGoat film, since it changes what visitors hear and see by default.

**Done when**

- All acceptance checks in the brief pass.
- `docs/QA.md` and `docs/STUDIO-REFRESH.md` are updated with what was verified and how.

---

## Out of scope

- Any change to the hero, the pond or its controls.
- New case studies, new copy for existing sections, pricing, or testimonials.
- The other 42 lab pieces. If wanted later they go on an unlinked `lab.html`.
- Deployment, the custom domain and analytics.
- The AI assistant's behaviour, beyond the phone button in Phase 5.

## Reporting

At the end of each phase, report: what was built, what was verified and how, what was not verified, and any deviation from the brief with the reason. Include screenshots at 1440 px and 375 px.
