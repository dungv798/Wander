// API và giao diện thật của app preview; danh tính kiểm tra riêng, giữ nguyên dữ liệu đã có.
import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {seedIdentity,storedTrips} from '../web/e2e/seed.ts';
const {chromium}=createRequire(new URL('../web/package.json',import.meta.url))('playwright-core');
const base=process.env.WANDER_BASE_URL||'http://127.0.0.1:8787',out=process.env.WANDER_REVIEW_OUT||'.logs/completion-20261107/live-browser';fs.mkdirSync(out,{recursive:true});
const read=f=>JSON.parse(fs.readFileSync(f,'utf8'));
const ready=read('docs/research/completion-20261107/ready-500.json'),held=read('docs/research/completion-20261107/held-112.json');
const expected=fs.readdirSync('backend/src/main/resources/catalog').filter(f=>f.endsWith('.json')).map(f=>read('backend/src/main/resources/catalog/'+f));
async function get(url){const r=await fetch(base+url);assert.equal(r.status,200,url);return r.json();}
const summary=await get('/api/catalog/destinations');assert.equal(summary.destinations.length,20);assert.equal(summary.destinations.reduce((n,d)=>n+d.placeCount,0),704);
const actual=[];
for(const d of summary.destinations)actual.push((await get('/api/catalog/destinations/'+d.id)).destination);
const places=actual.flatMap(d=>d.places),ids=new Set(places.map(p=>p.id));
for(const d of expected){const a=actual.find(x=>x.id===d.id);assert.equal(a.places.length,d.places.length);for(const g of a.guide)for(const i of g.items)assert(!i.placeId||a.places.some(p=>p.id===i.placeId));}
for(const row of ready.venues){const a=places.find(p=>p.id===row.place.id);assert(a,row.place.id);for(const key of['name','summary','hook','lat','lon'])assert.equal(a[key],row.place[key],a.id+' '+key);for(const key of['kind','address','website','phone','serviceHours','priceNote'])assert.equal(a.venue[key],row.place.venue[key]||'',a.id+' '+key);}
assert(held.every(p=>!ids.has(p.id)));
const photos=read('docs/research/completion-20261107/approved-photos.json');
for(const p of photos){const r=await fetch(base+'/catalog/photos/'+p.photo.file);assert.equal(r.status,200,p.photo.file);assert.match(r.headers.get('content-type'),/^image\/jpeg/);await r.arrayBuffer();}
const browser=await chromium.launch({channel:'chrome',headless:true}),results=[];
const picks=[['ha-noi','am','Bun Cha Ta (Nguyen Huu Huan Street)'],['ha-noi','am','LE CLUB BAR · Sofitel Legend Metropole Hanoi'],['ha-noi','luu','Sofitel Legend Metropole Hanoi']];
const extra=[['ho-chi-minh','luu','Villa Song Saigon'],['nha-trang','luu','Nha Trang Lodge Hotel']];
try{for(const width of[390,1440]){
 const context=await browser.newContext({viewport:{width,height:width===390?844:1000},locale:'vi-VN',isMobile:width===390,hasTouch:width===390,reducedMotion:'reduce'}),page=await context.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));page.setDefaultTimeout(25000);
 try{
  await page.addInitScript(()=>{localStorage.setItem('wander.web.onboarding.v1','{"done":true}');localStorage.setItem('wander.web.destination.v1','ha-noi');});
  await page.goto(base+'/?intro=0#/dest/ha-noi/am',{waitUntil:'domcontentloaded'});await seedIdentity(page);
  const checked=[];
  for(const [dest,category,name]of [...extra,...picks]){
   const p=actual.find(d=>d.id===dest).places.find(p=>p.name===name);assert(p,name);
   await page.goto(base+'/?intro=0#/dest/'+dest+'/'+category,{waitUntil:'domcontentloaded'});
   const row=page.locator('[data-place-id="'+p.id+'"]');await row.waitFor();await row.scrollIntoViewIfNeeded();
   if(p.photos[0]?.caption)assert.equal(await row.locator('.pr-photo-caption').innerText(),p.photos[0].caption);
   await row.locator('.pr-photo').click();
   const dialog=page.getByRole('dialog',{name,exact:true});await dialog.waitFor();await dialog.getByText(p.summary,{exact:true}).waitFor();
   if(p.venue.phone)await dialog.getByText('Số liên hệ: '+p.venue.phone,{exact:true}).waitFor();
   for(const k of ['serviceHours','priceNote'])if(p.venue[k])assert.ok((await dialog.locator('.place-facts').allTextContents()).join(' ').includes(p.venue[k]));
   if(p.photos.length){await dialog.locator('.pd-photo img[data-image-ready="true"]').waitFor();await dialog.getByRole('link',{name:'Trang ảnh gốc',exact:true}).first().waitFor();if(p.photos[0].caption)assert.equal(await dialog.locator('.pd-photo-caption').first().innerText(),p.photos[0].caption);}
   assert.deepEqual(await page.locator('#screen,[role="dialog"],.place-facts,.place-info-card').evaluateAll(es=>es.filter(e=>e.clientWidth&&e.scrollWidth>e.clientWidth+1).map(e=>e.className)),[]);
   await page.screenshot({path:path.join(out,width+'-'+p.id+'.png')});checked.push({id:p.id,name,kind:p.venue.kind,photos:p.photos.length});
   await dialog.getByRole('button',{name:'Đóng',exact:true}).click();
   if(dest==='ha-noi')await row.getByRole('button',{name:/^Chọn /}).click();
  }
  await page.goto(base+'/?intro=0#/dest/ha-noi/am',{waitUntil:'domcontentloaded'});await page.locator('#tabbar .tab').filter({hasText:'Đã chọn'}).click();
  await page.locator('.picked-row').first().waitFor();assert.equal(await page.locator('.picked-row').count(),3);
  await page.locator('.picked-create .btn').click();const form=page.getByRole('dialog').last(),name='Kiểm tra catalog mới '+width;
  await form.getByLabel('Tên chuyến đi',{exact:true}).fill(name);await form.getByRole('button',{name:'Xác nhận',exact:true}).click();await page.waitForURL(/#\/trip\/[^/]+\/un$/);await page.locator('.unassigned-tab .itinerary-stop').first().waitFor();
  const trip=(await storedTrips(page)).trips.find(t=>t.name===name);assert(trip);assert.equal(trip.items.length,3);
  for(const [,,name]of picks){const p=places.find(p=>p.name===name),item=trip.items.find(i=>i.placeId===p.id);assert(item);assert.equal(item.type,p.venue.kind==='bar'?'rest':p.venue.kind==='lodging'?'lodging':'food');assert.equal(item.costK,null);assert.equal(item.day,null);}
  await page.reload({waitUntil:'domcontentloaded'});await page.locator('.unassigned-tab .itinerary-stop').first().waitFor();assert.equal((await storedTrips(page)).trips.find(t=>t.id===trip.id)?.items.length,3);
  await page.screenshot({path:path.join(out,width+'-saved-trip.png')});assert.deepEqual(errors,[]);results.push({width,status:'PASS',checked,tripId:trip.id,tripItems:3,reloadPreservedTrip:true,errors});
 }catch(e){await page.screenshot({path:path.join(out,width+'-FAILED.png')}).catch(()=>{});results.push({width,status:'FAIL',error:e.message,errors});}finally{await context.close();}
 console.log(JSON.stringify(results.at(-1)));
}}finally{await browser.close();}
const result={checkedAt:new Date().toISOString(),baseUrl:base,mode:'LIVE_JAVA_API_AND_BUILT_FRONTEND',api:{destinations:20,catalogPlaces:704,matchedCompletedVenues:400,heldAbsent:112,licensedPhotosServed:photos.length},browser:results};
fs.writeFileSync(out+'/result.json',JSON.stringify(result,null,2)+'\n');process.exitCode=results.every(r=>r.status==='PASS')?0:1;
