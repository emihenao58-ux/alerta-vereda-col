import type { CSSProperties } from "react";
import { ArrowLeft, ArrowRight, ShieldAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  CATEGORIAS,
  categoriaConfig,
  subcategoriaPorId,
  subcategoriasDe,
} from "@/lib/reportar/catalogo";
import type { ReporteCategoria, ReporteSubcategoriaSeleccion } from "@/lib/reportar/types";
import { ReportarStepActions, ReportarStepShell } from "@/components/reportar/reportar-step-shell";

export function ReportarCategoryStep({
  categoria,
  subcategoria,
  subcategoriaPadre,
  descripcion,
  error,
  onCategoria,
  onSubcategoria,
  onDescripcion,
  onNext,
}: {
  categoria: ReporteCategoria | null;
  subcategoria: string | null;
  subcategoriaPadre: string | null;
  descripcion: string;
  error: string | null;
  onCategoria: (categoria: ReporteCategoria) => void;
  onSubcategoria: (selection: ReporteSubcategoriaSeleccion) => void;
  onDescripcion: (descripcion: string) => void;
  onNext: () => void;
}) {
  const config = categoriaConfig(categoria);
  const opcionesRaiz = subcategoriasDe(categoria);
  const opcionPadre = subcategoriaPorId(categoria, subcategoriaPadre);
  const opcionesVisibles = opcionPadre?.children ?? opcionesRaiz;
  const opcionSeleccionada = subcategoriaPorId(categoria, subcategoria);

  const seleccionarOpcion = (id: string, tieneHijos: boolean) => {
    onSubcategoria({ id: tieneHijos ? null : id, parentId: tieneHijos ? id : subcategoriaPadre });
  };

  const volverAOpcionesPrincipales = () => {
    onSubcategoria({ id: null, parentId: null });
  };

  return (
    <ReportarStepShell
      eyebrow="Paso 1 · Tipo de novedad"
      title="¿Qué quieres contarle a la comunidad?"
      description="Primero elige una categoría. Después toca la opción que mejor describa lo que está pasando."
    >
      <div className="reportar-category-grid" role="radiogroup" aria-label="Categoría del reporte">
        {CATEGORIAS.map(({ value, label, description, color, textColor, Icon }) => (
          <button
            key={value}
            type="button"
            className={`reportar-category-option ${categoria === value ? "is-selected" : ""}`}
            style={
              {
                "--reportar-accent": color,
                "--reportar-card-text": textColor,
              } as CSSProperties
            }
            onClick={() => onCategoria(value)}
            role="radio"
            aria-checked={categoria === value}
          >
            <span className="reportar-category-option-inner">
              <span className="reportar-category-icon" aria-hidden="true">
                <Icon
                  size={48}
                  strokeWidth={1.8}
                  fill="currentColor"
                  stroke="var(--icon-cutout)"
                  style={{ "--icon-cutout": color } as CSSProperties}
                />
              </span>
              <span className="reportar-category-copy">
                <strong>{label}</strong>
                <small>{description}</small>
              </span>
              <ArrowRight className="reportar-category-arrow" size={24} aria-hidden="true" />
            </span>
          </button>
        ))}
      </div>

      {config && (
        <div className="reportar-subcategory-block" aria-labelledby="reportar-subcategory-title">
          <div className="reportar-subcategory-heading">
            <div>
              <span className="reportar-field-kicker">
                {opcionPadre ? "Ahora elige el problema" : "Ahora elige una opción"}
              </span>
              <h3 id="reportar-subcategory-title">
                {opcionPadre ? `¿Qué ocurre con ${opcionPadre.label}?` : "¿Qué pasó exactamente?"}
              </h3>
            </div>
            <span className="reportar-subcategory-count">{opcionesVisibles.length} opciones</span>
          </div>

          {opcionPadre && (
            <div className="reportar-subcategory-breadcrumb">
              <span>Dentro de</span>
              <strong>{opcionPadre.label}</strong>
              <button
                type="button"
                className="reportar-text-button"
                onClick={volverAOpcionesPrincipales}
              >
                <ArrowLeft size={14} /> Cambiar opción principal
              </button>
            </div>
          )}

          <div
            className="reportar-subcategory-grid"
            role="radiogroup"
            aria-label={`Opciones de ${opcionPadre?.label ?? config.label}`}
          >
            {opcionesVisibles.map((opcion) => {
              const tieneHijos = Boolean(opcion.children?.length);
              const seleccionado = tieneHijos
                ? subcategoriaPadre === opcion.id
                : subcategoria === opcion.id;
              return (
                <button
                  key={opcion.id}
                  type="button"
                  className={`reportar-subcategory-option ${seleccionado ? "is-selected" : ""}`}
                  style={{ "--reportar-accent": config.color } as CSSProperties}
                  onClick={() => seleccionarOpcion(opcion.id, tieneHijos)}
                  role="radio"
                  aria-checked={seleccionado}
                >
                  <span className="reportar-subcategory-icon" aria-hidden="true">
                    <opcion.Icon
                      size={27}
                      strokeWidth={1.9}
                      className={
                        opcion.id === "no_hay_senal"
                          ? "reportar-signal-no-coverage-icon"
                          : opcion.id === "senal_debil"
                            ? "reportar-signal-weak-icon"
                            : undefined
                      }
                    />
                  </span>
                  <span>{opcion.label}</span>
                  {tieneHijos && <ArrowRight size={18} aria-hidden="true" />}
                </button>
              );
            })}
          </div>

          <div
            className={`reportar-description-reveal ${opcionSeleccionada?.requiresDescription ? "is-visible" : ""}`}
            aria-hidden={!opcionSeleccionada?.requiresDescription}
          >
            <label className="reportar-field" htmlFor="reportar-other-description">
              <span>Cuéntanos qué sucede</span>
              <textarea
                id="reportar-other-description"
                className="reportar-input reportar-textarea"
                rows={3}
                value={descripcion}
                onChange={(event) => onDescripcion(event.target.value)}
                placeholder="Escribe aquí lo que está pasando…"
                aria-required={opcionSeleccionada?.requiresDescription === true}
                tabIndex={opcionSeleccionada?.requiresDescription ? 0 : -1}
              />
            </label>
          </div>

          {opcionSeleccionada?.notice && (
            <div className="reportar-option-notice" role="alert">
              <ShieldAlert size={19} aria-hidden="true" />
              <span>{opcionSeleccionada.notice}</span>
            </div>
          )}

          <small className="reportar-help">
            Catálogo visual local del frontend; se revisará en PR #15.
          </small>
        </div>
      )}

      {error && (
        <p className="reportar-error" role="alert">
          {error}
        </p>
      )}

      <ReportarStepActions>
        <Button type="button" onClick={onNext} disabled={!categoria || !subcategoria}>
          Continuar
        </Button>
      </ReportarStepActions>
    </ReportarStepShell>
  );
}
