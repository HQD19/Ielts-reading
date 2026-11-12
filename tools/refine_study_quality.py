from pathlib import Path
import sys,json,re,copy,collections
ROOT=Path(__file__).resolve().parent
sys.path.insert(0,str(ROOT/'quality-deps'))
import nltk
from nltk.tokenize import PunktTokenizer,TreebankWordTokenizer
nltk.data.path[:]=[str(ROOT/'nltk-data')]
splitter=PunktTokenizer('english');tokenizer=TreebankWordTokenizer()
OUT=ROOT/'quality';OUT.mkdir(exist_ok=True)
def savejson(path,value):path.write_text(json.dumps(value,ensure_ascii=False,indent=2),encoding='utf8')
def sentences(p):
 out=[]
 for block in ([{'text':p['subtitle']}] if p.get('subtitle') else [])+p['paragraphs']:
  text=block['text']
  for a,b in splitter.span_tokenize(text):
   s=text[a:b].strip()
   if len(s)<20 or len(s)>700 or re.search(r'\b[A-Za-z]{2,}\d+[A-Za-z]{2,}\b|\\/',s):continue
   spans=list(tokenizer.span_tokenize(s));tags=nltk.pos_tag([s[a:b] for a,b in spans])
   out.append((s,spans,tags))
 return out
def forms(term):
 words=term.split();head=words[0];rest=' '.join(words[1:]);f=[term]
 irregular={'give':['gives','gave','given','giving'],'take':['takes','took','taken','taking'],'make':['makes','made','making'],'come':['comes','came','coming'],'lead':['leads','led','leading'],'bring':['brings','brought','bringing'],'put':['puts','putting']}
 if head=='be':f += [h+' '+rest for h in ['is','are','was','were','been','being']]
 elif len(words)>1:
  hs=irregular.get(head,[head+'s',head+'ed',head+'ing']+([head+'d',head[:-1]+'ing'] if head.endswith('e') else []))
  f += [h+' '+rest for h in hs]
 return list(dict.fromkeys(f))
def find(ss,needles):
 for needle in needles:
  pat=re.compile(r'(?<![A-Za-z])'+re.escape(needle)+r'(?![A-Za-z])',re.I)
  for s,spans,tags in ss:
   m=pat.search(s)
   if m:
    ix=next((i for i,(a,b) in enumerate(spans) if a<=m.start()<b),0)
    return s,m.group(),tags[ix][1],tags
 return None
PHRASES=[]
for row in (ROOT/'quality-phrases.tsv').read_text(encoding='utf8').splitlines():
 term,pos,ipa,meaning,synonyms,usage=row.split('|');PHRASES.append(dict(term=term,pos=pos,ipa=ipa,meaning=meaning,synonyms=synonyms,usage=usage))
SENSE={
 'confined to':('bị giới hạn trong phạm vi','restricted to; limited to'),
 'adapt to':('thích nghi với điều kiện hoặc cách hoạt động mới','adjust to; become suited to'),
 'rich legacy':('di sản phong phú được để lại từ quá khứ','substantial inheritance; enduring contribution'),
 'in the aftermath':('trong giai đoạn sau một sự kiện gây hậu quả lớn','following the event; in the wake of'),
}
def vocab(p,ss,freq,report):
 old=p['vocab'];kept=[];seen=set()
 for original in old:
  v=copy.deepcopy(original);term=v['term'];key=term.lower()
  if key in seen:continue
  needles=[v.get('needle',term),term]
  hit=find(ss,needles)
  if not hit:report['removed'].append([p['id'],term,'no exact, complete sentence containing source form']);continue
  s,actual,tag,tags=hit
  if ' ' not in term and '/' not in v['pos']:
   expected=v['pos'].split()[0]
   compatible=(expected.startswith('n') and tag.startswith('NN')) or (expected.startswith('v') and tag.startswith('VB')) or (expected=='adj' and (tag.startswith('JJ') or tag in ['VBN','VBG'])) or (expected=='adv' and tag.startswith('RB'))
   if not compatible:
    report['removed'].append([p['id'],term,'POS conflicts with observed context: '+tag]);continue
  v.update(example=s,needle=actual,sourceForm=actual)
  if p['book']!=20 and key in SENSE:v['meaning'],v['synonyms']=SENSE[key]
  if key=='tolerant of' and re.search(r'soil|plant|prairie',s,re.I):v.update(meaning='có khả năng chịu được, thích nghi với (điều kiện đất)',synonyms='able to withstand; able to grow in')
  if key=='put off' and re.search(r'be put off|get put off|put off by',s,re.I):v.update(meaning='làm nản lòng, khiến không muốn tiếp tục',synonyms='discourage; deter',usage='Trong câu này put off mang nghĩa làm nản lòng, không phải trì hoãn.')
  if key=='held responsible' and p['track']=='general':v.update(meaning='bị yêu cầu chịu trách nhiệm thanh toán',synonyms='be liable for payment',usage='Ngữ cảnh hóa đơn: trách nhiệm chi trả, không phải bị đổ lỗi cho việc săn mồi.')
  if key=='annual turnover':v.update(term='turnover',pos='n',ipa='/ˈtɜːnəʊvə/',meaning='doanh thu',synonyms='sales revenue',needle='turnover',sourceForm='turnover')
  if key=='take a toll on' and 'take a toll on' not in s.lower():v.update(term='toll on productivity',pos='n phrase',ipa='/təʊl ɒn ˌprɒdʌkˈtɪvəti/',meaning='tác động tiêu cực lên năng suất',synonyms='harmful effect on productivity',sourceForm='toll on productivity',needle='toll on productivity',usage='Bài dùng cụm danh từ the toll on productivity. Cách kết hợp động từ liên quan: take a toll on something.')
  if key=='vascular system':v.update(term='vascular',pos='adj',ipa='/ˈvæskjələ/',meaning='thuộc hệ mạch dẫn của cây',synonyms='relating to the transport vessels of a plant',sourceForm='vascular',needle='vascular',usage='Trong bài vascular bổ nghĩa cho system; phần giải thích trong ngoặc nằm giữa hai từ.')
  if key=='ambient temperature':v.update(term='ambient water temperature',ipa='/ˈæmbiənt ˈwɔːtə ˈtemprətʃə/',sourceForm='ambient water temperature',needle='ambient water temperature')
  if v.get('meaning')!=original.get('meaning'):report['senseFixed'].append([p['id'],term,original.get('meaning'),v['meaning']])
  if v['term']!=term:v['previousTerm']=term
  kept.append(v);seen.add(v['term'].lower())
 added=[]
 for entry in PHRASES:
  if entry['term'].lower() in seen:continue
  hit=find(ss,forms(entry['term']))
  if not hit:continue
  s,actual,tag,tags=hit
  v=dict(entry,example=s,needle=actual,sourceForm=actual)
  if entry['term']=='be responsible for':
   if re.search(r'government|promoting happiness',s,re.I):v.update(meaning='chịu trách nhiệm về việc thực hiện',synonyms='be accountable for; have a duty to')
   elif re.search(r'brain circuits|functions|creativity|invention',s,re.I):v.update(meaning='đảm nhiệm hoặc tạo nên chức năng, kết quả',synonyms='perform a function; bring about')
   else:v.update(meaning='là nguyên nhân gây ra',synonyms='cause; bring about')
  added.append(v);seen.add(entry['term'].lower())
 # Diverse phrases first, then topic words; avoid alphabetical truncation.
 added.sort(key=lambda v:(freq.get(v['term'].lower(),0),-len(v['term'].split())))
 singles=[v for v in kept if ' ' not in v['term']];chunks=[v for v in kept if ' ' in v['term']]
 singles.sort(key=lambda v:(freq.get(v['term'].lower(),0),-len(v['term'])))
 chosen=chunks+added[:8]+singles
 result=chosen[:26]
 report['phrasesAdded']+=sum(v in result for v in added)
 return result
FINITE={'VBD','VBP','VBZ','MD'}
def structure_candidates(ss):
 out=[];seen=set()
 def add(title,s,formula,effect,trigger):
  if title in seen or trigger not in s:return
  out.append(dict(title=title,example=s,formula=formula,effect=effect,trigger=trigger));seen.add(title)
 for s,spans,tags in ss:
  ws=[w.lower() for w,t in tags];ts=[t for w,t in tags]
  def following(i,limit=8):return any(t in FINITE for t in ts[i+1:i+limit])
  m=re.search(r'\b(?:not only|never|rarely|only then)\s+(?:was|were|is|are|did|does|do|has|have|had|can|could)\b',s,re.I)
  if m:add('Đảo ngữ sau thành phần giới hạn/phủ định',s,'Negative / restrictive expression + auxiliary + subject + verb','Đưa trợ động từ lên trước chủ ngữ để nhấn mạnh giới hạn hoặc sự phủ định.',m[0])
  m=re.search(r'\bit (?:is|was) (?:at (?:this|that) point|not until [^,.;!?]{3,80}) that\b',s,re.I)
  if m:add('Câu chẻ nhấn mạnh mốc thời gian',s,'It + be + focused time expression + that + clause','Nhấn mạnh chính thời điểm được nêu giữa be và that.',m[0])
  for i,w in enumerate(ws):
   if w in ['can','could','may','might','must','should','would'] and i+2<len(ws) and ws[i+1]=='have':
    if any(t=='VBN' for t in ts[i+2:i+5]):add('Modal perfect: modal + have + V3',s,'S + modal + have + past participle','Diễn đạt khả năng, đánh giá hoặc giả định về sự việc trước đó; sắc thái phụ thuộc động từ khuyết thiếu.', ' '.join(x[0] for x in tags[i:i+3]))
   if w in ['has','have','had']:
    j=i+1
    while j<len(ts) and ts[j]=='RB':j+=1
    boundary=max([k for k in range(max(0,i-16),i) if ws[k] in [',',';',':','.','?']]+[max(0,i-16)-1])
    if j<len(ts) and ts[j]=='VBN' and not any(t=='MD' for t in ts[boundary+1:i]):
     title='Quá khứ hoàn thành' if w=='had' else 'Hiện tại hoàn thành'
     add(title,s,'S + had + V3' if w=='had' else 'S + has / have + V3','Liên kết một hành động đã hoàn thành với mốc thời gian đang được nói tới; has/have phải là trợ động từ, không phải động từ sở hữu.',s[spans[i][0]:spans[j][1]])
   if w in ['is','are','was','were','be','been','being']:
    j=i+1
    while j<len(ts) and ts[j]=='RB':j+=1
    if j<len(ts) and ts[j]=='VBN':add('Bị động: be + phân từ quá khứ',s,'S + be (appropriate tense) + past participle','Đặt trọng tâm vào đối tượng chịu tác động hoặc trạng thái được tạo ra, thay vì tác nhân thực hiện.',s[spans[i][0]:spans[j][1]])
   if w=='which' and i>0 and ts[i]=='WDT' and following(i,14) and not s.rstrip().endswith('?'):add('Mệnh đề quan hệ với which',s,'antecedent noun / clause + which + relative clause','Which nối thông tin về đối tượng hoặc ý vừa được nhắc đến. Dấu phẩy giúp phân biệt thông tin bổ sung với thông tin xác định.',tags[i][0])
   if w in ['although','whereas'] and following(i,12):add('Nhượng bộ / tương phản với '+w,s,('Although' if w=='although' else 'Whereas')+' + S + V, S + V','Đối chiếu hai mệnh đề; although thừa nhận điểm trái chiều, còn whereas đặt hai đặc điểm tương phản cạnh nhau.',tags[i][0])
   if w=='if' and following(i,10) and not any(x in ws[max(0,i-4):i] for x in ['wonder','wondered','ask','asked','know','see','whether','as']):
    add('Điều kiện với if',s,'If + finite clause, result clause','Đặt điều kiện cho kết quả; loại điều kiện phải được xác định từ thì và động từ ở cả hai vế.',tags[i][0])
   if w in ['by','without','before','after'] and i+1<len(ts) and ts[i+1]=='VBG':add('Giới từ + V-ing: '+w,s,w+' + V-ing (+ object)','Theo sau giới từ là dạng V-ing. By thường nêu phương thức; without nêu việc không xảy ra; before/after nêu trình tự.',s[spans[i][0]:spans[i+1][1]])
   if w=='than' and i>0 and any(t in ['JJR','RBR'] or z in ['more','less'] for z,t in tags[max(0,i-8):i]):add('Cấu trúc so sánh hơn',s,'comparative adjective / adverb + than','So sánh mức độ giữa các đối tượng; giữ nguyên phạm vi và tiêu chí được so sánh trong câu.',tags[i][0])
 return out
def grammar(p,ss):
 if p['book']==20:return p['grammar']
 candidates=structure_candidates(ss)
 # Prioritise advanced structures and use a different source sentence for each card.
 priority=['Đảo ngữ','Khung câu chẻ','Modal perfect','Quá khứ hoàn thành','Hiện tại hoàn thành','Giới từ','Mệnh đề quan hệ','Nhượng bộ','Điều kiện','Bị động','Cấu trúc so sánh']
 candidates.sort(key=lambda c:next((i for i,t in enumerate(priority) if c['title'].startswith(t)),99))
 selected=[];used=set()
 for c in candidates:
  if c['example'] not in used:selected.append(c);used.add(c['example'])
  if len(selected)>=5:break
 return selected
def main():
 files=[ROOT/f'library/{b}/passages.json' for b in list(range(7,20))+[21]]+[ROOT/'data.json']
 groups=[];freq=collections.Counter()
 for f in files:
  backup=OUT/f'original-{f.parent.name if f.name!="data.json" else "20"}.json'
  ps=json.loads((backup if backup.exists() else f).read_text(encoding='utf8'))
  for p in ps:p['book']=20 if f.name=='data.json' else int(f.parent.name);p.setdefault('track','academic')
  groups.append((f,ps))
  for p in ps:freq.update(set(v['term'].lower() for v in p['vocab']))
 report={'senseFixed':[],'removed':[],'phrasesAdded':0,'passages':0,'vocabBefore':sum(len(p['vocab']) for f,ps in groups for p in ps),'grammarBefore':sum(len(p['grammar']) for f,ps in groups for p in ps)}
 for f,ps in groups:
  backup=OUT/f'original-{f.parent.name if f.name!="data.json" else "20"}.json'
  if not backup.exists():savejson(backup,ps)
  for p in ps:
   ss=sentences(p);p['vocab']=vocab(p,ss,freq,report);p['grammar']=grammar(p,ss);p['studyVersion']=2
   if p['book']!=20:
    for g in p['groups']:
     for q in g['questions']:
      section=None
      if g['type']=='heading':
       m=re.search(r'(?:Paragraph|Section)\s+([A-Z])',q['text'],re.I)
       if m:section=m[1].upper()
      elif g['type']=='match' and any('Paragraph ' in o or 'Section ' in o for o in g.get('options',[])):section=q.get('answer')
      paragraph=next((z['text'] for z in p['paragraphs'] if z['label']==section),None) if section else None
      if paragraph:
       q['evidence']=paragraph
       if g['type']=='heading':q['mapQ']=next((o.split(' · ',1)[-1] for o in g['options'] if o.split(' · ')[0]==q.get('answer')),q['text'])
       q['explanation']=f"Khóa PDF chọn {q.get('answer')}. Đối chiếu nội dung câu hỏi hoặc tiêu đề với toàn bộ đoạn {section}; không chỉ dựa vào một từ trùng nhau."
   if p['id']=='c21t1p1':
    q=next(q for g in p['groups'] for q in g['questions'] if q['n']==8)
    quote=next(s for s,_,_ in ss if 'religious upbringing' in s)
    q.update(evidence=quote,mapQ='childhood influenced / use their wealth',explanation='Childhood được diễn đạt bằng religious upbringing in rural Wales; việc dùng tài sản cho cultural and philanthropic purposes cho thấy ảnh hưởng của giáo dục thời thơ ấu. Dẫn chứng này nằm ở đoạn mở đầu, không phải đoạn nói về tình nguyện tại căng tin.')
   report['passages']+=1
  savejson(f,ps)
  print('Refined',f.parent.name,flush=True)
 report['vocabAfter']=sum(len(p['vocab']) for f,ps in groups for p in ps);report['grammarAfter']=sum(len(p['grammar']) for f,ps in groups for p in ps)
 savejson(OUT/'study-quality-report.json',report);print({k:v for k,v in report.items() if k not in ['removed','senseFixed']},flush=True)
if __name__=='__main__':main()
