import { supabase } from "@/integrations/supabase/client";

export type AdminCapacity = {
  storage_bytes: number;
  storage_limite_bytes: number | null;
  storage_porcentaje: number | null;
  bd_bytes: number;
  bd_limite_bytes: number | null;
  bd_porcentaje: number | null;
};

type CapacityRpcClient = {
  rpc: (functionName: "obtener_uso_espacio") => Promise<{
    data: unknown;
    error: { message: string; code?: string } | null;
  }>;
};

const capacityRpc = supabase as unknown as CapacityRpcClient;

function isNumber(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value);
}

function parseCapacity(data: unknown): AdminCapacity {
  if (!data || typeof data !== "object") {
    throw new Error("La respuesta de capacidad no es válida.");
  }
  const value = data as Record<string, unknown>;
  if (!isNumber(value["storage_bytes"]) || !isNumber(value["bd_bytes"])) {
    throw new Error("La respuesta de capacidad está incompleta.");
  }

  return {
    storage_bytes: value["storage_bytes"],
    storage_limite_bytes: isNumber(value["storage_limite_bytes"])
      ? value["storage_limite_bytes"]
      : null,
    storage_porcentaje: isNumber(value["storage_porcentaje"]) ? value["storage_porcentaje"] : null,
    bd_bytes: value["bd_bytes"],
    bd_limite_bytes: isNumber(value["bd_limite_bytes"]) ? value["bd_limite_bytes"] : null,
    bd_porcentaje: isNumber(value["bd_porcentaje"]) ? value["bd_porcentaje"] : null,
  };
}

export async function consultarCapacidadAdmin(): Promise<AdminCapacity> {
  const { data, error } = await capacityRpc.rpc("obtener_uso_espacio");
  if (error) throw new Error(error.message);
  return parseCapacity(data);
}

export function formatearBytes(value: number | null): string {
  if (value === null) return "Sin límite";
  if (value < 1024) return `${Math.round(value).toLocaleString("es-CO")} bytes`;
  const unidades = ["KB", "MB", "GB", "TB"];
  let cantidad = value;
  let indice = -1;
  do {
    cantidad /= 1024;
    indice += 1;
  } while (cantidad >= 1024 && indice < unidades.length - 1);
  return `${cantidad.toLocaleString("es-CO", { maximumFractionDigits: 1 })} ${unidades[indice]}`;
}
