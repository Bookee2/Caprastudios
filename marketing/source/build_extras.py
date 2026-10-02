from design_engine import *
existing=[a for a in json.loads((ROOT/'manifest.json').read_text()) if a['category'] not in ['Statement series','Motion title card','Email'] and a.get('format') not in ['dribbble-shot','discord-banner','newsletter-header']]
FIELD=[('Go make\nsomething.',LIME,'An idea deserves a next step.'),('Less friction.\nMore flow.',LAGOON,'Software built around the work.'),('Turn the\nlights off.',UV,'There is another side to Capra.'),('Make it\nmove.',MAGENTA,'Websites. Brand films. 3D.'),('AI with\na job to do.',SOLAR,'Start with one useful workflow.'),('Hello,\nAtlanta.',KOI,'A small team of specialists. A big point of view.')]
for i,(title,accent,sub) in enumerate(FIELD):
 for fmt,(w,h) in {'portrait':(1080,1350),'square':(1080,1080)}.items():
  a=Art(ROOT/'social/statement-series'/f'{i+1:02d}-{fmt}',w,h,'day');a.rect(0,0,w,h,accent);a.fg=PAPER if accent==UV else INK
  a.brand(70,95,36);a.text(70,200,'CAPRA / FIELD NOTES',25,'Bold');a.headline(64,365,title,940,440,160)
  a.text(75,710 if h==1080 else 835,sub,36,'Bold');a.logo(775,720 if h==1080 else 1000,150,a.fg)
  a.footer(h-75,'Software. Web. AI.',70);a.finish('Statement series',title.replace('\n',' '),['Instagram','Facebook','LinkedIn','Threads'],meta={'format':fmt,'theme':'color'})
for theme in ['day','night']:
 for name,(w,h,platforms) in {'dribbble-shot':(1600,1200,['Dribbble','Behance project']), 'discord-banner':(960,540,['Discord','Telegram']), 'newsletter-header':(1200,600,['Substack','Newsletter','Email'])}.items():
  a=Art(ROOT/'profiles'/f'{name}-{theme}',w,h,theme);a.brand(70,85,34)
  if name=='dribbble-shot':
   a.headline(64,260,'One studio. Two lights.',1450,260,104,True);a.image('ink',70,480,710,540,True);a.image('metal',820,480,710,540,True);a.footer(1130,'Explore Capra Studios')
  else:
   a.headline(65,235,'Imagination.\nMade tangible.',w-130,260,90,True);a.footer(h-55,'Software. Web. AI.')
  a.finish('Profile & cover',name.replace('-',' ').title()+' / '+theme,platforms,meta={'format':name})
# Social intro / outro frames, also delivered as reusable title cards.
for theme in ['day','night']:
 for fmt,(w,h) in {'vertical':(1080,1920),'square':(1080,1080)}.items():
  for phase,title,body in [('intro','Imagination.\nMade tangible.','Software. Web. AI.'),('outro','What are you\nimagining?','Start a conversation at caprastudios.co')]:
   a=Art(ROOT/'motion/title-cards'/f'{phase}-{fmt}-{theme}',w,h,theme);top=230 if h>1100 else 80;a.brand(70,top,38)
   a.headline(65,520 if h>1100 else 300,title,940,400,118,True);a.paragraph(72,945 if h>1100 else 645,body,850,38,'Bold')
   a.logo(380,1120 if h>1100 else 740,230,LIME if theme=='night' else UV)
   if h>1100:a.footer(1570,'Made in Atlanta',70)
   a.finish('Motion title card',phase.title()+' / '+fmt+' / '+theme,['Reels','TikTok','YouTube Shorts','Video end card'],meta={'format':fmt})
# Four newsletter campaign banners.
for i,(title,accent,_) in enumerate(FIELD[:4]):
 a=Art(ROOT/'email'/f'campaign-banner-{i+1:02d}',1200,450,'day');a.rect(0,0,1200,450,accent);a.fg=PAPER if accent==UV else INK;a.brand(60,70,32);a.headline(55,207,title.replace('\n',' '),1070,160,88);a.text(60,383,'Explore the work at caprastudios.co',27,'Bold');a.finish('Email','Newsletter campaign banner '+str(i+1),['Email','Newsletter'],meta={'format':'email-banner'})

def render(job):
 pdf,png,w,h=job;subprocess.run(['pdftoppm','-scale-to-x',str(w),'-scale-to-y',str(h),'-singlefile','-png',str(pdf),str(png.with_suffix(''))],check=True,stdout=subprocess.DEVNULL,stderr=subprocess.PIPE)
with concurrent.futures.ThreadPoolExecutor(max_workers=4) as pool:list(pool.map(render,renderjobs))
(ROOT/'manifest.json').write_text(json.dumps(existing+manifest,ensure_ascii=False,indent=2));print('ADDED',len(manifest),'assets')
