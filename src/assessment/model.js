(()=>{
 'use strict';
 const assessment=CS.assessment=CS.assessment||{};
 const clone=value=>JSON.parse(JSON.stringify(value));
 const hash=seed=>{let n=0;for(const char of String(seed)){n=(n*31+char.charCodeAt(0))>>>0;}return n||1;};
 const random=(seed)=>{let n=hash(seed);return()=>{n=(n+0x6D2B79F5)>>>0;let t=n;t=Math.imul(t^t>>>15,t|1);t^=t+Math.imul(t^t>>>7,t|61);return ((t^t>>>14)>>>0)/4294967296;};};
 const shuffle=(items,seed)=>{const result=items.slice(),next=random(seed);for(let i=result.length-1;i>0;i--){const j=Math.floor(next()*(i+1));[result[i],result[j]]=[result[j],result[i]];}return result;};
 function selectQuestions(preset,pool,seed){
  const eligible=pool.filter(q=>preset.lessonIds.includes(q.lessonId));
  if(eligible.length<preset.count)throw new Error('이 시험에 필요한 문제가 아직 준비되지 않았어요.');
  const groups=new Map();eligible.forEach(q=>{if(!groups.has(q.lessonId))groups.set(q.lessonId,[]);groups.get(q.lessonId).push(q);});
  const selected=[];const shuffledGroups=[...groups.entries()].map(([lessonId,items])=>[lessonId,shuffle(items,`${seed}:${lessonId}`)]);
  for(let i=0;selected.length<preset.count;i++){
   let added=false;for(const [,items] of shuffledGroups){if(items[i]){selected.push(items[i]);added=true;if(selected.length===preset.count)break;}}
   if(!added)break;
  }
  return shuffle(selected,`${seed}:order`);
 }
 function createAttempt(preset,pool,options={}){
  const startedAt=options.startedAt||Date.now(),seed=options.seed||`${preset.id}:${startedAt}`;
  const selected=selectQuestions(preset,pool,seed);
  const noLimit=Boolean(options.noLimit);const deadlineAt=noLimit?null:startedAt+preset.minutes*60*1000;
  return {schemaVersion:1,id:`attempt-${startedAt}-${Math.floor(Math.random()*1e6).toString(36)}`,presetId:preset.id,seed,questionIds:selected.map(q=>q.id),questions:selected.map(clone),answers:{},flags:{},currentIndex:0,startedAt,deadlineAt,noLimit,status:'in-progress',submittedAt:null,submitReason:null};
 }
 const grade=attempt=>{const items=attempt.questions.map(q=>{const answer=attempt.answers[q.id];return {id:q.id,lessonId:q.lessonId,selected:answer??null,correct:answer!=null&&answer===q.correctOptionId,unanswered:answer==null,question:q};});const correct=items.filter(i=>i.correct).length;return {items,correct,total:items.length,unanswered:items.filter(i=>i.unanswered).length,wrong:items.filter(i=>!i.correct&&!i.unanswered).length,score:items.length?Math.round(correct/items.length*1000)/10:0};};
 const isExpired=attempt=>!attempt.noLimit&&attempt.status==='in-progress'&&Number.isFinite(attempt.deadlineAt)&&Date.now()>=attempt.deadlineAt;
 function updateAnswer(attempt,id,optionId){if(attempt.status!=='in-progress')return attempt;const next=clone(attempt);if(next.questions.some(q=>q.id===id)&&next.questions.find(q=>q.id===id).options.some(o=>o.id===optionId))next.answers[id]=optionId;return next;}
 function toggleFlag(attempt,id){if(attempt.status!=='in-progress')return attempt;const next=clone(attempt);next.flags[id]=!next.flags[id];return next;}
 function move(attempt,index){if(attempt.status!=='in-progress')return attempt;const next=clone(attempt);next.currentIndex=Math.max(0,Math.min(index,next.questions.length-1));return next;}
 function submit(attempt,reason='manual'){if(attempt.status!=='in-progress')return attempt;const next=clone(attempt);next.status='submitted';next.submittedAt=Date.now();next.submitReason=reason;next.result=grade(next);return next;}
 assessment.clone=clone;assessment.shuffle=shuffle;assessment.selectQuestions=selectQuestions;assessment.createAttempt=createAttempt;assessment.grade=grade;assessment.isExpired=isExpired;assessment.updateAnswer=updateAnswer;assessment.toggleFlag=toggleFlag;assessment.move=move;assessment.submit=submit;
})();
