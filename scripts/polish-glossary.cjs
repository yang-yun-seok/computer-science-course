const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const {polishMeaning,polishTerm}=require('./glossary-language.cjs');

const outputPath=path.resolve(__dirname,'../content/glossary.js');
const context=vm.createContext({CS:{}});
vm.runInContext(fs.readFileSync(outputPath,'utf8'),context);
const glossary=context.CS.glossary;
let changed=0;
for(const term of glossary.terms){
 const name=polishTerm(term.id,term.term),meaning=polishMeaning(term.id,name,term.meaning);
 if(name!==term.term||meaning!==term.meaning){term.term=name;term.meaning=meaning;changed++;}
}
fs.writeFileSync(outputPath,`'use strict';\nCS.glossary=${JSON.stringify(glossary,null,2)};\n`);
console.log(JSON.stringify({output:outputPath,terms:glossary.terms.length,changed}));
