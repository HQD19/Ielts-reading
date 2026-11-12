"""Build the standalone Listening screen; uses only the Python standard library."""
from pathlib import Path
import json,re
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
 dictionary={}
 def add_word(term,v):
  key=re.sub(r'\s+',' ',term.strip().lower())
  rows=dictionary.setdefault(key,[])
  entry={k:v.get(k,'') for k in ('pos','ipa','meaning','synonyms')}
  if len(rows)<4 and not any(r['pos']==entry['pos'] and r['meaning']==entry['meaning'] for r in rows):rows.append(entry)
 for bookfile in sorted((ROOT/'data/books').glob('*.json'),key=lambda p:int(p.stem)):
  for passage in json.loads(bookfile.read_text(encoding='utf8')):
   for v in passage['vocab']:add_word(v['term'],v)
 common=json.loads((ROOT/'data/listening/common-words.json').read_text(encoding='utf8'))
 for term,meaning in common.items():add_word(term,{'meaning':meaning})
 study=(ROOT/'src/listening-study.js').read_text(encoding='utf8')
 assert source.count('/*__LISTENING_STUDY__*/')==1
 source=source.replace('/*__LISTENING_STUDY__*/',study)
 assert source.count('/*__LISTENING_DICTIONARY__*/')==1
 source=source.replace('/*__LISTENING_DICTIONARY__*/',json.dumps(dictionary,ensure_ascii=False,separators=(',',':')).replace('</','<\\/'))
 dest=Path(output) if output else ROOT/'listening.html';dest.write_text(source,encoding='utf8')
 print(f'Built Listening: {len(tests)} tests, {dest.stat().st_size:,} bytes')

if __name__=='__main__':build()
