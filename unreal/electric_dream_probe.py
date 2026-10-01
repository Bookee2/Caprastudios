"""Read-only geometry probe for the isolated Capra Electric Dreams shot."""
import unreal

world = unreal.get_editor_subsystem(unreal.UnrealEditorSubsystem).get_editor_world()
print('WORLD', world.get_path_name())
for actor in unreal.EditorLevelLibrary.get_all_level_actors():
    name = actor.get_actor_label()
    if name.startswith('WW_') or isinstance(actor, unreal.CineCameraActor) or isinstance(actor, unreal.PointLight):
        origin, extent = actor.get_actor_bounds(False)
        print('ACTOR', name, actor.get_actor_location(), origin, extent)

for path in (
    '/Game/Megascans/3D_Assets/MossyRocks/SM_MossyRocks_01',
    '/Game/Megascans/3D_Assets/MossyForestBoulder/SM_MossyForestBoulder_01',
    '/Game/Megascans/3D_Assets/ForestRockSlab/SM_ForestRockSlab_01',
    '/Game/Megascans/3D_Assets/OldTreeBranch/SM_OldTreeBranch_01',
    '/Game/Megascans/3D_Assets/ForestGround/SM_ForestGround_01',
    '/Game/Megascans/3D_Plants/Fern/SM_Fern_01',
    '/Game/Megascans/3D_Plants/SilverLadyFern/SM_SilverLadyFern_01',
    '/Game/Megascans/3D_Plants/CustomMoss/SM_CustomMoss_01',
):
    mesh = unreal.load_asset(path)
    print('MESH', path, mesh.get_bounds() if mesh else None,
          [mesh.get_material(i).get_path_name() if mesh.get_material(i) else None
           for i in range(mesh.get_num_sections(0))] if mesh else None)
