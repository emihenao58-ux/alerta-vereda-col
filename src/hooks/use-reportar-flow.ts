import { useCallback, useEffect, useMemo, useState } from "react";
import { useRef } from "react";
import { fotoObligatoriaPara } from "@/lib/reportar/catalogo";
import {
  createEmptyDraft,
  createInitialUiState,
  type ReporteDraft,
  type ReporteEvidencia,
  type ReporteStep,
  type ReportarUiState,
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
  const evidenciasRef = useRef<ReporteEvidencia[]>([]);

  const updateDraft = useCallback((patch: Partial<ReporteDraft>) => {
    setDraft((actual) => ({ ...actual, ...patch }));
    setUi((actual) => ({ ...actual, error: null }));
  }, []);

  const elegirCategoria = useCallback((categoria: ReporteDraft["categoria"]) => {
    setDraft((actual) => ({
      ...actual,
      categoria,
      subcategoria: null,
      sinEvidencia: null,
    }));
    setUi((actual) => ({ ...actual, error: null }));
  }, []);

  const agregarEvidencias = useCallback((nuevas: readonly ReporteEvidencia[]) => {
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
        .forEach((evidencia) => URL.revokeObjectURL(evidencia.previewUrl));
      return { ...actual, evidencias: [...actual.evidencias, ...aceptadas], sinEvidencia: null };
    });
    setUi((actual) => ({ ...actual, error: null }));
    return agregadas;
  }, []);

  const quitarEvidencia = useCallback((id: string) => {
    setDraft((actual) => {
      const evidencia = actual.evidencias.find((item) => item.id === id);
      if (evidencia) URL.revokeObjectURL(evidencia.previewUrl);
      return { ...actual, evidencias: actual.evidencias.filter((item) => item.id !== id) };
    });
    setUi((actual) => ({
      ...actual,
      evidenciaEditando: actual.evidenciaEditando === id ? null : actual.evidenciaEditando,
      error: null,
    }));
  }, []);

  const reemplazarEvidencia = useCallback((id: string, archivo: File, recortada = false) => {
    const previewUrl = URL.createObjectURL(archivo);
    setDraft((actual) => {
      const evidencia = actual.evidencias.find((item) => item.id === id);
      if (!evidencia) {
        URL.revokeObjectURL(previewUrl);
        return actual;
      }
      URL.revokeObjectURL(evidencia.previewUrl);
      return {
        ...actual,
        evidencias: actual.evidencias.map((item) =>
          item.id === id ? { ...item, archivo, previewUrl, recortada } : item,
        ),
      };
    });
    setUi((actual) => ({ ...actual, evidenciaEditando: null, error: null }));
  }, []);

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
        return Boolean(draft.categoria && draft.subcategoria);
      }
      if (step === "detalle") {
        return Boolean(draft.veredaId && draft.descripcion.trim() && draft.lugar.trim());
      }
      if (step === "evidencias") {
        const fotoCount = contar(draft, "foto");
        return (
          !fotoObligatoriaPara(draft.categoria) || fotoCount > 0 || draft.sinEvidencia !== null
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
            ? "Selecciona una categoría y una subcategoría para continuar."
            : actual.step === "detalle"
              ? "Completa la comunidad, qué pasó y dónde ocurrió."
              : "Adjunta una foto o registra por qué no puedes hacerlo.",
      }));
      return false;
    }

    const index = STEPS.indexOf(ui.step);
    const next = STEPS[index + 1];
    if (next) setStep(next);
    return true;
  }, [setStep, ui.step, validarPaso]);

  const pasoAnterior = useCallback(() => {
    const index = STEPS.indexOf(ui.step);
    const previous = STEPS[index - 1];
    if (previous) setStep(previous);
  }, [setStep, ui.step]);

  const completarLocalmente = useCallback(() => {
    setStep("confirmacion");
  }, [setStep]);

  const reiniciar = useCallback(() => {
    setDraft((actual) => {
      actual.evidencias.forEach((evidencia) => URL.revokeObjectURL(evidencia.previewUrl));
      return createEmptyDraft();
    });
    setUi(createInitialUiState());
  }, []);

  useEffect(() => {
    evidenciasRef.current = draft.evidencias;
  }, [draft.evidencias]);

  useEffect(() => {
    return () => {
      evidenciasRef.current.forEach((evidencia) => URL.revokeObjectURL(evidencia.previewUrl));
    };
  }, []);

  const fotoCount = useMemo(() => contar(draft, "foto"), [draft]);
  const videoCount = useMemo(() => contar(draft, "video"), [draft]);
  const fotoObligatoria = fotoObligatoriaPara(draft.categoria);

  return {
    draft,
    ui,
    steps: STEPS,
    fotoCount,
    videoCount,
    fotoObligatoria,
    updateDraft,
    elegirCategoria,
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
