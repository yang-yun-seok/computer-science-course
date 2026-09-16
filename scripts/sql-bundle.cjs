const fs=require('node:fs');const path=require('node:path');
module.exports=function(root){
 const pkg=path.join(root,'node_modules/sql.js');
 return fs.readFileSync(path.join(pkg,'dist/sql-wasm-browser.js'),'utf8')+'\nconst SQL_WASM_BASE64='+JSON.stringify(fs.readFileSync(path.join(pkg,'dist/sql-wasm-browser.wasm')).toString('base64'))+';\n'+fs.readFileSync(path.join(root,'src/sql-worker.js'),'utf8');
};
