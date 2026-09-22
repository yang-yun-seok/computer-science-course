(()=>{
'use strict';
const root=CS.learning=CS.learning||{};
const norm=value=>String(value??'').replace(/\s+/g,'');
const done=s=>!!s?.done;
const terminal=s=>!!(s?.result||s?.logs?.length||s?.app);
const adapters={
 'cpu-add':(s,p,label)=>{
  const expectedStep=label==='A'?3:4;
  if(p.a!==3||p.b!==2||s.step!==expectedStep||s.cpu?.result!==5||s.output!==null)return null;
  if(label==='A'&&s.ram?.result!==null)return null;
  if(label==='B'&&s.ram?.result!==5)return null;
  return {summary:`${expectedStep}/5단계 · CPU 5 · RAM ${s.ram.result??'아직 없음'} · 화면 아직 없음`,metrics:{단계:`${expectedStep}/5`,CPU:s.cpu.result,RAM:s.ram.result??'아직 없음',화면:'아직 없음'}};
 },
 'memory-save':(s,_p,label)=>{
  if(!s.power||!s.edited)return null;
  if(label==='A'&&(s.savedAfterEdit||s.saved!=='첫 문장'||s.draft!=='첫 문장'))return null;
  if(label==='B'&&(!s.savedAfterEdit||s.saved==='첫 문장'||s.draft!==s.saved))return null;
  return {summary:`${label==='A'?'저장 안 함':'저장함'} · 복원된 글 “${s.draft}”`,metrics:{저장여부:label==='A'?'아니요':'예',작업글:s.draft,저장글:s.saved}};
 },
 'cpu-schedule':(s,p,label)=>{
  const policy=label==='A'?'FCFS':'RR';
  if(!done(s)||p.a!==6||p.b!==2||p.c!==1||p.policy!==policy||p.quantum!==1)return null;
  const m=CS.helpers.scheduler.metrics(s,p);
  return {summary:`${policy} · 평균 첫 응답 ${m.response.toFixed(2)} tick`,metrics:{정책:policy,평균첫응답:m.response.toFixed(2),평균대기:m.wait.toFixed(2),완료:s.t}};
 },
 'lru-cache':(s,p,label)=>{
  const request=label==='A'?['A','B','C']:['A','B','A','C'],evicted=label==='A'?'A':'B';
  if(!done(s)||p.capacity!==2||JSON.stringify(p.requests)!==JSON.stringify(request)||s.last?.evicted!==evicted)return null;
  return {summary:`${request.join('→')} · C 삽입 때 ${evicted} 퇴출`,metrics:{요청:request.join('→'),퇴출:evicted,히트:s.hits,미스:s.misses}};
 },
 'process-state':(s,_p,label)=>{
  const job=s.jobs?.A;
  if(!job?.ioUsed)return null;
  if(label==='A'&&(job.state!=='대기'||s.running!==null))return null;
  if(label==='B'&&(job.state!=='준비'||!s.ready.includes('A')||s.running!==null))return null;
  return {summary:`A · ${job.state} · CPU ${s.running||'유휴'}`,metrics:{A상태:job.state,CPU:s.running||'유휴',준비큐:s.ready.join('→')||'없음'}};
 },
 'thread-pool':(s,p,label)=>{
  const size=label==='A'?1:2;
  if(!done(s)||p.size!==size||JSON.stringify(p.lengths)!==JSON.stringify([2,1,3,1,2]))return null;
  return {summary:`작업자 ${size}명 · 모두 완료 ${s.t} tick`,metrics:{작업자:size,완료시간:s.t,완료수:s.completed.length}};
 },
 'library-query':(s,_p,label)=>{
  const filter=label==='A'?'all':'available',rows=label==='A'?3:2;
  if(s.filter!==filter||!s.events.length)return null;
  return {summary:`${label==='A'?'전체':'대출 가능'} 조회 · 결과 ${rows}행`,metrics:{원본행:3,결과행:rows,필터:filter}};
 },
 'loan-transaction':(s,p,label)=>{
  const failure=label==='A'?'none':'after-decrement',expected=label==='A'?{stock:0,loans:1}:{stock:1,loans:0};
  if(!done(s)||p.stock!==1||p.failure!==failure||p.member!=='M1'||p.role!=='librarian'||s.committed.stock!==expected.stock||s.committed.loans!==expected.loans)return null;
  return {summary:`${label==='A'?'COMMIT':'ROLLBACK'} · 수량 ${s.committed.stock} · 기록 ${s.committed.loans}`,metrics:{결과:label==='A'?'COMMIT':'ROLLBACK',확정수량:s.committed.stock,대출기록:s.committed.loans}};
 },
 'sql-first':(s,_p,label)=>{
  const sql=norm(s.sql).toUpperCase(),rows=s.result?.results?.[0]?.rows?.length;
  if(rows==null)return null;
  if(label==='A'&&(sql.includes('WHERE')||rows!==3))return null;
  if(label==='B'&&(!sql.includes("WHEREID='B2'")||rows!==1))return null;
  return {summary:`${label==='A'?'전체 조회':'B2 조건 조회'} · ${rows}행`,metrics:{조건:label==='A'?'없음':"id='B2'",결과행:rows,원본행:3}};
 },
 'bit-byte':(s,_p,label)=>{
  const value=s.bits.reduce((sum,bit,index)=>sum+bit*[128,64,32,16,8,4,2,1][index],0),expected=label==='A'?1:129;
  if(value!==expected)return null;
  return {summary:`${s.bits.join('')} · 십진수 ${value}`,metrics:{비트열:s.bits.join(''),십진수:value,켜진자리:label==='A'?'1':'128+1'}};
 },
 'pixel-size':(s,p,label)=>{
  const width=label==='A'?8:16,bytes=width*8*3;
  if(!done(s)||p.width!==width||p.height!==8||p.channels!==3)return null;
  return {summary:`${width}×8 RGB · ${bytes}B`,metrics:{크기:`${width}×8`,픽셀:width*8,원시바이트:bytes}};
 },
 'stack-queue':(s,_p,label)=>{
  const kind=label==='A'?'stack':'queue',removed=label==='A'?'C':'A';
  if(s.kind!==kind||s.removed.length!==1||s.removed[0]!==removed)return null;
  return {summary:`${kind==='stack'?'스택':'큐'} · ${removed} 제거`,metrics:{규칙:kind==='stack'?'LIFO':'FIFO',제거값:removed,남은값:s.items.join('→')}};
 },
 'hash-buckets':(s,_p,label)=>{
  const last=s.events.at(-1)||'';
  if(s.mode!=='set'||s.entries.length!==1||s.entries[0]!=='A')return null;
  if(label==='A'&&!last.includes('저장했어요'))return null;
  if(label==='B'&&!last.includes('항목 수가 늘어나지'))return null;
  return {summary:`Set의 A · 항목 ${s.entries.length}개`,metrics:{시도:label==='A'?'첫 추가':'같은 값 재추가',원소수:s.entries.length,버킷:CS.helpers.hashOf('A')}};
 },
 'space-growth':(s,p,label)=>{
  const method=label==='A'?'sum':'copy',aux=label==='A'?4:40;
  if(!done(s)||p.n!==10||p.method!==method)return null;
  return {summary:`입력 40B · 보조 ${aux}B · 합계 ${40+aux}B`,metrics:{방법:label==='A'?'합계 변수만':'전체 복사본',입력바이트:40,보조바이트:aux,합계바이트:40+aux}};
 },
 'bounded-buffer':(s,_p,label)=>{
  const mode=label==='A'?'all':'recent',count=label==='A'?25:20,oldest=label==='A'?'1.':'6.';
  if(s.mode!==mode||s.next!==26||s.items.length!==count||!s.items[0]?.startsWith(oldest)||!s.items.at(-1)?.startsWith('25.'))return null;
  return {summary:`${label==='A'?'모두':'최근 20개'} 보관 · ${count}개 · 첫 항목 ${oldest.slice(0,-1)}번`,metrics:{정책:mode,저장수:count,가장오래된항목:Number(oldest.slice(0,-1)),마지막항목:25}};
 },
 'search-compare':(s,p,label)=>{
  const algorithm=label==='A'?'linear':'binary',comparisons=label==='A'?16:5;
  if(!done(s)||!s.found||p.n!==16||p.target!==16||p.algorithm!==algorithm||p.order!=='sorted'||s.comparisons!==comparisons)return null;
  return {summary:`${label==='A'?'순차':'이진'} 탐색 · 비교 ${comparisons}회`,metrics:{방법:algorithm,비교횟수:comparisons,목표:16,정렬:'오름차순'}};
 },
 'network-delay':(s,p,label)=>{
  const rtt=label==='A'?100:200,total=label==='A'?'8.100':'8.200';
  if(!done(s)||p.size!==10||p.rate!==10||p.rtt!==rtt)return null;
  return {summary:`RTT ${rtt}ms · 전송 8.000초 · 합계 ${total}초`,metrics:{크기MB:10,전송률Mbps:10,순수전송초:'8.000',RTTms:rtt,합계초:total}};
 },
 'layer-message':(s,p,label)=>{
  if(p.message!=='HI')return null;
  if(label==='A'&&(p.destination!=='B'||!done(s)||s.failed||s.phase!==9||s.restored!=='HI'))return null;
  if(label==='B'&&(p.destination!=='unknown'||!done(s)||!s.failed||s.phase!==3||s.restored!==null))return null;
  return {summary:label==='A'?'9단계 완료 · HI 복원':'3단계 중단 · 수신 메시지 없음',metrics:{목적지:label==='A'?'B':'주소 없음',종료단계:s.phase,복원내용:s.restored??'없음',결과:label==='A'?'전달 완료':'전달 실패'}};
 },
 'segment-order':(s,_p,label)=>{
  if(s.arrival.length)return null;
  if(label==='A'&&(!s.complete||JSON.stringify(s.received)!==JSON.stringify([2,1,3])))return null;
  if(label==='B'&&(s.complete||JSON.stringify(s.received)!==JSON.stringify([1,3])))return null;
  return {summary:label==='A'?'2→1→3 모두 도착 · 1→2→3 복원':'1→3 도착 · 2번 누락',metrics:{도착:s.received.join('→'),완료:s.complete?'예':'아니요',빠진조각:label==='A'?'없음':'2',복원:label==='A'?'1→2→3':'대기'}};
 },
 'http-library':(s,p,label)=>{
  const scenario=label==='A'?'server':'connection';
  if(!done(s)||p.id!=='B01'||p.scenario!==scenario)return null;
  if(label==='A'&&(!s.connected||s.status!==500||!s.body))return null;
  if(label==='B'&&(s.connected!==false||s.status!==null||s.body!==null))return null;
  return {summary:label==='A'?'HTTP 500 · 응답 본문 있음':'연결 실패 · 상태코드 없음',metrics:{상황:scenario,연결:s.connected?'성공':'실패',상태코드:s.status??'없음',본문:s.body?'있음':'없음'}};
 },
 'tls-handshake':(s,p,label)=>{
  const certificate=label==='A'?'valid':'expired';
  if(!done(s)||p.certificate!==certificate)return null;
  if(label==='A'&&(s.failed||s.phase!==4))return null;
  if(label==='B'&&(!s.failed||s.phase!==2))return null;
  return {summary:label==='A'?'4단계 완료 · 보호 통신 준비':'2단계 중단 · 인증서 만료',metrics:{인증서:certificate,종료단계:s.phase,키합의:label==='A'?'완료':'시작 전',보호통신:label==='A'?'준비':'중단'}};
 },
 'stable-sort':(s,p,label)=>{
  const algorithm=label==='A'?'insertion':'bubble',moves=label==='A'?7:4,result='1B→1D→2C→3A';
  if(!done(s)||p.algorithm!==algorithm||norm(p.items)!=='3A,1B,2C,1D'||s.arr.map(item=>item.value+item.id).join('→')!==result||s.comparisons!==6||s.moves!==moves)return null;
  return {summary:`${label==='A'?'삽입':'버블'} 정렬 · ${result}`,metrics:{방법:algorithm,결과:result,값1순서:'B→D',비교횟수:6,[label==='A'?'이동횟수':'교환횟수']:moves}};
 },
 'coin-strategies':(s,_p,label)=>{
  if(s.amount!==6||JSON.stringify(s.coins)!==JSON.stringify([1,3,4])||!s.greedy.done||!s.dp.done)return null;
  if(JSON.stringify(s.greedy.picks)!==JSON.stringify([4,1,1])||s.dp.values[6]!==2)return null;
  return {summary:label==='A'?'탐욕 4+1+1 · 3개':'DP 최적 3+3 · 2개',metrics:{방법:label==='A'?'탐욕':'DP',동전수:label==='A'?3:2,선택:label==='A'?'4+1+1':'3+3',금액:6}};
 },
 'bst-traversal':(s,_p,label)=>{
  const expected=label==='A'?{tree:'3,2,4,1,5',path:[3,4,5]}:{tree:'1,2,3,4,5',path:[1,2,3,4,5]};
  if(norm(s.treeInput)!==expected.tree||Number(s.searchInput)!==5||!s.found||JSON.stringify(s.searchPath)!==JSON.stringify(expected.path))return null;
  return {summary:`${expected.tree}에서 5 탐색 · ${s.searchPath.join(' → ')}`,metrics:{입력:expected.tree,탐색경로:s.searchPath.join(' → '),노드수:s.keys.length}};
 },
 'graph-paths':(s,p,label)=>{
  const expected=label==='A'?{algorithm:'bfs',cost:1,path:'A → C'}:{algorithm:'dijkstra',cost:2,path:'A → B → C'};
  if(p.algorithm!==expected.algorithm||p.target!=='C'||!done(s)||!s.found||s.cost!==expected.cost)return null;
  if(s.path.join(' → ')!==expected.path)return null;
  return {summary:`${p.algorithm==='bfs'?'BFS':'다익스트라'} · ${s.path.join(' → ')}`,metrics:{방법:p.algorithm==='bfs'?'간선 수':'비용 합',경로:s.path.join(' → '),값:s.cost}};
 },
 'bplus-tree':(s,_p,label)=>{
  if(label==='A'){
   if(JSON.stringify(s.keys)!==JSON.stringify([1,2,3])||s.root.length||JSON.stringify(s.leaves)!==JSON.stringify([[1,2,3]]))return null;
   return {summary:'키 1·2·3 · 단일 리프 [1,2,3]',metrics:{키수:3,리프수:1,리프:'[1,2,3]',루트구분키:'없음'}};
  }
  if(JSON.stringify(s.keys)!==JSON.stringify([1,2,3,4])||JSON.stringify(s.root)!==JSON.stringify([3])||JSON.stringify(s.leaves)!==JSON.stringify([[1,2],[3,4]]))return null;
  return {summary:'키 4 추가 · 리프 2개 · 구분 키 3',metrics:{키수:4,리프수:2,리프:'[1,2] / [3,4]',루트구분키:3}};
 },
 'isolation-snapshots':(s,_p,label)=>{
  const mode=label==='A'?'statement':'transaction',reads=label==='A'?[100,120]:[100,100];
  if(s.mode!==mode||JSON.stringify(s.t1?.reads)!==JSON.stringify(reads)||s.committed?.at(-1)?.value!==120||!s.t2?.ended)return null;
  return {summary:`${label==='A'?'문장별 최신':'T1 시작'} 스냅샷 · ${reads.join('→')}`,metrics:{규칙:mode,첫읽기:reads[0],둘째읽기:reads[1],확정최신:120,T1스냅샷:s.t1.snapshot??'문장별'}};
 },
 'wal-recovery':(s,_p,label)=>{
  const disk=label==='A'?100:120;
  if(!s.recovered||s.disk!==disk||s.memory!==disk||s.txn!=='RECOVERED')return null;
  if(label==='A'&&s.log.includes('COMMIT T1'))return null;
  if(label==='B'&&!s.log.includes('COMMIT T1'))return null;
  return {summary:`COMMIT 내구화 ${label==='A'?'전':'후'} 장애 · ${disk} 복구`,metrics:{시점:label==='A'?'내구화 전':'내구화 후',디스크값:disk,COMMIT로그:label==='A'?'없음':'있음',내구로그수:s.durable}};
 },
 'ipv4-routing':(s,_p,label)=>{
  const expected=label==='A'?{address:'192.0.2.20',prefix:24,next:'R1'}:{address:'192.0.2.130',prefix:25,next:'R2'};
  const chosen=s.result?.chosen;
  if(s.address!==expected.address||chosen?.prefix!==expected.prefix||chosen?.next!==expected.next)return null;
  return {summary:`${expected.address} · /${expected.prefix} → ${expected.next}`,metrics:{목적지:expected.address,prefix:expected.prefix,다음홉:expected.next,일치경로:s.result.candidates.filter(route=>route.match).length}};
 },
 'storage-lifetime':(s,_p,label)=>{
  if(!s.refreshed||s.memory!==null||s.session!==null)return null;
  if(label==='A'&&s.local!==null)return null;
  if(label==='B'&&(s.local!==20||!s.support?.local))return null;
  return {summary:label==='A'?'메모리 20px → 새로고침 뒤 기본 18px':'localStorage 20px → 새로고침 뒤 20px',metrics:{저장위치:label==='A'?'문서 메모리':'localStorage',새로고침뒤:label==='A'?'기본 18px':'20px',메모리:s.memory??'없음',로컬:s.local??'없음'}};
 },
 'crypto-compare':(s,_p,label)=>{
  if(s.input!=='hello'||s.changed!=='hello!'||s.hash?.length!==64||s.changedHash?.length!==64||s.hash===s.changedHash)return null;
  const value=label==='A'?s.hash:s.changedHash;
  return {summary:`${label==='A'?'hello':'hello!'} · SHA-256 ${value.slice(0,12)}…`,metrics:{입력:label==='A'?'hello':'hello!',비트수:256,'16진수길이':value.length,원문과같음:label==='A'?'기준':'아니요'}};
 },
 'access-control':(s,_p,label)=>{
  const expected=label==='A'?{user:'S1',status:200,allow:true}:{user:'S2',status:403,allow:false};
  if(s.user!==expected.user||s.target!=='A1'||s.operation!=='read'||s.decision?.status!==expected.status||s.decision?.allow!==expected.allow)return null;
  return {summary:`${expected.user} → A1 읽기 · ${expected.status} ${expected.allow?'허용':'거부'}`,metrics:{사용자:expected.user,대상:'A1',행동:'읽기',상태:expected.status,결정:expected.allow?'허용':'거부'}};
 },
 'expression-parser':(s,_p,label)=>{
  const expected=label==='A'?{input:'2+3*4',result:14}:{input:'(2+3)*4',result:20};
  if(s.input!==expected.input||s.result!==expected.result||!s.ast||!s.tokens?.length)return null;
  return {summary:`${expected.input} = ${expected.result}`,metrics:{식:expected.input,결과:expected.result,AST루트:s.ast.op,토큰수:s.tokens.length-1}};
 },
 'gc-reachability':(s,_p,label)=>{
  const marked=[...s.marked].sort().join(','),candidates=[...s.candidates].sort().join(',');
  if(label==='A'&&(s.roots.length||marked!==''||candidates!=='A,B,C,D'))return null;
  if(label==='B'&&(s.roots.join(',')!=='A,C'||marked!=='A,B,C,D'||candidates!==''))return null;
  return {summary:label==='A'?'루트 없음 · C·D 회수 후보':'C를 루트에 연결 · C·D 도달 가능',metrics:{루트:s.roots.join(',')||'없음',C상태:label==='A'?'회수 후보':'도달 가능',D상태:label==='A'?'회수 후보':'도달 가능',도달수:s.marked.length}};
 },
 'pipeline-hazards':(s,_p,label)=>{
  const forwarding=label==='B',cycles=label==='A'?11:7,stalls=label==='A'?4:0;
  if(s.preset!=='dependent'||s.forwarding!==forwarding||s.cycles!==cycles||s.stalls!==stalls)return null;
  return {summary:`전달 ${forwarding?'있음':'없음'} · ${cycles}사이클 · 멈춤 ${stalls}회`,metrics:{전달:forwarding?'있음':'없음',사이클:cycles,멈춤:stalls,명령수:s.program.length}};
 },
 'amdahl-speedup':(s,_p,label)=>{
  const cores=label==='A'?8:16,expected=label==='A'?4.705882352941176:6.4;
  if(s.parallel!==90||s.cores!==cores||Math.abs(s.speedup-expected)>1e-9||Math.abs(s.limit-10)>1e-9)return null;
  return {summary:`병렬 90% · ${cores}코어 · ${s.speedup.toFixed(2)}배`,metrics:{병렬비율:'90%',코어:cores,속도향상:s.speedup.toFixed(2),상한:s.limit.toFixed(2)}};
 },
 'replica-consistency':(s,_p,label)=>{
  const expected=label==='A'?{value:'old',stale:1}:{value:'v1',stale:0};
  if(s.version!==1||s.nodes.A.value!=='v1'||s.lastRead?.node!=='B'||s.lastRead?.value!==expected.value||s.lastRead?.stale!==expected.stale)return null;
  if(label==='A'&&s.nodes.B.version!==0)return null;
  if(label==='B'&&s.nodes.B.version!==1)return null;
  return {summary:`B 읽기 · ${expected.value} · ${expected.stale?'1버전 오래됨':'최신'}`,metrics:{쓰기:'v1',B값:expected.value,B버전:s.nodes.B.version,최신:expected.stale?'아니요':'예'}};
 },
 'raft-quorum':(s,_p,label)=>{
  const entry=s.entries.find(item=>item.token==='req-1');
  if(!entry||s.entries.length!==1||s.nodes.A.join(',')!=='1')return null;
  if(label==='A'&&(entry.committed||s.nodes.B.length||s.commitIndex!==0||s.effects!==0))return null;
  if(label==='B'&&(!entry.committed||s.nodes.B.join(',')!=='1'||s.commitIndex!==1||s.effects!==1))return null;
  return {summary:`req-1 · ${label==='A'?'리더만 저장·미확정':'A+B 저장·확정'}`,metrics:{저장노드:label==='A'?1:2,상태:entry.committed?'확정':'미확정',확정index:s.commitIndex,효과:s.effects}};
 },
 'scaling-distribution':(s,_p,label)=>{
  const mode=label==='A'?'round':'hot',loads=label==='A'?[40,40,40]:[96,12,12],overflow=label==='A'?0:56;
  if(s.config?.requests!==120||s.config?.servers!==3||s.config?.capacity!==40||s.config?.cacheHit!==0||s.config?.mode!==mode||JSON.stringify(s.loads)!==JSON.stringify(loads)||s.overflow!==overflow)return null;
  return {summary:`${label==='A'?'균등':'핫키 80%'} · ${loads.join('·')} · 초과 ${overflow}`,metrics:{정책:label==='A'?'균등 분산':'핫키 80%',부하:loads.join(' / '),최대부하:Math.max(...loads),초과:overflow}};
 },
 'bounded-queue':(s,_p,label)=>{
  const mode=label==='A'?'bounded':'backpressure';
  if(s.arrival!==8||s.service!==3||s.limit!==10||s.mode!==mode||s.ticks!==5||s.queue!==7||s.processed!==15)return null;
  if(label==='A'&&(s.rejected!==18||s.delayed!==0))return null;
  if(label==='B'&&(s.rejected!==0||s.delayed!==18))return null;
  return {summary:`${label==='A'?'제한 큐':'백프레셔'} · 대기 7 · 초과 18`,metrics:{정책:mode,대기:s.queue,처리:s.processed,거부:s.rejected,상류지연:s.delayed}};
 },
 'module-boundary':(s,_p,label)=>{
  const structure=label==='A'?'tangled':'separated',affected=label==='A'?3:2;
  if(s.structure!==structure||s.channel!=='sms'||s.loan?.book!=='B01'||!s.loan?.saved||s.notifications?.[0]?.channel!=='sms'||s.affected?.length!==affected)return null;
  return {summary:`${label==='A'?'뒤섞인':'분리된'} 책임 · 문자 교체 영향 ${affected}곳`,metrics:{구조:structure,대출:'B01 저장',알림:'문자 1건',변경영향:affected}};
 },
 'architecture-tradeoff':(s,_p,label)=>{
  if(s.style!=='services'||s.failure!=='notification'||s.inventory!=='예약됨')return null;
  const expected=label==='A'?{policy:'required',order:'보상 필요',notification:'실패'}:{policy:'best-effort',order:'완료',notification:'재시도 대기'};
  if(s.notificationPolicy!==expected.policy||s.order!==expected.order||s.notification!==expected.notification)return null;
  return {summary:`알림 실패 · 주문 ${expected.order} · 알림 ${expected.notification}`,metrics:{정책:expected.policy,주문:expected.order,재고:s.inventory,알림:expected.notification}};
 },
 'test-invariants':(s,_p,label)=>{
  const implementation=label==='A'?'broken':'fixed',output=label==='A'?[1,2]:[1,2,2];
  if(s.implementation!==implementation||JSON.stringify(s.input)!==JSON.stringify([2,1,2])||JSON.stringify(s.output)!==JSON.stringify(output)||!s.checks?.sorted)return null;
  if(label==='A'&&(s.checks.preserved||s.checks.length))return null;
  if(label==='B'&&(!s.checks.preserved||!s.checks.length))return null;
  return {summary:`${label==='A'?'중복 손실':'수정 정렬'} · [${output}]`,metrics:{구현:implementation,출력:`[${output}]`,오름차순:'통과',항목보존:s.checks.preserved?'통과':'실패'}};
 },
 'boundary-debugging':(s,_p,label)=>{
  const version=label==='A'?'buggy':'fixed',passes=label==='A'?2:3;
  if(s.version!==version||s.suite?.length!==3||s.suite.filter(item=>item.pass).length!==passes)return null;
  const at=s.suite.find(item=>item.price===10000);
  if(!at||at.pass!==(label==='B')||at.actual!==(label==='A'?3000:0))return null;
  return {summary:`${s.operator} 조건 · 경계 사례 ${passes}/3 통과`,metrics:{조건:s.operator,통과:`${passes}/3`,만원배송비:at.actual,만원판정:at.pass?'통과':'실패'}};
 },
 'canary-deployment':(s,_p,label)=>{
  const ratio=label==='A'?10:50,errors=label==='A'?2:10;
  const v2=s.versions?.v2,v1=s.versions?.v1;
  if(s.total!==20||s.ratio!==ratio||v2?.requests!==errors||v2?.errors!==errors||v1?.errors!==0)return null;
  return {summary:`v2 ${ratio}% · 전체 오류 ${errors}/20 · v2 오류 ${errors}/${errors}`,metrics:{v2비중:`${ratio}%`,전체오류율:`${errors/20*100}%`,v2오류율:'100%',전체요청:20}};
 },
 'observability-recovery':(s,_p,label)=>{
  if(s.latencies?.length!==10)return null;
  const sorted=[...s.latencies].sort((a,b)=>a-b),mean=s.latencies.reduce((a,b)=>a+b,0)/10,p95=sorted[Math.ceil(.95*10)-1];
  const expected=label==='A'?{mean:10,p95:10,max:10}:{mean:109,p95:1000,max:1000};
  if(mean!==expected.mean||p95!==expected.p95||Math.max(...s.latencies)!==expected.max)return null;
  return {summary:`평균 ${mean}ms · p95 ${p95}ms · 최대 ${expected.max}ms`,metrics:{표본:10,평균:`${mean}ms`,p95:`${p95}ms`,최대:`${expected.max}ms`}};
 },
 'system-call-boundary':(s,p,label)=>{
  const scenario=label==='A'?'allowed':'denied';
  if(!done(s)||p.scenario!==scenario||s.mode!=='USER'||s.location!=='read 다음 명령')return null;
  if(label==='A'&&(s.returnValue!=='5 bytes'||s.contents!=='HELLO'))return null;
  if(label==='B'&&(s.returnValue!=='EACCES'||s.contents!==null))return null;
  return {summary:label==='A'?'HELLO · 5 bytes 반환':'EACCES · 내용 없음',metrics:{권한:label==='A'?'허용':'거부',반환값:s.returnValue,사용자버퍼:s.contents??'비어 있음',복귀모드:s.mode}};
 },
 'pipe-buffer':(s,_p,label)=>{
  if(label==='A'&&(s.sender!=='WAITING'||JSON.stringify(s.buffer)!==JSON.stringify(['A','B'])||JSON.stringify(s.pending)!==JSON.stringify(['C'])||s.received.length))return null;
  if(label==='B'&&(s.sender!=='READY'||JSON.stringify(s.buffer)!==JSON.stringify(['B'])||JSON.stringify(s.pending)!==JSON.stringify(['C'])||JSON.stringify(s.received)!==JSON.stringify(['A'])))return null;
  return {summary:label==='A'?'버퍼 A·B · C 쓰기 WAITING':'A 읽음 · 버퍼 B · 송신 READY',metrics:{버퍼:s.buffer.join('→'),대기쓰기:s.pending.join('→'),받은값:s.received.join('→')||'없음',송신자:s.sender}};
 },
 'virtual-memory':(s,_p,label)=>{
  const policy=label==='A'?'fifo':'lru',victim=label==='A'?1:2;
  if(!done(s)||s.policy!==policy||s.capacity!==3||JSON.stringify(s.requests)!==JSON.stringify([1,2,3,1,4])||s.hits!==1||s.faults!==4||s.victim!==victim)return null;
  return {summary:`${policy.toUpperCase()} · ${victim} 퇴출 · 히트 1 / 폴트 4`,metrics:{정책:policy.toUpperCase(),퇴출:victim,히트:s.hits,폴트:s.faults,프레임:s.frames.join('→')}};
 },
 'journal-recovery':(s,_p,label)=>{
  const file=label==='A'?'A':'B',committed=label==='B';
  if(!done(s)||!s.recovered||s.file!==file||s.committed!==committed||s.crashed)return null;
  return {summary:`${label==='A'?'커밋 전':'커밋 후'} 장애 복구 · 확정 ${file}`,metrics:{장애시점:label==='A'?'커밋 전':'커밋 후',커밋:committed?'있음':'없음',복구내용:file,최종반영:s.homeApplied?'예':'아니요'}};
 },
 'counter-race':(s,_p,label)=>{
  const mode=label==='A'?'unsafe':'locked',counter=label==='A'?101:102;
  if(!done(s)||s.mode!==mode||s.workers!==2||s.counter!==counter||!s.tasks.A.wrote||!s.tasks.B.wrote)return null;
  return {summary:`${label==='A'?'보호 없음':'뮤텍스'} · 최종 ${counter}`,metrics:{보호:mode,최종값:counter,완료증가:counter-100,작업수:2}};
 },
 'deadlock-progress':(s,_p,label)=>{
  const expected=label==='A'?{mode:'opposite',condition:'DEADLOCK',progress:0}:{mode:'ordered',condition:'COMPLETE',progress:2};
  if(s.mode!==expected.mode||s.workers!==2||s.condition!==expected.condition||s.progress!==expected.progress)return null;
  return {summary:`${label==='A'?'반대 순서':'순서 통일'} · ${s.condition} · 완료 ${s.progress}`,metrics:{획득규칙:expected.mode,판정:s.condition,완료수:s.progress,대기A:s.tasks.A.waiting??'없음',대기B:s.tasks.B.waiting??'없음'}};
 },
 'relation-designer':(s,_p,label)=>{
  if(label==='A'){
   if(s.view!=='flat'||!s.anomaly||JSON.stringify(s.flatRows.map(row=>row.memberName))!==JSON.stringify(['서민지','민지']))return null;
   return {summary:'중복 한 행 수정 · S1 이름 불일치',metrics:{구조:'중복 한 표',S1이름:'서민지 / 민지',수정위치:1,참조일관성:'깨짐'}};
  }
  const member=s.members.find(item=>item.id==='S1'),refs=s.loans.filter(loan=>loan.memberId==='S1').length;
  if(s.view!=='relations'||s.anomaly||!s.linked||member?.name!=='서민지'||refs!==2)return null;
  return {summary:'members 한 곳 수정 · S1 참조 2건 유지',metrics:{구조:'회원·대출 분리',S1이름:member.name,수정위치:1,대출참조:refs}};
 },
 'sql-analytics':(s,_p,label)=>{
  const preset=label==='A'?'join':'wrong',rows=label==='A'?3:6;
  if(s.preset!==preset||s.result?.results?.[0]?.rows?.length!==rows)return null;
  return {summary:`${label==='A'?'올바른':'조건 빠진'} JOIN · 결과 ${rows}행`,metrics:{예시:preset,결과행:rows,연결조건:label==='A'?'키 일치':'항상 참',원본대출:3}};
 },
 'tcp-recovery':(s,_p,label)=>{
  const loss=label==='B';
  if(s.app!=='ABC'||s.ack!==4||s.retransmissions!==(loss?1:0))return null;
  return {summary:`${loss?'B 유실 후 재전송':'유실 없음'} · ACK${s.ack} · 앱 ${s.app}`,metrics:{앱전달:s.app,누적ACK:s.ack,재전송:`${s.retransmissions}회`}};
 },
 'query-plan':(s,_p,label)=>{
  const preset=label==='A'?'scan':'index';
  if(s.preset!==preset||!s.result?.results?.length)return null;
  const plan=s.result.results.find(result=>result.columns?.includes('detail')),select=s.result.results.find(result=>result.columns?.includes('title')&&!result.columns.includes('detail'));
  if(!plan||select?.rows?.length!==1)return null;
  const details=plan.rows.map(row=>row.join(' ')).join(' | ');
  if(label==='A'&&!/SCAN/i.test(details))return null;
  if(label==='B'&&!/SEARCH|INDEX/i.test(details))return null;
  return {summary:`${label} · SELECT 결과 1행 · ${label==='A'?'SCAN':'SEARCH/INDEX'} 확인`,metrics:{조건:preset==='scan'?'인덱스 없음':'제목 인덱스',결과행:select.rows.length,접근:label==='A'?'SCAN':'SEARCH/INDEX'}};
 },
 'event-loop-order':(s,_p,label)=>{
  const variant=label==='A'?'promise-first':'timer-first';
  if(s.variant!==variant||s.logs.join('→')!=='A→B→C')return null;
  return {summary:`${label==='A'?'Promise 먼저':'타이머 먼저'} 예약 · 실제 ${s.logs.join(' → ')}`,metrics:{예약순서:label==='A'?'Promise→타이머':'타이머→Promise',실제:s.logs.join(' → '),실행:s.runs}};
 }
};
root.labAdapters={capture(key,state,parameters,label){return adapters[key]?.(state,parameters,label)||null;}};
})();
