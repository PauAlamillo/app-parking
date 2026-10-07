# App Parquing — staging funcional

Aplicación full-stack de demostración, sin APIs externas ni servicios de pago.

## Qué incluye
- Cliente conductor responsive (desktop/móvil).
- Búsqueda por ciudad y filtros de seguridad.
- Ficha detallada de plaza.
- Favoritos persistidos en SQLite.
- Usuario demo con identidad, permiso y matrícula verificados.
- Reserva funcional contra backend.
- Control de conflictos de horario.
- Check-in y check-out.
- Instrucciones de acceso protegidas: la búsqueda pública no expone dirección exacta ni credenciales.
- Desbloqueo de acceso 30 minutos antes de la reserva.
- Panel Partner en /partner.
- SQLite local.

## Stack
- FastAPI
- SQLite
- HTML/CSS/JavaScript sin frameworks
- sin mapas, pagos, identidad ni geocodificación externos en esta fase

## Rutas principales
- GET /
- GET /partner
- GET /api/health
- GET /api/me
- GET /api/spaces
- GET /api/spaces/{id}
- GET /api/bookings
- POST /api/bookings
- POST /api/bookings/{id}/checkin
- POST /api/bookings/{id}/checkout
- GET /api/bookings/{id}/access
- POST /api/favorites
- GET /api/partner/summary

## Seguridad aplicada en la demo
La respuesta pública de plazas elimina:
- dirección exacta
- instrucciones privadas de acceso

Un garaje con riesgo B/C exige en backend:
- identidad verificada
- permiso verificado
- matrícula registrada

Las instrucciones privadas solo se consultan mediante una reserva perteneciente al usuario y se mantienen bloqueadas hasta 30 minutos antes del inicio.

## Datos
Las plazas y precios actuales son datos ficticios de demostración. No deben publicarse como inventario real.

## Ejecución
python3 -m uvicorn server:app --host 127.0.0.1 --port 18971
