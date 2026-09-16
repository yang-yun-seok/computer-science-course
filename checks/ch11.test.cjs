const {test}=require('node:test');
const assert=require('node:assert/strict');
const vm=require('node:vm');
const fs=require('node:fs');
const path=require('node:path');
const ctx=vm.createContext({structuredClone});ctx.window=ctx;
for(const file of ['src/core.js','src/labs/ch11.js'])vm.runInContext(fs.readFileSync(path.join(__dirname,'..',file),'utf8'),ctx);
const labs=ctx.CS.labs;

test('overlapping reads lose one of two counter increments',()=>{const l=labs['counter-race'],s=l.action(l.initial(),'run-race');assert.equal(s.tasks.A.read,100);assert.equal(s.tasks.B.read,100);assert.equal(s.counter,101);assert.equal(s.done,true);});
test('mutex sequence preserves both counter increments',()=>{const l=labs['counter-race'],s=l.action(l.initial(),'run-locked');assert.equal(s.counter,102);assert.equal(s.lockOwner,null);assert.equal(s.tasks.A.wrote,true);assert.equal(s.tasks.B.wrote,true);});
test('mutex excludes non-owner and rejects foreign unlock',()=>{const l=labs['counter-race'];let s=l.action(l.initial(),'mode','locked');s=l.action(s,'acquire-a');const waiting=l.action(s,'acquire-b');assert.equal(waiting.lockOwner,'A');assert.equal(waiting.tasks.B.status,'WAITING');assert.throws(()=>l.action(s,'release-b'));assert.throws(()=>l.action(s,'read-b'));});
test('one worker performs exactly one increment',()=>{const l=labs['counter-race'];let s=l.action(l.initial(),'workers','1');s=l.action(s,'run-race');assert.equal(s.counter,101);assert.equal(s.tasks.B.status,'DISABLED');assert.throws(()=>l.action(s,'read-b'));});

test('opposite acquisition creates an actual circular wait',()=>{const l=labs['deadlock-progress'],s=l.action(l.initial(),'run-deadlock');assert.equal(s.condition,'DEADLOCK');assert.equal(s.resources.X,'A');assert.equal(s.resources.Y,'B');assert.equal(s.tasks.A.waiting,'Y');assert.equal(s.tasks.B.waiting,'X');assert.equal(s.progress,0);});
test('global resource order lets both workers complete',()=>{const l=labs['deadlock-progress'],s=l.action(l.initial(),'run-safe');assert.equal(s.condition,'COMPLETE');assert.equal(s.progress,2);assert.equal(s.resources.X,null);assert.equal(s.resources.Y,null);});
test('single worker has no mutual wait cycle',()=>{const l=labs['deadlock-progress'];let s=l.action(l.initial(),'workers','1');s=l.action(s,'run-deadlock');assert.equal(s.condition,'COMPLETE');assert.equal(s.progress,1);assert.equal(s.tasks.B.done,true);});
test('a worker cannot steal a resource held by another',()=>{const l=labs['deadlock-progress'];let s=l.initial();s=l.action(s,'next-a');assert.equal(s.resources.X,'A');assert.throws(()=>l.action(s,'steal'));assert.equal(s.resources.X,'A');});
test('livelock and starvation remain distinct from deadlock',()=>{const l=labs['deadlock-progress'];const live=l.action(l.initial(),'livelock'),starve=l.action(l.initial(),'starvation');assert.equal(live.condition,'LIVELOCK');assert.equal(live.progress,0);assert.ok(live.round>0);assert.equal(starve.condition,'STARVATION RISK');assert.equal(starve.tasks.B.waiting,'X');assert.notEqual(starve.condition,'DEADLOCK');});
test('CH11 lessons include four figures and three questions each',()=>{const lessonCtx=vm.createContext({CS:ctx.CS});lessonCtx.window=lessonCtx;vm.runInContext(fs.readFileSync(path.join(__dirname,'..','content/ch11.js'),'utf8'),lessonCtx);for(const id of ['ch11-l01','ch11-l02']){const lesson=lessonCtx.CS.lessons[id],html=lesson.sections.map(s=>s.html||'').join('');assert.equal((html.match(/<figure /g)||[]).length,4);assert.equal(lesson.sections.length,6);assert.equal(lesson.questions.length,3);assert.ok(lesson.sources.length>=3);}});
