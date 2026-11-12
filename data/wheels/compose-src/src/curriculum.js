/* Compact, inspectable, versioned curriculum graph. No backend / no punitive hard lock. */
(function(root){'use strict';
const order=`1.1 7.1 3.1 6.1 4.1 9.1 1.2 7.2 3.2 8.1 10.1 2.1 9.2 6.2 4.2 1.3 7.3 3.3 2.2 8.2 10.2 11.1 12.1 9.3 6.3 4.3 1.4 7.4 2.3 3.4 8.3 10.3 11.2 12.2 14.1 5.1 9.4 6.4 4.4 2.4 8.4 10.4 11.3 12.3 14.2 5.2 13.1 15.1 11.4 12.4 14.3 5.3 13.2 15.2 14.4 5.4 13.3 15.3 13.4 15.4`.split(' ');
// Next-level prerequisites are implicit, plus a few concept dependencies.
const extraPrereqs={
 '3.1':['1.1'],'6.1':['3.1'],'9.1':['3.1'],'8.1':['3.1'],
 '10.1':['3.1'],'2.1':['4.1'],'11.1':['3.1'],
 '12.1':['7.2'],'5.1':['12.1'],'13.1':['8.2'],
 '14.1':['2.1'],'15.1':['8.2']
};
const kin={
 1:['7.1','3.1','2.1'],2:['4.1','1.4','5.2'],3:['6.1','7.1','8.1'],4:['2.1','9.1','8.1'],5:['12.1','2.3','14.2'],
 6:['3.1','9.1','10.1'],7:['1.2','3.2','12.1'],8:['3.1','9.1','13.1'],9:['6.3','8.1','4.2'],10:['6.1','3.1','1.2'],
 11:['3.3','6.2','12.1'],12:['7.2','5.1','11.1'],13:['8.2','6.1','3.1'],14:['2.1','5.2','12.1'],15:['8.2','4.2','14.1']
};
const idNumber=id=>Number(id.split('.')[0]);
const familyOf=id=>root.SW.families.find(f=>f.number===idNumber(id));
const lessonOf=id=>familyOf(id)?.levels.find(l=>l.id===id);
function prereqs(id){const n=idNumber(id),step=Number(id.split('.')[1]),p=step>1?[`${n}.${step-1}`]:[];return [...new Set([...p,...(extraPrereqs[id]||[])])];}
function neighbors(id){const f=idNumber(id),current=order.indexOf(id),near=[...kin[f]];
 if(current>0)near.push(order[current-1]);if(current+1<order.length)near.push(order[current+1]);
 near.push(...prereqs(id));return [...new Set(near)].filter(x=>x!==id&&order.includes(x)).slice(0,6);
}
const localDate=()=>{const d=new Date();const y=d.getFullYear(),m=String(d.getMonth()+1).padStart(2,'0'),dd=String(d.getDate()).padStart(2,'0');return `${y}-${m}-${dd}`;};
function metrics(stats,id){const entries=(stats?.[id]?.attempts||[]);const graded=entries.filter(e=>e.grade==='yes'||e.grade==='retry');
 const positive=graded.filter(e=>e.grade==='yes');const unique=new Set(positive.map(e=>e.key)).size;
 const recent=graded.slice(-10);const rate=recent.length?recent.filter(e=>e.grade==='yes').length/recent.length:0;
 const positiveDays=new Set(positive.map(e=>e.day)).size;
 const ready=graded.length>=8&&unique>=6&&rate>=.8;
 const mastered=ready&&positiveDays>=2&&positive.length>=11;
 return {graded:graded.length,correct:positive.length,unique,recentAccuracy:rate,days:positiveDays,ready,mastered,status:mastered?'Mastered':ready?'Ready to level up':graded.length?'In practice':'Unstarted'};
}
function eligible(stats,id){return prereqs(id).every(d=>metrics(stats,d).ready);}
function recommend(stats){return order.find(id=>!metrics(stats,id).ready&&eligible(stats,id))||order.find(id=>!metrics(stats,id).mastered)||order[order.length-1];}
function practice(stats,id,key,grade){if(!['yes','retry'].includes(grade))throw Error('Expected self-grade');
 if(!stats[id])stats[id]={attempts:[]};
 stats[id].attempts.push({key,grade,day:localDate(),at:new Date().toISOString()});
 stats[id].attempts=stats[id].attempts.slice(-120);
 return metrics(stats,id);
}
function validate(){const found=new Set(root.SW.allLevels().map(x=>x.level.id));if(found.size!==order.length)throw Error(`Curriculum size mismatch ${found.size}/${order.length}`);
 for(const id of order){if(!found.has(id))throw Error('Unknown lesson '+id);for(const p of prereqs(id)){if(!found.has(p))throw Error(`Unknown prereq ${id}→${p}`);if(order.indexOf(p)>order.indexOf(id))throw Error(`Ordering conflict ${id}→${p}`);}}
}
root.SWCurriculum={order,prereqs,neighbors,kin,extraPrereqs,localDate,metrics,eligible,recommend,practice,validate,lessonOf,familyOf};
})(globalThis);
