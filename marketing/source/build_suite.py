from pathlib import Path
from reportlab.pdfgen import canvas
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.lib.colors import HexColor
from reportlab.lib.utils import ImageReader
from reportlab.graphics.barcode.qr import QrCodeWidget
from pypdf import PdfReader, PdfWriter
from pypdf.generic import RectangleObject
from PIL import Image, ImageOps, ImageDraw
import json, re, io, base64, html, shutil, subprocess, concurrent.futures, math, csv
ROOT=Path(__file__).resolve().parents[1]
REPO=ROOT.parent
WORK=ROOT.parent/'.build-2026-10-02'
WORK.mkdir(exist_ok=True)
for d in ['social','carousels','profiles','print','email','motion','copy','brand/media','proofs']:(ROOT/d).mkdir(exist_ok=True,parents=True)
FONTFILES={'Display':'RedHatDisplay-900.ttf','Text':'RedHatText-400.ttf','Bold':'RedHatText-700.ttf','Hand':'SedgwickAveDisplay-400.ttf'}
for n,f in FONTFILES.items():pdfmetrics.registerFont(TTFont(n,str(ROOT/'brand/fonts'/f)))
PAPER='#f3f1ea'; INK='#15141c'; DARK='#0e0b16'; LIGHT='#ece9ff'; LIME='#b6ff3b'; UV='#7a2df5'; SOLAR='#ffd23f'; LAGOON='#1ad7ce'; KOI='#ff5c1a'; MAGENTA='#ef388d'; BLUE='#7aa2f7'
media={'ink':'motion/gpu-ink.jpg','metal':'motion/gpu-metal.jpg','grow':'motion/gpu-grow.jpg','print':'motion/gpu-print.jpg','trail':'work/trailgoat-current.jpg','squirrel':'work/purple-squirrel.jpg','film':'motion/trailgoat-brand-poster.jpg','koi':'motion/koi-pond-poster.jpg'}
for k,f in media.items():
 if (REPO/'assets'/f).is_file():shutil.copy2(REPO/'assets'/f,ROOT/'brand/media'/f'{k}.jpg')
LOGO=re.findall(r'<path d="([^"]+)"', (ROOT/'brand/mark.svg').read_text())
manifest=[]; renderjobs=[]; warnings=[]

def color(v):return HexColor(v)
def txtwidth(s,size,font='Display',tracking=0):return pdfmetrics.stringWidth(s,font,size)+max(0,len(s)-1)*tracking

def wrap(s,size,width,font='Text',tracking=0):
 out=[]
 for para in s.split('\n'):
  line=''
  for word in para.split():
   test=(line+' '+word).strip()
   if line and txtwidth(test,size,font,tracking)>width:out.append(line);line=word
   else:line=test
  out.append(line)
 return out

class Art:
 def __init__(self,path,w,h,theme='day',physical=None,bleed=None):
  self.path=Path(path);self.path.parent.mkdir(parents=True,exist_ok=True);self.w=w;self.h=h;self.theme=theme
  self.bg=PAPER if theme=='day' else DARK;self.fg=INK if theme=='day' else LIGHT
  self.physical=physical or (w,h);self.bleed=bleed
  self.pdf=WORK/(str(self.path.relative_to(ROOT)).replace('/','__')+'.pdf')
  self.c=canvas.Canvas(str(self.pdf),pagesize=self.physical,pageCompression=1)
  self.c.setTitle('Capra Studios | '+self.path.name);self.c.setAuthor('Capra Studios')
  self.c.scale(self.physical[0]/w,self.physical[1]/h)
  css=''.join('@font-face{font-family:'+n+';src:url(data:font/ttf;base64,'+base64.b64encode((ROOT/'brand/fonts'/f).read_bytes()).decode()+')}' for n,f in FONTFILES.items())
  self.svg=[f'<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="{w}" height="{h}" viewBox="0 0 {w} {h}"><title>{html.escape(self.path.name)}</title><defs><style>{css}</style></defs>']
  self.rect(0,0,w,h,self.bg)
 def rect(self,x,y,w,h,fill,stroke=None,sw=2):
  c=self.c;c.setFillColor(color(fill or PAPER));c.setLineWidth(sw)
  if stroke:c.setStrokeColor(color(stroke))
  c.rect(x,self.h-y-h,w,h,fill=bool(fill),stroke=bool(stroke))
  self.svg.append(f'<rect x="{x}" y="{y}" width="{w}" height="{h}" fill="{fill or "none"}" stroke="{stroke or "none"}" stroke-width="{sw}"/>')
 def line(self,x,y,x2,y2,fill,sw=2):
  self.c.setStrokeColor(color(fill));self.c.setLineWidth(sw);self.c.line(x,self.h-y,x2,self.h-y2)
  self.svg.append(f'<path d="M{x} {y}L{x2} {y2}" fill="none" stroke="{fill}" stroke-width="{sw}"/>')
 def text(self,x,y,s,size=30,font='Text',fill=None,tracking=0):
  fill=fill or self.fg
  self.c.setFillColor(color(fill));o=self.c.beginText(x,self.h-y);o.setFont(font,size);o.setCharSpace(tracking);o.textOut(s);self.c.drawText(o)
  self.svg.append(f'<text x="{x}" y="{y}" fill="{fill}" font-family="{font}" font-size="{size}" letter-spacing="{tracking}">{html.escape(s)}</text>')
  return txtwidth(s,size,font,tracking)
 def paragraph(self,x,y,s,width,size=30,font='Text',fill=None,leading=1.36):
  lines=wrap(s,size,width,font)
  for i,line in enumerate(lines):self.text(x,y+i*size*leading,line,size,font,fill)
  return y+len(lines)*size*leading
 def headline(self,x,y,s,width,maxh,size=110,highlight=False,accent=LIME):
  while size>30:
   lines=wrap(s,size,width,'Display',-size*.04)
   if len(lines)*size*1.02<=maxh and all(txtwidth(t,size,'Display',-size*.04)<=width+1 for t in lines):break
   size-=2
  if len(lines)*size*1.02>maxh:warnings.append('headline overflow '+str(self.path))
  for i,line in enumerate(lines):
   yy=y+i*size*1.02
   if highlight and i==len(lines)-1 and self.theme=='day':self.rect(x-3,yy-size*.28,min(width,txtwidth(line,size,'Display',-size*.04)+9),size*.34,accent)
   self.text(x,yy,line,size,'Display',accent if highlight and self.theme=='night' and i==len(lines)-1 else self.fg,-size*.04)
  return y+(len(lines)-1)*size*1.02+size*.3
 def logo(self,x,y,w=50,fill=BLUE):
  scale=w/400
  for d in LOGO:
   tok=re.findall(r'[MLCZ]|-?\d+(?:\.\d+)?',d);j=0;p=self.c.beginPath()
   while j<len(tok):
    op=tok[j];j+=1
    if op=='Z':p.close();continue
    n={'M':2,'L':2,'C':6}[op];v=list(map(float,tok[j:j+n]));j+=n
    pts=[(x+v[k]*scale,self.h-y-v[k+1]*scale) for k in range(0,n,2)]
    if op=='M':p.moveTo(*pts[0])
    elif op=='L':p.lineTo(*pts[0])
    else:p.curveTo(*sum(([a,b] for a,b in pts),[]))
   self.c.setFillColor(color(fill));self.c.drawPath(p,fill=1,stroke=0)
  self.svg.append(f'<g fill="{fill}" transform="translate({x},{y}) scale({scale})">'+''.join(f'<path d="{d}"/>' for d in LOGO)+'</g>')
 def brand(self,x,y,size=34):
  self.logo(x,y-size*.92,size*.72,BLUE if self.theme=='day' else LIME)
  self.text(x+size*.98,y,'capra studios',size,'Display',self.fg,-size*.035)
 def image(self,key,x,y,w,h,tape=False):
  im=Image.open(ROOT/'brand/media'/f'{key}.jpg').convert('RGB');ratio=max(1,min(im.width/w,im.height/h)) if self.physical!=(self.w,self.h) else 1;im=ImageOps.fit(im,(max(1,int(w*ratio)),max(1,int(h*ratio))),method=Image.Resampling.LANCZOS)
  b=io.BytesIO();im.save(b,'JPEG',quality=92);data=b.getvalue()
  self.c.drawImage(ImageReader(io.BytesIO(data)),x,self.h-y-h,w,h)
  self.svg.append(f'<image x="{x}" y="{y}" width="{w}" height="{h}" xlink:href="data:image/jpeg;base64,{base64.b64encode(data).decode()}"/>')
  self.rect(x,y,w,h,None,self.fg,2)
  if tape:self.rect(x+w*.4,y-13,w*.2,28,SOLAR)
 def sticker(self,x,y,w,h,label,accent=SOLAR):
  self.c.setFillColor(color(accent));self.c.setStrokeColor(color(INK));self.c.setLineWidth(2);self.c.ellipse(x,self.h-y-h,x+w,self.h-y,fill=1,stroke=1)
  self.svg.append(f'<ellipse cx="{x+w/2}" cy="{y+h/2}" rx="{w/2}" ry="{h/2}" fill="{accent}" stroke="{INK}" stroke-width="2"/>')
  size=min(h*.38,w/max(5,len(label))*1.5)
  self.text(x+(w-txtwidth(label,size,'Hand'))/2,y+h*.64,label,size,'Hand',INK)
 def qr(self,x,y,size,url='https://caprastudios.co/'):
  q=QrCodeWidget(url);q.qr.make();n=q.qr.getModuleCount();unit=size/(n+8)
  self.rect(x,y,size,size,'#ffffff')
  for row in range(n):
   for col in range(n):
    if q.qr.isDark(row,col):self.rect(x+(col+4)*unit,y+(row+4)*unit,unit+.04,unit+.04,INK)
 def footer(self,y,cta='Start a conversation',margin=64):
  self.line(margin,y-36,self.w-margin,y-36,self.fg,2)
  self.text(margin,y,'caprastudios.co',25,'Bold')
  sw=txtwidth(cta,23,'Text');self.text(self.w-margin-sw,y,cta,23)
 def finish(self,category,title,formats=None,keep_pdf=False,meta=None):
  self.c.showPage();self.c.save();self.svg.append('</svg>')
  self.path.with_suffix('.svg').write_text(''.join(self.svg))
  png=self.path.with_suffix('.png');renderjobs.append((self.pdf,png,round(self.w),round(self.h)))
  pdfout=None
  if keep_pdf:
   pdfout=self.path.with_suffix('.pdf');reader=PdfReader(self.pdf);writer=PdfWriter();writer.add_page(reader.pages[0])
   if self.bleed:
    b=self.bleed;pw,ph=self.physical
    writer.pages[0].trimbox=RectangleObject([b,b,pw-b,ph-b]);writer.pages[0].bleedbox=RectangleObject([0,0,pw,ph])
   writer.add_metadata({'/Title':title,'/Author':'Capra Studios'});writer.write(pdfout)
  entry={'id':self.path.stem,'title':title,'category':category,'theme':self.theme,'width':round(self.w),'height':round(self.h),'png':str(png.relative_to(ROOT)),'svg':str(self.path.with_suffix('.svg').relative_to(ROOT)),'platforms':formats or [],**(meta or {})}
  if pdfout:entry['pdf']=str(pdfout.relative_to(ROOT))
  manifest.append(entry);return entry

# One concept per entry. The formats below are intentionally recomposed, not center-cropped.
CAMPAIGNS=[
('01-imagination','Studio','Imagination.\nMade tangible.','Software, websites that move, and AI that earns its keep. A small team of specialists in Atlanta.','ink',LIME,'start here','Imagination is a good place to start. Making it useful is where we come in. Capra Studios brings software, web, motion and practical AI together around the thing you want to build.'),
('02-two-lights','Studio','One studio.\nTwo lights.','Daylight or blacklight. Same point of view. Explore both sides of Capra Studios.','metal',LIME,'lights off?','Our site has two sides. Paper, ink and a little attitude in daylight. Luminous color after dark. Turn the lights off at caprastudios.co and explore the work.'),
('03-small-mighty','Studio','Small team.\nBig imagination.','Talk directly to the designers, engineers and specialists doing the work.',None,SOLAR,'small but mighty','A smaller team can mean a more direct conversation. At Capra, the people shaping your project are the people you talk to. Tell us what you are imagining.'),
('04-atlanta','Studio','Made with\nAtlanta energy.','A small team of specialists in Atlanta. Software. Web. AI.',None,KOI,'hello, Atlanta','Atlanta is home. Curiosity is the starting point. We design and build software, websites with motion, and AI systems around real business needs.'),
('05-software','Software','Make the\ncomplicated clear.','Custom applications designed around the people who use them.',None,LAGOON,'built for people','When a process lives across spreadsheets, messages and workarounds, another tool is not always the answer. Start by making the work clear. Then build the application around it.'),
('06-handoff','Software','Better software.\nBetter handoffs.','Give every step a clear owner, useful context and a next action.',None,LAGOON,'less friction','A handoff should move the work forward. We design applications around who needs what, what happens next, and where information gets lost along the way.'),
('07-idea-product','Software','From what if\nto what works.','Bring the idea. We will help shape the product and build it.',None,BLUE,'make it real','You do not need a perfect specification to begin a useful conversation. Bring the idea, the problem and the people it needs to help. We can work from there.'),
('08-trailgoat','Project','Built for\nthe long run.','TrailGoat: course planning, pace and fueling for trail and ultra runners.','trail',LAGOON,'real work','TrailGoat brings course, pace and fueling into one planning tool for trail and ultra runners. We designed it, built it, and made the brand film. See the project story.'),
('09-purple-squirrel','Project','A better\nnext step.','Purple Squirrel: the handoff from recruiter submission to client review.','squirrel',UV,'real work','Purple Squirrel focuses on a specific moment in staffing: a recruiter submits a candidate and a client needs to review them. Clear context and a clear next step shape the application.'),
('10-web','Web','A website with\na point of view.','Distinctive design. Clear content. Motion with a reason to be there.','print',LIME,'make an impression','Your website should feel like your business and help people understand what to do next. We bring design, development and motion together around that job.'),
('11-motion','Web','Move people.\nThen pixels.','Motion and video graphics that give the work a story.','ink',MAGENTA,'built to move','Motion earns its place when it explains, guides or makes something memorable. From browser interactions to 3D brand films, we design the movement around the message.'),
('12-brand-film','Project','A pile of blocks.\nA brand with life.','TrailGoat: a goat takes shape, flips and resolves into a wordmark.','film',SOLAR,'press play','A pile of blocks becomes a goat. The goat flips. The wordmark lands. Our TrailGoat brand film turns a simple transformation into a short story. Watch the 4K film with sound on the site.'),
('13-webgl','Web','Your browser.\nOur playground.','Interactive web experiences with color, motion and a point of view.','grow',LAGOON,'try it yourself','A browser can be a place to explore. Our web and motion experiments respond to interaction, play with color and turn technical possibilities into a visual experience.'),
('14-3d','Web','Give your\nidea dimension.','3D pieces and brand films for websites, launches and the moments that matter.','metal',BLUE,'another dimension','Some ideas deserve more than a flat frame. We create 3D pieces and brand films that give an identity form, atmosphere and movement.'),
('15-ai','AI','Put intelligence\nto work.','Chat agents, knowledge systems and connected operations built around your business.',None,SOLAR,'practical AI','The useful AI question is not what is possible in a demo. It is what should happen in your business. We start with the workflow, the knowledge and the people, then build a focused system.'),
('16-knowledge','AI','Your knowledge.\nWithin reach.','Connect an assistant to the documents and context it needs to answer well.',None,LIME,'find the answer','The answer may already be in your business. A RAG knowledge system retrieves relevant information from your documents and gives an assistant context, with source references and access controls designed into the workflow.'),
('17-support','AI','Better answers.\nClearer handoffs.','Customer service agents that gather context and know when to bring in a person.',None,KOI,'support, connected','A support agent should do more than reply. It can collect the details a team needs, answer repeat questions and route the request, with clear handoffs when a person needs to step in.'),
('18-pilot','AI','Start small.\nProve it useful.','Map one opportunity. Build a focused pilot. Measure before expanding.',None,SOLAR,'one useful pilot','Choose one workflow. Agree what success looks like. Test real questions, edge cases and handoffs. Then decide what deserves to grow. That is how we approach practical AI adoption.'),
('19-operations','AI','Connect the work.\nKeep control.','Agents and automations with defined roles, permissions and human review.',None,MAGENTA,'business first','Sales, service, administration and delivery do not happen in isolation. We help map the work between them and design connected operations with responsibilities, permissions and review built in.'),
('20-business-first','AI','Better business\nbegins with the work.','Practical AI consulting, from a first use case to an operating roadmap.',None,BLUE,'map it first','Before picking an AI tool, map how the business runs. Where does information live? Who owns the decision? Where is time lost? Those answers create a better implementation plan.'),
('21-three-disciplines','Studio','Software.\nWeb. AI.','Three ways to make an idea tangible. One team to bring it together.',None,LIME,'all connected','A new product may need an application, a website that tells its story and an agent that helps people use it. Capra brings those conversations together.'),
('22-project-invitation','Studio','What are you\nimagining?','Tell us what you want to make or improve. We will find the right way to build it.',None,UV,'your move','A better customer experience? A process that finally makes sense? A website with a stronger point of view? Tell us what you are imagining. Let us find the right way to build it.'),
('23-impression','Studio','Let’s make\nan impression.','Design, development and motion for your next chapter.','ink',LIME,'say hi','The next version of your business deserves a clear idea and a considered execution. Bring us the challenge. We will help turn it into something people can use, understand and remember.'),
('24-direct','Studio','Meet the people\nmaking the work.','A small team of specialists, led by Kris Brown in Atlanta.',None,SOLAR,'direct connection','Capra is led by Kris Brown. Designers, engineers, motion artists and AI builders come together around the project, with direct conversations and a shared understanding of the work.')]
FORMATS={'square':(1080,1080,['Instagram','Facebook','Threads','Bluesky','Mastodon','LinkedIn','Google Business Profile','WhatsApp']), 'portrait':(1080,1350,['Instagram','Facebook','LinkedIn','Threads']), 'vertical':(1080,1920,['Instagram Stories','Instagram Reels cover','Facebook Stories','TikTok cover','YouTube Shorts cover','Snapchat','WhatsApp Status']), 'landscape':(1200,627,['LinkedIn','Facebook','X','Bluesky','Mastodon','Reddit']), 'pin':(1000,1500,['Pinterest'])}

def diagram(a,x,y,w,h,accent):
 labels=['Knowledge','Questions','Tools'];bw=w*.28;bh=h*.23
 for i,l in enumerate(labels):
  yy=y+i*h*.34;a.rect(x,yy,bw,bh,PAPER if a.theme=='day' else '#17122a',a.fg,2);a.text(x+14,yy+bh*.66,l,min(25,bw/6),'Bold')
  a.line(x+bw,yy+bh/2,x+w*.47,y+h*.48,accent,4)
 a.rect(x+w*.45,y+h*.22,w*.23,h*.52,accent)
 mw=min(w*.11,h*.29)
 a.logo(x+w*.565-mw/2,y+h*.48-mw*1.35/2,mw,PAPER if accent==INK else INK)
 a.line(x+w*.68,y+h*.48,x+w*.79,y+h*.48,accent,4)
 a.rect(x+w*.77,y+h*.3,w*.23,h*.36,PAPER if a.theme=='day' else '#17122a',a.fg,2)
 a.text(x+w*.79,y+h*.51,'Next step',min(24,w*.027),'Bold')

def poster(c,fmt,theme,path=None,category='Social'):
 slug,pillar,title,body,im,accent,tag,caption=c;w,h,platforms=FORMATS[fmt]
 a=Art(path or ROOT/'social'/slug/theme/fmt,w,h,theme)
 m=64 if w>=1080 else 60
 iswide=fmt=='landscape';isstory=fmt=='vertical'
 top=225 if isstory else 72
 a.brand(m,top,34)
 a.text(w-m-{'Studio':98,'Software':145,'Project':112,'Web':64,'AI':36}[pillar],top,pillar.upper(),24,'Bold',accent if theme=='night' else INK)
 if iswide:
  a.headline(m,190,title,660,255,86,True,accent)
  a.paragraph(m,438,body,620,25,leading=1.3)
  if im:a.image(im,820,155,316,332,True)
  elif pillar=='AI':diagram(a,820,215,310,230,accent)
  else:
   a.rect(825,150,310,355,accent if theme=='day' else '#17122a',accent if theme=='night' else None,3)
   a.logo(895,176,170,INK if theme=='day' else accent)
  a.footer(579,margin=m)
 else:
  y=390 if isstory else 226
  maxh=430 if isstory else (300 if fmt=='square' else 350)
  size=114 if not fmt=='square' else 104
  end=a.headline(m,y,title,w-2*m-(60 if isstory else 0),maxh,size,True,accent)
  by=max(end+58, 760 if isstory else (510 if fmt=='square' else 540))
  a.paragraph(m,by,body,w-2*m-(70 if isstory else 0),32 if not isstory else 36,leading=1.35)
  ay=990 if isstory else (660 if fmt=='square' else (750 if fmt=='portrait' else 790))
  ah=440 if isstory else (270 if fmt=='square' else (425 if fmt=='portrait' else 525))
  aw=w-2*m
  if im:
   a.image(im,m,ay,aw,ah,True)
   if fmt!='square':a.sticker(w-m-218,ay-45,220,86,tag,accent if accent!=UV else SOLAR)
  elif pillar=='AI':
   a.rect(m,ay,aw,ah,accent if theme=='day' else '#17122a',accent if theme=='night' else None,3)
   diagram(a,m+32,ay+32,aw-64,ah-64,INK if theme=='day' else accent)
  else:
   a.rect(m,ay,aw,ah,accent if theme=='day' else '#17122a',accent if theme=='night' else None,3)
   a.logo(m+36,ay+ah*.09,ah*.54,INK if theme=='day' else accent)
   label='make it real' if pillar=='Software' else tag
   a.text(m+ah*.75,ay+ah*.55,label,min(66,(aw-ah*.85)/max(1,len(label)) *1.6),'Hand',INK if theme=='day' else accent)
   a.line(m+ah*.75,ay+ah*.65,w-m-35,ay+ah*.65,INK if theme=='day' else accent,3)
  a.footer(1560 if isstory else h-65,margin=m)
 return a.finish(category,title.replace('\n',' '),platforms,meta={'campaign':slug,'pillar':pillar,'format':fmt,'caption':caption})

for c in CAMPAIGNS:
 for theme in ['day','night']:
  for fmt in FORMATS:poster(c,fmt,theme)

CAROUSELS=[
('01-meet-capra',LIME,[('Imagination.\nMade tangible.','Meet Capra Studios. A small team of specialists in Atlanta.'),('Software that\nclarifies the work.','Custom applications designed around the people using them and the decisions they need to make.'),('Websites with\na point of view.','Design, development, motion and video graphics shaped into one experience.'),('AI that\nearns its keep.','Chat agents, knowledge systems and connected operations built around the business.'),('Small team.\nDirect conversations.','Talk to the people doing the work. Designers, engineers and specialists come together around your project.'),('What are you\nimagining?','Tell us what you want to make or improve. info@caprastudios.co')]),
('02-useful-ai',SOLAR,[('Before you\nbuild an agent.','Five questions worth answering before the first demo.'),('What job\nshould it do?','Name a concrete task: answer a product question, gather support details or find an internal policy.'),('What does\nit need to know?','Identify the relevant documents, systems and owners. Check whether the information is current.'),('What can\nit actually do?','Define permitted actions, approval points and what happens when a request needs a person.'),('How will you\nknow it helps?','Agree a baseline. Test useful answers, handoffs, error rates, time and operating cost.'),('Start with\none useful pilot.','Capra can help map the opportunity, build the pilot and plan the next step. caprastudios.co/ai-consulting.html')]),
('03-web-with-purpose',MAGENTA,[('Motion with\na reason.','A website should move the story forward.'),('Guide\nthe eye.','Use movement to make the next action easier to understand.'),('Explain\nthe change.','Show how a system responds, how a product works or how one state becomes another.'),('Give the\nbrand a moment.','A short 3D piece or brand film can turn a visual identity into a memorable story.'),('Keep it\nusable.','Clear content, sensible controls and a useful experience when motion is switched off.'),('Make an\nimpression.','Explore Capra’s web and motion work. caprastudios.co/motion.html')]),
('04-better-software',LAGOON,[('The process\nbefore the product.','A useful application starts with a clear understanding of the work.'),('Who is\nusing it?','Start with the people, their context and the decision they need to make.'),('What enters\nthe system?','Map the inputs: requests, records, files and the information that makes them useful.'),('What needs\nto happen next?','Make state changes, responsibilities and handoffs explicit.'),('What happens\nwhen it goes wrong?','Design the missing-information, error and recovery states alongside the happy path.'),('Make the\ncomplicated clear.','Tell Capra about the process you want to improve. caprastudios.co/work.html')]),
('05-trailgoat-story',BLUE,[('Built for\nthe long run.','TrailGoat. A Capra Studios project.'),('Start with\nthe course.','A planning tool for trail and ultra runners, shaped around the route ahead.'),('Bring the\nplan together.','Course, pace and what to eat along the way, considered as parts of the same experience.'),('Give it\na voice.','Design and development meet a visual identity with a point of view.'),('Then make\nit move.','A pile of blocks becomes a goat. A short brand film gives the identity a story.'),('See the\nwhole project.','Explore the product and the film at caprastudios.co/trailgoat.html')]),
('06-connected-business',KOI,[('AI across\nthe business.','Start by understanding how the work connects.'),('Find the\nrepeated work.','Look across sales, service, administration and delivery for clear, repeatable tasks.'),('Connect\nthe context.','Map where knowledge lives and which people and tools need access to it.'),('Design\nthe controls.','Set responsibilities, permissions, approvals and handoffs before expanding automation.'),('Prove.\nMeasure. Improve.','Build one focused workflow. Test real situations. Monitor the result and train the people using it.'),('Build your\noperating roadmap.','Practical AI consulting from Capra Studios. caprastudios.co/ai-consulting.html')])]
for slug,accent,slides in CAROUSELS:
 for theme in ['day','night']:
  pdfs=[]
  for i,(title,body) in enumerate(slides):
   a=Art(ROOT/'carousels'/slug/theme/f'{i+1:02d}',1080,1350,theme);a.brand(70,80,34)
   a.text(930,80,f'{i+1:02d}/06',25,'Bold',accent if theme=='night' else INK)
   a.headline(70,285,title,940,430,126,True,accent)
   a.paragraph(74,650,body,865,39,leading=1.4)
   a.rect(70,930,940,210,accent if theme=='day' else '#17122a',accent if theme=='night' else None,3)
   a.text(105,1070,f'{i+1:02d}',145,'Display',INK if theme=='day' else accent,-5)
   note='swipe to explore' if i<5 else 'let’s talk'
   a.text(415,1055,note,60,'Hand',INK if theme=='day' else accent)
   a.footer(1275,'Save this guide' if i<5 else 'Start a conversation',70)
   e=a.finish('Carousel',title.replace('\n',' '),['Instagram','LinkedIn','Facebook'],meta={'campaign':slug,'slide':i+1,'format':'portrait'})
   pdfs.append(a.pdf)
  writer=PdfWriter()
  for p in pdfs:writer.append(p)
  writer.add_metadata({'/Title':slug.replace('-',' ').title()+' | Capra Studios'})
  out=ROOT/'carousels'/slug/f'{slug}-{theme}.pdf';writer.write(out)

# Profile systems: place critical content away from avatar overlays and banner crop edges.
SIZES={'linkedin-personal':(1584,396,['LinkedIn personal header']),'linkedin-company':(1128,191,['LinkedIn company cover']),'x-header':(1500,500,['X header']),'bluesky-header':(1500,500,['Bluesky header']),'facebook-cover':(1640,924,['Facebook page cover']),'youtube-banner':(2560,1440,['YouTube banner']),'twitch-banner':(1200,480,['Twitch profile banner']),'behance-banner':(3200,410,['Behance profile banner']),'email-header':(1200,400,['Email newsletter']),'meeting-background':(1920,1080,['Zoom','Google Meet','Microsoft Teams'])}
for theme in ['day','night']:
 for name,(w,h,platforms) in SIZES.items():
  a=Art(ROOT/'profiles'/f'{name}-{theme}',w,h,theme);accent=LIME if theme=='night' else UV
  if name=='youtube-banner':
   # More conservative than the standard centered 1546x423 safe area.
   a.logo(1720,590,165,accent);a.brand(590,605,48);a.headline(590,733,'Imagination. Made tangible.',1260,180,89,True,LIME);a.text(590,834,'Software. Web. AI.  /  caprastudios.co',37,'Bold')
  elif name=='meeting-background':
   a.brand(100,100,44);a.text(100,170,'Software. Web. AI.',30,'Text');a.logo(w-370,h-480,260,accent);a.line(100,h-110,w-100,h-110,accent,4)
  elif name=='facebook-cover':
   a.brand(350,295,43);a.headline(350,430,'Imagination.\nMade tangible.',960,280,115,True);a.text(350,660,'Software. Web. AI.  /  caprastudios.co',34,'Bold');a.logo(1210,290,180,accent)
  else:
   left=int(w*.27) if name in ['linkedin-personal','x-header','bluesky-header'] else int(w*.08)
   fs=min(58,h*.12);a.brand(left,h*.27,fs*.72)
   a.headline(left,h*.59,'Imagination. Made tangible.',w-left-80,h*.2,min(h*.2,104),True)
   a.text(left,h*.83,'Software. Web. AI.  /  caprastudios.co',min(h*.083,34),'Bold')
   a.rect(0,0,max(12,w*.012),h,LIME if theme=='night' else SOLAR)
  a.finish('Profile & cover',name.replace('-',' ').title()+' / '+theme,platforms,meta={'format':name})
 for accent,name in [(LIME,'lime'),(BLUE,'ribbon'),(SOLAR,'solar')]:
  a=Art(ROOT/'profiles'/f'avatar-{name}-{theme}',800,800,theme);a.logo(235,170,330,accent if theme=='night' else INK);a.finish('Profile & cover','Unicorn avatar / '+name,['All profile images'],meta={'format':'avatar'})
 for title,key in [('Software','trail'),('Motion','metal'),('AI','grow'),('Studio','ink')]:
  a=Art(ROOT/'profiles'/f'youtube-thumb-{title.lower()}-{theme}',1280,720,theme);a.brand(65,85,34);a.headline(65,260,title+'.\nMade tangible.',730,320,100,True);a.image(key,860,150,350,450);a.footer(665,'Explore the work');a.finish('Profile & cover',title+' video thumbnail',['YouTube thumbnail','Video poster'],meta={'format':'video-thumbnail'})
 for label in ['Work','Software','Web','Motion','AI','Studio']:
  a=Art(ROOT/'profiles'/f'highlight-{label.lower()}-{theme}',800,800,theme);a.logo(290,170,220,LIME if theme=='night' else UV);a.text((800-txtwidth(label,74))/2,600,label,74,'Display');a.finish('Profile & cover',label+' highlight cover',['Instagram Highlights'],meta={'format':'highlight'})

# Print production files. Vector type and marks; explicit bleed and trim boxes.
FLYERS=[CAMPAIGNS[i] for i in [0,4,9,14,21,22]]
for c in FLYERS:
 slug,pillar,title,body,im,accent,tag,caption=c
 for size,physical in [('us-letter',(630,810)),('a4',(612.2835,858.8898))]:
  w=1080;h=round(w*physical[1]/physical[0]);a=Art(ROOT/'print'/f'flyer-{slug}-{size}',w,h,'day',physical,9)
  a.brand(78,112,40);a.text(78,196,pillar.upper()+' / ATLANTA',27,'Bold',UV)
  a.headline(75,335,title,930,340,124,True,accent)
  a.paragraph(80,650,body,900,36,leading=1.4)
  if im:a.image(im,80,830,645,275,True)
  else:
   a.rect(80,830,645,275,accent);a.logo(110,850,160,INK);a.text(330,985,tag,56,'Hand',INK)
  a.qr(785,855,205)
  a.text(800,1095,'Explore Capra',23,'Bold')
  a.line(80,h-195,w-80,h-195,INK,2)
  a.text(80,h-140,'Let’s make an impression.',39,'Display',INK,-1.2)
  a.text(80,h-92,'info@caprastudios.co  /  caprastudios.co',27,'Text')
  a.finish('Print',pillar+' promotional flyer / '+size,['Print','Digital handout'],True,{'format':size,'trim':'8.5 x 11 in' if size=='us-letter' else '210 x 297 mm','bleed':'0.125 in / 3.175 mm','color':'RGB; request printer color conversion/proof'})

for theme in ['day','night']:
 for variant in ['personal','studio']:
  pages=[]
  for side in ['front','back']:
   a=Art(ROOT/'print'/f'card-{variant}-{theme}-{side}',1125,675,theme,(270,162),9)
   if side=='front':
    a.logo(510,125,145,LIME if theme=='night' else UV);a.text(140,425,'capra studios',98,'Display',a.fg,-3.5);a.text(180,535,'Imagination. Made tangible.',47,'Display',LIME if theme=='night' else INK,-1)
   else:
    name='Kris Brown' if variant=='personal' else 'Capra Studios';email='kris@caprastudios.co' if variant=='personal' else 'info@caprastudios.co'
    a.text(80,145,name,61,'Display',a.fg,-2);a.text(82,207,'Software. Web. AI.',31,'Bold',LIME if theme=='night' else UV)
    a.text(82,345,email,36,'Text');a.text(82,402,'Atlanta, Georgia',36,'Text');a.text(82,505,'caprastudios.co',36,'Bold')
    a.qr(815,300,215);a.text(830,552,'Meet the studio',23,'Text')
   a.finish('Print',variant.title()+' business card / '+theme+' / '+side,['Business card'],True,{'format':'business-card','trim':'3.5 x 2 in','bleed':'0.125 in','color':'RGB; printer proof recommended'})
   pages.append(a.path.with_suffix('.pdf'))
  writer=PdfWriter()
  for p in pages:writer.append(p)
  writer.write(ROOT/'print'/f'business-card-{variant}-{theme}-duplex.pdf')

for theme in ['day','night']:
 a=Art(ROOT/'print'/f'letterhead-{theme}',1080,1398,theme,(612,792));a.brand(80,115,39);a.line(80,160,1000,160,LIME if theme=='night' else UV,3);a.text(80,1260,'Capra Studios  /  Atlanta, Georgia',23,'Bold');a.text(80,1310,'info@caprastudios.co  /  caprastudios.co',23);a.finish('Print','Letterhead / '+theme,['Letterhead'],True,{'format':'us-letter','trim':'8.5 x 11 in','bleed':'none; letterhead margins'})
 a=Art(ROOT/'print'/f'poster-two-lights-{theme}',1080,1440,theme,(1314,1746),9);a.brand(80,115,40);a.headline(75,350,'One studio.\nTwo lights.',930,450,155,True);a.logo(370,720,350,LIME if theme=='night' else UV);a.footer(1325,'Software. Web. AI.',80);a.finish('Print','One studio, two lights / poster / '+theme,['Poster'],True,{'format':'18x24-poster','trim':'18 x 24 in','bleed':'0.125 in'})

# Useful 6x4 leave-behind with generous writing space on reverse.
for side in ['front','back']:
 a=Art(ROOT/'print'/f'postcard-{side}',1500,1020,'day',(450,306),9);a.brand(95,120,42)
 if side=='front':
  a.headline(90,360,'What are you\nimagining?',1270,350,140,True);a.text(100,775,'Software. Web. AI.  /  Made in Atlanta.',42,'Bold');a.footer(930,'Let’s talk.',100)
 else:
  a.text(95,265,'A note from Capra.',70,'Display',INK,-2)
  for y in [400,510,620,730]:a.line(100,y,1050,y,'#c4c0b4',2)
  a.qr(1160,550,230);a.text(100,910,'kris@caprastudios.co  /  caprastudios.co',35,'Text')
 a.finish('Print','Leave-behind postcard / '+side,['Postcard','Thank-you card'],True,{'format':'6x4-postcard','trim':'6 x 4 in','bleed':'0.125 in'})

# Capabilities booklet: reader-friendly PDF, no fabricated clients or results.
BOOK=[('Imagination.\nMade tangible.','A small team of specialists in Atlanta. We build software, websites that move, and AI that earns its keep.','Studio overview',LIME),('Make the\ncomplicated clear.','Custom applications shaped around the people using them. We map the inputs, decisions, states and handoffs, then design and build the experience.','Software',LAGOON),('Websites with\na point of view.','Distinctive web experiences with clear content and purposeful movement. Browser interactions, 3D pieces and brand films give the work a story.','Web + motion',MAGENTA),('Put intelligence\nto work.','Chat agents, RAG knowledge systems, customer service agents and connected operations. Map an opportunity, build a focused pilot, and measure before expanding.','AI consulting',SOLAR),('Real work.\nClear purpose.','TrailGoat brings course, pace and fueling into a planning tool for trail and ultra runners. Purple Squirrel supports the handoff from recruiter submission to client review. Explore both project stories on our site.','Selected projects',BLUE),('Let’s make\nan impression.','Tell us what you want to make or improve. We will find the right way to build it.\n\nKris Brown\nkris@caprastudios.co\ncaprastudios.co','Start a conversation',LIME)]
bookpages=[]
for i,(title,body,kicker,accent) in enumerate(BOOK):
 theme='night' if i in [0,5] else 'day';a=Art(ROOT/'print'/f'capabilities-page-{i+1}',1080,1398,theme,(612,792));a.brand(80,100,38);a.text(80,206,kicker.upper(),25,'Bold',accent if theme=='night' else UV);a.headline(75,360,title,940,370,125,True,accent);a.paragraph(82,715,body,900,35,leading=1.48);a.footer(1320,f'{i+1:02d} / 06',80);a.finish('Print','Capabilities / '+kicker,['Capabilities PDF'],False,{'format':'us-letter'});bookpages.append(a.pdf)
writer=PdfWriter()
for p in bookpages:writer.append(p)
writer.write(ROOT/'print/Capra-Studios-capabilities.pdf')

# Export model and render static PNGs using embedded-font vector PDF masters.
(ROOT/'source/campaigns.json').write_text(json.dumps(CAMPAIGNS,ensure_ascii=False,indent=2))
(ROOT/'source/carousels.json').write_text(json.dumps(CAROUSELS,ensure_ascii=False,indent=2))
def render(job):
 pdf,png,w,h=job
 subprocess.run(['pdftoppm','-scale-to-x',str(w),'-scale-to-y',str(h),'-singlefile','-png',str(pdf),str(png.with_suffix(''))],check=True,stdout=subprocess.DEVNULL,stderr=subprocess.PIPE)
 return str(png)
with concurrent.futures.ThreadPoolExecutor(max_workers=4) as pool:
 for i,_ in enumerate(pool.map(render,renderjobs)):
  if i%50==0:print('RENDERED',i+1,'/',len(renderjobs),flush=True)
(ROOT/'manifest.json').write_text(json.dumps(manifest,ensure_ascii=False,indent=2))
(ROOT/'source/layout-warnings.json').write_text(json.dumps(warnings,indent=2))
print('DONE',len(manifest),'visual assets',len(warnings),'layout warnings',flush=True)
