// Reflow the original OCR words as HTML. Run IDs stay stable for saved highlights.
function listeningLines(layout, indices=null){
 const lines=[];
 for(const index of indices||layout.runs.map((_,i)=>i)){
  const run=layout.runs[index];
  let line=lines.find(l=>Math.abs(l.y-run[2])<Math.max(5,Math.min(l.size,run[4])*.55));
  if(!line){line={y:run[2],size:run[4],runs:[]};lines.push(line);}
  line.runs.push(index);
 }
 return lines.sort((a,b)=>a.y-b.y).map(l=>({...l,runs:l.runs.sort((a,b)=>layout.runs[a][1]-layout.runs[b][1])}));
}
function listeningWords(layout,indices,page,blanks=true){
 return indices.map((index,i)=>{
  const r=layout.runs[index],next=layout.runs[indices[i+1]];
  // A single replacement character occupies the same stored character offset.
  const text=r[0].replace(/(?<=\d)�(?=\d)/g,'–').replace(/�/g,'•');
  const gap=blanks&&(layout.answerGaps||[]).includes(index);
  return (gap?'<span class="source-gap">':'')+'<span class="source-word'+((layout.silentRuns||[]).includes(index)?' source-decoration':'')+'" data-page="'+page+'" data-run="'+index+'">'+esc(text)+'</span>'+(gap?'<span class="answer-space" aria-label="chỗ trống"> ______</span></span>':'')+' ';
 }).join('');
}
function listeningParagraphs(layout,lines){
 const output=[];
 for(const line of lines){
  const value=line.runs.map(i=>layout.runs[i][0]).join(' ');
  const number=Number(value.match(/^\d{1,2}\b/)?.[0]);
  const prompt=number>=part*10-9&&number<=part*10&&/^\d{1,2}\s*(?:[-–—�]\s*\d{1,2}\s*)?[A-Z]/.test(value)&&!line.runs.some(i=>(layout.answerGaps||[]).includes(i));
  const previous=output.at(-1);
  const continuation=previous?.prompt&&!/[?:]$/.test(previous.value)&&!prompt&&!/^(?:Questions?\b|Choose\b|Write\b|[A-E][.,)]?\s)/.test(value)&&line.y-previous.lastY<line.size*2.2;
  if(continuation){previous.runs.push(...line.runs);previous.value+=' '+value;previous.lastY=line.y;}
  else output.push({...line,value,prompt,lastY:line.y});
 }
 return output;
}
function listeningFlowPage(p){
 const layout=p.layout,lines=listeningParagraphs(layout,listeningLines(layout)),text=l=>l.runs.map(i=>layout.runs[i][0]).join(' ');
 const typical=layout.runs.map(r=>r[4]).sort((a,b)=>a-b)[Math.floor(layout.runs.length/2)]||24;
 const instruction=lines.findIndex(l=>/^Write\b/i.test(text(l)));
 let tableAt=-1,headers=[];
 if(/complete the table/i.test(lines.map(text).join(' '))&&instruction>=0){
  for(let i=instruction+1;i<lines.length;i++){
   const chunks=[];
   for(const id of lines[i].runs){const r=layout.runs[id],last=chunks.at(-1),prev=last&&layout.runs[last.at(-1)];
    if(!prev||r[1]-prev[1]-prev[3]>typical*2)chunks.push([id]);else last.push(id);
   }
   if(chunks.length>=2&&chunks.length<=4){tableAt=i;headers=chunks;break;}
  }
 }
 let html='';
 const paragraph=l=>{
  const value=text(l),heading=/^(?:Test\s+\d+|(?:SECTION|PART)\s+\d+.*|Questions?\s+[\d�–— and-]+)$/i.test(value);
  const title=!heading&&value.length>5&&/[A-Z]{3}/.test(value)&&value===value.toUpperCase()&&!/^Write/i.test(value);
  const meta=/^(?:Test\s+\d+|LISTENING)$/i.test(value);
  const tag=meta?'p':l.prompt?'h3':heading?'h3':title?'h2':'p';
  return '<'+tag+' class="flow-line'+(meta?' flow-meta':l.prompt?' flow-prompt':'')+'">'+listeningWords(layout,l.runs,p.page,!heading&&!meta)+'</'+tag+'>';
 };
 if(layout.table){
  const t=layout.table;
  html=listeningLines(layout,t.prefix).map(paragraph).join('');
  html+='<table class="flow-table"><thead><tr>'+t.headers.map(h=>'<th scope="col">'+listeningWords(layout,h,p.page,false)+'</th>').join('')+'</tr></thead><tbody>';
  html+=t.rows.map(row=>'<tr>'+row.map((ids,c)=>'<td data-label="'+esc(t.headers[c].map(i=>layout.runs[i][0]).join(' '))+'">'+listeningWords(layout,ids,p.page)+'</td>').join('')+'</tr>').join('');
  return '<section class="listening-text" data-page="'+p.page+'">'+html+'</tbody></table></section>';
 }
 for(const l of lines.slice(0,tableAt<0?lines.length:tableAt))html+=paragraph(l);
 if(tableAt>=0){
  const boundaries=headers.slice(1).map(h=>layout.runs[h[0]][1]-typical*.5);
  const column=id=>boundaries.filter(x=>layout.runs[id][1]>=x).length;
  const nextGroup=lines.findIndex((l,i)=>i>tableAt&&/^(?:Questions\s+\d|(?:SECTION|PART)\s+\d)/i.test(text(l)));
  const tableEnd=nextGroup<0?lines.length:nextGroup;
  const body=lines.slice(tableAt+1,tableEnd).flatMap(l=>l.runs);
  const firstLines=listeningLines(layout,body.filter(i=>column(i)===0));
  const starts=[lines[tableAt].y+typical];
  for(let i=1;i<firstLines.length;i++)if(firstLines[i].y-firstLines[i-1].y>typical*3)
   starts.push(firstLines[i].y-typical*.5);
  const rows=starts.map(()=>headers.map(()=>[]));
  for(const id of body){const row=Math.max(0,starts.filter(y=>layout.runs[id][2]>=y).length-1);rows[row][column(id)].push(id);}
  html+='<table class="flow-table"><thead><tr>'+headers.map(h=>'<th scope="col">'+listeningWords(layout,h,p.page,false)+'</th>').join('')+'</tr></thead><tbody>';
  html+=rows.map(row=>'<tr>'+row.map((ids,c)=>'<td data-label="'+esc(headers[c].map(i=>layout.runs[i][0]).join(' '))+'">'+listeningLines(layout,ids).map(l=>listeningWords(layout,l.runs,p.page)).join(' ')+'</td>').join('')+'</tr>').join('');
  html+='</tbody></table>';
  for(const l of lines.slice(tableEnd))html+=paragraph(l);
 }
 if(layout.diagram)html+='<details class="flow-diagram"><summary>Xem sơ đồ tham khảo</summary>'+layoutSvg(layout,'Sơ đồ đề Listening, trang '+p.page,p.page)+'</details>';
 return '<section class="listening-text" data-page="'+p.page+'" aria-label="Đề Listening trang '+p.page+'">'+html+'</section>';
}
function setListeningFont(size){
 db.fontSize=Math.max(14,Math.min(28,size));
 $('#pages').style.setProperty('--listening-size',db.fontSize+'px');
 $('#font-size').textContent=db.fontSize+'px';
 $('#zoom-out').disabled=db.fontSize<=14;$('#zoom-in').disabled=db.fontSize>=28;
 closeStudyFloating();persist();
}
