"""Find a cinematic exposure and creek camera in the cloned PCG scene."""
import unreal

assert 'CapraElectricDreamStudy' in unreal.Paths.project_dir()
MAP='/Game/Levels/PCG/ElectricDreams_PCGCloseRange'
world=unreal.get_editor_subsystem(unreal.UnrealEditorSubsystem).get_editor_world()
assert MAP in world.get_path_name()
actors=unreal.EditorLevelLibrary.get_all_level_actors()
for actor in actors:
    if actor.get_actor_label()=='BP_DroneInstructions' or isinstance(actor,unreal.TextRenderActor):
        unreal.EditorLevelLibrary.destroy_actor(actor)
camera=next(a for a in actors if a.get_actor_label()=='ED_Scout_1')
camera.set_actor_location(unreal.Vector(90000,-8250,1870),False,False)
camera.set_actor_rotation(unreal.MathLibrary.find_look_at_rotation(camera.get_actor_location(),unreal.Vector(90100,-6550,1700)),False)
camera.get_cine_camera_component().set_editor_property('current_focal_length',28.0)

grade=unreal.EditorLevelLibrary.spawn_actor_from_class(unreal.PostProcessVolume,unreal.Vector(90000,-7200,1700))
grade.set_actor_label('ED_Studio_Grade')
grade.set_editor_property('unbound',True)
grade.set_editor_property('priority',1000.0)
settings=grade.get_editor_property('settings')
settings.set_editor_property('override_auto_exposure_method',True)
settings.set_editor_property('auto_exposure_method',unreal.AutoExposureMethod.AEM_MANUAL)
settings.set_editor_property('override_auto_exposure_bias',True)
settings.set_editor_property('auto_exposure_bias',-1.5)
grade.set_editor_property('settings',settings)

signal=unreal.EditorLevelLibrary.spawn_actor_from_class(unreal.PointLight,unreal.Vector(90040,-7000,1820))
signal.set_actor_label('ED_Signal_Light')
component=signal.point_light_component
component.set_editor_property('light_color',unreal.Color(r=35,g=210,b=255,a=255))
component.set_editor_property('intensity',7000.0)
component.set_editor_property('attenuation_radius',1500.0)
assert unreal.get_editor_subsystem(unreal.LevelEditorSubsystem).save_current_level()

subsystem=unreal.get_editor_subsystem(unreal.MoviePipelineQueueSubsystem)
assert not subsystem.is_rendering()
queue=subsystem.get_queue()
assert all(j.job_name.startswith('Capra Electric Dreams') for j in queue.get_jobs())
queue.delete_all_jobs()
seq=unreal.load_asset('/Game/CapraStudy/ElectricDreams/Sequences/LS_EDScout')
job=queue.allocate_new_job(unreal.MoviePipelineExecutorJob)
job.job_name='Capra Electric Dreams 720p graded camera scout'
job.sequence=unreal.SoftObjectPath(seq.get_path_name())
job.map=unreal.SoftObjectPath(MAP+'.ElectricDreams_PCGCloseRange')
config=unreal.MoviePipelinePrimaryConfig()
output=config.find_or_add_setting_by_class(unreal.MoviePipelineOutputSetting)
output.set_editor_property('output_directory',unreal.DirectoryPath(path=unreal.Paths.project_saved_dir()+'CapraStudy/EDScoutGraded720'))
output.set_editor_property('output_resolution',unreal.IntPoint(1280,720))
output.set_editor_property('file_name_format','ScoutGraded.{frame_number}')
output.set_editor_property('use_custom_playback_range',True)
output.set_editor_property('custom_start_frame',0)
output.set_editor_property('custom_end_frame',1)
output.set_editor_property('output_frame_rate',unreal.FrameRate(30,1))
config.find_or_add_setting_by_class(unreal.MoviePipelineDeferredPassBase)
config.find_or_add_setting_by_class(unreal.MoviePipelineImageSequenceOutput_PNG)
job.set_configuration(config)
executor=subsystem.render_queue_with_executor(unreal.MoviePipelinePIEExecutor)
print('GRADED_SCOUT_STARTED',bool(executor))
