(()=>{
'use strict';
const normalize=value=>String(value||'').normalize('NFKC').toLocaleLowerCase('en').replace(/\s+/g,'').trim();
const escapeRegex=value=>value.replace(/[.*+?^${}()|[\]\\]/g,'\\$&');
const subjectOrder={1:['arch','os'],2:['os','arch'],3:['db'],4:['ds','arch'],5:['arch','ds'],6:['net'],7:['ds'],8:['ds'],9:['os'],10:['os','arch'],11:['os','db'],12:['db'],13:['db','ds'],14:['db','os'],15:['net'],16:['net','os'],17:['net','db'],18:['arch','os','ds'],19:['arch','os'],20:['net','db','os'],21:['net','db','os'],22:['os','ds','db'],23:['ds','os'],24:['os','net']};
const extraAliases={'arch-178':['캐시'],'arch-138':['파이프라인','명령 파이프라인','파이프라이닝'],'os-072':['스케줄링'],'os-038':['힙'],'os-040':['스택'],'db-055':['색인']};
const preferred={'tcp':'net-225','cpu스케줄링':'os-072'};
const particles=/^(?:은|는|이|가|을|를|의|에|에서|에게|와|과|도|만|로|으로|처럼|보다|까지|부터|마다|라고|라는|란|이란|이라|이라면|라면|이고|이며|이면|이므로|이지만|이다|입니다|이에요|예요|이어서|여서|일|인|이냐|인가|인지|들이|들을|들은|들과|에도|에서는|에만|으로는|로는|과는|와는|만을|만의|과의|와의|별|별로)$/;
function createIndex(terms){
 const aliases=new Map(),byId=new Map(terms.map(term=>[term.id,term]));
 const add=(alias,term)=>{
  alias=String(alias||'').trim();const key=normalize(alias);
  if(!key||key.length<2&&!['큐','힙','셸','락'].includes(key))return;
  if(/^[a-z]{1,2}$/.test(alias))return;
  const list=aliases.get(key)||[];if(!list.some(item=>item.term.id===term.id))list.push({term,alias});aliases.set(key,list);
 };
 for(const term of terms){
  const base=term.term.replace(/\s*\([^)]*\)/g,'').trim();
  for(const alias of [term.term,base,...String(term.english||'').split(';'),...(extraAliases[term.id]||[])]){
   add(alias,term);if(alias.includes('스레드'))add(alias.replaceAll('스레드','쓰레드'),term);
  }
  for(const match of term.term.matchAll(/\(([A-Z][A-Z0-9+.-]{1,})\)/g))add(match[1],term);
 }
 const spellings=[...aliases.values()].flatMap(items=>items.map(item=>item.alias));
 const patterns=[...new Set(spellings)].sort((a,b)=>normalize(b).length-normalize(a).length||b.length-a.length).map(alias=>escapeRegex(alias).replace(/\s+/g,'\\s*'));
 const pattern=patterns.length?new RegExp(patterns.join('|'),'giu'):null;
 function resolve(alias,lessonId=''){
  const candidates=aliases.get(normalize(alias));if(!candidates)return null;
  const chapter=Number(lessonId.match(/^ch(\d+)/)?.[1]),key=normalize(alias),order=subjectOrder[chapter]||[],rank=t=>{const n=order.indexOf(t.subject);return n<0?99:n;};
  // These short names also occur in analogies or unrelated domains. Do not silently attach the wrong definition.
  if(['데이터','블록'].includes(key)||key==='모니터'&&chapter!==11||key==='주소'&&![6,15,16,17,20,21].includes(chapter)||key==='페이지'&&chapter!==10)return null;
  if(key==='캐시')return byId.get([1,4,5,10,18,19].includes(chapter)?'arch-178':'net-391')||null;
  return [...candidates].sort((a,b)=>rank(a.term)-rank(b.term)||(a.term.id===preferred[normalize(alias)]?-1:b.term.id===preferred[normalize(alias)]?1:0)||Number(!a.term.english)-Number(!b.term.english)||a.term.id.localeCompare(b.term.id))[0].term;
 }
 function find(text,lessonId=''){
  if(!pattern)return [];pattern.lastIndex=0;const found=[];
  for(const match of text.matchAll(pattern)){
   const start=match.index,end=start+match[0].length,before=text[start-1]||'',after=text.slice(end),next=after[0]||'';
   if(/[\p{L}\p{N}_]/u.test(before))continue;
   if(/[A-Za-z0-9_]/.test(next))continue;
   if(/[가-힣]/.test(next)&&!particles.test(after.match(/^[가-힣]+/)?.[0]||''))continue;
   const term=resolve(match[0],lessonId);if(term)found.push({start,end,text:match[0],term});
  }
  return found;
 }
 return {byId,resolve,find};
}
function validOrigin(value,lessons){
 const path=String(value||'');return /^ch\d{2}-l\d{2}(?:\/(?:b\d{2}|summary|questions))?(?:\?[^#]*)?$/.test(path)&&Boolean(lessons[path.split(/[/?]/)[0]])?path:'';
}
let cached;
function getIndex(){return cached||(cached=createIndex(CS.glossary?.terms||[]));}
function mount(root,lessonId){
 if(!CS.glossary)return ()=>{};
 const index=getIndex(),life=new AbortController(),signal=life.signal;
 // Match prose text nodes only: interactive labs, source links, code and quizzes keep their own behavior.
 const scopes=root.querySelectorAll('.lesson-lead,.learning-goals,.lesson>.section:not(#questions)');
 let serial=0;
 for(const scope of scopes){
  const seen=new Set(),walker=document.createTreeWalker(scope,NodeFilter.SHOW_TEXT,{acceptNode(node){const parent=node.parentElement;return parent&&!parent.closest('a,button,code,pre,textarea,select,svg,canvas,figcaption,.lab,.quiz,.sources,.section-head,summary,h1,h2,h3,h4')&&parent.closest('p,li,td,th,dd,dt,strong')?NodeFilter.FILTER_ACCEPT:NodeFilter.FILTER_REJECT;}}),nodes=[];
  while(walker.nextNode())nodes.push(walker.currentNode);
  for(const node of nodes){
   const matches=index.find(node.nodeValue,lessonId).filter(match=>{if(seen.has(match.term.id)||seen.size>=12)return false;seen.add(match.term.id);return true;});if(!matches.length)continue;
   const fragment=document.createDocumentFragment();let at=0;
   for(const match of matches){
    fragment.append(node.nodeValue.slice(at,match.start));const button=document.createElement('button');button.type='button';button.className='term-trigger';button.dataset.termId=match.term.id;button.id=`term-${lessonId}-${++serial}`;button.textContent=match.text;button.setAttribute('aria-label',`${match.text} 뜻 보기`);button.setAttribute('aria-haspopup','dialog');button.setAttribute('aria-expanded','false');fragment.append(button);at=match.end;
   }
   fragment.append(node.nodeValue.slice(at));node.replaceWith(fragment);
  }
 }
 if(serial){const hint=document.createElement('p');hint.className='term-help';hint.textContent='점선 밑줄이 있는 용어에 마우스를 올리거나 눌러 뜻을 확인해 보세요.';root.querySelector('.lesson-lead')?.after(hint);}
 const popup=document.createElement('aside');popup.className='term-popover';popup.hidden=true;popup.id='course-term-popover';popup.setAttribute('role','dialog');popup.setAttribute('aria-labelledby','course-term-name');document.body.append(popup);
 let trigger=null,pinned=false,timer=null,suppressFocus=false;
 function close(restore=false){clearTimeout(timer);const old=trigger;trigger?.setAttribute('aria-expanded','false');trigger?.removeAttribute('aria-describedby');popup.hidden=true;trigger=null;pinned=false;if(restore){suppressFocus=true;old?.focus({preventScroll:true});suppressFocus=false;}}
 function position(){if(!trigger)return;const r=trigger.getBoundingClientRect(),viewport=document.documentElement.clientWidth,width=Math.min(370,viewport-24);popup.style.width=`${width}px`;popup.style.maxHeight=`${window.innerHeight-24}px`;const height=popup.offsetHeight;popup.style.left=`${Math.max(12,Math.min(r.left,viewport-width-12))}px`;popup.style.top=`${Math.max(12,r.bottom+height+10<window.innerHeight?r.bottom+10:r.top-height-10)}px`;}
 function show(button,pin=false){
  clearTimeout(timer);if(trigger===button&&!popup.hidden){pinned=pinned||pin;return;}
  close();trigger=button;pinned=pin;const term=index.byId.get(button.dataset.termId);if(!term)return;
  const subject=CS.glossary.subjects.find(item=>item.id===term.subject),params=new URLSearchParams(location.hash.split('?')[1]||'');
  for(const key of [...params.keys()])if(!['return','caseReturn'].includes(key))params.delete(key);params.set('term',term.id);
  const section=button.closest('.section')?.id,from=`${lessonId}${section?'/'+section:''}?${params}`;
  popup.innerHTML=`<button type="button" class="term-popover-close" aria-label="용어 설명 닫기">×</button><small>${CS.helpers.escape(subject?.label||'용어')}</small><strong id="course-term-name">${CS.helpers.escape(term.term)}</strong>${term.english?`<span class="term-popover-english">${CS.helpers.escape(term.english)}</span>`:''}<p id="course-term-meaning">${CS.helpers.escape(term.meaning)}</p><a href="#glossary/${term.id}?from=${encodeURIComponent(from)}">용어 정리에서 자세히 보기 →</a>`;
  popup.hidden=false;button.setAttribute('aria-expanded','true');button.setAttribute('aria-controls',popup.id);button.setAttribute('aria-describedby','course-term-meaning');position();
 }
 const delayClose=()=>{if(!pinned){clearTimeout(timer);timer=setTimeout(()=>{if(!popup.contains(document.activeElement)&&document.activeElement!==trigger)close();},220);}};
 root.addEventListener('pointerover',event=>{const button=event.target.closest('.term-trigger');if(button&&event.pointerType!=='touch')show(button);},{signal});
 root.addEventListener('pointerout',event=>{if(event.target.closest('.term-trigger')&&!event.relatedTarget?.closest?.('.term-trigger')&&!popup.contains(event.relatedTarget))delayClose();},{signal});
 root.addEventListener('focusin',event=>{const button=event.target.closest('.term-trigger');if(button&&!suppressFocus)show(button);},{signal});
 root.addEventListener('click',event=>{const button=event.target.closest('.term-trigger');if(!button)return;if(trigger===button&&pinned)close();else{show(button,true);if(event.detail===0)popup.querySelector('button').focus({preventScroll:true});}},{signal});
 root.addEventListener('keydown',event=>{const button=event.target.closest('.term-trigger');if(button&&event.key==='ArrowDown'){event.preventDefault();show(button,true);popup.querySelector('button').focus({preventScroll:true});}},{signal});
 popup.addEventListener('pointerenter',()=>clearTimeout(timer),{signal});popup.addEventListener('pointerleave',delayClose,{signal});
 popup.addEventListener('click',event=>{if(event.target.closest('.term-popover-close'))close(true);},{signal});
 popup.addEventListener('keydown',event=>{if(event.key!=='Tab')return;const items=[...popup.querySelectorAll('button,a')];if(event.shiftKey&&document.activeElement===items[0]){event.preventDefault();close(true);}else if(!event.shiftKey&&document.activeElement===items.at(-1)){const focusables=[...document.querySelectorAll('a[href],button,input,select,textarea,[tabindex="0"]')].filter(el=>!popup.contains(el)&&!el.disabled&&el.getClientRects().length);const next=focusables[focusables.indexOf(trigger)+1];if(next){event.preventDefault();close();next.focus();}}},{signal});
 document.addEventListener('focusin',event=>{if(trigger&&!popup.contains(event.target)&&event.target!==trigger)close();},{signal});
 document.addEventListener('pointerdown',event=>{if(trigger&&!popup.contains(event.target)&&!event.target.closest('.term-trigger'))close();},{signal});
 document.addEventListener('keydown',event=>{if(event.key==='Escape'&&!popup.hidden){event.preventDefault();close(popup.contains(document.activeElement));}},{signal});
 window.addEventListener('resize',()=>close(),{signal});window.addEventListener('scroll',event=>{if(!popup.contains(event.target))close();},{signal,capture:true});
 return ()=>{life.abort();clearTimeout(timer);popup.remove();};
}
CS.glossaryLinks={createIndex,getIndex,validOrigin,mount};
})();
