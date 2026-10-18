'use strict';
const $=id=>document.getElementById(id), KEY='social-club-truth-dare-v1';
let data=[], range=0, busy=false;
const fresh=()=>({players:[],turn:0,used:[],history:[],pending:null});
let state=fresh();
try{const v=JSON.parse(localStorage.getItem(KEY));if(v&&Array.isArray(v.players)&&Array.isArray(v.used)&&Array.isArray(v.history)){state=v;state.players=v.players.filter(p=>p&&typeof p.id==='string'&&typeof p.name==='string').slice(0,50);state.used=[...new Set(v.used.filter(n=>Number.isInteger(n)&&n>=1&&n<=500))];state.turn=Number.isInteger(v.turn)&&v.turn>=0?v.turn%Math.max(state.players.length,1):0;state.history=v.history.filter(h=>h&&typeof h.player==='string'&&state.used.includes(h.n));if(state.pending&&(!state.used.includes(state.pending.n)||!Number.isInteger(state.pending.n)))state.pending=null;}}catch{state=fresh();}
function save(){try{localStorage.setItem(KEY,JSON.stringify(state));}catch{$('storageWarning').hidden=false;$('storageWarning').textContent='Browser storage is unavailable. Keep this tab open to retain your game.';}}
function player(){return state.players[state.turn];}
function el(tag,cls,txt){let e=document.createElement(tag);if(cls)e.className=cls;if(txt!==undefined)e.textContent=txt;return e;}
function message(t){$('message').textContent=t;}
function render(){
 const p=player(),pending=!!state.pending;
 $('currentPlayer').textContent=p?`${p.name}, you're up.`:'The floor is yours.';
 $('turnHelp').textContent=p?'Choose a number and make it a moment.':'Add your players to get the party started.';
 $('random').disabled=!p||pending||state.used.length===500||!data.length;
 $('jumpForm').querySelector('button').disabled=!p||pending||!data.length;
 $('playerCount').textContent=state.players.length;
 $('players').replaceChildren();
 if(!state.players.length)$('players').append(el('p','empty','Your guest list is waiting. Add the first player above.'));
 state.players.forEach((p,i)=>{let row=el('div','player'+(i===state.turn?' current':''));let avatar=el('span','avatar',p.name.slice(0,2).toUpperCase());let info=el('div','player-info');info.append(el('span','player-name',p.name),el('small','',i===state.turn?'Playing now':`${state.history.filter(h=>h.playerId===p.id).length} turns played`));let remove=el('button','remove','×');remove.type='button';remove.setAttribute('aria-label','Remove '+p.name);remove.disabled=pending;remove.onclick=()=>{const current=player()?.id;state.players.splice(i,1);const k=state.players.findIndex(p=>p.id===current);state.turn=k>=0?k:Math.min(i,Math.max(0,state.players.length-1));save();render();};row.append(avatar,info,remove);$('players').append(row);});
 $('board').replaceChildren();for(let n=range*50+1;n<=range*50+50;n++){let b=el('button','number'+(n%2?' odd':''),n);b.disabled=state.used.includes(n)||pending||!p||!data.length;b.setAttribute('aria-label',`Number ${n}, ${state.used.includes(n)?'already used':n%2?'dare':'truth'}`);b.onclick=()=>pick(n);$('board').append(b);}
 $('ranges').replaceChildren();for(let r=0;r<10;r++){let b=el('button',r===range?'active':'',`${r*50+1}–${r*50+50}`);b.setAttribute('aria-pressed',r===range);b.onclick=()=>{range=r;render();};$('ranges').append(b);}
 $('rangeLabel').textContent=`NUMBERS ${range*50+1}–${range*50+50}`;$('usedCount').textContent=`${state.used.length} used · ${500-state.used.length} remaining`;$('progressBar').style.width=state.used.length/5+'%';
 $('history').replaceChildren();state.history.slice(-8).reverse().forEach(h=>{let row=el('div','history-row');row.append(el('span','',`#${h.n}`),el('b','',h.player),el('small','',`${h.n%2?'Dare':'Truth'} · ${h.result}`));$('history').append(row);});if(!state.history.length)$('history').append(el('p','empty',"The best stories haven't happened yet."));
 if(state.used.length===500&&!pending){$('turnHelp').textContent='All 500 numbers played. What a night! Start a new game to play again.';}
}
function pick(n){if(busy||state.pending||!player()||!data.length)return;if(!Number.isInteger(n)||n<1||n>500){message('Choose a number between 1 and 500.');return;}if(state.used.includes(n)){message(`#${n} has already been played. Pick a fresh number.`);return;}busy=true;state.used.push(n);state.pending={n,player:player().name,playerId:player().id};save();message('');range=Math.floor((n-1)/50);render();showPrompt();busy=false;}
function showPrompt(){if(!state.pending||!data.length)return;const q=data[state.pending.n-1];$('promptType').textContent=q.type.toUpperCase();$('promptType').parentElement.className='modal-top'+(q.n%2?' dare':'');$('promptNumber').textContent='#'+String(q.n).padStart(3,'0');$('promptPlayer').textContent=state.pending.player+"'s turn";$('promptText').textContent=q.text;if(!$('revealDialog').open)$('revealDialog').showModal();}
function finish(result){if(!state.pending)return;state.history.push({...state.pending,result});state.pending=null;state.turn=(state.turn+1)%Math.max(1,state.players.length);save();$('revealDialog').close();render();}
$('addForm').onsubmit=e=>{e.preventDefault();let name=$('playerName').value.trim().replace(/\s+/g,' ');if(!name)return;if(state.players.length>=50){message('This room supports up to 50 players.');return;}if(state.players.some(p=>p.name.toLowerCase()===name.toLowerCase())){message('That name is already on the guest list. Add a nickname.');return;}state.players.push({id:crypto.randomUUID(),name});$('playerName').value='';message('');save();render();$('playerName').focus();};
$('jumpForm').onsubmit=e=>{e.preventDefault();pick(Number($('jump').value));};
$('random').onclick=()=>{const available=data.filter(q=>!state.used.includes(q.n));if(available.length)pick(available[Math.floor(Math.random()*available.length)].n);};
$('done').onclick=()=>finish('Done');$('skip').onclick=()=>finish('Skipped');$('revealDialog').addEventListener('cancel',e=>{e.preventDefault();finish('Skipped');});
$('rulesBtn').onclick=()=>$('rulesDialog').showModal();$('closeRules').onclick=()=>$('rulesDialog').close();$('letsPlay').onclick=()=>$('rulesDialog').close();
$('reset').onclick=()=>$('resetDialog').showModal();$('cancelReset').onclick=()=>$('resetDialog').close();$('confirmReset').onclick=()=>{state={...fresh(),players:state.players};range=0;save();$('resetDialog').close();if($('revealDialog').open)$('revealDialog').close();message('');render();};
window.addEventListener('storage',e=>{if(e.key===KEY)location.reload();});
render();fetch('prompts.json').then(r=>{if(!r.ok)throw Error('fetch');return r.json();}).then(v=>{if(v.length!==500||v.some((q,i)=>q.n!==i+1||typeof q.text!=='string'))throw Error('data');data=v;render();showPrompt();}).catch(()=>{message('Could not load the prompts. Please refresh to try again.');});
