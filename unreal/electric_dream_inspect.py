"""Read-only inspection of the cloned Electric Dreams close-range map."""
import unreal

MAP = '/Game/Levels/PCG/ElectricDreams_PCGCloseRange'
print('MAP_EXISTS', unreal.EditorAssetLibrary.does_asset_exist(MAP))
for path in (
    '/Game/Megascans/3D_Assets/MossyRocks/SM_MossyRocks_01',
    '/Game/Megascans/3D_Assets/ForestGround/SM_ForestGround_01',
    '/Game/Megascans/3D_Plants/Fern/SM_Fern_01',
):
    mesh = unreal.load_asset(path)
    print('MESH', path, bool(mesh), mesh.get_bounds() if mesh else None)
    del mesh

level = unreal.get_editor_subsystem(unreal.LevelEditorSubsystem)
assert not unreal.EditorLoadingAndSavingUtils.get_dirty_map_packages(), 'Current map has unsaved edits'
world = unreal.get_editor_subsystem(unreal.UnrealEditorSubsystem).get_editor_world()
print('INITIAL_WORLD', world.get_path_name() if world else None)
already_open = world and MAP in world.get_path_name()
del world
if not already_open:
    print('LOAD_BEGIN', MAP)
    ok = level.load_level(MAP)
    print('LOAD_END', ok)
world = unreal.get_editor_subsystem(unreal.UnrealEditorSubsystem).get_editor_world()
print('WORLD', world.get_path_name() if world else None)
actors = unreal.EditorLevelLibrary.get_all_level_actors()
print('ACTOR_COUNT', len(actors))
for actor in actors[:250]:
    location = actor.get_actor_location()
    print('ACTOR', actor.get_actor_label(), actor.get_class().get_name(),
          round(location.x), round(location.y), round(location.z))
