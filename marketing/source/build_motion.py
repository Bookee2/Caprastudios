from pathlib import Path
import json,subprocess,concurrent.futures
R=Path(__file__).resolve().parents[1];videos=[];jobs=[]
FILM=R/'brand/media/trailgoat-brand-film-source.mp4'
if not FILM.exists():FILM=R.parent/'assets/motion/trailgoat-brand-film.mp4'
for slug in ['01-imagination','02-two-lights','05-software','10-web','15-ai','22-project-invitation']:
 for fmt in ['vertical','square']:
  out=R/'motion'/f'{slug}-{fmt}.mp4';images=[R/'social'/slug/'day'/f'{fmt}.png',R/'social'/slug/'night'/f'{fmt}.png',R/'motion/title-cards'/f'outro-{fmt}-night.png']
  cmd=['ffmpeg','-hide_banner','-loglevel','error','-y']
  for p in images:cmd+=['-loop','1','-framerate','30','-t','3', '-i',str(p)]
  cmd+=['-filter_complex','[0:v][1:v]xfade=transition=fade:duration=0.4:offset=2.6[v1];[v1][2:v]xfade=transition=fade:duration=0.4:offset=5.2,format=yuv420p[v]','-map','[v]','-t','7.8','-an','-c:v','libx264','-preset','fast','-crf','20','-movflags','+faststart',str(out)]
  jobs.append((cmd,out,fmt,slug.replace('-',' ').title()))
for fmt,h,ay,ah in [('vertical',1920,990,440),('square',1080,660,270)]:
 out=R/'motion'/f'trailgoat-film-excerpt-{fmt}.mp4';bg=R/'social/12-brand-film/night'/f'{fmt}.png'
 cmd=['ffmpeg','-hide_banner','-loglevel','error','-y','-loop','1','-framerate','30','-i',str(bg),'-ss','4','-t','8','-i',str(FILM),'-filter_complex',f'[1:v]scale=952:{ah}:force_original_aspect_ratio=decrease,pad=952:{ah}:(ow-iw)/2:(oh-ih)/2:color=0x0b0a12,fps=30[film];[0:v][film]overlay=64:{ay}:shortest=1,format=yuv420p[v]','-map','[v]','-t','8','-an','-c:v','libx264','-preset','fast','-crf','20','-movflags','+faststart',str(out)]
 jobs.append((cmd,out,fmt,'TrailGoat brand film / silent excerpt'))
def render(job):
 cmd,out,fmt,title=job;subprocess.run(cmd,check=True,stdout=subprocess.DEVNULL,stderr=subprocess.PIPE)
 data=json.loads(subprocess.check_output(['ffprobe','-v','error','-show_streams','-show_format','-of','json',str(out)]));v=next(s for s in data['streams'] if s['codec_type']=='video')
 assert v['width']==1080 and v['height']==(1920 if fmt=='vertical' else 1080)
 assert float(data['format']['duration'])>=7.7
 poster=out.with_suffix('.jpg');subprocess.run(['ffmpeg','-hide_banner','-loglevel','error','-y','-ss','3.5','-i',str(out),'-frames:v','1',str(poster)],check=True)
 result={'title':title,'video':str(out.relative_to(R)),'poster':str(poster.relative_to(R)),'format':fmt,'width':v['width'],'height':v['height'],'duration':float(data['format']['duration']),'audio':'Silent','bytes':out.stat().st_size}
 print('VIDEO',out.name,flush=True);return result
with concurrent.futures.ThreadPoolExecutor(max_workers=2) as p:videos=list(p.map(render,jobs))
(R/'motion/videos.json').write_text(json.dumps(videos,indent=2));print('DONE',len(videos),'videos')
