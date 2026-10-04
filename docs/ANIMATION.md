# Interface motion: tokens and the three moves

Adopted October 4, 2026, after reviewing Animate.css and Impeccable (see [the Animate.css brief](animate-css-lessons-2026-10-04.html) and [the Impeccable brief](impeccable-lessons-2026-10-04.html)). Every transition and CSS animation in `assets/*.css` takes its timing from the tokens in `assets/site.css` `:root`. No stylesheet types a duration or curve directly; stagger and start delays (`calc(var(--i)*90ms)`, `.2s`) are the only literal times. A stagger's total delay is capped (the headline rise stops adding delay at 360 ms).

| Token | Value | Use |
|---|---|---|
| `--dur-instant` | `--dur` × .25 (≈110 ms) | Press and toggle feedback: button background, colour and border |
| `--dur-quick` | `--dur` × .5 (≈225 ms) | Routine state changes: hover colour, link underlines, hints, the page crossfade |
| `--dur` | .45s | Layout, overlays and crossfades: the header, rotations, the agent launcher, view-transition morphs |
| `--dur-slow` | `--dur` × 1.75 (≈790 ms) | Showpiece reveals only: the headline rise, the AI diagram's drawn lines. Nothing runs longer than about 800 ms. |
| `--ease` / `--ease-out` | cubic-bezier(.2,.8,.2,1) | Anything arriving or responding |
| `--ease-in-out` | cubic-bezier(.65,0,.2,1) | Something moving from one place to another (nav pill, letter rolls) |
| `--ease-in` | cubic-bezier(.5,0,.75,0) | Anything leaving |

To re-time the site, change `--dur`. To re-time one component, set `--dur` on that element.

**The three moves.** These are the only stock interface motions. Anything else belongs in the motion lab.

- **rise** — something arrives. The headline reveal (`rise-line` / `rise-in`, driven by `assets/interactions.js`) is the reference: a short lift, `--ease`, staggered with `--i`.
- **settle** — something leaves. Add `.settle`: a fade and an 8 px drop over `--dur-quick` with `--ease-in`. Exits are quicker than entrances.
- **nudge** — an error, and only an error. Add `.nudge` to the field or message: a decaying horizontal shake that finishes halfway through `--dur`. Never use it for decoration or as a loop.

**Reduced motion and print.** These mean fewer and gentler, not none. Movement snaps: keyframe animations run in 1 ms with no delay and one iteration, so elements still land on their final frame and `animationend` still fires, and transitions of transform, rotation, translation, underline growth, drawn lines and the lens are dropped. Fades and colour changes (opacity, colour, background, border, shadow) still transition, but `--dur` drops to .15s so they are short, and every delay is removed. Because movement transitions no longer run, `transitionend` does not fire for them; no script currently listens for it. The scroll progress bar is turned off outright, as it is with the footer motion switch. Navigation view transitions are disabled separately in `assets/page-transitions.css`. The canvas pieces keep their own still-frame handling.

**Browser parts.** The caret uses `--hand`, native controls (checkboxes, range sliders) use `--uv` through `accent-color`, and scrollbars use `--muted` on `--paper`, alongside the existing text-selection and focus-ring colours.

# Current website motion

As of September 30, 2026, the homepage hero is the koi pond from the Motion Frontier study (demo 19, radiance cascades): five glowing koi light a dark pond floor and the unicorn mark, in place of the study's word, casts the soft shadows. The mark is drawn in the site accent (#7aa2f7). The koi steer on the CPU against a distance field of the stones, the mark and the pond edge, so no light passes through a solid. On desktop the final pass draws to a 4K-class canvas (long side 2160 px or the display's own density, whichever is larger) while the light is solved on a 1024-wide grid; phones use the display density and a 640-wide grid. `assets/pond.js` is raw WebGPU with no libraries; palette, light-wave and pause controls, the pointer lantern, reduced motion (one still frame) and off-screen pausing carry over from the earlier filament hero, and browsers without WebGPU keep the static mark. The earlier WebGL filament renderer remains in `assets/filament.js` but is no longer loaded. The homepage also uses the supplied TrailGoat 4K brand film with music. The film is click-to-play, with native controls and three chapter buttons; the case-study page uses the same movie. Production provenance, encoding, poster times, and verification are recorded in [the studio refresh](STUDIO-REFRESH.md#4k-film-replacement--september-29-2026). The source render remains outside the repository; `assets/motion/trailgoat-brand-film.mp4` is the web encode.

The following notes describe the earlier Capra unicorn film and remain as an archived production reference. Its automatic-playback behavior does not describe the current homepage.

# Earlier homepage unicorn film

The homepage's statement-piece section now uses the rendered Blender ribbon unicorn. The eight-second film starts on an empty stage, unfolds from the tail through the mane, face and horn, and settles into the completed mark. Headlines, sales copy and captions remain ordinary, crawlable HTML.

## Assets and hosting

- Desktop: `assets/motion/capra-unicorn-1080p.mp4` — 1920×1080, 60 fps, 1.08 MB.
- Phone: `assets/motion/capra-unicorn-mobile.mp4` — 900×900, 60 fps, 0.39 MB.
- `*opening-poster.jpg` matches the first, empty frame; `*poster.jpg` provides the finished mark as a fallback.
- The editable scene and rendering workflow are in [`blender/README.md`](../blender/README.md).

These are static H.264 videos served by GitHub Pages. Python and Blender run only during production; no Render service, live rendering, browser 3D library or additional paid hosting is required. Native `.blend` files and lossless frames remain outside the deployment assets.

## Homepage behavior

The HTML initially provides a responsive finished poster and a video with no source and `preload="none"`. JavaScript selects one film when playback begins: square at widths up to 600px, wide above that. Resizing does not restart the film; CSS contains the full sculpture on desktop and uses its safe square crop on phones.

With reduced motion or data saving enabled in the visitor's preferences, the finished still remains visible and no video is requested automatically. Otherwise, an opening poster prepares the stage, and playback begins only when at least 85% of the media area is visible. The film plays once, without sound or looping. It finishes on the completed poster.

A visible, keyboard-accessible control provides play, pause, resume and replay. Explicit playback works even with reduced motion or data saving enabled. Leaving the viewport or hiding the tab pauses playback; returning resumes a film that was playing. A visitor's manual pause persists. Changing motion or data-saving preferences stops automatic playback and restores the finished still. Blocked autoplay, media errors and JavaScript disabled all leave the finished artwork available.

The fixed media area prevents loading from changing layout. Header/footer captions sit outside the image so they cannot cover the horn or tail. The site keeps its SVG unicorn for navigation, favicon and other small brand applications.

## Updating the film

Rebuild and render the scene, then run the encoder described in the Blender README. It exports both videos directly from the PNG frames, validates the frame sequence and copies the compressed assets into the website. Increment the movie query version in `assets/studio.js` and the stylesheet/script query versions in `index.html` when releasing another revision.

Check the empty first frame, desktop and phone framing, play/pause/replay, offscreen behavior, reduced motion, data saving and failed playback. Run the site's build checks before publishing.
