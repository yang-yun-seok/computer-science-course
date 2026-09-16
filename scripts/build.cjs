const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname,'..');
const read = p=>fs.readFileSync(path.join(root,p),'utf8');
// Keep the catalog source inside the repository so local and CI builds are identical.
const curriculum=read('content/curriculum.md');
const chapters=[...curriculum.matchAll(/^## (\d+)\. (.+)$/gm)].map(m=>({id:Number(m[1]),title:m[2].trim()}));
const lessons=[...curriculum.matchAll(/^### (\d+)-(\d+)\. (.+)$/gm)].map(m=>({id:`ch${m[1].padStart(2,'0')}-l${m[2].padStart(2,'0')}`,chapter:+m[1],sub:+m[2],title:m[3].trim()}));
if(chapters.length!==24||lessons.length!==48)throw Error('Curriculum must have 24 chapters and 48 lessons');
const scripts=['src/core.js',...fs.readdirSync(path.join(root,'src/labs')).filter(x=>x.endsWith('.js')).sort().map(x=>'src/labs/'+x),...fs.readdirSync(path.join(root,'content')).filter(x=>x.endsWith('.js')).sort().map(x=>'content/'+x),'src/app.js'];
const sqlWorker=require('./sql-bundle.cjs')(root);
const js=(`window.CATALOG=${JSON.stringify({chapters,lessons})};\nwindow.CS_SQL_WORKER=${JSON.stringify(sqlWorker)};\n`+scripts.map(read).join('\n')).replace(/\{\{asset:([a-zA-Z0-9_.-]+)\}\}/g,(_,name)=>{const bytes=fs.readFileSync(path.join(root,'assets',name));const mime=name.endsWith('.png')?'image/png':name.endsWith('.webp')?'image/webp':'image/jpeg';return `data:${mime};base64,${bytes.toString('base64')}`;});
const license=read('node_modules/sql.js/LICENSE');
const html=read('src/shell.html').replace('/*COURSE_STYLE*/',()=>read('src/style.css')).replace('/*COURSE_SCRIPT*/',()=>('/* sql.js license\n'+license+'\n*/\n'+js).replace(/<\/script/gi,'<\\/script'));
fs.mkdirSync(path.join(root,'dist'),{recursive:true});
fs.writeFileSync(path.join(root,'dist/index.html'),html);
fs.writeFileSync(path.join(root,'dist/cs-course.html'),html);
fs.writeFileSync(path.join(root,'dist/.nojekyll'),'');
console.log(JSON.stringify({bytes:Buffer.byteLength(html),catalog:lessons.length,sourceFiles:scripts.length,output:path.join(root,'dist/cs-course.html')}));
