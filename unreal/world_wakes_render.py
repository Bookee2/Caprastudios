"""Render the World Wakes wedge to a disposable 1280x720 PNG sequence."""
import unreal
ROOT='/Game/CapraStudy/WorldWakes'
subsystem=unreal.get_editor_subsystem(unreal.MoviePipelineQueueSubsystem)
assert not subsystem.is_rendering(),'Another render is in progress'
queue=subsystem.get_queue()
assert all(job.job_name=='Capra world wakes 720p wedge' for job in queue.get_jobs()),'Queue contains another render job'
queue.delete_all_jobs()
seq=unreal.load_asset(ROOT+'/Sequences/LS_WorldWakesWedge')
assert seq
job=queue.allocate_new_job(unreal.MoviePipelineExecutorJob)
job.job_name='Capra world wakes 720p wedge'
job.sequence=unreal.SoftObjectPath(seq.get_path_name())
job.map=unreal.SoftObjectPath(ROOT+'/Maps/WorldWakesStudy.WorldWakesStudy')
config=unreal.MoviePipelinePrimaryConfig()
output=config.find_or_add_setting_by_class(unreal.MoviePipelineOutputSetting)
output.set_editor_property('output_directory',unreal.DirectoryPath(path=unreal.Paths.project_saved_dir()+'CapraStudy/WorldWakesRender720_v8'))
output.set_editor_property('output_resolution',unreal.IntPoint(1280,720))
output.set_editor_property('file_name_format','WorldWakesWedge.{frame_number}')
output.set_editor_property('use_custom_playback_range',True)
output.set_editor_property('custom_start_frame',0)
output.set_editor_property('custom_end_frame',90)
output.set_editor_property('output_frame_rate',unreal.FrameRate(30,1))
config.find_or_add_setting_by_class(unreal.MoviePipelineDeferredPassBase)
config.find_or_add_setting_by_class(unreal.MoviePipelineImageSequenceOutput_PNG)
job.set_configuration(config)
executor=subsystem.render_queue_with_executor(unreal.MoviePipelinePIEExecutor)
print('RENDER_STARTED',bool(executor),job.job_name)
