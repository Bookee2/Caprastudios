# Capra Studios identity

## The ribbon unicorn

The selected direction is concept 03, the ribbon: a flowing, open unicorn profile with a tapered horn and an S-shaped neck. Satin blue and violet surfaces form the larger hero artwork; simple monochrome curves carry the identity in the header, footer, studio section and favicon.

The SVG files in `assets/brand/` share their curves through `scripts/ribbon-shapes.json`. Run `npm run brand` after changing those curves to update every mark and the inline page symbol together. The outlined Red Hat wordmark lettering is preserved. The shaded artwork is a separately prepared image based on the approved concept, not a 3D model.

Keep clear space around the horn and lower ribbon tip. Use a minimum height of 32px for the standalone mark where practical; the favicon uses the same silhouette in its dedicated square canvas. The small flat version is simplified for legibility and does not include the hero's material shading.

The original C identity is preserved in `docs/brand-archive/cut-c/` and Git history. It is outside the deployed website artifact.

## Palette

| Color | Hex | Role |
| --- | --- | --- |
| Tokyo Midnight | `#1a1b26` | Main canvas |
| Tokyo Well | approximately `#15161e` | Media stage and recessed sections |
| Storm | `#24283b` | Contact section and raised ground |
| Signal Blue | `#7aa2f7` | One primary CTA, emphasis, mark |
| Periwinkle | `#c0caf5` | Main text |
| Streetlight Slate | `#9aa5ce` | Secondary copy |
| Arcade Violet | `#bb9af7` | Brand-study lighting and portfolio identity |
| Pale Sky | `#7dcfff` | Brand-study highlights |

Prefer the CSS tokens over copied hex values. Chrome uses the neutral ladder and Signal Blue. Portfolio previews carry the colors of the actual products.

## Typography

- Red Hat Display: wordmark and headlines, 700–900.
- Red Hat Text: body and navigation, 400–600.
- Red Hat Mono: labels and numbers, 400–500.

The oversized 900-weight typography is a deliberate departure from the tool-oriented TrailGoat scale, made for the user's studio statement-piece brief. The core type family, palette, two radii, neutral hover behavior, and mobile label floor come from `/kb-tokyo`.

## Voice

Confident, personal, concrete. Talk about the customer's business before the technology. Explain where AI helps and where human judgment stays involved. No invented client logos, awards, performance numbers, or agency-size claims.

Core line: **Small business. Big presence.**

Supporting line: **Human imagination. Artificial intelligence. Unmistakably yours.**

## Motion

Controls respond quickly; page elements arrive once; the ribbon study reveals along its curve and settles. Nothing in the navigation loops. Reduced motion shows complete static compositions. The browser owns ordinary scrolling; there is no scroll hijacking or cursor replacement.
