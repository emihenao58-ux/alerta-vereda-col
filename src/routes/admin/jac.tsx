import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { AdminGate, AdminShell } from "@/components/admin/admin-shell";
import { AdminOperation } from "@/components/admin/admin-operation";
import { RoleWelcome } from "@/components/admin/role-welcome";
import { useAuth } from "@/hooks/use-auth";

export const Route = createFileRoute("/admin/jac")({
  component: PanelJac,
});

function PanelJac() {
  const { veredaAsignadaId } = useAuth();
  const vereda = useQuery({
    queryKey: ["vereda-asignada", veredaAsignadaId],
    enabled: Boolean(veredaAsignadaId),
    queryFn: async () => {
      const { data, error } = await supabase
        .from("veredas")
        .select("id, nombre")
        .eq("id", veredaAsignadaId!)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });

  return (
    <AdminGate access="local">
      <AdminShell area="local">
        <RoleWelcome role="admin_vereda" veredaLabel={vereda.data?.nombre ?? null} />
        <section className="admin-territory-banner" aria-label="Territorio asignado">
          <span className="admin-territory-label">Trabajando en</span>
          <strong>
            {vereda.isLoading
              ? "tu vereda asignada…"
              : (vereda.data?.nombre ?? "tu vereda asignada")}
          </strong>
          <span className="admin-territory-lock">Alcance local protegido</span>
        </section>
        <AdminOperation scope="local" veredaId={veredaAsignadaId} />
      </AdminShell>
    </AdminGate>
  );
}
