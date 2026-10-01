"""Give the creek signal a visible environment-wide lighting payoff."""
import unreal

assert 'CapraElectricDreamStudy' in unreal.Paths.project_dir()
MAP='/Game/Levels/PCG/ElectricDreams_PCGCloseRange'
world=unreal.get_editor_subsystem(unreal.UnrealEditorSubsystem).get_editor_world()
assert MAP in world.get_path_name()
ROOT='/Game/CapraStudy/ElectricDreams'
seq=unreal.load_asset(ROOT+'/Sequences/LS_EDWorldWakes')
assert seq
actors=unreal.EditorLevelLibrary.get_all_level_actors()
assert not any(a.get_actor_label()=='ED_Magenta_Growth_Light' for a in actors)

def light_track(actor,component,events):
    parent=next((b for b in seq.get_bindings() if b.get_name()==actor.get_actor_label()),None)
    if not parent:
        parent=seq.add_possessable(actor)
        parent.set_name(actor.get_actor_label())
    binding=seq.add_possessable(component)
    binding.set_parent(parent)
    track=binding.add_track(unreal.MovieSceneFloatTrack)
    track.set_property_name_and_path('Intensity','Intensity')
    section=track.add_section();section.set_range(0,90)
    channel=section.get_all_channels()[0]
    for frame,value in events:
        channel.add_key(unreal.FrameNumber(frame),float(value))
    print('LIGHT_KEYS',actor.get_actor_label(),events)

sun=next(a for a in actors if isinstance(a,unreal.DirectionalLight))
sky=next(a for a in actors if isinstance(a,unreal.SkyLight))
signal=next(a for a in actors if a.get_actor_label()=='ED_Signal_Light')
violet=next(a for a in actors if a.get_actor_label()=='ED_Violet_Rim')
light_track(sun,sun.get_components_by_class(unreal.DirectionalLightComponent)[0],
            [(0,1500),(35,1500),(89,7500)])
light_track(sky,sky.light_component,[(0,.15),(35,.15),(89,.4)])
light_track(signal,signal.point_light_component,[(0,15000),(35,19000),(89,36000)])
light_track(violet,violet.point_light_component,[(0,0),(42,0),(89,28000)])

magenta=unreal.EditorLevelLibrary.spawn_actor_from_class(unreal.PointLight,unreal.Vector(90350,-6400,1800))
magenta.set_actor_label('ED_Magenta_Growth_Light')
magenta.point_light_component.set_editor_property('light_color',unreal.Color(r=255,g=52,b=175,a=255))
magenta.point_light_component.set_editor_property('intensity',0.0)
magenta.point_light_component.set_editor_property('attenuation_radius',1300.0)
light_track(magenta,magenta.point_light_component,[(0,0),(55,0),(89,21000)])

assert unreal.EditorAssetLibrary.save_loaded_asset(seq)
assert unreal.get_editor_subsystem(unreal.LevelEditorSubsystem).save_current_level()
print('LIGHT_REVEAL_READY')
