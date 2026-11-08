// Kiểm tra giao diện với JSON thật; API catalog giả lập cô lập, không ghi danh tính/chuyến của người dùng.
import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {startCatalogStub} from '../web/scripts/catalogStub.mjs';
const {chromium}=createRequire(new URL('../web/package.json',import.meta.url))('playwright-core');
const base=process.env.WANDER_UI_URL||'http://127.0.0.1:5173',output='.logs/completion-20261107/browser';fs.mkdirSync(output,{recursive:true});
const close=await startCatalogStub(18991),browser=await chromium.launch({channel:'chrome',headless:true}),results=[];
const all=fs.readdirSync('backend/src/main/resources/catalog').filter(f=>f.endsWith('.json')).map(f=>JSON.parse(fs.readFileSync('backend/src/main/resources/catalog/'+f,'utf8')));
const selections=[['ha-noi','am','Bun Cha Ta (Nguyen Huu Huan Street)'],['ha-noi','am','LE CLUB BAR · Sofitel Legend Metropole Hanoi'],['ho-chi-minh','luu','Villa Song Saigon']];
try{for(const width of[390,1440]){
 const context=await browser.newContext({viewport:{width,height:width===390?844:1000},locale:'vi-VN',isMobile:width===390,hasTouch:width===390,reducedMotion:'reduce'}),page=await context.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));page.setDefaultTimeout(20000);
 await page.route('**/api/catalog/**',async route=>{const u=new URL(route.request().url());const response=await route.fetch({url:'http://127.0.0.1:18991'+u.pathname+u.search});await route.fulfill({response});});
 await page.addInitScript(()=>{localStorage.setItem('wander.web.onboarding.v1','{"done":true}');localStorage.setItem('wander.web.destination.v1','ha-noi');});
 try{for(const[dest,category,name]of selections){
  const p=all.find(d=>d.id===dest).places.find(p=>p.name===name);assert(p,name);
  await page.goto(base+'/?intro=0#/dest/'+dest+'/'+category,{waitUntil:'domcontentloaded'});
  const row=page.locator('[data-place-id="'+p.id+'"]');await row.waitFor();await row.scrollIntoViewIfNeeded();await row.locator('.pr-photo').click();
  const dialog=page.getByRole('dialog',{name,exact:true});await dialog.waitFor();await dialog.getByText(p.summary,{exact:true}).waitFor();
  if(p.venue.phone)await dialog.getByText('Số liên hệ: '+p.venue.phone,{exact:true}).waitFor();
  if(p.venue.serviceHours)assert.ok((await dialog.locator('.place-facts').allTextContents()).join(' ').includes(p.venue.serviceHours));
  if(p.venue.priceNote)assert.ok((await dialog.locator('.place-facts').allTextContents()).join(' ').includes(p.venue.priceNote));
  if(p.photos.length){await dialog.locator('.pd-photo img[data-image-ready="true"]').waitFor();await dialog.getByRole('link',{name:'Trang ảnh gốc',exact:true}).first().waitFor();}
  const overflow=await page.locator('#screen,[role="dialog"],.place-facts,.place-info-card').evaluateAll(es=>es.filter(e=>e.clientWidth&&e.scrollWidth>e.clientWidth+1).map(e=>e.className));assert.deepEqual(overflow,[]);
  await page.screenshot({path:path.join(output,width+'-'+p.venue.kind+'.png')});
  results.push({width,name,id:p.id,phone:!!p.venue.phone,hours:!!p.venue.serviceHours,priceNote:!!p.venue.priceNote,photos:p.photos.length,status:'PASS'});
 }
 assert.deepEqual(errors,[]);
 }catch(e){await page.screenshot({path:path.join(output,width+'-FAILED.png')}).catch(()=>{});results.push({width,status:'FAIL',error:e.message,errors});}finally{await context.close();}
}}finally{await browser.close();await close();fs.writeFileSync(output+'/result.json',JSON.stringify(results,null,2)+'\n');}
console.log(JSON.stringify(results,null,2));process.exitCode=results.every(r=>r.status==='PASS')?0:1;
