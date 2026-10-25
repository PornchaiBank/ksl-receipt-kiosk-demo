// Windows Card Bridge v3. Card data is kept only in memory.
(()=>{
 const $=s=>document.querySelector(s),dialog=$('#card-dialog'),key='ksl.reader.v1';
 let token='',reader='',generation=0,controller;
 const status=t=>$('#card-status').textContent=t;
 const controls=document.createElement('div');
 controls.innerHTML='<label class="field">รหัสเชื่อมต่อจาก Card Bridge<input id="bridge-token" type="password" autocomplete="off" placeholder="วางรหัสเชื่อมต่อ"></label><label><input id="bridge-remember" type="checkbox"> จำการเชื่อมต่อบนเครื่องนี้</label><button id="bridge-connect" class="secondary full" type="button">เชื่อมต่อเครื่องอ่าน</button><label class="field">เครื่องอ่าน<select id="bridge-reader" disabled></select></label><button id="bridge-read" class="primary full" type="button" disabled>อ่านบัตรประชาชน</button><button id="bridge-forget" class="textbutton full" type="button">ลืมการเชื่อมต่อ</button>';
 controls.style.cssText='display:grid;gap:12px';
 $('#card-status').after(controls);
 $('#bridge-remember').style.cssText='width:20px;height:20px;min-height:0;vertical-align:middle;margin:0 6px 0 0';
 $('#card-reader-visual').hidden=true;
 document.querySelector('.card-mock-note').textContent='เปิด Run-Web.cmd บน Windows เครื่องนี้ แล้วคัดลอกรหัสเชื่อมต่อเว็บมาใส่ครั้งแรก';
 function saved(){try{return JSON.parse(localStorage.getItem(key)||'null')}catch{return null}}
 function remember(){try{if($('#bridge-remember').checked)localStorage.setItem(key,JSON.stringify({token,reader}));else localStorage.removeItem(key)}catch{status('เชื่อมต่อแล้ว แต่เบราว์เซอร์ไม่อนุญาตให้จำการเชื่อมต่อ')}}
 function signal(open){state.scanOpen=open;document.dispatchEvent(new Event('kiosk:scanner'))}
 function close(){generation++;controller?.abort();token='';$('#bridge-token').value='';signal(false);if(dialog.open)dialog.close();$('[data-card="reader"]')?.focus({preventScroll:true})}
 async function api(path,body){
  controller=new AbortController();const timer=setTimeout(()=>controller.abort(),12000);
  try{const r=await fetch('http://127.0.0.1:17861/api/'+path,{method:body?'POST':'GET',headers:{'X-Bridge-Token':token,...(body?{'Content-Type':'application/json'}:{})},...(body?{body:JSON.stringify(body)}:{}),signal:controller.signal,cache:'no-store'});
   if(r.status===401)throw Error('รหัสเชื่อมต่อไม่ถูกต้อง กรุณาคัดลอกจาก Card Bridge ใหม่');
   if(r.status===403)throw Error('กรุณาเปิดโปรแกรมด้วย Run-Web.cmd');
   const data=await r.json();if(!r.ok)throw Error(data.error||'อ่านบัตรไม่สำเร็จ');return data;
  }catch(e){if(e instanceof TypeError||e.name==='AbortError')throw Error('เชื่อมต่อไม่ได้ กรุณาเปิด Run-Web.cmd และอนุญาตการเข้าถึงเครือข่ายภายในในเบราว์เซอร์');throw e}finally{clearTimeout(timer)}
 }
 async function connect(){
  const g=++generation;token=$('#bridge-token').value.trim();if(!token){status('กรุณาใส่รหัสเชื่อมต่อ');return}
  $('#bridge-connect').disabled=true;$('#bridge-read').disabled=true;$('#bridge-reader').disabled=true;status('กำลังเชื่อมต่อเครื่องอ่าน…');
  try{const data=await api('readers');if(g!==generation)return;
   const readers=Array.isArray(data.readers)?data.readers.filter(x=>typeof x==='string'):[];
   $('#bridge-reader').replaceChildren(...readers.map(x=>new Option(x,x)));
   if(!readers.length){status('ไม่พบเครื่องอ่าน กรุณาเสียบ USB แล้วเชื่อมต่ออีกครั้ง');return}
   reader=readers.includes(reader)?reader:readers[0];$('#bridge-reader').value=reader;$('#bridge-reader').disabled=false;$('#bridge-read').disabled=false;remember();status('พร้อมอ่านบัตร กรุณาเสียบบัตรแล้วกดอ่านบัตรประชาชน');
  }catch(e){if(g===generation)status(e.message)}finally{if(g===generation)$('#bridge-connect').disabled=false}
 }
 async function read(){
  const g=++generation;reader=$('#bridge-reader').value;remember();$('#bridge-read').disabled=true;$('#bridge-connect').disabled=true;$('#bridge-reader').disabled=true;status('กำลังอ่านบัตรประชาชน…');
  try{const data=await api('read',{reader});if(g!==generation||state.screen!=='quota'||!dialog.open)return;
   if(typeof data.citizenId!=='string'||!/^\d{13}$/.test(data.citizenId))throw Error('ข้อมูลเลขบัตรไม่ครบ 13 หลัก กรุณาอ่านใหม่');
   state.idNumber=data.citizenId;state.inputKind='id';state.quota='';$('#quota').value=data.citizenId;$('#error').textContent='';$('#scan-feedback').textContent='อ่านบัตรสำเร็จ กรุณานำบัตรออก แล้วกดตกลง';close();
  }catch(e){if(g===generation)status(e.message)}finally{if(g===generation){$('#bridge-read').disabled=false;$('#bridge-connect').disabled=false;$('#bridge-reader').disabled=false}}
 }
 function open(){if(state.screen!=='quota'||state.scanOpen)return;
  const pref=saved();token=typeof pref?.token==='string'?pref.token:'';reader=typeof pref?.reader==='string'?pref.reader:'';
  $('#bridge-token').value=token;$('#bridge-remember').checked=!!token;$('#bridge-connect').disabled=false;$('#bridge-read').disabled=true;$('#bridge-reader').disabled=true;
  $('#card-title').textContent='เสียบบัตรประชาชน';status('เชื่อมต่อเครื่องอ่านบน Windows');signal(true);dialog.showModal();if(token)connect();
 }
 $('#bridge-connect').onclick=connect;$('#bridge-read').onclick=read;
 $('#bridge-reader').onchange=()=>{reader=$('#bridge-reader').value;remember()};
 $('#bridge-remember').onchange=remember;
 $('#bridge-token').oninput=()=>{$('#bridge-read').disabled=true};
 $('#bridge-forget').onclick=()=>{generation++;controller?.abort();try{localStorage.removeItem(key)}catch{}token='';reader='';$('#bridge-token').value='';$('#bridge-remember').checked=false;$('#bridge-reader').replaceChildren();$('#bridge-reader').disabled=true;$('#bridge-read').disabled=true;$('#bridge-connect').disabled=false;status('ลืมการเชื่อมต่อแล้ว')};
 $('#app').addEventListener('click',e=>{if(e.target.closest('[data-card="reader"]'))open()});
 $('#card-close').onclick=close;$('#card-cancel').onclick=close;
 dialog.addEventListener('cancel',e=>{e.preventDefault();close()});
 document.addEventListener('kiosk:screen',()=>{if(dialog.open)close()});document.addEventListener('visibilitychange',()=>{if(document.hidden&&dialog.open)close()});window.addEventListener('pagehide',()=>{if(dialog.open)close()});
})();
