import { useEffect, useState } from "react";
import type { Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

export type Rol = "pendiente" | "habitante" | "admin_vereda" | "superadmin";

export type Perfil = {
  id: string;
  nombre: string | null;
  vereda_id: string | null;
  rol: Rol;
  estado_solicitud: "pendiente" | "aprobada" | "rechazada";
  estado_cuenta: "activa" | "suspendida" | "desactivada";
  vereda_solicitada_id: string | null;
};

/**
 * Sesión + perfil de aplicación + alcance territorial.
 * La autorización real vive en las políticas RLS y las funciones transaccionales.
 */
export function useAuth() {
  const [session, setSession] = useState<Session | null>(null);
  const [perfil, setPerfil] = useState<Perfil | null>(null);
  const [veredaAsignadaId, setVeredaAsignadaId] = useState<string | null>(null);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    const { data: sub } = supabase.auth.onAuthStateChange((_evento, nuevaSesion) => {
      setSession(nuevaSesion);
      if (!nuevaSesion) {
        setPerfil(null);
        setVeredaAsignadaId(null);
      }
    });

    void supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setCargando(false);
    });

    return () => sub.subscription.unsubscribe();
  }, []);

  useEffect(() => {
    const userId = session?.user.id;
    if (!userId) {
      setPerfil(null);
      setVeredaAsignadaId(null);
      return;
    }

    let activo = true;

    void (async () => {
      const { data: p, error } = await supabase
        .from("perfiles")
        .select("id, nombre, vereda_id, rol, estado_solicitud, estado_cuenta, vereda_solicitada_id")
        .eq("id", userId)
        .maybeSingle();

      if (!activo) return;

      if (error) {
        console.error("Error cargando perfil:", error);
        setPerfil(null);
        setVeredaAsignadaId(null);
        return;
      }

      const perfilActual = p as Perfil | null;
      setPerfil(perfilActual);

      if (
        !perfilActual ||
        perfilActual.rol !== "admin_vereda" ||
        perfilActual.estado_cuenta !== "activa"
      ) {
        setVeredaAsignadaId(null);
        return;
      }

      const { data: asignacion, error: asignacionError } = await supabase
        .from("admin_asignaciones")
        .select("vereda_id")
        .eq("perfil_id", userId)
        .eq("estado", "activa")
        .is("vigente_hasta", null)
        .maybeSingle();

      if (!activo) return;

      if (asignacionError) {
        console.error("Error cargando asignación administrativa:", asignacionError);
        setVeredaAsignadaId(null);
        return;
      }

      setVeredaAsignadaId(asignacion?.vereda_id ?? null);
    })();

    return () => {
      activo = false;
    };
  }, [session?.user.id]);

  const esSuperadmin = perfil?.rol === "superadmin" && perfil.estado_cuenta === "activa";
  const esAdminVereda =
    perfil?.rol === "admin_vereda" &&
    perfil.estado_cuenta === "activa" &&
    veredaAsignadaId !== null;
  const solicitudPendiente =
    perfil?.rol === "pendiente" || perfil?.estado_solicitud === "pendiente";

  return {
    session,
    usuario: session?.user ?? null,
    perfil,
    veredaAsignadaId,
    esAdmin: Boolean(esSuperadmin || esAdminVereda),
    esSuperadmin,
    esAdminVereda,
    solicitudPendiente,
    cargando,
    salir: () => supabase.auth.signOut(),
  };
}
