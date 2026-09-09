# Ribbon 03 — Capra Studios · Revision 02

An eight-second, silent sculpture study based on the approved ribbon unicorn. The stage begins empty. A fine tail tip draws the outer mane, its violet returning fold follows, then the forehead, muzzle and horn complete the silhouette. A restrained turn and moving reflection carry the finished pose through the final two seconds.

This is a native Blender scene: four procedural ribbon surfaces with thickness, satin materials, a moving camera and five area lights. Geometry Nodes evaluates the reveal continuously at every subframe. There are no baked deformation poses, external textures, image planes, add-ons or generated video.

## What changed

- **True empty start:** all four ribbon surfaces have zero vertices at the first frame. Opening posters match the empty stage; completed posters remain available for reduced motion and data-saving fallbacks.
- **Continuous motion:** 480 individually rendered frames at 60 fps. Paired Bezier rails are resampled by distance; velocity eases into and out of each stroke without the earlier eight-frame pose interpolation. The inner fold follows the outer ribbon instead of racing ahead.
- **Sculpted light:** separate blue and violet faces, narrow glacial edge reflections, a shaped key light and a quiet fill bring out the folds without flooding the metal with white light.
- **Calmer composition:** one gentle turn and a restrained camera push replace the changing-direction orbit and cropped opening.

## Deliverables

- `capra-ribbon-unicorn.blend`: editable scene, saved at the finished pose.
- `unicorn.py`: rebuilds the silhouette, materials, lights, camera and animation.
- `ribbon_geometry.py`: native Geometry Nodes builder and arc-length rail sampling. Edit the paired Bezier rails in `unicorn.py` to change the silhouette, or the four modifiers' Progress controls to retime the saved scene.
- `render.py`: renders resumable sequences. A scene hash and settings manifest prevent accidentally mixing revisions or render settings.
- `encode.py`: validates the continuous sequence, then exports H.264 films and posters with FFmpeg.
- `../assets/motion/capra-unicorn-1080p.mp4`: 1920×1080, 60 fps, eight seconds, H.264, no audio.
- `../assets/motion/capra-unicorn-mobile.mp4`: centered 900×900 phone crop, same duration and frame rate.
- `../assets/motion/*poster.jpg`: empty opening frames and finished-pose fallbacks.
- `preview.html`: responsive review player with replay and wide/phone formats.

The film is delivered for visual review. The live homepage still uses the approved SVG/still ribbon reveal. These compressed videos work on GitHub Pages; no new hosting service or runtime Python process is needed.

Run `npm run dev` and open `/blender/preview.html`. The development server supports byte ranges so seeking and format changes work correctly. The wide film is 1.08 MB; the phone film is 0.39 MB.

## Reproduce

Built with Blender 5.2.1 LTS on an Apple M1. The final film uses EEVEE studio area lights, 32 render samples and a half-frame motion-blur shutter. Cycles/Metal is configured in the source scene and supported as an optional render path. The saved scene contains its complete animation and requires no Python handlers during playback.

```sh
blender -b --python-exit-code 1 --python blender/unicorn.py -- --frame 480
blender -b --python-exit-code 1 --python blender/render.py -- --engine eevee --samples 32 --raster --folder final
python3 blender/encode.py --folder final
```

On macOS, the Blender executable may be `/Applications/Blender.app/Contents/MacOS/Blender`. FFmpeg must be on `PATH`, or its full executable path supplied in `CAPRA_FFMPEG`.

A quick motion proof still renders every frame at 60 fps, using a smaller image and fewer samples:

```sh
blender -b --python-exit-code 1 --python blender/render.py -- --engine eevee --scale 33 --samples 8 --raster --folder proof
python3 blender/encode.py --draft --folder proof
```

Frames and intermediate outputs live under ignored `output/blender/v2/`. Use a new `--folder` after rebuilding the scene or changing render settings. Matching renders resume in contiguous animation runs, skipping existing PNGs; mismatched manifests stop with an error. The encoder rejects missing frames, discontinuous sequences, mismatched scene revisions and undersized final renders. `--draft` writes a local motion proof without replacing the deliverables.

## Website handoff

Use the wide film on desktop and the square film on phones. The full animation remains contained in the square crop. Preserve the stage's HTML captions and stable height. Use muted inline playback, the matching opening poster and visible pause/replay controls. Honor reduced motion and data-saving preferences with the finished still, and pause offscreen. Failed playback should also show the finished still. This finite eight-second sequence settles into the mark instead of jumping back into an automatic loop.

Keep `.blend` sources and frame sequences outside deployable assets. Only compressed films and posters belong on Pages.
