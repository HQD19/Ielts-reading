"""Build the standalone Listening screen; uses only the Python standard library."""
from pathlib import Path
import json
ROOT=Path(__file__).resolve().parent

def build(output=None):
 tests=json.loads((ROOT/'data/listening/tests.json').read_text(encoding='utf8'))
 layouts=json.loads((ROOT/'data/listening/layouts.json').read_text(encoding='utf8'))
 def layout(book,page):
  raw=layouts[f'{book}-{page}']
  return {k:raw[k] for k in ('view','runs','paths','rules') if k in raw}
 assert len(tests)==60 and len({t['id'] for t in tests})==60
 for test in tests:
  assert {p['part'] for p in test['pages']}=={1,2,3,4},test['id']
  assert [q['n'] for q in test['answers']]==list(range(1,41)),test['id']
  if test['keyPath']:
   assert all(q['answer'] and q['accept'] for q in test['answers']),test['id']
   test['keyLayout']=layout(test['book'],test['keyPage'])
  else:
   assert test['book']==20 and test['answerSource']=='unavailable'
  for page in test['pages']:
   page['layout']=layout(test['book'],page['page'])
   page['text']=layouts[f"{test['book']}-{page['page']}"]['text']
  test.pop('audio',None)
 source=(ROOT/'src/listening.template.html').read_text(encoding='utf8')
 marker='/*__LISTENING_DATA__*/';assert source.count(marker)==1
 source=source.replace(marker,json.dumps(tests,ensure_ascii=False,separators=(',',':')).replace('</','<\\/'))
 dest=Path(output) if output else ROOT/'listening.html';dest.write_text(source,encoding='utf8')
 print(f'Built Listening: {len(tests)} tests, {dest.stat().st_size:,} bytes')

if __name__=='__main__':build()
