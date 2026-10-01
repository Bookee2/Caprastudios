"""Reverse the rendered shard frames into the rebuild film and its poster.

  python3 blender/encode_shards.py --frames-dir output/shards

The simulation runs whole tile to scattered shards; played backwards the shards
lift off the floor and close into the tile, which then holds. FFmpeg must be on
PATH, or its full path supplied in CAPRA_FFMPEG.
"""
import argparse
import os
import subprocess
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
args = argparse.ArgumentParser()
args.add_argument('--frames-dir', default='output/shards')
args.add_argument('--fps', type=int, default=48)      # 150 simulated frames at 48 fps: about three seconds
args.add_argument('--hold', type=float, default=1.4)
opts = args.parse_args()
frames = (ROOT / opts.frames_dir).resolve()
out = ROOT / 'assets' / 'motion'
ffmpeg = os.environ.get('CAPRA_FFMPEG', 'ffmpeg')
count = len(sorted(frames.glob('f*.png')))
assert count >= 2, f'no frames in {frames}'

subprocess.run([ffmpeg, '-y', '-loglevel', 'error', '-framerate', str(opts.fps), '-i', str(frames / 'f%04d.png'),
                '-vf', f'reverse,tpad=stop_mode=clone:stop_duration={opts.hold},format=yuv420p',
                '-c:v', 'libx264', '-preset', 'slow', '-crf', '22', '-profile:v', 'high', '-movflags', '+faststart', '-an',
                str(out / 'unicorn-shards.mp4')], check=True)
# The poster is the whole tile: what the film ends on, and what motion-off and no-JavaScript visitors see.
subprocess.run([ffmpeg, '-y', '-loglevel', 'error', '-i', str(frames / 'f0001.png'), '-q:v', '3',
                str(out / 'unicorn-shards-poster.jpg')], check=True)
for name in ('unicorn-shards.mp4', 'unicorn-shards-poster.jpg'):
    print(f'{name}: {(out / name).stat().st_size / 1e6:.2f} MB')
