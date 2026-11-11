import { Link } from "@tanstack/react-router";
import { ArrowRight, LogIn, ShieldCheck, UserPlus, UserRound } from "lucide-react";
import { ModuleSectionHeading } from "@/components/module-section-heading";

type AdminAccessMode = "entrar" | "solicitar";

type AdminAccessOptionsPanelProps = {
  onBack: () => void;
  onSelectMode?: (mode: AdminAccessMode) => void;
};

function AccessAction({
  mode,
  label,
  primary = false,
  onSelectMode,
}: {
  mode: AdminAccessMode;
  label: string;
  primary?: boolean;
  onSelectMode?: (mode: AdminAccessMode) => void;
}) {
  const className = `admin-access-card-action${primary ? " is-primary" : ""}`;
  const contents =
    mode === "entrar" ? (
      <>
        <LogIn size={19} strokeWidth={2.2} aria-hidden="true" />
        <span>{label}</span>
      </>
    ) : (
      <>
        <span>{label}</span>
        <ArrowRight size={19} strokeWidth={2.2} aria-hidden="true" />
      </>
    );

  if (onSelectMode) {
    return (
      <button type="button" className={className} onClick={() => onSelectMode(mode)}>
        {contents}
      </button>
    );
  }

  return (
    <Link to="/auth" search={{ mode }} className={className}>
      {contents}
    </Link>
  );
}

export function AdminAccessOptionsPanel({ onBack, onSelectMode }: AdminAccessOptionsPanelProps) {
  return (
    <>
      <ModuleSectionHeading
        title="Acceso a AlertaVereda"
        description="Selecciona cómo deseas continuar."
        onBack={onBack}
      />

      <div className="admin-access-options">
        <section className="admin-access-card" aria-labelledby="admin-access-account-title">
          <div className="admin-access-card-icon" aria-hidden="true">
            <UserRound size={40} strokeWidth={1.8} />
            <span className="admin-access-card-icon-badge">
              <ShieldCheck size={21} strokeWidth={2} />
            </span>
          </div>
          <h2 id="admin-access-account-title">Ya tengo una cuenta</h2>
          <p>Ingresa con tu cuenta para administrar tu vereda.</p>
          <AccessAction
            {...(onSelectMode ? { onSelectMode } : {})}
            mode="entrar"
            label="Iniciar sesión"
            primary
          />
        </section>

        <section className="admin-access-card" aria-labelledby="admin-access-request-title">
          <div className="admin-access-card-icon is-request" aria-hidden="true">
            <UserPlus size={42} strokeWidth={1.8} />
          </div>
          <h2 id="admin-access-request-title">Solicitar acceso</h2>
          <p>Regístrate y solicita autorización para administrar una vereda.</p>
          <AccessAction
            {...(onSelectMode ? { onSelectMode } : {})}
            mode="solicitar"
            label="Solicitar acceso"
          />
        </section>
      </div>

      <p className="admin-access-approval-note">
        <ShieldCheck size={19} strokeWidth={2} aria-hidden="true" />
        <span>
          Registrarte no concede permisos automáticamente. La solicitud queda sujeta a revisión y
          aprobación del Superadmin.
        </span>
      </p>

      <div className="admin-access-public-return">
        <p>¿Solo deseas consultar o reportar?</p>
        <Link to="/">
          Volver a la aplicación pública
          <ArrowRight size={17} aria-hidden="true" />
        </Link>
      </div>
    </>
  );
}
