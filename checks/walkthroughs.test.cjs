const {test}=require('node:test');
const assert=require('node:assert/strict');
const vm=require('node:vm');
const fs=require('node:fs');
const path=require('node:path');
const read=file=>fs.readFileSync(path.join(__dirname,'..',file),'utf8');
const storage=()=>{const data=new Map();return {getItem:key=>data.get(key)??null,setItem:(key,value)=>data.set(key,String(value)),removeItem:key=>data.delete(key)};};
function context(){
 const c=vm.createContext({structuredClone,setTimeout,clearTimeout,Promise,DOMException,TextEncoder,TextDecoder,btoa,atob,crypto:globalThis.crypto,sessionStorage:storage(),localStorage:storage()});c.window=c;
 for(const file of ['src/core.js','src/lab-walkthroughs.js',...Array.from({length:12},(_,i)=>`src/labs/ch${i+13}.js`)])vm.runInContext(read(file),c,{filename:file});
 return c;
}
test('24 guided routes execute real model actions and reach their stated results',async()=>{
 const c=context(),SQL=await require('sql.js')(),seed=JSON.parse(read('src/sql-worker.js').match(/db\.run\(("(?:[^"\\]|\\.)*")\);/)[1]),frames={};
 c.CS.helpers.executeSQL=async sql=>{const db=new SQL.Database();try{db.run(seed);return {version:db.exec('SELECT sqlite_version()')[0].values[0][0],results:db.exec(sql).map(r=>({columns:r.columns,rows:r.values}))};}finally{db.close();}};
 assert.equal(Object.keys(c.CS.labWalkthroughs).length,24);
 for(const [id,route] of Object.entries(c.CS.labWalkthroughs)){
  const lab=c.CS.labs[id];let state=lab.initial();frames[id]=[];
  for(const step of route.steps){
   for(const command of step.commands)state=await lab.action(state,command.action,command.data,{});
   assert.doesNotThrow(()=>lab.render(state),id+' '+step.title);
   frames[id].push(structuredClone(state));
  }
 }
 const last=id=>frames[id].at(-1);
 assert.deepEqual([...last('bplus-tree').result],[2,3,4]);
 const planFrames=frames['query-plan'];
 assert.match(planFrames[0].result.results[0].rows[0].at(-1),/SCAN/);
 assert.match(planFrames[1].result.results[0].rows[0].at(-1),/SEARCH.*idx_books_title/);
 assert.deepEqual(planFrames[0].result.results[1].rows,planFrames[1].result.results[1].rows);
 assert.deepEqual([...last('isolation-snapshots').t1.reads],[100,100]);
 assert.equal(last('wal-recovery').disk,120);assert.equal(frames['wal-recovery'][3].disk,100);
 assert.equal(last('ipv4-routing').result.chosen,null);
 assert.equal(frames['tcp-recovery'][2].app,'A');assert.equal(frames['tcp-recovery'][2].ack,2);assert.equal(last('tcp-recovery').app,'ABC');assert.equal(last('tcp-recovery').ack,4);
 assert.deepEqual([...last('event-loop-order').logs],['A','B','C']);assert.equal(last('event-loop-order').variant,'timer-first');
 const stores=last('storage-lifetime');assert.equal(stores.memory,null);assert.equal(stores.session,20);assert.equal(stores.local,20);
 const hash=last('crypto-compare');assert.equal(hash.restored,'hello');assert.equal(hash.hash.length,64);assert.notEqual(hash.hash,hash.changedHash);
 assert.equal(last('access-control').decision.status,401);
 assert.equal(last('expression-parser').result,20);
 assert.equal(last('gc-reachability').marked.length,4);
 const pipe=last('pipeline-hazards');assert.equal(pipe.visibleCycle,7);assert.equal(pipe.stalls,0);assert.ok(frames['pipeline-hazards'][3].stalls>0);
 assert.ok(Math.abs(last('amdahl-speedup').speedup-10)<.001);
 assert.equal(last('replica-consistency').nodes.B.value,'v1');assert.equal(last('replica-consistency').nodes.C.value,'old');
 assert.equal(last('raft-quorum').leader,'B');assert.equal(last('raft-quorum').effects,1);
 assert.equal(last('scaling-distribution').cacheServed,60);assert.equal(last('scaling-distribution').overflow,0);assert.ok(frames['scaling-distribution'][2].overflow>0);
 const queue=last('bounded-queue');assert.equal(queue.queue,7);assert.equal(queue.rejected,0);assert.equal(queue.delayed,18);
 assert.equal(last('module-boundary').notifications.length,0);assert.equal(last('module-boundary').loan.saved,true);
 assert.equal(last('architecture-tradeoff').order,'완료');assert.equal(last('architecture-tradeoff').notification,'전송됨');
 assert.ok(last('test-invariants').suite.every(x=>x.pass));assert.ok(last('boundary-debugging').suite.every(x=>x.pass));
 const deploy=last('canary-deployment');assert.equal(deploy.total,40);assert.equal(deploy.versions.v2.requests,2);assert.equal(deploy.versions.v2.errors,2);
 const recovery=last('observability-recovery').recovery;assert.equal(recovery.loss,10);assert.equal(recovery.duration,15);assert.equal(recovery.goals.rpo,15);assert.equal(recovery.goals.rto,20);
});
test('pipeline replay advances a bounded cursor without changing calculated execution',()=>{
 const l=context().CS.labs['pipeline-hazards'],original=l.initial();let s=original;
 for(let i=0;i<20;i++)s=l.action(s,'cycle-next');
 assert.equal(original.visibleCycle,0);assert.equal(s.visibleCycle,s.rows.length);assert.deepEqual(s.rows,original.rows);assert.equal(s.cycles,original.cycles);
 s=l.action(s,'load-use');assert.equal(s.visibleCycle,0);assert.equal(s.stalls,1);
});
test('a B+ tree root that is also a leaf is drawn once before splitting',()=>{
 const l=context().CS.labs['bplus-tree'];let s=l.initial();
 assert.doesNotMatch(l.render(s),/class="bplus-branches"/);
 for(let i=0;i<4;i++)s=l.action(s,'insert-next');
 assert.match(l.render(s),/class="bplus-branches"/);
 assert.equal(s.leaves.length,2);
});
test('event-loop replay keeps observed output and empties the correct queues in order',async()=>{
 const l=context().CS.labs['event-loop-order'];let s=await l.action(l.initial(),'run',null,{});
 s=await l.action(s,'trace-start');assert.equal(s.viewStep,0);assert.deepEqual([...s.logs],['A','B','C']);
 s=await l.action(s,'trace-next');assert.match(l.render(s),/Promise → B/);
 s=await l.action(s,'trace-next');assert.equal(s.viewStep,2);assert.match(l.render(s),/setTimeout → C/);
 for(let i=0;i<5;i++)s=await l.action(s,'trace-next');assert.equal(s.viewStep,3);assert.doesNotMatch(l.render(s),/<strong>Promise → B|<strong>setTimeout → C/);
});
