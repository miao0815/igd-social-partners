'use strict';
const C=window.STUDY_CONFIG,S=window.SCIAT,root=document.getElementById('experiment');
const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const params=new URLSearchParams(location.search),mode=params.get('mode')||'formal';
const key='sciat_pending_v1';let session=null,active=false,finishing=false,interrupted=false,held=new Set();
const wait=ms=>new Promise(r=>setTimeout(r,ms));
const paint=html=>new Promise(resolve=>requestAnimationFrame(ts=>{root.innerHTML=html;resolve({raf:ts,clock:performance.now()});}));
function card(title,body){root.innerHTML=`<section class="card"><h2>${title}</h2>${body}</section>`;}
function env(){return {user_agent:navigator.userAgent,platform:navigator.platform,language:navigator.language,screen_width:screen.width,screen_height:screen.height,viewport_width:innerWidth,viewport_height:innerHeight,device_pixel_ratio:devicePixelRatio,time_origin:performance.timeOrigin,timezone:Intl.DateTimeFormat().resolvedOptions().timeZone,jspsych_version:'8.2.2'};}
function download(data,name,type='application/json'){const a=document.createElement('a'),u=URL.createObjectURL(new Blob([data],{type}));a.href=u;a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(u),1000);}
function backup(){try{localStorage.setItem(key,JSON.stringify(session));return true;}catch(e){session.backup_error=String(e);return false;}}
function event(type){if(!active)return;const e={type,at_ms:performance.now(),trial_index:session.trials.length+1};session.events.push(e);interrupted=true;}
window.addEventListener('keydown',e=>{held.add(e.key.toLowerCase());});
window.addEventListener('keyup',e=>held.delete(e.key.toLowerCase()));
window.addEventListener('blur',()=>{held.clear();event('blur');});
document.addEventListener('visibilitychange',()=>{if(document.hidden)event('hidden');});
document.addEventListener('fullscreenchange',()=>{if(!document.fullscreenElement)event('fullscreen_exit');});
window.addEventListener('resize',()=>event('resize'));
window.addEventListener('beforeunload',e=>{if(active){e.preventDefault();e.returnValue='';}});
async function full(){if(!document.fullscreenElement){await document.documentElement.requestFullscreen();}if(!document.fullscreenElement)throw Error('未能进入全屏，请使用电脑浏览器重试。');}
function notice(title,body,label='继续'){return new Promise(resolve=>{card(title,body+`<button id="next">${label}</button>`);document.getElementById('next').onclick=()=>resolve();});}
async function gate(){
 if(document.hidden||!document.hasFocus()||(mode!=='demo'&&!document.fullscreenElement)){
 await new Promise(resolve=>{card('任务已暂停','<p>请回到本页面。准备好后点击继续，恢复全屏并继续任务。</p><button id="resume">继续任务</button><p id="error" class="error"></p>');document.getElementById('resume').onclick=async()=>{try{if(mode!=='demo')await full();if(document.hidden||!document.hasFocus())throw Error('请保持本页面在最前方。');held.clear();resolve();}catch(e){document.getElementById('error').textContent=e.message;}};});
 }
}
async function instruction(title,body){
 await gate();card(title,body+'<p>准备好后，松开按键，再按空格开始。</p>');
 await new Promise(resolve=>{const h=e=>{if(e.key===' '&&!e.repeat){e.preventDefault();window.removeEventListener('keydown',h);resolve();}};window.addEventListener('keydown',h);});
 await release();
}
async function release(){let start=performance.now();while([...held].some(k=>['e','i',' '].includes(k))){if(performance.now()-start>10000){await notice('请松开按键','<p>请松开 E、I 和空格键，然后点击继续。</p>');held.clear();break;}await wait(10);}}
function label(t){const name=t.task==='real'?'现实社交伙伴':'游戏社交伙伴';return {left:t.pairing==='P'?name+' + 积极':'积极',right:t.pairing==='N'?name+' + 消极':'消极'};}
function display(t,word,color='white'){let l=label(t);return `<div class="labels"><span>E：${l.left}</span><span>I：${l.right}</span></div><div class="word" style="color:${color}">${word}</div>`;}
// JS/browser timestamps estimate visual onset; they are not PTB VBL timestamps.
class ScIATTrial {
 constructor(jsPsych){this.jsPsych=jsPsych;}
 static info={name:'sciat-matlab-port',version:'1.0.0',parameters:{spec:{type:jsPsychModule.ParameterType.OBJECT,default:undefined}},data:{}};
 async trial(el,{spec:t}){
  await gate();await release();interrupted=false;
  const fix=await paint(display(t,'+'));await wait(S.timing.fixation);
  const onset=await paint(display(t,esc(t.word)));
  let frames=[],last=onset.raf,rafId;
  const tick=ts=>{frames.push(ts-last);last=ts;rafId=requestAnimationFrame(tick);};rafId=requestAnimationFrame(tick);
  const response=await new Promise(resolve=>{
   let ended=false,timer;
   const done=r=>{if(ended)return;ended=true;clearTimeout(timer);window.removeEventListener('keydown',onKey);resolve(r);};
   const onKey=e=>{const k=e.key.toUpperCase(),now=performance.now();if(!['E','I'].includes(k)||e.repeat)return;e.preventDefault();if(now-onset.clock>S.timing.deadline)return;done({response:k,rt_ms:now-onset.clock,response_time_ms:now});};
   window.addEventListener('keydown',onKey);
   timer=setTimeout(()=>done({response:'',rt_ms:null,response_time_ms:null}),Math.max(0,S.timing.deadline-(performance.now()-onset.clock)));
  });cancelAnimationFrame(rafId);
  const correct=response.response===t.correct_key,timeout=response.response==='';
  const post=await paint(t.practice?display(t,timeout?'请更快反应':correct?'O':'X',correct?'#00dc00':'#ff2828'):'');
  await wait(S.timing.feedback);const blank=await paint('');
  const row={...t,...response,participant_id:session.participant_id,session_id:session.session_id,mode,condition:session.condition,program_version:C.version,material_version:'partner_words_20261030',correct,timeout,feedback_presented:t.practice,fixation_onset_ms:fix.clock,stimulus_onset_ms:onset.clock,stimulus_raf_ms:onset.raf,postresponse_onset_ms:post.clock,blank_onset_ms:blank.clock,fixation_actual_ms:onset.clock-fix.clock,stimulus_actual_ms:post.clock-onset.clock,max_frame_gap_ms:frames.length?Math.max(...frames):null,interrupted,fullscreen:!!document.fullscreenElement,visible:!document.hidden};
  session.trials.push(row);const backed=backup();
  await wait(Math.max(0,S.timing.iti-(performance.now()-blank.clock)));
  if(!backed){await notice('本地备份未能保存','<p>浏览器本地存储不可用。请联系研究人员；当前记录可下载备份后继续。</p>','下载当前备份并继续');download(JSON.stringify(session),session.session_id+'_partial.json');}
  this.jsPsych.finishTrial(row);
 }
}
class Procedure {
 constructor(jsPsych){this.jsPsych=jsPsych;}
 static info={name:'study-procedure',version:'1.0.0',parameters:{run:{type:jsPsychModule.ParameterType.FUNCTION,default:undefined}},data:{}};
 async trial(el,t){await t.run();this.jsPsych.finishTrial({record_type:'procedure'});}
}
async function upload(snapshot,filename){
 const ctrl=new AbortController(),timer=setTimeout(()=>ctrl.abort(),65000);
 try{const response=await fetch('https://pipe.jspsych.org/api/data/',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({experimentID:C.dataPipeExperimentId,filename,data:JSON.stringify(snapshot)}),signal:ctrl.signal});
 const body=await response.json();
 if(response.status===202&&!body.error)return {status:'queued',filename};
 if(response.status===201&&!body.error)return {status:'stored',filename};
 throw Error(body.error||'HTTP_'+response.status);
 }finally{clearTimeout(timer);}
}
async function saveCloud(stage){
 if(mode==='demo')return;
 // Freeze payload and filename for retry: no new identity after ambiguous network failures.
 const snapshot=JSON.parse(JSON.stringify(session));snapshot.save_stage=stage;
 const filename=session.session_id+'_'+stage+'.json';
 let attempt=0;
 while(true){
  card(stage==='complete'?'正在保存实验数据':'正在保存本段数据','<p>请保持页面打开，等待保存完成。</p>');
  try{const result=await upload(snapshot,filename);session.uploads.push({...result,stage,attempt,at:new Date().toISOString()});backup();return result;}
  catch(e){attempt++;session.uploads.push({status:'failed',stage,attempt,error:e.message});backup();
   const collision=/FILE_EXISTS/.test(e.message);
   await new Promise(resolve=>{card('数据尚未确认保存',`<p>${collision?'服务器提示文件已存在，可能是上一次上传成功但回执丢失。请下载备份并联系研究人员核对；不会自动换文件名重复提交。':'网络或数据服务暂时不可用，请检查网络后重试。'}</p><p class="error" id="upload-error"></p><button id="retry">重试保存</button><button id="download">下载备份</button>${stage!=='complete'?'<button id="continue">保留本地备份并继续</button>':''}<p class="minor">${esc(C.contact)}</p>`);document.getElementById('upload-error').textContent=e.message;
   document.getElementById('download').onclick=()=>download(JSON.stringify(snapshot),filename);
   document.getElementById('retry').onclick=()=>resolve();
   if(stage!=='complete')document.getElementById('continue').onclick=()=>{attempt=-1;resolve();};});
   if(attempt===-1)return {status:'local_only',filename};
  }
 }
}
function finishPage(){
 const confirmed=session.uploads.some(u=>u.stage==='complete'&&['stored','queued'].includes(u.status));
 card(mode==='demo'?'短版演示已完成':confirmed?'词语分类任务已完成并提交':'任务结束',`<p>您的匿名编号：</p><p class="code">${esc(session.participant_id)}</p><p>${mode==='demo'?'本次为128试次演示，数据只在本机保存，未上传。':'请继续填写研究人员提供的任务后问卷，使用相同编号。'}</p>${C.questionnaireBUrl&&mode!=='demo'?'<button id="questionnaire">打开任务后问卷</button>':'<p>任务后问卷链接请向研究人员获取。</p>'}<button id="json">下载完整备份</button><button id="csv">下载逐试次CSV</button><p class="minor">请勿重复进行任务。如需退出或咨询，${esc(C.contact)}。</p>`);
 document.getElementById('json').onclick=()=>download(JSON.stringify(session),session.session_id+'.json');
 document.getElementById('csv').onclick=()=>download('\ufeff'+S.csv(session.trials),session.session_id+'.csv','text/csv;charset=utf-8');
 if(document.getElementById('questionnaire'))document.getElementById('questionnaire').onclick=()=>{const u=new URL(C.questionnaireBUrl);if(u.protocol==='https:')location.href=u.href;};
}
async function run(){
 active=true;const timeline=[];
 timeline.push({type:Procedure,run:()=>instruction('词语快速分类任务','<p>现实社交伙伴：主要在线下日常生活中与自己交往的真人伙伴。</p><p>游戏社交伙伴：主要通过网络游戏与自己交流、共同游戏的真人伙伴，不包括游戏角色或NPC。</p><p>根据屏幕上方类别，用 E（左）或 I（右）分类。请尽可能又快又准，每次只按一次。练习有对错及超时提示，正式分类不显示反馈。</p>')});
 let previous=null;
 session.schedule.forEach((t,i)=>{
  if(!previous||previous.task!==t.task||previous.block!==t.block){const l=label(t),change=previous&&previous.task!==t.task;
   timeline.push({type:Procedure,run:()=>instruction(t.practice?'练习分类':'正式分类',`${change?'<p>上一套任务已结束，可休息片刻。</p>':''}<p>E：${l.left}</p><p>I：${l.right}</p><p>注意本段的按键规则。</p>`)});
  }
  timeline.push({type:ScIATTrial,spec:t});
  const next=session.schedule[i+1];if(!next||next.task!==t.task||next.block!==t.block)timeline.push({type:Procedure,run:async()=>{await saveCloud('block'+t.task_order+'_'+t.block);}});
  previous=t;
 });
 const js=initJsPsych({display_element:'experiment',on_finish:async()=>{
  session.status='complete';session.completed_at=new Date().toISOString();session.summary=['real','game'].map(task=>S.score(session.trials,task,mode==='demo'?48:144));session.online_review_required=session.events.length>0;backup();finishing=true;
  await saveCloud('complete');active=false;if(document.fullscreenElement)await document.exitFullscreen();finishPage();
 }});
 try{await js.run(timeline);}catch(e){active=false;session.status='error';session.error=String(e);backup();card('任务中断','<p>请下载当前记录并联系研究人员，不要自行重新开始。</p><p id="fatal" class="error"></p><button id="backup">下载备份</button>');document.getElementById('fatal').textContent=String(e);document.getElementById('backup').onclick=()=>download(JSON.stringify(session),session.session_id+'_error.json');}
}
async function setup(){
 if(typeof initJsPsych!=='function'){card('程序未能加载','<p>请刷新页面或联系研究人员。</p>');return;}
 if(!['demo','pilot','formal'].includes(mode)){card('链接参数有误','<p>请使用研究人员提供的链接。</p>');return;}
 let old;try{old=JSON.parse(localStorage.getItem(key)||'null');}catch(e){}
 if(old){await new Promise(resolve=>{card('发现上次任务的本地记录',`<p>编号：${esc(old.participant_id)}；状态：${esc(old.status)}；已记录${old.trials?.length||0}试次。</p><p>请先下载备份。若为中断任务，请联系研究人员，不要自行重复；本程序不接着旧试次续跑。</p><button id="old-download">下载上次记录</button><button id="old-clear" disabled>已备份，清除本地记录并进入新任务</button>`);document.getElementById('old-download').onclick=()=>{download(JSON.stringify(old),old.session_id+'_recovered.json');document.getElementById('old-clear').disabled=false;};document.getElementById('old-clear').onclick=()=>{localStorage.removeItem(key);resolve();};});}
 if(mode!=='demo'&&(!C.collectionEnabled||!C.dataPipeExperimentId||!C.consentText.trim())){card('正式入口尚未开放','<p>研究人员正在配置数据保存和线上参与说明。请暂勿开始正式实验。</p><p>仅检查流程可使用短版演示。</p><a class="button" href="?mode=demo">短版演示</a>');return;}
 const mobile=/Android|iPhone|iPad|Mobile/i.test(navigator.userAgent)||(navigator.platform==='MacIntel'&&navigator.maxTouchPoints>1);
 if(mobile||innerWidth<900||innerHeight<600){card('请使用电脑参加','<p>本任务需要实体键盘 E、I 和空格键，请使用台式机或笔记本电脑，将浏览器窗口放大后重新打开。手机和平板不支持。</p>');return;}
 card('词语分类任务',`<p>${mode==='demo'?'短版演示 · 128试次 · 不上传数据':mode==='pilot'?'完整预测试 · 384试次':'正式任务 · 384试次'}</p><div class="consent">${esc(mode==='demo'?'本演示用于检查操作流程，不作为正式实验数据。按键和反应时间保存在当前浏览器，可在结束后下载。请不要输入姓名或联系方式。':C.consentText)}</div><form id="entry"><label>匿名被试编号</label><input name="pid" inputmode="numeric" pattern="[0-9]{1,8}" maxlength="8" required autocomplete="off" placeholder="例如 001"><p class="minor">填写研究人员提供的编号，与问卷一致；保留开头的0。不要填写手机号或姓名。</p><label class="check"><input type="checkbox" required>我已阅读说明，并自愿参与本次任务。</label><label class="check"><input type="checkbox" required>我正在使用电脑和实体键盘，能够清楚阅读中文。</label><button type="submit">确认并进入任务</button><button type="button" id="decline">不参与</button><p id="error" class="error"></p></form>`);
 const entry=document.getElementById('entry');if(/^\d{1,8}$/.test(params.get('id')||''))entry.elements.pid.value=params.get('id');
 document.getElementById('decline').onclick=()=>card('已退出','<p>您可以关闭页面。没有上传任何作答数据。</p>');
 entry.onsubmit=async e=>{e.preventDefault();const button=entry.querySelector('button[type=submit]');button.disabled=true;try{
  const id=entry.elements.pid.value.trim();if(!/^\d{1,8}$/.test(id))throw Error('编号应为1—8位数字。');
  const p=params.get('condition'),condition=p===null?(Number(id)-1+8)%8+1:Number(p);if(!Number.isInteger(condition)||condition<1||condition>8)throw Error('顺序条件应为1—8，请联系主试修正链接。');
  const seed=crypto.getRandomValues(new Uint32Array(1))[0],uuid=crypto.randomUUID();
  // Fullscreen requested directly from participant's click (browser gesture requirement).
  if(mode!=='demo')await full();
  session={schema_version:1,program_version:C.version,source_version:'MATLAB-3.1.0-r2016',material_version:'partner_words_20261030',mode,participant_id:id,session_id:`sciat_${mode}_${id}_${uuid}`,condition,condition_source:p===null?'numeric_id_mod8':'invitation_link',seed,randomization_algorithm:'mulberry32-fisher-yates',started_at:new Date().toISOString(),status:'in_progress',scope:'sciat_only',questionnaires:'external_wjx',consent_accepted:true,consent_text:mode==='demo'?'demo':C.consentText,environment:env(),config:{timing:S.timing,practiceN:mode==='demo'?8:24,testN:mode==='demo'?24:72},schedule:S.schedule(condition,seed,mode),trials:[],events:[],uploads:[]};
  if(!backup())throw Error('浏览器不能保存本地备份，请关闭隐私限制或换电脑浏览器后重试。');
  await run();
 }catch(err){button.disabled=false;const box=document.getElementById('error');if(box)box.textContent=err.message;else card('无法开始',`<p>${esc(err.message)}</p>`);}};
}
setup();
