async function rtcConfiguration(env,memberId){
 if(env.TURN_URLS&&env.TURN_SHARED_SECRET){
  if(env.TURN_SHARED_SECRET.length<32)fail(503,'Use a TURN shared secret of at least 32 characters.');
  const urls=env.TURN_URLS.split(',').map(u=>u.trim()).filter(Boolean);
  if(!urls.length||urls.some(u=>!/^turns?:[^\s]+$/.test(u)))fail(503,'TURN URLs must use turn: or turns:.');
  const expiresAt=Math.floor(Date.now()/1000)+3600,username=expiresAt+':'+memberId;
  const key=await crypto.subtle.importKey('raw',new TextEncoder().encode(env.TURN_SHARED_SECRET),{name:'HMAC',hash:'SHA-1'},false,['sign']);
  const signature=await crypto.subtle.sign('HMAC',key,new TextEncoder().encode(username));
  const credential=btoa(String.fromCharCode(...new Uint8Array(signature)));
  return{iceServers:[{urls:'stun:stun.l.google.com:19302'},{urls,username,credential}],relayConfigured:true,credentialExpiresAt:expiresAt*1000};
 }
 if(env.TURN_URLS||env.TURN_SHARED_SECRET)fail(503,'Set both TURN_URLS and TURN_SHARED_SECRET to enable the call relay.');
 let iceServers=[{urls:'stun:stun.l.google.com:19302'}];if(env.RTC_ICE_SERVERS){try{iceServers=JSON.parse(env.RTC_ICE_SERVERS);if(!Array.isArray(iceServers)||!iceServers.length||iceServers.some(s=>!s||![].concat(s.urls||[]).length||[].concat(s.urls).some(u=>typeof u!=='string'||!/^stuns?:|^turns?:/.test(u))))throw Error();}catch{fail(503,'Call relay configuration is invalid.');}}
 return{iceServers,relayConfigured:iceServers.some(s=>[].concat(s.urls).some(u=>/^turns?:/.test(u)))};
}
