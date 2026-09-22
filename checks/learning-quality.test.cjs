const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const root=path.join(__dirname,'..');
const read=file=>fs.readFileSync(path.join(root,file),'utf8');

function load(){
 const storage=()=>{const data=new Map();return {getItem:key=>data.has(key)?data.get(key):null,setItem:(key,value)=>data.set(key,String(value)),removeItem:key=>data.delete(key)};};
 const context=vm.createContext({console,structuredClone,DOMException,URL,localStorage:storage(),sessionStorage:storage()});context.window=context;
 vm.runInContext(read('src/core.js'),context);
 vm.runInContext(read('src/lab-guides.js'),context);
 for(const file of fs.readdirSync(path.join(root,'src/labs')).filter(file=>file.endsWith('.js')).sort())vm.runInContext(read(`src/labs/${file}`),context);
 for(const file of ['src/learning/mission-model.js','src/learning/storage.js','src/learning/lab-adapters.js'])vm.runInContext(read(file),context);
 vm.runInContext(read('content/lab-missions.js'),context);
 return context;
}

test('구현한 비교 미션은 실제 실습에 하나씩 연결된다',()=>{
 const context=load();
 const ids=['cpu-add','memory-save','cpu-schedule','lru-cache','process-state','thread-pool','library-query','loan-transaction','sql-first','bit-byte','pixel-size','stack-queue','hash-buckets','space-growth','bounded-buffer','search-compare','network-delay','layer-message','segment-order','http-library','tls-handshake','stable-sort','coin-strategies','bst-traversal','graph-paths','system-call-boundary','pipe-buffer','virtual-memory','journal-recovery','counter-race','deadlock-progress','relation-designer','sql-analytics','bplus-tree','query-plan','isolation-snapshots','wal-recovery','ipv4-routing','tcp-recovery','event-loop-order','storage-lifetime','crypto-compare','access-control','expression-parser','gc-reachability','pipeline-hazards','amdahl-speedup','replica-consistency','raft-quorum','scaling-distribution','bounded-queue','module-boundary','architecture-tradeoff','test-invariants','boundary-debugging','canary-deployment','observability-recovery'];
 assert.deepEqual(Object.keys(context.CS.labMissions).sort(),ids.sort());
 ids.forEach(id=>{const mission=context.CS.labMissions[id];assert.ok(context.CS.labs[id]);assert.equal(mission.steps.length,2);assert.equal(mission.checks.length,2);assert.ok(mission.goal.length>20);});
});

test('비교 미션은 실제 상태가 조건에 맞을 때만 결과를 기록한다',()=>{
 const context=load(),A=context.CS.learning.labAdapters;
 let cpu=context.CS.labs['cpu-add'].initial({a:3,b:2});for(let i=0;i<3;i++)cpu=context.CS.labs['cpu-add'].step(cpu,{a:3,b:2});
 assert.equal(A.capture('cpu-add',cpu,{a:3,b:2},'A').metrics.CPU,5);
 assert.equal(A.capture('cpu-add',cpu,{a:3,b:2},'B'),null);
 cpu=context.CS.labs['cpu-add'].step(cpu,{a:3,b:2});assert.equal(A.capture('cpu-add',cpu,{a:3,b:2},'B').metrics.RAM,5);
 const tcp=context.CS.labs['tcp-recovery'].action(context.CS.labs['tcp-recovery'].initial(),'run-loss');
 assert.equal(A.capture('tcp-recovery',tcp,{},'B').metrics.재전송,'1회');
 assert.equal(A.capture('tcp-recovery',tcp,{},'A'),null);
 for(const [label,algorithm,path] of [['A','bfs','A → C'],['B','dijkstra','A → B → C']]){const lab=context.CS.labs['graph-paths'],p=lab.validate({algorithm,target:'C',ab:'1',bc:'1',ac:'5'});let s=lab.initial(p);while(!s.done)s=lab.step(s,p);assert.equal(A.capture('graph-paths',s,p,label).metrics.경로,path);}
 assert.equal(A.capture('query-plan',{preset:'scan',result:{results:[{columns:['id','parent','notused','detail'],rows:[[2,0,0,'SCAN books']]},{columns:['id','title'],rows:[['B1','컴퓨터 첫걸음']]}]}},{},'A').metrics.결과행,1);
 assert.equal(A.capture('query-plan',{preset:'index',result:{results:[{columns:['id','parent','notused','detail'],rows:[[3,0,0,'SEARCH books USING INDEX idx_books_title']]},{columns:['id','title'],rows:[['B1','컴퓨터 첫걸음']]}]}},{},'B').metrics.결과행,1);
});

test('미션 정의 revision이 바뀌면 이전 완료 기록을 새 조건에 재사용하지 않는다',()=>{
 const context=load(),model=context.CS.learning.missions,definition={id:'sample',revision:2,checks:[]};
 const state=model.create(definition,{missionId:'sample',revision:1,runs:{A:{},B:{}},checks:{},note:'이전 조건에서 작성한 충분히 긴 관찰 문장입니다.',completed:true});
 assert.equal(state.revision,2);assert.equal(state.completed,false);assert.equal(state.runs.A,null);
});

test('R1 비교 미션의 A와 B 기대값은 실제 모델 결과와 일치한다',()=>{
 const context=load(),labs=context.CS.labs,A=context.CS.learning.labAdapters;
 let memory=labs['memory-save'].initial();memory=labs['memory-save'].action(memory,'edit','수정한 문장');memory=labs['memory-save'].action(memory,'power');memory=labs['memory-save'].action(memory,'power');assert.equal(A.capture('memory-save',memory,{},'A').metrics.작업글,'첫 문장');
 memory=labs['memory-save'].initial();memory=labs['memory-save'].action(memory,'edit','수정한 문장');memory=labs['memory-save'].action(memory,'save');memory=labs['memory-save'].action(memory,'power');memory=labs['memory-save'].action(memory,'power');assert.equal(A.capture('memory-save',memory,{},'B').metrics.작업글,'수정한 문장');
 for(const [label,policy,response] of [['A','FCFS','4.67'],['B','RR','1.00']]){const p={a:6,b:2,c:1,policy,quantum:1},lab=labs['cpu-schedule'];let s=lab.initial(p);while(!s.done)s=lab.step(s,p);assert.equal(A.capture('cpu-schedule',s,p,label).metrics.평균첫응답,response);}
 for(const [label,requests,evicted] of [['A',['A','B','C'],'A'],['B',['A','B','A','C'],'B']]){const p={capacity:2,requests},lab=labs['lru-cache'];let s=lab.initial(p);while(!s.done)s=lab.step(s,p);assert.equal(A.capture('lru-cache',s,p,label).metrics.퇴출,evicted);}
 let process=labs['process-state'].initial();process=labs['process-state'].action(process,'dispatch:A');process=labs['process-state'].action(process,'execute');process=labs['process-state'].action(process,'io');assert.equal(A.capture('process-state',process,{},'A').metrics.A상태,'대기');process=labs['process-state'].action(process,'complete:A');assert.equal(A.capture('process-state',process,{},'B').metrics.A상태,'준비');
 for(const [label,size,time] of [['A',1,9],['B',2,5]]){const p={size,lengths:[2,1,3,1,2]},lab=labs['thread-pool'];let s=lab.initial(p);while(!s.done)s=lab.step(s,p);assert.equal(A.capture('thread-pool',s,p,label).metrics.완료시간,time);}
 let library=labs['library-query'].action(labs['library-query'].initial(),'all');assert.equal(A.capture('library-query',library,{},'A').metrics.결과행,3);library=labs['library-query'].action(library,'available');assert.equal(A.capture('library-query',library,{},'B').metrics.결과행,2);
 for(const [label,failure,stock] of [['A','none',0],['B','after-decrement',1]]){const p={stock:1,failure,member:'M1',role:'librarian'},lab=labs['loan-transaction'];let s=lab.initial(p);while(!s.done)s=lab.step(s,p);assert.equal(A.capture('loan-transaction',s,p,label).metrics.확정수량,stock);}
 assert.equal(A.capture('sql-first',{sql:'SELECT id, title FROM books ORDER BY id;',result:{results:[{rows:[[1],[2],[3]]}]}},{},'A').metrics.결과행,3);
 assert.equal(A.capture('sql-first',{sql:"SELECT id, title FROM books WHERE id = 'B2' ORDER BY id;",result:{results:[{rows:[[2]]}]}},{},'B').metrics.결과행,1);
 let bits=labs['bit-byte'].action(labs['bit-byte'].initial(),'preset-1');assert.equal(A.capture('bit-byte',bits,{},'A').metrics.십진수,1);bits=labs['bit-byte'].action(bits,'preset-129');assert.equal(A.capture('bit-byte',bits,{},'B').metrics.십진수,129);
 for(const [label,width,bytes] of [['A',8,192],['B',16,384]]){const p={width,height:8,channels:3},lab=labs['pixel-size'];let s=lab.initial(p);while(!s.done)s=lab.step(s,p);assert.equal(A.capture('pixel-size',s,p,label).metrics.원시바이트,bytes);}
 let structure=labs['stack-queue'].action(labs['stack-queue'].initial(),'remove');assert.equal(A.capture('stack-queue',structure,{},'A').metrics.제거값,'C');structure=labs['stack-queue'].action(labs['stack-queue'].initial(),'queue');structure=labs['stack-queue'].action(structure,'remove');assert.equal(A.capture('stack-queue',structure,{},'B').metrics.제거값,'A');
 let hash=labs['hash-buckets'].action(labs['hash-buckets'].initial(),'set');hash=labs['hash-buckets'].action(hash,'add');assert.equal(A.capture('hash-buckets',hash,{},'A').metrics.원소수,1);hash=labs['hash-buckets'].action(hash,'add');assert.equal(A.capture('hash-buckets',hash,{},'B').metrics.원소수,1);
});

test('R2 비교 미션의 A와 B 기대값은 실제 모델 결과와 일치한다',()=>{
 const context=load(),labs=context.CS.labs,A=context.CS.learning.labAdapters;
 for(const [label,method,aux] of [['A','sum',4],['B','copy',40]]){const p={n:10,method},lab=labs['space-growth'];let s=lab.initial(p);while(!s.done)s=lab.step(s,p);assert.equal(A.capture('space-growth',s,p,label).metrics.보조바이트,aux);}
 let buffer=labs['bounded-buffer'].action(labs['bounded-buffer'].initial(),'add25');assert.equal(A.capture('bounded-buffer',buffer,{},'A').metrics.저장수,25);buffer=labs['bounded-buffer'].action(labs['bounded-buffer'].initial(),'recent');buffer=labs['bounded-buffer'].action(buffer,'add25');assert.equal(A.capture('bounded-buffer',buffer,{},'B').metrics.가장오래된항목,6);
 for(const [label,algorithm,count] of [['A','linear',16],['B','binary',5]]){const p={n:16,target:16,algorithm,order:'sorted'},lab=labs['search-compare'];let s=lab.initial(p);while(!s.done)s=lab.step(s,p);assert.equal(A.capture('search-compare',s,p,label).metrics.비교횟수,count);}
 for(const [label,rtt,total] of [['A',100,'8.100'],['B',200,'8.200']]){const p={size:10,rate:10,rtt},lab=labs['network-delay'];let s=lab.initial(p);while(!s.done)s=lab.step(s,p);assert.equal(A.capture('network-delay',s,p,label).metrics.합계초,total);}
 for(const [label,destination,result] of [['A','B','전달 완료'],['B','unknown','전달 실패']]){const p={message:'HI',destination},lab=labs['layer-message'];let s=lab.initial(p);while(!s.done)s=lab.step(s,p);assert.equal(A.capture('layer-message',s,p,label).metrics.결과,result);}
 let segment=labs['segment-order'].initial();for(let i=0;i<3;i++)segment=labs['segment-order'].action(segment,'receive');assert.equal(A.capture('segment-order',segment,{},'A').metrics.완료,'예');segment=labs['segment-order'].action(labs['segment-order'].initial(),'missing');for(let i=0;i<2;i++)segment=labs['segment-order'].action(segment,'receive');assert.equal(A.capture('segment-order',segment,{},'B').metrics.빠진조각,'2');
 for(const [label,scenario,status] of [['A','server',500],['B','connection','없음']]){const lab=labs['http-library'],p=lab.validate({url:'https://library.example/books?id=B01',scenario});let s=lab.initial(p);while(!s.done)s=lab.step(s,p);assert.equal(A.capture('http-library',s,p,label).metrics.상태코드,status);}
 for(const [label,certificate,phase] of [['A','valid',4],['B','expired',2]]){const p={certificate},lab=labs['tls-handshake'];let s=lab.initial(p);while(!s.done)s=lab.step(s,p);assert.equal(A.capture('tls-handshake',s,p,label).metrics.종료단계,phase);}
 for(const [label,algorithm] of [['A','insertion'],['B','bubble']]){const lab=labs['stable-sort'],p=lab.validate({items:'3A,1B,2C,1D',algorithm});let s=lab.initial(p);while(!s.done)s=lab.step(s,p);assert.equal(A.capture('stable-sort',s,p,label).metrics.결과,'1B→1D→2C→3A');}
 const coin=labs['coin-strategies'],coins=coin.action(coin.initial(),'all');assert.equal(A.capture('coin-strategies',coins,{},'A').metrics.동전수,3);assert.equal(A.capture('coin-strategies',coins,{},'B').metrics.동전수,2);
});

test('R3 비교 미션의 A와 B 기대값은 실제 모델 결과와 일치한다',()=>{
 const context=load(),labs=context.CS.labs,A=context.CS.learning.labAdapters;
 for(const [label,scenario,value] of [['A','allowed','5 bytes'],['B','denied','EACCES']]){const p={scenario},lab=labs['system-call-boundary'];let s=lab.initial(p);while(!s.done)s=lab.step(s,p);assert.equal(A.capture('system-call-boundary',s,p,label).metrics.반환값,value);}
 let pipe=labs['pipe-buffer'].initial();for(let i=0;i<3;i++)pipe=labs['pipe-buffer'].action(pipe,'write');assert.equal(A.capture('pipe-buffer',pipe,{},'A').metrics.송신자,'WAITING');pipe=labs['pipe-buffer'].action(pipe,'read');assert.equal(A.capture('pipe-buffer',pipe,{},'B').metrics.버퍼,'B');
 let vm=labs['virtual-memory'].action(labs['virtual-memory'].initial(),'reference-all');assert.equal(A.capture('virtual-memory',vm,{},'A').metrics.퇴출,1);vm=labs['virtual-memory'].action(labs['virtual-memory'].initial(),'policy','lru');vm=labs['virtual-memory'].action(vm,'reference-all');assert.equal(A.capture('virtual-memory',vm,{},'B').metrics.퇴출,2);
 let journal=labs['journal-recovery'].action(labs['journal-recovery'].initial(),'step');journal=labs['journal-recovery'].action(journal,'crash');journal=labs['journal-recovery'].action(journal,'recover');assert.equal(A.capture('journal-recovery',journal,{},'A').metrics.복구내용,'A');journal=labs['journal-recovery'].action(labs['journal-recovery'].initial(),'step');journal=labs['journal-recovery'].action(journal,'step');journal=labs['journal-recovery'].action(journal,'crash');journal=labs['journal-recovery'].action(journal,'recover');assert.equal(A.capture('journal-recovery',journal,{},'B').metrics.복구내용,'B');
 let counter=labs['counter-race'].action(labs['counter-race'].initial(),'run-race');assert.equal(A.capture('counter-race',counter,{},'A').metrics.최종값,101);counter=labs['counter-race'].action(labs['counter-race'].initial(),'run-locked');assert.equal(A.capture('counter-race',counter,{},'B').metrics.최종값,102);
 let deadlock=labs['deadlock-progress'].action(labs['deadlock-progress'].initial(),'run-deadlock');assert.equal(A.capture('deadlock-progress',deadlock,{},'A').metrics.판정,'DEADLOCK');deadlock=labs['deadlock-progress'].action(labs['deadlock-progress'].initial(),'run-safe');assert.equal(A.capture('deadlock-progress',deadlock,{},'B').metrics.완료수,2);
 let relation=labs['relation-designer'].action(labs['relation-designer'].initial(),'flat-update');assert.equal(A.capture('relation-designer',relation,{},'A').metrics.참조일관성,'깨짐');relation=labs['relation-designer'].action(labs['relation-designer'].initial(),'rename');assert.equal(A.capture('relation-designer',relation,{},'B').metrics.대출참조,2);
 assert.equal(A.capture('sql-analytics',{preset:'join',result:{results:[{rows:[[1],[2],[3]]}]}},{},'A').metrics.결과행,3);assert.equal(A.capture('sql-analytics',{preset:'wrong',result:{results:[{rows:[[1],[2],[3],[4],[5],[6]]}]}},{},'B').metrics.결과행,6);
});

test('R4 비교 미션의 A와 B 기대값은 실제 모델 결과와 일치한다',()=>{
 const context=load(),labs=context.CS.labs,A=context.CS.learning.labAdapters;
 let tree=labs['bplus-tree'].initial();for(let i=0;i<3;i++)tree=labs['bplus-tree'].action(tree,'insert-next');assert.equal(A.capture('bplus-tree',tree,{},'A').metrics.리프수,1);tree=labs['bplus-tree'].action(tree,'insert-next');assert.equal(A.capture('bplus-tree',tree,{},'B').metrics.루트구분키,3);
 let isolation=labs['isolation-snapshots'].action(labs['isolation-snapshots'].initial(),'run-statement');assert.equal(A.capture('isolation-snapshots',isolation,{},'A').metrics.둘째읽기,120);isolation=labs['isolation-snapshots'].action(labs['isolation-snapshots'].initial(),'run-transaction');assert.equal(A.capture('isolation-snapshots',isolation,{},'B').metrics.둘째읽기,100);
 let wal=labs['wal-recovery'].action(labs['wal-recovery'].initial(),'run-before');assert.equal(A.capture('wal-recovery',wal,{},'A').metrics.디스크값,100);wal=labs['wal-recovery'].action(labs['wal-recovery'].initial(),'run-after');assert.equal(A.capture('wal-recovery',wal,{},'B').metrics.디스크값,120);
 let route=labs['ipv4-routing'].action(labs['ipv4-routing'].initial(),'to-r1');assert.equal(A.capture('ipv4-routing',route,{},'A').metrics.다음홉,'R1');route=labs['ipv4-routing'].action(labs['ipv4-routing'].initial(),'to-r2');assert.equal(A.capture('ipv4-routing',route,{},'B').metrics.다음홉,'R2');
 let store=labs['storage-lifetime'].action(labs['storage-lifetime'].initial(),'clear');store=labs['storage-lifetime'].action(store,'save-memory');store=labs['storage-lifetime'].action(store,'refresh');assert.equal(A.capture('storage-lifetime',store,{},'A').metrics.새로고침뒤,'기본 18px');store=labs['storage-lifetime'].action(store,'clear');store=labs['storage-lifetime'].action(store,'save-local');store=labs['storage-lifetime'].action(store,'refresh');assert.equal(A.capture('storage-lifetime',store,{},'B').metrics.새로고침뒤,'20px');
});

test('R5 비교 미션의 A와 B 기대값은 실제 모델 결과와 일치한다',()=>{
 const context=load(),labs=context.CS.labs,A=context.CS.learning.labAdapters;
 const cryptoState={input:'hello',changed:'hello!',hash:'a'.repeat(64),changedHash:'b'.repeat(64)};assert.equal(A.capture('crypto-compare',cryptoState,{},'A').metrics.비트수,256);assert.equal(A.capture('crypto-compare',cryptoState,{},'B').metrics['16진수길이'],64);
 let access=labs['access-control'].action(labs['access-control'].initial(),'own');assert.equal(A.capture('access-control',access,{},'A').metrics.상태,200);access=labs['access-control'].action(labs['access-control'].initial(),'other');assert.equal(A.capture('access-control',access,{},'B').metrics.상태,403);
 let expr=labs['expression-parser'].action(labs['expression-parser'].initial(),'precedence');assert.equal(A.capture('expression-parser',expr,{},'A').metrics.결과,14);expr=labs['expression-parser'].action(labs['expression-parser'].initial(),'parentheses');assert.equal(A.capture('expression-parser',expr,{},'B').metrics.결과,20);
 let gc=labs['gc-reachability'].action(labs['gc-reachability'].initial(),'cycle');assert.equal(A.capture('gc-reachability',gc,{},'A').metrics.C상태,'회수 후보');gc=labs['gc-reachability'].action(labs['gc-reachability'].initial(),'root-c');assert.equal(A.capture('gc-reachability',gc,{},'B').metrics.C상태,'도달 가능');
 let pipe=labs['pipeline-hazards'].action(labs['pipeline-hazards'].initial(),'no-forward');assert.equal(A.capture('pipeline-hazards',pipe,{},'A').metrics.사이클,11);pipe=labs['pipeline-hazards'].action(labs['pipeline-hazards'].initial(),'forward');assert.equal(A.capture('pipeline-hazards',pipe,{},'B').metrics.사이클,7);
 let amdahl=labs['amdahl-speedup'].initial();assert.equal(A.capture('amdahl-speedup',amdahl,{},'A').metrics.속도향상,'4.71');amdahl=labs['amdahl-speedup'].action(amdahl,'cores',16);assert.equal(A.capture('amdahl-speedup',amdahl,{},'B').metrics.속도향상,'6.40');
 let replica=labs['replica-consistency'].action(labs['replica-consistency'].initial(),'stale');assert.equal(A.capture('replica-consistency',replica,{},'A').metrics.B값,'old');replica=labs['replica-consistency'].action(labs['replica-consistency'].initial(),'async-write');replica=labs['replica-consistency'].action(replica,'deliver-b');replica=labs['replica-consistency'].action(replica,'read-b');assert.equal(A.capture('replica-consistency',replica,{},'B').metrics.B값,'v1');
 let raft=labs['raft-quorum'].action(labs['raft-quorum'].initial(),'propose');assert.equal(A.capture('raft-quorum',raft,{},'A').metrics.효과,0);raft=labs['raft-quorum'].action(raft,'to-b');assert.equal(A.capture('raft-quorum',raft,{},'B').metrics.효과,1);
});

test('R6 비교 미션의 A와 B 기대값은 실제 모델 결과와 일치한다',()=>{
 const context=load(),labs=context.CS.labs,A=context.CS.learning.labAdapters;
 let scale=labs['scaling-distribution'].action(labs['scaling-distribution'].initial(),'scale-out');assert.equal(A.capture('scaling-distribution',scale,{},'A').metrics.초과,0);scale=labs['scaling-distribution'].action(labs['scaling-distribution'].initial(),'hot');assert.equal(A.capture('scaling-distribution',scale,{},'B').metrics.초과,56);
 let queue=labs['bounded-queue'].action(labs['bounded-queue'].initial(),'bounded');assert.equal(A.capture('bounded-queue',queue,{},'A').metrics.거부,18);queue=labs['bounded-queue'].action(labs['bounded-queue'].initial(),'backpressure');assert.equal(A.capture('bounded-queue',queue,{},'B').metrics.상류지연,18);
 let module=labs['module-boundary'].action(labs['module-boundary'].initial(),'tangled-sms');assert.equal(A.capture('module-boundary',module,{},'A').metrics.변경영향,3);module=labs['module-boundary'].action(labs['module-boundary'].initial(),'separated-sms');assert.equal(A.capture('module-boundary',module,{},'B').metrics.변경영향,2);
 let arch=labs['architecture-tradeoff'].action(labs['architecture-tradeoff'].initial(),'notify-required');assert.equal(A.capture('architecture-tradeoff',arch,{},'A').metrics.주문,'보상 필요');arch=labs['architecture-tradeoff'].action(labs['architecture-tradeoff'].initial(),'notify-best');assert.equal(A.capture('architecture-tradeoff',arch,{},'B').metrics.주문,'완료');
 let invariants=labs['test-invariants'].action(labs['test-invariants'].initial(),'broken');assert.equal(A.capture('test-invariants',invariants,{},'A').metrics.항목보존,'실패');invariants=labs['test-invariants'].action(labs['test-invariants'].initial(),'fixed');assert.equal(A.capture('test-invariants',invariants,{},'B').metrics.항목보존,'통과');
 let boundary=labs['boundary-debugging'].action(labs['boundary-debugging'].initial(),'reproduce');assert.equal(A.capture('boundary-debugging',boundary,{},'A').metrics.통과,'2/3');boundary=labs['boundary-debugging'].action(labs['boundary-debugging'].initial(),'fix');assert.equal(A.capture('boundary-debugging',boundary,{},'B').metrics.통과,'3/3');
 let deploy=labs['canary-deployment'].action(labs['canary-deployment'].initial(),'run20');assert.equal(A.capture('canary-deployment',deploy,{},'A').metrics.전체오류율,'10%');deploy=labs['canary-deployment'].action(labs['canary-deployment'].initial(),'ratio50');deploy=labs['canary-deployment'].action(deploy,'ten');deploy=labs['canary-deployment'].action(deploy,'ten');assert.equal(A.capture('canary-deployment',deploy,{},'B').metrics.전체오류율,'50%');
 let observe=labs['observability-recovery'].action(labs['observability-recovery'].initial(),'all-fast');assert.equal(A.capture('observability-recovery',observe,{},'A').metrics.p95,'10ms');observe=labs['observability-recovery'].action(observe,'baseline');assert.equal(A.capture('observability-recovery',observe,{},'B').metrics.p95,'1000ms');
});

test('완료한 시험 문항은 선택지별 오답 설명을 가진다',()=>{
 const context=load();vm.runInContext(read('content/exam-bank.js'),context);vm.runInContext(read('content/exam-feedback.js'),context);
 Object.keys(context.CS.examBank).forEach(id=>assert.ok(context.CS.examBank[id].every(item=>item.revision===4&&item.wrong.length===2)));
});

test('통신 품질 표기와 query-plan 안내가 실제 용어와 일치한다',()=>{
 assert.doesNotMatch(read('content/ch15.js'),/좋은put/);
 assert.match(read('content/ch15.js'),/유효 처리량 \(Goodput\)/);
 assert.doesNotMatch(read('src/lab-guides.js'),/예상 행 정보/);
});
