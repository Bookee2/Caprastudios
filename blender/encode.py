"""Package Blender frames as browser-compatible silent films and poster images."""
import argparse
import hashlib
import json
import os
from pathlib import Path
import shutil
import struct
import subprocess

p=argparse.ArgumentParser()
p.add_argument('--draft', action='store_true')
p.add_argument('--folder', default='final')
args=p.parse_args()
root=Path(__file__).resolve().parents[1]
out=root/'output'/'blender'/'v2'
ffmpeg=os.environ.get('CAPRA_FFMPEG') or shutil.which('ffmpeg')
if not ffmpeg:
    raise SystemExit('Install FFmpeg or set CAPRA_FFMPEG to its executable path.')

def run(*params):
    subprocess.run([ffmpeg,'-hide_banner','-loglevel','warning','-y',*map(str,params)],check=True)

folder=out/args.folder
files=sorted(folder.glob('unicorn-*.png'))
settings=json.loads((folder/'render-info.json').read_text())
scene=out/'capra-ribbon-unicorn.blend'
if hashlib.sha256(scene.read_bytes()).hexdigest()!=settings['source_sha256']:
    raise SystemExit('The rendered frames and editable scene belong to different revisions.')
expected=settings['frame_end']
if len(files)!=expected:
    raise SystemExit(f'Expected {expected} rendered frames, found {len(files)}.')
if [p.name for p in files]!=[f'unicorn-{n:04d}.png' for n in range(1,expected+1)]:
    raise SystemExit('The frame sequence is not continuous from frame 1.')
if not args.draft:
    with files[0].open('rb') as source:
        header=source.read(24)
    if struct.unpack('>II',header[16:24])!=(1920,1080):
        raise SystemExit('Final exports require native 1920 x 1080 frames. Use --draft for a smaller proof.')
name='motion-proof' if args.draft else 'capra-unicorn-1080p'
def movie(filename,filters,quality):
    run('-framerate',settings['fps'],'-pattern_type','glob','-i',folder/'unicorn-*.png',
        '-vf',filters+':out_color_matrix=bt709:out_range=tv',
        '-c:v','libx264','-preset','slow','-crf',quality,'-pix_fmt','yuv420p',
        '-colorspace','bt709','-color_primaries','bt709','-color_trc','bt709','-an',
        '-movflags','+faststart',out/f'{filename}.mp4')
movie(name,'scale=trunc(iw/2)*2:trunc(ih/2)*2',19 if args.draft else 17)
if not args.draft:
    # Both films come directly from the PNGs, avoiding a second lossy encode.
    movie('capra-unicorn-mobile','crop=1080:1080:(iw-1080)/2:0,scale=900:900',19)
    run('-i',files[-1],'-frames:v',1,'-q:v',2,'-update',1,out/'capra-unicorn-poster.jpg')
    run('-i',files[-1],'-vf','crop=1080:1080:(iw-1080)/2:0,scale=900:900',
        '-frames:v',1,'-q:v',2,'-update',1,out/'capra-unicorn-mobile-poster.jpg')
    run('-i',files[0],'-frames:v',1,'-q:v',2,'-update',1,out/'capra-unicorn-opening-poster.jpg')
    run('-i',files[0],'-vf','crop=1080:1080:(iw-1080)/2:0,scale=900:900',
        '-frames:v',1,'-q:v',2,'-update',1,out/'capra-unicorn-mobile-opening-poster.jpg')
    preview=(root/'blender'/'preview.html').read_text()
    (out/'index.html').write_text(preview.replace('../assets/motion/','./').replace('href="../"','href="../../"'))
    # The editable scene is a source deliverable, outside the website assets.
    shutil.copyfile(out/'capra-ribbon-unicorn.blend',root/'blender'/'capra-ribbon-unicorn.blend')
    public=root/'assets'/'motion'
    public.mkdir(parents=True,exist_ok=True)
    for asset_name in ['capra-unicorn-1080p.mp4','capra-unicorn-mobile.mp4',
                 'capra-unicorn-poster.jpg','capra-unicorn-mobile-poster.jpg',
                 'capra-unicorn-opening-poster.jpg','capra-unicorn-mobile-opening-poster.jpg']:
        shutil.copyfile(out/asset_name,public/asset_name)
print('Encoded',out/f'{name}.mp4')
