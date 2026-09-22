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
