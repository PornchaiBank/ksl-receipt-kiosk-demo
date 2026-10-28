// Browser printing cannot confirm a physical printer result. Completion is user-confirmed.
(()=>{
let frame=null,ready=false,loadTimer=null;
function cleanup(){clearTimeout(loadTimer);frame?.remove();frame=null;ready=false}
function status(text){const el=document.querySelector('#print-status');if(el)el.textContent=text}
function controls(loaded){const retry=document.querySelector('[data-action="print-retry"]'),done=document.querySelector('[data-action="print-done"]');if(retry)retry.disabled=!loaded;if(done)done.disabled=!loaded}
function print(){if(!frame||!ready)return;try{frame.contentWindow.focus();frame.contentWindow.print()}catch{status('เปิดหน้าต่างพิมพ์ไม่สำเร็จ กรุณากดพิมพ์อีกครั้ง')}}
window.KSLPrint={start(){cleanup();frame=document.createElement('iframe');frame.title='เอกสารค่าอ้อยสำหรับพิมพ์';frame.setAttribute('aria-hidden','true');frame.style.cssText='position:fixed;left:-12000px;top:0;width:800px;height:1123px;border:0;pointer-events:none';frame.src='print-reports.html?v=20261028-linked&company='+encodeURIComponent(state.company)+'&period='+state.period;document.body.appendChild(frame);loadTimer=setTimeout(()=>{if(!ready&&state.screen==='printing'){status('โหลดรายงานไม่สำเร็จ กรุณากลับไปเลือกงวดและลองใหม่')}},20000)},print,cleanup};
window.addEventListener('message',e=>{if(e.origin!==location.origin||!frame||e.source!==frame.contentWindow||state.screen!=='printing')return;if(e.data?.type==='ksl-print-ready'){clearTimeout(loadTimer);ready=true;controls(true);status('เอกสารพร้อมพิมพ์ เมื่อได้รับเอกสารครบแล้ว กรุณากดยืนยันด้านล่าง');print()}else if(e.data?.type==='ksl-print-closed'){status('หากพิมพ์แล้ว กรุณารับเอกสารให้ครบ หากยกเลิก สามารถกดพิมพ์อีกครั้งได้')}else if(e.data?.type==='ksl-print-error'){clearTimeout(loadTimer);status('เตรียมรายงานไม่สำเร็จ กรุณากลับไปเลือกงวดและลองใหม่')}});
document.addEventListener('kiosk:screen',()=>{if(state.screen!=='printing')cleanup()});
})();
