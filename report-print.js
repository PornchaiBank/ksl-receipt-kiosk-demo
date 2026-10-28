// Preview-only mode: no calls to window.print and no physical print jobs.
(()=>{
function status(text){const el=document.querySelector('#print-status');if(el)el.textContent=text}
function preview(){
 const url='print-reports.html?v=20261028-preview-only&company='+encodeURIComponent(state.company)+'&period='+state.period;
 const tab=window.open(url,'_blank');
 const done=document.querySelector('[data-action="print-done"]');
 const retry=document.querySelector('[data-action="print-retry"]');
 if(retry)retry.disabled=false;
 if(!tab){status('เบราว์เซอร์บล็อกแท็บใหม่ กรุณาอนุญาตป๊อปอัป แล้วกดเปิดรายงานอีกครั้ง');if(done)done.disabled=true;return}
 tab.opener=null;
 status('เปิดรายงานทั้งสองแบบในแท็บใหม่แล้ว เมื่อดูเสร็จให้กลับมาที่หน้านี้');
 if(done)done.disabled=false;
}
window.KSLPrint={start:preview,print:preview,cleanup(){}};
})();
