import{validatePack}from'../online/rules.js';
const KEY='aimfun-club-v3';
export function readClub(){try{const v=JSON.parse(localStorage.getItem(KEY));if(v&&typeof v==='object')return{profiles:{},packs:[],events:[],...v}}catch{}return{profiles:{},packs:[],events:[]}}
export function writeClub(data){localStorage.setItem(KEY,JSON.stringify(data));}
export function savePack(pack,id=crypto.randomUUID()){pack=validatePack(pack);const data=readClub();data.packs=data.packs.filter(p=>p.id!==id);data.packs.push({...pack,id});writeClub(data);return id;}
export function getProfile(name){return readClub().profiles[name.toLowerCase()]||{name,favorites:[],history:[]};}
export function saveProfile(p){const d=readClub();d.profiles[p.name.toLowerCase()]=p;writeClub(d);}
export function recordRoom(r){
 if(r.phase!=='result'||r.role==='spectator'||r.result?.skipped)return;const me=r.players.find(p=>p.id===r.you);if(!me)return;
 const p=getProfile(me.name),key=r.code+':'+r.expiresAt+':'+r.round;if(p.history.some(e=>e.key===key))return;
 p.history.push({key,mode:r.mode,at:Date.now(),score:me.score,champion:!!r.tournament?.complete&&r.tournament.winners.includes(r.you)});p.history=p.history.slice(-2000);saveProfile(p);
}
export function profileStats(p){const h=p.history||[],days=[...new Set(h.map(e=>new Date(e.at).toLocaleDateString('en-CA')))].sort().reverse();let streak=0;const today=new Date();today.setHours(12,0,0,0);if(days.includes(today.toLocaleDateString('en-CA'))||days.includes(new Date(today.getTime()-86400000).toLocaleDateString('en-CA'))){let d=new Date(today);if(!days.includes(d.toLocaleDateString('en-CA')))d.setDate(d.getDate()-1);while(days.includes(d.toLocaleDateString('en-CA'))){streak++;d.setDate(d.getDate()-1);}}
 const modes=new Set(h.map(e=>e.mode));return{rounds:h.length,streak,wins:h.filter(e=>e.champion).length,badges:[...(h.length?['First round']:[]),...(h.length>=10?['Game night regular']:[]),...(h.length>=50?['Club veteran']:[]),...(modes.size>=3?['Game explorer']:[]),...(h.some(e=>e.champion)?['Tournament champion']:[]),...(streak>=3?['Three-day streak']:[])]};
}
export function rememberEvent(event){const d=readClub();d.events=d.events.filter(e=>e.code!==event.code);d.events.push(event);d.events=d.events.slice(-30);writeClub(d);}
export function downloadFile(name,text,type='application/json'){if(typeof window!=='undefined'&&window.AimfunAndroid?.postMessage){const reader=new FileReader();reader.onload=()=>window.AimfunAndroid.postMessage(JSON.stringify({type:'save',data:reader.result,filename:name}));reader.readAsDataURL(new Blob([text],{type:type.split(';')[0]}));return;}const url=URL.createObjectURL(new Blob([text],{type})),a=document.createElement('a');a.href=url;a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);}
