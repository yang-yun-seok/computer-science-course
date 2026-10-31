const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const root=path.join(__dirname,'..'),read=p=>fs.readFileSync(path.join(root,p),'utf8');
const c=vm.createContext({});c.window=c;
const content=fs.readdirSync(path.join(root,'content')).filter(x=>/^ch\d+.*\.js$/.test(x)||/^glossary(?:-details-.*|-visuals)?\.js$/.test(x));
for(const file of ['src/core.js','src/glossary-links.js',...content.map(x=>'content/'+x),'src/glossary-visuals.js','src/glossary-details.js'])vm.runInContext(read(file),c,{filename:file});
const targets=JSON.parse(read('checks/fixtures/glossary-detail-terms.json'));
const render=id=>c.CS.glossaryVisualHTML(id);

test('every audited core term has a complete visual in its expanded explanation',()=>{
 assert.equal(targets.length,290);
 assert.deepEqual(Object.keys(c.CS.glossaryVisuals).sort(),targets);
 const htmlIds=new Set();
 for(const id of targets){
  const html=render(id),detail=c.CS.glossaryDetailHTML(id,{open:true});
  assert.match(html,/<figure\b/,id);assert.match(html,/<figcaption\b/,id);
  assert.match(html,/<svg\b|aria-label=|<img\b/,id);
  assert.ok(detail.includes(html),id);assert.ok(detail.indexOf(html)<detail.indexOf('조금 더 풀어 보면'),id);
  assert.doesNotMatch(html,/undefined|TODO|준비 중|<script|<iframe|<button|<input/i,id);
  for(const [,value] of html.matchAll(/\bid="([^"]+)"/g)){
   assert.ok(!htmlIds.has(value),'duplicate diagram ID: '+value);htmlIds.add(value);
  }
 }
 assert.equal(render('missing'),'');assert.equal(render('os-001'),'');
});

test('reused lesson figures resolve and real hardware photos keep their attribution',()=>{
 for(const [id,visual] of Object.entries(c.CS.glossaryVisuals)){
  if(!visual.source)continue;
  assert.match(render(id),/teaching-figure/,id+' '+visual.source);
  assert.ok(visual.focus.length>25,id);
 }
 assert.match(render('arch-153'),/Sony_PlayStation_1_RAM_512_KB/);
 assert.match(render('arch-153'),/CC BY-SA 4.0/);
 assert.match(render('net-117'),/Wikimedia Commons/);
});

test('visuals keep important interpretation and persistence boundaries explicit',()=>{
 assert.match(render('arch-026'),/11111011|1<\/span><span[^>]*>1/);
 assert.match(render('arch-026'),/−5/);assert.match(render('arch-026'),/251/);
 assert.match(render('arch-153'),/전원을 끈 뒤/);assert.match(render('arch-153'),/저장장치 · 파일 유지/);
 assert.match(render('arch-159'),/둘 다 내용이 유지되지 않는/);
 assert.match(render('arch-261'),/200개 명령/);assert.match(render('arch-261'),/100사이클/);assert.match(render('arch-261'),/프로세스 간 통신/);
 assert.match(render('net-140'),/20 \+ 20 \+ 1460 = IP 패킷 1500B/);
 assert.match(render('net-139'),/IPv6/);
 assert.match(render('net-485'),/홉 제한/);
});

test('scheduler and cache timelines conserve work and show the actual replacement choice',()=>{
 const html=render('os-072'),jobs=[...html.matchAll(/data-job="([ABC])"/g)].map(m=>m[1]);
 assert.deepEqual(jobs.slice(0,6),['A','A','A','A','B','C']);
 assert.deepEqual(jobs.slice(6),['A','B','C','A','A','A']);
 for(const line of [jobs.slice(0,6),jobs.slice(6)])assert.deepEqual(line.sort(),['A','A','A','A','B','C']);
 assert.match(render('net-488'),/LRU는 B 교체/);
 assert.match(render('os-130'),/가능한 가장 작은 6칸/);
 assert.match(render('os-129'),/순서상 처음 맞는 9칸/);
 assert.match(render('os-131'),/가능한 가장 큰 9칸/);
});

test('HTTP and database examples distinguish structure, joined rows and response outcomes',()=>{
 const join=render('db-049').match(/<tbody>[\s\S]*?<\/tbody>/g);
 assert.equal(join.length,3);assert.equal((join[2].match(/<tr>/g)||[]).length,2);
 assert.doesNotMatch(join[2],/준서/);
 assert.match(render('db-027'),/ROLLBACK/);assert.match(render('db-030'),/재시작 뒤/);
 assert.match(render('net-327'),/200/);assert.match(render('net-327'),/404/);assert.match(render('net-327'),/500/);
 assert.doesNotMatch(render('net-327'),/POST를 재시도/);
 assert.match(render('net-407'),/JSON 표현/);assert.match(render('net-407'),/HTML 표현/);
});

test('diagrams never enter the short lesson hover popup',()=>{
 const popup=read('src/glossary-links.js');
 assert.doesNotMatch(popup,/glossaryVisual|gv-figure|glossary-deep/);
 assert.ok(read('scripts/build.cjs').includes('src/glossary-visuals.js'));
});
const textOf=html=>html.replace(/<[^>]*>/g,' ').replace(/&gt;/g,'>').replace(/&lt;/g,'<').replace(/&amp;/g,'&').replace(/\s+/g,' ').trim();
function tablesOf(html){return [...html.matchAll(/<table\b[\s\S]*?<\/table>/g)].map(m=>[...m[0].matchAll(/<tr>[\s\S]*?<\/tr>/g)].map(r=>[...r[0].matchAll(/<t[dh]\b[^>]*>([\s\S]*?)<\/t[dh]>/g)].map(x=>textOf(x[1]))));}

test('the assembly and machine-code example encodes the same real RISC-V ADD',()=>{
 const html=render('arch-047'),fields=html.match(/class="gv-bit-fields">([\s\S]*?)<\/div><code/)[1];
 const bits=[...fields.matchAll(/<b>([01]+)<\/b>/g)].map(m=>m[1]).join('');
 assert.equal(bits.length,32);const word=parseInt(bits,2);
 assert.equal(word,0x007302b3);assert.equal(word&0x7f,0x33);
 assert.equal((word>>>7)&31,5);assert.equal((word>>>15)&31,6);assert.equal((word>>>20)&31,7);
 assert.equal((word>>>12)&7,0);assert.equal(word>>>25,0);
 assert.match(html,/add x5, x6, x7/);assert.match(html,/결과 x5 = 10/);
 const binary=render('arch-023'),actual=[...binary.matchAll(/<b>([01])<\/b>/g)].map(m=>m[1]).join('');
 assert.equal(actual,'10001010');assert.equal(parseInt(actual,2),138);
});

test('memory areas and waiting states are illustrated as different roles',()=>{
 const memory=render('os-034');
 const areas=[...memory.matchAll(/class="gv-memory-area[^>]*>([\s\S]*?)<\/div><\/div>/g)].map(m=>textOf(m[1]));
 assert.ok(areas.some(t=>t.startsWith('Data ')&&t.includes('100')));
 assert.ok(areas.some(t=>t.startsWith('BSS ')&&t.includes('점수 = 0')));
 assert.ok(!memory.includes('Data · BSS'));
 assert.match(render('os-080'),/D는 준비 큐 밖/);
 assert.match(render('os-153'),/C는 아직 미적재/);
 assert.match(render('os-160'),/페이지 폴트/);assert.match(render('os-160'),/빈 프레임에 적재/);
 assert.match(render('os-043'),/대기 상태가 항상 종료 전에 거치는 필수 단계는 아니/);
 assert.equal(c.CS.glossaryVisuals['arch-125'].kind,'concurrency');
});

test('BFS and DFS orders follow the same illustrated graph and never skip E',()=>{
 const html=render('ds-083'),edges=[...html.matchAll(/data-from="([A-F])" data-to="([A-F])"/g)].map(m=>[m[1],m[2]]);
 const graph=new Map();for(const [a,b]of edges){if(!graph.has(a))graph.set(a,[]);if(!graph.has(b))graph.set(b,[]);graph.get(a).push(b);graph.get(b).push(a);}for(const list of graph.values())list.sort();
 const bfs=[],seen=new Set(['A']),queue=['A'];while(queue.length){const n=queue.shift();bfs.push(n);for(const x of graph.get(n))if(!seen.has(x)){seen.add(x);queue.push(x);}}
 const dfs=[],walk=n=>{if(dfs.includes(n))return;dfs.push(n);for(const x of graph.get(n))walk(x);};walk('A');
 const order=name=>{const part=html.split('data-order="'+name+'">')[1].split('</div></div>')[0];return [...part.matchAll(/<span[^>]*>([A-F])<\/span>/g)].map(m=>m[1]);};
 assert.deepEqual(order('bfs'),bfs);assert.deepEqual(order('dfs'),dfs);assert.equal(new Set(dfs).size,6);assert.ok(dfs.includes('E'));
 const degree=render('ds-089'),directed=[...degree.matchAll(/data-from="([A-D])" data-to="([A-D])"/g)].map(m=>[m[1],m[2]]);
 assert.equal(directed.filter(x=>x[1]==='B').length,2);assert.equal(directed.filter(x=>x[0]==='B').length,1);
 assert.ok(c.CS.lessons['ch08-l02'].sections.find(s=>s.id==='b03').html.includes('↩ B → E ↩ A → C → F'));
});

test('database pictures distinguish row counts, column counts and the query projection',()=>{
 const [players]=tablesOf(render('db-019'));assert.equal(players.length-1,4);assert.equal(players[0].length,3);
 assert.match(render('db-019'),/카디날리티/);assert.match(render('db-086'),/차수 3/);
 const [input,result]=tablesOf(render('db-005'));
 const expected=input.slice(1).filter(r=>Number(r[2])>=10).map(r=>[r[1],r[2]]);
 assert.deepEqual(result[0],['이름','레벨']);assert.deepEqual(result.slice(1),expected);
 assert.match(render('db-005'),/SELECT 이름, 레벨/);
 const [index,data]=tablesOf(render('db-055'));
 for(const [id,pos] of index.slice(1))assert.equal(data.slice(1).find(row=>row[0]===pos)[1],id);
 assert.match(render('db-020'),/자료형·제약/);
});

test('ACID examples separate all-or-nothing, constraints, isolation and persistence',()=>{
 const acid=render('db-024');for(const name of ['A · 원자성','C · 일관성','I · 격리성','D · 지속성'])assert.ok(acid.includes(name));
 const atomic=render('db-025');assert.match(atomic,/모두 성공 → COMMIT/);assert.match(atomic,/실패 → ROLLBACK/);
 const constraints=tablesOf(render('db-028'));assert.equal(constraints[1][1][2],'제약 위반 ✕');assert.equal(constraints[1][2][2],'제약 위반 ✕');
 const [timeline]=tablesOf(render('db-029'));
 assert.equal(timeline[1][1],'점수 10 읽음');assert.equal(timeline[3][1],'아직 10 읽음');assert.match(timeline[4][2],/COMMIT/);assert.equal(timeline[5][1],'새 SELECT는 20 읽음');
 assert.match(render('db-029'),/PostgreSQL의 Read Committed/);
});

test('page-fault frequency uses a stated access window and the correct LRU counts',()=>{
 const requests=['A','B','C','A','B','C','A','B','C','A','B','C'];
 const faults=capacity=>{const frames=[];let count=0;for(const x of requests){const i=frames.indexOf(x);if(i<0){count++;if(frames.length===capacity)frames.shift();}else frames.splice(i,1);frames.push(x);}return count;};
 assert.equal(faults(2),12);assert.equal(faults(3),3);
 const html=render('os-169');assert.ok(html.includes(faults(2)+' / '+requests.length));assert.ok(html.includes(faults(3)+' / '+requests.length));
 assert.match(render('os-107'),/허용량 3/);assert.match(render('os-107'),/D는 대기/);
});

test('network diagrams preserve the byte, packet, path and protocol boundaries',()=>{
 const html=render('net-237'),[sent]=tablesOf(html),rows=sent.slice(1);
 const ack=received=>{let n=100;while(received.has(n))n++;return n;};
 const arrived=new Set(rows.filter(r=>r[2]==='도착').map(r=>Number(r[1])));
 assert.equal(ack(arrived),101);arrived.add(101);assert.equal(ack(arrived),103);
 assert.match(html,/ACK 101/);assert.match(html,/ACK 103/);
 assert.match(render('net-055'),/TCP 세그먼트 1480B/);assert.equal(20+1480,1500);
 assert.match(render('net-154'),/DF=1/);assert.match(render('net-154'),/ICMP/);assert.match(render('net-154'),/1280B 이하/);
 assert.match(render('net-274'),/라우터 출력 큐/);assert.match(render('net-210'),/최선형 전달은 UDP만의 성질이 아니/);
 assert.match(render('net-322'),/동일한 TCP 연결 1개/);
});

test('browser storage and cookie restrictions remain distinct in the picture itself',()=>{
 const storage=render('net-403');assert.match(storage,/Web Storage API · 두 종류/);assert.match(storage,/IndexedDB는 Web Storage의 두 종류에 포함되지/);
 const [lifetime]=tablesOf(storage);assert.deepEqual(lifetime[1],['탭 A 새로고침','유지','유지']);assert.match(lifetime[2][2],/삭제/);
 const cookie=render('net-402');assert.match(cookie,/Set-Cookie: session_id=S7; Secure; HttpOnly/);assert.match(cookie,/document.cookie 접근 ✕/);assert.match(cookie,/Secure 쿠키 전달 ✕/);
 assert.match(cookie,/브라우저의 요청 전송을 막지는 않/);
});
