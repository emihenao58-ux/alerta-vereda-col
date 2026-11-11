import { createFileRoute } from "@tanstack/react-router";
import { Accessibility, Bell, Check, Info, MapPin } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { ModuleSectionHeading } from "@/components/module-section-heading";
import { territoriosDeTipo } from "@/lib/reportar/mock-data";
import {
  usePreferenciasM4,
  type AlcanceNotificaciones,
  type CategoriaNotificacion,
  type PreferenciaUbicacion,
} from "@/hooks/use-m4-preferences";

export const Route = createFileRoute("/configuracion")({
  component: ConfiguracionPage,
});

const CATEGORIAS: {
  id: CategoriaNotificacion;
  titulo: string;
  imagen: string;
}[] = [
  {
    id: "emergencias",
    titulo: "Emergencias",
    imagen: "/images/reportar/illustrations/emergencias/accidente.webp",
  },
  {
    id: "vias",
    titulo: "Vías",
    imagen: "/images/reportar/illustrations/vias/derrumbe.webp",
  },
  {
    id: "servicios",
    titulo: "Servicios",
    imagen: "/images/reportar/illustrations/servicios/agua.webp",
  },
  {
    id: "avisos",
    titulo: "Avisos",
    imagen: "/images/reportar/illustrations/avisos/comunitario.webp",
  },
];

const VEREDAS_NOTIFICACIONES = [...territoriosDeTipo("vereda")].sort((a, b) =>
  a.nombre.localeCompare(b.nombre, "es"),
);

const ESCALAS = [
  { etiqueta: "Pequeño", porcentaje: 90 },
  { etiqueta: "Normal", porcentaje: 100 },
  { etiqueta: "Grande", porcentaje: 115 },
] as const;

const ALCANCES: { id: AlcanceNotificaciones; titulo: string; detalle: string }[] = [
  {
    id: "todas",
    titulo: "Todas las veredas",
    detalle: "Recibe avisos de todas las veredas disponibles",
  },
  {
    id: "una-vereda",
    titulo: "Una vereda específica",
    detalle: "Elige aquí la vereda de la que quieres recibir avisos",
  },
  {
    id: "ninguna",
    titulo: "Ninguna notificación",
    detalle: "Desactiva los avisos sin borrar tus preferencias por categoría",
  },
];

function ConfiguracionPage() {
  const {
    escalaTexto,
    setEscalaTexto,
    categoriasNotificacion,
    alternarCategoriaNotificacion,
    alcanceNotificaciones,
    setAlcanceNotificaciones,
    veredaNotificacionesId,
    setVeredaNotificacionesId,
    preferenciaUbicacion,
    permisoUbicacion,
    mensajeUbicacion,
    mensajePersistenciaUbicacion,
    cambiarPreferenciaUbicacion,
  } = usePreferenciasM4();

  const escalaPredefinida = ESCALAS.some((opcion) => opcion.porcentaje === escalaTexto);
  const cambiarUbicacion = (preferencia: PreferenciaUbicacion) => {
    void cambiarPreferenciaUbicacion(preferencia);
  };

  return (
    <AppShell>
      <section className="configuracion-page" aria-labelledby="m4-section-heading-title">
        <ModuleSectionHeading
          title="Configuración"
          eyebrow="AlertaVereda"
          description="Ajusta la experiencia de uso de la aplicación."
        />

        <section
          className="configuracion-panel configuracion-text-panel"
          aria-labelledby="config-text-title"
        >
          <div className="configuracion-panel-heading">
            <span className="configuracion-heading-icon" aria-hidden="true">
              <Accessibility size={30} />
            </span>
            <div>
              <h2 id="config-text-title">Tamaño del texto</h2>
              <p>Ajusta el tamaño de los textos en la aplicación.</p>
            </div>
          </div>

          <div className="configuracion-presets" role="group" aria-label="Tamaños de texto rápidos">
            {ESCALAS.map((opcion) => (
              <button
                className="configuracion-preset"
                type="button"
                key={opcion.porcentaje}
                aria-pressed={escalaTexto === opcion.porcentaje}
                onClick={() => setEscalaTexto(opcion.porcentaje)}
              >
                <span className="configuracion-preset-sample" aria-hidden="true">
                  A<span>a</span>
                </span>
                <span>{opcion.etiqueta}</span>
                <small>{opcion.porcentaje}%</small>
                {escalaTexto === opcion.porcentaje && (
                  <Check className="configuracion-preset-check" size={16} aria-hidden="true" />
                )}
              </button>
            ))}
          </div>

          <label className="configuracion-scale-control" htmlFor="configuracion-text-scale">
            <span>
              Ajuste actual: <strong>{escalaTexto}%</strong>
              {!escalaPredefinida && (
                <span className="configuracion-custom-label"> · Personalizado</span>
              )}
            </span>
            <input
              id="configuracion-text-scale"
              type="range"
              min={90}
              max={140}
              step={5}
              value={escalaTexto}
              onChange={(event) => setEscalaTexto(Number(event.target.value))}
              aria-valuetext={`${escalaTexto} por ciento`}
            />
            <span className="configuracion-range-labels" aria-hidden="true">
              <small>90%</small>
              <small>140%</small>
            </span>
          </label>
        </section>

        <section
          className="configuracion-panel configuracion-notifications-panel"
          aria-labelledby="config-notifications-title"
        >
          <div className="configuracion-panel-heading configuracion-notifications-heading">
            <span className="configuracion-heading-icon" aria-hidden="true">
              <Bell size={30} />
            </span>
            <div>
              <h2 id="config-notifications-title">Notificaciones</h2>
              <p>Elige qué avisos te interesaría recibir.</p>
            </div>
          </div>

          <div className="configuracion-subsection-heading">
            <h3>Notificaciones por categoría</h3>
          </div>

          <div
            className="configuracion-category-grid"
            role="group"
            aria-label="Categorías de notificaciones"
          >
            {CATEGORIAS.map((categoria) => {
              const activa = categoriasNotificacion[categoria.id];
              return (
                <button
                  className={`configuracion-category configuracion-category--${categoria.id}${activa ? " is-active" : ""}`}
                  type="button"
                  key={categoria.id}
                  aria-pressed={activa}
                  onClick={() => alternarCategoriaNotificacion(categoria.id)}
                >
                  <img src={categoria.imagen} alt="" loading="lazy" />
                  <span>{categoria.titulo}</span>
                  <span className="configuracion-category-state">
                    {activa ? "Activada" : "Desactivada"}
                  </span>
                </button>
              );
            })}
          </div>

          <fieldset className="configuracion-scope-fieldset">
            <legend>¿De qué veredas quieres recibir notificaciones?</legend>
            <div className="configuracion-scope-options">
              {ALCANCES.map((alcance) => (
                <label
                  className={`configuracion-scope-option${alcanceNotificaciones === alcance.id ? " is-selected" : ""}`}
                  key={alcance.id}
                >
                  <input
                    type="radio"
                    name="configuracion-alcance-notificaciones"
                    value={alcance.id}
                    checked={alcanceNotificaciones === alcance.id}
                    onChange={() => setAlcanceNotificaciones(alcance.id)}
                  />
                  <span>
                    <strong>{alcance.titulo}</strong>
                    <small>{alcance.detalle}</small>
                  </span>
                </label>
              ))}
            </div>
            {alcanceNotificaciones === "una-vereda" && (
              <div className="configuracion-vereda-selector">
                <label htmlFor="configuracion-vereda-notificaciones">Selecciona la vereda</label>
                <select
                  id="configuracion-vereda-notificaciones"
                  name="configuracion-vereda-notificaciones"
                  value={veredaNotificacionesId}
                  onChange={(event) => setVeredaNotificacionesId(event.target.value)}
                >
                  <option value="">Elige una vereda</option>
                  {VEREDAS_NOTIFICACIONES.map((vereda) => (
                    <option key={vereda.id} value={vereda.id}>
                      {vereda.nombre}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </fieldset>

          {alcanceNotificaciones === "ninguna" && (
            <p className="configuracion-inline-note" role="status">
              <Info size={17} aria-hidden="true" />
              <span>Se suspenden todos los avisos; las categorías seleccionadas se conservan.</span>
            </p>
          )}

          <p className="configuracion-inline-note">
            <Info size={17} aria-hidden="true" />
            <span>
              Estas opciones son preferencias visuales: la aplicación todavía no envía
              notificaciones.
            </span>
          </p>
        </section>

        <section
          className="configuracion-panel configuracion-location-panel"
          aria-labelledby="config-location-title"
        >
          <div className="configuracion-panel-heading">
            <span className="configuracion-heading-icon" aria-hidden="true">
              <MapPin size={30} />
            </span>
            <div>
              <h2 id="config-location-title">Permiso de ubicación</h2>
              <p>
                Controla cuándo AlertaVereda puede utilizar la ubicación de tu dispositivo. La
                ubicación automática depende de los permisos del navegador y de que la página siga
                ejecutándose.
              </p>
            </div>
          </div>

          <fieldset className="configuracion-location-fieldset">
            <legend>Uso de ubicación</legend>
            <div className="configuracion-location-options">
              <label
                className={`configuracion-location-option${preferenciaUbicacion === "nunca" ? " is-selected" : ""}`}
              >
                <input
                  type="radio"
                  name="configuracion-ubicacion"
                  value="nunca"
                  checked={preferenciaUbicacion === "nunca"}
                  onChange={() => cambiarUbicacion("nunca")}
                />
                <span>
                  <strong>Nunca</strong>
                  <small>
                    No se solicitará GPS automáticamente. Si lo decides, puedes pedir una ubicación
                    puntual desde Reportar.
                  </small>
                </span>
              </label>
              <label
                className={`configuracion-location-option${preferenciaUbicacion === "mientras-uso" ? " is-selected" : ""}`}
              >
                <input
                  type="radio"
                  name="configuracion-ubicacion"
                  value="mientras-uso"
                  checked={preferenciaUbicacion === "mientras-uso"}
                  onChange={() => cambiarUbicacion("mientras-uso")}
                />
                <span>
                  <strong>Mientras uso la aplicación</strong>
                  <small>
                    Intentará una lectura al seleccionarla en primer plano si ya pasó el intervalo
                    mínimo de 5 minutos; luego, como máximo cada 5 minutos mientras siga visible. Se
                    pausa fuera del primer plano y lo intentará al volver.
                  </small>
                </span>
              </label>
              <label
                className={`configuracion-location-option${preferenciaUbicacion === "siempre" ? " is-selected" : ""}`}
              >
                <input
                  type="radio"
                  name="configuracion-ubicacion"
                  value="siempre"
                  checked={preferenciaUbicacion === "siempre"}
                  onChange={() => cambiarUbicacion("siempre")}
                />
                <span>
                  <strong>Siempre</strong>
                  <small>
                    No consulta GPS al seleccionarla. Intentará actualizar como máximo cada 5
                    minutos mientras la página siga ejecutándose; el navegador puede suspenderla y
                    no se garantiza actividad en segundo plano ni con la aplicación cerrada.
                  </small>
                </span>
              </label>
            </div>
          </fieldset>

          <p className="configuracion-location-status" role="status">
            {mensajeUbicacion ??
              (preferenciaUbicacion === "nunca"
                ? "No se harán lecturas ni solicitudes automáticas de ubicación. Reportar puede pedir una ubicación puntual solo si tú la solicitas."
                : permisoUbicacion === "concedido"
                  ? `El navegador concedió el permiso. La preferencia «${preferenciaUbicacion === "siempre" ? "Siempre" : "Mientras uso"}» no activa rastreo continuo; las actualizaciones automáticas respetan el intervalo mínimo de 5 minutos.`
                  : preferenciaUbicacion === "mientras-uso"
                    ? "El navegador puede pedir permiso al primer intento, que se hará ahora si la página está en primer plano y ya pasó el intervalo mínimo de 5 minutos. Las lecturas se pausan fuera del primer plano."
                    : "La preferencia «Siempre» no solicita GPS al seleccionarla. El navegador puede pedir permiso al primer intento automático permitido por el ciclo de vida.")}
          </p>
          {mensajePersistenciaUbicacion && (
            <p className="configuracion-location-status" role="status">
              {mensajePersistenciaUbicacion}
            </p>
          )}
        </section>

        <p className="configuracion-temporary-note">
          <Info size={18} aria-hidden="true" />
          <span>
            Solo se guarda en este dispositivo la preferencia de ubicación. El tamaño del texto y
            las notificaciones son temporales; esta preferencia no guarda coordenadas. Una ubicación
            que confirmes en Reportar sí puede formar parte de ese reporte local.
          </span>
        </p>
      </section>
    </AppShell>
  );
}
