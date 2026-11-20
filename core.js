(function(root){
'use strict';
const materials={real:['同班同学','宿舍室友','社团同伴','现实同伴','线下伙伴'],game:['固定队友','组队同伴','游戏队友','游戏同伴','联机伙伴'],positive:['喜欢','愉快','友好','亲切','满意','舒适'],negative:['讨厌','痛苦','反感','糟糕','难受','烦躁']};
const timing={fixation:250,deadline:2000,feedback:150,iti:250,minRT:350,errorPenalty:400};
function rng(seed){return ()=>{seed|=0;seed=seed+0x6D2B79F5|0;let t=Math.imul(seed^seed>>>15,1|seed);t=t+Math.imul(t^t>>>7,61|t)^t;return ((t^t>>>14)>>>0)/4294967296;};}
function shuffle(xs,random){let a=xs.slice();for(let i=a.length-1;i>0;i--){let j=Math.floor(random()*(i+1));[a[i],a[j]]=[a[j],a[i]];}return a;}
function schedule(condition,seed,mode){
 if(!Number.isInteger(condition)||condition<1||condition>8)throw Error('condition must be 1–8');
 if(!['demo','pilot','formal'].includes(mode))throw Error('invalid mode');
 const random=rng(seed),tasks=(condition-1)&1?['game','real']:['real','game'],out=[];
 tasks.forEach((task,ti)=>{let pairs=['P','N'];if((condition-1)&(task==='real'?2:4))pairs.reverse();
 const targets=shuffle(materials[task],random);
 for(let b=1;b<=4;b++){let practice=b%2===1,pairing=pairs[Math.floor((b-1)/2)],n=mode==='demo'?(practice?8:24):(practice?24:72);
 let counts=pairing==='P'?[n/4,n/4,n/2]:[n/4,n/2,n/4],local=[];
 [targets,materials.positive,materials.negative].forEach((pool,k)=>{for(let z=0;z<counts[k];z++)local.push({task,task_order:ti+1,block:b,practice,pairing,word:pool[z%pool.length],category:['target','positive','negative'][k],correct_key:k===1||(k===0&&pairing==='P')?'E':'I'});});
 out.push(...shuffle(local,random));}});
 return out.map((t,i)=>({...t,index:i+1}));
}
function score(trials,task,expected){
 const q=trials.filter(t=>t.task===task&&!t.practice),r={task,complete:q.length===expected,n:q.length,error_rate:null,fast_rate:null,timeout_rate:null,D_raw:null,D_usable:null,qc_flag:true,interrupted_trials:q.filter(t=>t.interrupted).length};
 if(!q.length)return r;
 const mean=a=>a.reduce((a,b)=>a+b,0)/a.length;
 r.error_rate=mean(q.map(t=>+!t.correct));r.timeout_rate=mean(q.map(t=>+t.timeout));r.fast_rate=mean(q.map(t=>+(Number.isFinite(t.rt_ms)&&t.rt_ms<350)));
 if(!r.complete)return r;
 const valid=t=>Number.isFinite(t.rt_ms)&&t.rt_ms>=350&&t.rt_ms<=2000&&!t.timeout;
 const correct=q.filter(t=>valid(t)&&t.correct).map(t=>t.rt_ms);if(correct.length<2)return r;
 const avg=mean(correct),sd=Math.sqrt(correct.reduce((s,x)=>s+(x-avg)**2,0)/(correct.length-1));if(!sd)return r;
 const means=[];for(const p of ['P','N']){const good=q.filter(t=>t.pairing===p&&valid(t)&&t.correct).map(t=>t.rt_ms);if(!good.length)return r;const gm=mean(good);means.push(mean(q.filter(t=>t.pairing===p&&valid(t)).map(t=>t.correct?t.rt_ms:gm+400)));}
 r.D_raw=(means[1]-means[0])/sd;
 r.qc_flag=r.error_rate>.20||r.fast_rate>.10; // exactly MATLAB rule; online flags separate
 if(!r.qc_flag)r.D_usable=r.D_raw;
 r.online_review_required=r.interrupted_trials>0;return r;
}
function csv(rows){if(!rows.length)return '';const keys=[...new Set(rows.flatMap(r=>Object.keys(r)))],v=x=>'"'+String(x==null?'':typeof x==='object'?JSON.stringify(x):x).replace(/"/g,'""')+'"';return [keys.map(v).join(','),...rows.map(r=>keys.map(k=>v(r[k])).join(','))].join('\r\n');}
const api={materials,timing,schedule,score,csv};if(typeof module!=='undefined')module.exports=api;else root.SCIAT=api;
})(typeof window!=='undefined'?window:globalThis);
