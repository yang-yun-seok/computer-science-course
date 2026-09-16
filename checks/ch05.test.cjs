const {test}=require('node:test');
const assert=require('node:assert/strict');
const vm=require('node:vm');
const fs=require('node:fs');
const path=require('node:path');
const ctx=vm.createContext({structuredClone});ctx.window=ctx;
for(const file of ['src/core.js','src/labs/ch05.js'])vm.runInContext(fs.readFileSync(path.join(__dirname,'..',file),'utf8'),ctx);
const labs=ctx.CS.labs;

test('space model separates input and auxiliary bytes',()=>{
 const l=labs['space-growth'],copy=l.validate({n:'10',method:'copy'}),sum=l.validate({n:'10',method:'sum'});
 let a=l.initial(copy);for(let i=0;i<3;i++)a=l.step(a,copy);assert.equal(a.done,true);assert.match(l.describe(a,copy),/입력 40B \+ 보조 40B = 80B/);
 let b=l.initial(sum);for(let i=0;i<3;i++)b=l.step(b,sum);assert.match(l.describe(b,sum),/입력 40B \+ 보조 4B = 44B/);
});

test('space model handles zero and rejects invalid sizes',()=>{
 const l=labs['space-growth'],copy=l.validate({n:'0',method:'copy'}),sum=l.validate({n:'0',method:'sum'});
 let a=l.initial(copy);for(let i=0;i<3;i++)a=l.step(a,copy);assert.match(l.describe(a,copy),/입력 0B \+ 보조 0B = 0B/);
 let b=l.initial(sum);for(let i=0;i<3;i++)b=l.step(b,sum);assert.match(l.describe(b,sum),/입력 0B \+ 보조 4B = 4B/);
 for(const raw of [{n:'-1',method:'copy'},{n:'1.5',method:'copy'},{n:'101',method:'sum'},{n:'10',method:'other'}])assert.throws(()=>l.validate(raw));
});

test('bounded buffer removes old references only in recent mode',()=>{
 const l=labs['bounded-buffer'];let all=l.initial();all=l.action(all,'add25');assert.equal(all.items.length,25);assert.equal(all.items[0].startsWith('1.'),true);
 let recent=l.action(l.initial(),'recent');recent=l.action(recent,'add25');assert.equal(recent.items.length,20);assert.equal(recent.items[0].startsWith('6.'),true);assert.equal(recent.items.at(-1).startsWith('25.'),true);
 recent=l.action(recent,'all');recent=l.action(recent,'add');assert.equal(recent.items.length,21);
});

function finish(l,p){let s=l.initial(p),guard=0;while(!s.done&&guard++<100)s=l.step(s,p);return s;}
test('linear and binary search count actual comparisons',()=>{
 const l=labs['search-compare'];
 const linear=l.validate({n:'16',target:'16',algorithm:'linear',order:'sorted'}),binary=l.validate({n:'16',target:'16',algorithm:'binary',order:'sorted'});
 const a=finish(l,linear),b=finish(l,binary);assert.equal(a.found,true);assert.equal(a.comparisons,16);assert.equal(b.found,true);assert.equal(b.comparisons,5);
});

test('search handles absent and empty inputs and requires sorting for binary',()=>{
 const l=labs['search-compare'];
 const missing=l.validate({n:'16',target:'17',algorithm:'binary',order:'sorted'}),empty=l.validate({n:'0',target:'1',algorithm:'linear',order:'sorted'});
 const a=finish(l,missing),b=finish(l,empty);assert.equal(a.found,false);assert.equal(a.comparisons,5);assert.equal(b.done,true);assert.equal(b.comparisons,0);
 assert.throws(()=>l.validate({n:'16',target:'10',algorithm:'binary',order:'unsorted'}),/정렬/);
});

test('linear search remains valid for the deterministic unsorted list',()=>{
 const l=labs['search-compare'],p=l.validate({n:'6',target:'6',algorithm:'linear',order:'unsorted'}),s=finish(l,p);
 assert.equal(s.found,true);assert.equal(s.comparisons,1);assert.deepEqual(Array.from(l.values(p)),[6,1,2,3,4,5]);
});

test('network model keeps transfer time and RTT separate',()=>{
 const l=labs['network-delay'],p=l.validate({size:'10',rate:'10',rtt:'100'});let s=l.initial(p);for(let i=0;i<3;i++)s=l.step(s,p);
 assert.equal(s.done,true);assert.match(l.describe(s,p),/8\.100초/);assert.match(l.describe(s,p),/전송 8\.000초/);
 const zero=l.validate({size:'0',rate:'10',rtt:'0'});assert.match(l.render(finish(l,zero),zero),/0\.000초/);
 assert.throws(()=>l.validate({size:'10',rate:'0',rtt:'1'}));
});

test('CH05 lessons keep three or more separate teaching figures each',()=>{
 const lessonCtx=vm.createContext({CS:ctx.CS});lessonCtx.window=lessonCtx;
 vm.runInContext(fs.readFileSync(path.join(__dirname,'..','content/ch05.js'),'utf8'),lessonCtx);
 for(const id of ['ch05-l01','ch05-l02']){
   const html=lessonCtx.CS.lessons[id].sections.map(s=>s.html||'').join('');
   assert.ok((html.match(/<figure /g)||[]).length>=3,`${id} needs at least three figures`);
 }
});
