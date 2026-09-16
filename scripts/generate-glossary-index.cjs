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

const terms=[];
for(const subject of subjects){
 const file=path.join(sourceDir,`${subject.id}.yaml`);
 const lines=fs.readFileSync(file,'utf8').replace(/^\uFEFF/,'').split(/\r?\n/);
 let topic='',detail='',current=null,index=0;
 for(const line of lines){
  let match=line.match(/^\s+- subtitle:\s*(.+)$/);
  if(match){topic=yamlValue(match[1]);detail='';continue;}
  match=line.match(/^\s+- subsubtitle:\s*(.+)$/);
  if(match){detail=yamlValue(match[1]);continue;}
  match=line.match(/^\s+- term:\s*(.+)$/);
  if(match){
   current={id:`${subject.id}-${String(++index).padStart(3,'0')}`,subject:subject.id,term:yamlValue(match[1]),english:'',topic,detail};
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
 note:'용어명·영문명·과목 분류만 참고했습니다. 원문의 설명과 이미지는 포함하지 않았습니다.'
};
const output=`'use strict';\nCS.glossary=${JSON.stringify({source,subjects,terms},null,2)};\n`;
const outputPath=path.resolve(__dirname,'../content/glossary.js');
fs.writeFileSync(outputPath,output);
console.log(JSON.stringify({output:outputPath,terms:terms.length,subjects:subjects.map(subject=>({id:subject.id,count:terms.filter(term=>term.subject===subject.id).length}))}));
