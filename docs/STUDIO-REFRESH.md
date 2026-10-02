# Studio refresh — September 28, 2026

Current authorization: build the design and web studio website around the approved colorful filament direction. Remove Capra HR and the Atlanta flythrough from the public portfolio. New 3D work will be created later; do not connect to Unreal/MCP during this pass. No publication requested.

## Acceptance

- AC-1: Homepage presents design, websites, web applications, and 3D motion with work-first copy. No AI-first/adoption/training positioning.
- AC-2: Approved filament hero works with keyboard-accessible palette, light wave, and pause controls; reduced-motion and no-WebGL/no-JS fallbacks remain useful.
- AC-3: Selected work and case studies feature TrailGoat and Purple Squirrel, labeled founder-built; TrailGoat's supplied film supplies current motion evidence. No invented clients, awards, outcomes, or claims of being Atlanta's best.
- AC-4: Remove Capra HR and Atlanta flythrough from public navigation, copy, portfolio, and new build assets. Preserve source assets in the repository.
- AC-5: Complete home, work index, two case studies, contact path, and privacy navigation. Useful copy is static HTML. Mobile navigation, relevant media and small loops respect keyboard and reduced motion.
- AC-6: Inspect desktop, tablet, and phone renders; run build checks for default and custom-domain URL layouts, local links, case pages, and retired asset exclusion.

## Boundaries

No deployment, external messages, new Unreal connection, speculative work thumbnails, invented case-study results, or new infrastructure. Keep source assets and approved study pages recoverable. Tomorrow's new film is a later production task, not a placeholder sold as existing work.

## Verification and current state

Implemented locally on `codex/studio-next-chapter`; preview at http://127.0.0.1:4177/. No commit, push, merge, or deployment.

- Homepage, work index, two individual case studies, and shared privacy navigation are implemented. AI-first and adoption/training copy is removed from the new public pages and metadata.
- TrailGoat public website verified and captured September 28. Its supplied 19.97-second film was encoded to H.264 with fast-start, about 5.4 MiB; original media remains preserved. The pacing-story capture is a real moment from the public product site.
- Purple Squirrel’s previous public URL returned HTTP 404. Its existing product screenshot and case study remain; the broken external demo CTA was omitted. User asked asynchronously whether a newer URL exists. No replacement address is invented.
- Desktop 1440, tablet 768, and phone 390/320 renders inspected; no horizontal overflow or page exceptions in the exercised paths. Red Hat font loading confirmed.
- Mobile menu open/close, Escape focus return, keyboard controls, case navigation, FAQ expansion, service-loop pause/resume and live reduced motion checked. No-JavaScript navigation and no-WebGL fallback inspected. Filament pause/reduced-motion/context-loss behavior was verified in the preceding study; production integration checked below.
- TrailGoat film playback, decoding, seeking to 16 seconds, and HTTP 206 byte-range delivery verified locally.
- Build tests pass for both GitHub Pages subdirectory and custom domain, including every new case canonical/sitemap entry and retired media removal from a pre-existing output.

Remaining limits: physical-phone GPU performance, Safari and Firefox behavior, and full new 3D production are not verified or completed in this pass. Source references to older positioning/work in historical planning documents are retained as history and superseded by this decision.

Final integration pass: the production homepage also passed draw-count pause checks, keyboard palette selection, light-wave triggering, live reduced-motion switching, and simulated WebGL context loss. A blocked video request produces the visible media error fallback. The updated privacy layout and final hero were visually inspected. `npm run check`, `npm run build`, and `git diff --check` passed.

## Subsequent direction — AI consulting

The user explicitly added AI consulting, chat agents, RAG knowledge systems, customer service agents and business-wide AI operating approaches. This supersedes AC-1 only insofar as it excluded AI service positioning; the site remains work-first rather than AI-first. The website assistant must explain services, use studio knowledge and qualify/capture leads. User selected Anthropic Opus 5.0 (`claude-opus-5`). See `docs/AI-ASSISTANT.md` for implementation, configuration and verification.

## Approved scroll choreography — September 28, 2026

The user approved `docs/capra-motion-study/scroll-research.html` and asked to build it. This supersedes the original homepage's repeated vertical section structure. Implemented locally; publication remains outside this request.

### Acceptance and implementation

- SC-1: Natural vertical scrolling connects the filament hero and a colorful SVG ribbon to a diagonal first-project reveal. The WebGL renderer receives explicit progress; its idle motion, palette, pause, visibility, and fallback behavior remain separate.
- SC-2: On fine-pointer desktops at least 1000×720, one bounded sticky stage transitions between TrailGoat and Purple Squirrel. Buttons jump directly to either project, and only the current project's links are interactive. Project text stays readable during the media wipe.
- SC-3: The existing film expands within its reserved layout as it enters view. Playback stays user controlled. The AI diagram's nodes and connectors build with scrolling; business claims and assistant behavior are unchanged.
- SC-4: The sticky chapter navigation reaches Work, Motion, Expertise, and Contact. A scroll-effects toggle or reduced-motion preference restores normal flow, both projects, and complete diagrams. Small/touch layouts have no pinned project sequence. Script/dependency failure leaves the entire HTML page useful.
- SC-5: The homepage drops the separate intro, condenses the service cards, and moves detailed process/FAQs to `work.html#working-together`. Existing source studies remain intact. The contact path, AI consulting page, and assistant remain available.
- SC-6: Same-origin project links use native image View Transitions where supported, with ordinary navigation otherwise and no transition under reduced motion.

Files: `assets/chapters.css`, `assets/chapters.js`, `assets/page-transitions.css`, and the existing filament renderer; homepage markup and the three work pages. GSAP/ScrollTrigger 3.15.0 are self-hosted unmodified distribution files under `assets/vendor/`, with original license headers and license URL retained. No package installation or runtime CDN is required.

Boundaries: no new 3D film/model, no Unreal connection, no provider/model changes, no deployment. Retired portfolio work remains retired. The short color wipe is SVG/CSS choreography, not a newly rendered 3D unicorn transformation.

### Scroll verification

- Chrome desktop 1440×900, 1280×720, and 1000×720; tablet 820×900; phone layouts 390×844 and 320×740. Rendered the major scenes and inspected desktop/phone screenshots; no horizontal overflow in these sizes. Red Hat fonts loaded.
- Forward and reverse project scrolling; pointer navigation to both case studies; keyboard project switching and focus into the active project; scroll-effects off/on; live and initial reduced motion; responsive rebuild in both directions. Non-current project links are inert only in the enhanced desktop stage.
- Sticky chapter links, fresh `#motion` entry, reload at a scrolled project position, and Back navigation. A direct-fragment alignment issue caused by initial enhancement/layout was fixed with one post-layout alignment that yields to user interaction and does not override Back/reload restoration.
- Native cross-document View Transitions emitted actual `pageswap` transitions in Chrome for project navigation. Other engines use progressive fallback and are not verified here.
- Actual film playback through the new visible play control, subsequent keyboard focus on the native video, and pause on leaving view. Instrumented WebGL draw counts remained unchanged offscreen.
- No-JavaScript content and blocked-GSAP fallback both retain the two projects and all copy. No provider generation request or real lead submission was part of this pass.
- `npm run check`: all eight existing build/server tests passed; new JavaScript syntax checks passed. `npm run build` passed for the current site; URL-layout tests include GitHub Pages subdirectory and custom-domain builds.
- At 1440×900 the enhanced page measured 6,488px versus the prior 7,791px, about 17% shorter. This is a layout measurement, not a performance metric.

Remaining limits: physical-device GPU performance and Safari/Firefox have not been measured or visually verified. No commit, push, merge, deployment, or Unreal connection occurred.

## Cohesion revision — user critique, September 28, 2026

The user rejected the flat ribbon transition as strange and underwhelming, liked the TrailGoat/Purple Squirrel transition, found the film presentation only adequate, and described the final four sections as plain. This supersedes the ribbon handoff and independently treated lower sections in SC-1/SC-3 above.

### Current design and scope

- Removed the flat stripe, extra hero scroll hold, dimming copy, and scroll deformation. The approved filament remains intact; the first project arrives with a small depth change.
- Preserved the approved two-project reveal and its direct project controls.
- Reframed the existing film within the same material/edge language as the work. It no longer stretches across the full page. A stronger poster and three thumbnails were extracted from the supplied original 720p film at 2, 8, and 17 seconds. Assemble, Become, and Resolve controls seek and play the existing movie. The film itself was not re-rendered or replaced.
- Replaced separate plain expertise and AI sections with Design / Build / Connect: a shared capability stage whose conceptual website, application, and AI workflow illustrations transition through the same shallow depth. Desktop scroll advances the stages; direct buttons work on smaller/touch layouts and under motion-off/reduced motion. Clear service copy and the AI consulting page link remain primary.
- Combined studio and contact into one signature composition with layered planes of the existing ribbon artwork. Shared framing, color, type, and restrained depth extend the project treatment through the end of the page.
- Preserved the first-pass source under `docs/capra-motion-study/archive-scroll-v1/`; these are historical source snapshots, not standalone or deployed pages.

### Verification

Rendered Chrome desktop 1440×900 and 1920×900, 1000×720, tablet 820×900, and phone layouts 390×844 and 320×740. No horizontal overflow in the exercised sizes. Inspected the film, capability states, and closing artwork. Corrected thumbnail sizing and intersecting 3D paint layers during visual review. Actual fonts loaded.

Exercised all three capability states forward/backward, direct buttons and keyboard focus into the selected service, reduced motion, effects off/on, AI deep linking, and no-JavaScript service/movie fallbacks. Tested actual source video seek/play to Resolve and keyboard focus on the native video. The complete homepage measured 6,301px at 1440×900 after the revision. Existing build/server tests (eight), JavaScript syntax checks, static build, and whitespace check pass.

The artwork in capability scenes is explicitly labeled as an illustration. No new Unreal connection, new 3D model/render, live provider call, lead submission, or publication occurred. Physical-phone GPU performance and Safari/Firefox remain unverified.

Motion preference changes now use a single animation-context owner. Verified that switching effects off/on and changing the system reduced-motion preference preserves the selected AI capability and reading position. Rechecked navigation through the preserved Purple Squirrel stage and inspected the final studio composition on desktop and phone.

## 4K film replacement — September 29, 2026

Kris supplied `TrailGoat-blocks-4k-A-Breakbeat20s.mp4` from `/Users/kb/Movies/TrailGoat Launch/motion/out/blocks/`. Replaced the homepage and TrailGoat case-study film with a full-resolution web encode: 3840×2160, 30 fps, 20 seconds, H.264 CRF 18 / medium / yuv420p, fast-start MP4. The 92,087,501-byte original stays untouched; the web asset is 70,621,953 bytes (23.3% smaller). AAC stereo 48 kHz audio was copied without re-encoding; its packet hash matches the source. The prior website encode is also backed up at `/tmp/capra-brand-film-720p-before-20260929.mp4`; the original 720p source remains in the Movies directory.

Rebuilt the detail, character, resolve, and case-study posters from the new source. Reviewed the sequence at two-second intervals; existing chapter starts (0 / 7 / 16.5 seconds) still match Assemble / Become / Resolve, so their timing is unchanged. Added 4K/sound labels and a “Play with sound” homepage button. Versioned media URLs avoid retaining yesterday’s cached 720p movie/posters. There is no automatic playback or video download before interaction.

Verified in local Chrome: 3840×2160 video decode, unmuted playback with decoded audio bytes, Resolve seeking, both page placements, explicit playback under reduced motion, desktop 1440×900 and phone 390×844 screenshots, and no phone overflow. Confirmed HTTP 206 byte ranges and fast-start metadata before the media payload. Existing eight tests, JavaScript syntax checks, build, and whitespace check pass. Audio packet preservation and browser decoding were checked; physical-speaker playback and physical-device 4K performance were not evaluated. Local preview only; no publication.

## Motion page and UI refresh — October 1, 2026

Built from `docs/MOTION-PAGE-AND-UI-BRIEF.md` and `docs/MOTION-PAGE-AND-UI-PLAN.md` in five stacked pull requests (Bookee2/Caprastudios#7 to #11). The homepage hero is unchanged throughout.

- **Phase 1, navigation and interaction vocabulary.** One sticky navigation bar on every page replaces the homepage's two bars. It hides on a scroll down, returns on a scroll up or on focus, shows reading progress, and slides an indicator to the hovered, focused or current link. Shared hover and focus behaviours live in `assets/interactions.css` and `.js`. A remembered footer switch, "Motion effects", replaces the scroll-effects toggle; reduced motion sets the same state (`html.motion-off`).
- **Phase 2, the motion page.** `motion.html`: a 60-frame Blender turntable of the ribbon unicorn (scroll, drag or slider), a tile that rebuilds from 150 rigid-body shards (Blender, played in reverse), both brand films, eight pointer, hover and scroll tiles, and five promises about how the studio uses motion. Bake scripts: `blender/bake_turntable.py`, `bake_shards.py`, `encode_shards.py`.
- **Phase 3, WebGPU pieces.** Liquid metal (the mark as a raymarched distance field), letters that grow (reaction-diffusion), ink in water (stable fluids) and one film through three print processes. One shared device, scripts loaded on approach, stills captured from the live pieces by `scripts/capture-gpu-posters.mjs`.
- **Phase 4, homepage rhythm.** The film goes full-bleed and opens from the content column as it arrives. Design, Build and Connect become stacking sticky cards. The closing line lights word by word.
- **Phase 5, inner pages and polish.** Headlines rise once on inner pages. Process steps share a line that draws with reading. AI consulting opens on its connected-systems diagram. Case studies end on a next-project band with its picture. Small labels have a 12 px floor (11 px on phones). Ask Capra is an icon-sized button on phones that steps aside while scrolling down. The ribbon artwork ships as AVIF with a WebP fallback (about 20 KB, from 1.37 MB). `assets/studio.css` and `studio.js` were removed; `assets/filament.js` stays because an archived study in `docs/` uses it.

Not done: the 70 MB TrailGoat film is unchanged pending a decision on serving a 1080p cut by default.

## Daylight remake — October 1, 2026

The user approved the direction sketched in `docs/SITE-CHARACTER-AUDIT.html` ("Paint the walls", with the black light switch) and asked for the site to be remade in it.

- New single stylesheet `assets/site.css`; `tokens.css`, `studio-next.css`, `chapters.css`, `interactions.css`, `chapters.js`, `home.js` and the vendored GSAP are removed.
- Every page is rebuilt: chalk reading sections, one flat colour field per project or page, dark rooms for the pond, films and live pieces, paste-up pictures with tape and a sticker, hand-tagged notes.
- All-caps mono labels, decorative numbering, two-tone headlines, rounded glowing panels and the cyan-violet-pink gradient are gone. The spotlight border and rolling label survive only as two demonstrations on the motion page.
- A "Lights off" switch in the navigation turns the site to black light and is remembered per browser.
- Copy is first person and plain. Headlines and intros were drafted from facts already on the site and are placeholders for Kris's own wording.
- The pond graphic and `assets/pond.js` are unchanged; the hero around it is new.

Still to come from Kris: a real photo for the studio band (the ribbon artwork stands in), his own hand-lettered marks to replace the stand-in font, and his own wording for the headlines. The halftone picture treatment from the audit was not built.

## Sections, team voice and hero gallery — October 2, 2026

KB's direction after the remake went live at caprastudios.co:

- **Three sections: Software, Web, AI.** The navigation, footer, homepage sections and services list use those names. `work.html` is the Software page, `motion.html` is the Web page (websites, motion and video graphics), `ai-consulting.html` is the AI page. File names are unchanged so existing links keep working.
- **Team voice.** Copy says "we": a small but mighty team of specialists in Atlanta, led by Kris Brown. "Capra is one person" is retired. No team size or names are claimed.
- **Six Sigma.** One short note on the AI page (rollouts follow DMAIC where it fits; the work is led by a Six Sigma Green Belt) and a clause in the homepage AI row.
- **Hero gallery.** The hero frame holds five featured pieces chosen by tabs: the glow pond (unchanged `pond.js`), KB's Koi Pond (framed live from `bookee2.github.io/koi-pond/?embed=1`, loaded only when chosen), liquid metal, ink, and the shards film. Nothing auto-rotates. `assets/gallery.js`.
- **Recoloured GPU pieces.** Liquid metal, letters that grow, ink and the three printers now use the paint set (lagoon, koi orange, lime, magenta, chalk and ink) in place of the cyan-violet-pink scheme. Their stills were recaptured. The Blender unicorn pieces keep the logo's ribbon blue.

The Koi Pond slide needs `Bookee2/koi-pond#1` (the `?embed` option) deployed; until then its control panel covers the frame.
