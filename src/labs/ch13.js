(()=>{
const {escape:e,table}=CS.helpers;
const buildTree=keys=>{if(keys.length<=3)return {root:[],leaves:[keys.slice()]};const cut=Math.ceil(keys.length/2),leaves=[keys.slice(0,cut),keys.slice(cut)];return {root:[leaves[1][0]],leaves};};
const treeInitial=()=>({keys:[],...buildTree([]),visited:[],result:[],operation:'READY',events:[]});
const withKeys=(s,keys,message)=>{const tree=buildTree(keys),n={...structuredClone(s),keys,...tree,visited:[],result:[],operation:'INSERT'};n.events.push(message);return n;};
CS.labs['bplus-tree']={custom:true,title:'네 번째 키가 리프를 나누는 순간을 보세요',type:'리프 최대3키인 학습용 B+트리',intro:'1·2·3·4를 차례로 넣고 루트와 연결된 리프가 어떻게 생기는지 확인해요. 검색 경로와 범위 조회도 직접 실행해요.',limit:'분할 원리를 선명하게 보여 주는2단계·유일 정수키 모형이에요. 실제 DBMS의 페이지 크기·차수·동시성·로그 기록은 훨씬 복잡해요.',
 initial:treeInitial,
 action(s,a){if(a==='reset')return treeInitial();if(a==='insert-next'){const key=s.keys.length+1;if(key>4)throw Error('이 예제의 키1·2·3·4를 모두 넣었어요.');return withKeys(s,[...s.keys,key].sort((x,y)=>x-y),key===4?'키4를 넣자 리프가 [1,2]와 [3,4]로 분할되고 루트 구분키3이 생겼어요.':`키${key}를 정렬된 리프에 넣었어요.`);}if(a==='insert-all'){let n=treeInitial();for(let key=1;key<=4;key++)n=withKeys(n,[...n.keys,key],key===4?'키4 삽입 → 리프 분할·루트 구분키3 생성':'키'+key+' 삽입');return n;}if(a==='duplicate')throw Error('유일 키 오류: 키3은 이미 있거나 이 예제에 예약되어 있어 중복 삽입할 수 없어요.');if(a==='empty-search'){const n=treeInitial();n.operation='SEARCH';n.events.push('빈 트리에는 방문할 키와 결과가 없어요.');return n;}const n=structuredClone(s);if(a==='search'){n.operation='SEARCH';n.result=n.keys.includes(4)?[4]:[];n.visited=n.keys.length>3?['루트 [3]','오른쪽 리프 [3,4]']:n.keys.length?[`루트 겸 리프 [${n.keys}]`]:[];n.events.push(n.result.length?`키4를 찾았어요 · 페이지 방문 ${n.visited.length}개`:'키4를 찾지 못했어요.');return n;}if(a==='range'){n.operation='RANGE';n.result=n.keys.filter(k=>k>=2&&k<=4);n.visited=n.keys.length>3?['루트 [3]','왼쪽 리프 [1,2]','오른쪽 리프 [3,4]']:n.keys.length?[`루트 겸 리프 [${n.keys}]`]:[];n.events.push(`범위2~4 결과 [${n.result}] · 연결된 리프를 순서대로 읽었어요.`);return n;}throw Error('알 수 없는 트리 동작이에요.');},
 describe(s){return s.events.at(-1)||'빈 트리예요. 키1부터 넣어 보세요.';},
 actions(){return [{id:'insert-next',text:'다음 키 삽입',primary:true},{id:'insert-all',text:'1~4 한꺼번에'},{id:'search',text:'키4 검색'},{id:'range',text:'범위2~4'},{id:'duplicate',text:'키3 중복 삽입'},{id:'empty-search',text:'빈 트리 조회'},{id:'reset',text:'처음부터'}];},
 render(s){const root=s.keys.length<=3?`루트 겸 리프 [${s.keys.join(', ')||'비어 있음'}]`:`루트 구분키 [${s.root.join(', ')}]`;return `<div class="bplus-live"><div class="bplus-root ${s.visited[0]?.startsWith('루트')?'visited':''}"><small>ROOT</small><strong>${e(root)}</strong></div><div class="bplus-branches">${s.leaves.map((leaf,i)=>`<div class="${s.visited.some(v=>v.includes(i===0?'왼쪽':'오른쪽'))?'visited':''}"><small>LEAF ${i+1}</small><strong>[${leaf.join(', ')||'비어 있음'}]</strong>${s.leaves.length>1&&i===0?'<i>다음 리프 →</i>':''}</div>`).join('')}</div></div>${table(['확인 항목','현재'],[['전체 키',s.keys.join(', ')||'없음'],['방문 페이지',s.visited.join(' → ')||'아직 없음'],['결과',s.result.join(', ')||'없음'],['불변식','리프 정렬 · 키 보존 · 구분키=오른쪽 첫 키']])}`;}
};
const PLANS={
 scan:`EXPLAIN QUERY PLAN
SELECT * FROM books
WHERE title = '컴퓨터 첫걸음';
SELECT * FROM books
WHERE title = '컴퓨터 첫걸음';`,
 index:`CREATE INDEX idx_books_title ON books(title);
EXPLAIN QUERY PLAN
SELECT * FROM books
WHERE title = '컴퓨터 첫걸음';
SELECT * FROM books
WHERE title = '컴퓨터 첫걸음';`,
 primary:`EXPLAIN QUERY PLAN
SELECT * FROM books
WHERE id = 'B2';`,
 expression:`CREATE INDEX idx_books_title ON books(title);
EXPLAIN QUERY PLAN
SELECT * FROM books
WHERE substr(title, 1, 3) = '컴퓨터';`,
 join:`EXPLAIN QUERY PLAN
SELECT m.name, b.title
FROM loans AS l
JOIN members AS m ON m.id = l.member_id
JOIN books AS b ON b.id = l.book_id;`
};
const planInitial=()=>({sql:PLANS.scan,result:null,preset:'scan',events:[]});
CS.labs['query-plan']={custom:true,async:true,title:'같은 결과를 찾는 실행 계획을 비교하세요',type:'실제 SQLite EXPLAIN QUERY PLAN',intro:'제목 조건을 인덱스 없이 실행한 계획과 인덱스를 만든 뒤 계획을 비교해요. 기본키·함수 조건·조인 계획도 살펴볼 수 있어요.',limit:'SQLite3의 작은 교육용 DB에서 실제 계획 설명을 실행해요. 계획 문구와 선택은 엔진 버전·통계·데이터 크기에 따라 달라지며 실제 시간이나 페이지 I/O 횟수를 뜻하지 않아요.',
 initial:planInitial,
 async action(s,a,data,context){if(a==='reset')return planInitial();if(a==='edit')return {...s,sql:data};if(a.startsWith('preset-')){const preset=a.slice(7);if(!PLANS[preset])throw Error('알 수 없는 실행 계획 예시예요.');return {sql:PLANS[preset],result:null,preset,events:['계획 예시를 바꿨어요. 실행해 detail 열을 읽어 보세요.']};}if(a!=='run')throw Error('실행 계획 동작을 확인해 주세요.');if(!s.sql.trim()||s.sql.length>4000)throw Error('SQL은1~4,000자로 입력해 주세요.');const result=await CS.helpers.executeSQL(s.sql,context?.signal);return {...s,result,events:[`SQLite ${result.version} 계획 확인 완료 · 결과 표 ${result.results.length}개`]};},
 describe(s){return s.events.at(-1)||'먼저 인덱스 없는 제목 조회 계획을 실행해 보세요.';},
 actions(){return [{id:'run',text:'계획 실행',primary:true},{id:'preset-scan',text:'인덱스 없이'},{id:'preset-index',text:'제목 인덱스 생성'},{id:'preset-primary',text:'기본키 검색'},{id:'preset-expression',text:'함수 적용 조건'},{id:'preset-join',text:'3표 JOIN'},{id:'reset',text:'기본 계획'}];},
 render(s){const output=s.result?s.result.results.map(r=>{const plan=r.columns.includes('detail');return `<h4>${plan?'실행 계획':'SELECT 결과'} · ${r.rows.length}행</h4>${table(r.columns.map(e),r.rows.map(row=>row.map(v=>e(v))))}`;}).join('')||'<p>계획 결과 표가 없어요.</p>':'<p>아직 실행하지 않았어요. 실행 뒤 detail 열의 SCAN·SEARCH·USING INDEX와 SELECT 결과 행을 함께 보세요.</p>';return `<label class="field sql-editor">SQL과 EXPLAIN QUERY PLAN<textarea data-action="edit" rows="10" maxlength="4000" spellcheck="false">${e(s.sql)}</textarea></label><div class="plan-legend"><span><b>SCAN</b> 넓게 순회</span><span><b>SEARCH</b> 조건으로 위치 탐색</span><span><b>USING INDEX</b> 사용한 인덱스</span></div><div class="sql-output">${output}</div>`;}
};
})();
