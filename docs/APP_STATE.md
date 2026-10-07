# Estado actual — App Parquing staging
Fecha: 2026-10-08

## Funciona
- backend FastAPI + SQLite
- aplicación conductor responsive
- búsqueda por ciudad
- filtros de seguridad / puerta / CCTV / EV / precio
- orden por seguridad / distancia / precio / valoración
- fichas de plaza
- favoritos persistentes
- usuario demo verificado
- reserva real contra SQLite
- prevención de doble reserva
- cálculo de precio y tarifa de servicio demo
- check-in
- check-out
- pantalla de reservas
- perfil / vehículo / confianza
- ocultación de dirección exacta antes de reservar
- ocultación de instrucciones privadas antes de reservar
- bloqueo de acceso sensible hasta 30 minutos antes
- backend rechaza garajes B/C si falta identidad, permiso o matrícula
- Área de gestión accesible en /gestion (compatibilidad temporal /partner)
- disponibilidad semanal real y persistente
- Return Shield configurable y aplicado por backend
- excepciones de calendario
- liberar plaza manualmente
- bloquear disponibilidad anticipadamente
- búsqueda filtrada por disponibilidad real
- ampliar/cancelar reserva desde la app
- protección contra cambios del propietario que pisen reservas confirmadas
- watchdog local del backend
- túnel temporal de demostración

## Diseño
Dirección visual:
- verde bosque / blanco roto
- tipografía de sistema
- sin frameworks ni assets externos
- seguridad por encima del precio
- mapa propio simulado para evitar APIs
- UX de marketplace, no aspecto de dashboard de IA

## Datos demo
12 plazas ficticias en:
- Barcelona
- Madrid
- Valencia
- Sevilla
- Bilbao
- Málaga
- Zaragoza

Nunca tratar estas plazas como inventario real.

## Pendiente para producción
- repositorio definitivo
- autenticación real
- verificación de identidad real
- pagos reales
- mapas/geocodificación (cuando se decida proveedor o alternativa)
- subida y almacenamiento de fotos
- mensajería
- sistema de incidencias
- contratos / términos finales
- completar CRUD real de plazas/propietarios en Área de gestión
- importación CSV persistente
- calendario visual mensual sobre el motor de disponibilidad
- motor de precios
- notificaciones
- despliegue estable con dominio propio
