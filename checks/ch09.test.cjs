const {test}=require('node:test');
const assert=require('node:assert/strict');
const vm=require('node:vm');
const fs=require('node:fs');
const path=require('node:path');
const ctx=vm.createContext({structuredClone});ctx.window=ctx;
for(const file of ['src/core.js','src/labs/ch09.js'])vm.runInContext(fs.readFileSync(path.join(__dirname,'..',file),'utf8'),ctx);
const labs=ctx.CS.labs;
const finish=(lab,p)=>{let s=lab.initial(p),guard=0;while(!s.done&&guard++<20)s=lab.step(s,p);assert.ok(guard<20);return s;};

test('allowed system call returns contents to saved USER location',()=>{const l=labs['system-call-boundary'],p=l.validate({scenario:'allowed'}),s=finish(l,p);assert.equal(s.mode,'USER');assert.equal(s.location,'read 다음 명령');assert.equal(s.returnValue,'5 bytes');assert.equal(s.contents,'HELLO');assert.equal(s.process,'RUNNING');assert.ok(s.events.some(v=>v.includes('권한')));assert.ok(s.events.some(v=>v.includes('인터럽트')));});
test('permission denial returns EACCES without reading contents',()=>{const l=labs['system-call-boundary'],p=l.validate({scenario:'denied'}),s=finish(l,p);assert.equal(s.mode,'USER');assert.equal(s.returnValue,'EACCES');assert.equal(s.contents,null);assert.ok(!s.events.some(v=>v.includes('장치가 완료')));});
test('direct device access is blocked in USER mode',()=>{const l=labs['system-call-boundary'],p=l.validate({scenario:'direct'}),s=l.step(l.initial(p),p);assert.equal(s.done,true);assert.equal(s.mode,'USER');assert.equal(s.returnValue,'PROTECTION');assert.equal(s.contents,null);});
test('system call scenario validation rejects unknown values',()=>{assert.throws(()=>labs['system-call-boundary'].validate({scenario:'bypass'}));});

test('two-slot pipe blocks C until one item is read',()=>{const l=labs['pipe-buffer'];let s=l.initial();s=l.action(s,'write');s=l.action(s,'write');assert.deepEqual(Array.from(s.buffer),['A','B']);s=l.action(s,'write');assert.equal(s.sender,'WAITING');assert.deepEqual(Array.from(s.pending),['C']);s=l.action(s,'read');assert.deepEqual(Array.from(s.received),['A']);assert.equal(s.sender,'READY');s=l.action(s,'write');assert.deepEqual(Array.from(s.buffer),['B','C']);assert.ok(s.buffer.length<=s.capacity);});
test('normal pipe flow preserves FIFO and reaches EOF after writer closes',()=>{const l=labs['pipe-buffer'],s=l.action(l.initial(),'run-normal');assert.deepEqual(Array.from(s.received),['A','B','C']);assert.deepEqual(Array.from(s.buffer),[]);assert.equal(s.writerOpen,false);assert.equal(s.eof,true);assert.equal(s.done,true);});
test('empty read waits while writer remains open',()=>{const l=labs['pipe-buffer'],s=l.action(l.initial(),'read');assert.equal(s.receiver,'WAITING');assert.equal(s.eof,false);assert.equal(s.done,false);});
test('empty pipe returns EOF only after the writer closes',()=>{const l=labs['pipe-buffer'];let s=l.initial();s=l.action(s,'close-writer');assert.equal(s.eof,false);s=l.action(s,'read');assert.equal(s.eof,true);assert.equal(s.receiver,'EOF');});
test('write after reader closes fails without losing pending data',()=>{const l=labs['pipe-buffer'];let s=l.initial();s=l.action(s,'close-reader');s=l.action(s,'write');assert.match(s.failure,/EPIPE/);assert.deepEqual(Array.from(s.pending),['A','B','C']);assert.deepEqual(Array.from(s.buffer),[]);});
test('CH09 lessons include four figures and three questions each',()=>{const lessonCtx=vm.createContext({CS:ctx.CS});lessonCtx.window=lessonCtx;vm.runInContext(fs.readFileSync(path.join(__dirname,'..','content/ch09.js'),'utf8'),lessonCtx);for(const id of ['ch09-l01','ch09-l02']){const lesson=lessonCtx.CS.lessons[id],html=lesson.sections.map(s=>s.html||'').join('');assert.equal((html.match(/<figure /g)||[]).length,4);assert.equal(lesson.sections.length,6);assert.equal(lesson.questions.length,3);assert.ok(lesson.sources.length>=3);}});
