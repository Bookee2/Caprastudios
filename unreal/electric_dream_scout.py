"""Render three 720p camera scouts inside Electric Dreams PCGCloseRange."""
import unreal

assert 'CapraElectricDreamStudy' in unreal.Paths.project_dir()
world=unreal.get_editor_subsystem(unreal.UnrealEditorSubsystem).get_editor_world()
MAP='/Game/Levels/PCG/ElectricDreams_PCGCloseRange'
assert MAP in world.get_path_name(),world.get_path_name()
ROOT='/Game/CapraStudy/ElectricDreams'
unreal.EditorAssetLibrary.make_directory(ROOT)
unreal.EditorAssetLibrary.make_directory(ROOT+'/Sequences')
SEQ=ROOT+'/Sequences/LS_EDScout'
assert not unreal.EditorAssetLibrary.does_asset_exist(SEQ)
seq=unreal.AssetToolsHelpers.get_asset_tools().create_asset(
    'LS_EDScout',ROOT+'/Sequences',unreal.LevelSequence,unreal.LevelSequenceFactoryNew())
seq.set_display_rate(unreal.FrameRate(30,1))
seq.set_playback_start(0);seq.set_playback_end(3)
cuts=seq.add_track(unreal.MovieSceneCameraCutTrack)
views=[
    ((89900,-7950,2200),(90000,-6100,1680)),
    ((87500,-5200,2450),(89300,-4600,1680)),
    ((91600,-3050,2350),(89600,-4350,1680)),
]
for i,(where,target) in enumerate(views):
    camera=unreal.EditorLevelLibrary.spawn_actor_from_class(unreal.CineCameraActor,unreal.Vector(*where))
    camera.set_actor_label(f'ED_Scout_{i+1}')
    camera.set_actor_rotation(unreal.MathLibrary.find_look_at_rotation(camera.get_actor_location(),unreal.Vector(*target)),False)
    component=camera.get_cine_camera_component()
    component.set_editor_property('current_focal_length',24.0)
    component.set_editor_property('focus_settings',unreal.CameraFocusSettings(focus_method=unreal.CameraFocusMethod.DISABLE))
    binding=seq.add_possessable(camera)
    cut=cuts.add_section();cut.set_range(i,i+1)
    identifier=unreal.MovieSceneObjectBindingID()
    identifier.set_editor_property('Guid',binding.get_id())
    cut.set_camera_binding_id(identifier)
assert unreal.EditorAssetLibrary.save_loaded_asset(seq)
assert unreal.get_editor_subsystem(unreal.LevelEditorSubsystem).save_current_level()

subsystem=unreal.get_editor_subsystem(unreal.MoviePipelineQueueSubsystem)
assert not subsystem.is_rendering()
queue=subsystem.get_queue()
assert all(j.job_name.startswith('Capra Electric Dreams') for j in queue.get_jobs())
queue.delete_all_jobs()
job=queue.allocate_new_job(unreal.MoviePipelineExecutorJob)
job.job_name='Capra Electric Dreams 720p camera scout'
job.sequence=unreal.SoftObjectPath(seq.get_path_name())
job.map=unreal.SoftObjectPath(MAP+'.ElectricDreams_PCGCloseRange')
config=unreal.MoviePipelinePrimaryConfig()
output=config.find_or_add_setting_by_class(unreal.MoviePipelineOutputSetting)
output.set_editor_property('output_directory',unreal.DirectoryPath(path=unreal.Paths.project_saved_dir()+'CapraStudy/EDScout720'))
output.set_editor_property('output_resolution',unreal.IntPoint(1280,720))
output.set_editor_property('file_name_format','Scout.{frame_number}')
output.set_editor_property('use_custom_playback_range',True)
output.set_editor_property('custom_start_frame',0)
output.set_editor_property('custom_end_frame',3)
output.set_editor_property('output_frame_rate',unreal.FrameRate(30,1))
config.find_or_add_setting_by_class(unreal.MoviePipelineDeferredPassBase)
config.find_or_add_setting_by_class(unreal.MoviePipelineImageSequenceOutput_PNG)
job.set_configuration(config)
executor=subsystem.render_queue_with_executor(unreal.MoviePipelinePIEExecutor)
print('SCOUT_RENDER_STARTED',bool(executor),views)
