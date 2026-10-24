import { createFileRoute } from "@tanstack/react-router";
import { AdminReportarFlow } from "@/components/admin/admin-reportar-flow";

export const Route = createFileRoute("/admin/gestion/reportar")({
  component: RouteComponent,
});

function RouteComponent() {
  return <AdminReportarFlow />;
}
