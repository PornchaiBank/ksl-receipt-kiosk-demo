// This visual rest screen is only active while the quota entry page is open.
(()=>{
 const IDLE_DELAY_MS=60000;
 const overlay=document.querySelector('#screensaver');
 const wake=document.querySelector('#wake-screen');
 const preview=document.querySelector('#idle-preview');
 const shell=document.querySelector('.shell');
 let timer=null,active=false,lastActivity=Date.now();
 const timeFormat=new Intl.DateTimeFormat('th-TH',{hour:'2-digit',minute:'2-digit',timeZone:'Asia/Bangkok'});
 const dateFormat=new Intl.DateTimeFormat('th-TH',{weekday:'long',day:'numeric',month:'long',year:'numeric',timeZone:'Asia/Bangkok'});
 function updateClock(){const now=new Date();document.querySelector('#idle-clock').textContent=timeFormat.format(now);document.querySelector('#idle-date').textContent=dateFormat.format(now)}
 function show(){
  if(state.screen!=='quota'||state.scanOpen||active)return;
  clearTimeout(timer);active=true;
  document.querySelector('#idle-company').textContent=companyInfo(state.company).name+' (รหัส '+companyInfo(state.company).code+')';
  updateClock();overlay.hidden=false;shell.inert=true;
  wake.focus({preventScroll:true});
 }
 function schedule(){
  clearTimeout(timer);
  if(state.screen==='quota'&&!state.scanOpen&&!active)timer=setTimeout(show,Math.max(0,IDLE_DELAY_MS-(Date.now()-lastActivity)));
 }
 function activity(){if(state.screen==='quota'&&!state.scanOpen&&!active){lastActivity=Date.now();schedule()}}
 function hide(){
  if(!active)return;
  overlay.hidden=true;active=false;shell.inert=false;
  lastActivity=Date.now();schedule();
 }
 document.addEventListener('kiosk:card-read',()=>{hide();activity()});
 wake.addEventListener('click',()=>{hide();document.querySelector('[data-key="1"]')?.focus({preventScroll:true})});
 preview.addEventListener('click',show);
 for(const event of ['pointerdown','keydown','wheel'])document.addEventListener(event,activity,{passive:true});
 // Pointer motion counts as use; throttle to avoid excessive timer churn.
 let lastMove=0;
 document.addEventListener('pointermove',()=>{const now=Date.now();if(now-lastMove>500){lastMove=now;activity()}},{passive:true});
 document.addEventListener('kiosk:screen',()=>{hide();preview.hidden=state.screen!=='quota';lastActivity=Date.now();schedule()});
 document.addEventListener('visibilitychange',()=>{if(!document.hidden&&state.screen==='quota'&&!state.scanOpen&&!active){if(Date.now()-lastActivity>=IDLE_DELAY_MS)show();else schedule()}});
 setInterval(()=>{if(active)updateClock()},1000);
 document.addEventListener('kiosk:scanner',()=>{lastActivity=Date.now();schedule()});
 preview.hidden=state.screen!=='quota';schedule();
})();

