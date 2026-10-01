"""Turn the finished ribbon unicorn once and pack the frames into one sprite sheet.

  /Applications/Blender.app/Contents/MacOS/Blender -b blender/capra-ribbon-unicorn.blend \
      --python-exit-code 1 -P blender/bake_turntable.py -- --out assets/motion/unicorn-turntable.webp

Opens the saved scene at its finished pose, removes the floor, and turns the
sculpture about its own vertical axis. Cycles renders each angle on a
transparent background; the frames are pasted into a grid and saved as one
WebP, so the page needs one image and no GPU. Adapted from the Motion Frontier
lab's buckle turntable (bake_turntable.py, 30 September 2026).
"""
import math
import os
import sys
import tempfile

import bpy
import numpy as np
from mathutils import Vector

argv = sys.argv[sys.argv.index('--') + 1:] if '--' in sys.argv else []
arg = lambda k, d: argv[argv.index(k) + 1] if k in argv else d
OUT = os.path.abspath(arg('--out', 'unicorn-turntable.webp'))
FRAMES, COLS = int(arg('--frames', 60)), int(arg('--cols', 10))
W, H = int(arg('--width', 400)), int(arg('--height', 500))
SAMPLES = int(arg('--samples', 96))

scene = bpy.context.scene
scene.frame_set(480)                                    # the finished pose
for ob in [o for o in scene.objects if o.name.startswith('STAGE')]:
    bpy.data.objects.remove(ob, do_unlink=True)
root = bpy.data.objects['RIBBON / animated assembly']
root.animation_data_clear()
root.rotation_euler = (0, 0, 0)
bpy.context.view_layer.update()

# Measure the evaluated sculpture so it turns about its own centre and never leaves the frame.
deps = bpy.context.evaluated_depsgraph_get()
points = []
for ob in scene.objects:
    if ob.type == 'MESH' and ob.parent == root and not ob.hide_render:
        ev = ob.evaluated_get(deps)
        points += [ev.matrix_world @ v.co for v in ev.data.vertices]
pts = np.array([p.to_tuple() for p in points])
cx, cy = (pts[:, 0].min() + pts[:, 0].max()) / 2, (pts[:, 1].min() + pts[:, 1].max()) / 2
zmin, zmax = pts[:, 2].min(), pts[:, 2].max()
radius = np.hypot(pts[:, 0] - cx, pts[:, 1] - cy).max()
pivot = bpy.data.objects.new('TURNTABLE / pivot', None)
scene.collection.objects.link(pivot)
pivot.location = (cx, cy, 0)
bpy.context.view_layer.update()
root.parent = pivot
root.matrix_parent_inverse = pivot.matrix_world.inverted()

cam = scene.camera
cam.animation_data_clear()
cam.data.animation_data_clear()
cam.data.type = 'ORTHO'
zc = (zmin + zmax) / 2
cam.location = (cx, cy - 17, zc + 0.6)
cam.rotation_euler = (Vector((cx, cy, zc)) - cam.location).to_track_quat('-Z', 'Y').to_euler()
cam.data.ortho_scale = max((zmax - zmin) * 1.1, 2 * radius * 1.06 * H / W)

scene.render.engine = 'CYCLES'
scene.cycles.samples = SAMPLES
scene.cycles.use_denoising = True
scene.render.resolution_x, scene.render.resolution_y = W, H
scene.render.resolution_percentage = 100
scene.render.film_transparent = True
scene.render.use_motion_blur = False
scene.render.image_settings.file_format = 'PNG'
scene.render.image_settings.color_mode = 'RGBA'

rows = math.ceil(FRAMES / COLS)
sheet = np.zeros((rows * H, COLS * W, 4), np.float32)
tmp = tempfile.mkdtemp()
for f in range(FRAMES):
    pivot.rotation_euler = (0, 0, math.tau * f / FRAMES)
    scene.render.filepath = os.path.join(tmp, f'f{f:03d}.png')
    bpy.ops.render.render(write_still=True)
    im = bpy.data.images.load(scene.render.filepath)
    px = np.empty(W * H * 4, np.float32)
    im.pixels.foreach_get(px)
    px = px.reshape(H, W, 4)                            # Blender rows run bottom to top
    r, c = divmod(f, COLS)
    y0 = (rows - 1 - r) * H
    sheet[y0:y0 + H, c * W:(c + 1) * W] = px
    bpy.data.images.remove(im)
    print(f'frame {f + 1}/{FRAMES}', flush=True)
out = bpy.data.images.new('sheet', COLS * W, rows * H, alpha=True)
out.pixels.foreach_set(sheet.ravel())
scene.render.image_settings.file_format = 'WEBP'
scene.render.image_settings.color_mode = 'RGBA'
scene.render.image_settings.quality = 82
out.save_render(OUT, scene=scene)
# The first frame alone, for the poster and the no-JavaScript view.
first = os.path.join(tmp, 'f000.png')
im = bpy.data.images.load(first)
scene.render.image_settings.quality = 88
im.save_render(OUT.replace('.webp', '-poster.webp'), scene=scene)
print(f'turntable: {FRAMES} frames, {COLS}x{rows} grid of {W}x{H} -> {OUT}')
