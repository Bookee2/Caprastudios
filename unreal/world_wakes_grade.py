"""Correct light channel order and refine the first wedge's contrast."""
import unreal
assert 'WorldWakesStudy' in unreal.get_editor_subsystem(unreal.UnrealEditorSubsystem).get_editor_world().get_path_name()
lights={
 'Signal front':((35,215,255),9200,430),
 'Violet backlight':((125,78,255),3100,950),
 'Soft grazing key':((170,205,255),3600,1200),
}
for actor in unreal.EditorLevelLibrary.get_all_level_actors():
    if isinstance(actor,unreal.PointLight) and actor.get_actor_label() in lights:
        rgb,intensity,radius=lights[actor.get_actor_label()]
        component=actor.point_light_component
        component.set_editor_property('light_color',unreal.Color(r=rgb[0],g=rgb[1],b=rgb[2],a=255))
        component.set_editor_property('intensity',intensity)
        component.set_editor_property('attenuation_radius',radius)
    if isinstance(actor,unreal.PostProcessVolume):
        settings=actor.get_editor_property('settings')
        settings.set_editor_property('auto_exposure_bias',1.0)
        actor.set_editor_property('settings',settings)
assert unreal.get_editor_subsystem(unreal.LevelEditorSubsystem).save_current_level()
print('GRADED')
