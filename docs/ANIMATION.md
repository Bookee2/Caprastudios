# Homepage unicorn film

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
