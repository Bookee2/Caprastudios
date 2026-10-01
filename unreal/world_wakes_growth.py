"""Stage five sequential foliage growth bands in the saved Unreal study."""
import unreal
from pathlib import Path

ROOT='/Game/CapraStudy/WorldWakes'
SOURCE=Path(unreal.Paths.project_saved_dir())/'CapraStudy/WorldWakesSource'
world=unreal.get_editor_subsystem(unreal.UnrealEditorSubsystem).get_editor_world()
assert 'WorldWakesStudy' in world.get_path_name()
seq=unreal.load_asset(ROOT+'/Sequences/LS_WorldWakesWedge')
material=unreal.load_asset(ROOT+'/Materials/M_WakingFerns')
actors=unreal.EditorLevelLibrary.get_all_level_actors()
for old in actors:
    if old.get_actor_label()=='WW_Ferns':unreal.EditorLevelLibrary.destroy_actor(old)
for strip in range(1,6):
    name=f'WW_Ferns_{strip:02}'
    task=unreal.AssetImportTask()
    task.filename=str(SOURCE/(name+'.fbx'));task.destination_path=ROOT+'/Meshes'
    task.automated=True;task.save=True;task.replace_existing=True
    options=unreal.FbxImportUI();options.import_as_skeletal=False;options.import_mesh=True
    options.import_materials=False;options.import_textures=False
    options.static_mesh_import_data.set_editor_property('combine_meshes',True)
    task.options=options
    unreal.AssetToolsHelpers.get_asset_tools().import_asset_tasks([task])
    assert task.imported_object_paths,name
    mesh=unreal.load_asset(ROOT+'/Meshes/'+name)
    actor=next((a for a in unreal.EditorLevelLibrary.get_all_level_actors() if a.get_actor_label()==name),None)
    if not actor:actor=unreal.EditorLevelLibrary.spawn_actor_from_object(mesh,unreal.Vector(0,0,0))
    actor.set_actor_label(name)
    actor.static_mesh_component.set_static_mesh(mesh)
    for slot in range(actor.static_mesh_component.get_num_materials()):
        actor.static_mesh_component.set_material(slot,material)
    existing=next((b for b in seq.get_bindings() if b.get_name()==name),None)
    binding=existing or seq.add_possessable(actor)
    binding.set_name(name)
    track=next((t for t in binding.get_tracks() if isinstance(t,unreal.MovieScene3DTransformTrack)),None)
    if not track:track=binding.add_track(unreal.MovieScene3DTransformTrack)
    section=track.get_sections()[0] if track.get_sections() else track.add_section()
    section.set_range(0,90)
    start=[0,16,35,54,73][strip-1]
    finish=min(89,start+15)
    for channel in section.get_all_channels():
        name=channel.get_name()
        if 'Scale.Z' in name:
            for key in channel.get_keys():key.remove()
            frames=sorted(set([0,start,finish,89]))
            for frame in frames:
                value=0.0 if frame<=start else 1.0
                channel.add_key(unreal.FrameNumber(frame),value)
        elif 'Scale.' in name:
            for key in channel.get_keys():key.remove()
            channel.add_key(unreal.FrameNumber(0),1.0)
            channel.add_key(unreal.FrameNumber(89),1.0)
        elif 'Location.' in name or 'Rotation.' in name:
            for key in channel.get_keys():key.remove()
            channel.add_key(unreal.FrameNumber(0),0.0)
            channel.add_key(unreal.FrameNumber(89),0.0)
    print('GROWTH',strip,start,finish)
unreal.EditorAssetLibrary.save_loaded_asset(seq)
assert unreal.get_editor_subsystem(unreal.LevelEditorSubsystem).save_current_level()
