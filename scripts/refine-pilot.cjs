const fs=require('node:fs');const path=require('node:path');const root=path.resolve(__dirname,'..');
const change=(file,from,to)=>{const target=path.join(root,file);const text=fs.readFileSync(target,'utf8');if(text.includes(to))return;if(!text.includes(from))throw Error('Missing edit target in '+file);fs.writeFileSync(target,text.replace(from,to));};
change('content/ch01.js',"'수령 창구 · 출력'])}","'수령 창구 · 출력'],'·')}");
change('src/labs/ch01.js','</div><div class="step-strip">','</div><p class="cpu-transfer">${[\'아직 이동하지 않았어요.\',\'사용자 입력 → 계산 요청\',\'입력한 자료 → RAM · 명령 준비\',\'RAM의 두 수 → CPU의 덧셈\',\'CPU의 계산값 → RAM의 결과 칸\',\'RAM의 결과 → 화면 출력\'][s.step]}</p><div class="step-strip">');
