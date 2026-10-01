"""Repair the Unreal clamp connection and brighten the test's readable baseline."""
import unreal
ROOT='/Game/CapraStudy/WorldWakes'
for name in ['M_WakingGround','M_WakingStone','M_WakingSeams','M_WakingFerns','M_WakingSpores']:
    material=unreal.load_asset(ROOT+'/Materials/'+name)
    nodes=unreal.MaterialEditingLibrary.get_material_expressions(material)
    divide=next(n for n in nodes if isinstance(n,unreal.MaterialExpressionDivide))
    clamp=next(n for n in nodes if isinstance(n,unreal.MaterialExpressionClamp))
    position=next(n for n in nodes if isinstance(n,unreal.MaterialExpressionWorldPosition))
    component=next(n for n in nodes if isinstance(n,unreal.MaterialExpressionComponentMask))
    component.set_editor_property('r',True)
    component.set_editor_property('g',False)
    assert unreal.MaterialEditingLibrary.connect_material_expressions(position,'',component,'None'),name
    assert unreal.MaterialEditingLibrary.connect_material_expressions(divide,'',clamp,'None'),name
    sources=unreal.MaterialEditingLibrary.get_inputs_for_material_expression(material,clamp)
    assert sources[0],(name,sources)
    unreal.MaterialEditingLibrary.recompile_material(material)
    unreal.EditorAssetLibrary.save_loaded_asset(material)
    print('REPAIRED',name,sources)
world=unreal.get_editor_subsystem(unreal.UnrealEditorSubsystem).get_editor_world()
assert 'WorldWakesStudy' in world.get_path_name()
pp=next(a for a in unreal.EditorLevelLibrary.get_all_level_actors() if isinstance(a,unreal.PostProcessVolume))
settings=pp.get_editor_property('settings')
settings.set_editor_property('auto_exposure_bias',1.3)
pp.set_editor_property('settings',settings)
assert unreal.get_editor_subsystem(unreal.LevelEditorSubsystem).save_current_level()
