// Open both reports as one print job. Browser printing cannot confirm physical output.
(()=>{
function status(text){const el=document.querySelector('#print-status');if(el)el.textContent=text}
function print(){
 const url='print-reports.html?v=20261028-print-real&autoprint=1&company='+encodeURIComponent(state.company)+'&period='+state.period;
 const tab=window.open(url,'_blank');
 const done=document.querySelector('[data-action="print-done"]');
 const retry=document.querySelector('[data-action="print-retry"]');
 if(retry)retry.disabled=false;
 if(!tab){status('เบราว์เซอร์บล็อกแท็บใหม่ กรุณาอนุญาตป๊อปอัป แล้วกดเปิดหน้าพิมพ์อีกครั้ง');if(done)done.disabled=true;return}
 tab.opener=null;
 status('เลือกเครื่องพิมพ์และกดพิมพ์ในแท็บรายงาน เมื่อรับเอกสารครบแล้วให้กลับมายืนยัน');
 if(done)done.disabled=false;
}
window.KSLPrint={start:print,print,cleanup(){}};
})();
