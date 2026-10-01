"""Create the three-second 720p transformation wedge in Unreal Sequencer."""
import unreal

ROOT='/Game/CapraStudy/WorldWakes'
assert 'WorldWakesStudy' in unreal.get_editor_subsystem(unreal.UnrealEditorSubsystem).get_editor_world().get_path_name()
seq=unreal.AssetToolsHelpers.get_asset_tools().create_asset(
    'LS_WorldWakesWedge',ROOT+'/Sequences',unreal.LevelSequence,unreal.LevelSequenceFactoryNew())
seq.set_display_rate(unreal.FrameRate(30,1))
seq.set_playback_start(0);seq.set_playback_end(90)
actors=unreal.EditorLevelLibrary.get_all_level_actors()
camera=next(a for a in actors if isinstance(a,unreal.CineCameraActor))
front=next(a for a in actors if isinstance(a,unreal.PointLight) and a.get_actor_label()=='Signal front')
binding=seq.add_possessable(camera)
cut=seq.add_track(unreal.MovieSceneCameraCutTrack).add_section();cut.set_range(0,90)
identifier=unreal.MovieSceneObjectBindingID();identifier.set_editor_property('Guid',binding.get_id())
cut.set_camera_binding_id(identifier)

light_binding=seq.add_possessable(front)
section=light_binding.add_track(unreal.MovieScene3DTransformTrack).add_section()
section.set_range(0,90)
channels=section.get_all_channels()
values={
    'Location.X':(-360,440),'Location.Y':(0,0),'Location.Z':(85,85),
    'Rotation.X':(0,0),'Rotation.Y':(0,0),'Rotation.Z':(0,0),
    'Scale.X':(1,1),'Scale.Y':(1,1),'Scale.Z':(1,1),
}
for channel in channels:
    for name,pair in values.items():
        if name in channel.get_name():
            channel.add_key(unreal.FrameNumber(0),pair[0])
            channel.add_key(unreal.FrameNumber(89),pair[1])
            break
unreal.EditorAssetLibrary.save_loaded_asset(seq)
print('SEQUENCE_READY',seq.get_path_name())
