"""Render the isolated Electric Dreams dress pass at 1280x720, 30 fps."""
import unreal

ROOT='/Game/CapraStudy/WorldWakes'
OUT=unreal.Paths.project_saved_dir()+'CapraStudy/ElectricDreamRender720_v1'
assert 'CapraElectricDreamStudy' in unreal.Paths.project_dir()
subsystem=unreal.get_editor_subsystem(unreal.MoviePipelineQueueSubsystem)
assert not subsystem.is_rendering(), 'A render is already active in this editor'
queue=subsystem.get_queue()
assert not queue.get_jobs(), 'Existing queue jobs require inspection'
seq=unreal.load_asset(ROOT+'/Sequences/LS_WorldWakesWedge')
assert seq
job=queue.allocate_new_job(unreal.MoviePipelineExecutorJob)
job.job_name='Capra Electric Dreams world wakes 720p wedge'
job.sequence=unreal.SoftObjectPath(seq.get_path_name())
job.map=unreal.SoftObjectPath(ROOT+'/Maps/WorldWakesStudy.WorldWakesStudy')
config=unreal.MoviePipelinePrimaryConfig()
output=config.find_or_add_setting_by_class(unreal.MoviePipelineOutputSetting)
output.set_editor_property('output_directory',unreal.DirectoryPath(path=OUT))
output.set_editor_property('output_resolution',unreal.IntPoint(1280,720))
output.set_editor_property('file_name_format','ElectricDreamWedge.{frame_number}')
output.set_editor_property('use_custom_playback_range',True)
output.set_editor_property('custom_start_frame',0)
output.set_editor_property('custom_end_frame',90)
output.set_editor_property('output_frame_rate',unreal.FrameRate(30,1))
config.find_or_add_setting_by_class(unreal.MoviePipelineDeferredPassBase)
config.find_or_add_setting_by_class(unreal.MoviePipelineImageSequenceOutput_PNG)
job.set_configuration(config)
executor=subsystem.render_queue_with_executor(unreal.MoviePipelinePIEExecutor)
print('RENDER_STARTED',bool(executor),job.job_name,OUT)
