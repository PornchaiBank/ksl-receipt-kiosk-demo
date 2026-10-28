// Silent output requires Chrome launched by Start-KSL.vbs with --kiosk-printing.
// afterprint is not physical-printer confirmation: the user confirms receipt.
(()=>{
let frame=null,timeout=null,requested=false,preparing=false,generation=0;
const silent=new URLSearchParams(location.search).get('printing')==='silent';
function status(text){const el=document.querySelector('#print-status');if(el)el.textContent=text}
function controls(done,retry){const d=document.querySelector('[data-action="print-done"]'),r=document.querySelector('[data-action="print-retry"]');if(d)d.disabled=!done;if(r)r.disabled=!retry}
function cleanup(){generation++;preparing=false;clearTimeout(timeout);timeout=null;if(frame)frame.remove();frame=null;requested=false}
async function print(){
 if(frame||preparing)return;
 controls(false,false);
 if(!silent){status('กรุณาเปิดเว็บด้วย Start-KSL.vbs รุ่นพิมพ์อัตโนมัติบน Windows และเลือกเครื่องพิมพ์ในหน้าตั้งค่าก่อนใช้งาน');controls(false,true);return}
 const g=generation;preparing=true;status('กำลังตรวจสอบเครื่องพิมพ์ที่บันทึกไว้');
 try{if(!window.KSLPrinter)throw Error('กรุณาเปิดหน้าตั้งค่าเพื่อเชื่อมต่อเครื่องพิมพ์');const result=await window.KSLPrinter.prepare();if(g!==generation||state.screen!=='printing')return;status('เครื่องพิมพ์: '+result.selectedPrinter)}
 catch(e){if(g===generation){preparing=false;status(e.message);controls(false,true)}return}
 preparing=false;
 frame=document.createElement('iframe');frame.title='รายงานสำหรับเครื่องพิมพ์';frame.setAttribute('aria-hidden','true');frame.tabIndex=-1;
 Object.assign(frame.style,{position:'fixed',left:'-12000px',top:'0',width:'794px',height:'1123px',border:'0',pointerEvents:'none'});
 frame.src='print-reports.html?v=20261028-printer-select&embedded=1&company='+encodeURIComponent(state.company)+'&period='+state.period;
 status('กำลังเตรียมรายงานทั้ง 2 แบบสำหรับเครื่องพิมพ์');
 document.body.appendChild(frame);
 timeout=setTimeout(()=>{if(!requested){cleanup();status('เตรียมรายงานไม่สำเร็จ กรุณาลองใหม่');controls(false,true)}},45000);
}
window.addEventListener('message',event=>{
 if(event.origin!==location.origin||!frame||event.source!==frame.contentWindow||state.screen!=='printing')return;
 if(event.data?.type==='ksl-report-ready'&&!requested){
  clearTimeout(timeout);requested=true;status('กำลังส่งรายงานไปยังเครื่องพิมพ์ กรุณารับเอกสารให้ครบ');
  frame.contentWindow.postMessage({type:'ksl-report-print'},location.origin);
 }else if(event.data?.type==='ksl-report-returned'){
  status('ส่งคำสั่งพิมพ์แล้ว กรุณาตรวจสอบและรับเอกสารทั้ง 2 แบบ');controls(true,true);
  // Keep the frame alive until leaving this screen; never remove it during spooling.
 }else if(event.data?.type==='ksl-report-error'){
  cleanup();status('ไม่สามารถเตรียมหรือส่งพิมพ์รายงานได้ กรุณาตรวจสอบเครื่องพิมพ์แล้วลองใหม่');controls(false,true);
 }
});
function retry(){if(requested&&!window.confirm('พิมพ์รายงานทั้ง 2 แบบซ้ำอีกครั้ง? กรุณาตรวจสอบคิวเครื่องพิมพ์ก่อน เพื่อป้องกันเอกสารซ้ำ'))return;cleanup();print()}
document.addEventListener('kiosk:screen',()=>{if(state.screen!=='printing')cleanup()});
window.KSLPrint={start:print,print:retry,cleanup};
})();
