(()=>{
'use strict';
const root=CS.learning=CS.learning||{},key='cs-course:cases:v1';
const stages=['observe','hypothesize','experiment','compare','explain'];
const fresh=definition=>({caseId:definition.id,revision:definition.revision,stage:'observe',hypothesis:'',originalHypothesis:'',reason:'',activeLab:definition.labs[0],evidence:[],judgement:'',improvement:'',explanation:'',additionalCheck:'',checks:{},completed:false,updatedAt:Date.now()});
const valid=(definition,state)=>state&&state.caseId===definition.id&&state.revision===definition.revision;
const readAll=()=>{try{return JSON.parse(localStorage.getItem(key)||'{}');}catch{return {};}};
const writeAll=value=>{try{localStorage.setItem(key,JSON.stringify(value));return true;}catch{return false;}};
const load=definition=>{const state=readAll()[definition.id];return valid(definition,state)?{...fresh(definition),...state}:fresh(definition);};
const save=state=>{const all=readAll();all[state.caseId]={...state,updatedAt:Date.now()};writeAll(all);return all[state.caseId];};
const patch=(state,values)=>save({...state,...values});
const record=(state,labId,note)=>{const evidence=state.evidence.filter(item=>item.labId!==labId);evidence.push({labId,note:String(note||'').trim(),recordedAt:Date.now()});return patch(state,{evidence});};
const complete=state=>{const ready=state.explanation.trim().length>=40&&state.additionalCheck.trim().length>=20&&Object.values(state.checks).filter(Boolean).length===3;return patch(state,{completed:ready});};
root.caseModel={stages,fresh,load,save,patch,record,complete,stageIndex:stage=>Math.max(0,stages.indexOf(stage))};
})();
