import assert from'node:assert/strict';import fs from'node:fs/promises';import os from'node:os';import path from'node:path';import{createLocalServer}from'../server/local.mjs';
const folder=await fs.mkdtemp(path.join(os.tmpdir(),'aimfun-local-')),database=path.join(folder,'rooms.sqlite');let app;
async function start(){app=await createLocalServer({database});await new Promise(resolve=>app.server.listen(0,'127.0.0.1',resolve));return'http://127.0.0.1:'+app.server.address().port;}
let base=await start();async function api(action,data={},client){const response=await fetch(base+'/api/rooms?code='+(data.code||client?.code||''),{method:'POST',headers:{Origin:base,'Content-Type':'application/json',...(client?{Authorization:'Bearer '+client.token}:{})},body:JSON.stringify({action,...data})});const value=await response.json();assert(response.ok,value.error);return value;}
try{
 assert.equal((await fetch(base+'/')).status,200);assert.equal((await(await fetch(base+'/api/health')).json()).storage,true);
 const a=await api('create',{name:'Local host',adult:true}),host={code:a.room.code,token:a.token},b=await api('join',{code:host.code,name:'Second phone',adult:true}),guest={code:host.code,token:b.token};
 await api('settings',{mode:'ever'},host);await api('lobby-ready',{ready:true},guest);await api('start',{},host);await Promise.all([api('answer',{value:'yes'},host),api('answer',{value:'no'},guest)]);
 const view=await(await fetch(base+'/api/rooms?code='+host.code,{headers:{Authorization:'Bearer '+host.token}})).json();assert.equal(view.phase,'result');assert.deepEqual(view.result.totals,{yes:1,no:1,pass:0});
 await app.close();app=null;base=await start();const resumed=await(await fetch(base+'/api/rooms?code='+host.code,{headers:{Authorization:'Bearer '+host.token}})).json();assert.equal(resumed.phase,'result','SQLite persists across restart');
 const bad=await fetch(base+'/api/rooms?code='+host.code,{method:'POST',headers:{Origin:'https://other.example','Content-Type':'application/json'},body:JSON.stringify({action:'chat',text:'test'})});assert.equal(bad.status,403);await api('delete-room',{},host);
 console.log('PASS: real HTTP static/API delivery, persistent SQLite, two-client concurrent answers/results, restart recovery and cross-origin rejection.');
}finally{if(app)await app.close();await fs.rm(folder,{recursive:true,force:true});}
