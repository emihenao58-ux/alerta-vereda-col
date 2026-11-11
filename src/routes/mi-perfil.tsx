import { createFileRoute } from "@tanstack/react-router";
import { Image, Save, UserRound, UsersRound } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { ModuleSectionHeading } from "@/components/module-section-heading";
import { AppShell } from "@/components/app-shell";
import { guardarPerfilLocal, usePerfilLocal } from "@/hooks/use-perfil-local";
import { useAuth } from "@/hooks/use-auth";

export const Route = createFileRoute("/mi-perfil")({
  component: MiPerfilPage,
});

function MiPerfilPage() {
  const auth = useAuth();
  const { perfil: perfilLocal, listo } = usePerfilLocal();
  const [nombre, setNombre] = useState("");
  const [apellido, setApellido] = useState("");
  const [estadoGuardado, setEstadoGuardado] = useState<"exito" | "error" | null>(null);
  const camposEditadosRef = useRef(false);
  const nombreEnReportes = [nombre.trim(), apellido.trim()].filter(Boolean).join(" ");
  const nombreCompletoAdmin = auth.perfil?.nombre?.trim() ?? "";

  useEffect(() => {
    if (!listo || camposEditadosRef.current) return;
    setNombre(perfilLocal?.nombre ?? "");
    setApellido(perfilLocal?.apellido ?? "");
  }, [listo, perfilLocal]);

  const guardar = () => {
    const guardado = guardarPerfilLocal({ nombre, apellido });
    setEstadoGuardado(guardado ? "exito" : "error");
  };

  return (
    <AppShell>
      <section className="mi-perfil-local" aria-labelledby="m4-section-heading-title">
        <ModuleSectionHeading title="Mi perfil" />

        <section className="mi-perfil-local-image-options" aria-label="Imágenes del perfil">
          <section
            className="mi-perfil-local-image-card mi-perfil-local-image-card-public"
            aria-labelledby="mi-perfil-avatar-title"
          >
            <div className="mi-perfil-local-image-copy">
              <div className="mi-perfil-local-image-heading">
                <span className="mi-perfil-local-image-icon" aria-hidden="true">
                  <UsersRound size={17} strokeWidth={2.1} />
                </span>
                <h2 id="mi-perfil-avatar-title">Avatar público de AlertaVereda</h2>
                <span className="mi-perfil-local-image-label">Público</span>
              </div>
              <p>
                Disponible al final del Módulo 4: elige del catálogo AlertaVereda, sin fotos
                personales. Si hay imagen junto a tu nombre en reportes públicos, solo será este
                avatar.
              </p>
            </div>
          </section>

          <section
            className="mi-perfil-local-image-card mi-perfil-local-image-card-private"
            aria-labelledby="mi-perfil-foto-title"
          >
            <div className="mi-perfil-local-image-copy">
              <div className="mi-perfil-local-image-heading">
                <span className="mi-perfil-local-image-icon" aria-hidden="true">
                  <Image size={17} strokeWidth={2.1} />
                </span>
                <h2 id="mi-perfil-foto-title">Fotografía personal privada</h2>
                <span className="mi-perfil-local-image-label">Uso personal local</span>
              </div>
              <p>
                Disponible al final del Módulo 4. Uso personal local: no se publica, comparte,
                adjunta a reportes/evidencias, envía a servidores ni incluye en respaldos. Otras
                personas con acceso al dispositivo podrían verla.
              </p>
            </div>
          </section>
        </section>

        {auth.esAdminVereda ? (
          <div className="mi-perfil-local-fields mi-perfil-admin-identity">
            <div className="mi-perfil-local-field">
              <UserRound
                className="mi-perfil-local-field-icon"
                size={21}
                strokeWidth={2.2}
                aria-hidden="true"
              />
              <div className="mi-perfil-local-field-content">
                <label htmlFor="mi-perfil-nombre-administrativo">Nombre completo</label>
                <input
                  id="mi-perfil-nombre-administrativo"
                  name="nombre-completo-administrativo"
                  type="text"
                  autoComplete="name"
                  value={nombreCompletoAdmin}
                  placeholder={
                    auth.cargandoAcceso ? "Cargando nombre…" : "Nombre no disponible en tu perfil"
                  }
                  readOnly
                  aria-readonly="true"
                />
                <small>Nombre asociado a tu cuenta administrativa. Solo lectura.</small>
              </div>
            </div>
          </div>
        ) : (
          <div className="mi-perfil-local-fields">
            <div className="mi-perfil-local-field">
              <UserRound
                className="mi-perfil-local-field-icon"
                size={21}
                strokeWidth={2.2}
                aria-hidden="true"
              />
              <div className="mi-perfil-local-field-content">
                <label htmlFor="mi-perfil-nombre">
                  Nombre <span aria-hidden="true">*</span>
                  <span className="sr-only"> (obligatorio)</span>
                </label>
                <input
                  id="mi-perfil-nombre"
                  name="nombre"
                  type="text"
                  autoComplete="given-name"
                  required
                  aria-required="true"
                  value={nombre}
                  onChange={(event) => {
                    camposEditadosRef.current = true;
                    setEstadoGuardado(null);
                    setNombre(event.target.value);
                  }}
                />
              </div>
            </div>

            <div className="mi-perfil-local-field">
              <UsersRound
                className="mi-perfil-local-field-icon"
                size={21}
                strokeWidth={2.2}
                aria-hidden="true"
              />
              <div className="mi-perfil-local-field-content">
                <label htmlFor="mi-perfil-apellido">Apellido (opcional)</label>
                <input
                  id="mi-perfil-apellido"
                  name="apellido"
                  type="text"
                  autoComplete="family-name"
                  value={apellido}
                  onChange={(event) => {
                    camposEditadosRef.current = true;
                    setEstadoGuardado(null);
                    setApellido(event.target.value);
                  }}
                />
              </div>
            </div>
          </div>
        )}

        <section className="mi-perfil-local-preview" aria-labelledby="mi-perfil-preview-title">
          <p id="mi-perfil-preview-title">Así aparecerá en tus reportes:</p>
          <div className="mi-perfil-local-preview-name" aria-live="polite" aria-atomic="true">
            {auth.esAdminVereda
              ? nombreCompletoAdmin ||
                (auth.cargandoAcceso
                  ? "Cargando nombre…"
                  : "Nombre no disponible en tu perfil administrativo.")
              : nombreEnReportes || "Escribe tu nombre para ver la vista previa."}
          </div>
        </section>

        {!auth.esAdminVereda && (
          <>
            <button
              className="mi-perfil-local-save"
              type="button"
              onClick={guardar}
              disabled={!listo || !nombre.trim()}
            >
              <Save size={20} strokeWidth={2.3} aria-hidden="true" />
              <span>Guardar cambios</span>
            </button>
            {estadoGuardado && (
              <p
                className={`mi-perfil-save-feedback mi-perfil-save-feedback-${estadoGuardado}`}
                role={estadoGuardado === "error" ? "alert" : "status"}
              >
                {estadoGuardado === "exito"
                  ? "Perfil guardado en este dispositivo."
                  : "No se pudo guardar el perfil en este dispositivo. Inténtalo de nuevo."}
              </p>
            )}
          </>
        )}
      </section>
    </AppShell>
  );
}
