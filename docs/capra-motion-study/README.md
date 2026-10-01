# Capra WebGL motion study

Local interactive concept, September 28, 2026. Requested after reviewing TrailGoat's WebGL motion examples. The larger site implementation is paused while this direction is evaluated.

Run `node docs/capra-motion-study/preview.mjs`, then visit http://127.0.0.1:4176/docs/capra-motion-study/index.html. The original plan remains available through the back link.

Three particle forms: existing ribbon unicorn, an abstract website composition, and the existing vector wordmark. Shapes are sampled from Capra SVG assets into a seeded particle field. WebGL vertex shaders handle the morph, transition arcs, pointer displacement, and scatter; this is not a physics or GPGPU simulation. One point draw call per frame, 15,000 points on desktop and 6,500 for a page initially loaded at phone width, device-pixel ratio capped at two. No third-party rendering library. Google Fonts supplies presentation fonts, with system fallbacks.

Playback is user-triggered and ends on the signature. Pause stops frame scheduling. Hidden tabs and offscreen stages suspend animation. Reduced motion gives instantly selected still compositions and hides playback controls. No WebGL, initialization failure, no JavaScript, and context loss retain the original static unicorn.

Verified with installed Chrome through Playwright:
- All three states, scatter, pause/resume, and finite full-sequence playback.
- Paused rendering produces no additional draw calls.
- Live reduced-motion changes hide playback controls; still-form selection remains usable.
- Desktop and 390px/320px phone views inspected; no horizontal page overflow.
- No JavaScript exceptions in the exercised flows.
- JavaScript-disabled and WebGL-disabled fallback views.
- Simulated WebGL context loss restores static artwork and hides unavailable controls.

Not a physical-phone performance benchmark or a production release. The Unreal/MCP workspace was not accessed. Files remain under docs, outside the production build's public allowlist. No production site changes, commit, push, or deployment in this prototype pass.

## Supporting motion pass

Added three service illustrations and a footer particle signature in the same preview:
- Website layout assembles and rests.
- A signal follows two application workflow branches.
- The ribbon turns gently in perspective.
- A slow wave travels through 27 groups of sampled unicorn particles in the footer.

Service movement uses different portions of a 12-second cycle; the footer has a 14-second cycle. The two “Pause subtle motion” buttons control all four supporting illustrations together. Their pause choice survives scrolling and preference changes for the current visit. CSS transforms and opacity handle these small touches; WebGL remains reserved for the main particle study. With JavaScript disabled, illustrations are static. Reduced motion shows complete still compositions. Offscreen illustrations and hidden tabs pause.

Checked desktop and phone renders (390 and 320 pixels), pointer and keyboard pause/resume, live reduced-motion changes, static no-JavaScript content, and no page errors. A fully offscreen service section was separately checked for paused animation state. This remains a local preview; the production site has not changed.

## Color and material research

`research.html` records the September 28 research into luminous strands, prismatic materials, woven image transitions, interactive color reveals, and fluid simulation. It links primary references, distinguishes WebGPU inspiration from WebGL examples, and recommends a colorful filament unicorn as the next experiment. No new effect implementation is claimed.

## Filament study — Woven from light

User direction: push the colorful motion direction further and aim for an ambitious studio presentation. `filament.html`, `filament.css`, and `filament.js` provide a second inspectable hero composition; the first particle study is preserved.

Open http://127.0.0.1:4176/docs/capra-motion-study/filament.html. Uses original WebGL1/GLSL code and paired curves adapted from the approved ribbon mark. This is a shallow sculptural interpretation of the SVG, not the forthcoming full 3D unicorn model. Indexed five-sided tubes share vertices; desktop has 118 strands, 100 segments each. Phones initially receive fewer strands and 90 segments with slightly heavier line weight. A lit opaque pass and an expanded additive halo pass create the surface. This is neither a fluid simulation nor a full bloom post-processing pipeline.

Spectrum, Solar, and Arctic change the light palette. The pointer locally displaces the ribbon and changes its angle; a button or tap sends a traveling light wave. Pause stops animation scheduling. Reduced motion renders a still composition with working palette selection. Hidden tabs and offscreen artwork suspend rendering. No JavaScript, no WebGL, failed initialization, or context loss retain the original static SVG. DPR capped at 2 on desktop and 1.5 for an initial phone view.

Verified in installed Chrome via Playwright: desktop 1440, tablet 768, phones 390 and 320; rendered compositions, actual Red Hat font loading, no horizontal overflow, pointer/keyboard palette selection, wave trigger, pause/resume, no extra draw calls while paused or reduced-motion, live preference changes, offscreen suspend/resume, no-JavaScript and no-WebGL fallbacks, simulated context loss. No page errors in exercised flows. Physical-phone GPU performance and other browser engines remain unmeasured. No production changes, Unreal connection, commit, push, or deployment.

## Scroll direction — September 28, 2026

`scroll-research.html` records the requested research into section transitions, with primary reference links and a five-chapter clickable composition storyboard. This is a proposal, not an implementation of homepage scrolling. The production homepage is unchanged by this research pass. Recommendation: a ribbon hero-to-work handoff, one bounded project stage, a film expansion, short AI workflow reveals, and a tighter content edit. Optional project-to-case navigation transitions are separate from scroll behavior.

Inspected Codrops SVG mask, rotating image, and 3D Curve Gallery demos in desktop Chrome. Reviewed GSAP ScrollTrigger, Chrome animation performance, and MDN View Transition documentation. Board checked in Chrome at 1440, 390, and 320px: fonts and images loaded, no horizontal overflow, all five chapter controls worked, no JavaScript errors. Reduced-motion transitions resolve immediately; reference/plan content remains readable without JavaScript. No physical-phone or cross-engine performance testing; no external demo code/assets copied into the site.

Local research preview: `PORT=4178 node docs/capra-motion-study/preview.mjs`, then `/docs/capra-motion-study/scroll-research.html`. The preview server explicitly allowlists this file; production build still excludes research docs.
