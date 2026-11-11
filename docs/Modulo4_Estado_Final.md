# AlertaVereda — Estado final del Módulo 4

**Fecha de revisión:** 11 de noviembre de 2026. **Estado:** correcciones funcionales y alcance revisados; commit local autorizado tras la verificación final. Este documento se incorpora a `docs/` con autorización expresa. No se harán cambios remotos ni despliegues.

## 1. Alcance y decisiones vigentes

El Módulo 4 integra Mi Perfil, Mis reportes, Acerca de, Configuración y Acceso administrativo. El trabajo es frontend y local. No implementa recepción oficial de reportes, publicación, sincronización, SMS, backend o persistencia remota. Las llamadas existentes de autenticación y consulta no se sustituyen ni amplían: durante las pruebas se interceptaron íntegramente mediante respuestas simuladas.

La aclaración vigente identifica como JAC los reportes creados en `/reportar` por una cuenta `admin_vereda`. No se necesita una nueva acción de creación dentro del Panel JAC. `AdminReportarFlow`, Superadmin y las modificaciones independientes del Panel JAC no forman parte de esta corrección ni del commit candidato.

## 2. Identidad y perfil

Nombre y apellido comparten una única fuente de datos local en `use-perfil-local.ts`, persistida mediante `localStorage`. Mi Perfil confirma guardado solo si la escritura tuvo éxito. Reportar precarga ambos nombres combinados y permite cambiarlos únicamente para ese reporte; esa edición no modifica el perfil guardado. Mis reportes conserva el encabezado de identidad local o su identificación neutral cuando no existe perfil.

Para JAC se conserva en el registro de IndexedDB una instantánea de la cuenta creadora: identificador de perfil y nombre completo. El nombre administrativo continúa proviniendo del perfil autenticado, con su comportamiento de solo lectura existente. El origen es `jac`; para ciudadanos es `comunitario`. La instantánea no contiene correo, teléfono, tokens ni credenciales y no constituye una certificación remota. Los registros antiguos sin esa instantánea siguen siendo legibles; no se inventa una identidad retrospectiva.

Las opciones de avatar público y fotografía personal privada permanecen informativas. No hay selección, procesamiento o almacenamiento de imágenes del perfil. No se confunden con evidencias de reportes.

## 3. Historial y multimedia local

IndexedDB utiliza la base `alertavereda-historial-local`, versión física 1, almacén `reportes`. La versión del formato de cada registro es independiente: v1 conserva metadatos; v2 puede conservar fotos; v3 admite fotos procesadas y video optimizado. La lectura de formatos antiguos se normaliza en memoria y no reescribe los registros existentes. No se reconstruyen videos que nunca fueron almacenados.

El procesamiento de video permanece separado del escritor de IndexedDB. Se prioriza MP4/H.264 cuando el navegador ofrece una ruta compatible. Se acepta una alternativa como WebM solo después de optimizar y validar su reproducción. No se guarda un original presentándolo como optimizado. Esta separación permite sustituir el procesador en una futura aplicación nativa, sin desarrollar ahora integraciones Android.

Los límites permanecen intactos: hasta tres fotografías, un video, quince segundos y quince MB. Metadatos y blobs procesados se guardan en una única transacción. El éxito solo aparece después de su finalización. Un fallo de procesamiento o almacenamiento aborta el reporte completo, conserva el borrador y permite reintentar o retirar/reemplazar la evidencia. No se guardan originales, credenciales ni URL temporales `blob:` como datos persistentes.

La confirmación está protegida contra doble clic. El identificador local del intento se conserva para el reintento. Durante el procesamiento se bloquea agregar otro lote, avanzar o confirmar; una selección concurrente que intenta atravesar ese bloqueo recibe un aviso explícito y no cancela silenciosamente el lote anterior. Durante la optimización de video en el guardado ya está activo el bloqueo de confirmación.

Mis reportes consulta IndexedDB, muestra tarjetas reales y abre su propio detalle individual. Al regresar restaura la posición del listado y el foco de origen. Fotografías y videos pueden ampliarse o reproducirse mediante el visor existente; las URL temporales se liberan al desmontar. El detalle local muestra el origen comunitario/JAC y aclara que el estado es local y no verificado. «En revisión» no acredita recepción, atención o publicación oficial.

Las coordenadas confirmadas del incidente se muestran cuando existen. No se inventa ubicación ni se transmite a mapas externos. El mapa comunitario propio sigue en preparación.

## 4. Preferencias y geolocalización

El tamaño de texto llega a 140 % en incrementos de 5 %. Tamaño, categorías, alcance de notificaciones y vereda elegida permanecen en memoria. La vereda de notificaciones es independiente de Mi Vereda y se conserva durante la sesión al cambiar de alcance. No se implementan notificaciones reales.

Solo se persiste el enum de preferencia de ubicación. No se guardan coordenadas como parte de esa preferencia; la ubicación GPS reciente es una caché en memoria. Esto no impide que un reporte local conserve las coordenadas del incidente que su autor confirmó voluntariamente.

La decisión más reciente sustituye el diferimiento anterior: activar «Mientras uso» en primer plano inicia la primera lectura inmediatamente, siempre sujeto al límite ya vigente de cinco minutos si existe una lectura reciente. Las actualizaciones se detienen fuera de primer plano y se reanudan al volver, sin duplicar consultas ni reiniciar el limitador al cambiar de opción. «Siempre» continúa como mejor esfuerzo mientras el código de la página pueda ejecutarse; el navegador puede suspenderlo y no se garantiza seguimiento al ocultar, suspender o cerrar la aplicación.

«Nunca» evita solicitudes automáticas, pero conserva la petición voluntaria desde Reportar. El permiso de ubicación es opcional y su rechazo no impide registrar el reporte local. No se solicitan coordenadas reales durante las pruebas.

## 5. Acceso, navegación y logs

El menú mantiene las cinco secciones aprobadas, sus chevrons y el cierre de sesión existente. El patrón de regreso usa una ruta interna válida anterior o Inicio. La navegación principal del AppShell conserva nombres accesibles mediante etiquetas explícitas aunque en móvil muestre solo iconos. No se reorganizaron enlaces ni se cambió su diseño.

El formulario conserva su autenticación y payload existentes. Teléfono y cargo siguen limitados a validación frontend; no se incorporan al payload de alta. El buscador de veredas y las once opciones de cargo mantienen búsqueda, selección y validaciones aprobadas.

En desarrollo el código que realmente genera el adaptador telefónico se muestra como código de prueba y se elimina al completar, expirar o invalidar el reto. No se obtiene de consola ni representa un SMS. La etiqueta de código de prueba no apareció en el JavaScript público de producción. La verificación real sigue pendiente.

La sanitización en Auth, `use-auth`, AppShell y el boundary conserva información técnica estática, sin volcar errores dinámicos, códigos, teléfonos, correos, perfiles o sesiones. No altera permisos, autenticación ni transiciones. La recuperación de contraseña conserva el tratamiento aprobado de error de actualización o cierre de sesión.

## 6. Validaciones de este estado

Todas las pruebas de navegador utilizaron perfiles, datos y respuestas efímeras. No se creó una cuenta ni se escribió en Supabase real. Las imágenes sintéticas de prueba y capturas están fuera del repositorio y no se integraron a la aplicación.

| Comprobación                                                                                      | Resultado                                                                                                                                      |
| ------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------- |
| TypeScript `tsc --noEmit` del checkout                                                            | Correcto                                                                                                                                       |
| ESLint completo `npm run lint`                                                                    | Cero errores; nueve advertencias de Fast Refresh no bloqueantes                                                                                |
| Prettier de todo `src/` y archivos intervenidos                                                   | Correcto                                                                                                                                       |
| `git diff --check`                                                                                | Correcto                                                                                                                                       |
| Suite `test:photo-processor`                                                                      | 11/11                                                                                                                                          |
| Suite `test:mi-vereda`                                                                            | 16/16                                                                                                                                          |
| Build del árbol actual en copia temporal                                                          | Correcto                                                                                                                                       |
| TypeScript y build de una copia candidata sin assets territoriales ni archivos independientes JAC | Correctos; no constituye aprobación final de su delimitación                                                                                   |
| Autor con nombre y apellido, edición aislada y doble clic                                         | Correctos; un único registro comunitario                                                                                                       |
| Lote de fotos ralentizado y segunda selección concurrente                                         | Avance/selección bloqueados; aviso visible; primer lote conservado y tres fotos guardadas                                                      |
| JAC mediante `/reportar`                                                                          | Origen e identidad de cuenta conservados; foto persistida tras recarga y ampliable                                                             |
| Público y JAC con tres fotos y un video                                                           | Procesamiento fallido conserva borrador; transacción fallida sin fila parcial; reintento crea un registro y conserva todos los medios          |
| Fotografía v2                                                                                     | Sigue ampliable; registro original no se reescribe                                                                                             |
| Video después de cerrar y reabrir todo Chromium                                                   | Persiste y se reproduce desde IndexedDB; video de más de 15 segundos rechazado                                                                 |
| GPS con reloj virtual                                                                             | Primera lectura inmediata, separación de cinco minutos, pausa/reanudación, rechazo, petición manual bajo Nunca y fallo honesto de persistencia |
| Registro con código DEV visible                                                                   | Alta simulada correcta; no añade teléfono/cargo al payload; once cargos, selección única y 34 veredas                                          |
| Rutas públicas                                                                                    | 36 combinaciones: nueve pantallas, escritorio/móvil y Día/Noche; sin desbordamiento horizontal en los casos probados                           |
| Acerca de a 125 %, 130 %, 135 % y 140 %                                                           | 16 combinaciones de tamaño/tema/dispositivo correctas                                                                                          |
| Detalle público compartido                                                                        | DOM y RPC simulada idénticos al baseline en las cuatro combinaciones; sin errores de página en ese test                                        |
| Restablecimiento de contraseña simulado                                                           | Éxito, actualización fallida, cierre de sesión fallido y sesión inválida tratados correctamente                                                |

El formato global continúa señalando dos documentos preexistentes, `docs/modulo-2-auditoria-reportar-dependencias.md` y `docs/pendientes-backend.md`. No se corrigieron ni forman parte del commit candidato. El build conserva advertencias no bloqueantes de dependencias (`use client`) y de Nitro `inlineDynamicImports`/`codeSplitting`; no se cambiaron presets ni infraestructura.

Los arneses temporales corrigieron algunas expectativas antiguas o nombres de campo de su comparación; los resultados de la tabla corresponden a las ejecuciones finales correctas, no a esos intentos iniciales.

## 7. Alcance Git y punto pendiente antes del commit

**Rama:** `pr-4-1-territory-catalog-assets`. **HEAD de partida y de esta revisión:** `648b7c4e4dae26889d7c8e1e524e7b97292830ba`. No hay cambios staged ni commits nuevos. No hubo push, PR, merge o despliegue.

Se corrigieron trece archivos fuente en esta intervención, además de incorporar este documento. Los archivos de Supabase, dependencias/bloqueos, recursos territoriales y componentes independientes del Panel JAC conservaron sus huellas de la línea base. El listado siguiente incluye también el trabajo M4 acumulado; no significa que todos esos archivos se hayan editado ahora.

### Punto separado obligatorio — AppShell e Inicio

`src/components/app-shell.tsx` contiene el menú de cuenta M4 aprobado, el refinamiento de chevrons, las etiquetas accesibles y la sanitización del error de cierre. Las sesiones Superadmin conservan el control de cuenta anterior (icono «Salir» en vistas públicas y botón rotulado dentro del layout administrativo); el menú personal M4 queda disponible para los demás roles. Se mantiene oculta la navegación pública en el layout Superadmin y su barra lateral no cambia. Es un componente compartido y su alcance debe señalarse por separado en cualquier resumen futuro. `src/routes/index.tsx` y sus arreglos `MODULOS`/`ATAJOS` siguen intactos.

### Separación de estilos y trabajos independientes

El candidato temporal excluye los 37 recursos territoriales, `territory-visuals.ts`, los archivos independientes del Panel JAC y 83 reglas CSS exclusivas de esos elementos. Conserva las clases M4 que presentan el territorio seleccionado en Reportar y la escala tipográfica global confirmada. Los estilos independientes de JAC permanecen intactos en el worktree, fuera del índice.

Los documentos backend anteriores se conservan como requisitos/propuestas, no como implementación ni aprobación de cambios Supabase. Este documento describe el estado frontend actual y prevalece como informe de ejecución, sin reescribir decisiones históricas.

### Decisión de alcance resuelta

El proveedor de preferencias está montado globalmente en `__root.tsx`, por lo que ubicación y escala tipográfica aplican a todos los roles. El usuario confirmó expresamente que también deben aplicar a Superadmin. No se añadieron cambios a sus funcionalidades, panel, reportes, permisos, autenticación ni rutas. Las pruebas aisladas verificaron que la barra lateral y el control de cuenta previo permanecen en el layout Superadmin y que la sesión Superadmin tampoco recibe el menú personal M4 en vistas públicas.

La decisión no implica aislamiento por rol ni cambios en el proveedor; se mantienen las preferencias globales confirmadas. La build candidata final y el test de shell Superadmin cubren esa delimitación.

### Lista exacta del commit M4 delimitado

Los siguientes 42 archivos corresponden al commit local del Módulo 4. `src/styles.css` se prepara desde la base de Git con los estilos independientes del Panel JAC excluidos y las reglas M4 de Reportar conservadas. AppShell se mantiene como un punto separado en este resumen.

```text
docs/Modulo4_Estado_Final.md
docs/Modulo4_Propuesta_Disponibilidad_Vereda_Registro.md
docs/Modulo4_Requerimientos_Backend.md
public/manus-routes.json
src/components/admin/admin-access-options-panel.tsx
src/components/app-shell.tsx
src/components/module-section-heading.tsx
src/components/public-section-initial.tsx
src/components/reportar/admin-publication-warning-dialog.tsx
src/components/reportar/reportar-confirmation.tsx
src/components/reportar/reportar-details-step.tsx
src/components/reportar/reportar-evidence-step.tsx
src/components/reportar/reportar-flow.tsx
src/components/reportar/reportar-location-step.tsx
src/components/reportar/reportar-media-capture.tsx
src/components/reportar/reportar-review-step.tsx
src/components/reportes/etiqueta-procedencia-aviso.css
src/components/reportes/reporte-detalle-compartido.tsx
src/hooks/use-auth.tsx
src/hooks/use-m4-preferences.tsx
src/hooks/use-perfil-local.ts
src/hooks/use-reportar-flow.ts
src/hooks/use-reportes-locales.ts
src/lib/admin-phone-verification.ts
src/lib/reportar/local-history.ts
src/lib/reportar/location.ts
src/lib/reportar/mock-submit.ts
src/lib/reportar/types.ts
src/lib/reportar/video-processor.ts
src/routeTree.gen.ts
src/routes/__root.tsx
src/routes/acceso-administrativo.tsx
src/routes/acerca-de.tsx
src/routes/auth.tsx
src/routes/auth/reset-password.tsx
src/routes/avisos.css
src/routes/configuracion.tsx
src/routes/mi-perfil.tsx
src/routes/mis-reportes.tsx
src/routes/reportes.$id.tsx
src/routes/servicios.css
src/styles.css
```

Quedan fuera, conservados sin descartar: `src/components/admin/admin-operation.tsx`, `admin-shell.tsx`, `role-welcome.tsx`, `src/routes/admin/jac.tsx`, `src/components/admin/admin-jac-summary.tsx`, `src/lib/admin-jac-navigation.ts`, `src/lib/reportar/territory-visuals.ts`, sus estilos exclusivos y `public/images/territorios/catalogo/`. También quedan fuera cambios de Superadmin y el adaptador `AdminReportarFlow`; solo se incluyen cambios M4 en componentes compartidos y se preserva el control anterior dentro del layout Superadmin.

## 8. Limitaciones conocidas

El historial pertenece al origen web y perfil del navegador del dispositivo; cambiar de origen/dispositivo, borrar datos, fallar la cuota o la política de almacenamiento del navegador puede impedir recuperarlo. No hay sincronización ni respaldo todavía. La identidad local y la instantánea JAC no están protegidas frente a otra persona que pueda usar el mismo dispositivo y no son prueba de autenticidad remota.

La compatibilidad multimedia se validó en Chromium. No se promete una ruta de transcodificación compatible en todos los navegadores/dispositivos. Si no existe, se informa y se conserva el borrador. No se garantiza GPS con la aplicación suspendida o cerrada ni se simula seguimiento nativo.

El historial carga los registros y blobs disponibles; no se midió el rendimiento con historiales extensos ni se implementó paginación. Persisten observaciones menores anteriores, fuera de esta corrección: el token de fondo de limpiar búsqueda sin definición propia, un componente inicial sin uso y la disposición independiente del Panel JAC móvil. No se corrigieron ni se amplió el alcance.

La prevención atómica de asignaciones administrativas duplicadas y una consulta anónima segura de disponibilidad territorial requieren una futura revisión backend. El registro actual no implementa disponibilidad de asignaciones ni expone datos privados para simularla.

## 9. Siguiente etapa independiente

Después del cierre y revisión se planificarán, por separado: descarga individual; exportación ZIP estándar sin contraseña y con aviso de privacidad; importación combinada sin reemplazo ni duplicados y etiqueta Importado; PDF individual fiel a la referencia aprobada; compartir mediante enlace público cuando exista publicación/backend.

Estas mejoras no están implementadas, no son criterios de cierre del Módulo 4 y no se iniciaron durante esta intervención. Tampoco se avanzó a otros módulos.
