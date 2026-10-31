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

test('real lesson passages select the intended meaning of overloaded abbreviations',()=>{
 const cases=[
  ['ch02-l01','Data / BSS · 정적 데이터','BSS','os-034'],
  ['ch02-l02','주소 공간의 Code·Data·Heap','Heap','os-038'],
  ['ch02-l01','Stack · 스택함수 호출의 복귀 위치','Stack','os-040'],
  ['ch14-l02','IP·TCP·라우팅은 각각 무엇을 보장할까요?','IP','net-136'],
  ['ch18-l01','소스 언어를 분석해 중간 표현(IR)으로 바꾸고','IR','arch-260'],
  ['ch01-l01','IR(명령어 레지스터)은 가져온 명령을 담는','IR','arch-093'],
  ['ch19-l01','IPC사이클당 완료 또는 확정 명령 수','IPC','arch-261'],
  ['ch02-l02','파이프·소켓·공유 메모리 등 IPC 사용','IPC','os-063'],
  ['ch06-l02','POST대상 자원이 정한 처리를 요청','POST','net-332'],
  ['ch01-l02','Clock은 참조 비트를 살펴보고','Clock','os-222'],
  ['ch15-l01','레코드의 TTL은 캐시가 그 답을 얼마나 오래','TTL','net-306'],
  ['ch18-l02','LRU·TTL·용량 제한과 적중률 측정','TTL','net-485'],
  ['ch15-l01','패킷이 한 홉을 지날 때 TTL이 감소해요.','TTL','net-144']
 ];
 for(const [lesson,passage,word,id] of cases)assert.equal(index.resolve(word,lesson,passage)?.id,id,`${lesson}: ${passage}`);
});

test('domain vocabulary follows the data structure, browser, database or network context',()=>{
 const cases=[
  ['ch11-l01','버퍼 배열과 인덱스 변경','인덱스','ds-009'],
  ['ch13-l01','해시 인덱스는 해시 함수를 거쳐','인덱스','db-055'],
  ['ch10-l01','페이지는 가상 주소 공간의 고정 크기 조각','페이지','os-221'],
  ['ch10-l02','메모리의 페이지 캐시·버퍼에 먼저 둘 수 있어요.','페이지 캐시','os-223'],
  ['ch18-l02','무제한 캐시를 보존해요.','캐시','net-391'],
  ['ch19-l02','각 코어가 자기 캐시에 같은 메모리 블록의 복사본','캐시','arch-178'],
  ['ch06-l02','브라우저는 도메인·경로·보안 속성 등 조건에','도메인','net-288'],
  ['ch03-l01','도메인은 속성에 허용하는 값의 범위','도메인','db-013'],
  ['ch06-l02','레코드 종류와 시점에 따라 여러 결과','레코드','net-317'],
  ['ch03-l01','행은 레코드·튜플','레코드','db-016'],
  ['ch08-l01','트리는 정점인 노드와 연결인 간선으로','노드','ds-087'],
  ['ch08-l01','트리는 정점인 노드와 연결인 간선으로','간선','ds-088'],
  ['ch03-l01','표의 열 수는 차수','차수','db-086'],
  ['ch08-l02','진입 차수 0인 정점이 있음','차수','ds-089'],
  ['ch16-l01','현재 태스크 뒤 마이크로태스크를 처리','태스크','arch-263'],
  ['ch18-l01','이름·스코프·타입을 검사한 뒤','타입','arch-262'],
  ['ch21-l02','타임아웃은 영원히 기다리지 않게 하지만','타임아웃','net-484'],
  ['ch16-l02','버전메시지·다중화 구조전송 기반','다중화','net-486'],
  ['ch16-l02','쿠키·서버 세션·토큰은 저장 위치가 달라요.','세션','net-487'],
  ['ch04-l01','압축은 반복이나 사람이 덜 민감한 정보를 이용','압축','arch-264'],
  ['ch05-l02','전송 시간은 10×8÷10 = 8초예요.','전송 시간','net-489']
 ];
 for(const [lesson,passage,word,id] of cases)assert.equal(index.find(passage,lesson).find(x=>x.text===word)?.term.id,id,`${lesson}: ${passage}`);
});

test('ordinary prose does not acquire an unrelated specialized definition',()=>{
 const cases=[
  ['ch11-l01','wait/post 연산','post'],
  ['ch02-l02','Fork/Join은 큰 일을 작은 일로 나눠요.','Fork'],
  ['ch02-l02','Fork/Join은 큰 일을 작은 일로 나눠요.','Join'],
  ['ch01-l02','기다림에 따라 순위를 높이는 에이징','높이'],
  ['ch19-l01','명령 가져오기(IF)','IF'],
  ['ch04-l01','아래 스위치는 표시만 바꾸는 그림이 아니라','스위치'],
  ['ch04-l01','MP4 같은 컨테이너','컨테이너'],
  ['ch13-l01',"category='CS'AND date≥05",'date'],
  ['ch17-l02','HTML·속성·URL·JavaScript 등 문맥에 맞게','문맥'],
  ['ch16-l02','sessionStorage는 출처와 탭의 페이지 세션 단위','세션'],
  ['ch16-l02','탭 세션','세션'],
  ['ch02-l02','쓰레드별 저장소(TLS)','TLS'],
  ['ch22-l02','표현 계층은 사용자 입력과 출력을','표현 계층'],
  ['ch22-l01','추상화·캡슐화·인터페이스','캡슐화'],
  ['ch22-l01','인터페이스·포트교체 가능한 외부 구현','포트'],
  ['ch20-l01','캐시 일관성, 최종 일관성','일관성'],
  ['ch24-l01','커밋에서 만든 이미지나 패키지','커밋'],
  ['ch24-l01','카나리 배포와 롤백','롤백'],
  ['ch20-l02','commit index 안으로 들어오고','index'],
  ['ch20-l01','지연·데이터 위험이 달라요.','데이터 위험'],
  ['ch22-l01','변환·검증·계산 파이프라인','파이프라인'],
  ['ch11-l02','교착 상태는 작업 집합이 서로가 일으킬 사건을','작업 집합']
  ,['ch04-l02','추상 자료형으로 볼 수 있어요.','자료형']
  ,['ch21-l01','인기 키에 접미사·버킷을 두어 쓰기 분산','버킷']
 ];
 for(const [lesson,passage,word] of cases)assert.ok(!index.find(passage,lesson).some(x=>x.text===word),`${lesson}: ${passage}`);
 for(const word of ['상태','자원','서비스','경로','식별자','플래그','중단','충돌','버전'])assert.equal(index.resolve(word,'ch24-l01'),null,word);
});
