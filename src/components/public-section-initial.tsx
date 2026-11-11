import { Link } from "@tanstack/react-router";
import { ArrowRight } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { ModuleSectionHeading } from "@/components/module-section-heading";

type PublicSectionInitialProps = {
  title: string;
  description: string;
  message: string;
  administrativeEntry?: boolean;
};

export function PublicSectionInitial({
  title,
  description,
  message,
  administrativeEntry = false,
}: PublicSectionInitialProps) {
  return (
    <AppShell>
      <section className="public-section-initial" aria-labelledby="m4-section-heading-title">
        <ModuleSectionHeading title={title} eyebrow="AlertaVereda" description={description} />

        <div className="public-section-initial-panel">
          <p>{message}</p>
          {administrativeEntry && (
            <Link to="/auth" className="public-section-auth-link">
              Continuar al acceso administrativo
              <ArrowRight size={17} aria-hidden="true" />
            </Link>
          )}
        </div>
      </section>
    </AppShell>
  );
}
