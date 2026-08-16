import { useEffect, useState } from "react";
import type { Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

export type Perfil = {
  id: string;
  nombre: string;
  telefono: string | null;
  vereda_id: string | null;
};

export type Rol = "habitante" | "admin";

/**
 * Sesión + perfil + roles del usuario.
 * NOTA: esto es sólo UX. La autorización real vive en las políticas de la base
 * de datos (RLS); un habitante no puede publicar aunque manipule el frontend.
 */
export function useAuth() {
  const [session, setSession] = useState<Session | null>(null);
  const [perfil, setPerfil] = useState<Perfil | null>(null);
  const [roles, setRoles] = useState<Rol[]>([]);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    const { data: sub } = supabase.auth.onAuthStateChange((_evento, nuevaSesion) => {
      setSession(nuevaSesion);
      if (!nuevaSesion) {
        setPerfil(null);
        setRoles([]);
      }
    });

    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setCargando(false);
    });

    return () => sub.subscription.unsubscribe();
  }, []);

  useEffect(() => {
    const userId = session?.user.id;
    if (!userId) return;
    let activo = true;

    void (async () => {
      const [{ data: p }, { data: r }] = await Promise.all([
        supabase.from("profiles").select("id, nombre, telefono, vereda_id").eq("id", userId).maybeSingle(),
        supabase.from("user_roles").select("role").eq("user_id", userId),
      ]);
      if (!activo) return;
      setPerfil((p as Perfil) ?? null);
      setRoles((r ?? []).map((x) => x.role as Rol));
    })();

    return () => {
      activo = false;
    };
  }, [session?.user.id]);

  return {
    session,
    usuario: session?.user ?? null,
    perfil,
    roles,
    esAdmin: roles.includes("admin"),
    cargando,
    salir: () => supabase.auth.signOut(),
  };
}
