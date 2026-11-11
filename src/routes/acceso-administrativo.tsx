import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Info, LockKeyhole, ShieldCheck } from "lucide-react";
import { useEffect, useRef, useState, type KeyboardEvent } from "react";
import { toast } from "sonner";
import { AppShell } from "@/components/app-shell";
import { ModuleSectionHeading } from "@/components/module-section-heading";
import { AdminAccessOptionsPanel } from "@/components/admin/admin-access-options-panel";

export const Route = createFileRoute("/acceso-administrativo")({
  component: AccesoAdministrativoPage,
});

const PREFERENCIA_OMITIR_AVISO = "alertavereda:acceso-administrativo:no-mostrar-aviso";

type PantallaAcceso = "cargando" | "aviso" | "opciones";

function leerPreferenciaOmitirAviso() {
  try {
    return window.localStorage.getItem(PREFERENCIA_OMITIR_AVISO) === "1";
  } catch {
    return false;
  }
}

function AccesoAdministrativoPage() {
  const navigate = useNavigate();
  const continuarRef = useRef<HTMLButtonElement>(null);
  const contenidoRef = useRef<HTMLElement>(null);
  const enfocarOpcionesRef = useRef(false);
  const [pantalla, setPantalla] = useState<PantallaAcceso>("cargando");
  const [noMostrarAviso, setNoMostrarAviso] = useState(false);

  useEffect(() => {
    const omitirAviso = leerPreferenciaOmitirAviso();
    setNoMostrarAviso(omitirAviso);
    setPantalla(omitirAviso ? "opciones" : "aviso");
  }, []);

  useEffect(() => {
    if (pantalla === "aviso") {
      continuarRef.current?.focus({ preventScroll: true });
      return;
    }

    if (pantalla === "opciones" && enfocarOpcionesRef.current) {
      enfocarOpcionesRef.current = false;
      contenidoRef.current
        ?.querySelector<HTMLElement>(".admin-access-card-action")
        ?.focus({ preventScroll: true });
    }
  }, [pantalla]);

  function actualizarPreferencia(omitir: boolean) {
    try {
      if (omitir) {
        window.localStorage.setItem(PREFERENCIA_OMITIR_AVISO, "1");
      } else {
        window.localStorage.removeItem(PREFERENCIA_OMITIR_AVISO);
      }
      setNoMostrarAviso(omitir);
    } catch {
      toast.error("No se pudo guardar esta preferencia en este dispositivo.");
    }
  }

  function confinarTabulacion(event: KeyboardEvent<HTMLDivElement>) {
    if (event.key !== "Tab") return;
    const elementos = Array.from(
      event.currentTarget.querySelectorAll<HTMLElement>(
        'button:not([disabled]), input:not([disabled]), a[href], [tabindex]:not([tabindex="-1"])',
      ),
    ).filter((elemento) => !elemento.hasAttribute("hidden"));
    const primero = elementos[0];
    const ultimo = elementos.at(-1);
    if (!primero || !ultimo) return;

    if (event.shiftKey && document.activeElement === primero) {
      event.preventDefault();
      ultimo.focus();
    } else if (!event.shiftKey && document.activeElement === ultimo) {
      event.preventDefault();
      primero.focus();
    }
  }

  const mostrarAviso = pantalla === "aviso";

  return (
    <>
      <div
        className="admin-access-background"
        inert={mostrarAviso}
        aria-hidden={mostrarAviso ? true : undefined}
      >
        <AppShell>
          <section
            ref={contenidoRef}
            className="admin-access-page"
            aria-labelledby="m4-section-heading-title"
          >
            {pantalla === "cargando" ? (
              <p className="admin-access-loading" role="status" aria-live="polite">
                Preparando el acceso…
              </p>
            ) : mostrarAviso ? (
              <ModuleSectionHeading title="Acceso administrativo" eyebrow="AlertaVereda" />
            ) : (
              <AdminAccessOptionsPanel onBack={() => void navigate({ to: "/" })} />
            )}
          </section>
        </AppShell>
      </div>

      {mostrarAviso && (
        <div
          className="admin-access-warning-overlay"
          role="dialog"
          aria-modal="true"
          aria-labelledby="admin-access-warning-title"
          aria-describedby="admin-access-warning-description admin-access-warning-public"
          onKeyDown={confinarTabulacion}
        >
          <section className="admin-access-warning-card">
            <div className="admin-access-warning-shield" aria-hidden="true">
              <ShieldCheck
                className="admin-access-warning-shield-outline"
                size={76}
                strokeWidth={1.8}
              />
              <span className="admin-access-warning-lock-badge">
                <LockKeyhole className="admin-access-warning-lock" size={17} strokeWidth={2.2} />
              </span>
            </div>

            <h2 id="admin-access-warning-title">Área administrativa</h2>
            <p className="admin-access-restricted-label">
              <ShieldCheck size={17} aria-hidden="true" />
              Acceso restringido
            </p>

            <p id="admin-access-warning-description" className="admin-access-warning-copy">
              Este espacio es exclusivo para administradores autorizados
            </p>

            <p id="admin-access-warning-public" className="admin-access-warning-public-copy">
              <Info size={19} aria-hidden="true" />
              <span>Si solo deseas consultar o reportar, regresa a AlertaVereda</span>
            </p>

            <div className="admin-access-warning-actions">
              <button
                ref={continuarRef}
                type="button"
                className="admin-access-warning-button is-primary"
                onClick={() => {
                  enfocarOpcionesRef.current = true;
                  setPantalla("opciones");
                }}
              >
                Continuar
              </button>
              <button
                type="button"
                className="admin-access-warning-button"
                onClick={() => void navigate({ to: "/" })}
              >
                Volver
              </button>
            </div>

            <div className="admin-access-skip-warning">
              <label>
                <input
                  type="checkbox"
                  checked={noMostrarAviso}
                  onChange={(event) => actualizarPreferencia(event.currentTarget.checked)}
                />
                <span>No volver a mostrar este mensaje</span>
              </label>
              <p>Esta preferencia solo omite el aviso; no concede permisos administrativos.</p>
            </div>
          </section>
        </div>
      )}
    </>
  );
}
