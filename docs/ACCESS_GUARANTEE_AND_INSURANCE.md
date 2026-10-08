# Garantía de acceso y cobertura — diseño de producto

Fecha: 2026-10-08

## Garantía de acceso
Hipótesis aprobada para garajes comunitarios protegidos:
- 50 €;
- pago único;
- reembolsable al cerrar la cuenta si no existen incidencias, reservas o obligaciones pendientes;
- separada del precio de las reservas;
- no se presenta como seguro.

Para reservar plazas de riesgo B/C:
- identidad verificada;
- permiso verificado;
- matrícula;
- garantía de acceso activa.

## Finalidad
La garantía sirve como:
- freno a cuentas desechables;
- compromiso económico;
- apoyo para costes menores acreditados;
- señal adicional de confianza.

No pretende cubrir robos o daños elevados.

## Incidencias
No confiscar automáticamente la garantía por una denuncia.
Flujo:
1. congelar devolución si existe incidencia abierta;
2. preservar registros y evidencias;
3. revisar;
4. aplicar las condiciones contractuales;
5. resolver y desbloquear/devolver cuando corresponda.

## Patrón reservar → revelar → cancelar
El backend registra:
- primera revelación de ubicación exacta;
- cancelación posterior a esa revelación.

A partir de 3 eventos se marca la cuenta para revisión.
En esta fase no existe bloqueo automático para evitar falsos positivos.

## Seguro
La garantía no sustituye un seguro.

Antes de producción se debe cerrar, con corredor/aseguradora, al menos:
- RC de explotación de App Parking;
- cobertura asociada a daños imputables a la actividad cuando proceda;
- responsabilidad de producto/instalación si App Parking Access se despliega;
- defensa jurídica;
- evaluación de cobertura ciber por control de accesos físicos.

Debe comprobarse también la compatibilidad de cada modalidad con seguros del propietario/comunidad.

## Pagos
No mantener una preautorización de tarjeta durante meses.
La garantía deberá estructurarse como cobro reembolsable o mecanismo equivalente compatible con el PSP y la estructura jurídica/fiscal definitiva.

No activar cobro real hasta cerrar proveedor de pagos, términos, fiscalidad y tratamiento contable.
