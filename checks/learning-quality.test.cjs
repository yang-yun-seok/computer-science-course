const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const root=path.join(__dirname,'..');
const read=file=>fs.readFileSync(path.join(root,file),'utf8');

function load(){
 const context=vm.createContext({console,structuredClone,DOMException});context.window=context;context.localStorage={getItem(){return null;},setItem(){},removeItem(){}};
 vm.runInContext(read('src/core.js'),context);
 vm.runInContext(read('src/lab-guides.js'),context);
 for(const file of fs.readdirSync(path.join(root,'src/labs')).filter(file=>file.endsWith('.js')).sort())vm.runInContext(read(`src/labs/${file}`),context);
 for(const file of ['src/learning/mission-model.js','src/learning/storage.js','src/learning/lab-adapters.js'])vm.runInContext(read(file),context);
 vm.runInContext(read('content/lab-missions.js'),context);
 return context;
}

test('구현한 비교 미션은 실제 실습에 하나씩 연결된다',()=>{
 const context=load();
 const ids=['cpu-add','memory-save','cpu-schedule','lru-cache','process-state','thread-pool','library-query','loan-transaction','sql-first','bit-byte','pixel-size','stack-queue','hash-buckets','bst-traversal','graph-paths','tcp-recovery','query-plan','event-loop-order'];
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

test('대표 시험 문항은 선택지별 오답 설명을 가진다',()=>{
 const context=load();vm.runInContext(read('content/exam-bank.js'),context);vm.runInContext(read('content/exam-feedback.js'),context);
 ['ch01-l01','ch01-l02','ch02-l01','ch02-l02','ch03-l01','ch03-l02','ch04-l01','ch04-l02','ch08-l01','ch08-l02','ch13-l02','ch15-l02','ch16-l01'].forEach(id=>assert.ok(context.CS.examBank[id].every(item=>item.revision===4&&item.wrong.length===2)));
});

test('통신 품질 표기와 query-plan 안내가 실제 용어와 일치한다',()=>{
 assert.doesNotMatch(read('content/ch15.js'),/좋은put/);
 assert.match(read('content/ch15.js'),/유효 처리량 \(Goodput\)/);
 assert.doesNotMatch(read('src/lab-guides.js'),/예상 행 정보/);
});
