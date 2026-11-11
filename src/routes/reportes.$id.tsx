import { useQuery } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { ReporteDetalleCompartido } from "@/components/reportes/reporte-detalle-compartido";
import { Vacio } from "@/components/carta";
import { URL_FOTO } from "@/lib/alerta";
import { estadoGeneralAvisoDe } from "@/lib/avisos-publicos";
import { normalizarOrigenListaReporte, ORIGENES_LISTA_REPORTE } from "@/lib/reportes-navegacion";
import { estadoGeneralViaDe, esPublicacionViasPublica } from "@/lib/vias-publicas";
import {
  esEmergenciaEnRevision,
  estadoPublicoDe,
  severidadPublicaDe,
  consultarReportePublicoPorId,
} from "@/lib/reportes-publicos";
import { estadoGeneralServicioDe } from "@/lib/servicios-publicos";

export const Route = createFileRoute("/reportes/$id")({
  validateSearch: (search: Record<string, unknown>) => ({
    origen: normalizarOrigenListaReporte(search["origen"]),
  }),
  head: () => ({
    meta: [
      { title: "Detalle del reporte · AlertaVereda" },
      {
        name: "description",
        content: "Consulta el detalle de un reporte público de AlertaVereda.",
      },
    ],
  }),
  component: ReporteDetalle,
});

function ReporteDetalle() {
  const { id } = Route.useParams();
  const { origen } = Route.useSearch();
  const retorno = ORIGENES_LISTA_REPORTE[origen];
  const reporte = useQuery({
    queryKey: ["reporte-publico-detalle", id],
    queryFn: () => consultarReportePublicoPorId(decodeURIComponent(id)),
  });

  if (reporte.isLoading) {
    return (
      <AppShell wide>
        <Vacio texto="Cargando el detalle del reporte…" />
      </AppShell>
    );
  }

  if (reporte.isError) {
    return (
      <AppShell wide>
        <div className="report-detail-message" role="alert">
          No pudimos consultar este reporte. Revisa la conexión e inténtalo nuevamente.
        </div>
      </AppShell>
    );
  }

  if (!reporte.data) {
    return (
      <AppShell wide>
        <div className="report-detail-message">
          <h1>Reporte no disponible</h1>
          <p>
            Este reporte no existe, fue retirado de la consulta pública o ya no está disponible.
          </p>
          <Link to={retorno.ruta} className="report-detail-back-button">
            <ArrowLeft size={17} aria-hidden="true" /> {retorno.etiqueta}
          </Link>
        </div>
      </AppShell>
    );
  }

  const publicacion = reporte.data;
  const estado =
    publicacion.categoria === "via"
      ? esPublicacionViasPublica(publicacion)
        ? estadoGeneralViaDe(publicacion)
        : null
      : publicacion.categoria === "servicio"
        ? estadoGeneralServicioDe(publicacion)
        : publicacion.categoria === "aviso"
          ? estadoGeneralAvisoDe(publicacion)
          : estadoPublicoDe(publicacion);
  if (!estado) {
    return (
      <AppShell wide>
        <div className="report-detail-message">
          Este reporte no está disponible para consulta pública.
        </div>
      </AppShell>
    );
  }

  const fecha = publicacion.fecha_evento ?? publicacion.created_at;
  const fotoUrl = URL_FOTO(publicacion.foto_url);
  const emergenciaSinVerificar = esEmergenciaEnRevision(publicacion);
  const severidad = severidadPublicaDe(publicacion);
  const ubicacion = publicacion.vereda_nombre ?? publicacion.lugar;

  return (
    <AppShell wide>
      <ReporteDetalleCompartido
        modo="publico"
        publicacion={publicacion}
        estado={estado}
        fecha={fecha}
        fotoUrl={fotoUrl}
        emergenciaSinVerificar={emergenciaSinVerificar}
        severidad={severidad}
        ubicacion={ubicacion}
        procedenciaAviso={null}
        navegacion={
          <Link to={retorno.ruta} className="reportes-back-link">
            <ArrowLeft size={17} aria-hidden="true" />
            {retorno.etiqueta}
          </Link>
        }
      />
    </AppShell>
  );
}
