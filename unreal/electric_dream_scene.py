"""Dress the cloned World Wakes study with actual Electric Dreams meshes.

Only the isolated CapraElectricDreamStudy project is a valid target. The
original Capra_intro wedge and the TrailGoat sample are never modified.
"""
import unreal

ROOT = '/Game/CapraStudy/WorldWakes'
WORLD = ROOT + '/Maps/WorldWakesStudy'
SEQ = ROOT + '/Sequences/LS_WorldWakesWedge'
world = unreal.get_editor_subsystem(unreal.UnrealEditorSubsystem).get_editor_world()
assert WORLD in world.get_path_name(), world.get_path_name()
assert 'CapraElectricDreamStudy' in unreal.Paths.project_dir(), unreal.Paths.project_dir()
actors = unreal.EditorLevelLibrary.get_all_level_actors()
assert not any(a.get_actor_label().startswith('ED_') for a in actors), 'Electric Dreams set already placed'

for actor in actors:
    if actor.get_actor_label() == 'WW_Stones' or actor.get_actor_label().startswith('WW_Ferns_'):
        unreal.EditorLevelLibrary.destroy_actor(actor)

asset_root = '/Game/Megascans/'
mesh_paths = {
    'rock': asset_root+'3D_Assets/MossyRocks/SM_MossyRocks_01',
    'rock2': asset_root+'3D_Assets/MossyRocks/SM_MossyRocks_02',
    'boulder': asset_root+'3D_Assets/MossyForestBoulder/SM_MossyForestBoulder_01',
    'slab': asset_root+'3D_Assets/ForestRockSlab/SM_ForestRockSlab_01',
    'branch': asset_root+'3D_Assets/OldTreeBranch/SM_OldTreeBranch_01',
    'fern': asset_root+'3D_Plants/Fern/SM_Fern_01',
    'lady': asset_root+'3D_Plants/SilverLadyFern/SM_SilverLadyFern_01',
    'moss': asset_root+'3D_Plants/CustomMoss/SM_CustomMoss_01',
}
meshes = {key: unreal.load_asset(path) for key,path in mesh_paths.items()}
assert all(meshes.values()), {key:bool(value) for key,value in meshes.items()}

def place(name, kind, x, y, z, scale, yaw=0):
    actor = unreal.EditorLevelLibrary.spawn_actor_from_object(
        meshes[kind], unreal.Vector(x,y,z), unreal.Rotator(0,yaw,0))
    assert actor, (name,kind)
    actor.set_actor_label(name)
    actor.set_actor_scale3d(unreal.Vector(scale,scale,scale))
    return actor

# Rocks remain tangible before the signal; their wet moss catches the reveal.
rock_layout = [
    ('rock',-510,-205,4,.95,34), ('rock2',-380,80,3,.72,-18),
    ('boulder',-335,-125,1,.88,68), ('rock',-205,205,4,.87,12),
    ('rock2',-120,-220,2,.78,54), ('boulder',-45,95,1,.96,-15),
    ('rock',80,-105,4,.86,37), ('rock2',145,220,3,.91,-31),
    ('boulder',275,-210,0,.9,18), ('rock',345,80,4,1.04,72),
    ('rock2',490,-100,4,.82,-42), ('slab',405,185,-8,.43,28),
    ('branch',-35,-35,7,1.65,20),
]
for i,(kind,x,y,z,scale,yaw) in enumerate(rock_layout,1):
    place(f'ED_Rock_{i:02}',kind,x,y,z,scale,yaw)

seq = unreal.load_asset(SEQ)
assert seq,SEQ
starts = [0,16,35,54,73]
plant_layout = [
    (-485,-130,.45,13),(-445,185,.38,98),(-355,20,.30,-31),
    (-270,-200,.41,65),(-210,135,.36,-16),(-125,-20,.31,120),
    (-50,-175,.48,38),(15,175,.38,-68),(80,32,.30,89),
    (160,-155,.46,12),(220,125,.37,-34),(300,-8,.32,117),
    (385,-210,.44,52),(455,160,.39,-28),(520,-35,.30,94),
]
for i,(x,y,scale,yaw) in enumerate(plant_layout,1):
    band = min(4,max(0,int((x+600)//240)))
    kind = 'fern' if i%3 else 'lady'
    actor=place(f'ED_Fern_{i:02}',kind,x,y,5,scale,yaw)
    binding=seq.add_possessable(actor)
    binding.set_name(actor.get_actor_label())
    section=binding.add_track(unreal.MovieScene3DTransformTrack).add_section()
    section.set_range(0,90)
    start=starts[band]
    finish=min(89,start+16)
    values={
        'Location.X':(x,x),'Location.Y':(y,y),'Location.Z':(5,5),
        'Rotation.X':(0,0),'Rotation.Y':(yaw,yaw),'Rotation.Z':(0,0),
        'Scale.X':(scale,scale),'Scale.Y':(scale,scale),'Scale.Z':(0,scale),
    }
    for channel in section.get_all_channels():
        for label,pair in values.items():
            if label in channel.get_name():
                channel.add_key(unreal.FrameNumber(0),pair[0])
                if label == 'Scale.Z':
                    channel.add_key(unreal.FrameNumber(start),0)
                    channel.add_key(unreal.FrameNumber(finish),scale)
                channel.add_key(unreal.FrameNumber(89),pair[1])
                break

for i,(x,y) in enumerate(((-440,10),(-230,-130),(-35,160),(170,-40),(405,45)),1):
    place(f'ED_Moss_{i:02}','moss',x,y,12,1.6,i*37)

light=unreal.EditorLevelLibrary.spawn_actor_from_class(unreal.PointLight,unreal.Vector(40,-170,260))
light.set_actor_label('ED_Moss_Detail_Light')
light.point_light_component.set_editor_property('light_color',unreal.Color(r=170,g=230,b=205,a=255))
light.point_light_component.set_editor_property('intensity',2400)
light.point_light_component.set_editor_property('attenuation_radius',850)

assert unreal.EditorAssetLibrary.save_loaded_asset(seq)
assert unreal.get_editor_subsystem(unreal.LevelEditorSubsystem).save_current_level()
print('ELECTRIC_DREAM_SCENE_READY',len(rock_layout),'rocks',len(plant_layout),'animated plants')
