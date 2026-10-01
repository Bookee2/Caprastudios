"""Animate a creek signal and sequential fern growth in Electric Dreams."""
import unreal

assert 'CapraElectricDreamStudy' in unreal.Paths.project_dir()
MAP='/Game/Levels/PCG/ElectricDreams_PCGCloseRange'
world=unreal.get_editor_subsystem(unreal.UnrealEditorSubsystem).get_editor_world()
assert MAP in world.get_path_name()
ROOT='/Game/CapraStudy/ElectricDreams'
SEQ=ROOT+'/Sequences/LS_EDWorldWakes'
assert not unreal.EditorAssetLibrary.does_asset_exist(SEQ)
unreal.EditorAssetLibrary.make_directory(ROOT+'/Materials')
actors=unreal.EditorLevelLibrary.get_all_level_actors()
camera=next(a for a in actors if a.get_actor_label()=='ED_Scout_1')
signal=next(a for a in actors if a.get_actor_label()=='ED_Signal_Light')
violet=next(a for a in actors if a.get_actor_label()=='ED_Violet_Rim')

seq=unreal.AssetToolsHelpers.get_asset_tools().create_asset(
    'LS_EDWorldWakes',ROOT+'/Sequences',unreal.LevelSequence,unreal.LevelSequenceFactoryNew())
seq.set_display_rate(unreal.FrameRate(30,1))
seq.set_playback_start(0);seq.set_playback_end(90)

def transform(actor,locations,scale_events=None):
    binding=seq.add_possessable(actor)
    binding.set_name(actor.get_actor_label())
    section=binding.add_track(unreal.MovieScene3DTransformTrack).add_section()
    section.set_range(0,90)
    r=actor.get_actor_rotation()
    s=actor.get_actor_scale3d()
    channels={
        'Location.X':[(f,p[0]) for f,p in locations],
        'Location.Y':[(f,p[1]) for f,p in locations],
        'Location.Z':[(f,p[2]) for f,p in locations],
        'Rotation.X':[(0,r.roll),(89,r.roll)],
        'Rotation.Y':[(0,r.pitch),(89,r.pitch)],
        'Rotation.Z':[(0,r.yaw),(89,r.yaw)],
        'Scale.X':[(0,s.x),(89,s.x)],
        'Scale.Y':[(0,s.y),(89,s.y)],
        'Scale.Z':scale_events or [(0,s.z),(89,s.z)],
    }
    for channel in section.get_all_channels():
        for name,events in channels.items():
            if name in channel.get_name():
                for frame,value in events:
                    channel.add_key(unreal.FrameNumber(frame),float(value))
                break
    return binding

camera_binding=transform(camera,[(0,(90000,-8250,1870)),(89,(90030,-7980,1840))])
cut=seq.add_track(unreal.MovieSceneCameraCutTrack).add_section();cut.set_range(0,90)
identifier=unreal.MovieSceneObjectBindingID()
identifier.set_editor_property('Guid',camera_binding.get_id())
cut.set_camera_binding_id(identifier)

path=[(0,(90020,-7200,1775)),(30,(90050,-6820,1775)),
      (60,(90080,-6430,1775)),(89,(90100,-6080,1775))]
transform(signal,path)
transform(violet,[(0,(89600,-6350,1100)),(45,(89600,-6350,1500)),
                  (75,(89600,-6350,2200)),(89,(89600,-6350,2200))])

material=unreal.AssetToolsHelpers.get_asset_tools().create_asset(
    'M_CreekSignal',ROOT+'/Materials',unreal.Material,unreal.MaterialFactoryNew())
color=unreal.MaterialEditingLibrary.create_material_expression(material,unreal.MaterialExpressionConstant3Vector,-200,0)
color.set_editor_property('constant',unreal.LinearColor(.04,.8,1.0,1))
gain=unreal.MaterialEditingLibrary.create_material_expression(material,unreal.MaterialExpressionConstant,-200,180)
gain.set_editor_property('r',22.0)
multiply=unreal.MaterialEditingLibrary.create_material_expression(material,unreal.MaterialExpressionMultiply,0,0)
unreal.MaterialEditingLibrary.connect_material_expressions(color,'',multiply,'A')
unreal.MaterialEditingLibrary.connect_material_expressions(gain,'',multiply,'B')
unreal.MaterialEditingLibrary.connect_material_property(multiply,'',unreal.MaterialProperty.MP_EMISSIVE_COLOR)
unreal.MaterialEditingLibrary.recompile_material(material)
assert unreal.EditorAssetLibrary.save_loaded_asset(material)
sphere=unreal.load_asset('/Engine/BasicShapes/Sphere')
orb=unreal.EditorLevelLibrary.spawn_actor_from_object(sphere,unreal.Vector(90020,-7200,1710))
orb.set_actor_label('ED_Creek_Signal_Orb')
orb.set_actor_scale3d(unreal.Vector(.12,.12,.12))
orb.static_mesh_component.set_material(0,material)
orb_path=[(frame,(p[0],p[1],1710)) for frame,p in path]
transform(orb,orb_path)

fern=unreal.load_asset('/Game/Megascans/3D_Plants/SilverLadyFern/SM_SilverLadyFern_01')
assert fern
plants=[
    (89820,-7680,1680,.65,0,12),
    (90280,-7420,1670,.55,10,25),
    (89830,-7100,1675,.7,22,38),
    (90300,-6840,1670,.6,34,50),
    (89820,-6540,1690,.7,46,63),
    (90250,-6250,1690,.65,59,78),
]
for i,(x,y,z,scale,start,end) in enumerate(plants,1):
    actor=unreal.EditorLevelLibrary.spawn_actor_from_object(fern,unreal.Vector(x,y,z),unreal.Rotator(0,i*57,0))
    actor.set_actor_label(f'ED_Bank_Fern_{i:02}')
    actor.set_actor_scale3d(unreal.Vector(scale,scale,scale))
    transform(actor,[(0,(x,y,z)),(89,(x,y,z))],[(0,0),(start,0),(end,scale),(89,scale)])

assert unreal.EditorAssetLibrary.save_loaded_asset(seq)
assert unreal.get_editor_subsystem(unreal.LevelEditorSubsystem).save_current_level()
print('WORLD_WAKES_SEQUENCE_READY',SEQ,len(plants),'growing ferns')
