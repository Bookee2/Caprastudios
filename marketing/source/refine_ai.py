from design_engine import *
p=ROOT/'source/build_suite.py';s=p.read_text().replace('a.logo(x+w*.505,y+h*.28,w*.11,INK)','a.logo(x+w*.505,y+h*.28,w*.11,PAPER if accent==INK else INK)');p.write_text(s)
exec(s[s.index('FORMATS='):s.index('\nfor c in CAMPAIGNS:')])
CAMPAIGNS=json.loads((ROOT/'source/campaigns.json').read_text())
for c in CAMPAIGNS:
 if c[1]=='AI':
  for theme in ['day','night']:
   for fmt in FORMATS:poster(c,fmt,theme)
def render(job):
 pdf,png,w,h=job;subprocess.run(['pdftoppm','-scale-to-x',str(w),'-scale-to-y',str(h),'-singlefile','-png',str(pdf),str(png.with_suffix(''))],check=True,stdout=subprocess.DEVNULL,stderr=subprocess.PIPE)
with concurrent.futures.ThreadPoolExecutor(max_workers=4) as pool:list(pool.map(render,renderjobs))
print('AI logo contrast corrected',len(renderjobs))
