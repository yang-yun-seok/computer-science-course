const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const root=path.join(__dirname,'..'),read=file=>fs.readFileSync(path.join(root,file),'utf8');
const storage=()=>{const data=new Map();return {getItem:key=>data.has(key)?data.get(key):null,setItem:(key,value)=>data.set(key,String(value)),removeItem:key=>data.delete(key)};};
function load(){const context=vm.createContext({console,structuredClone,localStorage:storage(),Date});context.window=context;context.globalThis=context;vm.runInContext(read('src/core.js'),context);for(const file of fs.readdirSync(path.join(root,'src/labs')).filter(file=>file.endsWith('.js')).sort())vm.runInContext(read(`src/labs/${file}`),context);vm.runInContext(read('src/learning/case-model.js'),context);vm.runInContext(read('content/cases.js'),context);return context;}

test('종합 사례 3개는 9개 독립 도해와 기존 실습·단원을 연결한다',()=>{
 const context=load(),cases=context.CS.cases;
 assert.equal(cases.map(item=>item.id).join(','),'slow-site,data-recovery,scale-limit');
 assert.equal(cases.flatMap(item=>item.diagrams).length,9);
 for(const item of cases){assert.equal(item.hypotheses.length,3);assert.ok(item.lessons.length>=3);assert.ok(item.labs.length>=2);assert.ok(item.cautions.length>=3);assert.ok(item.diagrams.every(diagram=>diagram.title&&diagram.caption));item.labs.forEach(id=>assert.ok(context.CS.labs[id],`${item.id}의 ${id} 실습이 필요해요.`));}
});

test('사례 초안은 단계·가설·근거를 복원하고 revision 변경 시 초기화한다',()=>{
 const context=load(),model=context.CS.learning.caseModel,definition=context.CS.cases[0];
 let state=model.load(definition);state=model.patch(state,{stage:'experiment',hypothesis:'db-path',originalHypothesis:'db-path',reason:'데이터베이스 구간이 가장 길게 관측되어 먼저 확인합니다.'});state=model.record(state,'query-plan','동일 결과에서 접근 계획이 달라지는 상태를 기록했습니다.');
 const restored=model.load(definition);assert.equal(restored.stage,'experiment');assert.equal(restored.hypothesis,'db-path');assert.equal(restored.evidence.length,1);
 const reset=model.load({...definition,revision:definition.revision+1});assert.equal(reset.stage,'observe');assert.equal(reset.hypothesis,'');assert.equal(reset.evidence.length,0);
});

test('사례 완료는 충분한 설명·추가 확인·세 자기 점검이 모두 필요하다',()=>{
 const context=load(),model=context.CS.learning.caseModel,definition=context.CS.cases[1];let state=model.load(definition);
 state=model.patch(state,{explanation:'관측 자료와 원인 후보를 나누고 각 실험의 조건과 결과, 개선안과 한계를 함께 설명한 문장입니다.',additionalCheck:'저장 완료 시각과 복제본 버전 로그를 추가로 확인하겠습니다.',checks:{c1:true,c2:true,c3:true}});
 assert.equal(model.complete(state).completed,true);
 assert.equal(model.complete({...state,checks:{c1:true,c2:false,c3:true}}).completed,false);
});

test('앱은 사례 목록·단계·관련 단원 왕복 경로를 제공한다',()=>{
 const app=read('src/app.js'),view=read('src/learning/case-view.js');
 assert.match(app,/id==='cases'/);assert.match(app,/id==='case'/);assert.match(app,/caseReturn/);
 assert.match(view,/data-record-evidence/);assert.match(view,/labAdapters\.capture/);assert.match(view,/자동 이해도 점수는 매기지 않아요/);
});
