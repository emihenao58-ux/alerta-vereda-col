import { createFileRoute } from "@tanstack/react-router";
import {
  ChevronRight,
  Clock3,
  FileText,
  Heart,
  HeartHandshake,
  Info,
  Leaf,
  LockKeyhole,
  Megaphone,
  MessageCircle,
  ShieldCheck,
  Target,
  UsersRound,
} from "lucide-react";
import { toast } from "sonner";
import { AppShell } from "@/components/app-shell";
import { ModuleSectionHeading } from "@/components/module-section-heading";

export const Route = createFileRoute("/acerca-de")({
  component: AcercaDePage,
});

const VALORES = [
  {
    titulo: "Servicio a la comunidad",
    descripcion:
      "Trabajamos de manera desinteresada, buscando aportar al bienestar de nuestras comunidades.",
    Icono: HeartHandshake,
  },
  {
    titulo: "Participación",
    descripcion:
      "Cada comunidad merece ser escuchada y tener un espacio para compartir lo que sucede.",
    Icono: UsersRound,
  },
  {
    titulo: "Escucha y respeto",
    descripcion:
      "Valoramos las necesidades, opiniones y experiencias de quienes viven en las veredas.",
    Icono: MessageCircle,
  },
  {
    titulo: "Oportunidad",
    descripcion: "Buscamos que la información importante pueda conocerse a tiempo.",
    Icono: Clock3,
  },
  {
    titulo: "Solidaridad",
    descripcion:
      "Creemos que ayudarnos y mantenernos informados nos hace una comunidad más fuerte.",
    Icono: Heart,
  },
] as const;

const INFORMACION_LEGAL = [
  { titulo: "Política de privacidad", Icono: LockKeyhole },
  { titulo: "Términos y condiciones", Icono: FileText },
  { titulo: "Tratamiento de datos personales", Icono: ShieldCheck },
] as const;

const AVISO_LEGAL =
  "Esta información estará disponible próximamente. Estamos trabajando para ofrecerte información clara y completa.";
const AVISO_OPINION = "Esta opción estará disponible próximamente.";

function AcercaDePage() {
  return (
    <AppShell>
      <section className="acerca-de-page" aria-labelledby="m4-section-heading-title">
        <ModuleSectionHeading title="Acerca de AlertaVereda" />

        <header className="acerca-de-identity">
          <img
            className="acerca-de-logo"
            src="/images/branding/alertavereda-icono.png"
            alt=""
            width={88}
            height={88}
          />
          <div className="acerca-de-identity-copy">
            <p className="acerca-de-identity-eyebrow">Nuestra comunidad</p>
            <h2>AlertaVereda</h2>
            <p className="acerca-de-tagline">
              «Vivir lejos no debería significar estar desinformado».
            </p>
          </div>
        </header>

        <div className="acerca-de-overview-grid">
          <article className="acerca-de-panel">
            <div className="acerca-de-panel-heading">
              <span className="acerca-de-icon-badge" aria-hidden="true">
                <Leaf size={22} />
              </span>
              <h2>¿Qué es AlertaVereda?</h2>
            </div>
            <p>
              AlertaVereda es una plataforma comunitaria creada para las veredas rurales de Ebéjico,
              Antioquia. Permite consultar información y comunicar situaciones importantes de manera
              sencilla y oportuna, para que las comunidades puedan conocer lo que sucede a su
              alrededor.
            </p>
          </article>

          <article className="acerca-de-panel">
            <div className="acerca-de-panel-heading">
              <span className="acerca-de-icon-badge" aria-hidden="true">
                <Target size={22} />
              </span>
              <h2>Nuestro propósito</h2>
            </div>
            <p>
              Acercar la información a nuestras comunidades y facilitar la comunicación sobre
              emergencias, problemas en las vías, servicios y avisos importantes. Queremos que todas
              las personas puedan conocer lo que sucede en las veredas y participar compartiendo
              información.
            </p>
          </article>
        </div>

        <article className="acerca-de-panel acerca-de-origin">
          <div className="acerca-de-panel-heading">
            <span className="acerca-de-icon-badge" aria-hidden="true">
              <Megaphone size={22} />
            </span>
            <h2>¿Por qué nace AlertaVereda?</h2>
          </div>
          <div className="acerca-de-copy-stack">
            <p>
              AlertaVereda nace al reconocer que muchas comunidades rurales no reciben la
              información con la misma rapidez que otros lugares. Las distancias y las dificultades
              de comunicación pueden hacer que una emergencia o una situación importante tarde en
              conocerse.
            </p>
            <p>
              Creemos que vivir lejos no debería significar estar desinformado. Por eso queremos
              acercar a las comunidades y facilitar que lo que sucede en cada vereda pueda conocerse
              oportunamente.
            </p>
          </div>
        </article>

        <section className="acerca-de-values" aria-labelledby="acerca-de-values-title">
          <div className="acerca-de-section-heading">
            <span className="acerca-de-icon-badge" aria-hidden="true">
              <HeartHandshake size={22} />
            </span>
            <div>
              <h2 id="acerca-de-values-title">Nuestros valores</h2>
              <p>La forma en que queremos acompañar a nuestras comunidades.</p>
            </div>
          </div>
          <ul className="acerca-de-values-grid">
            {VALORES.map(({ titulo, descripcion, Icono }) => (
              <li className="acerca-de-value" key={titulo}>
                <Icono size={21} aria-hidden="true" />
                <div>
                  <h3>{titulo}</h3>
                  <p>{descripcion}</p>
                </div>
              </li>
            ))}
          </ul>
        </section>

        <section className="acerca-de-commitment" aria-labelledby="acerca-de-commitment-title">
          <div className="acerca-de-commitment-icon" aria-hidden="true">
            <HeartHandshake size={27} />
          </div>
          <div>
            <h2 id="acerca-de-commitment-title">Una comunidad más conectada</h2>
            <p className="acerca-de-commitment-quote">
              «Queremos que ninguna vereda se sienta olvidada».
            </p>
            <p>
              AlertaVereda está al servicio de la comunidad. Queremos dar más voz a quienes muchas
              veces no son escuchados y acercar la información a los lugares donde también hace
              falta.
            </p>
          </div>
        </section>

        <section
          className="acerca-de-panel acerca-de-app-info"
          aria-labelledby="acerca-de-app-info-title"
        >
          <div className="acerca-de-panel-heading">
            <span className="acerca-de-icon-badge" aria-hidden="true">
              <Info size={22} />
            </span>
            <h2 id="acerca-de-app-info-title">Información de la aplicación</h2>
          </div>
          <dl className="acerca-de-app-details">
            <div>
              <dt>Nombre de la aplicación</dt>
              <dd>AlertaVereda</dd>
            </div>
            <div>
              <dt>Tipo de plataforma</dt>
              <dd>Información y comunicación comunitaria</dd>
            </div>
            <div>
              <dt>Alcance</dt>
              <dd>Comunidades rurales</dd>
            </div>
            <div>
              <dt>Disponibilidad</dt>
              <dd>En desarrollo</dd>
            </div>
            <div>
              <dt>Creador</dt>
              <dd>Emiliano Henao</dd>
            </div>
          </dl>
        </section>

        <section className="acerca-de-legal" aria-labelledby="acerca-de-legal-title">
          <div className="acerca-de-section-heading">
            <span className="acerca-de-icon-badge" aria-hidden="true">
              <Info size={22} />
            </span>
            <h2 id="acerca-de-legal-title">Información legal</h2>
          </div>
          <div className="acerca-de-legal-list">
            {INFORMACION_LEGAL.map(({ titulo, Icono }) => (
              <button
                className="acerca-de-action-button"
                key={titulo}
                type="button"
                onClick={() => toast.info(AVISO_LEGAL, { duration: 4000 })}
              >
                <Icono size={21} aria-hidden="true" />
                <span>{titulo}</span>
                <ChevronRight size={20} aria-hidden="true" />
              </button>
            ))}
          </div>
        </section>

        <section className="acerca-de-panel" aria-labelledby="acerca-de-opinion-title">
          <div className="acerca-de-panel-heading">
            <span className="acerca-de-icon-badge" aria-hidden="true">
              <MessageCircle size={22} />
            </span>
            <h2 id="acerca-de-opinion-title">¿Qué opinas de AlertaVereda?</h2>
          </div>
          <p>
            Tu opinión nos ayuda a mejorar. Cuéntanos qué piensas sobre el proyecto y cómo podemos
            hacerlo más útil para las comunidades.
          </p>
          <button
            className="acerca-de-action-button acerca-de-help-button"
            type="button"
            onClick={() => toast.info(AVISO_OPINION, { duration: 3500 })}
          >
            <span>Compartir mi opinión</span>
            <ChevronRight size={20} aria-hidden="true" />
          </button>
        </section>
      </section>
    </AppShell>
  );
}
