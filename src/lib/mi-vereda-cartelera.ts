import { supabase } from "@/integrations/supabase/client";

export type MiVeredaCategoria = "emergencia" | "via" | "servicio" | "aviso";

export type MiVeredaPublicacion = {
  publicacion_tabla: "emergencias" | "vias" | "servicios" | "avisos";
  publicacion_id: string;
  vereda_id: string;
  categoria: MiVeredaCategoria;
  titulo: string;
  descripcion: string | null;
  lugar: string | null;
  estado_operativo: string | null;
  resultado: string | null;
  cerrado_en: string | null;
  foto_url: string | null;
  fecha_evento: string | null;
  created_at: string;
  nivel: string | null;
  tipo: string | null;
  vereda_nombre: string | null;
};

export type MiVeredaHistorialPublicacion = Pick<
  MiVeredaPublicacion,
  | "publicacion_tabla"
  | "publicacion_id"
  | "vereda_id"
  | "categoria"
  | "titulo"
  | "descripcion"
  | "lugar"
  | "estado_operativo"
  | "resultado"
  | "cerrado_en"
  | "fecha_evento"
  | "created_at"
>;

export type MiVeredaVereda = {
  id: string;
  nombre: string;
  activa: boolean;
};

type MiVeredaCarteleraArgs = {
  p_vereda_id: string | null;
  p_busqueda: string | null;
  p_categoria: MiVeredaCategoria | null;
  p_limit: number;
  p_offset: number;
  p_excluir_nivel_normal: boolean;
};

type MiVeredaHistorialArgs = {
  p_vereda_id: string | null;
  p_resultado: "solucionado" | "no_solucionado" | null;
  p_categoria: MiVeredaCategoria | null;
  p_desde: string | null;
  p_hasta: string | null;
  p_limit: number;
  p_offset: number;
};

type MiVeredaRpcClient = {
  rpc: (
    functionName: "mi_vereda_cartelera" | "mi_vereda_historial",
    args: MiVeredaCarteleraArgs | MiVeredaHistorialArgs,
  ) => Promise<{
    data: unknown;
    error: { message: string; code?: string } | null;
  }>;
};

/**
 * Adaptador temporal mientras se regeneran los tipos de Supabase con v3.3.
 * El contrato de retorno coincide con public.mi_vereda_publicaciones.
 */
export async function consultarCartelera(
  args: Omit<MiVeredaCarteleraArgs, "p_vereda_id" | "p_busqueda" | "p_offset"> & {
    p_vereda_id?: string | null;
    p_busqueda?: string | null;
    p_offset?: number;
  },
): Promise<MiVeredaPublicacion[]> {
  const rpcClient = supabase as unknown as MiVeredaRpcClient;
  const { data, error } = await rpcClient.rpc("mi_vereda_cartelera", {
    p_vereda_id: args.p_vereda_id ?? null,
    p_busqueda: args.p_busqueda ?? null,
    p_categoria: args.p_categoria,
    p_limit: args.p_limit,
    p_offset: args.p_offset ?? 0,
    p_excluir_nivel_normal: args.p_excluir_nivel_normal,
  });

  if (error) throw error;
  return Array.isArray(data) ? (data as MiVeredaPublicacion[]) : [];
}

export async function consultarHistorial(
  args: Omit<MiVeredaHistorialArgs, "p_vereda_id" | "p_busqueda" | "p_offset"> & {
    p_vereda_id?: string | null;
    p_offset?: number;
  },
): Promise<MiVeredaHistorialPublicacion[]> {
  const rpcClient = supabase as unknown as MiVeredaRpcClient;
  const { data, error } = await rpcClient.rpc("mi_vereda_historial", {
    p_vereda_id: args.p_vereda_id ?? null,
    p_resultado: args.p_resultado,
    p_categoria: args.p_categoria,
    p_desde: args.p_desde,
    p_hasta: args.p_hasta,
    p_limit: args.p_limit,
    p_offset: args.p_offset ?? 0,
  });

  if (error) throw error;
  return Array.isArray(data) ? (data as MiVeredaHistorialPublicacion[]) : [];
}

export async function consultarVeredas(): Promise<MiVeredaVereda[]> {
  const { data, error } = await supabase
    .from("veredas")
    .select("id, nombre, activa")
    .order("nombre", { ascending: true });

  if (error) throw error;
  return (data ?? []) as MiVeredaVereda[];
}
