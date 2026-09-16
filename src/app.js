(()=>{
'use strict';
const {escape:e}=CS.helpers;
const main=document.querySelector('#main'),sidebar=document.querySelector('#sidebar'),menu=document.querySelector('#menu-toggle');
const live=document.querySelector('#announcer');
let currentId='',cleanup=[],activeLabs=new Map();
function announce(message){live.textContent=message;}
function level(ch){return ch<=6?'1강':ch<=12?'2강':ch<=20?'3강':'부록';}
function nav(){let group='';sidebar.innerHTML=`<a class="nav-overview" href="#overview" ${currentId==='overview'?'aria-current="page"':''}><span>학습 개요</span><strong>왜 CS를 배울까요?</strong></a>`+CATALOG.chapters.map(ch=>{
 const next=level(ch.id);const header=next!==group?`<div class="nav-group-label">${next}</div>`:'';group=next;
 const lessons=CATALOG.lessons.filter(l=>l.chapter===ch.id);const selected=lessons.some(l=>l.id===currentId);
 return `${header}<details class="nav-chapter" ${selected?'open':''}><summary><span class="nav-number">${String(ch.id).padStart(2,'0')}</span>${e(ch.title)}</summary><div class="nav-lessons">${lessons.map(l=>CS.lessons[l.id]?`<a href="#${l.id}" ${l.id===currentId?'aria-current="page"':''}>${l.sub}. ${e(l.title)}</a>`:`<span class="nav-pending">${l.sub}. ${e(l.title)} <small>제작 중</small></span>`).join('')}</div></details>`;
 }).join('')+`<div class="nav-bottom"><strong>학습 순서</strong><br>개념 보기 → 직접 실험하기 → 내 말로 설명하기</div>`;
}
function mountLab(root,key){
 const lab=CS.labs[key];if(!lab){root.textContent='이 실습은 아직 제작 중이에요.';return;}
 const life=new AbortController();let state,parameters={},mode='ready',timer=null,generation=0,busy=false;
 const fieldId=field=>`${key}-${field.key}`;
 root.innerHTML=`<div class="lab-heading"><div class="lab-type">${e(lab.type)}</div><h3>${e(lab.title)}</h3><p>${e(lab.intro)}</p></div>${lab.fields?.length?`<form class="lab-form" novalidate>${lab.fields.map(field=>`<label class="field${field.wide?' wide':''}" for="${fieldId(field)}"><span id="${fieldId(field)}-label">${e(field.label)}</span>${field.options?`<select id="${fieldId(field)}" name="${field.key}" aria-labelledby="${fieldId(field)}-label">${field.options.map(o=>`<option value="${e(o.value)}" ${o.value===field.value?'selected':''}>${e(o.label)}</option>`).join('')}</select>`:`<input id="${fieldId(field)}" name="${field.key}" value="${e(field.value)}" ${field.inputmode?`inputmode="${field.inputmode}"`:''} autocomplete="off" spellcheck="false">`}</label>`).join('')}<button type="submit">입력 적용</button></form>`:''}<div class="lab-errors" id="${key}-error" role="alert"></div><div class="lab-stage"></div><p class="lab-status" aria-live="off"></p><div class="lab-controls"></div><details class="lab-log"><summary>단계 기록 보기</summary><ol></ol></details><p class="lab-limit">${e(lab.limit)}</p>`;
 const stage=root.querySelector('.lab-stage'),status=root.querySelector('.lab-status'),controls=root.querySelector('.lab-controls'),errors=root.querySelector('.lab-errors'),form=root.querySelector('form'),log=root.querySelector('.lab-log');
 const fields=()=>Object.fromEntries((lab.fields||[]).map(f=>[f.key,form.elements.namedItem(f.key).value]));
 const setFields=p=>(lab.fields||[]).forEach(f=>form.elements.namedItem(f.key).value=String(p[f.key]??f.value));
 function clearError(){errors.textContent='';form?.querySelectorAll('[aria-invalid]').forEach(el=>{el.removeAttribute('aria-invalid');el.removeAttribute('aria-describedby');});}
 function fail(error){stop(false);errors.textContent=error.message||String(error);const field=lab.fields?.find(f=>errors.textContent.includes(f.label));if(field){const el=form.elements.namedItem(field.key);el.setAttribute('aria-invalid','true');el.setAttribute('aria-describedby',errors.id);el.focus();}announce(errors.textContent);}
 function stop(speak=true){clearTimeout(timer);timer=null;if(mode==='running'){mode=state.done?'completed':'paused';if(speak)announce('일시 정지했어요.');}generation++;paintControls();}
 function paintControls(){const focus=controls.contains(document.activeElement)?document.activeElement.dataset.action:null;
 const list=lab.custom?lab.actions(state):[{id:'step',text:'한 단계',primary:true,disabled:state.done||mode==='running'},{id:'play',text:mode==='running'?'일시 정지':'자동 실행',disabled:state.done},{id:'restart',text:'처음부터'},{id:'reset',text:'예시로 초기화'}];
 controls.innerHTML=list.map(a=>`<button type="button" data-action="${a.id}" ${a.primary?'class="primary"':''} ${a.disabled||busy?'disabled':''}>${e(a.text)}</button>`).join('');
 if(focus){const replacement=controls.querySelector(`[data-action="${focus}"]`);if(replacement&&!replacement.disabled)replacement.focus({preventScroll:true});}
 }
 function paint(includeStage=true,speak=false){if(includeStage)stage.innerHTML=lab.render(state,parameters);status.textContent=lab.describe(state,parameters);paintControls();const events=state.events||[];log.querySelector('ol').innerHTML=events.slice(-200).map(v=>`<li>${e(typeof v==='string'?v:JSON.stringify(v))}</li>`).join('');log.hidden=events.length===0;if(speak)announce(status.textContent);}
 function init(p){stop(false);parameters=p;state=lab.initial(p);mode=state.done?'completed':'ready';clearError();paint();}
 function apply(){const next=lab.validate(fields());if(JSON.stringify(next)!==JSON.stringify(parameters)){init(next);setFields(next);announce('입력이 바뀌어 처음부터 시작해요.');return true;}clearError();return false;}
 function step(speak){if(state.done)return;state=lab.step(state,parameters);if(state.done){clearTimeout(timer);timer=null;mode='completed';}else if(mode!=='running')mode='paused';paint(true,speak||state.done);}
 function play(){if(mode==='running'){stop();return;}apply();if(state.done)return;mode='running';generation++;const own=generation;paintControls();announce('자동 실행을 시작해요.');const tick=()=>{if(own!==generation||mode!=='running')return;step(false);if(!state.done)timer=setTimeout(tick,1000);};timer=setTimeout(tick,1000);}
 async function act(action,data){try{
  if(lab.custom){if(busy)return;const mine=++generation;busy=!!lab.async&&action==='run';if(busy){stage.querySelectorAll('textarea').forEach(el=>el.readOnly=true);status.textContent='SQL 실행 중이에요.';paintControls();}try{const next=await lab.action(state,action,data,{signal:life.signal});if(mine!==generation||life.signal.aborted)return;state=next;clearError();}finally{busy=false;if(!life.signal.aborted){stage.querySelectorAll('textarea').forEach(el=>el.readOnly=false);paint(action!=='edit',action!=='edit');}}return;}
  if(action==='step'){if(mode==='running')return;apply();step(true);}
  else if(action==='play')play();
  else if(action==='restart'){init(parameters);setFields(parameters);announce('같은 입력으로 처음부터 시작해요.');}
  else if(action==='reset'){const defaults=Object.fromEntries(lab.fields.map(f=>[f.key,f.value]));init(lab.validate(defaults));setFields(defaults);announce('기본 예시로 초기화했어요.');}
 }catch(error){fail(error);}}
 // Initialization happens before controls query state.
 parameters=lab.custom?{}:lab.validate(Object.fromEntries(lab.fields.map(f=>[f.key,f.value])));
 state=lab.initial(parameters);mode=state.done?'completed':'ready';paint();
 controls.addEventListener('click',event=>{const b=event.target.closest('button[data-action]');if(b&&!b.disabled)act(b.dataset.action);},{signal:life.signal});
 stage.addEventListener('input',event=>{if(event.target.dataset.action)act(event.target.dataset.action,event.target.value);},{signal:life.signal});
 stage.addEventListener('click',event=>{const b=event.target.closest('button[data-action]');if(b&&!b.disabled)act(b.dataset.action,b.dataset.value);},{signal:life.signal});
 if(form){form.addEventListener('submit',event=>{event.preventDefault();stop(false);try{apply();paint();}catch(error){fail(error);}},{signal:life.signal});form.addEventListener('focusin',()=>stop(false),{signal:life.signal});}
 const handle={read:()=>({lab:key,parameters,state,mode}),act,configure(raw){stop(false);const p=lab.validate(raw);init(p);setFields(p);return this.read();},dispose(){clearTimeout(timer);generation++;life.abort();}};
 activeLabs.set(key,handle);cleanup.push(()=>handle.dispose());
}
function questionHTML(q,index){return `<div class="quiz" data-question="${index}"><fieldset><legend>${index+1}. ${e(q.q)}</legend>${q.options.map((option,i)=>`<label class="quiz-option"><input type="radio" name="q${index}" value="${i}"><span>${e(option)}</span></label>`).join('')}</fieldset><div class="quiz-actions"><button data-check="${index}" class="primary">답 확인하기</button><button data-reveal="${index}">해설 보기</button></div><div class="quiz-feedback" role="status"></div></div>`;}
function renderOverview(){
 cleanup.forEach(fn=>fn());cleanup=[];activeLabs=new Map();announce('');currentId='overview';nav();const o=CS.overview;
 if(!o){main.innerHTML='<div class="not-ready"><h1>학습 개요를 불러오지 못했어요.</h1><a href="#ch01-l01">첫 단원으로 이동하기</a></div>';return;}
 document.title='Computer Science';
 main.innerHTML=`<article class="overview"><section class="overview-hero"><div><span class="overview-eyebrow">${e(o.eyebrow)}</span><h1 tabindex="-1"><span>${e(o.title[0])}</span><span>${e(o.title[1])}</span></h1><p>${e(o.lead)}</p><div class="overview-actions"><a class="button-link primary" href="#ch01-l01">첫 단원 시작하기</a><a class="button-link" href="#overview/learning-path">전체 흐름 보기</a></div></div><div class="request-journey" aria-label="한 번의 클릭이 브라우저 네트워크 서버 데이터베이스를 거쳐 다시 화면으로 돌아오는 흐름"><span><b>클릭</b>입력</span><i>→</i><span><b>브라우저</b>프로그램</span><i>→</i><span><b>네트워크</b>통신</span><i>→</i><span><b>서버</b>처리</span><i>→</i><span><b>DB</b>데이터</span><i>→</i><strong>화면<br>결과</strong></div></section><section class="overview-section"><div class="section-kicker">왜 배울까요?</div><h2>코드를 넘어 시스템 전체를 보는 눈을 길러요</h2><div class="reason-grid">${o.reasons.map(r=>`<section><span>${e(r.number)}</span><h3>${e(r.title)}</h3><p>${e(r.text)}</p></section>`).join('')}</div></section><section id="learning-path" class="overview-section"><div class="section-kicker">학습 지도</div><h2>작은 계산에서 실제 서비스의 운영까지 연결해요</h2><div class="learning-path">${o.path.map((p,i)=>`<a href="${e(p.href)}"><span>${e(p.label)}</span><div><h3>${e(p.title)}</h3><p>${e(p.text)}</p></div><b>${String(i+1).padStart(2,'0')}</b></a>`).join('')}</div></section><section class="overview-section overview-method"><div><div class="section-kicker">이렇게 공부해요</div><h2>보고, 움직여 보고, 설명해 보세요</h2><p>실습의 정답을 빠르게 누르는 것보다 상태가 왜 바뀌었는지 소리 내어 설명하는 것이 더 중요해요.</p></div><ol>${o.method.map(m=>`<li><span>${e(m.step)}</span><div><h3>${e(m.title)}</h3><p>${e(m.text)}</p></div></li>`).join('')}</ol></section><section class="overview-start"><span>준비됐나요?</span><h2>CPU와 메모리에서 첫 흐름을 시작해요</h2><p>계산기에 숫자를 넣고 결과가 화면에 나타날 때, 값이 어디를 거쳐 가는지 직접 확인합니다.</p><a class="button-link primary" href="#ch01-l01">01. CPU와 메모리 시작하기 →</a></section></article>`;
 main.querySelector('h1')?.focus({preventScroll:true});
}
function renderLesson(id){
 cleanup.forEach(fn=>fn());cleanup=[];activeLabs=new Map();announce('');currentId=id;const meta=CATALOG.lessons.find(l=>l.id===id),lesson=CS.lessons[id];nav();
 if(!meta||!lesson){main.innerHTML=`<div class="not-ready"><h1>${meta?'이 단원은 제작 중이에요.':'학습 주소를 찾지 못했어요.'}</h1><p>${meta?e(meta.title):'목차에서 원하는 소단원을 골라 주세요.'}</p><a href="#ch01-l01">첫 단원으로 돌아가기</a></div>`;return;}
 const position=CATALOG.lessons.findIndex(l=>l.id===id),prev=CATALOG.lessons[position-1],next=CATALOG.lessons[position+1];
 document.title=`${meta.title} | Computer Science`;
 const sectionHTML=lesson.sections.map((s,i)=>`<section id="${s.id}" class="section"><div class="section-kicker">${String(i+1).padStart(2,'0')} / 살펴보기</div><h2>${s.title}</h2>${s.html||''}${s.lab?`<div class="lab" data-lab="${s.lab}"></div>`:''}</section>`).join('');
 main.innerHTML=`<article class="lesson"><div class="crumb"><span class="level">${level(meta.chapter)}</span><span>${String(meta.chapter).padStart(2,'0')}. ${e(CATALOG.chapters.find(c=>c.id===meta.chapter).title)}</span><span>${meta.sub}/2</span></div><h1 tabindex="-1">${e(meta.title)}</h1><p class="lesson-lead">${e(lesson.lead)}</p><div class="learning-goals"><strong>이번에 이해할 것</strong><ul>${lesson.goals.map(g=>`<li>${e(g)}</li>`).join('')}</ul></div>${lesson.prerequisites?.length?`<p class="small muted">앞에서 배운 것: ${lesson.prerequisites.map(p=>`<a href="#${p}">${e(CATALOG.lessons.find(l=>l.id===p)?.title||p)}</a>`).join(' · ')}</p>`:''}<nav class="jump-links" aria-label="이 단원의 학습 흐름"><a href="#${id}/${lesson.sections[0].id}">개념 살펴보기</a><a href="#${id}/${lesson.sections.find(s=>s.lab)?.id||lesson.sections[0].id}">직접 해보기</a><a href="#${id}/questions">확인 문제</a><a href="#${id}/summary">핵심 정리</a></nav>${sectionHTML}<section id="questions" class="section"><div class="section-kicker">이해 확인</div><h2>이제 내 말로 설명해 볼까요?</h2><p class="muted">먼저 답을 골라 보세요. 틀렸다면 이유를 읽고 실습으로 돌아가 다시 확인해도 괜찮아요.</p>${lesson.questions.map(questionHTML).join('')}</section><section id="summary" class="section"><div class="section-kicker">이번 단원 정리</div><h2>세 가지만 기억해요</h2><ol class="summary-list">${lesson.summary.map(s=>`<li>${e(s)}</li>`).join('')}</ol><p>${e(lesson.nextQuestion)}</p></section><details class="more sources"><summary>참고한 자료</summary><div class="more-body"><p>본문은 학습 흐름에 맞춰 새로 작성했어요. 더 자세한 설명은 아래 자료에서 확인할 수 있어요. 출처 링크를 여는 데에는 인터넷 연결이 필요해요.</p><ul>${lesson.sources.map(([name,url])=>`<li><a href="${e(url)}" target="_blank" rel="noopener noreferrer">${e(name)}</a></li>`).join('')}</ul></div></details><footer class="lesson-footer">${prev&&CS.lessons[prev.id]?`<a href="#${prev.id}">← 이전 · ${e(prev.title)}</a>`:'<span></span>'}${next&&CS.lessons[next.id]?`<a href="#${next.id}">다음 · ${e(next.title)} →</a>`:next?`<span class="small muted">다음 단원 제작 중 · ${e(next.title)}</span>`:'<span>전체 과정을 마쳤어요.</span>'}</footer></article>`;
 main.querySelectorAll('[data-lab]').forEach(el=>mountLab(el,el.dataset.lab));
 const quizLife=new AbortController();cleanup.push(()=>quizLife.abort());
 main.addEventListener('click',event=>{
 const check=event.target.closest('[data-check]'),reveal=event.target.closest('[data-reveal]');if(!check&&!reveal)return;
 const index=+(check?.dataset.check??reveal.dataset.reveal),q=lesson.questions[index],block=main.querySelector(`[data-question="${index}"]`),selected=block.querySelector('input:checked'),feedback=block.querySelector('.quiz-feedback');
 if(check&&!selected){feedback.className='quiz-feedback';feedback.textContent='먼저 답 하나를 골라 주세요.';return;}
 const chosen=reveal?q.answer:+selected.value,correct=chosen===q.answer;
 feedback.className=`quiz-feedback${correct?'':' wrong'}`;feedback.innerHTML=`<strong>${reveal?'해설을 확인했어요.':correct?'잘 이해했어요.':'다시 살펴볼까요?'}</strong><br>${e(q.feedback[chosen])}${reveal?`<br>정답: ${e(q.options[q.answer])}`:''}<br><a href="#${id}/${q.review}">설명과 실습으로 돌아가기</a>`;
 },{signal:quizLife.signal});
}
function route(){const [wanted,section]=location.hash.replace(/^#/,'').split('/');const id=wanted||'overview';if(id!==currentId){if(id==='overview')renderOverview();else renderLesson(id);}document.body.classList.remove('menu-open');menu.setAttribute('aria-expanded','false');menu.textContent='목차 열기';if(section){document.getElementById(section)?.scrollIntoView({block:'start'});}else{window.scrollTo(0,0);main.querySelector('h1')?.focus({preventScroll:true});}}
menu.addEventListener('click',()=>{const open=document.body.classList.toggle('menu-open');menu.setAttribute('aria-expanded',String(open));menu.textContent=open?'목차 닫기':'목차 열기';if(open)sidebar.querySelector('[aria-current=page]')?.focus();});
document.addEventListener('keydown',event=>{if(event.key==='Escape'&&document.body.classList.contains('menu-open')){document.body.classList.remove('menu-open');menu.setAttribute('aria-expanded','false');menu.textContent='목차 열기';menu.focus();}});
document.querySelector('.skip').addEventListener('click',event=>{event.preventDefault();main.focus();window.scrollTo(0,0);});
window.addEventListener('hashchange',route);window.addEventListener('pagehide',()=>cleanup.forEach(fn=>fn()));window.addEventListener('pageshow',event=>{if(event.persisted){if(currentId==='overview')renderOverview();else renderLesson(currentId);}});route();
// Optional browser tools share the exact actions and lesson state used by the UI.
if(document.modelContext?.registerTool){const life=new AbortController();const register=tool=>{try{Promise.resolve(document.modelContext.registerTool(tool,{signal:life.signal})).catch(()=>{});}catch{}};
 register({name:'read_cs_lesson',description:'현재 CS 소단원과 실습의 상태를 읽습니다.',inputSchema:{type:'object',properties:{},additionalProperties:false},annotations:{readOnlyHint:true},execute:()=>({lesson:currentId,labs:[...activeLabs.values()].map(h=>h.read())})});
 register({name:'step_cs_lab',description:'현재 소단원에서 단계형 실습을 한 단계 실행합니다.',inputSchema:{type:'object',properties:{labId:{type:'string'}},required:['labId'],additionalProperties:false},execute:async input=>{const h=activeLabs.get(input.labId);if(!h||CS.labs[input.labId].custom)throw Error('현재 단계형 실습 ID를 지정해 주세요.');await h.act('step');return h.read();}});
 window.addEventListener('pagehide',()=>life.abort(),{once:true});
}
})();

