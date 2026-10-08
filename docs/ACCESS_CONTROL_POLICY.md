# App Parking Access — política de acceso físico

Fecha: 2026-10-08

## Objetivo
App Parking no debe exponer públicamente la ubicación exacta de garajes privados ni entregar credenciales permanentes a conductores.

## Niveles de acceso

### Nivel 1 — acceso existente
No requiere hardware App Parking.
Ejemplos:
- conserje;
- apertura por propietario;
- código temporal ya existente;
- mando físico con entrega controlada.

### Nivel 2 — acceso digital compatible
El edificio ya dispone de un sistema compatible con credenciales temporales o apertura remota.
App Parking integra el permiso de acceso con la reserva.

### Nivel 3 — App Parking Access
Hardware instalado junto al automatismo de la puerta.
Principios:
- una unidad por acceso comunitario cuando sea posible, no una por plaza;
- no sustituye mandos existentes;
- recibe órdenes temporales vinculadas a una reserva;
- no expone directamente el controlador del garaje a Internet;
- cada dispositivo debe tener identidad propia;
- órdenes con caducidad y protección contra repetición;
- todas las aperturas quedan registradas.

## Regla de instalación
Si la instalación afecta puerta, motor, cuadro, alimentación, cableado o cualquier otro elemento común:
- App Parking exige autorización previa de la comunidad o titular competente;
- App Parking conserva evidencia documental de esa autorización;
- la instalación debe realizarla un profesional autorizado por App Parking y conforme a la instalación existente;
- un propietario no puede autoinstalar hardware App Parking sobre elementos comunitarios.

En una puerta estrictamente privativa se podrá definir un proceso simplificado, pero siempre con instalación segura y documentada.

## Regla de producto
App Parking no depende de hardware propio para lanzar.
El MVP admite accesos asistidos y sistemas existentes.

No mostrar el botón “Abrir garaje” salvo que el backend confirme:
- reserva válida;
- usuario habilitado;
- vehículo vinculado;
- garantía activa cuando aplique;
- ventana temporal válida;
- dispositivo/medio de acceso compatible.

## Privacidad de ubicación
Antes de reservar:
- barrio/zona;
- radio aproximado;
- distancia a destino;
- nunca calle, número, portal o punto exacto.

Cerca del inicio:
- dirección exacta;
- instrucciones de llegada.

Durante la ventana:
- credencial temporal o botón de apertura, si existe.

Después:
- credencial expirada;
- la dirección vuelve a quedar protegida en la interfaz.
