import type { ReactNode } from "react";
import { AdminGate, AdminShell } from "@/components/admin/admin-shell";
import { AppShell } from "@/components/app-shell";
import type { ContextoAdminReportes } from "@/lib/reportes-contexto-admin";

export function ReportesSurface({
  contexto,
  wide = false,
  children,
}: {
  contexto?: ContextoAdminReportes | undefined;
  wide?: boolean;
  children: ReactNode;
}) {
  if (contexto) {
    return (
      <AdminGate access="superadmin">
        <AdminShell area="gestion" compactHeader>
          {children}
        </AdminShell>
      </AdminGate>
    );
  }

  return <AppShell wide={wide}>{children}</AppShell>;
}
