const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname,'..');
const read = p=>fs.readFileSync(path.join(root,p),'utf8');
// Keep the catalog source inside the repository so local and CI builds are identical.
const curriculum=read('content/curriculum.md');
const chapters=[...curriculum.matchAll(/^## (\d+)\. (.+)$/gm)].map(m=>({id:Number(m[1]),title:m[2].trim()}));
const lessons=[...curriculum.matchAll(/^### (\d+)-(\d+)\. (.+)$/gm)].map(m=>({id:`ch${m[1].padStart(2,'0')}-l${m[2].padStart(2,'0')}`,chapter:+m[1],sub:+m[2],title:m[3].trim()}));
if(chapters.length!==24||lessons.length!==48)throw Error('Curriculum must have 24 chapters and 48 lessons');
const scripts=['src/core.js','src/lab-guides.js',...fs.readdirSync(path.join(root,'src/labs')).filter(x=>x.endsWith('.js')).sort().map(x=>'src/labs/'+x),...fs.readdirSync(path.join(root,'src/assessment')).filter(x=>x.endsWith('.js')).sort().map(x=>'src/assessment/'+x),...fs.readdirSync(path.join(root,'content')).filter(x=>x.endsWith('.js')).sort().map(x=>'content/'+x),'src/app.js'];
const sqlWorker=require('./sql-bundle.cjs')(root);
const sourceJs=`window.CATALOG=${JSON.stringify({chapters,lessons})};\nwindow.CS_SQL_WORKER=${JSON.stringify(sqlWorker)};\n`+scripts.map(read).join('\n');
const assetPattern=/\{\{asset:([a-zA-Z0-9_.-]+)\}\}/g;
const assetNames=[...sourceJs.matchAll(assetPattern)].map(match=>match[1]).filter((name,index,array)=>array.indexOf(name)===index);
const buildJs=inline=>sourceJs.replace(assetPattern,(_,name)=>{
 if(!inline)return `assets/${name}`;
 const bytes=fs.readFileSync(path.join(root,'assets',name));const mime=name.endsWith('.png')?'image/png':name.endsWith('.webp')?'image/webp':'image/jpeg';return `data:${mime};base64,${bytes.toString('base64')}`;
});
const license=read('node_modules/sql.js/LICENSE');
const htmlFor=inline=>read('src/shell.html').replace('/*COURSE_STYLE*/',()=>read('src/style.css')).replace('/*COURSE_SCRIPT*/',()=>('/* sql.js license\n'+license+'\n*/\n'+buildJs(inline)).replace(/<\/script/gi,'<\\/script'));
fs.mkdirSync(path.join(root,'dist'),{recursive:true});
const assetDir=path.join(root,'dist','assets');fs.mkdirSync(assetDir,{recursive:true});
for(const name of assetNames)fs.copyFileSync(path.join(root,'assets',name),path.join(assetDir,name));
const webHtml=htmlFor(false),singleHtml=htmlFor(true);
fs.writeFileSync(path.join(root,'dist/index.html'),webHtml);
fs.writeFileSync(path.join(root,'dist/cs-course.html'),singleHtml);
fs.writeFileSync(path.join(root,'dist/.nojekyll'),'');
console.log(JSON.stringify({webBytes:Buffer.byteLength(webHtml),singleBytes:Buffer.byteLength(singleHtml),catalog:lessons.length,sourceFiles:scripts.length,assets:assetNames.length,output:path.join(root,'dist/cs-course.html')}));
