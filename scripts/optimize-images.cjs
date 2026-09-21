const fs=require('node:fs');
const path=require('node:path');

// The repository keeps generated PNG masters and already-compressed JPEG derivatives.
// This script makes the deployable asset list reproducible without a native image dependency.
const root=path.resolve(__dirname,'..');
const source=path.join(root,'assets');
const names=fs.readdirSync(source).filter(name=>/\.jpe?g$/i.test(name)).sort();
const manifest=names.map(name=>{const stat=fs.statSync(path.join(source,name));return {name,bytes:stat.size,url:`assets/${name}`,loading:name.startsWith('foodtruck')?'eager':'lazy'};});
const output=path.join(root,'dist','assets-manifest.json');
fs.mkdirSync(path.dirname(output),{recursive:true});
fs.writeFileSync(output,JSON.stringify({version:1,generatedAt:new Date().toISOString(),assets:manifest},null,2)+'\n');
console.log(JSON.stringify({assets:manifest.length,bytes:manifest.reduce((sum,item)=>sum+item.bytes,0),output}));
