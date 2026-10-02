import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, Construction } from "lucide-react";
import { AppShell } from "@/components/app-shell";

export const Route = createFileRoute("/mapa")({
  head: () => ({
    meta: [
      { title: "Mapa · AlertaVereda" },
      {
        name: "description",
        content: "El mapa comunitario de AlertaVereda está en construcción.",
      },
    ],
  }),
  component: MapaEnConstruccion,
});

function MapaEnConstruccion() {
  return (
    <AppShell>
      <section className="mapa-construccion" aria-labelledby="mapa-titulo">
        <div className="mapa-construccion-icon" aria-hidden="true">
          <Construction size={30} strokeWidth={1.8} />
        </div>
        <p className="eyebrow">Mapa comunitario</p>
        <h1 id="mapa-titulo">Estamos preparando este lugar</h1>
        <p>
          El mapa de las veredas de Ebéjico está en construcción. Por ahora puedes consultar la
          cartelera o volver al inicio para reportar algo de tu vereda.
        </p>
        <Link to="/" className="mapa-construccion-back">
          <ArrowLeft size={16} aria-hidden="true" />
          Volver al inicio
        </Link>
      </section>
    </AppShell>
  );
}
