# App Parquing — Plan de producto Partner

## Objetivo
Hacer que una inmobiliaria pueda empezar a aportar oferta en menos de 10 minutos y entender inmediatamente qué valor obtiene: más servicio para sus propietarios, ingresos adicionales y visibilidad local.

## Principios
- Plataforma neutral: App Parquing no pertenece a ninguna red inmobiliaria.
- Cero dependencia externa en v1: sin APIs de terceros ni servicios de pago.
- Mobile first, pero panel de escritorio excelente para oficinas.
- Una acción principal por pantalla.
- Datos mínimos primero; completar después.
- La inmobiliaria puede gestionar la plaza o invitar al propietario.
- Todo debe poder exportarse/importarse en CSV.

## Flujo de onboarding inmobiliaria
1. Crear cuenta Partner.
2. Datos de agencia: nombre comercial, CIF/NIF, persona de contacto, teléfono, email, ciudad y aceptación de condiciones.
3. Elegir modo de trabajo: “Gestiono yo las plazas” / “Invito a mis propietarios”.
4. Añadir plazas: manual, CSV o invitación al propietario.
5. Configurar disponibilidad y precio.
6. Revisar y publicar.
7. Generar enlace Partner, QR y material promocional.

## Módulos v1
- Inicio: estado de configuración, KPIs y siguientes acciones.
- Plazas: alta, edición, publicación, pausa, disponibilidad, precio y filtros.
- Propietarios: invitaciones, estado y plazas vinculadas.
- Reservas: futuras, activas, completadas y canceladas.
- Rendimiento: ocupación, ingresos, conversión y rendimiento por plaza.
- Promoción: enlace Partner, QR, cartel y banner.
- Configuración: agencia, usuarios, liquidaciones y condiciones.

## Criterios de “enamoramiento”
- Primera pantalla comprensible sin formación.
- Onboarding inferior a 10 minutos con 1–5 plazas.
- Importación CSV con vista previa antes de guardar.
- Invitación al propietario en menos de 30 segundos.
- Dashboard que cuantifique valor en euros, reservas y propietarios activados.
- Aspecto de plataforma nacional sólida, no de MVP improvisado.

## Siguiente integración
El staging actual es independiente. Cuando se localice el repositorio real se trasladarán componentes y lógica sin crear un segundo producto.
