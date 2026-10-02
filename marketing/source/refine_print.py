from design_engine import *
CAMPAIGNS=json.loads((ROOT/'source/campaigns.json').read_text())
# Rebuild production PDFs with the source imagery retained at its available resolution.
s=(ROOT/'source/build_suite.py').read_text();section=s.split('# Print production files.')[1].split('\n',1)[1].split('# Capabilities booklet:')[0];exec(section)
for accent,name in [(LIME,'lime'),(BLUE,'ribbon'),(SOLAR,'solar')]:
 a=Art(ROOT/'profiles'/f'avatar-{name}-day',800,800,'day');a.rect(0,0,800,800,accent);a.logo(235,170,330,INK);a.finish('Profile & cover','Unicorn avatar / '+name,['All profile images'],meta={'format':'avatar'})
BOOK=[('Imagination.\nMade tangible.','A small team of specialists in Atlanta. We build software, websites that move, and AI that earns its keep.','Studio overview',LIME),('Make the\ncomplicated clear.','Custom applications shaped around the people using them. We map the inputs, decisions, states and handoffs, then design and build the experience.','Software',LAGOON),('Websites with\na point of view.','Distinctive web experiences with clear content and purposeful movement. Browser interactions, 3D pieces and brand films give the work a story.','Web + motion',MAGENTA),('Put intelligence\nto work.','Chat agents, RAG knowledge systems, customer service agents and connected operations. Map an opportunity, build a focused pilot, and measure before expanding.','AI consulting',SOLAR),('Real work.\nClear purpose.','TrailGoat brings course, pace and fueling into a planning tool for trail and ultra runners. Purple Squirrel supports the handoff from recruiter submission to client review.','Selected projects',BLUE),('Let’s make\nan impression.','Tell us what you want to make or improve. We will find the right way to build it.\n\nKris Brown\nkris@caprastudios.co\ncaprastudios.co','Start a conversation',LIME)]
bookpages=[]
for i,(title,body,kicker,accent) in enumerate(BOOK):
 theme='night' if i in [0,5] else 'day';a=Art(ROOT/'print'/f'capabilities-page-{i+1}',1080,1398,theme,(612,792));a.brand(80,100,38);a.text(80,206,kicker.upper(),25,'Bold',accent if theme=='night' else UV);a.headline(75,360,title,940,370,125,True,accent)
 a.paragraph(82,670,body,870 if i!=5 else 600,32,leading=1.42)
 if i==0:a.image('ink',80,895,920,305,True)
 if i==1:
  for j,(t,b) in enumerate([('Understand the work','Actors, inputs and the next decision.'),('Design the experience','Useful screens, states and handoffs.'),('Build the application','A focused product around real needs.')]):
   yy=910+j*105;a.line(80,yy-40,1000,yy-40,INK,2);a.text(80,yy,t,32,'Display');a.text(80,yy+40,b,26)
 if i==2:
  a.image('metal',80,885,445,300,True);a.image('print',555,885,445,300,True);a.text(80,1230,'3D pieces. Brand films. Interactive web.',27,'Bold')
 if i==3:
  for j,(t,b) in enumerate([('Discover','Map the opportunity.'),('Prove','Build a focused pilot.'),('Operate','Measure and improve.')]):
   x=80+j*315;a.rect(x,930,290,240,accent);a.text(x+20,990,f'0{j+1}',46,'Display',INK);a.text(x+20,1050,t,35,'Display',INK);a.paragraph(x+20,1110,b,250,24,fill=INK)
 if i==4:
  a.image('trail',80,895,445,280,True);a.image('squirrel',555,895,445,280,True);a.text(80,1220,'TrailGoat',30,'Bold');a.text(555,1220,'Purple Squirrel',30,'Bold')
 if i==5:a.qr(765,930,230);a.text(790,1200,'Meet the studio',23,'Bold')
 a.footer(1320,f'{i+1:02d} / 06',80);a.finish('Print','Capabilities / '+kicker,['Capabilities PDF'],False,{'format':'us-letter'});bookpages.append(a.pdf)
writer=PdfWriter()
for p in bookpages:writer.append(p)
writer.write(ROOT/'print/Capra-Studios-capabilities.pdf')
def render(job):
 pdf,png,w,h=job;subprocess.run(['pdftoppm','-scale-to-x',str(w),'-scale-to-y',str(h),'-singlefile','-png',str(pdf),str(png.with_suffix(''))],check=True,stdout=subprocess.DEVNULL,stderr=subprocess.PIPE)
with concurrent.futures.ThreadPoolExecutor(max_workers=4) as pool:list(pool.map(render,renderjobs))
print('Refined',len(manifest),'exports')
