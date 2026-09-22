(()=>{
'use strict';
const root=CS.learning=CS.learning||{};
root.missions={
 create(definition,saved){
  const base={missionId:definition.id,revision:definition.revision||1,runs:{A:null,B:null},checks:{},note:'',completed:false,updatedAt:0};
  if(!saved||saved.missionId!==definition.id)return base;
  return {...base,...structuredClone(saved),runs:{...base.runs,...(saved.runs||{})},checks:{...(saved.checks||{})}};
 },
 record(state,label,observation){
  return {...state,runs:{...state.runs,[label]:{...observation,recordedAt:Date.now()}},updatedAt:Date.now()};
 },
 check(state,id,value){return {...state,checks:{...state.checks,[id]:!!value},completed:false,updatedAt:Date.now()};},
 note(state,value){return {...state,note:String(value||'').slice(0,600),completed:false,updatedAt:Date.now()};},
 complete(state,definition){
  const enoughNote=state.note.trim().length>=20;
  const checked=definition.checks.every(item=>state.checks[item.id]);
  if(!state.runs.A||!state.runs.B||!enoughNote||!checked)return state;
  return {...state,completed:true,updatedAt:Date.now()};
 },
 readyToComplete(state,definition){return !!(state.runs.A&&state.runs.B&&state.note.trim().length>=20&&definition.checks.every(item=>state.checks[item.id]));}
};
})();
