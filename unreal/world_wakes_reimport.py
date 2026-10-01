"""Replace only the proxy meshes after a Blender geometry refinement."""
import unreal
from pathlib import Path
ROOT='/Game/CapraStudy/WorldWakes'
SOURCE=Path(unreal.Paths.project_saved_dir())/'CapraStudy/WorldWakesSource'
for name in ['WW_Terrain','WW_Stones','WW_Seams','WW_Spores']:
    task=unreal.AssetImportTask()
    task.filename=str(SOURCE/(name+'.fbx'));task.destination_path=ROOT+'/Meshes'
    task.automated=True;task.save=True;task.replace_existing=True
    opts=unreal.FbxImportUI();opts.import_as_skeletal=False;opts.import_mesh=True
    opts.import_materials=False;opts.import_textures=False
    opts.static_mesh_import_data.set_editor_property('combine_meshes',True)
    task.options=opts
    unreal.AssetToolsHelpers.get_asset_tools().import_asset_tasks([task])
    assert task.imported_object_paths,name
    print('REIMPORTED',name)
