# Atlanta flyover case study

The featured motion case study appears first in Selected Work, below the unicorn feature and ahead of the three founder-built websites. Its copy describes the supplied film as a creative motion study, without inventing a client, results or production credits.

The complete 72-second route is preserved: Decatur, Downtown, Midtown and Buckhead. Both exports retain the widescreen composition and embedded location labels. The case-study player is click-to-play, never autoplays, and requests no video until the visitor chooses to watch. JavaScript selects a 960×540 phone export or the 1280×720 desktop export; native controls provide pause, seeking and fullscreen. Playback pauses when the film leaves the viewport or the tab is hidden. JavaScript-disabled visitors retain the native player and poster.

## Color and exports

A restrained baked grade adds contrast (1.08), slightly reduces brightness (-0.018) and saturation (0.90), and cools shadows and midtones. The greenery and building tones remain recognizable. Blue controls and the Tokyo Night frame connect the footage to the rest of the site without a heavy purple overlay. The decorative play overlay disappears during playback.

The original user-supplied MP4 is unchanged. Reproduce the deliverables with:

```sh
CAPRA_FFMPEG=/path/to/ffmpeg python3 scripts/prepare-atlanta.py /path/to/original.mp4
```

Outputs are `assets/motion/atlanta-wide.mp4`, `atlanta-mobile.mp4` and `atlanta-poster.jpg`. The films use H.264, 24 fps, no audio and fast-start metadata. Bitrate caps limit download size for the detailed moving map imagery. The poster comes from the Downtown view at 24 seconds and receives the same grade. These files require only GitHub Pages hosting.
