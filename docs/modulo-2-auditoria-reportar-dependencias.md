# Módulo 2 — Auditoría técnica, alcance y dependencias

**Estado:** documentación técnica de auditoría y registro de las fases frontend implementadas; la integración con backend y los contratos de evidencias siguen pendientes.

**Alcance:** conservar en el repositorio los hechos verificados, el alcance aprobado, la referencia visual, las decisiones establecidas, las propuestas pendientes y los requisitos futuros de backend del Módulo 2.

**Base de revisión:** rama `main` del repositorio auditado, documentación existente, código fuente, migraciones versionadas, continuidad de los PR #14, #15, #16 y #17 y las referencias visuales recibidas para Inicio, Reportes y Mi Vereda en celular y PC. La Fase 1 modifica únicamente frontend; no modifica Supabase, Storage, autenticación, permisos, RLS, migraciones ni despliegues.

> **Regla de lectura:** cuando este documento diga **hecho verificado**, se refiere a comportamiento o estructura observada en el código auditado. Cuando diga **requisito establecido**, se refiere a una regla funcional aprobada. Cuando diga **propuesta pendiente**, no debe implementarse como decisión definitiva sin aprobación posterior.

## 1. Distribución documental y fuente de verdad

La documentación se distribuye deliberadamente para evitar duplicación:

- Este archivo es la **fuente de verdad detallada** para la auditoría y el plan del Módulo 2, incluyendo ahora Mi Vereda, Cambiar de vereda, Historial, las cuatro categorías y Detalle de publicaciones.
- [`docs/pendientes-backend.md`](pendientes-backend.md) conserva únicamente el **registro corto de pendientes y necesidades backend**. Sus filas deben resumir el pendiente y enlazar a este documento cuando se necesite contexto, reglas o impacto.
- [`README.md`](../README.md) únicamente ofrece enlaces de descubrimiento. No replica decisiones técnicas.
- [`AGENTS.md`](../AGENTS.md) mantiene las instrucciones operativas del repositorio y no se modifica como parte de esta documentación.

Si una descripción detallada de este documento y una fila resumida del registro backend parecen diferir, la fila debe corregirse para apuntar a la sección correspondiente de este documento; no deben mantenerse dos explicaciones completas.

## 2. Alcance definitivo del Módulo 2

### 2.1 Las seis áreas explícitas

El Módulo 2 comprende exactamente estas seis áreas funcionales. Esta numeración de seis áreas **no debe confundirse con la numeración de los seis módulos generales del proyecto**:

| Área | Alcance dentro del Módulo 2 | Límite de esta fase |
| --- | --- | --- |
| **1. Mi Vereda** | Auditoría y rediseño de la pantalla principal comunitaria, su jerarquía de información, novedades activas, resumen rápido, contexto de la vereda y acceso al historial. | Conservar las consultas, filtros, guía hablada, selección manual y acciones que ya existen, salvo cambios aprobados de reorganización visual. |
| **2. Cambiar de vereda** | Consulta, búsqueda y selección de una vereda, tomando la referencia visual como dirección para celular y PC. | No inventar detección GPS, persistencia de última selección ni una nueva navegación hasta auditar y aprobar su necesidad. |
| **3. Historial de reportes** | Consulta, búsqueda, filtros y presentación de reportes anteriores de la vereda seleccionada. | Mantener las reglas de visibilidad y resolver antes la correspondencia entre estados internos y estados públicos oficiales. |
| **4. Emergencias** | Rediseño de la interfaz de Emergencias, incluyendo sus listados, estados, advertencias y eventual tratamiento visual de emergencias pendientes. | Las reglas de privacidad, visibilidad y protección de evidencias aprobadas son obligatorias; la emergencia provisional real depende de backend. |
| **5. Vías, Servicios y Avisos** | Rediseño de las interfaces respectivas, conservando el propósito y funcionamiento actual de cada categoría. | No convertir reportes pendientes en publicaciones públicas ni cambiar el significado de los módulos. |
| **6. Detalle de las publicaciones** | Revisión y rediseño de la vista donde se consulta la información completa de un reporte o publicación. | La ruta frontend `/reportes/:id` ya está preparada con el contrato actual; código público, evidencias múltiples, mapa y acciones siguen pendientes de backend. |

El flujo de **Reportar** y la gestión administrativa no son áreas nuevas del alcance visual de estas seis áreas. Son dependencias que deben conservarse y documentarse porque producen, revisan o eventualmente publican los datos que el Módulo 2 consultará.

### 2.2 Referencia visual de Mi Vereda

Las referencias visuales recibidas para Mi Vereda se adoptan como **dirección visual** para el rediseño, no como autorización para inventar funciones. La referencia general presenta tres vistas adaptadas a celular y PC:

1. **Mi Vereda — inicio:** contexto de la vereda, novedades recientes, resumen rápido, historial y acciones persistentes.
2. **Cambiar de vereda:** buscador, lista con fotografías, selección y retorno a Mi Vereda.
3. **Historial:** vereda seleccionada, búsqueda, filtros por estado y listado compacto de reportes anteriores.

La dirección visual a evaluar incluye una composición comunitaria clara, tarjetas compactas con categoría/estado/fecha, uso contextual de fotografías, navegación adaptable, lectura sencilla en conexiones y pantallas pequeñas, y mayor aprovechamiento horizontal en PC.

La referencia muestra una navegación superior con Inicio, Reportes, Mapa y Veredas, un botón flotante de Reportar y una barra fija para llamar al 123. Estas superficies deben compararse con la navegación real antes de cambiar enlaces, etiquetas o jerarquías.

### 2.2.1 Comparación técnica y visual de las cinco imágenes de Mi Vereda

El prompt asociado a las cinco imágenes establece su papel: las tres primeras representan estados de la interfaz actual —novedades activas, filtros y historial— y las dos últimas representan una propuesta visual para filtros en celular. La comparación siguiente se limita al frontend existente; no trata las cifras, nombres de vereda, títulos ni fechas que aparecen en las capturas como datos reales.

| Elemento | Interfaz actual verificada | Dirección visual propuesta | Mejora frontend recomendada | Límite o incompatibilidad |
| --- | --- | --- | --- | --- |
| Encabezado y contexto | `/mi-vereda` ya tiene hero, título, explicación y distintivo «Sin GPS». | Mantener una cabecera breve, legible y claramente territorial. | Ajustar proporciones, espaciado y jerarquía tipográfica sin cambiar el contenido ni introducir detección. | No convertir el distintivo «Sin GPS» en una invitación a activar ubicación. |
| Selección de vereda | Selector manual nativo alimentado por `consultarVeredas()`. | Bloque de selección destacado y fácil de encontrar en móvil. | Mejorar agrupación, tamaño táctil, contraste y adaptación a PC; conservar el selector y su comportamiento. | La referencia visual de una lista con búsqueda o fotos no autoriza agregar esas capacidades. |
| Separación de consultas | Dos pestañas: «Novedades activas» e «Historial». Cada una dispara una consulta diferente. | Diferenciar con claridad el presente comunitario de la memoria de reportes. | Mantener las pestañas, reforzar el estado activo y hacer evidente qué filtros aplican a cada vista. | No mezclar resultados activos con historial ni cambiar las RPC utilizadas. |
| Búsqueda | Campo `mi-vereda-search`; la consulta se envía como `p_busqueda` al cambiar el texto. | Campo compacto integrado al área de filtros. | Reubicarlo visualmente y conservar etiqueta accesible, búsqueda y estado vacío. | Un cambio a búsqueda diferida o botón de envío alteraría el comportamiento actual y requiere aprobación. |
| Filtros en escritorio | Panel inline `mi-vereda-filters`; categoría, periodo y, solo en historial, estado. | Controles agrupados en una fila o panel compacto con mejor jerarquía. | Usar layout responsive, etiquetas cortas y agrupación visual sin eliminar controles. | Las opciones deben seguir siendo las actuales; no inferir opciones nuevas de la referencia. |
| Filtros en celular | El mismo panel inline se apila mediante CSS; los `<select>` siguen siendo nativos. | Panel compacto tipo modal/hoja o superficie superpuesta, con cierre y botón visible. | Puede rediseñarse la presentación usando el mismo estado y los mismos valores, priorizando área táctil, lectura y cierre accesible. | Si «Aplicar filtros» pasa a significar que los cambios no se ejecutan hasta confirmar, cambia la lógica actual y requiere decisión separada. |
| Período | «Todo el historial», «Últimos 15 días», «Últimos 30 días», «Últimos 60 días» y «Últimos 90 días». | Las referencias muestran las cinco opciones en la consulta de Mi Vereda. | Mantener las cinco opciones y su ejecución inmediata usando el contrato actual. | La autorización de 15 y 60 días es frontend; no implica cambiar la RPC ni el backend. |
| Categoría | Selector con Todas, Emergencias, Vías, Servicios y Avisos. | La referencia muestra una presentación más visual y compacta de categorías. | Mantener exactamente las categorías y sus valores, pudiendo cambiar solo la presentación. | No crear categorías, iconos o etiquetas que no correspondan al catálogo actual. |
| Estado del historial | Solo aparece en Historial: todos, solucionado y no_solucionado. | Filtro agrupado dentro del panel móvil. | Conservarlo exclusivamente para Historial y mejorar su legibilidad. | La correspondencia con estados públicos oficiales sigue pendiente; no reemplazar etiquetas unilateralmente. |
| Aplicación y limpieza | Cada cambio de filtro actualiza el estado y vuelve a ejecutar la consulta; «Limpiar filtros» reinicia filtros y búsqueda. | Panel con «Aplicar filtros» y opción de cierre/limpieza. | Como mejora visual segura, el botón podría cerrar el panel sin modificar la ejecución inmediata, mientras se conserva la lógica existente. | Convertirlo en confirmación transaccional exige estado de filtros en borrador y decisión funcional. |
| Resultados | Tarjetas con categoría, estado, título, descripción, lugar y fechas; no hay imagen ni enlace a detalle. | Tarjetas más compactas y escaneables en móvil, con posible uso de miniatura. | Reducir densidad visual, ordenar metadatos, mantener estados de carga/error/vacío y preparar responsive. | Las imágenes de ejemplo no autorizan datos ni una galería; `MiVeredaHistorialPublicacion` actualmente no expone `foto_url`. |
| Guía hablada | `GuiaHablada` tiene objetivos para selector, pestañas, filtros y estados de historial. | La propuesta visual no reemplaza la guía. | Mantener los objetivos, el orden comprensible y el acceso «Escuchar cómo funciona» al reorganizar el DOM. | Cambiar o eliminar elementos puede romper referencias de la guía y requiere revisar accesibilidad. |

#### Funcionalidades y comportamientos que deben conservarse

El rediseño frontend debe conservar, como mínimo:

- La ruta `/mi-vereda` y su separación entre novedades activas e historial.
- La selección manual de vereda mediante los datos de `consultarVeredas()`.
- La ausencia deliberada de GPS.
- La búsqueda textual actual.
- El filtro por categoría.
- El filtro por período con «Todo el historial», 15, 30, 60 y 90 días.
- El filtro de estado del historial.
- La limpieza de filtros y búsqueda.
- La ejecución de `consultarCartelera()` para novedades y `consultarHistorial()` para historial.
- Los estados de carga, error, ausencia de resultados y resultados reales.
- La guía hablada y sus objetivos de interacción.
- La navegación pública, tema, cuenta y barra del 123.
- La distinción entre datos reales de la consulta y datos ilustrativos de las referencias.

#### Mejoras visuales recomendadas, sin cambio de lógica

La primera implementación autorizable debería concentrarse en:

1. Reordenar visualmente el bloque de consulta para que la vereda seleccionada, la pestaña activa, la búsqueda y los filtros se entiendan en ese orden.
2. Convertir el área de filtros en una superficie responsive más clara, reutilizando los mismos estados y valores.
3. En celular, mejorar la jerarquía del panel, el tamaño táctil, el cierre, el contraste y la lectura sin obligar a crear nuevos filtros.
4. En PC, aprovechar el ancho disponible con una distribución más equilibrada, sin cambiar el contrato de consulta.
5. Compactar las tarjetas sin eliminar descripción, categoría, estado, lugar o fechas.
6. Mantener visibles y accesibles los mensajes de carga, error, ausencia de resultados y la ayuda hablada.
7. Revisar foco, navegación por teclado, nombres accesibles y comportamiento con texto largo antes de ajustar únicamente la apariencia.

#### Incompatibilidades y decisiones que deben permanecer abiertas

- **Períodos adicionales:** 15 y 60 días fueron aprobados para esta fase frontend. La consulta sigue transformando el valor a `p_desde` y no requiere cambiar la RPC.
- **Semántica de «Aplicar filtros»:** el código actual consulta al cambiar cada control. Un botón que difiera la consulta cambiaría el comportamiento y necesita aprobación.
- **Modal o panel móvil:** puede ser una reorganización visual si conserva la aplicación inmediata; si introduce borrador, cancelar o aplicar, deja de ser solo visual.
- **Imágenes en tarjetas:** las capturas no autorizan cargar datos ficticios ni agregan por sí mismas un contrato de imágenes para historial.
- **Estados:** la UI actual usa «Solucionado» y «No solucionado», mientras los estados públicos aprobados son «En revisión», «Verificado y activo» y «Verificado y solucionado». El rediseño puede preparar espacio y estilos, pero no resolver el mapeo por cuenta propia.
- **Guía hablada:** una modificación de estructura debe conservar los objetivos y probar que sus referencias sigan apuntando a controles utilizables.
- **Datos de ejemplo:** Campo Alegre, títulos, fechas, cantidades y estados visibles en las imágenes son material ilustrativo y no deben aparecer en la aplicación salvo que provengan de la consulta real.

### 2.3 Cambio aprobado en el resumen rápido

En el resumen rápido de Mi Vereda se establece el siguiente cambio funcional y visual:

- El indicador **«Veredas relacionadas»** debe eliminarse.
- Debe reemplazarse por **«Reportes solucionados»**.
- Debe contar únicamente reportes cuyo estado público oficial sea **«Verificado y solucionado»**.
- No deben inventarse cifras ni suponerse los datos de ejemplo de la referencia visual.
- En pantallas pequeñas puede evaluarse una abreviación puramente visual de la etiqueta, pero no puede cambiarse el nombre ni el significado del estado oficial.

Hecho relevante: la implementación actual no contiene el resumen rápido mostrado en la referencia ni el indicador «Veredas relacionadas». Por tanto, su incorporación deberá tratarse como una pieza explícitamente aprobada dentro del rediseño, con datos derivados de fuentes reales y no de datos de demostración.

### 2.4 Conservación y límites

Antes de proponer o implementar cambios se debe identificar qué rutas, componentes, datos y comportamientos existen en cada área. El objetivo es reorganizar y mejorar la jerarquía visual sin eliminar características, cambiar el propósito de las secciones o introducir funciones nuevas sin justificación y aprobación.

La experiencia debe seguir siendo adaptable a celular y PC, con atención a legibilidad, accesibilidad, facilidad de uso y contexto rural de AlertaVereda. Las decisiones visuales no deben confundirse con cambios de autenticación, roles, permisos, RLS, Storage o backend.

## 3. Hechos verificados en el código

### 3.1 Mi Vereda — implementación actual

La ruta actual es:

```text
src/routes/mi-vereda.tsx  →  /mi-vereda
```

La pantalla monta `AppShell`, usa el shell de navegación pública compartido y consulta datos reales mediante `src/lib/mi-vereda-cartelera.ts`. También incorpora la guía hablada de `src/components/guia-hablada.tsx` y los activos de audio de `src/lib/guia-audio-assets.ts`.

La implementación actual contiene:

- Hero de Mi Vereda.
- Selección manual de vereda mediante un `<select>`.
- Mensaje explícito de que no se usa la ubicación del celular.
- Identificación de la vereda consultada.
- Indicador de vereda inactiva cuando aplica.
- Pestaña **Novedades activas**.
- Pestaña **Historial**.
- Búsqueda textual.
- Filtros por categoría.
- Filtros de estado para el historial.
- Filtros de periodo: todo, últimos 15, 30, 60 y 90 días.
- Botón para limpiar filtros.
- Estados de carga, error, resultados y ausencia de resultados.
- Tarjetas de resultados con categoría, estado, título, descripción, lugar y fechas.
- Ayuda hablada con objetivos para selección, pestañas y filtros.
- Aviso visible de que la pantalla usa datos reales de Mi Vereda.
- Navegación pública, selector de tema, control de cuenta y barra de emergencias 123.

La pantalla actual no contiene:

- El resumen rápido de la referencia visual.
- El indicador «Reportes solucionados».
- Una vista separada en ruta para «Cambiar de vereda».
- Una ruta separada para «Historial».
- Imágenes en las tarjetas de Mi Vereda.
- Un enlace de cada tarjeta a un detalle público.
- Una detección automática de la vereda por GPS.
- Persistencia explícita de la última vereda seleccionada entre sesiones.

### 3.2 Cambiar de vereda — comportamiento actual

Actualmente «Cambiar de vereda» no es una ruta o componente independiente. Es la selección manual que vive dentro de `/mi-vereda`:

- `consultarVeredas()` carga las veredas desde `src/lib/mi-vereda-cartelera.ts`.
- La primera vereda recibida se usa como valor inicial si todavía no hay selección local en el estado React.
- El usuario cambia la vereda mediante el selector nativo.
- El cambio actualiza `veredaId` y vuelve a consultar los registros de esa vereda.
- La consulta no usa GPS ni intenta detectar la ubicación del dispositivo.
- No se observó persistencia en `localStorage`, `sessionStorage` ni en el perfil autenticado para conservar la última selección.
- No se observó buscador específico ni fotografías de veredas en la selección actual.

La referencia visual propone una presentación diferente —buscador, lista con fotos y retorno a Mi Vereda—, pero el requisito de conservación obliga a distinguir la reorganización visual de cualquier cambio de comportamiento. La creación de búsqueda, fotos, detección o persistencia requiere una decisión funcional específica si no puede resolverse como una mejora de presentación sobre datos ya disponibles.

### 3.3 Historial de reportes — comportamiento actual

El historial se consulta dentro de `/mi-vereda` mediante `consultarHistorial()` y la RPC `mi_vereda_historial`.

La consulta actual soporta:

- Vereda seleccionada.
- Búsqueda textual.
- Categoría.
- Resultado `solucionado`, `no_solucionado` o todos.
   - Periodo completo, 15, 30, 60 o 90 días.
- Límite y offset, aunque la pantalla actual solicita hasta 100 registros con offset 0.

La implementación mapea publicaciones cerradas con `resultado = solucionado` al estado local `solucionado`; otros cierres se mapean a `no_solucionado`. Las publicaciones abiertas se mapean a `activo` en la vista de novedades.

Las tarjetas actuales de historial muestran categoría, etiqueta de estado, título, descripción, lugar, fecha de creación y fecha de cierre. No muestran fotografía y no abren una vista de detalle.

Hay una incompatibilidad funcional pendiente: el código y la guía hablada usan **«Solucionado»** y **«No solucionado»**, mientras que los estados públicos aprobados para el Módulo 2 son **«En revisión»**, **«Verificado y activo»** y **«Verificado y solucionado»**. No se debe corregir unilateralmente esta diferencia durante una fase visual; el mapeo final requiere aprobación y contrato de datos.

### 3.4 Inicio y relaciones con Mi Vereda

La ruta de Inicio es `src/routes/index.tsx` y actualmente:

- Consulta la cartelera pública de Emergencias, Vías, Servicios y Avisos.
- Usa límites por categoría.
- Muestra tarjetas compactas con `CartaCompacta`.
- Las tarjetas de «Últimos reportes» enlazan al detalle público por `publicacion_id`; los enlaces de sección llevan a la categoría correspondiente.
- Muestra CTA para `/reportar`.
- Muestra la franja de estado sin novedades urgentes cuando corresponde.
- No muestra actualmente el resumen rápido de Mi Vereda de la referencia.
- No sustituye la consulta territorial de `/mi-vereda`.

`src/lib/mi-vereda-cartelera.ts` es compartido por Inicio, Mi Vereda y las rutas de categoría. No debe darse por hecho que Inicio y Mi Vereda son redundantes: Inicio es una cartelera general y Mi Vereda permite consultar una vereda específica y su historial.

### 3.5 Emergencias, Vías, Servicios y Avisos — implementación actual y fase pública

Las cuatro categorías tienen rutas separadas:

```text
src/routes/emergencias.tsx  →  /emergencias
src/routes/vias.tsx         →  /vias
src/routes/servicios.tsx    →  /servicios
src/routes/avisos.tsx       →  /avisos
```

Las cuatro consultan `consultarCartelera()` con una categoría distinta y conservan `AppShell`, `TituloModulo` y `Vacio`. Desde la fase pública implementada, las publicaciones pasan por `src/lib/reportes-publicos.ts` y se presentan con `TarjetaReportePublica`, sin tocar las consultas de Supabase.

**Emergencias** consulta publicaciones de categoría `emergencia`, normaliza el estado público, muestra severidad solo cuando es `Urgente` o `Precaución`, y conserva la advertencia de no verificación para la excepción provisional. La evidencia de una emergencia no verificada no reutiliza el `foto_url` público actual: muestra un placeholder protegido hasta que backend entregue un derivado seguro.

**Vías** consulta categoría `via`, muestra título, estado, severidad pública permitida, vereda, fecha, descripción y evidencia segura cuando existe.

**Servicios** consulta categoría `servicio`, muestra tipo de servicio, estado, vereda, fecha, descripción y evidencia disponible, sin presentar una severidad.

**Avisos** consulta categoría `aviso`, muestra título, vereda, lugar, fecha del evento y descripción, sin presentar una severidad.

Las cuatro rutas mantienen estados de carga, error y vacío. Las tarjetas de categoría enlazan al detalle público por identificador interno; el listado general añade la etiqueta de categoría porque mezcla las cuatro categorías.

### 3.6 Detalle de las publicaciones — fase frontend implementada

La ruta pública implementada es `src/routes/reportes.$id.tsx` y se expone como `/reportes/:id`. El frontend recibe un identificador de publicación, busca en el contrato actual de cartelera por las cuatro categorías y solo presenta registros que pasan `esPublicacionPublica()`.

La pantalla ya contiene:

- Regreso al listado general.
- Categoría y estado público.
- Advertencia separada para emergencia en revisión.
- Evidencia fotográfica, ilustración representativa cuando no hay foto y marca visual contextual para una foto segura.
- Vereda/lugar, fecha, hora, descripción, tipo, severidad y estado operativo con texto público.
- Reserva textual discreta para el código público futuro; no se expone el ID interno como sustituto.
- Preparación visual para ubicación y acciones futuras, sin inventar mapa, ruta o compartir.

El detalle no simula un código `AV-XX-0001`, no crea una consulta backend nueva y no muestra galerías o videos porque el contrato actual solo entrega un `foto_url`. El componente de video y la interacción de advertencia quedan preparados para la integración posterior, pero una emergencia no verificada no usa el `foto_url` actual como si fuera un derivado seguro.

### 3.7 Navegación y acciones compartidas

`src/components/app-shell.tsx` define el shell público, el arreglo `MODULOS`, la navegación principal, el control de cuenta, el tema, el botón flotante de Reportar y `BotonEmergencias`.

La navegación pública implementada en la Fase 1 incluye exactamente Inicio (`/`), Reportes (`/reportes`), Mapa (`/mapa`) y Veredas (`/mi-vereda`). Reportar (`/reportar`) ya no es una opción del arreglo público `MODULOS`; se accede desde la portada especial y el botón flotante en las páginas donde corresponde. El botón de emergencias utiliza `tel:123` y se muestra como barra persistente en las páginas públicas.

`src/routes/mapa.tsx` todavía muestra una pantalla «En construcción». El botón flotante de Reportar y la barra del 123 que aparecen en la referencia deben compararse con estos elementos reales antes de alterar su posición o comportamiento.

Cualquier futuro PR que modifique `src/components/app-shell.tsx` debe presentar ese cambio como punto separado en su resumen. Lo mismo aplica a cualquier PR que modifique los arreglos `MODULOS` o `ATAJOS` de `src/routes/index.tsx`; esos cambios nunca deben quedar mezclados dentro de una descripción general.

### 3.7.1 Fase 1 implementada — Portada especial y Reportes por categorías

La Fase 1 frontend implementa la entrada inicial aprobada sin cambiar backend ni Supabase:

- `/` muestra `PortadaEspecial` sin barra superior cuando la aplicación se monta en la portada.
- La portada reutiliza los fondos paisajísticos existentes de día y noche, el logo, el control de tema, la cuenta, Gálatas 6:2, las acciones `Reportar` y `Ver reportes` y la barra fija del 123.
- `Reportar` conserva la ruta existente `/reportar` y su flujo local/mock; no se reconstruyó ni se conectó a Supabase.
- `/reportes` es una nueva sección de categorías que reutiliza una única estructura de tarjetas para Emergencias, Vías, Servicios y Avisos, conservando las rutas existentes.
- `Ver todos los reportes` enlaza a `/reportes/todos`; el listado general se implementa en la fase frontend siguiente.
- El botón flotante `+ Reportar` se muestra en las superficies públicas con `AppShell`, excepto dentro del propio flujo `/reportar`.

El estado `navegacionActiva` vive en `NavegacionSesionProvider`, montado sobre `Outlet` en `src/routes/__root.tsx`. No usa `localStorage`, `sessionStorage`, cookies ni perfil autenticado:

- Al montar en `/`, inicia en falso y la portada no muestra la barra superior.
- Entrar a `/reportes` o `/reportar` activa la navegación; al volver a `/`, `InicioHabitual` conserva la barra durante el montaje actual.
- Abrir directamente una ruta interna como `/reportes`, `/reportar`, `/mapa` o `/mi-vereda` muestra su `AppShell` y la navegación pública.
- Recargar `/` crea un nuevo proveedor y vuelve a la portada especial.
- Entrar al flujo `/auth` reinicia el estado en memoria para que una nueva entrada al producto no herede la navegación activa.
- Una sesión del navegador no se persiste entre recargas, nuevas entradas o nuevos montajes de la aplicación.

Archivos funcionales de esta fase: `src/components/navegacion-sesion.tsx`, `src/components/report-category-cards.tsx`, `src/routes/reportes.tsx`, `src/routes/index.tsx`, `src/routes/__root.tsx`, `src/components/app-shell.tsx`, `src/styles.css`, `src/routeTree.gen.ts` y `public/manus-routes.json`.

### 3.7.2 Fase frontend implementada — listado general, categorías y detalle

La siguiente fase frontend implementa lo viable con el contrato actual, sin cambios de Supabase, Storage, autenticación, roles, permisos, RLS o backend:

- `/reportes/todos` consulta en una sola lista las cuatro categorías, sin filtro por categoría. Conserva búsqueda por título o descripción, filtro por fecha desde/hasta, orden de más recientes a más antiguos o inverso y carga más resultados cuando la consulta devuelve una página completa.
- La búsqueda se acota en el servidor para reducir resultados y se vuelve a comprobar en el frontend usando únicamente título y descripción; la vereda no se ofrece como campo de búsqueda ni como filtro en esta pantalla porque esa consulta corresponde a Mi Vereda.
- La consulta pública tiene un límite de espera frontend y el listado muestra un estado de error con reintento si Supabase no responde, evitando una carga indefinida.
- En `/reportes/todos`, cada tarjeta muestra la etiqueta de categoría junto al estado público. En una categoría específica (`/emergencias`, `/vias`, `/servicios` o `/avisos`) esa etiqueta no se repite porque el contexto de la página ya identifica la categoría.
- La normalización pública conserva únicamente `En revisión`, `Verificado y activo` y `Verificado y solucionado`. Los pendientes de Vías, Servicios y Avisos quedan fuera; la excepción de revisión solo aplica a Emergencias.
- La severidad pública solo se presenta en Emergencias y Vías como `Urgente` o `Precaución`. El valor interno `Normal` no se ofrece como opción ni se muestra como severidad pública.
- Las tarjetas reutilizan `TarjetaReportePublica`; cuando no hay foto segura, usan ilustraciones del catálogo local y lo indican como ilustración representativa, sin inventar una evidencia.
- El detalle usa `/reportes/:id`, con datos reales del contrato actual, una reserva textual discreta y una nota explícita de que el código `AV-XX-0001` requiere backend.
- El visor fotográfico incluye marca visual no destructiva para fotos seguras. En una emergencia no verificada no descarga el `foto_url` público actual; muestra un placeholder protegido y deja deshabilitada la revelación hasta que exista un derivado público autorizado.
- `VideoEvidenciaPublica` queda preparado para una URL persistente futura, pero no se monta porque la cartelera actual no entrega videos.

Archivos funcionales de esta fase: `src/lib/reportes-publicos.ts`, `src/components/reportes/estado-publico.tsx`, `src/components/reportes/evidencia-publica.tsx`, `src/components/reportes/tarjeta-reporte-publica.tsx`, `src/routes/reportes.todos.tsx`, `src/routes/reportes.$id.tsx`, `src/routes/reportes.tsx`, `src/routes/emergencias.tsx`, `src/routes/vias.tsx`, `src/routes/servicios.tsx`, `src/routes/avisos.tsx`, `src/routes/index.tsx`, `src/styles.css` y `src/routeTree.gen.ts`.

### 3.8 Continuidad de los PR de Reportar

Los trabajos previos están integrados en `main` y no deben reconstruirse:

| PR | Referencia | Commit de merge observado | Alcance verificado |
| --- | --- | --- | --- |
| #14 | `feat/reportar-frontend` | `6a92f1bcc35029ebc69fabeb4bc9cdeb398144bb` | Flujo público de Reportar y su estructura inicial. |
| #15 | `chore/reportar-pr14b-preparacion` | `c4270dd22f73461db78927fd253c1756ad796675` | Preparación conocida en el proyecto como PR #14b. La referencia «PR #14b» corresponde a esta rama/PR, no a un número literal separado. |
| #16 | `fix/reportar-editor-mobile-adaptation` | `5625adfbc0123abefd446e1c2b78bb67389ad365` | Ajustes posteriores del editor y adaptación móvil del flujo multimedia. |
| #17 | `feat/superadmin-sidebar-reportar` | `9eb5431830f7aa86d5ebf098abad4b62a2305455` | Flujo local de preparación de Reportar para Superadmin y su interfaz de gestión. |

Los cuatro PR están en la historia observada de `main`. El hecho de estar integrados no significa que el flujo público o el flujo local de Superadmin estén conectados a Supabase.

### 3.9 Flujo público de Reportar y sus operaciones locales

La ruta pública se monta desde:

```text
src/routes/reportar.tsx
└── src/components/reportar/reportar-flow.tsx
```

El recorrido tiene seis etapas: categoría/subcategoría, lugar, ubicación, evidencias, revisión y confirmación. El catálogo está en `src/lib/reportar/catalogo.ts`.

El flujo recopila localmente categoría, subcategoría, territorio, nombre opcional, descripción, referencia, GPS, precisión, estado de ubicación, evidencias y motivo de ausencia de evidencia cuando aplica. Sus validaciones incluyen territorio, descripción según categoría, GPS o referencia para emergencias, hasta tres fotos, un video, videos de hasta 15 segundos y 15 MB.

`src/lib/reportar/mock-submit.ts` contiene el adaptador de envío actual. La confirmación usa `confirmarReporteLocal()` y devuelve un resultado de demostración con `publicId: null`. El flujo no hace `INSERT` en `reportes`, no sube fotos o videos, no publica, no notifica, no cambia estados en Supabase y no crea una alerta pública.

El procesamiento fotográfico de `src/lib/reportar/photo-processor.ts` es local: convierte a JPEG, corrige orientación cuando es posible, redimensiona y busca un objetivo aproximado de 600 KB. `src/components/reportar/reportar-media-capture.tsx` usa APIs del navegador para cámara y video. Las evidencias usan objetos locales y `URL.createObjectURL`.

No se observó una marca de agua incrustada en fotos o videos. Una superposición visual no equivale a modificar el archivo.

### 3.10 Flujo local de Reportar para Superadmin

La ruta administrativa es:

```text
src/routes/admin/gestion/reportar.tsx
└── src/components/admin/admin-reportar-flow.tsx
```

`AdminReportarFlow` reutiliza el hook y los componentes del flujo público, pero su comportamiento es local: muestra `Solo local/mock`, no publica, no notifica, no inserta en Supabase, no crea publicaciones, no entrega el borrador a la bandeja administrativa y no cambia reportes existentes.

No debe confundirse con `src/components/admin/admin-operation.tsx`, que sí consulta Supabase y ejecuta operaciones administrativas existentes.

### 3.11 Gestión administrativa, Storage y purga

`AdminOperation` consulta reportes, publicaciones y veredas, y usa las RPC existentes `aprobar_reporte`, `rechazar_reporte`, `cerrar_publicacion` y `retirar_publicacion`. También consulta publicaciones cerradas para Superadmin.

`src/components/admin/purga-definitiva.tsx` usa el bucket `reportes-fotos` para retirar archivos durante la purga, con preflight, confirmación `ELIMINAR` y protección contra cambios de estado durante el proceso.

`src/lib/alerta.ts` contiene `URL_FOTO()`, que construye una URL pública de `reportes-fotos` para publicaciones con `foto_url`. Esto no equivale a un sistema de evidencias múltiples ni a originales privados con derivados protegidos.

### 3.12 Contratos actuales de datos e incompatibilidades

El tipo generado en `src/integrations/supabase/types.ts` contiene en `reportes` campos como `categoria`, `titulo`, `descripcion`, `vereda_id`, `lugar`, latitud, longitud, precisión, nivel, nombre del reportante, `capturado_en`, `foto_url`, estado, revisado por, revisado en y relación con publicación.

El contrato actual maneja un solo `foto_url` en reportes y publicaciones. No se observó una tabla `reportes_evidencias` ni un contrato generado para una galería persistente de múltiples fotos y videos.

`src/lib/mi-vereda-cartelera.ts` adapta `mi_vereda_cartelera`, `mi_vereda_historial` y la consulta de veredas. Expone publicación, vereda, categoría, título, descripción, lugar, estado operativo, resultado, cierre, `foto_url`, fecha del evento, creación, nivel y tipo.

Las brechas verificadas son:

1. El flujo local permite tres fotos y un video, mientras `reportes` expone un único `foto_url`.
2. No existe un contrato persistente de evidencias múltiples.
3. `capturado_en` pertenece al reporte y no a cada evidencia.
4. El borrador local maneja subcategorías que no aparecen como campos equivalentes en el tipo actual.
5. No existe contrato persistente para videos.
6. La cartelera pública no entrega una galería ni derivados protegidos.
7. No existe contrato público para una emergencia pendiente con privacidad especial.
8. El historial actual puede representar `no_solucionado` o `retirado`, mientras la presentación pública aprobada se limita a tres estados.
9. No existe detalle individual público.
10. No existe en el contrato actual un agregado explícito para contar «Verificado y solucionado» sin decidir si se calcula desde el historial o desde una consulta específica.

## 4. Decisiones y requisitos establecidos

Esta sección registra requisitos funcionales ya aprobados. No son propuestas.

### 4.1 Alcance

Mi Vereda, Cambiar de vereda, Historial de reportes, Emergencias, Vías/Servicios/Avisos y Detalle de publicaciones forman parte explícita del rediseño del Módulo 2. Estas seis áreas no deben confundirse con los seis módulos generales del proyecto.

### 4.2 Visibilidad de reportes normales

- Los reportes de Vías, Servicios y Avisos que estén en revisión permanecen privados.
- Solo deben publicarse después de la verificación y aprobación administrativa correspondiente.
- Los reportes solucionados pueden aparecer en el historial público cuando corresponda.
- No debe presentarse un reporte pendiente normal como si fuera una publicación verificada.

### 4.3 Excepción pública para Emergencias pendientes

Una emergencia pendiente puede generar una alerta pública provisional con el texto o significado:

> **Emergencia reportada · Pendiente de verificación**

Esta excepción no convierte el reporte en una publicación verificada. Debe conservarse visible la diferencia entre una alerta provisional y una emergencia aprobada.

### 4.4 Protección de evidencias en emergencias pendientes

Para una emergencia pendiente, las evidencias públicas deben cumplir todos estos requisitos:

- Mostrar una miniatura procesada con desenfoque extremadamente intenso.
- Hacer imposible reconocer personas, objetos o detalles identificables.
- Mostrar una advertencia antes de permitir la acción `Ver evidencia`.
- No permitir el acceso al original aunque el usuario insista.
- Mantener el original protegido.
- Usar miniaturas comprimidas para ahorrar datos móviles.

Un filtro CSS `blur()` aplicado en el navegador no cumple por sí solo esta protección porque no protege el archivo original.

### 4.5 Estados públicos

La presentación pública aprobada se limita a:

1. **En revisión**.
2. **Verificado y activo**.
3. **Verificado y solucionado**.

Los estados internos administrativos no deben exponerse automáticamente como estados públicos adicionales. En particular, `rechazado`, `retirado` y `no_solucionado` requieren una regla de exposición explícita antes de aparecer en una consulta pública.

### 4.6 Resumen rápido de Mi Vereda

- El indicador «Veredas relacionadas» queda reemplazado por «Reportes solucionados».
- El conteo usa únicamente el estado oficial «Verificado y solucionado».
- No se deben inventar cifras ni reutilizar las cifras ilustrativas de la referencia.
- Una abreviación móvil solo puede ser visual; no puede alterar la etiqueta ni el significado del estado.

### 4.7 Severidad pública

- Solo existen las opciones **Urgente** y **Precaución**.
- Solo aplican a Emergencias y Vías.
- `Urgente` representa peligro inmediato o una situación grave que requiere atención rápida.
- `Precaución` representa un riesgo que requiere cuidado, sin implicar necesariamente peligro inmediato.
- `Normal` queda eliminado como opción de severidad y no debe aparecer como clasificación pública.

### 4.8 Identificador público futuro

Cada publicación tendrá dos identificadores diferenciados:

- **ID interno:** identificador técnico para relaciones y operaciones del sistema.
- **Código público:** código corto, legible y copiable con formato `AV-XX-0001`, donde `XX` son dos letras aleatorias y `0001` es una secuencia consecutiva global.

La secuencia comenzará en `0001`, no se reiniciará por categoría y deberá asignarse automáticamente sin duplicados incluso ante creaciones simultáneas. El frontend actual no lo inventa ni lo muestra como disponible: deja el espacio de detalle preparado y conserva temporalmente el ID interno de forma discreta.

### 4.7 Conservación de lo existente

- No reconstruir el flujo público de Reportar de PR #14, #15/#14b y #16.
- No reconstruir el flujo local de Superadmin de PR #17.
- No asumir que esos flujos están conectados a Supabase.
- Conservar las funcionalidades, propósitos y comportamientos existentes de cada área salvo cambios aprobados.
- No cambiar autenticación, roles, permisos, RLS, Storage o backend dentro de esta fase documental.
- Las futuras modificaciones de `src/components/app-shell.tsx` o de los arreglos `MODULOS`/`ATAJOS` de `src/routes/index.tsx` deben aparecer como puntos separados en el resumen de cualquier PR.

## 5. Propuestas técnicas pendientes de aprobación

Las siguientes opciones se conservan como propuestas. No son decisiones definitivas.

### 5.1 Reorganización visual de Mi Vereda

Se propone evaluar una composición que acerque `/mi-vereda` a la referencia —contexto de vereda, novedades recientes, resumen rápido e historial— sin eliminar las pestañas, filtros, guía hablada ni selección manual existentes. La forma exacta de agrupar, ocultar o mostrar cada control requiere revisión visual y no se da por aprobada.

### 5.2 Cambiar de vereda como vista visual o ruta

La referencia presenta Cambiar de vereda como una vista distinguible. Actualmente es un selector dentro de `/mi-vereda`. Aún debe decidirse si se implementará como:

- Un panel o estado visual dentro de la misma ruta.
- Un diálogo o panel accesible.
- Una ruta propia que conserve retorno a Mi Vereda.

No está aprobado introducir GPS, detección automática, persistencia de última selección o fotografías si eso cambia el comportamiento actual.

### 5.3 Fuente del resumen «Reportes solucionados»

Debe decidirse si el conteo se obtiene:

- Desde el resultado de una consulta de historial suficientemente completa.
- Desde una consulta/agregado backend específico.
- Desde un contrato público que ya entregue el conteo.

La decisión debe asegurar el estado oficial, no contar datos limitados, no mostrar cifras inventadas y mantener buen rendimiento en conexiones rurales.

### 5.4 Etiquetas del historial

La referencia abrevia visualmente «Solucionado», mientras el requisito oficial usa «Verificado y solucionado». Debe aprobarse si la interfaz mantiene siempre el nombre completo o si permite una abreviación accesible en contextos pequeños, preservando el nombre completo para lectura asistida, información contextual y significado funcional.

También debe aprobarse el tratamiento público de `no_solucionado` y `retirado`; no deben mapearse automáticamente a activo o solucionado.

### 5.5 Fotografías y búsqueda de veredas

La referencia visual muestra fotografías y un buscador en Cambiar de vereda. La implementación actual solo tiene un selector y el contrato `MiVeredaVereda` expone id, nombre y activa. La incorporación de imágenes, búsqueda específica o detección de vereda requiere confirmar la fuente de esos datos y si constituye una mejora visual o una nueva capacidad funcional.

### 5.6 Límites pendientes del detalle de publicaciones

La fase frontend adopta provisionalmente `/reportes/:id` y el identificador interno actual para no bloquear la experiencia visual. Sigue pendiente definir con backend el código público, la consulta directa por código, la galería, video, mapa, compartir, ruta, reporte de emergencia y las acciones disponibles. La adopción de esta ruta frontend no autoriza cambios de tablas, RPC, Storage o RLS.

### 5.7 Mapeo de estados internos

| Estado o combinación interna | Presentación propuesta | Situación |
| --- | --- | --- |
| Reporte pendiente normal | No publicar | Compatible con el requisito establecido. |
| Emergencia pendiente excepcional | `En revisión` con texto provisional | Requiere backend y reglas de acceso. |
| Publicación aprobada vigente | `Verificado y activo` | Normalización visual implementada; el contrato backend debe confirmar los valores de origen. |
| Publicación cerrada como solucionada | `Verificado y solucionado` | Normalización visual implementada para el valor `solucionado`; el contrato backend debe confirmar su alcance público. |
| `rechazado` | No mostrar públicamente | Propuesta coherente con privacidad, pendiente de formalizar. |
| `no_solucionado` | Sin mapeo público automático | Decisión pendiente; no debe falsificarse como activo o solucionado. |
| `retirado` | No mostrar como estado público | Decisión pendiente para el historial. |

### 5.8 Marca de agua y contrato de evidencias

Una superposición visual y una marca incrustada son opciones distintas. La segunda requiere definir originales, derivados, videos, metadatos y archivo publicado.

Una tabla o colección de evidencias múltiples, un bucket privado, derivados públicos o RPC específicas son alternativas de diseño. Este documento no selecciona tablas, nombres de RPC, buckets adicionales ni políticas RLS.

### 5.9 Numeración general de módulos

El repositorio no contiene un índice formal que defina la numeración de los seis módulos generales. Este documento usa seis áreas explícitas para el Módulo 2, pero no las presenta como la numeración general del proyecto.

## 6. Requisitos de backend para la futura integración con Supabase

Esta sección describe necesidades que el backend futuro deberá atender. No autoriza cambios de backend ni prescribe una implementación concreta.

### 6.1 Persistencia del reporte

La futura integración deberá poder recibir y persistir, con autorización adecuada, categoría, subcategoría, título, descripción, vereda, territorio, lugar, referencia textual, nombre opcional, latitud, longitud, precisión, estado de ubicación, fecha de captura, estado interno, relación con publicación y fechas de creación/revisión.

### 6.2 Consulta y selección de vereda

El contrato futuro deberá mantener la consulta de veredas activas/inactivas y, si se aprueba una experiencia de búsqueda, permitir filtrar sin inventar nombres ni fotografías. Si se aprueba persistir la última vereda, deberá definirse el alcance de esa persistencia y su relación con la cuenta; no debe asumirse que una selección local es una preferencia autenticada.

No debe introducirse detección GPS en Mi Vereda sin una decisión funcional y una política de privacidad/precisión específica.

### 6.3 Conteo de reportes solucionados

Para el resumen rápido, el contrato futuro deberá permitir contar solo reportes con estado público oficial `Verificado y solucionado`, asociados a la vereda consultada, sin mezclar estados internos ni datos de ejemplo.

Debe definirse si el conteo proviene de un agregado backend, de una consulta paginada completa o de una respuesta de cartelera que ya incluya el total. La solución debe funcionar con límites y paginación adecuados para conexiones rurales.

### 6.4 Evidencias múltiples

El futuro contrato deberá soportar, por lo menos, hasta tres fotos y un video por reporte, tipo de evidencia, fuente cámara/galería, fecha de captura cuando exista, fecha de incorporación, dimensiones, duración de video, procesamiento, archivo procesado, original protegido, derivado público autorizado o miniatura desenfocada y relación inequívoca con el reporte.

### 6.5 Privacidad y protección de originales

Para emergencias pendientes, backend y Storage deberán garantizar que el original no sea público, que la miniatura sea un derivado físicamente procesado, que la URL autorizada no exponga el original, que las políticas se apliquen a consultas, Storage y RPC, y que los derivados estén comprimidos para conexiones móviles.

### 6.6 Emergencia provisional

Se necesitará un contrato para identificar emergencias pendientes, exponerlas provisionalmente sin presentarlas como verificadas, mostrar el texto establecido, proteger sus evidencias, actualizar o retirar la alerta cuando cambie el estado y registrar la trazabilidad administrativa.

### 6.7 Consultas públicas y detalle

La cartelera y el detalle futuro deberán distinguir publicaciones verificadas activas, publicaciones solucionadas aptas para historial, emergencias provisionales autorizadas, evidencias visibles y datos de ubicación que la política permita exponer. Los estados internos que no formen parte del contrato público deben permanecer fuera de estas consultas.

El detalle deberá resolver también la relación entre `publicacion_tabla`, `publicacion_id`, código público, categoría, vereda, fotografías, videos, ubicación, fechas, estado y resultado. Mientras tanto, el frontend busca por el ID interno dentro de las respuestas actuales de cartelera y no presenta ese mecanismo como solución final.

### 6.8 Estados y auditoría

La integración deberá definir estados internos de revisión, estados operativos por categoría, resultados de cierre, estados públicos permitidos y reglas para `rechazado`, `no_solucionado` y `retirado`. Debe conservar auditoría de aprobación, rechazo, cierre, retiro y purga.

### 6.9 Migraciones, tipos y entorno

Antes de una futura Fase B se deberá comparar migraciones versionadas con el proyecto Supabase real, confirmar las migraciones aplicadas, regenerar tipos cuando cambie el contrato, revisar RLS y permisos, confirmar Storage y sus políticas, y evitar cambios sobre el proyecto compartido sin autorización específica.

### 6.10 Código público único

La futura integración deberá incorporar un código público con formato `AV-XX-0001`, separado del ID interno, con secuencia global iniciada en `0001`. Debe garantizar unicidad y asignación segura ante concurrencia, permitir consultarlo y copiarlo desde el detalle, y conservarlo aunque cambie el estado operativo de la publicación según las reglas de retención aprobadas. La generación, restricción única, índice, exposición en cartelera/detalle y eventual búsqueda por código requieren diseño y migración backend posteriores.

## 7. Orden de implementación y estado

La Fase 1 ya fue implementada y validada como frontend. Las fases posteriores siguen siendo un plan de trabajo; no autorizan cambios de backend.

### Fase 0 — Auditoría de comportamiento y contrato visual

Primero se debe cerrar el inventario de las seis áreas, rutas, componentes, contratos y comportamientos actuales. Esta fase evita eliminar funciones existentes, confundir Inicio con Mi Vereda, duplicar consultas o construir el detalle sobre datos que no existen.

Se debe conservar intacto Reportar, el flujo local de Superadmin, `AdminOperation`, la autenticación, la navegación compartida y los contratos de backend. También se deben separar claramente datos reales, datos locales y simulaciones.

### Fase 1 — Inicio especial y Reportes por categorías — implementada

La portada especial de `/` se implementó sin barra superior en el montaje inicial. El flujo activa una navegación compartida en memoria al entrar a `/reportes` o `/reportar`, manteniendo Inicio, Reportes, Mapa y Veredas durante la navegación actual. La nueva ruta `/reportes` reutiliza las cuatro tarjetas de categorías y deja `Ver todos los reportes` sin acción hasta la fase del listado general.

No se implementaron en esta fase el listado general, los filtros del listado, el detalle, la galería de evidencias, el mapa del detalle ni cambios de backend.

### Fase 1B — Listado general, categorías y detalle frontend — implementada

Se implementaron `/reportes/todos`, las tarjetas públicas reutilizables en las cuatro categorías y `/reportes/:id`. Esta fase resuelve búsqueda, filtro de categoría, carga incremental, estados públicos, severidad limitada, advertencias de emergencias en revisión, ilustraciones locales y marca visual no destructiva para fuentes seguras. No crea evidencias persistentes, código público, mapa, video persistente ni cambios de backend.

La excepción de emergencias pendientes queda preparada sin descargar el `foto_url` actual como si fuera un derivado protegido. La habilitación futura de «Ver imagen» dependerá de una URL de evidencia segura entregada por backend/Storage.

### Fase 2 — Mi Vereda: estructura principal

Mi Vereda debe abordarse primero porque define el contexto territorial, la selección de vereda y la relación entre novedades activas e historial. Aquí se debe validar la reorganización visual inspirada en la referencia, mantener la consulta real, conservar la guía hablada y preparar el espacio del resumen rápido sin inventar cifras.

La salida de esta fase debe ser una jerarquía visual aprobada, no una nueva política de datos.

### Fase 3 — Cambiar de vereda

Después debe definirse la presentación de selección de vereda en celular y PC. Depende de `consultarVeredas()`, del comportamiento actual de selección manual y de la decisión sobre panel, diálogo o ruta.

No se debe añadir detección GPS, persistencia de última selección o fotografías sin aprobación y sin contrato de datos.

### Fase 4 — Historial y estados públicos

Con el contexto de vereda definido, debe rediseñarse el historial. Esta fase debe resolver visualmente búsqueda, filtros, periodo, estados, tarjetas y vacíos, pero no puede cerrar por sí sola el mapeo de estados internos. Antes de conectar un conteo de solucionados se debe aprobar la fuente de datos para `Verificado y solucionado`.

### Fase 5 — Emergencias, Vías, Servicios y Avisos

Con las tarjetas, estados, navegación y patrones de Mi Vereda definidos, se pueden rediseñar las cuatro categorías respetando sus propósitos y contratos actuales. Emergencias requiere tratamiento separado para la alerta provisional y la evidencia protegida; Vías, Servicios y Avisos deben mantener privados los reportes en revisión.

### Fase 6 — Detalle de publicaciones

El detalle debe implementarse después de establecer qué datos y acciones usan las listas y el historial. Así se evita crear una pantalla incompatible con los identificadores y contratos existentes. Esta fase debe comenzar como detalle de publicaciones verificadas con datos reales disponibles; galería múltiple, video, mapa real y emergencia provisional dependen de contratos posteriores.

### Fase 7 — Integración de patrones y validación responsive

Finalmente se deben revisar celular y PC, accesibilidad, estados de carga/error/vacío, modo claro/oscuro, legibilidad y comportamiento en contexto rural. Debe verificarse que las acciones persistentes de Reportar y 123 no se oculten ni compitan con el contenido.

Cualquier cambio en `src/components/app-shell.tsx` o en `MODULOS`/`ATAJOS` de `src/routes/index.tsx` debe documentarse en un punto independiente del resumen del PR.

### Fase 8 — Integración futura autorizada

Solo después de aprobar el alcance visual y las decisiones pendientes se podrá definir el contrato de persistencia, evidencias múltiples, emergencia provisional, detalle, consultas públicas, RLS, Storage, RPC y tipos. Esa fase será posterior y no forma parte de esta actualización documental.

## 8. Dependencias por área

| Área | Rutas y componentes actuales | Datos/adaptadores | Dependencias compartidas | Límites actuales |
| --- | --- | --- | --- | --- |
| Mi Vereda | `src/routes/mi-vereda.tsx`, `AppShell`, estilos `.mi-vereda-*` | `consultarCartelera`, `consultarHistorial`, `consultarVeredas`, `MiVeredaPublicacion`, `MiVeredaHistorialPublicacion`, `MiVeredaVereda` | `AppShell`, selector de tema, cuenta, botón flotante de Reportar, barra 123 y guía hablada | Una sola ruta; sin resumen rápido, fotos de veredas o detalle. |
| Cambiar de vereda | Selector en `src/routes/mi-vereda.tsx`; no hay ruta o componente independiente | `consultarVeredas()` | Estado `veredaId`, consulta de activas/historial, responsive | Selección manual; sin búsqueda específica, GPS o persistencia de última selección. |
| Historial | Vista `historial` dentro de `src/routes/mi-vereda.tsx`, filtros y tarjetas `mi-vereda-card` | `consultarHistorial()`, `mi_vereda_historial`, `MiVeredaHistorialPublicacion` | Estados oficiales, filtros, paginación y futura navegación a detalle | Usa `solucionado`/`no_solucionado`; no hay detalle ni imágenes en tarjeta. |
| Emergencias | `src/routes/emergencias.tsx`, `TarjetaReportePublica`, `EstadoPublicoChip`, `FotoEvidenciaPublica` | `consultarCartelera({ p_categoria: "emergencia" })`, `reportes-publicos.ts` | `AppShell`, estados oficiales, advertencia provisional y derivado seguro futuro | La excepción pendiente está preparada visualmente, pero requiere contrato backend y evidencia protegida. |
| Vías | `src/routes/vias.tsx`, `TarjetaReportePublica`, `EstadoPublicoChip` | `consultarCartelera({ p_categoria: "via" })`, normalización pública y severidad | `AppShell`, estados oficiales, detalle compartido | No ofrece severidad `Normal`; galería y filtros adicionales siguen pendientes. |
| Servicios | `src/routes/servicios.tsx`, `TarjetaReportePublica`, `EstadoPublicoChip` | `consultarCartelera({ p_categoria: "servicio" })`, ilustraciones locales | `AppShell`, estados públicos y detalle compartido | Sin severidad pública; no hay galería persistente. |
| Avisos | `src/routes/avisos.tsx`, `TarjetaReportePublica`, `EstadoPublicoChip` | `consultarCartelera({ p_categoria: "aviso" })`, fecha e ilustraciones | `AppShell`, contrato de categoría `aviso` | Sin severidad pública; no hay galería persistente. |
| Listado general | `src/routes/reportes.todos.tsx`, `TarjetaReportePublica` | Consulta paginada de las cuatro categorías, búsqueda y filtro visual | `reportes-publicos.ts`, navegación a `/reportes/:id` | No hay código público ni paginación backend específica. |
| Detalle | `src/routes/reportes.$id.tsx`, `FotoEvidenciaPublica`, `VideoEvidenciaPublica` preparado | Búsqueda temporal por `publicacion_id` en cartelera actual | Navegación desde Inicio, categorías y futuro Mi Vereda/Historial | Código público, galería, video persistente, mapa y acciones requieren backend. |

## 9. Dependencias con otras áreas del proyecto

| Área relacionada | Dependencia para Módulo 2 | Límite actual |
| --- | --- | --- |
| Inicio y cartelera pública | Reutilizar categorías, estados, fotos y consultas sin datos ficticios; conservar diferencia entre Inicio general y Mi Vereda territorial. | `src/routes/index.tsx` no enlaza a detalle y sus tarjetas apuntan a rutas generales. |
| Reportar | Eventualmente produce datos que Módulo 2 consultará; se deben conservar límites y semántica de evidencias. | El envío público actual es local/mock. |
| Gestión de Superadmin y Administrador de Vereda | Aprueba, rechaza, cierra y retira publicaciones sin duplicar operaciones. | El flujo local de PR #17 no persiste; `AdminOperation` sí opera sobre Supabase. |
| Mapa | El detalle y las tarjetas podrían enlazar a ubicación si existe una política aprobada de precisión y fuente geográfica. | `/mapa` sigue en construcción. |
| Autenticación, roles y territorio | Debe conservar selección territorial, sesión y acceso administrativo existentes. | No cambiar autenticación, roles, permisos ni RLS en esta fase. |
| Navegación compartida | Mantener `AppShell`, `MODULOS`, `ATAJOS`, CTA de Reportar y 123 salvo aprobación específica. | Cambios en `app-shell.tsx` o arreglos protegidos requieren resumen separado. |

## 10. Documentos, archivos y contratos relevantes

### Documentos

- [`docs/pendientes-backend.md`](pendientes-backend.md): registro corto de necesidades backend.
- [`README.md`](../README.md): enlaces de descubrimiento.
- [`AGENTS.md`](../AGENTS.md): instrucciones operativas del repositorio.

### Mi Vereda e historial

- `src/routes/mi-vereda.tsx`
- `src/lib/mi-vereda-cartelera.ts`
- `src/lib/mi-vereda-demo.ts`
- `src/components/guia-hablada.tsx`
- `src/lib/guia-audio-assets.ts`
- `src/routes/index.tsx`
- `src/components/carta.tsx`

### Categorías y navegación

- `src/routes/emergencias.tsx`
- `src/routes/vias.tsx`
- `src/routes/servicios.tsx`
- `src/routes/avisos.tsx`
- `src/routes/mapa.tsx`
- `src/components/app-shell.tsx`
- `src/components/brand-lockup.tsx`
- `src/components/theme-toggle.tsx`
- `src/styles.css`

### Reportar y evidencias

- `src/routes/reportar.tsx`
- `src/components/reportar/reportar-flow.tsx`
- `src/components/reportar/reportar-media-capture.tsx`
- `src/components/reportar/reportar-evidence-step.tsx`
- `src/components/reportar/reportar-evidence-list.tsx`
- `src/components/reportar/reportar-review-step.tsx`
- `src/components/reportar/reportar-location-step.tsx`
- `src/components/reportar/reportar-details-step.tsx`
- `src/lib/reportar/types.ts`
- `src/lib/reportar/catalogo.ts`
- `src/lib/reportar/photo-processor.ts`
- `src/lib/reportar/mock-submit.ts`
- `src/hooks/use-reportar-flow.ts`

### Reportar local y gestión conectada

- `src/routes/admin/gestion/reportar.tsx`
- `src/components/admin/admin-reportar-flow.tsx`
- `src/components/admin/admin-operation.tsx`
- `src/components/admin/purga-definitiva.tsx`
- `src/lib/alerta.ts`
- `src/integrations/supabase/types.ts`
- `src/integrations/supabase/client.ts`

### Backend versionado

- `supabase/migrations/20260821130000_add_evidencia_ubicacion_reportes.sql`
- `docs/pendientes-backend.md`

## 11. Decisiones que requieren aprobación y asuntos resolubles mediante auditoría

### Requieren aprobación del propietario

1. Forma final de reorganizar Mi Vereda sin cambiar su comportamiento.
2. Si Cambiar de vereda será panel, diálogo o ruta propia.
3. Si se permite búsqueda, fotografías, detección GPS o persistencia de última selección.
4. Fuente del conteo de «Reportes solucionados».
5. Tratamiento visual y accesible de la etiqueta completa «Verificado y solucionado».
6. Tratamiento público de `no_solucionado`, `retirado` y `rechazado`.
7. Ruta y modelo de navegación para Detalle de publicaciones.
8. Campos, acciones y medios disponibles en el detalle.
9. Forma de marca de agua.
10. Contrato de evidencias múltiples y videos.
11. Contrato real de emergencia provisional.
12. Fuente y precisión del futuro mapa.
13. Cualquier cambio que afecte autenticación, roles, permisos, RLS, Storage o backend.

### Se pueden resolver mediante auditoría técnica

- Inventario de rutas, componentes y estilos actuales.
- Identificación de consultas y adaptadores ya existentes.
- Comparación entre Inicio, Mi Vereda, categorías e historial.
- Determinación de qué datos se muestran realmente hoy.
- Identificación de enlaces que actualmente apuntan a rutas generales.
- Verificación de estados de carga, error y vacío.
- Revisión responsive y accesibilidad de la implementación existente.
- Identificación de cambios que afectarían `app-shell.tsx` o `MODULOS`/`ATAJOS`.
- Verificación de la continuidad de PR #14, #15/#14b, #16 y #17.
- Inventario de dependencias futuras sin modificar backend.

## 12. Información pendiente antes de implementación

Antes de afirmar que el Módulo 2 está listo o conectado deben resolverse explícitamente:

1. Jerarquía visual final de Mi Vereda.
2. Forma visual y funcional de Cambiar de vereda.
3. Fuente real del conteo de «Verificado y solucionado».
4. Mapeo público final de los estados del historial.
5. Contrato de emergencia provisional y su ciclo de vida.
6. Política de autorización para miniaturas y originales.
7. Modelo persistente de evidencias múltiples.
8. Contrato de videos publicados.
9. Ruta y contrato del detalle de publicaciones.
10. Relación del detalle con Inicio, Mi Vereda, categorías e historial.
11. Marca de agua: superposición o archivo incrustado.
12. Fuente y precisión del mapa real.
13. Reconciliación de migraciones aplicadas con el repositorio.
14. Regeneración de tipos después de cualquier cambio autorizado.
15. Revisión de RLS, Storage y permisos antes de exponer evidencias o emergencias pendientes.

## 13. Estado de esta documentación

Este documento actualiza formalmente el alcance del Módulo 2 para incluir seis áreas explícitas: Mi Vereda, Cambiar de vereda, Historial, Emergencias, Vías/Servicios/Avisos y Detalle de publicaciones. También registra la referencia visual, el reemplazo aprobado de «Veredas relacionadas» por «Reportes solucionados», el requisito de contar solo «Verificado y solucionado», el inventario de comportamiento actual y el orden recomendado de implementación.

Las propuestas de la sección 5 requieren aprobación antes de convertirse en decisiones. Los requisitos de backend de la sección 6 requieren una fase autorizada de integración.

La actualización fue realizada sin modificar código funcional ni backend. No se realizaron commits, pushes, merges, migraciones, cambios de Storage, cambios de autenticación, cambios de roles, cambios de permisos, cambios de RLS ni despliegues.
