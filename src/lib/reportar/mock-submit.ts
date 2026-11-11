import type { ReporteDraft } from "@/lib/reportar/types";
import {
  guardarReporteLocal,
  type IdentidadAdministrativaLocal,
} from "@/lib/reportar/local-history";
import { procesarVideoEvidencia } from "@/lib/reportar/video-processor";

export type MockSubmissionResult = {
  mode: "local-preview";
  publicId: null;
  submittedAt: string;
  localId?: string;
};

export async function confirmarReporteLocal(_draft: ReporteDraft): Promise<MockSubmissionResult> {
  await Promise.resolve();
  return { mode: "local-preview", publicId: null, submittedAt: new Date().toISOString() };
}

export async function guardarYConfirmarReporteLocal(
  draft: ReporteDraft,
  localId: string,
  contexto:
    | { origen: "comunitario" }
    | { origen: "jac"; identidadAdministrativa: IdentidadAdministrativaLocal } = {
    origen: "comunitario",
  },
): Promise<MockSubmissionResult> {
  if (
    draft.evidencias.filter((evidencia) => evidencia.tipo === "foto").length > 3 ||
    draft.evidencias.filter((evidencia) => evidencia.tipo === "video").length > 1
  ) {
    throw new Error("Solo puedes guardar hasta 3 fotografías y 1 video por reporte.");
  }
  const draftProcesado = {
    ...draft,
    evidencias: await Promise.all(
      draft.evidencias.map(async (evidencia) => {
        if (evidencia.tipo !== "video") return evidencia;
        const resultado = await procesarVideoEvidencia(evidencia.archivo);
        return {
          ...evidencia,
          archivo: resultado.archivo,
          procesamiento: "procesada" as const,
          duracionSegundos: resultado.duracionSegundos,
          dimensiones: resultado.dimensiones,
        };
      }),
    ),
  };
  const result = await confirmarReporteLocal(draft);
  await guardarReporteLocal(
    draftProcesado,
    localId,
    result.submittedAt,
    contexto.origen,
    contexto.origen === "jac" ? contexto.identidadAdministrativa : undefined,
  );
  return { ...result, localId };
}
