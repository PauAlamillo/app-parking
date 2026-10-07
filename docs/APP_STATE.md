# Estado actual — App Parquing staging
Fecha: 2026-10-07

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
- panel Partner accesible en /partner
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
- panel Partner conectado completamente al backend
- importación CSV persistente
- disponibilidad/calendario por plaza
- motor de precios
- notificaciones
- despliegue estable con dominio propio
