(()=>{
const {escape:e,table}=CS.helpers;
const copy=s=>structuredClone(s);
const moduleInitial=()=>({structure:'separated',channel:'email',subscribers:1,loan:null,notifications:[],affected:[],dependencies:[['LoanPolicy','Notifier port'],['EmailNotifier','Notifier port']],policy:'실행 전',events:[]});
const runModule=(structure,channel,subscribers=1)=>{
 const separated=structure==='separated',affected=separated?[channel==='email'?'EmailNotifier':'SmsNotifier','조립 코드']:['LoanService','저장 코드','알림 코드'];
 const n={structure,channel,subscribers,loan:{book:'B01',member:'M01',saved:true},notifications:[],affected,dependencies:separated?[['LoanPolicy','Notifier port'],[channel==='email'?'EmailNotifier':'SmsNotifier','Notifier port']]:[['LoanService','DB client'],['LoanService',channel==='email'?'Email SDK':'SMS SDK']],policy:subscribers?`${channel==='email'?'메일':'문자'} 구현으로 교체`:'구독자 없음 · 대출은 성공하고 알림 생략',events:[]};
 if(subscribers)n.notifications.push({channel,to:'M01',message:'대출 완료'});
 n.events.push(`${structure==='separated'?'분리 구조':'뒤섞인 구조'} · 대출 B01 저장`,`변경 영향 ${affected.join(', ')}`,subscribers?`${channel==='email'?'메일':'문자'} 알림 1건`:'알림 0건 · 정의한 무알림 정책');return n;
};
CS.labs['module-boundary']={custom:true,title:'알림 구현 변경이 어느 모듈까지 번지는지 비교하세요',type:'대출 업무·저장·알림 책임 경계 모형',intro:'같은 대출 B01을 저장하고 메일을 문자로 바꿔요. 업무 규칙이 구체적인 SDK를 직접 아는 구조와 인터페이스에 의존하는 구조의 변경 범위를 비교해요.',limit:'준비된 모듈과 단일 대출만 사용하는 교육 모형이에요. 실제 변경 비용은 언어, 빌드, 팀 경계, 테스트, 배포 방식과 기존 코드 품질에 따라 달라져요.',
 initial:moduleInitial,
 action(s,a){if(a==='reset')return moduleInitial();if(a==='tangled-email')return runModule('tangled','email');if(a==='tangled-sms')return runModule('tangled','sms');if(a==='separated-email')return runModule('separated','email');if(a==='separated-sms')return runModule('separated','sms');if(a==='no-subscriber')return runModule('separated','sms',0);if(a==='invalid-layer')throw Error('업무 정책이 구체적인 SMS SDK에 직접 의존하면 예제의 계층 규칙을 위반해요.');if(a==='mutate'){const n=copy(s);if(!n.loan)throw Error('먼저 대출 흐름을 실행해 주세요.');n.loan.saved=false;n.events.push('외부에서 대출 상태를 직접 변경 · 캡슐화 경계가 깨짐');return n;}throw Error('알 수 없는 모듈 실습 동작이에요.');},
 describe(s){const loanState=!s.loan?'실행 전':s.loan.saved?'저장됨':'외부에서 변경됨';return `${s.structure==='separated'?'분리된 책임':'뒤섞인 책임'} · ${s.policy} · 변경 영향 ${s.affected.length}곳 · 대출 ${loanState} · 알림 ${s.notifications.length}건`;},
 actions(){return [{id:'tangled-email',text:'뒤섞인 메일',primary:true},{id:'tangled-sms',text:'뒤섞인 문자 교체'},{id:'separated-email',text:'분리한 메일'},{id:'separated-sms',text:'분리한 문자 교체'},{id:'no-subscriber',text:'구독자 0명'},{id:'mutate',text:'상태 직접 변경'},{id:'invalid-layer',text:'계층 위반 추가'},{id:'reset',text:'처음부터'}];},
 render(s){const modules=s.structure==='separated'?['대출 정책','저장소 port','알림 port',s.channel==='email'?'메일 구현':'문자 구현']:['대출+저장+알림 한 모듈'];return `<div class="module-map ${s.structure}">${modules.map((m,i)=>{const changed=s.affected.length&&((s.structure==='tangled'&&i===0)||(s.structure==='separated'&&i===modules.length-1));return `<section class="${changed?'changed':''}"><b>${e(m)}</b><span>${s.structure==='separated'?(i<3?'안쪽 규칙':'바깥 구현'):'구체 SDK까지 직접 앎'}</span></section>${i<modules.length-1?'<i>→</i>':''}`;}).join('')}</div><div class="dependency-list">${s.dependencies.map(([from,to])=>`<span><b>${e(from)}</b> → ${e(to)}</span>`).join('')}</div><div class="module-result"><span>대출 결과<b>${s.loan?(s.loan.saved?'B01 저장':'외부 변경됨'):'실행 전'}</b></span><span>알림 채널<b>${s.notifications[0]?.channel||'없음'}</b></span><span>알림 수<b>${s.notifications.length}</b></span><span>변경 영향<b>${s.affected.length}곳</b></span></div>${s.affected.length?`<p class="change-files">바꿔야 하는 역할 · ${s.affected.map(e).join(' · ')}</p>`:''}`;}
};

const archInitial=()=>({style:'monolith',failure:'none',notificationPolicy:'required',remoteBoundaries:0,order:'실행 전',inventory:'미확인',notification:'미전송',consistency:'단일 흐름',steps:[],events:[]});
const runOrder=(style,failure='none',notificationPolicy='required')=>{
 const n={style,failure,notificationPolicy,remoteBoundaries:style==='monolith'?0:2,order:'생성됨',inventory:'미확인',notification:'미전송',consistency:style==='event'?'비동기·최종 수렴':'동기 호출 결과',steps:['주문 생성'],events:[]};
 if(failure==='inventory'){n.order='실패';n.inventory='오류';n.steps.push('재고 호출 실패');n.events.push('재고 확인 실패 · 주문 성공으로 표시하지 않음');return n;}
 n.inventory='예약됨';n.steps.push('재고 예약');
 if(style==='event'){n.order='접수됨';n.notification=failure==='notification'?'재시도 대기':'이벤트 대기';n.steps.push('OrderCreated 발행');n.events.push('생산자는 소비자 완료를 기다리지 않음');return n;}
 if(failure==='notification'){
  n.notification='실패';n.steps.push('알림 실패');
  if(notificationPolicy==='best-effort'){n.order='완료';n.notification='재시도 대기';n.events.push('핵심 주문·재고는 완료, 알림은 별도 재시도');}
  else{n.order='보상 필요';n.events.push('알림 필수 정책 · 이미 예약한 재고의 보상 필요');}
  return n;
 }
 n.notification='전송됨';n.order='완료';n.steps.push('알림 전송');n.events.push('주문·재고·알림 정상 완료');return n;
};
const styleName={monolith:'모듈형 모놀리스',services:'동기 서비스 분리',event:'이벤트 기반'};
CS.labs['architecture-tradeoff']={custom:true,title:'같은 주문 흐름을 세 구조와 장애 정책으로 비교하세요',type:'주문·재고·알림 호출과 실패 모형',intro:'정상 결과가 같아도 배포 단위와 원격 경계, 장애 뒤 남는 상태가 달라져요. 재고 실패와 알림 지연을 구별해 보세요.',limit:'고정된 세 단계와 단일 주문을 다루는 교육 모형이에요. 실제 구조는 데이터 소유권, 거래 경계, 네트워크, 배포, 관측과 조직 역량까지 함께 평가해야 해요.',
 initial:archInitial,
 action(s,a){if(a==='reset')return archInitial();if(a==='mono-normal')return runOrder('monolith');if(a==='service-normal')return runOrder('services');if(a==='event-normal')return runOrder('event');if(a==='inventory-fail')return runOrder('services','inventory');if(a==='notify-required')return runOrder('services','notification','required');if(a==='notify-best')return runOrder('services','notification','best-effort');if(a==='event-delay')return runOrder('event','notification','best-effort');if(a==='recover'){if(s.notification!=='재시도 대기'&&s.notification!=='이벤트 대기')throw Error('현재 다시 처리할 알림이 없어요.');const n=copy(s);n.notification='전송됨';n.order=n.inventory==='예약됨'?'완료':n.order;n.steps.push('알림 소비자 재처리');n.events.push('알림 재처리 완료');return n;}if(a==='false-success')throw Error('재고 실패를 전체 성공으로 표시할 수 없어요.');throw Error('알 수 없는 아키텍처 실습 동작이에요.');},
 describe(s){return `${styleName[s.style]} · 원격 경계 ${s.remoteBoundaries}개 · 주문 ${s.order} · 재고 ${s.inventory} · 알림 ${s.notification}`;},
 actions(){return [{id:'mono-normal',text:'모놀리스 정상',primary:true},{id:'service-normal',text:'서비스 정상'},{id:'event-normal',text:'이벤트 정상'},{id:'inventory-fail',text:'재고 서비스 장애'},{id:'notify-required',text:'알림 필수·실패'},{id:'notify-best',text:'알림 별도 재시도'},{id:'event-delay',text:'이벤트 소비 지연'},{id:'recover',text:'알림 재처리'},{id:'false-success',text:'실패를 성공 처리'},{id:'reset',text:'처음부터'}];},
 render(s){const nodes=s.style==='monolith'?['주문 모듈','재고 모듈','알림 모듈']:s.style==='services'?['Order API','Inventory API','Notify API']:['Order','Event Broker','Inventory·Notify'];return `<div class="architecture-path ${s.style}">${nodes.map((n,i)=>`<section class="${s.steps.some(x=>x.includes(n.split(' ')[0]))?'active':''}"><b>${e(n)}</b><span>${s.style==='monolith'?'한 배포 안 내부 호출':s.style==='services'?'독립 배포·원격 호출':'발행·비동기 소비'}</span></section>${i<nodes.length-1?`<i>${s.style==='event'?'⇢':'→'}</i>`:''}`).join('')}</div><div class="architecture-metrics"><span>배포 구조<b>${styleName[s.style]}</b></span><span>원격 경계<b>${s.remoteBoundaries}</b></span><span>일관성<b>${s.consistency}</b></span><span>주문 상태<b>${s.order}</b></span></div>${table(['단계','현재 결과'],[['주문',s.order],['재고',s.inventory],['알림',s.notification]])}<div class="step-chips">${s.steps.map(e).map((x,i)=>`<span>${i+1}. ${x}</span>`).join('')||'<span>구조를 선택해 실행하세요.</span>'}</div>`;}
};
})();
