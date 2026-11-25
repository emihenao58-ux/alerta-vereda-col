import { useQuery } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";
import { ReportesSurface } from "@/components/reportes/reportes-surface";
import { ReporteDetalleCompartido } from "@/components/reportes/reporte-detalle-compartido";
import {
  PublicacionDetalleAcciones,
  ReportePendienteAcciones,
} from "@/components/admin/reporte-detalle-acciones";
import { Vacio } from "@/components/carta";
import { useAuth } from "@/hooks/use-auth";
import { URL_FOTO } from "@/lib/alerta";
import { estadoGeneralAvisoDe } from "@/lib/avisos-publicos";
import {
  consultarReporteRechazadoSuperadmin,
  consultarReporteSuperadminPorId,
} from "@/lib/admin-data";
import {
  type ContextoAdminReportes,
  normalizarContextoAdminReportes,
  normalizarTipoRegistroAdminHistorial,
} from "@/lib/reportes-contexto-admin";
import { normalizarOrigenListaReporte, ORIGENES_LISTA_REPORTE } from "@/lib/reportes-navegacion";
import { estadoGeneralViaDe, esPublicacionViasPublica } from "@/lib/vias-publicas";
import {
  esEmergenciaEnRevision,
  estadoPublicoDe,
  normalizarTablaPublicacion,
  severidadPublicaDe,
  consultarReportePublicoPorId,
} from "@/lib/reportes-publicos";
import { estadoGeneralServicioDe } from "@/lib/servicios-publicos";

const TABLA_INVALIDA = "__tabla_invalida__" as const;

export const Route = createFileRoute("/reportes/$id")({
  validateSearch: (search: Record<string, unknown>) => {
    const tabla = normalizarTablaPublicacion(search["tabla"]);
    return {
      origen: normalizarOrigenListaReporte(search["origen"]),
      tabla: search["tabla"] === undefined ? undefined : (tabla ?? TABLA_INVALIDA),
      contexto: normalizarContextoAdminReportes(search["contexto"]),
      registro: normalizarTipoRegistroAdminHistorial(search["registro"]),
    };
  },
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
  const { esSuperadmin } = useAuth();
  const { id } = Route.useParams();
  const { origen, tabla, contexto, registro } = Route.useSearch();
  const reporte = useQuery({
    queryKey: ["reporte-publico-detalle", id, tabla ?? null, contexto ?? null],
    enabled:
      (!contexto || esSuperadmin) &&
      !(contexto === "reportes" && registro === "reporte") &&
      !(contexto === "historial" && registro === "reporte"),
    queryFn: () =>
      tabla === TABLA_INVALIDA ? null : consultarReportePublicoPorId(decodeURIComponent(id), tabla),
  });
  const rechazo = useQuery({
    queryKey: ["reporte-rechazado-superadmin", id],
    queryFn: () => consultarReporteRechazadoSuperadmin(decodeURIComponent(id)),
    enabled: contexto === "historial" && registro === "reporte" && esSuperadmin,
    staleTime: 30_000,
  });
  const detalleAdmin = useQuery({
    queryKey: ["reporte-admin-detalle", id],
    queryFn: () => consultarReporteSuperadminPorId(decodeURIComponent(id)),
    enabled: contexto === "reportes" && registro === "reporte" && esSuperadmin,
    staleTime: 30_000,
  });

  if (contexto === "reportes" && registro === "reporte") {
    if (detalleAdmin.isLoading) {
      return (
        <ReportesSurface contexto="reportes" wide>
          <Vacio texto="Cargando el detalle administrativo del reporte…" />
        </ReportesSurface>
      );
    }
    if (detalleAdmin.isError) {
      return (
        <ReportesSurface contexto="reportes" wide>
          <div className="report-detail-message" role="alert">
            No pudimos cargar este reporte. Intenta nuevamente.
          </div>
        </ReportesSurface>
      );
    }
    if (!detalleAdmin.data) {
      return (
        <ReportesSurface contexto="reportes" wide>
          <div className="report-detail-message">
            <h1>Reporte no disponible</h1>
            <p>El registro no existe o dejó de estar disponible para revisión administrativa.</p>
            <Link to="/admin/reportes" className="report-detail-back-button">
              <ArrowLeft size={17} aria-hidden="true" /> Volver a Reportes
            </Link>
          </div>
        </ReportesSurface>
      );
    }

    return (
      <ReportesSurface contexto="reportes" wide>
        <ReporteDetalleCompartido
          modo="admin"
          reporte={detalleAdmin.data}
          estado={detalleAdmin.data.estado}
          fotoUrl={URL_FOTO(detalleAdmin.data.foto_url)}
          navegacion={
            <Link to="/admin/reportes" className="reportes-back-link">
              <ArrowLeft size={17} aria-hidden="true" /> Volver a Reportes
            </Link>
          }
          acciones={
            detalleAdmin.data.estado === "pendiente" ? (
              <ReportePendienteAcciones reporte={detalleAdmin.data} />
            ) : null
          }
        />
      </ReportesSurface>
    );
  }

  if (contexto === "historial" && registro === "reporte") {
    if (rechazo.isLoading) {
      return (
        <ReportesSurface contexto="historial" wide>
          <Vacio texto="Cargando el detalle del reporte rechazado…" />
        </ReportesSurface>
      );
    }
    if (rechazo.isError) {
      return (
        <ReportesSurface contexto="historial" wide>
          <div className="report-detail-message" role="alert">
            No pudimos cargar este registro del historial. Intenta nuevamente.
          </div>
        </ReportesSurface>
      );
    }
    if (!rechazo.data) {
      return (
        <ReportesSurface contexto="historial" wide>
          <div className="report-detail-message">
            <h1>Registro no disponible</h1>
            <p>El reporte no existe o ya no está registrado como rechazado.</p>
            <Link
              to="/reportes/todos"
              search={{ contexto: "historial" }}
              className="report-detail-back-button"
            >
              <ArrowLeft size={17} aria-hidden="true" /> Volver al Historial
            </Link>
          </div>
        </ReportesSurface>
      );
    }

    return (
      <ReportesSurface contexto="historial" wide>
        <ReporteDetalleCompartido
          modo="admin"
          reporte={rechazo.data}
          estado="rechazado"
          fotoUrl={URL_FOTO(rechazo.data.foto_url)}
          navegacion={
            <Link
              to="/reportes/todos"
              search={{ contexto: "historial" }}
              className="reportes-back-link"
            >
              <ArrowLeft size={17} aria-hidden="true" /> Volver al Historial
            </Link>
          }
        />
      </ReportesSurface>
    );
  }

  if (reporte.isLoading) {
    return (
      <ReportesSurface contexto={contexto} wide>
        <Vacio texto="Cargando el detalle del reporte…" />
      </ReportesSurface>
    );
  }

  if (reporte.isError) {
    return (
      <ReportesSurface contexto={contexto} wide>
        <div className="report-detail-message" role="alert">
          No pudimos consultar este reporte. Revisa la conexión e inténtalo nuevamente.
        </div>
      </ReportesSurface>
    );
  }

  if (!reporte.data) {
    return (
      <ReportesSurface contexto={contexto} wide>
        <div className="report-detail-message">
          <h1>Reporte no disponible</h1>
          <p>
            Este reporte no existe, fue retirado de la consulta pública o ya no está disponible.
          </p>
          <EnlaceRetorno
            origen={origen}
            contexto={contexto}
            className="report-detail-back-button"
          />
        </div>
      </ReportesSurface>
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
      <ReportesSurface contexto={contexto} wide>
        <div className="report-detail-message">
          Este reporte no está disponible para consulta pública.
        </div>
      </ReportesSurface>
    );
  }

  const fecha = publicacion.fecha_evento ?? publicacion.created_at;
  const fotoUrl = URL_FOTO(publicacion.foto_url);
  const emergenciaSinVerificar = esEmergenciaEnRevision(publicacion);
  const severidad = severidadPublicaDe(publicacion);
  const ubicacion = publicacion.vereda_nombre ?? publicacion.lugar;

  return (
    <ReportesSurface contexto={contexto} wide>
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
        navegacion={<EnlaceRetorno origen={origen} contexto={contexto} />}
        acciones={
          contexto === "publicaciones" && esSuperadmin ? (
            <PublicacionDetalleAcciones publicacion={publicacion} estado={estado} />
          ) : null
        }
      />
    </ReportesSurface>
  );
}

function EnlaceRetorno({
  origen,
  contexto,
  className = "reportes-back-link",
}: {
  origen: keyof typeof ORIGENES_LISTA_REPORTE;
  contexto?: ContextoAdminReportes | undefined;
  className?: string;
}) {
  const etiqueta =
    contexto === "historial"
      ? "Volver al Historial"
      : contexto === "publicaciones" && origen === "todos"
        ? "Volver a publicaciones"
        : ORIGENES_LISTA_REPORTE[origen].etiqueta;
  const contenido = (
    <>
      <ArrowLeft size={17} aria-hidden="true" /> {etiqueta}
    </>
  );

  if (contexto === "historial" || origen === "todos") {
    return (
      <Link to="/reportes/todos" search={{ contexto }} className={className}>
        {contenido}
      </Link>
    );
  }

  if (origen === "emergencias") {
    return (
      <Link to="/emergencias" search={{ contexto }} className={className}>
        {contenido}
      </Link>
    );
  }
  if (origen === "vias") {
    return (
      <Link to="/vias" search={{ contexto }} className={className}>
        {contenido}
      </Link>
    );
  }
  if (origen === "servicios") {
    return (
      <Link to="/servicios" search={{ contexto }} className={className}>
        {contenido}
      </Link>
    );
  }
  return (
    <Link to="/avisos" search={{ contexto }} className={className}>
      {contenido}
    </Link>
  );
}
