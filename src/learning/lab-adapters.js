(()=>{
'use strict';
const root=CS.learning=CS.learning||{};
const norm=value=>String(value??'').replace(/\s+/g,'');
const done=s=>!!s?.done;
const terminal=s=>!!(s?.result||s?.logs?.length||s?.app);
const adapters={
 'cpu-add':(s,p,label)=>{
  const expected=label==='A'?{a:3,b:2}:{a:8,b:7};
  if(!done(s)||p.a!==expected.a||p.b!==expected.b||s.output!==expected.a+expected.b||s.ram?.a!==expected.a||s.ram?.b!==expected.b)return null;
  return {summary:`${p.a}+${p.b}=${s.output}`,metrics:{입력:`${p.a}+${p.b}`,결과:s.output,단계:`${s.step}/5`}};
 },
 'bst-traversal':(s,_p,label)=>{
  const expected=label==='A'?{tree:'3,2,4,1,5',path:[3,4,5]}:{tree:'1,2,3,4,5',path:[1,2,3,4,5]};
  if(norm(s.treeInput)!==expected.tree||Number(s.searchInput)!==5||!s.found||JSON.stringify(s.searchPath)!==JSON.stringify(expected.path))return null;
  return {summary:`${expected.tree}에서 5 탐색 · ${s.searchPath.join(' → ')}`,metrics:{입력:expected.tree,탐색경로:s.searchPath.join(' → '),노드수:s.keys.length}};
 },
 'graph-paths':(s,p,label)=>{
  const expected=label==='A'?{algorithm:'bfs',cost:2}:{algorithm:'dijkstra',cost:2};
  if(p.algorithm!==expected.algorithm||p.target!=='C'||!done(s)||!s.found||s.cost!==expected.cost)return null;
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
  const details=s.result.results.flatMap(result=>result.rows||[]).map(row=>row.join(' ')).join(' | ');
  return {summary:`${label} · ${s.result.results.length}개 계획 결과 표`,metrics:{조건:preset==='scan'?'인덱스 없음':'제목 인덱스',결과행:s.result.results.length,detail:details.slice(0,160)||'계획 detail 확인'}};
 },
 'event-loop-order':(s,_p,label)=>{
  const prediction=label==='A'?'A→B→C':'A→C→B';
  if(s.prediction!==prediction||s.logs.join('→')!=='A→B→C')return null;
  return {summary:`예상 ${prediction} · 실제 ${s.logs.join(' → ')}`,metrics:{예상:prediction,실제:s.logs.join(' → '),실행:s.runs}};
 }
};
root.labAdapters={capture(key,state,parameters,label){return adapters[key]?.(state,parameters,label)||null;}};
})();
