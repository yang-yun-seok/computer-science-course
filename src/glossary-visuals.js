(()=>{
'use strict';
const e=CS.helpers.escape;
const cells=(items,{active=[],empty=false}={})=>`<div class="gv-cells">${items.map((value,i)=>`<span class="${active.includes(i)?'is-active ':''}${empty?'is-empty':''}">${e(value)}</span>`).join('')}</div>`;
const scene=(title,body,note='')=>`<div class="gv-scene"><strong>${e(title)}</strong>${body}${note?`<small>${e(note)}</small>`:''}</div>`;
const chip=(label,items,options)=>`<div class="gv-memory"><b>${e(label)}</b>${cells(items,options)}<i aria-hidden="true"></i></div>`;
const arrow='<span class="gv-arrow" aria-hidden="true">→</span>';
const ram=()=>`<div class="gv-scenes" role="img" aria-label="게임 중 RAM에 놓인 체력과 골드를 저장장치에 기록하고, 전원을 끄면 RAM은 비지만 저장한 파일은 남는 세 장면">${scene('1. 게임 실행 중',chip('RAM',['체력 7','골드 100'],{active:[0,1]})+'<span class="gv-cpu">CPU ↔ 읽기·쓰기</span>','현재 계산에 쓰는 값이 있어요.')}${scene('2. 파일로 저장 완료',chip('RAM',['체력 7','골드 100'])+arrow+'<div class="gv-storage"><b>세이브 파일</b>'+cells(['체력 7','골드 100'])+'</div>','저장장치에 기록을 마친 상황이에요.')}${scene('3. 전원을 끈 뒤',chip('RAM',['비어 있음','비어 있음'],{empty:true})+'<div class="gv-storage is-saved"><b>저장장치 · 파일 유지</b>'+cells(['체력 7','골드 100'],{active:[0,1]})+'</div>','RAM의 값과 저장된 파일은 달라요.')}</div>`;
const flow=items=>`<div class="gv-flow">${items.map((x,i)=>`${i?arrow:''}<div class="gv-flow-node">${x}</div>`).join('')}</div>`;
const dots=(n,label='작업')=>`<div class="gv-tokens">${Array.from({length:n},(_,i)=>`<span>${e(label)} ${i+1}</span>`).join('')}</div>`;
const table=(heads,rows,{col=-1,row=-1}={})=>`<div class="gv-table-wrap"><table class="gv-table"><thead><tr>${heads.map((x,i)=>`<th class="${i===col?'gv-mark':''}" scope="col">${e(x)}</th>`).join('')}</tr></thead><tbody>${rows.map((r,j)=>`<tr>${r.map((x,i)=>`<td class="${i===col||j===row?'gv-mark':''}">${e(x)}</td>`).join('')}</tr>`).join('')}</tbody></table></div>`;
const picture=(body,alt)=>`<div class="gv-drawing" role="img" aria-label="${e(alt)}">${body}</div>`;
const tag=(label,value,active=false)=>`<div class="gv-tag ${active?'is-focus':''}"><small>${e(label)}</small><b>${e(value)}</b></div>`;
const processor=id=>picture(`<div class="gv-processor"><b>CPU</b><div class="gv-components">${tag('제어장치','명령 해석',id==='arch-007'||id==='arch-089')}${tag('ALU','7 + 3 = 10',id==='arch-005')}${tag('레지스터','7 · 3 · 10',id==='arch-006')}</div><div class="gv-chip-pins"></div></div><div class="gv-link-label">↕ 명령과 데이터를 읽고 써요</div>${chip('RAM',['명령','데이터'])}`,'CPU 안의 제어장치, ALU, 레지스터와 바깥 RAM의 역할');
const registers=id=>picture(flow([table(['메모리 주소','내용'],[['100','데이터 7'],['104','더하기 명령']]),`<div class="gv-register-grid">${tag('PC · 명령 주소','104',id==='arch-091')}${tag('IR · 가져온 명령','더하기',id==='arch-093')}${tag('MAR · 접근 주소','100',id==='arch-094')}${tag('MBR · 주고받는 값','7',id==='arch-095')}</div>`]),'메모리 주소 100의 데이터 7, 주소 104의 명령과 PC IR MAR MBR의 서로 다른 역할');
const refresh=()=>`<div class="gv-scenes" role="img" aria-label="DRAM은 새로 고침이 필요하고 SRAM은 필요 없지만 둘 다 전원을 끄면 내용이 사라지는 비교">${scene('DRAM',chip('전하로 값 저장',['1','0','1','0'])+'<div class="gv-cycle">↻</div><b class="gv-center">주기적 새로 고침</b>','전원이 있어도 refresh가 필요해요.')}${scene('SRAM',chip('회로로 값 유지',['1','0','1','0'])+'<div class="gv-steady">━━━━</div><b class="gv-center">새로 고침 없이 유지</b>','전원이 계속 공급되어야 해요.')}${scene('둘 다 전원을 끄면',chip('일반적인 RAM',['?','?','?','?'],{empty:true}),'둘 다 내용이 유지되지 않는 휘발성 메모리예요.')}</div>`;
const twos=()=>`<div class="gv-scenes" role="img" aria-label="8비트 5의 비트를 뒤집고 1을 더해 11111011을 만들면 부호 있는 해석은 −5, 부호 없는 해석은 251">${scene('1. 양수 5',cells('00000101'.split(''),{active:[5,7]}),'8비트: 4 + 1 = 5')}${scene('2. 비트를 뒤집고 +1',cells('11111010'.split(''))+'<span class="gv-operation">+ 00000001</span>','정해진 8비트 폭만 남겨요.')}${scene('3. 결과 해석',cells('11111011'.split(''),{active:[0]})+tag('부호 있는 2의 보수','−5')+tag('부호 없는 해석','251'),'같은 비트여도 해석 규칙이 달라요.')}</div>`;
const ascii=()=>picture(`<div class="gv-scenes two">${scene('문자 A',flow(['<b class="gv-big-char">A</b>',tag('ASCII 코드','65'),cells(['01000001'])]),'ASCII 범위의 문자를 한 바이트에 표현해요.')}${scene('한글 가',flow(['<b class="gv-big-char">가</b>',tag('유니코드 코드 포인트','U+AC00'),cells(['EA','B0','80'])]),'기본 ASCII에는 없으며 UTF-8에서는 세 바이트예요.')}</div>`,'A는 ASCII 65와 바이트 01000001, 가는 U+AC00과 UTF-8 세 바이트 EA B0 80');
const clock=()=>picture(`<svg class="gv-svg" viewBox="0 0 480 220" aria-label="1GHz의 예로 3ns 동안 세 주기의 클럭 신호" role="img"><path d="M40 130 H100 V60 H160 V130 H220 V60 H280 V130 H340 V60 H400 V130 H440" class="gv-wave"/><path d="M40 165H440" class="gv-axis"/>${[0,1,2,3].map((n,i)=>`<text x="${40+i*120}" y="197">${n}ns</text>`).join('')}<path d="M40 30H160" class="gv-measure"/><text x="100" y="22">한 주기</text></svg><div class="gv-equation">1GHz → 1초에 10억 주기 → 한 주기 1ns</div>`,'클럭의 주기와 주파수 관계. 한 주기가 명령 하나의 완료를 뜻하지 않음');
const cpuStates=id=>{
 const states=[['생성','프로세스 준비'],['준비','CPU 차례 대기'],['실행','CPU 사용 중'],['대기','입출력 등 사건 대기'],['종료','실행 마침']],selected={'os-042':0,'os-043':1,'os-045':2,'os-046':3,'os-047':4}[id];
 return picture(`<div class="gv-state-route">${states.map(([name,note],i)=>`<div class="gv-state ${selected===i?'is-focus':''}"><b>${name}</b><small>${note}</small></div>`).join('')}</div><div class="gv-state-links"><span>준비 → 실행: CPU 배정</span><span>실행 → 준비: 시간 조각 만료</span><span>실행 → 대기: 입출력 요청</span><span>대기 → 준비: 입출력 완료</span><span>실행 → 종료: 실행 마침</span></div>`,'생성 준비 실행 대기 종료의 다섯 상태와 전환을 일으키는 사건');
};
const memoryLayout=id=>{
 const parts=[['코드','실행할 명령','os-032'],['Data · BSS','전역·정적 데이터','os-034'],['힙','동적으로 만든 객체','os-038'],['스택','호출별 실행 정보','os-040']];
 return picture(`<div class="gv-address-space"><b>프로세스의 가상 주소 공간</b>${parts.map(([a,b,target])=>`<div class="gv-memory-area ${id===target||id==='os-035'&&target==='os-034'?'is-focus':''}"><strong>${a}</strong><span>${b}</span>${cells(target==='os-034'?['0','0','0']:target==='os-038'?['몬스터 A','몬스터 B']:target==='os-040'?['전투 호출','피해 계산']:['읽기','계산','저장'])}</div>`).join('')}</div>`,'코드, Data BSS, 힙, 스택의 서로 다른 역할을 나눈 개념도');
};
const processRecord=id=>picture(`<div class="gv-scenes two">${scene('프로세스 A',tag('PID','101',id==='os-029')+tag('실행 상태','READY')+tag('다음 명령 위치','42',id==='os-030')+tag('레지스터 문맥','R1=7 · R2=3',id==='os-030'),'운영체제가 관리하는 기록을 단순화했어요.')}${scene('프로세스 B',tag('PID','102',id==='os-029')+tag('실행 상태','RUNNING')+tag('다음 명령 위치','18',id==='os-030')+tag('레지스터 문맥','R1=20 · R2=5',id==='os-030'),'파일이 같아도 실행 위치와 값은 달라요.')}</div>`,'두 프로세스의 PID와 실행 상태, 다음 명령 위치와 레지스터 문맥 비교');
const threads=()=>picture(`<div class="gv-shared"><b>프로세스 하나 · 함께 쓰는 주소 공간</b>${cells(['코드','힙 객체','전역 데이터'],{active:[0,1,2]})}</div><div class="gv-scenes two">${scene('스레드 A',tag('실행 위치','명령 42')+chip('A의 스택',['호출 A1','호출 A2']),'실행 문맥은 각자 가져요.')}${scene('스레드 B',tag('실행 위치','명령 18')+chip('B의 스택',['호출 B1','호출 B2']),'공유 값을 바꿀 때 동기화가 필요해요.')}</div>`,'한 프로세스의 코드 힙 전역 데이터를 공유하지만 스택과 실행 위치는 다른 두 스레드');
const priority=id=>picture(`<div class="gv-scenes two">${scene('처음 대기열',tag('요청 A · 높은 순위','먼저 처리')+tag('요청 B · 낮은 순위','대기 중')+tag('요청 C · 높은 순위','새로 도착'), '높은 순위의 새 요청만 고르면 B가 계속 밀릴 수 있어요.')}${scene(id==='os-093'?'에이징 적용':'선택 규칙 필요',tag('오래 기다린 B','순위 상승',true)+tag('선택된 작업','B에 실행 기회'),'대기 시간을 반영하는 한 가지 정책의 예예요.')}</div>`,'낮은 우선순위 B가 기다리다가 에이징으로 순위가 올라 실행 기회를 얻는 비교');
const allocation=id=>{
 if(id==='os-140')return picture(`<div class="gv-allocation">${cells(['사용','사용','사용','남음'],{active:[0,1,2]})}<b>4칸 배정 − 3칸 사용 = 안쪽 1칸 낭비</b></div>`,'할당한 네 칸 중 세 칸을 사용하고 내부에 한 칸이 남은 내부 단편화');
 if(id==='os-132')return picture(`<div class="gv-free-map">${cells(['빈 3칸','사용 중','빈 4칸'],{active:[0,2]})}</div><div class="gv-equation">빈 공간 합계 7칸 · 가장 큰 연속 공간 4칸</div><div class="gv-denied">연속 6칸 요청 → 배정 불가</div>`,'빈 공간 세 칸과 네 칸이 나뉘어 합은 일곱 칸이지만 연속 여섯 칸 요청을 받지 못함');
 const picked=id==='os-130'?2:1;
 return picture(`<div class="gv-allocation-bars">${[4,9,6].map((n,i)=>`<div><span>빈 구간 ${i+1}</span><div class="gv-capacity" style="--fill:${n/9*100}%"><i class="${i===picked?'is-chosen':''}">${n}칸</i></div>${i===picked?'<b>← 선택</b>':''}</div>`).join('')}</div><div class="gv-equation">요청 5칸 → ${id==='os-130'?'가능한 가장 작은 6칸':id==='os-129'?'순서상 처음 맞는 9칸':'가능한 가장 큰 9칸'}</div>`,'빈 공간 4칸 9칸 6칸에서 5칸 요청에 대한 배치 후보 선택');
};
const compression=()=>picture(`<div class="gv-scenes">${scene('1. 원래 픽셀',`<div class="gv-pixels">${[0,0,0,0,1,1,1,1].map(v=>`<i class="p${v}"></i>`).join('')}</div>`,'같은 색이 네 번씩 반복돼요.')}${scene('2. 반복을 기록',tag('파랑','4개')+tag('밝은 파랑','4개'),'색과 개수로 반복을 표현해요.')}${scene('3. 다시 펼치기',`<div class="gv-pixels">${[0,0,0,0,1,1,1,1].map(v=>`<i class="p${v}"></i>`).join('')}</div>`,'원래 순서를 정확히 복원하는 무손실 예시예요.')}</div>`,'파란 픽셀 네 개와 밝은 파란 픽셀 네 개를 반복 개수로 표현하고 다시 원래대로 복원함');
const ports=()=>picture(flow([tag('같은 서버 IP','203.0.113.7'),`<div class="gv-port-branches">${tag('게임 통신 · 예시 포트','7777')}${tag('HTTPS 서비스','443')}${tag('관리 서비스 · 예시 포트','9000')}</div>`]),'하나의 서버 IP에서 포트 7777, 443, 9000으로 서로 다른 통신 끝점을 구별하는 예시');
const packetSize=()=>picture(`<div class="gv-packet"><div>IPv4 헤더<b>20B</b></div><div>TCP 헤더<b>20B</b></div><div class="gv-payload">앱 데이터<b>1460B</b></div></div><div class="gv-equation">20 + 20 + 1460 = IP 패킷 1500B</div><div class="gv-threshold">링크 MTU 1500B ━━━━━━━━━</div>`,'옵션 없는 IPv4와 TCP의 헤더가 각각 20바이트이고 앱 데이터 1460바이트를 합쳐 IP 패킷 1500바이트인 예');
const pathMtu=()=>picture(flow([tag('링크 A','1500B'),tag('링크 B · 가장 작은 한도','1280B',true),tag('링크 C','1500B')])+`<div class="gv-equation">이 경로에서 맞춰야 할 크기 → 1280B</div>`,'링크 MTU가 1500, 1280, 1500바이트인 경로에서 가장 작은 1280바이트가 제한인 예');
const fragment=()=>picture(`<div class="gv-scenes">${scene('1. 큰 데이터그램',cells(['헤더','큰 데이터'],{active:[1]}),'한 번에 지나갈 크기를 확인해요.')}${scene('2. 분할이 허용된 경우',cells(['조각 1','조각 2','조각 3']),'조각을 구별할 정보가 필요해요.')}${scene('3. 수신 측 재조립',cells(['원래 데이터'],{active:[0]}),'필요한 조각이 빠지면 복원이 안 될 수 있어요.')}</div>`,'하나의 큰 데이터그램이 허용된 규칙에 따라 세 조각으로 나뉜 뒤 수신 측에서 재조립되는 개념도');
const playerRows=[['U1','민지','10'],['U2','준서','7'],['U3','민지','12']];
const dbTable=id=>{
 const row=id==='db-016'?0:-1,col=id==='db-012'||id==='db-013'?2:id==='db-017'?1:-1;
 return picture(`<div class="gv-table-anatomy"><b class="${id==='db-086'?'is-focus':''}">가로 열 3개 → 차수 3</b><div><span class="gv-row-brace ${id==='db-019'?'is-focus':''}">세로 행 3개</span>${table(['ID','이름','레벨'],playerRows,{row,col})}</div><div class="gv-rule">레벨의 허용 범위: 1 이상의 정수</div></div>`,'ID 이름 레벨의 세 열과 세 플레이어 행. 한 행, 한 열, 행 수와 열 수를 구별하는 표');
};
const dbms=()=>picture(flow([tag('게임 서버','조회·변경 요청'),`<div class="gv-db-engine"><b>DBMS</b>${cells(['조회 계획','제약 검사','거래·복구'])}</div>`,`<div class="gv-db-cylinder"><b>데이터베이스</b>${cells(['플레이어','아이템','보유 기록'])}</div>`]),'게임 서버가 DBMS에 요청하고 DBMS가 구조화된 플레이어 아이템 보유 데이터를 관리하는 역할');
const sql=()=>picture(`<div class="gv-scenes">${scene('1. 입력 표',table(['ID','레벨'],playerRows.map(r=>[r[0],r[2]])),'입력의 모든 행을 먼저 구별해요.')}${scene('2. 조건 검사','<div class="gv-sql">WHERE<br><b>레벨 ≥ 10</b></div>'+cells(['10 ✓','7 ✕','12 ✓'],{active:[0,2]}),'조건에 맞는 행만 남겨요.')}${scene('3. 조회 결과',table(['ID','레벨'],[['U1','10'],['U3','12']],{col:1}),'결과는 두 행이에요.')}</div>`,'플레이어 세 행 중 레벨이 10 이상인 U1과 U3를 골라 두 행을 만드는 조회');
const keys=id=>picture(`<div class="gv-scenes two">${scene('플레이어 표',table(['ID','계정 번호','이름'],[['U1','A100','민지'],['U2','A200','민지']],{col:id==='db-032'?1:0}),'이름이 같아도 ID와 계정 번호는 구별돼요.')}${scene('보유 아이템 표',table(['player_id','item_id'],[['U1','I7'],['U1','I9']],{col:0})+'<div class="gv-reference">player_id → 플레이어.ID</div>','존재하는 U1을 참조해요. 없는 U99를 넣으면 제약 위반이에요.')}</div>`,'플레이어 U1과 U2의 서로 다른 ID, 고유 계정 번호와 중복 이름, U1을 참조하는 보유 기록');
const join=()=>picture(`<div class="gv-scenes">${scene('1. 플레이어',table(['ID','이름'],[['U1','민지'],['U2','준서']]),'U2는 보유 기록이 없어요.')}${scene('2. 보유 기록',table(['player_id','아이템'],[['U1','I7'],['U1','I9']],{col:0}),'같은 ID로 짝을 찾아요.')}${scene('3. INNER JOIN',table(['이름','아이템'],[['민지','I7'],['민지','I9']],{col:0}),'일치하는 U1은 두 행, 일치하지 않는 U2는 빠져요.')}</div>`,'플레이어 표와 보유 기록을 ID로 내부 조인해 민지 I7, 민지 I9의 두 행을 얻음');
const transaction=id=>{
 const rollback=id==='db-027',durable=id==='db-030';
 return picture(`<div class="gv-scenes">${scene('1. 구매 전',tag('골드','100')+tag('아이템 수','0'),'두 값이 하나의 구매 규칙에 속해요.')}${scene(durable?'2. COMMIT 완료':'2. 거래 진행 중',tag('골드','0')+tag('아이템 수',durable?'1':'0')+(durable?'<b class="gv-confirmed">확정</b>':'<b class="gv-unconfirmed">아직 확정하지 않음</b>'),'차감만 남긴 채 구매 성공으로 처리하지 않아요.')}${scene(durable?'3. 재시작 뒤':rollback?'3. ROLLBACK':'3. COMMIT',tag('골드',rollback?'100':'0',true)+tag('아이템 수',rollback?'0':'1',true),durable?'약속한 장애 범위에서 확정 결과를 보존해요.':rollback?'실패하면 확정 전 변경을 취소해요.':'지급까지 성공한 변경을 함께 확정해요.')}</div>`,'골드 100 아이템 0의 구매 전 상태에서 골드를 차감하고 아이템을 지급하며 커밋 또는 롤백의 결과를 구별함');
};
const ddl=()=>picture(`<div class="gv-scenes two">${scene('변경 전 구조',table(['ID','이름'],[['U1','민지'],['U2','준서']]),'열의 이름과 형식이 구조의 일부예요.')}${scene('레벨 열 추가',table(['ID','이름','레벨'],[['U1','민지','1'],['U2','준서','1']],{col:2}),'행 하나의 값을 바꾸는 대신 표 구조를 바꿔요.')}</div>`,'두 열인 플레이어 표에 레벨 열을 추가해 세 열이 된 DDL의 구조 변경 예');
const dml=()=>picture(`<div class="gv-scenes">${scene('INSERT',table(['아이템','수량'],[['I7','3']],{row:0}),'새 기록을 넣어요.')}${scene('UPDATE',table(['아이템','수량'],[['I7','2']],{col:1}),'같은 기록의 수량을 바꿔요.')}${scene('DELETE',table(['아이템','수량'],[]),'대상 기록을 지워요. 조건 범위를 확인해야 해요.')}</div>`,'I7 수량 3의 기록 추가, 수량 2로 변경, 해당 기록 삭제의 세 행 조작');
const permissions=()=>picture(table(['계정 역할','조회','수정'],[['랭킹 조회 계정','허용 ✓','거부 ✕'],['관리 계정','허용 ✓','허용 ✓']],{row:0})+'<div class="gv-rule">GRANT: 부여 · REVOKE: 회수</div>','랭킹 조회 계정은 조회만 허용하고 관리 계정에는 필요한 수정 권한도 부여하는 권한표');
const normalize=()=>picture(`<div class="gv-scenes two">${scene('이름을 여러 행에 복사',table(['player_id','이름','아이템'],[['U1','민지','I7'],['U1','민지','I9']],{col:1}),'이름이 바뀌면 여러 행을 고쳐야 해요.')}${scene('한 사실을 한곳에',table(['플레이어 ID','이름'],[['U1','민지']],{col:1})+arrow+table(['player_id','아이템'],[['U1','I7'],['U1','I9']]),'플레이어의 이름과 보유 관계를 나눠요.')}</div>`,'보유 기록마다 반복 저장한 플레이어 이름을 플레이어 표 한곳으로 분리하고 ID로 연결한 정규화 예');
const shards=()=>picture(`<div class="gv-shard-source">플레이어 U1 · U2 · U3 · U4 · U5 · U6</div><div class="gv-fanout">↙ ↓ ↘</div><div class="gv-scenes">${scene('샤드 A','<div class="gv-db-cylinder">'+cells(['U1','U4'],{active:[0,1]})+'</div>','데이터 일부를 보관해요.')}${scene('샤드 B','<div class="gv-db-cylinder">'+cells(['U2','U5'],{active:[0,1]})+'</div>','서로 다른 부분을 맡아요.')}${scene('샤드 C','<div class="gv-db-cylinder">'+cells(['U3','U6'],{active:[0,1]})+'</div>','분배 규칙으로 위치를 찾아요.')}</div>`,'여섯 플레이어의 데이터를 U1 U4, U2 U5, U3 U6의 세 샤드로 나누어 저장한 예');
const cookie=id=>picture(`<div class="gv-scenes">${scene('1. 브라우저',`<div class="gv-browser-window"><b>쿠키 보관</b>${tag('session_id','S7',true)}<span class="gv-script">JavaScript ${id==='net-402'?'접근 ✕':'코드'}</span></div>`,'쿠키의 식별자와 서버 상태는 달라요.')}${scene('2. 요청에 포함',flow([tag('HTTPS','전달 ✓',id==='net-401'),tag('HTTP',id==='net-401'?'Secure 쿠키 전달 ✕':'설정 조건 확인')]),id==='net-402'?'HttpOnly여도 조건에 맞는 HTTP 요청에는 포함돼요.':'도메인·경로·보안 속성 등의 조건을 확인해요.')}${scene('3. 서버',table(['세션 ID','계정'],[['S7','U1']],{col:0}),'서버가 S7을 검증하고 계정과 권한을 확인해요.')}</div>`,'브라우저의 세션 쿠키 S7이 조건에 맞는 요청으로 전달되고 서버에서 U1 상태를 찾는 과정');
const versions=()=>picture(`<div class="gv-version-lanes"><div><b>HTTP/1.1 · 순서 있는 응답</b>${cells(['A','A','B','B'])}</div><div><b>HTTP/2 · 한 TCP 연결의 여러 스트림</b>${cells(['A1','B1','A2','B2'],{active:[0,2]})}<small>TCP 손실을 복구하는 동안 여러 스트림이 기다릴 수 있어요.</small></div><div><b>HTTP/3 · QUIC 스트림</b><div class="gv-stream">A ${cells(['A1','손실 대기','A2'])}</div><div class="gv-stream">B ${cells(['B1','B2','진행 ✓'],{active:[2]})}</div><small>전송 스트림의 독립성을 활용해요. 앱의 다른 의존성은 남을 수 있어요.</small></div></div>`,'HTTP 1.1의 순서 응답, HTTP2의 한 TCP 연결 다중화, HTTP3의 QUIC 스트림별 진행 비교');
const buffer=()=>picture(`<div class="gv-buffer-line"><div><b>들어옴</b>${dots(4,'요청')}</div>${arrow}<div><b>유한 버퍼 · 6칸</b>${cells(['A','B','C','D','빈칸','빈칸'],{active:[0,1,2,3]})}</div>${arrow}<div><b>처리</b>${dots(2,'작업')}</div></div><div class="gv-equation">계속 4개 도착 − 2개 처리 → 매번 2개씩 남음</div>`,'여섯 칸 버퍼에 네 개가 차 있고 네 개 유입과 두 개 처리의 차이로 적체가 늘 수 있는 예');
const rates=()=>picture(`<div class="gv-rate-row"><b>같은 데이터 10MB</b>${cells(['10','10','10','10','10','10','10','10'])}<small>8묶음 × 10Mb = 80Mb</small></div><div class="gv-rate-row"><b>10Mbps → 8초</b><div class="gv-duration" style="--time:100%">8초</div></div><div class="gv-rate-row"><b>20Mbps → 4초</b><div class="gv-duration" style="--time:50%">4초</div></div><div class="gv-rule">연결 준비·왕복 지연·대기는 별도로 고려해요.</div>`,'10메가바이트 즉 80메가비트를 10Mbps로 보내면 8초, 20Mbps면 4초인 전송 시간 비교');
const deque=()=>picture(`<div class="gv-scenes">${scene('1. 시작',cells(['A','B']), '앞은 A, 뒤는 B예요.')}${scene('2. 앞에 X 추가',cells(['X','A','B'],{active:[0]}),'앞쪽에서도 새 항목을 넣을 수 있어요.')}${scene('3. 뒤에서 제거',cells(['X','A'],{active:[1]})+'<span class="gv-removed">꺼낸 값 B</span>','양쪽 끝에서 추가·제거가 가능해요.')}</div>`,'덱 A B의 앞에 X를 넣어 X A B가 되고 뒤의 B를 제거해 X A가 된 세 상태');
const contextSwitch=()=>picture(`<div class="gv-scenes">${scene('1. A 실행',tag('CPU가 실행하는 작업','A',true)+tag('A의 실행 위치','42')+tag('A의 레지스터','7'),'A의 진행 상태를 기억해야 해요.')}${scene('2. B로 전환',tag('보관한 A의 문맥','위치 42 · 값 7')+tag('CPU가 실행하는 작업','B',true)+tag('복원한 B의 실행 위치','18'),'A를 보관하고 B의 문맥을 복원해요.')}${scene('3. 다시 A 실행',tag('CPU가 실행하는 작업','A',true)+tag('복원한 위치','42')+tag('복원한 레지스터','7'),'A는 저장한 위치에서 이어 갈 수 있어요.')}</div>`,'A의 위치 42와 레지스터 7을 보관하고 B를 실행한 뒤 A의 상태를 복원하는 문맥 교환');
const scheduling=id=>picture(`<div class="gv-schedule"><b>작업 길이 · 모두 시각 0에 도착</b>${cells(['A: 4칸','B: 1칸','C: 1칸'])}<b>FCFS · 먼저 온 순서</b><div class="gv-time-row">${['A','A','A','A','B','C'].map(x=>`<span data-job="${x}">${x}</span>`).join('')}</div><b>RR · 한 칸씩 번갈아</b><div class="gv-time-row">${['A','B','C','A','A','A'].map(x=>`<span data-job="${x}">${x}</span>`).join('')}</div><div class="gv-time-axis">0 ─ 1 ─ 2 ─ 3 ─ 4 ─ 5 ─ 6</div></div>${id==='os-076'?'<div class="gv-rule">A의 계산량 4칸은 RR에서 여러 시간 조각으로 나뉘어 실행돼요.</div>':''}`,'도착시각이 같은 A 4칸 B 1칸 C 1칸을 FCFS와 시간 조각 1의 RR로 실행한 6칸 시간표');
const cache=()=>picture(`<div class="gv-cache-steps">${[['A',['A','빈칸'],'미스 · 빈칸에 저장'],['B',['A','B'],'미스 · 빈칸에 저장'],['A',['A','B'],'히트 · A를 다시 사용'],['C',['A','C'],'미스 · LRU는 B 교체']].map(([request,state,note],i)=>scene(`${i+1}. 요청 ${request}`,chip('캐시 · 두 칸',state,{active:[state.indexOf(request)]}),note)).join('')}</div>`,'두 칸 캐시에 A B A C를 요청해 히트는 세 번째 한 번이며 마지막에 LRU가 B를 C로 교체함');
const clockReplacement=()=>picture(`<div class="gv-clock-ring"><div>A <b>참조 1</b></div><span>↻</span><div>B <b>참조 0</b></div><div>C <b>참조 1</b></div></div><div class="gv-scenes">${scene('1. A 검사',tag('참조 비트','1 → 0'),'최근 사용 흔적이 있어 한 번 넘겨요.')}${scene('2. B 검사',tag('참조 비트','0',true),'한 번 더 기회를 줄 흔적이 없어요.')}${scene('3. 교체 후보',tag('선택','B',true),'바늘은 원형 순서로 계속 이동해요.')}</div>`,'원형 페이지 A B C를 검사하며 참조 비트 1인 A는 0으로 지우고, 0인 B를 교체 후보로 고르는 Clock 예시');
const semaphore=()=>picture(`<div class="gv-scenes">${scene('1. 허용량 2','<div class="gv-permits"><i></i><i></i></div>','두 작업이 자원을 사용할 수 있어요.')}${scene('2. A와 B가 사용',cells(['A 사용 중','B 사용 중'],{active:[0,1]})+tag('남은 허용량','0'),'진입할 때 허용량을 하나씩 사용해요.')}${scene('3. C는 대기',tag('C','기다림')+'<div class="gv-waiting-dots"><i></i><i></i><i></i></div>','허용량을 돌려주거나 신호가 와야 진행해요.')}</div>`,'허용량 2의 세마포어를 A와 B가 사용해 0이 되면 세 번째 작업 C가 기다리는 예');
const condition=()=>picture(`<div class="gv-scenes">${scene('1. 큐가 비어 있음',cells(['빈칸','빈칸'],{empty:true})+'<div class="gv-sleeper">소비자 · 잠들어 대기</div>','조건을 검사하고 잠금을 놓고 기다려요.')}${scene('2. 생산자가 A 추가',cells(['A','빈칸'],{active:[0]})+'<span class="gv-signal">신호 →</span>','공유 상태를 바꾼 뒤 깨우는 신호를 줘요.')}${scene('3. 깨어난 소비자',tag('조건을 다시 검사','큐가 비지 않았는가?',true),'잠금을 다시 얻고 조건을 확인한 뒤 꺼내요.')}</div>`,'빈 큐를 기다리는 소비자, 생산자의 A 추가와 신호, 깨어나 조건을 다시 확인하는 소비자의 세 상태');
const ui=()=>picture(`<div class="gv-scenes">${scene('1. 입력',`<div class="gv-game-screen"><span>골드 100</span><div class="gv-illustrated-button">아이템 구매</div></div>`,'플레이어가 원하는 행동을 선택해요.')}${scene('2. 처리',tag('서버 검사','골드·재고·권한'),'보이는 버튼이 최종 권한 검사를 대신하지 않아요.')}${scene('3. 결과 표시',`<div class="gv-game-screen"><span>골드 0</span>${cells(['아이템 1'],{active:[0]})}</div>`,'성공이나 실패를 사용자가 알 수 있게 보여 줘요.')}</div>`,'골드 100과 구매 버튼의 입력 화면, 서버의 검증, 골드 0과 아이템 1의 결과 화면');
const disk=()=>picture(`<div class="gv-scenes">${scene('1. 자기 원판','<div class="gv-disk"><i></i><span></span></div>','원판의 트랙에 데이터를 기록해요.')}${scene('2. 읽기·쓰기 위치',tag('헤드 이동','필요한 위치로'), '흩어진 위치를 읽으면 이동 비용이 달라져요.')}${scene('3. 파일 보관','<div class="gv-storage"><b>세이브 파일</b>'+cells(['레벨 8','체력 7'])+'</div>','일반적인 HDD는 전원을 꺼도 기록을 보관해요.')}</div>`,'HDD의 원형 트랙과 헤드, 읽을 위치로 이동하는 동작, 전원을 꺼도 보관하는 파일의 관계');
const machineLayers=()=>picture(`<div class="gv-scenes">${scene('1. 소스의 표현','<div class="gv-sql">피해 = 공격력 + 보너스</div>','사람이 규칙을 작성해요.')}${scene('2. 기호로 보는 명령','<div class="gv-symbolic-code"><span>값 읽기</span><span>더하기</span><span>결과 기록</span></div>','어셈블리어는 대상 명령을 기호로 표현해요.')}${scene('3. CPU가 읽는 표현','<div class="gv-machine-lines"><i></i><i></i><i></i></div><b class="gv-center">명령 비트</b>','실제 실행에 맞는 비트 표현으로 이어져요.')}</div>`,'소스의 피해 계산 표현, 기호로 나타낸 여러 명령, CPU용 명령 비트의 표현 계층');
const concurrency=()=>picture(`<div class="gv-schedule"><b>한 코어 · 번갈아 진행하는 동시성</b><div class="gv-time-row">${['A','B','A','B'].map(x=>`<span data-job="${x}">${x}</span>`).join('')}</div><b>두 코어 · 실제로 함께 실행하는 병렬성</b><div class="gv-parallel-rows"><div>코어 1${cells(['A','A'],{active:[0,1]})}</div><div>코어 2${cells(['B','B'],{active:[0,1]})}</div></div></div>`,'한 코어의 A B A B 교대 실행과 두 코어에서 A와 B가 함께 진행하는 두 시간표');
const spatial=()=>picture(`<div class="gv-spatial-line"><b>서로 이웃한 메모리 위치</b>${table(['주소 100','주소 101','주소 102','주소 103'],[['좌표 A','좌표 B','좌표 C','좌표 D']],{row:0})}<span>주소 100을 읽을 때 주변 자료도 한 묶음으로 가져오는 모형</span></div>${flow([tag('처음 요청','100'),tag('바로 다음 요청','101',true),tag('이미 가까이 있는 자료','재사용')])}`,'주소 100부터 103의 이웃한 네 값을 한 묶음으로 가져와 다음 주소 101 접근에 활용하는 공간 지역성 모형');
const ipc=()=>picture(`<div class="gv-ipc-bars"><b>측정한 클럭: 100사이클</b>${cells(Array(10).fill('10'))}<b>그동안 확정한 명령: 200개</b>${cells(Array(10).fill('10'),{active:[0,1,2,3,4,5,6,7,8,9]})}${cells(Array(10).fill('10'),{active:[0,1,2,3,4,5,6,7,8,9]})}<div class="gv-ratio"><span><b>200개 명령</b><i>100사이클</i></span><strong>= IPC 2</strong></div></div>`,'100사이클 동안 200개 명령을 확정했으므로 명령 수를 사이클 수로 나누어 IPC 2를 얻음');
const randomAccess=()=>picture(`<div class="gv-scenes two">${scene('주소로 지정',table(['주소','값'],[['100','체력 7'],['104','골드 100'],['108','레벨 3']],{row:2}),'앞의 두 값을 차례로 읽어야 하는 구조가 아니에요.')}${scene('원하는 위치에 접근',flow([tag('읽을 주소','108'),tag('읽은 값','레벨 3',true)]),'여기서 임의는 무작위 선택이라는 뜻이 아니에요.')}</div>`,'주소 108을 지정해 앞의 값부터 순회하지 않고 레벨 3을 읽는 임의 접근');
const executable=()=>picture(flow([tag('소스 파일','게임 규칙'),tag('빌드 결과','코드·데이터·실행 정보'),`<div>${tag('운영체제의 로더','필요한 영역 준비')}${chip('프로세스 주소 공간',['코드','데이터','스택'])}</div>`]),'소스에서 만든 실행 파일을 로더가 읽고 프로세스의 실행에 필요한 메모리를 준비하는 흐름');
const deviceControl=()=>picture(flow([tag('운영체제 요청','장치에 작업 지시'),tag('드라이버','장치 규칙에 맞게 전달'),`<div class="gv-device">${tag('제어 레지스터','시작 명령 기록',true)}${tag('상태 레지스터','완료 여부 읽기')}</div>`]),'드라이버가 장치의 제어 레지스터에 명령을 쓰고 상태 레지스터를 읽어 진행을 확인하는 개념도');
const swapping=()=>picture(`<div class="gv-scenes two">${scene('RAM이 필요한 상황',chip('RAM',['A의 페이지','B의 페이지'],{active:[0,1]})+'<div class="gv-storage">저장장치 · 스왑 공간</div>','사용이 뜸한 페이지를 내보낼 수 있어요.')}${scene('내보낸 뒤',chip('RAM',['A의 페이지','비워 둔 프레임'],{active:[0]})+arrow+'<div class="gv-storage">B의 페이지</div>','다시 필요하면 저장장치에서 가져와요.')}</div>`,'RAM에 있던 프로세스 B의 페이지를 저장장치의 스왑 공간으로 내보내 프레임을 확보하는 예');
const workingSet=()=>picture(`<div class="gv-scenes two">${scene('반복 접근 패턴',cells(['A','B','C','A','B','C'],{active:[0,1,2]}),'최근에 반복해서 필요한 페이지는 A·B·C예요.')}${scene('프레임이 2개뿐이라면',chip('RAM',['A','B'])+'<div class="gv-cycle">↻</div>'+chip('다음 교체',['C','B'])+'<b class="gv-center">필요한 페이지를 계속 다시 가져옴</b>','프레임 부족은 페이지 폴트를 잦게 만들 수 있어요.')}</div>`,'세 페이지 A B C를 반복해서 쓰는데 두 프레임만 있어 계속 교체가 일어나는 메모리 압박의 예');
const segments=()=>picture(`<div class="gv-segment-parts"><div style="--size:3">코드 · 길이 3</div><div style="--size:5">데이터 · 길이 5</div><div style="--size:2">스택 · 길이 2</div></div>${table(['세그먼트','기준 주소','길이'],[['코드','100','3'],['데이터','200','5'],['스택','400','2']],{row:1})}<div class="gv-equation">(데이터, 변위 2) → 200 + 2 = 202</div>`,'코드 데이터 스택을 길이가 다른 논리 단위로 나누고 세그먼트의 기준 주소와 변위로 물리 위치를 찾는 개념도');
const route=()=>picture(`<div class="gv-route-nodes"><div>게임 클라이언트</div>${arrow}<div class="is-current">라우터 A</div>${arrow}<div>라우터 B</div>${arrow}<div>게임 서버</div></div>${table(['목적지 네트워크','다음 홉','나갈 인터페이스'],[['203.0.113.0/24','라우터 B','포트 2']],{col:1})}<div class="gv-link-label">라우터 A의 다음 홉은 B · 최종 목적지는 게임 서버</div>`,'클라이언트에서 라우터 A와 B를 거쳐 서버로 전달하는 경로와 라우터 A의 다음 홉 항목');
const roundTrip=()=>picture(`<div class="gv-trip"><b>클라이언트</b><b>서버</b><div class="gv-trip-go">요청 → <span>20ms</span></div><div class="gv-trip-back">← 응답 <span>30ms</span></div></div><div class="gv-equation">왕복 측정값 = 20 + 30 = 50ms</div>`,'클라이언트에서 서버로 가는 데 20ms, 돌아오는 데 30ms인 왕복 50ms의 예');
const expiry=id=>picture(`<div class="gv-expiry"><div class="gv-expiry-valid"><b>재사용 가능한 시간</b><span>저장 직후 · 0초</span><span>남은 시간 30초</span></div><div class="gv-expiry-end"><b>만료</b><span>60초 경과</span></div></div><div class="gv-flow">${tag(id==='net-306'?'DNS 응답의 TTL':'캐시 항목의 TTL','60초')}${arrow}${tag('만료 뒤 요청','새 정보 확인',true)}</div>`,'TTL 60초인 캐시 항목이 저장 직후부터 만료 시점까지 유효하고 이후 새 정보를 확인하는 시간선');
const http=id=>{
 if(id==='net-327')return picture(table(['요청 상황','예시 상태 코드','의미'],[['정보 조회 성공','200','성공'],['없는 아이템 주소','404','찾지 못함'],['서버 내부 오류','500','처리 중 서버 오류']],{col:1}),'HTTP 성공 200, 자원 없음 404, 서버 오류 500의 서로 다른 응답 결과');
 if(id==='net-407')return picture(`<div class="gv-resource">아이템 I7 · 같은 자원</div><div class="gv-scenes two">${scene('JSON 표현','<div class="gv-code-sample">{ &quot;id&quot;: &quot;I7&quot;,<br> &quot;name&quot;: &quot;철검&quot; }</div>','앱이 처리할 데이터예요.')}${scene('HTML 표현','<div class="gv-item-card"><span>⚔</span><b>철검</b><small>아이템 I7</small></div>','사람이 읽는 화면의 예예요.')}</div>`,'같은 아이템 I7 자원을 JSON 데이터와 HTML 화면의 서로 다른 표현으로 제공하는 예');
 return picture(`<div class="gv-scenes">${scene('1. 요청',tag('POST /purchases','아이템 I7 구매 요청')+cells(['본문: item_id=I7']),'본문에 처리할 데이터를 담을 수 있어요.')}${scene('2. 서버 처리',tag('규칙 확인','소유권·잔액 검사')+tag('주문 생성','주문 P1'),'실제 처리 의미는 API가 정해요.')}${scene('3. 응답',tag('상태 코드 예시','201 Created')+cells(['주문 P1']),'응답을 받지 못했다면 처리 여부는 불확실해요.')}</div>`,'POST로 구매를 요청하고 서버가 규칙을 검사해 주문 P1을 만든 뒤 201 응답을 보내는 한 API의 예');
};
const proxy=()=>picture(flow([tag('게임 클라이언트','요청'),tag('프록시','요청·응답 중계',true),tag('대상 서버','실제 응답 생성')])+'<div class="gv-return-arrow">응답 ← 중계를 거쳐 돌아옴</div>','클라이언트와 대상 서버 사이에서 프록시가 요청과 응답을 중계하는 경로');
const renderers={ram,processor,registers,refresh,twos,ascii,clock,cpuStates,memoryLayout,processRecord,threads,priority,allocation,compression,ports,packetSize,pathMtu,fragment,dbTable,dbms,sql,keys,join,transaction,ddl,dml,permissions,normalize,shards,cookie,versions,buffer,rates,deque,contextSwitch,scheduling,cache,clockReplacement,semaphore,condition,ui,disk,machineLayers,concurrency,spatial,ipc,randomAccess,executable,deviceControl,swapping,workingSet,segments,route,roundTrip,expiry,http,proxy};
const captions={
 randomAccess:'주소와 값은 임의의 예예요. 실제 메모리 지연은 캐시 적중 여부 등에도 영향을 받아요.',
 executable:'파일을 실행하는 전체 절차를 줄인 그림이에요. 실행 파일은 이미 실행 중인 프로세스와 달라요.',
 deviceControl:'장치별 인터페이스는 달라요. 여기서는 제어용 값과 상태 확인용 값의 역할만 구분했어요.',
 swapping:'현대 운영체제에서 페이지 단위로 내보내는 예예요. 프로세스 전체를 옮기는 방식도 스와핑이라고 불러요.',
 workingSet:'처음 읽는 페이지에서 나는 폴트도 있어요. 이 그림은 반복 접근 중에 프레임 부족으로 잦아지는 폴트를 비교해요.',
 segments:'주소와 길이의 단위는 설명용이에요. 변위가 길이 범위 안인지 검사한 뒤 기준 주소에 더해요.',
 route:'하나의 경로만 그린 예예요. 실제 라우터는 목적지 주소에 맞는 경로 항목을 선택하고 홉마다 전달해요.',
 roundTrip:'왕복 시간을 단순화한 예예요. 실제 측정은 응답 생성 시간 등을 포함할 수 있으며 두 방향의 시간이 같을 필요는 없어요.',
 expiry:'시간 기반 만료의 예예요. TTL이 남아 있어도 원본이 바뀔 수 있어요. DNS TTL과 IP의 홉 제한은 다른 개념이에요.',
 http:'예시 API의 동작이에요. POST를 재시도할 때 중복 처리가 생길 수 있으므로 API의 중복 방지 약속을 확인해야 해요.',
 proxy:'중계 위치와 역할에 따라 정방향 프록시와 역방향 프록시 등으로 나눠요. 모든 프록시가 응답을 캐시하는 것은 아니에요.',
 ram:'일반적인 RAM은 전원을 끄면 내용이 사라져요. 그림은 저장장치에 파일이 안전하게 기록된 경우예요.',
 processor:'회로 배치를 그대로 그린 사진이 아니라 역할을 나눈 개념도예요. CPU 내부 구성과 실행 방식은 제품마다 달라요.',
 registers:'주소·명령·데이터의 역할을 비교한 모형이에요. 모든 레지스터가 실제 CPU의 같은 시점에 이 값을 가진다는 뜻은 아니에요.',
 refresh:'SRAM의 Static은 비휘발성이라는 뜻이 아니에요. 일반적인 DRAM과 SRAM은 모두 전원이 필요해요.',
 twos:'8비트 폭의 예시예요. 비트열 11111011은 부호 있는 2의 보수로 −5, 부호 없이 읽으면 251이에요.',
 ascii:'문자, 문자에 부여한 번호, 저장할 바이트를 구별해요. 한 글자의 바이트 수는 인코딩에 따라 달라져요.',
 clock:'1GHz 클럭을 단순화했어요. 클럭 주기 수와 완료한 명령 수는 서로 다른 지표예요.',
 cpuStates:'화살표의 원인에 따라 상태가 바뀌어요. 입출력 완료 뒤에는 실행이 아니라 준비 상태로 돌아가 CPU 차례를 기다릴 수 있어요.',
 memoryLayout:'영역의 역할을 구별한 개념도예요. 실제 주소 순서·크기·증가 방향과 값의 저장 위치는 실행 환경에 따라 달라요.',
 processRecord:'관리 기록의 일부만 나타낸 예시예요. 프로세스의 모든 코드와 데이터를 이 기록 안에 저장한다는 뜻은 아니에요.',
 threads:'같은 프로세스의 자원을 공유하면서 각 스레드는 실행 위치와 스택을 따로 가질 수 있어요.',
 priority:'에이징으로 오래 기다린 작업의 순위를 높이는 한 가지 정책의 예시예요. 실제 선택 규칙은 시스템마다 달라요.',
 allocation:'각 칸과 막대는 할당 규칙을 이해하기 위한 모형이에요. 총 여유·연속 크기·할당 안쪽의 낭비를 나누어 봐요.',
 compression:'반복 길이로 같은 색을 표현하는 단순한 무손실 압축 예시예요. 실제 이미지 형식이 모두 이 방식으로 압축되는 것은 아니에요.',
 ports:'203.0.113.7은 문서용 예시 주소예요. 포트 번호는 실제 서비스의 설정에 따라 달라져요.',
 packetSize:'옵션이 없는 IPv4 헤더 20B와 TCP 헤더 20B를 사용한 예시예요. 실제 헤더 크기는 프로토콜과 옵션에 따라 달라져요.',
 pathMtu:'경로 중 가장 작은 한도가 중요해요. 이 그림은 IP 패킷 크기의 제한이며 앱 메시지 크기와는 구별해요.',
 fragment:'단편화가 허용되는 규칙에서의 개념도예요. IPv6는 중간 라우터가 아니라 출발지에서 단편화해요.',
 dbTable:'행 하나의 기록, 열 하나의 속성, 행의 수와 열의 수는 서로 다른 대상을 세는 말이에요.',
 dbms:'DBMS는 관리 소프트웨어이고 데이터베이스는 조직된 데이터예요. 모든 앱 규칙을 DBMS가 자동으로 아는 것은 아니에요.',
 sql:'입력 3행에서 레벨 조건에 맞는 2행을 얻는 조회 예시예요. 원본의 모든 행을 지우는 작업이 아니에요.',
 keys:'중복될 수 있는 이름 대신 키로 구별하고, 외래 키로 존재하는 행을 참조해요. 후보 키와 기본 키의 선택은 별도예요.',
 join:'내부 조인은 일치하는 짝만 남겨요. 같은 플레이어에 보유 기록이 2개면 결과에도 2행이 생겨요.',
 transaction:'DB 안에서 묶은 구매의 예시예요. 이미 보낸 외부 메시지나 결제가 롤백으로 자동 취소되지는 않아요.',
 ddl:'열을 추가하는 구조 변경과 행의 값을 바꾸는 데이터 변경을 구별해요.',
 dml:'각 단계의 조건은 해당 기록을 가리킨다고 가정했어요. UPDATE와 DELETE의 대상 범위를 먼저 확인해야 해요.',
 permissions:'무엇을 읽고 바꿀 수 있는지 권한으로 나눠요. 화면에서 버튼을 감춘 것과 DB 권한은 다른 제어예요.',
 normalize:'한 플레이어의 이름을 한곳에서 관리하고 보유 관계는 ID로 연결하는 정규화 예시예요.',
 shards:'서로 다른 데이터 부분을 나눈 예시예요. 같은 데이터를 여러 곳에 복제하는 것과 달라요.',
 cookie:'쿠키의 식별자와 서버의 로그인 상태를 나눠 봐요. HttpOnly·Secure 하나만으로 모든 공격을 막는 것은 아니에요.',
 versions:'전송 구조의 비교를 단순화했어요. 다중화가 앱의 모든 의존성과 기다림까지 없애 주는 것은 아니에요.',
 buffer:'버퍼는 순간적인 차이를 흡수하지만 지속적인 용량 부족을 해결하지는 않아요. 가득 찼을 때의 정책도 필요해요.',
 rates:'MB와 Mb를 맞춰 계산해요. 순수 전송 시간 외에 전파·대기·처리·연결 준비 시간이 남을 수 있어요.',
 deque:'앞과 뒤의 양쪽 끝에서 넣고 뺄 수 있어요. 중간 요소를 찾고 바꾸는 비용은 구현에 따라 달라요.',
 contextSwitch:'저장한 위치와 레지스터로 실행을 이어 가요. 모든 RAM이나 캐시를 초기화하는 작업은 아니에요.',
 scheduling:'전환 비용을 제외한 단순 모형이에요. RR의 시간 조각과 작업의 전체 CPU 버스트 길이는 같은 수가 아니에요.',
 cache:'LRU를 쓰는 두 칸 캐시의 모형이에요. 모든 CPU나 서비스의 캐시가 반드시 LRU를 쓰는 것은 아니에요.',
 clockReplacement:'참조 비트로 최근 사용을 근사하는 Clock의 기본 생각이에요. 실제 구현에는 여러 변형이 있어요.',
 semaphore:'이 그림은 자원 개수를 제한하는 용례예요. 공유 배열의 변경을 보호할 잠금이 별도로 필요할 수도 있어요.',
 condition:'신호를 받았다는 사실과 조건이 참이라는 사실은 달라요. 깨어난 뒤 잠금을 다시 얻고 조건을 반복 검사해요.',
 ui:'화면은 입력과 결과를 전달하는 접점이에요. 구매 가능 여부의 최종 검사는 서버의 규칙으로 확인할 수 있어요.',
 disk:'HDD의 기계적 동작을 단순화했어요. 원판이 없는 SSD와 구조를 구별하고 파일 보관 역할은 RAM과 나누어 봐요.',
 machineLayers:'소스 한 줄이 여러 명령으로 바뀔 수 있어요. 마지막 무늬는 명령 비트의 역할을 나타내며 실제 인코딩을 적은 것은 아니에요.',
 concurrency:'동시성은 진행 기간이 겹치는 성질, 병렬성은 실제 함께 실행하는 성질이에요. 이 시간표는 전환 비용을 생략한 모형이에요.',
 spatial:'주소 4칸을 묶은 학습 모형이에요. 실제 캐시 라인 크기와 메모리 접근 단위가 항상 4칸이라는 뜻은 아니에요.',
 ipc:'측정 구간의 평균이에요. 모든 사이클마다 정확히 2개씩 끝났다는 뜻은 아니고, 프로세스 간 통신 IPC와도 달라요.'
};
function sourceFigure(key){
 const [lesson,section,n='0']=key.split('/');const html=CS.lessons[lesson]?.sections.find(s=>s.id===section)?.html||'';
 return [...html.matchAll(/<figure\b[\s\S]*?<\/figure>/g)][Number(n)]?.[0]||'';
}
CS.glossaryVisualHTML=termId=>{
 const visual=CS.glossaryVisuals?.[termId];if(!visual)return '';
 const art=visual.source?sourceFigure(visual.source):renderers[visual.kind]?.(termId,visual)||'';if(!art)return '';
 const extra=termId==='arch-153'?sourceFigure('ch01-l01/b05/1'):'';
 return `<section class="glossary-visual" aria-labelledby="${e(termId)}-visual"><h4 id="${e(termId)}-visual">그림으로 이해하기</h4><p class="gv-focus">${e(visual.focus)}</p>${visual.source?`<div class="gv-course-figure">${art}</div>`:`<figure class="gv-figure">${art}<figcaption>${e(visual.caption||captions[visual.kind]||'')}</figcaption></figure>`}${extra?`<div class="gv-real-photo">${extra}</div>`:''}</section>`;
};
})();
