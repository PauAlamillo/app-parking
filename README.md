# App Parking

Marketplace de parking privado por horas con **seguridad y confianza como eje del producto**.

## Producto
App Parking conecta conductores con plazas privadas disponibles por horas. La oferta puede venir tanto de:
- propietarios particulares;
- inmobiliarias y otros partners que gestionen plazas de terceros.

Por eso no existe un “panel inmobiliaria” como producto separado: existe una **Área de gestión** común, que se adapta según el tipo de cuenta.

## Estado actual
- app conductor responsive;
- backend FastAPI + SQLite;
- búsqueda y filtros demo;
- favoritos persistentes;
- reservas y prevención de solapes;
- disponibilidad semanal persistente;
- Return Shield aplicado en búsqueda y reservas;
- excepciones de calendario y overrides manuales;
- liberar o recuperar la plaza desde el Área de gestión;
- check-in / check-out;
- acceso sensible protegido;
- perfil de identidad/vehículo;
- Área de gestión en `/gestion`;
- documentación consolidada de producto, seguridad y lanzamiento.

## Principios
1. Seguridad antes que precio.
2. Oferta antes que demanda.
3. Plataforma neutral entre propietarios, inmobiliarias y redes.
4. Dirección y credenciales sensibles solo tras una reserva válida.
5. Sin IoT obligatorio ni APIs externas en la primera fase.

## Estructura
- `app/`: aplicación full-stack.
- `docs/`: decisiones, seguridad, auditoría, estrategia y roadmap.
- `ops/`: material operativo de captación/despliegue.
- `legacy/`: MVP original recuperado como referencia.

## Ejecutar
```bash
python3 -m venv .venv
. .venv/bin/activate
pip install -r requirements.txt
sh ops/fetch-demo-media.sh
cd app
python3 -m uvicorn server:app --host 127.0.0.1 --port 18971
```

Rutas:
- conductor: `/`
- gestión: `/gestion`
- compatibilidad temporal: `/partner`
- healthcheck: `/api/health`

> Las plazas actuales del staging son ficticias y solo sirven para probar el producto.

Consulta `docs/PROJECT_AUDIT_2026-10-07.md` para el estado consolidado.
