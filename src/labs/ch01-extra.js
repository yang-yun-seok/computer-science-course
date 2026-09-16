(()=>{
const {escape:e,integer,table}=CS.helpers;
CS.labs['lru-cache']={
 title:'두 칸 캐시에서 자료 찾기',type:'학습용 LRU 캐시 모형',intro:'A, B, A, C, A 순서로 요청해요. 세 번째 A를 읽은 뒤, C가 들어오면 어떤 항목이 나갈까요?',limit:'각 문자 한 개가 한 칸을 차지하는 모형이에요. 실제 CPU의 캐시 라인·연관도·쓰기 정책은 생략했어요. 표시 순서는 주소가 아니라 최근 사용 순서예요.',
 fields:[{key:'capacity',label:'캐시 칸 수',value:'2',inputmode:'numeric'},{key:'requests',label:'요청 순서',value:'A,B,A,C,A',wide:true}],
 validate(raw){const capacity=integer(raw.capacity,1,4,'캐시 칸 수'),text=String(raw.requests).trim();const requests=text?text.split(',').map(x=>x.trim()):[];if(requests.length>12||requests.some(x=>!(/^[A-D]$/).test(x)))throw Error('요청 순서는 A부터 D까지를 쉼표로 구분해 12개 이내로 입력해 주세요. 쉼표 사이를 비우지 마세요.');return {capacity,requests};},
 initial(p){return {index:0,order:[],hits:0,misses:0,last:null,events:[],done:p.requests.length===0};},
 step(s,p){if(s.done)return s;const n=structuredClone(s),request=p.requests[s.index],found=n.order.indexOf(request);let evicted=null;
 if(found>=0){n.hits++;n.order.splice(found,1);}else{n.misses++;if(n.order.length===p.capacity)evicted=n.order.shift();}n.order.push(request);n.index++;n.last={request,hit:found>=0,evicted};n.done=n.index===p.requests.length;
 n.events.push(found>=0?`${request}: 히트. 캐시에 있어서 그대로 사용하고 가장 최근 위치로 옮겼어요.`:`${request}: 미스. ${evicted?`가장 오래 사용하지 않은 ${evicted}를 내보내고 `:''}${request}를 가져왔어요.`);return n;},
 describe(s,p){return s.index?`${s.index}/${p.requests.length} 요청 처리 — ${s.events.at(-1)}`:s.done?'요청이 없어 완료했어요. 히트율은 아직 계산하지 않아요.':'캐시가 비어 있어요. 첫 요청을 처리해 보세요.';},
 render(s,p){return `<div class="small muted">요청 순서 · 다음 요청은 ${e(p.requests[s.index]??'없음')}</div><div class="token-row">${p.requests.map((x,i)=>`<span class="token ${i===s.index?'current':i<s.index?'faded':''}">${e(x)}</span>`).join('')||'<span class="muted">요청 없음</span>'}</div><div class="small muted">캐시 · 왼쪽은 오래 사용하지 않음, 오른쪽은 최근 사용</div><div class="token-row">${s.order.map(x=>`<span class="token">${e(x)}</span>`).join('')}${Array.from({length:p.capacity-s.order.length},()=>'<span class="token empty">빈칸</span>').join('')}</div><div class="metric-row"><div class="metric"><strong>${s.hits}</strong><small>히트</small></div><div class="metric"><strong>${s.misses}</strong><small>미스</small></div><div class="metric"><strong>${s.index?`${Math.round(s.hits/s.index*100)}%`:'—'}</strong><small>처리한 요청의 히트율</small></div></div>`;}
};
const jobs=['A','B','C'];
const scheduler={
 initial(p){return {t:0,remaining:{A:p.a,B:p.b,C:p.c},firstStart:{A:null,B:null,C:null},completion:{A:null,B:null,C:null},readyQueue:['A','B','C'],running:null,sliceUsed:0,timeline:[],events:[],done:false};},
 step(s,p){if(s.done)return s;const n=structuredClone(s);if(!n.running){n.running=n.readyQueue.shift();n.sliceUsed=0;}
 const job=n.running;if(n.firstStart[job]===null)n.firstStart[job]=n.t;
 n.remaining[job]--;n.timeline.push(job);n.t++;n.sliceUsed++;let reason='계속 실행할 수 있어요.';
 if(!n.remaining[job]){n.completion[job]=n.t;n.running=null;reason=`${job} 작업이 완료됐어요.`;}
 else if(p.policy==='RR'&&n.sliceUsed>=p.quantum){n.readyQueue.push(job);n.running=null;reason=`시간 조각 ${p.quantum} tick을 사용해 ${job}를 큐 뒤로 보냈어요.`;}
 n.done=jobs.every(j=>n.remaining[j]===0);n.events.push(`${n.t-1}→${n.t}: ${job}를 1 tick 실행했어요. ${reason}`);return n;},
 complete(p){let s=this.initial(p);while(!s.done)s=this.step(s,p);return s;},
 metrics(s,p){const waits=jobs.map(j=>s.completion[j]-p[j.toLowerCase()]);return {response:jobs.reduce((a,j)=>a+s.firstStart[j],0)/3,wait:waits.reduce((a,b)=>a+b,0)/3,waits};}
};
CS.helpers.scheduler=scheduler;
CS.labs['cpu-schedule']={
 title:'주문 처리 순서를 바꿔 보세요',type:'CPU 1개 · 스케줄링 모형',intro:'긴 주문 A 뒤에 짧은 주문 B와 C가 기다려요. 처음 처리받는 시각과 모든 처리가 끝나는 시각을 비교해 보세요.',limit:'모든 작업이 시각 0에 도착해요. 시간 단위는 가상 tick이며 실제 초가 아니에요. 입출력 대기와 문맥 교환 비용은 생략했어요.',
 fields:[{key:'a',label:'A 처리량',value:'6',inputmode:'numeric'},{key:'b',label:'B 처리량',value:'2',inputmode:'numeric'},{key:'c',label:'C 처리량',value:'1',inputmode:'numeric'},{key:'policy',label:'정책',value:'FCFS',options:[{value:'FCFS',label:'FCFS · 먼저 온 순서'},{value:'RR',label:'RR · 번갈아 처리'}]},{key:'quantum',label:'RR 시간 조각',value:'1',inputmode:'numeric'}],
 validate(raw){if(!['FCFS','RR'].includes(raw.policy))throw Error('정책은 FCFS 또는 RR로 선택해 주세요.');return {a:integer(raw.a,1,9,'A 처리량'),b:integer(raw.b,1,9,'B 처리량'),c:integer(raw.c,1,9,'C 처리량'),policy:raw.policy,quantum:integer(raw.quantum,1,3,'RR 시간 조각')};},
 initial:p=>scheduler.initial(p),step:(s,p)=>scheduler.step(s,p),
 describe(s,p){return s.t?`${p.policy} · ${s.events.at(-1)}${s.done?' 모든 작업이 끝났어요.':''}`:`${p.policy} 준비 — A, B, C가 시각 0에 함께 도착했어요.`;},
 render(s,p){let comparison='';if(s.done){const fcfs=scheduler.complete({...p,policy:'FCFS'}),rr=scheduler.complete({...p,policy:'RR'}),fm=scheduler.metrics(fcfs,p),rm=scheduler.metrics(rr,p);comparison=`<h4 style="margin-top:24px">같은 입력을 끝까지 계산한 정책 비교</h4>${table(['지표','FCFS',`RR · ${p.quantum} tick`],[['평균 첫 응답',fm.response.toFixed(2)+' tick',rm.response.toFixed(2)+' tick'],['평균 대기',fm.wait.toFixed(2)+' tick',rm.wait.toFixed(2)+' tick'],['모두 완료',fcfs.t+' tick',rr.t+' tick']])}`;}
 return `<p class="small">현재 시각 <strong>${s.t} tick</strong> · 다음 실행 ${e(s.running??s.readyQueue[0]??'없음')} · 준비 큐 ${s.readyQueue.length?s.readyQueue.map(e).join(' → '):'비어 있음'}</p><div class="timeline" aria-label="시간별 실행 작업">${s.timeline.map((job,i)=>`<span class="tick" data-job="${job}">${job}<small>${i}→${i+1}</small></span>`).join('')||'<span class="muted">아직 실행한 작업이 없어요.</span>'}</div>${table(['작업','남은 처리량','첫 실행','완료 시각'],jobs.map(j=>[j,s.remaining[j],s.firstStart[j]===null?'아직 없음':s.firstStart[j]+' tick',s.completion[j]===null?'아직 없음':s.completion[j]+' tick']))}${comparison}`;}
};
})();
