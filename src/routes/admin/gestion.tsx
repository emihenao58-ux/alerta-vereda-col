import { createFileRoute, Outlet, useRouterState } from "@tanstack/react-router";
import { AdminGate, AdminShell } from "@/components/admin/admin-shell";
import { CentroGestion } from "@/components/admin/centro-gestion";
import { RoleWelcome } from "@/components/admin/role-welcome";

export const Route = createFileRoute("/admin/gestion")({
  component: CentroGestionRoute,
});

function CentroGestionRoute() {
  const pathname = useRouterState({ select: (state) => state.location.pathname });
  const isGestionIndex = pathname === "/admin/gestion";
  const isReportar = pathname === "/admin/gestion/reportar";

  return (
    <AdminGate access="superadmin">
      <AdminShell area="gestion" compactHeader={isReportar}>
        {isGestionIndex && (
          <>
            <RoleWelcome role="superadmin" />
            <CentroGestion />
          </>
        )}
        <Outlet />
      </AdminShell>
    </AdminGate>
  );
}
