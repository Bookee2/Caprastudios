"""Package Blender frames as browser-compatible silent films and poster images."""
import argparse
import os
from pathlib import Path
import shutil
import subprocess

p=argparse.ArgumentParser()
p.add_argument('--draft', action='store_true')
p.add_argument('--folder', default='frames')
args=p.parse_args()
root=Path(__file__).resolve().parents[1]
out=root/'output'/'blender'
ffmpeg=os.environ.get('CAPRA_FFMPEG') or shutil.which('ffmpeg')
if not ffmpeg:
    raise SystemExit('Install FFmpeg or set CAPRA_FFMPEG to its executable path.')

def run(*params):
    subprocess.run([ffmpeg,'-hide_banner','-loglevel','warning','-y',*map(str,params)],check=True)

folder=out/('draft' if args.draft else args.folder)
files=sorted(folder.glob('unicorn-*.png'))
expected=80 if args.draft else 240
if len(files)!=expected:
    raise SystemExit(f'Expected {expected} rendered frames, found {len(files)}.')
name='motion-proof' if args.draft else 'capra-unicorn-1080p'
run('-framerate',10 if args.draft else 30,'-pattern_type','glob','-i',folder/'unicorn-*.png',
    '-vf','scale=out_color_matrix=bt709:out_range=tv',
    '-c:v','libx264','-preset','slow','-crf',19,'-pix_fmt','yuv420p',
    '-colorspace','bt709','-color_primaries','bt709','-color_trc','bt709','-an',
    '-movflags','+faststart',out/f'{name}.mp4')
if not args.draft:
    run('-i',out/f'{name}.mp4','-vf','crop=1080:1080:(iw-1080)/2:0,scale=900:900',
        '-c:v','libx264','-preset','slow','-crf',20,'-pix_fmt','yuv420p','-an',
        '-movflags','+faststart',out/'capra-unicorn-mobile.mp4')
    run('-i',folder/'unicorn-0240.png','-frames:v',1,'-q:v',2,'-update',1,out/'capra-unicorn-poster.jpg')
    run('-i',folder/'unicorn-0240.png','-vf','crop=1080:1080:(iw-1080)/2:0,scale=900:900',
        '-frames:v',1,'-q:v',2,'-update',1,out/'capra-unicorn-mobile-poster.jpg')
    preview=(root/'blender'/'preview.html').read_text()
    (out/'index.html').write_text(preview.replace('../assets/motion/','./').replace('href="../"','href="../../"'))
    # The editable scene is a source deliverable, outside the website assets.
    shutil.copyfile(out/'capra-ribbon-unicorn.blend',root/'blender'/'capra-ribbon-unicorn.blend')
    public=root/'assets'/'motion'
    public.mkdir(parents=True,exist_ok=True)
    for asset_name in ['capra-unicorn-1080p.mp4','capra-unicorn-mobile.mp4',
                 'capra-unicorn-poster.jpg','capra-unicorn-mobile-poster.jpg']:
        shutil.copyfile(out/asset_name,public/asset_name)
print('Encoded',out/f'{name}.mp4')
