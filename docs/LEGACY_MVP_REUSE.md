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
- validación contra una reserva posterior antes de ampliar;
- recálculo del total y tarifa demo;
- cancelar una reserva aún no iniciada;
- acciones visibles desde “Reservas”.

## Qué debe recuperarse después

### Prioridad alta
1. disponibilidad semanal persistida en backend;
2. excepciones/calendario real;
3. Return Shield calculado por plaza;
4. “He salido · liberar plaza” persistente;
5. “La necesito antes” para cerrar disponibilidad;
6. panel de propietario alimentado por datos reales.

### Prioridad media
7. ampliación con selector de nueva hora, no solo +1 h;
8. política real de cancelación;
9. estado de acceso compatible con apertura remota;
10. botón “Abrir garaje” solo cuando exista integración real o acceso controlado compatible.

## Regla
No recuperar estética ni arquitectura técnica antigua por nostalgia.
Recuperar únicamente las decisiones de producto y flujos que mejoren la experiencia actual.

## Decisión sobre “Abrir garaje”
No simular una apertura real en producción. La acción puede diseñarse y quedar preparada, pero solo debe activarse cuando el método de acceso de la plaza soporte una credencial/apertura verificable.
