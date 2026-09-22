(()=>{
 'use strict';
 const questions=[];
 Object.entries(CS.lessons).forEach(([lessonId,lesson],lessonIndex)=>{
  const authored=CS.examBank?.[lessonId];
  if(!Array.isArray(authored)||authored.length!==6)throw new Error(`${lessonId} 시험 문항은 6개여야 해요.`);
  authored.forEach((item,index)=>{
   const id=`${lessonId}-e${String(index+1).padStart(2,'0')}`,shift=(lessonIndex*2+index)%3;
   const choices=item.choices.slice(shift).concat(item.choices.slice(0,shift)),correctIndex=(3-shift)%3;
   questions.push({id,revision:3,lessonId,type:'choice',conceptTags:[item.tag||'application'],prompt:item.prompt,options:choices.map((text,optionIndex)=>({id:`${id}-o${optionIndex+1}`,text})),correctOptionId:`${id}-o${correctIndex+1}`,feedback:choices.map((_,optionIndex)=>optionIndex===correctIndex?item.why:`이 선택은 상황의 핵심 조건과 맞지 않아요. ${item.why}`),reviewTargets:[{lessonId,sectionId:lesson.sections[index]?.id||'summary'}]});
  });
 });
 CS.examQuestions=questions;
})();
