const ROOT = "/images/reportar/illustrations";

/**
 * Recursos visuales del PR #20. Los identificadores pertenecen al catálogo
 * existente; esta tabla solo cambia la representación visual, no el flujo.
 */
export const REPORTAR_ILLUSTRATIONS: Readonly<Record<string, string>> = {
  agua: `${ROOT}/servicios/agua.webp`,
  energia: `${ROOT}/servicios/electricidad.webp`,
  senal: `${ROOT}/servicios/senal.webp`,
  recoleccion_basura: `${ROOT}/servicios/recoleccion.webp`,
  gas: `${ROOT}/servicios/gas.webp`,
  otro_servicio: `${ROOT}/servicios/otro.webp`,

  no_hay_agua: `${ROOT}/servicios/agua-no-hay.webp`,
  fuga_tuberia: `${ROOT}/servicios/agua-fuga.webp`,
  agua_sucia: `${ROOT}/servicios/agua-sucia.webp`,
  poca_agua: `${ROOT}/servicios/agua-poca.webp`,
  alcantarilla_tapada: `${ROOT}/servicios/agua-alcantarilla.webp`,
  aguas_residuales: `${ROOT}/servicios/agua-residuales.webp`,
  otro_problema_agua: `${ROOT}/servicios/agua-otro.webp`,

  no_hay_luz: `${ROOT}/servicios/luz-no-hay.webp`,
  luz_parpadea: `${ROOT}/servicios/luz-parpadea.webp`,
  cable_caido: `${ROOT}/servicios/luz-cable.webp`,
  poste_cable_danado: `${ROOT}/servicios/luz-poste.webp`,
  chispas_riesgo_electrico: `${ROOT}/servicios/luz-chispas.webp`,
  otro_problema_energia: `${ROOT}/servicios/luz-otro.webp`,

  no_hay_senal: `${ROOT}/servicios/senal-no-hay.webp`,
  senal_debil: `${ROOT}/servicios/senal-debil.webp`,
  internet_no_funciona: `${ROOT}/servicios/senal-internet.webp`,
  no_se_pueden_hacer_llamadas: `${ROOT}/servicios/senal-llamadas.webp`,
  otro_problema_senal: `${ROOT}/servicios/senal-otro.webp`,

  fuga_gas: `${ROOT}/servicios/gas-fuga.webp`,
  no_hay_suministro_gas: `${ROOT}/servicios/gas-sin-suministro.webp`,

  no_paso_camion_recolector: `${ROOT}/servicios/basura-camion.webp`,
  retraso_recoleccion: `${ROOT}/servicios/basura-retraso.webp`,
  basura_acumulada: `${ROOT}/servicios/basura-acumulada.webp`,
  punto_recoleccion_sin_atender: `${ROOT}/servicios/basura-punto.webp`,
  otro_problema_recoleccion: `${ROOT}/servicios/basura-otro.webp`,

  accidente: `${ROOT}/emergencias/accidente.webp`,
  incendio: `${ROOT}/emergencias/incendio.webp`,
  deslizamiento: `${ROOT}/emergencias/deslizamiento.webp`,
  inundacion: `${ROOT}/emergencias/inundacion.webp`,
  atencion_medica: `${ROOT}/emergencias/medica.webp`,
  fauna_peligrosa: `${ROOT}/emergencias/fauna.webp`,
  otra_emergencia: `${ROOT}/emergencias/otra.webp`,

  derrumbe_via: `${ROOT}/vias/derrumbe.webp`,
  puente: `${ROOT}/vias/puente.webp`,
  paso_restringido: `${ROOT}/vias/restringido.webp`,
  animales_sueltos_via: `${ROOT}/vias/animales-sueltos.webp`,
  animales_muertos_via: `${ROOT}/vias/animales-muertos.webp`,
  otro_problema_vial: `${ROOT}/vias/otro.webp`,

  aviso_comunitario_grupo: `${ROOT}/avisos/comunitario.webp`,
  alerta_seguridad: `${ROOT}/avisos/seguridad.webp`,
  reunion: `${ROOT}/avisos/reunion.webp`,
  aviso_comunitario: `${ROOT}/avisos/aviso.webp`,
  otro_aviso: `${ROOT}/avisos/otro-aviso.webp`,
  persona_desaparecida: `${ROOT}/avisos/desaparecida.webp`,
  robo: `${ROOT}/avisos/robo.webp`,
  intento_robo: `${ROOT}/avisos/intento-robo.webp`,
  otro_seguridad: `${ROOT}/avisos/otro-seguridad.webp`,
};

export function ilustracionDe(id: string) {
  return REPORTAR_ILLUSTRATIONS[id] ?? null;
}
