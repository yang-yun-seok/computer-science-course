const fs=require('node:fs');const path=require('node:path');const target=path.resolve(__dirname,'../src/app.js');let text=fs.readFileSync(target,'utf8');
const from='<span>${e(field.label)}</span>${field.options?`<select id="${fieldId(field)}" name="${field.key}">';
const to='<span id="${fieldId(field)}-label">${e(field.label)}</span>${field.options?`<select id="${fieldId(field)}" name="${field.key}" aria-labelledby="${fieldId(field)}-label">';
if(!text.includes(to)){if(!text.includes(from))throw Error('Missing field markup');text=text.replace(from,to);fs.writeFileSync(target,text);}
