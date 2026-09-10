"""Capra Studios / Ribbon 03, revision 2. Continuous procedural sculpture.

Run with Blender 5.2: blender -b --python blender/unicorn.py -- --preview
No image planes, external assets, add-ons, or Python packages are required.
"""
import argparse
import math
import sys
from pathlib import Path

import bpy
from mathutils import Vector

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / 'output' / 'blender' / 'v2'
OUT.mkdir(parents=True, exist_ok=True)
args = argparse.ArgumentParser()
args.add_argument('--preview', action='store_true')
args.add_argument('--render', action='store_true')
args.add_argument('--frame', type=int, default=480)
args.add_argument('--samples', type=int, default=48)
opts = args.parse_args(sys.argv[sys.argv.index('--') + 1:] if '--' in sys.argv else [])

bpy.ops.object.select_all(action='SELECT')
bpy.ops.object.delete(use_global=False)
for data in bpy.data.materials:
    bpy.data.materials.remove(data)
scene = bpy.context.scene
scene.render.engine = 'CYCLES'
prefs = bpy.context.preferences.addons['cycles'].preferences
prefs.compute_device_type = 'METAL'
prefs.get_devices()
for device in prefs.devices:
    device.use = device.type == 'METAL'
scene.cycles.device = 'GPU'
scene.cycles.samples = opts.samples
scene.cycles.use_denoising = True
scene.cycles.max_bounces = 6
scene.cycles.transparent_max_bounces = 4
scene.render.resolution_x = 1920
scene.render.resolution_y = 1080
scene.render.resolution_percentage = 50 if opts.preview else 100
scene.render.image_settings.file_format = 'PNG'
scene.render.image_settings.color_mode = 'RGB'
scene.render.fps = 60
scene.frame_start = 1
scene.frame_end = 480
scene.view_settings.view_transform = 'AgX'
scene.view_settings.look = 'AgX - Medium High Contrast'
scene.view_settings.exposure = 0.0
scene.render.film_transparent = False
scene.world.use_nodes = True
scene.world.node_tree.nodes['Background'].inputs[0].default_value = (0.08, 0.10, 0.17, 1)
scene.world.node_tree.nodes['Background'].inputs[1].default_value = 0.16

def material(name, color, metallic=.86, roughness=.23, brushed=False):
    m = bpy.data.materials.new(name)
    m.diffuse_color = (*color, 1)
    m.use_nodes = True
    nt = m.node_tree
    p = nt.nodes.get('Principled BSDF')
    p.inputs['Base Color'].default_value = (*color, 1)
    p.inputs['Metallic'].default_value = metallic
    p.inputs['Roughness'].default_value = roughness
    p.inputs['Anisotropic'].default_value = .38
    p.inputs['Coat Weight'].default_value = .18
    p.inputs['Coat Roughness'].default_value = .16
    if brushed:
        uv = nt.nodes.new('ShaderNodeTexCoord')
        mapping = nt.nodes.new('ShaderNodeVectorMath')
        mapping.operation = 'MULTIPLY'
        mapping.inputs[1].default_value = (2, 220, 1)
        noise = nt.nodes.new('ShaderNodeTexNoise')
        noise.inputs['Scale'].default_value = 1
        noise.inputs['Detail'].default_value = 2
        bump = nt.nodes.new('ShaderNodeBump')
        bump.inputs['Strength'].default_value = .035
        bump.inputs['Distance'].default_value = .0015
        nt.links.new(uv.outputs['UV'], mapping.inputs[0])
        nt.links.new(mapping.outputs[0], noise.inputs['Vector'])
        nt.links.new(noise.outputs['Fac'], bump.inputs['Height'])
        nt.links.new(bump.outputs[0], p.inputs['Normal'])
    return m

blue = material('01 / Anodized periwinkle satin', (.09, .23, .64), brushed=True)
violet = material('02 / Violet reverse', (.27, .085, .57), .82, .27, True)
edge = material('03 / Machined pale-blue edge', (.38, .63, .90), .94, .19)
horn_mat = material('04 / Ice-blue horn', (.18, .47, .82), .88, .20, True)

root = bpy.data.objects.new('RIBBON / animated assembly', None)
scene.collection.objects.link(root)

sys.path.insert(0, str(Path(__file__).resolve().parent))
from ribbon_geometry import ribbon

# Two edges of each continuous strip. Depth is the third coordinate in metres.
# The mane crosses in projection, while its rails pass over/under in depth.
main_a=[(575,296,.14),(351,319,.18),(119,450,.08),(128,589,-.05),
        (132,714,-.37),(494,743,-.43),(619,912,-.23),
        (746,1080,.05),(741,1171,.21),(658,1251,.27),
        (561,1344,.20),(408,1380,.06),(295,1398,0)]
main_b=[(574,376,.23),(375,399,.23),(102,637,.03),(150,782,-.10),
        (177,911,-.27),(479,923,-.31),(582,1003,-.13),
        (720,1121,.17),(522,1234,.35),(420,1313,.26),
        (390,1347,.15),(334,1380,.03),(295,1398,0)]
ribbon('01 / Continuous S-shaped mane',main_a,main_b,blue,violet,edge,root,1,190,reverse=True,bulge=.065)

back_a=[(460,392,.25),(372,493,.34),(377,667,.36),(475,787,.29),
        (521,880,.30),(519,967,.35),(482,1040,.41),
        (425,1153,.34),(443,1260,.25),(295,1398,0)]
back_b=[(349,429,.31),(280,506,.27),(210,680,.26),(280,783,.29),
        (317,892,.26),(410,937,.39),(447,1036,.43),
        (493,1144,.28),(428,1284,.08),(295,1398,0)]
ribbon('02 / Returning violet fold',back_a,back_b,violet,blue,edge,root,1,232,reverse=True,bulge=.05)

# Forehead loop, long fine muzzle, round nose return and open jaw.
face_a=[(571,363,-.10),(571,325,-.10),(553,294,-.04),(510,266,.06),
        (446,219,.08),(494,164,.06),(548,200,-.02),
        (638,249,-.12),(643,297,-.26),(634,375,-.25),
        (628,461,-.37),(756,513,-.31),(839,641,-.20),
        (893,717,-.11),(815,796,-.15),(757,730,-.22),
        (713,681,-.18),(706,675,-.13),(603,650,-.14),
        (494,625,-.16),(440,576,-.17),(431,493,-.16)]
face_b=[(584,370,.07),(589,329,.09),(600,304,.10),(564,263,.16),
        (523,225,.12),(517,216,.12),(546,244,.06),
        (573,290,-.02),(582,331,-.03),(576,384,-.05),
        (566,490,-.18),(732,557,-.14),(837,643,-.19),
        (863,674,-.21),(786,758,-.27),(759,721,-.28),
        (741,608,-.29),(709,611,-.27),(600,594,-.25),
        (493,582,-.18),(453,557,-.14),(431,493,-.16)]
ribbon('03 / Forehead loop and open muzzle',face_a,face_b,blue,violet,edge,root,184,318,bulge=.055,flip=True)

horn_a=[(604,325,.05),(731,258,.04),(858,178,.00),(945,117,-.015)]
horn_b=[(616,402,.14),(742,307,.15),(866,198,.04),(945,117,-.015)]
ribbon('04 / Tapered horn',horn_a,horn_b,horn_mat,violet,edge,root,254,350,bulge=.08,flip=True)

for frame, angle in [(1,-18),(480,0)]:
    root.rotation_euler=(0,0,math.radians(angle))
    root.keyframe_insert('rotation_euler',frame=frame)

def aim(ob,target):
    ob.rotation_euler=(Vector(target)-ob.location).to_track_quat('-Z','Y').to_euler()

def area(name, loc, target, color, power, size, size_y=None):
    data=bpy.data.lights.new(name,'AREA')
    data.energy=power
    data.color=color
    data.shape='RECTANGLE'
    data.size=size
    data.size_y=size_y or size
    ob=bpy.data.objects.new(name,data)
    scene.collection.objects.link(ob)
    ob.location=loc
    aim(ob,target)
    return ob

area('KEY / shaped silk',(-3,-4.5,3.5),(0,0,.5),(.82,.90,1),450,2.5,4.5)
area('FILL / quiet blue',(2,-5,.5),(0,0,0),(.50,.66,1),160,4,5)
area('RIM / violet reverse',(2.5,2,2.7),(0,0,.5),(.67,.36,1),950,1.5,5)
area('EDGE / glacial strip',(-4,-1,2),(0,0,.4),(.40,.78,1),650,.55,5)
light=area('SWEEP / narrow moving reflection',(-3,-3.6,3.2),(0,0,.25),(.90,.96,1),340,.65,5)
for frame, x in [(1,-3),(480,2)]:
    light.location.x=x
    aim(light,(0,0,.3))
    light.keyframe_insert('location',frame=frame)
    light.keyframe_insert('rotation_euler',frame=frame)

floor_mat=material('05 / Charcoal infinity',(.018,.019,.029),0,.68)
floor_mat.node_tree.nodes['Principled BSDF'].inputs['Specular IOR Level'].default_value=.10
floor_mat.node_tree.nodes['Principled BSDF'].inputs['Coat Weight'].default_value=0
bpy.ops.mesh.primitive_plane_add(size=200, location=(0,0,-2.79))
floor=bpy.context.object
floor.name='STAGE / infinite charcoal'
floor.data.materials.append(floor_mat)

camera_data=bpy.data.cameras.new('CAMERA / slow reveal')
camera=bpy.data.objects.new('CAMERA / slow reveal',camera_data)
scene.collection.objects.link(camera)
scene.camera=camera
camera_data.type='ORTHO'
for frame, scale, target_z in [(1,12.2,.02),(480,11.7,.02)]:
    camera.location=(0,-17,target_z+1.15)
    aim(camera,(0,0,target_z))
    camera.keyframe_insert('location',frame=frame)
    camera.keyframe_insert('rotation_euler',frame=frame)
    camera_data.ortho_scale=scale
    camera_data.keyframe_insert('ortho_scale',frame=frame)

scene['Studio']='Capra Studios / Ribbon 03 / Revision 02'
scene['Concept']='An empty stage. A ribbon begins at its tail tip, draws the neck, then the face and horn. A single calm arc through sculpted light.'
scene['Delivery']='480 native frames at 60 fps; 1920 x 1080; silent'
scene.frame_set(opts.frame)
for screen in bpy.data.screens:
    for area in screen.areas:
        if area.type=='VIEW_3D':
            area.spaces.active.region_3d.view_perspective='CAMERA'
            area.spaces.active.shading.color_type='MATERIAL'
bpy.ops.wm.save_as_mainfile(filepath=str(OUT/'capra-ribbon-unicorn.blend'))
if opts.preview:
    scene.render.filepath=str(OUT/f'preview-{opts.frame:03}.png')
    bpy.ops.render.render(write_still=True)
elif opts.render:
    scene.render.filepath=str(OUT/'frames'/'unicorn-')
    bpy.ops.render.render(animation=True)
print('CAPRA_SCENE', OUT/'capra-ribbon-unicorn.blend')
