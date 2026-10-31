const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const root=path.join(__dirname,'..'),read=file=>fs.readFileSync(path.join(root,file),'utf8');
const c=vm.createContext({});c.window=c;
for(const file of ['src/core.js','src/glossary-links.js','src/glossary-details.js','content/glossary.js'])vm.runInContext(read(file),c);
const shortMeanings=JSON.stringify(c.CS.glossary.terms);
for(const file of fs.readdirSync(path.join(root,'content')).filter(name=>/^glossary-details-.*\.js$/.test(name)))vm.runInContext(read('content/'+file),c);
const targets=JSON.parse(read('checks/fixtures/glossary-detail-terms.json'));

test('all 290 audited popup terms have their own beginner explanation and example',()=>{
 assert.equal(targets.length,290);
 assert.deepEqual(Object.keys(c.CS.glossaryDetails).sort(),targets);
 const byId=new Map(c.CS.glossary.terms.map(term=>[term.id,term])),seen=new Set();
 for(const id of targets){
  const d=c.CS.glossaryDetails[id];assert.ok(byId.has(id),id);
  assert.equal(d.explain.length,2,id);
  for(const text of [...d.explain,d.example,d.confusion]){
   assert.equal(typeof text,'string',id);assert.ok(text.length>=30,id);
   assert.doesNotMatch(text,/<[^>]+>|TODO|준비 중|설명을 추가/,id);
  }
  const text=[...d.explain,d.example,d.confusion].join('');
  assert.ok(text.length>byId.get(id).meaning.length,id);
  assert.ok(!seen.has(text),id+' duplicated article');seen.add(text);
 }
});

test('adding long explanations leaves the original hover definitions intact',()=>{
 assert.equal(JSON.stringify(c.CS.glossary.terms),shortMeanings);
 const cpu=c.CS.glossaryLinks.getIndex().resolve('CPU','ch01-l01');
 assert.equal(cpu.meaning,c.CS.glossary.terms.find(term=>term.id==='arch-004').meaning);
 assert.ok(!cpu.meaning.includes(c.CS.glossaryDetails['arch-004'].example));
 assert.ok(!read('src/glossary-links.js').includes('glossaryDetails'));
});

test('direct term links open the explanation and retain the full lesson return path',()=>{
 c.CS.lessons['ch01-l01']={};
 const from='ch01-l01/b03?return=review-7&term=arch-004';
 const html=c.CS.glossaryDetailHTML('arch-004',{open:true,from});
 assert.match(html,/<details class="glossary-deep" open>/);
 assert.match(html,/조금 더 풀어 보면/);assert.match(html,/게임 속 예시/);assert.match(html,/여기서 헷갈리기 쉬워요/);
 assert.ok(html.includes('href="#ch01-l01/b03?return=review-7&amp;term=arch-004"'));
 assert.doesNotMatch(c.CS.glossaryDetailHTML('arch-004'),/<details[^>]+ open/);
 assert.equal(c.CS.glossaryDetailHTML('os-001'),'');
 assert.equal(c.CS.glossaryDetailHTML('missing'),'');
 assert.doesNotMatch(c.CS.glossaryDetailHTML('arch-004',{from:'https://example.com'}),/glossary-back-to-text/);
});

test('explanation prose is escaped before rendering',()=>{
 c.CS.glossaryDetails.example={explain:['<script>alert(1)</script>','A & B'],example:'"quoted"',confusion:'<img src=x>'};
 const html=c.CS.glossaryDetailHTML('example');
 assert.doesNotMatch(html,/<script>|<img /);assert.match(html,/&lt;script&gt;/);assert.match(html,/A &amp; B/);
 delete c.CS.glossaryDetails.example;
});

test('worked examples preserve the important differences between easily confused terms',()=>{
 const d=c.CS.glossaryDetails;
 assert.match(d['arch-026'].example,/11111011/);assert.match(d['arch-026'].confusion,/251/);
 assert.match(d['arch-260'].explain.join(' '),/중간 표현/);assert.match(d['arch-260'].confusion,/명령어 레지스터/);
 assert.match(d['arch-261'].example,/100사이클.*200개.*2/);assert.match(d['arch-261'].confusion,/프로세스 간 통신/);
 assert.match(d['ds-086'].explain.join(' '),/0 이상/);assert.match(d['ds-086'].example,/총비용 2/);
 assert.match(d['net-237'].example,/100.*3바이트.*103/);
 assert.match(d['net-234'].confusion,/아이템 지급/);
 assert.match(d['net-485'].confusion,/홉 제한/);
 assert.match(d['net-487'].confusion,/sessionStorage/);
 assert.match(d['os-144'].confusion,/모든 TLB 미스.*페이지 폴트/);
});
