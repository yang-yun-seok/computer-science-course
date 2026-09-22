(()=>{
'use strict';
const root=CS.learning=CS.learning||{};
const key='cs-course:comparison-missions:v1';
const read=()=>{try{const parsed=JSON.parse(localStorage.getItem(key)||'{}');return parsed&&typeof parsed==='object'?parsed:{};}catch{return {};}};
const write=value=>{try{localStorage.setItem(key,JSON.stringify(value));return true;}catch{return false;}};
root.missionStorage={
 load(id){return read()[id]||null;},
 save(state){const all=read();all[state.missionId]=state;return write(all);},
 clear(id){const all=read();delete all[id];return write(all);}
};
})();
