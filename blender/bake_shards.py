"""Shatter a tile carrying the ribbon unicorn, then render it so it can play in reverse.

  /Applications/Blender.app/Contents/MacOS/Blender -b --python-exit-code 1 \
      -P blender/bake_shards.py -- --frames-dir output/shards
  python3 blender/encode_shards.py --frames-dir output/shards

A standing tile printed with assets/brand/ribbon-hero.png is cut into Voronoi
shards (by half-plane clipping, no add-on), each shard becomes an active rigid
body, and an unseen ball passes through it. Every frame is rendered with EEVEE;
encode_shards.py reverses the sequence so the page shows the tile rebuilding
itself. Shard geometry and the Voronoi cut are adapted from the Motion
Frontier lab's bake_fracture.py (30 September 2026).
"""
import math
import os
import sys
from pathlib import Path

import bpy
import numpy as np
from mathutils import Vector

ROOT = Path(__file__).resolve().parents[1]
argv = sys.argv[sys.argv.index('--') + 1:] if '--' in sys.argv else []
arg = lambda k, d: argv[argv.index(k) + 1] if k in argv else d
FRAMES_DIR = (ROOT / arg('--frames-dir', 'output/shards')).resolve()
N = int(arg('--shards', 150))
END = int(arg('--end', 150))
RES = [int(v) for v in arg('--size', '1600x900').split('x')]
ONLY = arg('--only', '')                    # a single frame number, for quick checks
W, H, T, Z0 = 2.0, 3.0, 0.06, 0.02          # tile width, height, thickness; gap above the floor
HIT = np.array([0.18, 1.95])                # where the ball passes, in tile coordinates (x, z above Z0)
SHRINK = 0.985                              # shards start fractionally apart so the solver does not push them
rng = np.random.default_rng(11)

# ---------- Voronoi cells by half-plane clipping ----------
near = HIT + rng.normal(0, 0.32, (int(N * 0.6), 2))
far = np.stack([rng.uniform(-W / 2, W / 2, N), rng.uniform(0, H, N)], 1)
seeds = np.concatenate([near, far])
seeds = seeds[(np.abs(seeds[:, 0]) < W / 2 - 0.01) & (seeds[:, 1] > 0.01) & (seeds[:, 1] < H - 0.01)][:N]


def clip(poly, p, n):
    """Keep the part of poly where dot(x - p, n) <= 0."""
    out = []
    for i in range(len(poly)):
        a, b = poly[i], poly[(i + 1) % len(poly)]
        da, db = np.dot(a - p, n), np.dot(b - p, n)
        if da <= 0:
            out.append(a)
        if (da < 0) != (db < 0) and da != db:
            out.append(a + (b - a) * (da / (da - db)))
    return out


cells = []
for i, s in enumerate(seeds):
    poly = [np.array(c, float) for c in ((-W / 2, 0), (W / 2, 0), (W / 2, H), (-W / 2, H))]
    for j, o in enumerate(seeds):
        if i != j:
            poly = clip(poly, (s + o) / 2, o - s)
            if len(poly) < 3:
                break
    if len(poly) < 3:
        continue
    poly = np.array(poly)
    x, y = poly[:, 0], poly[:, 1]
    cr = x * np.roll(y, -1) - np.roll(x, -1) * y
    area = cr.sum() / 2
    if abs(area) < 1e-5:
        continue
    c = np.array([((x + np.roll(x, -1)) * cr).sum(), ((y + np.roll(y, -1)) * cr).sum()]) / (6 * area)
    if area < 0:
        poly = poly[::-1]
    cells.append((c, poly - c, abs(area)))
print(f'{len(cells)} shards', flush=True)

# ---------- scene ----------
bpy.ops.wm.read_factory_settings(use_empty=True)
scene = bpy.context.scene
scene.frame_start, scene.frame_end = 1, END
scene.render.fps = 60
bpy.ops.rigidbody.world_add()
rw = scene.rigidbody_world
rw.substeps_per_frame = 60
rw.solver_iterations = 30
rw.point_cache.frame_start, rw.point_cache.frame_end = 1, END


def principled(name, color, rough, metallic=0.0):
    m = bpy.data.materials.new(name)
    m.use_nodes = True
    p = m.node_tree.nodes['Principled BSDF']
    p.inputs['Base Color'].default_value = (*color, 1)
    p.inputs['Roughness'].default_value = rough
    p.inputs['Metallic'].default_value = metallic
    return m, p


face, face_bsdf = principled('01 / Printed face', (1, 1, 1), 0.32)
nt = face.node_tree
art = nt.nodes.new('ShaderNodeTexImage')
art.image = bpy.data.images.load(str(ROOT / 'assets/brand/ribbon-hero.png'))
art.extension = 'EXTEND'
nt.links.new(art.outputs['Color'], face_bsdf.inputs['Base Color'])
nt.links.new(art.outputs['Color'], face_bsdf.inputs['Emission Color'])
face_bsdf.inputs['Emission Strength'].default_value = 0.35
face_bsdf.inputs['Coat Weight'].default_value = 0.35
face_bsdf.inputs['Coat Roughness'].default_value = 0.08
edge, edge_bsdf = principled('02 / Lit glass edge', (0.035, 0.03, 0.07), 0.3, 0.2)
edge_bsdf.inputs['Emission Color'].default_value = (0.55, 0.36, 1.0, 1)
edge_bsdf.inputs['Emission Strength'].default_value = 0.45
floor_mat, floor_bsdf = principled('03 / Charcoal floor', (0.010, 0.011, 0.019), 0.42)


def rigid(obj, kind, shape, **kw):
    bpy.ops.object.select_all(action='DESELECT')
    obj.select_set(True)
    bpy.context.view_layer.objects.active = obj
    bpy.ops.rigidbody.object_add(type=kind)
    rb = obj.rigid_body
    rb.collision_shape = shape
    for k, v in kw.items():
        setattr(rb, k, v)
    return rb


shards = []
for c, poly, area in cells:
    k = len(poly)
    sp = poly * SHRINK
    verts = [(p[0], -T / 2, p[1]) for p in sp] + [(p[0], T / 2, p[1]) for p in sp]
    faces = [tuple(range(k - 1, -1, -1)), tuple(range(k, 2 * k))] + [(i, (i + 1) % k, k + (i + 1) % k, k + i) for i in range(k)]
    me = bpy.data.meshes.new('shard')
    me.from_pydata(verts, [], faces)
    me.materials.append(face)
    me.materials.append(edge)
    uv = me.uv_layers.new(name='Tile')
    for poly_index, polygon in enumerate(me.polygons):
        polygon.material_index = 0 if poly_index == 0 else 1
        for li in polygon.loop_indices:
            vx, _, vz = verts[me.loops[li].vertex_index]
            uv.data[li].uv = ((vx + c[0] + W / 2) / W, (vz + c[1]) / H)   # the printed face lines up across shards
    me.update()
    ob = bpy.data.objects.new('shard', me)
    scene.collection.objects.link(ob)
    ob.location = (c[0], 0.0, Z0 + c[1])
    rigid(ob, 'ACTIVE', 'CONVEX_HULL', mass=max(area * 8.0, 0.02), friction=0.7, restitution=0.15,
          use_margin=True, collision_margin=0.0, use_deactivation=True, use_start_deactivated=True,
          linear_damping=0.05, angular_damping=0.1)
    shards.append(ob)

# A thick slab, not a plane: a zero-thickness floor lets fast shards tunnel through.
bpy.ops.mesh.primitive_cube_add(size=1, location=(0, 0, -0.5))
floor = bpy.context.object
floor.scale = (120, 120, 1)
bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)
floor.data.materials.append(floor_mat)
rigid(floor, 'PASSIVE', 'BOX', friction=0.8, restitution=0.1)

bpy.ops.mesh.primitive_uv_sphere_add(radius=0.16, location=(HIT[0], -3.2, Z0 + HIT[1] + 0.25))
ball = bpy.context.object
ball.hide_render = True
rigid(ball, 'PASSIVE', 'SPHERE', kinematic=True, friction=0.3, restitution=0.4)
for f, y, dz in ((1, -3.2, 0.25), (10, -3.2, 0.25), (22, 2.6, -0.05), (50, 14.0, -0.6)):
    ball.location = (HIT[0], y, Z0 + HIT[1] + dz)
    ball.keyframe_insert('location', frame=f)

# ---------- light and camera ----------
world = bpy.data.worlds.new('Night studio')
scene.world = world
world.use_nodes = True
world.node_tree.nodes['Background'].inputs[0].default_value = (0.010, 0.011, 0.020, 1)
world.node_tree.nodes['Background'].inputs[1].default_value = 1.0


def area(name, loc, target, color, power, size, size_y=None):
    data = bpy.data.lights.new(name, 'AREA')
    data.energy, data.color, data.shape = power, color, 'RECTANGLE'
    data.size, data.size_y = size, size_y or size
    ob = bpy.data.objects.new(name, data)
    scene.collection.objects.link(ob)
    ob.location = loc
    ob.rotation_euler = (Vector(target) - ob.location).to_track_quat('-Z', 'Y').to_euler()
    return ob


area('KEY / soft front', (-3.0, -5.0, 4.0), (0, 0, 1.4), (0.86, 0.90, 1.0), 380, 3.0, 4.0)
area('RIM / violet', (3.0, 2.5, 3.5), (0, 0, 1.2), (0.70, 0.40, 1.0), 900, 1.5, 5.0)
area('EDGE / glacial', (-4.0, 1.0, 2.5), (0, 0, 1.2), (0.40, 0.78, 1.0), 300, 0.6, 5.0)
area('FLOOR / pool', (0.0, -0.5, 5.0), (0, 0, 0), (0.75, 0.7, 1.0), 140, 4.0, 3.0)

cam_data = bpy.data.cameras.new('CAMERA / three-quarter')
cam_data.lens = 42
cam = bpy.data.objects.new('CAMERA / three-quarter', cam_data)
scene.collection.objects.link(cam)
scene.camera = cam
cam.location = (1.7, -7.4, 2.15)
cam.rotation_euler = (Vector((0.05, 0.4, 1.35)) - cam.location).to_track_quat('-Z', 'Y').to_euler()

for engine in ('BLENDER_EEVEE', 'BLENDER_EEVEE_NEXT'):
    try:
        scene.render.engine = engine
        break
    except TypeError:
        continue
eevee = scene.eevee
for key, value in (('taa_render_samples', 64), ('use_raytracing', True), ('use_shadows', True)):
    if hasattr(eevee, key):
        setattr(eevee, key, value)
scene.render.use_motion_blur = True
scene.render.motion_blur_shutter = 0.5
scene.view_settings.view_transform = 'AgX'
scene.view_settings.look = 'AgX - Medium High Contrast'
scene.render.resolution_x, scene.render.resolution_y = RES
scene.render.resolution_percentage = 100
scene.render.image_settings.file_format = 'PNG'
scene.render.image_settings.color_mode = 'RGB'

# ---------- simulate, then render ----------
for f in range(1, END + 1):
    scene.frame_set(f)                       # steps the solver in order and fills the cache
low = min(ob.matrix_world.translation.z for ob in shards)
print(f'lowest shard centre after {END} frames: {low:.3f}', flush=True)
FRAMES_DIR.mkdir(parents=True, exist_ok=True)
frames = [int(ONLY)] if ONLY else range(1, END + 1)
for f in frames:
    scene.frame_set(f)
    scene.render.filepath = str(FRAMES_DIR / f'f{f:04d}.png')
    bpy.ops.render.render(write_still=True)
    if f % 10 == 0:
        print(f'rendered {f}/{END}', flush=True)
print(f'shards: {len(shards)} shards, {END} frames -> {FRAMES_DIR}')
