from pathlib import Path
from concurrent.futures import ProcessPoolExecutor,as_completed
import subprocess,sys,json
ROOT=Path(__file__).resolve().parent
def process(book):
 import pypdfium2 as pdfium
 root=ROOT/'library'/str(book);out=root/'scans';out.mkdir(exist_ok=True)
 doc=pdfium.PdfDocument(Path(r'C:\Users\Huy\Documents\English\pdf')/f'{book}.pdf')
 for i in range(len(doc)):
  p=out/f'{i+1:03}.jpg'
  if p.exists():continue
  page=doc[i]
  scale=min(2.3,2100/max(page.get_size()))
  page.render(scale=scale).to_pil().convert('RGB').save(p,quality=88)
 print(f'BOOK {book} RENDERED {len(doc)}',flush=True)
 subprocess.run([r'C:\Windows\System32\WindowsPowerShell\v1.0\powershell.exe','-NoProfile','-ExecutionPolicy','Bypass','-File',str(ROOT/'library_ocr.ps1'),'-Book',str(book)],check=True)
 return book
if __name__=='__main__':
 books=[int(x) for x in sys.argv[1:]] or [7,8,9,10,11,12,13,14,15,16,17,18,19,21]
 with ProcessPoolExecutor(max_workers=4) as pool:
  for f in as_completed([pool.submit(process,b) for b in books]):print('FINISHED',f.result(),flush=True)
