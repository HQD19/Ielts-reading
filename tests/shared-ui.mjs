import assert from 'node:assert/strict';
import { chromium } from 'playwright';
import { pathToFileURL } from 'node:url';
import { resolve } from 'node:path';
import { mkdir } from 'node:fs/promises';
const browser=await chromium.launch({headless:true});
const errors=[];
await mkdir('test-results',{recursive:true});
try{
 const page=await browser.newPage({viewport:{width:1440,height:1000}});
 page.on('pageerror',e=>errors.push(e.message));
 const styles={};
 for(const [skill,file] of [['reading','index.html'],['listening','listening.html']]){
  await page.goto(pathToFileURL(resolve(file)).href);
  await page.waitForFunction(()=>document.querySelector('.brand-mark svg')&&document.querySelector('#palette button'));
  styles[skill]=await page.evaluate(()=>{
   const s=e=>{const c=getComputedStyle(e);return {font:c.fontFamily,color:c.color,background:c.backgroundColor,height:c.height};};
   return {body:s(document.body),header:s(document.querySelector('.topbar')),session:s(document.querySelector('.sessionbar')),button:s(document.querySelector('.sessionbar .primary')),nav:document.querySelector('.skill-nav [aria-current="page"]').textContent.trim()};
  });
  assert.equal(styles[skill].nav,skill==='reading'?'Reading':'Listening');
  assert.equal(await page.locator('.topbar').count(),1);
  assert.equal(await page.locator('.skill-nav a').count(),2);
  for(const width of [1920,1440,1024,850,768,701,700,600,390]){
   await page.setViewportSize({width,height:1000});
   const layout=await page.evaluate(()=>{
    const app=document.querySelector('.app'),header=document.querySelector('.topbar'),session=document.querySelector('.sessionbar'),workspace=document.querySelector('.workspace'),panes=workspace.querySelectorAll(':scope > .pane');
    const box=e=>{const r=e.getBoundingClientRect();return {x:r.x,y:r.y,w:r.width,h:r.height,right:r.right,bottom:r.bottom};};
    return {overflow:document.documentElement.scrollWidth>innerWidth+1,header:box(header),session:box(session),panes:[...panes].map(box),controls:[...header.querySelectorAll('a,select,button')].filter(e=>e.getBoundingClientRect().width).map(box),footer:box(document.querySelector('.footer'))};
   });
   assert.equal(layout.overflow,false,skill+' horizontal page overflow '+width);
   for(const c of layout.controls)assert.ok(c.x>=-1&&c.right<=width+1,skill+' header control outside viewport '+width+' '+JSON.stringify(c));
   if(width>700){
    assert.equal(Math.round(layout.header.h),76>0&&width>850?76:65);
   }
   if(width>600){assert.ok(Math.abs(layout.panes[0].w-layout.panes[1].w)<=1,skill+' panes must be 50/50 '+width);}
   assert.ok(layout.footer.h>0);
  }
  await page.setViewportSize({width:1440,height:1000});
  await page.screenshot({path:'test-results/'+skill+'-light.png',fullPage:true});
  const theme=skill==='reading'?'#theme-toggle':'#theme';
  await page.locator(theme).click();
  assert.equal(await page.locator('html').evaluate(e=>e.classList.contains('dark')),true);
  await page.screenshot({path:'test-results/'+skill+'-dark.png',fullPage:true});
  await page.locator(theme).click();
  await page.setViewportSize({width:390,height:1000});
  await page.screenshot({path:'test-results/'+skill+'-mobile.png',fullPage:true});
 }
 for(const key of ['body','header','button'])assert.deepEqual(styles.reading[key],styles.listening[key],'Shared '+key+' styles');
 assert.deepEqual(styles.reading.session,styles.listening.session,'Shared session bar');
 await page.setViewportSize({width:1440,height:1000});
 const font=await page.locator('.ocr-page').first().evaluate(e=>getComputedStyle(e).fontFamily);
 await page.goto(pathToFileURL(resolve('index.html')).href);
 assert.equal(font,await page.locator('.reading-body').evaluate(e=>getComputedStyle(e).fontFamily),'OCR and passage fonts match');
 await page.locator('#book-select').selectOption('13');
 await page.locator('#test-select').selectOption('2');
 assert.ok((await page.locator('#article').innerText()).length>500);
 await page.locator('#study-toggle').click();
 await page.locator('#timer-control').click();
 assert.ok(await page.locator('#timer').innerText());
 assert.deepEqual(errors,[]);
 console.log('PASS: shared shell/typography, 50/50 panes, nine viewport sizes, light/dark, six screenshots, Reading book/test/study/timer regression.');
}finally{await browser.close();}
