# Auditoría consolidada — App Parking
Fecha: 2026-10-07

## Fuentes revisadas
- conversaciones previas del proyecto App Parquing/App Parking
- MVP antiguo recuperado
- staging actual del VPS
- documentación actual del VPS
- repositorio GitHub PauAlamillo/app-parking

## Repositorio
PauAlamillo/app-parking existe, rama main, pero está vacío.
En el momento de la auditoría figura como PUBLIC.
No se ha subido todavía el staging para evitar mezclar o perder trabajo sin consolidarlo.

## Lo que existe hoy en código

### Cliente conductor — funcional
- interfaz responsive desktop/móvil
- búsqueda por ciudad
- mapa visual simulado
- filtros: seguridad, puerta, CCTV, EV, precio
- orden: seguridad, distancia, precio, valoración
- ficha de plaza
- dimensiones / tipo de vehículo / acceso / seguridad
- favoritos persistidos en SQLite
- perfil demo
- matrícula y estado de identidad/permisos
- reservas persistentes
- cálculo de precio demo
- prevención de doble reserva
- check-in / check-out
- historial de reservas
- dirección exacta oculta en resultados públicos
- instrucciones sensibles ocultas
- desbloqueo de acceso 30 min antes
- backend rechaza plazas riesgo B/C si no hay identidad, permiso y matrícula verificados

### Backend — funcional pero todavía demo
- FastAPI
- SQLite
- endpoints de usuario, plazas, reservas, favoritos y acceso
- lógica básica de conflictos
- seguridad básica por nivel de riesgo
- datos ficticios
- usuario único de demostración

### Partner / inmobiliaria — UI parcial
- dashboard visual
- plazas
- propietarios
- reservas
- rendimiento
- promoción
- modal de alta de plaza
- importación CSV leída localmente
- invitación de propietario simulada
- enlaces Partner simulados

La mayoría de estas acciones aún no persisten en backend.

### MVP antiguo recuperado
Conceptos que deben rescatarse:
- modo conductor / propietario
- horario semanal de disponibilidad
- liberar plaza manualmente
- Return Shield: bloquear plaza antes del regreso del propietario
- reserva por horas
- panel de ingresos/horas/ocupación
- edición simple de plaza
- cálculo de comisión
- acceso posterior a reserva

## Producto / estrategia ya decididos
- plataforma neutral nacional
- seguridad como marca principal
- precio competitivo, no promesa absoluta de ser el más barato
- oferta antes que demanda
- inmobiliarias como canal principal de oferta
- captación nacional de partners y activación de demanda por microzonas
- 50 capitales + Ceuta/Melilla como objetivo de cobertura de partners
- no considerar ciudad activa hasta tener oferta reservable
- inmobiliaria puede gestionar la plaza o invitar al propietario
- CSV antes de integraciones externas
- sin IoT obligatorio en v1
- no exponer dirección/código sensible antes de reserva
- niveles A/B/C de riesgo de garaje
- acceso de mínimo privilegio
- hardware/llave digital propia para fases posteriores

## Seguridad ya diseñada
Nivel A: plaza abierta/box de bajo riesgo.
Nivel B: garaje comunitario, exige identidad + permiso + matrícula + trazabilidad.
Nivel C: trasteros/accesos interiores/credencial reutilizable, revisión manual o rechazo.

Métodos preferidos:
1. acceso temporal/remoto
2. propietario/agencia/conserje
3. código temporal
4. llave/mando controlado
5. código fijo comunitario, desaconsejado

## Legal/fiscal ya trabajado, pendiente de revisión final
- marketplace propietario ↔ conductor, plataforma intermediaria
- contratación electrónica con términos versionados y aceptación demostrable
- plaza separada normalmente sujeta a IVA 21% en España
- DAC7 relevante para cesión temporal de plazas
- KYC/datos fiscales necesarios
- responsabilidad según causante/propietario/comunidad/plataforma/seguro
- dirección y acceso sensibles solo tras reserva
- términos, cancelación, privacidad, reclamaciones y seguro todavía deben convertirse en textos finales
- Andorra se estudió aparte, pero debe revisarse antes de operar realmente allí

## Competencia ya investigada
- Sublocus
- ReservPark
- ComPlaza
- OlePark
- KIVOPark
- Dooroti
- indirectos: Telpark, Yespark, ElParking, Parclick y otros

Conclusión estratégica: el problema no parece ser construir la app sino conseguir liquidez/densidad. El canal inmobiliario es la apuesta para resolver el cold start.

## Incoherencias detectadas
- MVP antiguo: tarifa al conductor ~20%, mínimo 0,99 €
- backend actual: 10% demo
- hipótesis antiguas: mínimo de reserva ~3 € o 2 h
- backend actual: mínimo 1 h
Estas cifras NO están cerradas.

## Lo que falta para un MVP piloto real

### Prioridad 0 — consolidar base
- hacer privado el repositorio si esa es la política del proyecto
- convertir app-parking en repositorio canónico
- importar staging y documentación
- estructura limpia de proyecto
- configuración por entorno
- tests automatizados
- CI básico
- backups de SQLite / migración preparada

### Prioridad 1 — propietario e inmobiliaria reales
- cuentas y autenticación
- roles: conductor, propietario, agency admin, agency staff
- CRUD real de agencias
- CRUD real de propietarios
- CRUD real de plazas
- importación CSV persistente
- invitaciones con token
- permisos/aislamiento por agency_id
- calendario recurrente
- excepciones de disponibilidad
- pausar/reactivar plaza
- Return Shield real
- liberación manual
- dashboard con KPIs reales

### Prioridad 2 — experiencia conductor real
- búsqueda geográfica real
- disponibilidad por fecha/hora
- fotos reales
- filtros completos
- compatibilidad por dimensiones
- reservas recurrentes o ampliaciones
- cancelación
- sobreestancia
- valoraciones
- incidencias
- soporte

### Prioridad 3 — seguridad
- flujo manual real de verificación v1 sin APIs
- revisión y estado de identidad
- control de cambio de matrícula
- evidencias de check-in/out
- bloqueo/suspensión
- auditoría de acceso
- depósito para mando/llave si aplica
- reglas por nivel A/B/C
- score de calidad basado en hechos, no solo datos declarados

### Prioridad 4 — dinero y legal
- decidir take rate/comisiones
- impuestos y facturación operativa
- pagos reales solo cuando corresponda
- liquidación propietario/partner
- reembolsos
- cancelaciones
- depósitos/preautorizaciones
- términos finales
- privacidad/cookies
- contratos propietario/conductor
- protocolo de incidencias/daños
- seguro/RC a cerrar

### Prioridad 5 — lanzamiento
- CRM nacional de inmobiliarias
- 5–10 candidatos por capital hasta conseguir partner activo
- onboarding partner <10 min
- kit de QR/cartel/web
- primer piloto 3–5 agencias / 30–50 plazas / 10–20 propietarios
- medir reservas sin incidencia por plaza/semana
- abrir demanda zona a zona
- no publicidad nacional fuerte con mapa vacío

## Estado global estimado
Producto/estrategia: 75%
UX conductor demo: 70%
backend conductor MVP: 45%
seguridad conceptual: 80%
seguridad operativa real: 30%
propietario: 20%
inmobiliaria: 20%
pagos/fiscal/legal operativo: 15%
infra producción: 20%
captación partners ejecutada: 0–5%
preparación para piloto real: ~30–35%

## Siguiente hito recomendado
No seguir creando pantallas sueltas.
1. hacer app-parking canónico
2. fusionar staging + conceptos del MVP antiguo
3. implementar cuentas/roles
4. hacer plaza + disponibilidad + Return Shield reales
5. conectar Partner/propietario al mismo backend
6. cerrar seguridad operativa
7. probar flujo completo: agencia → propietario → plaza → conductor → reserva → acceso → salida
