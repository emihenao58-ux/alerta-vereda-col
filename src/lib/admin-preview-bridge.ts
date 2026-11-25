export type AdminPublicationTable = "emergencias" | "vias" | "servicios" | "avisos";

export type AdminPreviewTarget = {
  table: AdminPublicationTable;
  id: string;
};

export type AdminPreviewComment = {
  id: string;
  text: string;
  author: string;
  createdAt: string;
};

export type AdminPreviewReportTarget = {
  id: string;
  options?: import("@/lib/admin-report-actions").OpcionesVerificacionReporte;
};

/**
 * Sin implementación real: el código de producto no simula estados ni comentarios.
 * Solo el Vite config externo del preview aislado sustituye este módulo por su mock en memoria.
 */
export const adminPreviewBridge = Object.freeze({
  enabled: false,
  async verifyReport(_target: AdminPreviewReportTarget): Promise<boolean> {
    return false;
  },
  async rejectReport(_target: AdminPreviewReportTarget, _reason: string): Promise<boolean> {
    return false;
  },
  async markInAttention(_target: AdminPreviewTarget): Promise<boolean> {
    return false;
  },
  async addComment(_target: AdminPreviewTarget, _text: string): Promise<boolean> {
    return false;
  },
  getComments(_target: AdminPreviewTarget): AdminPreviewComment[] {
    return [];
  },
});
