const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const root=path.join(__dirname,'..');
const read=file=>fs.readFileSync(path.join(root,file),'utf8');
const load=()=>{
 const context={console,Math,JSON,Date,URL,URLSearchParams};context.window=context;context.globalThis=context;vm.createContext(context);
 vm.runInContext(read('src/core.js'),context);
 const curriculum=read('content/curriculum.md');
 const chapters=[...curriculum.matchAll(/^## (\d+)\. (.+)$/gm)].map(m=>({id:+m[1],title:m[2]}));
 const lessons=[...curriculum.matchAll(/^### (\d+)-(\d+)\. (.+)$/gm)].map(m=>({id:`ch${m[1].padStart(2,'0')}-l${m[2].padStart(2,'0')}`,chapter:+m[1],sub:+m[2],title:m[3]}));
 context.CATALOG={chapters,lessons};
 for(const file of fs.readdirSync(path.join(root,'content')).filter(name=>/^ch\d+.*\.js$/.test(name)).sort())vm.runInContext(read(`content/${file}`),context);
 vm.runInContext(read('content/exam-bank.js'),context);vm.runInContext(read('content/exam-presets.js'),context);vm.runInContext(read('content/exams.js'),context);vm.runInContext(read('src/assessment/model.js'),context);
 return context;
};

test('시험 문제은행은 모든 소단원에 6개 문항과 안정적인 ID를 제공한다',()=>{
 const context=load(),questions=context.CS.examQuestions;
 assert.equal(Object.keys(context.CS.lessons).length,48);
 assert.equal(questions.length,288);
 assert.equal(new Set(questions.map(q=>q.id)).size,288);
 assert.equal(new Set(questions.map(q=>q.prompt)).size,288);
 assert.ok(questions.every(q=>/-e0[1-6]$/.test(q.id)&&q.revision===3&&q.lessonId&&q.options.length===3&&new Set(q.options.map(o=>o.text)).size===3&&q.options.some(o=>o.id===q.correctOptionId)&&q.feedback.length===3&&q.reviewTargets.length));
 assert.ok(questions.every(q=>!q.conceptTags.includes('goal-check')&&!q.prompt.includes('가장 직접 확인할 내용')));
 for(const [lessonId,lesson] of Object.entries(context.CS.lessons))assert.deepEqual(questions.filter(q=>q.lessonId===lessonId).map(q=>q.reviewTargets[0].sectionId),lesson.sections.map(section=>section.id));
});

test('288개 시험 문항은 정규화 중복과 학습 피드백 누락이 없다',()=>{
 const questions=load().CS.examQuestions;
 const normalize=value=>value.normalize('NFKC').replace(/[\s?.!,`'"“”‘’·:;()\[\]{}+-]/g,'').toLowerCase();
 const normalizedPrompts=questions.map(question=>normalize(question.prompt));
 assert.equal(new Set(normalizedPrompts).size,questions.length);
 assert.ok(questions.every(question=>question.prompt.endsWith('?')));
 assert.ok(questions.every(question=>question.prompt.length>=20));
 assert.ok(questions.every(question=>question.feedback.every(feedback=>feedback.length>=15&&/[.!?요]$/.test(feedback))));
 assert.ok(questions.every(question=>new Set(question.options.map(option=>normalize(option.text))).size===3));
 assert.ok(questions.every(question=>question.conceptTags.length===1&&['application','prediction'].includes(question.conceptTags[0])));
 assert.ok(questions.every(question=>question.reviewTargets.length===1));
});

const webStorage=map=>({getItem:key=>map.has(key)?map.get(key):null,setItem:(key,value)=>map.set(key,String(value)),removeItem:key=>map.delete(key)});
const storageContext=(shared,session=new Map(),broken=false)=>{const context={console,Math,JSON,Date,URL,URLSearchParams,localStorage:broken?{getItem(){throw Error('blocked');},setItem(){throw Error('blocked');},removeItem(){throw Error('blocked');}}:webStorage(shared),sessionStorage:webStorage(session)};context.window=context;context.globalThis=context;vm.createContext(context);vm.runInContext(read('src/core.js'),context);vm.runInContext(read('src/assessment/model.js'),context);vm.runInContext(read('src/assessment/storage.js'),context);return context;};

test('응시 소유권은 탭 사이에서 보호되고 명시적으로 이전할 수 있다',()=>{
 const shared=new Map(),first=storageContext(shared),second=storageContext(shared);
 const attempt={id:'attempt-1',status:'in-progress',questions:[],answers:{},flags:{}};
 assert.equal(first.CS.assessment.storage.putAttempt(attempt),true);
 assert.equal(second.CS.assessment.storage.ownership(),'other');
 assert.equal(second.CS.assessment.storage.putAttempt(attempt),false);
 assert.equal(second.CS.assessment.storage.claim(true),true);
 assert.equal(first.CS.assessment.storage.ownership(),'other');
 assert.equal(second.CS.assessment.storage.finishAttempt({...attempt,status:'submitted'}),true);
 assert.equal(first.CS.assessment.storage.active(),null);
 assert.equal(first.CS.assessment.storage.history().length,1);
});

test('브라우저 저장소가 막혀도 현재 탭의 응시와 복습은 메모리에 유지된다',()=>{
 const context=storageContext(new Map(),new Map(),true),storage=context.CS.assessment.storage;
 const attempt={id:'volatile',status:'in-progress',questions:[],answers:{},flags:{}};
 assert.equal(storage.putAttempt(attempt),false);
 assert.equal(storage.active().id,'volatile');
 assert.equal(storage.healthy(),false);
 const question={id:'q1',lessonId:'ch01-l01',options:[{id:'a',text:'A'}],correctOptionId:'a',feedback:['설명'],reviewTargets:[{lessonId:'ch01-l01',sectionId:'b01'}]};
 assert.equal(storage.addReview(question,'시험 · 예시',null),false);
 assert.equal(storage.reviews().length,1);
});

test('시험 출제·채점은 범위와 문항 수를 지키고 선택지 순서와 독립적이다',()=>{
 const context=load(),assessment=context.CS.assessment,preset=context.CS.examPresets.find(p=>p.id==='stage-1');
 const attempt=assessment.createAttempt(preset,context.CS.examQuestions,{startedAt:1000,seed:'fixture'});
 assert.equal(attempt.questions.length,preset.count);
 assert.ok(attempt.questions.every(q=>preset.lessonIds.includes(q.lessonId)));
 const answered=attempt.questions.reduce((next,q)=>assessment.updateAnswer(next,q.id,q.correctOptionId),attempt);
 const result=assessment.grade(answered);assert.equal(result.correct,preset.count);assert.equal(result.score,100);
 const empty=assessment.grade(attempt);assert.equal(empty.unanswered,preset.count);assert.equal(empty.score,0);
});

test('응시 상태는 제출 후 불변이고 시간 제한이 있는 응시는 만료된다',()=>{
 const context=load(),assessment=context.CS.assessment,preset={...context.CS.examPresets.find(p=>p.id==='appendix'),minutes:0};
 const attempt=assessment.createAttempt(preset,context.CS.examQuestions,{startedAt:0,seed:'timeout'});
 assert.equal(assessment.isExpired(attempt),true);
 const submitted=assessment.submit(attempt,'timeout');
 assert.equal(submitted.status,'submitted');assert.equal(submitted.submitReason,'timeout');
 const changed=assessment.updateAnswer(submitted,submitted.questions[0].id,submitted.questions[0].correctOptionId);assert.deepEqual(changed,submitted);
});

test('웹 빌드는 외부 자산과 단일 파일 자산을 각각 만든다',()=>{
 const build=read('scripts/build.cjs'),packageJson=JSON.parse(read('package.json'));
 assert.match(build,/assetDir/);assert.match(build,/htmlFor=inline/);assert.match(packageJson.scripts.build,/optimize-images/);
 if(!fs.existsSync(path.join(root,'dist/index.html')))return;
 const web=fs.readFileSync(path.join(root,'dist/index.html'),'utf8'),single=fs.readFileSync(path.join(root,'dist/cs-course.html'),'utf8');
 assert.match(web,/assets\/foodtruck-cpu-memory\.jpg/);assert.doesNotMatch(web,/data:image\/jpeg;base64/);assert.match(single,/data:image\/jpeg;base64/);
 assert.ok(fs.existsSync(path.join(root,'dist','assets','foodtruck-cpu-memory.jpg')));
});
