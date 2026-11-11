import type { ReactNode } from "react";
import { Link } from "@tanstack/react-router";
import { ArrowRight, ClipboardList, History, Megaphone } from "lucide-react";
import type { VistaPanelJac } from "@/lib/admin-jac-navigation";

type SummaryState = "loading" | "ready" | "error";

type SummaryCardProps = {
  vista: Exclude<VistaPanelJac, "resumen">;
  icon: ReactNode;
  eyebrow: string;
  title: string;
  description: string;
  state: SummaryState;
  count: number | null;
  countLabel: string;
};

function SummaryCard({
  vista,
  icon,
  eyebrow,
  title,
  description,
  state,
  count,
  countLabel,
}: SummaryCardProps) {
  const value =
    state === "loading"
      ? "Cargando…"
      : state === "error"
        ? count === null
          ? "No disponible"
          : String(count)
        : String(count ?? 0);

  return (
    <Link className="admin-jac-summary-card" to="/admin/jac" search={{ vista }}>
      <span className="admin-jac-summary-icon" aria-hidden="true">
        {icon}
      </span>
      <span className="admin-jac-summary-copy">
        <span className="admin-section-kicker">{eyebrow}</span>
        <strong>{title}</strong>
        <span>{description}</span>
        {state === "error" && count !== null && (
          <small className="admin-jac-summary-stale">No se pudo actualizar el conteo.</small>
        )}
      </span>
      <span className="admin-jac-summary-count" aria-live="polite">
        <strong>{value}</strong>
        <small>{state === "error" && count === null ? "revisa la conexión" : countLabel}</small>
      </span>
      <ArrowRight className="admin-jac-summary-arrow" size={18} aria-hidden="true" />
    </Link>
  );
}

export function AdminJacSummary({
  pendingCount,
  activePublicationCount,
  reviewedCount,
  reportState,
  publicationState,
}: {
  pendingCount: number | null;
  activePublicationCount: number | null;
  reviewedCount: number | null;
  reportState: SummaryState;
  publicationState: SummaryState;
}) {
  return (
    <section
      className="admin-jac-summary"
      aria-label="Resumen y accesos rápidos a la gestión de tu vereda"
    >
      <SummaryCard
        vista="reportes-pendientes"
        icon={<ClipboardList size={22} strokeWidth={1.9} />}
        eyebrow="Reportes"
        title="Reportes pendientes"
        description="Revisa los reportes recibidos de tu vereda."
        state={reportState}
        count={pendingCount}
        countLabel="pendientes"
      />
      <SummaryCard
        vista="publicaciones-activas"
        icon={<Megaphone size={22} strokeWidth={1.9} />}
        eyebrow="Publicaciones"
        title="Publicaciones activas"
        description="Gestiona emergencias, vías, servicios y avisos."
        state={publicationState}
        count={activePublicationCount}
        countLabel="activas"
      />
      <SummaryCard
        vista="reportes-revisados"
        icon={<History size={22} strokeWidth={1.9} />}
        eyebrow="Trazabilidad"
        title="Reportes revisados"
        description="Consulta los reportes revisados y su estado."
        state={reportState}
        count={reviewedCount}
        countLabel="revisados"
      />
    </section>
  );
}
