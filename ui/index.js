const $=(s,e=document)=>e.querySelector(s),$$=(s,e=document)=>[...e.querySelectorAll(s)];
const Z={A:{n:'Zone A',v:'95%',s:'Healthy',c:'var(--g)',a:'No action needed. Moisture is on target.',crop:'Spinach'},
B:{n:'Zone B',v:'27%',s:'Low Light',c:'var(--y)',a:'Increase light intensity to 80%.',crop:'Lettuce'},
C:{n:'Zone C',v:'21%',s:'Low Moisture',c:'var(--o)',a:'Start irrigation for 25 minutes.',crop:'Spinach'}};
let cur='C',irrigating=false;
const dlg=$('#dlg');
const toast=m=>{const t=$('#toast');t.textContent=m;t.classList.add('show');clearTimeout(toast.t);toast.t=setTimeout(()=>t.classList.remove('show'),2400)};
const renderIcons=()=>{if(window.lucide&&typeof window.lucide.createIcons==='function'){window.lucide.createIcons()}};
const open=(t,h)=>{$('#dt').textContent=t;$('#db').innerHTML=h;dlg.showModal();renderIcons()};
window.select=select;
window.toast=toast;
$('.x').onclick=()=>dlg.close();
dlg.addEventListener('click',e=>{if(e.target===dlg)dlg.close()});
function select(k){if(!Z[k])return;cur=k;irrigating=false;const z=Z[k];
 $$('.zone,.mk').forEach(e=>e.classList.toggle('sel',e.dataset.z===k));
 $('#pName').textContent=z.n;$('#pVal').textContent=z.v;$('#pStat').textContent=z.s;
 $('#pBar').style.width=z.v;$('#pIcon').style.color=z.c;$('#irr').textContent='Start Irrigation';
 const ddZ=$('#ddZone .ddb span');if(ddZ)ddZ.textContent=z.n;}
$$('.zone,.mk').forEach(e=>e.onclick=()=>select(e.dataset.z));
$('#irr').onclick=()=>{irrigating=!irrigating;$('#irr').textContent=irrigating?'Stop Irrigation':'Start Irrigation';
 toast(irrigating?`Simulated irrigation started in ${Z[cur].n}`:`Simulated irrigation stopped in ${Z[cur].n}`)};
$('#det').onclick=()=>{const z=Z[cur];open(`${z.n} details`,`<p>Crop: <b>${z.crop}</b></p><p>Status: <b>${z.s}</b></p><p>Reading: <b>${z.v}</b></p><p>Suggested: ${z.a}</p><p><small>Sample data only.</small></p>`)};
$('#rec').onclick=()=>open('Recommendation','<p>“Irrigation today can restore moisture balance within 48h.”</p><p>Affected zone: <b>Zone C</b></p><p>Suggested action: run irrigation for 25 minutes.</p><button class="btn" onclick="dlg.close();window.select(\'C\')">Show Zone C</button>');
$('#log').onclick=()=>open('Log activity','<label>Activity type<select><option>Irrigation</option><option>Fertilizing</option><option>Harvest</option><option>Inspection</option></select></label><label>Zone<select><option>Zone A</option><option>Zone B</option><option>Zone C</option></select></label><label>Notes<textarea rows="3"></textarea></label><button class="btn" onclick="dlg.close();window.toast(\'Activity logged\')">Save activity</button>');
$('#search').onclick=()=>open('Search','<input type="search" placeholder="Search zones, crops, reports" aria-label="Search" autofocus>');
$('#settings').onclick=()=>open('Settings','<label><span><input type="checkbox" id="ai" checked> Auto-irrigation</span></label><label><span><input type="checkbox" checked> Alerts</span></label>');
$('#menu').onclick=()=>open('Menu','<button class="btn" onclick="dlg.close()">Dashboard</button><button class="btn" onclick="dlg.close()">Reports</button><button class="btn" onclick="dlg.close()">Help</button>');
dlg.addEventListener('change',e=>{if(e.target.id==='ai')$('#auto').textContent=e.target.checked?'ON':'OFF'});
$('#theme').onclick=()=>document.body.classList.toggle('dark');
$$('.ri:not(#theme):not(#menu)').forEach(b=>b.onclick=()=>{$$('.ri.on').forEach(x=>x.classList.remove('on'));b.classList.add('on')});
$$('.tabs button').forEach(b=>b.onclick=()=>{$$('.tabs .on').forEach(x=>x.classList.remove('on'));b.classList.add('on')});
$$('.dd').forEach(d=>{const b=$('.ddb',d);b.onclick=e=>{e.stopPropagation();$$('.dd.open').forEach(x=>x!==d&&x.classList.remove('open'));d.classList.toggle('open')};
 $$('li',d).forEach(li=>li.onclick=()=>{$('span',b).textContent=li.textContent;d.classList.remove('open');if(li.dataset.z)select(li.dataset.z)})});
document.onclick=()=>$$('.dd.open').forEach(d=>d.classList.remove('open'));
[['r1','o1'],['r2','o2']].forEach(([r,o])=>{const i=$('#'+r),f=()=>{i.style.setProperty('--v',i.value+'%');$('#'+o).textContent=i.value+'%'};i.oninput=f;f()});
renderIcons();select('C');
