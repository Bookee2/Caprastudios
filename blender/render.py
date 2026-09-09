"""Render the saved sculpture with resumable frames and explicit GPU selection."""
import argparse
import hashlib
import json
import sys
from pathlib import Path
import bpy

p=argparse.ArgumentParser()
p.add_argument('--engine', choices=['cycles','eevee'], default='eevee')
p.add_argument('--scale', type=int, default=100)
p.add_argument('--samples', type=int, default=64)
p.add_argument('--start', type=int, default=1)
p.add_argument('--end', type=int)
p.add_argument('--step', type=int, default=1)
p.add_argument('--folder', default='frames')
p.add_argument('--raster', action='store_true', help='Use studio area lights without screen-space ray tracing.')
p.add_argument('--scene', type=Path)
args=p.parse_args(sys.argv[sys.argv.index('--')+1:])
root=Path(__file__).resolve().parents[1]
source=args.scene or root/'output'/'blender'/'v2'/'capra-ribbon-unicorn.blend'
out=source.parent
bpy.ops.wm.open_mainfile(filepath=str(source))
s=bpy.context.scene
s.render.resolution_percentage=args.scale
s.render.use_motion_blur=True
s.render.motion_blur_shutter=.5
s.render.image_settings.file_format='PNG'
s.render.image_settings.color_mode='RGB'
s.render.image_settings.color_depth='8'
s.render.image_settings.compression=20
if args.engine=='eevee':
    s.render.engine='BLENDER_EEVEE'
    s.eevee.taa_render_samples=args.samples
    s.eevee.use_raytracing=not args.raster
    s.eevee.shadow_ray_count=2
else:
    s.render.engine='CYCLES'
    prefs=bpy.context.preferences.addons['cycles'].preferences
    prefs.compute_device_type='METAL'
    prefs.get_devices()
    for d in prefs.devices:
        d.use=d.type=='METAL'
    s.cycles.device='GPU'
    s.cycles.samples=args.samples
    s.cycles.use_denoising=True
    s.render.use_persistent_data=True
dest=out/args.folder
dest.mkdir(parents=True,exist_ok=True)
settings={'source_sha256':hashlib.sha256(source.read_bytes()).hexdigest(),
          'engine':args.engine,'samples':args.samples,'scale':args.scale,'ray_tracing':not args.raster,
          'fps':s.render.fps,'frame_end':s.frame_end,'shutter':s.render.motion_blur_shutter}
manifest=dest/'render-info.json'
if manifest.exists() and json.loads(manifest.read_text())!=settings:
    raise RuntimeError('Scene or render settings changed. Use a new output folder to avoid mixing revisions.')
manifest.write_text(json.dumps(settings,indent=2))
end=args.end or s.frame_end
pending=[frame for frame in range(args.start,end+1,args.step)
         if not (dest/f'unicorn-{frame:04d}.png').exists()]
# Render contiguous runs as native animations so Blender can retain its engine
# between frames. Existing files still split the runs and are never overwritten.
runs=[]
for frame in pending:
    if not runs or frame!=runs[-1][-1]+args.step:
        runs.append([])
    runs[-1].append(frame)
def report_frame(render_scene):
    print(f'CAPRA_FRAME {render_scene.frame_current} / {end}',flush=True)
bpy.app.handlers.render_write.append(report_frame)
s.render.filepath=str(dest/'unicorn-')
s.frame_step=args.step
try:
    for run in runs:
        s.frame_start,s.frame_end=run[0],run[-1]
        bpy.ops.render.render(animation=True)
finally:
    bpy.app.handlers.render_write.remove(report_frame)
print('CAPRA_RENDER_COMPLETE',dest,flush=True)
