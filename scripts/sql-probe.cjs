const fs=require('node:fs');const path=require('node:path');const root=path.resolve(__dirname,'..');
const worker=require('./sql-bundle.cjs')(root);
const code=`const source=${JSON.stringify(worker)};
const cases=[
 {name:'실제 덧셈',sql:'SELECT 3+2 AS answer',want:5},
 {name:'회원별 대출 수',sql:'SELECT member_id,COUNT(*) AS count FROM loans GROUP BY member_id ORDER BY member_id',want:[['M1',2],['M2',1]]},
 {name:'JOIN 결과',sql:'SELECT members.name,books.title FROM loans JOIN members ON loans.member_id=members.id JOIN books ON loans.book_id=books.id ORDER BY books.id',wantCount:3},
 {name:'잘못된 SQL',sql:'SELEC wrong',error:true},
 {name:'오류 다음의 새 실행',sql:'SELECT COUNT(*) FROM members',want:2}
];
const results=[];let current=0;const blobUrl=URL.createObjectURL(new Blob([source],{type:'text/javascript'}));const w=new Worker(blobUrl);let timeout;
function launch(){if(current===cases.length){document.querySelector('#status').textContent=results.every(r=>r.pass)?'모든 검증 통과':'검증 실패';document.querySelector('#output').textContent=JSON.stringify({protocol:location.protocol,results},null,2);w.terminate();URL.revokeObjectURL(blobUrl);return;}clearTimeout(timeout);timeout=setTimeout(()=>{document.querySelector('#status').textContent='실행 시간 초과';w.terminate();},5000);w.postMessage({id:current,sql:cases[current].sql});}
w.onmessage=event=>{clearTimeout(timeout);const c=cases[current],r=event.data;let pass=c.error?!r.ok:r.ok;if(pass&&!c.error){const rows=r.results[0].rows;if(c.wantCount!==undefined)pass=rows.length===c.wantCount;else pass=JSON.stringify(Array.isArray(c.want)?rows:rows[0][0])===JSON.stringify(c.want);}results.push({name:c.name,pass,...r});current++;launch();};w.onerror=event=>{clearTimeout(timeout);document.querySelector('#status').textContent='Worker 오류: '+event.message;};launch();`;
const html='<!doctype html><html lang="ko"><meta charset="utf-8"><title>SQL 오프라인 검증</title><body><h1>SQL 오프라인 검증</h1><p id="status">실행 중</p><pre id="output"></pre><script>'+code.replace(/<\/script/gi,'<\\/script')+'</script></body></html>';
fs.mkdirSync(path.join(root,'checks/generated'),{recursive:true});fs.writeFileSync(path.join(root,'checks/generated/sql-offline.html'),html);
// The same bytes are served for localhost comparison; remove the probe from final distribution.
fs.writeFileSync(path.join(root,'dist/sql-offline-probe.html'),html);
console.log(JSON.stringify({bytes:Buffer.byteLength(html),file:path.join(root,'checks/generated/sql-offline.html')}));
