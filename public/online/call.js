export class RoomCall{
 constructor({send,config,stage,status}){Object.assign(this,{send,config,stage,status});this.peers=new Map;this.processed=new Set;this.stream=null;this.room=null;this.queue=Promise.resolve();this.epoch=0;}
 async join(video){
  if(this.stream)return;if(!navigator.mediaDevices?.getUserMedia||!window.RTCPeerConnection)throw Error('Voice/video is unavailable in this browser. Open this room in a current HTTPS browser.');
  const epoch=++this.epoch;const cfg=await this.config();const stream=await navigator.mediaDevices.getUserMedia({audio:true,video:video?{width:{ideal:480},height:{ideal:360},frameRate:{ideal:15,max:24}}:false});if(epoch!==this.epoch){stream.getTracks().forEach(t=>t.stop());return;}
  this.iceServers=cfg.iceServers;this.stream=stream;this.stage.replaceChildren();this.addVideo('self',stream,'You · muted preview',true);
  try{await this.send('call-join');this.status.textContent=cfg.relayConfigured?'Call joined. Connecting to participants…':'Direct call joined · Some networks need a relay. If it fails, use an external call.';}catch(e){this.stop();throw e;}
 }
 addVideo(id,stream,name,muted=false){const box=document.createElement('figure'),video=document.createElement('video'),caption=document.createElement('figcaption');box.dataset.peer=id;video.autoplay=true;video.playsInline=true;video.muted=muted;video.srcObject=stream;caption.textContent=name;box.append(video,caption);this.stage.append(box);video.play().catch(()=>{caption.textContent=name+' · Tap to play audio';box.onclick=()=>video.play().catch(()=>{});});return box;}
 async leave(){this.stop();try{await this.send('call-leave')}catch{}}
 stop(){this.epoch++;this.stream?.getTracks().forEach(t=>t.stop());this.stream=null;for(const p of this.peers.values()){clearTimeout(p.timer);p.pc.close();p.box?.remove();}this.peers.clear();this.processed.clear();this.stage.replaceChildren();this.status.textContent='Call ended. Camera and microphone are off.';}
 mute(){if(!this.stream)return false;const track=this.stream.getAudioTracks()[0];track.enabled=!track.enabled;return!track.enabled;}
 camera(){const t=this.stream?.getVideoTracks()[0];if(!t)return null;t.enabled=!t.enabled;return t.enabled;}
 update(room){this.room=room;if(!room){this.stop();return;}const epoch=this.epoch;this.queue=this.queue.then(()=>{if(this.epoch===epoch)return this.sync(room);}).catch(e=>{this.status.textContent='Call connection failed: '+e.message+'. Leave and rejoin, or use an external call.';});}
 async gathered(pc){if(pc.iceGatheringState==='complete')return;await new Promise(resolve=>{const done=()=>{clearTimeout(timer);pc.removeEventListener('icegatheringstatechange',check);resolve();},check=()=>{if(pc.iceGatheringState==='complete')done();},timer=setTimeout(done,8000);pc.addEventListener('icegatheringstatechange',check);});}
 peer(remote,room){
  if(this.peers.has(remote.id))return this.peers.get(remote.id);const pc=new RTCPeerConnection({iceServers:this.iceServers}),p={pc,box:null,timer:null,session:remote.session};this.peers.set(remote.id,p);this.stream.getTracks().forEach(t=>pc.addTrack(t,this.stream));
  pc.ontrack=e=>{if(p.box)return;const stream=e.streams[0]||new MediaStream([e.track]);p.box=this.addVideo(remote.id,stream,remote.name);};
  pc.onconnectionstatechange=()=>{if(pc.connectionState==='connected'){clearTimeout(p.timer);this.status.textContent='Connected · '+this.peers.size+' other call participant(s).';}if(['failed','disconnected'].includes(pc.connectionState))this.status.textContent=remote.name+' disconnected. Rejoin if needed; some networks require a TURN relay.';};
  p.timer=setTimeout(()=>{if(pc.connectionState!=='connected')this.status.textContent='Still connecting to '+remote.name+'. This network may require a TURN relay. Try an external call.';},20000);return p;
 }
 async sync(room){
  if(!this.stream)return;const members=room.callMembers||[];if(!members.some(p=>p.id===room.you)){this.stop();return;}
  for(const[id,p]of this.peers)if(!members.some(m=>m.id===id&&m.session===p.session)){clearTimeout(p.timer);p.pc.close();p.box?.remove();this.peers.delete(id);}
  for(const remote of members){if(remote.id===room.you)continue;const exists=this.peers.has(remote.id),p=this.peer(remote,room);if(!exists&&room.you<remote.id){const epoch=this.epoch;await p.pc.setLocalDescription(await p.pc.createOffer());await this.gathered(p.pc);if(!this.stream||this.epoch!==epoch)return;await this.send('signal',{to:remote.id,fromSession:members.find(p=>p.id===room.you).session,toSession:remote.session,data:{type:'offer',sdp:p.pc.localDescription.sdp}});}}
  for(const s of room.signals||[]){if(this.processed.has(s.id)||!members.some(m=>m.id===s.from&&m.session===s.fromSession)||s.toSession!==members.find(m=>m.id===room.you).session)continue;const p=this.peer(members.find(m=>m.id===s.from),room);this.processed.add(s.id);if(s.data.type==='offer'){if(p.pc.signalingState!=='stable')continue;await p.pc.setRemoteDescription(s.data);await p.pc.setLocalDescription(await p.pc.createAnswer());await this.gathered(p.pc);if(!this.stream)return;await this.send('signal',{to:s.from,fromSession:members.find(p=>p.id===room.you).session,toSession:s.fromSession,data:{type:'answer',sdp:p.pc.localDescription.sdp}});}else if(p.pc.signalingState==='have-local-offer')await p.pc.setRemoteDescription(s.data);}
 }
}
