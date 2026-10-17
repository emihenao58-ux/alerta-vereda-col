import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { evidenciaObligatoriaPara, subcategoriaPorId } from "@/lib/reportar/catalogo";
import {
  actualizarMetadatosEvidencia,
  type ResultadoProcesamientoFotografia,
} from "@/lib/reportar/photo-processor";
import {
  createEmptyDraft,
  createInitialUiState,
  type ReporteDraft,
  type ReporteEvidencia,
  type ReporteStep,
  type ReportarUiState,
  type ReporteSubcategoriaSeleccion,
  type SinEvidencia,
} from "@/lib/reportar/types";

const STEPS: readonly ReporteStep[] = [
  "categoria",
  "detalle",
  "ubicacion",
  "evidencias",
  "revision",
  "confirmacion",
];

function contar(draft: ReporteDraft, tipo: ReporteEvidencia["tipo"]) {
  return draft.evidencias.filter((evidencia) => evidencia.tipo === tipo).length;
}

export function useReportarFlow() {
  const [draft, setDraft] = useState<ReporteDraft>(createEmptyDraft);
  const [ui, setUi] = useState<ReportarUiState>(createInitialUiState);
  const mountedRef = useRef(false);
  const previewUrlsRef = useRef<Set<string>>(new Set());

  const revocarPreviewUrl = useCallback((previewUrl: string) => {
    if (previewUrlsRef.current.delete(previewUrl)) {
      URL.revokeObjectURL(previewUrl);
    }
  }, []);

  const revocarTodasLasPreview = useCallback(() => {
    previewUrlsRef.current.forEach((previewUrl) => URL.revokeObjectURL(previewUrl));
    previewUrlsRef.current.clear();
  }, []);

  useEffect(() => {
    mountedRef.current = true;

    return () => {
      mountedRef.current = false;
      revocarTodasLasPreview();
    };
  }, [revocarTodasLasPreview]);

  const updateDraft = useCallback((patch: Partial<ReporteDraft>) => {
    setDraft((actual) => ({ ...actual, ...patch }));
    setUi((actual) => ({ ...actual, error: null }));
  }, []);

  const elegirCategoria = useCallback((categoria: ReporteDraft["categoria"]) => {
    setDraft((actual) => ({
      ...actual,
      categoria,
      subcategoria: null,
      subcategoriaPadre: null,
      descripcion: "",
      lugar: "",
      ubicacion: null,
      ubicacionEstado: "pendiente",
      sinEvidencia: null,
    }));
    setUi((actual) => ({ ...actual, error: null }));
  }, []);

  const elegirSubcategoria = useCallback((selection: ReporteSubcategoriaSeleccion) => {
    setDraft((actual) => ({
      ...actual,
      subcategoria: selection.id,
      subcategoriaPadre: selection.parentId,
      descripcion: "",
      lugar: "",
      ubicacion: null,
      ubicacionEstado: "pendiente",
    }));
    setUi((actual) => ({ ...actual, error: null }));
  }, []);

  const agregarEvidencias = useCallback(
    (nuevas: readonly ReporteEvidencia[]) => {
      if (!mountedRef.current) {
        nuevas.forEach((evidencia) => URL.revokeObjectURL(evidencia.previewUrl));
        return 0;
      }

      nuevas.forEach((evidencia) => previewUrlsRef.current.add(evidencia.previewUrl));

      let agregadas = 0;
      setDraft((actual) => {
        const fotosDisponibles = Math.max(0, 3 - contar(actual, "foto"));
        const videoDisponible = contar(actual, "video") === 0;
        const aceptadas: ReporteEvidencia[] = [];

        for (const evidencia of nuevas) {
          if (
            evidencia.tipo === "foto" &&
            aceptadas.filter((item) => item.tipo === "foto").length < fotosDisponibles
          ) {
            aceptadas.push(evidencia);
          }
          if (
            evidencia.tipo === "video" &&
            videoDisponible &&
            !aceptadas.some((item) => item.tipo === "video")
          ) {
            aceptadas.push(evidencia);
          }
        }

        agregadas = aceptadas.length;
        nuevas
          .filter((evidencia) => !aceptadas.includes(evidencia))
          .forEach((evidencia) => revocarPreviewUrl(evidencia.previewUrl));
        return { ...actual, evidencias: [...actual.evidencias, ...aceptadas], sinEvidencia: null };
      });
      setUi((actual) => ({ ...actual, error: null }));
      return agregadas;
    },
    [revocarPreviewUrl],
  );

  const quitarEvidencia = useCallback(
    (id: string) => {
      if (!mountedRef.current) return;

      setDraft((actual) => {
        const evidencia = actual.evidencias.find((item) => item.id === id);
        if (evidencia) revocarPreviewUrl(evidencia.previewUrl);
        return { ...actual, evidencias: actual.evidencias.filter((item) => item.id !== id) };
      });
      setUi((actual) => ({
        ...actual,
        evidenciaEditando: actual.evidenciaEditando === id ? null : actual.evidenciaEditando,
        error: null,
      }));
    },
    [revocarPreviewUrl],
  );

  const reemplazarEvidencia = useCallback(
    (
      id: string,
      resultado: Pick<ResultadoProcesamientoFotografia, "archivo" | "estado" | "dimensiones">,
      recortada = false,
    ) => {
      if (!mountedRef.current) return;

      const previewUrl = URL.createObjectURL(resultado.archivo);
      previewUrlsRef.current.add(previewUrl);
      setDraft((actual) => {
        const evidencia = actual.evidencias.find((item) => item.id === id);
        if (!evidencia) {
          revocarPreviewUrl(previewUrl);
          return actual;
        }
        revocarPreviewUrl(evidencia.previewUrl);
        const metadatos = actualizarMetadatosEvidencia(evidencia, resultado, recortada);
        return {
          ...actual,
          evidencias: actual.evidencias.map((item) =>
            item.id === id ? { ...item, ...metadatos, previewUrl } : item,
          ),
        };
      });
      setUi((actual) => ({ ...actual, evidenciaEditando: null, error: null }));
    },
    [revocarPreviewUrl],
  );

  const setSinEvidencia = useCallback((sinEvidencia: SinEvidencia | null) => {
    setDraft((actual) => ({ ...actual, sinEvidencia }));
    setUi((actual) => ({ ...actual, error: null }));
  }, []);

  const setStep = useCallback((step: ReporteStep) => {
    setUi((actual) => ({ ...actual, step, error: null }));
  }, []);

  const validarPaso = useCallback(
    (step: ReporteStep) => {
      if (step === "categoria") {
        const opcion = subcategoriaPorId(draft.categoria, draft.subcategoria);
        const descripcionValida = !opcion?.requiresDescription || Boolean(draft.descripcion.trim());
        return Boolean(draft.categoria && draft.subcategoria && descripcionValida);
      }
      if (step === "detalle") {
        return Boolean(draft.tipoLugar && draft.territorioId);
      }
      if (step === "ubicacion") {
        return (
          draft.categoria !== "emergencia" ||
          draft.ubicacionEstado === "confirmada" ||
          Boolean(draft.lugar.trim())
        );
      }
      if (step === "evidencias") {
        return (
          !evidenciaObligatoriaPara(draft.categoria) ||
          draft.evidencias.length > 0 ||
          draft.sinEvidencia !== null
        );
      }
      return true;
    },
    [draft],
  );

  const siguientePaso = useCallback(() => {
    if (!validarPaso(ui.step)) {
      setUi((actual) => ({
        ...actual,
        error:
          actual.step === "categoria"
            ? subcategoriaPorId(draft.categoria, draft.subcategoria)?.requiresDescription &&
              !draft.descripcion.trim()
              ? "Cuéntanos qué sucede antes de continuar."
              : "Selecciona una categoría y una subcategoría para continuar."
            : actual.step === "detalle"
              ? "Completa el tipo de lugar y la zona."
              : actual.step === "ubicacion"
                ? "Confirma la ubicación GPS o indica dónde ocurrió el incidente."
                : "Adjunta al menos una evidencia visual o registra por qué no puedes aportarla.",
      }));
      return false;
    }

    const index = STEPS.indexOf(ui.step);
    const next = STEPS[index + 1];
    if (next) setStep(next);
    return true;
  }, [draft.categoria, draft.descripcion, draft.subcategoria, setStep, ui.step, validarPaso]);

  const pasoAnterior = useCallback(() => {
    const index = STEPS.indexOf(ui.step);
    const previous = STEPS[index - 1];
    if (previous) setStep(previous);
  }, [setStep, ui.step]);

  const completarLocalmente = useCallback(() => {
    setStep("confirmacion");
  }, [setStep]);

  const reiniciar = useCallback(() => {
    if (!mountedRef.current) return;
    revocarTodasLasPreview();
    setDraft(createEmptyDraft());
    setUi(createInitialUiState());
  }, [revocarTodasLasPreview]);

  const fotoCount = useMemo(() => contar(draft, "foto"), [draft]);
  const videoCount = useMemo(() => contar(draft, "video"), [draft]);
  const evidenciaObligatoria = evidenciaObligatoriaPara(draft.categoria);

  return {
    draft,
    ui,
    steps: STEPS,
    fotoCount,
    videoCount,
    evidenciaObligatoria,
    updateDraft,
    elegirCategoria,
    elegirSubcategoria,
    agregarEvidencias,
    quitarEvidencia,
    reemplazarEvidencia,
    setSinEvidencia,
    setStep,
    siguientePaso,
    pasoAnterior,
    completarLocalmente,
    reiniciar,
    validarPaso,
    setUi,
  };
}
