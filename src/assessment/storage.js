(()=>{
 'use strict';
 const assessment=CS.assessment;
 const ATTEMPTS='cs-course:assessment:v1',REVIEW='cs-course:review:v1',TAB='cs-course:assessment-tab';
 const safeParse=(raw,fallback)=>{try{const value=JSON.parse(raw);return value&&typeof value==='object'?value:fallback;}catch{return fallback;}};
 const read=(key,fallback)=>{try{return safeParse(localStorage.getItem(key),fallback);}catch{return fallback;}};
 const write=(key,value)=>{try{localStorage.setItem(key,JSON.stringify(value));return true;}catch{return false;}};
 const tabId=(()=>{try{let id=sessionStorage.getItem(TAB);if(!id){id=`tab-${Date.now()}-${Math.random().toString(36).slice(2)}`;sessionStorage.setItem(TAB,id);}return id;}catch{return `tab-${Date.now()}`;}})();
 function state(){const value=read(ATTEMPTS,{schemaVersion:1,active:null,history:[]});if(!Array.isArray(value.history))value.history=[];return value;}
 function saveState(value){return write(ATTEMPTS,value);}
 function active(){return state().active;}
 function putAttempt(attempt){const value=state();if(value.ownerTab&&value.ownerTab!==tabId)return false;value.active=attempt;value.ownerTab=tabId;return saveState(value);}
 function finishAttempt(attempt){const value=state();value.active=null;value.ownerTab=null;value.history=[attempt,...value.history.filter(item=>item.id!==attempt.id)].slice(0,20);return saveState(value);}
 function history(){return state().history;}
 function reviews(){const value=read(REVIEW,{schemaVersion:1,items:[]});return Array.isArray(value.items)?value.items:[];}
 function saveReviews(items){return write(REVIEW,{schemaVersion:1,items:items.slice(0,200)});}
 function addReview(question,source,selected){const items=reviews(),existing=items.find(item=>item.question.id===question.id);if(existing){existing.attempts=(existing.attempts||0)+1;existing.lastSelected=selected??null;existing.updatedAt=Date.now();existing.status='open';}else items.unshift({id:`review-${question.id}`,question:assessment.clone(question),source,attempts:1,lastSelected:selected??null,createdAt:Date.now(),updatedAt:Date.now(),status:'open'});saveReviews(items);}
 function completeReview(id){saveReviews(reviews().map(item=>item.id===id?{...item,status:'done',updatedAt:Date.now()}:item));}
 function reopenReview(id){saveReviews(reviews().map(item=>item.id===id?{...item,status:'open',updatedAt:Date.now()}:item));}
 function clearAll(){try{localStorage.removeItem(ATTEMPTS);localStorage.removeItem(REVIEW);}catch{}}
 const owns=()=>{const value=state();return !value.ownerTab||value.ownerTab===tabId;};
 assessment.storage={tabId,state,active,putAttempt,finishAttempt,history,reviews,addReview,completeReview,reopenReview,clearAll,owns,canWrite:()=>{try{localStorage.setItem('cs-course:storage-check','1');localStorage.removeItem('cs-course:storage-check');return true;}catch{return false;}}};
})();
