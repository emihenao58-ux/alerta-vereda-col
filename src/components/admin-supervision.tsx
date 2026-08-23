import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";

type Perfil = Database["public"]["Tables"]["perfiles"]["Row"];
type Vereda = Database["public"]["Tables"]["veredas"]["Row"];
type Asignacion = Database["public"]["Tables"]["admin_asignaciones"]["Row"];

const campo =
  "mt-1 w-full rounded-md border border-[color:var(--border)] bg-[color:var(--card)] px-3 py-2 text-sm";

export function AdminSupervision({ correoActual }: { correoActual: string | undefined }) {
  const qc = useQueryClient();
  const [rechazos, setRechazos] = useState<Record<string, string>>({});
  const [revocaciones, setRevocaciones] = useState<Record<string, string>>({});
  const [nuevoCorreo, setNuevoCorreo] = useState("");
  const [contrasenaActual, setContrasenaActual] = useState("");

  const solicitudes = useQuery({
    queryKey: ["solicitudes-admin"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("perfiles")
        .select(
          "id, nombre, rol, estado_solicitud, estado_cuenta, vereda_solicitada_id, vereda_id, created_at",
        )
        .eq("estado_solicitud", "pendiente")
        .order("created_at", { ascending: true });
      if (error) throw error;
      return data ?? [];
    },
  });

  const veredas = useQuery({
    queryKey: ["veredas-admin"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("veredas")
        .select("id, nombre, activa, created_at, updated_at")
        .order("nombre");
      if (error) throw error;
      return data ?? [];
    },
  });

  const administradores = useQuery({
    queryKey: ["administradores-admin"],
    queryFn: async () => {
      const [
        { data: perfiles, error: perfilesError },
        { data: asignaciones, error: asignacionesError },
      ] = await Promise.all([
        supabase
          .from("perfiles")
          .select(
            "id, nombre, rol, estado_solicitud, estado_cuenta, vereda_solicitada_id, vereda_id, created_at",
          )
          .eq("rol", "admin_vereda")
          .order("nombre"),
        supabase
          .from("admin_asignaciones")
          .select(
            "id, perfil_id, vereda_id, estado, vigente_desde, vigente_hasta, asignado_por, motivo, created_at",
          ),
      ]);
      if (perfilesError) throw perfilesError;
      if (asignacionesError) throw asignacionesError;
      return { perfiles: perfiles ?? [], asignaciones: asignaciones ?? [] };
    },
  });

  const nombreVereda = useMemo(() => {
    const mapa = new Map<string, string>();
    for (const vereda of veredas.data ?? []) mapa.set(vereda.id, vereda.nombre);
    return mapa;
  }, [veredas.data]);

  const invalidar = () => {
    void qc.invalidateQueries({ queryKey: ["solicitudes-admin"] });
    void qc.invalidateQueries({ queryKey: ["administradores-admin"] });
  };

  const aprobar = useMutation({
    mutationFn: async ({ perfilId, veredaId }: { perfilId: string; veredaId: string }) => {
      const { error } = await supabase.rpc("aprobar_solicitud_admin", {
        p_perfil_id: perfilId,
        p_vereda_id: veredaId,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Administrador aprobado y vereda asignada.");
      invalidar();
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const rechazar = useMutation({
    mutationFn: async ({ perfilId, motivo }: { perfilId: string; motivo: string }) => {
      const { error } = await supabase.rpc("rechazar_solicitud_admin", {
        p_perfil_id: perfilId,
        p_motivo: motivo,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Solicitud rechazada.");
      invalidar();
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const revocar = useMutation({
    mutationFn: async ({ perfilId, motivo }: { perfilId: string; motivo: string }) => {
      const { error } = await supabase.rpc("revocar_asignacion_admin", {
        p_perfil_id: perfilId,
        p_motivo: motivo,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Administrador deshabilitado y asignación revocada.");
      invalidar();
    },
    onError: (error: Error) => toast.error(error.message),
  });

  async function cambiarCorreo(e: React.FormEvent) {
    e.preventDefault();
    const correo = nuevoCorreo.trim().toLowerCase();
    if (!correo || correo === correoActual?.toLowerCase()) {
      toast.error("Escribe un correo diferente al actual.");
      return;
    }

    if (!correoActual || !contrasenaActual) {
      toast.error("Para cambiar el correo debes confirmar tu contraseña actual.");
      return;
    }

    const { error: reauthError } = await supabase.auth.signInWithPassword({
      email: correoActual,
      password: contrasenaActual,
    });
    if (reauthError) {
      toast.error("La reautenticación falló. Verifica tu contraseña actual.");
      return;
    }

    localStorage.setItem("alertavereda_email_anterior", correoActual);
    const { error } = await supabase.auth.updateUser(
      { email: correo },
      { emailRedirectTo: `${window.location.origin}/auth?email_change=1` },
    );
    if (error) {
      localStorage.removeItem("alertavereda_email_anterior");
      toast.error(error.message);
      return;
    }
    setNuevoCorreo("");
    toast.success(
      "Confirma el cambio desde el correo enviado. La auditoría se registrará al completarse.",
    );
  }

  return (
    <section className="mt-10 space-y-4">
      <h2 className="text-xl font-semibold">Supervisión del sistema</h2>

      <section className="carta space-y-3">
        <h3 className="text-lg font-semibold">Solicitudes pendientes</h3>
        {(solicitudes.data ?? []).length === 0 && (
          <p className="text-sm text-[color:var(--tinta-suave)]">No hay solicitudes pendientes.</p>
        )}
        {(solicitudes.data ?? []).map((solicitud) => {
          const veredaSolicitada = solicitud.vereda_solicitada_id ?? solicitud.vereda_id;
          const motivo = rechazos[solicitud.id] ?? "";
          return (
            <article
              key={solicitud.id}
              className="rounded-md border border-[color:var(--border)] p-3"
            >
              <p className="font-semibold">{solicitud.nombre || "Sin nombre"}</p>
              <p className="text-sm text-[color:var(--tinta-suave)]">
                Solicita:{" "}
                {veredaSolicitada
                  ? (nombreVereda.get(veredaSolicitada) ?? "Vereda no encontrada")
                  : "Sin vereda"}
              </p>
              <div className="mt-3 grid gap-2 sm:grid-cols-[1fr_auto]">
                <select
                  className={campo}
                  defaultValue={veredaSolicitada ?? ""}
                  aria-label={`Vereda definitiva para ${solicitud.nombre ?? "solicitud"}`}
                  id={`vereda-${solicitud.id}`}
                >
                  <option value="">Selecciona vereda definitiva</option>
                  {(veredas.data ?? [])
                    .filter((v) => v.activa)
                    .map((vereda) => (
                      <option key={vereda.id} value={vereda.id}>
                        {vereda.nombre}
                      </option>
                    ))}
                </select>
                <button
                  type="button"
                  disabled={aprobar.isPending}
                  onClick={(event) => {
                    const select = event.currentTarget.parentElement?.querySelector(
                      "select",
                    ) as HTMLSelectElement | null;
                    if (!select?.value) {
                      toast.error("Selecciona la vereda definitiva.");
                      return;
                    }
                    aprobar.mutate({ perfilId: solicitud.id, veredaId: select.value });
                  }}
                  className="rounded-md bg-[color:var(--bosque)] px-3 py-2 text-sm font-semibold text-[color:var(--card)]"
                >
                  Aprobar
                </button>
              </div>
              <textarea
                className={campo}
                rows={2}
                value={motivo}
                onChange={(event) =>
                  setRechazos((actual) => ({ ...actual, [solicitud.id]: event.target.value }))
                }
                placeholder="Motivo si se rechaza (obligatorio)"
              />
              <button
                type="button"
                disabled={rechazar.isPending || !motivo.trim()}
                onClick={() => rechazar.mutate({ perfilId: solicitud.id, motivo: motivo.trim() })}
                className="rounded-md border border-[color:var(--border)] px-3 py-2 text-sm font-semibold"
              >
                Rechazar solicitud
              </button>
            </article>
          );
        })}
      </section>

      <section className="carta space-y-3">
        <h3 className="text-lg font-semibold">Administradores de vereda</h3>
        {(administradores.data?.perfiles ?? []).length === 0 && (
          <p className="text-sm text-[color:var(--tinta-suave)]">
            No hay administradores registrados.
          </p>
        )}
        {(administradores.data?.perfiles ?? []).map((admin) => {
          const asignacion = (administradores.data?.asignaciones ?? []).find(
            (item) =>
              item.perfil_id === admin.id && item.estado === "activa" && !item.vigente_hasta,
          );
          const motivo = revocaciones[admin.id] ?? "";
          return (
            <article key={admin.id} className="rounded-md border border-[color:var(--border)] p-3">
              <p className="font-semibold">{admin.nombre || "Sin nombre"}</p>
              <p className="text-sm text-[color:var(--tinta-suave)]">
                {asignacion
                  ? (nombreVereda.get(asignacion.vereda_id) ?? "Vereda no encontrada")
                  : "Sin asignación activa"}
                {" · "}
                {admin.estado_cuenta}
              </p>
              {asignacion && (
                <>
                  <textarea
                    className={campo}
                    rows={2}
                    value={motivo}
                    onChange={(event) =>
                      setRevocaciones((actual) => ({ ...actual, [admin.id]: event.target.value }))
                    }
                    placeholder="Motivo para deshabilitar (obligatorio)"
                  />
                  <button
                    type="button"
                    disabled={revocar.isPending || !motivo.trim()}
                    onClick={() => revocar.mutate({ perfilId: admin.id, motivo: motivo.trim() })}
                    className="rounded-md bg-[color:var(--terracota)] px-3 py-2 text-sm font-semibold text-[color:var(--card)]"
                  >
                    Deshabilitar administrador / Revocar asignación
                  </button>
                </>
              )}
            </article>
          );
        })}
      </section>

      <section className="carta space-y-3">
        <h3 className="text-lg font-semibold">Correo del superadmin</h3>
        <p className="text-sm text-[color:var(--tinta-suave)]">
          Correo actual: {correoActual || "no disponible"}. El cambio exige reautenticación y
          confirmación desde el correo nuevo.
        </p>
        <form onSubmit={cambiarCorreo} className="space-y-2">
          <label className="block text-sm font-medium">
            Contraseña actual para reautenticación
            <input
              className={campo}
              type="password"
              required
              value={contrasenaActual}
              onChange={(event) => setContrasenaActual(event.target.value)}
            />
          </label>
          <label className="block text-sm font-medium">
            Nuevo correo
            <input
              className={campo}
              type="email"
              required
              value={nuevoCorreo}
              onChange={(event) => setNuevoCorreo(event.target.value)}
            />
          </label>
          <button
            type="submit"
            className="rounded-md border border-[color:var(--border)] px-3 py-2 text-sm font-semibold"
          >
            Solicitar cambio de correo
          </button>
        </form>
      </section>
    </section>
  );
}
