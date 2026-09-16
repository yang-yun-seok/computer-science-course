const {test}=require('node:test');
const assert=require('node:assert/strict');
const vm=require('node:vm');
const fs=require('node:fs');
const path=require('node:path');
const ctx=vm.createContext({structuredClone});ctx.window=ctx;
for(const file of ['src/core.js','src/labs/ch08.js'])vm.runInContext(fs.readFileSync(path.join(__dirname,'..',file),'utf8'),ctx);
const labs=ctx.CS.labs;
const finish=(l,p)=>{let s=l.initial(p),guard=0;while(!s.done&&guard++<100)s=l.step(s,p);assert.ok(guard<100);return s;};

test('BST default tree has the specified three traversal orders',()=>{const l=labs['bst-traversal'];for(const [order,expected] of [['inorder',[1,2,3,4,6]],['preorder',[4,2,1,3,6]],['postorder',[1,3,2,6,4]]]){let s=l.initial();s=l.action(s,'order',order);s=l.action(s,'all');assert.deepEqual(Array.from(s.visited),expected);}});
test('BST search records found and absent comparison paths',()=>{const l=labs['bst-traversal'];let s=l.initial();s.searchInput='3';s=l.action(s,'search');assert.equal(s.found,true);assert.deepEqual(Array.from(s.searchPath),[4,2,3]);s.searchInput='5';s=l.action(s,'search');assert.equal(s.found,false);assert.deepEqual(Array.from(s.searchPath),[4,6]);});
test('BST insertion preserves ordering and handles an empty tree',()=>{const l=labs['bst-traversal'];let s=l.initial();s.newInput='5';s=l.action(s,'add');s=l.action(s,'all');assert.deepEqual(Array.from(s.visited),[1,2,3,4,5,6]);s=l.action(l.initial(),'empty');s.newInput='7';s=l.action(s,'add');assert.equal(s.root.key,7);assert.equal(s.keys.length,1);});
test('BST rejects duplicate, malformed and oversized key lists',()=>{const l=labs['bst-traversal'];assert.throws(()=>l.make('4,2,4'));assert.throws(()=>l.make('4,x'));assert.throws(()=>l.make('1,2,3,4,5,6,7,8,9,10'));let s=l.initial();s.newInput='4';assert.throws(()=>l.action(s,'add'));});
test('empty BST search and traversal terminate without invented nodes',()=>{const l=labs['bst-traversal'];let s=l.action(l.initial(),'empty');s.searchInput='1';s=l.action(s,'search');assert.equal(s.found,false);assert.deepEqual(Array.from(s.searchPath),[]);s=l.action(s,'all');assert.deepEqual(Array.from(s.visited),[]);});

test('BFS minimizes edge count and ignores weights',()=>{const l=labs['graph-paths'],p=l.validate({algorithm:'bfs',target:'C',ab:'1',bc:'1',ac:'5'}),s=finish(l,p);assert.equal(s.found,true);assert.deepEqual(Array.from(s.path),['A','C']);assert.equal(s.cost,1);});
test('Dijkstra minimizes nonnegative path cost',()=>{const l=labs['graph-paths'],p=l.validate({algorithm:'dijkstra',target:'C',ab:'1',bc:'1',ac:'5'}),s=finish(l,p);assert.equal(s.found,true);assert.deepEqual(Array.from(s.path),['A','B','C']);assert.equal(s.cost,2);});
test('both graph searches report disconnected D as unreachable',()=>{const l=labs['graph-paths'];for(const algorithm of ['bfs','dijkstra']){const p=l.validate({algorithm,target:'D',ab:'1',bc:'1',ac:'5'}),s=finish(l,p);assert.equal(s.done,true);assert.equal(s.found,false);assert.deepEqual(Array.from(s.path),[]);assert.match(l.describe(s,p),/도달할 수 없음/);}});
test('graph costs accept zero and reject negative, decimal or oversized values',()=>{const l=labs['graph-paths'];assert.equal(l.validate({algorithm:'dijkstra',target:'C',ab:'0',bc:'0',ac:'0'}).ab,0);for(const ab of ['-1','1.5','21'])assert.throws(()=>l.validate({algorithm:'dijkstra',target:'C',ab,bc:'1',ac:'5'}));});
test('CH08 lessons include four figures and three questions each',()=>{const lessonCtx=vm.createContext({CS:ctx.CS});lessonCtx.window=lessonCtx;vm.runInContext(fs.readFileSync(path.join(__dirname,'..','content/ch08.js'),'utf8'),lessonCtx);for(const id of ['ch08-l01','ch08-l02']){const lesson=lessonCtx.CS.lessons[id],html=lesson.sections.map(s=>s.html||'').join('');assert.equal((html.match(/<figure /g)||[]).length,4);assert.equal(lesson.sections.length,6);assert.equal(lesson.questions.length,3);assert.ok(lesson.sources.length>=2);}});
