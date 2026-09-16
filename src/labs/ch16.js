(()=>{
const {escape:e}=CS.helpers;

const orderInitial=()=>({prediction:'',logs:[],queues:{stack:[],microtasks:[],tasks:[]},runs:0,events:[]});
const runActual=signal=>new Promise((resolve,reject)=>{
 const logs=[],queues={stack:['A 출력'],microtasks:['Promise → B'],tasks:['setTimeout → C']};
 logs.push('A');
 Promise.resolve().then(()=>logs.push('B'));
 const timer=setTimeout(()=>{logs.push('C');resolve({logs,queues:{stack:[],microtasks:[],tasks:[]}});},0);
 if(signal)signal.addEventListener('abort',()=>{clearTimeout(timer);reject(new DOMException('실습을 중단했어요.','AbortError'));},{once:true});
});
CS.labs['event-loop-order']={custom:true,async:true,title:'A·B·C가 어떤 순서로 출력되는지 실제로 실행하세요',type:'실제 JavaScript 태스크·마이크로태스크 실행',intro:'동기 A를 출력하고, setTimeout의 C와 Promise 반응의 B를 예약해요. 실행 스택이 비면 마이크로태스크를 먼저 비우므로 A→B→C가 돼요.',limit:'준비한 코드만 실행하며 임의 코드는 받지 않아요. 타이머 지연 시간은 정확한 실행 시각이 아니라 최소 대기 조건이고, 브라우저가 바쁘면 더 늦어질 수 있어요.',
 initial:orderInitial,
 async action(s,a,data,context={}){if(a==='reset')return orderInitial();if(a==='predict')return {...s,prediction:data,events:[`예상 순서를 ${data}로 골랐어요.`]};if(a==='preset-error')throw Error('준비된 오류 예시예요. 오류가 나도 이전 실행 결과는 그대로 남아요.');if(a==='run'||a==='repeat'){const result=await runActual(context.signal);return {...s,logs:result.logs,queues:result.queues,runs:s.runs+1,events:[...s.events,`실제 실행 ${s.runs+1}회 · ${result.logs.join(' → ')}`]};}throw Error('알 수 없는 이벤트 루프 동작이에요.');},
 describe(s){if(!s.logs.length)return '먼저 순서를 예상한 뒤 실제 브라우저에서 실행해 보세요.';return `실제 출력은 ${s.logs.join(' → ')}예요.${s.prediction?` 예상 ${s.prediction}과 ${s.prediction===s.logs.join('→')?'같아요.':'달라요.'}`:''}`;},
 actions(){return [{id:'run',text:'실제로 실행',primary:true},{id:'repeat',text:'한 번 더 실행'},{id:'preset-error',text:'준비된 오류 실행'},{id:'reset',text:'처음부터'}];},
 render(s){const choices=['A→B→C','A→C→B','B→A→C'].map(v=>`<button type="button" data-action="predict" data-value="${v}" class="${s.prediction===v?'selected':''}">${v}</button>`).join('');return `<div class="order-predict"><b>먼저 예상하기</b><div>${choices}</div></div><div class="event-queues"><section><small>호출 스택</small><strong>${s.logs.length?'비어 있음':'A 실행 전'}</strong></section><section><small>마이크로태스크 큐</small><strong>Promise → B</strong></section><section><small>태스크 큐</small><strong>setTimeout → C</strong></section></div><div class="order-output">${s.logs.length?s.logs.map((v,i)=>`<span><small>${i+1}</small>${e(v)}</span>`).join('<i>→</i>'):'<em>아직 실행하지 않았어요.</em>'}</div><p class="small">실행 횟수 <b>${s.runs}회</b> · 각 실행은 새 로그에서 시작해요.</p>`;}
};

const keySession='cs-course-ch16-session-font',keyLocal='cs-course-ch16-local-font';
const storeFor=kind=>kind==='session'?sessionStorage:localStorage;
const readStore=kind=>{try{const raw=storeFor(kind).getItem(kind==='session'?keySession:keyLocal);return {supported:true,value:raw===null?null:Number(raw)};}catch{return {supported:false,value:null};}};
const writeStore=(kind,value)=>{try{storeFor(kind).setItem(kind==='session'?keySession:keyLocal,String(value));return true;}catch{return false;}};
const removeStore=kind=>{try{storeFor(kind).removeItem(kind==='session'?keySession:keyLocal);return true;}catch{return false;}};
const storageInitial=()=>{const session=readStore('session'),local=readStore('local');return {memory:null,session:session.value,local:local.value,support:{session:session.supported,local:local.supported},refreshed:false,events:[]};};
const savedValue=v=>v===null?'없음':`${v}px`;
CS.labs['storage-lifetime']={custom:true,title:'세 위치에 글자 크기20을 저장하고 새로고침 뒤를 비교하세요',type:'실제 Web Storage와 메모리 수명 관찰',intro:'메모리 변수는 현재 문서에만 있고 sessionStorage와 localStorage는 브라우저 저장소에 기록돼요. 이 교안 전용 키만 사용하고 언제든 지울 수 있어요.',limit:'같은 출처의 이 교안 전용 키 두 개만 사용해요. 사생활 보호 설정·저장 용량·file 출처 등에서 접근이 거부될 수 있어 예외를 잡아 표시해요. sessionStorage의 탭 복원 동작은 브라우저에 따라 달라질 수 있어요.',
 initial:storageInitial,
 action(s,a){if(a==='save-memory')return {...s,memory:20,refreshed:false,events:[...s.events,'메모리 변수에20px 저장']};if(a==='save-session'){if(!writeStore('session',20))throw Error('sessionStorage 접근이 차단됐어요.');return {...s,session:20,support:{...s.support,session:true},refreshed:false,events:[...s.events,'sessionStorage에20px 저장']};}if(a==='save-local'){if(!writeStore('local',20))throw Error('localStorage 접근이 차단됐어요.');return {...s,local:20,support:{...s.support,local:true},refreshed:false,events:[...s.events,'localStorage에20px 저장']};}if(a==='run-compare'){if(!writeStore('session',20)||!writeStore('local',20))throw Error('브라우저 저장소 접근이 차단돼 비교를 끝낼 수 없어요.');return {...s,memory:null,session:20,local:20,support:{session:true,local:true},refreshed:true,events:[...s.events,'세 위치에20px 저장','새로고침 모형 · 메모리는 기본18px, 두 저장소는20px']};}if(a==='refresh'){const fresh=storageInitial();return {...fresh,refreshed:true,events:[...s.events,'새로고침 모형 · 문서 메모리를 비우고 저장소를 다시 읽음']};}if(a==='blocked')throw Error('저장 접근이 거부된 상황이에요. 기존 값은 바꾸지 않았어요.');if(a==='clear'){removeStore('session');removeStore('local');return {...storageInitial(),events:[...s.events,'교안 전용 저장값을 모두 지웠어요.']};}throw Error('알 수 없는 저장소 동작이에요.');},
 describe(s){if(s.refreshed)return `새로고침 뒤 메모리 ${s.memory===null?'기본18px':savedValue(s.memory)}, sessionStorage ${savedValue(s.session)}, localStorage ${savedValue(s.local)}예요.`;return '위치를 하나씩 저장하거나 세 위치 비교를 실행해 보세요.';},
 actions(){return [{id:'save-memory',text:'메모리에20 저장',primary:true},{id:'save-session',text:'세션에20 저장'},{id:'save-local',text:'로컬에20 저장'},{id:'refresh',text:'새로고침 모형'},{id:'run-compare',text:'세 위치 한 번에 비교'},{id:'blocked',text:'저장 차단 상황'},{id:'clear',text:'교안 저장값 지우기'}];},
 render(s){const rows=[['문서 메모리',s.memory,true,'새로고침까지'],['sessionStorage',s.session,s.support.session,'같은 탭 세션'],['localStorage',s.local,s.support.local,'명시적 삭제 전까지']];return `<div class="storage-live">${rows.map(([name,value,ok,life])=>`<section class="${value===20?'has-value':''}"><small>${name}</small><strong>${ok?savedValue(value):'사용 불가'}</strong><span>${life}</span></section>`).join('')}</div><div class="font-preview" style="font-size:${s.memory||s.session||s.local||18}px">Aa 가나다 · 현재 읽을 값 ${(s.memory||s.session||s.local||18)}px</div>`;}
};
})();
