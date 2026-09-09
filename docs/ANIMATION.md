# Blender handoff — Capra form study

## The reserved stage

`index.html` contains a full-width `.motion-stage` with `#stage-media` inside it. This is the slot for the future rendered Blender animation. The current cut-C study is a complete vector brand composition, with a finite assembly animation, a replay control, and subtle pointer response. It is not represented as a Blender render.

The stage has a stable responsive height: 410–600px on larger screens and 350px on phones. Its corner captions remain HTML. Keep text and the primary sales message outside the video so content remains accessible and crawlable.

## Proposed art direction

An extruded Capra cut-C monogram, machined as a sculptural object. Tokyo Midnight background, softly reflective periwinkle faces, a restrained violet edge. Gentle camera orbit or assembly into one coherent form. Avoid stock liquid-chrome blobs, visual noise, and rapid cuts.

- Source geometry: `assets/brand/mark.svg`.
- Background: `#15161e`, approximately the resolved Tokyo Night well color.
- Face: signal blue `#7aa2f7`; optional cyan `#7dcfff` and violet `#bb9af7` edge lighting.
- Target duration: 6–8 seconds, silent. Make the first and last frames usable as still images.
- Desktop render: 1920×1080, with the sculpture centered within a phone-safe square crop.
- Optional phone export: 900×1100 with the same focal point.
- Export H.264 MP4 plus WebM if practical. Prefer roughly 2–5 MB per delivered variant; avoid transparent video unless there is a specific reason for it.
- Keep `.blend` files and lossless frames outside the deployable `assets/` directory. Only compressed deliverables belong there.

## Integration

1. Export a poster image and compressed video under `assets/motion/`.
2. Replace the SVG in `#stage-media` with a decorative video using `muted`, `playsinline`, a poster, and `preload="none"` or metadata loading.
3. Load/play only when the stage is visible. Respect reduced motion and data-saving preferences; show the poster when autoplay is unsuitable or fails.
4. Reuse the stage's replay control. For a looping sequence, provide an explicit pause/play control. Pause offscreen and when the document is hidden.
5. Keep the SVG or poster as the fallback if video fails. The site should look finished with no animation at all.
6. Recheck desktop and 390px phone cropping, LCP, byte size, and motion accessibility.

Blender can use Python to build or render the animation on a workstation. The rendered file runs in the browser as video; this does **not** require Render or a Python web service.
