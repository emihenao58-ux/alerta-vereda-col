import type { ReactNode } from "react";
import { COLOR_SEVERIDAD, LABEL_SEVERIDAD, type Severidad } from "@/lib/alerta";

export function ChipSeveridad({
  severidad,
  texto,
}: {
  severidad: Severidad;
  texto?: string | undefined;
}) {
  return (
    <span
      className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold text-[color:var(--card)]"
      style={{ backgroundColor: COLOR_SEVERIDAD[severidad] }}
    >
      {texto ?? LABEL_SEVERIDAD[severidad]}
    </span>
  );
}

export function Carta({
  titulo,
  meta,
  children,
  severidad,
  etiqueta,
  acento,
}: {
  titulo: string;
  meta?: string;
  children?: ReactNode;
  severidad?: Severidad;
  etiqueta?: string;
  acento?: string;
}) {
  return (
    <article className="carta chinche mt-4" style={acento ? { borderLeft: `4px solid ${acento}` } : undefined}>
      <div className="flex flex-wrap items-start justify-between gap-2">
        <h3 className="text-lg leading-tight font-semibold">{titulo}</h3>
        {severidad && <ChipSeveridad severidad={severidad} texto={etiqueta} />}
      </div>
      {meta && <p className="mt-1 text-xs text-[color:var(--tinta-suave)]">{meta}</p>}
      {children && <div className="mt-2 text-sm text-[color:var(--tinta-suave)]">{children}</div>}
    </article>
  );
}

export function Vacio({ texto }: { texto: string }) {
  return (
    <p className="mt-6 rounded-md bg-[color:var(--kraft-oscuro)] p-4 text-center text-sm text-[color:var(--tinta-suave)]">
      {texto}
    </p>
  );
}

export function TituloModulo({ titulo, bajada }: { titulo: string; bajada: string }) {
  return (
    <div>
      <h1 className="text-2xl font-bold">{titulo}</h1>
      <p className="mt-1 text-sm text-[color:var(--tinta-suave)]">{bajada}</p>
    </div>
  );
}
