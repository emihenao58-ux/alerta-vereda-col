import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/app-shell";
import { ReportarFlow } from "@/components/reportar/reportar-flow";

export const Route = createFileRoute("/reportar")({
  head: () => ({
    meta: [
      { title: "Reportar una novedad · AlertaVereda Ebéjico" },
      {
        name: "description",
        content: "Prepara un reporte sobre una novedad en tu comunidad de Ebéjico.",
      },
      {
        property: "og:title",
        content: "Reportar una novedad · AlertaVereda",
      },
      {
        property: "og:description",
        content: "Prepara un reporte sobre una novedad en tu comunidad de Ebéjico.",
      },
    ],
  }),
  component: Reportar,
});

function Reportar() {
  return (
    <AppShell>
      <ReportarFlow />
    </AppShell>
  );
}
