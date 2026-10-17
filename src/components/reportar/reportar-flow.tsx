import { useCallback, useState } from "react";
import { TituloModulo } from "@/components/carta";
import { confirmarReporteLocal, type MockSubmissionResult } from "@/lib/reportar/mock-submit";
import { useReportarFlow } from "@/hooks/use-reportar-flow";
import type { ReporteEvidencia } from "@/lib/reportar/types";
import {
  leerDuracionVideo,
  MAX_VIDEO_BYTES,
  MAX_VIDEO_DURATION_SECONDS,
} from "@/lib/reportar/media";
import { procesarFotografiaEvidencia } from "@/lib/reportar/photo-processor";
import { ReportarProgress } from "@/components/reportar/reportar-progress";
import { ReportarCategoryStep } from "@/components/reportar/reportar-category-step";
import { ReportarDetailsStep } from "@/components/reportar/reportar-details-step";
import { ReportarLocationStep } from "@/components/reportar/reportar-location-step";
import { ReportarEvidenceStep } from "@/components/reportar/reportar-evidence-step";
import { ReportarReviewStep } from "@/components/reportar/reportar-review-step";
import { ReportarConfirmation } from "@/components/reportar/reportar-confirmation";
import { ReportarMediaCapture } from "@/components/reportar/reportar-media-capture";
import { ReportarPhotoCropper } from "@/components/reportar/reportar-photo-cropper";

function crearEvidencia({
  file,
  fuente,
  tipo,
  duracionSegundos,
  capturadaEn,
  archivoOriginal,
}: {
  file: File;
  fuente: "camara" | "galeria";
  tipo: "foto" | "video";
  duracionSegundos?: number;
  capturadaEn: string | null;
  archivoOriginal?: File;
}): ReporteEvidencia {
  return {
    id: `${tipo}-${Date.now()}-${Math.random().toString(36).slice(2)}`,
    tipo,
    archivo: file,
    previewUrl: URL.createObjectURL(file),
    fuente,
    capturadaEn,
    incorporadaEn: new Date().toISOString(),
    archivoOriginal: archivoOriginal ?? file,
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
    async (file: File, capturedAt: string) => {
      // Optimizamos la fotografía capturada para que no exceda 1600px ni ~600KB,
      // preservando el archivo original de la captura en archivoOriginal.
      const procesada = await procesarFotografiaEvidencia(file);
      agregarEvidencias([
        crearEvidencia({
          file: procesada,
          fuente: "camara",
          tipo: "foto",
          capturadaEn: capturedAt,
          archivoOriginal: file,
        }),
      ]);
      setCaptureMode(null);
    },
    [agregarEvidencias],
  );

  const onVideo = useCallback(
    (file: File, durationSeconds: number, capturedAt: string) => {
      agregarEvidencias([
        crearEvidencia({
          file,
          fuente: "camara",
          tipo: "video",
          duracionSegundos: durationSeconds,
          capturadaEn: capturedAt,
        }),
      ]);
      setCaptureMode(null);
    },
    [agregarEvidencias],
  );

  const onFiles = useCallback(
    async (files: readonly File[]) => {
      const evidencias: ReporteEvidencia[] = [];
      const errores: string[] = [];

      for (const file of files) {
        if (file.type.startsWith("image/")) {
          try {
            const procesada = await procesarFotografiaEvidencia(file);
            evidencias.push(
              crearEvidencia({
                file: procesada,
                fuente: "galeria",
                tipo: "foto",
                capturadaEn: null, // De galería: no se inventa fecha de captura
                archivoOriginal: file,
              }),
            );
          } catch {
            errores.push("No se pudo procesar una de las fotografías.");
          }
          continue;
        }

        if (!file.type.startsWith("video/")) continue;

        if (file.size > MAX_VIDEO_BYTES) {
          errores.push("Un video supera el límite de 15 MB.");
          continue;
        }

        try {
          const duration = await leerDuracionVideo(file);
          if (duration > MAX_VIDEO_DURATION_SECONDS) {
            errores.push("Un video supera el límite de 15 segundos.");
            continue;
          }
          evidencias.push(
            crearEvidencia({
              file,
              fuente: "galeria",
              tipo: "video",
              duracionSegundos: Math.max(1, Math.ceil(duration)),
              capturadaEn: null, // De galería: fecha de captura no verificable
            }),
          );
        } catch {
          errores.push("No se pudo leer la duración de uno de los videos.");
        }
      }

      if (evidencias.length > 0) agregarEvidencias(evidencias);
      if (errores.length > 0) {
        setUi((actual) => ({ ...actual, error: errores[0] ?? null }));
      }
    },
    [agregarEvidencias, setUi],
  );

  const prepararReporte = async () => {
    const result = await confirmarReporteLocal(flow.draft);
    setSubmission(result);
    flow.completarLocalmente();
  };

  const step = flow.ui.step;
  const isConfirmation = step === "confirmacion";
  const evidenciaEditando =
    flow.draft.evidencias.find((item) => item.id === flow.ui.evidenciaEditando) ?? null;

  return (
    <div className={`reportar-page${isConfirmation ? " reportar-page-confirmation" : ""}`}>
      {!isConfirmation && (
        <TituloModulo
          titulo="Reportar"
          bajada="Prepara el reporte de una novedad en tu comunidad. Toda la información se mantendrá de forma local en tu dispositivo."
        />
      )}
      {!isConfirmation && <ReportarProgress step={step} />}

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
          draft={flow.draft}
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
