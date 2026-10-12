import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/app-shell";
import { ReportarFlow } from "@/components/reportar/reportar-flow";

export const Route = createFileRoute("/reportar")({
  head: () => ({
    meta: [
      { title: "Reportar una novedad · AlertaVereda Ebéjico" },
      {
        name: "description",
        content:
          "Envía un reporte de tu comunidad. Un administrador lo verifica antes de publicarlo.",
      },
      {
        property: "og:title",
        content: "Reportar una novedad · AlertaVereda",
      },
      {
        property: "og:description",
        content:
          "Todo reporte queda pendiente de revisión hasta que un administrador lo verifique.",
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
