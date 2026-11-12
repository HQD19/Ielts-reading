import assert from 'node:assert/strict';
import { chromium } from 'playwright';
import { pathToFileURL } from 'node:url';
import { resolve } from 'node:path';
import { mkdtemp } from 'node:fs/promises';
import { tmpdir } from 'node:os';
const browser=await chromium.launch({headless:true});
const page=await browser.newPage({viewport:{width:1440,height:1000}});
const errors=[];page.on('pageerror',e=>errors.push(e.message));
try{
 await page.goto(pathToFileURL(resolve('listening.html')).href);
 await page.evaluate(()=>{localStorage.clear();});await page.reload();
 assert.equal(await page.locator('audio').count(),0);
 await page.evaluate(()=>localStorage.setItem('reading-room:c20:v1','reading-progress-sentinel'));
 const target=await page.locator('#pages tspan').evaluateAll(spans=>{
  const s=spans.find(s=>s.textContent.trim().length>=7&&/^[A-Za-z]+$/.test(s.textContent.trim()));
  if(!s)throw Error('No selectable word');
  return {page:s.dataset.page,run:s.dataset.run,length:s.textContent.trim().length};
 });
 const selector='#pages tspan[data-page="'+target.page+'"][data-run="'+target.run+'"]';
 await page.locator(selector).evaluate(span=>{
  const range=document.createRange();range.setStart(span.firstChild,1);range.setEnd(span.firstChild,4);
  getSelection().removeAllRanges();getSelection().addRange(range);
  span.dispatchEvent(new MouseEvent('mouseup',{bubbles:true}));
 });
 await page.locator('#selection-tools').waitFor({state:'visible'});
 await page.locator('#selection-mark').click();
 assert.equal(await page.locator('.highlight-layer rect').count(),1);
 const h=await page.evaluate(()=>state().highlights[0]);
 assert.equal(h.segments[0].start,1);assert.equal(h.segments[0].end,4);
 const wordWidth=await page.locator(selector).evaluate(s=>s.getBoundingClientRect().width);
 const markWidth=await page.locator('.highlight-layer rect').evaluate(s=>s.getBoundingClientRect().width);
 assert.ok(markWidth>0&&markWidth<wordWidth,'Partial highlight should not cover entire word');
 await page.locator('[data-part="2"]').click();
 assert.equal(await page.locator('.highlight-layer rect').count(),0);
 await page.locator('[data-part="1"]').click();
 assert.equal(await page.locator('.highlight-layer rect').count(),1);
 await page.reload();
 assert.equal(await page.locator('.highlight-layer rect').count(),1);
 await page.locator('#zoom-in').click();
 assert.ok(await page.locator('.highlight-layer rect').evaluate(s=>s.getBoundingClientRect().width)>markWidth);
 await page.locator(selector).click();
 await page.locator('#selection-remove').waitFor({state:'visible'});
 await page.locator('#selection-remove').click();
 assert.equal(await page.locator('.highlight-layer rect').count(),0);
 await page.locator('#pages .ocr-text').first().evaluate(group=>{
  const spans=[...group.querySelectorAll('tspan')].slice(0,5);
  const range=document.createRange();range.setStart(spans[0].firstChild,0);range.setEnd(spans.at(-1).firstChild,spans.at(-1).textContent.trim().length);
  getSelection().removeAllRanges();getSelection().addRange(range);
  spans.at(-1).dispatchEvent(new MouseEvent('mouseup',{bubbles:true}));
 });
 await page.locator('#selection-mark').waitFor({state:'visible'});await page.locator('#selection-mark').click();
 assert.ok(await page.locator('.highlight-layer rect').count()>1,'Multi-word selection should be retained');
 const expected=await page.evaluate(()=>JSON.stringify(state().highlights));
 await page.locator('#a-1').fill('saved answer');
 await page.locator('[data-flag="1"]').click();
 const dir=await mkdtemp(resolve(tmpdir(),'listening-study-'));
 await page.locator('#settings').click();
 const downloadEvent=page.waitForEvent('download');await page.locator('#export').click();const download=await downloadEvent;
 const backup=resolve(dir,'backup.json');await download.saveAs(backup);
 await page.locator('[data-close]').click();
 await page.locator('#settings').click();await page.locator('#reset').click();await page.locator('#confirm-reset').click();
 assert.equal(await page.evaluate(()=>JSON.stringify(state().highlights)),expected,'Reset keeps highlights like Reading');
 assert.equal(await page.locator('#a-1').inputValue(),'');
 await page.locator('#settings').click();await page.locator('#import').setInputFiles(backup);
 await page.locator('#dialog').waitFor({state:'hidden'});
 assert.equal(await page.locator('#a-1').inputValue(),'saved answer');
 assert.equal(await page.evaluate(()=>JSON.stringify(state().highlights)),expected);
 assert.deepEqual(await page.evaluate(()=>state().flags),[1]);
 const cleaned=await page.evaluate(()=>{
  const raw=structuredClone(db);raw.states[current.id].highlights.push({id:'invalid',segments:[{page:99999,run:1,start:0,end:9}]});
  return cleanStore(raw).states[current.id].highlights.length;
 });
 assert.equal(cleaned,1,'Malformed imported highlights should be discarded');
 assert.deepEqual(await page.evaluate(()=>cleanStore({version:1,states:{[current.id]:{answers:{1:'old'},remaining:900}}}).states[current.id].highlights),[]);
 let requests=0;
 await page.route('https://api.dictionaryapi.dev/**',async route=>{
  requests++;const word=decodeURIComponent(new URL(route.request().url()).pathname.split('/').at(-1));
  if(word==='missingentry'){await route.fulfill({status:404,body:'[]',headers:{'Access-Control-Allow-Origin':'*'}});return;}
  if(word==='slowword')await new Promise(r=>setTimeout(r,200));
  const body=JSON.stringify([{phonetic:'/test/',meanings:[{partOfSpeech:'noun',definitions:[{definition:word==='unsafeentry'?'<img src=x onerror=alert(1)>':word+' definition'}]}],sourceUrls:['https://example.org/dictionary'],license:{name:'CC BY-SA',url:'https://example.org/license'}}]);
  try{await route.fulfill({status:200,contentType:'application/json',body,headers:{'Access-Control-Allow-Origin':'*'}});}catch{}
 });
 await page.locator('#lookup-open').click();await page.locator('#lookup-query').fill('discount');await page.locator('#lookup-query').press('Enter');
 await page.waitForFunction(()=>document.querySelector('#lookup-results').textContent.includes('giảm giá'));
 assert.equal(requests,0,'Local Vietnamese dictionary should work without network');
 await page.locator('#lookup-query').fill('unsafeentry');await page.locator('#lookup-query').press('Enter');
 await page.waitForFunction(()=>document.querySelector('#lookup-results').textContent.includes('<img'));
 assert.equal(await page.locator('#lookup-results img').count(),0,'Dictionary text must be escaped');
 await page.locator('#lookup-query').fill('missingentry');await page.locator('#lookup-query').press('Enter');
 await page.waitForFunction(()=>document.querySelector('#lookup-results').textContent.includes('Chưa tìm thấy'));
 assert.ok((await page.locator('#lookup-cambridge').getAttribute('href')).endsWith('/missingentry'));
 await page.locator('#lookup-query').fill('slowword');await page.locator('#lookup-query').press('Enter');
 await page.locator('#lookup-query').fill('quickword');await page.locator('#lookup-query').press('Enter');
 await page.waitForFunction(()=>document.querySelector('#lookup-results').textContent.includes('quickword definition'));
 await page.waitForTimeout(250);
 assert.ok(!(await page.locator('#lookup-results').innerText()).includes('slowword definition'),'Old lookup must not replace newer lookup');
 await page.keyboard.press('Escape');await page.locator('#word-lookup').waitFor({state:'hidden'});
 await page.locator('#theme').click();assert.ok(await page.locator('html').evaluate(e=>e.classList.contains('dark')));
 assert.ok(await page.locator('.highlight-layer rect').count()>1);
 assert.equal(await page.evaluate(()=>localStorage.getItem('reading-room:c20:v1')),'reading-progress-sentinel','Reading progress must not change');
 const coverage=await page.evaluate(()=>{
  const failures=[];for(const t of TESTS){current=t;for(let n=1;n<=4;n++){part=n;tab='sheet';render();if(document.querySelectorAll('[data-answer]').length!==10)failures.push(t.id+':'+n);}}
  return failures;
 });
 assert.deepEqual(coverage,[]);
 assert.deepEqual(errors,[]);
 console.log('PASS: partial/multiple highlight, remove, zoom, reload, test/part isolation, reset, backup/import, legacy state, offline/online lookup, race protection, escaping, dark mode, 240 parts and Reading progress.');
}finally{await browser.close();}
