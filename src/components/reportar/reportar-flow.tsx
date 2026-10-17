import { useCallback, useEffect, useRef, useState } from "react";
import { TituloModulo } from "@/components/carta";
import { confirmarReporteLocal, type MockSubmissionResult } from "@/lib/reportar/mock-submit";
import { useReportarFlow } from "@/hooks/use-reportar-flow";
import type {
  DimensionesEvidencia,
  EvidenciaProcesamiento,
  ReporteEvidencia,
} from "@/lib/reportar/types";
import {
  leerDuracionVideo,
  MAX_VIDEO_BYTES,
  MAX_VIDEO_DURATION_SECONDS,
} from "@/lib/reportar/media";
import { procesarFotografiaEvidenciaDetallada } from "@/lib/reportar/photo-processor";
import { ReportarProgress } from "@/components/reportar/reportar-progress";
import { ReportarCategoryStep } from "@/components/reportar/reportar-category-step";
import { ReportarDetailsStep } from "@/components/reportar/reportar-details-step";
import { ReportarLocationStep } from "@/components/reportar/reportar-location-step";
import { ReportarEvidenceStep } from "@/components/reportar/reportar-evidence-step";
import { ReportarReviewStep } from "@/components/reportar/reportar-review-step";
import { ReportarConfirmation } from "@/components/reportar/reportar-confirmation";
import { ReportarMediaCapture } from "@/components/reportar/reportar-media-capture";
import { ReportarPhotoCropper } from "@/components/reportar/reportar-photo-cropper";
import { ReportarEvidencePreview } from "@/components/reportar/reportar-evidence-preview";

function crearEvidencia({
  file,
  fuente,
  tipo,
  duracionSegundos,
  capturadaEn,
  procesamiento,
  dimensiones,
  archivoOriginal,
}: {
  file: File;
  fuente: "camara" | "galeria";
  tipo: "foto" | "video";
  duracionSegundos?: number;
  capturadaEn: string | null;
  procesamiento: EvidenciaProcesamiento;
  dimensiones: DimensionesEvidencia | null;
  archivoOriginal?: File;
}): ReporteEvidencia {
  return {
    id: `${tipo}-${Date.now()}-${Math.random().toString(36).slice(2)}`,
    tipo,
    archivo: file,
    previewUrl: URL.createObjectURL(file),
    fuente,
    procesamiento,
    dimensiones,
    capturadaEn,
    incorporadaEn: new Date().toISOString(),
    archivoOriginal: archivoOriginal ?? file,
    ...(duracionSegundos === undefined ? {} : { duracionSegundos }),
  };
}

function revocarEvidenciasPendientes(evidencias: readonly ReporteEvidencia[]) {
  evidencias.forEach((evidencia) => URL.revokeObjectURL(evidencia.previewUrl));
}

export function ReportarFlow() {
  const flow = useReportarFlow();
  const { setUi, agregarEvidencias, fotoCount, videoCount } = flow;
  const [captureMode, setCaptureMode] = useState<"foto" | "video" | null>(null);
  const [submission, setSubmission] = useState<MockSubmissionResult | null>(null);
  const [evidenciaVisualizadaId, setEvidenciaVisualizadaId] = useState<string | null>(null);
  const mountedRef = useRef(false);
  const operationRef = useRef(0);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      operationRef.current += 1;
    };
  }, []);

  const setCapturePermission = useCallback(
    (permission: "concedido" | "denegado" | "no-disponible") => {
      setUi((actual) => ({ ...actual, permisoCamara: permission }));
    },
    [setUi],
  );

  const onPhoto = useCallback(
    async (file: File, capturedAt: string) => {
      const operation = ++operationRef.current;
      const resultado = await procesarFotografiaEvidenciaDetallada(file);
      if (!mountedRef.current || operation !== operationRef.current) return;
      if (!resultado.puedeVisualizarse) {
        throw new Error(
          resultado.mensajeError ??
            "No se pudo mostrar esta fotografía en este navegador. Elige otra imagen.",
        );
      }

      agregarEvidencias([
        crearEvidencia({
          file: resultado.archivo,
          fuente: "camara",
          tipo: "foto",
          capturadaEn: capturedAt,
          procesamiento: resultado.estado,
          dimensiones: resultado.dimensiones,
          archivoOriginal: file,
        }),
      ]);
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
          procesamiento: "no-aplica",
          dimensiones: null,
        }),
      ]);
    },
    [agregarEvidencias],
  );

  const onFiles = useCallback(
    async (files: readonly File[]) => {
      const operation = ++operationRef.current;
      const evidencias: ReporteEvidencia[] = [];
      const errores: string[] = [];
      let fotosDisponibles = Math.max(0, 3 - fotoCount);
      let videoDisponible = videoCount < 1;

      for (const file of files) {
        if (file.type.startsWith("image/")) {
          if (fotosDisponibles <= 0) {
            errores.push("Solo puedes agregar hasta 3 fotos por reporte.");
            continue;
          }

          fotosDisponibles -= 1;
          try {
            const resultado = await procesarFotografiaEvidenciaDetallada(file);
            if (!resultado.puedeVisualizarse) {
              fotosDisponibles += 1;
              errores.push(
                resultado.mensajeError ??
                  "No se pudo mostrar esta fotografía en este navegador. Elige otra imagen.",
              );
              continue;
            }
            evidencias.push(
              crearEvidencia({
                file: resultado.archivo,
                fuente: "galeria",
                tipo: "foto",
                capturadaEn: null, // De galería: no se inventa fecha de captura
                procesamiento: resultado.estado,
                dimensiones: resultado.dimensiones,
                archivoOriginal: file,
              }),
            );
          } catch {
            fotosDisponibles += 1;
            errores.push("No se pudo procesar una de las fotografías.");
          }
          continue;
        }

        if (!file.type.startsWith("video/")) continue;

        if (!videoDisponible) {
          errores.push("Solo puedes agregar 1 video por reporte.");
          continue;
        }

        videoDisponible = false;

        if (file.size > MAX_VIDEO_BYTES) {
          videoDisponible = true;
          errores.push("Un video supera el límite de 15 MB.");
          continue;
        }

        try {
          const duration = await leerDuracionVideo(file);
          if (duration > MAX_VIDEO_DURATION_SECONDS) {
            videoDisponible = true;
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
              procesamiento: "no-aplica",
              dimensiones: null,
            }),
          );
        } catch {
          videoDisponible = true;
          errores.push("No se pudo leer la duración de uno de los videos.");
        }
      }

      if (!mountedRef.current || operation !== operationRef.current) {
        revocarEvidenciasPendientes(evidencias);
        return;
      }

      if (evidencias.length > 0) agregarEvidencias(evidencias);
      if (errores.length > 0) {
        setUi((actual) => ({ ...actual, error: errores[0] ?? null }));
      }
    },
    [agregarEvidencias, fotoCount, setUi, videoCount],
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
  const evidenciaVisualizada =
    flow.draft.evidencias.find((item) => item.id === evidenciaVisualizadaId) ?? null;

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
          onPreview={setEvidenciaVisualizadaId}
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
        onClose={() => {
          operationRef.current += 1;
          flow.setUi((actual) => ({ ...actual, evidenciaEditando: null }));
        }}
        onSave={async (archivo) => {
          const operation = ++operationRef.current;
          if (!evidenciaEditando) return;
          const resultado = await procesarFotografiaEvidenciaDetallada(archivo);
          if (!mountedRef.current || operation !== operationRef.current) return;
          flow.reemplazarEvidencia(evidenciaEditando.id, resultado, true);
        }}
      />
      <ReportarEvidencePreview
        evidencia={evidenciaVisualizada}
        onClose={() => setEvidenciaVisualizadaId(null)}
      />
    </div>
  );
}
