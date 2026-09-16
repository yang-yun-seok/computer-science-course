const fs=require('node:fs');
const path=require('node:path');

const sourceDir=process.argv[2];
if(!sourceDir)throw Error('Usage: node scripts/generate-glossary-index.cjs <directory-with-yaml-files>');

const subjects=[
 {id:'os',label:'운영체제',english:'Operating System',course:['ch02-l01','ch09-l01','ch10-l01','ch11-l01']},
 {id:'net',label:'네트워크',english:'Network',course:['ch06-l01','ch15-l01','ch16-l01','ch17-l01']},
 {id:'db',label:'데이터베이스',english:'Database',course:['ch03-l01','ch12-l01','ch13-l01','ch14-l01']},
 {id:'ds',label:'자료구조',english:'Data Structures',course:['ch04-l01','ch05-l01','ch07-l01','ch08-l01']},
 {id:'arch',label:'컴퓨터 구조',english:'Computer Architecture',course:['ch01-l01','ch18-l01','ch19-l01']}
];

function yamlValue(raw){
 const value=raw.trim();
 if(value.startsWith('"'))return JSON.parse(value);
 if(value.startsWith("'"))return value.slice(1,-1).replace(/''/g,"'");
 return value;
}
function yamlText(raw){
 const compact=raw.replace(/\r?\n\s*/g,' ').trim();
 try{return JSON.parse(`"${compact}"`);}catch{return compact.replace(/\\"/g,'"');}
}
function sourceItems(text){
 const records=[];
 const pattern=/^\s*- term:\s*"((?:\\.|[^"\\])*)"\s*\r?\n\s*description:\s*"((?:\\.|[^"\\])*)"/gm;
 for(const match of text.matchAll(pattern))records.push({term:yamlText(match[1]),description:yamlText(match[2])});
 return records;
}
function batchim(text){
 const tail=[...text.trim()].at(-1)||'';
 if(/[0-9]/.test(tail))return /[013678]/.test(tail);
 if(/[A-Za-z]/.test(tail))return /[LMNRlmnr]/.test(tail);
 const char=[...text].reverse().find(value=>/[가-힣]/.test(value))||tail,code=char.charCodeAt(0);
 return code>=0xac00&&code<=0xd7a3&&(code-0xac00)%28!==0;
}
function finish(fragment){
 const text=fragment.trim().replace(/[.。]+$/,''),verbs=['결정','관리','실행','처리','저장','전송','제어','할당','구성','구분','연결','표현','접근','사용','제공','보관','검사','복구','생성','삭제','변환','호출','기록','비교','반환','갱신','허용','제한','분리','병합','정렬','탐색','계산','측정','분석','분배','보호','인증','암호화','복호화','전달','수행','지원','공유','선택','판단','대기'];
 if(/(?:해요|돼요|이에요|예요|합니다|됩니다|이다|다)$/.test(text))return `${text}.`;
 if(text.endsWith('라고도 함'))return `${text.slice(0,-1)}해요.`;
 if(text.endsWith('할 수 있음'))return `${text.slice(0,-2)}있어요.`;
 if(text.endsWith('받아들임'))return `${text.slice(0,-4)}받아들여요.`;
 if(text.endsWith('내보냄'))return `${text.slice(0,-3)}내보내요.`;
 if(text.endsWith('됨'))return `${text.slice(0,-1)}돼요.`;
 if(text.endsWith('함'))return `${text.slice(0,-1)}해요.`;
 if(text.endsWith('해'))return `${text}요.`;
 if(text.endsWith('가능')||text.endsWith('화')||verbs.some(value=>text.endsWith(value)))return `${text}해요.`;
 return `${text}${batchim(text)?'이에요':'예요'}.`;
}
function friendlyMeaning(term,description){
 const fragments=description.replace(/<br\s*\/?\s*>/gi,'; ').replace(/<[^>]+>/g,' ').replace(/\s+/g,' ').replace(/통합,\s*관리/g,'통합·관리').split(/\s*;\s*/).filter(Boolean),parts=[];
 let pending='';
 for(const fragment of fragments){pending=`${pending} ${fragment}`.trim();if(/[,，]$|(?:하고|하며|하여|해서|해)$/.test(pending))continue;parts.push(pending);pending='';}
 if(pending)parts.push(pending);
 const first=finish(`${term}${batchim(term)?'은':'는'} ${parts.shift().replace(/마땅히/g,'꼭')}`);
 return [first,...parts.map(part=>finish(part))].join(' ');
}

const terms=[];
for(const subject of subjects){
 const file=path.join(sourceDir,`${subject.id}.yaml`);
 const raw=fs.readFileSync(file,'utf8').replace(/^\uFEFF/,''),records=sourceItems(raw),lines=raw.split(/\r?\n/);
 let topic='',detail='',current=null,index=0;
 for(const line of lines){
  let match=line.match(/^\s+- subtitle:\s*(.+)$/);
  if(match){topic=yamlValue(match[1]);detail='';continue;}
  match=line.match(/^\s+- subsubtitle:\s*(.+)$/);
  if(match){detail=yamlValue(match[1]);continue;}
  match=line.match(/^\s+- term:\s*(.+)$/);
  if(match){
   const term=yamlValue(match[1]),record=records[index];
   if(!record||record.term!==term)throw Error(`${subject.id}-${index+1}: description does not match ${term}`);
   current={id:`${subject.id}-${String(++index).padStart(3,'0')}`,subject:subject.id,term,english:'',topic,detail,meaning:friendlyMeaning(term,record.description),meaningSource:'csnote'};
   terms.push(current);continue;
  }
  match=line.match(/^\s+superscript:\s*(.+)$/);
  if(match&&current)current.english=yamlValue(match[1]).replace(/<br\s*\/?\s*>/gi,' · ');
 }
}

if(terms.length!==1133)throw Error(`Expected 1133 terms, found ${terms.length}`);
for(const subject of subjects){
 const actual=terms.filter(term=>term.subject===subject.id).length;
 const expected={os:220,net:483,db:85,ds:86,arch:259}[subject.id];
 if(actual!==expected)throw Error(`${subject.id}: expected ${expected}, found ${actual}`);
}

const source={
 name:'CSnote',
 site:'https://csnote.net/',
 repository:'https://github.com/kangtegong/csnote',
 note:'용어명·영문명·과목 분류와 짧은 뜻을 참고해 현재 교안의 학습 흐름에 맞는 문장으로 정리했습니다. 원본 이미지는 포함하지 않았습니다.',
 meaning:'CSnote의 짧은 설명을 초심자용 문장으로 정리했습니다.'
};
const output=`'use strict';\nCS.glossary=${JSON.stringify({source,subjects,terms},null,2)};\n`;
const outputPath=path.resolve(__dirname,'../content/glossary.js');
fs.writeFileSync(outputPath,output);
console.log(JSON.stringify({output:outputPath,terms:terms.length,subjects:subjects.map(subject=>({id:subject.id,count:terms.filter(term=>term.subject===subject.id).length}))}));
