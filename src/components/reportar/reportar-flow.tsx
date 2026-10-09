import { useCallback, useState } from "react";
import { TituloModulo } from "@/components/carta";
import { confirmarReporteLocal, type MockSubmissionResult } from "@/lib/reportar/mock-submit";
import { useReportarFlow } from "@/hooks/use-reportar-flow";
import type { ReporteEvidencia } from "@/lib/reportar/types";
import { ReportarProgress } from "@/components/reportar/reportar-progress";
import { ReportarCategoryStep } from "@/components/reportar/reportar-category-step";
import { ReportarDetailsStep } from "@/components/reportar/reportar-details-step";
import { ReportarLocationStep } from "@/components/reportar/reportar-location-step";
import { ReportarEvidenceStep } from "@/components/reportar/reportar-evidence-step";
import { ReportarReviewStep } from "@/components/reportar/reportar-review-step";
import { ReportarConfirmation } from "@/components/reportar/reportar-confirmation";
import { ReportarMediaCapture } from "@/components/reportar/reportar-media-capture";
import { ReportarPhotoCropper } from "@/components/reportar/reportar-photo-cropper";

function evidenciaDesdeArchivo(
  file: File,
  fuente: "camara" | "galeria",
  tipo: "foto" | "video",
  duracionSegundos?: number,
): ReporteEvidencia {
  return {
    id: `${tipo}-${Date.now()}-${Math.random().toString(36).slice(2)}`,
    tipo,
    archivo: file,
    previewUrl: URL.createObjectURL(file),
    fuente,
    capturadaEn: new Date().toISOString(),
    ...(duracionSegundos === undefined ? {} : { duracionSegundos }),
  };
}

export function ReportarFlow() {
  const flow = useReportarFlow();
  const { setUi, agregarEvidencias } = flow;
  const [captureMode, setCaptureMode] = useState<"foto" | "video" | null>(null);
  const [submission, setSubmission] = useState<MockSubmissionResult | null>(null);

  const setCapturePermission = useCallback(
    (permission: "concedido" | "denegado" | "no-disponible") => {
      setUi((actual) => ({ ...actual, permisoCamara: permission }));
    },
    [setUi],
  );

  const onPhoto = useCallback(
    (file: File) => {
      agregarEvidencias([evidenciaDesdeArchivo(file, "camara", "foto")]);
      setCaptureMode(null);
    },
    [agregarEvidencias],
  );

  const onVideo = useCallback(
    (file: File, durationSeconds: number) => {
      agregarEvidencias([evidenciaDesdeArchivo(file, "camara", "video", durationSeconds)]);
      setCaptureMode(null);
    },
    [agregarEvidencias],
  );

  const onFiles = useCallback(
    (files: readonly File[]) => {
      const evidencias = files
        .filter((file) => file.type.startsWith("image/"))
        .map((file) => evidenciaDesdeArchivo(file, "galeria", "foto"));
      agregarEvidencias(evidencias);
    },
    [agregarEvidencias],
  );

  const prepararReporte = async () => {
    const result = await confirmarReporteLocal(flow.draft);
    setSubmission(result);
    flow.completarLocalmente();
  };

  const step = flow.ui.step;
  const evidenciaEditando =
    flow.draft.evidencias.find((item) => item.id === flow.ui.evidenciaEditando) ?? null;

  return (
    <div className="reportar-page">
      <TituloModulo
        titulo="Reportar"
        bajada="Cuéntale a la comunidad lo que está pasando. Tu reporte será revisado antes de publicarse."
      />
      <ReportarProgress step={step} />

      {step === "categoria" && (
        <ReportarCategoryStep
          categoria={flow.draft.categoria}
          subcategoria={flow.draft.subcategoria}
          subcategoriaPadre={flow.draft.subcategoriaPadre}
          descripcion={flow.draft.descripcion}
          error={flow.ui.error}
          onCategoria={flow.elegirCategoria}
          onSubcategoria={flow.elegirSubcategoria}
          onDescripcion={(descripcion) => flow.updateDraft({ descripcion })}
          onNext={flow.siguientePaso}
        />
      )}
      {step === "detalle" && (
        <ReportarDetailsStep
          tipoLugar={flow.draft.tipoLugar}
          territorioId={flow.draft.territorioId}
          territorioPadreId={flow.draft.territorioPadreId}
          nombre={flow.draft.nombre}
          error={flow.ui.error}
          onChange={flow.updateDraft}
          onBack={flow.pasoAnterior}
          onNext={flow.siguientePaso}
        />
      )}
      {step === "ubicacion" && (
        <ReportarLocationStep
          categoria={flow.draft.categoria}
          ubicacion={flow.draft.ubicacion}
          ubicacionEstado={flow.draft.ubicacionEstado}
          lugar={flow.draft.lugar}
          onUbicacion={(ubicacion) => flow.updateDraft({ ubicacion })}
          onUbicacionEstado={(ubicacionEstado) => flow.updateDraft({ ubicacionEstado })}
          onLugar={(lugar) => flow.updateDraft({ lugar })}
          onBack={flow.pasoAnterior}
          onNext={flow.siguientePaso}
        />
      )}
      {step === "evidencias" && (
        <ReportarEvidenceStep
          evidencias={flow.draft.evidencias}
          fotoCount={flow.fotoCount}
          videoCount={flow.videoCount}
          evidenciaObligatoria={flow.evidenciaObligatoria}
          sinEvidencia={flow.draft.sinEvidencia}
          error={flow.ui.error}
          onOpenCapture={setCaptureMode}
          onFiles={onFiles}
          onRemove={flow.quitarEvidencia}
          onEdit={(id) => flow.setUi((actual) => ({ ...actual, evidenciaEditando: id }))}
          onSinEvidencia={flow.setSinEvidencia}
          onBack={flow.pasoAnterior}
          onNext={flow.siguientePaso}
        />
      )}
      {step === "revision" && (
        <ReportarReviewStep
          draft={flow.draft}
          onEdit={flow.setStep}
          onConfirm={() => void prepararReporte()}
        />
      )}
      {step === "confirmacion" && submission && (
        <ReportarConfirmation
          result={submission}
          pendienteRevision={flow.draft.subcategoriaPadre === "alerta_seguridad"}
          onReset={() => {
            setSubmission(null);
            flow.reiniciar();
          }}
        />
      )}

      <ReportarMediaCapture
        open={captureMode !== null}
        mode={captureMode ?? "foto"}
        onOpenChange={(open) => {
          if (!open) setCaptureMode(null);
        }}
        onPhoto={onPhoto}
        onVideo={onVideo}
        onPermissionState={setCapturePermission}
      />
      <ReportarPhotoCropper
        evidencia={evidenciaEditando}
        onClose={() => flow.setUi((actual) => ({ ...actual, evidenciaEditando: null }))}
        onSave={(archivo) => {
          if (evidenciaEditando) flow.reemplazarEvidencia(evidenciaEditando.id, archivo, true);
        }}
      />
    </div>
  );
}
