"""Read the cloned sample's light values before setting a twilight grade."""
import unreal
assert 'CapraElectricDreamStudy' in unreal.Paths.project_dir()
for actor in unreal.EditorLevelLibrary.get_all_level_actors():
    if isinstance(actor,unreal.DirectionalLight):
        print('SUN',actor.get_actor_label(),actor.get_components_by_class(unreal.DirectionalLightComponent)[0].get_editor_property('intensity'))
    elif isinstance(actor,unreal.SkyLight):
        print('SKY',actor.get_actor_label(),actor.light_component.get_editor_property('intensity'))
    elif isinstance(actor,unreal.PostProcessVolume):
        print('POST',actor.get_actor_label(),actor.get_editor_property('priority'),actor.get_editor_property('unbound'))
