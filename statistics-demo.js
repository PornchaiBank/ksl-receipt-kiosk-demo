// Display-only sample statistics. No API requests, no device data, no stored ratings.
(()=>{
 const rows=[['01','บริษัท น้ำตาลขอนแก่น จำกัด (มหาชน) สาขาน้ำพอง',300,220,35,15],['02','บริษัท น้ำตาลขอนแก่น จำกัด (มหาชน) สาขาวังสะพุง',280,205,35,12],['03','บริษัท น้ำตาลนิวกว้างสุ้นหลี จำกัด',230,165,31,11],['04','บริษัท โรงงานน้ำตาลนิวกรุงไทย จำกัด',210,150,30,9],['05','บริษัท น้ำตาลท่ามะกา จำกัด',180,124,31,7]];
 const face=i=>`<svg class="rating-face" viewBox="0 0 120 120" aria-hidden="true" focusable="false"><circle class="face-disc" cx="60" cy="60" r="53"/><circle cx="42" cy="47" r="5" fill="currentColor"/><circle cx="78" cy="47" r="5" fill="currentColor"/><path d="${['M 36 68 C 44 88 76 88 84 68','M 39 76 H 81','M 36 84 C 44 64 76 64 84 84'][i]}" fill="none" stroke="currentColor" stroke-width="5" stroke-linecap="round"/></svg>`;
 const number=x=>Number(x).toLocaleString('th-TH');
 const activeCode=code=>code||(typeof state!=='undefined'&&state.companyCode)||'';
 function headerMarkup(code){const r=rows.find(x=>x[0]===activeCode(code));if(!r)return '';return '<div class="company-rating-summary"><span class="company-rating-label">ประเมิน '+number(r[3]+r[4]+r[5])+'</span><span class="company-rating-values">'+r.slice(3).map((n,i)=>'<span class="company-rating-item company-rating-'+i+'" aria-label="'+['ดีมาก','พอใช้','ควรปรับปรุง'][i]+' '+n+'">'+face(i)+'<span>'+number(n)+'</span></span>').join('')+'</span></div>'}
 function updateHeader(){const tag=document.querySelector('#companyTag');if(!tag)return;tag.querySelector('.company-rating-summary')?.remove();const markup=headerMarkup();if(markup)tag.insertAdjacentHTML('afterbegin',markup);}
 document.addEventListener('kiosk:screen',updateHeader);updateHeader();
 window.KSLStatisticsDemo={face,headerMarkup,mount(root,companyCode){
  const row=rows.find(x=>x[0]===activeCode(companyCode));
  if(!row){root.innerHTML='<p class="stats-empty">ไม่พบข้อมูลบริษัทที่เข้าสู่ระบบ กรุณาเข้าสู่ระบบใหม่</p>';return;}
  const [code,company,visits,good,fair,poor]=row;
  const rated=good+fair+poor,unrated=Math.max(0,visits-rated);
  const percent=value=>rated?100*value/rated:0;
  root.innerHTML=`<div class="stats-demo-label">ข้อมูลจำลอง · ยังไม่เชื่อมต่อ Server</div><div class="stats-company-context" data-company-code="${code}"><span>บริษัทที่เข้าสู่ระบบ</span><strong>${company}</strong></div><div class="stats-metrics" aria-live="polite">${[['ครั้งใช้งาน',visits,'รอบที่ค้นหาโควต้าผ่าน'],['ตอบแบบประเมิน',rated,(visits?100*rated/visits:0).toFixed(1)+'% ของครั้งใช้งาน'],['ยังไม่ประเมิน',unrated,'รวมรายการระหว่างใช้งาน']].map(([label,value,note])=>`<div class="stats-metric"><span>${label}</span><strong>${number(value)}</strong><small>${note}</small></div>`).join('')}</div><section class="stats-panel"><h3>ความพึงพอใจต่อการใช้บริการ</h3><div class="stats-scores">${[['ดีมาก',good],['พอใช้',fair],['ควรปรับปรุง',poor]].map(([label,value],i)=>`<div class="stats-score stats-score-${i}"><span class="stats-face" aria-hidden="true">${face(i)}</span><h4>${label}</h4><div class="stats-count"><strong>${number(value)}</strong><span>${percent(value).toFixed(1)}%</span></div><div class="stats-track"><div style="width:${percent(value)}%"></div></div></div>`).join('')}</div><p class="stats-caption">เปอร์เซ็นต์คำนวณจากรายการที่ตอบแบบประเมิน</p></section>`;
 }};
})();
