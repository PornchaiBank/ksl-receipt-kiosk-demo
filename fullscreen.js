// Native fullscreen when allowed; clearly labelled in-page expansion otherwise.
(()=>{
 const root=document.documentElement,button=document.querySelector('#fullscreen');
 const notice=document.createElement('div');notice.id='fullscreen-notice';notice.hidden=true;notice.setAttribute('role','status');
 notice.innerHTML='<span>เบราว์เซอร์ไม่อนุญาตให้เต็มจอ ขณะนี้ขยายเฉพาะพื้นที่เว็บ หากต้องการซ่อนแถบเบราว์เซอร์ ให้เปิดลิงก์นี้ใน Chrome หรือ Safari แล้วกดเต็มหน้าจออีกครั้ง</span><button type="button" aria-label="ปิดข้อความ">✕</button>';
 document.body.append(notice);notice.querySelector('button').onclick=()=>notice.hidden=true;
 let expanded=false,busy=false;
 const nativeElement=()=>document.fullscreenElement||document.webkitFullscreenElement;
 function refresh(){
  const native=!!nativeElement();root.classList.toggle('kiosk-expanded',native||expanded);
  button.hidden=false;button.setAttribute('aria-pressed',String(native||expanded));
  button.textContent=native?'ออกจากเต็มจอ':expanded?'ย่อมุมมอง':'⛶ เต็มหน้าจอ';
  if(native)notice.hidden=true;
  document.dispatchEvent(new Event('kiosk:viewport'));
 }
 function fallback(){expanded=true;notice.hidden=false;refresh()}
 button.onclick=async()=>{
  if(busy)return;busy=true;
  try{
   if(nativeElement()){
    const exit=document.exitFullscreen||document.webkitExitFullscreen;
    if(exit)await exit.call(document);
    expanded=false;notice.hidden=true;refresh();return;
   }
   if(expanded){expanded=false;notice.hidden=true;refresh();return;}
   const request=root.requestFullscreen||root.webkitRequestFullscreen;
   if(!request||document.fullscreenEnabled===false||document.webkitFullscreenEnabled===false){fallback();return;}
   try{await request.call(root,{navigationUI:'hide'});refresh();}catch{fallback()}
  }finally{busy=false}
 };
 for(const event of ['fullscreenchange','webkitfullscreenchange'])document.addEventListener(event,()=>{expanded=false;notice.hidden=true;refresh()});
 for(const event of ['fullscreenerror','webkitfullscreenerror'])document.addEventListener(event,()=>{if(!nativeElement())fallback()});
 document.addEventListener('keydown',e=>{if(e.key==='Escape'&&expanded&&!nativeElement()){expanded=false;notice.hidden=true;refresh()}});
 refresh();
})();
