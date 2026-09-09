# Ribbon 03 — Capra Studios

An eight-second, silent sculpture study based on the approved ribbon unicorn. A close view of the lower fold opens into the full silhouette. The sculpture turns gently as a tall reflection moves across the satin surface, then settles into the brand pose.

This is a native Blender scene: four curved metal ribbon meshes with thickness, brushed materials, keyed deformation, camera movement, and area lights. No image plane, generated video, add-on, or external texture is used. The approved artwork informed the silhouette; it is not embedded in the render.

## Deliverables

- `capra-ribbon-unicorn.blend`: editable scene, saved at the finished pose.
- `unicorn.py`: rebuilds the meshes, materials, lighting, camera and animation without external dependencies. The paired Bezier rails are editable art-direction controls.
- `render.py`: renders resumable image sequences; skips existing frames in the selected output folder.
- `encode.py`: exports H.264 films and posters with FFmpeg.
- `../assets/motion/capra-unicorn-1080p.mp4`: 1920×1080, 30 fps, eight seconds, H.264, no audio.
- `../assets/motion/capra-unicorn-mobile.mp4`: centered 900×900 phone crop, same duration and frame rate.
- `../assets/motion/*poster.jpg`: final-pose fallbacks.
- `preview.html`: review-page source, copied into `output/blender/index.html` by the encoder.

The rendered study is delivered for visual review. The live homepage still uses the approved SVG/still ribbon reveal. No new hosting service is needed to use these videos on GitHub Pages.

Run `npm run dev` and open `/blender/preview.html` for the review player. The development server supports byte ranges so seeking and format changes work correctly. The wide film is approximately 1.10 MB; the phone film is approximately 0.56 MB.

## Reproduce

Built with Blender 5.2.1 LTS on an Apple M1. The final film uses EEVEE with studio area lights, 32 render samples and a quarter-frame motion-blur shutter. Cycles/Metal and EEVEE ray tracing were used to compare stills; the final studio-light render gives the ribbon a clean satin finish. Cycles/Metal is also configured in the source scene and supported as an optional render path.

```sh
blender -b --python blender/unicorn.py -- --frame 240
blender -b --python blender/render.py -- --engine eevee --samples 32 --raster --folder final
python3 blender/encode.py --folder final
```

On macOS, the Blender executable may be `/Applications/Blender.app/Contents/MacOS/Blender`. FFmpeg must be on `PATH`, or its full executable path supplied in `CAPRA_FFMPEG`. No runtime Python or Blender process is required on the website.

For a quick proof, render every third frame at half resolution, then encode at 10 fps:

```sh
blender -b --python blender/render.py -- --scale 50 --samples 16 --step 3 --folder draft
python3 blender/encode.py --draft
```

Frames and intermediate outputs live under ignored `output/blender/`. Use a new `--folder` after changing the scene, or remove only the previous render's frame files before rendering again; the renderer intentionally resumes rather than overwriting existing frames.

## Website handoff

Use the wide film on desktop and the square film on phones. The final pose is fully contained in the square crop. Preserve the stage's HTML captions and stable height. Use muted, inline playback with a poster; honor reduced motion and data-saving preferences; expose pause/replay controls and pause offscreen. A failed or disabled video should leave the finished poster visible. The finite eight-second sequence is designed to settle, rather than jump back into an automatic loop.

Keep `.blend` sources and frame sequences outside the deployable assets. Only the compressed films and posters belong on Pages.
