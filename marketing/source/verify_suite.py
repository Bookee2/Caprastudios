from pathlib import Path
from PIL import Image
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from pypdf import PdfReader
import json,xml.etree.ElementTree as ET,subprocess
R=Path(__file__).resolve().parents[1]
fonts={'Display':'RedHatDisplay-900.ttf','Text':'RedHatText-400.ttf','Bold':'RedHatText-700.ttf','Hand':'SedgwickAveDisplay-400.ttf'}
for n,f in fonts.items():pdfmetrics.registerFont(TTFont(n,str(R/'brand/fonts'/f)))
A=json.loads((R/'manifest.json').read_text());issues=[];overlaps=[]
for a in A:
 im=Image.open(R/a['png']);assert im.size==(a['width'],a['height']),(a['png'],im.size)
 root=ET.parse(R/a['svg']).getroot();boxes=[]
 for t in root.iter('{http://www.w3.org/2000/svg}text'):
  x=float(t.attrib['x']);y=float(t.attrib['y']);s=float(t.attrib['font-size']);f=t.attrib['font-family'];txt=t.text or '';track=float(t.attrib.get('letter-spacing',0));w=pdfmetrics.stringWidth(txt,f,s)+max(0,len(txt)-1)*track
  if x<-1 or y-s*.75<-1 or x+w>a['width']+2 or y+s*.2>a['height']+2:issues.append([a['svg'],txt,[x,y,w,s]])
  box=(x,y-s*.72,x+w,y+s*.12,txt)
  for prev in boxes:
   ix=min(box[2],prev[2])-max(box[0],prev[0]);iy=min(box[3],prev[3])-max(box[1],prev[1])
   if ix>5 and iy>5:overlaps.append([a['svg'],prev[4],txt,round(ix),round(iy)])
  boxes.append(box)
for p in (R/'print').glob('business-card-personal-*-duplex.pdf'):
 reader=PdfReader(p);assert len(reader.pages)==2
 text=' '.join(page.extract_text() for page in reader.pages)
 for term in ['Kris Brown','kris@caprastudios.co']:assert term in text,(p,term)
 assert '757-3000' not in text,(p,'phone number must stay off public files')
 for page in reader.pages:
  assert abs(float(page.trimbox.width)-252)<.1 and abs(float(page.trimbox.height)-144)<.1
pdfs=list((R/'print').glob('*.pdf'))+list((R/'carousels').glob('*/*.pdf'))
for p in pdfs:assert len(PdfReader(p).pages)>0
V=json.loads((R/'motion/videos.json').read_text())
for v in V:
 d=json.loads(subprocess.check_output(['ffprobe','-v','error','-show_streams','-of','json',str(R/v['video'])]));s=d['streams'][0];assert s['codec_name']=='h264' and s['pix_fmt']=='yuv420p'
report={'static_designs':len(A),'videos':len(V),'pdfs':len(pdfs),'out_of_bounds':issues,'text_overlaps':overlaps,'contact_details':'correct in both personal duplex PDFs','video_codec':'H.264 / yuv420p','status':'PASS' if not issues and not overlaps else 'REVIEW'}
(R/'proofs/verification.json').write_text(json.dumps(report,indent=2));print(json.dumps(report,indent=2))
