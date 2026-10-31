const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const root=path.join(__dirname,'..'),c=vm.createContext({});c.window=c;
for(const file of ['src/core.js',...fs.readdirSync(path.join(root,'content')).filter(f=>/^ch\d+.*\.js$/.test(f)).map(f=>'content/'+f)])vm.runInContext(fs.readFileSync(path.join(root,file),'utf8'),c,{filename:file});
const plain=s=>s.replace(/<[^>]*>/g,' ').replace(/&gt;/g,'>').replace(/&lt;/g,'<').replace(/\s+/g,' ').trim();
function figure(key){const [id,section,n='0']=key.split('/');return [...c.CS.lessons[id].sections.find(s=>s.id===section).html.matchAll(/<figure\b[\s\S]*?<\/figure>/g)][+n][0];}
const tables=html=>[...html.matchAll(/<table\b[\s\S]*?<\/table>/g)].map(m=>[...m[0].matchAll(/<tr>[\s\S]*?<\/tr>/g)].map(r=>[...r[0].matchAll(/<t[dh]\b[^>]*>([\s\S]*?)<\/t[dh]>/g)].map(x=>plain(x[1]))));
const cellRows=html=>[...html.matchAll(/class="ld-cells"[^>]*>([\s\S]*?)<\/div>/g)].map(m=>[...m[1].matchAll(/<b>(.*?)<\/b>/g)].map(x=>plain(x[1])));
const records=rows=>rows.slice(1).map(row=>Object.fromEntries(rows[0].map((key,i)=>[key,row[i]])));

test('the audit ledger covers every figure and all fifteen standalone flows without duplicate keys',()=>{
 const ledger=fs.readFileSync(path.join(root,'docs/교안그림_문맥검수.csv'),'utf8').trim().split(/\r?\n/).slice(1).map(line=>line.split(',')[0]);
 const keys=[];for(const [id,l]of Object.entries(c.CS.lessons))for(const s of l.sections){
  const figures=[...s.html.matchAll(/<figure\b[\s\S]*?<\/figure>/g)];figures.forEach((_,i)=>keys.push(`${id}/${s.id}/${i}`));
  const prose=s.html.replace(/<figure\b[\s\S]*?<\/figure>/g,'');[...prose.matchAll(/<div class="flow-row\b[^>]*>/g)].forEach((_,i)=>keys.push(`${id}/${s.id}/flow-${i}`));
 }
 assert.equal(keys.length,203);assert.equal(new Set(ledger).size,203);assert.deepEqual(ledger.sort(),keys.sort());
});

test('all 48 lessons retain labelled figures, real-photo attribution and distinct analogy labels',()=>{
 let count=0,images=0;
 for(const lesson of Object.values(c.CS.lessons))for(const section of lesson.sections)for(const m of section.html.matchAll(/<figure\b[\s\S]*?<\/figure>/g)){
  const f=m[0];count++;assert.match(f,/<figcaption>/);assert.match(f,/aria-label=|alt=/);
  assert.doesNotMatch(f,/undefined|TODO|준비 중/);
  if(f.includes('<img')){images++;if(/ps1-.*photo|ethernet-switch-photo/.test(f))assert.match(f,/Wikimedia Commons/);else assert.match(f,/비유 그림/);}
 }
 assert.equal(Object.keys(c.CS.lessons).length,48);assert.equal(count,188);assert.equal(images,20);
 assert.match(figure('ch03-l02/b02'),/transaction-all-or-nothing/);
});

test('bit weights and contiguous free space agree with the illustrated arithmetic',()=>{
 const bits=cellRows(figure('ch04-l01/b01'))[0].join('');assert.equal(parseInt(bits,2),138);
 const [memory,request]=cellRows(figure('ch01-l02/b06'));assert.equal(memory.length,8);
 const free=memory.filter(x=>x==='빈칸').length;let longest=0,run=0;
 for(const value of memory){run=value==='빈칸'?run+1:0;longest=Math.max(longest,run);}
 assert.equal(free,6);assert.equal(longest,3);assert.equal(request.length,4);assert.ok(free>=request.length&&longest<request.length);
 assert.match(figure('ch01-l02/b01'),/준비 작업 두 개/);
});

test('array growth conserves existing values and hash collisions use the actual modulo',()=>{
 const growth=cellRows(figure('ch04-l02/b03'));assert.deepEqual(growth.map(r=>r.length),[4,8,8]);
 assert.deepEqual(growth[1].filter(x=>x!=='·'),growth[0]);assert.deepEqual(growth[2].filter(x=>x!=='·'),[...growth[0],'E']);
 for(const [key,sum,bucket]of tables(figure('ch04-l02/b05'))[0].slice(1)){assert.equal(key.codePointAt(0),+sum);assert.equal(+sum%4,+bucket);}
});

test('binary search compares exactly the displayed midpoints and candidate intervals',()=>{
 const expected=[];let lo=1,hi=16;
 while(lo<=hi){const mid=Math.floor((lo+hi)/2);expected.push([lo===hi?String(lo):lo+'~'+hi,String(mid)]);if(mid===16)break;lo=mid+1;}
 const actual=tables(figure('ch05-l02/b04'))[0].slice(1).map(r=>r.slice(1,3));assert.deepEqual(actual,expected);assert.equal(actual.length,5);
});

test('coin DP stores the actual minimum count for every displayed amount',()=>{
 const [head,row]=tables(figure('ch07-l02/b05'))[0],dp=[0];
 for(let amount=1;amount<=6;amount++)dp[amount]=Math.min(...[1,3,4].filter(coin=>coin<=amount).map(coin=>1+dp[amount-coin]));
 assert.deepEqual(head.slice(1).map(Number),[0,1,2,3,4,5,6]);assert.deepEqual(row.slice(1).map(Number),dp);assert.equal(dp[6],2);
 assert.match(figure('ch07-l02/b03'),/4 \+ 1 \+ 1 = 6/);assert.match(figure('ch07-l02/b03'),/3 \+ 3 = 6/);
});

function trees(html){return [...html.matchAll(/<svg\b[\s\S]*?<\/svg>/g)].map(m=>{
 const nodes=[...m[0].matchAll(/data-key="([^"]+)"><circle cx="(\d+)" cy="(\d+)"/g)].map(x=>({key:x[1],x:+x[2],y:+x[3],children:[]}));
 const at=(x,y)=>nodes.find(n=>n.x===+x&&n.y===+y);
 for(const edge of m[0].matchAll(/<line x1="(\d+)" y1="(\d+)" x2="(\d+)" y2="(\d+)"/g)){at(edge[1],edge[2]).children.push(at(edge[3],edge[4]));}
 return {nodes,root:nodes.find(n=>!nodes.some(parent=>parent.children.includes(n)))};
});}
test('balanced and skewed BSTs contain identical keys and their stated search heights',()=>{
 const ts=trees(figure('ch08-l01/b04'));assert.equal(ts.length,2);
 const height=n=>n.children.length?1+Math.max(...n.children.map(height)):0;
 const inorder=n=>{const left=n.children.find(x=>+x.key<+n.key),right=n.children.find(x=>+x.key>+n.key);return [...(left?inorder(left):[]),+n.key,...(right?inorder(right):[])];};
 assert.deepEqual(ts.map(t=>height(t.root)),[2,4]);for(const t of ts)assert.deepEqual(inorder(t.root),[1,2,3,4,5]);
 const search=t=>{let n=t.root,count=0;while(n){count++;if(+n.key===5)return count;n=n.children.find(x=>(+x.key>+n.key)===(5>+n.key));}return 0;};assert.deepEqual(ts.map(search),[3,5]);
});

test('heap insertion preserves five values and repairs parent ordering without claiming a sorted array',()=>{
 const ts=trees(figure('ch08-l01/b05'));assert.equal(ts.length,3);
 const arrays=ts.map(t=>t.nodes.map(n=>+n.key));assert.deepEqual(arrays,[[3,5,7,9,2],[3,2,7,9,5],[2,3,7,9,5]]);
 for(const row of arrays)assert.deepEqual([...row].sort((a,b)=>a-b),[2,3,5,7,9]);
 for(const node of ts[2].nodes)for(const child of node.children)assert.ok(+node.key<=+child.key);
 assert.notDeepEqual(arrays[2],[2,3,5,7,9]);
});

test('BFS and DFS visit orders are derived from the lesson graph itself',()=>{
 const f=figure('ch08-l02/b03'),{nodes}=trees(f)[0],graph=new Map(nodes.map(n=>[n.key,[]]));
 for(const node of nodes)for(const next of node.children){graph.get(node.key).push(next.key);graph.get(next.key).push(node.key);}for(const list of graph.values())list.sort();
 const bfs=[],q=['A'],seen=new Set(q);while(q.length){const n=q.shift();bfs.push(n);for(const next of graph.get(n))if(!seen.has(next)){seen.add(next);q.push(next);}}
 const dfs=[],visit=n=>{if(dfs.includes(n))return;dfs.push(n);for(const next of graph.get(n))visit(next);};visit('A');
 assert.ok(f.includes(bfs.join(' → ')));assert.ok(f.includes(dfs.join(' → ')));assert.equal(new Set(dfs).size,6);
});

test('the lost-update timeline actually reads both old values before either write',()=>{
 const rows=tables(figure('ch11-l01/b02'))[0].slice(1);let shared=100;const local={};
 for(const row of rows){for(const [i,who]of [[1,'A'],[2,'B']]){if(row[i].includes('읽기'))local[who]=shared;else if(row[i].includes('계산'))local[who]++;else if(row[i].includes('쓰기'))shared=local[who];}assert.equal(shared,+row[3]);}
 assert.equal(shared,101);assert.equal(rows.length,6);
 const cas=plain(figure('ch11-l01/b04'));assert.match(cas,/현재값 102/);assert.match(cas,/102 유지/);
});

test('normalization is lossless for every source loan row, including the second book',()=>{
 const [source,member,book,loan]=tables(figure('ch12-l01/b05'));const members=records(member),books=records(book);
 const restored=records(loan).map(l=>[l.member_id,members.find(m=>m.id===l.member_id).name,l.book_id,books.find(b=>b.id===l.book_id).title]);
 assert.deepEqual(restored,source.slice(1));assert.equal(restored.length,2);
});

test('INNER and LEFT JOIN results conserve all illustrated matching pairs and the unmatched left row',()=>{
 const [members,loans,inner,extra]=tables(figure('ch12-l02/b02'));const joined=[],unmatched=[];
 for(const m of records(members)){const matches=records(loans).filter(l=>l.member_id===m.id);if(matches.length)for(const l of matches)joined.push([m.id,m.name,l.book_id]);else unmatched.push([m.id,m.name,'NULL']);}
 assert.deepEqual(inner.slice(1),joined);assert.deepEqual(extra.slice(1),unmatched);assert.equal(joined.length+unmatched.length,4);
});

test('FIFO and LRU diagrams replace the correct fixed frame after the same reference sequence',()=>{
 function run(lru){const frames=[],age=[];for(const page of [1,2,3,1,4]){if(!frames.includes(page)){if(frames.length===3){const victim=age.shift();frames[frames.indexOf(victim)]=page;}else frames.push(page);age.push(page);}else if(lru){age.splice(age.indexOf(page),1);age.push(page);}}return frames.map(String);}
 const [before,fifo,lru]=cellRows(figure('ch10-l01/b05'));assert.deepEqual(before,['1','2','3']);assert.deepEqual(fifo,run(false));assert.deepEqual(lru,run(true));
});

test('pipeline columns represent the same cycle and Amdahl values use one stated scale',()=>{
 const [header,...commands]=tables(figure('ch19-l01/b02'))[0];assert.equal(header.length-1,7);
 commands.forEach((row,i)=>assert.deepEqual(row.slice(1),[...Array(i).fill('—'),'IF','ID','EX','MEM','WB',...Array(2-i).fill('—')]));
 for(const row of tables(figure('ch19-l02/b05'))[0].slice(1)){const p=parseFloat(row[0])/100;[1,2,4,8].forEach((n,i)=>assert.ok(Math.abs(parseFloat(row[i+1])-1/((1-p)+p/n))<=.005));assert.ok(Math.abs(parseFloat(row[5])-1/(1-p))<1e-9);}
});
