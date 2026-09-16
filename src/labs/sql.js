(()=>{
const {escape:e,table}=CS.helpers;
CS.helpers.executeSQL=(sql,signal)=>new Promise((resolve,reject)=>{
 if(typeof Worker==='undefined'||typeof WebAssembly==='undefined'){reject(Error('이 브라우저에서는 SQL 실습에 필요한 Worker와 WebAssembly를 사용할 수 없어요. 지원하는 브라우저에서 다시 열어 주세요.'));return;}
 if(signal?.aborted){reject(Error('실행을 취소했어요.'));return;}
 let w,url,timer;const cleanup=()=>{clearTimeout(timer);w?.terminate();if(url)URL.revokeObjectURL(url);signal?.removeEventListener('abort',cancel);};const fail=message=>{cleanup();reject(Error(message));};const cancel=()=>fail('단원을 이동해 SQL 실행을 취소했어요.');
 try{url=URL.createObjectURL(new Blob([CS_SQL_WORKER],{type:'text/javascript'}));w=new Worker(url);signal?.addEventListener('abort',cancel,{once:true});timer=setTimeout(()=>fail('실행 시간이 5초를 넘었어요. 쿼리의 범위를 줄여 다시 실행해 주세요.'),5000);w.onerror=()=>fail('SQL 실행 환경을 시작하지 못했어요. 브라우저의 Worker 지원을 확인해 주세요.');w.onmessage=event=>{const r=event.data;cleanup();if(r.ok)resolve(r);else reject(Error('SQL 오류: '+r.error));};w.postMessage({id:1,sql});}catch(error){fail(error.message);}
});
CS.helpers.sqlLab=(title,sql,intro)=>({custom:true,async:true,title,type:'실제 SQLite · 브라우저 내 실행',intro,limit:'매번 새 도서 예제 DB에서 입력한 SQL 전체를 실행해요. 수정은 이번 실행 안에서만 유지돼요. 외부 DB와 연결하지 않아요. 최대 4,000자·결과 200행·5초까지 실행해요.',
 initial(){return {sql,result:null,events:[]};},
 async action(s,a,data,context){if(a==='reset')return this.initial();if(a==='edit')return {...s,sql:data};if(a!=='run')throw Error('SQL 실행 동작을 확인해 주세요.');if(!s.sql.trim()||s.sql.length>4000)throw Error('SQL은 1~4,000자로 입력해 주세요.');const result=await CS.helpers.executeSQL(s.sql,context?.signal);return {...s,result,events:[`SQLite ${result.version}에서 실행했어요. ${result.truncated?'200행까지만 표시해요.':'결과를 아래 표에서 확인해요.'}`]};},
 describe(s){return s.events.at(-1)||'SQL을 직접 바꾸고 실행할 수 있어요.';},actions(){return [{id:'run',text:'SQL 실행',primary:true},{id:'reset',text:'예시로 초기화'}];},
 render(s){return `<label class="field">SQL 입력<textarea data-action="edit" rows="6" maxlength="4000" spellcheck="false">${e(s.sql)}</textarea></label><details class="more"><summary>예제 테이블 보기</summary><div class="more-body"><p>members(id, name): M1 민지, M2 준호</p><p>books(id, title): B1 컴퓨터 첫걸음, B2 자료구조 이야기, B3 네트워크 산책</p><p>loans(member_id, book_id): M1–B1, M1–B2, M2–B3</p></div></details>${s.result?s.result.results.map(r=>`<h4>실행 결과 · ${r.rows.length}행</h4>${table(r.columns.map(e),r.rows.map(row=>row.map(v=>v===null?'<em>NULL</em>':e(v))))}${r.rows.length?'':'<p>조건에 맞는 행이 없어요.</p>'}`).join('')||'<p>실행을 마쳤어요. 조회 결과 표를 반환하는 문장은 없었어요.</p>':'<p>아직 실행 결과가 없어요.</p>'}`;}
});
CS.labs['sql-first']=CS.helpers.sqlLab('SQL로 도서 목록을 읽어 봐요','SELECT id, title FROM books ORDER BY id;','SELECT는 가져올 열, FROM은 가져올 표, ORDER BY는 결과 순서를 지정해요. WHERE id = \'B2\'를 ORDER BY 앞에 넣으면 어떤 행이 나올까요?');
})();
