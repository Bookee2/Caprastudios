"""Fill the camera with the landscape rather than leaving a black horizon."""
import unreal
assert 'WorldWakesStudy' in unreal.get_editor_subsystem(unreal.UnrealEditorSubsystem).get_editor_world().get_path_name()
camera=next(a for a in unreal.EditorLevelLibrary.get_all_level_actors() if isinstance(a,unreal.CineCameraActor))
camera.set_actor_location(unreal.Vector(0,-650,680),False,False)
camera.set_actor_rotation(unreal.MathLibrary.find_look_at_rotation(camera.get_actor_location(),unreal.Vector(0,0,0)),False)
camera.get_cine_camera_component().set_editor_property('current_focal_length',36.0)
assert unreal.get_editor_subsystem(unreal.LevelEditorSubsystem).save_current_level()
print('CAMERA',camera.get_actor_location(),camera.get_actor_rotation())
