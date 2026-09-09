"""Capra Studios / Ribbon 03. Editable, procedural Blender sculpture.

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
OUT = ROOT / 'output' / 'blender'
OUT.mkdir(parents=True, exist_ok=True)
args = argparse.ArgumentParser()
args.add_argument('--preview', action='store_true')
args.add_argument('--render', action='store_true')
args.add_argument('--frame', type=int, default=164)
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
scene.render.fps = 30
scene.frame_start = 1
scene.frame_end = 240
scene.view_settings.view_transform = 'AgX'
scene.view_settings.look = 'AgX - Medium High Contrast'
scene.view_settings.exposure = 0.0
scene.render.film_transparent = False
scene.world.use_nodes = True
scene.world.node_tree.nodes['Background'].inputs[0].default_value = (0.09, 0.11, 0.19, 1)
scene.world.node_tree.nodes['Background'].inputs[1].default_value = 0.22

def material(name, color, metallic=.75, roughness=.28, brushed=False):
    m = bpy.data.materials.new(name)
    m.diffuse_color = (*color, 1)
    m.use_nodes = True
    nt = m.node_tree
    p = nt.nodes.get('Principled BSDF')
    p.inputs['Base Color'].default_value = (*color, 1)
    p.inputs['Metallic'].default_value = metallic
    p.inputs['Roughness'].default_value = roughness
    p.inputs['Anisotropic'].default_value = .38
    p.inputs['Coat Weight'].default_value = .23
    p.inputs['Coat Roughness'].default_value = .22
    if brushed:
        uv = nt.nodes.new('ShaderNodeTexCoord')
        mapping = nt.nodes.new('ShaderNodeVectorMath')
        mapping.operation = 'MULTIPLY'
        mapping.inputs[1].default_value = (2, 700, 1)
        noise = nt.nodes.new('ShaderNodeTexNoise')
        noise.inputs['Scale'].default_value = 1
        noise.inputs['Detail'].default_value = 2
        bump = nt.nodes.new('ShaderNodeBump')
        bump.inputs['Strength'].default_value = .05
        bump.inputs['Distance'].default_value = .003
        nt.links.new(uv.outputs['UV'], mapping.inputs[0])
        nt.links.new(mapping.outputs[0], noise.inputs['Vector'])
        nt.links.new(noise.outputs['Fac'], bump.inputs['Height'])
        nt.links.new(bump.outputs[0], p.inputs['Normal'])
    return m

blue = material('01 / Anodized periwinkle satin', (.15, .27, .76), brushed=True)
violet = material('02 / Violet reverse', (.24, .10, .55), brushed=True)
edge = material('03 / Machined pale-blue edge', (.53, .75, .94), .82, .19)
horn_mat = material('04 / Ice-blue horn', (.23, .52, .90), .8, .22, True)

root = bpy.data.objects.new('RIBBON / animated assembly', None)
scene.collection.objects.link(root)

def cubic(p0, p1, p2, p3, t):
    return tuple((1-t)**3*p0[i] + 3*(1-t)**2*t*p1[i] + 3*(1-t)*t*t*p2[i] + t**3*p3[i] for i in range(3))

def rail(points, t):
    n = (len(points)-1)//3
    u = max(0, min(t, .9999999)) * n
    k = int(u)
    return Vector(cubic(*points[k*3:k*3+4], u-k))

def xyz(p):
    # Art-directed rails use the approved portrait's pixel coordinates and depth.
    return Vector(((p.x-525)/245, p.z, (780-p.y)/245))

def smooth(x):
    x = max(0, min(x, 1))
    return x*x*(3-2*x)

def ribbon(name, a, b, mat, start, finish, reverse=False, bulge=.045, initial=0):
    rows, cols = 240, 12
    def vertices(growth=1, flutter=0):
        result=[]
        for i in range(rows+1):
            t = i/rows
            u = 1-t*growth if reverse else t*growth
            pa, pb = xyz(rail(a,u)), xyz(rail(b,u))
            for j in range(cols+1):
                v = j/cols
                taper = 1 - (1-smooth((1-t)/.10))*(1-smooth((growth-.87)/.13))
                p = pa.lerp(pb,.5+(v-.5)*taper)
                p.y -= bulge*math.sin(v*math.pi)*taper
                # A slight torsion makes the unfurl physically legible in 3D.
                p.y += flutter*math.sin(t*math.pi)*math.sin(v*math.pi*1.5)*taper
                result.append(tuple(p))
        return result
    verts = vertices()
    faces=[]
    for i in range(rows):
        for j in range(cols):
            n=i*(cols+1)+j
            faces.append((n,n+cols+1,n+cols+2,n+1))
    mesh=bpy.data.meshes.new(name)
    mesh.from_pydata(verts, [], faces)
    mesh.update()
    ob=bpy.data.objects.new(name,mesh)
    scene.collection.objects.link(ob)
    ob.parent=root
    if start>1:
        ob.hide_render=True
        ob.keyframe_insert('hide_render',frame=1)
        ob.keyframe_insert('hide_render',frame=start-1)
        ob.hide_render=False
        ob.keyframe_insert('hide_render',frame=start)
    ob.data.materials.append(mat)
    ob.data.materials.append(edge)
    for p in mesh.polygons:
        p.use_smooth=True
    uv=mesh.uv_layers.new(name='Along the brushed ribbon')
    for p in mesh.polygons:
        for idx in p.loop_indices:
            vtx=mesh.loops[idx].vertex_index
            uv.data[idx].uv=(vtx//(cols+1)/rows, vtx%(cols+1)/cols)
    ob.shape_key_add(name='Settled silhouette')
    # Absolute sampled shape keys keep the saved scene renderable without handlers.
    samples=sorted(set([1]+list(range(start,finish,8))+[finish,156,196,240]))
    bpy.context.preferences.edit.keyframe_new_interpolation_type='LINEAR'
    for index, frame in enumerate(samples):
        g = max(.001, initial + (1-initial)*smooth((frame-start)/(finish-start)))
        flutter = .28*math.sin(math.pi*g) if frame<=finish else .025*math.sin((frame-finish)/90*math.pi)
        key=ob.shape_key_add(name=f'Unfurl {frame:03d}')
        for vert, co in zip(key.data,vertices(g,flutter)):
            vert.co=co
        key.value=0
        if index:
            key.keyframe_insert('value',frame=samples[index-1])
        key.value=1
        key.keyframe_insert('value',frame=frame)
        if index<len(samples)-1:
            key.value=0
            key.keyframe_insert('value',frame=samples[index+1])
    bpy.context.preferences.edit.keyframe_new_interpolation_type='BEZIER'
    # A solid metal strip, with softened, light-catching edges.
    mod=ob.modifiers.new('Ribbon thickness / 12 mm','SOLIDIFY')
    mod.thickness=.012
    mod.offset=0
    mod.material_offset_rim=1
    bevel=ob.modifiers.new('Hand-finished edge','BEVEL')
    bevel.width=.005
    bevel.segments=3
    return ob

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
ribbon('01 / Continuous S-shaped mane',main_a,main_b,blue,1,100,reverse=True,initial=.42)

back_a=[(460,392,.25),(372,493,.34),(377,667,.36),(475,787,.29),
        (521,880,.30),(519,967,.35),(482,1040,.41),
        (425,1153,.34),(443,1260,.25),(295,1398,0)]
back_b=[(349,429,.31),(280,506,.27),(210,680,.26),(280,783,.29),
        (317,892,.26),(410,937,.39),(447,1036,.43),
        (493,1144,.28),(428,1284,.08),(295,1398,0)]
ribbon('02 / Returning violet fold',back_a,back_b,violet,1,98,reverse=True,bulge=.03,initial=.32)

# Forehead loop, long fine muzzle, round nose return and open jaw.
face_a=[(574,415,-.22),(573,337,-.16),(576,302,-.04),(510,266,.06),
        (446,219,.08),(494,164,.06),(548,200,-.02),
        (638,249,-.12),(643,297,-.26),(634,375,-.25),
        (628,461,-.37),(756,513,-.31),(839,641,-.20),
        (893,717,-.11),(815,796,-.15),(757,730,-.22),
        (713,681,-.18),(706,675,-.13),(603,650,-.14),
        (494,625,-.16),(440,576,-.17),(431,493,-.16)]
face_b=[(592,429,.00),(592,356,.04),(605,303,.10),(564,263,.16),
        (523,225,.12),(517,216,.12),(546,244,.06),
        (573,290,-.02),(582,331,-.03),(576,384,-.05),
        (566,490,-.18),(732,557,-.14),(837,643,-.19),
        (863,674,-.21),(786,758,-.27),(759,721,-.28),
        (741,608,-.29),(709,611,-.27),(600,594,-.25),
        (493,582,-.18),(453,557,-.14),(431,493,-.16)]
ribbon('03 / Forehead loop and open muzzle',face_a,face_b,blue,60,118,bulge=.035)

horn_a=[(630,320,.05),(731,258,.04),(858,178,.00),(945,117,-.015)]
horn_b=[(650,417,.14),(742,307,.15),(866,198,.04),(945,117,-.015)]
ribbon('04 / Tapered horn',horn_a,horn_b,horn_mat,85,130,bulge=.03)

for frame, angle, lift in [(1,-48,-.05),(60,-22,.01),(120,12,.08),(180,-8,.045),(240,0,0)]:
    root.rotation_euler=(0,math.radians(1.5*math.sin(frame/65)),math.radians(angle))
    root.location.z=lift
    root.keyframe_insert('rotation_euler',frame=frame)
    root.keyframe_insert('location',frame=frame)

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

area('KEY / tall softbox',(-4,-4,5),(0,0,.5),(.73,.84,1),850,4,6)
area('RIM / violet silk',(3,2,3),(0,0,.7),(.51,.32,1),800,3,5)
area('EDGE / glacial strip',(-3,1,1.4),(0,0,.7),(.3,.72,1),600,1,5)
light=area('SWEEP / moving white reflection',(1,-4,4),(0,0,0),(.9,.94,1),500,1,5)
for frame, x in [(1,-5),(96,3),(168,1.5),(240,-.5)]:
    light.location.x=x
    aim(light,(0,0,.3))
    light.keyframe_insert('location',frame=frame)
    light.keyframe_insert('rotation_euler',frame=frame)

floor_mat=material('05 / Charcoal infinity',(.012,.015,.025),0,.85)
floor_mat.node_tree.nodes['Principled BSDF'].inputs['Specular IOR Level'].default_value=.06
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
for frame, scale, target_z in [(1,5.4,-1.8),(96,11.9,.02),(160,11.9,.02),(240,11.7,.02)]:
    camera.location=(0,-17,target_z+1.7)
    aim(camera,(0,0,target_z))
    camera.keyframe_insert('location',frame=frame)
    camera.keyframe_insert('rotation_euler',frame=frame)
    camera_data.ortho_scale=scale
    camera_data.keyframe_insert('ortho_scale',frame=frame)

scene['Studio']='Capra Studios / Ribbon 03'
scene['Concept']='A satin unicorn draws itself from a ribbon, then turns in a moving field of soft light.'
scene['Delivery']='240 frames at 30 fps; 1920 x 1080; silent; Metal GPU / Cycles'
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
