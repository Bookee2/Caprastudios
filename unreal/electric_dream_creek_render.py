"""Render the Electric Dreams creek transformation at 1280x720."""
import unreal

assert 'CapraElectricDreamStudy' in unreal.Paths.project_dir()
ROOT='/Game/CapraStudy/ElectricDreams'
MAP='/Game/Levels/PCG/ElectricDreams_PCGCloseRange.ElectricDreams_PCGCloseRange'
OUT=unreal.Paths.project_saved_dir()+'CapraStudy/EDCreekRender720_v2'
subsystem=unreal.get_editor_subsystem(unreal.MoviePipelineQueueSubsystem)
assert not subsystem.is_rendering()
queue=subsystem.get_queue()
assert all(j.job_name.startswith('Capra Electric Dreams') for j in queue.get_jobs())
queue.delete_all_jobs()
seq=unreal.load_asset(ROOT+'/Sequences/LS_EDWorldWakes')
assert seq
job=queue.allocate_new_job(unreal.MoviePipelineExecutorJob)
job.job_name='Capra Electric Dreams 720p creek wake'
job.sequence=unreal.SoftObjectPath(seq.get_path_name())
job.map=unreal.SoftObjectPath(MAP)
config=unreal.MoviePipelinePrimaryConfig()
output=config.find_or_add_setting_by_class(unreal.MoviePipelineOutputSetting)
output.set_editor_property('output_directory',unreal.DirectoryPath(path=OUT))
output.set_editor_property('output_resolution',unreal.IntPoint(1280,720))
output.set_editor_property('file_name_format','CreekWake.{frame_number}')
output.set_editor_property('use_custom_playback_range',True)
output.set_editor_property('custom_start_frame',0)
output.set_editor_property('custom_end_frame',90)
output.set_editor_property('output_frame_rate',unreal.FrameRate(30,1))
config.find_or_add_setting_by_class(unreal.MoviePipelineDeferredPassBase)
config.find_or_add_setting_by_class(unreal.MoviePipelineImageSequenceOutput_PNG)
job.set_configuration(config)
executor=subsystem.render_queue_with_executor(unreal.MoviePipelinePIEExecutor)
print('CREEK_RENDER_STARTED',bool(executor),OUT)
