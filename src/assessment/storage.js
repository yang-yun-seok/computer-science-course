(()=>{
 'use strict';
 const assessment=CS.assessment;
 const ATTEMPTS='cs-course:assessment:v1',REVIEW='cs-course:review:v1',TAB='cs-course:assessment-tab',LEASE_MS=15000;
 const memory=new Map();let lastWriteOk=true;
 const safeParse=(raw,fallback)=>{try{const value=JSON.parse(raw);return value&&typeof value==='object'?value:fallback;}catch{return fallback;}};
 const read=(key,fallback)=>{try{const raw=localStorage.getItem(key);return safeParse(raw??memory.get(key),fallback);}catch{return safeParse(memory.get(key),fallback);}};
 const write=(key,value)=>{const raw=JSON.stringify(value);memory.set(key,raw);try{localStorage.setItem(key,raw);lastWriteOk=true;return true;}catch{lastWriteOk=false;return false;}};
 const tabId=(()=>{try{let id=sessionStorage.getItem(TAB);if(!id){id=`tab-${Date.now()}-${Math.random().toString(36).slice(2)}`;sessionStorage.setItem(TAB,id);}return id;}catch{return `tab-${Date.now()}`;}})();
 function state(){const value=read(ATTEMPTS,{schemaVersion:2,active:null,history:[]});if(!Array.isArray(value.history))value.history=[];if(value.ownerTab&&!value.owner)value.owner={tabId:value.ownerTab,touchedAt:0};delete value.ownerTab;value.schemaVersion=2;return value;}
 function saveState(value){return write(ATTEMPTS,value);}
 function active(){return state().active;}
 const ownerIsFresh=(value,now=Date.now())=>value.owner&&now-value.owner.touchedAt<LEASE_MS;
 function ownership(now=Date.now()){const value=state();if(!value.active||!value.owner)return 'free';if(value.owner.tabId===tabId)return 'mine';return ownerIsFresh(value,now)?'other':'stale';}
 function claim(force=false){const value=state();if(!value.active)return false;const status=ownership();if(!force&&status==='other')return false;value.owner={tabId,touchedAt:Date.now()};return saveState(value);}
 function putAttempt(attempt){const value=state();const foreign=ownerIsFresh(value)&&value.owner.tabId!==tabId;if(foreign)return false;value.active=attempt;value.owner={tabId,touchedAt:Date.now()};return saveState(value);}
 function touch(){const value=state();if(!value.active||value.owner?.tabId!==tabId)return false;value.owner.touchedAt=Date.now();return saveState(value);}
 function release(){const value=state();if(value.owner?.tabId!==tabId)return true;value.owner=null;return saveState(value);}
 function finishAttempt(attempt){const value=state();if(ownerIsFresh(value)&&value.owner.tabId!==tabId)return false;value.active=null;value.owner=null;value.history=[attempt,...value.history.filter(item=>item.id!==attempt.id)].slice(0,20);return saveState(value);}
 function history(){return state().history;}
 function reviews(){const value=read(REVIEW,{schemaVersion:1,items:[]});return Array.isArray(value.items)?value.items:[];}
 function saveReviews(items){return write(REVIEW,{schemaVersion:2,items:items.slice(0,200)});}
 function addReview(question,source,selected){const items=reviews(),revision=question.revision||1,existing=items.find(item=>item.question.id===question.id&&(item.question.revision||1)===revision);if(existing){existing.attempts=(existing.attempts||0)+1;existing.lastSelected=selected??null;existing.updatedAt=Date.now();existing.status='open';existing.source=source;}else{const legacyId=revision===1?`review-${question.id}`:`review-${question.id}-r${revision}`;items.unshift({id:legacyId,question:assessment.clone(question),source,attempts:1,lastSelected:selected??null,createdAt:Date.now(),updatedAt:Date.now(),completedAt:null,status:'open'});}return saveReviews(items);}
 function completeReview(id){return saveReviews(reviews().map(item=>item.id===id?{...item,status:'done',completedAt:Date.now(),updatedAt:Date.now()}:item));}
 function reopenReview(id){return saveReviews(reviews().map(item=>item.id===id?{...item,status:'open',completedAt:null,updatedAt:Date.now()}:item));}
 function clearAll(){memory.clear();try{localStorage.removeItem(ATTEMPTS);localStorage.removeItem(REVIEW);}catch{}}
 const owns=()=>['free','mine','stale'].includes(ownership());
 assessment.storage={tabId,leaseMs:LEASE_MS,state,active,putAttempt,finishAttempt,history,reviews,addReview,completeReview,reopenReview,clearAll,owns,ownership,claim,touch,release,healthy:()=>lastWriteOk,canWrite:()=>{try{localStorage.setItem('cs-course:storage-check','1');localStorage.removeItem('cs-course:storage-check');return true;}catch{lastWriteOk=false;return false;}}};
})();
