# AlertaVereda — Estado final del Módulo 4

**Fecha de revisión:** 11 de noviembre de 2026. **Estado:** correcciones funcionales y alcance revisados; commit local autorizado tras la verificación final. Este documento se incorpora a `docs/` con autorización expresa. No se harán cambios remotos ni despliegues.

## 1. Alcance y decisiones vigentes

El Módulo 4 integra Mi Perfil, Mis reportes, Acerca de, Configuración, Acceso administrativo y el Panel JAC. El trabajo es frontend y local. No implementa recepción oficial de reportes, publicación, sincronización, SMS, backend o persistencia remota. Las llamadas existentes de autenticación, consulta y RPC no se sustituyen ni amplían: durante las pruebas se interceptaron íntegramente mediante respuestas simuladas.

Los reportes creados en `/reportar` por una cuenta `admin_vereda` conservan origen e identidad JAC; no se añade una acción de creación dentro del Panel JAC. `AdminReportarFlow` y las funcionalidades propias de Superadmin/Módulo 5 quedan fuera de este complemento.

## 2. Identidad y perfil

Nombre y apellido comparten una única fuente de datos local en `use-perfil-local.ts`, persistida mediante `localStorage`. Mi Perfil confirma guardado solo si la escritura tuvo éxito. Reportar precarga ambos nombres combinados y permite cambiarlos únicamente para ese reporte; esa edición no modifica el perfil guardado. Mis reportes conserva el encabezado de identidad local o su identificación neutral cuando no existe perfil.

Para JAC se conserva en el registro de IndexedDB una instantánea de la cuenta creadora: identificador de perfil y nombre completo. El nombre administrativo continúa proviniendo del perfil autenticado, con su comportamiento de solo lectura existente. El origen es `jac`; para ciudadanos es `comunitario`. La instantánea no contiene correo, teléfono, tokens ni credenciales y no constituye una certificación remota. Los registros antiguos sin esa instantánea siguen siendo legibles; no se inventa una identidad retrospectiva.

Las opciones de avatar público y fotografía personal privada permanecen informativas. No hay selección, procesamiento o almacenamiento de imágenes del perfil. No se confunden con evidencias de reportes.

### Panel JAC — complemento del Módulo 4

El acceso sigue usando el `AdminGate` local y el rol/asignación existentes. La cabecera identifica Panel JAC, la bienvenida territorial no se puede omitir y permanece visible en el resumen y en las tres vistas operativas. El resumen presenta conteos y accesos a reportes pendientes, publicaciones activas y reportes revisados; los parámetros `vista` inválidos vuelven al resumen.

La interfaz presenta carga, error, reintento y conteos disponibles. Permite aprobar/rechazar reportes y cerrar/retirar publicaciones mediante las RPC existentes, sin cambiar sus contratos. El JAC no recibe controles de purga; estos solo se renderizan en alcance global cuando la cuenta es Superadmin. El filtro de vereda del frontend orienta la vista y **no es una garantía de autorización**: no se modificaron RLS, permisos ni backend.

La bienvenida consume 34 ilustraciones 3D de veredas, una ilustración separada de la cabecera municipal Ebéjico centro y la fotografía de referencia de Sevilla. Son 36 recursos/rutas únicos; Sevilla no se cuenta como vereda y Ebéjico centro es cabecera, no una vereda adicional. La fotografía de referencia de Ebéjico centro no tiene consumidor aprobado y queda excluida.

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

| Comprobación                                                                                      | Resultado                                                                                                                                             |
| ------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------- |
| TypeScript `tsc --noEmit` del checkout                                                            | Correcto                                                                                                                                              |
| ESLint completo `npm run lint`                                                                    | Cero errores; nueve advertencias de Fast Refresh no bloqueantes                                                                                       |
| Prettier de todo `src/` y archivos intervenidos                                                   | Correcto                                                                                                                                              |
| `git diff --check`                                                                                | Correcto                                                                                                                                              |
| Suite `test:photo-processor`                                                                      | 11/11                                                                                                                                                 |
| Suite `test:mi-vereda`                                                                            | 16/16                                                                                                                                                 |
| Build del árbol actual en copia temporal                                                          | Correcto                                                                                                                                              |
| TypeScript y build de una copia candidata sin assets territoriales ni archivos independientes JAC | Correctos; no constituye aprobación final de su delimitación                                                                                          |
| Autor con nombre y apellido, edición aislada y doble clic                                         | Correctos; un único registro comunitario                                                                                                              |
| Lote de fotos ralentizado y segunda selección concurrente                                         | Avance/selección bloqueados; aviso visible; primer lote conservado y tres fotos guardadas                                                             |
| JAC mediante `/reportar`                                                                          | Origen e identidad de cuenta conservados; foto persistida tras recarga y ampliable                                                                    |
| Público y JAC con tres fotos y un video                                                           | Procesamiento fallido conserva borrador; transacción fallida sin fila parcial; reintento crea un registro y conserva todos los medios                 |
| Fotografía v2                                                                                     | Sigue ampliable; registro original no se reescribe                                                                                                    |
| Video después de cerrar y reabrir todo Chromium                                                   | Persiste y se reproduce desde IndexedDB; video de más de 15 segundos rechazado                                                                        |
| GPS con reloj virtual                                                                             | Primera lectura inmediata, separación de cinco minutos, pausa/reanudación, rechazo, petición manual bajo Nunca y fallo honesto de persistencia        |
| Registro con código DEV visible                                                                   | Alta simulada correcta; no añade teléfono/cargo al payload; once cargos, selección única y 34 veredas                                                 |
| Rutas públicas                                                                                    | 36 combinaciones: nueve pantallas, escritorio/móvil y Día/Noche; sin desbordamiento horizontal en los casos probados                                  |
| Acerca de a 125 %, 130 %, 135 % y 140 %                                                           | 16 combinaciones de tamaño/tema/dispositivo correctas                                                                                                 |
| Detalle público compartido                                                                        | DOM y RPC simulada idénticos al baseline en las cuatro combinaciones; sin errores de página en ese test                                               |
| Restablecimiento de contraseña simulado                                                           | Éxito, actualización fallida, cierre de sesión fallido y sesión inválida tratados correctamente                                                       |
| Matriz de acceso JAC                                                                              | Invitado, solicitud pendiente, cuenta suspendida y cuenta sin asignación denegados; JAC no entra a `/admin/jac-superadmin` ni `/admin/gestion`        |
| Vistas y parámetros JAC                                                                           | Resumen y tres vistas; `vista` inválida se normaliza a resumen; conteos mock 3/4/2                                                                    |
| Carga, errores y reintentos JAC                                                                   | Carga demorada observada; errores terminales de reportes/publicaciones y recuperación mediante reintento                                              |
| Acciones JAC                                                                                      | Aprobación, rechazo, cierre y retiro probados con RPC mock; motivo vacío no invoca RPC; sin escrituras reales                                         |
| Purga y regresión Superadmin                                                                      | Cero controles de purga JAC; seis en operación global Superadmin. Snapshots de shell, bienvenida y operación global idénticos al baseline normalizado |
| Catálogo visual territorial                                                                       | 34 veredas más Ebéjico centro y Sevilla; 36 rutas/IDs únicos, todos presentes y sin hashes de imagen duplicados                                       |
| Responsivo JAC                                                                                    | 16 combinaciones de resumen/vistas, Día/Noche y escritorio/móvil (1440/390 px); sin overflow horizontal                                               |

El formato global continúa señalando dos documentos preexistentes, `docs/modulo-2-auditoria-reportar-dependencias.md` y `docs/pendientes-backend.md`. No se corrigieron ni forman parte del commit candidato. El build conserva advertencias no bloqueantes de dependencias (`use client`) y de Nitro `inlineDynamicImports`/`codeSplitting`; no se cambiaron presets ni infraestructura.

Los arneses temporales corrigieron expectativas de carga/error y normalizan únicamente el atributo de instrumentación `data-tsd-source` y espacios en `class` al comparar DOM de desarrollo. Los resultados de la tabla corresponden a las ejecuciones finales correctas, no a intentos iniciales del arnés.

## 7. Delimitación Git y commits locales

**Rama:** `pr-4-1-territory-catalog-assets`. **Commit base M4 preservado:** `6e66b608bbe7af173bd0cb0e3b24eeb6dcb7abac` (`feat: complete module 4 profile and local reports`), con 42 archivos. El complemento JAC se incorpora en un commit local hijo con el mensaje exacto `feat: complete JAC admin panel for module 4`. No se reescribe el commit base y no se hace push, PR, merge ni despliegue.

La lista base de 42 archivos permanece asociada exclusivamente al commit M4 anterior. El complemento se delimita aparte a ocho archivos fuente, este informe y los 36 recursos territoriales consumidos. No incluye tablas, migraciones, políticas, funciones Supabase, dependencias, bloqueos ni archivos ajenos al Módulo 4.

### Punto separado obligatorio — AppShell e Inicio

El commit base M4 contiene los cambios aprobados de `src/components/app-shell.tsx` para el menú de cuenta, chevrons, etiquetas accesibles y sanitización del cierre; ese alcance se mantiene como punto separado. **Este complemento JAC no modifica `app-shell.tsx`.** `src/routes/index.tsx` y sus arreglos `MODULOS`/`ATAJOS` tampoco se modifican. El layout y el control de cuenta Superadmin del commit base se conservaron; los snapshots comparados para este complemento son idénticos al baseline normalizado.

### Delimitación JAC, Superadmin y recursos territoriales

Los selectores agregados a `src/styles.css` quedan acotados a `.admin-jac`, `.admin-operation-local`, `.role-welcome-jac` y `.admin-area-link-upcoming`; no añaden reglas generales para Superadmin. Se integran 36 recursos usados: 34 ilustraciones de vereda, la ilustración de Ebéjico centro y la foto de referencia de Sevilla. De los 37 archivos físicos del catálogo disponible, `public/images/territorios/catalogo/cabecera/fotografia-referencia-ebejico-centro.png` queda sin uso y fuera del commit. Las tres imágenes generales de Reportar no se modifican.

El cambio de AdminOperation se limita a vistas y estados locales; las consultas/RPC globales se compararon con el baseline. Los controles de purga permanecen bajo `scope === "global" && esSuperadmin`; no se invocaron en pruebas. El filtro territorial en cliente no sustituye seguridad de servidor. Los documentos backend anteriores siguen siendo requisitos/propuestas, no implementación ni aprobación de cambios Supabase.

### Decisión de alcance resuelta

El proveedor de preferencias está montado globalmente en `__root.tsx`, por lo que ubicación y escala tipográfica aplican a todos los roles. El usuario confirmó expresamente que también deben aplicar a Superadmin. No se añadieron cambios a sus funcionalidades, panel, reportes, permisos, autenticación ni rutas. Las pruebas aisladas verificaron que la barra lateral y el control de cuenta previo permanecen en el layout Superadmin y que la sesión Superadmin tampoco recibe el menú personal M4 en vistas públicas.

La decisión no implica aislamiento por rol ni cambios en el proveedor; se mantienen las preferencias globales confirmadas. La build candidata final y el test de shell Superadmin cubren esa delimitación.

### Lista del commit base M4 (42 archivos)

La siguiente lista coincide exactamente con los 42 archivos del commit base `6e66b608bbe7af173bd0cb0e3b24eeb6dcb7abac`. Ese commit no se reescribe. Los estilos JAC y los recursos territoriales se registran únicamente en el complemento independiente que sigue.

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

### Lista exacta del complemento JAC (45 archivos)

Incluye este informe, ocho archivos fuente y solo los 36 recursos consumidos por la bienvenida JAC. La fotografía de referencia de Ebéjico centro indicada arriba queda fuera.

```text
docs/Modulo4_Estado_Final.md
public/images/territorios/catalogo/cabecera/ilustracion-3d-ebejico-centro.png
public/images/territorios/catalogo/referencias/fotografia-sevilla.png
public/images/territorios/catalogo/veredas/L1-F1-C4.webp
public/images/territorios/catalogo/veredas/L1-F2-C1.webp
public/images/territorios/catalogo/veredas/L1-F2-C4.webp
public/images/territorios/catalogo/veredas/L1-F3-C1.webp
public/images/territorios/catalogo/veredas/L1-F3-C4.webp
public/images/territorios/catalogo/veredas/L2-F1-C1.webp
public/images/territorios/catalogo/veredas/L2-F1-C2.webp
public/images/territorios/catalogo/veredas/L2-F1-C4.webp
public/images/territorios/catalogo/veredas/L2-F2-C1.webp
public/images/territorios/catalogo/veredas/L2-F2-C4.webp
public/images/territorios/catalogo/veredas/L2-F3-C2.webp
public/images/territorios/catalogo/veredas/L2-F3-C3.webp
public/images/territorios/catalogo/veredas/L2-F3-C4.webp
public/images/territorios/catalogo/veredas/L3-F1-C3.webp
public/images/territorios/catalogo/veredas/L3-F2-C1.webp
public/images/territorios/catalogo/veredas/L3-F4-C3.webp
public/images/territorios/catalogo/veredas/L4-F1-C3.webp
public/images/territorios/catalogo/veredas/L4-F2-C2.webp
public/images/territorios/catalogo/veredas/L4-F2-C3.webp
public/images/territorios/catalogo/veredas/L4-F3-C1.webp
public/images/territorios/catalogo/veredas/L4-F3-C2.webp
public/images/territorios/catalogo/veredas/L4-F3-C3.webp
public/images/territorios/catalogo/veredas/L4-F4-C1.webp
public/images/territorios/catalogo/veredas/L4-F4-C2.webp
public/images/territorios/catalogo/veredas/L4-F4-C3.webp
public/images/territorios/catalogo/veredas/altos-del-brasil-v02.png
public/images/territorios/catalogo/veredas/guayabal-transicion-v02.png
public/images/territorios/catalogo/veredas/ilustracion_blanquizal_parcela_cafetera.png
public/images/territorios/catalogo/veredas/ilustracion_el_cedro_finca_cafetera.png
public/images/territorios/catalogo/veredas/ilustracion_el_socorro_porcicultura.png
public/images/territorios/catalogo/veredas/ilustracion_la_suiza_escuela_rural.png
public/images/territorios/catalogo/veredas/ilustracion_los_arenales_escuela_rural.png
public/images/territorios/catalogo/veredas/ilustracion_narino_escuela_rural.png
public/images/territorios/catalogo/veredas/ilustracion_sagua_escuela_rural.png
src/components/admin/admin-jac-summary.tsx
src/components/admin/admin-operation.tsx
src/components/admin/admin-shell.tsx
src/components/admin/role-welcome.tsx
src/lib/admin-jac-navigation.ts
src/lib/reportar/territory-visuals.ts
src/routes/admin/jac.tsx
src/styles.css
```

Los cambios de Superadmin, `AdminReportarFlow`, `app-shell.tsx`, `src/routes/index.tsx`, Supabase, dependencias y bloqueos permanecen fuera del complemento. El archivo territorial sin consumidor aprobado se conserva sin staging ni descarte.

## 8. Limitaciones conocidas

El historial pertenece al origen web y perfil del navegador del dispositivo; cambiar de origen/dispositivo, borrar datos, fallar la cuota o la política de almacenamiento del navegador puede impedir recuperarlo. No hay sincronización ni respaldo todavía. La identidad local y la instantánea JAC no están protegidas frente a otra persona que pueda usar el mismo dispositivo y no son prueba de autenticidad remota.

La compatibilidad multimedia se validó en Chromium. No se promete una ruta de transcodificación compatible en todos los navegadores/dispositivos. Si no existe, se informa y se conserva el borrador. No se garantiza GPS con la aplicación suspendida o cerrada ni se simula seguimiento nativo.

El historial carga los registros y blobs disponibles; no se midió el rendimiento con historiales extensos ni se implementó paginación. Persisten observaciones menores anteriores, fuera de esta corrección: el token de fondo de limpiar búsqueda sin definición propia, un componente inicial sin uso y la disposición independiente del Panel JAC móvil. No se corrigieron ni se amplió el alcance.

La prevención atómica de asignaciones administrativas duplicadas y una consulta anónima segura de disponibilidad territorial requieren una futura revisión backend. El registro actual no implementa disponibilidad de asignaciones ni expone datos privados para simularla.

## 9. Siguiente etapa independiente

Después del cierre y revisión se planificarán, por separado: descarga individual; exportación ZIP estándar sin contraseña y con aviso de privacidad; importación combinada sin reemplazo ni duplicados y etiqueta Importado; PDF individual fiel a la referencia aprobada; compartir mediante enlace público cuando exista publicación/backend.

Estas mejoras no están implementadas, no son criterios de cierre del Módulo 4 y no se iniciaron durante esta intervención. Tampoco se avanzó a otros módulos.
