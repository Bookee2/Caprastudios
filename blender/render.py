"""Render the saved sculpture with resumable frames and explicit GPU selection."""
import argparse
import sys
from pathlib import Path
import bpy

p=argparse.ArgumentParser()
p.add_argument('--engine', choices=['cycles','eevee'], default='eevee')
p.add_argument('--scale', type=int, default=100)
p.add_argument('--samples', type=int, default=64)
p.add_argument('--start', type=int, default=1)
p.add_argument('--end', type=int, default=240)
p.add_argument('--step', type=int, default=1)
p.add_argument('--folder', default='frames')
p.add_argument('--raster', action='store_true', help='Use studio area lights without screen-space ray tracing.')
args=p.parse_args(sys.argv[sys.argv.index('--')+1:])
root=Path(__file__).resolve().parents[1]
out=root/'output'/'blender'
bpy.ops.wm.open_mainfile(filepath=str(out/'capra-ribbon-unicorn.blend'))
s=bpy.context.scene
s.render.resolution_percentage=args.scale
s.render.use_motion_blur=True
s.render.motion_blur_shutter=.25
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
for frame in range(args.start,args.end+1,args.step):
    file=dest/f'unicorn-{frame:04d}.png'
    if file.exists():
        continue
    s.frame_set(frame)
    s.render.filepath=str(file)
    bpy.ops.render.render(write_still=True)
    print(f'CAPRA_FRAME {frame} / {args.end}',flush=True)
print('CAPRA_RENDER_COMPLETE',dest,flush=True)
