from pathlib import Path
import json,zipfile,shutil,sys
R=Path(sys.argv[1]).resolve() if len(sys.argv)>1 else Path(__file__).resolve().parents[1]
readme='''CAPRA STUDIOS — THE MARKETING ROOM
Created October 2, 2026 from caprastudios.co, daylight and blacklight.

OPEN index.html for the searchable visual library, copy, print room and signatures.
After downloading and unzipping the full suite, the library works offline.
Links to the studio and reference websites require an internet connection.

PERSONAL CONTACT
Kris Brown | kris@caprastudios.co
General studio campaigns use info@caprastudios.co.

CONTENTS
420 PNG designs with editable SVG counterparts (includes format/theme variations).
14 silent H.264 MP4s: 12 campaign cuts + 2 TrailGoat film excerpts.
6 six-slide carousels in both editions; 12 multipage PDFs.
Personal/studio business cards, 6 flyers in Letter and A4, posters, postcard,
letterheads and a six-page capabilities booklet. 43 PDFs total.
4 HTML signatures, 6 HTML/plain-text email drafts.
60 post concepts / 132 channel-specific copy entries, bios and 30-post sequence.
21 platform starter ZIPs, source fonts/licenses, artwork and generators.

PRINT
Use PDFs, not preview PNGs. Cards trim to 3.5 x 2 inches.
Cards, flyers, posters and postcards include 0.125-inch bleed and trim boxes.
Print at actual size. Confirm two-sided orientation and stock with your printer.
RGB colors: have the printer proof and convert to its required output profile.

POSTING
The Marketing Room is published at https://caprastudios.co/marketing/.
Social posts and email drafts have not been sent or scheduled.
Preview platform crop/UI overlays when uploading. All videos are silent.
The 30-post sequence is a suggested order, not a dated publishing schedule.
Do not claim unmeasured results or add fictional testimonials.

EDITING
Install the bundled OFL fonts if your editor ignores fonts embedded in SVGs.
SVGs keep live text. PNGs are ready-to-use raster exports.
Python source needs Python 3, reportlab, Pillow, pypdf, pdftoppm and ffmpeg.
Rebuild order: build_suite.py, build_extras.py, refine_print.py, build_copy.py,
build_motion.py, build_gallery.py, verify_suite.py, package_suite.py.
Edit the Python campaign definitions for full regeneration; JSON files also
provide campaign/carousel data for other tools. Rebuild overwrites derived files.
Gallery HTML/CSS/JS are included and can be edited directly.

QUALITY CHECKS
All 420 export dimensions, SVG text bounds, text overlaps, personal card contacts,
PDF trim boxes, H.264 encoding and video dimensions checked. Representative
visual exports reviewed; QR codes on both personal cards and a flyer scanned.
See proofs/verification.json and contact-sheet images.

LOCAL STORAGE
This suite was generated on the external KB SS SSD. Keep the folder intact.
'''
(R/'START-HERE.txt').write_text(readme)
(R/'platform-kits').mkdir(exist_ok=True)
A=json.loads((R/'manifest.json').read_text());P=json.loads((R/'platform-map.json').read_text())
slugs=['01-imagination','02-two-lights','05-software','10-web','15-ai','22-project-invitation']
extras={'Instagram':['highlight-'],'Facebook':['facebook-cover'],'LinkedIn':['linkedin-'],'X':['x-header'],'Bluesky':['bluesky-header'],'YouTube':['youtube-'],'Behance':['behance-banner','dribbble-shot'],'Dribbble':['dribbble-shot'],'Twitch':['twitch-banner'],'Discord':['discord-banner'],'Substack / email':['newsletter-header','email-header'],'Zoom / Meet / Teams':['meeting-background']}
for i,(platform,spec) in enumerate(P.items(),1):
 files=set()
 for a in A:
  if (a.get('campaign') in slugs and a['category']=='Social' and a.get('format')==spec['format']) or (a['category']=='Profile & cover' and (a['png'].split('/')[-1].startswith('avatar-lime-') or any(x in a['png'] for x in extras.get(platform,[])))):files.add(a['png'])
 if platform in ['Instagram','TikTok','YouTube','Snapchat','WhatsApp','Facebook']:
  files.update('motion/'+slug+'-vertical.mp4' for slug in slugs[:2])
 if platform=='LinkedIn':files.update(str(p.relative_to(R)) for p in (R/'carousels/01-meet-capra').glob('*.pdf'))
 if platform in ['Instagram','Behance']:files.update(a['png'] for a in A if a.get('campaign')=='01-meet-capra' and a['category']=='Carousel')
 if platform=='Substack / email':files.update(str(p.relative_to(R)) for p in (R/'email').glob('*') if p.is_file())
 files.update(['copy/post-copy.csv','copy/profile-bios.json','copy/30-post-launch-sequence.csv'])
 with zipfile.ZipFile(R/'platform-kits'/f'{i:02d}-starter.zip','w',zipfile.ZIP_DEFLATED,compresslevel=5) as z:
  z.writestr('START-HERE.txt',platform+' STARTER KIT\n\n'+spec['notes']+'\n\n'+readme)
  for f in sorted(files):assert (R/f).is_file(),f;z.write(R/f,f)
with zipfile.ZipFile(R/'Print-Kit.zip','w',zipfile.ZIP_DEFLATED,compresslevel=5) as z:
 z.writestr('START-HERE.txt',readme)
 for d in ['print','brand/fonts']:
  for p in (R/d).rglob('*'):
   if p.is_file() and p.suffix in ['.pdf','.svg','.ttf','.txt']:z.write(p,p.relative_to(R))
print('Starter kits and print kit ready',flush=True)
# The full archive includes the starter ZIPs so all gallery download links work offline.
out=R/'Capra-Studios-Marketing-Suite.zip'
with zipfile.ZipFile(out,'w',zipfile.ZIP_DEFLATED,compresslevel=5) as z:
 for p in sorted(R.rglob('*')):
  if p.is_file() and p!=out and '__pycache__' not in p.parts and p.name!='.DS_Store':z.write(p,p.relative_to(R))
with zipfile.ZipFile(out) as z:assert z.testzip() is None;print('Full archive verified',len(z.namelist()),'files',out.stat().st_size,'bytes')
