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

test('glossary indexes every reference keyword with a readable meaning',()=>{
 const context=vm.createContext({});context.window=context;
 vm.runInContext(read('src/core.js'),context);
 vm.runInContext(read('content/glossary.js'),context);
 const glossary=context.CS.glossary;
 assert.equal(glossary.terms.length,1133);
 assert.deepEqual(Array.from(glossary.subjects,v=>[v.id,glossary.terms.filter(term=>term.subject===v.id).length]),[['os',220],['net',483],['db',85],['ds',86],['arch',259]]);
 assert.ok(glossary.terms.every(term=>term.term&&term.subject&&term.topic&&term.meaning.length>=8));
 assert.ok(glossary.terms.every(term=>!/<[^>]+>/.test(term.meaning)));
 const meanings=glossary.terms.map(term=>term.meaning).join('\n');
 assert.doesNotMatch(meanings,/(?:있음|없음|않음|부름|불림|나타냄|가리킴|가짐|받음|보냄|일어남|구성되었음)이에요/);
 assert.doesNotMatch(meanings,/[을를] 의미예요|메세지|주고 받을|페이지 가|각각이에요|부름\)이에요|부르며예요|존재예요|생김이에요|하면이에요|되고예요|역할 수행해요|기능 지원해요|무시로 대처/);
 assert.ok(glossary.terms.some(term=>term.term==='태스크'));
 assert.ok(glossary.terms.every(term=>term.term!=='테스크'));
 assert.match(glossary.source.note,/짧은 뜻/);
 const app=read('src/app.js');
 assert.match(app,/href="#glossary"/);
 assert.match(app,/id==='glossary'\)renderGlossary/);
 assert.match(app,/glossary-term-meaning/);
 assert.match(app,/term\.meaning/);
});

test('lesson topics have breathing room and figures explain their learning focus',()=>{
 const app=read('src/app.js'),style=read('src/style.css');
 assert.match(app,/주제 \$\{String\(i\+1\)/);
 assert.match(app,/앞의 설명을 그림에서 확인해요/);
 assert.match(app,/enhanceFigures\(main\)/);
 assert.match(style,/\.lesson>\.section\{[^}]*padding:58px 0 76px/);
 assert.match(style,/\.image-figure\{display:grid/);
 let figures=0,captions=0;
 for(const file of fs.readdirSync(path.join(root,'content')).filter(name=>/^ch\d+.*\.js$/.test(name))){const text=read(`content/${file}`);figures+=(text.match(/<figure class="teaching-figure/g)||[]).length;captions+=(text.match(/<figcaption>/g)||[]).length;}
 assert.equal(figures,185);
 assert.equal(captions,figures);
});

test('Korean prose wraps by eojeol and complete thoughts',()=>{
 const style=read('src/style.css');
 assert.match(style,/:root\{[^}]*line-break:strict;word-break:keep-all;overflow-wrap:break-word/);
 assert.match(style,/h1,h2,h3,h4,[^{]+\{[^}]*text-wrap:balance/);
 assert.match(style,/p,li,dt,dd,th,td,legend,figcaption,[^{]+\{[^}]*word-break:keep-all;overflow-wrap:break-word;text-wrap:pretty/);
 assert.match(style,/code,pre,[^{]+\{[^}]*overflow-wrap:anywhere/);
});

test('assessment navigation connects exams, results and review notes',()=>{
 const app=read('src/app.js'),style=read('src/style.css');
 assert.match(app,/href="#exams"/);
 assert.match(app,/href="#review"/);
 assert.match(app,/exam\/setup/);
 assert.match(app,/exam\/run/);
 assert.match(app,/exam\/result/);
 assert.match(app,/data-review-check/);
 assert.match(app,/storage\.addReview/);
 assert.match(app,/storage\.completeReview/);
 assert.match(style,/\.assessment-page/);
 assert.match(style,/\.exam-option/);
});
