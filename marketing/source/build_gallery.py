from pathlib import Path
from PIL import Image,ImageOps,ImageDraw
import json,html,csv,zipfile
R=Path(__file__).resolve().parents[1]
assets=json.loads((R/'manifest.json').read_text());thumbdir=R/'proofs/thumbs';thumbdir.mkdir(exist_ok=True)
for i,a in enumerate(assets):
 p=R/a['png'];im=Image.open(p).convert('RGB');im.thumbnail((480,600),Image.Resampling.LANCZOS);t=thumbdir/f'{i:04d}.jpg';im.save(t,quality=87);a['thumb']=str(t.relative_to(R))
videos=json.loads((R/'motion/videos.json').read_text()) if (R/'motion/videos.json').exists() else []
posts=json.loads((R/'copy/post-copy.json').read_text());bios=json.loads((R/'copy/profile-bios.json').read_text());signatures=json.loads((R/'email/signatures.json').read_text())
platforms={
'Instagram':{'format':'portrait','notes':'4:5 feed posts, square alternatives, 9:16 Stories/Reels covers, six-slide carousels, avatars and Highlights. Use vertical MP4s for Reels.'},
'Facebook':{'format':'portrait','notes':'Feed graphics, 9:16 Stories, page covers and silent video edits.'},
'LinkedIn':{'format':'landscape','notes':'1200x627 feed graphics, 4:5 alternatives, six-page carousel PDFs, personal and company banners.'},
'X':{'format':'landscape','notes':'Landscape posts, 1500x500 header, avatar and short copy.'},
'Threads':{'format':'square','notes':'Square and portrait graphics; use conversational short copy.'},
'Bluesky':{'format':'landscape','notes':'Landscape posts, a 1500x500 header and short copy. Check the profile crop in-app.'},
'Mastodon':{'format':'landscape','notes':'Landscape posts and square avatar. Header crops and upload limits vary by instance.'},
'TikTok':{'format':'vertical','notes':'1080x1920 silent video posts, covers, title cards and avatar. Add platform-licensed audio if desired.'},
'YouTube':{'format':'vertical','notes':'Shorts videos, 1280x720 thumbnails, 2560x1440 banner and avatar. Banner text is within a conservative central safe region.'},
'Pinterest':{'format':'pin','notes':'1000x1500 Pins, descriptions and destination links.'},
'Snapchat':{'format':'vertical','notes':'9:16 Story graphics and silent videos. Preview app overlays before posting.'},
'WhatsApp':{'format':'vertical','notes':'9:16 Status graphics/videos and square business avatar.'},
'Google Business Profile':{'format':'square','notes':'Square update images, profile copy and project links. Preview platform cropping.'},
'Reddit':{'format':'landscape','notes':'Landscape images and square avatar. Adapt copy to the community and its posting rules.'},
'Behance':{'format':'portrait','notes':'3200x410 profile banner, project-story carousel images and 1600x1200 overview shots.'},
'Dribbble':{'format':'square','notes':'1600x1200 studio shots plus avatar. Source work is presented as Capra work.'},
'Twitch':{'format':'landscape','notes':'1200x480 profile banner, square avatar and video title cards.'},
'Discord':{'format':'square','notes':'Community graphics, square icon and 960x540 banner master. Profile/server features may crop differently.'},
'Telegram':{'format':'square','notes':'Channel avatar, square/portrait posts and 9:16 Story masters.'},
'Substack / email':{'format':'landscape','notes':'Newsletter headers, campaign banners, studio copy and six email drafts.'},
'Zoom / Meet / Teams':{'format':'landscape','notes':'1920x1080 meeting backgrounds keep the middle clear for the speaker.'}}
(R/'platform-map.json').write_text(json.dumps(platforms,indent=2))
(R/'data.js').write_text('window.CAPRA_DATA='+json.dumps({'assets':assets,'videos':videos,'posts':posts,'bios':bios,'signatures':signatures,'platforms':platforms},ensure_ascii=False)+';')
# Contact sheets make every export inspectable without browsing hundreds of full-size files.
for start in range(0,len(assets),30):
 batch=assets[start:start+30];out=Image.new('RGB',(1500,1800),'#d8d5cc');d=ImageDraw.Draw(out)
 for j,a in enumerate(batch):
  im=Image.open(R/a['png']).convert('RGB');im.thumbnail((232,312),Image.Resampling.LANCZOS);x=j%6*250+(250-im.width)//2;y=j//6*360;out.paste(im,(x,y));label=f'{start+j+1:03d} '+a['title'][:29];d.text((j%6*250+7,y+317),label,fill='#15141c');d.text((j%6*250+7,y+334),a['theme']+' / '+a.get('format',''),fill='#15141c')
 out.save(R/'proofs'/f'contact-sheet-{start//30+1:02d}.jpg',quality=90)
# CSV inventory contains traceable paths, format and production notes.
with (R/'asset-inventory.csv').open('w',newline='') as f:
 w=csv.writer(f);w.writerow(['Title','Category','Theme','Dimensions','Platforms','PNG','Editable SVG','PDF','Production notes'])
 for a in assets:w.writerow([a['title'],a['category'],a['theme'],f"{a['width']}x{a['height']}",'; '.join(a['platforms']),a['png'],a['svg'],a.get('pdf',''),' | '.join(f'{k}: {a[k]}' for k in ['trim','bleed','color'] if k in a)])
print('GALLERY DATA',len(assets),len(videos),len(posts))
