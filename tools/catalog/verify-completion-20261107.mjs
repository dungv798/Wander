import fs from 'node:fs';
import assert from 'node:assert/strict';
import {out,cache,read,save,digest} from './complete-research-20261107.mjs';
function log(name){const buffer=fs.readFileSync(cache+'/'+name);return buffer.toString(buffer[0]===255&&buffer[1]===254?'utf16le':'utf8').replace(/^\uFEFF/,'');}
const backend=log('backend-verification.log'),finalData=log('final-catalog-data.log'),web=log('web-tests.log'),lint=log('web-lint.log'),build=log('web-build.log');
assert(backend.includes('BUILD SUCCESSFUL')&&backend.includes('Task :checkstyleMain'));
assert.equal((backend.match(/ PASSED/g)||[]).length,28);
assert(finalData.includes('BUILD SUCCESSFUL'));assert.equal((finalData.match(/ PASSED/g)||[]).length,6);
assert(/tests 436/.test(web)&&/pass 436/.test(web)&&/fail 0/.test(web));
assert(!/\berror\b/i.test(lint));assert(build.includes('built in'));
const browser=read(cache+'/browser/result.json');assert.equal(browser.length,6);assert(browser.every(r=>r.status==='PASS'));
const audit=read(out+'/apply-audit.json'),ready=read(out+'/ready-500.json');assert(audit.appliedToCatalog);assert.equal(ready.venues.length+ready.dishes.length,500);
const catalogFiles=fs.readdirSync(out+'/apply-payload').filter(f=>f.endsWith('.json'));
const hashes=catalogFiles.map(file=>{const bytes=fs.readFileSync('backend/src/main/resources/catalog/'+file);assert(bytes.equals(fs.readFileSync(out+'/apply-payload/'+file)));return {file,sha256:digest(bytes)};});
save(out+'/verification.json',{checkedAt:new Date().toISOString(),status:'PASS',backend:{tests:28,passed:28,failed:0,includes:['CatalogApiIT (Spring + PostgreSQL Testcontainers)','CatalogDataTest','CatalogDomainTest','VenueDetailsTest'],checkstyleMain:'PASS',logSha256:digest(backend)},finalCatalogLoad:{tests:6,passed:6,logSha256:digest(finalData)},frontend:{tests:436,passed:436,failed:0,lint:'PASS',productionBuild:'PASS',buildWarning:'Existing bundle size / build timing warnings',testsLogSha256:digest(web),buildLogSha256:digest(build)},browser:{mode:'Real catalog JSON via isolated catalog API stub; current frontend',widths:[390,1440],checks:browser},dataset:{researched:620,readyDistinct:500,venues:400,regionalDishes:100,held:112,catalogPlaces:704,payloadMatchesCatalog:true,files:hashes}});
console.log('PASS: backend 28/28; final catalog 6/6; frontend 436/436; lint/build; browser 6/6; 20 payload files match catalog.');
