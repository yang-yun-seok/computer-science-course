(()=>{
const {escape:e,table,integer}=CS.helpers;
const copy=s=>structuredClone(s);
const distribute=(total,count,mode)=>{
 const loads=Array(count).fill(0);
 if(!total)return loads;
 if(count===1){loads[0]=total;return loads;}
 if(mode==='round'||mode==='split-hot'){for(let i=0;i<total;i++)loads[i%count]++;return loads;}
 if(mode==='hot'){
  loads[0]=Math.ceil(total*.8);for(let i=loads[0];i<total;i++)loads[1+(i-loads[0])%Math.max(1,count-1)]++;return loads;
 }
 loads[0]=Math.ceil(total*.5);if(count===2){loads[1]=total-loads[0];return loads;}
 loads[1]=Math.ceil(total/3);let rest=total-loads[0]-loads[1];for(let i=0;i<rest;i++)loads[2+i%(count-2)]++;return loads;
};
const calculate=config=>{
 const requests=integer(config.requests,0,1000,'요청 수'),servers=integer(config.servers,1,10,'서버 수'),capacity=integer(config.capacity,1,200,'서버 용량'),cacheHit=integer(config.cacheHit,0,100,'캐시 적중률');
 const modes=['round','sticky','hot','split-hot'];if(!modes.includes(config.mode))throw Error('지원하지 않는 분산 정책이에요.');
 const cacheServed=Math.floor(requests*cacheHit/100),originRequests=requests-cacheServed,loads=distribute(originRequests,servers,config.mode);
 const processed=loads.reduce((sum,v)=>sum+Math.min(v,capacity),0),overflow=loads.reduce((sum,v)=>sum+Math.max(0,v-capacity),0);
 return {config:{requests,servers,capacity,cacheHit,mode:config.mode},loads,cacheServed,originRequests,processed,overflow,events:[`요청 ${requests}개 · 캐시 ${cacheServed}개 · 원본 서버 ${originRequests}개`,`처리 ${processed}개 · 초과 ${overflow}개`]};
};
const scalingInitial=()=>calculate({requests:120,servers:2,capacity:40,cacheHit:0,mode:'round'});
const presets={
 baseline:{requests:120,servers:2,capacity:40,cacheHit:0,mode:'round'},
 'scale-up':{requests:120,servers:2,capacity:60,cacheHit:0,mode:'round'},
 'scale-out':{requests:120,servers:3,capacity:40,cacheHit:0,mode:'round'},
 cache:{requests:120,servers:2,capacity:40,cacheHit:50,mode:'round'},
 sticky:{requests:120,servers:3,capacity:40,cacheHit:0,mode:'sticky'},
 hot:{requests:120,servers:3,capacity:40,cacheHit:0,mode:'hot'},
 'split-hot':{requests:120,servers:3,capacity:40,cacheHit:0,mode:'split-hot'},
 zero:{requests:0,servers:2,capacity:40,cacheHit:0,mode:'round'}
};
const modeName={round:'균등 분산',sticky:'세션 고정',hot:'핫키 샤드', 'split-hot':'핫키 분할'};
CS.labs['scaling-distribution']={custom:true,title:'서버·캐시·분산 정책이 처리량에 미치는 영향을 비교하세요',type:'결정적 요청 배치·용량 모형',intro:'120개 요청을 서버에 나눠 보고, 총 용량이 같아도 쏠림이 생기면 일부 요청이 넘치는지 확인해요.',limit:'한 번의 요청 묶음과 고정 용량만 다루는 교육 모형이에요. 실제 시스템에는 요청별 비용, 연결, 자동 확장 지연, 캐시 무효화, 복제와 장애가 더해져요.',
 initial:scalingInitial,
 action(s,a,value){if(a==='reset')return scalingInitial();if(presets[a])return calculate(presets[a]);if(a==='invalid')return calculate({...s.config,servers:0});if(['requests','servers','capacity','cacheHit','mode'].includes(a)){const n={...s.config,[a]:value};return calculate(n);}throw Error('알 수 없는 확장 실습 동작이에요.');},
 describe(s){const spare=s.config.servers*s.config.capacity-s.originRequests;return `${modeName[s.config.mode]} · 전체 ${s.config.requests}개 중 캐시 ${s.cacheServed}개, 원본 서버 처리 ${s.processed}개, 초과 ${s.overflow}개${spare>=0?' · 총 용량 여유 '+spare+'개':' · 총 용량 부족 '+Math.abs(spare)+'개'}`;},
 actions(){return [{id:'baseline',text:'기준 2대 × 40',primary:true},{id:'scale-up',text:'서버 성능 높이기'},{id:'scale-out',text:'서버 1대 추가'},{id:'cache',text:'캐시 50%'},{id:'sticky',text:'세션 고정 쏠림'},{id:'hot',text:'핫키 80%'},{id:'split-hot',text:'핫키 분할'},{id:'zero',text:'요청 0개'},{id:'invalid',text:'서버 0대 오류'},{id:'reset',text:'처음부터'}];},
 render(s){const c=s.config,max=Math.max(c.capacity,...s.loads,1);return `<div class="traffic-config"><label>요청<select data-action="requests">${[0,60,120,240].map(v=>`<option ${v===c.requests?'selected':''}>${v}</option>`).join('')}</select></label><label>서버<select data-action="servers">${[1,2,3,4].map(v=>`<option ${v===c.servers?'selected':''}>${v}</option>`).join('')}</select></label><label>한 대 용량<select data-action="capacity">${[20,40,60,100].map(v=>`<option ${v===c.capacity?'selected':''}>${v}</option>`).join('')}</select></label><label>캐시 적중<select data-action="cacheHit">${[0,25,50,75].map(v=>`<option value="${v}" ${v===c.cacheHit?'selected':''}>${v}%</option>`).join('')}</select></label><label>정책<select data-action="mode">${Object.entries(modeName).map(([v,n])=>`<option value="${v}" ${v===c.mode?'selected':''}>${n}</option>`).join('')}</select></label></div><div class="traffic-split"><span>전체 요청 <b>${c.requests}</b></span><i>→</i><span class="cache">캐시 처리 <b>${s.cacheServed}</b></span><i>→</i><span>원본 서버 <b>${s.originRequests}</b></span></div><div class="traffic-nodes">${s.loads.map((load,i)=>`<section class="${load>c.capacity?'overloaded':''}"><b>${c.mode.includes('hot')?'Shard':'Server'} ${i+1}</b><div class="load-track"><i style="height:${Math.round(load/max*100)}%"></i><em style="bottom:${Math.round(c.capacity/max*100)}%"></em></div><strong>${load} / ${c.capacity}</strong><small>${load>c.capacity?`${load-c.capacity}개 초과`:`${c.capacity-load}개 여유`}</small></section>`).join('')}</div><div class="traffic-metrics"><span>캐시 처리<b>${s.cacheServed}</b></span><span>서버 처리<b>${s.processed}</b></span><span>초과 요청<b>${s.overflow}</b></span><span>최대 부하<b>${Math.max(0,...s.loads)}</b></span></div>`;}
};

const queueInitial=()=>({arrival:8,service:3,limit:10,mode:'bounded',queue:0,processed:0,rejected:0,delayed:0,ticks:0,events:[]});
const validateQueue=s=>{integer(s.arrival,0,100,'도착량');integer(s.service,0,100,'처리량');integer(s.limit,1,100,'큐 한도');if(!['unbounded','bounded','backpressure'].includes(s.mode))throw Error('지원하지 않는 큐 정책이에요.');};
const tickQueue=s=>{validateQueue(s);const n=copy(s),space=n.mode==='unbounded'?n.arrival:Math.max(0,n.limit-n.queue),accepted=Math.min(n.arrival,space),overflow=n.arrival-accepted;n.queue+=accepted;if(n.mode==='bounded')n.rejected+=overflow;if(n.mode==='backpressure')n.delayed+=overflow;const done=Math.min(n.queue,n.service);n.queue-=done;n.processed+=done;n.ticks++;n.events.push(`${n.ticks}초 · 도착 ${n.arrival}, 수락 ${accepted}, 처리 ${done}, 대기 ${n.queue}${overflow?` · ${n.mode==='backpressure'?'상류 지연':'거부'} ${overflow}`:''}`);return n;};
const runTicks=(s,count)=>{let n=s;for(let i=0;i<count;i++)n=tickQueue(n);return n;};
const queuePreset=(arrival,service,limit,mode)=>({arrival,service,limit,mode,queue:0,processed:0,rejected:0,delayed:0,ticks:0,events:[]});
CS.labs['bounded-queue']={custom:true,title:'도착률과 처리율을 바꾸며 큐 적체와 과부하 제어를 관찰하세요',type:'초 단위 생산자·소비자 큐 모형',intro:'매초 들어오는 작업과 소비자가 처리하는 작업의 차이가 대기열이 돼요. 제한 큐와 백프레셔가 과부하를 어디에서 드러내는지 비교해요.',limit:'모든 작업의 비용이 같고 한 번의 시간 단위에 도착 후 처리한다고 가정해요. 실제 브로커는 파티션, 확인, 재전송, 순서, 지연과 장애를 함께 다뤄요.',
 initial:queueInitial,
 action(s,a,value){if(a==='reset')return queueInitial();if(a==='tick')return tickQueue(s);if(a==='five')return runTicks(s,5);if(a==='balanced')return runTicks(queuePreset(5,5,20,'unbounded'),5);if(a==='overload')return runTicks(queuePreset(8,3,100,'unbounded'),5);if(a==='bounded')return runTicks(queuePreset(8,3,10,'bounded'),5);if(a==='backpressure')return runTicks(queuePreset(8,3,10,'backpressure'),5);if(a==='add-consumer')return runTicks({...s,service:12},5);if(a==='burst')return runTicks(queuePreset(12,4,10,'bounded'),3);if(a==='retry-storm')return runTicks(queuePreset(12,3,100,'unbounded'),5);if(a==='invalid')return tickQueue({...s,limit:0});if(['arrival','service','limit','mode'].includes(a)){const n={...s,[a]:a==='mode'?value:Number(value),queue:0,processed:0,rejected:0,delayed:0,ticks:0,events:[]};validateQueue(n);return n;}throw Error('알 수 없는 큐 실습 동작이에요.');},
 describe(s){return `${s.ticks}초 · 대기 ${s.queue}개 · 누적 처리 ${s.processed}개 · 거부 ${s.rejected}개 · 상류 지연 ${s.delayed}개`;},
 actions(){return [{id:'tick',text:'1초 진행',primary:true},{id:'five',text:'5초 진행'},{id:'balanced',text:'균형 5 ↔ 5'},{id:'overload',text:'무제한 큐 과부하'},{id:'bounded',text:'제한 큐'},{id:'backpressure',text:'백프레셔'},{id:'add-consumer',text:'소비자 증설'},{id:'burst',text:'순간 폭주'},{id:'retry-storm',text:'재시도 폭주'},{id:'invalid',text:'한도 0 오류'},{id:'reset',text:'처음부터'}];},
 render(s){const shown=Math.min(s.limit,20),filled=Math.min(s.queue,shown);return `<div class="queue-config"><label>초당 도착<select data-action="arrival">${[0,3,5,8,12].map(v=>`<option ${v===s.arrival?'selected':''}>${v}</option>`).join('')}</select></label><label>초당 처리<select data-action="service">${[0,3,5,8,12].map(v=>`<option ${v===s.service?'selected':''}>${v}</option>`).join('')}</select></label><label>큐 한도<select data-action="limit">${[5,10,20,100].map(v=>`<option ${v===s.limit?'selected':''}>${v}</option>`).join('')}</select></label><label>정책<select data-action="mode"><option value="unbounded" ${s.mode==='unbounded'?'selected':''}>무제한</option><option value="bounded" ${s.mode==='bounded'?'selected':''}>가득 차면 거부</option><option value="backpressure" ${s.mode==='backpressure'?'selected':''}>상류 지연</option></select></label></div><div class="queue-flow"><span><b>Producer</b>${s.arrival}/초</span><i>→</i><div><b>QUEUE ${s.queue}/${s.mode==='unbounded'?'∞':s.limit}</b><div class="queue-slots">${Array.from({length:shown},(_,i)=>`<em class="${i<filled?'filled':''}"></em>`).join('')}</div>${s.queue>shown?`<small>화면 밖 대기 ${s.queue-shown}개</small>`:''}</div><i>→</i><span><b>Consumer</b>${s.service}/초</span></div><div class="queue-metrics"><span>대기<b>${s.queue}</b></span><span>누적 처리<b>${s.processed}</b></span><span>거부<b>${s.rejected}</b></span><span>상류 지연<b>${s.delayed}</b></span></div>${table(['정책','가득 찼을 때','관찰할 지표'],[['무제한 큐','계속 쌓임','대기 길이·메모리·지연'],['제한 큐','초과 작업 거부','거부율·성공률'],['백프레셔','생산자를 늦춤','상류 지연·처리율']])}`;}
};
})();
