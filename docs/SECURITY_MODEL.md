# App Parquing — Modelo de seguridad para garajes comunitarios
Fecha: 2026-10-07

## Riesgo principal
Un usuario legítimamente registrado puede reservar una plaza para obtener acceso a un garaje comunitario y aprovechar ese acceso para robar, causar daños o acceder a zonas ajenas a la plaza reservada.

No existe una garantía absoluta. La estrategia debe combinar:
1. identidad y trazabilidad;
2. acceso mínimo y temporal;
3. reducción de información sensible;
4. evidencia;
5. responsabilidad contractual;
6. detección y expulsión rápida.

## Niveles de plaza

### Nivel A — Bajo riesgo
Entrada exterior, driveway, plaza abierta o box privado sin acceso a bienes de terceros.
Requisitos mínimos:
- email y teléfono verificados;
- matrícula;
- medio de pago válido;
- aceptación contractual.

### Nivel B — Garaje comunitario
El conductor entra a zonas comunes con vehículos/bienes de terceros.
Requisitos:
- identidad verificada antes de la primera reserva;
- nombre legal;
- documento de identidad verificado;
- permiso de conducción válido;
- matrícula del vehículo;
- medio de pago;
- registro completo de reservas;
- check-in y check-out;
- acceso revelado solo cerca de la hora reservada.

### Nivel C — Riesgo elevado
Garajes con trasteros visibles, objetos almacenados, accesos interiores al edificio, llaves físicas o mandos reutilizables.
Regla inicial:
- no aceptar automáticamente;
- revisión manual;
- preferir acceso asistido, conserje/agencia/propietario o credencial temporal;
- rechazar si el único método es compartir un código permanente sensible.

## Identidad del conductor
Objetivo: que una persona con mala intención sepa que existe trazabilidad real.

V1 sin APIs:
- proceso manual de verificación para plazas Nivel B/C;
- almacenar solo el mínimo necesario;
- evitar guardar imágenes de DNI indefinidamente;
- separar estado de verificación de documentos sensibles;
- revisión humana para casos de riesgo.

Fase posterior:
- proveedor especializado de verificación de identidad;
- App Parquing recibe resultado de verificación, no conserva documentos salvo necesidad legal.

## Vehículo
Antes de revelar acceso a un garaje comunitario:
- matrícula obligatoria;
- marca/modelo/color;
- conductor declara que el vehículo está asegurado y autorizado;
- matrícula visible para propietario/partner en la reserva;
- cambios de matrícula después de reservar requieren validación.

## Acceso
Regla principal: mínimo privilegio.

Preferencia de métodos:
1. credencial temporal / acceso remoto;
2. apertura por propietario, inmobiliaria o conserje;
3. código temporal;
4. mando/llave entregado con control;
5. código fijo comunitario — desaconsejado.

Nunca mostrar instrucciones completas antes de existir una reserva pagada/confirmada.
Para Nivel B/C, revelar instrucciones sensibles cerca del inicio.
Después de finalizar, el usuario ya no debe poder consultar credenciales temporales.

## Check-in / check-out
Registrar:
- hora;
- plaza;
- usuario;
- vehículo/matrícula;
- foto opcional/obligatoria según nivel;
- confirmación de salida;
- incidencias.

Esto no impide un delito, pero crea una cadena probatoria y reduce anonimato.

## Depósito / garantía
Para accesos físicos reutilizables (mando, llave, tarjeta):
- depósito o preautorización;
- valor basado en coste de sustitución/desactivación;
- obligación de devolución;
- procedimiento documentado en caso de pérdida.

El depósito NO debe presentarse como seguro contra robo a terceros.

## Reglas de conducta
Contrato del conductor:
- uso exclusivo para aparcar;
- prohibido acceder a otras plazas, trasteros, vehículos o zonas no necesarias;
- prohibido copiar, compartir o conservar códigos/llaves/mandos;
- prohibido dejar entrar a terceros;
- obligación de cerrar puertas;
- responsabilidad por daños causados;
- cooperación con investigación de incidentes;
- suspensión inmediata ante incidentes graves.

## Privacidad
Antes de reservar:
- mostrar zona aproximada, no necesariamente dirección exacta en plazas sensibles;
- no mostrar códigos, puerta exacta, teléfono privado ni instrucciones de acceso.

Después de reservar:
- revelar solo la información necesaria para esa reserva.

## Incidentes
Botón visible de “Reportar incidente”.
Guardar:
- reserva;
- usuario;
- matrícula;
- horas;
- comunicaciones;
- fotos aportadas;
- método de acceso;
- actividad de cuenta.

Ante sospecha grave:
- bloquear nuevas reservas;
- conservar evidencias necesarias;
- facilitar al afectado la información/procedimiento apropiado para denuncia conforme a la base legal aplicable;
- revisión interna antes de reactivar.

## Seguridad declarada de la plaza
Campos:
- has_gate
- has_cctv_declared
- has_concierge
- has_lighting
- shared_garage
- private_box
- storage_units_visible
- interior_building_access
- access_method
- reusable_credential
- security_risk_level

No afirmar que CCTV o vigilancia garantizan seguridad. Mostrar como características declaradas/verificadas.

## Regla de lanzamiento
No publicar un garaje comunitario si no sabemos exactamente:
- quién entra;
- con qué vehículo;
- cuándo entra;
- cómo entra;
- cuándo debería salir;
- cómo se revoca o deja de ser útil su acceso.

## Evolución
A futuro, el objetivo técnico ideal es que una reserva cree una autorización temporal que funcione solo:
- para una persona/vehículo;
- en una ubicación;
- dentro de una ventana horaria;
- y quede registrada.


## Ubicación protegida — implementación 2026-10-08
- La API pública no devuelve dirección exacta ni instrucciones privadas.
- Los títulos públicos no incluyen nombres de calle/edificio.
- La posición pública se desplaza deliberadamente y se presenta como radio aproximado de 250 m.
- La dirección exacta solo se revela desde una reserva válida 30 minutos antes del inicio.
- La ventana de revelación termina 15 minutos después del fin de la reserva.
- Una reserva cancelada no puede volver a consultar la dirección.
- La primera revelación de ubicación queda registrada.

## Garantía de acceso
Para plazas de riesgo B/C, el backend exige:
- identidad verificada;
- permiso verificado;
- matrícula;
- garantía de acceso activa de al menos 50 €.

La garantía es una barrera de acceso/reputación y no sustituye seguro.

## Detección de abuso
El sistema registra `cancel_after_reveal` cuando un usuario cancela después de haber obtenido la ubicación exacta.
A partir de 3 eventos la cuenta queda marcada como `access_review_required`.
No existe bloqueo automático todavía para evitar falsos positivos.

## App Parking Access
El hardware propio no es requisito del MVP.
Cuando exista:
- una unidad por acceso compartido siempre que sea viable;
- autorización previa cuando afecte elementos comunes;
- instalación profesional;
- credenciales temporales;
- dispositivo no expuesto directamente a Internet;
- órdenes firmadas/caducables y registro de aperturas.
