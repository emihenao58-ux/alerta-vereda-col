import { createFileRoute } from "@tanstack/react-router";
import { AdminGate, AdminShell } from "@/components/admin/admin-shell";
import { CentroGestion } from "@/components/admin/centro-gestion";
import { RoleWelcome } from "@/components/admin/role-welcome";

export const Route = createFileRoute("/admin/gestion")({
  component: CentroGestionRoute,
});

function CentroGestionRoute() {
  return (
    <AdminGate access="superadmin">
      <AdminShell area="gestion">
        <RoleWelcome role="superadmin" />
        <CentroGestion />
      </AdminShell>
    </AdminGate>
  );
}
