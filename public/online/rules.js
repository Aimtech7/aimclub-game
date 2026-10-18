export const MODE_NAMES={friends:'Friends Truth or Dare',spicy:'Spicy Couples 18+',quick:'Quick Pick',ever:'Have You Ever',undercover:'Undercover',custom:'Your custom pack'};
export const TOPICS={romance:'Romance & attraction',touch:'Touch & affection',personal:'Personal disclosures',performance:'Acting & performance',alcohol:'Alcohol',social:'Messages & social media'};
export const LEVELS={friendly:'Friendly',challenging:'Challenging',romantic:'Romantic',spicy:'Spicy'};
export function promptMeta(q,mode){
 const text=q.text.toLowerCase(),tags=new Set(q.tags||[]);
 if(/kiss|cuddl|touch|massage|hand on|hold hands|affection|blindfold|danc.*clos/.test(text))tags.add('touch');
 if(mode==='spicy'||q.pack==='couples'||q.pack==='spicy'||/romantic|date night|attract|crush|flirt|partner|turn-on|desire|intima|sexy|seduct|kiss/.test(text))tags.add('romance');
 if(q.type==='Truth'||/secret|embarrass|regret|confess|honest|pretend|lie|lied/.test(text))tags.add('personal');
 if(q.type==='Dare'||/perform|dance|sing|acting|scene/.test(text))tags.add('performance');
 if(/alcohol|drunk|drink|beer|wine|hangover/.test(text))tags.add('alcohol');
 if(/message|social media|post|screenshot|phone|public profile/.test(text))tags.add('social');
 let level=q.level||((mode==='spicy'||q.pack==='spicy')?'spicy':tags.has('romance')?'romantic':tags.has('personal')||tags.has('performance')?'challenging':'friendly');
 return{...q,tags:[...tags],level};
}
export function allowedPrompt(q,settings={}){const levels=Object.keys(LEVELS);return levels.indexOf(q.level)<=levels.indexOf(settings.intensity||'spicy')&&!(settings.excluded||[]).some(t=>q.tags.includes(t));}
export function validatePack(pack){
 if(!pack||typeof pack.name!=='string'||!pack.name.trim()||pack.name.length>60)throw Error('Give your pack a name, up to 60 characters.');
 if(!Array.isArray(pack.prompts)||pack.prompts.length<2||pack.prompts.length>100)throw Error('A pack needs 2–100 prompts.');
 const prompts=pack.prompts.map(q=>{if(!q||typeof q.text!=='string'||!q.text.trim()||q.text.length>400)throw Error('Each prompt needs 1–400 characters.');if(!['Truth','Dare','Question'].includes(q.type))throw Error('Choose Truth, Dare or Question.');if(!Object.hasOwn(LEVELS,q.level))throw Error('Choose a prompt intensity.');if(!Array.isArray(q.tags)||q.tags.some(t=>!Object.hasOwn(TOPICS,t)))throw Error('Choose valid topic labels.');return{text:q.text.trim(),type:q.type,level:q.level,tags:[...new Set(q.tags)]}});
 if(new Set(prompts.map(q=>q.text.toLowerCase())).size!==prompts.length)throw Error('Remove repeated prompts from your pack.');return{name:pack.name.trim(),prompts};
}
export function calendarEvent({title,start,code,origin}){
 const date=new Date(start);if(!Number.isFinite(date.getTime()))throw Error('Choose a valid date.');
 const stamp=d=>d.toISOString().replace(/[-:]/g,'').replace(/\.\d{3}Z/,'Z'),esc=s=>String(s).replace(/\\/g,'\\\\').replace(/\r?\n/g,'\\n').replace(/,/g,'\\,').replace(/;/g,'\\;');
 return['BEGIN:VCALENDAR','VERSION:2.0','PRODID:-//Aimfun Club//Game Night//EN','BEGIN:VEVENT','UID:'+code+'-'+date.getTime()+'@aimfun.club','DTSTAMP:'+stamp(new Date()),'DTSTART:'+stamp(date),'DTEND:'+stamp(new Date(date.getTime()+3600000)),'SUMMARY:'+esc(title),'DESCRIPTION:'+esc('Join room '+code+' at '+origin+'/online/?room='+code+'. Adults 18+.'),'URL:'+origin+'/online/?room='+code,'BEGIN:VALARM','TRIGGER:-PT10M','ACTION:DISPLAY','DESCRIPTION:Game night starts in 10 minutes','END:VALARM','END:VEVENT','END:VCALENDAR',''].join('\r\n');
}
