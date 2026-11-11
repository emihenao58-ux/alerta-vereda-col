import { useCallback, useEffect, useRef, useState } from "react";
import { TituloModulo } from "@/components/carta";
import {
  guardarYConfirmarReporteLocal,
  type MockSubmissionResult,
} from "@/lib/reportar/mock-submit";
import { ErrorProcesamientoVideo } from "@/lib/reportar/video-processor";
import { useReportarFlow } from "@/hooks/use-reportar-flow";
import { usePreferenciasM4 } from "@/hooks/use-m4-preferences";
import type {
  DimensionesEvidencia,
  EvidenciaProcesamiento,
  ReporteDraft,
  ReporteEvidencia,
  ReporteUbicacion,
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
import { AdminPublicationWarningDialog } from "@/components/reportar/admin-publication-warning-dialog";
import { useAuth } from "@/hooks/use-auth";

function crearEvidencia({
  file,
  fuente,
  tipo,
  duracionSegundos,
  capturadaEn,
  procesamiento,
  dimensiones,
  archivoOriginal,
  ubicacionCaptura,
}: {
  file: File;
  fuente: "camara" | "galeria";
  tipo: "foto" | "video";
  duracionSegundos?: number;
  capturadaEn: string | null;
  procesamiento: EvidenciaProcesamiento;
  dimensiones: DimensionesEvidencia | null;
  archivoOriginal?: File;
  ubicacionCaptura?: ReporteUbicacion | null;
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
    ubicacionCaptura: ubicacionCaptura ?? null,
    incorporadaEn: new Date().toISOString(),
    archivoOriginal: archivoOriginal ?? file,
    ...(duracionSegundos === undefined ? {} : { duracionSegundos }),
  };
}

function revocarEvidenciasPendientes(evidencias: readonly ReporteEvidencia[]) {
  evidencias.forEach((evidencia) => URL.revokeObjectURL(evidencia.previewUrl));
}

export function ReportarFlow() {
  const auth = useAuth();
  const nombreIdentidadAdmin = auth.esAdminVereda ? (auth.perfil?.nombre?.trim() ?? "") : undefined;
  const flow = useReportarFlow({
    ubicacionEmergenciaRequerida: false,
    ...(nombreIdentidadAdmin === undefined ? {} : { nombreIdentidadAdmin }),
  });
  const {
    obtenerUbicacionParaEvidencia,
    permisoUbicacion,
    preferenciaUbicacion,
    solicitarUbicacionParaReporte,
    ubicacionActual,
    ubicacionActualizadaEn,
  } = usePreferenciasM4();
  const {
    setUi,
    agregarEvidencias,
    fotoCount,
    videoCount,
    actualizarUbicacionEvidencia,
    updateDraft,
  } = flow;
  const [captureMode, setCaptureMode] = useState<"foto" | "video" | null>(null);
  const [submission, setSubmission] = useState<MockSubmissionResult | null>(null);
  const [evidenciaVisualizadaId, setEvidenciaVisualizadaId] = useState<string | null>(null);
  const [guardandoReporte, setGuardandoReporte] = useState(false);
  const [errorGuardado, setErrorGuardado] = useState<string | null>(null);
  const guardandoReporteRef = useRef(false);
  const idReporteLocalRef = useRef<string | null>(null);
  const [avisoPublicacionAdminAbierto, setAvisoPublicacionAdminAbierto] = useState(false);
  const [omitirAvisoAdminDuranteSesion, setOmitirAvisoAdminDuranteSesion] = useState(false);
  const [noMostrarAvisoMarcado, setNoMostrarAvisoMarcado] = useState(false);
  const mountedRef = useRef(false);
  const operationRef = useRef(0);
  const procesandoEvidenciaRef = useRef(false);
  const [procesandoEvidencia, setProcesandoEvidencia] = useState(false);

  const iniciarProcesamiento = useCallback(() => {
    if (procesandoEvidenciaRef.current || guardandoReporteRef.current) {
      setUi((actual) => ({
        ...actual,
        error:
          "Espera a que termine la selección actual. No se canceló ni reemplazó tu lote anterior.",
      }));
      return false;
    }
    procesandoEvidenciaRef.current = true;
    setProcesandoEvidencia(true);
    return true;
  }, [setUi]);

  const finalizarProcesamiento = useCallback(() => {
    procesandoEvidenciaRef.current = false;
    if (mountedRef.current) setProcesandoEvidencia(false);
  }, []);

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
    async (
      file: File,
      capturedAt: string,
      ubicacionPendiente: Promise<ReporteUbicacion | null>,
    ) => {
      if (!iniciarProcesamiento()) {
        throw new Error("Espera a que termine el procesamiento de las evidencias actuales.");
      }
      const operation = ++operationRef.current;
      try {
        const resultado = await procesarFotografiaEvidenciaDetallada(file);
        if (!mountedRef.current || operation !== operationRef.current) return;
        if (!resultado.puedeVisualizarse) {
          throw new Error(
            resultado.mensajeError ??
              "No se pudo mostrar esta fotografía en este navegador. Elige otra imagen.",
          );
        }

        const evidencia = crearEvidencia({
          file: resultado.archivo,
          fuente: "camara",
          tipo: "foto",
          capturadaEn: capturedAt,
          procesamiento: resultado.estado,
          dimensiones: resultado.dimensiones,
          archivoOriginal: file,
        });
        agregarEvidencias([evidencia]);
        void ubicacionPendiente.then((ubicacionCaptura) => {
          if (ubicacionCaptura) actualizarUbicacionEvidencia(evidencia.id, ubicacionCaptura);
        });
      } finally {
        finalizarProcesamiento();
      }
    },
    [actualizarUbicacionEvidencia, agregarEvidencias, iniciarProcesamiento, finalizarProcesamiento],
  );

  const onVideo = useCallback(
    (
      file: File,
      durationSeconds: number,
      capturedAt: string,
      ubicacionPendiente: Promise<ReporteUbicacion | null>,
    ) => {
      if (procesandoEvidenciaRef.current || guardandoReporteRef.current) {
        throw new Error("Espera a que termine el procesamiento de las evidencias actuales.");
      }
      const evidencia = crearEvidencia({
        file,
        fuente: "camara",
        tipo: "video",
        duracionSegundos: durationSeconds,
        capturadaEn: capturedAt,
        procesamiento: "no-aplica",
        dimensiones: null,
      });
      agregarEvidencias([evidencia]);
      void ubicacionPendiente.then((ubicacionCaptura) => {
        if (ubicacionCaptura) actualizarUbicacionEvidencia(evidencia.id, ubicacionCaptura);
      });
    },
    [actualizarUbicacionEvidencia, agregarEvidencias],
  );

  const actualizarUbicacion = useCallback(
    (ubicacion: ReporteUbicacion | null) => updateDraft({ ubicacion }),
    [updateDraft],
  );
  const actualizarEstadoUbicacion = useCallback(
    (ubicacionEstado: ReporteDraft["ubicacionEstado"]) => updateDraft({ ubicacionEstado }),
    [updateDraft],
  );
  const actualizarLugar = useCallback((lugar: string) => updateDraft({ lugar }), [updateDraft]);

  const onFiles = useCallback(
    async (files: readonly File[]) => {
      if (files.length === 0 || !iniciarProcesamiento()) return;
      const operation = ++operationRef.current;
      try {
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
      } finally {
        finalizarProcesamiento();
      }
    },
    [agregarEvidencias, fotoCount, setUi, videoCount, iniciarProcesamiento, finalizarProcesamiento],
  );

  const prepararReporte = async () => {
    if (guardandoReporteRef.current) return;
    if (procesandoEvidenciaRef.current || auth.cargandoAcceso) {
      setErrorGuardado(
        "Espera a que terminen las evidencias y la carga de tu identidad antes de confirmar.",
      );
      return;
    }
    guardandoReporteRef.current = true;
    setGuardandoReporte(true);
    setErrorGuardado(null);
    try {
      idReporteLocalRef.current ??= crypto.randomUUID();
      const result = await guardarYConfirmarReporteLocal(
        flow.draft,
        idReporteLocalRef.current,
        auth.esAdminVereda && auth.perfil
          ? {
              origen: "jac",
              identidadAdministrativa: {
                perfilId: auth.perfil.id,
                nombre: (auth.perfil.nombre ?? "").trim(),
              },
            }
          : { origen: "comunitario" },
      );
      if (!mountedRef.current) return;
      setSubmission(result);
      flow.completarLocalmente();
    } catch (error) {
      if (mountedRef.current) {
        setErrorGuardado(
          error instanceof ErrorProcesamientoVideo
            ? `${error.message} No se guardó el reporte; tus datos y evidencias siguen en el borrador.`
            : error instanceof Error &&
                error.message.includes("una fotografía no tiene una versión procesada disponible")
              ? "No se pudo guardar el reporte porque una fotografía no tiene una versión procesada disponible. Elige otra imagen e inténtalo nuevamente; el reporte no se envió al servidor."
              : "No se pudo guardar el reporte y sus evidencias en este dispositivo. No se registró como guardado ni se envió al servidor. Tus datos siguen aquí; revisa el almacenamiento del navegador e inténtalo nuevamente.",
        );
      }
    } finally {
      guardandoReporteRef.current = false;
      if (mountedRef.current) setGuardandoReporte(false);
    }
  };

  const confirmarDesdeRevision = () => {
    if (procesandoEvidenciaRef.current || guardandoReporteRef.current || auth.cargandoAcceso)
      return;
    if (auth.esAdminVereda && !omitirAvisoAdminDuranteSesion) {
      setNoMostrarAvisoMarcado(false);
      setAvisoPublicacionAdminAbierto(true);
      return;
    }
    void prepararReporte();
  };

  const volverDesdeAvisoPublicacion = () => {
    setAvisoPublicacionAdminAbierto(false);
    setNoMostrarAvisoMarcado(false);
  };

  const confirmarAvisoPublicacion = () => {
    if (noMostrarAvisoMarcado) setOmitirAvisoAdminDuranteSesion(true);
    setAvisoPublicacionAdminAbierto(false);
    setNoMostrarAvisoMarcado(false);
    void prepararReporte();
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
          nombreSoloLectura={auth.esAdminVereda}
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
          onUbicacion={actualizarUbicacion}
          onUbicacionEstado={actualizarEstadoUbicacion}
          onLugar={actualizarLugar}
          preferenciaUbicacion={preferenciaUbicacion}
          permisoUbicacion={permisoUbicacion}
          onObtenerUbicacion={solicitarUbicacionParaReporte}
          autoObtenerUbicacion
          ubicacionDisponible={
            ubicacionActualizadaEn !== null && Date.now() - ubicacionActualizadaEn < 5 * 60 * 1000
              ? ubicacionActual
              : null
          }
          ubicacionRequerida={false}
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
          procesando={procesandoEvidencia}
          onOpenCapture={(mode) => {
            if (!procesandoEvidenciaRef.current) setCaptureMode(mode);
          }}
          onFiles={onFiles}
          onRemove={(id) => {
            if (!procesandoEvidenciaRef.current) flow.quitarEvidencia(id);
          }}
          onEdit={(id) => {
            if (!procesandoEvidenciaRef.current)
              flow.setUi((actual) => ({ ...actual, evidenciaEditando: id }));
          }}
          onPreview={setEvidenciaVisualizadaId}
          onSinEvidencia={flow.setSinEvidencia}
          onBack={() => {
            if (!procesandoEvidenciaRef.current) flow.pasoAnterior();
          }}
          onNext={() => {
            if (!procesandoEvidenciaRef.current) flow.siguientePaso();
          }}
        />
      )}
      {step === "revision" && (
        <ReportarReviewStep
          draft={flow.draft}
          onEdit={(step) => {
            if (!guardandoReporteRef.current && !procesandoEvidenciaRef.current) flow.setStep(step);
          }}
          onPreview={setEvidenciaVisualizadaId}
          onConfirm={confirmarDesdeRevision}
          guardando={guardandoReporte || auth.cargandoAcceso}
          procesandoEvidencia={procesandoEvidencia}
          errorGuardado={errorGuardado}
        />
      )}
      {step === "confirmacion" && submission && (
        <ReportarConfirmation
          draft={flow.draft}
          result={submission}
          pendienteRevision={
            !auth.esAdminVereda && flow.draft.subcategoriaPadre === "alerta_seguridad"
          }
          onReset={() => {
            setSubmission(null);
            idReporteLocalRef.current = null;
            setErrorGuardado(null);
            setNoMostrarAvisoMarcado(false);
            flow.reiniciar();
          }}
        />
      )}

      <AdminPublicationWarningDialog
        open={avisoPublicacionAdminAbierto}
        noMostrarDuranteEstaSesion={noMostrarAvisoMarcado}
        onNoMostrarDuranteEstaSesion={setNoMostrarAvisoMarcado}
        onVolver={volverDesdeAvisoPublicacion}
        onConfirmar={confirmarAvisoPublicacion}
      />

      <ReportarMediaCapture
        open={captureMode !== null}
        mode={captureMode ?? "foto"}
        onOpenChange={(open) => {
          if (!open) setCaptureMode(null);
        }}
        onPhoto={onPhoto}
        onVideo={onVideo}
        onPermissionState={setCapturePermission}
        onSolicitarUbicacionCaptura={obtenerUbicacionParaEvidencia}
      />
      <ReportarPhotoCropper
        evidencia={evidenciaEditando}
        onClose={() => {
          if (procesandoEvidenciaRef.current) return;
          operationRef.current += 1;
          flow.setUi((actual) => ({ ...actual, evidenciaEditando: null }));
        }}
        onSave={async (archivo) => {
          if (!evidenciaEditando || !iniciarProcesamiento()) return;
          const operation = ++operationRef.current;
          try {
            const resultado = await procesarFotografiaEvidenciaDetallada(archivo);
            if (!mountedRef.current || operation !== operationRef.current) return;
            if (!resultado.puedeVisualizarse) {
              throw new Error(
                "No se pudo preparar el recorte. La fotografía anterior se conserva.",
              );
            }
            flow.reemplazarEvidencia(evidenciaEditando.id, resultado, true);
          } finally {
            finalizarProcesamiento();
          }
        }}
      />
      <ReportarEvidencePreview
        evidencia={evidenciaVisualizada}
        onClose={() => setEvidenciaVisualizadaId(null)}
      />
    </div>
  );
}
