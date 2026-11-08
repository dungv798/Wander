/** Bản production/API thật, mobile và desktop; tạo danh tính riêng, không xóa dữ liệu review. */
import fs from 'node:fs';import path from 'node:path';import assert from 'node:assert/strict';import {createRequire} from 'node:module';
import {seedIdentity,storedTrips} from '../web/e2e/seed.ts';
const {chromium}=createRequire(new URL('../web/package.json',import.meta.url))('playwright-core'),base=process.env.WANDER_BASE_URL??'http://127.0.0.1:8787',out=path.resolve('.logs/food-venues-browser');fs.mkdirSync(out,{recursive:true});
const browser=await chromium.launch({channel:'chrome',headless:true}),results=[];
try{for(const width of[390,1440]){const context=await browser.newContext({viewport:{width,height:width===390?844:1000},locale:'vi-VN',hasTouch:width===390,isMobile:width===390,reducedMotion:'reduce'}),page=await context.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));page.setDefaultTimeout(20000);
try{
 await page.addInitScript(()=>{localStorage.setItem('wander.web.onboarding.v1','{"done":true}');localStorage.setItem('wander.web.destination.v1','ha-noi');});
 await page.goto(base+'/?intro=0#/dest/ha-noi/am',{waitUntil:'domcontentloaded'});await seedIdentity(page);
 const cafe=page.locator('[data-place-id="venue-ha-noi-giang"]');await cafe.waitFor();await cafe.scrollIntoViewIfNeeded();await cafe.locator('.pr-photo').click();
 const detail=page.getByRole('dialog',{name:'Café Giảng · Nguyễn Hữu Huân',exact:true});await detail.waitFor();
 await detail.getByText('39 Nguyễn Hữu Huân, Hà Nội',{exact:true}).waitFor();
 assert.equal(await detail.getByText('Nên đi buổi nào',{exact:true}).count(),0,'Quán chưa có khung giờ không hiện bốn buổi tham quan vô nghĩa');
 assert.equal(await detail.locator('a[href="https://cafegiang.vn/"]').count(),2);
 assert.ok((await detail.getByRole('link',{name:/Tìm trên Google Maps/}).getAttribute('href')).includes('maps/search/'));
 await detail.locator('.pd-photo img[data-image-ready="true"]').waitFor();await page.screenshot({path:path.join(out,`${width}-cafe-detail.png`)});
 await detail.getByRole('button',{name:'Đóng',exact:true}).click();await cafe.getByRole('button',{name:/^Chọn /}).click();
 await page.goto(base+'/?intro=0#/dest/ha-noi/luu',{waitUntil:'domcontentloaded'});
 const hotel=page.locator('[data-place-id="venue-ha-noi-metropole"]');await hotel.waitFor();await hotel.scrollIntoViewIfNeeded();await hotel.locator('.pr-photo').click();
 const stay=page.getByRole('dialog',{name:'Sofitel Legend Metropole Hanoi',exact:true});await stay.waitFor();await stay.getByRole('link',{name:/Xem phòng & liên hệ/}).waitFor();await page.screenshot({path:path.join(out,`${width}-hotel-detail.png`)});await stay.getByRole('button',{name:'Đóng',exact:true}).click();await hotel.getByRole('button',{name:/^Chọn /}).click();
 await page.locator('#tabbar .tab').filter({hasText:'Đã chọn'}).click();await page.locator('.picked-row').first().waitFor();assert.equal(await page.locator('.picked-row').count(),2);
 await page.locator('.picked-create .btn').click();const form=page.getByRole('dialog').last(),name=`Hà Nội · món và chỗ nghỉ ${width}`;await form.getByLabel('Tên chuyến đi',{exact:true}).fill(name);await form.getByRole('button',{name:'Xác nhận',exact:true}).click();await page.waitForURL(/#\/trip\/[^/]+\/un$/);await page.locator('.unassigned-tab .itinerary-stop').first().waitFor();
 const trip=(await storedTrips(page)).trips.find(t=>t.name===name);assert.ok(trip);const coffee=trip.items.find(i=>i.placeId==='venue-ha-noi-giang'),bed=trip.items.find(i=>i.placeId==='venue-ha-noi-metropole');assert.equal(coffee?.type,'rest');assert.equal(coffee.booking,null);assert.equal(coffee.costK,null);assert.equal(bed?.type,'lodging');assert.equal(bed.booking,'pending');assert.equal(bed.day,null);
 const overflow=await page.locator('#screen, [role="dialog"], .dbody, .place-list').evaluateAll(es=>es.filter(e=>e.clientWidth&&e.scrollWidth>e.clientWidth+1).map(e=>e.className));assert.deepEqual(overflow,[]);await page.screenshot({path:path.join(out,`${width}-saved-trip.png`)});
 // Kiểm thêm đường lưu trực tiếp từ chi tiết, nơi trước đây làm rơi metadata quán.
 await page.goto(base+'/?intro=0#/dest/ha-noi/am',{waitUntil:'domcontentloaded'});await cafe.waitFor();await cafe.scrollIntoViewIfNeeded();await cafe.locator('.pr-photo').click();await detail.getByRole('button',{name:'Chọn cho chuyến',exact:true}).click();
 const direct=page.getByRole('dialog').last(),directName=`Cà phê từ chi tiết ${width}`;await direct.getByLabel('Tên chuyến đi',{exact:true}).fill(directName);await direct.getByRole('button',{name:'Xác nhận',exact:true}).click();await page.waitForURL(/#\/trip\/[^/]+\/un$/);await page.locator('.unassigned-tab .itinerary-stop').first().waitFor();
 const directTrip=(await storedTrips(page)).trips.find(t=>t.name===directName);assert.equal(directTrip?.items[0]?.type,'rest');assert.equal(directTrip.items[0].booking,null);assert.deepEqual(errors,[]);
 results.push({width,status:'PASS',tripId:trip.id,directTripId:directTrip.id,cafe:coffee.type,hotel:bed.type,errors});
}catch(e){await page.screenshot({path:path.join(out,`${width}-FAILED.png`)}).catch(()=>{});results.push({width,status:'FAIL',error:e.message,errors});}finally{await context.close();}console.log(JSON.stringify(results.at(-1)));}}finally{await browser.close();fs.writeFileSync(path.join(out,'result.json'),JSON.stringify(results,null,2)+'\n');}process.exitCode=results.every(r=>r.status==='PASS')?0:1;
