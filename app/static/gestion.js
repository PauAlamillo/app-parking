const state={mode:"owner",view:"home"};
const $=(q,e=document)=>e.querySelector(q);
const $$=(q,e=document)=>[...e.querySelectorAll(q)];
const photos=["/static/media/garage-ramp.jpg","/static/media/garage-interior.jpg","/static/media/garage-entry.jpg","/static/media/garage-car.jpg"];
const spaces=[
  {id:"BCN-001",name:"C/ Aragó 182",city:"Barcelona",price:"2,55 €/h",status:"Activa",access:"Apertura asistida",security:"Protección alta",photo:photos[0]},
  {id:"BCN-014",name:"Travessera de Gràcia 91",city:"Barcelona",price:"2,20 €/h",status:"Activa",access:"Conserje",security:"Muy segura",photo:photos[1]},
  {id:"BCN-018",name:"C/ Numància 47",city:"Barcelona",price:"1,85 €/h",status:"Revisar",access:"Mando controlado",security:"Verificada",photo:photos[2]},
  {id:"MAD-004",name:"C/ Atocha 76",city:"Madrid",price:"2,95 €/h",status:"Activa",access:"Conserje 24 h",security:"Protección alta",photo:photos[3]}
];
const owners=[
  {name:"Laura García",contact:"laura@ejemplo.es",spaces:2,status:"Activa"},
  {name:"Jordi Serra",contact:"jordi@ejemplo.es",spaces:1,status:"Activa"},
  {name:"Marta Ruiz",contact:"marta@ejemplo.es",spaces:3,status:"Pendiente"}
];
const reservations=[
  {space:"C/ Aragó 182",when:"Hoy · 09:00–14:00",driver:"4821 MZX",amount:"14,50 €"},
  {space:"Travessera de Gràcia 91",when:"Hoy · 16:00–19:00",driver:"3912 KLP",amount:"7,26 €"},
  {space:"C/ Numància 47",when:"Mañana · 08:30–12:30",driver:"7104 NTR",amount:"8,14 €"}
];
function toast(msg){const t=$("#toast");t.textContent=msg;t.classList.add("show");clearTimeout(window._t);window._t=setTimeout(()=>t.classList.remove("show"),2000)}
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
  if(mode==="owner"&&state.view==="owners")showView("home");
  if(mode==="owner"&&state.view==="promo")showView("home");
}
function showView(view){
  state.view=view;
  $$(".view").forEach(v=>v.classList.toggle("active",v.id==="view-"+view));
  $$(".nav-item,.mobile-manage-nav button").forEach(b=>b.classList.toggle("active",b.dataset.view===view));
  window.scrollTo({top:0,behavior:"smooth"});
}
function renderSchedule(){
  const days=[["Lunes","08:00–17:15",true],["Martes","08:00–17:15",true],["Miércoles","08:00–17:15",true],["Jueves","08:00–17:15",true],["Viernes","08:00–16:30",true],["Sábado","No disponible",false],["Domingo","No disponible",false]];
  $("#scheduleList").innerHTML=days.map(d=>`<div class="schedule-row"><div><b>${d[0]}</b><small>${d[1]}</small></div><button class="toggle ${d[2]?"on":""}" aria-label="Disponibilidad"></button></div>`).join("");
  $$(".toggle").forEach(t=>t.addEventListener("click",()=>t.classList.toggle("on")));
}
function renderSpaces(){
  $("#spaceCards").innerHTML=spaces.map((s,i)=>`
    <article class="manage-space-card">
      <img src="${s.photo}" alt="">
      <div class="manage-space-body">
        <div class="manage-space-top"><div><h3>${s.name}</h3><p>${s.id} · ${s.city}</p></div><span class="state-chip">${s.status}</span></div>
        <div class="manage-space-meta"><span>${s.security}</span><span>${s.access}</span><span>Return Shield</span></div>
        <div class="space-actions"><b>${s.price}</b><button data-edit="${s.id}">Gestionar →</button></div>
      </div>
    </article>`).join("");
  $$("[data-edit]").forEach(b=>b.addEventListener("click",()=>openModal("space",b.dataset.edit)));
}
function renderOwners(){
  $("#ownerCards").innerHTML=owners.map(o=>`
    <article class="person-card"><div class="person-top"><span class="person-avatar">${o.name.split(" ").map(x=>x[0]).join("").slice(0,2)}</span><div><h3>${o.name}</h3><p>${o.contact}</p></div></div><div class="person-stats"><span>${o.spaces} plaza${o.spaces!==1?"s":""}</span><span>${o.status}</span></div></article>`).join("");
}
function renderReservations(){
  $("#managementBookings").innerHTML=reservations.map(r=>`
    <article class="reservation-row"><div><h3>${r.space}</h3><p>${r.when} · matrícula ${r.driver}</p></div><strong>${r.amount}</strong></article>`).join("");
}
function openModal(kind,id=""){
  const box=$("#modalContent");
  if(kind==="space") box.innerHTML=`
    <span class="eyebrow">${id?"Editar plaza":"Nueva plaza"}</span><h2>${id?"Gestiona "+id:"Añade una plaza"}</h2><p>Solo pedimos lo imprescindible ahora. El resto se puede completar después.</p>
    <div class="form-grid">
      <div class="field full"><label>Dirección</label><input value="${id?"C/ Aragó 182":""}" placeholder="Calle, número, ciudad"></div>
      <div class="field"><label>Precio / hora</label><input value="${id?"2,55 €":""}" placeholder="2,00 €"></div>
      <div class="field"><label>Altura máxima</label><input value="${id?"2,05 m":""}" placeholder="2,00 m"></div>
      <div class="field"><label>Acceso</label><select><option>Apertura asistida</option><option>Conserje</option><option>Código temporal</option><option>Mando controlado</option></select></div>
      <div class="field"><label>Tipo</label><select><option>Garaje comunitario</option><option>Box privado</option><option>Exterior</option></select></div>
      <div class="field full"><button class="primary" data-save>Guardar plaza</button></div>
    </div>`;
  if(kind==="owner") box.innerHTML=`
    <span class="eyebrow">Invitación</span><h2>Invita a un propietario</h2><p>Recibirá un enlace para completar y validar su plaza desde el móvil.</p>
    <div class="form-grid">
      <div class="field"><label>Nombre</label><input placeholder="Nombre"></div><div class="field"><label>Email o móvil</label><input placeholder="Contacto"></div>
      <div class="field full"><label>Mensaje</label><textarea rows="3">Te invito a activar tu plaza en App Parking y aprovechar las horas en que está libre.</textarea></div>
      <div class="field full"><button class="primary" data-save>Preparar invitación</button></div>
    </div>`;
  if(kind==="import") box.innerHTML=`
    <span class="eyebrow">Importación</span><h2>Importa varias plazas</h2><p>CSV primero, sin integraciones externas. Validaremos los datos antes de guardar.</p>
    <div class="form-grid"><div class="field full"><label>Archivo CSV</label><input id="csvInput" type="file" accept=".csv,text/csv"></div><div class="field full"><div id="csvFeedback"></div></div><div class="field full"><button class="primary" data-save>Revisar importación</button></div></div>`;
  $("#modalBackdrop").hidden=false;
  const save=$("[data-save]",box);if(save)save.addEventListener("click",()=>{toast("Guardado en la demo");closeModal()});
  const csv=$("#csvInput",box);if(csv)csv.addEventListener("change",()=>{const f=csv.files?.[0];$("#csvFeedback").textContent=f?f.name+" listo para revisar":""});
}
function closeModal(){$("#modalBackdrop").hidden=true}
$$(".nav-item,.mobile-manage-nav button").forEach(b=>b.addEventListener("click",()=>showView(b.dataset.view)));
$$(".mode-btn").forEach(b=>b.addEventListener("click",()=>setMode(b.dataset.mode)));
$$("[data-open]").forEach(b=>b.addEventListener("click",()=>openModal(b.dataset.open)));
$("#closeModal").addEventListener("click",closeModal);
$("#modalBackdrop").addEventListener("click",e=>{if(e.target.id==="modalBackdrop")closeModal()});
$("#releaseNow").addEventListener("click",()=>toast("Tu plaza queda disponible hasta las 17:15"));
$("#needEarlier").addEventListener("click",()=>toast("Return Shield actualizado · demo"));
$("#shareButton").addEventListener("click",()=>navigator.clipboard?.writeText(location.origin+"/gestion").then(()=>toast("Enlace copiado")).catch(()=>toast("Enlace listo para compartir")));
$("#copyBanner").addEventListener("click",()=>navigator.clipboard?.writeText("Encuentra parking privado con App Parking.").then(()=>toast("Texto copiado")));
$("#copyPromo").addEventListener("click",()=>navigator.clipboard?.writeText(location.origin+"/r/cuenta-demo").then(()=>toast("Enlace copiado")));
document.addEventListener("keydown",e=>{if(e.key==="Escape")closeModal()});
renderSchedule();renderSpaces();renderOwners();renderReservations();setMode("owner");