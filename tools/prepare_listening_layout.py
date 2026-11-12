"""Reconstruct clean, selectable Listening pages from OCR word coordinates.
Usage: python tools/prepare_listening_layout.py --library PATH_TO_OCR_LIBRARY
The library contains BOOK/ocr/NNN.json and BOOK/scans/NNN.jpg.
"""
from pathlib import Path
import argparse,json,re,statistics,sys
import numpy as np
from PIL import Image,ImageFont
try:import cv2
except ImportError:
 sys.path.insert(0,str(Path(__file__).resolve().parents[3]/'work/ocr-deps'))
 import cv2
ROOT=Path(__file__).resolve().parents[1]
BAD=re.compile(r'ielts[\s-]*thudang|prosource|www\.|facebook\.com|ta[il1]+[il1]+eu|pearson\s+test\s+of|english\s+for\s+international|top\s*score',re.I)
BRAND=re.compile(r'^(?:[0O\s]*BRITISH|COUNCIL|Cambridge\s+Assessment|English|IELTS|Academic|TIVE|IVE|THU\s*DANG|PEARSON|PTE|O?\s*BRITISH)$',re.I)
def clean_page(book,page,library,supplement=None):
 raw=json.loads((library/str(book)/'ocr'/f'{page:03}.json').read_text(encoding='utf-8-sig'))
 im=np.array(Image.open(library/str(book)/'scans'/f'{page:03}.jpg').convert('RGB'))
 H,W=im.shape[:2];sx=W/raw['width'];sy=H/raw['height'];runs=[];removed=[];lines=[];rules=[]
 gray=cv2.cvtColor(im,cv2.COLOR_RGB2GRAY)
 hsv=cv2.cvtColor(im,cv2.COLOR_RGB2HSV);gray[(hsv[:,:,1]>70)&(hsv[:,:,2]>110)]=255
 # Mask all recognised glyphs, including discarded branding, before recovering graphics.
 for line in raw['lines']:
  for word in line['words']:
   x,y,w,h=[word[k]*s for k,s in [('x',sx),('y',sy),('width',sx),('height',sy)]]
   cv2.rectangle(gray,(max(0,int(x)-2),max(0,int(y)-2)),(min(W-1,int(x+w)+2),min(H-1,int(y+h)+2)),255,-1)
 substantive=[max((v['y']+v['height'])*sy for v in l['words']) for l in raw['lines'] if l['words'] and not re.fullmatch(r'[\d\s]+',l['text'].strip()) and not BAD.search(l['text']) and not (book==14 and BRAND.fullmatch(l['text'].strip()))]
 last_body=max(substantive or [H*.8])
 for line in raw['lines']:
  words=line['words']
  if not words:continue
  text=line['text'].strip();y=min(v['y'] for v in words)*sy;bottom=max(v['y']+v['height'] for v in words)*sy
  bad=bool(BAD.search(text)) or (book==14 and BRAND.fullmatch(text)) or (y/H<.15 and BRAND.fullmatch(text)) or (y/H>.91 and (re.fullmatch(r'[\d\s]+',text) or BRAND.fullmatch(text)))
  if re.fullmatch(r'[\d\s]+',text) and y/H>.82 and y>last_body+12:bad=True
  if re.search(r'(?:https?|ttps|ps)\s*:',text,re.I) and (y/H<.12 or y/H>.88):bad=True
  if bad:removed.append(text);continue
  heights=[v['height']*sy for v in words if len(v['text'])>1]
  size=max(10,statistics.median(heights or [v['height']*sy for v in words])*1.23)
  baseline=statistics.median((v['y']+v['height'])*sy for v in words)
  bold=bool(re.match(r'^(?:SECTION|PART|Questions?\b)',text,re.I))
  clean=[]
  for word in words:
   t=re.sub(r'[\u4e00-\u9fff\ufeff]','',word['text']).strip()
   if not t:continue
   t=t.replace('foreach','for each').replace('WORDfor','WORD for').replace('NUMBERfor','NUMBER for')
   if book==16 and page==13 and t=='NAIN':t='MAIN'
   if re.fullmatch(r'[.·_…\-]+',t) and word['width']*sx>25:
    rules.append([round(word['x']*sx,1),round(baseline-2,1),round((word['x']+word['width'])*sx,1),round(baseline-2,1)])
    continue
   if text.lower().startswith(('questions','section','part')):
    t=re.sub(r'\bIO\b','10',t);t=re.sub(r'\bI\b','1',t)
   x=round(word['x']*sx,1);w=round(word['width']*sx,1)
   runs.append([t,x,round(baseline,1),w,round(size,1),1 if bold else 0]);clean.append(t)
  if clean:lines.append(' '.join(clean))
 added=[]
 second=supplement/str(book)/f'{page:03}.json' if supplement else None
 if second and second.exists():
  try:font=ImageFont.truetype('arial.ttf',100)
  except OSError:font=ImageFont.load_default()
  for polygon,text,confidence in json.loads(second.read_text(encoding='utf8')):
   if confidence<.92:continue
   ax=min(p[0] for p in polygon);ay=min(p[1] for p in polygon);bx=max(p[0] for p in polygon);by=max(p[1] for p in polygon)
   if ay/H>.82 and ay>last_body+12:continue
   if BAD.search(text) or (book==14 and BRAND.fullmatch(text.strip())):continue
   if re.search(r'\d[.,:/]\d|[$£%]',text):continue
   if by-ay>(bx-ax)*2 or by-ay>H*.06:continue
   article=re.match(r'^(a|an|the)(?=\d{1,2}$)',text)
   if article:
    word=article[1];total=max(1,font.getlength(text));width=(bx-ax)*font.getlength(word)/total
    if not any(r[0].lower()==word and abs(r[1]-ax)<(by-ay) and abs(r[2]-by)<(by-ay) for r in runs):
     runs.append([word,round(ax,1),round(by,1),round(width,1),round((by-ay)*1.15,1),0])
   matches=list(re.finditer(r'(?<!\d)\d{1,2}(?![\dA-Za-z])',text)) if len(text)<=12 else list(re.finditer(r'^\d{1,2}(?=[\s.·_—–-])',text))
   for m in matches:
    n=m.group();number=int(n)
    if not 1<=number<=40:continue
    total=max(1,font.getlength(text));left=ax+(bx-ax)*font.getlength(text[:m.start()])/total;width=max(6,(bx-ax)*font.getlength(n)/total);center=left+width/2;baseline=by
    close=[r for r in runs if abs(r[2]-baseline)<(by-ay)*.8 and r[1]-8<=center<=r[1]+r[3]+8]
    if any(n in r[0] for r in close):continue
    if any(re.fullmatch(r'[IOl\d]{1,2}',r[0]) for r in close):
     for r in close:
      if re.fullmatch(r'[IOl\d]{1,2}',r[0]):r[0]=n
    elif any(r[1]+3<center<r[1]+r[3]-3 for r in close):continue
    else:
     runs.append([n,round(left,1),round(baseline,1),round(width,1),round((by-ay)*1.15,1),0]);added.append(n)

 assert runs,(book,page)
 is_diagram=bool(re.search(r'\b(?:map|plan|diagram|flow.?chart)\b',' '.join(lines),re.I))
 x0=max(0,min(r[1] for r in runs)-22);x1=min(W,max(r[1]+r[3] for r in runs)+22)
 y0=max(0,min(r[2]-r[4] for r in runs)-18);y1=min(H,max(r[2] for r in runs)+35)
 if is_diagram:x0=20;x1=W-20
 region=np.zeros((H,W),dtype=np.uint8);region[int(y0):int(y1),int(x0):int(x1)]=255
 binary=cv2.threshold(gray,180,255,cv2.THRESH_BINARY_INV)[1]&region
 # Restore table rules and dotted answer lines without copying paper or logos.
 joined=cv2.morphologyEx(binary,cv2.MORPH_CLOSE,np.ones((1,5),np.uint8))
 horizontal=cv2.morphologyEx(joined,cv2.MORPH_OPEN,np.ones((1,max(24,int(W*.025))),np.uint8))
 vertical=cv2.morphologyEx(binary,cv2.MORPH_OPEN,np.ones((max(24,int(H*.015)),1),np.uint8))
 geometry=horizontal|vertical
 is_diagram=bool(re.search(r'\b(?:map|plan|diagram|flow.?chart)\b',' '.join(lines),re.I))
 if is_diagram:
  dark=cv2.threshold(gray,150,255,cv2.THRESH_BINARY_INV)[1]&region
  n,labels,stats,_=cv2.connectedComponentsWithStats(dark)
  frames=[(x-20,y-20,x+w+20,y+h+20) for x,y,w,h,area in stats[1:] if w>W*.2 and h>H*.08 and area>180]
  for a,b,c,d in frames:
   a,b,c,d=max(0,int(a)),max(0,int(b)),min(W,int(c)),min(H,int(d))
   geometry[b:d,a:c]=dark[b:d,a:c]
  for label in range(1,n):
   x,y,w,h,area=stats[label]
   large=area>180 and max(w,h)>65 and min(w,h)>6
   inside=area>=5 and any(a<=x+w/2<=c and b<=y+h/2<=d for a,b,c,d in frames)
   if large or inside:geometry[labels==label]=255
 contours,hierarchy=cv2.findContours(geometry,cv2.RETR_TREE,cv2.CHAIN_APPROX_SIMPLE)
 paths=[]
 for c in contours:
  if len(c)<3:continue
  a=cv2.approxPolyDP(c,.65,True).reshape(-1,2)
  if len(a)<3:continue
  paths.append('M'+'L'.join(str(int(x))+','+str(int(y)) for x,y in a)+'Z')
 return dict(supplementedNumbers=added,rules=rules,view=[round(x0,1),round(y0,1),round(x1-x0,1),round(y1-y0,1)],runs=runs,paths=''.join(paths),text='\n'.join(lines),removed=removed,diagram=is_diagram)
def main():
 parser=argparse.ArgumentParser();parser.add_argument('--library',type=Path,required=True);parser.add_argument('--supplement',type=Path);args=parser.parse_args()
 tests=json.loads((ROOT/'data/listening/tests.json').read_text(encoding='utf8'));layouts={}
 for t in tests:
  for page in [p['page'] for p in t['pages']]+([t['keyPage']] if t['keyPage'] else []):
   key=f"{t['book']}-{page}"
   if key not in layouts:layouts[key]=clean_page(t['book'],page,args.library,args.supplement)
 out=ROOT/'data/listening/layouts.json';out.write_text(json.dumps(layouts,ensure_ascii=False,separators=(',',':')),encoding='utf8')
 print(json.dumps({'pages':len(layouts),'words':sum(len(p['runs']) for p in layouts.values()),'removedLines':sum(len(p['removed']) for p in layouts.values()),'bytes':out.stat().st_size}))
if __name__=='__main__':main()
