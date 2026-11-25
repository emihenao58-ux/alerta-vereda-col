import { createFileRoute } from "@tanstack/react-router";
import { AdminGate, AdminShell } from "@/components/admin/admin-shell";
import { CentroGestionReportes } from "@/components/admin/centro-gestion-reportes";

export const Route = createFileRoute("/admin/reportes")({
  component: ReportesSuperadminRoute,
});

function ReportesSuperadminRoute() {
  return (
    <AdminGate access="superadmin">
      <AdminShell area="gestion" compactHeader>
        <CentroGestionReportes />
      </AdminShell>
    </AdminGate>
  );
}
