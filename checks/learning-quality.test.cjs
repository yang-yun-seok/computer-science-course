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

test('대표 비교 미션은 실제 실습 6개에 하나씩 연결된다',()=>{
 const context=load();
 const ids=['cpu-add','bst-traversal','graph-paths','tcp-recovery','query-plan','event-loop-order'];
 assert.deepEqual(Object.keys(context.CS.labMissions).sort(),ids.sort());
 ids.forEach(id=>{const mission=context.CS.labMissions[id];assert.equal(mission.steps.length,2);assert.equal(mission.checks.length,2);assert.ok(mission.goal.length>20);});
});

test('비교 미션은 실제 상태가 조건에 맞을 때만 결과를 기록한다',()=>{
 const context=load(),A=context.CS.learning.labAdapters;
 let cpu=context.CS.labs['cpu-add'].initial({a:3,b:2});for(let i=0;i<5;i++)cpu=context.CS.labs['cpu-add'].step(cpu,{a:3,b:2});
 assert.equal(A.capture('cpu-add',cpu,{a:3,b:2},'A').metrics.결과,5);
 assert.equal(A.capture('cpu-add',cpu,{a:8,b:7},'B'),null);
 const tcp=context.CS.labs['tcp-recovery'].action(context.CS.labs['tcp-recovery'].initial(),'run-loss');
 assert.equal(A.capture('tcp-recovery',tcp,{},'B').metrics.재전송,'1회');
 assert.equal(A.capture('tcp-recovery',tcp,{},'A'),null);
});

test('대표 시험 문항은 선택지별 오답 설명을 가진다',()=>{
 const context=load();vm.runInContext(read('content/exam-bank.js'),context);vm.runInContext(read('content/exam-feedback.js'),context);
 ['ch01-l01','ch08-l01','ch08-l02','ch13-l02','ch15-l02','ch16-l01'].forEach(id=>assert.ok(context.CS.examBank[id].every(item=>item.revision===4&&item.wrong.length===2)));
});

test('통신 품질 표기와 query-plan 안내가 실제 용어와 일치한다',()=>{
 assert.doesNotMatch(read('content/ch15.js'),/좋은put/);
 assert.match(read('content/ch15.js'),/유효 처리량 \(Goodput\)/);
 assert.doesNotMatch(read('src/lab-guides.js'),/예상 행 정보/);
});
