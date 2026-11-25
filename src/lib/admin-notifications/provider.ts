import { adminPreviewBridge } from "@/lib/admin-preview-bridge";
import type { ProveedorNotificacionesAdmin } from "@/lib/admin-notifications/types";

/** El proveedor con fixtures solo está disponible en el preview/desarrollo explícitamente habilitado. */
export const notificacionesDemoHabilitadas = import.meta.env.DEV && adminPreviewBridge.enabled;

/**
 * Mantiene la UI desacoplada de su fuente de datos. La fuente real se conectará en una etapa
 * posterior; por ahora, fuera del preview DEMO no se presentan registros ficticios.
 */
export async function cargarProveedorNotificacionesAdmin(): Promise<ProveedorNotificacionesAdmin | null> {
  if (!notificacionesDemoHabilitadas) return null;
  const { proveedorNotificacionesDemo } = await import("@/lib/admin-notifications/demo-provider");
  return proveedorNotificacionesDemo;
}
