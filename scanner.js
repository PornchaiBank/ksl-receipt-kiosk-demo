// Decode locally; camera frames are never uploaded.
(()=>{
 const dialog=document.querySelector('#scan-dialog'), video=document.querySelector('#scan-video');
 const status=document.querySelector('#scan-status'), retry=document.querySelector('#scan-retry');
 let stream=null,reader=null,timer=null,expiry=null,generation=0,lastValue='',matches=0;
 function stop(){generation++;clearTimeout(timer);clearTimeout(expiry);if(stream)stream.getTracks().forEach(t=>t.stop());stream=null;video.srcObject=null;if(reader)reader.reset();reader=null;}
 function signal(open){state.scanOpen=open;document.dispatchEvent(new Event('kiosk:scanner'));}
 function close(){stop();signal(false);if(dialog.open)dialog.close();document.querySelector('[data-action="scan"]')?.focus({preventScroll:true});}
 function fail(message){stop();status.textContent=message;retry.hidden=false;}
 function accept(raw){
  const value=String(raw).trim();
  if(!/^\d{1,10}$/.test(value)){lastValue='';matches=0;status.textContent='Barcode นี้ไม่ใช่เลขโควต้า กรุณาสแกนเลขโควต้าที่เป็นตัวเลขไม่เกิน 10 หลัก';return false;}
  matches=value===lastValue?matches+1:1;lastValue=value;
  if(matches<2)return false;
  if(state.screen!=='quota'){close();return true;}
  state.inputKind='quota';state.idNumber='';state.quota=value;close();document.querySelector('#quota').value=value;
  document.querySelector('#error').textContent='';
  document.querySelector('#scan-feedback').textContent='✓ อ่านเลขโควต้าแล้ว กรุณาตรวจสอบและกดตกลง';
  document.querySelector('[data-action="lookup"]')?.focus({preventScroll:true});return true;
 }
 async function start(){
  stop();lastValue='';matches=0;retry.hidden=true;status.textContent='กำลังเปิดกล้อง กรุณาอนุญาตการใช้งานกล้อง';
  const run=generation;
  if(!navigator.mediaDevices?.getUserMedia){fail('เบราว์เซอร์นี้เปิดกล้องไม่ได้ กรุณาเปิดลิงก์ด้วย Chrome หรือ Safari หรือใช้แป้นตัวเลข');return;}
  if(!window.ZXing){fail('โหลดตัวอ่าน Barcode ไม่สำเร็จ กรุณารีเฟรชหน้าเว็บ');return;}
  try{
   const acquired=await navigator.mediaDevices.getUserMedia({audio:false,video:{facingMode:{ideal:'environment'},width:{ideal:1280},height:{ideal:720}}});
   if(run!==generation){acquired.getTracks().forEach(t=>t.stop());return;}
   stream=acquired;video.srcObject=stream;await video.play();if(run!==generation)return;
   const hints=new Map();hints.set(ZXing.DecodeHintType.POSSIBLE_FORMATS,[ZXing.BarcodeFormat.CODE_128,ZXing.BarcodeFormat.CODE_39,ZXing.BarcodeFormat.CODE_93,ZXing.BarcodeFormat.ITF,ZXing.BarcodeFormat.CODABAR,ZXing.BarcodeFormat.EAN_13,ZXing.BarcodeFormat.EAN_8,ZXing.BarcodeFormat.UPC_A,ZXing.BarcodeFormat.UPC_E]);
   reader=new ZXing.BrowserMultiFormatReader(hints);status.textContent='วาง Barcode ในกรอบ ให้เห็นครบทั้งแถบ และถือให้นิ่ง';
   expiry=setTimeout(()=>fail('หยุดกล้องหลังไม่มีการสแกน 2 นาที แตะลองอีกครั้งหรือใช้แป้นตัวเลข'),120000);
   function scan(){
    if(run!==generation||!dialog.open)return;
    try{if(video.readyState>=2&&accept(reader.decode(video).getText()))return;}catch(error){if(![ZXing.NotFoundException,ZXing.ChecksumException,ZXing.FormatException].some(Type=>error instanceof Type)){fail('อ่านภาพจากกล้องไม่ได้ กรุณาลองอีกครั้งหรือใช้แป้นตัวเลข');return;}}
    timer=setTimeout(scan,180);
   }scan();
  }catch(error){if(run!==generation)return;fail(error.name==='NotAllowedError'?'ยังไม่ได้รับอนุญาตใช้กล้อง กรุณาอนุญาตกล้องในการตั้งค่าเว็บไซต์ แล้วลองอีกครั้ง':error.name==='NotFoundError'?'ไม่พบกล้องบนอุปกรณ์นี้ กรุณาใช้แป้นตัวเลข':'เปิดกล้องไม่ได้ กล้องอาจถูกใช้งานอยู่ กรุณาปิดแอปที่ใช้กล้องแล้วลองอีกครั้ง');}
 }
 document.querySelector('#app').addEventListener('click',e=>{if(e.target.closest('[data-action="scan"]')&&state.screen==='quota'&&!dialog.open){signal(true);dialog.showModal();start();}});
 document.querySelector('#scan-close').onclick=close;document.querySelector('#scan-cancel').onclick=close;retry.onclick=start;
 dialog.addEventListener('cancel',e=>{e.preventDefault();close();});dialog.addEventListener('close',()=>{if(state.scanOpen){stop();signal(false);}});
 document.addEventListener('kiosk:screen',()=>{if(dialog.open)close();});
 document.addEventListener('visibilitychange',()=>{if(document.hidden&&dialog.open)close();});
 window.addEventListener('pagehide',close);
})();
