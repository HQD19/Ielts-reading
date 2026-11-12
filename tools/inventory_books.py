from pathlib import Path
import json,sys
import pypdfium2 as pdfium
from PIL import Image,ImageOps,ImageDraw
sys.stdout.reconfigure(encoding='utf-8')
root=Path(__file__).resolve().parent
out=root/'library';out.mkdir(exist_ok=True)
files=sorted(Path(r'C:\Users\Huy\Documents\English\pdf').glob('*.pdf'),key=lambda p:int(p.stem))
report=[]
sheet=Image.new('RGB',(2000,1600),'#e5e7eb')
for j,p in enumerate(files):
    doc=pdfium.PdfDocument(p)
    b=out/p.stem;b.mkdir(exist_ok=True)
    native=[]
    for n in range(len(doc)):
        page=doc[n]
        text=page.get_textpage().get_text_range()
        native.append(text)
    (b/'native.json').write_text(json.dumps(native,ensure_ascii=False),encoding='utf8')
    item={'book':int(p.stem),'pages':len(doc),'nativePages':sum(len(t.strip())>100 for t in native),'bytes':p.stat().st_size,'sample':next((t[:500] for t in native if len(t.strip())>100),'')}
    report.append(item)
    print(json.dumps(item,ensure_ascii=False),flush=True)
    img=ImageOps.contain(doc[0].render(scale=.8).to_pil().convert('RGB'),(380,485))
    x=(j%5)*400;y=(j//5)*530+25
    sheet.paste(img,(x+(400-img.width)//2,y))
    ImageDraw.Draw(sheet).text((x+15,y-20),f'{p.name} / {len(doc)} pages',fill='black')
sheet.save(out/'covers.jpg')
(out/'inventory.json').write_text(json.dumps(report,ensure_ascii=False,indent=2),encoding='utf8')
