import { Link } from "@tanstack/react-router";
import type { ReactNode } from "react";
import { useAuth } from "@/hooks/use-auth";

const MODULOS = [
  { to: "/emergencias", label: "Emergencias" },
  { to: "/vias", label: "Vías" },
  { to: "/servicios", label: "Servicios" },
  { to: "/avisos", label: "Avisos" },
  { to: "/reportar", label: "Reportar" },
] as const;

export function BotonEmergencias() {
  return (
    <div className="fixed inset-x-0 bottom-0 z-50 border-t border-[color:var(--bosque-oscuro)] bg-[color:var(--urgente)] px-3 py-2 pb-[max(0.5rem,env(safe-area-inset-bottom))]">
      <a
        href="tel:123"
        className="mx-auto flex max-w-md items-center justify-center gap-2 rounded-md px-4 py-3 text-base font-semibold tracking-wide text-[color:var(--card)]"
      >
        <span aria-hidden>☎</span>
        Llamar a emergencias · 123
      </a>
    </div>
  );
}

export function AppShell({ children }: { children: ReactNode }) {
  const { usuario, esAdmin, salir } = useAuth();

  return (
    <div className="min-h-screen pb-24">
      <header className="bg-[color:var(--bosque)] text-[color:var(--card)]">
        <div className="mx-auto flex max-w-3xl items-center justify-between gap-3 px-4 py-3">
          <Link to="/" className="font-[family-name:var(--font-display)] text-xl font-bold">
            AlertaVereda
          </Link>
          <div className="flex items-center gap-3 text-sm">
            {esAdmin && (
              <Link to="/admin" className="underline underline-offset-4">
                Panel JAC
              </Link>
            )}
            {usuario ? (
              <button onClick={() => void salir()} className="underline underline-offset-4">
                Salir
              </button>
            ) : (
              <Link to="/auth" className="underline underline-offset-4">
                Entrar
              </Link>
            )}
          </div>
        </div>
        <nav className="mx-auto max-w-3xl overflow-x-auto px-2 pb-2">
          <ul className="flex gap-1 text-sm">
            {MODULOS.map((m) => (
              <li key={m.to}>
                <Link
                  to={m.to}
                  className="block whitespace-nowrap rounded-md px-3 py-1.5 text-[color:var(--card)]/85 transition-colors hover:bg-[color:var(--bosque-oscuro)]"
                  activeProps={{
                    className:
                      "block whitespace-nowrap rounded-md px-3 py-1.5 bg-[color:var(--kraft)] text-[color:var(--bosque-oscuro)] font-semibold",
                  }}
                >
                  {m.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </header>

      <main className="mx-auto max-w-3xl px-4 py-5">{children}</main>

      <p className="mx-auto max-w-3xl px-4 pb-6 text-center text-xs text-[color:var(--tinta-suave)]">
        Herramienta comunitaria — complementa, no reemplaza, a las autoridades.
      </p>

      <BotonEmergencias />
    </div>
  );
}
