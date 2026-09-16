const {test}=require('node:test');
const assert=require('node:assert/strict');
const vm=require('node:vm');
const fs=require('node:fs');
const path=require('node:path');
const root=path.join(__dirname,'..');
const read=file=>fs.readFileSync(path.join(root,file),'utf8');

test('1강 student references contain no Notion links',()=>{
 const files=['content/ch01.js','content/ch01-extra.js','content/ch02.js','content/ch03.js','content/ch04.js','content/ch05.js','content/ch06.js'];
 for(const file of files){const text=read(file);assert.doesNotMatch(text,/notion\.site|원본 수업/i,file);}
 assert.doesNotMatch(read('content/출처_검토기록.md'),/notion\.site|astonishing-attic/i);
});

test('overview explains motivation, course path and learning method',()=>{
 const context=vm.createContext({});context.window=context;
 vm.runInContext(read('src/core.js'),context);
 vm.runInContext(read('content/overview.js'),context);
 const overview=context.CS.overview;
 assert.match(overview.lead,/Computer Science/);
 assert.deepEqual(Array.from(overview.title),['컴퓨터가 왜 그렇게 동작하는지','이해하는 힘']);
 assert.equal(overview.reasons.length,4);
 assert.equal(overview.path.length,4);
 assert.equal(overview.method.length,3);
 assert.match(read('src/app.js'),/href="#overview\/learning-path">전체 흐름 보기/);
});

test('public shell uses the Computer Science title and useful learning copy',()=>{
 const shell=read('src/shell.html');
 assert.match(shell,/<title>Computer Science<\/title>/);
 assert.match(shell,/>Computer Science<\/a>/);
 assert.match(shell,/원리를 보고 · 직접 실험하고 · 내 말로 설명하기/);
 assert.doesNotMatch(shell,/CS 원리 실험실|1강부터 부록까지|설치 없이 브라우저에서 학습해요/);
});

test('GitHub Pages workflow validates and publishes dist',()=>{
 const workflow=read('.github/workflows/pages.yml');
 assert.match(workflow,/npm test/);
 assert.match(workflow,/npm run build/);
 assert.match(workflow,/actions\/upload-pages-artifact@v3/);
 assert.match(workflow,/actions\/deploy-pages@v4/);
 assert.match(workflow,/enablement: true/);
 assert.match(read('scripts/build.cjs'),/\.nojekyll/);
});

test('build uses only repository-owned curriculum data',()=>{
 const build=read('scripts/build.cjs');
 assert.match(build,/content\/curriculum\.md/);
 assert.doesNotMatch(build,/\.\.\/outputs/);
 assert.match(read('content/curriculum.md'),/^# Computer Science/m);
});

test('glossary indexes every reference keyword without copying descriptions',()=>{
 const context=vm.createContext({});context.window=context;
 vm.runInContext(read('src/core.js'),context);
 vm.runInContext(read('content/glossary.js'),context);
 const glossary=context.CS.glossary;
 assert.equal(glossary.terms.length,1133);
 assert.deepEqual(Array.from(glossary.subjects,v=>[v.id,glossary.terms.filter(term=>term.subject===v.id).length]),[['os',220],['net',483],['db',85],['ds',86],['arch',259]]);
 assert.ok(glossary.terms.every(term=>term.term&&term.subject&&term.topic));
 assert.doesNotMatch(read('content/glossary.js'),/"description"\s*:/);
 assert.match(glossary.source.note,/설명과 이미지는 포함하지 않았습니다/);
 const app=read('src/app.js');
 assert.match(app,/href="#glossary"/);
 assert.match(app,/id==='glossary'\)renderGlossary/);
});
