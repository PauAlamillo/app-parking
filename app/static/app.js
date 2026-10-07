const state={spaces:[],allSpaces:[],me:null,city:"Barcelona",filters:{gated:false,cctv:false,ev:false,price:false,security:true},sort:"security",selected:null,bookings:[]};

const $=(q,el=document)=>el.querySelector(q);
const $$=(q,el=document)=>[...el.querySelectorAll(q)];
const api=async(path,opts={})=>{const r=await fetch(path,{headers:{"Content-Type":"application/json",...(opts.headers||{})},...opts});if(!r.ok){let msg="Ha ocurrido un error";try{const j=await r.json();msg=j.detail||msg}catch{}throw new Error(msg)}return r.json()};
const toast=(msg)=>{const el=$("#toast");el.textContent=msg;el.classList.add("show");clearTimeout(window.__toast);window.__toast=setTimeout(()=>el.classList.remove("show"),2200)};
const money=n=>new Intl.NumberFormat("es-ES",{style:"currency",currency:"EUR"}).format(n);
const fmtDate=s=>new Intl.DateTimeFormat("es-ES",{day:"2-digit",month:"short",hour:"2-digit",minute:"2-digit"}).format(new Date(s));
const roundTime=(d,step=30)=>{const ms=step*60*1000;return new Date(Math.ceil(d.getTime()/ms)*ms)};
const localValue=d=>{const z=new Date(d.getTime()-d.getTimezoneOffset()*60000);return z.toISOString().slice(0,16)};

function setDefaultDates(){
  const now=roundTime(new Date(Date.now()+60*60*1000));
  const end=new Date(now.getTime()+3*60*60*1000);
  $("#startInput").value=localValue(now);$("#endInput").value=localValue(end);
}
function featureList(s){
  const f=[];if(s.gated)f.push("Puerta cerrada");if(s.cctv)f.push("CCTV");if(s.lighting)f.push("Iluminado");if(s.concierge)f.push("Conserje");if(s.ev_charger)f.push("Carga EV");if(s.covered)f.push("Cubierto");return f;
}
function securityLabel(score){return score>=96?"Protección alta":score>=90?"Muy seguro":score>=85?"Seguro":"Verificado"}
function garageVisual(extra=""){return '<span class="garage-line"></span><span class="garage-light"></span>'+extra}

function cardHTML(s,compact=false){
  const fav=state.me?.favorites?.includes(s.id);
  const features=featureList(s).slice(0,4).map(x=>'<span class="feature">'+x+'</span>').join("");
  return '<article class="space-card" data-space="'+s.id+'">'+
    '<div class="space-visual">'+garageVisual('<span class="visual-badge">'+securityLabel(s.security_score)+'</span>')+
    '<button class="fav-btn '+(fav?"active":"")+'" data-fav="'+s.id+'" aria-label="Guardar">'+(fav?"♥":"♡")+'</button></div>'+
    '<div class="space-body"><div class="space-top"><div class="space-title"><h3>'+s.title+'</h3><p>'+s.approx_address+' · '+Math.max(1,Math.round(s.distance_m/80))+' min andando</p></div>'+
    '<div class="price"><strong>'+money(s.price_hour)+'</strong><small>por hora</small></div></div>'+
    '<div class="security-row"><span class="security-score">'+s.security_score+'/100</span><span class="rating"><span>★</span> '+s.rating+' · '+s.reviews+' reseñas</span></div>'+
    '<div class="feature-row">'+features+'</div>'+
    (s.partner?'<div class="partner-line">Verificada por <b>'+s.partner+'</b></div>':'<div class="partner-line"><b>Propietario verificado</b></div>')+
    '</div></article>';
}

function sortSpaces(items){
  return [...items].sort((a,b)=>{
    if(state.sort==="distance")return a.distance_m-b.distance_m;
    if(state.sort==="price")return a.price_hour-b.price_hour;
    if(state.sort==="rating")return b.rating-a.rating;
    return b.security_score-a.security_score||a.distance_m-b.distance_m;
  });
}
async function loadSpaces(){
  const params=new URLSearchParams();
  if(state.city)params.set("city",state.city);
  if(state.filters.gated)params.set("gated","true");
  if(state.filters.cctv)params.set("cctv","true");
  if(state.filters.ev)params.set("ev","true");
  if(state.filters.price)params.set("max_price","2");
  if(state.filters.security)params.set("security_min","85");
  try{
    const spaces=await api("/api/spaces?"+params.toString());
    state.spaces=sortSpaces(spaces);renderSpaces();
  }catch(e){toast(e.message)}
}
function renderSpaces(){
  const list=$("#spacesList");const items=sortSpaces(state.spaces);
  $("#resultsTitle").textContent="Parking seguro en "+(state.city||"España");
  $("#resultsMeta").textContent=items.length+" plazas de demostración · ordenadas por "+({security:"seguridad",distance:"distancia",price:"precio",rating:"valoración"}[state.sort]);
  list.innerHTML=items.length?items.map(s=>cardHTML(s)).join(""):'<div class="empty-state"><span>⌖</span><h3>No hay plazas con estos filtros</h3><p>Prueba quitando algún filtro o cambia de ciudad.</p></div>';
  renderPins(items);bindCards(list);
}
function renderPins(items){
  $("#mapPins").innerHTML=items.map(s=>'<button class="map-pin '+(s.security_score>=95?"secure":"")+'" style="left:'+s.map_x+'%;top:'+s.map_y+'%" data-pin="'+s.id+'">'+money(s.price_hour).replace(",00","")+'</button>').join("");
  $$("[data-pin]").forEach(p=>{p.addEventListener("mouseenter",()=>highlightCard(+p.dataset.pin));p.addEventListener("click",()=>openDetail(+p.dataset.pin))});
}
function highlightCard(id){
  $$("[data-pin]").forEach(x=>x.classList.toggle("active",+x.dataset.pin===id));
  const card=$('[data-space="'+id+'"]');if(card)card.scrollIntoView({block:"nearest",behavior:"smooth"});
}
function bindCards(root=document){
  $$("[data-space]",root).forEach(card=>card.addEventListener("click",e=>{if(e.target.closest("[data-fav]"))return;openDetail(+card.dataset.space)}));
  $$("[data-fav]",root).forEach(b=>b.addEventListener("click",async e=>{e.stopPropagation();await toggleFav(+b.dataset.fav)}));
}
async function toggleFav(id){
  try{
    const r=await api("/api/favorites",{method:"POST",body:JSON.stringify({space_id:id})});
    state.me.favorites=state.me.favorites||[];if(r.active){if(!state.me.favorites.includes(id))state.me.favorites.push(id)}else state.me.favorites=state.me.favorites.filter(x=>x!==id);
    renderSpaces();if($("#route-favorites").classList.contains("active"))renderFavorites();toast(r.active?"Guardada":"Eliminada de guardados")
  }catch(e){toast(e.message)}
}

function openDetail(id){
  const s=state.spaces.find(x=>x.id===id)||state.allSpaces.find(x=>x.id===id);if(!s)return;
  state.selected=s;
  const chips=featureList(s).map(x=>"<span>"+x+"</span>").join("");
  $("#detailContent").innerHTML=
    '<div class="detail-hero">'+garageVisual()+'<button class="detail-close" data-close="detail">×</button><span class="detail-badge">✓ '+securityLabel(s.security_score)+' · '+s.security_score+'/100</span></div>'+
    '<div class="detail-body"><div class="detail-heading"><div><h2>'+s.title+'</h2><p>'+s.approx_address+' · '+s.neighborhood+', '+s.city+'</p></div><div class="detail-price"><strong>'+money(s.price_hour)+'</strong><small>/ hora · '+money(s.price_day)+' día</small></div></div>'+
    '<div class="detail-security"><div class="detail-security-head"><div><h3>Seguridad de esta plaza</h3><p>'+s.public_access_note+'</p></div><strong>'+s.security_score+'</strong></div><div class="security-chips">'+chips+'</div></div>'+
    '<div class="detail-section"><h3>Lo que vas a encontrar</h3><p>'+s.description+'</p></div>'+
    '<div class="detail-section"><h3>Medidas y acceso</h3><div class="spec-grid">'+
      '<div class="spec"><span>Altura máx.</span><b>'+(s.max_height_cm?(s.max_height_cm/100).toFixed(2)+" m":"Sin límite")+'</b></div>'+
      '<div class="spec"><span>Plaza</span><b>'+s.width_cm+' × '+s.length_cm+' cm</b></div>'+
      '<div class="spec"><span>Acceso</span><b>'+s.access_method+'</b></div>'+
      '<div class="spec"><span>Vehículos</span><b>'+s.vehicle_sizes.join(" · ")+'</b></div>'+
    '</div></div>'+
    '<div class="detail-section"><h3>Privacidad del garaje</h3><p>La dirección exacta y cualquier credencial sensible se mantienen ocultas hasta que exista una reserva válida. En accesos temporales se muestran solo durante la ventana necesaria.</p></div>'+
    '</div><div class="book-bar"><div><p>Desde</p><b>'+money(s.price_hour)+' / hora</b></div><button id="openBooking">Reservar esta plaza</button></div>';
  $("#detailSheet").hidden=false;
  $('[data-close="detail"]').addEventListener("click",closeDetail);$("#openBooking").addEventListener("click",()=>openBooking(s));
}
function closeDetail(){$("#detailSheet").hidden=true}
$("#detailSheet").addEventListener("click",e=>{if(e.target.id==="detailSheet")closeDetail()});

function openBooking(s){
  const start=$("#startInput").value;const end=$("#endInput").value;
  $("#bookingContent").innerHTML=
    '<button class="modal-close" data-close="booking">×</button><span class="section-kicker">Reserva protegida</span><h2>Confirma tu plaza</h2>'+
    '<div class="booking-space"><div><b>'+s.title+'</b><small>'+s.approx_address+'</small></div><strong>'+s.security_score+'/100</strong></div>'+
    '<div class="time-grid"><label><span>Entrada</span><input id="modalStart" type="datetime-local" value="'+start+'"></label><label><span>Salida</span><input id="modalEnd" type="datetime-local" value="'+end+'"></label></div>'+
    '<div class="verification-box"><span>✓</span><p><b>Identidad y vehículo verificados</b>'+state.me.vehicle_model+' · '+state.me.vehicle_plate+'</p></div>'+
    '<div id="priceBreakdown" class="price-breakdown"></div>'+
    '<button id="confirmBooking" class="booking-submit">Reservar y pagar · demo</button><p class="booking-fineprint">Demo funcional: no se procesa ningún pago real. En producción, la reserva solo se confirma tras el pago y aceptación de condiciones.</p>';
  $("#bookingModal").hidden=false;closeDetail();
  $('[data-close="booking"]').addEventListener("click",()=>$("#bookingModal").hidden=true);
  $("#modalStart").addEventListener("change",()=>updatePrice(s));$("#modalEnd").addEventListener("change",()=>updatePrice(s));updatePrice(s);
  $("#confirmBooking").addEventListener("click",()=>createBooking(s));
}
function bookingCalc(s){
  const a=new Date($("#modalStart").value),b=new Date($("#modalEnd").value);const h=(b-a)/3600000;
  if(!Number.isFinite(h)||h<1)return null;const sub=s.price_hour*h,fee=Math.max(.75,sub*.10);return{h,sub,fee,total:sub+fee};
}
function updatePrice(s){
  const c=bookingCalc(s);const box=$("#priceBreakdown");const btn=$("#confirmBooking");
  if(!c){box.innerHTML='<div class="price-line"><span>Selecciona una franja de al menos 1 hora.</span></div>';btn.disabled=true;return}
  btn.disabled=false;box.innerHTML='<div class="price-line"><span>'+money(s.price_hour)+' × '+c.h.toFixed(c.h%1?1:0)+' h</span><b>'+money(c.sub)+'</b></div><div class="price-line"><span>Servicio App Parquing (demo)</span><b>'+money(c.fee)+'</b></div><div class="price-line total"><span>Total</span><b>'+money(c.total)+'</b></div>';
}
async function createBooking(s){
  const btn=$("#confirmBooking");btn.disabled=true;btn.textContent="Confirmando…";
  try{
    const payload={space_id:s.id,start_at:new Date($("#modalStart").value).toISOString(),end_at:new Date($("#modalEnd").value).toISOString()};
    await api("/api/bookings",{method:"POST",body:JSON.stringify(payload)});
    $("#bookingModal").hidden=true;toast("Reserva confirmada");await loadBookings();showRoute("bookings");
  }catch(e){toast(e.message);btn.disabled=false;btn.textContent="Reservar y pagar · demo"}
}
$("#bookingModal").addEventListener("click",e=>{if(e.target.id==="bookingModal")$("#bookingModal").hidden=true});

async function loadBookings(){
  try{state.bookings=await api("/api/bookings");renderBookings()}catch(e){toast(e.message)}
}
function renderBookings(){
  const root=$("#bookingsList");
  if(!state.bookings.length){root.innerHTML='<div class="empty-state"><span>▣</span><h3>Aún no tienes reservas</h3><p>Cuando reserves una plaza, aquí tendrás acceso, horarios y estado.</p></div>';return}
  root.innerHTML=state.bookings.map(b=>
    '<article class="booking-card"><div><span class="status-pill status-'+b.status+'">'+({confirmed:"Confirmada",active:"Aparcado",completed:"Completada"}[b.status]||b.status)+'</span><h3>'+b.title+'</h3><p>'+b.approx_address+' · '+b.city+'</p><div class="booking-meta"><span>Entrada · '+fmtDate(b.start_at)+'</span><span>Salida · '+fmtDate(b.end_at)+'</span><span>Seguridad '+b.security_score+'/100</span><span>'+money(b.total)+'</span></div><div id="access-'+b.id+'"></div></div>'+
    '<div class="booking-actions"><button class="solid-btn" data-access="'+b.id+'">Ver acceso</button>'+(b.status==="confirmed"?'<button class="soft-btn" data-checkin="'+b.id+'">He llegado</button>':b.status==="active"?'<button class="soft-btn" data-checkout="'+b.id+'">He salido</button>':'')+'</div></article>'
  ).join("");
  $$("[data-access]").forEach(x=>x.addEventListener("click",()=>loadAccess(+x.dataset.access)));
  $$("[data-checkin]").forEach(x=>x.addEventListener("click",()=>doBookingAction(+x.dataset.checkin,"checkin")));
  $$("[data-checkout]").forEach(x=>x.addEventListener("click",()=>doBookingAction(+x.dataset.checkout,"checkout")));
}
async function loadAccess(id){
  try{const r=await api("/api/bookings/"+id+"/access");const box=$("#access-"+id);box.innerHTML=r.locked?'<div class="access-card locked"><h4>🔒 Acceso protegido</h4><p>'+r.message+' Se desbloquea: '+fmtDate(r.unlock_at)+'</p></div>':'<div class="access-card"><h4>'+r.address+'</h4><p><b>'+r.access_method+'</b><br>'+r.instructions+'</p></div>'}catch(e){toast(e.message)}
}
async function doBookingAction(id,action){try{await api("/api/bookings/"+id+"/"+action,{method:"POST",body:"{}"});toast(action==="checkin"?"Entrada registrada":"Salida registrada");await loadBookings()}catch(e){toast(e.message)}}

function renderFavorites(){
  const ids=state.me?.favorites||[];const spaces=state.allSpaces.filter(s=>ids.includes(s.id));const root=$("#favoritesList");
  root.innerHTML=spaces.length?spaces.map(s=>cardHTML(s,true)).join(""):'<div class="empty-state"><span>♡</span><h3>No has guardado ninguna plaza</h3><p>Marca el corazón de las plazas que quieras recordar.</p></div>';bindCards(root)
}
function showRoute(route){
  $$(".route").forEach(x=>x.classList.toggle("active",x.id==="route-"+route));
  $$(".nav-link,.mobile-nav button").forEach(x=>x.classList.toggle("active",x.dataset.route===route));
  if(route==="favorites")renderFavorites();if(route==="bookings")loadBookings();window.scrollTo({top:0,behavior:"smooth"})
}
$$("[data-route]").forEach(x=>x.addEventListener("click",e=>{e.preventDefault();showRoute(x.dataset.route)}));

async function init(){
  setDefaultDates();
  try{
    state.me=await api("/api/me");
    $("#topUser").textContent=state.me.name.split(" ")[0];$("#profileName").textContent=state.me.name;$("#profileEmail").textContent=state.me.email;$("#trustScore").textContent=state.me.trust_score+"/100";$("#vehiclePlate").textContent=state.me.vehicle_plate;$("#vehicleModel").textContent=state.me.vehicle_model;
    state.allSpaces=await api("/api/spaces?security_min=0");await loadSpaces();await loadBookings();
  }catch(e){toast("No se pudo cargar la demo: "+e.message)}
}
$("#searchButton").addEventListener("click",()=>{state.city=$("#cityInput").value.trim();loadSpaces()});
$("#cityInput").addEventListener("keydown",e=>{if(e.key==="Enter"){$("#searchButton").click()}});
$("#sortSelect").addEventListener("change",e=>{state.sort=e.target.value;renderSpaces()});
$$("[data-filter]").forEach(btn=>btn.addEventListener("click",()=>{const k=btn.dataset.filter;state.filters[k]=!state.filters[k];btn.classList.toggle("active",state.filters[k]);loadSpaces()}));
$("#securityInfo").addEventListener("click",()=>$("#infoModal").hidden=false);$("#profileSecurityInfo").addEventListener("click",()=>$("#infoModal").hidden=false);$('[data-close="info"]').addEventListener("click",()=>$("#infoModal").hidden=true);$("#infoModal").addEventListener("click",e=>{if(e.target.id==="infoModal")$("#infoModal").hidden=true});
$("#recenterBtn").addEventListener("click",()=>toast("Mapa centrado en "+state.city));
$("#moreFilters").addEventListener("click",()=>toast("Filtros avanzados: altura, tamaño, acceso, EV y seguridad"));
document.addEventListener("keydown",e=>{if(e.key==="Escape"){closeDetail();$("#bookingModal").hidden=true;$("#infoModal").hidden=true}});
init();
