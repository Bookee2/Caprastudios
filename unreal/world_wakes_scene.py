"""Build an isolated Unreal 5.8 landscape reveal study from generated FBX meshes."""
import unreal
from pathlib import Path

ROOT='/Game/CapraStudy/WorldWakes'
SOURCE=Path(unreal.Paths.project_saved_dir())/'CapraStudy/WorldWakesSource'
NAMES=['WW_Terrain','WW_Stones','WW_Seams','WW_Spores']
for directory in [ROOT,ROOT+'/Maps',ROOT+'/Meshes',ROOT+'/Materials',ROOT+'/Sequences']:
    unreal.EditorAssetLibrary.make_directory(directory)
level=unreal.get_editor_subsystem(unreal.LevelEditorSubsystem)
assert not unreal.EditorLoadingAndSavingUtils.get_dirty_map_packages(),'Save current level edits first'
assert level.new_level(ROOT+'/Maps/WorldWakesStudy')

tasks=[]
for name in NAMES:
    task=unreal.AssetImportTask()
    task.filename=str(SOURCE/(name+'.fbx'))
    task.destination_path=ROOT+'/Meshes'
    task.automated=True;task.save=True;task.replace_existing=True
    opts=unreal.FbxImportUI()
    opts.import_as_skeletal=False;opts.import_mesh=True
    opts.import_materials=False;opts.import_textures=False
    opts.static_mesh_import_data.set_editor_property('combine_meshes',True)
    task.options=opts;tasks.append(task)
unreal.AssetToolsHelpers.get_asset_tools().import_asset_tasks(tasks)
for task in tasks:print('IMPORT',task.filename,task.imported_object_paths)

def create_material(name,dark,bright,glow,roughness):
    material=unreal.AssetToolsHelpers.get_asset_tools().create_asset(
        name,ROOT+'/Materials',unreal.Material,unreal.MaterialFactoryNew())
    def node(cls,x,y):return unreal.MaterialEditingLibrary.create_material_expression(material,cls,x,y)
    def scalar(value,x,y):
        n=node(unreal.MaterialExpressionConstant,x,y);n.set_editor_property('r',value);return n
    def color(value,x,y):
        n=node(unreal.MaterialExpressionConstant3Vector,x,y)
        n.set_editor_property('constant',unreal.LinearColor(*value,1));return n
    def connect(a,b,pin):unreal.MaterialEditingLibrary.connect_material_expressions(a,'',b,pin)
    time=node(unreal.MaterialExpressionTime,-1200,-300)
    speed=scalar(270,-1200,-100)
    motion=node(unreal.MaterialExpressionMultiply,-1000,-280);connect(time,motion,'A');connect(speed,motion,'B')
    position=node(unreal.MaterialExpressionWorldPosition,-1200,100)
    xmask=node(unreal.MaterialExpressionComponentMask,-1000,100)
    xmask.set_editor_property('r',True);xmask.set_editor_property('g',False);connect(position,xmask,'None')
    shifted=node(unreal.MaterialExpressionAdd,-800,80);connect(xmask,shifted,'A');connect(scalar(365,-1000,300),shifted,'B')
    diff=node(unreal.MaterialExpressionSubtract,-600,-150);connect(motion,diff,'A');connect(shifted,diff,'B')
    scaled=node(unreal.MaterialExpressionDivide,-400,-150);connect(diff,scaled,'A');connect(scalar(95,-600,300),scaled,'B')
    mask=node(unreal.MaterialExpressionClamp,-200,-150);connect(scaled,mask,'None')
    mask.set_editor_property('min_default',0.0);mask.set_editor_property('max_default',1.0)
    base=node(unreal.MaterialExpressionLinearInterpolate,0,-350)
    connect(color(dark,-200,-500),base,'A');connect(color(bright,-200,-600),base,'B');connect(mask,base,'Alpha')
    unreal.MaterialEditingLibrary.connect_material_property(base,'',unreal.MaterialProperty.MP_BASE_COLOR)
    emission=node(unreal.MaterialExpressionMultiply,0,100)
    connect(color(tuple(v*glow for v in bright),-200,180),emission,'A');connect(mask,emission,'B')
    unreal.MaterialEditingLibrary.connect_material_property(emission,'',unreal.MaterialProperty.MP_EMISSIVE_COLOR)
    unreal.MaterialEditingLibrary.connect_material_property(scalar(roughness,0,350),'',unreal.MaterialProperty.MP_ROUGHNESS)
    unreal.MaterialEditingLibrary.connect_material_property(scalar(.25,0,500),'',unreal.MaterialProperty.MP_METALLIC)
    unreal.MaterialEditingLibrary.recompile_material(material)
    unreal.EditorAssetLibrary.save_loaded_asset(material)
    return material

materials={
 'WW_Terrain':create_material('M_WakingGround',(.012,.017,.026),(.032,.085,.14),.25,.38),
 'WW_Stones':create_material('M_WakingStone',(.024,.027,.038),(.13,.095,.28),.65,.29),
 'WW_Seams':create_material('M_WakingSeams',(.005,.01,.024),(.04,.65,.95),4.2,.23),
 'WW_Ferns':create_material('M_WakingFerns',(.008,.015,.02),(.08,.44,.72),1.7,.34),
 'WW_Spores':create_material('M_WakingSpores',(.005,.006,.014),(.65,.24,.93),5.0,.19),
}
for name in NAMES:
    mesh=unreal.load_asset(ROOT+'/Meshes/'+name)
    assert mesh,name
    actor=unreal.EditorLevelLibrary.spawn_actor_from_object(mesh,unreal.Vector(0,0,0))
    actor.set_actor_label(name)
    for index in range(actor.static_mesh_component.get_num_materials()):
        actor.static_mesh_component.set_material(index,materials[name])
    print('BOUNDS',name,mesh.get_bounds())

def point(name,where,rgb,intensity,radius):
    actor=unreal.EditorLevelLibrary.spawn_actor_from_class(unreal.PointLight,unreal.Vector(*where))
    actor.set_actor_label(name)
    component=actor.point_light_component
    component.set_editor_property('light_color',unreal.Color(r=rgb[0],g=rgb[1],b=rgb[2],a=255))
    component.set_editor_property('intensity',intensity)
    component.set_editor_property('attenuation_radius',radius)
    return actor
point('Signal front',(-360,0,85),(35,215,255),9200,430)
point('Violet backlight',(150,180,220),(125,78,255),3100,950)
point('Soft grazing key',(-160,-350,390),(170,205,255),3600,1200)

camera=unreal.EditorLevelLibrary.spawn_actor_from_class(unreal.CineCameraActor,unreal.Vector(0,-650,680))
camera.set_actor_label('World wakes camera')
camera.set_actor_rotation(unreal.MathLibrary.find_look_at_rotation(camera.get_actor_location(),unreal.Vector(0,0,0)),False)
cc=camera.get_cine_camera_component();cc.set_editor_property('current_focal_length',36.0)
cc.set_editor_property('focus_settings',unreal.CameraFocusSettings(focus_method=unreal.CameraFocusMethod.DISABLE))
pp=unreal.EditorLevelLibrary.spawn_actor_from_class(unreal.PostProcessVolume,unreal.Vector(0,0,0))
pp.set_actor_label('World wakes grade');pp.set_editor_property('unbound',True)
settings=pp.get_editor_property('settings')
settings.set_editor_property('override_auto_exposure_method',True)
settings.set_editor_property('auto_exposure_method',unreal.AutoExposureMethod.AEM_MANUAL)
settings.set_editor_property('override_auto_exposure_bias',True)
settings.set_editor_property('auto_exposure_bias',1.0)
pp.set_editor_property('settings',settings)
assert level.save_current_level()
print('WORLD_READY',unreal.get_editor_subsystem(unreal.UnrealEditorSubsystem).get_editor_world().get_path_name())
