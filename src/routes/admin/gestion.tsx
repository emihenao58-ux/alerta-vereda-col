import { createFileRoute, Outlet, useRouterState } from "@tanstack/react-router";
import { AdminGate, AdminShell } from "@/components/admin/admin-shell";
import { CentroGestion } from "@/components/admin/centro-gestion";

export const Route = createFileRoute("/admin/gestion")({
  component: CentroGestionRoute,
});

function CentroGestionRoute() {
  const pathname = useRouterState({ select: (state) => state.location.pathname });
  const isGestionIndex = pathname === "/admin/gestion";
  const isReportar = pathname === "/admin/gestion/reportar";
  const isGestionReportes = pathname === "/admin/gestion/reportes";

  return (
    <AdminGate access="superadmin">
      <AdminShell area="gestion" compactHeader={isReportar || isGestionReportes || isGestionIndex}>
        {isGestionIndex && <CentroGestion />}
        <Outlet />
      </AdminShell>
    </AdminGate>
  );
}
