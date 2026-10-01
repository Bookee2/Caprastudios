# Motion page and site UI: audit and build brief

Written 1 October 2026 from a live walk of the local site (1440×900 and 375×812, Chromium) and the motion studies in the second brain. This is a brief for the builder. Nothing here has been implemented.

## Fixed constraints

- **The homepage hero stays as it is**: the copy, the koi pond canvas, its palette and pause controls, `assets/pond.js`. Only the navigation above it changes.
- No package dependencies, no framework. Plain HTML, CSS and JS, built by `scripts/build.mjs`.
- All content readable without JavaScript. One H1 per page. No invented clients, prices, results or testimonials.
- Tokyo Night tokens (`assets/tokens.css`) and Red Hat type. One accent on duty.
- Capra HR and the Atlanta flyover stay out of the public build.
- Motion guardrails from the studies apply everywhere:
  1. Hover is an extra, never the only way to reach something.
  2. Keep native scrolling and the native cursor.
  3. Animate only `transform` and `opacity`.
  4. Reduced motion means the effect is off and the finished frame is shown.
  5. One signature per view, everything else quiet. No fade-up on every block, no cursor trails, no scroll-jacking.

## Source material

| What | Where |
| --- | --- |
| Motion Frontier, 28 WebGPU and Blender-baked demos | `~/Documents/SecondBrain/inbox/Motion Frontier (offline site)/source/` (`core.js` is the shared-device governor, `demos-a.js` to `demos-h.js`, `bake/` Blender scripts, `assets/`) |
| Pointer and Scroll Lab, 29 pointer, hover and scroll effects | `~/Documents/SecondBrain/inbox/Pointer and Scroll Lab (offline site)/source/` (`fx.js`, `page.html`) |
| Technique notes, pitfalls and verdicts | `~/Documents/SecondBrain/wiki/concepts/` (`WebGPU Motion Techniques`, `Pointer, Hover and Scroll Effects`, `Web Motion Techniques`, `Baking Motion Assets in Blender`) |
| Capra ribbon unicorn scene for new bakes | `blender/capra-ribbon-unicorn.blend` |

Two caveats carry over from the studies. Both labs were checked in one Chromium pane only: never on Safari, Firefox, a phone or with a screen reader. And their demo content is written in TrailGoat's world (race names, aid stations), so every piece needs Capra content before it ships.

---

## Part 1. Audit findings

Ordered by how much each one hurts the visitor.

### 1. The homepage has two navigation bars that disagree

`index.html` renders the site header (110 px, not sticky) and directly under it the sticky chapter nav (62 px). That is 172 px of navigation before the hero at 1440×900, and both bars also show on a phone.

- The header says Work, AI consulting, Expertise, Studio, Start a conversation. The chapter nav says Work, Motion, Expertise, Let's talk.
- "Work" in the header opens `work.html`. "Work" in the chapter nav scrolls to `#work`. Same word, two destinations, 60 px apart.
- "Motion" exists only in the chapter nav, as an anchor to the film section. The inner pages have no route to motion at all.
- Inner pages use the header only and it scrolls away, so there is no persistent navigation off the homepage.

### 2. The inner pages feel like a different site

The homepage has scroll choreography, a 3D stage, a film and the pond. `work.html`, `trailgoat.html`, `purple-squirrel.html` and `ai-consulting.html` load only `studio-next.js` and have no motion beyond one hover nudge. `ai-consulting.html` is about 4,400 px of text with no image or diagram, although the homepage already has a finished illustration of exactly this service (the `.intelligence-model` network diagram).

### 3. Every homepage section is the same framed panel

Work, motion, capability and closing are each a large rounded bordered stage with an eyebrow row above it. Four in a row reads as one repeated template. Nothing breaks the frame, so nothing feels like a peak.

### 4. The capability section moves too fast to read

The pinned capability stage switches between Design, Build and Connect across 750 px of scroll at 1440×900 (ScrollTrigger `capra-capabilities`, 3367 to 4117). That is 250 px per state, about one flick of a trackpad, so Build is easy to skip entirely. It is also `pointer:fine` and desktop only, so touch visitors get buttons and no motion.

### 5. Hover and focus feedback is thin for a studio selling interaction

There are nine `:hover` rules across the whole site. Buttons brighten by 10%, links change colour. Cards, switches, the FAQ rows and the film chapter buttons have no response that suggests craft. The homepage copy promises care "to the smallest interaction".

### 6. Small type is too small

Eyebrows compute to 10 px and mono captions to 11 px on desktop, in the muted ink. Captions such as "01 / Built for the trail" and "An illustration of what we can build together" are hard to read.

### 7. Weight

- `assets/brand/ribbon-hero.png` is 1.37 MB and is used twice on the homepage at about 400 px wide.
- `assets/motion/trailgoat-brand-film.mp4` is 70.6 MB. It is `preload="none"`, so it does not cost on load, but pressing play on a phone connection starts a 70 MB download.
- `assets/studio.css`, `assets/studio.js` and `assets/filament.js` are referenced by no page.

### 8. Smaller issues

- The "Ask Capra" button covers body copy at the bottom right on a phone (it overlaps the TrailGoat description at 375 px).
- The footer has no navigation: brand, a tagline, back to top and privacy only.
- Section numbering drifts. The homepage runs 01 to 04. `work.html` shows 01 and 02 on the cards, an unnumbered film section, then "04 / Working together".
- `↗` appears 15 times on the homepage, on internal anchors and external links alike, so it no longer signals anything.
- The finished Capra unicorn film (`assets/motion/capra-unicorn-1080p.mp4` and its mobile cut and posters) is not used on any page.

### What already works and should be kept

The hero. The editorial headline scale and two-tone headings. The work stage's 3D handoff between projects. The film chapter buttons. Cross-document view transitions on project images. The scroll-effects toggle and reduced-motion handling. No-JS readability.

---

## Part 2. The motion page (`motion.html`)

### Position

A curated showcase for a prospective client, not the lab. The studies hold 57 pieces; the page shows about fifteen, each tied to something a client could buy. The test for every piece: can a small-business owner see where it would live on their own site?

### Structure

**0. Opener.** One H1 in the house style (two short lines, second line in the accent tone). A one-sentence intro. A page-level "Pause all motion" control, in the same style as the pond's pause button. The opener's visual is piece 1 below.

**1. Signature pieces (live, WebGPU).** Four large stages, one per screen, each with a title, one sentence on what it is, one line "Where it fits", and its own controls where it has any.

| # | Piece | Lab source | Capra treatment | Why it earns a place |
| --- | --- | --- | --- | --- |
| 1 | Liquid metal mark | Demo 5, SDF raymarching | The ribbon unicorn pulled out of mercury; pointer moves the light | The lab already names this as a Capra hero. It reads as "identity", and it is distinct from the pond |
| 2 | Letters that grow | Demo 1, reaction-diffusion in a text mask | The word "capra" grows as coral; a button re-seeds | Shows type as a living thing: logo stings, loaders |
| 3 | Ink in water | Demo 3, stable fluids | Three pigments from the Tokyo palette; dragging stirs | The most satisfying thing to touch, and a cousin of the pond |
| 4 | One scene, three printers | Demo 13, dither, halftone, ASCII | The unicorn film frame through each filter, with a three-way switch | Shows one asset restyled for print, poster and terminal: a brand-system idea |

**2. Baked in Blender (runs everywhere).** Two pieces that need no GPU or only WebGL2, so phones and Firefox get the real thing.

| # | Piece | Lab source | Capra treatment |
| --- | --- | --- | --- |
| 5 | Turn it by scrolling | Demo 21, 48-frame sprite sheet on a 2D canvas | A turntable of the ribbon unicorn rendered from `blender/capra-ribbon-unicorn.blend` with the lab's `bake_turntable.py`. Scroll or drag to turn |
| 6 | Assembled from shards | Demo 20, rigid-body fracture replay | The mark rebuilding from 150 shards, played in reverse on entering the viewport, with a replay button. Needs a new bake with `bake_fracture.py` |

**3. Film.** The two finished films side by side: the Capra unicorn film (currently unused) and the TrailGoat brand film with its three chapter buttons. Both play on request only, as now.

**4. Motion you drive.** A grid of eight small live tiles from the Pointer and Scroll Lab, all rated "ship" there. Each tile has a name and a one-line use.

| Tile | Lab # | Shown as |
| --- | --- | --- |
| Spotlight cards | 3 | Three service cards whose border lights under the pointer |
| Flashlight reveal | 5 | Wireframe on top, finished design underneath |
| List with floating preview | 9 | A project list with a preview that follows the pointer |
| Roll-over label | 13 | A button whose letters roll |
| Direction-aware fill | 15 | A tile that fills from the edge you entered |
| Words that light up | 24 | One sentence lit by scroll progress |
| Route that draws itself | 26 | A three-step process line with a moving marker |
| Rows on springs | Frontier 25 | A list that re-sorts with spring FLIP |

Scroll-driven tiles sit in their own framed scroller, as the lab does, so they can be tried without leaving the grid. On touch, pointer-only tiles show a short looping preview driven by script and say "Best with a mouse".

**5. How we use motion.** The five guardrails rewritten as promises to a client, three or four words each with one sentence. This is the section that separates the studio from a template.

**6. Contact.** The existing shared CTA block.

### Left out on purpose

Path tracer, Gaussian splats, radiance cascades, MLS-MPM fluid, Lenia, particle life, physarum, HDR canvas, datamosh, audio rings, feedback tunnel, aurora, meadow, cloth and G-buffer relight. They are impressive engineering, but a client cannot map them to a need, several require compute shaders, and fifteen GPU canvases on one page is the opposite of "one signature". If wanted later, they can go on an unlinked `lab.html`.

### Engineering contract

- **One governor.** Port `core.js` from the Motion Frontier source: one `GPUDevice` shared by all canvases; a piece is created when it nears the viewport, drawn only while visible, and stopped when the tab is hidden.
- **Lazy code.** One script per piece, injected on approach. The initial page load, before any piece starts, stays under 300 KB excluding fonts.
- **Every piece has a still.** A poster image is in the HTML. It is what shows without JavaScript, without WebGPU (Firefox on Linux and Android, older Safari), under reduced motion, and while the piece loads. Reserve the canvas box so nothing shifts.
- **Reduced motion and the pause control** both show the finished frame and remove pointer response. The pause state is announced through a live region, as the pond does.
- **Phones.** Cap device pixel ratio at 2. At most one GPU piece running at a time. Pieces 5 and 6 and the films are the phone's main experience.
- **Accessibility.** Each canvas has a text alternative describing what it shows. Every control is a real button with a visible focus ring. Nothing depends on hover.
- **Uniforms as vec4 blocks** and no declared-but-unused bindings, per the WebGPU gotchas note.
- **Build.** Add `motion.html` to `publicPages` in `scripts/build.mjs`, add new scripts to the `check` script in `package.json`, extend `scripts/build.test.mjs`, and add the page to the README table.
- **View transition.** Name the homepage film poster and the motion page's film so the image carries across, as project images do now.

### Navigation change that comes with it

"Motion" in the main navigation opens `motion.html` on every page. The homepage film section stays as a teaser and gains a "See all motion" link.

---

## Part 3. Site UI, flow and feel

Grouped so each group can be built and reviewed on its own. P1 items change how the site feels most.

### A. One navigation bar (P1)

- Merge the header and the chapter nav into a single sticky bar on every page: mark, Work, Motion, AI consulting, Studio, and the contact button. Drop "Expertise" as a nav item; it is a homepage section, reachable by scrolling and from the footer.
- **Shy header** (lab 20): hides on scroll down, returns on scroll up, always present at the top and when focused.
- **Progress bar** (lab 20): a 2 px accent line under the bar driven by `animation-timeline: scroll()`. Browsers without it show no bar.
- **Sliding highlight** (lab 18): one pill moves between links on hover and focus, and rests on the current page.
- The scroll-effects toggle moves into the footer next to Privacy, renamed "Motion: on / off", and also governs the new hover and reveal effects.
- Phone: one bar with the mark and Menu. The second strip goes.

### B. A hover and focus vocabulary (P1)

Define five behaviours once in a new `assets/interactions.css` and use them everywhere. Every one applies on `:focus-visible` as well as `:hover`, and sits inside `@media (hover:hover)` where it would stick on touch.

| Element | Behaviour | Lab # |
| --- | --- | --- |
| Text links | Underline draws in from the left, out to the right | 12 |
| Primary button | Roll-over label; arrow nudges 3 px | 13 |
| Cards (work cards, AI service cards, process steps) | Spotlight border under the pointer | 3 |
| Work images | Image lifts inside a clipped frame, caption wipes in | 19 |
| Sets of siblings (nav links, FAQ rows, film chapters) | Hovered item stays, neighbours dim, via `:has()` | 16 |

Also: keep `↗` for links that leave the site or open the email app. Internal anchors use `↓` or no arrow.

### C. Homepage rhythm (P1)

- **Break the frame once.** Make the film section full-bleed: the video spans the viewport width with the copy overlaid at the lower left, and it opens with a mask as it scrolls in (lab 27, "opening mask", used once on the site). The other three sections keep their frames, so the film becomes the peak.
- **Capability section as stacking cards** (lab 22). Replace the pinned state switch with three sticky cards, each holding its story and its illustration, each covering the last and scaling the covered one back. It needs no script state, works on touch, and gives each capability a full viewport of scroll. Per the lab note, the cards need a block container, not a grid. The three existing illustrations are reused unchanged.
- **Closing headline:** light "Let's make an impression." word by word on scroll (lab 24). This is the only use of that effect on the page.
- Leave the work stage as it is.

### D. Bring the inner pages up to the homepage (P2)

- **Headline rise** (lab 29): the H1 and each H2 rise once out of a clipped line on first view. Headlines only, never paragraphs or cards.
- **Process steps** on `work.html` (Define, Create, Refine) and `ai-consulting.html` (Discover, Prove, Operate): a line draws through the three steps with scroll progress and a marker rides it (lab 26).
- **AI consulting gets its picture.** Move the `.intelligence-model` diagram into the page's opening as the hero visual, with its network path drawing once on load. Under "The bigger picture", light the first paragraph word by word.
- **FAQ rows:** neighbour dimming from group B, and the `+` rotates to `×` on open.
- **Case studies:** the "Next project" link becomes a full-width band with the next project's image using the image-lift behaviour, so the view transition has something to land on.
- Renumber `work.html` eyebrows so they run in order, or drop the numbers there.

### E. Legibility and polish (P2)

- Eyebrows and mono captions: 12 px minimum on desktop, 11 px minimum on a phone, and one step brighter than `--faint` where they sit on a panel.
- "Ask Capra": on a phone, collapse to an icon-only 48 px button and hide it while scrolling down. Add bottom padding to the last block of each section so it never covers text at rest.
- Footer: add the navigation links, the email address, and the motion toggle.

### F. Weight and housekeeping (P3)

- Re-encode `ribbon-hero.png` as AVIF with a WebP fallback at 800 px wide. Target under 120 KB.
- Encode a 1080p cut of the TrailGoat film at about 8 to 12 MB and serve it by default; offer the 4K file as a link for those who want it.
- Remove `assets/studio.css`, `assets/studio.js` and `assets/filament.js` after confirming nothing in `docs/` previews depends on them.
- Since most scroll work moves to CSS scroll-driven animation and `position: sticky`, check whether GSAP is still needed for anything beyond the work stage. If not, keep it scoped to the homepage as now.

---

## Suggested build order

1. Group A and B: the navigation and the interaction vocabulary. Every later step uses them.
2. `motion.html` with the governor, the two baked pieces, the films and the eight tiles. This version works in every browser.
3. The four WebGPU signature pieces, one at a time, each with its still.
4. Group C on the homepage.
5. Groups D, E and F.

## Acceptance checks

- `npm run check` and `npm run build` pass; `motion.html` is in the sitemap.
- No horizontal overflow at 320, 375, 768, 1280 and 1440 px wide.
- With JavaScript off: every page reads in full, the motion page shows a still and a description for every piece.
- With reduced motion: no animation anywhere, every piece shows its finished frame, nothing is hidden.
- Without WebGPU: stills for pieces 1 to 4, everything else live.
- Keyboard only: every control reachable, focus always visible, the shy header never hides the focused element.
- Tested in Safari, Firefox and on a real phone, since the studies were not.
- The homepage hero is pixel-for-pixel unchanged below the navigation bar.
- The motion page holds 60 fps while scrolling on the development Mac, with no more than two GPU pieces drawing at once.
