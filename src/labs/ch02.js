(()=>{
const {escape:e,table,integer}=CS.helpers;
const names=['A','B'];
const processLab={
 custom:true,title:'CPU 차례와 입출력 완료를 구별해요',type:'CPU 1개 · 프로세스 상태 모형',
 intro:'A 실행 → 명령 한 개 → 입출력 요청 → B 실행 → A 입출력 완료 순서로 눌러 보세요. 입출력이 끝난 A는 곧바로 CPU를 사용할까요?',
 limit:'프로세스마다 쓰레드가 하나인 모형이에요. 명령은 각각 3개이고 입출력은 프로세스별로 한 번 요청할 수 있어요. 실제 운영체제의 실행 상태를 읽거나 바꾸지는 않아요.',
 initial(){return {running:null,ready:['A','B'],jobs:{A:{state:'준비',pc:1,saved:1,ioUsed:false},B:{state:'준비',pc:1,saved:1,ioUsed:false}},events:[],done:false};},
 action(s,action){if(action==='reset')return this.initial();const n=structuredClone(s),[verb,id]=action.split(':');const j=n.jobs[id];let message='';
 if(verb==='dispatch'){if(!j||j.state!=='준비'||n.running)throw Error('CPU가 비어 있고 준비 상태인 작업만 실행할 수 있어요.');n.ready=n.ready.filter(x=>x!==id);n.running=id;j.state='수행';j.pc=j.saved;message=`${id}: 준비 → 수행. 저장한 다음 명령 ${j.pc}에서 이어서 시작해요.`;}
 else if(verb==='complete'){if(!j||j.state!=='대기')throw Error('입출력을 기다리는 작업만 완료 사건을 받을 수 있어요.');j.state='준비';n.ready.push(id);message=`${id}: 입출력 완료 → 준비. CPU 실행 기회를 다시 기다려요.`;}
 else{const current=n.running;if(!current)throw Error('먼저 준비 상태의 작업을 CPU에 올려 주세요.');const job=n.jobs[current];
 if(verb==='execute'){job.pc++;if(job.pc===4){job.state='종료';job.saved=null;n.running=null;message=`${current}: 명령 3개를 모두 실행해 종료했어요.`;}else message=`${current}: 명령 ${job.pc-1} 실행. 다음 명령은 ${job.pc}이에요.`;}
 else if(verb==='io'){if(job.ioUsed)throw Error('이 작업은 예시의 입출력을 이미 한 번 요청했어요.');job.ioUsed=true;job.saved=job.pc;job.state='대기';n.running=null;message=`${current}: 입출력 대기. 다음 명령 ${job.saved}를 문맥에 보관하고 CPU를 내놓아요.`;}
 else if(verb==='preempt'){job.saved=job.pc;job.state='준비';n.ready.push(current);n.running=null;message=`${current}: 시간 조각 만료 → 준비. 입출력을 기다리는 것은 아니에요.`;}
 else throw Error('지원하지 않는 상태 변경이에요.');}
 n.events.push(message);n.done=names.every(x=>n.jobs[x].state==='종료');return n;},
 describe(s){return s.events.at(-1)||'A와 B가 준비 상태예요. CPU에 올릴 작업을 선택해 보세요.';},
 actions(s){return [...names.map(id=>({id:'dispatch:'+id,text:id+' 실행',disabled:!!s.running||s.jobs[id].state!=='준비'})),{id:'execute',text:'명령 한 개',primary:true,disabled:!s.running},{id:'io',text:'입출력 요청',disabled:!s.running||s.jobs[s.running].ioUsed},{id:'preempt',text:'시간 조각 만료',disabled:!s.running},...names.map(id=>({id:'complete:'+id,text:id+' 입출력 완료',disabled:s.jobs[id].state!=='대기'})),{id:'reset',text:'예시로 초기화'}];},
 render(s){return `<div class="metric-row"><div class="metric"><strong>${s.running??'유휴'}</strong><small>CPU 수행 작업</small></div><div class="metric"><strong>${s.ready.map(e).join(' → ')||'없음'}</strong><small>준비 큐 · 왼쪽부터 도착</small></div></div>${table(['프로세스','상태','다음 명령','저장된 문맥','기다리는 이유'],names.map(id=>{const j=s.jobs[id];return [id,j.state,j.state==='종료'?'없음':j.pc,j.state==='수행'?'실행 중 · CPU가 최신 상태':j.saved??'정리됨',j.state==='대기'?'입출력 완료':j.state==='준비'?'CPU 차례':'—'];}))}<p class="small">${s.done?'모두 종료했어요.':!s.running&&!s.ready.length?'실행 가능한 작업이 없어서 CPU가 쉬어요. 입출력이 완료되면 다시 준비 상태가 돼요.':'준비 상태의 작업을 선택할 수 있어요. 실제 OS에서는 스케줄러가 이 선택을 해요.'}</p>`;}
};
CS.labs['process-state']=processLab;
const assign=s=>{for(const w of s.workers)if(w.job===null&&s.queue.length){const next=s.queue.shift();w.job=next.id;w.remaining=next.length;s.started.push({id:next.id,worker:w.id,t:s.t});}};
CS.labs['thread-pool']={
 title:'직원 3명에게 주문 5개를 맡겨요',type:'고정 크기 쓰레드 풀 · 작업 큐 모형',intro:'먼저 대기 주문이 몇 개인지 보세요. 한 단계는 가상 시간 1 tick이에요. 짧은 주문을 끝낸 직원이 다음 주문을 가져가요.',limit:'작업자는 동시에 1 tick씩 진행하는 가상 모형이에요. 실제 CPU 코어 수·스케줄링·입출력·쓰레드 생성 비용은 반영하지 않아요. 쓰레드 3개가 언제나 CPU 3개에서 병렬 실행된다는 뜻은 아니에요.',
 fields:[{key:'size',label:'작업자 수',value:'3',inputmode:'numeric'},{key:'lengths',label:'작업 길이 · 쉼표로 추가',value:'2,1,3,1,2',wide:true}],
 validate(raw){const size=integer(raw.size,1,6,'작업자 수');const text=String(raw.lengths).trim(),lengths=text?text.split(',').map(x=>integer(x.trim(),1,9,'작업 길이')):[];if(lengths.length>12)throw Error('작업 길이는 최대 12개까지 추가해 주세요.');return {size,lengths};},
 initial(p){const s={t:0,queue:p.lengths.map((length,i)=>({id:String.fromCharCode(65+i),length})),workers:Array.from({length:p.size},(_,i)=>({id:i+1,job:null,remaining:0})),completed:[],started:[],history:[],events:[],done:p.lengths.length===0};assign(s);return s;},
 step(s,p){if(s.done)return s;const n=structuredClone(s);const working=n.workers.filter(w=>w.job!==null).map(w=>({worker:w.id,job:w.job}));n.history.push({t:n.t,working});n.t++;const finished=[];for(const w of n.workers){if(w.job===null)continue;w.remaining--;if(w.remaining===0){n.completed.push({id:w.job,worker:w.id,t:n.t});finished.push(w.job);w.job=null;}}assign(n);n.done=n.completed.length===p.lengths.length;n.events.push(`${n.t-1}→${n.t} tick: ${working.map(w=>w.job).join(', ')} 진행. ${finished.length?finished.join(', ')+' 완료.':'완료한 주문은 아직 없어요.'} 대기 ${n.queue.length}개.`);return n;},
 describe(s,p){return s.events.at(-1)||(s.done?'작업이 없어서 바로 완료했어요.':`작업 ${p.lengths.length}개 중 ${s.workers.filter(w=>w.job!==null).length}개 처리 중, ${s.queue.length}개 대기 중이에요.`);},
 render(s){return `<p>현재 시각 <strong>${s.t} tick</strong> · 대기 ${s.queue.length}개 · 완료 ${s.completed.length}개</p>${table(['작업자','현재 주문','남은 길이'],s.workers.map(w=>[w.id,w.job??'다음 작업 기다림',w.job===null?'—':w.remaining+' tick']))}<p><strong>대기 줄</strong> ${s.queue.map(j=>`${j.id}(${j.length})`).join(' → ')||'없음'}</p><p><strong>완료 기록</strong> ${s.completed.map(j=>`${j.id}: ${j.t} tick, 작업자 ${j.worker}`).join(' / ')||'아직 없음'}</p>${s.history.length?table(['구간','진행한 작업'],s.history.map(h=>[h.t+'→'+(h.t+1),h.working.map(w=>`직원 ${w.worker}: ${w.job}`).join(' / ')])):''}`;}
};
})();
