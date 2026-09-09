import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { BarChart3, MapPinned, Radio, Sparkles } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { AdminOperation } from "@/components/admin/admin-operation";
import { PendingRequestsBadge } from "@/components/admin/pending-requests-badge";

export function CentroGestion() {
  const [veredaSeleccionada, setVeredaSeleccionada] = useState("");

  const veredas = useQuery({
    queryKey: ["veredas-admin"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("veredas")
        .select("id, nombre, activa")
        .order("nombre");
      if (error) throw error;
      return data ?? [];
    },
  });

  const reportes = useQuery({
    queryKey: ["reportes-admin"],
    queryFn: async () => {
      const { data, error } = await supabase.from("reportes").select("id, estado, vereda_id");
      if (error) throw error;
      return data ?? [];
    },
  });

  const reportesFiltrados = useMemo(
    () =>
      (reportes.data ?? []).filter(
        (reporte) => !veredaSeleccionada || reporte.vereda_id === veredaSeleccionada,
      ),
    [reportes.data, veredaSeleccionada],
  );
  const pendientes = reportesFiltrados.filter((reporte) => reporte.estado === "pendiente").length;
  const revisados = reportesFiltrados.length - pendientes;
  const veredasActivas = (veredas.data ?? []).filter((vereda) => vereda.activa).length;
  const nombreSeleccionado = veredas.data?.find(
    (vereda) => vereda.id === veredaSeleccionada,
  )?.nombre;

  return (
    <div className="gestion-dashboard">
      <section className="gestion-hero">
        <div>
          <p className="gestion-kicker">
            <Sparkles size={15} aria-hidden="true" />
            Vista operativa global
          </p>
          <h2>Una mirada clara sobre Ebéjico</h2>
          <p>
            Selecciona una vereda para enfocar la operación. El filtro organiza la vista; la
            autorización continúa en las políticas y funciones existentes.
          </p>
        </div>
        <div className="gestion-signal" aria-hidden="true">
          <span className="gestion-signal-ring gestion-signal-ring-one" />
          <span className="gestion-signal-ring gestion-signal-ring-two" />
          <span className="gestion-signal-core">
            <Radio size={22} />
          </span>
        </div>
      </section>

      <div className="gestion-toolbar">
        <label className="gestion-select-label" htmlFor="supervision-vereda">
          <span className="admin-section-kicker">Supervisión territorial</span>
          <span className="gestion-select-caption">¿Qué vereda quieres consultar?</span>
          <select
            id="supervision-vereda"
            className="gestion-select"
            value={veredaSeleccionada}
            onChange={(event) => setVeredaSeleccionada(event.target.value)}
          >
            <option value="">Todas las veredas</option>
            {(veredas.data ?? [])
              .filter((vereda) => vereda.activa)
              .map((vereda) => (
                <option key={vereda.id} value={vereda.id}>
                  {vereda.nombre}
                </option>
              ))}
          </select>
          <span id="supervision-vereda-help" className="gestion-select-help">
            Este selector solo cambia el filtro visual de la vista administrativa.
          </span>
        </label>
        <PendingRequestsBadge />
      </div>

      <section className="gestion-stat-grid" aria-label="Resumen de operación">
        <article className="gestion-stat-card">
          <span className="gestion-stat-icon">
            <MapPinned size={18} aria-hidden="true" />
          </span>
          <span className="gestion-stat-label">Veredas activas</span>
          <strong>{veredas.isLoading ? "…" : veredasActivas}</strong>
          <span className="gestion-stat-detail">territorios conectados</span>
        </article>
        <article className="gestion-stat-card gestion-stat-card-attention">
          <span className="gestion-stat-icon">
            <Radio size={18} aria-hidden="true" />
          </span>
          <span className="gestion-stat-label">Pendientes</span>
          <strong>{reportes.isLoading ? "…" : pendientes}</strong>
          <span className="gestion-stat-detail">{nombreSeleccionado || "todas las veredas"}</span>
        </article>
        <article className="gestion-stat-card">
          <span className="gestion-stat-icon">
            <BarChart3 size={18} aria-hidden="true" />
          </span>
          <span className="gestion-stat-label">Revisados</span>
          <strong>{reportes.isLoading ? "…" : revisados}</strong>
          <span className="gestion-stat-detail">decisiones trazables</span>
        </article>
      </section>

      <AdminOperation scope="global" veredaId={veredaSeleccionada || null} />
    </div>
  );
}
