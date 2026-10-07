const state={
  mode:"owner",view:"home",
  managementSpaces:[],managedSpaceId:null,availability:null,
  demoSpaces:[
    {id:"BCN-001",name:"C/ Aragó 182",city:"Barcelona",price:"2,55 €/h",status:"Activa",access:"Apertura asistida",security:"Protección alta",photo:"/static/media/garage-ramp.jpg"},
    {id:"BCN-014",name:"Travessera de Gràcia 91",city:"Barcelona",price:"2,20 €/h",status:"Activa",access:"Conserje",security:"Muy segura",photo:"/static/media/garage-interior.jpg"},
    {id:"BCN-018",name:"C/ Numància 47",city:"Barcelona",price:"1,85 €/h",status:"Revisar",access:"Mando controlado",security:"Verificada",photo:"/static/media/garage-entry.jpg"},
    {id:"MAD-004",name:"C/ Atocha 76",city:"Madrid",price:"2,95 €/h",status:"Activa",access:"Conserje 24 h",security:"Protección alta",photo:"/static/media/garage-car.jpg"}
  ]
};
const $=(q,e=document)=>e.querySelector(q);
const $$=(q,e=document)=>[...e.querySelectorAll(q)];
const api=async(path,opts={})=>{
  const res=await fetch(path,{headers:{"Content-Type":"application/json",...(opts.headers||{})},...opts});
  if(!res.ok){let msg="Ha ocurrido un error";try{const j=await res.json();msg=j.detail||msg}catch{}throw new Error(msg)}
  return res.json();
};
const dayNames=["Lunes","Martes","Miércoles","Jueves","Viernes","Sábado","Domingo"];
const pad=n=>String(n).padStart(2,"0");
const minuteToTime=m=>m==null?"—":`${pad(Math.floor(m/60))}:${pad(m%60)}`;
const timeToMinute=t=>{const [h,m]=t.split(":").map(Number);return h*60+m};
const localValue=d=>{const z=new Date(d.getTime()-d.getTimezoneOffset()*60000);return z.toISOString().slice(0,16)};
const photoFor=id=>["/static/media/garage-ramp.jpg","/static/media/garage-interior.jpg","/static/media/garage-entry.jpg","/static/media/garage-car.jpg"][(Number(id)-1)%4];

function toast(msg){
  const t=$("#toast");t.textContent=msg;t.classList.add("show");
  clearTimeout(window._t);window._t=setTimeout(()=>t.classList.remove("show"),2200);
}
function closeModal(){$("#modalBackdrop").hidden=true}
function showView(view){
  state.view=view;
  $$(".view").forEach(v=>v.classList.toggle("active",v.id==="view-"+view));
  $$(".nav-item,.mobile-manage-nav button").forEach(b=>b.classList.toggle("active",b.dataset.view===view));
  window.scrollTo({top:0,behavior:"smooth"});
}
function setMode(mode){
  state.mode=mode;
  $$(".mode-btn").forEach(b=>b.classList.toggle("active",b.dataset.mode===mode));
  $$(".pro-only").forEach(el=>el.hidden=mode!=="pro");
  $("#ownerHome").hidden=mode!=="owner";
  $("#proHome").hidden=mode!=="pro";
  $("#homeEyebrow").textContent=mode==="owner"?"Tu plaza hoy":"Tu cartera hoy";
  $("#homeTitle").textContent=mode==="owner"?"Todo bajo control.":"Tu oferta está creciendo.";
  $("#homeSubtitle").textContent=mode==="owner"?"Tu plaza se ofrece solo cuando tú has decidido que estará libre.":"Gestiona plazas, propietarios y resultados sin salir de App Parking.";
  $("#accountLabel").textContent=mode==="owner"?"Pau":"Cuenta profesional";
  $("#accountType").textContent=mode==="owner"?"Propietario verificado":"Partner verificado";
  if(mode==="owner"&&(state.view==="owners"||state.view==="promo"))showView("home");
  renderSpaces();
}
function renderOwnerStatus(){
  const a=state.availability;if(!a)return;
  const s=a.status;
  $("#shieldMinutes").textContent=a.return_shield_minutes;
  $("#shieldSelect").value=String(a.return_shield_minutes);
  $("#shieldDescription").textContent=`Return Shield bloquea nuevas reservas ${a.return_shield_minutes} min antes de tu regreso previsto.`;
  if(s.active_booking){
    $("#availabilityStatusText").textContent="Reserva activa";
    $("#availabilityUntil").textContent="Plaza ocupada ahora";
    return;
  }
  if(s.bookable_now){
    $("#availabilityStatusText").textContent="Disponible ahora";
    $("#availabilityUntil").textContent=s.today_end_minute!=null?`Hasta las ${minuteToTime(s.today_end_minute)}`:"Disponible";
    return;
  }
  if(s.today_start_minute!=null&&s.today_end_minute!=null){
    const now=new Date(),minutes=now.getHours()*60+now.getMinutes();
    $("#availabilityStatusText").textContent=minutes<s.today_start_minute?"Disponible más tarde":"Fuera de horario";
    $("#availabilityUntil").textContent=`Hoy · ${minuteToTime(s.today_start_minute)}–${minuteToTime(s.today_end_minute)}`;
  }else{
    $("#availabilityStatusText").textContent="No publicada hoy";
    $("#availabilityUntil").textContent="Hoy no está disponible";
  }
}
function renderSchedule(){
  if(!state.availability)return;
  $("#scheduleList").innerHTML=state.availability.weekly.map(item=>`
    <div class="schedule-row" data-day="${item.weekday}">
      <div><b>${dayNames[item.weekday]}</b><small>${item.enabled?"Se publica automáticamente":"No disponible"}</small></div>
      <div class="schedule-times">
        <input type="time" data-start="${item.weekday}" value="${minuteToTime(item.start_minute)}" ${item.enabled?"":"disabled"}>
        <span>→</span>
        <input type="time" data-end="${item.weekday}" value="${minuteToTime(item.end_minute)}" ${item.enabled?"":"disabled"}>
      </div>
      <button class="toggle ${item.enabled?"on":""}" data-toggle-day="${item.weekday}" aria-label="Activar disponibilidad"></button>
    </div>`).join("");
  $$("[data-toggle-day]").forEach(btn=>btn.addEventListener("click",()=>{
    const item=state.availability.weekly.find(x=>x.weekday===+btn.dataset.toggleDay);
    item.enabled=!item.enabled;renderSchedule();
  }));
  $$("[data-start]").forEach(inp=>inp.addEventListener("change",()=>{
    const item=state.availability.weekly.find(x=>x.weekday===+inp.dataset.start);item.start_minute=timeToMinute(inp.value);
  }));
  $$("[data-end]").forEach(inp=>inp.addEventListener("change",()=>{
    const item=state.availability.weekly.find(x=>x.weekday===+inp.dataset.end);item.end_minute=timeToMinute(inp.value);
  }));
  renderExceptions();
}
function renderExceptions(){
  const root=$("#exceptionList");if(!root||!state.availability)return;
  const items=state.availability.exceptions||[];
  root.innerHTML=items.length?items.slice(0,5).map(x=>`
    <div class="exception-item"><div><b>${x.date}</b><small>${x.note||"Excepción de calendario"}</small></div><span>${x.kind==="unavailable"?"No disponible":`${minuteToTime(x.start_minute)}–${minuteToTime(x.end_minute)}`}</span><button class="exception-delete" data-delete-exception="${x.date}" aria-label="Eliminar excepción">×</button></div>`
  ).join(""):'';
  $$("[data-delete-exception]",root).forEach(btn=>btn.addEventListener("click",async()=>{
    try{
      await api(`/api/management/spaces/${state.managedSpaceId}/exceptions/${btn.dataset.deleteException}`,{method:"DELETE"});
      toast("Excepción eliminada");await loadAvailability();
    }catch(e){toast(e.message)}
  }));
}
async function saveSchedule(){
  if(!state.managedSpaceId||!state.availability)return;
  try{
    await api(`/api/management/spaces/${state.managedSpaceId}/availability`,{
      method:"PUT",
      body:JSON.stringify({
        return_shield_minutes:+$("#shieldSelect").value,
        weekly:state.availability.weekly
      })
    });
    toast("Rutina guardada");
    await loadAvailability();
  }catch(e){toast(e.message)}
}
async function loadAvailability(){
  if(!state.managedSpaceId)return;
  state.availability=await api(`/api/management/spaces/${state.managedSpaceId}/availability`);
  renderOwnerStatus();renderSchedule();
}
async function loadOwnerData(){
  try{
    state.managementSpaces=await api("/api/management/spaces");
    if(state.managementSpaces.length){
      state.managedSpaceId=state.managementSpaces[0].id;
      await loadAvailability();
    }
    renderSpaces();
  }catch(e){toast("No se pudo cargar la gestión: "+e.message)}
}
function renderSpaces(){
  const root=$("#spaceCards");if(!root)return;
  if(state.mode==="owner"){
    root.innerHTML=state.managementSpaces.length?state.managementSpaces.map(s=>`
      <article class="manage-space-card">
        <img src="${photoFor(s.id)}" alt="">
        <div class="manage-space-body">
          <div class="manage-space-top"><div><h3>${s.address}</h3><p>Plaza #${s.id} · ${s.city}</p></div><span class="state-chip">${s.bookable_now?"Disponible":"Programada"}</span></div>
          <div class="manage-space-meta"><span>Seguridad ${s.security_score}/100</span><span>${s.access_method}</span><span>Shield ${s.return_shield_minutes} min</span></div>
          <div class="space-actions"><b>${s.price_hour.toFixed(2).replace(".",",")} €/h</b><button data-manage-space="${s.id}">Disponibilidad →</button></div>
        </div>
      </article>`).join(""):'<div class="empty-state">No tienes plazas todavía.</div>';
    $$("[data-manage-space]").forEach(b=>b.addEventListener("click",async()=>{state.managedSpaceId=+b.dataset.manageSpace;await loadAvailability();showView("home")}));
  }else{
    root.innerHTML=state.demoSpaces.map(s=>`
      <article class="manage-space-card"><img src="${s.photo}" alt=""><div class="manage-space-body"><div class="manage-space-top"><div><h3>${s.name}</h3><p>${s.id} · ${s.city}</p></div><span class="state-chip">${s.status}</span></div><div class="manage-space-meta"><span>${s.security}</span><span>${s.access}</span><span>Return Shield</span></div><div class="space-actions"><b>${s.price}</b><button data-open="space">Gestionar →</button></div></div></article>`
    ).join("");
    $$('[data-open="space"]',root).forEach(b=>b.addEventListener("click",()=>openGenericModal("space")));
  }
}
function openActionModal(kind){
  const box=$("#modalContent"),now=new Date();
  if(kind==="release"){
    let end=new Date(now.getTime()+4*3600000);
    const todayEnd=state.availability?.status?.today_end_minute;
    if(todayEnd!=null){
      const e=new Date();e.setHours(Math.floor(todayEnd/60),todayEnd%60,0,0);if(e>now)end=e;
    }
    box.innerHTML=`<span class="eyebrow">Liberar plaza</span><h2>¿Hasta cuándo estará libre?</h2><p>Este intervalo se publica aunque no coincida con tu rutina semanal.</p><div class="form-grid"><div class="field full"><label>Disponible hasta</label><input id="overrideEnd" type="datetime-local" value="${localValue(end)}"></div><div class="field full"><button class="primary" id="saveOverride">Liberar plaza</button></div></div>`;
    $("#modalBackdrop").hidden=false;
    $("#saveOverride").addEventListener("click",async()=>{
      try{
        await api(`/api/management/spaces/${state.managedSpaceId}/release`,{method:"POST",body:JSON.stringify({start_at:now.toISOString(),end_at:new Date($("#overrideEnd").value).toISOString()})});
        closeModal();toast("Plaza liberada");await loadAvailability();
      }catch(e){toast(e.message)}
    });
  }
  if(kind==="need"){
    const cutoff=new Date(now.getTime()+60*60000),end=new Date(now);end.setHours(23,59,59,0);
    box.innerHTML=`<span class="eyebrow">Necesito mi plaza</span><h2>¿A partir de qué hora?</h2><p>No cancelaremos reservas confirmadas. Si hay una dentro de esa franja, App Parking te avisará.</p><div class="form-grid"><div class="field full"><label>Bloquear desde</label><input id="needFrom" type="datetime-local" value="${localValue(cutoff)}"></div><div class="field full"><button class="primary" id="saveNeed">Bloquear nuevas reservas</button></div></div>`;
    $("#modalBackdrop").hidden=false;
    $("#saveNeed").addEventListener("click",async()=>{
      try{
        const from=new Date($("#needFrom").value),blockEnd=new Date(from);blockEnd.setHours(23,59,59,0);
        await api(`/api/management/spaces/${state.managedSpaceId}/need`,{method:"POST",body:JSON.stringify({start_at:from.toISOString(),end_at:blockEnd.toISOString()})});
        closeModal();toast("Disponibilidad cerrada");await loadAvailability();
      }catch(e){toast(e.message)}
    });
  }
  if(kind==="exception"){
    const tomorrow=new Date(now.getTime()+24*3600000);
    box.innerHTML=`<span class="eyebrow">Excepción</span><h2>Cambia un día concreto</h2><p>Útil para teletrabajo, vacaciones o un horario diferente.</p><div class="form-grid"><div class="field"><label>Fecha</label><input id="exceptionDate" type="date" value="${localValue(tomorrow).slice(0,10)}"></div><div class="field"><label>Ese día</label><select id="exceptionKind"><option value="unavailable">No disponible</option><option value="available">Horario especial</option></select></div><div class="field exception-time" hidden><label>Desde</label><input id="exceptionStart" type="time" value="08:00"></div><div class="field exception-time" hidden><label>Hasta</label><input id="exceptionEnd" type="time" value="18:00"></div><div class="field full"><label>Nota</label><input id="exceptionNote" placeholder="Ej. Trabajo desde casa"></div><div class="field full"><button class="primary" id="saveException">Guardar excepción</button></div></div>`;
    $("#modalBackdrop").hidden=false;
    $("#exceptionKind").addEventListener("change",()=>$$(".exception-time",box).forEach(x=>x.hidden=$("#exceptionKind").value!=="available"));
    $("#saveException").addEventListener("click",async()=>{
      const kindValue=$("#exceptionKind").value;
      const payload={date:$("#exceptionDate").value,kind:kindValue,note:$("#exceptionNote").value||null,start_minute:null,end_minute:null};
      if(kindValue==="available"){payload.start_minute=timeToMinute($("#exceptionStart").value);payload.end_minute=timeToMinute($("#exceptionEnd").value)}
      try{
        await api(`/api/management/spaces/${state.managedSpaceId}/exceptions`,{method:"POST",body:JSON.stringify(payload)});
        closeModal();toast("Excepción guardada");await loadAvailability();
      }catch(e){toast(e.message)}
    });
  }
}
function openGenericModal(kind){
  const box=$("#modalContent");
  if(kind==="space")box.innerHTML=`<span class="eyebrow">Nueva plaza</span><h2>Añade una plaza</h2><p>El alta completa se conectará al backend de plazas en el siguiente bloque.</p><div class="form-grid"><div class="field full"><label>Dirección</label><input placeholder="Calle, número, ciudad"></div><div class="field"><label>Precio / hora</label><input placeholder="2,00 €"></div><div class="field"><label>Altura máxima</label><input placeholder="2,00 m"></div><div class="field full"><button class="primary" data-demo-save>Guardar borrador</button></div></div>`;
  if(kind==="owner")box.innerHTML=`<span class="eyebrow">Invitación</span><h2>Invita a un propietario</h2><p>Recibirá un enlace para completar su plaza desde el móvil.</p><div class="form-grid"><div class="field"><label>Nombre</label><input placeholder="Nombre"></div><div class="field"><label>Email o móvil</label><input placeholder="Contacto"></div><div class="field full"><button class="primary" data-demo-save>Preparar invitación</button></div></div>`;
  if(kind==="import")box.innerHTML=`<span class="eyebrow">Importación</span><h2>Importa varias plazas</h2><p>CSV primero, sin integraciones externas.</p><div class="form-grid"><div class="field full"><label>Archivo CSV</label><input type="file" accept=".csv,text/csv"></div><div class="field full"><button class="primary" data-demo-save>Revisar importación</button></div></div>`;
  $("#modalBackdrop").hidden=false;
  const save=$("[data-demo-save]",box);if(save)save.addEventListener("click",()=>{toast("Guardado en la demo");closeModal()});
}
const owners=[{name:"Laura García",contact:"laura@ejemplo.es",spaces:2,status:"Activa"},{name:"Jordi Serra",contact:"jordi@ejemplo.es",spaces:1,status:"Activa"},{name:"Marta Ruiz",contact:"marta@ejemplo.es",spaces:3,status:"Pendiente"}];
const reservations=[{space:"C/ Aragó 182",when:"Hoy · 09:00–14:00",driver:"4821 MZX",amount:"14,50 €"},{space:"Travessera de Gràcia 91",when:"Hoy · 16:00–19:00",driver:"3912 KLP",amount:"7,26 €"},{space:"C/ Numància 47",when:"Mañana · 08:30–12:30",driver:"7104 NTR",amount:"8,14 €"}];
function renderOwners(){
  $("#ownerCards").innerHTML=owners.map(o=>`<article class="person-card"><div class="person-top"><span class="person-avatar">${o.name.split(" ").map(x=>x[0]).join("").slice(0,2)}</span><div><h3>${o.name}</h3><p>${o.contact}</p></div></div><div class="person-stats"><span>${o.spaces} plaza${o.spaces!==1?"s":""}</span><span>${o.status}</span></div></article>`).join("");
}
function renderReservations(){
  $("#managementBookings").innerHTML=reservations.map(r=>`<article class="reservation-row"><div><h3>${r.space}</h3><p>${r.when} · matrícula ${r.driver}</p></div><strong>${r.amount}</strong></article>`).join("");
}

$$(".nav-item,.mobile-manage-nav button").forEach(b=>b.addEventListener("click",()=>showView(b.dataset.view)));
$$(".mode-btn").forEach(b=>b.addEventListener("click",()=>setMode(b.dataset.mode)));
$$("[data-open]").forEach(b=>b.addEventListener("click",()=>openGenericModal(b.dataset.open)));
$("#closeModal").addEventListener("click",closeModal);
$("#modalBackdrop").addEventListener("click",e=>{if(e.target.id==="modalBackdrop")closeModal()});
$("#releaseNow").addEventListener("click",()=>openActionModal("release"));
$("#needEarlier").addEventListener("click",()=>openActionModal("need"));
$("#addException").addEventListener("click",()=>openActionModal("exception"));
$("#saveSchedule").addEventListener("click",saveSchedule);
$("#shareButton").addEventListener("click",()=>navigator.clipboard?.writeText(location.origin+"/gestion").then(()=>toast("Enlace copiado")).catch(()=>toast("Enlace listo")));
$("#copyBanner").addEventListener("click",()=>navigator.clipboard?.writeText("Encuentra parking privado con App Parking.").then(()=>toast("Texto copiado")));
$("#copyPromo").addEventListener("click",()=>navigator.clipboard?.writeText(location.origin+"/r/cuenta-demo").then(()=>toast("Enlace copiado")));
document.addEventListener("keydown",e=>{if(e.key==="Escape")closeModal()});

renderOwners();renderReservations();setMode("owner");loadOwnerData();