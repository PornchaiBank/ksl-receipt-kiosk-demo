// Hardware integration is not configured. Never fabricate a card number.
(()=>{
 const $=s=>document.querySelector(s),dialog=$('#card-dialog');
 function signal(open){state.scanOpen=open;document.dispatchEvent(new Event('kiosk:scanner'));}
 function close(){signal(false);if(dialog.open)dialog.close();$('[data-card="reader"]')?.focus({preventScroll:true});}
 function open(){
  if(state.screen!=='quota'||state.scanOpen)return;
  $('#card-title').textContent='เสียบบัตรประชาชน';
  $('#card-status').textContent='ยังอ่านบัตรไม่ได้: ต้องเชื่อมต่อโปรแกรมอ่านบัตรบนเครื่องตู้ก่อน';
  signal(true);dialog.showModal();
 }
 $('#app').addEventListener('click',e=>{if(e.target.closest('[data-card="reader"]'))open()});
 $('#card-close').onclick=close;$('#card-cancel').onclick=close;
 dialog.addEventListener('cancel',e=>{e.preventDefault();close()});dialog.addEventListener('close',()=>{if(state.scanOpen)signal(false)});
 document.addEventListener('kiosk:screen',()=>{if(dialog.open)close()});document.addEventListener('visibilitychange',()=>{if(document.hidden&&dialog.open)close()});window.addEventListener('pagehide',()=>{if(dialog.open)close()});
})();
