// Independent reader and printer configuration; shared authenticated Windows Bridge transport.
(()=>{
 const $=s=>document.querySelector(s),dialog=$('#card-dialog'),key='ksl.reader.v1';
 let authorized=false;let token='',reader='',ready=false,epoch=0,timer,lastId='',connecting=false,bridgeConnected=false;
 const controllers=new Set();
 const readerStatus=t=>$('#reader-status').textContent=t;
 const status=t=>$('#card-status').textContent=t;
 const feedback=t=>{const el=$('#scan-feedback');if(el)el.textContent=t};
 const controls=document.createElement('div');
 controls.innerHTML='<label class="field">รหัสเชื่อมต่อจาก Card Bridge<input id="bridge-token" type="password" autocomplete="off" placeholder="วางรหัสเชื่อมต่อ"></label><label><input id="bridge-remember" type="checkbox"> จำการเชื่อมต่อบนเครื่องนี้</label><button id="bridge-connect" class="secondary full" type="button">ตรวจสอบการเชื่อมต่อ</button><h3>เครื่องอ่านบัตรประชาชน</h3><label class="field">เครื่องอ่าน<select id="bridge-reader" disabled></select></label><button id="reader-refresh" class="secondary full" type="button" disabled>โหลดรายชื่อเครื่องอ่านใหม่</button><button id="reader-save" class="secondary full" type="button" disabled>บันทึกเครื่องอ่าน</button><button id="reader-disable" class="textbutton full" type="button">ไม่ใช้เครื่องอ่านบัตร</button><p id="reader-status" class="small" role="status"></p><button id="bridge-done" class="primary full" type="button" disabled>เสร็จสิ้นการตั้งค่า</button><button id="bridge-forget" class="textbutton full" type="button">ลืมการเชื่อมต่อ</button>';
 controls.className='reader-controls';controls.style.cssText='display:grid;gap:12px';controls.hidden=true;$('#card-status').after(controls);
 const printerControls=document.createElement('div');
 printerControls.style.cssText='display:grid;gap:10px;border-top:1px solid #cddfd4;padding-top:16px';
 printerControls.innerHTML='<h3>เครื่องพิมพ์รายงาน</h3><label class="field">เครื่องพิมพ์<select id="bridge-printer" disabled><option value="">ยังไม่ได้เชื่อมต่อ</option></select></label><button id="printer-refresh" class="secondary full" type="button" disabled>โหลดรายชื่อเครื่องพิมพ์ใหม่</button><button id="printer-save" class="primary full" type="button" disabled>บันทึกเครื่องพิมพ์</button><p class="small">Bridge v5 ส่งพิมพ์ตรงไปยังเครื่องที่เลือก ไม่เปลี่ยน Default Printer ของ Windows</p><p id="printer-status" role="status" class="small"></p>';
 const downloadControls=document.createElement('div');
 downloadControls.id='bridge-download-panel';downloadControls.style.cssText='display:grid;gap:10px;border-top:1px solid #cddfd4;padding-top:16px';
 downloadControls.innerHTML='<h3>ติดตั้ง Bridge บน Windows</h3><p class="small">ไฟล์เดียวรวมโปรแกรม Bridge, Run-Web.cmd และตัวติดตั้งเปิด Bridge อัตโนมัติหลัง Login</p><a id="bridge-download" class="secondary full" href="https://github.com/PornchaiBank/ksl-receipt-kiosk-demo/releases/download/bridge-v5-complete-20261029/KSL-Bridge-Windows-Complete-v5.zip">ดาวน์โหลด Bridge สำหรับ Windows (.zip · 60 MB)</a><p class="small">ดาวน์โหลดแล้วให้แตก ZIP และเปิด START-HERE-TH.txt · ไม่ต้อง Build และไม่ต้องคัดลอกจากเครื่องอื่น</p>';
 $('#bridge-done').before(printerControls,downloadControls);
 const printerStatus=text=>$('#printer-status').textContent=text;
 let selectedPrinter='';
 async function loadPrinters(){
  if(!authorized||!bridgeConnected)return;
  const g=epoch;$('#printer-refresh').disabled=true;$('#printer-save').disabled=true;$('#bridge-printer').disabled=true;
  try{const data=await api('printers');if(g!==epoch||!authorized)return;
   const list=Array.isArray(data.printers)?data.printers:[];$('#bridge-done').disabled=false;remember();
   selectedPrinter=data.selectedPrinter||'';
   $('#bridge-printer').replaceChildren(new Option('เลือกเครื่องพิมพ์',''),...list.filter(p=>typeof p.name==='string').map(p=>{const o=new Option(p.name,p.name);o.disabled=p.selectable===false;return o}));
   $('#bridge-printer').value=list.some(p=>p.name===selectedPrinter)?selectedPrinter:'';
   $('#bridge-printer').disabled=false;$('#printer-save').disabled=!$('#bridge-printer').value;
   printerStatus(selectedPrinter?'บันทึกไว้: '+selectedPrinter+($('#bridge-printer').value?'':' — ไม่พบเครื่องนี้ กรุณาเลือกใหม่'):'ยังไม่ได้บันทึกเครื่องพิมพ์');
  }catch(e){if(g===epoch)printerStatus(e.message.includes('404')?'กรุณาอัปเดต Card / Printer Bridge v5 แล้ว Build ใหม่':e.message)}
  finally{if(g===epoch)$('#printer-refresh').disabled=false}
 }
 $('#printer-refresh').onclick=loadPrinters;
 $('#bridge-printer').onchange=()=>{$('#printer-save').disabled=!$('#bridge-printer').value};
 $('#printer-save').onclick=async()=>{
  if(!authorized||!bridgeConnected)return;const printer=$('#bridge-printer').value;if(!printer)return;
  const g=epoch;$('#printer-save').disabled=true;
  try{const data=await api('printer',{printer});if(g!==epoch||!authorized)return;selectedPrinter=data.selectedPrinter;remember();printerStatus('บันทึกสำเร็จ: '+selectedPrinter+' · ใช้พิมพ์อัตโนมัติครั้งถัดไป')}
  catch(e){if(g===epoch)printerStatus(e.message)}finally{if(g===epoch)$('#printer-save').disabled=false}
 };
 const printerApi=(path,body)=>{if(!token)return Promise.reject(Error('กรุณาใส่รหัสเชื่อมต่อ Bridge ในหน้าตั้งค่าก่อน'));return api(path,body)};
 window.KSLPrinter={
  isPaired:()=>!!token,
  prepare:()=>printerApi('printer/prepare',{}),
  capabilities:()=>printerApi('capabilities'),
  submit:job=>printerApi('print-jobs',job),
  job:id=>printerApi('print-jobs/'+encodeURIComponent(id))
 };
 const auth=document.createElement('form');auth.id='reader-auth';auth.autocomplete='off';
 auth.innerHTML='<label class="field">ชื่อผู้ใช้<input id="reader-user" autocomplete="off" required></label><label class="field">รหัสผ่าน<input id="reader-pass" type="password" autocomplete="new-password" required></label><div id="reader-auth-error" class="error" role="alert"></div><button class="primary full" type="submit">ยืนยันผู้ดูแล</button>';
 controls.before(auth);
 const adminMenu=document.createElement('div');adminMenu.id='admin-menu';adminMenu.hidden=true;
 adminMenu.innerHTML='<button id="admin-statistics" type="button" class="primary full">▥ สถิติการใช้งานและการประเมิน</button><button id="admin-devices" type="button" class="secondary full">ตั้งค่าเครื่องอ่านบัตร / เครื่องพิมพ์</button>';
 const statsPanel=document.createElement('section');statsPanel.id='statistics-demo';statsPanel.hidden=true;
 const adminBack=document.createElement('button');adminBack.id='admin-back';adminBack.type='button';adminBack.className='secondary';adminBack.textContent='‹ กลับเมนูผู้ดูแล';adminBack.hidden=true;
 controls.before(adminBack,adminMenu,statsPanel);
 function showMenu(){if(!authorized)return;stop();controls.hidden=true;statsPanel.hidden=true;adminBack.hidden=true;adminMenu.hidden=false;dialog.classList.remove('stats-view');$('.card-mock-note').hidden=true;$('#card-title').textContent='เมนูผู้ดูแล';status('');$('#card-cancel').textContent='กลับหน้าบริการ';}
 adminBack.onclick=showMenu;
 $('#admin-devices').onclick=()=>{if(!authorized)return;adminMenu.hidden=true;controls.hidden=false;adminBack.hidden=false;$('.card-mock-note').hidden=false;openSettings()};
 $('#admin-statistics').onclick=()=>{if(!authorized)return;stop();adminMenu.hidden=true;controls.hidden=true;adminBack.hidden=false;statsPanel.hidden=false;dialog.classList.add('stats-view');$('#card-title').textContent='สถิติการใช้งานและการประเมิน';status('');window.KSLStatisticsDemo.mount(statsPanel)};
 function lock(){adminMenu.hidden=true;statsPanel.hidden=true;statsPanel.replaceChildren();adminBack.hidden=true;dialog.classList.remove('stats-view');authorized=false;controls.hidden=true;auth.hidden=false;$('.card-mock-note').hidden=true;$('#reader-user').value='';$('#reader-pass').value='';$('#reader-auth-error').textContent='';$('#bridge-token').value=''}
 auth.onsubmit=e=>{e.preventDefault();if($('#reader-user').value.trim()!=='admin'||$('#reader-pass').value!=='demo123'){$('#reader-auth-error').textContent='ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง';$('#reader-pass').value='';return}authorized=true;$('#reader-user').value='';$('#reader-pass').value='';auth.hidden=true;showMenu()};

 $('#bridge-remember').style.cssText='width:20px;height:20px;min-height:0;vertical-align:middle;margin:0 6px 0 0';
 $('#card-reader-visual').hidden=true;
 $('.card-mock-note').textContent='ตั้งค่าเฉพาะอุปกรณ์ที่ต้องการใช้ได้ เครื่องอ่านใช้บันทึกเครื่องอ่าน ส่วนเครื่องพิมพ์ใช้บันทึกเครื่องพิมพ์แยกกัน';
 function saved(){try{return JSON.parse(localStorage.getItem(key)||'null')}catch{return null}}
 const pref=saved();token=typeof pref?.token==='string'?pref.token:'';reader=typeof pref?.reader==='string'?pref.reader:'';ready=!!(token&&reader);
 function remember(){try{if($('#bridge-remember').checked&&token&&(ready||bridgeConnected))localStorage.setItem(key,JSON.stringify({token,reader}));else localStorage.removeItem(key)}catch{status('ใช้งานได้ แต่ไม่สามารถจำการเชื่อมต่อในเบราว์เซอร์นี้')}}
 function stop(){epoch++;clearTimeout(timer);controllers.forEach(c=>c.abort());controllers.clear()}
 function eligible(){return ready&&state.screen==='quota'&&!state.scanOpen&&!document.hidden&&!dialog.open}
 function schedule(delay=0){clearTimeout(timer);if(eligible())timer=setTimeout(poll,delay)}
 async function api(path,body){
  const abort=new AbortController();controllers.add(abort);const timeout=setTimeout(()=>abort.abort(),10000);
  try{const r=await fetch('http://127.0.0.1:17861/api/'+path,{method:body?'POST':'GET',headers:{'X-Bridge-Token':token,...(body?{'Content-Type':'application/json'}:{})},...(body?{body:JSON.stringify(body)}:{}),signal:abort.signal,cache:'no-store'});
   if(r.status===401||r.status===403){const e=Error('ตรวจสอบรหัสเชื่อมต่อ และเปิดโปรแกรมด้วย Run-Web.cmd');e.auth=true;throw e}
   if(r.status===404)throw Error('404: กรุณาอัปเดต Card / Printer Bridge v5 แล้ว Build ใหม่');const data=await r.json();if(!r.ok)throw Error(data.error||'คำขอไม่สำเร็จ');return data;
  }catch(e){if(e instanceof TypeError||e.name==='AbortError')throw Error('เชื่อมต่อ Bridge ไม่ได้ กรุณาเปิด Start-KSL.cmd และอนุญาตการเข้าถึงเครือข่ายภายใน');throw e}finally{clearTimeout(timeout);controllers.delete(abort)}
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
 async function loadReaders(){
  if(!authorized||!bridgeConnected)return;
  const g=epoch;$('#reader-refresh').disabled=true;$('#reader-save').disabled=true;$('#bridge-reader').disabled=true;readerStatus('กำลังโหลดเครื่องอ่าน…');
  try{const data=await api('readers');if(g!==epoch||!authorized)return;
   const readers=Array.isArray(data.readers)?data.readers.filter(x=>typeof x==='string'):[];
   $('#bridge-reader').replaceChildren(new Option('เลือกเครื่องอ่าน',''),...readers.map(x=>new Option(x,x)));
   $('#bridge-reader').value=readers.includes(reader)?reader:'';
   $('#bridge-reader').disabled=!readers.length;$('#reader-save').disabled=!$('#bridge-reader').value;
   readerStatus(!readers.length?'ไม่พบเครื่องอ่าน — ยังตั้งค่าและใช้เครื่องพิมพ์ได้':reader?'บันทึกไว้: '+reader+(readers.includes(reader)?'':' — ยังไม่พบเครื่องนี้'):'เลือกเครื่องอ่าน แล้วกดบันทึก');
   remember();
  }catch(e){if(g===epoch)readerStatus(e.message+' · ไม่กระทบการตั้งค่าเครื่องพิมพ์')}
  finally{if(g===epoch)$('#reader-refresh').disabled=false}
 }
 $('#reader-refresh').onclick=loadReaders;
 $('#reader-save').onclick=()=>{if(!authorized||!bridgeConnected||!$('#bridge-reader').value)return;reader=$('#bridge-reader').value;ready=true;lastId='';remember();readerStatus('บันทึกเครื่องอ่านแล้ว: '+reader)};
 $('#reader-disable').onclick=()=>{if(!authorized)return;reader='';ready=false;lastId='';$('#bridge-reader').value='';$('#reader-save').disabled=true;remember();readerStatus('ปิดใช้งานเครื่องอ่านบัตร · เครื่องพิมพ์ยังใช้งานได้')};
 async function connect(){
  if(!authorized)return;
  stop();const g=epoch;token=$('#bridge-token').value.trim();if(!token){status('กรุณาใส่รหัสเชื่อมต่อ Bridge');return}
  bridgeConnected=true;ready=!!reader;connecting=true;$('#bridge-connect').disabled=true;$('#bridge-done').disabled=false;
  status('ตั้งค่าเครื่องอ่านและเครื่องพิมพ์แยกกันได้ ไม่จำเป็นต้องมีทั้งสองอุปกรณ์');
  await Promise.allSettled([loadReaders(),loadPrinters()]);
  if(g===epoch){connecting=false;$('#bridge-connect').disabled=false}
 }
 function openSettings(){
  if(!authorized)return;stop();$('#bridge-token').value=token;$('#bridge-remember').checked=!!saved();$('#bridge-connect').disabled=false;$('#bridge-done').disabled=false;
  $('#card-title').textContent='ตั้งค่าอุปกรณ์';$('#card-cancel').textContent='กลับหน้ากรอกเลข';
  status('เครื่องอ่านและเครื่องพิมพ์ตั้งค่าอิสระต่อกัน ใช้รหัสเชื่อมต่อ Bridge ร่วมกัน');
  if(token){bridgeConnected=true;void Promise.allSettled([loadReaders(),loadPrinters()])}
 }
 function open(){if(state.screen!=='quota'||state.scanOpen)return;stop();lock();$('#card-title').textContent='ยืนยันผู้ดูแล';status('กรุณาระบุชื่อผู้ใช้และรหัสผ่านก่อนเปิดเมนูผู้ดูแล');$('#card-cancel').textContent='ยกเลิก';signal(true);dialog.showModal();$('#reader-user').focus()}
 $('#bridge-connect').onclick=connect;$('#bridge-done').onclick=close;
 $('#bridge-reader').onchange=()=>{$('#reader-save').disabled=!$('#bridge-reader').value};$('#bridge-remember').onchange=remember;
 $('#bridge-token').oninput=()=>{stop();$('#reader-refresh').disabled=true;$('#reader-save').disabled=true;$('#bridge-reader').disabled=true;ready=false;bridgeConnected=false;$('#bridge-printer').disabled=true;$('#printer-save').disabled=true;$('#printer-refresh').disabled=true;connecting=false;$('#bridge-connect').disabled=false;$('#bridge-done').disabled=true};
 $('#bridge-forget').onclick=()=>{stop();$('#reader-refresh').disabled=true;$('#reader-save').disabled=true;readerStatus('');try{localStorage.removeItem(key)}catch{}token='';reader='';lastId='';ready=false;bridgeConnected=false;$('#bridge-printer').replaceChildren(new Option('ยังไม่ได้เชื่อมต่อ',''));$('#bridge-printer').disabled=true;$('#printer-save').disabled=true;$('#printer-refresh').disabled=true;printerStatus('');$('#bridge-token').value='';$('#bridge-remember').checked=false;$('#bridge-reader').replaceChildren();$('#bridge-reader').disabled=true;$('#bridge-done').disabled=true;$('#bridge-connect').disabled=false;status('ลืมการเชื่อมต่อแล้ว');feedback('')};
 $('#reader-settings').onclick=open;$('#card-close').onclick=close;$('#card-cancel').onclick=close;dialog.addEventListener('cancel',e=>{e.preventDefault();close()});
 document.addEventListener('kiosk:screen',()=>{$('#reader-settings').hidden=state.screen!=='quota';stop();if(dialog.open)close();schedule()});
 document.addEventListener('kiosk:scanner',()=>{stop();schedule()});
 document.addEventListener('visibilitychange',()=>{stop();if(document.hidden&&dialog.open)close();schedule()});window.addEventListener('pagehide',()=>{lock();stop()});$('#reader-settings').hidden=state.screen!=='quota';schedule();
})();


