import { ShieldCheck, UsersRound } from "lucide-react";
import "./etiqueta-procedencia-aviso.css";

export type ProcedenciaAvisoPublica = "oficial" | "habitantes";

export function EtiquetaProcedenciaAviso({
  procedencia,
}: {
  procedencia: ProcedenciaAvisoPublica | null | undefined;
}) {
  if (!procedencia) return null;

  const oficial = procedencia === "oficial";
  return (
    <span className={`avisos-origin-chip avisos-origin-chip-${procedencia}`}>
      {oficial ? (
        <ShieldCheck size={14} aria-hidden="true" />
      ) : (
        <UsersRound size={14} aria-hidden="true" />
      )}
      {oficial ? "Oficial" : "Compartido por habitantes"}
    </span>
  );
}
