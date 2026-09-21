(()=>{
 'use strict';
 const questions=[];
 const optionObjects=(q,prefix)=>q.options.map((text,index)=>({id:`${prefix}-o${index+1}`,text}));
 const makeBase=(lessonId,q,index)=>{const id=`${lessonId}-q${String(index+1).padStart(2,'0')}`;return {id,revision:1,lessonId,type:'choice',conceptTags:[],prompt:q.q,options:optionObjects(q,id),correctOptionId:`${id}-o${q.answer+1}`,feedback:q.options.map((_,i)=>q.feedback[i]||'선택한 답을 본문의 설명과 비교해 보세요.'),reviewTargets:[{lessonId,sectionId:q.review}]};};
 Object.entries(CS.lessons).forEach(([lessonId,lesson])=>{
  (lesson.questions||[]).forEach((q,index)=>questions.push(makeBase(lessonId,q,index)));
  const goals=lesson.goals||[];
  goals.forEach((goal,index)=>{
   const id=`${lessonId}-q${String(index+4).padStart(2,'0')}`;
   const distractors=goals.filter((_,i)=>i!==index).slice(0,2);
   const options=[goal,...distractors];
   const answer=(index+1)%3;
   const rotated=options.map((_,i)=>options[(i-answer+3)%3]);
   questions.push({id,revision:1,lessonId,type:'choice',conceptTags:['goal-check'],prompt:`${goal}를 확인하려고 해요. 다음 중 이번 단원에서 가장 직접 확인할 내용은 무엇일까요?`,options:rotated.map((text,i)=>({id:`${id}-o${i+1}`,text})),correctOptionId:`${id}-o${answer+1}`,feedback:rotated.map((text,i)=>i===answer?`맞아요. “${text}”는 이번 단원의 학습 목표예요.`:'이 단원의 다른 목표와 비교해 보고, 질문이 요구하는 내용을 골라 보세요.'),reviewTargets:[{lessonId,sectionId:'summary'}]});
  });
 });
 CS.examQuestions=questions;
})();
