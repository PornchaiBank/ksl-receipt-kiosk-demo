// Explicit user click only; this does not run local files automatically on page load.
(()=>{
 const launcher=document.querySelector('#launch-bridge'),message=document.querySelector('#launch-bridge-status');
 let generation=0,busy=false,timer;
 const loggedIn=()=>typeof state!=='undefined'&&!!state.company&&state.screen!=='login';
 function reset(){generation++;clearTimeout(timer);busy=false;launcher.removeAttribute('aria-disabled');message.textContent='';}
 function sync(){launcher.hidden=!loggedIn();message.hidden=!loggedIn();if(!loggedIn())reset();}
 function finish(text,g){if(g!==generation||!loggedIn())return;busy=false;launcher.removeAttribute('aria-disabled');message.textContent=text;}
 async function verify(g,attempt){
  if(g!==generation||!loggedIn())return;
  if(!window.KSLPrinter?.isPaired?.()){finish('ส่งคำขอเปิด Bridge แล้ว · เมื่อติดตั้งและเปิดแล้ว ให้ตั้งค่ารหัสเชื่อมต่อที่ไอคอนรูปเฟือง',g);return;}
  try{const data=await window.KSLPrinter.capabilities();if(g!==generation||!loggedIn())return;if(data.version>=5){finish(data.webView2Installed?'Bridge เชื่อมต่อแล้ว':'Bridge เชื่อมต่อแล้ว · ต้องติดตั้ง WebView2 ก่อนพิมพ์',g);return;}finish('กรุณาอัปเดต Bridge v5',g);}
  catch{if(g!==generation||!loggedIn())return;if(attempt<2){timer=setTimeout(()=>verify(g,attempt+1),1500);return;}finish('ยังเชื่อมต่อไม่ได้ · ตรวจว่าติดตั้งตัวเรียกแล้วและอนุญาตเปิดโปรแกรม หรือเปิด Run-Web.cmd',g);}
 }
 launcher.addEventListener('click',e=>{
  if(!loggedIn()||busy){e.preventDefault();return;}
  // The native anchor navigates to the fixed registered protocol on this user gesture.
  const g=++generation;busy=true;launcher.setAttribute('aria-disabled','true');
  message.textContent='กำลังขอเปิด Bridge · หากเบราว์เซอร์ถาม ให้เลือกเปิดโปรแกรม';
  timer=setTimeout(()=>verify(g,0),2000);
 });
 document.addEventListener('kiosk:screen',sync);window.addEventListener('pagehide',reset);sync();
})();
