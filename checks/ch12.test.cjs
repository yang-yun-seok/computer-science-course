const {test}=require('node:test');
const assert=require('node:assert/strict');
const vm=require('node:vm');
const fs=require('node:fs');
const path=require('node:path');
const ctx=vm.createContext({structuredClone,Worker:undefined,WebAssembly});ctx.window=ctx;ctx.CS_SQL_WORKER='';
for(const file of ['src/core.js','src/labs/sql.js','src/labs/ch12.js'])vm.runInContext(fs.readFileSync(path.join(__dirname,'..',file),'utf8'),ctx);
const labs=ctx.CS.labs;

test('normalized name change preserves two S1 loan references',()=>{const l=labs['relation-designer'];let s=l.action(l.initial(),'rename');assert.equal(s.members.find(m=>m.id==='S1').name,'서민지');assert.deepEqual(Array.from(s.loans,l=>l.memberId),['S1','S1']);assert.equal(s.members.find(m=>m.id==='S2').name,'민지');});
test('member with zero loans can exist independently',()=>{const l=labs['relation-designer'];const s=l.action(l.initial(),'add-unlinked');assert.ok(s.members.some(m=>m.id==='S3'));assert.ok(!s.loans.some(x=>x.memberId==='S3'));});
test('primary and foreign key violations preserve source state',()=>{const l=labs['relation-designer'],s=l.initial();assert.throws(()=>l.action(s,'duplicate'));assert.throws(()=>l.action(s,'missing'));assert.equal(s.members.length,2);assert.equal(s.loans.length,2);});
test('flat single-row update demonstrates an inconsistent duplicate',()=>{const l=labs['relation-designer'];const s=l.action(l.initial(),'flat-update');assert.equal(s.anomaly,true);assert.deepEqual(Array.from(s.flatRows,r=>r.memberName),['서민지','민지']);});
test('SQL presets include expected grouping, join, empty, NULL and invalid cases',async()=>{const l=labs['sql-analytics'];for(const id of ['top','join','wrong','empty','nulls','invalid']){const s=await l.action(l.initial(),'preset-'+id);assert.equal(s.preset,id);assert.ok(s.sql.length>5);}assert.match((await l.action(l.initial(),'preset-top')).sql,/GROUP BY/);assert.match((await l.action(l.initial(),'preset-nulls')).sql,/IS NULL/);});
test('SQL editor rejects empty and oversized input before worker execution',async()=>{const l=labs['sql-analytics'];for(const sql of ['', 'x'.repeat(4001)]){const s=await l.action(l.initial(),'edit',sql);await assert.rejects(()=>l.action(s,'run',null,{}));}});
test('CH12 lessons include four figures and three questions each',()=>{const lessonCtx=vm.createContext({CS:ctx.CS});lessonCtx.window=lessonCtx;vm.runInContext(fs.readFileSync(path.join(__dirname,'..','content/ch12.js'),'utf8'),lessonCtx);for(const id of ['ch12-l01','ch12-l02']){const lesson=lessonCtx.CS.lessons[id],html=lesson.sections.map(s=>s.html||'').join('');assert.equal((html.match(/<figure /g)||[]).length,4);assert.equal(lesson.sections.length,6);assert.equal(lesson.questions.length,3);assert.ok(lesson.sources.length>=3);}});
