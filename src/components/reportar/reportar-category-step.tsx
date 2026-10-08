import type { CSSProperties } from "react";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CATEGORIAS, categoriaConfig, subcategoriasDe } from "@/lib/reportar/catalogo";
import type { ReporteCategoria } from "@/lib/reportar/types";
import { ReportarStepActions, ReportarStepShell } from "@/components/reportar/reportar-step-shell";

export function ReportarCategoryStep({
  categoria,
  subcategoria,
  error,
  onCategoria,
  onSubcategoria,
  onNext,
}: {
  categoria: ReporteCategoria | null;
  subcategoria: string | null;
  error: string | null;
  onCategoria: (categoria: ReporteCategoria) => void;
  onSubcategoria: (subcategoria: string) => void;
  onNext: () => void;
}) {
  const config = categoriaConfig(categoria);
  const subcategorias = subcategoriasDe(categoria);

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
              <span className="reportar-field-kicker">Ahora elige una opción</span>
              <h3 id="reportar-subcategory-title">¿Qué pasó exactamente?</h3>
            </div>
            <span className="reportar-subcategory-count">{subcategorias.length} opciones</span>
          </div>
          <div
            className="reportar-subcategory-grid"
            role="radiogroup"
            aria-label={`Subcategoría de ${config.label}`}
          >
            {subcategorias.map(({ id, label, Icon }) => (
              <button
                key={id}
                type="button"
                className={`reportar-subcategory-option ${subcategoria === id ? "is-selected" : ""}`}
                style={{ "--reportar-accent": config.color } as CSSProperties}
                onClick={() => onSubcategoria(id)}
                role="radio"
                aria-checked={subcategoria === id}
              >
                <span className="reportar-subcategory-icon" aria-hidden="true">
                  <Icon size={27} strokeWidth={1.9} />
                </span>
                <span>{label}</span>
              </button>
            ))}
          </div>
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
