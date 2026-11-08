import fs from 'node:fs';import path from 'node:path';
const root=path.resolve(import.meta.dirname,'../..'),dest=process.argv[2],indices=process.argv.slice(3).flatMap(s=>s.split(',')).map(Number),list=JSON.parse(fs.readFileSync(path.join(root,'docs/research/photo-candidates',dest+'.unsplash.json'),'utf8'));
console.log(JSON.stringify(indices.map(n=>({n,id:list[n-1]?.id,alt:list[n-1]?.alt,description:list[n-1]?.desc,query:list[n-1]?.query,author:list[n-1]?.author})),null,2));
