import http from'node:http';import https from'node:https';import fs from'node:fs/promises';import path from'node:path';import{pathToFileURL}from'node:url';
import{openDatabase}from'./database.mjs';
export async function createLocalServer(options={}){
 const DB=openDatabase(options.database||process.env.AIMFUN_DB||'.local/aimfun.sqlite');
 const module=await import(new URL('../dist/server/index.js',import.meta.url));
 const env={DB,...Object.fromEntries(['RTC_ICE_SERVERS','TURN_URLS','TURN_SHARED_SECRET'].filter(k=>process.env[k]).map(k=>[k,process.env[k]])),...options.env};
 const cert=options.cert||process.env.AIMFUN_TLS_CERT,key=options.key||process.env.AIMFUN_TLS_KEY;
 if(!!cert!==!!key){DB.close();throw Error('Provide both AIMFUN_TLS_CERT and AIMFUN_TLS_KEY.');}
 const listener=async(req,res)=>{try{
  if(Number(req.headers['content-length']||0)>200000){res.writeHead(413);res.end('Request too large');req.resume();return;}
  const chunks=[];let size=0;for await(const chunk of req){size+=chunk.length;if(size>200000){res.writeHead(413);res.end('Request too large');return;}chunks.push(chunk);}
  const hostname=req.headers.host||'localhost';if(!/^[a-z0-9.:[\]-]+$/i.test(hostname)){res.writeHead(400);res.end('Invalid host');return;}
  const headers=new Headers();for(const[name,value]of Object.entries(req.headers))if(value)headers.set(name,Array.isArray(value)?value.join(','):value);
  // Never trust a client-supplied Cloudflare IP header on the local server.
  headers.set('CF-Connecting-IP',req.socket.remoteAddress||'local');
  const method=req.method||'GET',request=new Request((cert?'https':'http')+'://'+hostname+req.url,{method,headers,...(!['GET','HEAD'].includes(method)?{body:Buffer.concat(chunks)}:{})});
  const response=await module.default.fetch(request,env,{});res.writeHead(response.status,Object.fromEntries(response.headers));res.end(Buffer.from(await response.arrayBuffer()));
 }catch(e){console.error('Local request failed:',e.message);if(!res.headersSent)res.writeHead(500,{'Content-Type':'application/json'});res.end(JSON.stringify({error:'Local server error.'}));}};
 const server=cert?https.createServer({cert:await fs.readFile(cert),key:await fs.readFile(key)},listener):http.createServer(listener);
 server.headersTimeout=15000;server.requestTimeout=30000;
 return{server,DB,async close(){await new Promise((resolve,reject)=>{server.close(e=>e?reject(e):resolve());server.closeIdleConnections();});DB.close();}};
}
if(process.argv[1]&&import.meta.url===pathToFileURL(path.resolve(process.argv[1])).href){
 const local=await createLocalServer(),host=process.env.AIMFUN_HOST||'127.0.0.1',port=Number(process.env.PORT||8080);
 local.server.listen(port,host,()=>{console.log('Aimfun local app: '+(process.env.AIMFUN_TLS_CERT?'https':'http')+'://'+host+':'+local.server.address().port);console.log('Rooms, chat and multiplayer use persistent SQLite. LAN access needs AIMFUN_HOST=0.0.0.0; camera/PWA on phones needs trusted HTTPS.');});
 for(const signal of['SIGINT','SIGTERM'])process.once(signal,()=>local.close().then(()=>process.exit(0)));
}
