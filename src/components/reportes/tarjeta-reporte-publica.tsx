import {
  CalendarDays,
  ChevronRight,
  Image as ImageIcon,
  MapPin,
  TriangleAlert,
} from "lucide-react";
import type { ReactNode } from "react";
import { Link } from "@tanstack/react-router";
import { URL_FOTO } from "@/lib/alerta";
import {
  estadoPublicoDe,
  esEmergenciaEnRevision,
  etiquetaCategoria,
  fechaHoraPublica,
  ilustracionPublicaDe,
  coordenadasPublicasDe,
  severidadPublicaDe,
  ETIQUETAS_SEVERIDAD_PUBLICA,
  type EstadoPublico,
} from "@/lib/reportes-publicos";
import type { MiVeredaPublicacion } from "@/lib/mi-vereda-cartelera";
import type { OrigenListaReporte } from "@/lib/reportes-navegacion";
import { EstadoPublicoChip } from "./estado-publico";
import { FotoEvidenciaPublica } from "./evidencia-publica";
import { MetaPublicacionCompacta, type MetadatosPublicacion } from "./metadatos-publicacion";

export function TarjetaReportePublica({
  publicacion,
  mostrarCategoria,
  origenLista = "todos",
  compacta = false,
  metadatosPublicacion,
  estadoPublicoOverride,
  metadatosCategoria,
}: {
  publicacion: MiVeredaPublicacion;
  mostrarCategoria: boolean;
  origenLista?: OrigenListaReporte;
  compacta?: boolean;
  metadatosPublicacion?: MetadatosPublicacion | null;
  estadoPublicoOverride?: EstadoPublico;
  metadatosCategoria?: ReactNode;
}) {
  const estado = estadoPublicoOverride ?? estadoPublicoDe(publicacion);
  if (!estado) return null;

  const fotoUrl = URL_FOTO(publicacion.foto_url);
  const fecha = publicacion.fecha_evento ?? publicacion.created_at;
  const severidad = severidadPublicaDe(publicacion);
  const emergenciaSinVerificar = esEmergenciaEnRevision(publicacion);
  const categoria = etiquetaCategoria(publicacion.categoria);
  const cardClassName = [
    "reporte-card-publico",
    fotoUrl ? "reporte-card-publico-con-foto" : "",
    compacta ? "reporte-card-publico-compacta" : "",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <article
      className={cardClassName}
      data-estado-publico={estado}
      data-categoria={publicacion.categoria}
    >
      <Link
        to="/reportes/$id"
        params={{ id: publicacion.publicacion_id }}
        search={{ origen: origenLista }}
        className="reporte-card-publico-hit-area"
        aria-label={`Abrir detalle del reporte: ${publicacion.titulo}`}
      >
        <span className="sr-only">Abrir detalle del reporte: {publicacion.titulo}</span>
      </Link>

      <div className="reporte-card-publico-media">
        {fotoUrl ? (
          <FotoEvidenciaPublica
            src={emergenciaSinVerificar ? null : fotoUrl}
            alt={`Evidencia fotográfica de ${publicacion.titulo}`}
            contexto={{
              vereda: publicacion.vereda_nombre,
              tomadaEn: publicacion.capturado_en ?? null,
              publicadaEn: publicacion.created_at,
              coordenadas: coordenadasPublicasDe(publicacion),
            }}
            emergenciaSinVerificar={emergenciaSinVerificar}
            compacta={compacta}
          />
        ) : (
          <div className="reporte-card-publico-illustration">
            <img src={ilustracionPublicaDe(publicacion)} alt="" loading="lazy" decoding="async" />
            <span>
              <ImageIcon size={14} aria-hidden="true" />
              Ilustración representativa · sin evidencia adjunta
            </span>
          </div>
        )}
      </div>

      <div className="reporte-card-publico-body">
        <div className="reporte-card-publico-topline">
          {mostrarCategoria && (
            <span className="reporte-card-publico-category">
              <CategoryIcon categoria={publicacion.categoria} />
              {categoria}
            </span>
          )}
          <EstadoPublicoChip estado={estado} />
        </div>

        <div className="reporte-card-publico-title-row">
          <h3>{publicacion.titulo}</h3>
          <span className="reporte-card-publico-detail-cue" aria-hidden="true">
            <ChevronRight size={22} />
          </span>
        </div>

        <MetaPublicacionCompacta metadatos={metadatosPublicacion ?? null} />
        {metadatosCategoria}

        <div className="reporte-card-publico-location">
          <MapPin size={16} aria-hidden="true" />
          <span>{publicacion.vereda_nombre ?? publicacion.lugar ?? "Ubicación no disponible"}</span>
        </div>

        <div className="reporte-card-publico-date">
          <CalendarDays size={15} aria-hidden="true" />
          <span>{fechaHoraPublica(fecha)}</span>
        </div>

        {publicacion.descripcion && (
          <p className="reporte-card-publico-description">{publicacion.descripcion}</p>
        )}

        {emergenciaSinVerificar && (
          <p className="reporte-card-publico-warning">
            <TriangleAlert size={15} aria-hidden="true" />
            Información no verificada. Actúa con precaución.
          </p>
        )}

        <div className="reporte-card-publico-footer">
          {severidad && (
            <span className={`reporte-severidad-chip reporte-severidad-${severidad}`}>
              <span aria-hidden="true" className="reporte-severidad-dot" />
              {ETIQUETAS_SEVERIDAD_PUBLICA[severidad]}
            </span>
          )}
          <span className="reporte-card-publico-evidence-summary">
            {fotoUrl ? (
              <>
                <ImageIcon size={15} aria-hidden="true" /> Fotografía adjunta
              </>
            ) : (
              <>Sin evidencia adjunta</>
            )}
          </span>
        </div>
      </div>
    </article>
  );
}

function CategoryIcon({ categoria }: { categoria: MiVeredaPublicacion["categoria"] }) {
  return (
    <span className={`reporte-category-dot reporte-category-dot-${categoria}`} aria-hidden="true" />
  );
}
