import { useMemo, useState } from "react";
import type { CSSProperties } from "react";
import {
  Building2,
  ChevronDown,
  ChevronRight,
  Leaf,
  MapPin,
  RotateCcw,
  Search,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { subcategoriaPorId } from "@/lib/reportar/catalogo";
import {
  buscarVeredas,
  colorDeTerritorio,
  contextoVereda,
  etiquetaTipoLugar,
  hijosDe,
  territorioPorId,
  territoriosDeTipo,
} from "@/lib/reportar/mock-data";
import type { ReporteDraft, TipoLugar } from "@/lib/reportar/types";
import { ReportarStepActions, ReportarStepShell } from "@/components/reportar/reportar-step-shell";

const TIPO_LUGAR_OPTIONS: readonly {
  tipo: TipoLugar;
  label: string;
  description: string;
  Icon: typeof Building2;
}[] = [
  {
    tipo: "corregimiento",
    label: "Corregimiento",
    description: "Selecciona un corregimiento.",
    Icon: Building2,
  },
  {
    tipo: "vereda",
    label: "Vereda",
    description: "Busca tu vereda.",
    Icon: Leaf,
  },
  {
    tipo: "casco_urbano",
    label: "Cabecera municipal",
    description: "Puedes indicar el barrio o sector.",
    Icon: MapPin,
  },
];

const estiloZona = (color: string | null): CSSProperties | undefined =>
  color ? ({ "--reportar-territory-accent": color } as CSSProperties) : undefined;

function nombreTerritorio(id: string | null) {
  return territorioPorId(id)?.nombre ?? null;
}

export function ReportarDetailsStep({
  tipoLugar,
  territorioId,
  territorioPadreId,
  categoria,
  subcategoria,
  descripcion,
  lugar,
  nombre,
  error,
  onChange,
  onBack,
  onNext,
}: {
  tipoLugar: TipoLugar | null;
  territorioId: string | null;
  territorioPadreId: string | null;
  categoria: ReporteDraft["categoria"];
  subcategoria: string | null;
  descripcion: string;
  lugar: string;
  nombre: string;
  error: string | null;
  onChange: (patch: Partial<ReporteDraft>) => void;
  onBack: () => void;
  onNext: () => void;
}) {
  const [veredaQuery, setVeredaQuery] = useState("");
  const [veredasExpandidas, setVeredasExpandidas] = useState(false);
  const territorioSeleccionado = territorioPorId(territorioId);
  const opcionSeleccionada = subcategoriaPorId(categoria, subcategoria);
  const descripcionObligatoria = Boolean(opcionSeleccionada?.requiresDescription);
  const corregimientos = territoriosDeTipo("corregimiento");
  const barrios = hijosDe("cabecera-municipal");
  const resultadosVereda = useMemo(
    () =>
      veredaQuery.trim()
        ? buscarVeredas(veredaQuery)
        : veredasExpandidas
          ? territoriosDeTipo("vereda")
          : buscarVeredas(""),
    [veredaQuery, veredasExpandidas],
  );
  const finalSeleccionado = Boolean(territorioSeleccionado);

  const elegirTipo = (tipo: TipoLugar) => {
    setVeredaQuery("");
    setVeredasExpandidas(false);
    onChange({
      tipoLugar: tipo,
      territorioId: null,
      territorioPadreId: null,
      veredaId: null,
    });
  };

  const limpiarTerritorio = () => {
    setVeredaQuery("");
    setVeredasExpandidas(false);
    onChange({
      tipoLugar: null,
      territorioId: null,
      territorioPadreId: null,
      veredaId: null,
    });
  };

  const elegirCorregimiento = (id: string) => {
    onChange({
      tipoLugar: "corregimiento",
      territorioId: id,
      territorioPadreId: null,
      veredaId: null,
    });
  };

  const elegirVereda = (id: string) => {
    const territorio = territorioPorId(id);
    onChange({
      tipoLugar: "vereda",
      territorioId: id,
      territorioPadreId: territorio?.parentId ?? null,
      veredaId: id,
    });
  };

  const elegirBarrio = (id: string) => {
    onChange({
      tipoLugar: "casco_urbano",
      territorioId: id,
      territorioPadreId: null,
      veredaId: null,
    });
  };

  const elegirCabeceraSinBarrio = () => {
    onChange({
      tipoLugar: "casco_urbano",
      territorioId: "cabecera-municipal",
      territorioPadreId: null,
      veredaId: null,
    });
  };

  return (
    <ReportarStepShell
      eyebrow="Paso 2 · Lugar del reporte"
      title="¿Dónde ocurrió el reporte?"
      description="Primero selecciona el tipo de lugar. Después verás las opciones correspondientes."
    >
      <div className="reportar-territory-block" aria-labelledby="reportar-territory-title">
        <div className="reportar-subcategory-heading">
          <div>
            <span className="reportar-field-kicker">Tipo de lugar</span>
            <h3 id="reportar-territory-title">Elige una zona</h3>
          </div>
          {tipoLugar && (
            <button type="button" className="reportar-text-button" onClick={limpiarTerritorio}>
              <RotateCcw size={14} /> Cambiar
            </button>
          )}
        </div>

        {!tipoLugar && (
          <div className="reportar-location-type-grid" role="radiogroup" aria-label="Tipo de lugar">
            {TIPO_LUGAR_OPTIONS.map(({ tipo, label, description, Icon }) => (
              <button
                key={tipo}
                type="button"
                className="reportar-location-type-option"
                onClick={() => elegirTipo(tipo)}
                role="radio"
                aria-checked={false}
              >
                <span className="reportar-location-type-icon" aria-hidden="true">
                  <Icon size={28} strokeWidth={1.8} />
                </span>
                <span>
                  <strong>{label}</strong>
                  <small>{description}</small>
                </span>
                <ChevronRight size={20} aria-hidden="true" />
              </button>
            ))}
          </div>
        )}

        {tipoLugar === "corregimiento" && !finalSeleccionado && (
          <div className="reportar-territory-options" role="radiogroup" aria-label="Corregimientos">
            {corregimientos.map((territorio) => (
              <button
                key={territorio.id}
                type="button"
                className="reportar-territory-option"
                style={estiloZona(colorDeTerritorio(territorio))}
                onClick={() => elegirCorregimiento(territorio.id)}
              >
                <span>
                  <strong>{territorio.nombre}</strong>
                  <small>Corregimiento</small>
                </span>
                <ChevronRight size={20} aria-hidden="true" />
              </button>
            ))}
          </div>
        )}

        {tipoLugar === "vereda" && !finalSeleccionado && (
          <div className="reportar-vereda-search">
            <label className="reportar-search-label" htmlFor="reportar-vereda-search-input">
              VEREDA
            </label>
            <div className="reportar-search-control">
              <Search size={19} aria-hidden="true" />
              <input
                id="reportar-vereda-search-input"
                className="reportar-input"
                type="search"
                value={veredaQuery}
                onChange={(event) => {
                  setVeredaQuery(event.target.value);
                  setVeredasExpandidas(false);
                }}
                placeholder="Buscar vereda..."
                autoComplete="off"
              />
            </div>
            <p className="reportar-search-hint">
              {veredaQuery.trim()
                ? "Resultados aproximados; no necesitas escribir el nombre exacto."
                : "Escribe una parte del nombre para encontrarla rápidamente."}
            </p>
            <div
              className="reportar-territory-options"
              role="listbox"
              aria-label="Resultados de veredas"
            >
              {resultadosVereda.map((territorio) => {
                const color = colorDeTerritorio(territorio);
                const contexto = contextoVereda(territorio);
                return (
                  <button
                    key={territorio.id}
                    type="button"
                    className="reportar-territory-option"
                    style={estiloZona(color)}
                    onClick={() => elegirVereda(territorio.id)}
                    role="option"
                    aria-label={`${territorio.nombre}. Vereda · ${contexto}`}
                  >
                    <span>
                      <strong>{territorio.nombre}</strong>
                      <small>
                        <Leaf size={13} aria-hidden="true" /> Vereda · {contexto}
                      </small>
                    </span>
                    <ChevronRight size={20} aria-hidden="true" />
                  </button>
                );
              })}
            </div>
            {!veredaQuery.trim() && !veredasExpandidas && (
              <button
                type="button"
                className="reportar-text-button reportar-more-button"
                onClick={() => setVeredasExpandidas(true)}
                aria-expanded={false}
              >
                Ver más <ChevronDown size={17} aria-hidden="true" />
              </button>
            )}
            {resultadosVereda.length === 0 && (
              <p className="reportar-search-empty" role="status">
                No encontramos esa vereda. Prueba con otra parte del nombre.
              </p>
            )}
          </div>
        )}

        {tipoLugar === "casco_urbano" && !finalSeleccionado && (
          <div
            className="reportar-territory-options"
            role="radiogroup"
            aria-label="Barrios de la cabecera municipal"
          >
            <button
              type="button"
              className="reportar-territory-option"
              onClick={elegirCabeceraSinBarrio}
            >
              <span>
                <strong>No sé el barrio / continuar sin especificar</strong>
                <small>El reporte quedará asociado a la cabecera municipal.</small>
              </span>
              <ChevronRight size={20} aria-hidden="true" />
            </button>
            {barrios.map((territorio) => (
              <button
                key={territorio.id}
                type="button"
                className="reportar-territory-option"
                onClick={() => elegirBarrio(territorio.id)}
              >
                <span>
                  <strong>{territorio.nombre}</strong>
                  <small>Barrio o sector</small>
                </span>
                <ChevronRight size={20} aria-hidden="true" />
              </button>
            ))}
          </div>
        )}

        {finalSeleccionado && territorioSeleccionado && (
          <div
            className="reportar-territory-selected"
            style={estiloZona(colorDeTerritorio(territorioSeleccionado))}
            role="status"
          >
            <span className="reportar-location-type-icon" aria-hidden="true">
              {tipoLugar === "vereda" ? <Leaf size={24} /> : <MapPin size={24} />}
            </span>
            <div>
              <span>{etiquetaTipoLugar(tipoLugar)}</span>
              <strong>{territorioSeleccionado.nombre}</strong>
              {tipoLugar === "vereda" ? (
                <small>Vereda · {contextoVereda(territorioSeleccionado)}</small>
              ) : (
                territorioPadreId && <small>{nombreTerritorio(territorioPadreId)}</small>
              )}
            </div>
          </div>
        )}

        <small className="reportar-help">
          Catálogo local del frontend para PR #14; la clasificación definitiva de backend se
          revisará en PR #15.
        </small>
      </div>

      <div className="reportar-form-grid">
        {!descripcionObligatoria && (
          <label className="reportar-field">
            <span>
              ¿Qué está pasando? <em>(opcional)</em>
            </span>
            <textarea
              className="reportar-input reportar-textarea"
              rows={5}
              value={descripcion}
              onChange={(event) => onChange({ descripcion: event.target.value })}
              placeholder="Cuéntanos qué ocurrió…"
            />
          </label>
        )}

        <label className="reportar-field">
          <span>¿Dónde ocurrió exactamente?</span>
          <input
            className="reportar-input"
            value={lugar}
            onChange={(event) => onChange({ lugar: event.target.value })}
            placeholder="Ej.: cerca de la escuela"
          />
        </label>

        <label className="reportar-field">
          <span>
            Tu nombre <em>(opcional)</em>
          </span>
          <input
            className="reportar-input"
            value={nombre}
            onChange={(event) => onChange({ nombre: event.target.value })}
            placeholder="Ej.: María"
          />
        </label>
      </div>

      {error && (
        <p className="reportar-error" role="alert">
          {error}
        </p>
      )}

      <ReportarStepActions>
        <Button type="button" variant="outline" onClick={onBack}>
          Atrás
        </Button>
        <Button type="button" onClick={onNext}>
          Continuar
        </Button>
      </ReportarStepActions>
    </ReportarStepShell>
  );
}
