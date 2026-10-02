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
