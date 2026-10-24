// Keep all controls visible without cropping. Very short windows may scroll.
(()=>{
 const host=document.querySelector('main');
 let frame;
 function fit(){
  cancelAnimationFrame(frame);
  frame=requestAnimationFrame(()=>{
   const stage=host.querySelector('.screenin');if(!stage)return;
   if(window.matchMedia('(orientation: portrait)').matches){
    const padding=parseFloat(getComputedStyle(host).paddingTop)||0;
    const available=Math.max(1,host.clientHeight-padding*2);
    stage.style.transform='none';stage.style.top='';
    stage.style.height=stage.querySelector('.period-screen')?`${available}px`:'';
    return;
   }
   if(window.innerHeight<=420){stage.style.transform='none';stage.style.top='';stage.style.height='';return}
   const padding=parseFloat(getComputedStyle(host).paddingTop)||0;
   const available=Math.max(1,host.clientHeight-padding*2);
   if(stage.querySelector('.period-screen')){stage.style.height=`${available}px`;stage.style.transform='none';stage.style.top=`${padding}px`;return}
   stage.style.height='';
   const natural=stage.offsetHeight;
   const scale=Math.min(1,available/Math.max(1,natural));
   stage.style.transform=`scale(${scale})`;
   stage.style.top=`${padding+Math.max(0,(available-natural*scale)/2)}px`;
  });
 }
 new MutationObserver(fit).observe(host,{childList:true,subtree:true,characterData:true});
 new ResizeObserver(fit).observe(host);
 document.fonts.ready.then(fit);
 window.addEventListener('resize',fit);
 window.visualViewport?.addEventListener('resize',fit);
 document.addEventListener('kiosk:viewport',fit);
 document.addEventListener('kiosk:screen',()=>{if(window.matchMedia('(orientation: portrait)').matches)host.scrollTop=0;fit()});
 window.addEventListener('orientationchange',fit);
 fit();
})();
