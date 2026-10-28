// Bridge v5 performs native printing; ordinary Chrome/Edge needs no kiosk flags.
(()=>{
const key='ksl.print.pending.v5';let current=null,generation=0,timer=null,busy=false;
const status=t=>{const el=document.querySelector('#print-status');if(el)el.textContent=t};
function controls(done,retry,label='ตรวจสอบสถานะอีกครั้ง'){
 const d=document.querySelector('[data-action="print-done"]'),r=document.querySelector('[data-action="print-retry"]');
 if(d)d.disabled=!done;if(r){r.disabled=!retry;r.textContent=label}
}
function read(){try{return JSON.parse(sessionStorage.getItem(key)||'null')}catch{return null}}
function clear(){sessionStorage.removeItem(key);current=null}
function cleanup(){generation++;clearTimeout(timer);busy=false}
function draw(job){
 current={...current,...job};
 const name=job.printer?' · '+job.printer:'';
 if(job.status==='submitted'){status('ส่งงานเข้าระบบพิมพ์แล้ว'+name+' กรุณารับเอกสารทั้ง 2 แบบ');clearTimeout(timer);timer=setTimeout(()=>{if(state.screen==='printing'&&current?.status==='submitted'){names.forEach((_,report)=>state.prints.push({report,period:state.period,status:'submitted'}));go('rating')}},4000);return true}
 if(job.status==='failed'){status((job.message||'ส่งพิมพ์ไม่สำเร็จ')+' กรุณาติดต่อเจ้าหน้าที่');controls(false,true,'ลองพิมพ์ใหม่');return true}
 if(job.status==='unknown'){status((job.message||'ยังยืนยันผลไม่ได้')+' กรุณาตรวจคิวเครื่องพิมพ์ก่อนพิมพ์ซ้ำ');controls(false,true,'ตรวจคิวแล้ว พิมพ์ใหม่');return true}
 status((job.status==='printing'?'กำลังส่งรายงานไปเครื่องพิมพ์':'กำลังเตรียมรายงานทั้ง 2 แบบ')+name);controls(false,false);return false;
}
async function poll(id,g){
 if(g!==generation||state.screen!=='printing')return;
 try{const job=await window.KSLPrinter.job(id);if(g!==generation)return;if(draw(job)){busy=false;return}timer=setTimeout(()=>poll(id,g),1000)}
 catch(e){if(g!==generation)return;busy=false;status('ยังตรวจสอบผลไม่ได้: '+e.message+' ระบบจะไม่ส่งงานใหม่จนกว่าจะตรวจสอบรหัสเดิม');controls(false,true)}
}
async function start(){
 if(busy)return;const g=++generation;busy=true;controls(false,false);
 try{
  if(!window.KSLPrinter)throw Error('กรุณาเชื่อมต่อ Bridge ในหน้าตั้งค่าก่อน');
  const capabilities=await window.KSLPrinter.capabilities();if(g!==generation)return;
  if(!capabilities.directPrint||capabilities.version<5)throw Error('กรุณาอัปเดต Bridge v5 เพื่อพิมพ์ตรงจากเว็บธรรมดา');
  if(!capabilities.webView2Installed)throw Error('กรุณาติดตั้ง Microsoft Edge WebView2 Runtime บน Windows');
  const pending=read();
  if(pending&&(pending.company!==state.company||pending.period!==state.period))throw Error('ยังมีงานเดิมค้างตรวจสอบ บริษัท '+pending.company+' งวด '+pending.period+' กรุณากลับไปเลือกงวดเดิมเพื่อตรวจสอบก่อน');
  current=pending||{requestId:crypto.randomUUID(),company:state.company,period:state.period};
  // Persist before POST. Reconnection reuses this ID, never an automatic duplicate.
  sessionStorage.setItem(key,JSON.stringify({requestId:current.requestId,company:current.company,period:current.period}));
  status('กำลังส่งคำขอไปยัง Bridge');
  const job=await window.KSLPrinter.submit({requestId:current.requestId,company:current.company,period:current.period});
  if(g!==generation)return;
  if(draw(job)){busy=false;return}timer=setTimeout(()=>poll(current.requestId,g),800);
 }catch(e){if(g!==generation)return;busy=false;status(e.message+' กรุณาติดต่อเจ้าหน้าที่');controls(false,true)}
}
function retry(){
 if(busy)return;
 if(current&&['submitted','failed','unknown'].includes(current.status)){
  if(current.status!=='failed'&&!window.confirm('ตรวจคิวเครื่องพิมพ์และเอกสารแล้ว ต้องการส่งพิมพ์รายงานทั้ง 2 แบบใหม่หรือไม่? อาจมีเอกสารซ้ำ'))return;
  clear();
 }
 start();
}
document.addEventListener('kiosk:screen',()=>{if(state.screen!=='printing'){cleanup();if(state.screen==='collect'||(state.screen==='rating'&&current?.status==='submitted'))clear()}});
window.KSLPrint={start,print:retry,cleanup};
})();
