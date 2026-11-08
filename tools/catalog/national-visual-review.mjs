import fs from 'node:fs';
import path from 'node:path';
const root=path.resolve(import.meta.dirname,'../..');
const catalog=path.join(root,'backend/src/main/resources/catalog');
const manifestFile=path.join(root,'docs/research/photo-candidates/pexels-editorial-2026-11-06.json');
const manifest=JSON.parse(fs.readFileSync(manifestFile,'utf8'));
const notes={
 7276642:'Viewed full ratio: adult paddlers at a distance framed by limestone cliffs, strong turquoise/orange contrast. First-party caption identifies Ha Long Bay.',
 19578152:'Viewed full ratio: distinctive stone steps and summit pavilion, no portrait; title/caption identify Hang Mua. Correct replacement for the ambiguous Tam Coc image.',
 21567735:'Viewed full ratio: vegetable stall and adult vendor in the wider streetscape. Nha Trang location verified; no specific market claim.',
 36776136:'Viewed full ratio: food preparation and stall are the focus; adult vendor at medium distance. First-party Hue location verified.',
 4619765:'Viewed full ratio: appetising noodles, herbs and condiments; no face. Hue source verified; do not name a specific dish or restaurant.',
 4619764:'Viewed full ratio: colourful yarn and fabric stall, adult vendor in context. Hue source verified; not assigned to a specific market.',
 37223759:'Viewed full ratio: dramatic cooking flame at night, adult cook in context. Da Lat location verified; no specific stall claimed.',
 36123440:'Viewed full ratio: sunrise fishing activity, adult at distance, warm light. Da Nang source verified; no specific beach claimed.',
 29999414:'Viewed full ratio: workers tending drying frames, wide activity composition. Phu Quoc source verified; no visitor access or named workshop claimed.',
 6875004:'Viewed full ratio: adult photographers at distance, recognisable Ban Gioc landscape. Source identifies waterfall. Historical photograph, not advice to enter water.',
};
for(const photo of manifest.photos){if(notes[photo.id]){photo.status='approved';photo.reviewNotes=notes[photo.id];}}
const banGioc=manifest.photos.find(p=>p.id===6875004);
banGioc.placeId='cao-bang-thac-ban-gioc';
banGioc.placeMatchEvidence='First-party title and caption explicitly identify Ban Gioc Waterfall; landmark visually verified.';
const hangMua=manifest.photos.find(p=>p.id===19578152);
hangMua.placeId='ninh-binh-hang-mua';
hangMua.placeMatchEvidence='First-party title and caption explicitly identify Hang Mua; stone steps and summit pavilion visually match.';
fs.writeFileSync(manifestFile,JSON.stringify(manifest,null,2)+'\n');
const removals=[
 ['ninh-binh','ninh-binh-trang-an','ninh-binh-trang-an-2.jpg','Source identifies Tam Coc, not the specific Trang An boat route.'],
 ['ninh-binh','ninh-binh-tam-coc','ninh-binh-tam-coc-1.jpg','Source identifies Trang An Cave.'],
 ['ninh-binh','ninh-binh-hang-mua','ninh-binh-hang-mua-1.jpg','Source confirms Tam Coc only; Hang Mua camera viewpoint not established.'],
 ['phong-nha','phong-nha-dong-phong-nha','phong-nha-dong-phong-nha-2.jpg','Source explicitly names Paradise Cave; separate attraction.'],
 ['phu-quoc','phu-quoc-vuon-quoc-gia','phu-quoc-vuon-quoc-gia-1.jpg','Source identifies Sao beach, not national park.'],
 ['buon-ma-thuot','buon-ma-thuot-yok-don','buon-ma-thuot-yok-don-2.jpg','Historical elephant riding photo does not represent the current walking/nature experience.'],
 ['buon-ma-thuot','buon-ma-thuot-ho-lak','buon-ma-thuot-ho-lak-3.jpg','Historical elephant riding photo omitted from new walking/culture collection.'],
];
for(const [dest,id,file] of removals){
 const target=path.join(catalog,dest+'.json'),data=JSON.parse(fs.readFileSync(target,'utf8'));
 const place=data.places.find(p=>p.id===id);
 if(!place)throw new Error('Unexpected place '+id);
 place.photos=place.photos.filter(p=>p.file!==file);
 fs.writeFileSync(target,JSON.stringify(data,null,2)+'\n');
}
fs.writeFileSync(path.join(root,'docs/research/photo-candidates/national-visual-review-2026-11-06.json'),JSON.stringify({reviewedAt:'2026-11-06',method:'Viewed all eight full-ratio national contact sheets; removed only own new photo references, never baseline assets. Files retained on disk.',removals:removals.map(([destination,placeId,file,reason])=>({destination,placeId,file,reason}))},null,2)+'\n');
console.log(`Approved ${Object.keys(notes).length} reviewed moments; rejected ${removals.length} auto photo assignments.`);
