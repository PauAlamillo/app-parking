const state={
  spaces:[],allSpaces:[],me:null,bookings:[],selected:null,
  city:"Barcelona",sort:"security",resultView:"list",
  filters:{security:true,gated:false,cctv:false,ev:false,price:false}
};

const $=(q,el=document)=>el.querySelector(q);
const $$=(q,el=document)=>[...el.querySelectorAll(q)];
const api=async(path,opts={})=>{
  const res=await fetch(path,{headers:{"Content-Type":"application/json",...(opts.headers||{})},...opts});
  if(!res.ok){let msg="Ha ocurrido un error";try{const j=await res.json();msg=j.detail||msg}catch{}throw new Error(msg)}
  return res.json();
};
const money=n=>new Intl.NumberFormat("es-ES",{style:"currency",currency:"EUR"}).format(n);
const fmtDate=s=>new Intl.DateTimeFormat("es-ES",{day:"2-digit",month:"short",hour:"2-digit",minute:"2-digit"}).format(new Date(s));
const localValue=d=>{const z=new Date(d.getTime()-d.getTimezoneOffset()*60000);return z.toISOString().slice(0,16)};
const roundTime=(d,step=30)=>{const ms=step*60000;return new Date(Math.ceil(d.getTime()/ms)*ms)};
const photoFor=s=>["/static/media/garage-car.jpg","/static/media/garage-ramp.jpg","/static/media/garage-entry.jpg","/static/media/garage-interior.jpg"][(s.id-1)%4];
const securityTier=s=>s>=96?"Protección alta":s>=90?"Acceso muy controlado":s>=85?"Acceso verificado":"Verificado";
const securityShort=s=>s>=96?"Máxima trazabilidad":s>=90?"Identidad + acceso":s>=85?"Acceso controlado":"Verificado";
const walkMinutes=s=>Math.max(1,Math.round(s.distance_m/80));

function toast(msg){
  const el=$("#toast");el.textContent=msg;el.classList.add("show");
  clearTimeout(window.__toast);window.__toast=setTimeout(()=>el.classList.remove("show"),2200);
}
function setDefaultDates(){
  const start=roundTime(new Date(Date.now()+60*60000));
  const end=new Date(start.getTime()+3*3600000);
  $("#startInput").value=localValue(start);$("#endInput").value=localValue(end);
}
function features(s){
  const out=[];
  if(s.gated)out.push("Puerta cerrada");
  if(s.cctv)out.push("CCTV declarado");
  if(s.concierge)out.push("Conserje");
  if(s.lighting)out.push("Iluminado");
  if(s.ev_charger)out.push("Carga EV");
  if(s.covered)out.push("Cubierto");
  return out;
}
function sortSpaces(items){
  return [...items].sort((a,b)=>{
    if(state.sort==="distance")return a.distance_m-b.distance_m;
    if(state.sort==="price")return a.price_hour-b.price_hour;
    if(state.sort==="rating")return b.rating-a.rating;
    return b.security_score-a.security_score||a.distance_m-b.distance_m;
  });
}

function cardHTML(s){
  const fav=state.me?.favorites?.includes(s.id);
  const chips=features(s).slice(0,3).map(x=>`<span>${x}</span>`).join("");
  return `
  <article class="space-card" data-space="${s.id}">
    <div class="space-media">
      <img src="${photoFor(s)}" alt="" loading="lazy">
      <div class="media-shade"></div>
      <span class="card-trust"><i>✓</i>${securityTier(s.security_score)}</span>
      <button class="card-fav ${fav?"active":""}" data-fav="${s.id}" aria-label="Guardar">${fav?"♥":"♡"}</button>
      <span class="card-distance">${walkMinutes(s)} min a pie</span>
    </div>
    <div class="space-content">
      <div class="space-line">
        <div class="space-copy"><h3>${s.title}</h3><p>${s.approx_address} · ${s.neighborhood}</p></div>
        <div class="space-price"><strong>${money(s.price_hour)}</strong><small>/ hora</small></div>
      </div>
      <div class="security-summary">
        <div><span class="security-shield">✓</span><span><b>${securityShort(s.security_score)}</b><small>${s.access_method}</small></span></div>
        <span class="rating-inline"><i>★</i> ${s.rating} · ${s.reviews}</span>
      </div>
      <div class="card-features">${chips}</div>
      <div class="card-foot"><span>${s.partner?`Verificada por <strong>${s.partner}</strong>`:"Propietario verificado"}</span><span>Disponible hoy</span></div>
    </div>
  </article>`;
}

function bindCards(root=document){
  $$("[data-space]",root).forEach(card=>card.addEventListener("click",e=>{
    if(e.target.closest("[data-fav]"))return;
    openDetail(+card.dataset.space);
  }));
  $$("[data-fav]",root).forEach(btn=>btn.addEventListener("click",async e=>{
    e.stopPropagation();await toggleFavorite(+btn.dataset.fav);
  }));
}
function renderSpaces(){
  const items=sortSpaces(state.spaces);
  $("#resultsTitle").textContent=`Plazas en ${state.city||"España"}`;
  $("#resultsMeta").textContent=`${items.length} plazas demo · ${state.sort==="security"?"priorizando seguridad":state.sort==="distance"?"más cercanas primero":state.sort==="price"?"por precio":"mejor valoradas"}`;
  $("#spacesList").innerHTML=items.length?items.map(cardHTML).join(""):`
    <div class="empty-state"><span>⌕</span><h3>No encontramos plazas con estos filtros</h3><p>Quita algún filtro o prueba otra zona.</p></div>`;
  bindCards($("#spacesList"));
  renderPins(items);
}
function renderPins(items){
  $("#mapPins").innerHTML=items.map(s=>`
    <button class="map-pin ${s.security_score>=95?"secure":""}" style="left:${s.map_x}%;top:${s.map_y}%" data-pin="${s.id}">
      ${money(s.price_hour).replace(",00","")}
    </button>`).join("");
  $$("[data-pin]").forEach(pin=>{
    pin.addEventListener("mouseenter",()=>$$("[data-pin]").forEach(x=>x.classList.toggle("active",x===pin)));
    pin.addEventListener("click",()=>openDetail(+pin.dataset.pin));
  });
}
async function loadSpaces(){
  const p=new URLSearchParams();
  if(state.city)p.set("city",state.city);
  if(state.filters.security)p.set("security_min","85");
  if(state.filters.gated)p.set("gated","true");
  if(state.filters.cctv)p.set("cctv","true");
  if(state.filters.ev)p.set("ev","true");
  if(state.filters.price)p.set("max_price","2");
  try{state.spaces=await api("/api/spaces?"+p.toString());renderSpaces()}catch(e){toast(e.message)}
}
async function toggleFavorite(id){
  try{
    const r=await api("/api/favorites",{method:"POST",body:JSON.stringify({space_id:id})});
    state.me.favorites=state.me.favorites||[];
    state.me.favorites=r.active?[...new Set([...state.me.favorites,id])]:state.me.favorites.filter(x=>x!==id);
    renderSpaces();
    if($("#route-favorites").classList.contains("active"))renderFavorites();
    toast(r.active?"Guardada":"Eliminada de guardados");
  }catch(e){toast(e.message)}
}

function openDetail(id){
  const s=state.spaces.find(x=>x.id===id)||state.allSpaces.find(x=>x.id===id);
  if(!s)return;
  state.selected=s;
  const chips=features(s).map(x=>`<span>${x}</span>`).join("");
  $("#detailContent").innerHTML=`
    <div class="detail-hero">
      <img src="${photoFor(s)}" alt="">
      <button class="detail-close" data-close="detail">×</button>
      <span class="detail-trust">✓ ${securityTier(s.security_score)}</span>
    </div>
    <div class="detail-body">
      <div class="detail-heading">
        <div><h2>${s.title}</h2><p>${s.approx_address} · ${s.neighborhood}, ${s.city}</p></div>
        <div class="detail-price"><strong>${money(s.price_hour)}</strong><small>/ hora · ${money(s.price_day)} día</small></div>
      </div>

      <div class="detail-safety">
        <div class="detail-safety-top">
          <div><h3>Cómo protegemos esta reserva</h3><p>${s.public_access_note}</p></div>
          <strong>${s.security_score}/100</strong>
        </div>
        <div class="security-chips">${chips}</div>
      </div>

      <section class="detail-section">
        <h3>La plaza</h3>
        <p>${s.description}</p>
      </section>

      <section class="detail-section">
        <h3>Antes de reservar sabes esto</h3>
        <div class="spec-grid">
          <div class="spec"><span>Altura máxima</span><b>${s.max_height_cm?(s.max_height_cm/100).toFixed(2)+" m":"Sin límite"}</b></div>
          <div class="spec"><span>Medidas</span><b>${s.width_cm} × ${s.length_cm} cm</b></div>
          <div class="spec"><span>Método de acceso</span><b>${s.access_method}</b></div>
          <div class="spec"><span>Vehículos</span><b>${s.vehicle_sizes.join(" · ")}</b></div>
        </div>
      </section>

      <section class="detail-section">
        <h3>Privacidad del garaje</h3>
        <p>La dirección exacta y cualquier credencial sensible se mantienen ocultas mientras exploras. Solo se revelan cuando existe una reserva válida y dentro de la ventana necesaria.</p>
      </section>

      <section class="detail-section">
        <h3>Confianza</h3>
        <p>★ ${s.rating} sobre 5 · ${s.reviews} reseñas · ${s.bookings_count} estancias registradas.</p>
      </section>
    </div>
    <div class="book-bar"><div><p>Desde</p><b>${money(s.price_hour)} / hora</b></div><button id="openBooking">Reservar plaza</button></div>
  `;
  $("#detailSheet").hidden=false;
  $('[data-close="detail"]').addEventListener("click",closeDetail);
  $("#openBooking").addEventListener("click",()=>openBooking(s));
}
function closeDetail(){$("#detailSheet").hidden=true}
$("#detailSheet").addEventListener("click",e=>{if(e.target.id==="detailSheet")closeDetail()});

function openBooking(s){
  $("#bookingContent").innerHTML=`
    <button class="modal-close" data-close="booking">×</button>
    <span class="eyebrow">Reserva protegida</span>
    <h2>Confirma tu plaza</h2>
    <div class="booking-space">
      <div><b>${s.title}</b><small>${s.approx_address} · ${walkMinutes(s)} min a pie</small></div>
      <strong>✓ ${securityTier(s.security_score)}</strong>
    </div>
    <div class="time-grid">
      <label><span>Entrada</span><input id="modalStart" type="datetime-local" value="${$("#startInput").value}"></label>
      <label><span>Salida</span><input id="modalEnd" type="datetime-local" value="${$("#endInput").value}"></label>
    </div>
    <div class="verification-box"><span>✓</span><p><b>Tu identidad y vehículo están verificados</b>${state.me.vehicle_model} · ${state.me.vehicle_plate}</p></div>
    <div id="priceBreakdown" class="price-breakdown"></div>
    <button id="confirmBooking" class="booking-submit">Confirmar reserva · demo</button>
    <p class="booking-fineprint">No se procesa ningún pago real en este staging.</p>
  `;
  $("#bookingModal").hidden=false;closeDetail();
  $('[data-close="booking"]').addEventListener("click",()=>$("#bookingModal").hidden=true);
  $("#modalStart").addEventListener("change",()=>updatePrice(s));
  $("#modalEnd").addEventListener("change",()=>updatePrice(s));
  $("#confirmBooking").addEventListener("click",()=>createBooking(s));
  updatePrice(s);
}
function bookingCalc(s){
  const a=new Date($("#modalStart").value),b=new Date($("#modalEnd").value);
  const h=(b-a)/3600000;if(!Number.isFinite(h)||h<1)return null;
  const sub=s.price_hour*h,fee=Math.max(.75,sub*.10);
  return{h,sub,fee,total:sub+fee};
}
function updatePrice(s){
  const c=bookingCalc(s),box=$("#priceBreakdown"),btn=$("#confirmBooking");
  if(!c){box.innerHTML='<div class="price-line"><span>Selecciona al menos 1 hora</span></div>';btn.disabled=true;return}
  btn.disabled=false;
  box.innerHTML=`
    <div class="price-line"><span>${money(s.price_hour)} × ${c.h.toFixed(c.h%1?1:0)} h</span><b>${money(c.sub)}</b></div>
    <div class="price-line"><span>Servicio App Parking · demo</span><b>${money(c.fee)}</b></div>
    <div class="price-line total"><span>Total</span><b>${money(c.total)}</b></div>`;
}
async function createBooking(s){
  const btn=$("#confirmBooking");btn.disabled=true;btn.textContent="Confirmando…";
  try{
    await api("/api/bookings",{method:"POST",body:JSON.stringify({
      space_id:s.id,start_at:new Date($("#modalStart").value).toISOString(),end_at:new Date($("#modalEnd").value).toISOString()
    })});
    $("#bookingModal").hidden=true;toast("Reserva confirmada");await loadBookings();showRoute("bookings");
  }catch(e){toast(e.message);btn.disabled=false;btn.textContent="Confirmar reserva · demo"}
}
$("#bookingModal").addEventListener("click",e=>{if(e.target.id==="bookingModal")$("#bookingModal").hidden=true});

async function loadBookings(){
  try{state.bookings=await api("/api/bookings");renderBookings()}catch(e){toast(e.message)}
}
function renderBookings(){
  const root=$("#bookingsList");
  if(!state.bookings.length){
    root.innerHTML='<div class="empty-state"><span>▣</span><h3>Aún no tienes reservas</h3><p>Cuando reserves una plaza, aquí tendrás horarios, acceso y estado.</p></div>';return;
  }
  root.innerHTML=state.bookings.map(b=>`
    <article class="booking-card">
      <div>
        <span class="status-pill status-${b.status}">${({confirmed:"Confirmada",active:"Aparcado",completed:"Completada"}[b.status]||b.status)}</span>
        <h3>${b.title}</h3><p>${b.approx_address} · ${b.city}</p>
        <div class="booking-meta">
          <span>Entrada · ${fmtDate(b.start_at)}</span><span>Salida · ${fmtDate(b.end_at)}</span>
          <span>Seguridad ${b.security_score}/100</span><span>${money(b.total)}</span>
        </div>
        <div id="access-${b.id}"></div>
      </div>
      <div class="booking-actions">
        <button class="solid-btn" data-access="${b.id}">Ver acceso</button>
        ${b.status==="confirmed"?`<button class="soft-btn" data-checkin="${b.id}">He llegado</button>`:b.status==="active"?`<button class="soft-btn" data-checkout="${b.id}">He salido</button>`:""}
      </div>
    </article>`).join("");
  $$("[data-access]").forEach(x=>x.addEventListener("click",()=>loadAccess(+x.dataset.access)));
  $$("[data-checkin]").forEach(x=>x.addEventListener("click",()=>bookingAction(+x.dataset.checkin,"checkin")));
  $$("[data-checkout]").forEach(x=>x.addEventListener("click",()=>bookingAction(+x.dataset.checkout,"checkout")));
}
async function loadAccess(id){
  try{
    const r=await api("/api/bookings/"+id+"/access"),box=$("#access-"+id);
    box.innerHTML=r.locked?
      `<div class="access-card locked"><h4>🔒 Acceso protegido</h4><p>${r.message} Disponible: ${fmtDate(r.unlock_at)}</p></div>`:
      `<div class="access-card"><h4>${r.address}</h4><p><b>${r.access_method}</b><br>${r.instructions}</p></div>`;
  }catch(e){toast(e.message)}
}
async function bookingAction(id,action){
  try{await api("/api/bookings/"+id+"/"+action,{method:"POST",body:"{}"});toast(action==="checkin"?"Entrada registrada":"Salida registrada");await loadBookings()}catch(e){toast(e.message)}
}

function renderFavorites(){
  const ids=state.me?.favorites||[],items=state.allSpaces.filter(s=>ids.includes(s.id));
  const root=$("#favoritesList");
  root.innerHTML=items.length?items.map(cardHTML).join(""):'<div class="empty-state"><span>♡</span><h3>No has guardado plazas</h3><p>Marca el corazón de las que quieras tener a mano.</p></div>';
  bindCards(root);
}
function showRoute(route){
  $$(".route").forEach(x=>x.classList.toggle("active",x.id==="route-"+route));
  $$(".header-link,.mobile-nav button").forEach(x=>x.classList.toggle("active",x.dataset.route===route));
  if(route==="favorites")renderFavorites();
  if(route==="bookings")loadBookings();
  window.scrollTo({top:0,behavior:"smooth"});
}
function setResultView(view){
  state.resultView=view;
  $$(".view-toggle").forEach(x=>x.classList.toggle("active",x.dataset.resultView===view));
  $("#listView").classList.toggle("active",view==="list");
  $("#mapView").classList.toggle("active",view==="map");
}
async function init(){
  setDefaultDates();
  try{
    state.me=await api("/api/me");
    $("#profileName").textContent=state.me.name;
    $("#profileEmail").textContent=state.me.email;
    $("#trustScore").textContent=state.me.trust_score+"/100";
    $("#vehiclePlate").textContent=state.me.vehicle_plate;
    $("#vehicleModel").textContent=state.me.vehicle_model;
    state.allSpaces=await api("/api/spaces?security_min=0");
    await loadSpaces();await loadBookings();
  }catch(e){toast("No se pudo cargar la demo: "+e.message)}
}

$$("[data-route]").forEach(x=>x.addEventListener("click",e=>{e.preventDefault();showRoute(x.dataset.route)}));
$$("[data-result-view]").forEach(x=>x.addEventListener("click",()=>setResultView(x.dataset.resultView)));
$$("[data-filter]").forEach(btn=>btn.addEventListener("click",()=>{
  const k=btn.dataset.filter;state.filters[k]=!state.filters[k];btn.classList.toggle("active",state.filters[k]);loadSpaces();
}));
$("#searchButton").addEventListener("click",()=>{state.city=$("#cityInput").value.trim()||"Barcelona";loadSpaces()});
$("#cityInput").addEventListener("keydown",e=>{if(e.key==="Enter")$("#searchButton").click()});
$("#sortSelect").addEventListener("change",e=>{state.sort=e.target.value;renderSpaces()});
$("#securityInfo").addEventListener("click",()=>$("#infoModal").hidden=false);
$("#profileSecurityInfo").addEventListener("click",()=>$("#infoModal").hidden=false);
$('[data-close="info"]').addEventListener("click",()=>$("#infoModal").hidden=true);
$("#infoModal").addEventListener("click",e=>{if(e.target.id==="infoModal")$("#infoModal").hidden=true});
$("#recenterBtn").addEventListener("click",()=>toast("Vista centrada en "+state.city));
document.addEventListener("keydown",e=>{if(e.key==="Escape"){closeDetail();$("#bookingModal").hidden=true;$("#infoModal").hidden=true}});
init();
