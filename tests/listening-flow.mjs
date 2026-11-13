import assert from 'node:assert/strict';
import {chromium} from 'playwright';
import {resolve} from 'node:path';
import {pathToFileURL} from 'node:url';
import {mkdir} from 'node:fs/promises';
const browser=await chromium.launch({headless:true});
try{
 const page=await browser.newPage({viewport:{width:1440,height:1000}}),errors=[];
 page.on('pageerror',e=>errors.push(e.message));
 await page.goto(pathToFileURL(resolve('listening.html')).href);
 await page.evaluate(()=>localStorage.clear());await page.reload();
 assert.equal(await page.locator('.listening-text').first().evaluate(e=>getComputedStyle(e).fontSize),'18px');
 for(let i=0;i<10;i++)await page.locator('#zoom-in').evaluate(e=>e.click());
 assert.equal(await page.locator('#font-size').innerText(),'28px');
 assert.equal(await page.locator('#zoom-in').isDisabled(),true);
 await page.reload();assert.equal(await page.locator('#font-size').innerText(),'28px');
 await page.locator('[data-part="2"]').click();assert.equal(await page.locator('#font-size').innerText(),'28px');
 for(let i=0;i<10;i++)await page.locator('#zoom-out').evaluate(e=>e.click());
 assert.equal(await page.locator('#font-size').innerText(),'14px');
 assert.equal(await page.locator('#zoom-out').isDisabled(),true);
 // Simulate an existing SVG-era backup: its original page/run offsets still work.
 await page.evaluate(()=>{
  part=1;const p=current.pages.find(p=>p.part===1),run=p.layout.runs.findIndex(r=>/^[A-Za-z]{7,}$/.test(r[0]));
  state().highlights=[{id:'legacy-svg-mark',segments:[{page:p.page,run,start:1,end:4}]}];persist();render();
 });
 assert.equal(await page.locator('mark[data-highlight="legacy-svg-mark"]').count(),1);
 const old=await page.locator('mark[data-highlight="legacy-svg-mark"]').innerText();
 await page.locator('#zoom-in').click();
 assert.equal(await page.locator('mark[data-highlight="legacy-svg-mark"]').innerText(),old);
 // Select across an existing <mark> and plain text, keeping original offsets.
 await page.locator('mark[data-highlight="legacy-svg-mark"]').evaluate(mark=>{
  const word=mark.parentElement,r=document.createRange();r.selectNodeContents(word);
  getSelection().removeAllRanges();getSelection().addRange(r);word.dispatchEvent(new MouseEvent('mouseup',{bubbles:true}));
 });
 await page.locator('#selection-mark').click();
 assert.equal(await page.evaluate(()=>state().highlights.at(-1).segments[0].start),0);
 const failures=await page.evaluate(()=>{
  const out=[];for(const test of TESTS){current=test;for(let n=1;n<=4;n++){
   part=n;render();
   for(const p of test.pages.filter(p=>p.part===n)){
    const words=[...document.querySelectorAll('.listening-text[data-page="'+p.page+'"] .source-word')];
    const ids=words.map(e=>+e.dataset.run);
    if(new Set(ids).size!==p.layout.runs.length||ids.length!==p.layout.runs.length)out.push(test.id+':'+n+':missing/duplicate runs');
   }
   if(document.querySelectorAll('[data-answer]').length!==10)out.push(test.id+':'+n+':answers');
  }}return out;
 });
 assert.deepEqual(failures,[],'All 240 parts preserve every OCR word exactly once');
 await mkdir('test-results',{recursive:true});
 for(const [book,id] of [[10,'c10l1'],[13,'c13l1']]){
  await page.evaluate(id=>{current=TESTS.find(t=>t.id===id);part=1;db.fontSize=18;render();},id);
  for(const [width,size] of [[1440,18],[1024,28],[390,28]]){
   await page.setViewportSize({width,height:1000});
   await page.evaluate(size=>setListeningFont(size),size);
   assert.ok(await page.locator('#source-scroll').evaluate(e=>e.scrollWidth<=e.clientWidth+1),'No horizontal question overflow '+book+':'+width+':'+size);
   assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));
   await page.screenshot({path:'test-results/flow-cam'+book+'-'+width+'.png'});
  }
 }
 // Checked against the original PDF pages, not only word counts.
 await page.evaluate(()=>{current=TESTS.find(t=>t.id==='c10l1');part=1;render();});
 assert.deepEqual(await page.locator('.listening-text[data-page="4"] .answer-space').count(),6);
 assert.equal(await page.locator('.listening-text[data-page="5"] .answer-space').count(),4);
 const table=page.locator('.listening-text[data-page="5"] table');
 assert.equal(await table.locator('thead th').count(),5);
 assert.ok((await table.locator('tbody tr').first().innerText()).includes('£525'));
 assert.ok((await table.locator('tbody tr').nth(1).innerText()).includes('9 £'));
 assert.equal(await table.locator('[data-run="26"] + .answer-space').count(),0,'9 days is a duration, never an answer blank');
 await page.evaluate(()=>{current=TESTS.find(t=>t.id==='c13l1');part=1;render();});
 assert.equal(await page.locator('.listening-text[data-page="11"] .answer-space').count(),10);
 const cells=page.locator('tbody tr').nth(2).locator('td');
 assert.match(await cells.nth(1).innerText(),/mainly\s+8[\s_]+food/);
 assert.match(await page.locator('tbody tr').nth(1).locator('td').nth(2).innerText(),/free\s+6[\s_]+every Thursday/);
 await page.setViewportSize({width:1440,height:1000});
 await page.evaluate(()=>{current=TESTS.find(t=>t.id==='c20l1');part=3;db.fontSize=18;render();theme(true);});
 const prompt=page.locator('.flow-prompt').filter({hasText:'Which TWO things'});
 assert.equal(await prompt.count(),1);
 assert.ok((await prompt.innerText()).includes('increase in loneliness?'));
 assert.ok(await prompt.evaluate(e=>parseFloat(getComputedStyle(e).fontSize))>18);
 assert.equal(await page.locator('.listening-text[data-page="8"] .flow-prompt').count(),3);
 assert.equal(await page.locator('.listening-text[data-page="9"] .flow-prompt').count(),4);
 assert.ok((await page.locator('.listening-text[data-page="8"]').innerText()).includes('A–E.'));
 await page.screenshot({path:'test-results/cam20-prompts-dark.png'});
 assert.deepEqual(errors,[]);
 console.log('PASS: real font sizing 14–28px, bounds/persistence, legacy highlights, nested selection, every word in 240 parts, notes/tables at desktop/mobile, no horizontal overflow.');
}finally{await browser.close();}
