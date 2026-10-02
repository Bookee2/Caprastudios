# Marketing Room delivery — October 2, 2026

## Scope and decisions

Kris requested a full marketing suite based on the redesigned caprastudios.co site, including the lights-off edition. The suite preserves the live site's original unicorn, Red Hat typography, Sedgwick handwriting, paper/ink colors and flat accents. It uses the current Software, Web and AI positioning and real TrailGoat/Purple Squirrel work.

Kris supplied kris@caprastudios.co for personal cards. On 2026-10-02 his phone number was removed from every published file (cards, booklet, postcard, signatures, email drafts and the page) to avoid spam once the room became indexable. Print-ready personal cards with the number remain in the original suite at `/Volumes/KB SS/Capra Studios/Marketing/2026-10-02-launch-suite/print/`. Studio promotions retain info@caprastudios.co. No invented social handles, testimonials, prices or measured results are included.

On October 2 Kris explicitly requested commit, PR and merge. Merging publishes the library at `/marketing/` via the existing GitHub Pages workflow. The homepage and portfolio remain unchanged. The temporary tunnel is not part of the site or deployment.

## Acceptance criteria

- AC-1: `/marketing/` provides the same searchable daylight/blacklight library on desktop and phone.
- AC-2: All 420 PNG/SVG designs, 14 MP4s, 43 PDFs, four signatures, six email drafts and copy files are versioned and available.
- AC-3: The full suite, print kit and 21 platform ZIPs are assembled in the deployment build and every download resolves.
- AC-4: Personal contact details remain correct; existing public-site checks pass for both deployment URL shapes.
- AC-5: Deployment excludes server credentials, local tunnel configuration and repository internals. The library is publicly accessible but excluded from the sitemap and marked noindex.
- NG-1: No social posting, email sending, printer submission or homepage redesign.

## Files and regeneration

`marketing/manifest.json` and `motion/videos.json` inventory the exports. `data.js` embeds the library data so the downloaded room works offline. Source fonts include OFL licenses. The editable SVGs use live text with embedded fonts.

`marketing/source/` contains Python generators. Full artwork regeneration requires ReportLab, Pillow, pypdf, Poppler and FFmpeg. The existing reviewed exports are committed, so deploying requires only Node 22 and Python 3. `scripts/marketing.mjs` copies an explicit list of files/folders, validates asset references, copies the already versioned TrailGoat source film, and runs the standard-library ZIP packager. The complete ZIP includes the film so motion source remains portable offline.

Print PDFs include bleed and trim boxes where appropriate. Colors are RGB; have the printer proof stock, duplex orientation and the required output profile. MP4s are silent. The publishing sequence is suggested order, not scheduled posts.

## Verification

The original artifact pass checked all export dimensions, text bounds, overlaps, video encoding and personal PDF contacts. The QR codes on both personal card editions and a flyer were decoded to https://caprastudios.co/. Desktop 1440×1000 and phone 390×844 layouts, both themes, filters, previews, video playback and copy controls were reviewed. Evidence is in `marketing/proofs/`.

Repository checks validate marketing references alongside the existing deployment checks. ZIP integrity and embedded file names are verified during packaging. A successful merge alone does not establish deployment; verify the Pages workflow and public `/marketing/` URL after merging.
