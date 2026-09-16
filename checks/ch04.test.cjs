const {test}=require('node:test');
const assert=require('node:assert/strict');
const vm=require('node:vm');
const fs=require('node:fs');
const path=require('node:path');
const ctx=vm.createContext({structuredClone,TextEncoder});ctx.window=ctx;
for(const file of ['src/core.js','src/labs/ch04.js'])vm.runInContext(fs.readFileSync(path.join(__dirname,'..',file),'utf8'),ctx);
const labs=ctx.CS.labs;

test('8-bit switches and UTF-8 bytes use real browser-compatible calculations',()=>{
 const l=labs['bit-byte'];let s=l.initial();assert.match(l.describe(s),/00000101 = 5/);assert.deepEqual(Array.from(ctx.CS.helpers.utf8Bytes('A')),[65]);assert.deepEqual(Array.from(ctx.CS.helpers.utf8Bytes('가')),[234,176,128]);s=l.action(s,'preset-255');assert.match(l.describe(s),/11111111 = 255/);s=l.action(s,'preset-0');assert.match(l.describe(s),/00000000 = 0/);assert.throws(()=>l.action(s,'preset-256'));
});

test('pixel model calculates raw bytes and keeps compression separate',()=>{
 const l=labs['pixel-size'],p=l.validate({width:'8',height:'8',channels:'3'});let s=l.initial(p);for(let i=0;i<3;i++)s=l.step(s,p);assert.equal(s.done,true);assert.match(l.render(s,p),/192B/);assert.throws(()=>l.validate({width:'0',height:'8',channels:'3'}));
});

test('stack and queue remove opposite ends and reject empty removal',()=>{
 const l=labs['stack-queue'];let stack=l.initial();stack=l.action(stack,'remove');assert.deepEqual(Array.from(stack.removed),['C']);let queue=l.initial();queue=l.action(queue,'queue');queue=l.action(queue,'remove');assert.deepEqual(Array.from(queue.removed),['A']);let empty={kind:'stack',items:[],input:'X',removed:[],events:[]};assert.throws(()=>l.action(empty,'remove'),/비어/);
});

test('hash model preserves collisions and Set ignores exact duplicates',()=>{
 const l=labs['hash-buckets'];assert.equal(ctx.CS.helpers.hashOf('A'),ctx.CS.helpers.hashOf('E'));let s=l.initial();s=l.action(s,'preset');assert.equal(s.entries.length,3);assert.match(l.render(s),/A/);assert.match(l.render(s),/E/);s=l.action(s,'set');s=l.action(s,'add');s=l.action(s,'add');assert.equal(s.entries.length,1);assert.match(l.describe(s),/항목 수가 늘어나지/);
});
