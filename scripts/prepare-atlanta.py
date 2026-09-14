"""Prepare the supplied Atlanta flyover for the static website; source stays untouched."""
import argparse, os, shutil, subprocess
from pathlib import Path
p=argparse.ArgumentParser()
p.add_argument('source',type=Path)
a=p.parse_args()
ffmpeg=os.environ.get('CAPRA_FFMPEG') or shutil.which('ffmpeg')
if not ffmpeg:raise SystemExit('Install FFmpeg or set CAPRA_FFMPEG.')
if not a.source.is_file():raise SystemExit('Supply the original flyover MP4.')
out=Path(__file__).resolve().parents[1]/'assets'/'motion'
out.mkdir(parents=True,exist_ok=True)
grade='eq=contrast=1.08:brightness=-0.018:saturation=0.9,colorbalance=rs=0.005:gs=-0.006:bs=0.03:rm=0.008:gm=-0.008:bm=0.02'
def run(*args):subprocess.run([ffmpeg,'-hide_banner','-loglevel','warning','-y',*map(str,args)],check=True)
for name,width,quality,rate in [('atlanta-wide',1280,25,2200),('atlanta-mobile',960,26,1100)]:
 run('-i',a.source,'-vf',grade+f',scale={width}:-2:out_color_matrix=bt709:out_range=tv',
     '-c:v','libx264','-crf',quality,'-maxrate',f'{rate}k','-bufsize',f'{rate*2}k',
     '-preset','slow','-pix_fmt','yuv420p','-an',
     '-color_primaries','bt709','-color_trc','iec61966-2-1','-colorspace','bt709',
     '-movflags','+faststart',out/f'{name}.mp4')
run('-ss',24,'-i',a.source,'-vf',grade,'-frames:v',1,'-q:v',2,'-update',1,out/'atlanta-poster.jpg')
print('Prepared Atlanta wide/mobile films and poster.')
