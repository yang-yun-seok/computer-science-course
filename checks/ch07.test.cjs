const {test}=require('node:test');
const assert=require('node:assert/strict');
const vm=require('node:vm');
const fs=require('node:fs');
const path=require('node:path');
const ctx=vm.createContext({structuredClone});ctx.window=ctx;
for(const file of ['src/core.js','src/labs/ch07.js'])vm.runInContext(fs.readFileSync(path.join(__dirname,'..',file),'utf8'),ctx);
const labs=ctx.CS.labs;
const finish=(l,p)=>{let s=l.initial(p),guard=0;while(!s.done&&guard++<300)s=l.step(s,p);assert.ok(guard<300,'algorithm should terminate');return s;};

test('stable insertion sort preserves equal-key identifiers',()=>{const l=labs['stable-sort'],p=l.validate({items:'3A,1B,2C,1D',algorithm:'insertion'}),s=finish(l,p);assert.equal(s.done,true);assert.deepEqual(Array.from(s.arr,x=>`${x.value}${x.id}`),['1B','1D','2C','3A']);assert.match(l.describe(s,p),/정렬 완료/);});
test('stable bubble sort preserves equal-key identifiers',()=>{const l=labs['stable-sort'],p=l.validate({items:'3A,1B,2C,1D',algorithm:'bubble'}),s=finish(l,p);assert.equal(s.done,true);assert.deepEqual(Array.from(s.arr,x=>`${x.value}${x.id}`),['1B','1D','2C','3A']);});
test('sort handles empty, singleton, sorted and negative inputs',()=>{const l=labs['stable-sort'];for(const items of ['', '7A', '-2A,-2B,3C']){const p=l.validate({items,algorithm:'insertion'}),s=finish(l,p);assert.equal(s.done,true);for(let i=1;i<s.arr.length;i++)assert.ok(s.arr[i-1].value<=s.arr[i].value);}});
test('sort rejects malformed or duplicate identifiers',()=>{const l=labs['stable-sort'];for(const items of ['3,1B','3A,1A','3.5A,1B'])assert.throws(()=>l.validate({items,algorithm:'insertion'}));});
test('sorting preserves every input item exactly once',()=>{const l=labs['stable-sort'],p=l.validate({items:'5A,-1B,5C,0D,2E,-1F',algorithm:'bubble'}),s=finish(l,p);assert.deepEqual(Array.from(s.arr,x=>x.id).sort(),['A','B','C','D','E','F']);assert.deepEqual(Array.from(s.arr,x=>x.value),[-1,-1,0,2,5,5]);});

test('coin strategies expose the greedy counterexample',()=>{const l=labs['coin-strategies'];let s=l.initial();s=l.action(s,'all');assert.equal(s.greedy.picks.length,3);assert.deepEqual(Array.from(s.greedy.picks),[4,1,1]);assert.equal(s.dp.values[6],2);assert.match(l.describe(s),/탐욕 3개 · 최적 DP 2개/);});
test('coin strategies handle zero and unreachable amounts',()=>{const l=labs['coin-strategies'];let zero=l.make('1,3,4','0');assert.equal(zero.greedy.done,true);assert.equal(zero.dp.done,true);assert.match(l.describe(zero),/탐욕 0개 · 최적 DP 0개/);let no=l.action(l.make('4,6','5'),'all');assert.equal(no.greedy.impossible,true);assert.equal(no.dp.values[5],Infinity);assert.match(l.describe(no),/도달 불가 · 최적 DP 도달 불가/);});
test('coin input rejects zero, negative, decimals and out-of-range amount',()=>{const l=labs['coin-strategies'];for(const coins of ['0,1','-1,3','1.5,3'])assert.throws(()=>l.make(coins,'6'));for(const amount of ['-1','2.5','31'])assert.throws(()=>l.make('1,3,4',amount));});
test('CH07 lessons include four figures and three questions each',()=>{const lessonCtx=vm.createContext({CS:ctx.CS});lessonCtx.window=lessonCtx;vm.runInContext(fs.readFileSync(path.join(__dirname,'..','content/ch07.js'),'utf8'),lessonCtx);for(const id of ['ch07-l01','ch07-l02']){const lesson=lessonCtx.CS.lessons[id],html=lesson.sections.map(s=>s.html||'').join('');assert.equal((html.match(/<figure /g)||[]).length,4);assert.equal(lesson.sections.length,6);assert.equal(lesson.questions.length,3);assert.equal(lesson.sources.length,3);}});
