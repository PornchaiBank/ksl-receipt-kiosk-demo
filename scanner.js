// USB/Bluetooth HID readers send keystrokes to the foreground browser.
(()=>{
 let buffer='',invalid=false,timer,last=0,swallowEnd=false;
 function clear(){buffer='';invalid=false;clearTimeout(timer);last=0}
 function eligible(e){return state.screen==='quota'&&!state.scanOpen&&!document.hidden&&!document.querySelector('dialog[open]')&&!e?.target?.closest('input:not(:disabled),textarea,select,[contenteditable="true"]')}
 function accept(){
  const value=buffer,bad=invalid;clear();if(!eligible()||!value&&!bad)return;
  const message=document.querySelector('#scan-feedback');
  if(bad||!/^\d{1,10}$/.test(value)){message.textContent='บาร์โค้ดต้องเป็นเลขโควต้า 1–10 หลัก กรุณายิงใหม่';return}
  state.inputKind='quota';state.idNumber='';state.quota=value;
  document.querySelector('#quota').value=value;document.querySelector('#error').textContent='';
  message.textContent='รับเลขโควต้าแล้ว กรุณาตรวจสอบและกดตกลง';
  document.dispatchEvent(new Event('kiosk:card-read'));
 }
 document.addEventListener('keydown',e=>{
  if(!eligible(e)){clear();return}
  if(e.ctrlKey||e.altKey||e.metaKey||e.isComposing){clear();return}
  if(e.key==='Enter'||e.key==='Tab'){
   if(buffer||invalid){e.preventDefault();e.stopImmediatePropagation();swallowEnd=true;accept()}return;
  }
  if(e.key==='Shift')return;
  if(e.key.length!==1){clear();return}
  e.preventDefault();e.stopImmediatePropagation();clearTimeout(timer);
  const now=Date.now();if(last&&now-last>500){buffer='';invalid=false}last=now;
  if(!/^\d$/.test(e.key)||buffer.length>=10)invalid=true;
  else buffer+=e.key;
  // Readers without an Enter/Tab suffix are accepted after a short pause.
  timer=setTimeout(accept,300);
 },true);
 document.addEventListener('keyup',e=>{if(swallowEnd&&(e.key==='Enter'||e.key==='Tab')){e.preventDefault();e.stopImmediatePropagation();swallowEnd=false}},true);
 for(const event of ['kiosk:screen','kiosk:scanner','visibilitychange'])document.addEventListener(event,()=>{clear();swallowEnd=false});
 window.addEventListener('blur',clear);window.addEventListener('pagehide',clear);
})();
