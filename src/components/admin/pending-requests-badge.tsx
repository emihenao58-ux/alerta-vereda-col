import { Link } from "@tanstack/react-router";
import { ArrowUpRight, BellRing } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export function PendingRequestsBadge() {
  const solicitudes = useQuery({
    queryKey: ["solicitudes-admin-count"],
    queryFn: async () => {
      const { count, error } = await supabase
        .from("perfiles")
        .select("id", { count: "exact", head: true })
        .eq("estado_solicitud", "pendiente");
      if (error) throw error;
      return count ?? 0;
    },
  });

  const count = solicitudes.data ?? 0;
  return (
    <Link
      to="/admin/jac-superadmin"
      className="admin-pending-badge"
      aria-label="Revisar solicitudes de administradores"
    >
      <span className="admin-pending-icon" aria-hidden="true">
        <BellRing size={17} />
      </span>
      <span>
        <strong>{solicitudes.isLoading ? "…" : count}</strong>{" "}
        {count === 1 ? "solicitud pendiente" : "solicitudes pendientes"}
      </span>
      <ArrowUpRight size={16} aria-hidden="true" />
    </Link>
  );
}
