"""Generate an editable proxy landscape for the Capra 720p Unreal motion test.

Run with Blender 5.2 in background mode. The FBX files contain geometry only;
Unreal supplies the reveal materials and animation.
"""
import bpy
import math
import os
import random
from pathlib import Path
from mathutils import Vector

OUT = Path(os.environ.get('UNREAL_PROJECT_ROOT', '/Users/kb/Documents/Unreal Projects/Capra_intro')) / 'Saved/CapraStudy/WorldWakesSource'
OUT.mkdir(parents=True, exist_ok=True)
random.seed(42)
bpy.ops.object.select_all(action='SELECT')
bpy.ops.object.delete(use_global=False)

def clear_selection():
    for obj in bpy.context.selected_objects:
        obj.select_set(False)

def join_export(name, objects):
    clear_selection()
    for obj in objects:
        obj.select_set(True)
    bpy.context.view_layer.objects.active = objects[0]
    bpy.ops.object.convert(target='MESH')
    bpy.ops.object.join()
    obj = bpy.context.object
    obj.name = name
    # Keep geometry in world coordinates so all meshes share one Unreal origin.
    bpy.ops.object.transform_apply(location=True, rotation=True, scale=True)
    bpy.ops.export_scene.fbx(filepath=str(OUT / f'{name}.fbx'), use_selection=True,
        apply_unit_scale=True, global_scale=1, axis_forward='-Y', axis_up='Z',
        bake_anim=False, add_leaf_bones=False, mesh_smooth_type='FACE', path_mode='STRIP')
    obj.select_set(False)
    print('EXPORTED', name, len(obj.data.vertices), len(obj.data.polygons))

def height(x, y):
    return .05*math.sin(x*2.7+y*1.9)+.035*math.sin(x*7-y*4)+.015*math.sin(x*17+y*13)

# A surface with enough relief to catch grazing light, never a perfectly flat plane.
verts=[]; faces=[]
nx,ny=72,36
for j in range(ny+1):
    y=-3+6*j/ny
    for i in range(nx+1):
        x=-6+12*i/nx
        verts.append((x,y,height(x,y)))
for j in range(ny):
    for i in range(nx):
        a=j*(nx+1)+i
        faces.append((a,a+1,a+nx+2,a+nx+1))
mesh=bpy.data.meshes.new('Tidal terrain');mesh.from_pydata(verts,[],faces);mesh.update()
for polygon in mesh.polygons:polygon.use_smooth=True
ground=bpy.data.objects.new('Terrain',mesh);bpy.context.collection.objects.link(ground)
join_export('WW_Terrain',[ground])

rocks=[]
for i in range(105):
    x=random.uniform(-5.6,5.6);y=random.uniform(-2.7,2.7)
    radius=random.uniform(.055,.25) if i<88 else random.uniform(.25,.46)
    bpy.ops.mesh.primitive_ico_sphere_add(subdivisions=2 if radius<.25 else 3,radius=1,location=(x,y,height(x,y)+radius*.34))
    obj=bpy.context.object
    obj.scale=(radius*random.uniform(.8,1.7),radius*random.uniform(.7,1.3),radius*random.uniform(.4,1.15))
    obj.rotation_euler[2]=random.uniform(0,math.pi)
    for v in obj.data.vertices:
        v.co *= random.uniform(.83,1.13)
    for polygon in obj.data.polygons:polygon.use_smooth=True
    rocks.append(obj)
join_export('WW_Stones',rocks)

def curved_tube(name, points, radius, resolution=2):
    curve=bpy.data.curves.new(name,'CURVE');curve.dimensions='3D'
    spline=curve.splines.new('POLY');spline.points.add(len(points)-1)
    for p,xyz in zip(spline.points,points):p.co=(*xyz,1)
    curve.bevel_depth=radius;curve.bevel_resolution=resolution;curve.resolution_u=2
    obj=bpy.data.objects.new(name,curve);bpy.context.collection.objects.link(obj)
    return obj

roots=[]
for i in range(8):
    y=-2.6+i*.72+random.uniform(-.2,.2)
    points=[]
    for k in range(35):
        x=-5.8+k*11.6/34
        yy=y+.13*math.sin(x*2+i)+.04*math.sin(x*6+i*3)
        points.append((x,yy,height(x,yy)+.045))
    roots.append(curved_tube('Seam root',points,.012+random.random()*.008))
join_export('WW_Seams',roots)

ferns=[[] for _ in range(5)]
def leaf_mesh(name, base, length, angle, width):
    # Raised, tapering blade with a central fold and subtle S-curve.
    x0,y0,z0=base
    direction=Vector((math.cos(angle),math.sin(angle),0))
    side=Vector((-direction.y,direction.x,0))
    verts=[];faces=[]
    for i in range(9):
        t=i/8
        center=Vector((x0,y0,z0))+direction*(length*t)+Vector((0,0,.10*math.sin(math.pi*t)+.22*length*t))
        center+=side*(.04*math.sin(math.pi*t*1.5))
        w=width*math.sin(math.pi*t)**.8
        verts.extend((tuple(center-side*w),tuple(center+Vector((0,0,.018))),tuple(center+side*w)))
        if i:
            b=(i-1)*3;a=i*3
            faces.extend(((b,a,b+1),(b+1,a,a+1),(b+1,a+1,b+2),(b+2,a+1,a+2)))
    mesh=bpy.data.meshes.new(name);mesh.from_pydata(verts,[],faces);mesh.update()
    obj=bpy.data.objects.new(name,mesh);bpy.context.collection.objects.link(obj)
    return obj

for cluster in range(54):
    x=random.uniform(-5.35,5.35);y=random.uniform(-2.45,2.45)
    z=height(x,y)+.035
    for blade in range(random.randint(5,8)):
        angle=2*math.pi*blade/7+random.uniform(-.23,.23)
        length=random.uniform(.23,.62)
        strip=min(4,max(0,int((x+5.35)/10.7*5)))
        ferns[strip].append(leaf_mesh('Fern blade',(x,y,z),length,angle,length*.12))
for strip,items in enumerate(ferns,1):
    join_export(f'WW_Ferns_{strip:02}',items)

spores=[]
for i in range(175):
    x=random.uniform(-5.4,5.4);y=random.uniform(-2.5,2.5)
    z=height(x,y)+random.uniform(.06,.42)
    bpy.ops.mesh.primitive_ico_sphere_add(subdivisions=1,radius=random.uniform(.006,.021),location=(x,y,z))
    spores.append(bpy.context.object)
join_export('WW_Spores',spores)

bpy.ops.wm.save_as_mainfile(filepath=str(OUT/'WorldWakesProxy.blend'))
