import fs from 'node:fs';
import path from 'node:path';
import { chromium } from 'playwright-core';
const root=process.cwd(), out=path.join(root,'docs/design/crops');
const files=fs.readdirSync('docs/UI-sample-2').filter(x=>/\.jpg$/i.test(x)).sort();
const browser=await chromium.launch({channel:'chrome',headless:true});
const page=await browser.newPage({viewport:{width:1600,height:1200}});
const rows=[];
for(let i=0;i<files.length;i++){
 const src='data:image/jpeg;base64,'+fs.readFileSync(path.join('docs/UI-sample-2',files[i])).toString('base64');
 const id=`R${String(i+1).padStart(2,'0')}`;
 const result=await page.evaluate(async({src,id})=>{
  let im=new Image(); im.src=src; await im.decode();
  if(id==='R37'){const redacted=document.createElement('canvas');redacted.width=im.width;redacted.height=im.height;const rc=redacted.getContext('2d');rc.drawImage(im,0,0);rc.fillStyle='#fff';rc.fillRect(0,im.height*.115,im.width,im.height*.12);rc.fillStyle='#14213a';rc.font='40px sans-serif';rc.fillText('[Thông tin cá nhân đã che]',45,im.height*.17);im=redacted;}
  const w=im.width,h=im.height;
  const crop=(x,y,cw,ch,scale=1)=>{const c=document.createElement('canvas');c.width=cw*scale;c.height=ch*scale;c.getContext('2d').drawImage(im,x,y,cw,ch,0,0,c.width,c.height);return c.toDataURL('image/png').split(',')[1];};
  return {w,h,full:crop(0,0,w,h,390/w),top:crop(0,Math.round(h*.07),w,Math.round(h*.34),780/w),bottom:crop(0,Math.round(h*.72),w,Math.floor(h*.28),780/w)};
 },{src,id});
 for(const type of ['full','top','bottom'])fs.writeFileSync(path.join(out,`${id}-${type}.png`),Buffer.from(result[type],'base64'));
 rows.push({id,file:files[i],width:result.w,height:result.h});
}
fs.writeFileSync(path.join(out,'manifest.json'),JSON.stringify(rows,null,2));
for(let i=0;i<rows.length;i+=4){
 const batch=rows.slice(i,i+4);
 await page.setContent(`<body style="margin:0;display:flex;background:#ddd">${batch.map(r=>`<div style="width:390px"><b>${r.id}</b><img width="390" src="data:image/png;base64,${fs.readFileSync(path.join(out,r.id+'-full.png')).toString('base64')}"></div>`).join('')}</body>`);
 await page.screenshot({path:path.join(out,`sheet-${Math.floor(i/4)+1}.png`),fullPage:true});
}
await browser.close();
console.log(JSON.stringify({images:rows.length,sizes:[...new Set(rows.map(r=>`${r.width}x${r.height}`))],sheets:Math.ceil(rows.length/4)}));
