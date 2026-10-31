const {test}=require('node:test');
const assert=require('node:assert/strict');
const vm=require('node:vm');
const fs=require('node:fs');
const path=require('node:path');
const read=file=>fs.readFileSync(path.join(__dirname,'..',file),'utf8');
const c=vm.createContext({});c.window=c;
for(const file of ['src/core.js','src/glossary-links.js','content/glossary.js'])vm.runInContext(read(file),c);
const links=c.CS.glossaryLinks,index=links.getIndex();
test('lesson context distinguishes CPU cache from HTTP cache and thread meanings',()=>{
 assert.equal(index.resolve('캐시','ch01-l01').id,'arch-178');
 assert.equal(index.resolve('캐시','ch16-l02').id,'net-391');
 assert.equal(index.resolve('쓰레드','ch02-l02').id,'os-057');
 assert.equal(index.resolve('스레드','ch19-l02').subject,'arch');
 assert.equal(index.resolve('CPU','ch01-l01').id,'arch-004');
 assert.equal(index.resolve('TCP','ch15-l02').id,'net-225');
 assert.equal(index.resolve('힙','ch02-l01').id,'os-038');
 assert.equal(index.resolve('힙','ch08-l01').id,'ds-065');
 assert.equal(index.resolve('모니터','ch01-l01'),null);
 assert.equal(index.resolve('모니터','ch11-l01').id,'os-108');
 assert.equal(index.resolve('주소','ch01-l01'),null);
 assert.equal(index.resolve('데이터','ch01-l01'),null);
 assert.equal(index.resolve('블록','ch01-l01'),null);
});
test('long terms and Korean particles match without linking fragments of other words',()=>{
 const found=index.find('가상메모리는 DRAM과 SRAM을 써요. CPU는 프로세스마다 공유해요. 풀스택과 무큐는 다른 말이에요.','ch10-l01');
 assert.deepEqual(Array.from(found,x=>x.text),['가상메모리','DRAM','SRAM','CPU','프로세스']);
 assert.equal(found[0].term.id,'os-134');
 assert.equal(index.find('myCPU CPUID SRAMbuffer 프로세스명','ch01-l01').length,0);
});
test('regex punctuation in terminology is literal and an empty index stays empty',()=>{
 const custom=links.createIndex([{id:'test',subject:'ds',term:'C++',english:'',meaning:'언어'}]);
 assert.equal(custom.find('C++와 C--')[0].text,'C++');
 assert.equal(links.createIndex([]).find('CPU').length,0);
});
test('only existing lesson hashes are accepted as glossary return destinations',()=>{
 const lessons={'ch01-l01':{}};
 assert.equal(links.validOrigin('ch01-l01/b03?term=arch-004',lessons),'ch01-l01/b03?term=arch-004');
 assert.equal(links.validOrigin('ch01-l01/b03?return=review-1&term=arch-004',lessons),'ch01-l01/b03?return=review-1&term=arch-004');
 for(const origin of ['https://example.com','javascript:alert(1)','ch99-l01','ch01-l01/unknown','ch01-l01#other'])assert.equal(links.validOrigin(origin,lessons),'');
});
test('the existing glossary can connect technical prose in all 48 lessons',()=>{
 for(const file of fs.readdirSync(path.join(__dirname,'..','content')).filter(f=>/^ch\d\d(?:-extra)?\.js$/.test(f)))vm.runInContext(read('content/'+file),c);
 assert.equal(Object.keys(c.CS.lessons).length,48);
 for(const [id,lesson] of Object.entries(c.CS.lessons)){
  const prose=lesson.sections.map(section=>(section.html||'').replace(/<[^>]*>/g,' ')).join(' ');
  assert.ok(index.find(prose,id).length>0,id);
 }
});
