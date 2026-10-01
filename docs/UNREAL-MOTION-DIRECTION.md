# Capra Unreal motion direction — September 29, 2026

User direction: Unreal is available again; explore the cinematic template and Electric Dreams assets. All initial renders must be 1280×720. The template is optional. No 4K render until a draft direction is approved.

Inspection: the running editor is UE 5.8 with `/Users/kb/Documents/Unreal Projects/Capra_intro/Capra_intro.uproject`. The project contains CinematicTemplate Main/North/East/West maps, SeqAA with three shots, a cyclorama mesh, and Movie Render Pipeline enabled. Its startup map is Main; logs show North loading. Electric Dreams content was not found in this project's Content directory. No live MCP tool is exposed in this conversation; the editor's identified TCP listener is Unreal Trace, not an MCP endpoint. Requested the server URL/port or plugin name. No scene was modified or render started.

## Recommended: Signal in the wild

A 10–12 second Capra ident: dark wet stone and foliage in close focus; cyan/violet light threads move through the clearing, wrapping into the approved ribbon-unicorn silhouette. The camera settles as the environment falls into darkness, leaving the mark and CAPRA. Keep pink as a brief highlight. A deliberate brand reveal with restrained camera motion connects natural materials to the site's filament language.

Electric Dreams supplies the environmental assets, once available. Epic documents a smaller PCGCloseRange scene with creek and cliff assets; begin with a tiny composed patch, not the full environment. Validate the needed assets/materials on the Mac before committing to the complete sample, whose documented requirements include DirectX 12. Reference: https://dev.epicgames.com/documentation/unreal-engine/electric-dreams-environment-in-unreal-engine

## Other directions

- Material choreography: satin-metal strips rotate under cyan/violet lighting and align into the unicorn. Use the cinematic cyclorama as a lighting test. Suitable for a short website loop; requires approved logo geometry or a faithful temporary proxy.
- Impossible garden: a dark floating slab carries moss, stone and ferns; luminous strands thread through it and reveal the mark in negative space. A contained composition suitable for an isolated motion portfolio piece.

## First proof

Make one hero still at 1280×720, then a four-second/120-frame camera-and-light test at 30 fps. Use an isolated Capra study level/sequence so the template remains intact. Evaluate silhouette, material clarity, light spill, camera pacing and frame time before adding a full reveal. No sound generation or paid asset acquisition is part of this pass. Actual asset and live scene access remain unverified until MCP is connected.

## MCP reconnection

Later September 29: successfully initialized MCP at `http://127.0.0.1:8000/mcp` and called its tool discovery and project-context tool. The server currently registers only `ToolsetRegistry.AgentSkillToolset` and `AIAssistant.AIAssistantToolset`; resources are empty, and project-context fields are empty. This is a working transport with insufficient scene-inspection tools, not a connection failure. Installed UE source confirms the `EditorToolset` plugin supplies `CaptureViewport`, actor selection and asset inspection tools, but it is not registered in this session. Next step: enable EditorToolset in Unreal and restart if prompted. No project configuration, scene, or render settings changed during this check. Electric Dreams still not visible in Capra_intro/Content.

## EditorToolset verified after restart

Live MCP scene inspection and CaptureViewport now work. Active level: `/Game/CinematicTemplate/Maps/Main`; visible template includes mannequin, camera rail, reference charts/spheres and stage signage. Registered tools now cover actor/scene, asset, material, mesh, object/property and viewport operations. `CaptureViewport` requires explicit null values for `captureTransform` and `annotations` despite its optional schema. Asset registry returns no ElectricDreams matches and only Characters/CinematicTemplate/Collections/Developers as /Game roots. No scene mutations performed.

Inspected installed UE toolset source: AnimationAssistantToolset provides Sequencer and keyframing; Niagara Toolsets covers Niagara; PCGToolset covers procedural graphs. None of these is currently registered. EditorToolset's programmatic tool is a restricted tool-orchestration sandbox, not general Unreal Python, and cannot alone call Movie Render Queue APIs. Python Script Plugin is loaded; its Enable Remote Execution setting offers a separate automation route for rendering. Proposed next setup: enable the three purpose-specific toolsets together, and enable Python remote execution for local render automation. Initial output remains 1280×720.

## Full tool and render-access check

Next restart verified: Sequencer, keyframing, Control Rig, Niagara system/component/assets, and PCG toolsets are registered over MCP. Python remote execution is enabled. A read-only Python call into the live Capra_intro editor successfully confirmed MoviePipelineQueueSubsystem, LevelSequenceEditorSubsystem and MoviePipelineOutputSetting availability; the queue has zero jobs and is not rendering. No scene changes or render submissions were made.

The stock Python remote discovery client returned no nodes on this Mac. Client-only fix: receive multicast replies on a wildcard UDP socket joined to 239.0.0.1 on loopback; send discovery/control packets directly to 127.0.0.1:6766. Keep TCP commands on 127.0.0.1:6776 and multicast TTL zero. No engine configuration or installed source was changed. Verified helper: `/tmp/capra_remote_check.py`; MCP helper: `/tmp/capra_unreal_mcp.py`. All requested access is now available; next production step is the isolated 720p lighting/ribbon study.

## First Unreal proof — completed September 29, 2026

Kris asked whether work was underway, continuing the authorized 720p studio motion test. Exported the four finished meshes from the approved native Blender scene at frame 480; the original `.blend` remains unchanged. Imported them into `/Game/CapraStudy/Meshes/` in the running `Capra_intro` project. Created and saved an isolated `/Game/CapraStudy/Maps/CapraRibbonStudy` level, four colored satin materials, studio lighting, a camera, and `/Game/CapraStudy/Sequences/LS_CapraRibbonProof`. The cinematic template map had no dirty packages before changing levels and was not modified. Electric Dreams was still downloading and supplied no assets to this test.

The first 720p pass clipped the horn and lower fold. A second pass corrected framing, and a third added a wider camera arc and traveling blue light. Reviewed frames 0, 30, 60, 90 and 119 of the final pass. The silhouette stays in frame. This is a lighting and camera proof of the finished sculpture, not a full ribbon assembly or forest concept.

Movie Render Queue produced 120 PNGs at 1280×720, 30 fps under `/Users/kb/Documents/Unreal Projects/Capra_intro/Saved/CapraStudy/Render720_v3/`. Encoded the four-second H.264 preview to `output/unreal/capra-ribbon-light-study-720p.mp4` (ignored by Git) with a mid-frame JPEG poster beside it. FFprobe confirmed resolution, 120 frames, and four seconds. The preview is silent. No website media was replaced or deployed.

## Playback access

The conversation's inline video did not render for Kris. Added a local HTML player at `output/unreal/index.html` and served it at `http://127.0.0.1:4179/`. Verified with Chrome that the page loads, the movie plays, and the decoded media is 1280×720 for four seconds. This is a local preview server only.

## Phone access

The loopback preview was inaccessible from Kris's phone. Started a local-network preview on `192.168.68.65:4180` serving only the study page, poster, and MP4 with HTTP byte ranges; verified HTTP 200 for the page and 206 for a video range from this Mac. This address requires the phone to be on the same home network and the Mac to remain on. Also copied the 228 KB video to iCloud Drive > Capra Studios > Previews > Capra ribbon Unreal study 720p.mp4; local SHA-256 matches the source. iCloud sync and playback on a physical phone are not verified here.

## Revised creative direction after ribbon critique — September 29, 2026

Kris found the Unreal ribbon proof merely fine and said none of the ribbon animations so far had impressed him. This supersedes the earlier proposal to make the ribbon's assembly the central action. Keep the approved mark for identity, but stop spending the opening film on an animated logo. The first study remains a technical asset-import/lighting/render proof, not a creative sign-off.

### Recommended film: The world wakes

A cinematic, approximately ten-second transformation in one deliberately composed corner of Electric Dreams. Begin nearly black, close to a wet stone or fallen branch. A precise cyan point travels through a seam. Its arrival releases a visible chain reaction: nearby surfaces change from charcoal to saturated violet/blue, moss and small plants appear, and light moves through the environment. The camera crosses the transformation front and resolves on a rich but controlled clearing. Capra's name and a restrained static mark appear only after the image settles. The film's subject is an idea becoming a world, expressing Capra's design, build, and motion practice.

Shot timing at 30 fps: 0–2 seconds, tactile macro and first signal; 2–5 seconds, clear cause-and-effect transformation traveling through ground, rock and foliage; 5–8 seconds, camera move through the changed space; 8–10 seconds, composed reveal and Capra sign-off. Do not make a generic fly-through, floating UI, or another line that traces the unicorn.

Production tests: first a still and a 2–3 second 1280×720 transformation wedge, then the ten-second draft at the same resolution. Use the Electric Dreams smaller PCGCloseRange creek/cliff level or a compact subset of its assets if it can be opened and rendered on this Mac. The full four-kilometer sample is unnecessary. Unreal Sequencer controls camera and light; Niagara can control local particles; PCG or a staged material reveal provides the environmental change. Epic documents the smaller level and Niagara's Sequencer controls, but the sample's behavior on this machine is unverified until download completes and an actual render is made.

Evaluation gate: the viewer should identify the triggering point, see the environment visibly transform, and reach a final composition that could hold a homepage headline. Test at full width and at a phone crop. The reveal needs a clear beginning, middle and payoff without depending on the logo animation or a music cue. Keep the existing website filament and project transitions while this is explored; do not swap site media until the new piece exceeds the current presentation.

## World Wakes 720p transformation wedge — built September 29, 2026

Kris authorized the first test. Electric Dreams was still downloading and no Electric Dreams asset appeared in `Capra_intro/Content`, so this study uses an original Blender-built proxy environment. Editable source is in `unreal/world_wakes_assets.py` and `Capra_intro/Saved/CapraStudy/WorldWakesSource/WorldWakesProxy.blend`. The isolated Unreal map is `/Game/CapraStudy/WorldWakes/Maps/WorldWakesStudy`; the 90-frame Sequencer asset is `/Game/CapraStudy/WorldWakes/Sequences/LS_WorldWakesWedge`. The cinematic template and earlier ribbon study remain separate.

The three-second wedge starts with a dark field of stones and seams. A cyan light moves right-to-left on screen while a world-position-and-time material changes the terrain, stones, seams and spores; five foliage groups rise in sequence. The final 1280×720, 30 fps, silent preview is `output/unreal/capra-world-wakes-wedge-720p.mp4` (ignored by Git). Movie Render Queue PNGs are in `Capra_intro/Saved/CapraStudy/WorldWakesRender720_v8/`. FFprobe confirmed 90 frames and three seconds. Frames 0, 30, 60 and 89 were inspected. A 405×720 center crop was checked near the beginning, middle, and end; the local transformation remains visible in that narrow composition. Chrome playback was checked at 1280 px and 390 px; the local preview returned HTTP 200 and the phone-network video route returned HTTP 206 for a byte range. Actual playback on Kris's phone and iCloud sync are unverified. A matching local copy was put in iCloud Drive > Capra Studios > Previews > Capra world wakes 720p.mp4.

Creative assessment: this verifies an actual traveling cause-and-effect transformation, including geometry growth, but its proxy stones and foliage still read as stylized test geometry. Do not promote it to the homepage or call it the final 10-second film. The next quality step is to replace the proxy set dressing with a composed corner of Electric Dreams after the installation and Mac render test, then add the macro opening, camera passage, and quiet Capra end frame. Keep this wedge as the motion reference and timing target.

To rebuild on this Mac with the `Capra_intro` editor open and Python remote execution enabled: run Blender in background mode with `unreal/world_wakes_assets.py`, then run `unreal/run_remote.py` against `world_wakes_scene.py`, `world_wakes_sequence.py`, `world_wakes_growth.py`, and `world_wakes_render.py` in that order. The runner copies scripts into the Unreal project's Saved directory to avoid a macOS Desktop access prompt. `world_wakes_finish.py` and `world_wakes_repair.py` are recovery scripts from intermediate Unreal Python/material API errors; they are not part of a fresh build. Use `scripts/unreal-preview.mjs` to serve only the encoded preview assets on a local or home-network address.

## Electric Dreams creek study — September 29, 2026

Electric Dreams finished installing in `/Users/kb/Documents/Unreal Projects/TrailGoatElectricDream`. The active sample project contains Kris's TrailGoat work, so the Capra test uses an APFS-cloned copy at `/Users/kb/Documents/Unreal Projects/CapraElectricDreamStudy`. The source project and `Capra_intro` were not edited in this pass. The smaller `/Game/Levels/PCG/ElectricDreams_PCGCloseRange` map loaded in UE 5.8 on this Mac; its Megascans rocks, ground, ferns and PCG environment rendered at 1280×720. A first attempt to place those natural assets on the proxy's synthetic blue ground looked incoherent and was rejected after inspecting frames 0, 30, 60 and 89.

The second approach works within the sample's own creek scene. It removes the sample's instructional text in the cloned project, sets a twilight exposure, and animates a cyan signal up the creek as the camera moves forward. Cyan, violet and magenta lighting builds toward the end; six Electric Dreams ferns have staggered growth keys. The first pass was too subtle, so v2 adds animated directional/sky illumination and colored light intensity. The 90-frame, three-second v2 draft is `output/unreal/capra-electric-dreams-creek-720p.mp4` (ignored by Git), 1280×720 at 30 fps, silent, 1,476,334 bytes. PNGs are in `CapraElectricDreamStudy/Saved/CapraStudy/EDCreekRender720_v2/`; the level is `/Game/Levels/PCG/ElectricDreams_PCGCloseRange` and the sequence is `/Game/CapraStudy/ElectricDreams/Sequences/LS_EDWorldWakes` in the cloned project. `ffprobe` confirmed 90 frames and three seconds. Frames 0, 25, 50, 75 and 89 and a 405×720 center crop of the final frame were inspected.

Creative assessment: the environment is now cohesive and the light event reads in the creek, including a colorful final composition. The six fern growth beats are difficult to distinguish against the dense existing foliage. This is a credible 720p mood and motion test, not yet the promised ten-second film or a physical transformation with a clear botanical payoff. Next exploration should bring the growth into the visible creek banks or use a close foreground shot before extending duration. Keep the website media unchanged until Kris reviews the cut.

The preview page is served at `http://192.168.68.65:4180/` while the Mac is on the same home network; HTTP 200 for the page and poster and byte-range HTTP 206 for the MP4 were verified locally. A matching file was copied to iCloud Drive > Capra Studios > Previews > `Capra Electric Dreams creek 720p.mp4`, with matching SHA-256. Physical phone playback and iCloud sync remain unverified. To edit the isolated scene, launch `CapraElectricDreamStudy/ElectricDreamsSample.uproject` and run `unreal/run_remote.py` with `UNREAL_PROJECT_ROOT=/Users/kb/Documents/Unreal Projects/CapraElectricDreamStudy`, `UNREAL_PROJECT_NAME=ElectricDreamsSample`, `UNREAL_REMOTE_GROUP=239.0.0.2:6767`, and `UNREAL_COMMAND_PORT=6777`. The scene scripts are `electric_dream_scout.py`, `electric_dream_grade_scout.py`, `electric_dream_twilight.py`, `electric_dream_wake.py`, `electric_dream_reveal.py`, and `electric_dream_creek_render.py`. The distinct Python remote port avoids clashing with Kris's other Unreal editors.

## Storage change — September 29, 2026

The Capra-only Electric Dreams clone now lives at `/Volumes/KB SS/Unreal Projects/CapraElectricDreamStudy`. Its prior path in `Documents/Unreal Projects` is a symlink, so older launch commands still resolve to the external copy. The full copy was verified with an rsync dry run, matching `.uproject` content, and SHA-256 checks of all CapraStudy assets before removing the internal clone. Because it was an APFS clone of Kris's live TrailGoat project, this move reclaimed little physical internal space.

Only the Capra-generated `Capra_intro/Saved/CapraStudy` folder moved to `/Volumes/KB SS/Capra Studios/Unreal/Capra_intro/CapraStudy`; its old location is a symlink. The copy passed a checksum rsync dry run. The `Capra_intro` project itself remains on the internal SSD. Its project content and Kris's original `TrailGoatElectricDream` project were not moved. Future Capra render scripts write through these external-backed paths; `unreal/run_remote.py` still targets the original `Capra_intro` project by default, and the Electric Dreams study requires the explicit `UNREAL_PROJECT_ROOT` above. The external SSD must be mounted for the symlinked Capra study and render cache to be available.
Create any new Capra Unreal project and its render/cache directories directly under `/Volumes/KB SS/Unreal Projects` or `/Volumes/KB SS/Capra Studios/Unreal`. Do not relocate other projects or render archives as part of Capra storage maintenance.
