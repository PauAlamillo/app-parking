# Reutilización del MVP original ParkShare

Fecha de revisión: 2026-10-08

## Fuente recuperada
El primer MVP se creó el 6 de septiembre de 2026 como:
- `parkshare_demo/index.php`
- ZIP: `parkshare_demo_php_html_js.zip`
- PHP + HTML + JavaScript
- persistencia local mediante `localStorage`

El ZIP/directorio original ya no aparece físicamente en el VPS tras búsquedas por nombre, contenido y archivos comprimidos. Sí se ha recuperado:
- el prototipo HTML original preservado en `legacy/mvp_parking_privado.html`;
- el historial funcional del MVP ParkShare en las conversaciones del proyecto.

## Funciones valiosas del MVP original

### Conductor
- modo conductor/propietario en una misma experiencia
- mapa simulado con 9 plazas
- filtros
- favoritos
- reserva por horas
- cálculo de comisión
- código/acceso después de reservar
- acción “Abrir garaje”
- ampliar reserva
- cancelar reserva

### Propietario
- panel de ingresos
- horas alquiladas
- ocupación
- horario semanal recurrente
- calendario
- creación/edición de plazas
- “He salido · liberar mi plaza”
- Return Shield: bloquear nuevas reservas antes del regreso previsto del propietario

## Qué ya estaba mejor cubierto en la app actual
- backend real FastAPI + SQLite
- separación de información pública y sensible
- identidad, permiso y matrícula
- niveles de riesgo A/B/C
- acceso sensible protegido
- prevención de reservas solapadas
- check-in/check-out
- Área de gestión adaptada a particular/profesional
- seguridad como eje de producto

## Qué se ha recuperado ya
A fecha de esta revisión:
- ampliar una reserva +1 hora;
- validación contra reservas posteriores y contra disponibilidad;
- recálculo del total y tarifa demo;
- cancelar una reserva aún no iniciada;
- disponibilidad semanal persistida en SQLite;
- Return Shield configurable por plaza;
- búsqueda del conductor filtrada por horario real;
- reservas rechazadas fuera del horario efectivo;
- excepciones de calendario por fecha;
- “He salido · liberar plaza” como override persistente;
- “La necesito antes” como bloqueo persistente;
- protección para impedir que el propietario pise una reserva confirmada;
- último override manual prevalece sobre uno anterior solapado;
- Área de gestión conectada al horario real del propietario.

## Qué debe recuperarse después

### Prioridad alta
1. alta/edición de plazas completamente persistente;
2. panel de reservas del propietario alimentado por datos reales;
3. métricas reales de ingresos, horas y ocupación;
4. calendario visual mensual sobre el motor de disponibilidad ya implementado.

### Prioridad media
5. ampliación con selector de nueva hora, no solo +1 h;
6. política real de cancelación;
7. estado de acceso compatible con apertura remota;
8. botón “Abrir garaje” solo cuando exista integración real o acceso controlado compatible.

## Regla
No recuperar estética ni arquitectura técnica antigua por nostalgia.
Recuperar únicamente las decisiones de producto y flujos que mejoren la experiencia actual.

## Decisión sobre “Abrir garaje”
No simular una apertura real en producción. La acción puede diseñarse y quedar preparada, pero solo debe activarse cuando el método de acceso de la plaza soporte una credencial/apertura verificable.
