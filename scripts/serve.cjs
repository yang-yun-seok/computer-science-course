const http=require('node:http');
const fs=require('node:fs');
const path=require('node:path');
const root=path.resolve(__dirname,'../dist');
const server=http.createServer((req,res)=>{
  let requested;
  try{requested=decodeURIComponent(new URL(req.url,'http://localhost').pathname);}catch{res.writeHead(400);return res.end('Bad request');}
  if(requested==='/')requested='/index.html';
  const target=path.resolve(root,'.'+requested);
  if(!target.startsWith(root+path.sep)){res.writeHead(403);return res.end('Forbidden');}
  fs.readFile(target,(err,data)=>{if(err){res.writeHead(404);res.end('Not found');return;}
    const types={'.html':'text/html; charset=utf-8','.jpg':'image/jpeg','.jpeg':'image/jpeg','.png':'image/png','.webp':'image/webp','.svg':'image/svg+xml','.js':'text/javascript; charset=utf-8'};res.writeHead(200,{'Content-Type':types[path.extname(target).toLowerCase()]||'application/octet-stream','Cache-Control':'no-store'});res.end(data);});
});
server.listen(4173,'127.0.0.1',()=>console.log('Computer Science preview: http://127.0.0.1:4173'));
