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
      description="Elige la categoría que mejor describe lo que está pasando. Luego podrás precisar el tipo de situación."
    >
      <div className="reportar-category-grid" role="radiogroup" aria-label="Categoría del reporte">
        {CATEGORIAS.map(({ value, label, description, color, Icon }) => (
          <button
            key={value}
            type="button"
            className={`reportar-category-option ${categoria === value ? "is-selected" : ""}`}
            style={{ "--reportar-accent": color } as React.CSSProperties}
            onClick={() => onCategoria(value)}
            role="radio"
            aria-checked={categoria === value}
          >
            <span className="reportar-category-icon" aria-hidden="true">
              <Icon size={22} strokeWidth={2} />
            </span>
            <span>
              <strong>{label}</strong>
              <small>{description}</small>
            </span>
          </button>
        ))}
      </div>

      {config && (
        <label className="reportar-field">
          <span>Subcategoría</span>
          <select
            value={subcategoria ?? ""}
            onChange={(event) => onSubcategoria(event.target.value)}
            className="reportar-input"
          >
            <option value="">Selecciona una opción…</option>
            {subcategorias.map((item) => (
              <option key={item.id} value={item.id}>
                {item.label}
              </option>
            ))}
          </select>
          <small className="reportar-help">
            Catálogo provisional del frontend; se revisará en PR #15.
          </small>
        </label>
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
