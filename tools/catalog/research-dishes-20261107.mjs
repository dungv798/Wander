import fs from 'node:fs';import path from 'node:path';
import {dishSeeds} from './dish-seeds-20261107.mjs';
import {foodRegions} from './enrichment-foods-20261106.mjs';
import {wikiPage,usableImages,getJson,getBytes} from './build-catalog.mjs';
const root=path.resolve(import.meta.dirname,'../..'),stage=path.join(root,'.logs/dishes-20261107'),file=path.join(root,'docs/research/dish-candidates-20261107.json');fs.mkdirSync(stage,{recursive:true});
const report=fs.existsSync(file)?JSON.parse(fs.readFileSync(file,'utf8')):{};
for(const [dest,slug,name,title,summary] of dishSeeds){const id=`exp-food-${dest}-${slug}`;if(report[id])continue;const current=JSON.parse(fs.readFileSync(path.join(root,'backend/src/main/resources/catalog',dest+'.json'),'utf8'));if(current.places.some(p=>p.id===id))continue;
try{const page=await wikiPage(title),search=await getJson('https://commons.wikimedia.org/w/api.php',{action:'query',generator:'search',gsrsearch:`"${title}" filetype:bitmap`,gsrnamespace:'6',gsrlimit:'6'});
const names=[...new Set([...(page?.lead?['File:'+page.lead]:[]),...Object.values(search.query?.pages??{}).map(p=>p.title)])],images=(await usableImages(names)).slice(0,3),candidates=[];
for(const [i,image] of images.entries()){const file=`dish-${dest}-${slug}-${i+1}.jpg`;fs.writeFileSync(path.join(stage,file),await getBytes(image.url));candidates.push({...image,file});}
report[id]={id,dest,name,title,summary,sourceUrl:foodRegions[dest].source,wikipediaTitle:page?.title??null,candidates,approved:[]};console.log(`${id}: ${images.length}`);
}catch(e){report[id]={id,dest,name,title,summary,sourceUrl:foodRegions[dest].source,error:e.message,candidates:[],approved:[]};console.log(id+': '+e.message);}fs.writeFileSync(file,JSON.stringify(report,null,2)+'\n');}
