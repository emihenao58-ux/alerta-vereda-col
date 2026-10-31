import { CalendarDays, ShieldCheck, UserRound, UsersRound } from "lucide-react";
import { fechaHoraPublica } from "@/lib/reportes-publicos";

export type ProcedenciaPublicacion = "oficial" | "comunidad";

export type AutorPublicacion =
  | {
      tipo: "habitante";
      nombre?: string | null;
    }
  | {
      tipo: "administrador";
      vereda?: string | null;
    }
  | {
      tipo: "superadmin";
    };

export type MetadatosPublicacion = {
  procedencia?: ProcedenciaPublicacion | null;
  autor?: AutorPublicacion | null;
};

function nombreAutor(autor: AutorPublicacion | null | undefined) {
  if (!autor) return null;

  if (autor.tipo === "habitante") {
    const nombre = autor.nombre?.trim();
    return nombre || "Habitante";
  }

  if (autor.tipo === "administrador") {
    const vereda = autor.vereda?.trim();
    return vereda ? `Administrador de ${vereda}` : "Administrador de vereda";
  }

  return "Superadmin";
}

export function MetaPublicacionCompacta({
  metadatos,
}: {
  metadatos?: MetadatosPublicacion | null;
}) {
  const autor = nombreAutor(metadatos?.autor);
  const procedencia = metadatos?.procedencia;
  if (!procedencia && !autor) return null;

  return (
    <div className="reporte-publicacion-meta" aria-label="Procedencia y autoría de la publicación">
      {procedencia && (
        <span className={`reporte-publicacion-origin reporte-publicacion-origin-${procedencia}`}>
          {procedencia === "oficial" ? (
            <ShieldCheck size={14} aria-hidden="true" />
          ) : (
            <UsersRound size={14} aria-hidden="true" />
          )}
          {procedencia === "oficial" ? "OFICIAL" : "COMUNIDAD"}
        </span>
      )}
      {autor && (
        <span className="reporte-publicacion-author">
          <UserRound size={14} aria-hidden="true" />
          {autor}
        </span>
      )}
    </div>
  );
}

export function InformacionPublicacion({
  metadatos,
  publicadaEn,
}: {
  metadatos?: MetadatosPublicacion | null;
  publicadaEn?: string | null;
}) {
  const autor = nombreAutor(metadatos?.autor);
  const tieneIdentidad = Boolean(metadatos?.procedencia || autor);

  return (
    <section
      className="report-detail-publication-info"
      aria-labelledby="report-publication-info-title"
    >
      <div className="report-detail-info-heading">
        <p className="reportes-eyebrow">Trazabilidad disponible</p>
        <h2 id="report-publication-info-title">Información de publicación</h2>
      </div>

      {tieneIdentidad ? (
        <dl className="report-detail-publication-facts">
          {autor && (
            <div>
              <dt>
                <UserRound size={16} aria-hidden="true" /> Publicado por
              </dt>
              <dd>{autor}</dd>
            </div>
          )}
          {metadatos?.procedencia && (
            <div>
              <dt>
                {metadatos.procedencia === "oficial" ? (
                  <ShieldCheck size={16} aria-hidden="true" />
                ) : (
                  <UsersRound size={16} aria-hidden="true" />
                )}
                Procedencia
              </dt>
              <dd>{metadatos.procedencia === "oficial" ? "Oficial" : "Comunidad"}</dd>
            </div>
          )}
          {publicadaEn && (
            <div>
              <dt>
                <CalendarDays size={16} aria-hidden="true" /> Fecha de publicación
              </dt>
              <dd>{fechaHoraPublica(publicadaEn)}</dd>
            </div>
          )}
        </dl>
      ) : (
        <p className="report-detail-publication-unavailable">
          La fuente pública actual todavía no proporciona la procedencia ni la autoría de esta
          publicación.
          {publicadaEn ? ` Fecha de publicación: ${fechaHoraPublica(publicadaEn)}` : ""}
        </p>
      )}
    </section>
  );
}
