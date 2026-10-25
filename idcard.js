// Windows Card Bridge v3: settings dialog + automatic reading on screen 02.
(()=>{
 const $=s=>document.querySelector(s),dialog=$('#card-dialog'),key='ksl.reader.v1';
 let authorized=false;let token='',reader='',ready=false,epoch=0,timer,controller,lastId='',connecting=false;
 const status=t=>$('#card-status').textContent=t;
 const feedback=t=>{const el=$('#scan-feedback');if(el)el.textContent=t};
 const controls=document.createElement('div');
 controls.innerHTML='<label class="field">รหัสเชื่อมต่อจาก Card Bridge<input id="bridge-token" type="password" autocomplete="off" placeholder="วางรหัสเชื่อมต่อ"></label><label><input id="bridge-remember" type="checkbox"> จำการเชื่อมต่อบนเครื่องนี้</label><button id="bridge-connect" class="secondary full" type="button">ตรวจสอบการเชื่อมต่อ</button><label class="field">เครื่องอ่าน<select id="bridge-reader" disabled></select></label><button id="bridge-done" class="primary full" type="button" disabled>เสร็จสิ้นการตั้งค่า</button><button id="bridge-forget" class="textbutton full" type="button">ลืมการเชื่อมต่อ</button>';
 controls.className='reader-controls';controls.style.cssText='display:grid;gap:12px';controls.hidden=true;$('#card-status').after(controls);
 const auth=document.createElement('form');auth.id='reader-auth';auth.autocomplete='off';
 auth.innerHTML='<label class="field">ชื่อผู้ใช้<input id="reader-user" autocomplete="off" required></label><label class="field">รหัสผ่าน<input id="reader-pass" type="password" autocomplete="new-password" required></label><div id="reader-auth-error" class="error" role="alert"></div><button class="primary full" type="submit">ยืนยันผู้ดูแล</button>';
 controls.before(auth);
 function lock(){authorized=false;controls.hidden=true;auth.hidden=false;$('.card-mock-note').hidden=true;$('#reader-user').value='';$('#reader-pass').value='';$('#reader-auth-error').textContent='';$('#bridge-token').value=''}
 auth.onsubmit=e=>{e.preventDefault();if($('#reader-user').value.trim()!=='admin'||$('#reader-pass').value!=='demo123'){$('#reader-auth-error').textContent='ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง';$('#reader-pass').value='';return}authorized=true;$('#reader-user').value='';$('#reader-pass').value='';auth.hidden=true;controls.hidden=false;$('.card-mock-note').hidden=false;openSettings()};

 $('#bridge-remember').style.cssText='width:20px;height:20px;min-height:0;vertical-align:middle;margin:0 6px 0 0';
 $('#card-reader-visual').hidden=true;
 $('.card-mock-note').textContent='เปิด Run-Web.cmd บน Windows เครื่องนี้ เมื่อตั้งค่าสำเร็จ กลับหน้า 02 แล้วเสียบบัตร ระบบจะอ่านให้อัตโนมัติ';
 function saved(){try{return JSON.parse(localStorage.getItem(key)||'null')}catch{return null}}
 const pref=saved();token=typeof pref?.token==='string'?pref.token:'';reader=typeof pref?.reader==='string'?pref.reader:'';ready=!!(token&&reader);
 function remember(){try{if($('#bridge-remember').checked&&ready)localStorage.setItem(key,JSON.stringify({token,reader}));else localStorage.removeItem(key)}catch{status('ใช้งานได้ แต่ไม่สามารถจำการเชื่อมต่อในเบราว์เซอร์นี้')}}
 function stop(){epoch++;clearTimeout(timer);controller?.abort()}
 function eligible(){return ready&&state.screen==='quota'&&!state.scanOpen&&!document.hidden&&!dialog.open}
 function schedule(delay=0){clearTimeout(timer);if(eligible())timer=setTimeout(poll,delay)}
 async function api(path,body){
  const abort=new AbortController();controller=abort;const timeout=setTimeout(()=>abort.abort(),10000);
  try{const r=await fetch('http://127.0.0.1:17861/api/'+path,{method:body?'POST':'GET',headers:{'X-Bridge-Token':token,...(body?{'Content-Type':'application/json'}:{})},...(body?{body:JSON.stringify(body)}:{}),signal:abort.signal,cache:'no-store'});
   if(r.status===401||r.status===403){const e=Error('ตรวจสอบรหัสเชื่อมต่อ และเปิดโปรแกรมด้วย Run-Web.cmd');e.auth=true;throw e}
   const data=await r.json();if(!r.ok)throw Error(data.error||'อ่านบัตรไม่สำเร็จ');return data;
  }catch(e){if(e instanceof TypeError||e.name==='AbortError')throw Error('เชื่อมต่อเครื่องอ่านไม่ได้ กรุณาเปิด Run-Web.cmd และอนุญาตการเข้าถึงเครือข่ายภายใน');throw e}finally{clearTimeout(timeout)}
 }
 async function poll(){
  if(!eligible())return;const g=epoch;let delay=1500;
  try{const data=await api('read',{reader});if(g!==epoch||!eligible())return;
   const id=data.citizenId;if(typeof id!=='string'||!/^\d{13}$/.test(id))throw Error('เลขบัตรไม่ครบ 13 หลัก กรุณาเสียบบัตรใหม่');
   if(id!==lastId){lastId=id;state.idNumber=id;state.inputKind='id';state.quota='';$('#quota').value=id;$('#error').textContent='';feedback('อ่านบัตรสำเร็จ กรุณานำบัตรออก แล้วกดตกลง');document.dispatchEvent(new Event('kiosk:card-read'))}
  }catch(e){if(g!==epoch)return;
   if(/0x8010000C|0x80100069|ยังไม่ได้เสียบบัตร|บัตรถูกถอด/.test(e.message)){lastId='';if(state.inputKind!=='id')feedback('เครื่องอ่านพร้อม · เสียบบัตรเพื่ออ่านอัตโนมัติ')}
   else{feedback(e.message);delay=5000;if(e.auth)ready=false}
  }finally{if(g===epoch)schedule(delay)}
 }
 function signal(open){state.scanOpen=open;document.dispatchEvent(new Event('kiosk:scanner'))}
 function close(){lock();stop();connecting=false;$('#bridge-token').value='';if(dialog.open)dialog.close();signal(false);schedule();$('#reader-settings')?.focus({preventScroll:true})}
 async function connect(){
  if(!authorized)return;
  stop();const g=epoch;ready=false;token=$('#bridge-token').value.trim();if(!token){status('กรุณาใส่รหัสเชื่อมต่อ');return}
  connecting=true;$('#bridge-connect').disabled=true;$('#bridge-done').disabled=true;$('#bridge-reader').disabled=true;status('กำลังตรวจสอบเครื่องอ่าน…');
  try{const data=await api('readers');if(g!==epoch)return;const readers=Array.isArray(data.readers)?data.readers.filter(x=>typeof x==='string'):[];
   $('#bridge-reader').replaceChildren(...readers.map(x=>new Option(x,x)));
   if(!readers.length){status('ไม่พบเครื่องอ่าน กรุณาเสียบ USB แล้วตรวจสอบอีกครั้ง');return}
   reader=readers.includes(reader)?reader:readers[0];$('#bridge-reader').value=reader;ready=true;$('#bridge-reader').disabled=false;$('#bridge-done').disabled=false;remember();status('ตั้งค่าสำเร็จ กดเสร็จสิ้น แล้วเสียบบัตรที่หน้า 02 ได้เลย');
  }catch(e){if(g===epoch)status(e.message)}finally{if(g===epoch){connecting=false;$('#bridge-connect').disabled=false}}
 }
 function openSettings(){if(!authorized)return;stop();$('#bridge-token').value=token;$('#bridge-remember').checked=!!saved();$('#bridge-connect').disabled=false;$('#bridge-done').disabled=!ready;$('#bridge-reader').replaceChildren(...(reader?[new Option(reader,reader)]:[]));$('#bridge-reader').value=reader;$('#bridge-reader').disabled=!ready;$('#card-title').textContent='ตั้งค่าเครื่องอ่านบัตร';$('#card-cancel').textContent='กลับหน้ากรอกเลข';status(ready?'พร้อมอ่านอัตโนมัติเมื่อกลับหน้า 02':'ใส่รหัสเชื่อมต่อ แล้วตรวจสอบเครื่องอ่าน');}
 function open(){if(state.screen!=='quota'||state.scanOpen)return;stop();lock();$('#card-title').textContent='ยืนยันผู้ดูแล';status('กรุณาระบุชื่อผู้ใช้และรหัสผ่านก่อนเข้าตั้งค่าเครื่องอ่าน');$('#card-cancel').textContent='ยกเลิก';signal(true);dialog.showModal();$('#reader-user').focus()}
 $('#bridge-connect').onclick=connect;$('#bridge-done').onclick=close;
 $('#bridge-reader').onchange=()=>{reader=$('#bridge-reader').value;lastId='';remember()};$('#bridge-remember').onchange=remember;
 $('#bridge-token').oninput=()=>{stop();ready=false;connecting=false;$('#bridge-connect').disabled=false;$('#bridge-done').disabled=true};
 $('#bridge-forget').onclick=()=>{stop();try{localStorage.removeItem(key)}catch{}token='';reader='';lastId='';ready=false;$('#bridge-token').value='';$('#bridge-remember').checked=false;$('#bridge-reader').replaceChildren();$('#bridge-reader').disabled=true;$('#bridge-done').disabled=true;$('#bridge-connect').disabled=false;status('ลืมการเชื่อมต่อแล้ว');feedback('')};
 $('#reader-settings').onclick=open;$('#card-close').onclick=close;$('#card-cancel').onclick=close;dialog.addEventListener('cancel',e=>{e.preventDefault();close()});
 document.addEventListener('kiosk:screen',()=>{$('#reader-settings').hidden=state.screen!=='quota';stop();if(dialog.open)close();schedule()});
 document.addEventListener('kiosk:scanner',()=>{stop();schedule()});
 document.addEventListener('visibilitychange',()=>{stop();if(document.hidden&&dialog.open)close();schedule()});window.addEventListener('pagehide',()=>{lock();stop()});$('#reader-settings').hidden=state.screen!=='quota';schedule();
})();
