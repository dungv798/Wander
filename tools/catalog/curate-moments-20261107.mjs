import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { momentSeeds } from './moment-seeds-20261107.mjs';
const root=path.resolve(import.meta.dirname,'../..'),stage=path.join(root,'.logs/moments-20261107'),file=path.join(root,'docs/research/moment-candidates-20261107.json');
fs.mkdirSync(stage,{recursive:true});
const manifest=fs.existsSync(file)?JSON.parse(fs.readFileSync(file,'utf8')):{checkedAt:'2026-11-07',licenseUrl:'https://www.pexels.com/license/',method:'Specific free first-party photo pages; downloaded individually and reviewed before append. No regional photo silently attached to a POI.',photos:[]};
for(const [id,dest,author,slug,theme,caption,locationEvidence] of momentSeeds) if(!manifest.photos.some(p=>p.id===id)) manifest.photos.push({id,dest,author,theme,caption,locationEvidence,sourceUrl:slug.startsWith('https:')?slug:`https://www.pexels.com/photo/${slug}-${id}/`,status:'candidate'});
fs.writeFileSync(file,JSON.stringify(manifest,null,2)+'\n');
if(process.argv.includes('--download')) for(const p of manifest.photos) {
 const target=path.join(stage,`${p.id}.jpg`); if(fs.existsSync(target))continue;
 const response=await fetch(`https://images.pexels.com/photos/${p.id}/pexels-photo-${p.id}.jpeg?auto=compress&cs=tinysrgb&w=1280`,{signal:AbortSignal.timeout(30000)});
 if(!response.ok)throw new Error(`Photo ${p.id}: ${response.status}`);
 const bytes=Buffer.from(await response.arrayBuffer());if(bytes[0]!==255||bytes[1]!==216)throw new Error('Not JPEG');
 fs.writeFileSync(target,bytes);console.log(`${p.id}: ${bytes.length}`);
}
if(process.argv.includes('--sheets')) {
 const {chromium}=await import('playwright-core'),browser=await chromium.launch({channel:'chrome',headless:true});
 try {
 const page=await browser.newPage({viewport:{width:1440,height:1100}});
 for(let i=0;i<manifest.photos.length;i+=12) {
  const photos=manifest.photos.slice(i,i+12);
  await page.setContent(`<meta charset=utf-8><style>body{font:14px system-ui;background:#edf2ee}.grid{display:grid;grid-template-columns:repeat(4,1fr);gap:14px}figure{margin:0;padding:10px;background:white}img{width:100%;height:225px;object-fit:contain}figcaption{font-size:12px}</style><div class=grid>${photos.map(p=>`<figure><img src="${pathToFileURL(path.join(stage,p.id+'.jpg'))}"><figcaption>${p.id} · ${p.dest}<br>${p.caption}<br>${p.author}</figcaption></figure>`).join('')}</div>`);
  // File images are opened from a local HTML document, not a web origin.
  const html=path.join(stage,`sheet-${i/12+1}.html`);fs.writeFileSync(html,await page.content());await page.goto(pathToFileURL(html).href);
  await page.waitForFunction(()=>[...document.images].every(i=>i.complete));
  const dimensions=await page.evaluate(()=>[...document.images].map(i=>({id:Number(i.src.split('/').pop().split('.')[0]),width:i.naturalWidth,height:i.naturalHeight})));
  for(const size of dimensions)Object.assign(manifest.photos.find(p=>p.id===size.id),size);
  await page.screenshot({path:path.join(stage,`sheet-${i/12+1}.png`),fullPage:true});
 }
 } finally {await browser.close();}
 fs.writeFileSync(file,JSON.stringify(manifest,null,2)+'\n');
}
