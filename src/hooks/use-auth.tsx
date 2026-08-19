import { useEffect, useState } from "react";
import type { Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

export type Perfil = {
  id: string;
  nombre: string | null;
  vereda_id: string | null;
  rol: string;
};

export type Rol = "habitante" | "admin";

/**
 * Sesión + perfil del usuario.
 * La autorización real vive en las políticas RLS de Supabase.
 */
export function useAuth() {
  const [session, setSession] = useState<Session | null>(null);
  const [perfil, setPerfil] = useState<Perfil | null>(null);
  const [roles, setRoles] = useState<Rol[]>([]);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    const { data: sub } = supabase.auth.onAuthStateChange(
      (_evento, nuevaSesion) => {
        setSession(nuevaSesion);

        if (!nuevaSesion) {
          setPerfil(null);
          setRoles([]);
        }
      },
    );

    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setCargando(false);
    });

    return () => sub.subscription.unsubscribe();
  }, []);

  useEffect(() => {
    const userId = session?.user.id;
  
    if (!userId) {
      setPerfil(null);
      setRoles([]);
      return;
    }
  
    let activo = true;
  
    void (async () => {
      const { data: p, error } = await supabase
        .from("perfiles")
        .select("id, nombre, vereda_id, rol")
        .eq("id", userId)
        .maybeSingle();
  
      if (!activo) return;
  
      if (error) {
        console.error("Error cargando perfil:", error);
        setPerfil(null);
        setRoles([]);
        return;
      }
  
      setPerfil(p);
  
      if (p?.rol === "superadmin") {
        setRoles(["admin"]);
      } else if (p?.rol === "administrador") {
        setRoles(["admin"]);
      } else {
        setRoles(["habitante"]);
      }
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