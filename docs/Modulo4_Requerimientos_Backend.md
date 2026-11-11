# Módulo 4 — Requerimientos de backend de AlertaVereda

**Estado:** borrador técnico para revisión del propietario. Ninguna propuesta de este documento está aprobada para implementación.

**Base de revisión:** `origin/main` en `648b7c4e4dae26889d7c8e1e524e7b97292830ba`, revisado el 2 de noviembre de 2026. La estructura de Supabase se inspeccionó únicamente mediante consultas de metadatos de lectura al proyecto activo denominado **AlertaVereda**. No se consultaron registros personales ni se modificó el proyecto.

**Límite de etapa:** los seis módulos frontend deben completarse antes de iniciar el backend real. Este documento no autoriza cambios de esquema, migraciones, políticas, funciones, Storage, autenticación, código ni configuración.

## Convenciones de lectura

- **DEFINIDO:** requisito funcional confirmado en el prompt del Módulo 4 o en decisiones previas aprobadas.
- **EXISTENTE:** estructura o comportamiento observado en `main` o en el proyecto Supabase activo.
- **PROPUESTA TÉCNICA:** alternativa recomendada para discusión; no representa una decisión aprobada.
- **PENDIENTE DE APROBACIÓN:** decisión funcional, de seguridad o de arquitectura que debe resolver el propietario.
- **FUTURO:** trabajo que solo podrá considerarse cuando termine el frontend y se autorice expresamente.

Los nombres de entidades, campos, servicios y formatos que aparezcan en secciones de propuesta son ilustrativos. No son nombres finales de tablas, funciones, rutas ni columnas.

## 1. Introducción y propósito

Este documento reúne los requerimientos de backend que podría necesitar el Módulo 4 cuando llegue la etapa posterior de integración real. Su propósito es reducir las decisiones que un desarrollador tendría que adivinar y hacer visibles las dependencias con reportes, publicaciones, evidencias, veredas y acceso administrativo.

El Módulo 4 abarca la experiencia personal de una persona visitante y la entrada al acceso administrativo. La persona visitante puede guardar en su dispositivo un nombre y preferencias sin crear una cuenta personal. El acceso administrativo sigue siendo un flujo separado, basado en la autenticación y los roles que ya existen.

La propuesta debe revisarse y aprobarse antes de transformarse en diseño definitivo. No se ejecutó ni se solicita ejecutar SQL, migraciones, cambios de RLS, cambios de Storage o despliegues.

## 2. Alcance del Módulo 4

**DEFINIDO:** el menú de usuario ofrece Mi perfil, Mis reportes, Acerca de AlertaVereda, Configuración y Acceso administrativo. Perfil y preferencias son locales durante la fase frontend. La persona visitante no inicia sesión con Google ni obtiene una cuenta de habitante por guardar su nombre.

**DEFINIDO:** el historial personal es exclusivamente local. Guarda en el dispositivo los reportes registrados correctamente por el flujo local, permanece disponible entre sesiones y permite exportar/importar un respaldo. No requiere cuenta de habitante, Google, sincronización con servidores ni consulta privada al backend. Si se borra la aplicación o sus datos, o se cambia de dispositivo sin exportar antes, la copia local puede perderse.

**DEFINIDO:** las preferencias incluyen tamaño de texto, tema existente, modo de notificaciones y vereda de interés. La vereda de interés no es necesariamente residencia, no utiliza GPS y no restringe la consulta de otras veredas.

**DEFINIDO:** Mi Vereda es la sección para consultar información territorial y cambiar la vereda que se desea consultar. La vereda de interés es una preferencia personal para priorizar información y notificaciones. No se añade otra sección de consulta ni se limita el acceso a otras veredas. Mi Vereda conserva su funcionamiento actual.

**DEFINIDO:** el flujo de acceso administrativo debe conservar `/auth`, correo y contraseña, Google OAuth administrativo, recuperación de contraseña, solicitud de acceso, confirmación por correo, `useAuth`, roles, permisos y aprobación del Superadmin. La solicitud no otorga permisos automáticamente.

Quedan fuera del alcance de esta etapa documental cualquier implementación, cambio en los módulos terminados, reforma de Mi Vereda, alta de servicios pagos, cambio de proveedor, nueva cuenta personal, cambio de roles o modificación de políticas.

## 3. Arquitectura funcional y relación con los módulos existentes

La aplicación es un proyecto React con TanStack Start/Router, Vite y Nitro. El frontend usa el cliente `@supabase/supabase-js`. No se asume Next.js ni se propone sustituir el stack.

La experiencia personal del Módulo 4 es una capa local de la aplicación. No debe escribirse automáticamente en `public.perfiles`: esa tabla está vinculada a `auth.users` y forma parte del sistema autenticado existente. La relación entre un nombre local y el nombre del reportante es una precompletación de interfaz; por sí sola no prueba identidad, propiedad de un reporte ni autorización.

**EXISTENTE:** Reportar tiene un borrador local con nombre, territorio, categoría y evidencias. En la versión auditada, el adaptador de envío es de demostración local. La selección de vereda en Mi Vereda permite consultar un territorio; la vereda de interés tiene otra finalidad de preferencia personal. No se ha confirmado si ambas selecciones compartirán valor o serán independientes.

**DEFINIDO:** el historial personal almacena una copia local de los reportes que la persona realizó desde ese dispositivo. Se distingue de los reportes oficiales que existen en el sistema y de la consulta territorial de reportes de Mi Vereda. Guardar una entrada local no confirma que el servidor haya recibido o publicado un reporte.

**DEFINIDO:** Mi Vereda y las demás secciones terminadas no deben rediseñarse ni modificarse como parte de esta tarea. El historial personal no necesita una cuenta, sincronización ni consulta privada al backend. Los reportes oficiales y la vista territorial siguen siendo conceptos separados.

## 4. Estado técnico actual

### 4.1 Repositorio y documentación

**EXISTENTE:** el commit remoto actual de `main` coincide con la copia aislada revisada: `648b7c4e4dae26889d7c8e1e524e7b97292830ba`. La carpeta `docs/` ya contiene `pendientes-backend.md` y `modulo-2-auditoria-reportar-dependencias.md`. El documento presente debe complementar esas fuentes y no reemplazarlas ni duplicar su auditoría de Módulo 2.

Los archivos de referencia técnica incluyen `src/components/app-shell.tsx`, `src/routes/index.tsx`, `src/routes/auth.tsx`, `src/hooks/use-auth.tsx`, `src/components/theme-toggle.tsx`, `src/styles.css`, `src/components/reportar/`, `src/lib/reportar/mock-submit.ts`, `src/lib/reportes-publicos.ts`, `src/lib/mi-vereda-cartelera.ts` y `src/routes/mi-vereda.tsx`.

### 4.2 Módulo 4 en el frontend

**EXISTENTE:** `AccountControl` del AppShell muestra un enlace a `/auth` si no hay sesión y una acción de salida si hay sesión. No es todavía un menú con las cinco opciones personales. No se encontraron rutas de perfil local, historial personal, Acerca de o Configuración personal.

**EXISTENTE:** `useAuth` carga sesión y perfil desde Supabase. Los roles de aplicación incluyen `habitante`, `pendiente`, `admin_vereda` y `superadmin`; la autorización administrativa depende de cuenta activa y, para administrador de vereda, de una asignación activa. El flujo `/auth` admite correo/contraseña, Google OAuth administrativo, recuperación de contraseña y solicitud de acceso.

**EXISTENTE:** el formulario de solicitud actual recoge nombre, correo, contraseña y vereda solicitada. No recoge teléfono ni cargo. Si esos campos siguen siendo requisitos, se requiere una decisión de alcance antes de implementarlos.

**EXISTENTE:** el tema se aplica con tokens Día/Noche y se persiste en el navegador. No debe crearse un segundo selector de tema dentro de Configuración.

**EXISTENTE:** `package.json` no declara una propiedad `version`. La versión 1.0.0 de la referencia visual no se considera un valor oficial confirmado.

### 4.3 Reportes, identificadores y estados

**EXISTENTE:** `src/lib/reportar/mock-submit.ts` devuelve `mode: "local-preview"`, `publicId: null` y `submittedAt`. `src/components/reportar/reportar-flow.tsx` solo llama esa confirmación local y muestra que el identificador definitivo está pendiente. El flujo no está conectado a una operación de envío real del servidor.

**EXISTENTE:** `public.reportes` tiene un UUID `id`, un `habitante_id` nullable, `publicacion_tabla` nullable y `publicacion_id` nullable, además de datos de categoría, territorio, estado y revisión. La referencia de publicación es polimórfica: apunta a una de las tablas de categoría y no aparece como una relación FK declarada al destino.

Las publicaciones están en tablas separadas: `emergencias`, `vias`, `servicios` y `avisos`, cada una con su propio UUID. En los índices consultados solo se observó la clave primaria de cada tabla. Por eso, un UUID de publicación aislado no identifica por sí solo con seguridad el espacio de nombres de la tabla.

**EXISTENTE:** el código del Módulo 2 documenta un código público futuro `AV-XX-0001`, separado del ID interno, y lo deja pendiente de diseño e implementación backend. Ese código no debe sustituir la clave técnica.

**DEFINIDO (acuerdo más reciente del Módulo 4):** los cuatro estados públicos que deben contemplarse son En revisión, Verificado y activo, En atención y Verificado y solucionado. «Reportado» queda reservado para una posible evolución futura y no se incorpora al funcionamiento actual. No se agregan otros estados públicos.

**ANTECEDENTE EXISTENTE:** la documentación anterior del Módulo 2 describe un catálogo de tres estados y el código de `src/lib/reportes-publicos.ts` incluye En atención, además de valores de cierre o fallback. La definición más reciente de cuatro estados reemplaza la descripción anterior para el alcance de Módulo 4. La diferencia documental queda registrada para alinearse al plan backend; no es una decisión funcional pendiente ni autoriza cambiar módulos o contratos ahora.

### 4.4 Estructura Supabase observada en modo de solo lectura

**EXISTENTE:** el proyecto activo denominado AlertaVereda presenta tablas públicas `veredas`, `perfiles`, `emergencias`, `vias`, `servicios`, `avisos`, `reportes`, `admin_asignaciones`, `auditoria_admin` y `configuracion_sistema`. Las tablas enumeradas tenían RLS habilitado al momento de la consulta.

`veredas` se relaciona mediante UUID con perfiles, reportes, asignaciones administrativas y publicaciones de categoría. `perfiles.id` referencia `auth.users.id`; sus campos incluyen rol, vereda, estado de solicitud y estado de cuenta. `admin_asignaciones` conserva el alcance territorial y la vigencia de una asignación.

`reportes` permite un INSERT anónimo sujeto a condiciones de estado pendiente y vereda activa, entre otras comprobaciones. La política de lectura identificada se limita a Superadmin o personal con acceso administrativo territorial. No se identificó una política de lectura anónima que permita recuperar desde el servidor los reportes privados propios de una persona visitante.

**EXISTENTE:** las consultas públicas de Mi Vereda se realizan mediante `mi_vereda_cartelera` y `mi_vereda_historial`. La lectura de veredas activas está disponible para los roles públicos conforme a su política actual. Hay funciones de revisión y administración como `aprobar_reporte`, `rechazar_reporte`, `cerrar_publicacion`, `retirar_publicacion` y aprobación/rechazo de solicitudes administrativas. Varias rutinas existentes son `SECURITY DEFINER`; no deben reemplazarse ni ampliarse desde el Módulo 4 sin revisión y aprobación.

**EXISTENTE:** `auditoria_admin` conserva trazabilidad de acciones administrativas. Se observaron restricciones para impedir actualización o borrado de sus registros mediante el trigger correspondiente. `reportes` usa triggers existentes para preparación del reporte y limitación de envíos por vereda. No se propone duplicar estas responsabilidades en la capa personal.

**EXISTENTE:** se enumeraron cero Edge Functions desplegadas en el proyecto activo. Esto no impide evaluar una función futura, pero no debe confundirse con infraestructura ya disponible.

### 4.5 Storage y migraciones

**EXISTENTE:** se encontró un bucket `reportes-fotos` marcado como público, sin límites de tamaño ni lista de MIME declarados en los metadatos consultados. Las políticas observadas permiten INSERT desde `anon` y `authenticated` a ese bucket, lectura para administradores según alcance y lectura/borrado para Superadmin en procesos de administración. En un bucket público, la recuperación de un objeto por URL no queda protegida por las políticas de lectura del mismo modo que en uno privado; Supabase indica que el acceso de descarga en buckets privados sí se somete a RLS o a URL firmada [3] [4].

Este hallazgo **no** se interpreta como autorización para cambiar el bucket existente. Sí implica que no se debe suponer que `reportes-fotos` es un lugar privado para originales sensibles o fotos de perfil.

La rama `main` contiene siete archivos de migración versionados. La lista de migraciones aplicadas que devolvió el proyecto Supabase contiene cuatro entradas, con versiones y nombres que no coinciden uno a uno con esos archivos. La documentación del Módulo 2 ya identifica la reconciliación de migraciones como requisito previo a una fase backend. No se ejecutó diff, reparación ni migración.

## 5. Requerimientos de backend por área

### 5.1 Mi perfil

**DEFINIDO:** nombre requerido, apellido opcional; datos locales en la etapa frontend; no hay cuenta personal ni acceso Google para visitantes; la fotografía personal queda aplazada.

**DEFINIDO:** el perfil permanece en el dispositivo y puede incluirse en la exportación personal. La persona puede eliminarlo desde la aplicación con confirmación antes de la eliminación irreversible. No se crea ni actualiza una fila en `perfiles` por usar esta función. El nombre puede precompletarse en Reportar, pero no prueba identidad ni autorización.

**PROPUESTA TÉCNICA:** mantener perfil, historial y preferencias bajo una misma operación de respaldo local solo si la experiencia de producto lo confirma; permitir borrar perfil e historial de forma conjunta o por separado requerirá explicar claramente qué datos se eliminarán. La operación local no debe invocar una eliminación de registros oficiales del sistema.

### 5.2 Mis reportes

**DEFINIDO:** el flujo local registra el reporte en el dispositivo y, cuando ese registro concluye correctamente, el historial lo guarda automáticamente en el almacenamiento local. La entrada debe permanecer disponible entre sesiones y poder exportarse/importarse; no se pregunta si se activa el historial. Si falla el guardado local, la aplicación debe informar el fallo y no presentar el reporte como una entrada correctamente almacenada. Este registro local no confirma envío, recepción ni publicación por el servidor.

**DEFINIDO:** el historial local no se recupera desde el servidor, no se sincroniza entre dispositivos y no crea una cuenta de habitante. La copia se traslada mediante exportación/importación. Si la persona desinstala la aplicación, borra sus datos o cambia de dispositivo sin exportar, puede perder su historial.

**PROPUESTA TÉCNICA:** generar para cada entrada un identificador local estable y guardar la copia necesaria para reconstruir su tarjeta y detalle, además de los identificadores oficiales que ya estuvieran disponibles en el flujo local, si los hay. Su presencia en el respaldo no constituye credencial ni autoriza una consulta privada.

**DEFINIDO:** mantener separados (1) el historial personal almacenado en el dispositivo, (2) los reportes oficiales existentes en el sistema y (3) la consulta territorial que ofrece Mi Vereda. Ninguno sustituye a los otros.

### 5.3 Acerca de AlertaVereda

**DEFINIDO:** la sección contempla identidad y logotipo oficiales, nombre, lema «Vivir lejos no debería significar estar desinformado», propósito, información verificada, créditos, versión y espacios para contenidos legales. No deben inventarse alianzas, respaldos, reconocimientos ni información legal.

**PROPUESTA TÉCNICA:** mantener el contenido institucional estable en el bundle del frontend al inicio; la versión podría provenir de metadatos de compilación cuando exista una fuente formal aprobada. La configuración Supabase `configuracion_sistema` es actualmente de lectura restringida a Superadmin y se usa para configuración del sistema; no se recomienda reutilizarla automáticamente como CMS público.

Alternativas si el contenido requiriera edición sin despliegue:

- Contenido estático versionado con cada release: auditable y simple, pero una corrección requiere publicar una versión nueva.
- Registro de contenido gestionado con permisos y auditoría: permite actualización sin release, pero exige definir editor autorizado, revisión, historial y protección frente a contenido no aprobado.

**PENDIENTE DE APROBACIÓN:** la fuente oficial de versión; quién puede editar información institucional; si esos textos realmente deben salir del frontend; y el contenido, URL y responsables de los documentos legales. Hasta entonces, los espacios legales son marcadores no funcionales y no texto legal improvisado.

### 5.4 Configuración personal

**DEFINIDO:** tamaño de texto Pequeño, Normal o Grande; tema Día/Noche existente; cuatro preferencias locales de notificaciones; preferencia manual de vereda de interés.

**DEFINIDO:** mantener estas preferencias localmente y contemplar las básicas en la exportación/importación personal. Esta función no las sincroniza con el servidor ni crea una fila por visitante en Supabase.

**DEFINIDO:** el respaldo contempla perfil local y preferencias básicas acordadas. La persona puede eliminar sus datos locales; antes de una eliminación irreversible debe recibir una confirmación clara. Borrar datos locales no elimina reportes oficiales.

**PENDIENTE DE APROBACIÓN:** los detalles de compatibilidad de versiones del respaldo y el comportamiento ante preferencias desconocidas o referencias a veredas que ya no estén activas.

### 5.5 Vereda de interés

**DEFINIDO:** la vereda de interés es una preferencia personal manual para priorizar información y notificaciones relacionadas con esa vereda. No representa residencia, no usa GPS y no limita la consulta de otras veredas. Mi Vereda es la sección donde se consulta información territorial y se cambia la vereda que se desea consultar; su funcionamiento actual debe conservarse y no se crea otra sección para consultar veredas.

**EXISTENTE:** el catálogo actual se consulta desde `veredas`; el selector se encuentra integrado en `src/routes/mi-vereda.tsx` y su selección actual se mantiene en estado de pantalla, sin persistencia personal observada.

**PROPUESTA TÉCNICA:** guardar el UUID de vereda de interés en las preferencias locales, con un identificador estable que permita restaurarlo desde el respaldo. No reutilizarlo como domicilio, asignación administrativa o prueba de identidad.

**PENDIENTE DE APROBACIÓN:** si la vereda de interés y la selección activa de Mi Vereda compartirán el mismo valor o funcionarán de manera independiente. No crear una sección adicional ni cambiar el comportamiento de Mi Vereda mientras se resuelve.

### 5.6 Acceso administrativo

**EXISTENTE:** `/auth` ya tiene contraseña, Google OAuth para uso administrativo, recuperación de contraseña, solicitud de acceso con selección de vereda y verificación de permisos. `useAuth` carga perfil, rol y asignación. El usuario sin acceso administrativo no recibe acceso por el hecho de autenticarse.

**DEFINIDO:** el menú añade una advertencia antes de llegar al flujo existente, pero no se reconstruye la autenticación y una solicitud queda pendiente de aprobación del Superadmin.

**PROPUESTA TÉCNICA:** conservar el ciclo actual de Auth, `perfiles`, `admin_asignaciones`, funciones de aprobación y auditoría. La advertencia es una transición de interfaz y no requiere por sí sola una entidad nueva en backend.

**PENDIENTE DE APROBACIÓN:** si los campos teléfono y cargo mencionados en el alcance inicial siguen perteneciendo a la solicitud administrativa, y cuál sería su finalidad, visibilidad y retención. No se incorporan al modelo por inferencia.

## 6. Modelo de datos futuro propuesto

Esta sección es conceptual. **No** es un esquema aprobado, una migración ni una instrucción de crear tablas.

**EXISTENTE:** `reportes` es el registro inicial; las publicaciones oficiales se guardan en entidades separadas por categoría. `reportes` incluye un puntero compuesto `publicacion_tabla` + `publicacion_id`, y el proyecto conserva un registro de auditoría administrativa.

**DEFINIDO:** el historial personal no agrega una tabla o servicio de backend; su copia vive en el dispositivo y no altera las entidades oficiales existentes. Las entidades oficiales continúan siendo el sistema de registro de los reportes aceptados por el servidor.

- **PROPUESTA TÉCNICA — entrada personal local:** identificador local generado por el cliente, fecha de guardado y copia suficiente de los datos necesarios para reconstruir el historial. Pertenece al almacenamiento del dispositivo, no a una tabla central.
- **PROPUESTA TÉCNICA — identificadores del reporte:** conservar los identificadores oficiales que ya estén disponibles en el flujo local, si existen. Su inclusión en el respaldo sirve para reconstruir la copia local, no para consultar el backend ni para autorizar acceso.
- **PROPUESTA TÉCNICA — evidencia local:** identificador lógico, tipo, orden y metadatos aprobados, junto al binario local cuando se incluya en el respaldo. No usar la URL temporal de vista previa como almacenamiento permanente.
- **Preferencias locales:** tamaño de texto, tema, modo de notificaciones y UUID de vereda de interés. No requieren tabla remota bajo el alcance actual.
- **Suscripción de notificaciones:** concepto futuro de dispositivo y suscripción, separado de reportes y de la cuenta administrativa. Solo existiría después de aprobar servicio, permisos, retención y seguridad.
- **Contenido institucional:** mantenerlo estático salvo que se apruebe un flujo editorial y roles para gestionarlo.

**PENDIENTE DE APROBACIÓN:** detalles técnicos del esquema local y la compatibilidad del respaldo; normalización futura de evidencias del sistema oficial; retención de los objetos del backend; y si la vereda de interés compartirá valor con la selección activa de Mi Vereda. No está pendiente una identidad, sincronización o recuperación privada para el historial personal: no forman parte de esta función.

### Alternativas para referencias de publicación

- Usar la pareja `(publicacion_tabla, publicacion_id)` como referencia polimórfica. Es compatible con el esquema actual y evita reformar las cuatro tablas; requiere validar una lista permitida de tablas y no ofrece una FK genérica en PostgreSQL.
- Crear una entidad de publicación central con un UUID común y relaciones a las tablas de categoría. Facilita FKs y consultas uniformes, pero exige migración amplia y coordinación con módulos terminados; no se propone como cambio del Módulo 4.

**PROPUESTA TÉCNICA:** mientras se mantenga el esquema actual, tratar siempre tabla + UUID como par indivisible y resolver el destino en una capa controlada. No aceptar `publicacion_tabla` arbitraria del cliente para construir consultas dinámicas.

## 7. Relaciones entre entidades

Las siguientes relaciones son conceptuales y no están aprobadas como esquema backend. El historial personal permanece local:

- El perfil local es independiente de `auth.users` y `public.perfiles`. Su nombre puede copiarse al borrador de Reportar con confirmación, pero no crea una FK ni una cuenta.
- Una entrada personal puede conservar, como datos locales, los identificadores de reporte/publicación que el flujo ya haya registrado. Esa referencia no dispara una consulta privada al servidor ni una sincronización.
- Una publicación pertenece a una vereda mediante el contrato actual de la tabla de categoría. La vereda de interés es una preferencia local y no crea membresía, asignación administrativa ni residencia. No está definido si comparte valor con la selección activa de Mi Vereda.
- Las evidencias de la simulación frontend son archivos locales; las evidencias del futuro sistema oficial tendrán un contrato backend propio. Un respaldo exportado debe incluir los binarios si se aprueba esa opción, no sus URLs temporales.
- Una suscripción push, si se aprueba, corresponde a una instalación/navegador y a su autorización; puede filtrar por categorías y vereda de interés. No debe asociarse automáticamente a un perfil local como si fuera una persona verificada.
- El acceso administrativo continúa relacionado con `auth.users`, `perfiles`, `admin_asignaciones` y la auditoría existentes.

## 8. Identificadores y trazabilidad

### 8.1 Claves de reporte y publicación

**EXISTENTE:** `reportes.id` es UUID y clave primaria del reporte inicial. Cada tabla de publicación tiene su propio UUID. `reportes.publicacion_tabla` y `reportes.publicacion_id` son nullable y no constituyen una FK compuesta a una tabla común.

**PROPUESTA TÉCNICA:** conservar en el historial local todos los identificadores disponibles, en orden de fuerza:

1. `reportes.id` para el reporte oficial de origen.
2. La pareja `publicacion_tabla` + `publicacion_id` para la publicación por categoría.
3. El futuro código público `AV-XX-0001` como referencia humana, si se implementa conforme al requisito documentado del Módulo 2.
4. Un UUID de entrada local para deduplicación y rastreo de la copia del dispositivo.

No usar un ID local ni el código visible como sustituto del ID oficial. No asumir que `publicacion_id` solo es único entre las cuatro tablas.

### 8.2 Código público

**EXISTENTE:** la documentación M2 define un formato futuro `AV-XX-0001` y pide unicidad ante concurrencia. Todavía no se observó esa columna/index en las tablas revisadas.

**PENDIENTE DE APROBACIÓN:** definir qué significa el segmento `XX`, si el código identifica al reporte o a la publicación, si permanece al cerrar/retirar y qué datos puede revelar su consulta pública. El código no debe contener datos personales ni ser usado como secreto de acceso.

### 8.3 Trazabilidad de cambios

**EXISTENTE:** `auditoria_admin` guarda actor, acción, entidad, estado anterior/nuevo, motivo y metadatos para acciones administrativas. Las funciones y roles actuales implementan controles que deben revisarse en una futura fase.

**DEFINIDO:** el historial personal no se actualiza mediante consultas privadas al servidor ni se sincroniza. Si un dato de estado oficial aparece como parte de una copia local, no convierte el historial en registro oficial ni autoriza al cliente a cambiarlo.

## 9. Persistencia local y relación con el backend

### 9.1 Durante la etapa frontend

**DEFINIDO:** perfil, preferencias e historial son locales. No se debe mostrar un envío local como envío al servidor.

**PROPUESTA TÉCNICA:** evaluar IndexedDB para perfil, preferencias, historial y `Blob` de evidencias locales; mantener en `localStorage` solo ajustes pequeños que ya lo usan, como tema, si así lo decide la implementación frontend. IndexedDB permite almacenar datos estructurados y objetos compatibles con structured clone, incluidos archivos/blobs, pero sus cuotas y políticas de eliminación varían por navegador [7] [8].

**DEFINIDO:** los datos deben mantenerse disponibles entre sesiones mientras permanezcan en el dispositivo. La aplicación debe advertir que la desinstalación, el borrado de los datos de la aplicación/navegador, el modo privado o el cambio de dispositivo sin exportación pueden causar la pérdida de la copia local. No prometer persistencia incondicional: los navegadores pueden eliminar almacenamiento best-effort y sus cuotas varían [8].

**DEFINIDO:** la persona puede eliminar su historial y sus datos de perfil locales. Antes de una eliminación irreversible, la aplicación debe pedir confirmación y explicar el alcance; eliminar datos locales no elimina un reporte oficial existente.

### 9.2 Reporte local frente a reporte oficial

**EXISTENTE:** el adaptador auditado devuelve `mode: "local-preview"`, `publicId: null` y `submittedAt`. La demostración frontend no acredita que un reporte se haya recibido o publicado en el servidor.

**DEFINIDO:** el flujo local registra cada reporte en el dispositivo y el historial guarda automáticamente la entrada cuando ese registro y el guardado local concluyen correctamente. Debe conservarse entre sesiones. Ante un fallo de guardado, la interfaz informa que la entrada no quedó almacenada y no la presenta como guardada. Nada de esto representa recepción o publicación oficial por el servidor. No realiza sincronización, consulta privada ni recuperación desde el backend.

**PROPUESTA TÉCNICA para una futura integración backend de Reportar:** el sistema oficial debería devolver identificadores estables y su resultado de recepción; el frontend no debe fabricar identificadores o estados oficiales. Esa integración futura pertenece al contrato del sistema de reportes y no crea sincronización del historial personal.

Los cuatro estados públicos definidos son En revisión, Verificado y activo, En atención y Verificado y solucionado. «Reportado» se reserva para una evolución futura; estos estados oficiales no deben confundirse con el hecho local de que un formulario se registró correctamente en el dispositivo.

### 9.3 Sin sincronización ni recuperación privada del historial

**DEFINIDO:** no diseñar una recuperación privada desde el servidor, token por reporte, cuenta personal de habitante ni sincronización para esta funcionalidad. La exportación/importación del archivo es el medio previsto para trasladar la copia. Si se pierde el archivo y el almacenamiento local, el historial no puede recuperarse mediante esta función.

## 10. Historial personal y alcance de consulta

**DEFINIDO:** el historial personal se guarda automáticamente cuando el flujo local registra correctamente un reporte en el dispositivo. No depende de que la persona active una preferencia.

**EXISTENTE:** la versión auditada produce `local-preview` y carece de ID público; todavía no almacena un historial personal persistente. La futura demostración frontend debe guardar la entrada localmente sin presentarla como reporte oficial recibido por el servidor.

**DEFINIDO:** Mis reportes muestra la copia local de los reportes realizados desde ese dispositivo; no consulta reportes privados del servidor ni recupera datos de otros dispositivos. La exportación/importación restaura la copia del usuario y evita duplicados.

El historial local, los reportes oficiales y Mi Vereda tienen finalidades distintas:

- El historial personal es una copia en el dispositivo y se reconstruye desde su respaldo.
- Los reportes oficiales son los registros del sistema y sus estados autorizados.
- Mi Vereda permite una consulta territorial pública de reportes; no es el historial personal de una persona.

**PROPUESTA TÉCNICA:** si una futura fase requiere mostrar en la copia local los identificadores devueltos por un backend oficial, conservarlos como datos de la entrada. Su presencia no habilita ni implica una consulta de actualización al servidor.

## 11. Respaldo e importación/exportación

**DEFINIDO:** se debe poder exportar el historial para trasladarlo y restaurarlo en otro dispositivo, e importar un respaldo anterior. La aplicación debe validar estructura, versión e integridad, evitar duplicados y prevenir que una importación sobrescriba por accidente datos existentes. El archivo conserva identificadores y datos necesarios para reconstruir el historial, además del perfil local y las preferencias básicas.

**EXISTENTE:** todavía no se ha implementado exportador ni importador.

**PROPUESTA TÉCNICA:** el formato, el contenedor y los límites descritos abajo son alternativas para revisión, no decisiones de implementación aprobadas.

### 11.1 Alternativas de contenedor

- **JSON solo con metadatos:** liviano y fácil de inspeccionar. No traslada evidencias binarias y debe advertirlo claramente.
- **Archivo ZIP con manifiesto JSON y archivos binarios seleccionados:** mantiene relaciones entre registros y medios y evita codificar los binarios incluidos como texto. El contenedor puede crecer mucho y exige validar nombres, tamaño, integridad y compatibilidad. No se presupone que incluya todas las clases de evidencia.

**PROPUESTA TÉCNICA:** si se aprueba incluir una o más clases de evidencia binaria, estudiar un ZIP con `manifest.json` y archivos seleccionados referenciados por identificadores locales. No exportar URLs temporales ni objetos `File` como si fueran archivos recuperables. Si se decide no incluir binarios, el archivo debe advertirlo expresamente.

**DEFINIDO:** antes de exportar, advertir que el archivo puede contener información personal, ubicaciones y evidencias. La aplicación no debe compartir ni enviar automáticamente el respaldo a terceros o al servidor.

### 11.2 Estructura ilustrativa

La siguiente estructura es un ejemplo para discusión, no un contrato aprobado:

```json
{
  "format": "alertavereda-personal-backup",
  "formatVersion": 1,
  "exportedAt": "2026-11-02T17:00:00.000Z",
  "applicationVersion": null,
  "profile": {
    "name": "",
    "surname": null
  },
  "preferences": {
    "textSize": "normal",
    "theme": "light",
    "notificationMode": "recommended",
    "interestVeredaId": null
  },
  "reports": [
    {
      "localEntryId": "uuid-local",
      "savedAt": "2026-11-02T17:00:00.000Z",
      "serverReference": {
        "reportId": null,
        "publicationTable": null,
        "publicationId": null,
        "publicCode": null
      },
      "reportCopy": {
        "category": "",
        "title": "",
        "description": "",
        "veredaId": null,
        "place": ""
      },
      "evidence": []
    }
  ]
}
```

**DEFINIDO:** los identificadores locales y todos los datos necesarios para reconstruir las entradas deben preservarse al exportar/importar. Los identificadores oficiales son opcionales y solo se incluyen si el flujo local ya los tiene; no se usan para recuperar datos privados del servidor. El respaldo contempla el perfil local y las preferencias básicas.

**DEFINIDO:** la exportación debe advertir sobre información personal, ubicación y evidencias que podrían quedar expuestas si el archivo se comparte. La aplicación no comparte el archivo automáticamente.

**PROPUESTA TÉCNICA:** el formato final debería declarar aplicación y versión del esquema; generar timestamps ISO 8601 con zona; validar enums y UUID; y tratar la versión de la app como opcional mientras el proyecto no defina una fuente de versión. No incluir credenciales Auth, tokens de sesión, secretos de recuperación ni endpoints de notificaciones en claro.

### 11.3 Validación de formato e integridad

**PROPUESTA TÉCNICA:** antes de importar, el cliente debería:

- validar el tipo de archivo, firma/encabezado del contenedor y versión;
- limitar tamaño total, cantidad de entradas, longitud de textos y tamaño de cada medio;
- validar todos los campos contra un esquema permitido, no confiar en tipos declarados por el archivo;
- rechazar rutas de archivo absolutas, `..`, nombres duplicados y archivos ejecutables;
- validar tipo MIME a partir del contenido cuando sea viable, además de extensión y metadata;
- comprobar hashes de medios y que cada referencia apunte a un elemento incluido;
- mostrar una vista previa de cantidad de registros, preferencias y medios antes de persistir;
- ejecutar la importación de forma transaccional o con rollback para evitar una base local parcialmente corrupta.

**PROPUESTA TÉCNICA:** calcular SHA-256 para detectar corrupción accidental comparando el contenido con el manifiesto; no tratarlo como prueba de autoría, porque quien modifica el archivo también puede modificar su hash. La API Web Crypto no procesa entradas en streaming en `SubtleCrypto.digest()`; archivos grandes pueden exigir una estrategia distinta para no cargar todo en memoria [9].

### 11.4 Duplicados y conflictos

**DEFINIDO:** la importación debe prevenir duplicados.

**PROPUESTA TÉCNICA:** considerar duplicado exacto si coincide `localEntryId`; también si coincide `reportes.id`; y, si no existe ese ID, si coincide la pareja `(publicacion_tabla, publicacion_id)`. No usar solo el UUID de publicación.

**PROPUESTA TÉCNICA:** si no hay identificador común, una coincidencia por texto, fecha o ubicación solo sería una sugerencia, no una prueba de duplicado; no fusionar automáticamente reportes diferentes por parecido de sus campos.

**DEFINIDO:** la importación no debe sobrescribir información existente accidentalmente.

**PROPUESTA TÉCNICA:** antes de importar, ofrecer una vista previa y resolver conflictos sin sustituir entradas locales existentes de forma silenciosa. El archivo importado reconstruye la copia local; no actualiza ni modifica el estado oficial del servidor.

**PENDIENTE DE APROBACIÓN:** política exacta de combinación o reemplazo del perfil y las preferencias; si se permite importar parcialmente registros válidos; y si la operación será todo-o-nada.

**PROPUESTA TÉCNICA:** como valor seguro inicial, dejar la copia actual intacta hasta que la vista previa sea confirmada.

### 11.5 Versiones y formatos incompatibles

**PROPUESTA TÉCNICA:** admitir versiones anteriores solo mediante transformaciones explícitas y testeadas. Si la versión del archivo es futura o desconocida, rechazarla con instrucciones para actualizar la aplicación, sin intentar interpretarla de forma permisiva.

**PROPUESTA TÉCNICA:** un checksum protege integridad, pero no autenticidad. Si se requiere protección frente a lectura del archivo perdido, evaluar cifrado con frase de paso y advertir que perder la frase puede hacer imposible recuperar el contenido.

**PENDIENTE DE APROBACIÓN:** si el respaldo debe cifrarse siempre, ofrecer cifrado opcional o exportarse sin cifrar; quién conserva/recupera la frase; si se permitirá importación parcial; y cuáles versiones anteriores se soportan.

### 11.6 Recuperación de perfil y preferencias

**PROPUESTA TÉCNICA:** el archivo puede incluir nombre, apellido y preferencias no sensibles al servicio. No debe incluir tokens de sesión ni usar una cuenta de Google. Las preferencias importadas requieren validar enums y UUID; si la vereda ya no existe o dejó de estar activa, no debe cambiar la selección territorial de Mi Vereda ni bloquear el resto de la restauración.

**PENDIENTE DE APROBACIÓN:** si importar un respaldo reemplaza o combina el perfil y las preferencias actuales.

**PROPUESTA TÉCNICA:** no sobrescribir el perfil ni las preferencias actuales silenciosamente.

## 12. Tratamiento de fotografías y evidencias

### 12.1 Estado actual

**EXISTENTE:** el borrador de Reportar conserva objetos `File` y URLs `URL.createObjectURL` de uso local. La URL de vista previa es temporal y no debe exportarse como archivo ni usarse como identificador persistente.

**DEFINIDO:** deben distinguirse (1) las evidencias locales de una simulación frontend, (2) las evidencias que posteriormente se almacenarán en el sistema oficial y (3) los binarios que, si se aprueba esa opción, formen parte de un respaldo exportado. La demostración del Módulo 4 funciona localmente y no modifica el bucket ni depende de una integración real con Supabase.

**PROPUESTA TÉCNICA:** persistir las evidencias locales en una forma que sobreviva a la sesión (por ejemplo, un `Blob` en IndexedDB) y exportar el binario real dentro del contenedor. No confiar en una URL de `createObjectURL`, un objeto `File` en memoria ni una referencia de Storage como respaldo permanente.

La auditoría del Módulo 2 documenta hasta tres fotos y un video por reporte, con límite frontend de video de 15 segundos y 15 MB, procesamiento local de fotos con objetivo aproximado de 600 KB y metadatos de captura cuando existan. El esquema actual de `reportes` y tablas de publicación contiene un `foto_url`, no un contrato persistente de galería múltiple ni relación de video.

**DEFINIDO EN MÓDULO 2:** originales de emergencias pendientes deben permanecer protegidos; la vista pública debe utilizar derivados físicamente procesados y comprimidos, no un `blur()` CSS del archivo original.

### 12.2 Alternativas de respaldo

- **No incluir medios:** exportar solo metadata y advertir que las evidencias no se trasladan. Reduce tamaño y exposición, pero el respaldo queda incompleto respecto a imágenes/videos.
- **Metadatos de evidencia:** describen el elemento (por ejemplo, tipo u orden) sin incorporar el archivo binario. Su conjunto exacto también debe definirse.
- **Fotografías procesadas:** derivados comprimidos destinados a reducir tamaño o exposición respecto del original; son archivos independientes y no equivalen al original.
- **Fotografías originales:** archivos fuente que pueden conservar más detalle o información identificable y requieren consideración de privacidad aparte.
- **Videos:** archivos binarios distintos de las fotos, con potencial de aumentar significativamente el tamaño del respaldo.

**PROPUESTA TÉCNICA:** si se aprueba transportar evidencia binaria local, incluir en el respaldo ZIP únicamente las clases de archivos que se hayan elegido y mantener un manifiesto asociado. No tratar el nombre de archivo ni una URL como identidad del objeto. La propuesta no presupone incluir simultáneamente fotografías procesadas, originales y videos.

El respaldo de la base de datos Supabase no incluye el contenido de los objetos de Storage; conserva metadata de la base, por lo que la protección de archivos requiere una estrategia separada [5] [6]. El respaldo personal del navegador es también distinto de las copias de seguridad de la plataforma.

### 12.3 Privacidad, tamaño y formatos

No reutilizar el bucket público `reportes-fotos` como ubicación de originales sensibles. Supabase documenta que un bucket público permite recuperar archivos por URL sin aplicar el mismo control de descarga que un bucket privado [4]. Las políticas de `storage.objects` controlan operaciones específicas como subir, listar o borrar; la llave `service_role` evita RLS y no debe exponerse en el navegador [1] [3].

**PROPUESTA TÉCNICA:** cuando se autorice el backend de evidencias, evaluar originales en almacenamiento privado y derivados públicos separados, con metadata que permita distinguirlos. La carga debe validar MIME real, tamaño, extensión, cantidad y relación con reporte; la descarga de originales debe requerir autorización. Los objetos derivados seguros no deben apuntar al original.

No incluir en el respaldo URLs firmadas como sustituto del contenido: expiran y no prueban que el usuario podrá recuperarlas. Cualquier ubicación, metadato EXIF, rostro o información identificable requiere evaluación de minimización.

**PENDIENTE DE APROBACIÓN:** si se exportan metadatos de evidencia; si se incluyen fotografías procesadas; si se incluyen fotografías originales; si se incluyen videos; qué combinación, si alguna, se permitirá; establecer el límite máximo del archivo de respaldo; permitir exportar evidencias privadas; política de cifrado; y comportamiento si falta un archivo o su hash no coincide. No se presume que deban exportarse todas las clases.

## 13. Estados y permisos de reportes

### 13.1 Catálogo de estados

**DEFINIDO:** los cuatro estados oficiales que deben contemplarse son:

1. En revisión.
2. Verificado y activo.
3. En atención.
4. Verificado y solucionado.

«Reportado» queda reservado para una posible evolución futura y no forma parte del funcionamiento actual. No se agregan otros estados públicos.

**ANTECEDENTE EXISTENTE:** la documentación previa del Módulo 2 enumera tres estados públicos. La decisión más reciente sustituye esa definición para el alcance actual de Módulo 4; la discrepancia queda registrada para alineación documental durante la planificación backend y no vuelve a abrirse como decisión funcional.

**EXISTENTE EN CÓDIGO:** `EstadoPublico` incorpora En atención y Verificado y solucionado, pero también resultados de fallback y cierre. La normalización deriva algunos valores desde `estado_operativo` y `resultado`.

Los estados internos como `rechazado`, `retirado` o `no_solucionado`, y los fallbacks como «Estado no disponible», no se añaden por ello al catálogo público definido. La traducción desde los campos internos existentes es una tarea técnica futura; no altera la lista de cuatro estados.

### 13.2 Persistencia y autoridad

**PROPUESTA TÉCNICA:** guardar transiciones oficiales en el registro de reporte/publicación y en el mecanismo de auditoría administrativa existente, no en la entrada del historial personal. La copia local del historial no cambia estados oficiales ni se consulta privadamente para sincronizarlos.

Los estados actuales se distribuyen entre `reportes.estado`, los estados operativos de las tablas de categoría y `resultado`. No asumir que un único campo nuevo sea necesario. En una fase técnica posterior se mapearán esos campos al catálogo de cuatro estados ya definido y se validarán los contratos de las RPC de Mi Vereda, sin reabrir ni ampliar la lista pública.

### 13.3 Quién puede cambiar estados

**DEFINIDO:** una persona visitante no puede modificar estados oficiales. El servidor debe aceptar cambios de estado solo mediante permisos administrativos existentes o un mecanismo posterior que se apruebe para actores autorizados.

**EXISTENTE:** las funciones administrativas y RLS consideran Superadmin y acceso activo por vereda; la auditoría registra acciones. Las funciones `SECURITY DEFINER` requieren revisión explícita de privilegios y límites. Supabase recomienda combinar privilegios SQL y RLS, proteger tablas/funciones expuestas y probar escenarios de autorización permitidos y denegados [1] [2].

## 14. Preferencias personales y veredas de interés

**DEFINIDO:** las preferencias frontend se guardan localmente. Tema usa un control ya existente. La vereda de interés es manual, voluntaria y no territorializa a la persona.

**PROPUESTA TÉCNICA:** representar preferencias como un objeto local versionado, con enum para `textSize`, enum para `notificationMode`, `interestVeredaId` nullable y tema Día/Noche. Validar los valores al leer y migrar localmente cambios de formato de manera conservadora.

Mi Vereda es la sección de consulta territorial y permite cambiar qué vereda se consulta; la vereda de interés prioriza información/notificaciones personales. No debe usarse para asignar permisos administrativos ni para restringir las consultas de Mi Vereda.

**PENDIENTE DE APROBACIÓN:** si la vereda de interés y la selección activa de Mi Vereda compartirán el mismo valor o funcionarán de manera independiente. También quedan por definir los detalles técnicos al restaurar una preferencia cuyo UUID ya no corresponda a una vereda activa.

## 15. Notificaciones futuras

### 15.1 Preferencias definidas

La interfaz contempla:

1. Sin notificaciones.
2. Recomendadas: emergencias de cualquier vereda y reportes de la vereda de interés.
3. Todas las notificaciones.
4. Solo emergencias de cualquier vereda.

**DEFINIDO:** durante el frontend son preferencias visuales y locales. Todavía no existe un servicio real de entrega y no se pedirán permisos del dispositivo sin consentimiento.

### 15.2 Componentes que exigiría una entrega real

**PROPUESTA TÉCNICA:** una futura entrega web push tendría que acordar y construir al menos:

- service worker activo y comportamiento cuando la página está cerrada;
- acción explícita para pedir permiso, explicación previa y forma de desactivar;
- suscripción por navegador/dispositivo y mecanismo de revocación cuando se cierre sesión, cambie el navegador o la persona retire consentimiento;
- persistencia protegida de endpoint y claves de suscripción, sin exponerlas en una respuesta pública;
- asociación con la preferencia y la vereda de interés, si el dueño aprueba esa semántica;
- reglas de qué eventos generan avisos, deduplicación, frecuencia, expiración y reintentos;
- endpoint o función del servidor con autenticación de origen, validación, control de abuso y límites de envío;
- telemetría mínima, eliminación de suscripciones inválidas y pruebas de consentimiento.

MDN indica que el permiso debe solicitarse en respuesta a una acción del usuario; para avisos persistentes en móviles puede requerirse un service worker. Push requiere una suscripción del dispositivo asociada a un service worker, y su endpoint funciona como una URL de capacidad que debe mantenerse privada [10] [11].

### 15.3 Pendientes para una etapa futura

**PENDIENTE DE APROBACIÓN:** si se implementa un servicio real de Push; proveedor o protocolo; retención de endpoints; tratamiento de varios navegadores; eventos y categorías notificables; política de horario/frecuencia; y eliminación/consentimiento. Las preferencias y el historial personal permanecen locales; esta posibilidad futura no introduce una cuenta de habitante ni sincronización del historial.

## 16. Acceso administrativo y autenticación

**EXISTENTE:** la solicitud administrativa usa Auth y metadata de registro, se asocia a una vereda solicitada y está sujeta a decisión del Superadmin. `perfiles` tiene FK a `auth.users`; `admin_asignaciones` contiene relación con perfil, vereda, actor asignador y vigencia. Las funciones de aprobación/rechazo y el centro de gestión del PR #17 deben mantenerse.

**DEFINIDO:** la ruta del menú hacia administración incluye un aviso de acceso restringido y después reutiliza `/auth`. Google OAuth es administrativo y no se debe presentar como opción para guardar el perfil personal.

**PROPUESTA TÉCNICA:** mantener identidad administrativa como única identidad autenticada del alcance; la advertencia previa es interfaz y no genera permisos. La autorización final siempre reside en políticas y funciones del servidor, no en que un componente esté oculto.

Supabase indica que las políticas RLS no reemplazan los privilegios SQL, que las funciones expuestas necesitan controles de ejecución y que las funciones `SECURITY DEFINER` requieren revisión [1] [2]. Las llaves que omiten RLS deben permanecer en entorno servidor, no en el cliente [1] [3].

## 17. Seguridad y privacidad

### 17.1 Principios propuestos

**PROPUESTA TÉCNICA:** mantener mínimo privilegio para cada operación; aplicar RLS y privilegios SQL de forma coordinada; limitar la superficie expuesta por Data API; mantener secretos en servidor; probar tanto accesos permitidos como denegados; y revisar cada función con elevación de privilegios.

Los reportes pueden contener descripción, nombre, ubicación precisa y evidencia. Exportaciones y archivos de navegador pueden llevar datos personales y revelar información de localización. El contenido debe minimizarse según necesidad y retención aprobada.

### 17.2 Lectura de reportes y límite del historial local

**EXISTENTE:** la política observada para `reportes` no ofrece lectura anónima del reporte privado propio. Las personas `anon` pueden insertar bajo condiciones, pero la lectura identificada es para administradores según su alcance territorial.

**DEFINIDO:** Mis reportes no depende de una lectura privada de Supabase para funcionar. No se diseñará para esta función un endpoint por UUID, token de capacidad, cuenta personal ni mecanismo de recuperación desde el servidor. La observación RLS se conserva como antecedente del backend; no es una decisión pendiente de abrir lectura privada.

### 17.3 Evidencias y Storage

**EXISTENTE:** el bucket actual `reportes-fotos` es público y permite inserción anónima/autenticada conforme a las políticas que se observaron en la auditoría previa. No se realizó investigación adicional ni cambio en esta actualización. No inferir que el SELECT de `storage.objects` para personal administrativo convierte el bucket en privado; Supabase describe el acceso por URL de buckets públicos como accesible para quien conoce la URL [4].

**DEFINIDO PARA EL MÓDULO 4 FRONTEND:** la demostración de historial y evidencias se resuelve localmente; no modifica el bucket ni depende de una integración real con Supabase.

**PROPUESTA TÉCNICA:** si en la fase posterior se implementan evidencias privadas, evaluar separación entre originales protegidos y derivados aprobados para publicación; límites de tipo/tamaño; política de acceso a cada operación; y pruebas de lectura anónima denegada para originales. Los resultados del Módulo 2 sobre emergencias pendientes siguen vigentes y deben integrarse en ese diseño.

### 17.4 Importación de archivos

**PROPUESTA TÉCNICA:** tratar el archivo importado como entrada no confiable; no ejecutar contenido ni aceptar archivos solo porque su nombre parezca seguro. Validar estructura, tamaño, MIME, rutas, referencias y hashes antes de escribir. Un hash verifica consistencia del archivo, no la identidad de quien lo exportó.

**DEFINIDO:** antes de importar, no sobrescribir la copia local existente accidentalmente. Antes de eliminar historial o perfil local, pedir confirmación explícita porque la eliminación es irreversible.

### 17.5 Backups de la plataforma

Las copias de base de datos y el respaldo personal exportable son procesos diferentes. Supabase informa que los objetos de Storage no se incluyen en los backups de base de datos y que las opciones disponibles dependen del servicio/plan [5]. No se solicita activar PITR ni contratar un plan. Cualquier estrategia de continuidad y presupuesto requiere aprobación por separado.

## 18. Dependencias con otros módulos

- **Reportar y Módulo 2:** el adaptador actual es una simulación local. El Módulo 4 guarda la entrada local cuando el flujo local la registre correctamente; esto no confirma que el servidor haya recibido un reporte oficial. Los identificadores oficiales que existan se conservan como datos de respaldo, no como medio para recuperar datos privados.
- **Mi Vereda:** conserva catálogo, selección y consulta territorial pública. No debe modificarse ni duplicarse. La vereda de interés prioriza contenido/notificaciones; queda pendiente si comparte valor con la selección activa de Mi Vereda.
- **Cartelera pública, categorías y detalle:** mantienen su alcance de consulta pública y no son la fuente de recuperación del historial personal. Una copia local no convierte un reporte en publicación pública.
- **Autenticación y Superadmin:** acceso administrativo y aprobación de solicitudes ya existen. El PR #17 debe conservarse. Las acciones sobre estados oficiales requieren permisos existentes o una ampliación separada aprobada.
- **Módulo 6:** puede definir las herramientas de administración que se necesiten para mantener contenido institucional, monitorear suscripciones y moderar reportes. No se presume que ese panel esté disponible hoy para todos esos fines.

**DEFINIDO:** ninguna dependencia autoriza modificar una sección terminada dentro de esta tarea documental.

## 19. Riesgos técnicos y funcionales

1. **Pérdida local:** desinstalar, limpiar datos, usar navegación privada o cambiar de dispositivo sin exportar puede dejar el historial inaccesible. IndexedDB no garantiza retención permanente; cuotas y desalojos varían [7] [8].
2. **Eliminación irreversible:** borrar perfil o historial local sin una confirmación comprensible puede destruir la única copia disponible.
3. **Desajuste entre simulación y servidor:** el envío actual es `local-preview` y no crea ID persistente. El historial local no debe presentar esa simulación como recepción oficial.
4. **Referencias compuestas:** `publicacion_id` puede coincidir entre tablas diferentes. Si se incluye una referencia oficial en el respaldo, conservar tabla+ID y el ID de reporte cuando estén disponibles.
5. **Antecedente de estados:** una versión previa de la documentación M2 enumera tres estados, mientras el acuerdo actual del Módulo 4 define cuatro. La decisión actual está cerrada; queda pendiente únicamente alinear la documentación/contrato backend cuando corresponda.
6. **Evidencia pública:** el bucket observado es público, no tiene límites de tamaño/MIME declarados y acepta inserciones anónimas/autenticadas. No debe convertirse en la ubicación de originales privados sin revisión backend.
7. **Migraciones no reconciliadas:** la historia aplicada en Supabase no coincide uno a uno con los archivos versionados. Debe revisarse en planificación backend antes de cualquier migración; esta tarea no la resuelve.
8. **Archivo de respaldo grande:** incluir medios puede generar exportaciones pesadas, con fallos de memoria o transferencia, especialmente en dispositivos rurales de baja capacidad o conectividad.
9. **Privacidad del archivo:** un respaldo puede contener datos personales, ubicación y evidencia sensible; quien obtenga el archivo puede leer esos contenidos si no se cifra.
10. **Integridad frente a autenticidad:** un hash puede revelar corrupción, no impedir que alguien modifique contenido y recalcule el hash.
11. **Compartición accidental:** el archivo no debe compartirse automáticamente; el usuario debe conocer su contenido antes de exportarlo o enviarlo por sus propios medios.
12. **Permisos Push:** endpoints y claves de suscripción son datos sensibles; una suscripción sin revocación o permiso explícito puede exponer a spam o acceso indebido.
13. **Contenido sin versión confirmada:** el manifiesto y la pantalla Acerca de no tienen hoy un número oficial de versión identificado.
14. **Expansión accidental de alcance:** cambiar esquema de reportes, RLS, Storage, auth o Mi Vereda por conveniencia del historial afectaría módulos fuera de Módulo 4 y requeriría autorización independiente.

## 20. Decisiones pendientes

Estas preguntas deben resolverse antes de fijar el diseño backend. Las propuestas anteriores no las resuelven.

1. ¿Qué campos exactos del reporte local se conservarán para reconstruir las tarjetas y detalles del historial? La copia permanece en el dispositivo hasta que la persona la elimine o el sistema/navegador borre sus datos.
2. ¿El código público `AV-XX-0001` identificará al reporte inicial o a la publicación? ¿Qué forma tendrá `XX`?
3. ¿El respaldo incluirá fotografías/videos? Si los incluye, ¿se conservarán los originales, versiones procesadas o ambos?
4. ¿El archivo se cifrará obligatoriamente, opcionalmente o no se cifrará? ¿Cómo se informará la pérdida de la frase de paso?
5. ¿Qué tamaño máximo se admite para el archivo completo, cada evidencia y la cantidad de registros?
6. ¿Se permite importación parcial o debe ser atómica? ¿Cómo se combinan o reemplazan perfil y preferencias sin sobrescritura accidental?
7. ¿La vereda de interés y la selección activa de Mi Vereda compartirán valor o serán independientes? ¿Qué hacer con una vereda inactiva durante la restauración?
8. ¿Se necesita un servicio real de Push? Si sí, ¿qué categorías, cadencia, retención y proveedor se autorizan?
9. ¿Acerca de será estático o tendrá gestión de contenido? ¿Quién valida la versión, créditos, contactos e información legal?
10. ¿Teléfono y cargo son todavía requisitos de solicitud administrativa? ¿Cuál es su uso y política de privacidad?
11. ¿Cuándo y cómo se reconciliarán el historial de migraciones y la configuración real de Storage antes de una fase backend? Esto es un asunto de preparación, no una autorización para investigar o cambiar ahora.

## 21. Criterios de aceptación

Los criterios se dividen entre la funcionalidad del Módulo 4 frontend y una eventual integración backend. El funcionamiento personal local no depende de Supabase. La autenticación administrativa conserva su flujo existente y sus dependencias actuales; estos criterios no autorizan cambiarlas.

### 21.1 Módulo 4 frontend — funcionalidad local

- Perfil, preferencias, tema, historial y respaldos personales funcionan localmente, sin requerir tablas, consultas ni escrituras nuevas en Supabase.
- El perfil visitante no crea ni modifica una cuenta o rol de habitante.
- El flujo local registra el reporte en el dispositivo; el historial lo guarda automáticamente cuando la operación concluye correctamente, lo conserva entre sesiones y permite exportarlo/importarlo. Si falla el guardado, la interfaz informa el fallo y no presenta la entrada como almacenada correctamente. Esto no se presenta como recepción oficial del servidor.
- Mis reportes muestra la copia local del dispositivo y no depende de sincronización, lectura privada ni recuperación desde el backend.
- La exportación/importación conserva los datos e identificadores locales necesarios para reconstruir el historial, además del perfil y las preferencias básicas; valida estructura, versión e integridad, previene duplicados y evita sobrescribir datos existentes accidentalmente.
- Antes de exportar se advierte sobre datos personales, ubicación y evidencias; el archivo no se comparte automáticamente. La decisión de incluir metadatos, fotografías procesadas, originales o videos debe cerrarse por separado y no se presupone que se exporten todos.
- Eliminar perfil o historial local requiere confirmación antes de la acción irreversible; se explica que borrar los datos de la aplicación/navegador o cambiar de dispositivo sin exportar puede perder la copia.
- La demostración local no modifica Supabase Storage. Cuando la interfaz muestre estados públicos, contempla En revisión, Verificado y activo, En atención y Verificado y solucionado; «Reportado» queda reservado para una posible evolución y no se agregan otros estados.
- El acceso administrativo conserva el aviso previo y reutiliza el flujo `/auth` existente, sin conceder roles o permisos por la interfaz.
- Mi Vereda, Reportar y otras secciones terminadas no se modifican dentro de la implementación del Módulo 4 salvo autorización específica para un cambio separado.

### 21.2 Criterios de una futura integración backend

Estos criterios solo aplican si, después de completar los seis módulos frontend, se aprueba e inicia una etapa backend separada. No son prerrequisitos para el perfil, preferencias, historial o respaldo local.

- El alcance funcional y el modelo conceptual de cada cambio backend cuentan con aprobación explícita; las propuestas de este documento no se consideran aprobadas por estar descritas aquí.
- Las migraciones del repositorio se reconcilian con el proyecto objetivo antes de aplicar cambios y el plan especifica pruebas y reversión.
- Cada reporte oficial tiene identificador inequívoco; su publicación se identifica con la pareja tabla+ID o con un contrato global aprobado. La integración distingue aceptación oficial, estados autorizados y simulación local.
- Las pruebas de autorización cubren visitante anónimo, usuario autenticado sin asignación, administrador de otra vereda, administrador asignado y Superadmin, según las operaciones aplicables.
- Los estados oficiales se mapean desde los campos internos al catálogo definido sin exponer accidentalmente estados administrativos. El visitante no puede modificar estados oficiales.
- Si se implementan evidencias oficiales, originales y derivados tienen reglas de acceso diferenciadas y probadas; los backups de base de datos y de objetos de Storage se tratan por separado [5] [6].
- Las preferencias no activan Push sin consentimiento explícito; una futura suscripción debe poder revocarse.
- No se despliegan llaves de servicio, tokens de recuperación o endpoints push en el cliente.

Estos criterios deben aprobarse antes de usarse como puerta formal de implementación; no condicionan las funciones locales del Módulo 4 a la disponibilidad del backend.

## 22. Orden recomendado de implementación cuando llegue esa etapa

El orden siguiente es una **PROPUESTA TÉCNICA no aprobada** y está condicionado a que terminen los seis módulos frontend y el usuario autorice la fase backend.

1. **Reconciliar la base existente:** comparar migraciones versionadas con el proyecto Supabase objetivo, inventariar grants, RLS, funciones, triggers y Storage; resolver divergencias antes de planear nuevas migraciones.
2. **Tomar como requisito el catálogo ya definido:** mantener los cuatro estados públicos acordados y «Reportado» como futuro; alinear el contrato/documentación backend con esa decisión sin agregar estados ni modificar módulos terminados sin autorización.
3. **Definir el contrato del envío oficial:** éxito, fallos, respuesta con ID estable, política de idempotencia y creación de publicaciones, sin confundirlo con el registro local del historial ni cambiar Módulos 1–3 por accidente.
4. **Diseñar y probar acceso/privacidad:** contratos públicos mínimos, límites por actor/territorio y matriz de pruebas RLS/grants. La recuperación privada del historial personal queda fuera de alcance.
5. **Resolver evidencias del sistema oficial:** entidad/metadata, privacidad de originales, derivados, límites y estrategia de respaldo separada para objetos. El historial frontend y su exportador permanecen locales.
6. **Verificar las dependencias locales del Módulo 4:** el perfil, las preferencias, el historial y su respaldo no necesitan entidades backend; cualquier cambio a esa decisión requeriría un acuerdo nuevo.
7. **Implementar notificaciones reales solo si se aprueban:** consentimiento, suscripción, reglas, seguridad, entrega, revocación y observabilidad.
8. **Gestionar contenido Acerca de solo si se aprueba:** comprobar si basta contenido estático; si no, definir editor, permisos, revisión y auditoría.
9. **Revisar cambios y despliegue por separado:** aprobar migración, políticas, coste potencial, ambiente y reversión antes de tocar el proyecto real.

**DEFINIDO:** este orden no inicia el backend ni autoriza PR 4.1 o cambios de código. Los módulos frontend 4, 5 y 6 deben completarse antes de planificar la etapa backend. El documento seguirá siendo evolutivo y podrá revisarse con nuevos hallazgos; no se comienza otra tarea hasta que el propietario revise esta versión.

## Referencias

[1]: https://supabase.com/docs/guides/database/postgres/row-level-security "Supabase Docs — Row Level Security (RLS)"
[2]: https://supabase.com/docs/guides/api/securing-your-api "Supabase Docs — Securing Your API"
[3]: https://supabase.com/docs/guides/storage/security/access-control "Supabase Docs — Storage Access Control"
[4]: https://supabase.com/docs/guides/storage/buckets/fundamentals "Supabase Docs — Storage Buckets: Fundamentals"
[5]: https://supabase.com/docs/guides/platform/backups "Supabase Docs — Database Backups"
[6]: https://supabase.com/docs/guides/platform/migrating-within-supabase/backup-restore "Supabase Docs — Backup and Restore using the CLI"
[7]: https://developer.mozilla.org/en-US/docs/Web/API/IndexedDB_API "MDN Web Docs — IndexedDB API"
[8]: https://developer.mozilla.org/en-US/docs/Web/API/Storage_API/Storage_quotas_and_eviction_criteria "MDN Web Docs — Storage quotas and eviction criteria"
[9]: https://developer.mozilla.org/en-US/docs/Web/API/SubtleCrypto/digest "MDN Web Docs — Web Crypto API: SubtleCrypto.digest()"
[10]: https://developer.mozilla.org/en-US/docs/Web/API/Notifications_API/Using_the_Notifications_API "MDN Web Docs — Using the Notifications API"
[11]: https://developer.mozilla.org/en-US/docs/Web/API/Push_API "MDN Web Docs — Push API"
