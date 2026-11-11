import * as DialogPrimitive from "@radix-ui/react-dialog";
import { ArrowLeft, Check, Info, ShieldCheck, X } from "lucide-react";

type AdminPublicationWarningDialogProps = {
  open: boolean;
  noMostrarDuranteEstaSesion: boolean;
  onNoMostrarDuranteEstaSesion: (checked: boolean) => void;
  onVolver: () => void;
  onConfirmar: () => void;
};

export function AdminPublicationWarningDialog({
  open,
  noMostrarDuranteEstaSesion,
  onNoMostrarDuranteEstaSesion,
  onVolver,
  onConfirmar,
}: AdminPublicationWarningDialogProps) {
  return (
    <DialogPrimitive.Root
      open={open}
      onOpenChange={(nextOpen) => {
        if (!nextOpen) onVolver();
      }}
    >
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className="admin-report-publication-overlay" />
        <DialogPrimitive.Content className="admin-report-publication-dialog">
          <header className="admin-report-publication-header">
            <span className="admin-report-publication-shield" aria-hidden="true">
              <ShieldCheck size={42} strokeWidth={1.8} />
            </span>
            <DialogPrimitive.Title className="admin-report-publication-title">
              Publicación de reporte administrativo.
            </DialogPrimitive.Title>
            <DialogPrimitive.Close
              className="admin-report-publication-close"
              type="button"
              aria-label="Cerrar aviso y volver a revisar el reporte"
            >
              <X size={25} aria-hidden="true" />
            </DialogPrimitive.Close>
          </header>

          <div className="admin-report-publication-divider" aria-hidden="true" />

          <DialogPrimitive.Description asChild>
            <div className="admin-report-publication-message">
              <span className="admin-report-publication-info" aria-hidden="true">
                <Info size={26} strokeWidth={2.7} />
              </span>
              <div className="admin-report-publication-copy">
                <p>
                  Los reportes enviados desde tu cuenta de administrador se publicarán directamente
                  en <strong>AlertaVereda</strong>, sin pasar por el proceso habitual de revisión y
                  verificación ciudadana.
                </p>
                <p>
                  Asegúrate de que la información sea verdadera, precisa y corresponda a la
                  situación reportada.
                </p>
                <p className="admin-report-publication-local-note">
                  En esta versión, confirmar solo prepara el reporte en este dispositivo; todavía no
                  se envía ni se publica.
                </p>
              </div>
            </div>
          </DialogPrimitive.Description>

          <div className="admin-report-publication-divider" aria-hidden="true" />

          <label className="admin-report-publication-skip">
            <input
              type="checkbox"
              checked={noMostrarDuranteEstaSesion}
              onChange={(event) => onNoMostrarDuranteEstaSesion(event.target.checked)}
            />
            <span>No volver a mostrar este mensaje</span>
          </label>

          <footer className="admin-report-publication-actions">
            <button
              className="admin-report-publication-button admin-report-publication-back"
              type="button"
              onClick={onVolver}
            >
              <ArrowLeft size={22} strokeWidth={2.5} aria-hidden="true" />
              Volver
            </button>
            <button
              className="admin-report-publication-button admin-report-publication-confirm"
              type="button"
              onClick={onConfirmar}
            >
              <Check size={22} strokeWidth={3} aria-hidden="true" />
              Confirmar
            </button>
          </footer>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}
