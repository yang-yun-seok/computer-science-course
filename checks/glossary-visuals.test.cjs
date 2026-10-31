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
