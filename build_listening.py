"""Build the standalone Listening screen; uses only the Python standard library."""
from pathlib import Path
import base64,json
ROOT=Path(__file__).resolve().parent

def build(embed=False, output=None):
 tests=json.loads((ROOT/'data/listening/tests.json').read_text(encoding='utf8'))
 assert len(tests)==60 and len({t['id'] for t in tests})==60
 def embedded(path):
  p=(ROOT/path).resolve();p.relative_to(ROOT)
  return 'data:image/webp;base64,'+base64.b64encode(p.read_bytes()).decode('ascii')
 for test in tests:
  assert {p['part'] for p in test['pages']}=={1,2,3,4},test['id']
  assert [q['n'] for q in test['answers']]==list(range(1,41)),test['id']
  if test['keyPath']:
   assert all(q['answer'] and q['accept'] for q in test['answers']),test['id']
   test['keySrc']=embedded(test['keyPath']) if embed else test['keyPath']
  else:
   assert test['book']==20 and test['answerSource']=='unavailable'
  for page in test['pages']:page['src']=embedded(page['path']) if embed else page['path']
 source=(ROOT/'src/listening.template.html').read_text(encoding='utf8')
 marker='/*__LISTENING_DATA__*/';assert source.count(marker)==1
 source=source.replace(marker,json.dumps(tests,ensure_ascii=False,separators=(',',':')).replace('</','<\\/'))
 dest=Path(output) if output else ROOT/'listening.html';dest.write_text(source,encoding='utf8')
 print(f'Built Listening: {len(tests)} tests, {dest.stat().st_size:,} bytes')

if __name__=='__main__':build()
