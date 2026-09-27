import { useEffect, useState, type FormEvent } from "react";
import { Database, HardDrive, Loader2, RefreshCw, Save, Settings2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Vacio } from "@/components/carta";

const BYTE_FORMAT = new Intl.NumberFormat("es-CO");

type UsoEspacio = {
  storage_bytes: number;
  storage_limite_bytes: number | null;
  storage_porcentaje: number | null;
  bd_bytes: number;
  bd_limite_bytes: number | null;
  bd_porcentaje: number | null;
};

type ConfiguracionRpcClient = {
  rpc: (
    functionName: "obtener_uso_espacio" | "actualizar_limite_configuracion",
    args?: { p_clave?: string; p_valor_bytes?: number },
  ) => Promise<{
    data: unknown;
    error: { message: string; code?: string } | null;
  }>;
};

const rpcClient = supabase as unknown as ConfiguracionRpcClient;

function isNumber(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value);
}

function parseUsoEspacio(data: unknown): UsoEspacio {
  if (!data || typeof data !== "object")
    throw new Error("La respuesta del indicador no es válida.");
  const value = data as Record<string, unknown>;
  const required = ["storage_bytes", "bd_bytes"];
  if (!required.every((key) => isNumber(value[key]))) {
    throw new Error("La respuesta del indicador está incompleta.");
  }

  return {
    storage_bytes: value["storage_bytes"] as number,
    storage_limite_bytes: isNumber(value["storage_limite_bytes"])
      ? value["storage_limite_bytes"]
      : null,
    storage_porcentaje: isNumber(value["storage_porcentaje"]) ? value["storage_porcentaje"] : null,
    bd_bytes: value["bd_bytes"] as number,
    bd_limite_bytes: isNumber(value["bd_limite_bytes"]) ? value["bd_limite_bytes"] : null,
    bd_porcentaje: isNumber(value["bd_porcentaje"]) ? value["bd_porcentaje"] : null,
  };
}

function bytes(value: number | null) {
  return value === null ? "—" : `${BYTE_FORMAT.format(Math.round(value))} bytes`;
}

function porcentaje(value: number | null) {
  return value === null ? "sin límite configurado" : `${value.toFixed(1)}%`;
}

function BarraUso({ porcentaje: porcentajeUso }: { porcentaje: number | null }) {
  if (porcentajeUso === null) {
    return (
      <p className="text-sm text-[color:var(--admin-muted)]" role="status">
        sin límite configurado
      </p>
    );
  }

  const ancho = Math.min(Math.max(porcentajeUso, 0), 100);
  const sobreLimite = porcentajeUso > 100;

  return (
    <div className="space-y-1.5">
      <div
        className="h-3 overflow-hidden rounded-full bg-[color:var(--kraft-oscuro)]"
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={Math.min(Math.max(porcentajeUso, 0), 100)}
        aria-label={`Uso ${porcentajeUso.toFixed(1)} por ciento`}
      >
        <div
          className={`h-full rounded-full transition-[width] duration-200 ${sobreLimite ? "bg-[color:var(--urgente)]" : "bg-[color:var(--bosque)]"}`}
          style={{ width: `${ancho}%` }}
        />
      </div>
      <div className="flex items-center justify-between gap-2 text-xs text-[color:var(--admin-muted)]">
        <span>{sobreLimite ? "Sobre el límite" : "Uso actual"}</span>
        <strong
          className={
            sobreLimite ? "text-[color:var(--urgente)]" : "text-[color:var(--bosque-oscuro)]"
          }
        >
          {porcentaje(porcentajeUso)}
        </strong>
      </div>
    </div>
  );
}

function LimiteForm({
  clave,
  label,
  limite,
  onSaved,
}: {
  clave: "limite_storage_bytes" | "limite_bd_bytes";
  label: string;
  limite: number | null;
  onSaved: () => Promise<void>;
}) {
  const [valor, setValor] = useState(limite === null ? "" : String(limite));
  const [guardando, setGuardando] = useState(false);

  useEffect(() => {
    setValor(limite === null ? "" : String(limite));
  }, [limite]);

  const guardar = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const bytesIngresados = Number(valor);
    if (!Number.isSafeInteger(bytesIngresados) || bytesIngresados <= 0) {
      toast.error("Escribe un número entero positivo de bytes.");
      return;
    }

    setGuardando(true);
    try {
      const { error } = await rpcClient.rpc("actualizar_limite_configuracion", {
        p_clave: clave,
        p_valor_bytes: bytesIngresados,
      });
      if (error) throw error;
      await onSaved();
      toast.success(`${label} actualizado.`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "No pudimos actualizar el límite.");
    } finally {
      setGuardando(false);
    }
  };

  return (
    <form className="space-y-2" onSubmit={guardar}>
      <label className="block text-sm font-semibold" htmlFor={clave}>
        {label}
      </label>
      <div className="flex flex-col gap-2 sm:flex-row">
        <input
          id={clave}
          type="number"
          min="1"
          step="1"
          inputMode="numeric"
          value={valor}
          onChange={(event) => setValor(event.target.value)}
          className="min-w-0 flex-1 rounded-md border border-[color:var(--border)] bg-[color:var(--card)] px-3 py-2 text-sm"
          aria-describedby={`${clave}-help`}
          disabled={guardando}
        />
        <button type="submit" className="admin-primary-action" disabled={guardando}>
          {guardando ? (
            <Loader2 size={16} className="animate-spin" aria-hidden="true" />
          ) : (
            <Save size={16} aria-hidden="true" />
          )}
          {guardando ? "Guardando…" : "Guardar"}
        </button>
      </div>
      <p id={`${clave}-help`} className="text-xs text-[color:var(--admin-muted)]">
        Valor actual: {bytes(limite)}
      </p>
    </form>
  );
}

export function ConfiguracionSistema() {
  const [uso, setUso] = useState<UsoEspacio | null>(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const cargarUso = async () => {
    setCargando(true);
    setError(null);
    try {
      const { data, error: rpcError } = await rpcClient.rpc("obtener_uso_espacio");
      if (rpcError) throw rpcError;
      setUso(parseUsoEspacio(data));
    } catch (caught) {
      setUso(null);
      setError(caught instanceof Error ? caught.message : "No pudimos cargar el uso del espacio.");
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    void cargarUso();
  }, []);

  if (cargando && !uso) {
    return <Vacio texto="Cargando el uso del espacio…" />;
  }

  return (
    <div className="space-y-4">
      <section className="admin-section-intro">
        <div>
          <p className="admin-section-kicker">Configuración del sistema</p>
          <h2>Capacidad del proyecto</h2>
          <p>Consulta el uso actual y actualiza los límites que verá el superadmin.</p>
        </div>
        <button
          type="button"
          className="admin-secondary-action"
          onClick={() => void cargarUso()}
          disabled={cargando}
        >
          <RefreshCw
            size={16}
            className={cargando ? "animate-spin" : undefined}
            aria-hidden="true"
          />
          Actualizar
        </button>
      </section>

      {error && (
        <div className="admin-access-card" role="alert">
          <strong>No pudimos cargar el indicador.</strong>
          <p className="mt-1 text-sm">{error}</p>
        </div>
      )}

      {uso && (
        <section className="grid gap-3 md:grid-cols-2" aria-label="Uso de espacio">
          <article className="admin-panel-card space-y-3">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="admin-section-kicker">Storage</p>
                <h3 className="mt-1 text-xl">Fotos y archivos</h3>
              </div>
              <span className="rounded-full bg-[color:var(--kraft-oscuro)] p-2 text-[color:var(--bosque-oscuro)]">
                <HardDrive size={19} aria-hidden="true" />
              </span>
            </div>
            <p className="text-2xl font-semibold">{bytes(uso.storage_bytes)}</p>
            <BarraUso porcentaje={uso.storage_porcentaje} />
            <p className="text-xs text-[color:var(--admin-muted)]">
              Límite: {bytes(uso.storage_limite_bytes)}
            </p>
          </article>

          <article className="admin-panel-card space-y-3">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="admin-section-kicker">Base de datos</p>
                <h3 className="mt-1 text-xl">Tamaño total</h3>
              </div>
              <span className="rounded-full bg-[color:var(--kraft-oscuro)] p-2 text-[color:var(--bosque-oscuro)]">
                <Database size={19} aria-hidden="true" />
              </span>
            </div>
            <p className="text-2xl font-semibold">{bytes(uso.bd_bytes)}</p>
            <BarraUso porcentaje={uso.bd_porcentaje} />
            <p className="text-xs text-[color:var(--admin-muted)]">
              Límite: {bytes(uso.bd_limite_bytes)}
            </p>
            <p className="text-xs leading-relaxed text-[color:var(--admin-muted)]">
              Tamaño total de la base de datos del proyecto, no solo los datos de AlertaVereda.
            </p>
          </article>
        </section>
      )}

      <section className="admin-panel-card space-y-5">
        <div className="flex items-start gap-3">
          <span className="rounded-full bg-[color:var(--kraft-oscuro)] p-2 text-[color:var(--bosque-oscuro)]">
            <Settings2 size={19} aria-hidden="true" />
          </span>
          <div>
            <p className="admin-section-kicker">Límites editables</p>
            <h3 className="mt-1 text-xl">Configurar capacidad</h3>
            <p className="mt-1 text-sm text-[color:var(--admin-muted)]">
              Los cambios se guardan mediante la función protegida del sistema.
            </p>
          </div>
        </div>
        <div className="grid gap-5 md:grid-cols-2">
          <LimiteForm
            clave="limite_storage_bytes"
            label="Límite de Storage en bytes"
            limite={uso?.storage_limite_bytes ?? null}
            onSaved={cargarUso}
          />
          <LimiteForm
            clave="limite_bd_bytes"
            label="Límite de base de datos en bytes"
            limite={uso?.bd_limite_bytes ?? null}
            onSaved={cargarUso}
          />
        </div>
      </section>
    </div>
  );
}
