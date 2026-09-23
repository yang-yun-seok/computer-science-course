(()=>{
'use strict';
const root=CS.learning=CS.learning||{},key='cs-course:cases:v1',memory={};let blocked=false;
const stages=['observe','hypothesize','experiment','compare','explain'];
const fresh=definition=>({caseId:definition.id,revision:definition.revision,stage:'observe',hypothesis:'',originalHypothesis:'',reason:'',activeLab:definition.labs[0],evidence:[],judgement:'',improvement:'',explanation:'',additionalCheck:'',checks:{},completed:false,updatedAt:Date.now()});
const valid=(definition,state)=>state&&typeof state==='object'&&state.caseId===definition.id&&state.revision===definition.revision;
const readAll=()=>{try{const value=JSON.parse(localStorage.getItem(key)||'{}');return value&&typeof value==='object'&&!Array.isArray(value)?blocked?{...value,...memory}:value:memory;}catch{blocked=true;return memory;}};
const writeAll=value=>{Object.assign(memory,value);try{localStorage.setItem(key,JSON.stringify(value));blocked=false;return true;}catch{blocked=true;return false;}};
const cleanText=value=>typeof value==='string'?value:'';
const cleanEvidence=value=>Array.isArray(value)?value.filter(item=>item&&typeof item==='object'&&typeof item.labId==='string').map(item=>({labId:item.labId,label:item.label==='A'||item.label==='B'?item.label:'',note:cleanText(item.note),summary:cleanText(item.summary),recordedAt:Number.isFinite(item.recordedAt)?item.recordedAt:0})):[];
const completeLabs=evidence=>new Set(evidence.filter(item=>item.label==='A'&&item.summary&&evidence.some(other=>other.labId===item.labId&&other.label==='B'&&other.summary)).map(item=>item.labId)).size;
const missing=state=>{
 const result=[];
 if(!state.hypothesis||!state.originalHypothesis||state.reason.trim().length<20)result.push('처음 가설과 20자 이상의 선택 이유');
 if(completeLabs(state.evidence)<2)result.push('서로 다른 두 실습의 A·B 결과');
 if(state.judgement.trim().length<30)result.push('30자 이상의 가설 판단');
 if(!state.improvement)result.push('개선안 선택');
 if(state.explanation.trim().length<40)result.push('40자 이상의 최종 설명');
 if(state.additionalCheck.trim().length<20)result.push('20자 이상의 추가 확인 방법');
 if(!['c1','c2','c3'].every(id=>state.checks[id]===true))result.push('세 가지 자기 점검');
 return result;
};
const load=definition=>{
 const stored=readAll()[definition.id],initial=fresh(definition);if(!valid(definition,stored))return initial;
 const state={...initial,...stored,stage:stages.includes(stored.stage)?stored.stage:'observe',activeLab:definition.labs.includes(stored.activeLab)?stored.activeLab:definition.labs[0],evidence:cleanEvidence(stored.evidence),checks:{c1:stored.checks?.c1===true,c2:stored.checks?.c2===true,c3:stored.checks?.c3===true}};
 for(const field of ['hypothesis','originalHypothesis','reason','judgement','improvement','explanation','additionalCheck'])state[field]=cleanText(stored[field]);
 if(!definition.hypotheses.some(item=>item.id===state.hypothesis))state.hypothesis='';
 if(!definition.hypotheses.some(item=>item.id===state.originalHypothesis))state.originalHypothesis='';
 if(!definition.improvement.includes(state.improvement))state.improvement='';
 state.evidence=state.evidence.filter(item=>definition.labs.includes(item.labId));
 state.completed=stored.completed===true&&missing(state).length===0;
 return state;
};
const save=state=>{const all=readAll();all[state.caseId]={...state,updatedAt:Date.now()};writeAll(all);return all[state.caseId];};
const patch=(state,values)=>save({...state,...values,completed:Object.keys(values).some(field=>field!=='stage'&&field!=='activeLab')?false:state.completed});
const record=(state,labId,label,note,summary)=>{
 if(!['A','B'].includes(label)||!cleanText(summary).trim())return state;
 const evidence=state.evidence.filter(item=>item.labId!==labId||item.label&&item.label!==label);
 evidence.push({labId,label,note:cleanText(note).trim(),summary:summary.trim(),recordedAt:Date.now()});
 return patch(state,{evidence});
};
const complete=state=>save({...state,completed:missing(state).length===0});
root.caseModel={stages,fresh,load,save,patch,record,complete,missing,storageBlocked:()=>blocked,stageIndex:stage=>Math.max(0,stages.indexOf(stage))};
})();
