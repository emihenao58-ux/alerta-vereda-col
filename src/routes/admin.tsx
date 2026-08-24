import { createFileRoute, Outlet } from "@tanstack/react-router";

export const Route = createFileRoute("/admin")({
  head: () => ({
    meta: [
      { title: "Administración · AlertaVereda Ebéjico" },
      {
        name: "description",
        content: "Espacios administrativos protegidos de AlertaVereda.",
      },
    ],
  }),
  component: AdminLayout,
});

function AdminLayout() {
  return <Outlet />;
}
