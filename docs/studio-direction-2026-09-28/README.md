# Capra Studios — September 28 direction proposal

Open `index.html` directly or run `node docs/studio-direction-2026-09-28/preview.mjs` from the repository, then visit http://127.0.0.1:4175/docs/studio-direction-2026-09-28/index.html.

## Current user direction

Capra is becoming a design and web studio showcasing web applications, Blender animation, and Unreal 3D work. Lead with the work and client outcomes. Remove AI-first positioning in the future redesign; technology can remain a short supporting statement. This supersedes the historical AI-native positioning in the existing brand guide and private wiki. The current website has not been changed.

The requested output is a researched HTML plan. The user also explicitly requested research of motion graphics in the second brain. That research is included alongside copy, positioning, visual direction, case-study priorities, a unicorn storyboard, implementation phases, acceptance criteria, and source provenance.

Do not access Unreal or its MCP today (September 28); Claude is using it. September 29 is the earliest production date, subject to the model arriving and the shared workspace being available. No automation was created and no Unreal connection was attempted.

## Files and boundaries

- `index.html`: local review document; references the existing repository brand assets and tokens.
- `trailgoat-reference.mp4`: unchanged local copy of the user's supplied film, for reliable preview. Source remains `/Users/kb/Movies/TrailGoat Launch/motion/out/blocks/TrailGoat-blocks-goat-flip-wordmark-v4-720p.mp4`.
- `trailgoat-poster.jpg` and `trailgoat-sequence.jpg`: extracted reference frames, not new artwork.
- `preview.mjs`: localhost-only preview adapted from the existing range-capable server; allows the review document/media and existing site assets.
- `VERIFICATION.md`: actual checks and remaining limits.

These files are under `docs/`, outside the existing production build's public-file allowlist. Nothing was committed, pushed, deployed, or rendered in Unreal. Google Fonts is the document's only external styling dependency; system font fallbacks are supplied. Moving the HTML alone out of the repository will break its relative asset links.
