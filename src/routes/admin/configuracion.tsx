import { createFileRoute } from "@tanstack/react-router";
import { AdminGate, AdminShell } from "@/components/admin/admin-shell";
import { ConfiguracionSistema } from "@/components/admin/configuracion-sistema";
import { RoleWelcome } from "@/components/admin/role-welcome";

export const Route = createFileRoute("/admin/configuracion")({
  component: ConfiguracionSistemaRoute,
});

function ConfiguracionSistemaRoute() {
  return (
    <AdminGate access="superadmin">
      <AdminShell area="gestion">
        <RoleWelcome role="superadmin" />
        <ConfiguracionSistema />
      </AdminShell>
    </AdminGate>
  );
}
