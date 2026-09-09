# Ribbon unicorn assets

Concept 03, “The Ribbon,” was selected by the founder. This update replaces the visible C identity while preserving the original files in `docs/brand-archive/cut-c/`.

## Production files

- `assets/brand/ribbon-hero.png`: the shaded ribbon artwork used in the hero, prepared with the built-in ImageGen tool. It is an opaque dark-background image, displayed with a lighten blend in the stage; it is not an alpha cutout or a Blender video.
- `assets/brand/mark.svg`, `mark-light.svg`, `mark-dark.svg`: native SVG applications simplified from the chosen ribbon silhouette.
- `assets/brand/favicon.svg`: square favicon with the ribbon mark.
- `assets/brand/wordmark.svg`: ribbon symbol alongside the existing outlined Red Hat lettering.
- `scripts/ribbon-shapes.json`: shared editable curves. `npm run brand` regenerates SVG applications and the inline page symbol.

The hero uses a finite SVG reveal mask and pointer translation. Its completed still remains visible without JavaScript and under reduced motion. No server, 3D library, or new package dependency is required.

## Image-generation prompts

The built-in ImageGen tool was used with the approved three-direction sheet as the initial reference. No API/CLI fallback was used.

**Artwork preparation:**

> Precisely extract and prepare the LARGE RIGHTMOST RIBBON UNICORN from the provided approved Capra Studios concept sheet as a standalone production website asset. Preserve that exact ribbon unicorn shape, facing right, its curving S-shaped open neck, the smooth loop at the top, single slender horn angled up-right, slender equine face ribbon and the same satin periwinkle/cyan/violet shading. Do not use the small icon, the sculpture on left or C in middle. This is an extraction of the approved large rightmost design, not a new logo design. Remove all background, column lines, typography and other artwork. Genuine transparent alpha background, no checkerboard painted into the image, no shadows outside the object, no glow. Output a clean portrait image with the full unicorn centered, about 1024x1536 or similar, with 8 percent transparent safe padding on every side. All of the horn and flowing lower neck tip visible. No text, no extra symbol. High quality crisp edges, preserve the elegant original details and material.

The initial result contained a rendered checkerboard rather than an alpha channel and was not used on the site. The production asset uses the following background correction:

> Change ONLY the background of this image. Replace EVERY checkerboard pixel and every grey background mark, including the openings inside the ribbon unicorn, with perfectly uniform solid dark hex #15161e (RGB 21,22,30). Do not request or simulate transparency. Output an opaque RGB image. The background must be a single completely flat color with no checkerboard, no grid, no texture, no gradient, no marks and no shadow. Keep the unicorn object exactly as shown: identical position, scale, outline, polished blue-to-violet ribbon surfaces and highlights. No shape changes, no text, no glow, no new elements. It will be placed on a webpage with background #15161e.
