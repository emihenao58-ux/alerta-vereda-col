import { createFileRoute } from "@tanstack/react-router";
import { AdminGate, AdminShell } from "@/components/admin/admin-shell";
import { RoleWelcome } from "@/components/admin/role-welcome";
import { AdminSupervision } from "@/components/admin-supervision";
import { useAuth } from "@/hooks/use-auth";

export const Route = createFileRoute("/admin/jac-superadmin")({
  component: PanelJacSuperadmin,
});

function PanelJacSuperadmin() {
  const { usuario } = useAuth();

  return (
    <AdminGate access="superadmin">
      <AdminShell area="governance">
        <RoleWelcome role="superadmin" />
        <section className="admin-intent-strip">
          <p className="admin-section-kicker">Gobernanza</p>
          <p>
            Aquí se decide quién puede administrar una vereda y se conserva el historial de cada
            cambio.
          </p>
        </section>
        <AdminSupervision correoActual={usuario?.email} />
      </AdminShell>
    </AdminGate>
  );
}
