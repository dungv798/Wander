import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import { chromium } from 'playwright-core';
const root = path.resolve('.logs/onboarding-20261107'); fs.mkdirSync(root,{recursive:true});
const browser = await chromium.launch({channel:'chrome',headless:true});
const report=[];
try {
 const widths=(process.env.WANDER_ONBOARD_WIDTHS??'390,1440').split(',').map(Number);
 for(const width of widths) {
  const context=await browser.newContext({viewport:{width,height:width===320?667:width===390?844:1000},locale:'vi-VN'});
  const page=await context.newPage(), errors=[]; page.on('pageerror',e=>errors.push(e.message));
  await page.goto('http://127.0.0.1:8787/?intro=0#/onboard');
  await page.locator('.ob-dots button').first().click();
  for(let scene=0;scene<4;scene++) {
   await page.locator('.ob-dots button').nth(scene).click();
   await page.waitForTimeout(scene>=2?12000:900);
   if(scene===2) await page.getByRole('tab',{name:'Ngày 1',exact:true}).click();
   await page.waitForTimeout(1200);
   await page.screenshot({path:path.join(root,`${width}-${scene}.png`)});
   const check=await page.evaluate(()=>({overflow:document.documentElement.scrollWidth>innerWidth+1,stage:document.querySelector('.ob-stage').getBoundingClientRect().toJSON(),buttons:[...document.querySelectorAll('.ob button')].filter(b=>b.checkVisibility()).map(b=>({text:b.textContent,label:b.getAttribute('aria-label'),box:b.getBoundingClientRect().toJSON(),disabled:b.disabled})),map:document.querySelector('.ob-map .tmroot')?.dataset.ready}));
   const smallButtons=await page.locator('.ob button').evaluateAll(buttons=>buttons.filter(b=>!b.disabled&&!b.closest('[aria-hidden="true"], [inert]')&&b.checkVisibility({checkOpacity:true,checkVisibilityCSS:true})).filter(b=>{const r=b.getBoundingClientRect();return r.width<43.9||r.height<43.9;}).map(b=>({text:b.textContent,width:b.getBoundingClientRect().width,height:b.getBoundingClientRect().height})));
   assert.deepEqual(smallButtons,[],`${width} / scene ${scene}: touch targets >=44 px`);
   assert.equal(check.overflow,false);
   assert.deepEqual(errors,[]);
   if(scene===3){
    const overlaps=await page.evaluate(()=>[['.ob-sharebtn','.ob-concept'],['.ob-members','.ob-tabs']].filter(([a,b])=>{const x=document.querySelector(a)?.getBoundingClientRect(),y=document.querySelector(b)?.getBoundingClientRect();return x&&y&&x.width&&y.width&&x.left<y.right&&x.right>y.left&&x.top<y.bottom&&x.bottom>y.top;}));
    assert.deepEqual(overlaps,[],`${width}: share/member controls do not overlap labels or tabs`);
   }
   report.push({width,scene,...check,errors:[...errors]});
  }
  await context.close();
 }
} finally {await browser.close();fs.writeFileSync(path.join(root,'result.json'),JSON.stringify(report,null,2));}
console.log(JSON.stringify(report.map(r=>({width:r.width,scene:r.scene,overflow:r.overflow,map:r.map,errors:r.errors}))));
