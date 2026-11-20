const assert=require('node:assert/strict'),S=require('./core.js');
for(const mode of ['demo','pilot','formal'])for(let c=1;c<=8;c++){
 const a=S.schedule(c,42,mode);assert.equal(a.length,mode==='demo'?128:384);assert.deepEqual(a,S.schedule(c,42,mode));
 assert.equal(a[0].task,(c-1)&1?'game':'real');
 for(const task of ['real','game'])for(let b=1;b<=4;b++){
  const q=a.filter(t=>t.task===task&&t.block===b),n=mode==='demo'?(b%2?8:24):(b%2?24:72);
  assert.equal(q.length,n);assert.equal(q.filter(t=>t.category==='target').length,n/4);
  const p=!!((c-1)&(task==='real'?2:4));assert.equal(q[0].pairing,b<=2?(p?'N':'P'):(p?'P':'N'));
  assert.equal(q.filter(t=>t.category==='positive').length,q[0].pairing==='P'?n/4:n/2);
  q.forEach(t=>assert.equal(t.correct_key,t.category==='positive'||(t.category==='target'&&t.pairing==='P')?'E':'I'));
 }
}
let t=S.schedule(1,4,'formal').map((x,i)=>({...x,rt_ms:(x.pairing==='P'?500:650)+i%10,correct:true,timeout:false}));
let r=S.score(t,'real',144);assert.equal(r.complete,true);assert.ok(r.D_raw>0);assert.equal(r.qc_flag,false);
assert.equal(S.score(t.slice(0,50),'real',144).D_raw,null);
assert.equal(S.score(t.map(x=>({...x,rt_ms:100})),'real',144).D_usable,null);
assert.equal(S.score(t.map(x=>({...x,rt_ms:null,correct:false,timeout:true})),'real',144).D_raw,null);
// Manually calculated fixture validates 400ms block-mean error replacement and pooled SD.
let fixture=[{pairing:'P',rt_ms:400,correct:true},{pairing:'P',rt_ms:600,correct:true},{pairing:'N',rt_ms:800,correct:true},{pairing:'N',rt_ms:500,correct:false}].map(x=>({...x,task:'real',practice:false,timeout:false}));
r=S.score(fixture,'real',4);assert.equal(r.D_raw,2.5);assert.equal(r.D_usable,null);assert.equal(r.error_rate,.25);
assert.throws(()=>S.schedule(9,1,'formal'));
console.log('PASS: all 24 mode/condition combinations; count, mapping, order, determinism and scoring fixtures.');
