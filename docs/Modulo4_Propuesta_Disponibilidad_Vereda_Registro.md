# Disponibilidad de veredas durante el registro administrativo

> **PROPUESTA TÉCNICA — PENDIENTE DE APROBACIÓN**
>
> Este documento describe opciones para una futura etapa backend. No aprueba una arquitectura ni autoriza cambios en código, Supabase, RLS, funciones, tablas o índices.

## 1. Estado actual

- El formulario está en `src/routes/auth.tsx` (`/auth?mode=solicitar`). Obtiene las veredas activas desde `public.veredas`; todavía no consulta cuáles tienen administrador.
- La selección vive en el estado `veredaSolicitadaId` y se envía como `user_metadata.vereda_solicitada_id`. Enviar una solicitud no crea una asignación activa: la asignación ocurre después, cuando Superadmin aprueba.
- La política local de `admin_asignaciones` concede lectura a usuarios autenticados y limita las filas a Superadmin o al perfil propio. No concede lectura a `anon`. Por ello, el formulario previo al registro no puede consultar esa tabla directamente con las políticas actuales.
- La definición actual considera activa una asignación con `estado = 'activa'`; su restricción de tabla exige que `vigente_hasta` sea nulo. Existe unicidad parcial por `perfil_id`, pero el índice por `vereda_id` no es único.
- `aprobar_solicitud_admin` valida que el perfil siga pendiente, que la vereda esté activa y que el perfil no tenga otra asignación. No valida si la vereda elegida ya está asignada a otro perfil. El bloqueo actual de la vereda es `FOR SHARE`, que no serializa dos aprobaciones concurrentes.

Referencias locales: `src/routes/auth.tsx`; `src/hooks/use-auth.tsx`; `supabase/migrations/20260823150000_admin_security_revision.sql` (definición de tabla e índices, RPC de aprobación y políticas RLS).

## 2. Requisito funcional definido

Una persona sin sesión debe poder ver, para cada vereda activa, únicamente si está disponible o ya tiene administrador activo. No debe recibir nombres, correos, identificadores de perfil, motivos, fechas, historial ni otros datos de `admin_asignaciones`. La disponibilidad mostrada es informativa y puede cambiar antes de la aprobación.

## 3. Opción técnica para consultar disponibilidad

**Propuesta preferida, pendiente de revisión:** añadir en la futura etapa backend una función RPC exclusivamente de lectura que devuelva, como máximo, `vereda_id` y un indicador booleano de disponibilidad para las veredas activas. El formulario combinaría ese resultado con los nombres que ya obtiene del catálogo público `veredas`.

La función consultaría internamente si existe alguna asignación activa para cada `vereda_id`, sin devolver filas ni columnas de `admin_asignaciones`. Como medida de seguridad propuesta, sería de solo lectura, no aceptaría identificadores de perfil, usaría referencias de esquema explícitas y un `search_path` fijo, y tendría permisos de ejecución limitados explícitamente al rol anónimo necesario para el registro. Las políticas actuales de la tabla se mantendrían sin lectura pública directa.

**Alternativa no recomendada:** conceder `SELECT` anónimo sobre `admin_asignaciones` o ampliar su política RLS. Aunque permitiría calcular la disponibilidad desde el navegador, expondría filas o requeriría restricciones adicionales por columna y sería más fácil revelar información privada por error. Una vista sanitizada es otra opción, pero necesitaría revisar cuidadosamente propietario, privilegios y comportamiento RLS antes de recomendarla.

Si la consulta no está disponible o falla, la interfaz no debería presentar una vereda como disponible por defecto. La conducta exacta ante ese error (por ejemplo, reintentar y bloquear la selección hasta conocer el estado) deberá definirse y aprobarse junto con la integración.

## 4. Protección atómica al asignar

La lectura pública no reserva una vereda y no evita que dos solicitudes se registren al mismo tiempo. El control definitivo debe ejecutarse en la misma transacción que concede la asignación, actualmente `aprobar_solicitud_admin`:

1. Volver a validar que la solicitud esté pendiente y que la vereda siga activa y sin otra asignación activa.
2. Hacer cumplir la unicidad con una restricción atómica de base de datos —como una propuesta, un índice único parcial por `vereda_id` para asignaciones activas— y tratar su conflicto como una respuesta entendible. La restricción de unicidad sería la garantía final incluso si dos procesos validan simultáneamente.
3. Mantener actualización del perfil, inserción de asignación y auditoría dentro de la transacción, de modo que un conflicto no deje cambios parciales. Un bloqueo exclusivo de la fila de vereda podría complementar la validación; por sí solo dependería de que todas las rutas de escritura usen el mismo bloqueo.

Antes de crear una restricción de este tipo habría que auditar y resolver, con autorización, cualquier duplicado activo ya existente. La migración no debería aplicarse si los datos no satisfacen la nueva regla.

**Distinción pendiente de negocio:** pueden existir varias solicitudes pendientes para una misma vereda sin que haya todavía una asignación duplicada. Reservar la vereda al enviar el formulario sería otra regla, no definida aquí; no se propone hacerlo por defecto.

## 5. Validaciones para una futura implementación

La revisión backend debería probar que el rol anónimo solo recibe IDs de veredas activas y su disponibilidad; que no puede leer la tabla ni datos de administradores; que la consulta no permite solicitar perfiles arbitrarios; y que dos aprobaciones concurrentes para una misma vereda producen exactamente una asignación activa y un conflicto claro para la otra, sin actualización parcial ni auditoría de una aprobación fallida.

**Sin cambios aplicados:** esta propuesta no modifica el formulario actual, componentes, migraciones, funciones, permisos, RLS ni datos de Supabase. Todas las alternativas quedan pendientes de aprobación explícita.
