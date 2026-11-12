
const LISTENING_DICTIONARY=/*__LISTENING_DICTIONARY__*/;
let studySelection=null,lookupSequence=0,lookupAbort=null,lookupRect=null;
const dictionaryCache=new Map();
function sanitizeHighlights(raw,test){
 if(!Array.isArray(raw)||!test)return [];
 return raw.slice(0,500).flatMap(h=>{
  if(!h||!Array.isArray(h.segments))return [];
  const segments=h.segments.slice(0,1000).flatMap(s=>{
   const page=test.pages.find(p=>p.page===s.page),run=page?.layout?.runs?.[s.run];
   return run&&Number.isInteger(s.start)&&Number.isInteger(s.end)&&s.start>=0&&s.end>s.start&&s.end<=run[0].length?
    [{page:s.page,run:s.run,start:s.start,end:s.end}]:[];
  });
  return segments.length?[{id:typeof h.id==='string'?h.id.slice(0,80):'hl-'+Math.random().toString(36).slice(2),segments}]:[];
 });
}
function closeStudyFloating(){
 $('#selection-tools').hidden=true;$('#word-lookup').hidden=true;
 lookupSequence++;lookupAbort?.abort();lookupAbort=null;studySelection=null;lookupRect=null;
}
function placeStudyPopup(el,rect){
 el.hidden=false;
 const width=el.getBoundingClientRect().width,height=el.getBoundingClientRect().height;
 el.style.left=Math.max(8,Math.min(rect.left,innerWidth-width-8))+'px';
 const below=rect.bottom+9;
 el.style.top=Math.max(8,below+height<innerHeight-8?below:rect.top-height-9)+'px';
}
function matchingMarks(segments){
 return state().highlights.filter(h=>h.segments.some(a=>segments.some(b=>a.page===b.page&&a.run===b.run&&a.start<b.end&&b.start<a.end))).map(h=>h.id);
}
function showSelectionTools(selection){
 studySelection=selection;
 $('#selection-lookup').disabled=selection.text.length>100;
 $('#selection-remove').disabled=!matchingMarks(selection.segments).length;
 placeStudyPopup($('#selection-tools'),selection.rect);
}
function captureStudySelection(){
 const selected=getSelection();if(!selected||selected.isCollapsed||!selected.rangeCount)return false;
 const start=selected.anchorNode?.parentElement?.closest('#pages .ocr-text'),end=selected.focusNode?.parentElement?.closest('#pages .ocr-text');
 if(!start||!end)return false;
 const range=selected.getRangeAt(0),segments=[],pieces=[];
 for(const span of document.querySelectorAll('#pages tspan[data-run]')){
  const node=span.firstChild;if(!node||!range.intersectsNode(node))continue;
  const page=Number(span.dataset.page),run=Number(span.dataset.run);
  const text=current.pages.find(p=>p.page===page)?.layout.runs[run]?.[0]||'';
  const a=range.startContainer===node?Math.min(text.length,range.startOffset):0;
  const b=range.endContainer===node?Math.min(text.length,range.endOffset):text.length;
  if(b>a){segments.push({page,run,start:a,end:b});pieces.push(text.slice(a,b));}
 }
 const text=pieces.join(' ').trim();if(!segments.length||!text)return false;
 if(text.length>2000){toast('Chọn tối đa 2.000 ký tự mỗi lần highlight.');return false;}
 showSelectionTools({segments,text,rect:range.getBoundingClientRect().toJSON()});return true;
}
function drawStudyHighlights(){
 for(const svg of document.querySelectorAll('#pages .ocr-page')){
  svg.querySelector('.highlight-layer')?.remove();
  const layer=document.createElementNS('http://www.w3.org/2000/svg','g');
  layer.setAttribute('class','highlight-layer');
  const page=Number(svg.dataset.page);
  for(const h of state().highlights){
   for(const s of h.segments.filter(s=>s.page===page)){
    const span=svg.querySelector('tspan[data-run="'+s.run+'"]');if(!span)continue;
    try{
     const boxes=[];for(let i=s.start;i<Math.min(s.end,span.getNumberOfChars());i++)boxes.push(span.getExtentOfChar(i));
     if(!boxes.length)continue;
     const x=Math.min(...boxes.map(b=>b.x)),y=Math.min(...boxes.map(b=>b.y));
     const right=Math.max(...boxes.map(b=>b.x+b.width)),bottom=Math.max(...boxes.map(b=>b.y+b.height));
     const rect=document.createElementNS(svg.namespaceURI,'rect');
     for(const [key,value]of Object.entries({x:x-1,y:y-1,width:right-x+2,height:bottom-y+2,rx:2}))rect.setAttribute(key,value);
     rect.dataset.highlight=h.id;layer.appendChild(rect);
    }catch{}
   }
  }
  svg.insertBefore(layer,svg.querySelector('.ocr-text'));
 }
}
function addStudyHighlight(){
 if(!studySelection)return;
 const segments=studySelection.segments;
 if(state().highlights.length>=500){toast('Test này đã có 500 highlight. Hãy bỏ bớt để thêm.');return;}
 const signature=JSON.stringify(segments);
 if(!state().highlights.some(h=>JSON.stringify(h.segments)===signature))
  state().highlights.push({id:'hl-'+Date.now().toString(36)+'-'+Math.random().toString(36).slice(2),segments});
 persist();getSelection()?.removeAllRanges();closeStudyFloating();drawStudyHighlights();
}
function removeStudyHighlight(){
 if(!studySelection)return;
 const ids=new Set(matchingMarks(studySelection.segments));
 state().highlights=state().highlights.filter(h=>!ids.has(h.id));
 persist();getSelection()?.removeAllRanges();closeStudyFloating();drawStudyHighlights();
}
function lookupForms(value){
 const word=value.toLowerCase().trim().replace(/^[^a-z]+|[^a-z]+$/g,'').replace(/\s+/g,' ');
 const forms=[word];if(word.endsWith('ies'))forms.push(word.slice(0,-3)+'y');
 if(word.endsWith('s'))forms.push(word.slice(0,-1));
 if(word.endsWith('es'))forms.push(word.slice(0,-2));
 if(word.endsWith('ed'))forms.push(word.slice(0,-2),word.slice(0,-1));
 if(word.endsWith('ing'))forms.push(word.slice(0,-3),word.slice(0,-3)+'e');
 return [...new Set(forms)];
}
function safeDictionaryUrl(value){
 try{const u=new URL(value);return ['https:','http:'].includes(u.protocol)?u.href:'';}catch{return '';}
}
function showLookupResults(word,entries,online=false,loading=false,source=null){
 $('#lookup-results').innerHTML=loading?'<p class="hint" role="status">Đang tra từ điển mở…</p>':entries.length?
  '<p class="hint">'+(online?'Định nghĩa tiếng Anh · Free Dictionary API':'Nghĩa tiếng Việt từ bộ từ vựng cục bộ; chọn nghĩa phù hợp ngữ cảnh.')+'</p>'+
  entries.map(v=>'<div class="lookup-entry"><div class="lookup-meta">'+esc(v.pos||'')+' '+esc(v.ipa||'')+'</div><p>'+esc(v.meaning)+'</p>'+(v.synonyms?'<small>'+esc(v.synonyms)+'</small>':'')+'</div>').join(''):
  '<p class="hint" role="status">Chưa tìm thấy từ/cụm từ này. Bạn có thể mở từ điển Cambridge để tra thêm.</p>';
 if(source){
  const url=safeDictionaryUrl(source.url),license=safeDictionaryUrl(source.license);
  $('#lookup-results').insertAdjacentHTML('beforeend','<p class="hint">'+(url?'<a href="'+esc(url)+'" target="_blank" rel="noopener noreferrer">Nguồn định nghĩa</a>':'')+(license?' · <a href="'+esc(license)+'" target="_blank" rel="noopener noreferrer">'+esc(source.licenseName||'Giấy phép')+'</a>':'')+'</p>');
 }
 $('#lookup-cambridge').href='https://dictionary.cambridge.org/dictionary/english/'+encodeURIComponent(word);
 if(lookupRect)placeStudyPopup($('#word-lookup'),lookupRect);
}
async function lookupListeningWord(value){
 const word=value.trim().slice(0,100);if(!word){$('#lookup-query').focus();return;}
 $('#lookup-query').value=word;
 const sequence=++lookupSequence;lookupAbort?.abort();lookupAbort=null;
 for(const form of lookupForms(word)){
  if(LISTENING_DICTIONARY[form]){showLookupResults(word,LISTENING_DICTIONARY[form]);return;}
 }
 if(dictionaryCache.has(word.toLowerCase())){const v=dictionaryCache.get(word.toLowerCase());showLookupResults(word,v.entries,true,false,v.source);return;}
 if(!/^[A-Za-z][A-Za-z'-]{0,50}$/.test(word)){showLookupResults(word,[]);return;}
 showLookupResults(word,[],false,true);
 const controller=new AbortController();lookupAbort=controller;
 const timeout=setTimeout(()=>controller.abort(),6000);
 try{
  const response=await fetch('https://api.dictionaryapi.dev/api/v2/entries/en/'+encodeURIComponent(word.toLowerCase()),{signal:controller.signal});
  if(!response.ok)throw Error('No dictionary entry');
  const data=await response.json(),item=data[0],entries=[];
  for(const m of item?.meanings||[])for(const d of (m.definitions||[]).slice(0,2)){
   if(typeof d.definition==='string')entries.push({meaning:d.definition,pos:m.partOfSpeech||'',ipa:item.phonetic||item.phonetics?.find(p=>p.text)?.text||'',synonyms:(m.synonyms||d.synonyms||[]).slice(0,5).join('; ')});
   if(entries.length>=4)break;
  }
  if(!entries.length)throw Error('Empty dictionary entry');
  if(sequence!==lookupSequence||$('#word-lookup').hidden)return;
  const source={url:item.sourceUrls?.[0],license:item.license?.url,licenseName:item.license?.name};
  dictionaryCache.set(word.toLowerCase(),{entries,source});showLookupResults(word,entries,true,false,source);
 }catch{if(sequence===lookupSequence&&!$('#word-lookup').hidden)showLookupResults(word,[]);}
 finally{clearTimeout(timeout);if(lookupAbort===controller)lookupAbort=null;}
}
function openListeningLookup(value='',rect=null){
 const position=rect||studySelection?.rect||{left:Math.min(innerWidth-350,120),top:190,bottom:210};
 lookupRect=position;
 $('#selection-tools').hidden=true;$('#word-lookup').hidden=false;
 $('#lookup-query').value=value;$('#lookup-results').textContent='';
 $('#lookup-cambridge').href='https://dictionary.cambridge.org/dictionary/english/';
 placeStudyPopup($('#word-lookup'),position);
 if(value)lookupListeningWord(value);else $('#lookup-query').focus();
}
$('#selection-tools').addEventListener('mousedown',e=>e.preventDefault());
$('#selection-mark').onclick=addStudyHighlight;
$('#selection-remove').onclick=removeStudyHighlight;
$('#selection-lookup').onclick=()=>openListeningLookup(studySelection?.text||'');
$('#lookup-open').onclick=()=>openListeningLookup(studySelection?.text?.slice(0,100)||'');
$('#lookup-close').onclick=closeStudyFloating;
$('#lookup-form').onsubmit=e=>{e.preventDefault();lookupListeningWord($('#lookup-query').value);};
$('#pages').addEventListener('mouseup',e=>{
 const target=e.target;
 setTimeout(()=>{
  if(captureStudySelection())return;
  const span=target.closest?.('tspan[data-run]'),rect=target.closest?.('[data-highlight]');
  const mark=rect?state().highlights.find(h=>h.id===rect.dataset.highlight):span?
   state().highlights.find(h=>h.segments.some(s=>s.page===Number(span.dataset.page)&&s.run===Number(span.dataset.run))):null;
  if(mark){
   const text=mark.segments.map(s=>current.pages.find(p=>p.page===s.page)?.layout.runs[s.run]?.[0]?.slice(s.start,s.end)||'').join(' ');
   showSelectionTools({segments:mark.segments,text,rect:target.getBoundingClientRect().toJSON()});
  }else closeStudyFloating();
 },0);
});
$('#pages').addEventListener('keyup',()=>captureStudySelection());
document.addEventListener('selectionchange',()=>{if(!getSelection()?.isCollapsed)return;$('#selection-tools').hidden=true;});
document.addEventListener('pointerdown',e=>{if(!e.target.closest('#pages,#selection-tools,#word-lookup,#lookup-open'))closeStudyFloating();});
document.addEventListener('keydown',e=>{if(e.key==='Escape')closeStudyFloating();});
$('#source-scroll').addEventListener('scroll',closeStudyFloating,{passive:true});
window.addEventListener('resize',closeStudyFloating);
