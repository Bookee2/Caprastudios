# Capra Studios identity

## The ribbon unicorn

The selected direction is concept 03, the ribbon: a flowing, open unicorn profile with a tapered horn and an S-shaped neck. Satin blue and violet surfaces form the larger hero artwork; simple monochrome curves carry the identity in the header, footer, studio section and favicon.

The SVG files in `assets/brand/` share their curves through `scripts/ribbon-shapes.json`. Run `npm run brand` after changing those curves to update every mark and the inline page symbol together. The outlined Red Hat wordmark lettering is preserved. The shaded artwork is a separately prepared image based on the approved concept, not a 3D model.

Keep clear space around the horn and lower ribbon tip. Use a minimum height of 32px for the standalone mark where practical; the favicon uses the same silhouette in its dedicated square canvas. The small flat version is simplified for legibility and does not include the hero's material shading.

The original C identity is preserved in `docs/brand-archive/cut-c/` and Git history. It is outside the deployed website artifact.

## Palette — remade October 1, 2026

One wall, two lights. Daylight is a chalk wall with flat paint; black light (`html.bl`, the "Lights off" switch) turns the wall dark and the paint glows. Sections that hold glowing things (the pond, films, live pieces) are dark "rooms" in both lights. The paint colours come from the koi pond's four light palettes and the logo.

| Colour | Hex | Role |
| --- | --- | --- |
| Chalk | `#f3f1ea` | The wall in daylight |
| Ink | `#15141c` | Text and edges in daylight |
| Ribbon blue | `#7aa2f7` | The logo, always; one field on AI consulting |
| UV violet | `#7a2df5` | Purple Squirrel; hand notes in daylight |
| Acid lime | `#b6ff3b` | Marker swipes, hovers, hand notes and buttons under black light |
| Koi orange | `#ff5c1a` | The studio band |
| Solar yellow | `#ffd23f` | AI consulting, tape and stickers |
| Hot magenta | `#ef388d` | Large type accents only |
| Lagoon | `#1ad7ce` | TrailGoat |

Rules: flat fields only, with gradients kept inside artwork; one colour per section and one per project or page; text on a field is ink or chalk; the logo stays ribbon blue. Use the CSS tokens in `assets/site.css`. The earlier Tokyo Night palette is retired from the site.

## Typography

- Red Hat Display: wordmark and headlines, 700–900.
- Red Hat Text: body and navigation, 400–600.
- Sedgwick Ave Display: hand-tagged notes, a handful per page at most. It stands in for Kris's own marker lettering, which should replace it.
- Red Hat Mono and the all-caps numbered labels are retired.
- Section names (`.kicker`: Red Hat Display 800 in the hand colour, above a section heading) are a deliberate design choice, kept on October 4, 2026 although Impeccable bans labels above headings outright. They name a section in the studio's voice rather than restating the heading. Keep them few: currently two on the homepage and one on the motion lab.

The oversized 900-weight typography is a deliberate departure from the tool-oriented TrailGoat scale, made for the user's studio statement-piece brief. The core type family, palette, two radii, neutral hover behavior, and mobile label floor come from `/kb-tokyo`.

## Voice — current direction, September 28, 2026

Independent design and web studio in Atlanta. Lead with the work: distinctive websites, useful applications, and identities in motion. Latest technology supports the work; AI-native production-method positioning remains retired. The user subsequently added AI consulting as a substantive offering: agents, knowledge retrieval, customer service, and broader business workflow implementation.

Opening: **Imagination. Made tangible.**
Supporting line: **Distinctive websites. Useful applications. Identities with a life of their own.**

The colorful filament unicorn is the approved browser-motion direction. Spectrum, Solar, and Arctic palettes extend the artwork while the interface retains the neutral dark foundation. Keep the selected ribbon identity recognizable. The full 3D unicorn model and new film remain future production work.

Show TrailGoat and Purple Squirrel as founder-built ventures, not invented client commissions. Capra HR and the Atlanta flythrough are retired from the public portfolio. No invented awards, testimonials, metrics, or “best in Atlanta” ranking claims. Project scope and pricing are quoted individually.

## Motion

The current homepage uses one family of framed, shallow-depth compositions. The two-project TrailGoat/Purple Squirrel stage remains the approved reference. The flat SVG ribbon bridge, hero deformation/hold, and plain lower sections were rejected by the user on September 28 and have been replaced.

The hero flows directly into work. The film has a proportionate frame, source-derived poster, and three user-controlled chapter entry points. Design, Build, and Connect share one illustrated capability stage; scroll changes its state on suitable desktops, while buttons support direct exploration on every enhanced layout. Studio and contact share a layered signature composition using the existing approved artwork. These illustrations are conceptual presentations, not new client work or newly rendered 3D models.

Natural scrolling, stable readable copy, shared color and material choices, and limited shallow rotation connect the chapters. No wheel interception, forced horizontal scrolling, or cursor replacement. Smaller/touch layouts remove scroll holds. Motion-off and reduced-motion retain manual capability selection and complete static artwork. Missing JavaScript or GSAP leaves all service copy in ordinary flow. The filament keeps its own motion and palette controls. Native project-page transitions remain progressive enhancements.
