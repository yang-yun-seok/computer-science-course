(()=>{
const {escape:e,integer, value,table}=CS.helpers;
CS.labs['cpu-add']={
 title:'계산 주문 처리하기',type:'학습용 모형 · 실제 덧셈',intro:'3 + 2의 결과를 예상한 뒤 한 단계씩 따라가 보세요. 값이 지금 어디에 있는지 살펴보세요.',
 limit:'입력부터 출력까지를 5개의 학습 단계로 나눈 모형이에요. 실제 CPU의 클록이나 기계어 명령 수를 뜻하지 않아요.',
 fields:[{key:'a',label:'첫 번째 수',value:'3',inputmode:'numeric'},{key:'b',label:'두 번째 수',value:'2',inputmode:'numeric'}],
 validate(raw){return {a:integer(raw.a,0,99,'첫 번째 수'),b:integer(raw.b,0,99,'두 번째 수')};},
 initial(p){return {step:0,request:null,ram:{a:null,b:null,result:null},cpu:{instruction:null,result:null},output:null,events:[],done:false};},
 step(s,p){if(s.done)return s;const n=structuredClone(s);n.step++;
 const messages=['',`${p.a}과 ${p.b}를 더해 달라는 입력을 받았어요.`,`${p.a}과 ${p.b}를 RAM에 두고, 수행할 명령 ADD를 준비했어요.`,`CPU가 ${p.a}과 ${p.b}를 더했어요. CPU의 계산값은 ${p.a+p.b}예요.`,`계산값 ${p.a+p.b}를 RAM의 결과 칸에 기록했어요.`,`결과 ${p.a+p.b}가 화면에 도착했어요.`];
 if(n.step===1)n.request={...p,op:'ADD'};
 if(n.step===2){n.ram.a=p.a;n.ram.b=p.b;n.cpu.instruction='ADD';}
 if(n.step===3)n.cpu.result=n.ram.a+n.ram.b;
 if(n.step===4)n.ram.result=n.cpu.result;
 if(n.step===5){n.output=n.ram.result;n.done=true;}
 n.events.push(messages[n.step]);return n;},
 describe(s){return s.step===0?'0/5 준비 — 아직 입력을 전달하지 않았어요. 한 단계를 눌러 시작하세요.':`${s.step}/5 ${['','입력','준비한 자료','계산','결과 기록','출력'][s.step]} — ${s.events.at(-1)}`;},
 render(s,p){const active=n=>s.step===n?' active':'';const indicator=on=>`<span class="current-indicator">${on?'현재 단계':''}</span>`;return `<div class="cpu-grid"><div class="device${active(1)}"><h4>입력 장치</h4><small>더할 두 수</small><div class="device-value">${s.request?`${p.a} + ${p.b}`:'—'}</div>${indicator(s.step===1)}</div><div class="device${[2,4].includes(s.step)?' active':''}"><h4>RAM · 작업 공간</h4><div class="ram-inputs"><span>a: ${s.ram.a??'—'}</span><span>b: ${s.ram.b??'—'}</span></div><div class="ram-result"><small>RAM 결과</small>${value(s.ram.result)}</div>${indicator([2,4].includes(s.step))}</div><div class="device${active(3)}"><h4>CPU</h4><small>${s.cpu.instruction?'명령: 덧셈 ADD':'명령 대기'}</small>${value(s.cpu.result)}${indicator(s.step===3)}</div><div class="device${active(5)}"><h4>화면 출력</h4><small>학생에게 보이는 값</small>${value(s.output)}${indicator(s.step===5)}</div></div><p class="cpu-transfer">${['아직 이동하지 않았어요.','사용자 입력 → 계산 요청','입력한 자료 → RAM · 명령 준비','RAM의 두 수 → CPU의 덧셈','CPU의 계산값 → RAM의 결과 칸','RAM의 결과 → 화면 출력'][s.step]}</p><div class="step-strip">${['입력','자료 준비','CPU 계산','RAM 기록','화면 출력'].map((x,i)=>`<span class="${s.step>i?'done':''}">${i+1}. ${x}</span>`).join('')}</div>`;}
};
CS.labs['memory-save']={
 title:'저장한 글은 어디에 남을까요?',type:'학습용 전원·저장 모형',intro:'글을 고치고, 저장하거나 저장하지 않은 채 모형 전원을 꺼 보세요.',limit:'모형의 전원만 조작해요. 실제 기기를 끄거나 파일을 저장하지 않아요. 자동 저장과 기록 도중 장애는 생략했어요.',custom:true,
 initial(){return {power:true,draft:'첫 문장',saved:'첫 문장',message:'작업 중인 글과 저장한 글이 같아요.',events:[]};},
 action(s,action,data){const n={...s,events:[...s.events]};if(action==='reset')return this.initial();
 if(action==='edit'){if(!s.power)return s;if(typeof data!=='string'||[...data].length>100)throw Error('100자 이내로 입력해 주세요.');n.draft=data;n.message='작업 중인 글을 바꿨어요. 저장한 글은 그대로예요.';return n;}
 if(action==='save'){if(!s.power)return s;n.saved=n.draft;n.message='지금 작업 중인 글을 저장했어요.';}
 if(action==='power'){n.power=!s.power;if(n.power){n.draft=n.saved;n.message='저장한 글을 작업 공간으로 다시 불러왔어요.';}else{n.draft=null;n.message='작업 공간은 비었지만 저장한 글은 남아 있어요.';}}
 n.events.push(n.message);return n;},
 describe(s){return `${s.power?'전원 켜짐':'전원 꺼짐'} — ${s.message}`;},
 render(s){return `<div class="memory-grid"><div class="memory-panel${s.power?'':' power-off'}"><h4>RAM · 작업 중인 글</h4><label class="sr-only" for="draft-text">작업 중인 글</label><textarea id="draft-text" data-action="edit" maxlength="100" ${s.power?'':'disabled'}>${e(s.draft??'')}</textarea><small>${s.power?'글을 고친 뒤 저장 여부를 선택해 보세요.':'전원이 꺼져 작업 공간의 내용이 사라졌어요.'}</small></div><div class="memory-panel"><h4>저장장치 · 저장한 글</h4><div class="saved-text">${s.saved?e(s.saved):'<span class="muted">빈 글을 저장했어요.</span>'}</div><small>전원이 꺼져도 모형의 저장 기록을 관찰할 수 있어요.</small></div></div>`;},
 actions(s){return [{id:'save',text:'지금 글 저장',disabled:!s.power,primary:true},{id:'power',text:s.power?'모형 전원 끄기':'모형 전원 켜기'},{id:'reset',text:'예시로 초기화'}];}
};
})();
