import fs from 'node:fs';
import path from 'node:path';
import {pathToFileURL} from 'node:url';
import {chromium} from 'playwright-core';
const root=path.resolve('.logs/expansion-20261107');
const source=process.argv.includes('--supplement')?'expansion-supplement-20261107.json':'expansion-candidates-20261107.json';
const prefix=process.argv.includes('--supplement')?'supp-sheet':'sheet';
const entries=Object.values(JSON.parse(fs.readFileSync('docs/research/'+source,'utf8'))).flatMap(p=>(p.candidates??[]).map((ph,i)=>({...ph,id:p.id,name:p.name,index:i+1,lat:p.lat,lon:p.lon})));
const browser=await chromium.launch({channel:'chrome',headless:true});
const escape=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
try {const page=await browser.newPage({viewport:{width:1440,height:1100}});
for(let i=0;i<entries.length;i+=12){const selected=entries.slice(i,i+12),html=path.join(root,`${prefix}-${i/12+1}.html`);
fs.writeFileSync(html,`<meta charset=utf-8><style>body{font:12px system-ui;background:#edf2ef}.grid{display:grid;grid-template-columns:repeat(4,1fr);gap:12px}figure{margin:0;padding:8px;background:white}img{width:100%;height:230px;object-fit:contain}figcaption{overflow-wrap:anywhere}</style><div class=grid>${selected.map(p=>`<figure><img src="${pathToFileURL(path.join(root,p.file))}"><figcaption><b>${escape(p.id)} #${p.index}</b><br>${p.lat}, ${p.lon}<br>${escape(p.source)}<br>${escape(p.license)}</figcaption></figure>`).join('')}</div>`);
await page.goto(pathToFileURL(html).href);await page.waitForFunction(()=>[...document.images].every(i=>i.complete));await page.screenshot({path:path.join(root,`${prefix}-${i/12+1}.png`),fullPage:true});}
}finally{await browser.close();}
console.log(entries.length+' candidate images');
