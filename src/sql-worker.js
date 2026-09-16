// This worker runs one query against a fresh, local teaching database.
const engineReady=initSqlJs({wasmBinary:Uint8Array.from(atob(SQL_WASM_BASE64),c=>c.charCodeAt(0))});
self.onmessage=async event=>{
 const {id,sql}=event.data;let db,statement;
 try{
  if(typeof sql!=='string'||!sql.trim()||sql.length>4000)throw Error('SQL을 1~4000자로 입력해 주세요.');
  const SQL=await engineReady;db=new SQL.Database();
  db.run("PRAGMA foreign_keys=ON; CREATE TABLE members(id TEXT PRIMARY KEY, name TEXT NOT NULL); CREATE TABLE books(id TEXT PRIMARY KEY, title TEXT NOT NULL); CREATE TABLE loans(member_id TEXT REFERENCES members(id), book_id TEXT REFERENCES books(id), returned_at TEXT); INSERT INTO members VALUES('M1','민지'),('M2','준호'); INSERT INTO books VALUES('B1','컴퓨터 첫걸음'),('B2','자료구조 이야기'),('B3','네트워크 산책'); INSERT INTO loans(member_id,book_id,returned_at) VALUES('M1','B1',NULL),('M1','B2','2026-09-01'),('M2','B3',NULL);");
  const results=[];let rowCount=0,truncated=false;
  for(const item of db.iterateStatements(sql)){
   statement=item;const columns=statement.getColumnNames(),rows=[];
   while(statement.step()){if(rowCount>=200){truncated=true;break;}rows.push(statement.get());rowCount++;}
   if(columns.length)results.push({columns,rows});
   statement.free();statement=null;if(truncated)break;
  }
  const version=db.exec('SELECT sqlite_version()')[0].values[0][0];
  self.postMessage({id,ok:true,results,truncated,version});
 }catch(error){self.postMessage({id,ok:false,error:error.message||String(error)});}
 finally{try{statement?.free();}catch{}try{db?.close();}catch{}}
};
