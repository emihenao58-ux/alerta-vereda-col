import type { ReactNode } from "react";
import { AlertTriangle, Megaphone, Route, Siren, Waves } from "lucide-react";
import { COLOR_SEVERIDAD, LABEL_SEVERIDAD, type Severidad } from "@/lib/alerta";

export type CartaCategoria = "emergencia" | "via" | "servicio" | "aviso" | "otro";

const ICONO_CATEGORIA: Record<CartaCategoria, typeof AlertTriangle> = {
  emergencia: Siren,
  via: Route,
  servicio: Waves,
  aviso: Megaphone,
  otro: Megaphone,
};

const ETIQUETA_CATEGORIA: Record<CartaCategoria, string> = {
  emergencia: "Emergencia",
  via: "Vía",
  servicio: "Servicio",
  aviso: "Aviso",
  otro: "Aviso comunitario",
};

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
  meta?: string | undefined;
  children?: ReactNode;
  severidad?: Severidad | undefined;
  etiqueta?: string | undefined;
  acento?: string | undefined;
}) {
  return (
    <article
      className="carta chinche mt-4"
      style={acento ? { borderLeft: `4px solid ${acento}` } : undefined}
    >
      <div className="flex flex-wrap items-start justify-between gap-2">
        <h3 className="text-lg leading-tight font-semibold">{titulo}</h3>
        {severidad && (
          <span className="inline-flex items-center gap-1.5">
            <ChipSeveridad severidad={severidad} />
            {etiqueta &&
            etiqueta.trim() &&
            etiqueta.trim().toLowerCase() !== LABEL_SEVERIDAD[severidad].toLowerCase() ? (
              <span className="rounded-full border border-[color:var(--border)] px-2.5 py-0.5 text-xs font-medium text-[color:var(--tinta-suave)]">
                {etiqueta}
              </span>
            ) : null}
          </span>
        )}
      </div>
      {meta && <p className="mt-1 text-xs text-[color:var(--tinta-suave)]">{meta}</p>}
      {children && <div className="mt-2 text-sm text-[color:var(--tinta-suave)]">{children}</div>}
    </article>
  );
}

export function CartaCompacta({
  categoria,
  titulo,
  descripcion,
  fotoUrl,
  vereda,
  momento,
  severidad,
  etiqueta,
  acento,
}: {
  categoria: CartaCategoria;
  titulo: string;
  descripcion?: string | null;
  fotoUrl?: string | null;
  vereda?: string | null;
  momento?: string | null;
  severidad?: Severidad | undefined;
  etiqueta?: string | undefined;
  acento: string;
}) {
  const Icono = ICONO_CATEGORIA[categoria];

  return (
    <article className="carta-compacta" style={{ borderLeftColor: acento }}>
      <div className="carta-compacta-media" style={{ color: acento }}>
        {fotoUrl ? (
          <img src={fotoUrl} alt="" loading="lazy" decoding="async" />
        ) : (
          <Icono size={28} strokeWidth={1.9} aria-hidden="true" />
        )}
      </div>
      <div className="carta-compacta-body">
        <div className="carta-compacta-topline">
          <span className="carta-compacta-category">
            <Icono size={13} aria-hidden="true" />
            {ETIQUETA_CATEGORIA[categoria]}
          </span>
          {severidad && <ChipSeveridad severidad={severidad} texto={etiqueta} />}
        </div>
        <h3>{titulo}</h3>
        {descripcion && <p className="carta-compacta-description">{descripcion}</p>}
        <div className="carta-compacta-meta">
          {vereda && <span>{vereda}</span>}
          {vereda && momento && <span aria-hidden="true">·</span>}
          {momento && <span className="carta-compacta-time">{momento}</span>}
        </div>
      </div>
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
